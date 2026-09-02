import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';

const KINDS = ['subreddit', 'reddit_query', 'threads_query', 'linkedin_query', 'x_community'] as const;
type Kind = (typeof KINDS)[number];

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { brand } = await parent();

  const { data: sources } = await locals.supabase
    .from('brand_sources')
    .select('id, kind, value, active, created_at')
    .eq('brand_id', brand.id)
    .order('kind')
    .order('value');

  return { sources: sources ?? [] };
};

/** L'id da solo non autorizza niente: si tocca solo ciò che appartiene al brand di chi chiede. */
async function owned(locals: App.Locals, id: string) {
  const { data } = await locals.supabase.from('brand_sources').select('id').eq('id', id).maybeSingle();
  return Boolean(data);
}

export const actions: Actions = {
  add: async ({ request, locals, params }) => {
    // Le azioni non hanno `parent()`: il brand si rilegge DALLO SLUG, non "il primo". Con più
    // brand, un `.limit(1)` avrebbe scritto la sorgente in quello sbagliato.
    const { data: brand } = await locals.supabase
      .from('brands')
      .select('id')
      .eq('slug', params.slug)
      .maybeSingle();
    if (!brand) return fail(404, { error: 'brand non trovato' });

    const form = await request.formData();
    const kind = String(form.get('kind') ?? '') as Kind;
    const value = String(form.get('value') ?? '').trim().replace(/^r\//, '');

    if (!KINDS.includes(kind)) return fail(400, { error: 'Tipo di sorgente sconosciuto.' });
    if (!value) return fail(400, { error: 'Serve un valore: un subreddit o delle parole chiave.' });

    const { error } = await adminClient()
      .from('brand_sources')
      .upsert({ brand_id: brand.id, kind, value }, { onConflict: 'brand_id,kind,value', ignoreDuplicates: true });
    if (error) return fail(500, { error: error.message });

    return { ok: true };
  },

  toggle: async ({ request, locals }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    if (!(await owned(locals, id))) return fail(404, { error: 'sorgente non trovata' });

    const { error } = await adminClient()
      .from('brand_sources')
      .update({ active: form.get('active') === 'true' })
      .eq('id', id);
    if (error) return fail(500, { error: error.message });

    return { ok: true };
  },

  remove: async ({ request, locals }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    if (!(await owned(locals, id))) return fail(404, { error: 'sorgente non trovata' });

    const { error } = await adminClient().from('brand_sources').delete().eq('id', id);
    if (error) return fail(500, { error: error.message });

    return { ok: true };
  }
};

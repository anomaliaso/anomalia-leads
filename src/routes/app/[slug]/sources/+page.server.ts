import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { planFor } from '$lib/plans';
import { suggestSources } from '$lib/server/seed';

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
  /**
   * Chiedi al modello altre sorgenti.
   *
   * Non scrive niente: torna delle proposte, e l'utente le aggiunge una per una dall'azione `add`,
   * che è dove vivono i controlli di piano. Scriverle da qui vorrebbe dire avere due porte per la
   * stessa tabella, e una sola delle due che fa rispettare il listino.
   */
  suggest: async ({ locals, params }) => {
    const { data: brand } = await locals.supabase
      .from('brands')
      .select('id, about, plan')
      .eq('slug', params.slug)
      .maybeSingle();
    if (!brand) return fail(404, { error: 'brand not found' });

    const about = String(brand.about ?? '').trim();
    if (!about) {
      return fail(400, { error: 'We need to know what you sell first: add a description to the brand.' });
    }

    const { data: existing } = await locals.supabase
      .from('brand_sources')
      .select('kind, value')
      .eq('brand_id', brand.id);

    // Proporne più di quante ce ne stanno significherebbe far scegliere all'utente delle sorgenti
    // che l'azione `add` poi rifiuta una per una.
    const plan = planFor(brand.plan as string);
    const room = plan.sources === null ? Infinity : plan.sources - (existing?.length ?? 0);
    if (room <= 0) {
      return fail(403, { error: `The ${plan.name} plan covers ${plan.sources} sources. Remove one to make room.` });
    }

    const proposed = await suggestSources(about, existing ?? []);
    if (!proposed) return fail(502, { error: 'The model did not answer. Try again in a moment.' });
    if (!proposed.length) {
      return { suggestions: [], note: 'Nothing worth adding beyond what you already watch.' };
    }

    return { suggestions: proposed.slice(0, room), note: null };
  },

  add: async ({ request, locals, params }) => {
    // Le azioni non hanno `parent()`: il brand si rilegge DALLO SLUG, non "il primo". Con più
    // brand, un `.limit(1)` avrebbe scritto la sorgente in quello sbagliato.
    const { data: brand } = await locals.supabase
      .from('brands')
      .select('id, plan')
      .eq('slug', params.slug)
      .maybeSingle();
    if (!brand) return fail(404, { error: 'brand not found' });

    const form = await request.formData();
    const kind = String(form.get('kind') ?? '') as Kind;
    const value = String(form.get('value') ?? '').trim().replace(/^r\//, '');

    if (!KINDS.includes(kind)) return fail(400, { error: 'Unknown source kind.' });
    if (!value) return fail(400, { error: 'A value is required: a subreddit or some keywords.' });

    // I due limiti che il listino promette — quante sorgenti e quali piattaforme — si applicano
    // qui, sull'unica porta da cui una sorgente entra. Prometterli sulla landing e non applicarli
    // è il modo più rapido di vendere una cosa che non esiste.
    const plan = planFor(brand.plan as string);
    if (!plan.platforms.includes(kind)) {
      return fail(403, { error: `The ${plan.name} plan does not cover this kind of source.` });
    }

    const { count } = await locals.supabase
      .from('brand_sources')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brand.id);
    if (plan.sources !== null && (count ?? 0) >= plan.sources) {
      return fail(403, { error: `The ${plan.name} plan covers ${plan.sources} sources.` });
    }

    const { error } = await adminClient()
      .from('brand_sources')
      .upsert({ brand_id: brand.id, kind, value }, { onConflict: 'brand_id,kind,value', ignoreDuplicates: true });
    if (error) return fail(500, { error: error.message });

    return { ok: true };
  },

  toggle: async ({ request, locals }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    if (!(await owned(locals, id))) return fail(404, { error: 'source not found' });

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
    if (!(await owned(locals, id))) return fail(404, { error: 'source not found' });

    const { error } = await adminClient().from('brand_sources').delete().eq('id', id);
    if (error) return fail(500, { error: error.message });

    return { ok: true };
  }
};

import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { generateApiKey } from '$lib/server/apikey';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { brand } = await parent();

  // Solo il prefisso: l'hash non serve al browser e non c'è motivo di fargli attraversare la rete.
  const { data } = await locals.supabase.from('brands').select('api_key_prefix').eq('id', brand.id).maybeSingle();

  return { prefix: data?.api_key_prefix ?? null };
};

export const actions: Actions = {
  generate: async ({ locals, params }) => {
    // Come in `sources`: il brand si rilegge dallo slug, non è "il primo" di chi è loggato.
    const { data: brand } = await locals.supabase.from('brands').select('id').eq('slug', params.slug).maybeSingle();
    if (!brand) return fail(404, { error: 'brand not found' });

    const { key, hash, prefix } = generateApiKey();
    const { error } = await adminClient()
      .from('brands')
      .update({ api_key_hash: hash, api_key_prefix: prefix })
      .eq('id', brand.id);
    if (error) return fail(500, { error: error.message });

    // La chiave in chiaro esiste solo in questa risposta: non viene mai salvata né riletta.
    return { ok: true, key, prefix };
  }
};

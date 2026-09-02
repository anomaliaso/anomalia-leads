import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

/**
 * Il brand di QUESTA schermata, risolto dallo slug.
 *
 * La lettura passa dal client dell'utente, quindi è RLS a decidere: uno slug che esiste ma non ti
 * appartiene non è un 403 informativo, è semplicemente non trovato.
 */
export const load: LayoutServerLoad = async ({ locals, params }) => {
  const { data: brand } = await locals.supabase
    .from('brands')
    .select('id, slug, name, about, site_url, plan')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!brand) error(404, 'brand not found');

  return { brand };
};

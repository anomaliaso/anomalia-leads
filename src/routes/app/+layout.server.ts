import type { LayoutServerLoad } from './$types';

/**
 * L'elenco dei brand, non uno solo: il selettore in testa ne ha bisogno tutti, e il brand corrente
 * lo risolve `[slug]` più sotto. Qui NON si reindirizza — chi non ha ancora brand deve poter
 * arrivare a `/app/nuovo`.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  const { data: brands } = await locals.supabase
    .from('brands')
    .select('id, slug, name')
    .order('created_at');

  return { brands: brands ?? [], email: locals.user?.email ?? '' };
};

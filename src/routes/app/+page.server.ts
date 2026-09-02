import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

/** `/app` non è una schermata: porta al primo brand, o a crearne uno. */
export const load: PageServerLoad = async ({ parent }) => {
  const { brands } = await parent();
  redirect(303, brands.length ? `/app/${brands[0].slug}` : '/app/nuovo');
};

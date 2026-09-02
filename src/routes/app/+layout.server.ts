import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

/** Il brand si carica una volta sola: ogni schermata dell'app ne ha bisogno. */
export const load: LayoutServerLoad = async ({ locals }) => {
  const { data: brand } = await locals.supabase
    .from('brands')
    .select('id, name, plan')
    .limit(1)
    .maybeSingle();
  if (!brand) redirect(303, '/onboarding');

  return { brand, email: locals.user?.email ?? '' };
};

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

/**
 * L'onboarding è diventato "crea un brand", e vive dentro l'app perché dal secondo in poi si fa
 * da lì. La rotta resta solo per non rompere i link già in giro.
 */
export const load: PageServerLoad = async () => redirect(308, '/app/new');

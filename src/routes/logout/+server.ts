import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals }) => {
  await locals.supabase.auth.signOut();
  redirect(303, '/');
};

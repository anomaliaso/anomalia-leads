import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

/**
 * Ci si arriva dal link nell'email, che è già passato da `/auth/callback`: a questo punto la
 * sessione esiste. Senza, non c'è niente da reimpostare — e permetterlo sarebbe permettere a
 * chiunque di cambiare la password di chiunque.
 */
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(303, '/forgot-password');
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const form = await request.formData();
    const password = String(form.get('password') ?? '');
    const confirm = String(form.get('confirm') ?? '');

    if (password.length < 8) return fail(400, { error: 'The password needs at least 8 characters.' });
    if (password !== confirm) return fail(400, { error: 'The two passwords do not match.' });

    const { error } = await locals.supabase.auth.updateUser({ password });
    if (error) return fail(400, { error: error.message });

    redirect(303, '/app');
  }
};

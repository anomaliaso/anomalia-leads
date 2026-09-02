import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) redirect(303, url.searchParams.get('next') ?? '/app');
  return {};
};

function credentials(form: FormData) {
  return {
    email: String(form.get('email') ?? '').trim(),
    password: String(form.get('password') ?? '')
  };
}

export const actions: Actions = {
  login: async ({ request, locals, url }) => {
    const { email, password } = credentials(await request.formData());
    const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
    if (error) return fail(400, { error: error.message, email });
    redirect(303, url.searchParams.get('next') ?? '/app');
  },

  signup: async ({ request, locals }) => {
    const { email, password } = credentials(await request.formData());
    if (password.length < 8) return fail(400, { error: 'The password needs at least 8 characters.', email });

    const { error } = await locals.supabase.auth.signUp({ email, password });
    if (error) return fail(400, { error: error.message, email });

    // Con la conferma via email attiva non c'è ancora sessione: l'onboarding la ritroverà o
    // rimanderà qui. Non fingiamo che sia entrato.
    redirect(303, '/onboarding');
  }
};

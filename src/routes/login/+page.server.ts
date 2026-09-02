import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) redirect(303, url.searchParams.get('next') ?? '/app');
  return { error: url.searchParams.get('error') };
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
    redirect(303, '/app/new');
  },

  github: async ({ locals, url }) => {
    const next = url.searchParams.get('next') ?? '/app';
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}` }
    });
    if (error || !data?.url) return fail(400, { error: error?.message ?? 'GitHub sign-in is unavailable.' });

    // Il provider risponde con l'indirizzo a cui mandare l'utente: è un redirect, non una fetch.
    redirect(303, data.url);
  }
};

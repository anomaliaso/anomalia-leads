import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const email = String((await request.formData()).get('email') ?? '').trim();
    if (!email) return fail(400, { error: 'Enter the email you signed up with.' });

    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${url.origin}/auth/callback?next=/reset-password`
    });

    // L'errore NON si mostra: dire "questa email non esiste" trasforma la pagina in uno strumento
    // per scoprire chi è iscritto. Si logga e si risponde uguale in entrambi i casi.
    if (error) console.warn('[auth] reset password:', error.message.slice(0, 160));

    return { sent: true };
  }
};

import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { supabaseForRequest } from '$lib/server/supabase';

const PROTECTED = ['/app', '/onboarding'];

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = supabaseForRequest(event);

  // `getUser()` e non `getSession()`: la sessione dal cookie non è verificata, l'utente sì.
  const { data } = await event.locals.supabase.auth.getUser();
  event.locals.user = data.user ?? null;

  if (!event.locals.user && PROTECTED.some((p) => event.url.pathname.startsWith(p))) {
    redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
  }

  return resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
  });
};

import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

/**
 * Dove torna chi ha fatto login con un provider esterno, e dove atterra chi clicca il link di
 * recupero password.
 *
 * Il `next` arriva dall'URL, quindi è dato dell'utente: si accetta solo un percorso interno.
 * Senza quel controllo, un link costruito ad arte manderebbe qualcuno appena autenticato su un
 * dominio altrui — con la sessione già in tasca.
 */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/app';
  return raw;
}

export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));

  if (!code) redirect(303, '/login?error=missing_code');

  const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
  if (error) redirect(303, `/login?error=${encodeURIComponent(error.message)}`);

  redirect(303, next);
};

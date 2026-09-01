import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Due client, e la differenza conta.
 *
 * Quello di richiesta porta la sessione dell'utente e obbedisce a RLS: è quello che il browser usa
 * per leggere i propri lead. Quello admin salta RLS ed è l'unico che scrive — lo scan, le bozze,
 * le soppressioni. Il browser non produce lead, li marca soltanto.
 */

/** Una variabile mancante è un guasto di configurazione, non un `undefined` che viaggia. */
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} non configurata`);
  return value;
}

const url = () => required('PUBLIC_SUPABASE_URL', publicEnv.PUBLIC_SUPABASE_URL);

export function supabaseForRequest(event: RequestEvent): SupabaseClient {
  const cookies: CookieMethodsServer = {
    getAll: () => event.cookies.getAll(),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        event.cookies.set(name, value, { ...options, path: '/' });
      }
    }
  };

  return createServerClient(url(), required('PUBLIC_SUPABASE_ANON_KEY', publicEnv.PUBLIC_SUPABASE_ANON_KEY), {
    cookies
  });
}

export function adminClient(): SupabaseClient {
  return createClient(url(), required('SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

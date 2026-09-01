import { env } from '$env/dynamic/private';

const BASE = 'https://api.scrapecreators.com';
const TIMEOUT_MS = 60_000;

/**
 * Il gateway che `leads-core/feed` riceve iniettato.
 *
 * La forma dell'errore fa parte del contratto: `isNoMatch404` riconosce il "nessun risultato" di
 * LinkedIn dal corpo, e distinguerlo da un guasto vero è ciò che evita di registrare una chiave
 * scaduta come "0 conversazioni oggi".
 */
export async function scrapeCreatorsGet(path: string): Promise<Record<string, unknown> | null> {
  const key = env.SCRAPECREATORS_API_KEY;
  if (!key) throw new Error('scrapecreators 401: {"error":"no api key configured"}');

  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-api-key': key },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) {
    throw new Error(`scrapecreators ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

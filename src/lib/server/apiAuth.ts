import { error } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { hashApiKey } from '$lib/server/apikey';

const BRAND_COLUMNS = 'id, owner_id, slug, name, about, site_url, plan, webhook_url, webhook_secret';

/**
 * Autentica un brand da `Authorization: Bearer alk_...`. Passa sempre dal service role: una API
 * key non è una sessione utente, quindi non c'è un client RLS a cui appoggiarsi.
 */
export async function brandFromRequest(request: Request) {
  const header = request.headers.get('authorization') ?? '';
  const key = header.match(/^Bearer\s+(alk_\S+)$/i)?.[1];
  if (!key) error(401, 'missing or malformed Authorization header');

  const { data: brand } = await adminClient()
    .from('brands')
    .select(BRAND_COLUMNS)
    .eq('api_key_hash', hashApiKey(key))
    .maybeSingle();
  if (!brand) error(401, 'invalid API key');

  return brand;
}

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { brandFromRequest } from '$lib/server/apiAuth';
import { scanBrand, type Brand } from '$lib/server/scan';

export const config = { maxDuration: 300 };

/**
 * POST /api/v1/scan — fa scattare subito il giro sorgenti → conversazioni → giudizio → bozze per
 * questo brand, invece di aspettare il cron notturno. Stessa pipeline di `/api/scan`, altra
 * autorizzazione: qui la chiave di per sé identifica il brand, non serve leggerlo per slug.
 */
export const POST: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  const result = await scanBrand(adminClient(), brand as Brand);
  return json({ ok: true, ...result });
};

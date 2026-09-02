import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { brandFromRequest } from '$lib/server/apiAuth';
import { clearWebhook, setWebhook } from '$lib/server/webhook';

/**
 * Il segreto torna per intero a ogni lettura, non solo alla creazione: a differenza della API key,
 * chi la conosce può già leggere tutto quello che il webhook segnalerebbe, quindi non c'è un
 * privilegio in più da proteggere nascondendola dopo il primo giro.
 */
export const GET: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  return json({ url: brand.webhook_url ?? null, secret: brand.webhook_secret ?? null });
};

/** PUT /api/v1/webhook  { "url": "https://..." } */
export const PUT: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  const body = await request.json().catch(() => ({}));

  try {
    const result = await setWebhook(adminClient(), brand.id, String(body?.url ?? ''), brand.webhook_secret);
    return json(result);
  } catch (err) {
    error(400, (err as Error).message);
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  await clearWebhook(adminClient(), brand.id);
  return json({ ok: true });
};

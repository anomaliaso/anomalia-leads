import { createHmac, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export function generateWebhookSecret(): string {
  return 'whsec_' + randomBytes(24).toString('base64url');
}

/** Condiviso fra `PUT /api/v1/webhook` e il tool MCP `set_webhook`. */
export async function setWebhook(admin: SupabaseClient, brandId: string, url: string, existingSecret: string | null | undefined) {
  try {
    new URL(url);
  } catch {
    throw new Error('url must be a valid URL');
  }

  const secret = existingSecret ?? generateWebhookSecret();
  const { error } = await admin.from('brands').update({ webhook_url: url, webhook_secret: secret }).eq('id', brandId);
  if (error) throw new Error(error.message);

  return { url, secret };
}

export async function clearWebhook(admin: SupabaseClient, brandId: string) {
  const { error } = await admin.from('brands').update({ webhook_url: null, webhook_secret: null }).eq('id', brandId);
  if (error) throw new Error(error.message);
}

/**
 * Consegna best-effort: un webhook giù non deve far fallire lo scan che l'ha generato, e
 * l'agente ha comunque `get_queue`/`GET /api/v1/queue` come ripiego se il ping si perde.
 */
export async function notifyWebhook(url: string, secret: string, payload: Record<string, unknown>): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', secret).update(body).digest('hex');

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-anomalia-signature': `sha256=${signature}` },
      body,
      signal: AbortSignal.timeout(10_000)
    });
  } catch (err) {
    console.warn('[webhook] consegna fallita:', err instanceof Error ? err.message : String(err));
  }
}

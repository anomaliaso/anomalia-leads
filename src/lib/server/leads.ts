import type { SupabaseClient } from '@supabase/supabase-js';
import { platformOf, suppressAuthor } from '@anomalia/leads-core/contact';

/** Condiviso fra l'azione della dashboard, `PATCH /api/v1/leads/:id` e il tool MCP: tre autorizzazioni, una sola scrittura. */

/** L'id da solo non autorizza niente: deve appartenere al brand di chi chiede. */
export async function findLeadForBrand(admin: SupabaseClient, brandId: string, id: string) {
  const { data } = await admin
    .from('brand_news_items')
    .select('id, url, author_handle, author_platform, dm_target')
    .eq('id', id)
    .eq('brand_id', brandId)
    .maybeSingle();
  return data;
}

export async function markLeadDone(admin: SupabaseClient, id: string) {
  return admin.from('brand_news_items').update({ status: 'done', done_at: new Date().toISOString() }).eq('id', id);
}

export async function markLeadIgnored(
  admin: SupabaseClient,
  lead: { id: string; url: string; author_handle: string | null; author_platform: string | null; dm_target: string | null }
) {
  const handle = lead.author_handle ?? lead.dm_target;
  // Ignorare è un segnale sulla PERSONA, non solo su questo thread: non riproporla mai più.
  if (handle) {
    await suppressAuthor(admin, {
      platform: lead.author_platform ?? platformOf(lead.url ?? ''),
      handle: String(handle),
      source: 'manual',
      reason: 'ignored by the owner in the queue'
    });
  }
  return admin.from('brand_news_items').update({ status: 'dismissed' }).eq('id', lead.id);
}

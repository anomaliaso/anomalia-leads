import type { SupabaseClient } from '@supabase/supabase-js';
import { platformOf, suppressAuthor } from '@anomalia/leads-core/contact';

/** Condiviso fra l'azione della dashboard e `PATCH /api/v1/leads/:id`: due autorizzazioni, una sola scrittura. */

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

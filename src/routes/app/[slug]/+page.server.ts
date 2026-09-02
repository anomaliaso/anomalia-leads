import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { INTENT_RANK, normalizeIntent } from '@anomalia/leads-core/intent';
import { platformOf, suppressAuthor } from '@anomalia/leads-core/contact';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { brand } = await parent();

  const { data: leads } = await locals.supabase
    .from('brand_news_items')
    .select('id, url, title, source_name, relevance, intent, suggestion, dm_draft, dm_target, created_at')
    .eq('brand_id', brand.id)
    .eq('status', 'suggested')
    .order('created_at', { ascending: false })
    .limit(50);

  // Chi compra adesso sta in cima. A parità, il più recente.
  const queue = (leads ?? []).sort(
    (a, b) =>
      INTENT_RANK[normalizeIntent(b.intent)] - INTENT_RANK[normalizeIntent(a.intent)] ||
      Date.parse(b.created_at) - Date.parse(a.created_at)
  );

  // L'ultima scansione serve a NON mentire quando la coda è vuota: "oggi non c'era niente" e
  // "ogni sorgente ha fallito" si somigliano soltanto.
  const { data: scan } = await locals.supabase
    .from('radar_searches')
    .select('sources_failed, last_error, items_found, created_at, sources')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const total = Array.isArray(scan?.sources) ? scan.sources.length : 0;
  // Non "tutte fallite": `leads-core` inghiotte l'errore dei subreddit perché ha un ripiego RSS,
  // quindi da qui se ne vedono solo alcune. Il segnale onesto è un altro — se il giro non ha
  // portato NIENTE e almeno una sorgente ha dato errore, quel vuoto non è silenzio.
  const broken = Boolean(scan && scan.sources_failed > 0 && scan.items_found === 0);

  return {
    leads: queue,
    scan: scan
      ? { broken, failed: scan.sources_failed, total, error: scan.last_error, at: scan.created_at }
      : null
  };
};

/** Legge il lead solo se è del brand di chi chiede: l'id da solo non autorizza niente. */
async function ownedLead(locals: App.Locals, id: string) {
  const { data } = await locals.supabase
    .from('brand_news_items')
    .select('id, url, author_handle, author_platform, dm_target')
    .eq('id', id)
    .maybeSingle();
  return data;
}

export const actions: Actions = {
  done: async ({ request, locals }) => {
    const id = String((await request.formData()).get('id') ?? '');
    const lead = await ownedLead(locals, id);
    if (!lead) return fail(404, { error: 'lead not found' });

    // `done_at` è ciò che `contactGate` guarda: da qui in poi quella persona è stata toccata.
    const { error } = await adminClient()
      .from('brand_news_items')
      .update({ status: 'done', done_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return fail(500, { error: error.message });
    return { ok: true };
  },

  ignore: async ({ request, locals }) => {
    const id = String((await request.formData()).get('id') ?? '');
    const lead = await ownedLead(locals, id);
    if (!lead) return fail(404, { error: 'lead not found' });

    const admin = adminClient();
    const handle = lead.author_handle ?? lead.dm_target;
    // Ignorare è un segnale sulla PERSONA, non solo su questo thread: non riproporla mai più.
    if (handle) {
      await suppressAuthor(admin, {
        platform: lead.author_platform ?? platformOf(String(lead.url ?? '')),
        handle: String(handle),
        source: 'manual',
        reason: 'ignored by the owner in the queue'
      });
    }

    const { error } = await admin.from('brand_news_items').update({ status: 'dismissed' }).eq('id', id);
    if (error) return fail(500, { error: error.message });
    return { ok: true };
  }
};

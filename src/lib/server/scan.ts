import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { createSources, roundRobin, type FeedItem, type SourceRef } from '@anomalia/leads-core/feed';
import { normalizeIntent, INTENT_RANK, type LeadIntent } from '@anomalia/leads-core/intent';
import {
  buildEngagePrompt,
  selectTopComments,
  COMMENT_SCHEMA,
  COMMENT_MIN_RELEVANCE
} from '@anomalia/leads-core/prompts';
import {
  authorProfileUrl,
  contactGate,
  dmWithOptOut,
  gateVerdict,
  platformOf
} from '@anomalia/leads-core/contact';
import { scrapeCreatorsGet } from './scrapecreators';
import { aiObject } from './ai';
import { planFor } from '$lib/plans';
import { notifyWebhook } from './webhook';

/**
 * Un giro di scansione per un brand: sorgenti → conversazioni → giudizio → bozze.
 *
 * Il pacchetto condiviso fa il lavoro; qui c'è solo il giro attorno — cosa leggere dal database,
 * cosa scriverci, e quanto spendere.
 */

// Niente browser vero in questo prodotto: `fetchViaBrowser` resta fuori, e il core salta il
// ripiego invece di fallire. È il motivo per cui la dipendenza è opzionale.
const sources = createSources({
  scrape: scrapeCreatorsGet,
  redditAuth: () => ({ token: env.REDDIT_FEED_TOKEN, user: env.REDDIT_FEED_USER })
});

/** Quante conversazioni si danno in pasto al modello in un giro. Oltre, si paga rumore. */
const MAX_ITEMS_PER_SCAN = 40;

// I limiti arrivano da `$lib/plans`, che è anche quello che legge la landing: prometterne uno e
// applicarne un altro è il modo più rapido di perdere il primo cliente.

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The id of the conversation being judged.' },
          relevance: { type: 'integer', description: '0-100. How much this brand can genuinely help HERE. Below 70 means a comment would consume attention without earning it.' },
          intent: { type: 'string', enum: ['seeking_now', 'comparing', 'researching', 'venting', 'none'], description: 'Is this person shopping? seeking_now = asking for a solution right now; comparing = weighing options; researching = wants an explanation; venting = wants to be heard; none = not a buyer.' },
          angle: { type: 'string', description: 'One line: what this brand would actually add to the thread.' }
        },
        required: ['id', 'relevance', 'intent', 'angle']
      }
    }
  },
  required: ['verdicts']
} as const;

type Verdict = { id: string; relevance: number; intent: string; angle: string };

export type Brand = {
  id: string;
  name: string;
  about: string;
  site_url: string | null;
  plan: string;
  webhook_url?: string | null;
  webhook_secret?: string | null;
};

const urlHash = (url: string) => createHash('sha1').update(url).digest('hex').slice(0, 16);

async function loadSources(admin: SupabaseClient, brandId: string): Promise<SourceRef[]> {
  const { data } = await admin
    .from('brand_sources')
    .select('kind, value, lang')
    .eq('brand_id', brandId)
    .eq('active', true);
  return (data ?? []).map((s) => ({ kind: String(s.kind), value: String(s.value), lang: s.lang as string | null }));
}

export type Failures = { count: number; last: string | null };

/** Le conversazioni mai viste per questo brand, a quote eque fra le sorgenti. */
async function freshItems(
  admin: SupabaseClient,
  brandId: string,
  refs: SourceRef[],
  failures: Failures
) {
  const byOrigin = new Map<string, Array<FeedItem & { hash: string }>>();

  for (const ref of refs) {
    const items = await sources.fetchSourceFeed(ref).catch((e) => {
      // L'errore di UNA sorgente non ferma il giro, ma non diventa nemmeno un silenzioso "0":
      // viene contato, perché "nessuna conversazione" e "tutto rotto" non sono la stessa cosa.
      const message = e instanceof Error ? e.message.slice(0, 300) : String(e);
      console.warn(`[scan] sorgente ${ref.kind}:${ref.value}:`, message);
      failures.count++;
      failures.last = message;
      return [] as FeedItem[];
    });
    if (items.length) {
      byOrigin.set(`${ref.kind}|${ref.value}`, items.map((i) => ({ ...i, hash: urlHash(i.url) })));
    }
  }

  const picked = roundRobin(byOrigin, MAX_ITEMS_PER_SCAN);
  if (!picked.length) return [];

  const { data: seen } = await admin
    .from('brand_news_items')
    .select('url_hash')
    .eq('brand_id', brandId)
    .in('url_hash', picked.map((p) => p.hash));
  const known = new Set((seen ?? []).map((r) => String(r.url_hash)));

  return picked.filter((p) => !known.has(p.hash));
}

/** Un giro completo. Non lancia: torna il conto di cosa è successo. */
export async function scanBrand(
  admin: SupabaseClient,
  brand: Brand
): Promise<{ found: number; judged: number; drafted: number }> {
  const started = Date.now();
  const failures: Failures = { count: 0, last: null };
  const refs = await loadSources(admin, brand.id);
  if (!refs.length) return { found: 0, judged: 0, drafted: 0 };

  const fresh = await freshItems(admin, brand.id, refs, failures);
  if (!fresh.length) {
    await logScan(admin, brand.id, refs, 0, 0, started, failures);
    return { found: 0, judged: 0, drafted: 0 };
  }

  const { data: inserted } = await admin
    .from('brand_news_items')
    .insert(
      fresh.map((i) => ({
        brand_id: brand.id,
        url_hash: i.hash,
        url: i.url,
        title: i.title,
        snippet: i.snippet,
        source_name: i.sourceName,
        published_at: i.publishedAt
      }))
    )
    .select('id, url_hash');

  const idByHash = new Map((inserted ?? []).map((r) => [String(r.url_hash), String(r.id)]));

  // UNA chiamata per tutte le conversazioni: giudicarle una a una costerebbe N volte tanto e
  // toglierebbe al modello il confronto fra loro, che è metà del giudizio.
  const judged = await aiObject<{ verdicts: Verdict[] }>({
    schema: VERDICT_SCHEMA as unknown as Record<string, unknown>,
    system: 'You are a sharp editor deciding where a brand can genuinely help. You would rather stay silent than post noise.',
    prompt: `IL BRAND: ${brand.name} — ${brand.about}

LE CONVERSAZIONI:
${fresh.map((i) => `[${idByHash.get(i.hash) ?? i.hash}] (${i.sourceName}) ${i.title}\n${(i.snippet ?? '').slice(0, 400)}`).join('\n\n')}

Per ognuna: quanto il brand può aiutare DAVVERO lì dentro, e se chi scrive sta comprando.
La rilevanza alta è rara. Chi sfoga non è un lead solo perché nomina il tema.`
  });

  const verdicts = judged?.verdicts ?? [];
  for (const v of verdicts) {
    await admin
      .from('brand_news_items')
      .update({
        status: v.relevance >= COMMENT_MIN_RELEVANCE ? 'proposed' : 'skipped',
        relevance: v.relevance,
        intent: normalizeIntent(v.intent),
        skip_reason: v.relevance >= COMMENT_MIN_RELEVANCE ? null : `rilevanza ${v.relevance}`
      })
      .eq('id', v.id);
  }

  const drafted = await draftTop(admin, brand, fresh, verdicts, idByHash);
  await logScan(admin, brand.id, refs, fresh.length, verdicts.length, started, failures);

  // Un ping, non il contenuto: chi lo riceve chiama `get_queue` per i dettagli, così il payload
  // non porta mai le bozze in giro e non c'è uno schema di evento da tenere sincronizzato.
  if (drafted > 0 && brand.webhook_url && brand.webhook_secret) {
    await notifyWebhook(brand.webhook_url, brand.webhook_secret, {
      event: 'leads.ready',
      brand_id: brand.id,
      count: drafted,
      at: new Date().toISOString()
    });
  }

  return { found: fresh.length, judged: verdicts.length, drafted };
}

/** Le migliori N del giorno prendono una bozza. Prima si ordina, poi si taglia. */
async function draftTop(
  admin: SupabaseClient,
  brand: Brand,
  fresh: Array<FeedItem & { hash: string }>,
  verdicts: Verdict[],
  idByHash: Map<string, string>
): Promise<number> {
  const budget = planFor(brand.plan).draftsPerDay;
  const itemById = new Map(fresh.map((i) => [idByHash.get(i.hash) ?? '', i]));

  const top = selectTopComments(
    verdicts.map((v) => ({ ...v, action: 'comment', intent: normalizeIntent(v.intent) })),
    budget
  );

  let drafted = 0;
  for (const pick of top) {
    const item = itemById.get(pick.id);
    if (!item) continue;

    const author = String((item as { author?: string }).author ?? '').trim();
    const platform = platformOf(item.url);

    // Il freno prima della bozza, non dopo: una bozza che non si può mandare è spesa sprecata.
    if (author) {
      const verdict = gateVerdict(await contactGate(admin, platform, author));
      if (verdict !== 'ok') {
        await admin
          .from('brand_news_items')
          .update({ status: 'skipped', skip_reason: `contatto: ${verdict}` })
          .eq('id', pick.id);
        continue;
      }
    }

    const draft = await aiObject<{ worth_it: boolean; comment: string; dm: string }>({
      schema: COMMENT_SCHEMA as unknown as Record<string, unknown>,
      system: 'You write comments that earn upvotes, not replies that get downvoted as marketing.',
      prompt: buildEngagePrompt({
        brandName: brand.name,
        about: brand.about,
        siteUrl: brand.site_url ?? '',
        aiContext: '',
        sourceName: item.sourceName,
        title: item.title,
        body: item.snippet ?? '',
        topComments: '',
        author,
        intent: pick.intent as LeadIntent,
        profileBlock: '',
        toneHint: '',
        styleHint: ''
      })
    });

    if (!draft?.worth_it || !draft.comment?.trim()) {
      await admin
        .from('brand_news_items')
        .update({ status: 'skipped', skip_reason: 'niente da aggiungere oltre al thread' })
        .eq('id', pick.id);
      continue;
    }

    await admin
      .from('brand_news_items')
      .update({
        status: 'suggested',
        suggestion: draft.comment.trim(),
        dm_draft: dmWithOptOut(draft.dm ?? ''),
        dm_target: author ? authorProfileUrl(item.url, author) : null,
        author_handle: author || null,
        author_platform: author ? platform : null
      })
      .eq('id', pick.id);
    drafted++;
  }

  return drafted;
}

async function logScan(
  admin: SupabaseClient,
  brandId: string,
  refs: SourceRef[],
  found: number,
  relevant: number,
  started: number,
  failures: Failures
) {
  await admin.from('radar_searches').insert({
    brand_id: brandId,
    sources: refs.map((r) => `${r.kind}:${r.value}`),
    items_found: found,
    items_fresh: found,
    items_relevant: relevant,
    sources_failed: failures.count,
    last_error: failures.last,
    ms: Date.now() - started
  });
}

export { INTENT_RANK };

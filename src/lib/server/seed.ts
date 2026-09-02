import type { SupabaseClient } from '@supabase/supabase-js';
import { aiObject } from './ai';

/**
 * Da una frase a delle sorgenti.
 *
 * È l'unico passo di onboarding che esiste: l'utente scrive cosa vende, e da lì escono i
 * subreddit e le ricerche da guardare. Chiedergli di scegliere i subreddit a mano sarebbe
 * chiedergli di sapere già la risposta.
 *
 * Proposta e scrittura sono separate di proposito: il brand non va creato finché non sappiamo di
 * avere delle sorgenti, altrimenti un fallimento del modello lascia in database un brand vuoto
 * che nessuna schermata sa mostrare.
 */
const SOURCES_SCHEMA = {
  type: 'object',
  properties: {
    subreddits: {
      type: 'array',
      items: { type: 'string' },
      description: '3-6 REAL, active subreddit names (without r/) where this product\'s buyers actually talk. Prefer specific communities over giant generic ones.'
    },
    reddit_queries: {
      type: 'array',
      items: { type: 'string' },
      description: '2-4 Reddit keyword searches (plain keywords, no boolean operators) that surface people ASKING for a solution like this one — not people discussing the topic in general.'
    }
  },
  required: ['subreddits', 'reddit_queries']
} as const;

type SeededSources = { subreddits: string[]; reddit_queries: string[] };

export type ProposedSource = { kind: 'subreddit' | 'reddit_query'; value: string };

export const MAX_SOURCES_FREE = 8;

/** Le sorgenti che il modello propone. Nessuna scrittura: si può fallire senza lasciare tracce. */
export async function proposeSources(about: string): Promise<ProposedSource[]> {
  const seeded = await aiObject<SeededSources>({
    schema: SOURCES_SCHEMA as unknown as Record<string, unknown>,
    system: 'You set up social listening for a product. You know which communities actually exist and which ones are dead.',
    prompt: `Il prodotto: ${about}

Trova dove ne parlano le persone che POTREBBERO COMPRARLO — non dove si parla del tema in astratto.
Un subreddit enorme e generico produce rumore; uno specifico produce lead.`
  });
  if (!seeded) return [];

  return [
    ...(seeded.subreddits ?? []).map((s) => ({ kind: 'subreddit' as const, value: String(s).replace(/^r\//, '').trim() })),
    ...(seeded.reddit_queries ?? []).map((q) => ({ kind: 'reddit_query' as const, value: String(q).trim() }))
  ]
    .filter((r) => r.value)
    .slice(0, MAX_SOURCES_FREE);
}

export async function saveSources(
  admin: SupabaseClient,
  brandId: string,
  sources: ProposedSource[]
): Promise<number> {
  if (!sources.length) return 0;

  const { error } = await admin
    .from('brand_sources')
    .upsert(sources.map((s) => ({ ...s, brand_id: brandId })), {
      onConflict: 'brand_id,kind,value',
      ignoreDuplicates: true
    });
  if (error) {
    console.warn('[seed] upsert sorgenti:', error.message.slice(0, 120));
    return 0;
  }
  return sources.length;
}

import type { SupabaseClient } from '@supabase/supabase-js';
import { aiObject } from './ai';

/**
 * Da una frase a delle sorgenti.
 *
 * È l'unico passo di onboarding che esiste: l'utente scrive cosa vende, e da lì escono i
 * subreddit e le ricerche da guardare. Chiedergli di scegliere i subreddit a mano sarebbe
 * chiedergli di sapere già la risposta.
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

export const MAX_SOURCES_FREE = 8;

export async function seedSources(
  admin: SupabaseClient,
  brandId: string,
  about: string
): Promise<number> {
  const seeded = await aiObject<SeededSources>({
    schema: SOURCES_SCHEMA as unknown as Record<string, unknown>,
    system: 'You set up social listening for a product. You know which communities actually exist and which ones are dead.',
    prompt: `Il prodotto: ${about}

Trova dove ne parlano le persone che POTREBBERO COMPRARLO — non dove si parla del tema in astratto.
Un subreddit enorme e generico produce rumore; uno specifico produce lead.`
  });
  if (!seeded) return 0;

  const rows = [
    ...(seeded.subreddits ?? []).map((s) => ({ kind: 'subreddit', value: String(s).replace(/^r\//, '').trim() })),
    ...(seeded.reddit_queries ?? []).map((q) => ({ kind: 'reddit_query', value: String(q).trim() }))
  ]
    .filter((r) => r.value)
    .slice(0, MAX_SOURCES_FREE)
    .map((r) => ({ ...r, brand_id: brandId }));

  if (!rows.length) return 0;

  const { error } = await admin.from('brand_sources').upsert(rows, {
    onConflict: 'brand_id,kind,value',
    ignoreDuplicates: true
  });
  if (error) {
    console.warn('[seed] upsert sorgenti:', error.message.slice(0, 120));
    return 0;
  }
  return rows.length;
}

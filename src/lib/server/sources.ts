import type { SupabaseClient } from '@supabase/supabase-js';

/** Condiviso fra `/api/v1/sources` e i tool MCP: stesse regole, un solo posto che le applica. */

export const SOURCE_KINDS = [
  'subreddit',
  'reddit_query',
  'threads_query',
  'linkedin_query',
  'x_community',
  'gnews_query',
  'rss'
] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

const COLUMNS = 'id, kind, value, active, created_at';

export async function listSources(admin: SupabaseClient, brandId: string) {
  const { data } = await admin.from('brand_sources').select(COLUMNS).eq('brand_id', brandId).order('kind').order('value');
  return data ?? [];
}

/** Lancia se kind/value non sono validi: il chiamante decide come tradurlo (400 HTTP, errore MCP). */
export async function addSource(admin: SupabaseClient, brandId: string, kind: string, rawValue: string) {
  const value = rawValue.trim().replace(/^r\//, '');
  if (!SOURCE_KINDS.includes(kind as SourceKind)) throw new Error(`kind must be one of: ${SOURCE_KINDS.join(', ')}`);
  if (!value) throw new Error('value is required: a subreddit or some keywords');

  const { error } = await admin
    .from('brand_sources')
    .upsert({ brand_id: brandId, kind, value }, { onConflict: 'brand_id,kind,value', ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  // `ignoreDuplicates` non ritorna la riga quando esisteva già: la si rilegge, non si inventa.
  const { data: source } = await admin.from('brand_sources').select(COLUMNS).eq('brand_id', brandId).eq('kind', kind).eq('value', value).single();
  return source;
}

/** L'id da solo non autorizza niente: deve appartenere al brand di chi chiede. */
export async function ownedSource(admin: SupabaseClient, brandId: string, id: string) {
  const { data } = await admin.from('brand_sources').select('id').eq('id', id).eq('brand_id', brandId).maybeSingle();
  return Boolean(data);
}

export async function setSourceActive(admin: SupabaseClient, id: string, active: boolean) {
  const { error } = await admin.from('brand_sources').update({ active }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removeSource(admin: SupabaseClient, id: string) {
  const { error } = await admin.from('brand_sources').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

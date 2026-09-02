import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { brandFromRequest } from '$lib/server/apiAuth';

const KINDS = ['subreddit', 'reddit_query', 'threads_query', 'linkedin_query', 'x_community', 'gnews_query', 'rss'];

export const GET: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  const { data: sources } = await adminClient()
    .from('brand_sources')
    .select('id, kind, value, active, created_at')
    .eq('brand_id', brand.id)
    .order('kind')
    .order('value');
  return json({ sources: sources ?? [] });
};

/** POST /api/v1/sources  { "kind": "subreddit", "value": "smallbusiness" } */
export const POST: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  const body = await request.json().catch(() => ({}));
  const kind = String(body?.kind ?? '');
  const value = String(body?.value ?? '').trim().replace(/^r\//, '');

  if (!KINDS.includes(kind)) error(400, `kind must be one of: ${KINDS.join(', ')}`);
  if (!value) error(400, 'value is required: a subreddit or some keywords');

  const admin = adminClient();
  const { error: dbError } = await admin
    .from('brand_sources')
    .upsert({ brand_id: brand.id, kind, value }, { onConflict: 'brand_id,kind,value', ignoreDuplicates: true });
  if (dbError) error(500, dbError.message);

  // `ignoreDuplicates` non ritorna la riga quando esisteva già: la si rilegge, non si inventa.
  const { data: source } = await admin
    .from('brand_sources')
    .select('id, kind, value, active, created_at')
    .eq('brand_id', brand.id)
    .eq('kind', kind)
    .eq('value', value)
    .single();

  return json({ source }, { status: 201 });
};

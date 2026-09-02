import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { brandFromRequest } from '$lib/server/apiAuth';
import { addSource, listSources } from '$lib/server/sources';

export const GET: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  const sources = await listSources(adminClient(), brand.id);
  return json({ sources });
};

/** POST /api/v1/sources  { "kind": "subreddit", "value": "smallbusiness" } */
export const POST: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  const body = await request.json().catch(() => ({}));

  try {
    const source = await addSource(adminClient(), brand.id, String(body?.kind ?? ''), String(body?.value ?? ''));
    return json({ source }, { status: 201 });
  } catch (err) {
    error(400, (err as Error).message);
  }
};

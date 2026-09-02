import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { brandFromRequest } from '$lib/server/apiAuth';
import { markLeadDone, markLeadIgnored } from '$lib/server/leads';

/**
 * PATCH /api/v1/leads/:id  { "action": "done" | "ignore" }
 *
 * Un endpoint, non due: le due mutazioni permesse dalla coda sono la stessa scelta binaria che fa
 * la dashboard, `done` o `ignore`, quindi restano un unico verbo con un corpo diverso.
 */
export const PATCH: RequestHandler = async ({ request, params }) => {
  const brand = await brandFromRequest(request);
  const body = await request.json().catch(() => ({}));
  const action = body?.action;
  if (action !== 'done' && action !== 'ignore') error(400, 'action must be "done" or "ignore"');

  const admin = adminClient();
  // L'id da solo non autorizza niente: deve appartenere al brand della API key.
  const { data: lead } = await admin
    .from('brand_news_items')
    .select('id, url, author_handle, author_platform, dm_target')
    .eq('id', params.id)
    .eq('brand_id', brand.id)
    .maybeSingle();
  if (!lead) error(404, 'lead not found');

  const { error: dbError } =
    action === 'done' ? await markLeadDone(admin, lead.id) : await markLeadIgnored(admin, lead);
  if (dbError) error(500, dbError.message);

  return json({ ok: true });
};

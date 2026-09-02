import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { brandFromRequest } from '$lib/server/apiAuth';

/** L'id da solo non autorizza niente: deve appartenere al brand della API key. */
async function ownedSource(brandId: string, id: string) {
  const { data } = await adminClient().from('brand_sources').select('id').eq('id', id).eq('brand_id', brandId).maybeSingle();
  return Boolean(data);
}

/** PATCH /api/v1/sources/:id  { "active": false } */
export const PATCH: RequestHandler = async ({ request, params }) => {
  const brand = await brandFromRequest(request);
  if (!(await ownedSource(brand.id, params.id))) error(404, 'source not found');

  const body = await request.json().catch(() => ({}));
  if (typeof body?.active !== 'boolean') error(400, 'active must be a boolean');

  const { error: dbError } = await adminClient().from('brand_sources').update({ active: body.active }).eq('id', params.id);
  if (dbError) error(500, dbError.message);

  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  const brand = await brandFromRequest(request);
  if (!(await ownedSource(brand.id, params.id))) error(404, 'source not found');

  const { error: dbError } = await adminClient().from('brand_sources').delete().eq('id', params.id);
  if (dbError) error(500, dbError.message);

  return json({ ok: true });
};

import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { brandFromRequest } from '$lib/server/apiAuth';
import { ownedSource, removeSource, setSourceActive } from '$lib/server/sources';

/** PATCH /api/v1/sources/:id  { "active": false } */
export const PATCH: RequestHandler = async ({ request, params }) => {
  const brand = await brandFromRequest(request);
  const admin = adminClient();
  if (!(await ownedSource(admin, brand.id, params.id))) error(404, 'source not found');

  const body = await request.json().catch(() => ({}));
  if (typeof body?.active !== 'boolean') error(400, 'active must be a boolean');

  await setSourceActive(admin, params.id, body.active);
  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  const brand = await brandFromRequest(request);
  const admin = adminClient();
  if (!(await ownedSource(admin, brand.id, params.id))) error(404, 'source not found');

  await removeSource(admin, params.id);
  return json({ ok: true });
};

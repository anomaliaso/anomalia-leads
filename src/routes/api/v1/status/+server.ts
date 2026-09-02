import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { brandFromRequest } from '$lib/server/apiAuth';
import { lastScanForBrand } from '$lib/server/queue';

/** GET /api/v1/status — l'ultima scansione, per distinguere "niente oggi" da "sorgenti rotte". */
export const GET: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  const scan = await lastScanForBrand(adminClient(), brand.id);
  return json({ scan });
};

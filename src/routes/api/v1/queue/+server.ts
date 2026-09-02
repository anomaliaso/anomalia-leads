import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { brandFromRequest } from '$lib/server/apiAuth';
import { queueForBrand } from '$lib/server/queue';

/** GET /api/v1/queue — le bozze pronte da incollare, ordinate per intenzione d'acquisto. */
export const GET: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  const leads = await queueForBrand(adminClient(), brand.id);
  return json({ leads });
};

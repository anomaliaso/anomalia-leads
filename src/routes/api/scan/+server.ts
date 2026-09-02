import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminClient } from '$lib/server/supabase';
import { scanBrand, type Brand } from '$lib/server/scan';

export const config = { maxDuration: 300 };

const BRAND_COLUMNS = 'id, owner_id, name, about, site_url, plan, webhook_url, webhook_secret';

/**
 * Il cron passa il segreto e scansiona tutti; un utente loggato scansiona il proprio brand e
 * basta. Sono due autorizzazioni diverse per la stessa pipeline, non due pipeline.
 */
export const POST: RequestHandler = async ({ request, locals, url }) => {
  const admin = adminClient();
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  const isCron = Boolean(env.CRON_SECRET) && secret === env.CRON_SECRET;

  if (isCron) {
    const { data } = await admin.from('brands').select(BRAND_COLUMNS);
    const results = [];
    for (const brand of (data ?? []) as Brand[]) {
      results.push({ brand: brand.id, ...(await scanBrand(admin, brand)) });
    }
    return json({ ok: true, brands: results.length, results });
  }

  if (!locals.user) error(401, 'non autenticato');

  const brandId = url.searchParams.get('brand');
  const { data: brand } = await admin
    .from('brands')
    .select(BRAND_COLUMNS)
    .eq('id', brandId)
    .eq('owner_id', locals.user.id)
    .maybeSingle();
  if (!brand) error(404, 'brand non trovato');

  return json({ ok: true, ...(await scanBrand(admin, brand as Brand)) });
};

import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminClient } from '$lib/server/supabase';
import { sendEmail } from '$lib/server/email';

export const config = { maxDuration: 60 };

const BRAND_COLUMNS = 'id, name, slug, owner_id';

type Brand = { id: string; name: string; slug: string; owner_id: string };
type Lead = { title: string; url: string; source_name: string | null; relevance: number | null; suggestion: string | null };

const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

function recapHtml(brand: Brand, leads: Lead[]): string {
  const items = leads
    .map(
      (l) => `<li style="margin-bottom:16px">
        <a href="${escapeHtml(l.url)}" style="font-weight:600">${escapeHtml(l.title)}</a>
        ${l.source_name ? ` — ${escapeHtml(l.source_name)}` : ''}${l.relevance != null ? ` (${l.relevance})` : ''}
        ${l.suggestion ? `<div style="color:#555;margin-top:4px">${escapeHtml(l.suggestion).slice(0, 240)}</div>` : ''}
      </li>`
    )
    .join('');
  return `<p>${leads.length} nuovi lead per <strong>${escapeHtml(brand.name)}</strong> nelle ultime 24 ore.</p>
    <ul style="padding-left:20px">${items}</ul>
    <p><a href="https://anomalia.so/app/${brand.slug}">Vedi la coda</a></p>`;
}

/** Un giro per tutti i brand con almeno un lead nelle ultime 24 ore: chi non ne ha, non riceve mail. */
async function sendRecapFor(admin: ReturnType<typeof adminClient>, brand: Brand): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: leads } = await admin
    .from('brand_news_items')
    .select('title, url, source_name, relevance, suggestion')
    .eq('brand_id', brand.id)
    .eq('status', 'suggested')
    .gte('created_at', since)
    .order('relevance', { ascending: false });

  if (!leads?.length) return 0;

  const { data: user } = await admin.auth.admin.getUserById(brand.owner_id);
  if (!user?.user?.email) return 0;

  await sendEmail(user.user.email, `${leads.length} nuovi lead per ${brand.name}`, recapHtml(brand, leads as Lead[]));
  return leads.length;
}

/**
 * Stesso schema di autorizzazione di /api/scan: il cron passa il segreto e manda a tutti, un
 * utente loggato manda solo il recap del proprio brand (utile per verificare che arrivi).
 */
export const POST: RequestHandler = async ({ request, locals, url }) => {
  const admin = adminClient();
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  const isCron = Boolean(env.CRON_SECRET) && secret === env.CRON_SECRET;

  if (isCron) {
    const { data } = await admin.from('brands').select(BRAND_COLUMNS);
    const results = [];
    for (const brand of (data ?? []) as Brand[]) {
      // Il fallimento di UN brand (email invalida, Resend giù) non deve far saltare il recap di
      // tutti quelli dopo nel loop.
      try {
        results.push({ brand: brand.id, sent: await sendRecapFor(admin, brand) });
      } catch (e) {
        console.error(`[recap] brand ${brand.id}:`, e instanceof Error ? e.message : e);
        results.push({ brand: brand.id, sent: 0, error: true });
      }
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

  return json({ ok: true, sent: await sendRecapFor(admin, brand as Brand) });
};

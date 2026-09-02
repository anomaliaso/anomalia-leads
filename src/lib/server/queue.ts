import type { SupabaseClient } from '@supabase/supabase-js';
import { INTENT_RANK, normalizeIntent } from '@anomalia/leads-core/intent';

/**
 * Condiviso fra la dashboard e `/api/v1/queue`: l'ordinamento (chi compra adesso in cima) è logica
 * di prodotto, non di uno schermo — duplicarla vorrebbe dire farla divergere in silenzio.
 */

const LEAD_COLUMNS = 'id, url, title, source_name, relevance, intent, suggestion, dm_draft, dm_target, created_at';

export async function queueForBrand(supabase: SupabaseClient, brandId: string) {
  const { data } = await supabase
    .from('brand_news_items')
    .select(LEAD_COLUMNS)
    .eq('brand_id', brandId)
    .eq('status', 'suggested')
    .order('created_at', { ascending: false })
    .limit(50);

  return (data ?? []).sort(
    (a, b) =>
      INTENT_RANK[normalizeIntent(b.intent)] - INTENT_RANK[normalizeIntent(a.intent)] ||
      Date.parse(b.created_at) - Date.parse(a.created_at)
  );
}

export async function lastScanForBrand(supabase: SupabaseClient, brandId: string) {
  const { data: scan } = await supabase
    .from('radar_searches')
    .select('sources_failed, last_error, items_found, created_at, sources')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!scan) return null;

  const total = Array.isArray(scan.sources) ? scan.sources.length : 0;
  // "Nessun lead oggi" e "ogni sorgente è rotta" non sono lo stesso silenzio.
  const broken = scan.sources_failed > 0 && scan.items_found === 0;

  return { broken, failed: scan.sources_failed, total, error: scan.last_error, at: scan.created_at };
}

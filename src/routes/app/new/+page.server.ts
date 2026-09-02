import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { analyzeSite, readSite, saveSources, type ProposedSource } from '$lib/server/seed';
import { scanBrand, type Brand } from '$lib/server/scan';
import { createBrandSlug } from '$lib/brand-slug';
import { planFor } from '$lib/plans';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Due passi, non uno: si legge il sito, poi si conferma.
 *
 * Il passo di conferma non è una cortesia. Il modello sbaglia il nome, scrive un "about" da
 * brochure o propone un subreddit morto, e tutte e tre le cose si vedono in due secondi qui e in
 * due settimane nella coda. Ed è anche l'uscita di sicurezza: se il sito non si legge o il modello
 * non risponde si arriva comunque a questa schermata, con i campi vuoti, invece di sbattere contro
 * un errore che dice all'utente di scrivere meglio.
 */

const PRIVATE_HOST =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|.*\.local|.*\.internal)/i;

/** L'indirizzo come lo scrive una persona: `anomalia.so`, senza schema davanti. */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    // Questo indirizzo lo scarica il SERVER: senza filtro un utente potrebbe farsi leggere la rete
    // interna o i metadata del cloud, e riceverne il contenuto dentro la descrizione del brand.
    // Non copre tutto — un dominio pubblico può puntare a un IP privato — ma copre il caso ovvio
    // e costa una riga.
    if (PRIVATE_HOST.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Il piano dell'account e quanti brand ha già: il piano sta sui brand, allineato dal billing. */
async function account(admin: SupabaseClient, userId: string) {
  const { data } = await admin.from('brands').select('plan').eq('owner_id', userId);
  return { plan: planFor(data?.[0]?.plan as string | undefined), brands: data?.length ?? 0 };
}

/** Più di un brand è la promessa di Agency, e va verificata in tutti e due i passi. */
function overBrandLimit({ plan, brands }: { plan: ReturnType<typeof planFor>; brands: number }) {
  return brands >= 1 && plan.id !== 'agency'
    ? `The ${plan.name} plan covers one brand. Agency covers several — see Billing.`
    : null;
}

/** `subreddit:smallbusiness` — la coppia viaggia in un campo solo perché è una casella sola. */
function parseSource(raw: string): ProposedSource | null {
  const at = raw.indexOf(':');
  if (at < 1) return null;

  const kind = raw.slice(0, at);
  const value = raw.slice(at + 1).trim();
  if (!value || (kind !== 'subreddit' && kind !== 'reddit_query')) return null;

  return { kind, value: kind === 'subreddit' ? value.replace(/^r\//, '') : value };
}

export const actions: Actions = {
  /** Passo 1: leggi il sito e proponi. Nessuna scrittura: si può fallire senza lasciare tracce. */
  analyze: async ({ request, locals }) => {
    if (!locals.user) redirect(303, '/login?next=/app/new');

    const form = await request.formData();
    const site = normalizeUrl(String(form.get('site_url') ?? ''));
    if (!site) return fail(400, { error: 'That does not look like a public web address.' });

    const admin = adminClient();
    const acc = await account(admin, locals.user.id);
    const blocked = overBrandLimit(acc);
    if (blocked) return fail(403, { error: blocked });

    const analysis = await analyzeSite(site, await readSite(site), acc.plan.id);

    // Niente analisi non è un vicolo cieco: si va allo stesso passo, a mano.
    if (!analysis) {
      return {
        step: 'review' as const,
        site_url: site,
        name: '',
        about: '',
        sources: [] as ProposedSource[],
        note: `We could not read ${new URL(site).hostname}. Fill it in yourself — two lines are enough.`
      };
    }

    return { step: 'review' as const, site_url: site, ...analysis, note: null };
  },

  /** Passo 2: quello che l'utente ha confermato diventa un brand, e parte la prima scansione. */
  create: async ({ request, locals }) => {
    if (!locals.user) redirect(303, '/login?next=/app/new');

    const form = await request.formData();
    const site = normalizeUrl(String(form.get('site_url') ?? ''));
    const name = String(form.get('name') ?? '').trim();
    const about = String(form.get('about') ?? '').trim();

    const sources = form
      .getAll('source')
      .map((s) => parseSource(String(s)))
      .filter((s): s is ProposedSource => Boolean(s));

    const extra = parseSource(`${form.get('extra_kind') ?? ''}:${form.get('extra_value') ?? ''}`);
    if (extra) sources.push(extra);

    // Quello che l'utente aveva davanti, per non fargli riscrivere tutto dopo un errore.
    const back = { step: 'review' as const, site_url: site ?? '', name, about, sources, note: null };

    if (!name) return fail(400, { ...back, error: 'The brand needs a name.' });
    if (about.length < 20) {
      return fail(400, { ...back, error: 'Two real lines about what you sell: that is where the drafts come from.' });
    }
    if (!sources.length) {
      return fail(400, { ...back, error: 'Keep at least one source, or add one: without them there is nowhere to look.' });
    }

    const admin = adminClient();
    const acc = await account(admin, locals.user.id);
    const blocked = overBrandLimit(acc);
    if (blocked) return fail(403, { ...back, error: blocked });

    const { data: brand, error } = await admin
      .from('brands')
      .insert({
        owner_id: locals.user.id,
        name,
        slug: createBrandSlug(name),
        about,
        site_url: site
      })
      .select('id, owner_id, slug, name, about, site_url, plan')
      .single();

    if (error || !brand) return fail(500, { ...back, error: error?.message ?? 'could not create the brand' });

    await saveSources(admin, brand.id, sources.slice(0, acc.plan.sources ?? Infinity));

    // Prima scansione subito: il valore si vede adesso, non al prossimo cron.
    await scanBrand(admin, brand as Brand).catch((e) => {
      console.warn('[nuovo brand] prima scansione:', e instanceof Error ? e.message : e);
    });

    redirect(303, `/app/${brand.slug}`);
  }
};

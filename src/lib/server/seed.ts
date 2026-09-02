import type { SupabaseClient } from '@supabase/supabase-js';
import { aiObject } from './ai';
import { planFor } from '$lib/plans';

/**
 * Dall'indirizzo del sito a un brand pronto.
 *
 * L'onboarding non chiede più "cosa vendi?". Chi ha un prodotto ha già scritto la risposta sulla
 * propria home, e chiedergliela di nuovo ottiene la versione peggiore: quella da landing page,
 * scritta per convincere invece che per spiegare. Si legge il sito, si propone una descrizione e
 * delle sorgenti, e l'utente CORREGGE invece di comporre — rileggere è più facile che scrivere, e
 * un campo vuoto davanti è il punto dove l'onboarding si perde.
 *
 * Proposta e scrittura restano separate: il brand non nasce finché l'utente non ha guardato.
 */

const SITE_TIMEOUT_MS = 12_000;
/** Quanto sito si dà in pasto al modello. Oltre la prima schermata di testo si paga rumore. */
const SITE_MAX_CHARS = 6000;

const ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'"
};

/**
 * `<script>` e `<style>` vanno tolti PRIMA dei tag: il loro contenuto non sta dentro un tag, e
 * senza questo passaggio il modello legge trecento righe di CSS al posto della homepage.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (_, e: string) => ENTITIES[e] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Il testo del sito, ridotto a quello che un modello può leggere.
 *
 * Non lancia: un sito che non risponde, che risponde 403 o che monta tutto in JavaScript è un caso
 * previsto, non un guasto. Torna stringa vuota, e chi chiama decide cosa dire all'utente.
 */
export async function readSite(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'anomalia-leads/1.0 (+https://leads.anomalia.so)',
        accept: 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(SITE_TIMEOUT_MS),
      redirect: 'follow'
    });
    if (!res.ok) return '';

    const html = (await res.text()).slice(0, 400_000);
    return htmlToText(html).slice(0, SITE_MAX_CHARS);
  } catch (e) {
    console.warn('[seed] lettura sito:', e instanceof Error ? e.message.slice(0, 200) : e);
    return '';
  }
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'The product or company name, as it calls itself on the site. Two or three words at most, no tagline.'
    },
    about: {
      type: 'string',
      description: 'Two or three sentences: what it sells, to whom, and which problem it removes. Write it the way you would explain it to a person, NOT the way the site writes it — no slogans, no adjectives that could be said about anything. Write it IN THE SAME LANGUAGE AS THE SITE: this text is fed to the drafter, and a description in the wrong language leaks into the comments it writes.'
    },
    subreddits: {
      type: 'array',
      items: { type: 'string' },
      description: '3-6 REAL, active subreddit names (without r/) where this product\'s buyers actually talk. Prefer specific communities over giant generic ones.'
    },
    reddit_queries: {
      type: 'array',
      items: { type: 'string' },
      description: '2-4 Reddit keyword searches (plain keywords, no boolean operators) that surface people ASKING for a solution like this one — not people discussing the topic in general.'
    }
  },
  required: ['name', 'about', 'subreddits', 'reddit_queries']
} as const;

type Analysis = { name: string; about: string; subreddits: string[]; reddit_queries: string[] };

export type ProposedSource = { kind: 'subreddit' | 'reddit_query'; value: string };

export type SiteAnalysis = { name: string; about: string; sources: ProposedSource[] };

/**
 * Cosa vende questo sito, e dove ne parlano.
 *
 * `null` vuol dire che non c'è stata una risposta — sito illeggibile, modello giù, quota finita. È
 * diverso da una risposta vuota, e la schermata lo dice in modo diverso: "non ci siamo riusciti"
 * non è "scrivi meglio". Confonderli è il motivo per cui l'onboarding vecchio rispondeva "prova
 * con una descrizione più concreta" a chi aveva solo una variabile d'ambiente mancante.
 */
export async function analyzeSite(url: string, text: string, plan = 'free'): Promise<SiteAnalysis | null> {
  if (!text) return null;

  const read = await aiObject<Analysis>({
    schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
    system: 'You read a product website and work out who would buy it. You know which online communities actually exist and which ones are dead.',
    prompt: `IL SITO: ${url}

IL TESTO DELLA PAGINA:
${text}

Dimmi come si chiama e cosa vende, in parole normali. Poi trova dove ne parlano le persone che
POTREBBERO COMPRARLO — non dove si parla del tema in astratto. Un subreddit enorme e generico
produce rumore; uno specifico produce lead.

Il nome e la descrizione vanno scritti NELLA LINGUA DEL SITO qui sopra, non nella lingua di questa
richiesta: quel testo finisce nel prompt che scrive i commenti, e una descrizione nella lingua
sbagliata cola dentro le bozze.`
  });
  if (!read) return null;

  const sources: ProposedSource[] = [
    ...(read.subreddits ?? []).map((s) => ({ kind: 'subreddit' as const, value: String(s).replace(/^r\//, '').trim() })),
    ...(read.reddit_queries ?? []).map((q) => ({ kind: 'reddit_query' as const, value: String(q).trim() }))
  ].filter((r) => r.value);

  return {
    name: String(read.name ?? '').trim(),
    about: String(read.about ?? '').trim(),
    sources: sources.slice(0, planFor(plan).sources ?? Infinity)
  };
}

export async function saveSources(
  admin: SupabaseClient,
  brandId: string,
  sources: ProposedSource[]
): Promise<number> {
  if (!sources.length) return 0;

  const { error } = await admin
    .from('brand_sources')
    .upsert(sources.map((s) => ({ ...s, brand_id: brandId })), {
      onConflict: 'brand_id,kind,value',
      ignoreDuplicates: true
    });
  if (error) {
    console.warn('[seed] upsert sorgenti:', error.message.slice(0, 120));
    return 0;
  }
  return sources.length;
}

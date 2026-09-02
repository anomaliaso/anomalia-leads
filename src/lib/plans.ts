/**
 * I piani, in un posto solo.
 *
 * La landing li legge da qui e il motore li fa rispettare da qui. Tenerli in due posti significa
 * prometterne uno e applicarne un altro — un debito che riscuote il primo cliente.
 *
 * L'unità venduta è la BOZZA CONSEGNATA, non la parola chiave monitorata: un mese silenzioso deve
 * costare meno, non uguale. `draftsPerDay` non è un secondo prezzo, è solo il ritmo — evita che
 * l'intero mese si bruci in un pomeriggio.
 *
 * I prezzi in dollari non sono una conversione: sono listini separati, come li vuole Stripe.
 */
export type PlanId = 'free' | 'starter' | 'pro' | 'agency';

export type Plan = {
	id: PlanId;
	name: string;
	eur: number;
	usd: number;
	draftsPerMonth: number;
	draftsPerDay: number;
	/** `null` = nessun tetto. */
	sources: number | null;
	platforms: string[];
	lines: string[];
	cta: string;
	featured?: boolean;
};

export const PLANS: Plan[] = [
	{
		id: 'free',
		name: 'Free',
		eur: 0,
		usd: 0,
		draftsPerMonth: 30,
		draftsPerDay: 3,
		sources: 5,
		platforms: ['subreddit', 'reddit_query'],
		lines: ['30 drafts a month', '5 sources', 'Reddit'],
		cta: 'Start free'
	},
	{
		id: 'starter',
		name: 'Starter',
		eur: 10,
		usd: 11,
		draftsPerMonth: 150,
		draftsPerDay: 10,
		sources: 15,
		platforms: ['subreddit', 'reddit_query', 'threads_query'],
		lines: ['150 drafts a month', '15 sources', 'Reddit and Threads'],
		cta: 'Try Starter',
		featured: true
	},
	{
		id: 'pro',
		name: 'Pro',
		eur: 30,
		usd: 33,
		draftsPerMonth: 600,
		draftsPerDay: 30,
		sources: 40,
		platforms: ['subreddit', 'reddit_query', 'threads_query', 'x_community', 'linkedin_query'],
		lines: ['600 drafts a month', '40 sources', 'X and LinkedIn too', 'Outcomes measured'],
		cta: 'Try Pro'
	},
	{
		id: 'agency',
		name: 'Agency',
		eur: 99,
		usd: 109,
		draftsPerMonth: 2500,
		draftsPerDay: 120,
		sources: null,
		platforms: ['subreddit', 'reddit_query', 'threads_query', 'x_community', 'linkedin_query'],
		lines: ['2,500 drafts a month', 'Unlimited sources', 'Multiple brands', 'API'],
		cta: 'Try Agency'
	}
];

const BY_ID = new Map(PLANS.map((p) => [p.id, p]));

/** Un piano sconosciuto vale free: un abbonamento rotto non deve regalare il piano più alto. */
export function planFor(id: string | null | undefined): Plan {
	return BY_ID.get((id ?? 'free') as PlanId) ?? BY_ID.get('free')!;
}

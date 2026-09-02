import { PLANS } from '$lib/plans';
import { SITE, siteOrigin } from '$lib/seo';
import type { RequestHandler } from './$types';

/**
 * `llms.txt` (llmstxt.org): la stessa pagina, ma leggibile da un modello senza attraversare
 * markup. Serve alle risposte generative — chi chiede a un assistente "come trovo conversazioni
 * in cui il mio prodotto ha senso" deve poter ricevere fatti giusti, non un riassunto del footer.
 *
 * I prezzi si generano da `PLANS`, non si riscrivono: un listino copiato a mano è un listino che
 * il primo aumento di prezzo rende falso proprio dove un modello va a leggerlo.
 */
export const GET: RequestHandler = ({ url }) => {
	const origin = siteOrigin(url.origin);
	const plans = PLANS.map(
		(p) =>
			`- **${p.name}** — €${p.eur}/$${p.usd} per month: ${p.draftsPerMonth.toLocaleString('en-US')} drafts a month, ` +
			`${p.sources === null ? 'unlimited' : p.sources} sources, ${p.platforms.length} platform types.`
	).join('\n');

	const body = `# ${SITE.name}

> ${SITE.description}

anomalia/leads watches Reddit, Threads, X and LinkedIn for conversations where a product has
something useful to say, ranks them by how close the writer is to buying, and hands over a reply
written for that specific thread. The user pastes it from their own account.

## What makes it different

- **Intent is not relevance.** Someone asking "which tool do you use" and someone ranting about the
  topic score the same relevance and are not the same lead. Ranking is for buying intent.
- **It never posts for you.** Every draft is pasted by the user, from their own account. Automated
  posting is what gets accounts banned, so the product does not do it.
- **One person, one touch.** The contact cap is global to the platform, not per customer: a person
  who has already been messaged is never surfaced to anyone else.
- **Silence is a valid answer.** If there is nothing to add beyond what a thread already has, no
  draft is written.
- **Outcomes are measured.** After 48 hours the comment is found again in the thread and the result
  is recorded: upvotes, replies, or removal.
- **You pay for drafts delivered**, not for keywords monitored: a quiet month costs less.

## Pricing

${plans}

Thirty-day guarantee: a month without a single conversation worth answering is not billed.

## Pages

- [Home](${origin}/): what it does, how it works, pricing, FAQ.
- [Privacy Policy](${origin}/privacy)
- [Terms of Service](${origin}/terms)
- [Source code](${SITE.github}): Apache-2.0, engine shared with Anomalia.
`;
	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' }
	});
};

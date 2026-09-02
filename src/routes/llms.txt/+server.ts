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

## For agents

Once a human has signed up and generated a brand API key from the dashboard's **API** tab, an
agent can run the whole loop — sources, scan, queue, act — on its own, with no browser involved
after that one step.

REST, base \`${origin}/api/v1\`, header \`Authorization: Bearer alk_...\` on every request:

- \`GET /queue\` — drafts ready to paste, ranked by buying intent.
- \`GET /status\` — the last scan's outcome (distinguishes "nothing today" from "every source is broken").
- \`PATCH /leads/:id\` \`{ "action": "done" | "ignore" }\`
- \`GET\`/\`POST /sources\`, \`PATCH\`/\`DELETE /sources/:id\`
- \`POST /scan\` — run the sources → conversations → judgment → drafts pipeline now, instead of
  waiting for the nightly cron.
- \`GET\`/\`PUT\`/\`DELETE /webhook\` — \`{ "url": "https://..." }\`. When a scan produces new drafts,
  this URL gets a signed POST (\`X-Anomalia-Signature: sha256=...\`, HMAC over the raw body with the
  secret \`PUT\` returns) instead of the agent having to poll.

MCP: \`${origin}/api/mcp\`, same bearer key (\`claude mcp add --transport http anomalia-leads
${origin}/api/mcp --header "Authorization: Bearer alk_..."\`). One tool per endpoint above:
\`get_queue\`, \`get_status\`, \`update_lead\`, \`list_sources\`, \`add_source\`, \`set_source_active\`,
\`remove_source\`, \`trigger_scan\`, \`set_webhook\`, \`remove_webhook\`.

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

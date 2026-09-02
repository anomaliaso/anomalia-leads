import { siteOrigin } from '$lib/seo';
import type { RequestHandler } from './$types';

/**
 * `robots.txt` è una rotta e non un file statico per una ragione sola: la riga `Sitemap:` vuole
 * un URL assoluto, e cablarlo manderebbe ogni anteprima a dichiarare la sitemap di produzione.
 *
 * I crawler dei modelli (GPTBot, ClaudeBot, PerplexityBot…) rientrano nel `User-agent: *` e sono
 * ammessi apposta: questo prodotto vuole essere citato quando qualcuno chiede a un modello come
 * trovare conversazioni in cui rispondere.
 */
export const GET: RequestHandler = ({ url }) => {
	const body = `# Tutto pubblico è indicizzabile, crawler dei modelli compresi.
User-agent: *
Allow: /

# L'applicazione è dietro login: dietro c'è solo un redirect, non contenuto.
Disallow: /app
Disallow: /api/
Disallow: /auth/
Disallow: /login
Disallow: /logout
Disallow: /onboarding
Disallow: /forgot-password
Disallow: /reset-password

Sitemap: ${siteOrigin(url.origin)}/sitemap.xml
`;
	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' }
	});
};

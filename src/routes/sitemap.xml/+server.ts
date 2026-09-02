import { siteOrigin } from '$lib/seo';
import type { RequestHandler } from './$types';

/** Solo le pagine pubbliche: mettere in sitemap un URL che redirige al login è un errore dichiarato. */
const PAGES = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/privacy', priority: '0.3', changefreq: 'yearly' },
	{ path: '/terms', priority: '0.3', changefreq: 'yearly' }
];

export const GET: RequestHandler = ({ url }) => {
	const origin = siteOrigin(url.origin);
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(
	(p) => `\t<url>
\t\t<loc>${origin}${p.path}</loc>
\t\t<changefreq>${p.changefreq}</changefreq>
\t\t<priority>${p.priority}</priority>
\t</url>`
).join('\n')}
</urlset>
`;
	return new Response(body, {
		headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' }
	});
};

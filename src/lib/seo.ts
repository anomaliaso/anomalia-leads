import { env } from '$env/dynamic/public';

/**
 * Le costanti che i motori (e i modelli) leggono di questo sito, in un posto solo.
 *
 * Il dominio NON è cablato: in produzione arriva da `PUBLIC_APP_URL`, altrove dall'origine della
 * richiesta. Cablarlo significherebbe che ogni deploy di anteprima dichiara come canonica la
 * pagina di produzione — e Google indicizza quella al posto della sua.
 */
export const SITE = {
	name: 'anomalia/leads',
	publisher: 'Anomalia',
	tagline: 'the conversations where you have something to say',
	description:
		'Find the people on Reddit, Threads, X and LinkedIn who are looking for what you sell, ranked by buying intent, with the reply already written.',
	locale: 'en_US',
	image: '/og.png',
	imageAlt: 'anomalia/leads — someone is already looking for what you sell',
	github: 'https://github.com/anomaliaso/anomalia-leads',
	email: 'privacy@anomalia.so'
} as const;

/** L'origine da usare negli URL assoluti: la variabile se c'è, l'origine della richiesta se no. */
export function siteOrigin(fallback: string): string {
	return (env.PUBLIC_APP_URL || fallback).replace(/\/+$/, '');
}

/**
 * JSON-LD dentro `<svelte:head>` passa per `{@html}`, quindi una stringa `</script>` nei dati
 * chiuderebbe il tag e il resto finirebbe nella pagina come testo. Scappare `<` lo impedisce e
 * resta JSON valido.
 */
export function ldJson(data: unknown): string {
	return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}<\/script>`;
}

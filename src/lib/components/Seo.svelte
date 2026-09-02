<script lang="ts">
	import { page } from '$app/state';
	import { SITE, siteOrigin } from '$lib/seo';

	/**
	 * I meta di una pagina, in un componente solo: title, description, canonica, Open Graph e
	 * Twitter dicono le stesse tre cose con nomi diversi, e tenerli separati garantisce che prima
	 * o poi discordino.
	 */
	let {
		title,
		description = SITE.description,
		image = SITE.image,
		type = 'website',
		noindex = false
	}: {
		title: string;
		description?: string;
		image?: string;
		type?: string;
		noindex?: boolean;
	} = $props();

	const origin = $derived(siteOrigin(page.url.origin));
	// La canonica non porta querystring né lo slash finale: sono la stessa pagina, e dichiararne
	// due è il modo più comune di dividersi il ranking da soli.
	const canonical = $derived(origin + page.url.pathname.replace(/(.)\/+$/, '$1'));
	const imageUrl = $derived(origin + image);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="robots"
		content={noindex
			? 'noindex, follow'
			: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}
	/>

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={SITE.locale} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={SITE.imageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	<meta name="twitter:image:alt" content={SITE.imageAlt} />
</svelte:head>

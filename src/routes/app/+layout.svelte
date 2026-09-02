<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { data, children } = $props();

	// Lo slug corrente viene dall'URL, non da uno stato: così un link condiviso apre il brand
	// giusto e il tasto indietro funziona.
	const slug = $derived(page.params.slug ?? '');
	const nav = $derived(
		slug
			? [
					{ href: `/app/${slug}`, label: 'Queue', exact: true },
					{ href: `/app/${slug}/sources`, label: 'Sources', exact: false }
				]
			: []
	);

	const isActive = (href: string, exact: boolean) =>
		exact ? page.url.pathname === href : page.url.pathname.startsWith(href);

	function switchBrand(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		goto(value === '__new' ? '/app/new' : `/app/${value}`);
	}
</script>

<svelte:head>
	<!-- Dietro il login non c'è contenuto da indicizzare: al crawler tocca solo un redirect. -->
	<title>anomalia/leads</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="border-border bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
	<div class="mx-auto flex max-w-4xl items-center gap-3 px-6 py-3">
		{#if data.brands.length}
			<select
				value={slug}
				onchange={switchBrand}
				aria-label="Brand"
				class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 max-w-[12rem] rounded-md border px-2 text-sm font-medium shadow-xs outline-none focus-visible:ring-[3px]"
			>
				{#each data.brands as b (b.id)}
					<option value={b.slug}>{b.name}</option>
				{/each}
				<option value="__new">+ new brand</option>
			</select>
		{:else}
			<span class="text-muted-foreground text-sm">no brand yet</span>
		{/if}

		<nav class="flex items-center gap-1">
			{#each nav as item (item.href)}
				<a
					href={item.href}
					class="rounded-md px-2.5 py-1 text-sm transition-colors {isActive(item.href, item.exact)
						? 'bg-muted text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-1">
			<ThemeToggle />

			<form method="POST" action="/logout">
				<Button type="submit" variant="ghost" size="sm" class="text-muted-foreground">sign out</Button>
			</form>
		</div>
	</div>
</div>

{@render children()}

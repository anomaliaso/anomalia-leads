<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	let { data, children } = $props();

	// Lo slug corrente viene dall'URL, non da uno stato: così un link condiviso apre il brand
	// giusto e il tasto indietro funziona.
	const slug = $derived(page.params.slug ?? '');
	const nav = $derived(
		slug
			? [
					{ href: `/app/${slug}`, label: 'Coda', exact: true },
					{ href: `/app/${slug}/sorgenti`, label: 'Sorgenti', exact: false }
				]
			: []
	);

	const isActive = (href: string, exact: boolean) =>
		exact ? page.url.pathname === href : page.url.pathname.startsWith(href);

	function switchBrand(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		goto(value === '__nuovo' ? '/app/nuovo' : `/app/${value}`);
	}
</script>

<div class="border-border bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
	<div class="mx-auto flex max-w-2xl items-center gap-3 px-6 py-3">
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
				<option value="__nuovo">+ nuovo brand</option>
			</select>
		{:else}
			<span class="text-muted-foreground text-sm">nessun brand</span>
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

		<form method="POST" action="/logout" class="ml-auto">
			<Button type="submit" variant="ghost" size="sm" class="text-muted-foreground">esci</Button>
		</form>
	</div>
</div>

{@render children()}

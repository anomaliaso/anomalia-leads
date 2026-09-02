<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';

	let { data, children } = $props();

	const NAV = [
		{ href: '/app', label: 'Coda' },
		{ href: '/app/sorgenti', label: 'Sorgenti' }
	];

	const isActive = (href: string) =>
		href === '/app' ? page.url.pathname === '/app' : page.url.pathname.startsWith(href);
</script>

<div class="border-border sticky top-0 z-10 border-b backdrop-blur">
	<div class="mx-auto flex max-w-2xl items-center gap-6 px-6 py-3">
		<span class="text-sm font-medium tracking-tight">{data.brand.name}</span>

		<nav class="flex items-center gap-1">
			{#each NAV as item (item.href)}
				<a
					href={item.href}
					class="rounded-md px-2.5 py-1 text-sm transition-colors {isActive(item.href)
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

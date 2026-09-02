<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { PLANS, planFor } from '$lib/plans';
	import type { Currency } from '$lib/currency';

	let { data, form } = $props();

	/**
	 * La valuta è scelta una volta sola. Chi ha già un abbonamento non la cambia da qui: cambiarla
	 * vorrebbe dire un secondo abbonamento in un'altra moneta, e Stripe non converte le fatture.
	 */
	let override = $state<Currency | null>(null);
	const currency = $derived(override ?? data.currency);
	const symbol = $derived(currency === 'eur' ? '€' : '$');

	// La stessa chiave della landing: chi ha già scelto la valuta lì non la riscegli qui. Serve
	// anche a non perderla quando un checkout fallito ricarica la pagina — questi form non usano
	// `enhance`, perché la risposta è un redirect verso Stripe e `goto` non esce dal sito.
	$effect(() => {
		try {
			const saved = localStorage.getItem('currency');
			if (saved === 'eur' || saved === 'usd') override = saved;
		} catch {
			// Storage negato: si resta sulla valuta deciso dal server.
		}
	});

	function pick(next: Currency) {
		override = next;
		try {
			localStorage.setItem('currency', next);
		} catch {
			// Vale per questa pagina e basta.
		}
	}

	const current = $derived(planFor(data.subscription?.plan ?? data.brand.plan));
	const renews = $derived(
		data.subscription?.current_period_end
			? new Date(data.subscription.current_period_end).toLocaleDateString('en-GB', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})
			: null
	);

	// Il checkout torna qui prima che il webhook di Stripe sia arrivato: per qualche secondo il
	// piano mostrato è ancora quello vecchio, e dirlo è meglio che far sembrare fallito un
	// pagamento riuscito.
	const justPaid = $derived(page.url.searchParams.get('checkout') === 'done');
</script>

<div class="mx-auto max-w-4xl px-6 py-10">
	<h1 class="text-xl font-semibold tracking-tight">Billing</h1>
	<p class="text-muted-foreground mt-1 text-sm text-pretty">
		The plan is on the account, not on this brand: it covers every brand you own.
	</p>

	<Card.Root class="mt-6">
		<Card.Content class="flex flex-wrap items-center gap-x-4 gap-y-3 pt-6">
			<div class="flex-1">
				<p class="flex items-center gap-2">
					<span class="font-medium">{current.name}</span>
					{#if data.subscription && data.subscription.status !== 'active'}
						<Badge variant="secondary" class="font-normal">{data.subscription.status}</Badge>
					{/if}
				</p>
				<p class="text-muted-foreground mt-1 text-sm">
					{current.draftsPerMonth.toLocaleString()} drafts a month, up to {current.draftsPerDay} a day.
					{#if renews}
						{data.subscription?.cancel_at_period_end ? 'Ends' : 'Renews'} on {renews}.
					{/if}
				</p>
			</div>

			{#if data.subscription}
				<form method="POST" action="?/portal">
					<Button type="submit" variant="outline">Manage billing</Button>
				</form>
			{:else}
				<div class="flex gap-1">
					{#each ['eur', 'usd'] as const as c (c)}
						<Button
							variant={currency === c ? 'secondary' : 'ghost'}
							size="sm"
							onclick={() => pick(c)}
						>
							{c === 'eur' ? '€ EUR' : '$ USD'}
						</Button>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if justPaid}
		<p class="text-muted-foreground mt-4 text-sm">
			Payment received. The new plan lands here within a few seconds — reload if it hasn't.
		</p>
	{/if}

	{#if form?.error}
		<p class="text-destructive mt-4 text-sm">{form.error}</p>
	{/if}

	<div class="mt-8 grid gap-4 sm:grid-cols-3">
		{#each PLANS.filter((p) => p.id !== 'free') as p (p.id)}
			{@const isCurrent = p.id === current.id}
			<Card.Root class="flex flex-col {p.featured && !isCurrent ? 'border-foreground/30' : ''}">
				<Card.Header>
					<div class="flex items-center gap-2">
						<Card.Title class="text-base">{p.name}</Card.Title>
						{#if isCurrent}
							<Badge variant="secondary" class="font-normal">current</Badge>
						{/if}
					</div>
					<p class="mt-2 flex items-baseline gap-1.5">
						<span class="text-3xl font-semibold tracking-tight">
							{symbol}{currency === 'eur' ? p.eur : p.usd}
						</span>
						<span class="text-muted-foreground text-sm">per month</span>
					</p>
					<p class="text-muted-foreground text-xs">tax included</p>
				</Card.Header>

				<Card.Content class="flex-1">
					<ul class="text-muted-foreground space-y-2 text-sm">
						{#each p.lines as line (line)}
							<li>{line}</li>
						{/each}
					</ul>
				</Card.Content>

				<Card.Footer>
					{#if isCurrent}
						<Button variant="outline" class="w-full" disabled>Your plan</Button>
					{:else if data.subscription}
						<!-- Con un abbonamento in corso il cambio passa dal portale: è lì che Stripe calcola
						     il rateo, e rifarlo con un secondo checkout vorrebbe dire farne pagare due. -->
						<form method="POST" action="?/portal" class="w-full">
							<Button type="submit" variant="outline" class="w-full">Switch to {p.name}</Button>
						</form>
					{:else}
						<form method="POST" action="?/checkout" class="w-full">
							<input type="hidden" name="plan" value={p.id} />
							<input type="hidden" name="currency" value={currency} />
							<Button type="submit" variant={p.featured ? 'default' : 'outline'} class="w-full">
								{p.cta}
							</Button>
						</form>
					{/if}
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>
</div>

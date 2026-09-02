<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';

	let { data, form } = $props();

	const KIND = {
		subreddit: { label: 'subreddit', hint: 'es. smallbusiness' },
		reddit_query: { label: 'ricerca Reddit', hint: 'es. crm per idraulici' },
		threads_query: { label: 'ricerca Threads', hint: 'parole chiave' },
		linkedin_query: { label: 'ricerca LinkedIn', hint: 'parole chiave' },
		x_community: { label: 'community X', hint: 'id o url della community' }
	} as const;

	let kind = $state<keyof typeof KIND>('subreddit');
	const active = $derived(data.sources.filter((s) => s.active).length);
</script>

<div class="mx-auto max-w-2xl px-6 py-10">
	<h1 class="text-xl font-semibold tracking-tight">Sorgenti</h1>
	<p class="text-muted-foreground mt-1 text-sm text-pretty">
		I posti che guardiamo per te. {active} attive su {data.sources.length}. Una sorgente specifica
		produce lead; una enorme e generica produce rumore.
	</p>

	<Card.Root class="mt-6">
		<Card.Content class="pt-6">
			<form method="POST" action="?/add" use:enhance class="flex flex-col gap-3 sm:flex-row">
				<select
					name="kind"
					bind:value={kind}
					class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] sm:w-48"
				>
					{#each Object.entries(KIND) as [k, meta] (k)}
						<option value={k}>{meta.label}</option>
					{/each}
				</select>

				<Input name="value" required placeholder={KIND[kind].hint} class="flex-1" />
				<Button type="submit">Aggiungi</Button>
			</form>

			{#if form?.error}
				<p class="text-destructive mt-3 text-sm">{form.error}</p>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if !data.sources.length}
		<p class="text-muted-foreground mt-8 text-sm">
			Nessuna sorgente. Senza, la scansione non ha dove guardare.
		</p>
	{/if}

	<ul class="divide-border mt-8 divide-y">
		{#each data.sources as s (s.id)}
			<li class="flex items-center gap-3 py-3">
				<Badge variant="outline" class="shrink-0 font-normal">
					{KIND[s.kind as keyof typeof KIND]?.label ?? s.kind}
				</Badge>

				<span class="min-w-0 flex-1 truncate text-sm {s.active ? '' : 'text-muted-foreground line-through'}">
					{s.value}
				</span>

				<form method="POST" action="?/toggle" use:enhance>
					<input type="hidden" name="id" value={s.id} />
					<input type="hidden" name="active" value={s.active ? 'false' : 'true'} />
					<Button type="submit" variant="ghost" size="sm" class="text-muted-foreground">
						{s.active ? 'sospendi' : 'riattiva'}
					</Button>
				</form>

				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={s.id} />
					<Button type="submit" variant="ghost" size="sm" class="text-muted-foreground hover:text-destructive">
						togli
					</Button>
				</form>
			</li>
		{/each}
	</ul>
</div>

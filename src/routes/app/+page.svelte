<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';

	let { data } = $props();
	let scanning = $state(false);
	let copied = $state('');

	// L'intenzione è il segnale che ordina la coda: chi compra adesso si vede da lontano, chi
	// sfoga resta leggibile ma non urla.
	const INTENT: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
		seeking_now: { label: 'cerca adesso', variant: 'default' },
		comparing: { label: 'sta confrontando', variant: 'secondary' },
		researching: { label: 'si informa', variant: 'outline' },
		venting: { label: 'sfoga', variant: 'outline' },
		none: { label: '—', variant: 'outline' }
	};

	const intentOf = (v: string) => INTENT[v] ?? INTENT.none;

	async function copy(id: string, text: string) {
		await navigator.clipboard.writeText(text);
		copied = id;
		setTimeout(() => (copied = ''), 1500);
	}

	async function scan() {
		scanning = true;
		try {
			await fetch(`/api/scan?brand=${data.brand.id}`, { method: 'POST' });
			await invalidateAll();
		} finally {
			scanning = false;
		}
	}
</script>

<header class="flex items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">{data.brand.name}</h1>
		<p class="text-muted-foreground mt-1 text-sm">
			{data.leads.length}
			{data.leads.length === 1 ? 'conversazione' : 'conversazioni'} dove hai qualcosa da dire
		</p>
	</div>
	<Button variant="outline" size="sm" onclick={scan} disabled={scanning}>
		{scanning ? 'cerco…' : 'cerca ora'}
	</Button>
</header>

{#if !data.leads.length}
	<Card.Root class="mt-10">
		<Card.Header>
			<Card.Title class="text-base">Niente in coda</Card.Title>
			<Card.Description class="text-pretty">
				Il silenzio è una risposta valida: vuol dire che oggi non c'era un thread in cui valesse la
				pena entrare. Un commento inutile costa più di un commento mancato.
			</Card.Description>
		</Card.Header>
	</Card.Root>
{/if}

<ul class="mt-8 flex flex-col gap-4">
	{#each data.leads as lead (lead.id)}
		{@const intent = intentOf(lead.intent)}
		<li>
			<Card.Root>
				<Card.Header>
					<div class="flex flex-wrap items-center gap-2">
						<Badge variant={intent.variant}>{intent.label}</Badge>
						<span class="text-muted-foreground text-xs">{lead.source_name}</span>
						<span class="text-muted-foreground text-xs">· rilevanza {lead.relevance}</span>
					</div>

					<Card.Title class="text-base leading-snug">
						<a
							href={lead.url}
							target="_blank"
							rel="noreferrer"
							class="hover:underline underline-offset-4"
						>
							{lead.title}
						</a>
					</Card.Title>
				</Card.Header>

				<Card.Content class="flex flex-col gap-3">
					<p class="bg-muted text-foreground rounded-md p-4 text-sm whitespace-pre-wrap">
						{lead.suggestion}
					</p>

					{#if lead.dm_draft}
						<details class="group">
							<summary
								class="text-muted-foreground hover:text-foreground cursor-pointer text-xs select-none"
							>
								e un DM, se preferisci in privato
							</summary>
							<p class="bg-muted text-foreground mt-2 rounded-md p-4 text-sm whitespace-pre-wrap">
								{lead.dm_draft}
							</p>
							{#if lead.dm_target}
								<a
									href={lead.dm_target}
									target="_blank"
									rel="noreferrer"
									class="text-muted-foreground hover:text-foreground mt-2 inline-block text-xs underline underline-offset-4"
								>
									apri il profilo
								</a>
							{/if}
						</details>
					{/if}
				</Card.Content>

				<Card.Footer class="gap-2">
					<Button size="sm" onclick={() => copy(lead.id, lead.suggestion)}>
						{copied === lead.id ? 'copiato' : 'copia il commento'}
					</Button>

					<form method="POST" action="?/done" use:enhance>
						<input type="hidden" name="id" value={lead.id} />
						<Button type="submit" size="sm" variant="outline">l'ho pubblicato</Button>
					</form>

					<form method="POST" action="?/ignore" use:enhance>
						<input type="hidden" name="id" value={lead.id} />
						<Button type="submit" size="sm" variant="ghost">ignora</Button>
					</form>
				</Card.Footer>
			</Card.Root>
		</li>
	{/each}
</ul>

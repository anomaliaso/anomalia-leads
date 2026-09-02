<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';

	let { data } = $props();
	let scanning = $state(false);
	let copied = $state('');
	let filter = $state<'tutti' | 'caldi'>('tutti');

	// L'intenzione è il segnale che ordina la coda: chi compra adesso si vede da lontano, chi
	// sfoga resta leggibile ma non urla.
	const INTENT: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
		seeking_now: { label: 'cerca adesso', variant: 'default' },
		comparing: { label: 'sta confrontando', variant: 'secondary' },
		researching: { label: 'si informa', variant: 'outline' },
		venting: { label: 'sfoga', variant: 'outline' },
		none: { label: '—', variant: 'outline' }
	};

	const HOT = ['seeking_now', 'comparing'];
	const intentOf = (v: string) => INTENT[v] ?? INTENT.none;

	const shown = $derived(
		filter === 'caldi' ? data.leads.filter((l) => HOT.includes(l.intent)) : data.leads
	);
	const hotCount = $derived(data.leads.filter((l) => HOT.includes(l.intent)).length);

	function since(iso: string | null): string {
		if (!iso) return '';
		const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
		if (m < 1) return 'adesso';
		if (m < 60) return `${m} min fa`;
		const h = Math.round(m / 60);
		return h < 24 ? `${h} h fa` : `${Math.round(h / 24)} g fa`;
	}

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

<div class="mx-auto max-w-2xl px-6 py-10">
	<header class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-xl font-semibold tracking-tight">
				{data.leads.length}
				{data.leads.length === 1 ? 'conversazione' : 'conversazioni'}
			</h1>
			<p class="text-muted-foreground mt-1 text-sm">
				{#if data.scan?.at}
					ultima ricerca {since(data.scan.at)}
				{:else}
					nessuna ricerca ancora
				{/if}
			</p>
		</div>

		<Button variant="outline" size="sm" onclick={scan} disabled={scanning}>
			{scanning ? 'cerco…' : 'cerca ora'}
		</Button>
	</header>

	{#if data.leads.length}
		<div class="mt-6 flex items-center gap-1">
			<button
				onclick={() => (filter = 'tutti')}
				class="rounded-md px-2.5 py-1 text-sm transition-colors {filter === 'tutti'
					? 'bg-muted text-foreground'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				Tutte {data.leads.length}
			</button>
			<button
				onclick={() => (filter = 'caldi')}
				class="rounded-md px-2.5 py-1 text-sm transition-colors {filter === 'caldi'
					? 'bg-muted text-foreground'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				Chi sta comprando {hotCount}
			</button>
		</div>
	{/if}

	{#if scanning}
		<Card.Root class="mt-6">
			<Card.Content class="text-muted-foreground py-6 text-sm">
				Sto guardando le sorgenti e giudicando quello che trovo. Ci vogliono pochi secondi.
			</Card.Content>
		</Card.Root>
	{:else if !data.leads.length}
		{#if data.scan?.broken}
			<!-- Se il giro non ha portato niente E qualcosa ha fallito, dire "il silenzio è una
			     risposta" sarebbe una bugia. -->
			<Card.Root class="border-destructive/40 mt-6">
				<Card.Header>
					<Card.Title class="text-base">La ricerca non è riuscita</Card.Title>
					<Card.Description class="text-pretty">
						L'ultimo giro non ha portato niente e {data.scan.failed}
						{data.scan.failed === 1 ? 'sorgente ha' : 'sorgenti hanno'} dato errore su {data.scan
							.total}: questa coda è vuota per un guasto, non perché non ci fosse niente da dire.
					</Card.Description>
				</Card.Header>
				{#if data.scan.error}
					<Card.Content>
						<p class="bg-muted text-muted-foreground rounded-md p-3 font-mono text-xs break-all">
							{data.scan.error}
						</p>
					</Card.Content>
				{/if}
			</Card.Root>
		{:else}
			<Card.Root class="mt-6">
				<Card.Header>
					<Card.Title class="text-base">Niente in coda</Card.Title>
					<Card.Description class="text-pretty">
						Il silenzio è una risposta valida: vuol dire che oggi non c'era un thread in cui valesse
						la pena entrare. Un commento inutile costa più di un commento mancato.
					</Card.Description>
				</Card.Header>
			</Card.Root>
		{/if}
	{/if}

	<ul class="mt-6 flex flex-col gap-4">
		{#each shown as lead (lead.id)}
			{@const intent = intentOf(lead.intent)}
			<li>
				<Card.Root>
					<Card.Header>
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<Badge variant={intent.variant}>{intent.label}</Badge>
							<span class="text-muted-foreground text-xs">{lead.source_name}</span>
							<span class="text-muted-foreground/60 text-xs">·</span>
							<span class="text-muted-foreground text-xs">rilevanza {lead.relevance}</span>
							<span class="text-muted-foreground/60 text-xs">·</span>
							<span class="text-muted-foreground text-xs">{since(lead.created_at)}</span>
						</div>

						<Card.Title class="text-base leading-snug">
							<a
								href={lead.url}
								target="_blank"
								rel="noreferrer"
								class="underline-offset-4 hover:underline"
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
							<details>
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

						<form method="POST" action="?/ignore" use:enhance class="ml-auto">
							<input type="hidden" name="id" value={lead.id} />
							<Button
								type="submit"
								size="sm"
								variant="ghost"
								class="text-muted-foreground hover:text-destructive"
							>
								ignora
							</Button>
						</form>
					</Card.Footer>
				</Card.Root>
			</li>
		{/each}
	</ul>
</div>

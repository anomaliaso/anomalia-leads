<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';

	// I quattro passi sono il prodotto: chi li legge sa già se gli serve.
	const STEPS = [
		{ n: '01', t: 'Dici cosa vendi', d: 'Una descrizione, non un questionario. Da lì deduciamo i posti dove ne parlano davvero i tuoi compratori.' },
		{ n: '02', t: 'Guardiamo le conversazioni', d: 'Reddit, Threads, X e LinkedIn. Ogni giorno, senza che tu apra niente.' },
		{ n: '03', t: 'Le ordiniamo per intenzione', d: 'Non per rilevanza: per quanto chi scrive è vicino a comprare. Sono due cose diverse.' },
		{ n: '04', t: 'Ti diamo la risposta', d: 'Scritta per quel thread, nella sua lingua. La incolli tu, col tuo account.' }
	];

	const PLANS = [
		{ name: 'Free', price: '0', unit: '', lines: ['8 sorgenti', '3 bozze al giorno', 'Reddit'], cta: 'Inizia', variant: 'outline' as const },
		{ name: 'Starter', price: '29', unit: '/mese', lines: ['20 sorgenti', '10 bozze al giorno', 'Reddit, Threads, X'], cta: 'Prova Starter', variant: 'default' as const, featured: true },
		{ name: 'Pro', price: '99', unit: '/mese', lines: ['60 sorgenti', '30 bozze al giorno', 'Tutte, LinkedIn incluso'], cta: 'Prova Pro', variant: 'outline' as const }
	];

	const FAQ = [
		{
			q: 'Pubblicate voi i commenti?',
			a: 'No, mai. Ti diamo la bozza, la incolli tu dal tuo account. Gli account che automatizzano le risposte vengono bannati: è la ragione per cui questa scelta non è negoziabile.'
		},
		{
			q: 'In che differisce da un alert su parole chiave?',
			a: 'Un alert ti dice che qualcuno ha nominato una parola. Noi ti diciamo se quella persona sta comprando, e cosa rispondere. Chi chiede "quale strumento usate" e chi sbraita sul tema fanno scattare lo stesso alert e non sono lo stesso lead.'
		},
		{
			q: 'Rischio di infastidire le persone?',
			a: 'Il freno è nel prodotto, non nelle buone intenzioni: una persona riceve un messaggio una volta sola, da chiunque usi la piattaforma. E se non c\'è niente da aggiungere al thread, la bozza non viene scritta.'
		},
		{
			q: 'Come so se funziona?',
			a: 'Dopo 48 ore ritroviamo il commento nel thread e registriamo com\'è andata: upvote, risposte, o rimozione. Non è un\'impressione, è un dato.'
		}
	];
</script>

<svelte:head>
	<title>anomalia-leads — le conversazioni dove hai qualcosa da dire</title>
	<meta
		name="description"
		content="Trova su Reddit, Threads, X e LinkedIn chi sta cercando quello che vendi, ordinato per intenzione d'acquisto, con la risposta già scritta."
	/>
</svelte:head>

<header class="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
	<span class="font-medium tracking-tight">anomalia<span class="text-muted-foreground">/leads</span></span>
	<Button href="/login" variant="ghost" size="sm">Entra</Button>
</header>

<!-- Hero -->
<section class="mx-auto max-w-5xl px-6 pt-16 pb-24">
	<Badge variant="outline" class="mb-6">Reddit · Threads · X · LinkedIn</Badge>

	<h1 class="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
		C'è già chi sta cercando quello che vendi
	</h1>

	<p class="text-muted-foreground mt-6 max-w-xl text-lg text-pretty">
		Lo scrive in un thread, oggi, e tu non lo vedi. Noi lo troviamo, ti diciamo quanto è vicino a
		comprare, e ti diamo la risposta già scritta per quella conversazione.
	</p>

	<div class="mt-10 flex flex-wrap items-center gap-3">
		<Button href="/login" size="lg">Provalo gratis</Button>
		<span class="text-muted-foreground text-sm">Nessuna carta. Il primo scan parte subito.</span>
	</div>
</section>

<!-- L'artefatto: è la cosa più convincente che abbiamo, quindi si vede subito -->
<section class="border-border bg-muted/30 border-y">
	<div class="mx-auto max-w-5xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">Questo è quello che ricevi</h2>
		<p class="text-muted-foreground mt-2 max-w-xl text-pretty">
			Non un avviso che qualcuno ha nominato una parola. Una conversazione, un giudizio su chi la
			scrive, e il commento pronto.
		</p>

		<Card.Root class="mt-8 max-w-2xl">
			<Card.Header>
				<div class="flex flex-wrap items-center gap-2">
					<Badge>cerca adesso</Badge>
					<span class="text-muted-foreground text-xs">r/smallbusiness</span>
					<span class="text-muted-foreground text-xs">· rilevanza 88</span>
				</div>
				<Card.Title class="text-base leading-snug">
					Any tool to stop chasing patients for appointment reminders?
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="bg-muted text-foreground rounded-md p-4 text-sm whitespace-pre-wrap">
					We ran the same manual chase for two years. What actually moved the needle wasn't the
					reminder tool itself — it was sending them 48h out instead of 24h, which cut no-shows
					roughly in half before we automated anything. If you do want it off your plate,
					disclosure: I work on one at https://esempio.com — but fix the timing first, it's free.
				</p>
			</Card.Content>
			<Card.Footer class="gap-2">
				<Button size="sm">copia il commento</Button>
				<Button size="sm" variant="outline">l'ho pubblicato</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</section>

<!-- Come funziona -->
<section class="mx-auto max-w-5xl px-6 py-20">
	<h2 class="text-2xl font-semibold tracking-tight">Come funziona</h2>
	<ol class="mt-8 grid gap-8 sm:grid-cols-2">
		{#each STEPS as s (s.n)}
			<li>
				<span class="text-muted-foreground font-mono text-xs">{s.n}</span>
				<h3 class="mt-2 font-medium">{s.t}</h3>
				<p class="text-muted-foreground mt-1 text-sm text-pretty">{s.d}</p>
			</li>
		{/each}
	</ol>
</section>

<!-- I principi: sono differenziatori veri, non slogan -->
<section class="border-border border-t">
	<div class="mx-auto max-w-5xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">Quattro scelte che ci distinguono</h2>
		<div class="mt-8 grid gap-6 sm:grid-cols-2">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">L'intenzione non è la rilevanza</Card.Title>
					<Card.Description class="text-pretty">
						Chi chiede <em class="not-italic">quale strumento usate</em> e chi sbraita sul tema hanno
						la stessa rilevanza e non sono lo stesso lead. Ordiniamo per il primo.
					</Card.Description>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Una persona, un tocco</Card.Title>
					<Card.Description class="text-pretty">
						Il limite è globale alla piattaforma, non al tuo account: chi ha già ricevuto un
						messaggio non viene riproposto a nessun altro. Mai.
					</Card.Description>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Il silenzio è una risposta</Card.Title>
					<Card.Description class="text-pretty">
						Se sotto non c'è niente da aggiungere a quello che il thread ha già, la bozza non si
						scrive. Un commento inutile costa più di un commento mancato.
					</Card.Description>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Gli esiti si misurano</Card.Title>
					<Card.Description class="text-pretty">
						Dopo 48 ore ritroviamo il commento nel thread: upvote, risposte, o rimozione. Sai cosa
						ha funzionato, non cosa ti sembra.
					</Card.Description>
				</Card.Header>
			</Card.Root>
		</div>
	</div>
</section>

<!-- Prezzi -->
<section class="border-border bg-muted/30 border-t">
	<div class="mx-auto max-w-5xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">Prezzi</h2>
		<p class="text-muted-foreground mt-2 text-sm">
			Si paga per quante conversazioni guardi e quante bozze ricevi. Non per utenti.
		</p>

		<div class="mt-8 grid gap-4 sm:grid-cols-3">
			{#each PLANS as p (p.name)}
				<Card.Root class={p.featured ? 'border-foreground/25' : ''}>
					<Card.Header>
						<Card.Title class="text-base">{p.name}</Card.Title>
						<p class="mt-2">
							<span class="text-3xl font-semibold tracking-tight">€{p.price}</span>
							<span class="text-muted-foreground text-sm">{p.unit}</span>
						</p>
					</Card.Header>
					<Card.Content>
						<ul class="text-muted-foreground space-y-2 text-sm">
							{#each p.lines as line (line)}
								<li>{line}</li>
							{/each}
						</ul>
					</Card.Content>
					<Card.Footer>
						<Button href="/login" variant={p.variant} class="w-full">{p.cta}</Button>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	</div>
</section>

<!-- Domande -->
<section class="border-border border-t">
	<div class="mx-auto max-w-3xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">Domande</h2>
		<div class="divide-border mt-8 divide-y">
			{#each FAQ as f (f.q)}
				<details class="group py-4">
					<summary
						class="hover:text-muted-foreground cursor-pointer list-none font-medium select-none"
					>
						{f.q}
					</summary>
					<p class="text-muted-foreground mt-3 text-sm text-pretty">{f.a}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<!-- Chiusura -->
<section class="border-border border-t">
	<div class="mx-auto max-w-5xl px-6 py-24 text-center">
		<h2 class="text-3xl font-semibold tracking-tight text-balance">
			La conversazione che ti serve è già aperta
		</h2>
		<p class="text-muted-foreground mx-auto mt-4 max-w-md text-pretty">
			Scrivi cosa vendi. Il primo scan parte subito e in un minuto sai se qui dentro c'è qualcosa
			per te.
		</p>
		<Button href="/login" size="lg" class="mt-8">Provalo gratis</Button>
	</div>
</section>

<footer class="border-border border-t">
	<div
		class="text-muted-foreground mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs"
	>
		<span>anomalia/leads</span>
		<span>
			Motore condiviso con
			<a href="https://github.com/anomaliaso/anomalia" class="hover:text-foreground underline underline-offset-4">
				Anomalia
			</a>
			· Apache-2.0
		</span>
	</div>
</footer>

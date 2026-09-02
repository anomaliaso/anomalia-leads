<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import BrandMark from '$lib/components/BrandMark.svelte';

	const STEPS = [
		{ n: '01', t: 'Dici cosa vendi', d: 'Una descrizione, non un questionario. Da lì deduciamo i posti dove ne parlano i tuoi compratori.' },
		{ n: '02', t: 'Guardiamo le conversazioni', d: 'Reddit, Threads, X e LinkedIn. Ogni giorno, senza che tu apra niente.' },
		{ n: '03', t: 'Le ordiniamo per intenzione', d: 'Non per rilevanza: per quanto chi scrive è vicino a comprare. Sono due cose diverse.' },
		{ n: '04', t: 'Ti diamo la risposta', d: 'Scritta per quel thread, nella sua lingua. La incolli tu, col tuo account.' }
	];

	const PLANS = [
		{ name: 'Free', price: '0', unit: '', lines: ['30 bozze al mese', '5 sorgenti', 'Reddit'], cta: 'Inizia gratis', variant: 'outline' as const },
		{ name: 'Starter', price: '10', unit: '/mese', lines: ['150 bozze al mese', '15 sorgenti', 'Reddit e Threads'], cta: 'Prova Starter', variant: 'default' as const, featured: true },
		{ name: 'Pro', price: '30', unit: '/mese', lines: ['600 bozze al mese', '40 sorgenti', 'Anche X e LinkedIn', 'Esiti misurati'], cta: 'Prova Pro', variant: 'outline' as const },
		{ name: 'Agency', price: '99', unit: '/mese', lines: ['2.500 bozze al mese', 'Sorgenti illimitate', 'Più brand', 'API'], cta: 'Prova Agency', variant: 'outline' as const }
	];

	const FAQ = [
		{
			q: 'Pubblicate voi i commenti?',
			a: 'No, mai. Ti diamo la bozza, la incolli tu dal tuo account. Gli account che automatizzano le risposte vengono bannati: è la ragione per cui questa scelta non è negoziabile.'
		},
		{
			q: 'In cosa differisce da un alert su parole chiave?',
			a: 'Un alert ti dice che qualcuno ha nominato una parola. Noi ti diciamo se quella persona sta comprando, e cosa rispondere. Chi chiede "quale strumento usate" e chi sbraita sul tema fanno scattare lo stesso alert e non sono lo stesso lead.'
		},
		{
			q: 'Rischio di infastidire le persone?',
			a: 'Il freno è nel prodotto, non nelle buone intenzioni: una persona riceve un messaggio una volta sola, da chiunque usi la piattaforma. E se non c\'è niente da aggiungere al thread, la bozza non viene scritta.'
		},
		{
			q: 'Come so se funziona?',
			a: 'Dopo 48 ore ritroviamo il commento nel thread e registriamo com\'è andata: upvote, risposte, o rimozione. Non è un\'impressione, è un dato.'
		},
		{
			q: 'Perché contate le bozze e non le menzioni?',
			a: 'Perché le menzioni non sono il valore. Tutta la categoria vende tetti di parole chiave, e ti fa pagare uguale un mese in cui non ha trovato niente. Noi contiamo quello che ti consegniamo.'
		}
	];
</script>

<svelte:head>
	<title>anomalia/leads — le conversazioni dove hai qualcosa da dire</title>
	<meta
		name="description"
		content="Trova su Reddit, Threads, X e LinkedIn chi sta cercando quello che vendi, ordinato per intenzione d'acquisto, con la risposta già scritta."
	/>
</svelte:head>

<header class="border-border/60 border-b">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<a href="/" class="flex items-center gap-2" aria-label="anomalia/leads">
			<BrandMark height={16} />
			<span class="font-medium tracking-tight">anomalia<span class="text-muted-foreground">/leads</span></span>
		</a>
		<div class="flex items-center gap-1">
			<Button href="#prezzi" variant="ghost" size="sm">Prezzi</Button>
			<Button href="/login" size="sm">Entra</Button>
		</div>
	</div>
</header>

<!-- Hero: la promessa e l'artefatto insieme. Farlo scorrere sarebbe l'errore — l'argomento di
     questo prodotto è "guarda cosa ricevi", non una descrizione di cosa fa. -->
<section class="mx-auto max-w-6xl px-6 pt-20 pb-24">
	<div class="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
		<div>
			<Badge variant="outline" class="mb-6 font-normal">Reddit · Threads · X · LinkedIn</Badge>

			<h1 class="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
				C'è già chi sta cercando quello che vendi
			</h1>

			<p class="text-muted-foreground mt-6 max-w-lg text-lg text-pretty">
				Lo scrive in un thread, oggi, e tu non lo vedi. Noi lo troviamo, ti diciamo quanto è vicino
				a comprare, e ti diamo la risposta già scritta per quella conversazione.
			</p>

			<div class="mt-9 flex flex-wrap items-center gap-3">
				<Button href="/login" size="lg">Provalo gratis</Button>
				<span class="text-muted-foreground text-sm">30 bozze al mese, per sempre. Nessuna carta.</span>
			</div>

			<p class="text-muted-foreground/80 mt-6 max-w-lg text-sm text-pretty">
				Il commento lo incolli tu, col tuo account. Non pubblichiamo niente al posto tuo — è la
				ragione per cui il tuo account sopravvive.
			</p>
		</div>

		<Card.Root class="shadow-sm">
			<Card.Header>
				<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
					<Badge>cerca adesso</Badge>
					<span class="text-muted-foreground text-xs">r/smallbusiness</span>
					<span class="text-muted-foreground/60 text-xs">·</span>
					<span class="text-muted-foreground text-xs">rilevanza 88</span>
					<span class="text-muted-foreground/60 text-xs">·</span>
					<span class="text-muted-foreground text-xs">2 h fa</span>
				</div>
				<Card.Title class="text-base leading-snug">
					Any tool to stop chasing patients for appointment reminders?
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="bg-muted text-foreground rounded-md p-4 text-sm leading-relaxed whitespace-pre-wrap">
					We ran the same manual chase for two years. What actually moved the needle wasn't the
					reminder tool itself — it was sending them 48h out instead of 24h, which cut no-shows
					roughly in half before we automated anything. If you do want it off your plate,
					disclosure: I work on one at esempio.com — but fix the timing first, it's free.
				</p>
			</Card.Content>
			<Card.Footer class="gap-2">
				<Button size="sm">copia il commento</Button>
				<Button size="sm" variant="outline">l'ho pubblicato</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</section>

<!-- Il contrasto: è il modo più rapido di spiegare la differenza con un alert -->
<section class="border-border bg-muted/30 border-y">
	<div class="mx-auto max-w-6xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">La differenza, in due righe</h2>

		<div class="mt-8 grid gap-4 md:grid-cols-2">
			<Card.Root class="border-dashed">
				<Card.Header>
					<Card.Description class="text-xs tracking-wide uppercase">Un alert su parole chiave</Card.Description>
					<Card.Title class="text-muted-foreground text-base leading-snug font-normal">
						«La parola <em class="not-italic">gestionale</em> è comparsa in r/smallbusiness.»
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<ul class="text-muted-foreground space-y-1.5 text-sm">
						<li>Non sa se chi scrive sta comprando</li>
						<li>Non sa se tu hai qualcosa da dire</li>
						<li>La risposta la scrivi tu, da zero</li>
						<li>Paghi uguale nei mesi vuoti</li>
					</ul>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-foreground/25">
				<Card.Header>
					<Card.Description class="text-xs tracking-wide uppercase">anomalia/leads</Card.Description>
					<Card.Title class="text-base leading-snug font-normal">
						«Questa persona <em class="not-italic">sta cercando adesso</em>. Ecco cosa rispondere.»
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<ul class="space-y-1.5 text-sm">
						<li>Ordinato per intenzione d'acquisto</li>
						<li>Se non hai niente da aggiungere, tace</li>
						<li>La bozza è pronta, nella lingua del thread</li>
						<li>Paghi le bozze consegnate</li>
					</ul>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</section>

<!-- Come funziona -->
<section class="mx-auto max-w-6xl px-6 py-20">
	<h2 class="text-2xl font-semibold tracking-tight">Come funziona</h2>
	<ol class="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
		{#each STEPS as s (s.n)}
			<li class="border-border border-t pt-4">
				<span class="text-muted-foreground/70 font-mono text-xs">{s.n}</span>
				<h3 class="mt-2 font-medium">{s.t}</h3>
				<p class="text-muted-foreground mt-1.5 text-sm text-pretty">{s.d}</p>
			</li>
		{/each}
	</ol>
</section>

<!-- I principi -->
<section class="border-border border-t">
	<div class="mx-auto max-w-6xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">Quattro scelte che ci distinguono</h2>
		<p class="text-muted-foreground mt-2 max-w-2xl text-pretty">
			Tre delle quattro sono freni. È deliberato: in questa categoria quello che non fai conta più
			di quello che fai.
		</p>

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
<section id="prezzi" class="border-border bg-muted/30 scroll-mt-4 border-t">
	<div class="mx-auto max-w-6xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">Prezzi</h2>
		<p class="text-muted-foreground mt-2 max-w-2xl text-pretty">
			Si paga per le bozze che ricevi, non per le parole chiave che monitori. Un mese silenzioso ti
			costa meno, invece che uguale.
		</p>

		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each PLANS as p (p.name)}
				<Card.Root class="flex flex-col {p.featured ? 'border-foreground/30 shadow-sm' : ''}">
					<Card.Header>
						<div class="flex items-center gap-2">
							<Card.Title class="text-base">{p.name}</Card.Title>
							{#if p.featured}
								<Badge variant="secondary" class="font-normal">consigliato</Badge>
							{/if}
						</div>
						<p class="mt-2">
							<span class="text-3xl font-semibold tracking-tight">€{p.price}</span>
							<span class="text-muted-foreground text-sm">{p.unit}</span>
						</p>
					</Card.Header>
					<Card.Content class="flex-1">
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

		<p class="text-muted-foreground mt-8 max-w-2xl text-sm text-pretty">
			<strong class="text-foreground font-medium">Trenta giorni.</strong> Se in un mese non ricevi una
			conversazione che valga la pena di rispondere, non paghi. Possiamo permettercelo proprio perché
			il prodotto non scrive bozze inutili per gonfiare i numeri.
		</p>
	</div>
</section>

<!-- Domande -->
<section class="border-border border-t">
	<div class="mx-auto max-w-3xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">Domande</h2>
		<div class="divide-border mt-8 divide-y">
			{#each FAQ as f (f.q)}
				<details class="group py-4">
					<summary class="hover:text-muted-foreground cursor-pointer list-none font-medium select-none">
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
	<div class="mx-auto max-w-6xl px-6 py-24 text-center">
		<h2 class="text-3xl font-semibold tracking-tight text-balance">
			La conversazione che ti serve è già aperta
		</h2>
		<p class="text-muted-foreground mx-auto mt-4 max-w-md text-pretty">
			Scrivi cosa vendi. La prima ricerca parte subito e in un minuto sai se qui dentro c'è qualcosa
			per te.
		</p>
		<Button href="/login" size="lg" class="mt-8">Provalo gratis</Button>
		<p class="text-muted-foreground mt-4 text-sm">30 bozze al mese, per sempre. Nessuna carta.</p>
	</div>
</section>

<footer class="border-border border-t">
	<div
		class="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs"
	>
		<span class="flex items-center gap-2">
			<BrandMark height={12} />
			anomalia/leads
		</span>
		<span>
			Motore condiviso con
			<a href="https://github.com/anomaliaso/anomalia" class="hover:text-foreground underline underline-offset-4">
				Anomalia
			</a>
			· Apache-2.0 ·
			<a href="https://github.com/anomaliaso/anomalia-leads" class="hover:text-foreground underline underline-offset-4">
				codice aperto
			</a>
		</span>
	</div>
</footer>

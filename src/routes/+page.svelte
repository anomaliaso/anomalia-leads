<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import { PLANS } from '$lib/plans';

	const STEPS = [
		{ n: '01', t: 'Tell us what you sell', d: 'A description, not a questionnaire. From it we work out where your buyers actually talk.' },
		{ n: '02', t: 'We watch the conversations', d: 'Reddit, Threads, X and LinkedIn. Every day, without you opening anything.' },
		{ n: '03', t: 'We rank them by intent', d: 'Not by relevance: by how close the writer is to buying. Those are two different things.' },
		{ n: '04', t: 'You get the reply', d: "Written for that thread, in its language. You paste it, from your own account." }
	];

	const FAQ = [
		{
			q: 'Do you post the comments for me?',
			a: 'Never. We give you the draft, you paste it from your own account. Accounts that automate replies get banned — which is why this one is not negotiable.'
		},
		{
			q: 'How is this different from a keyword alert?',
			a: 'An alert tells you someone said a word. We tell you whether that person is buying, and what to say back. Someone asking "which tool do you use" and someone ranting about the topic trigger the same alert and are not the same lead.'
		},
		{
			q: 'Will I annoy people?',
			a: 'The brake is in the product, not in good intentions: a person gets messaged once, by anyone on the platform. And if there is nothing to add to the thread, no draft gets written.'
		},
		{
			q: 'How do I know it works?',
			a: 'After 48 hours we find the comment again in the thread and record what happened: upvotes, replies, or removal. That is data, not an impression.'
		},
		{
			q: 'Why count drafts instead of mentions?',
			a: 'Because mentions are not the value. The whole category sells keyword caps and charges you the same in a month where it found nothing. We count what we hand you.'
		}
	];
</script>

<svelte:head>
	<title>anomalia/leads — the conversations where you have something to say</title>
	<meta
		name="description"
		content="Find the people on Reddit, Threads, X and LinkedIn who are looking for what you sell, ranked by buying intent, with the reply already written."
	/>
</svelte:head>

<header class="border-border/60 border-b">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<a href="/" class="flex items-center gap-2" aria-label="anomalia/leads">
			<BrandMark height={16} />
			<span class="font-medium tracking-tight">anomalia<span class="text-muted-foreground">/leads</span></span>
		</a>
		<div class="flex items-center gap-1">
			<Button href="#pricing" variant="ghost" size="sm">Pricing</Button>
			<Button href="/login" size="sm">Sign in</Button>
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
				Someone is already looking for what you sell
			</h1>

			<p class="text-muted-foreground mt-6 max-w-lg text-lg text-pretty">
				They are writing it in a thread today, and you cannot see it. We find it, tell you how close
				they are to buying, and hand you the reply already written for that conversation.
			</p>

			<div class="mt-9 flex flex-wrap items-center gap-3">
				<Button href="/login" size="lg">Try it free</Button>
				<span class="text-muted-foreground text-sm">30 drafts a month, forever. No card.</span>
			</div>

			<p class="text-muted-foreground/80 mt-6 max-w-lg text-sm text-pretty">
				You paste the comment, from your own account. We never post anything for you — that is the
				reason your account survives.
			</p>
		</div>

		<Card.Root class="shadow-sm">
			<Card.Header>
				<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
					<Badge>buying now</Badge>
					<span class="text-muted-foreground text-xs">r/smallbusiness</span>
					<span class="text-muted-foreground/60 text-xs">·</span>
					<span class="text-muted-foreground text-xs">relevance 88</span>
					<span class="text-muted-foreground/60 text-xs">·</span>
					<span class="text-muted-foreground text-xs">2 h ago</span>
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
					disclosure: I work on one at example.com — but fix the timing first, it's free.
				</p>
			</Card.Content>
			<Card.Footer class="gap-2">
				<Button size="sm">copy the comment</Button>
				<Button size="sm" variant="outline">I posted it</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</section>

<!-- Il contrasto: è il modo più rapido di spiegare la differenza con un alert -->
<section class="border-border bg-muted/30 border-y">
	<div class="mx-auto max-w-6xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">The difference, in two lines</h2>

		<div class="mt-8 grid gap-4 md:grid-cols-2">
			<Card.Root class="border-dashed">
				<Card.Header>
					<Card.Description class="text-xs tracking-wide uppercase">A keyword alert</Card.Description>
					<Card.Title class="text-muted-foreground text-base leading-snug font-normal">
						“The word <em class="not-italic">scheduling</em> appeared in r/smallbusiness.”
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<ul class="text-muted-foreground space-y-1.5 text-sm">
						<li>Does not know if the writer is buying</li>
						<li>Does not know if you have anything to say</li>
						<li>You write the reply, from scratch</li>
						<li>You pay the same in empty months</li>
					</ul>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-foreground/25">
				<Card.Header>
					<Card.Description class="text-xs tracking-wide uppercase">anomalia/leads</Card.Description>
					<Card.Title class="text-base leading-snug font-normal">
						“This person is <em class="not-italic">buying now</em>. Here is what to say.”
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<ul class="space-y-1.5 text-sm">
						<li>Ranked by buying intent</li>
						<li>If you have nothing to add, it stays quiet</li>
						<li>The draft is ready, in the thread's language</li>
						<li>You pay for drafts delivered</li>
					</ul>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</section>

<!-- Come funziona -->
<section class="mx-auto max-w-6xl px-6 py-20">
	<h2 class="text-2xl font-semibold tracking-tight">How it works</h2>
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
		<h2 class="text-2xl font-semibold tracking-tight">Four choices that set us apart</h2>
		<p class="text-muted-foreground mt-2 max-w-2xl text-pretty">
			Three of the four are brakes. That is deliberate: in this category what you refuse to do
			matters more than what you do.
		</p>

		<div class="mt-8 grid gap-6 sm:grid-cols-2">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Intent is not relevance</Card.Title>
					<Card.Description class="text-pretty">
						Someone asking <em class="not-italic">which tool do you use</em> and someone ranting about
						the topic score the same relevance and are not the same lead. We rank for the first.
					</Card.Description>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">One person, one touch</Card.Title>
					<Card.Description class="text-pretty">
						The cap is global to the platform, not to your account: someone who has already been
						messaged is never surfaced to anyone else. Ever.
					</Card.Description>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Silence is an answer</Card.Title>
					<Card.Description class="text-pretty">
						If there is nothing to add beyond what the thread already has, no draft is written. A
						useless comment costs more than a missed one.
					</Card.Description>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Outcomes get measured</Card.Title>
					<Card.Description class="text-pretty">
						After 48 hours we find the comment again in the thread: upvotes, replies, or removal.
						You know what worked, not what felt like it did.
					</Card.Description>
				</Card.Header>
			</Card.Root>
		</div>
	</div>
</section>

<!-- Prezzi -->
<section id="pricing" class="border-border bg-muted/30 scroll-mt-4 border-t">
	<div class="mx-auto max-w-6xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">Pricing</h2>
		<p class="text-muted-foreground mt-2 max-w-2xl text-pretty">
			You pay for the drafts you receive, not for the keywords you monitor. A quiet month costs you
			less, instead of the same.
		</p>

		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each PLANS as p (p.id)}
				<Card.Root class="flex flex-col {p.featured ? 'border-foreground/30 shadow-sm' : ''}">
					<Card.Header>
						<div class="flex items-center gap-2">
							<Card.Title class="text-base">{p.name}</Card.Title>
							{#if p.featured}
								<Badge variant="secondary" class="font-normal">recommended</Badge>
							{/if}
						</div>
						<p class="mt-2 flex items-baseline gap-2">
							<span class="text-3xl font-semibold tracking-tight">€{p.eur}</span>
							{#if p.eur > 0}
								<span class="text-muted-foreground text-sm">/ ${p.usd} per month</span>
							{/if}
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
						<Button href="/login" variant={p.featured ? 'default' : 'outline'} class="w-full">
							{p.cta}
						</Button>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>

		<p class="text-muted-foreground mt-8 max-w-2xl text-sm text-pretty">
			<strong class="text-foreground font-medium">Thirty days.</strong> If a month goes by without a
			single conversation worth answering, you do not pay. We can offer that precisely because the
			product does not write filler drafts to inflate a number.
		</p>
	</div>
</section>

<!-- Domande -->
<section class="border-border border-t">
	<div class="mx-auto max-w-3xl px-6 py-20">
		<h2 class="text-2xl font-semibold tracking-tight">Questions</h2>
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
			The conversation you need is already open
		</h2>
		<p class="text-muted-foreground mx-auto mt-4 max-w-md text-pretty">
			Tell us what you sell. The first search runs straight away, and in a minute you know whether
			there is anything in here for you.
		</p>
		<Button href="/login" size="lg" class="mt-8">Try it free</Button>
		<p class="text-muted-foreground mt-4 text-sm">30 drafts a month, forever. No card.</p>
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
			Engine shared with
			<a href="https://github.com/anomaliaso/anomalia" class="hover:text-foreground underline underline-offset-4">
				Anomalia
			</a>
			· Apache-2.0 ·
			<a href="https://github.com/anomaliaso/anomalia-leads" class="hover:text-foreground underline underline-offset-4">
				open source
			</a>
		</span>
	</div>
</footer>

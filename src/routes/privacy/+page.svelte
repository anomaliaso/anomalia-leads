<script lang="ts">
	import BrandMark from '$lib/components/BrandMark.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<svelte:head>
	<title>Privacy Policy — anomalia/leads</title>
	<meta name="robots" content="index" />
</svelte:head>

<header class="border-border/60 border-b">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<a href="/" class="flex items-center gap-2" aria-label="anomalia/leads">
			<BrandMark height={16} />
			<span class="font-medium tracking-tight">anomalia<span class="text-muted-foreground">/leads</span></span>
		</a>
		<Button href="/login" size="sm">Sign in</Button>
	</div>
</header>

<article class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="font-semibold tracking-tight text-3xl">Privacy Policy</h1>
	<p class="text-muted-foreground mt-2 text-sm">Last updated 2 September 2026.</p>

	<div class="mt-10 space-y-10 text-sm leading-relaxed">
		<section>
			<h2 class="text-foreground text-base font-medium">What this service does with data</h2>
			<p class="text-muted-foreground mt-2 text-pretty">
				anomalia/leads reads public conversations on Reddit, Threads, X and LinkedIn, judges which
				ones a customer could genuinely contribute to, and writes a draft reply. It never posts
				anything: the customer copies the draft and publishes it from their own account.
			</p>
		</section>

		<section>
			<h2 class="text-foreground text-base font-medium">Data about you, as a customer</h2>
			<ul class="text-muted-foreground mt-2 space-y-2">
				<li>
					<strong class="text-foreground font-medium">Your account.</strong> Email address, and a password
					hash if you did not sign in with GitHub. Handled by Supabase Auth; we never see your password.
				</li>
				<li>
					<strong class="text-foreground font-medium">Your brand.</strong> The name, description and
					website you enter. The description is sent to a language model to work out which communities
					to watch.
				</li>
				<li>
					<strong class="text-foreground font-medium">Your sources.</strong> The subreddits and searches
					configured for each brand.
				</li>
				<li>
					<strong class="text-foreground font-medium">Usage.</strong> When a search ran, how many sources
					answered, how many failed and the last error, so an empty queue can be told apart from a broken
					one.
				</li>
			</ul>
		</section>

		<section>
			<h2 class="text-foreground text-base font-medium">Data about people who did not sign up</h2>
			<p class="text-muted-foreground mt-2 text-pretty">
				To do its job the service stores parts of public posts written by people who are not our
				customers: the post's title, its link, a short excerpt, the platform, and the author's public
				handle. This is public content, collected to decide whether a reply would be useful and to
				write one for it.
			</p>
			<p class="text-muted-foreground mt-3 text-pretty">
				It is deleted on a schedule, not kept indefinitely:
			</p>
			<ul class="text-muted-foreground mt-2 space-y-1.5">
				<li><strong class="text-foreground font-medium">14 days</strong> — the excerpt derived from the post, which is the most sensitive part.</li>
				<li><strong class="text-foreground font-medium">90 days</strong> — the whole record, for conversations nobody ever replied to.</li>
				<li><strong class="text-foreground font-medium">12 months</strong> — what happened to a comment that was published (upvotes, replies, removal).</li>
				<li><strong class="text-foreground font-medium">90 days</strong> — search telemetry.</li>
			</ul>
		</section>

		<section>
			<h2 class="text-foreground text-base font-medium">The do-not-contact list</h2>
			<p class="text-muted-foreground mt-2 text-pretty">
				We keep one list of platform handles that must never be surfaced again. It is deliberately
				shared across every customer of the service, not per customer: someone who asked not to be
				contacted, or who has already been messaged once, is not offered to anyone else. Keeping that
				list is what makes the promise enforceable.
			</p>
			<p class="text-muted-foreground mt-3 text-pretty">
				It stores only the platform and the public handle, plus why the entry exists. An entry is
				added when a person replies asking to be left alone, when a customer marks them as
				ignored, or when the phrase is detected in the thread. Every direct message draft carries an
				opt-out line, and replying “stop” adds the sender to the list.
			</p>
		</section>

		<section>
			<h2 class="text-foreground text-base font-medium">Who else processes this data</h2>
			<ul class="text-muted-foreground mt-2 space-y-1.5">
				<li><strong class="text-foreground font-medium">Supabase</strong> — database, authentication and hosting of your account data.</li>
				<li><strong class="text-foreground font-medium">Vercel</strong> — application hosting.</li>
				<li><strong class="text-foreground font-medium">OpenRouter</strong> — routes prompts to the language model that judges conversations and writes drafts.</li>
				<li><strong class="text-foreground font-medium">ScrapeCreators</strong> — collects the public posts from the platforms.</li>
			</ul>
			<p class="text-muted-foreground mt-3 text-pretty">
				We do not sell data, and we do not use it to train models of our own.
			</p>
		</section>

		<section>
			<h2 class="text-foreground text-base font-medium">Your rights</h2>
			<p class="text-muted-foreground mt-2 text-pretty">
				You can ask for a copy of your data, correct it, or have it deleted. Deleting your account
				removes your brands, sources and queue. Entries in the do-not-contact list are the one
				exception: removing them would undo somebody else's request not to be contacted, so they
				stay.
			</p>
			<p class="text-muted-foreground mt-3 text-pretty">
				If you are the author of a post we stored and want it removed, write to us and we will
				delete it and add your handle to the do-not-contact list.
			</p>
		</section>

		<section>
			<h2 class="text-foreground text-base font-medium">Contact</h2>
			<p class="text-muted-foreground mt-2">
				<a href="mailto:privacy@anomalia.so" class="hover:text-foreground underline underline-offset-4">privacy@anomalia.so</a>
			</p>
		</section>
	</div>

	<div class="border-border mt-14 border-t pt-6">
		<a href="/" class="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4">
			Back to the homepage
		</a>
	</div>
</article>

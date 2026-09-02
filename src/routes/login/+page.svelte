<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let { data, form } = $props();

	// L'errore può arrivare dal form (credenziali) o dall'URL (ritorno da GitHub andato male).
	const error = $derived(form?.error ?? data.error);
</script>

<Seo title="Sign in — anomalia/leads" description="Sign in to anomalia/leads." noindex />

<div class="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
	<a href="/" class="mb-8 flex items-center gap-2 self-start" aria-label="anomalia/leads">
		<BrandMark height={16} />
		<span class="font-medium tracking-tight">anomalia<span class="text-muted-foreground">/leads</span></span>
	</a>

	<Card.Root>
		<Card.Header>
			<Card.Title>Sign in</Card.Title>
			<Card.Description>Find the conversations where you have something to say.</Card.Description>
		</Card.Header>

		<Card.Content class="flex flex-col gap-5">
			<form method="POST" action="?/github" use:enhance>
				<Button type="submit" variant="outline" class="w-full">
					<svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true">
						<path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
					</svg>
					Continue with GitHub
				</Button>
			</form>

			<div class="flex items-center gap-3">
				<span class="bg-border h-px flex-1"></span>
				<span class="text-muted-foreground text-xs">or with email</span>
				<span class="bg-border h-px flex-1"></span>
			</div>

			<form method="POST" use:enhance class="flex flex-col gap-4">
				<Input
					name="email"
					type="email"
					required
					autocomplete="email"
					placeholder="you@example.com"
					value={form?.email ?? ''}
				/>
				<Input
					name="password"
					type="password"
					required
					autocomplete="current-password"
					placeholder="password"
				/>

				{#if error}
					<p class="text-destructive text-sm">{error}</p>
				{/if}

				<div class="flex gap-2">
					<Button type="submit" formaction="?/login">Sign in</Button>
					<Button type="submit" formaction="?/signup" variant="outline">Create an account</Button>
				</div>
			</form>

			<a
				href="/forgot-password"
				class="text-muted-foreground hover:text-foreground self-start text-sm underline underline-offset-4"
			>
				Forgot your password?
			</a>
		</Card.Content>
	</Card.Root>

	<p class="text-muted-foreground mt-6 text-center text-xs text-pretty">
		By continuing you agree to the
		<a href="/terms" class="hover:text-foreground underline underline-offset-4">Terms</a>
		and the
		<a href="/privacy" class="hover:text-foreground underline underline-offset-4">Privacy Policy</a>.
	</p>
</div>

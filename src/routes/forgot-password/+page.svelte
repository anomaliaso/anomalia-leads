<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let { form } = $props();
</script>

<Seo title="Reset your password — anomalia/leads" description="Ask for a link to set a new password." noindex />

<div class="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
	<a href="/" class="mb-8 flex items-center gap-2 self-start" aria-label="anomalia/leads">
		<BrandMark height={16} />
		<span class="font-medium tracking-tight">anomalia<span class="text-muted-foreground">/leads</span></span>
	</a>

	<Card.Root>
		<Card.Header>
			<Card.Title>Reset your password</Card.Title>
			<Card.Description>
				We will email you a link to choose a new one. It works only for accounts created with an
				email and password — if you signed in with GitHub, use that button instead.
			</Card.Description>
		</Card.Header>

		<Card.Content>
			{#if form?.sent}
				<p class="text-sm text-pretty">
					If an account exists for that address, the link is on its way. It expires in an hour.
				</p>
				<Button href="/login" variant="outline" class="mt-4">Back to sign in</Button>
			{:else}
				<form method="POST" use:enhance class="flex flex-col gap-4">
					<Input name="email" type="email" required autocomplete="email" placeholder="you@example.com" />

					{#if form?.error}
						<p class="text-destructive text-sm">{form.error}</p>
					{/if}

					<div class="flex gap-2">
						<Button type="submit">Send the link</Button>
						<Button href="/login" variant="ghost">Back</Button>
					</div>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

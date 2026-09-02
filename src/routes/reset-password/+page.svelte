<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import BrandMark from '$lib/components/BrandMark.svelte';

	let { form } = $props();
</script>

<div class="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
	<a href="/" class="mb-8 flex items-center gap-2 self-start" aria-label="anomalia/leads">
		<BrandMark height={16} />
		<span class="font-medium tracking-tight">anomalia<span class="text-muted-foreground">/leads</span></span>
	</a>

	<Card.Root>
		<Card.Header>
			<Card.Title>Choose a new password</Card.Title>
			<Card.Description>At least eight characters.</Card.Description>
		</Card.Header>

		<Card.Content>
			<form method="POST" use:enhance class="flex flex-col gap-4">
				<Input name="password" type="password" required autocomplete="new-password" placeholder="new password" />
				<Input name="confirm" type="password" required autocomplete="new-password" placeholder="repeat it" />

				{#if form?.error}
					<p class="text-destructive text-sm">{form.error}</p>
				{/if}

				<Button type="submit">Save and continue</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>

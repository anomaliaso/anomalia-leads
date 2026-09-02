<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';

	let { form } = $props();
</script>

<div class="mx-auto flex min-h-svh max-w-lg items-center px-6 py-12">
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title>Sign in</Card.Title>
			<Card.Description>Find the conversations where you have something to say.</Card.Description>
		</Card.Header>

		<Card.Content>
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

				{#if form?.error}
					<p class="text-destructive text-sm">{form.error}</p>
				{/if}

				<div class="flex gap-2">
					<Button type="submit" formaction="?/login">Sign in</Button>
					<Button type="submit" formaction="?/signup" variant="outline">Create an account</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>

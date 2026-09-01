<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';

	let { form } = $props();
</script>

<div class="flex min-h-[70svh] items-center">
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title>Entra</Card.Title>
			<Card.Description>Trova le conversazioni dove hai qualcosa da dire.</Card.Description>
		</Card.Header>

		<Card.Content>
			<form method="POST" use:enhance class="flex flex-col gap-4">
				<Input
					name="email"
					type="email"
					required
					autocomplete="email"
					placeholder="tu@esempio.com"
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
					<Button type="submit" formaction="?/login">Entra</Button>
					<Button type="submit" formaction="?/signup" variant="outline">Crea un account</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>

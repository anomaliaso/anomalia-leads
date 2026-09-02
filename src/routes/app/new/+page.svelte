<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

	let { data, form } = $props();
	let busy = $state(false);

	const first = $derived(!data.brands.length);
</script>

<div class="mx-auto max-w-2xl px-6 py-14">
	<h1 class="font-display text-2xl">
		{first ? 'What do you sell?' : 'Another brand'}
	</h1>
	<p class="text-muted-foreground mt-2 text-sm text-pretty">
		{#if first}
			Write it the way you would explain it to a person, not the way you would write it on a landing
			page. It is the only setup we ask for.
		{:else}
			Each brand has its own sources and its own queue. The contact brake stays shared: a person is
			never messaged again by a second brand of yours.
		{/if}
	</p>

	<form
		method="POST"
		class="mt-8 flex flex-col gap-4"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
	>
		<Input name="name" required placeholder="Product name" value={form?.name ?? ''} />

		<Textarea
			name="about"
			required
			rows={5}
			value={form?.about ?? ''}
			placeholder="What problem you solve, and for whom. Example: scheduling software for small dental practices that removes chasing patients by hand."
		/>

		<Input name="site_url" type="url" placeholder="https://yoursite.com (optional)" />

		{#if form?.error}
			<p class="text-destructive text-sm text-pretty">{form.error}</p>
		{/if}

		<div class="flex items-center gap-3">
			<Button type="submit" disabled={busy}>
				{busy ? 'Finding conversations…' : 'Find my leads'}
			</Button>
			{#if !busy}
				<span class="text-muted-foreground text-xs">Takes a few seconds.</span>
			{/if}
		</div>

		{#if busy}
			<p class="text-muted-foreground text-xs text-pretty">
				Working out your sources and running the first search. Do not close the page.
			</p>
		{/if}
	</form>
</div>

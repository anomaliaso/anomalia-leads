<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

	let { data, form } = $props();
	let busy = $state(false);

	const first = $derived(!data.brands.length);
	// Il secondo passo esiste solo dopo che il server ha letto il sito: è lui a dire dove siamo,
	// non uno stato del browser che un refresh perderebbe.
	const review = $derived(form?.step === 'review');

	const KIND: Record<string, string> = { subreddit: 'subreddit', reddit_query: 'Reddit search' };

	// `reset: false`: dopo un errore l'utente ritrova quello che aveva scritto, non un modulo
	// vuoto da ricompilare.
	function working() {
		busy = true;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = false;
		};
	}
</script>

<div class="mx-auto max-w-2xl px-6 py-14">
	{#if !review}
		<h1 class="text-2xl font-semibold tracking-tight">
			{first ? 'Where can we read about you?' : 'Another brand'}
		</h1>
		<p class="text-muted-foreground mt-2 text-sm text-pretty">
			{#if first}
				Give us the address and we read it ourselves. You correct what we got wrong — that is the
				whole setup.
			{:else}
				Each brand has its own sources and its own queue. The contact brake stays shared: a person
				is never messaged again by a second brand of yours.
			{/if}
		</p>

		<form method="POST" action="?/analyze" class="mt-8 flex flex-col gap-4" use:enhance={working}>
			<Input name="site_url" required placeholder="yoursite.com" value={form?.site_url ?? ''} />

			{#if form?.error}
				<p class="text-destructive text-sm text-pretty">{form.error}</p>
			{/if}

			<div class="flex items-center gap-3">
				<Button type="submit" disabled={busy}>{busy ? 'Reading your site…' : 'Read my site'}</Button>
				{#if !busy}
					<span class="text-muted-foreground text-xs">Takes a few seconds.</span>
				{/if}
			</div>
		</form>
	{:else}
		<h1 class="text-2xl font-semibold tracking-tight">Did we get it right?</h1>
		<p class="text-muted-foreground mt-2 text-sm text-pretty">
			This is what we understood from {form?.site_url}. Fix what is wrong and drop the sources that
			do not fit — a specific community produces leads, a huge generic one produces noise.
		</p>

		{#if form?.note}
			<p class="text-muted-foreground mt-4 text-sm text-pretty">{form.note}</p>
		{/if}

		<form method="POST" action="?/create" class="mt-8 flex flex-col gap-4" use:enhance={working}>
			<input type="hidden" name="site_url" value={form?.site_url ?? ''} />

			<Input name="name" required placeholder="Product name" value={form?.name ?? ''} />

			<Textarea
				name="about"
				required
				rows={5}
				value={form?.about ?? ''}
				placeholder="What problem you solve, and for whom."
			/>

			{#if form?.sources?.length}
				<fieldset class="border-border rounded-md border p-4">
					<legend class="text-muted-foreground px-1 text-xs">Where we will look</legend>
					<ul class="space-y-2">
						{#each form.sources as s (s.kind + s.value)}
							<li class="flex items-center gap-2.5">
								<input
									type="checkbox"
									name="source"
									value="{s.kind}:{s.value}"
									checked
									id="src-{s.kind}-{s.value}"
									class="border-input accent-foreground size-4 rounded-sm border"
								/>
								<label for="src-{s.kind}-{s.value}" class="flex items-center gap-2 text-sm">
									<span class="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-xs">
										{KIND[s.kind] ?? s.kind}
									</span>
									{s.value}
								</label>
							</li>
						{/each}
					</ul>
				</fieldset>
			{/if}

			<div class="flex flex-col gap-3 sm:flex-row">
				<select
					name="extra_kind"
					class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] sm:w-48"
				>
					<option value="subreddit">subreddit</option>
					<option value="reddit_query">Reddit search</option>
				</select>
				<Input name="extra_value" placeholder="add one more (optional)" class="flex-1" />
			</div>

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
					Running the first search. Do not close the page.
				</p>
			{/if}
		</form>
	{/if}
</div>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

	let { form } = $props();
	let busy = $state(false);

	// Dire cosa sta per succedere toglie l'ansia dei sette secondi di attesa, e insegna il
	// prodotto: le sorgenti non le scegli tu, escono da quello che scrivi.
	const STEPS = [
		'Da quello che scrivi deduciamo dove ne parlano i tuoi compratori',
		'Guardiamo quelle conversazioni subito, non al prossimo giro',
		'Quelle che valgono te le mettiamo in coda con la risposta pronta'
	];
</script>

<div class="mx-auto max-w-xl px-6 py-16">
	<h1 class="text-2xl font-semibold tracking-tight">Cosa vendi?</h1>
	<p class="text-muted-foreground mt-2 text-sm text-pretty">
		Scrivilo come lo spiegheresti a una persona, non come lo scriveresti su una landing page. È
		l'unica configurazione che ti chiediamo.
	</p>

	<ol class="text-muted-foreground mt-6 space-y-2 text-sm">
		{#each STEPS as step, i (step)}
			<li class="flex gap-3">
				<span class="text-muted-foreground/60 font-mono text-xs leading-5">{i + 1}</span>
				<span class="text-pretty">{step}</span>
			</li>
		{/each}
	</ol>

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
		<Input name="name" required placeholder="Nome del prodotto" value={form?.name ?? ''} />

		<Textarea
			name="about"
			required
			rows={5}
			value={form?.about ?? ''}
			placeholder="Che problema risolvi, e per chi. Esempio: gestionale per piccoli studi dentistici che elimina il richiamo pazienti a mano."
		/>

		<Input name="site_url" type="url" placeholder="https://iltuosito.com (facoltativo)" />

		{#if form?.error}
			<p class="text-destructive text-sm text-pretty">{form.error}</p>
		{/if}

		<div class="flex items-center gap-3">
			<Button type="submit" disabled={busy}>
				{busy ? 'Cerco le conversazioni…' : 'Trova i lead'}
			</Button>
			{#if !busy}
				<span class="text-muted-foreground text-xs">Ci vogliono pochi secondi.</span>
			{/if}
		</div>

		{#if busy}
			<p class="text-muted-foreground text-xs text-pretty">
				Sto deducendo le sorgenti e facendo la prima ricerca. Non chiudere la pagina.
			</p>
		{/if}
	</form>
</div>

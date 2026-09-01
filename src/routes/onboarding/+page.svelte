<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

	let { form } = $props();
	let busy = $state(false);
</script>

<h1 class="text-2xl font-semibold tracking-tight">Cosa vendi?</h1>
<p class="text-muted-foreground mt-2 text-sm text-pretty">
	Da qui escono i posti da guardare. Scrivilo come lo spiegheresti a una persona, non come lo
	scriveresti su una landing page.
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
		<p class="text-destructive text-sm">{form.error}</p>
	{/if}

	<div class="flex items-center gap-3">
		<Button type="submit" disabled={busy}>
			{busy ? 'Cerco le conversazioni…' : 'Trova i lead'}
		</Button>
		<span class="text-muted-foreground text-xs">
			La prima scansione parte subito e ci mette qualche secondo.
		</span>
	</div>
</form>

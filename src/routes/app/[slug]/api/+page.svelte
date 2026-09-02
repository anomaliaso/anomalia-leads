<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	let { data, form } = $props();

	const origin = $derived(page.url.origin);
	const shownKey = $derived(form?.ok ? form.key : null);
</script>

<div class="mx-auto max-w-4xl px-6 py-10">
	<h1 class="font-semibold tracking-tight text-xl">API</h1>
	<p class="text-muted-foreground mt-1 text-sm text-pretty">
		Una chiave per far leggere la coda e le sorgenti a un agente — il tuo, o quello di chi ti
		integra — senza passare dal browser.
	</p>

	<Card.Root class="mt-6">
		<Card.Content class="pt-6">
			{#if shownKey}
				<p class="text-sm font-medium">Nuova chiave generata</p>
				<p class="text-muted-foreground mt-1 text-sm">
					Si vede una sola volta: copiala ora, da qui in poi si vede solo il prefisso.
				</p>
				<code class="bg-muted mt-3 block overflow-x-auto rounded-md px-3 py-2 text-sm">{shownKey}</code>
			{:else if data.prefix}
				<p class="text-sm">
					Chiave attiva: <code class="bg-muted rounded px-1.5 py-0.5">{data.prefix}…</code>
				</p>
			{:else}
				<p class="text-muted-foreground text-sm">Nessuna chiave ancora. Senza, l'API rifiuta ogni richiesta.</p>
			{/if}

			<form method="POST" action="?/generate" use:enhance class="mt-4">
				<Button type="submit" variant={data.prefix ? 'outline' : 'default'} size="sm">
					{data.prefix ? 'Rigenera (la vecchia smette subito di funzionare)' : 'Genera chiave'}
				</Button>
			</form>

			{#if form?.error}
				<p class="text-destructive mt-3 text-sm">{form.error}</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<h2 class="mt-8 font-medium text-sm">Endpoint</h2>
	<p class="text-muted-foreground mt-1 text-sm">
		Header <code class="bg-muted rounded px-1 py-0.5">Authorization: Bearer alk_...</code> su ogni richiesta.
	</p>

	<div class="mt-4 space-y-3 text-sm">
		<div class="flex items-start gap-3">
			<code class="bg-muted shrink-0 rounded px-2 py-1">GET /api/v1/queue</code>
			<span class="text-muted-foreground">le bozze pronte, ordinate per intenzione</span>
		</div>
		<div class="flex items-start gap-3">
			<code class="bg-muted shrink-0 rounded px-2 py-1">GET /api/v1/status</code>
			<span class="text-muted-foreground">esito dell'ultima scansione</span>
		</div>
		<div class="flex items-start gap-3">
			<code class="bg-muted shrink-0 rounded px-2 py-1">PATCH /api/v1/leads/:id</code>
			<span class="text-muted-foreground">{'{ "action": "done" | "ignore" }'}</span>
		</div>
		<div class="flex items-start gap-3">
			<code class="bg-muted shrink-0 rounded px-2 py-1">GET/POST /api/v1/sources</code>
			<span class="text-muted-foreground">lista o aggiungi una sorgente</span>
		</div>
		<div class="flex items-start gap-3">
			<code class="bg-muted shrink-0 rounded px-2 py-1">PATCH/DELETE /api/v1/sources/:id</code>
			<span class="text-muted-foreground">pausa/riprendi o rimuovi</span>
		</div>
		<div class="flex items-start gap-3">
			<code class="bg-muted shrink-0 rounded px-2 py-1">POST /api/v1/scan</code>
			<span class="text-muted-foreground">fa scattare subito il giro, invece di aspettare il cron</span>
		</div>
		<div class="flex items-start gap-3">
			<code class="bg-muted shrink-0 rounded px-2 py-1">GET/PUT/DELETE /api/v1/webhook</code>
			<span class="text-muted-foreground">{'{ "url": "https://..." }'} — un ping quando lo scan produce bozze</span>
		</div>
	</div>

	<pre class="bg-muted mt-6 overflow-x-auto rounded-md px-3 py-3 text-xs">curl {origin}/api/v1/queue \
  -H "Authorization: Bearer alk_..."</pre>

	<h2 class="mt-10 font-medium text-sm">MCP</h2>
	<p class="text-muted-foreground mt-1 text-sm text-pretty">
		Stessi dati, come tool per un agente MCP (Claude Code, Claude Desktop, Cursor, ...): un tool
		per endpoint qui sopra — <code class="bg-muted rounded px-1 py-0.5">get_queue</code>,
		<code class="bg-muted rounded px-1 py-0.5">get_status</code>,
		<code class="bg-muted rounded px-1 py-0.5">update_lead</code>,
		<code class="bg-muted rounded px-1 py-0.5">list_sources</code>,
		<code class="bg-muted rounded px-1 py-0.5">add_source</code>,
		<code class="bg-muted rounded px-1 py-0.5">set_source_active</code>,
		<code class="bg-muted rounded px-1 py-0.5">remove_source</code>,
		<code class="bg-muted rounded px-1 py-0.5">trigger_scan</code>,
		<code class="bg-muted rounded px-1 py-0.5">set_webhook</code>,
		<code class="bg-muted rounded px-1 py-0.5">remove_webhook</code>. Con questi, un agente parte
		da una chiave e da zero sorgenti e chiude da solo l'intero giro — aggiunge le sorgenti, fa
		scattare lo scan, riceve il ping quando ci sono bozze, le legge e le marca fatte o ignorate —
		senza mai passare da qui.
	</p>
	<pre class="bg-muted mt-3 overflow-x-auto rounded-md px-3 py-3 text-xs">claude mcp add --transport http anomalia-leads {origin}/api/mcp \
  --header "Authorization: Bearer alk_..."</pre>
</div>

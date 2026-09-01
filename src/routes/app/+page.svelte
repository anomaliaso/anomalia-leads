<script lang="ts">
  import { enhance } from '$app/forms';

  let { data } = $props();
  let scanning = $state(false);
  let copied = $state('');

  const INTENT_LABEL: Record<string, string> = {
    seeking_now: 'cerca adesso',
    comparing: 'sta confrontando',
    researching: 'si informa',
    venting: 'sfoga',
    none: '—'
  };

  async function copy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    copied = id;
    setTimeout(() => (copied = ''), 1500);
  }

  async function scan() {
    scanning = true;
    try {
      await fetch(`/api/scan?brand=${data.brand.id}`, { method: 'POST' });
      location.reload();
    } finally {
      scanning = false;
    }
  }
</script>

<header class="flex items-baseline justify-between">
  <div>
    <h1 class="text-2xl font-semibold">{data.brand.name}</h1>
    <p class="text-sm opacity-70">{data.leads.length} conversazioni dove hai qualcosa da dire</p>
  </div>
  <button onclick={scan} disabled={scanning} class="rounded border border-black/15 px-3 py-1.5 text-sm disabled:opacity-50">
    {scanning ? 'cerco…' : 'cerca ora'}
  </button>
</header>

{#if !data.leads.length}
  <p class="mt-10 text-sm opacity-70">
    Niente in coda. Il silenzio è una risposta valida: significa che oggi non c'era un thread in cui
    valesse la pena entrare. Riprova più tardi, o premi «cerca ora».
  </p>
{/if}

<ul class="mt-6 flex flex-col gap-5">
  {#each data.leads as lead (lead.id)}
    <li class="rounded-lg border border-black/10 p-4">
      <div class="flex items-center gap-2 text-xs opacity-70">
        <span class="rounded bg-[var(--color-accent)]/10 px-2 py-0.5 text-[var(--color-accent)]">
          {INTENT_LABEL[lead.intent] ?? lead.intent}
        </span>
        <span>{lead.source_name}</span>
        <span>· rilevanza {lead.relevance}</span>
      </div>

      <a href={lead.url} target="_blank" rel="noreferrer" class="mt-2 block font-medium underline-offset-2 hover:underline">
        {lead.title}
      </a>

      <pre class="mt-3 whitespace-pre-wrap rounded bg-black/5 p-3 text-sm">{lead.suggestion}</pre>

      {#if lead.dm_draft}
        <details class="mt-2">
          <summary class="cursor-pointer text-xs opacity-70">e un DM, se preferisci in privato</summary>
          <pre class="mt-2 whitespace-pre-wrap rounded bg-black/5 p-3 text-sm">{lead.dm_draft}</pre>
          {#if lead.dm_target}
            <a href={lead.dm_target} target="_blank" rel="noreferrer" class="text-xs underline">apri il profilo</a>
          {/if}
        </details>
      {/if}

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button
          onclick={() => copy(lead.id, lead.suggestion)}
          class="rounded bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white"
        >
          {copied === lead.id ? 'copiato' : 'copia il commento'}
        </button>

        <form method="POST" action="?/done" use:enhance>
          <input type="hidden" name="id" value={lead.id} />
          <button class="rounded border border-black/15 px-3 py-1.5 text-sm">l'ho pubblicato</button>
        </form>

        <form method="POST" action="?/ignore" use:enhance>
          <input type="hidden" name="id" value={lead.id} />
          <button class="rounded px-3 py-1.5 text-sm opacity-60 hover:opacity-100">ignora</button>
        </form>
      </div>
    </li>
  {/each}
</ul>

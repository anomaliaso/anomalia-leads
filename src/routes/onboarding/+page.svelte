<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();
  let busy = $state(false);
</script>

<h1 class="text-2xl font-semibold">Cosa vendi?</h1>
<p class="mt-2 text-sm opacity-70">
  Da qui escono i posti da guardare. Scrivi come lo spiegheresti a una persona, non come lo scriveresti
  su una landing page.
</p>

<form
  method="POST"
  class="mt-6 flex flex-col gap-3"
  use:enhance={() => {
    busy = true;
    return async ({ update }) => {
      await update();
      busy = false;
    };
  }}
>
  <input
    name="name"
    required
    placeholder="Nome del prodotto"
    value={form?.name ?? ''}
    class="rounded border border-black/15 bg-transparent px-3 py-2"
  />
  <textarea
    name="about"
    required
    rows="5"
    placeholder="Che problema risolvi, e per chi. Esempio: gestionale per piccoli studi dentistici che elimina il richiamo pazienti a mano."
    class="rounded border border-black/15 bg-transparent px-3 py-2"
  >{form?.about ?? ''}</textarea>
  <input
    name="site_url"
    type="url"
    placeholder="https://iltuosito.com (facoltativo)"
    class="rounded border border-black/15 bg-transparent px-3 py-2"
  />

  {#if form?.error}
    <p class="text-sm text-red-600">{form.error}</p>
  {/if}

  <button disabled={busy} class="rounded bg-[var(--color-accent)] px-4 py-2 text-white disabled:opacity-50">
    {busy ? 'Cerco le conversazioni…' : 'Trova i lead'}
  </button>
  <p class="text-xs opacity-60">La prima scansione parte subito e ci mette qualche secondo.</p>
</form>

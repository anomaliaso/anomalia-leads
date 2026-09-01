<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<h1 class="text-2xl font-semibold">Entra</h1>
<p class="mt-2 text-sm opacity-70">Trova le conversazioni dove hai qualcosa da dire.</p>

<form method="POST" use:enhance class="mt-6 flex flex-col gap-3">
  <input
    name="email"
    type="email"
    required
    autocomplete="email"
    placeholder="tu@esempio.com"
    value={form?.email ?? ''}
    class="rounded border border-black/15 bg-transparent px-3 py-2"
  />
  <input
    name="password"
    type="password"
    required
    autocomplete="current-password"
    placeholder="password"
    class="rounded border border-black/15 bg-transparent px-3 py-2"
  />

  {#if form?.error}
    <p class="text-sm text-red-600">{form.error}</p>
  {/if}

  <div class="flex gap-2">
    <button formaction="?/login" class="rounded bg-[var(--color-accent)] px-4 py-2 text-white">Entra</button>
    <button formaction="?/signup" class="rounded border border-black/15 px-4 py-2">Crea un account</button>
  </div>
</form>

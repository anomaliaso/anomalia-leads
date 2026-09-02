<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Nessuna larghezza imposta qui: la coda vuole una colonna stretta, la landing tutta la pagina. -->
<div class="min-h-svh">
	{@render children()}
</div>

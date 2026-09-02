<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<!-- Icone, manifesto e theme-color vivono in `app.html`: sono uguali ovunque. I meta per pagina
     stanno in `Seo.svelte`. -->

<!-- Nessuna larghezza imposta qui: la coda vuole una colonna stretta, la landing tutta la pagina. -->
<div class="min-h-svh">
	{@render children()}
</div>

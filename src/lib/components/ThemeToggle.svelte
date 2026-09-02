<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	/**
	 * Il tema iniziale lo decide lo script in `app.html`, prima della prima pittura. Qui si legge
	 * soltanto cosa ha deciso: tenere uno stato separato significherebbe averne due che possono
	 * discordare, e il primo render mostrerebbe l'icona sbagliata.
	 */
	let dark = $state(false);

	$effect(() => {
		dark = document.documentElement.classList.contains('dark');
	});

	function toggle() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		try {
			// Da qui in poi la scelta dell'utente vince sul sistema, anche se cambia.
			localStorage.setItem('theme', dark ? 'dark' : 'light');
		} catch {
			// Finestra privata o cookie bloccati: il tema vale per questa pagina e basta.
		}
	}
</script>

<Button
	variant="ghost"
	size="sm"
	class="px-2"
	onclick={toggle}
	aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
	title={dark ? 'Light theme' : 'Dark theme'}
>
	{#if dark}
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="size-4"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
		</svg>
	{:else}
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="size-4"
			aria-hidden="true"
		>
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	{/if}
</Button>

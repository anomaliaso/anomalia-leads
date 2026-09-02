import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Vercel: il cron in `vercel.json` chiama /api/scan, e lo scan supera i tempi di una
			// funzione breve.
			adapter: adapter({ runtime: 'nodejs22.x' })
		})
	],
	// Node moderno risolve `localhost` su IPv6, quindi Vite di suo ascolta solo su [::1] e un
	// browser che cerca 127.0.0.1 si prende un rifiuto. Fissarlo evita la mezz'ora di diagnosi su
	// un server che "è acceso ma non risponde".
	server: { host: '127.0.0.1' },
	test: {
		// I test del core arrivano col subtree e girano qui dentro: sono la prova che il pacchetto
		// mirrorato funziona davvero in questo repo, non solo in quello da cui viene.
		include: ['src/**/*.{test,spec}.{js,ts}', 'packages/*/src/**/*.{test,spec}.{js,ts}']
	}
});

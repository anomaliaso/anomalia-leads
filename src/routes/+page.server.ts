import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { currencyFor } from '$lib/currency';

export const load: PageServerLoad = async ({ locals, request }) => {
  if (locals.user) redirect(303, '/app');

  // Vercel mette il paese in questo header. In sviluppo non c'è, e la pagina ripiega sulla
  // regione del browser: è un valore iniziale, non una decisione definitiva.
  const country = request.headers.get('x-vercel-ip-country');

  return { country, currency: country ? currencyFor(country) : null };
};

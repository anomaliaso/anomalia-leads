import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { checkoutSession, createCustomer, portalSession } from '$lib/server/stripe';
import { currencyFor, type Currency } from '$lib/currency';
import type { PlanId } from '$lib/plans';

/**
 * Il billing è dell'ACCOUNT, non del brand, anche se la pagina sta sotto uno slug: si arriva qui
 * dal brand che si sta guardando, ma quello che si compra vale per tutti.
 *
 * Nessun webhook: l'engine di sync mirrora Stripe dentro lo schema `stripe`, e un trigger riscrive
 * `brands.plan`. Qui si apre solo il checkout e si legge lo stato.
 */

/** Lo stato dell'abbonamento come lo vede l'utente: la funzione SQL filtra già su `auth.uid()`. */
type Subscription = {
  plan: PlanId;
  status: string;
  currency: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export const load: PageServerLoad = async ({ locals, request }) => {
  const { data } = await locals.supabase.rpc('current_subscription');
  const subscription = (data?.[0] ?? null) as Subscription | null;

  // La stessa regola della landing: il paese lo mette Vercel, e in sviluppo non c'è. Se un
  // abbonamento esiste già, la valuta è quella che sta pagando — cambiarla a metà strada
  // significherebbe un secondo abbonamento in un'altra moneta.
  const country = request.headers.get('x-vercel-ip-country');
  const currency = (subscription?.currency as Currency | undefined) ?? currencyFor(country);

  return { subscription, currency };
};

/**
 * Il customer Stripe dell'utente, creandolo se non c'è.
 *
 * Il ponte sta in `billing_customers` e lo scrive solo il service role: se lo potesse scrivere il
 * browser, uno potrebbe agganciarsi al customer di un altro e farsi pagare l'abbonamento.
 */
async function customerFor(userId: string, email: string): Promise<string> {
  const admin = adminClient();

  const { data: existing } = await admin
    .from('billing_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return String(existing.stripe_customer_id);

  const customer = await createCustomer(userId, email);

  const { error } = await admin
    .from('billing_customers')
    .insert({ user_id: userId, stripe_customer_id: customer.id });
  // Una corsa fra due schede: l'idempotenza di Stripe ha già restituito lo stesso customer, e
  // quello scritto per primo è buono. Si rilegge invece di rompere il checkout.
  if (error) {
    const { data: row } = await admin
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!row) throw error;
    return String(row.stripe_customer_id);
  }

  return customer.id;
}

export const actions: Actions = {
  checkout: async ({ request, locals, params, url }) => {
    if (!locals.user) redirect(303, `/login?next=/app/${params.slug}/billing`);

    const form = await request.formData();
    const plan = String(form.get('plan') ?? '');
    const currency = form.get('currency') === 'eur' ? 'eur' : 'usd';

    // Il prezzo lo decide il catalogo sincronizzato, non il form: un `price` che arriva dal
    // browser è un listino scelto dal cliente.
    const { data: price } = await adminClient().rpc('price_for_plan', { p_plan: plan, p_currency: currency });
    if (!price) {
      return fail(400, { error: `No ${currency.toUpperCase()} price for the ${plan} plan yet.` });
    }

    let target: string;
    try {
      const customer = await customerFor(locals.user.id, locals.user.email ?? '');
      const session = await checkoutSession({
        customer,
        price: String(price),
        userId: locals.user.id,
        successUrl: `${url.origin}/app/${params.slug}/billing?checkout=done`,
        cancelUrl: `${url.origin}/app/${params.slug}/billing`
      });
      target = session.url;
    } catch (e) {
      return fail(502, { error: e instanceof Error ? e.message : 'Stripe did not answer.' });
    }

    redirect(303, target);
  },

  portal: async ({ locals, params, url }) => {
    if (!locals.user) redirect(303, `/login?next=/app/${params.slug}/billing`);

    let target: string;
    try {
      const customer = await customerFor(locals.user.id, locals.user.email ?? '');
      const session = await portalSession(customer, `${url.origin}/app/${params.slug}/billing`);
      target = session.url;
    } catch (e) {
      return fail(502, { error: e instanceof Error ? e.message : 'Stripe did not answer.' });
    }

    redirect(303, target);
  }
};

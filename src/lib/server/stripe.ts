import { env } from '$env/dynamic/private';

/**
 * Stripe, senza SDK.
 *
 * Le chiamate che questo prodotto fa sono tre — creare un customer, aprire un checkout, aprire il
 * portale — e sono tutte e tre una POST form-encoded. Una dipendenza in più da tenere aggiornata
 * per tre POST non si ripaga.
 *
 * Il catalogo NON si legge da qui. Prodotti e prezzi arrivano nel database dall'engine di sync, e
 * il price id lo risolve `price_for_plan` in SQL: un id copiato in una variabile d'ambiente è la
 * prima cosa che diverge dal listino vero.
 */

const API = 'https://api.stripe.com/v1';

/** Stripe vuole `a[b][c]=v`: l'annidamento sta nel nome del campo, non in un corpo JSON. */
function encode(data: Record<string, unknown>, prefix = ''): URLSearchParams {
  const out = new URLSearchParams();

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;

    if (typeof value === 'object') {
      for (const [k, v] of encode(value as Record<string, unknown>, name)) out.append(k, v);
    } else {
      out.append(name, String(value));
    }
  }

  return out;
}

async function post<T>(path: string, body: Record<string, unknown>, idempotencyKey?: string): Promise<T> {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY non configurata');

  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
    },
    body: encode(body)
  });

  const json = await res.json();
  // Il messaggio di Stripe è più utile di un 500 muto: si propaga quello.
  if (!res.ok) throw new Error(json?.error?.message ?? `Stripe ${res.status}`);
  return json as T;
}

/**
 * La chiave di idempotenza è l'utente: due click sul tasto di upgrade non devono lasciare due
 * customer in Stripe, che poi diventano due abbonamenti e una fattura da spiegare.
 */
export function createCustomer(userId: string, email: string): Promise<{ id: string }> {
  return post<{ id: string }>(
    '/customers',
    { email, metadata: { user_id: userId } },
    `customer:${userId}`
  );
}

export function checkoutSession(params: {
  customer: string;
  price: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
}): Promise<{ url: string }> {
  return post<{ url: string }>('/checkout/sessions', {
    mode: 'subscription',
    customer: params.customer,
    'line_items[0][price]': params.price,
    'line_items[0][quantity]': 1,
    // L'utente finisce anche sull'abbonamento, non solo sul customer: quando un giorno servirà
    // capire di chi è una subscription orfana, la risposta è dentro l'oggetto sbagliato.
    'subscription_data[metadata][user_id]': params.userId,
    allow_promotion_codes: true,
    // I prezzi sono IVA inclusa (`tax_behavior: inclusive` sui price): il totale non cambia col
    // paese, cambia quanto di quel totale è imposta. Senza `automatic_tax` sarebbe solo
    // un'etichetta — l'imposta non verrebbe né calcolata né riportata in fattura.
    'automatic_tax[enabled]': true,
    // Stripe Tax ha bisogno di sapere dove sta il cliente, e il customer esiste già: senza questi
    // due il checkout si rifiuta di partire invece di indovinare il paese.
    billing_address_collection: 'required',
    'customer_update[address]': 'auto',
    'customer_update[name]': 'auto',
    // La partita IVA di chi compra da azienda: in UE è quella che sposta l'imposta sul cliente.
    'tax_id_collection[enabled]': true,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl
  });
}

export function portalSession(customer: string, returnUrl: string): Promise<{ url: string }> {
  return post<{ url: string }>('/billing_portal/sessions', { customer, return_url: returnUrl });
}

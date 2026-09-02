-- Il billing, e un solo posto da cui leggere il piano.
--
-- Stripe è la fonte: l'engine di sync mirrora l'account dentro lo schema `stripe`, e qui non si
-- riscrive niente di quello. Questa migrazione aggiunge due cose sole:
--
--   1. il ponte fra un utente di `auth.users` e il suo customer Stripe;
--   2. dei trigger che tengono `brands.plan` allineato all'abbonamento.
--
-- `brands.plan` resta il punto dove il motore legge il limite (`scan.ts` → `$lib/plans`), ma non è
-- più un valore che qualcuno scrive a mano: lo riscrive il trigger a ogni cambio di abbonamento.
-- Due posti da cui leggere il piano sarebbero, prima o poi, due piani diversi.

-- ── Lo schema `stripe`, se manca ────────────────────────────────────────────────────────────────
--
-- Sul progetto hosted lo crea l'engine di sync, con tutte le colonne del caso. In locale l'engine
-- non c'è: senza queste tabelle la migrazione non si applicherebbe e `npm run db:reset` resterebbe
-- rotto per chiunque cloni il repo. Quindi si creano solo se mancano — dove il sync c'è, tutto
-- questo blocco è un no-op, e le colonne vere restano le sue.
--
-- Sono anche il modo di provare il billing in locale: si inserisce a mano un abbonamento finto e
-- si guarda se `brands.plan` si muove, senza passare da Stripe.

create schema if not exists stripe;

create table if not exists stripe.products (
  id text primary key,
  active boolean,
  metadata jsonb
);

create table if not exists stripe.prices (
  id text primary key,
  product text,
  currency text,
  active boolean,
  recurring jsonb,
  created bigint
);

create table if not exists stripe.subscriptions (
  id text primary key,
  customer text,
  status text,
  items jsonb,
  current_period_end bigint,
  cancel_at_period_end boolean
);

create table if not exists stripe.subscription_items (
  id text primary key,
  subscription text,
  price jsonb
);

-- ── Il ponte utente ↔ customer ──────────────────────────────────────────────────────────────────

create table billing_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Uno per utente, e mai riusato da un altro: è l'ancora di tutta la fatturazione.
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

alter table billing_customers enable row level security;

-- Si legge il proprio, e basta. Il customer lo CREA il server prima del checkout: dal browser non
-- si scrive, altrimenti chiunque potrebbe agganciarsi al customer di un altro.
create policy "billing: si vede il proprio" on billing_customers
  for select using (user_id = auth.uid());

-- ── Dal prodotto Stripe al piano ────────────────────────────────────────────────────────────────

-- Il piano NON sta nel prezzo né nel nome: sta in `metadata.plan_id` del prodotto. È l'unico
-- accoppiamento fra il catalogo Stripe e `$lib/plans`, ed è deliberatamente uno solo — cambiare
-- listino, valuta o nome commerciale non deve toccare il database.

create or replace function public.plan_rank(plan text) returns integer
  language sql immutable
  as $$ select coalesce(array_position(array['free', 'starter', 'pro', 'agency'], plan), 0) $$;

-- Fra due abbonamenti attivi vince il più alto: chi paga due volte non deve ricevere il meno caro.
--
-- `past_due` conta come attivo di proposito: Stripe sta ancora riprovando l'addebito, e togliere
-- il servizio al primo tentativo fallito perde clienti che avrebbero pagato.
create or replace function public.plan_of_stripe_customer(customer_id text) returns text
  language sql stable security definer set search_path = public, stripe
  as $$
    select coalesce(
      (select p.metadata ->> 'plan_id'
         from stripe.subscriptions s
         join stripe.products p on p.id = coalesce(
           s.items -> 'data' -> 0 -> 'price' ->> 'product',
           (select si.price ->> 'product'
              from stripe.subscription_items si
             where si.subscription = s.id
             limit 1))
        where s.customer = customer_id
          and s.status in ('active', 'trialing', 'past_due')
          and p.metadata ->> 'plan_id' is not null
        order by public.plan_rank(p.metadata ->> 'plan_id') desc
        limit 1),
      'free');
  $$;

-- ── I trigger che tengono allineato `brands.plan` ───────────────────────────────────────────────

-- Tutti i brand del proprietario, non uno: su Agency ce n'è più di uno e devono valere uguale.
create or replace function public.sync_brand_plans(customer_id text) returns void
  language sql security definer set search_path = public, stripe
  as $$
    update brands b
       set plan = public.plan_of_stripe_customer(customer_id)
      from billing_customers c
     where c.stripe_customer_id = customer_id
       and b.owner_id = c.user_id
       and b.plan is distinct from public.plan_of_stripe_customer(customer_id);
  $$;

create or replace function public.on_stripe_subscription_change() returns trigger
  language plpgsql security definer set search_path = public, stripe
  as $$
  begin
    perform public.sync_brand_plans(coalesce(new.customer, old.customer));
    return null;
  end;
  $$;

-- ponytail: il trigger vive su una tabella che appartiene all'engine di sync. Se un suo
-- aggiornamento ricreasse `stripe.subscriptions`, il trigger sparirebbe in silenzio e i piani si
-- congelerebbero. Il controllo è la query in fondo a questo file: se sparisce, si riapplica.
create trigger stripe_subscription_plan_sync
  after insert or update or delete on stripe.subscriptions
  for each row execute function public.on_stripe_subscription_change();

-- Un brand creato DOPO l'abbonamento nasceva `free` e il trigger non lo toccava più: il secondo
-- brand di un cliente Agency valeva meno del primo.
create or replace function public.brand_inherits_plan() returns trigger
  language plpgsql security definer set search_path = public, stripe
  as $$
  begin
    new.plan := coalesce(
      (select public.plan_of_stripe_customer(c.stripe_customer_id)
         from billing_customers c
        where c.user_id = new.owner_id),
      'free');
    return new;
  end;
  $$;

create trigger brands_inherit_plan
  before insert on brands
  for each row execute function public.brand_inherits_plan();

-- ── Cosa può leggere il browser ─────────────────────────────────────────────────────────────────
--
-- Lo schema `stripe` non è esposto alle API, ed è giusto così: contiene l'intero account. Quello
-- che serve alla pagina del billing passa da queste due funzioni, che filtrano su `auth.uid()`.

create or replace function public.current_subscription()
  returns table (
    plan text,
    status text,
    currency text,
    current_period_end timestamptz,
    cancel_at_period_end boolean
  )
  language sql stable security definer set search_path = public, stripe
  as $$
    select coalesce(p.metadata ->> 'plan_id', 'free'),
           s.status,
           pr.currency,
           to_timestamp(s.current_period_end),
           s.cancel_at_period_end
      from billing_customers c
      join stripe.subscriptions s on s.customer = c.stripe_customer_id
      left join stripe.prices pr on pr.id = coalesce(
        s.items -> 'data' -> 0 -> 'price' ->> 'id',
        (select si.price ->> 'id' from stripe.subscription_items si where si.subscription = s.id limit 1))
      left join stripe.products p on p.id = pr.product
     where c.user_id = auth.uid()
       and s.status in ('active', 'trialing', 'past_due')
     order by public.plan_rank(coalesce(p.metadata ->> 'plan_id', 'free')) desc
     limit 1;
  $$;

-- Il prezzo da mandare al checkout. Sta qui e non in una variabile d'ambiente perché un price id
-- copiato a mano è la cosa che diverge per prima: il catalogo è già sincronizzato, si legge da lì.
--
-- I parametri NON si chiamano `plan` e `currency`: `currency` è anche una colonna di
-- `stripe.prices`, e Postgres risolveva `pr.currency = currency` come `pr.currency = pr.currency`.
-- Il filtro sulla valuta spariva in silenzio e il checkout partiva in euro per chi pagava in
-- dollari. Un prefisso è più brutto di un nome pulito e costa molto meno.
create or replace function public.price_for_plan(p_plan text, p_currency text) returns text
  language sql stable security definer set search_path = public, stripe
  as $$
    select pr.id
      from stripe.prices pr
      join stripe.products p on p.id = pr.product
     where p.metadata ->> 'plan_id' = p_plan
       and pr.currency = p_currency
       and pr.active
       and p.active
       and pr.recurring ->> 'interval' = 'month'
     order by pr.created desc
     limit 1;
  $$;

revoke execute on function public.plan_of_stripe_customer(text) from anon, authenticated;
revoke execute on function public.sync_brand_plans(text) from anon, authenticated;
grant execute on function public.current_subscription() to authenticated;
grant execute on function public.price_for_plan(text, text) to authenticated;

-- Il controllo, da rieseguire dopo ogni aggiornamento dell'engine di sync:
--   select tgname from pg_trigger where tgname = 'stripe_subscription_plan_sync';

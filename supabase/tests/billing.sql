-- Il controllo del billing: le regole stanno in SQL, quindi il test sta in SQL.
--
--   npm run db:test
--
-- Tutto dentro una transazione che finisce in rollback: si può rilanciare su un database pieno
-- senza lasciare un utente finto e un abbonamento finto in giro.

begin;

do $$
declare
  uid uuid := gen_random_uuid();
  brand_a uuid;
begin
  insert into auth.users (id, email) values (uid, uid || '@test.local');

  insert into stripe.products (id, active, metadata) values
    ('prod_x_starter', true, '{"plan_id":"starter"}'),
    ('prod_x_pro', true, '{"plan_id":"pro"}'),
    ('prod_x_agency', true, '{"plan_id":"agency"}');

  insert into stripe.prices (id, product, currency, active, recurring, created) values
    ('price_x_pro_eur', 'prod_x_pro', 'eur', true, '{"interval":"month"}', 1),
    ('price_x_pro_usd', 'prod_x_pro', 'usd', true, '{"interval":"month"}', 1),
    ('price_x_agency_eur', 'prod_x_agency', 'eur', true, '{"interval":"month"}', 1);

  insert into billing_customers (user_id, stripe_customer_id) values (uid, 'cus_x');

  -- Senza abbonamento si nasce free.
  insert into brands (owner_id, name, slug, about)
    values (uid, 'A', 'test-a-' || uid, 'brand di prova') returning id into brand_a;
  assert (select plan from brands where id = brand_a) = 'free', 'senza abbonamento non è free';

  -- L'abbonamento arriva: il trigger riscrive il piano.
  insert into stripe.subscriptions (id, customer, status, items, current_period_end, cancel_at_period_end)
    values ('sub_x', 'cus_x', 'active',
            '{"data":[{"price":{"id":"price_x_pro_eur","product":"prod_x_pro"}}]}',
            extract(epoch from now() + interval '30 days')::bigint, false);
  assert (select plan from brands where id = brand_a) = 'pro', 'l''abbonamento non ha alzato il piano';

  -- Un brand creato dopo non nasce free: su Agency il secondo brand varrebbe meno del primo.
  insert into brands (owner_id, name, slug, about) values (uid, 'B', 'test-b-' || uid, 'secondo brand');
  assert (select count(*) from brands where owner_id = uid and plan = 'pro') = 2, 'il secondo brand non eredita';

  -- Cambio piano dal portale: cambiano gli items, non l'abbonamento.
  update stripe.subscriptions
     set items = '{"data":[{"price":{"id":"price_x_agency_eur","product":"prod_x_agency"}}]}'
   where id = 'sub_x';
  assert (select count(*) from brands where owner_id = uid and plan = 'agency') = 2, 'upgrade non propagato';

  -- Un addebito fallito non spegne il servizio mentre Stripe riprova.
  update stripe.subscriptions set status = 'past_due' where id = 'sub_x';
  assert (select plan from brands where id = brand_a) = 'agency', 'past_due ha tolto il servizio';

  -- Disdetta: tutti i brand tornano free, non solo il primo.
  update stripe.subscriptions set status = 'canceled' where id = 'sub_x';
  assert (select count(*) from brands where owner_id = uid and plan = 'free') = 2, 'la disdetta non è propagata';

  -- La valuta deve filtrare davvero: il bug era `pr.currency = currency`, sempre vero.
  assert public.price_for_plan('pro', 'usd') = 'price_x_pro_usd', 'price_for_plan ignora la valuta';
  assert public.price_for_plan('pro', 'eur') = 'price_x_pro_eur', 'price_for_plan sbaglia in euro';
  assert public.price_for_plan('agency', 'usd') is null, 'price_for_plan inventa un prezzo che non c''è';

  raise notice 'billing: ok';
end;
$$;

rollback;

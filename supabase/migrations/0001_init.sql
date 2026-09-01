-- Lo schema del verticale.
--
-- Quattro nomi di tabella NON sono liberi: `@anomalia/leads-core/contact` li scrive dentro le
-- query (`lead_suppressions`, `brand_news_items`, `lead_outcomes`, `radar_searches`). Cambiarli
-- vorrebbe dire modificare il core e far divergere i due prodotti, quindi si tengono — ed è anche
-- la ragione per cui il tenant qui si chiama "brand": impedenza zero col pacchetto condiviso.

create extension if not exists pgcrypto;

-- ── Il tenant ───────────────────────────────────────────────────────────────────────────────────

create table brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  -- `about` e `site_url` finiscono nel prompt del drafter: senza, le bozze sono generiche.
  about text not null default '',
  site_url text,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create index brands_owner_idx on brands (owner_id);

create table brand_sources (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands (id) on delete cascade,
  -- Gli stessi `kind` che `leads-core/feed` sa instradare. Un valore fuori da questa lista
  -- cadrebbe sul ramo RSS e scaricherebbe le parole chiave come se fossero un url.
  kind text not null check (kind in ('subreddit', 'reddit_query', 'threads_query', 'linkedin_query', 'x_community', 'gnews_query', 'rss')),
  value text not null,
  lang text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand_id, kind, value)
);

create index brand_sources_brand_idx on brand_sources (brand_id) where active;

-- ── Il lead ─────────────────────────────────────────────────────────────────────────────────────

create table brand_news_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands (id) on delete cascade,
  -- sha1 dell'url: la stessa conversazione non entra due volte per lo stesso brand.
  url_hash text not null,
  url text not null,
  title text not null,
  snippet text,
  source_name text,
  published_at timestamptz,
  -- seen → proposed → suggested → done | skipped | dismissed
  status text not null default 'seen',
  relevance integer,
  intent text,
  skip_reason text,
  -- La bozza pronta da incollare, e il DM se il caso lo merita.
  suggestion text,
  dm_draft text,
  dm_target text,
  -- Chi ha scritto: è l'unica cosa che rende possibile il "una persona, un tocco".
  author_handle text,
  author_platform text,
  -- Contenuto derivato dal post: scade a 14 giorni (sweepLeadRetention).
  gist text,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (brand_id, url_hash)
);

create index brand_news_items_queue_idx on brand_news_items (brand_id, created_at desc);
-- L'indice esatto su cui interroga `contactGate`.
create index brand_news_items_author_idx on brand_news_items (author_platform, author_handle) where author_handle is not null;
create index brand_news_items_done_idx on brand_news_items (done_at) where done_at is not null;

-- ── Il freno: una persona, un tocco ─────────────────────────────────────────────────────────────

-- NIENTE brand_id, ed è deliberato: il frequency cap è globale all'istanza. Chi ha già ricevuto un
-- messaggio da UN brand non viene mai più proposto a nessun altro. Scoparlo per brand romperebbe
-- la promessa che rende difendibile tutto il prodotto.
create table lead_suppressions (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  handle text not null,
  source text not null check (source in ('reply', 'manual', 'thread_scan')),
  reason text,
  created_at timestamptz not null default now(),
  unique (platform, handle)
);

-- ── Gli esiti: cosa è successo davvero alla bozza ───────────────────────────────────────────────

create table lead_outcomes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references brand_news_items (id) on delete cascade,
  brand_id uuid not null references brands (id) on delete cascade,
  checked_at timestamptz not null default now(),
  found boolean not null,
  method text,
  match_score numeric,
  upvotes integer,
  replies integer,
  -- Nullable di proposito: null = non lo sappiamo, non "non rimosso".
  removed boolean,
  comment_url text,
  unique (lead_id, checked_at)
);

create index lead_outcomes_brand_idx on lead_outcomes (brand_id, checked_at desc);

-- ── Telemetria di scansione ─────────────────────────────────────────────────────────────────────

create table radar_searches (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands (id) on delete cascade,
  sources jsonb not null default '[]',
  items_found integer not null default 0,
  items_fresh integer not null default 0,
  items_relevant integer not null default 0,
  ms integer,
  created_at timestamptz not null default now()
);

create index radar_searches_brand_idx on radar_searches (brand_id, created_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────────────────────────────────
--
-- Si legge solo la roba del proprio brand. Le SCRITTURE del motore passano tutte dal service role
-- (scan, bozze, esiti): non c'è una policy di insert per il browser, perché il browser non produce
-- lead — li marca soltanto.

alter table brands enable row level security;
alter table brand_sources enable row level security;
alter table brand_news_items enable row level security;
alter table lead_outcomes enable row level security;
alter table radar_searches enable row level security;

-- `lead_suppressions` ha RLS attiva e NESSUNA policy: solo il service role la tocca. È globale fra
-- i tenant, quindi nessun utente deve poterla leggere — ci si vedrebbero gli handle degli altri.
alter table lead_suppressions enable row level security;

create policy "brands: il proprietario vede i suoi" on brands
  for select using (owner_id = auth.uid());
create policy "brands: il proprietario li modifica" on brands
  for update using (owner_id = auth.uid());
create policy "brands: si crea il proprio" on brands
  for insert with check (owner_id = auth.uid());

create policy "sources: via brand" on brand_sources
  for all using (exists (select 1 from brands b where b.id = brand_id and b.owner_id = auth.uid()));

create policy "lead: via brand" on brand_news_items
  for select using (exists (select 1 from brands b where b.id = brand_id and b.owner_id = auth.uid()));
-- L'unica scrittura dal browser: segnare fatto o ignorato. Lo stato lo verifica l'endpoint.
create policy "lead: il proprietario lo marca" on brand_news_items
  for update using (exists (select 1 from brands b where b.id = brand_id and b.owner_id = auth.uid()));

create policy "esiti: via brand" on lead_outcomes
  for select using (exists (select 1 from brands b where b.id = brand_id and b.owner_id = auth.uid()));

create policy "scansioni: via brand" on radar_searches
  for select using (exists (select 1 from brands b where b.id = brand_id and b.owner_id = auth.uid()));

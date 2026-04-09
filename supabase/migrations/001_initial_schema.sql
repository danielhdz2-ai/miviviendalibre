-- ============================================================
-- Mi Vivienda Libre — Migración inicial
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Tipos enumerados
create type listing_origin   as enum ('external', 'direct');
create type listing_status   as enum ('draft', 'published', 'paused', 'archived');
create type operation_type   as enum ('sale', 'rent');
create type product_type     as enum ('turbo', 'visibility_pack', 'contract', 'report', 'kit');
create type order_status     as enum ('pending', 'paid', 'failed', 'refunded');

-- ============================================================
-- Perfiles de usuario (extiende auth.users de Supabase)
-- ============================================================
create table profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  phone        text,
  is_verified  boolean default false,
  created_at   timestamptz default now()
);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Anuncios (propios y agregados externos)
-- ============================================================
create table listings (
  id                    uuid primary key default gen_random_uuid(),
  origin                listing_origin   not null,
  owner_user_id         uuid references auth.users(id),
  operation             operation_type   not null,
  title                 text             not null,
  description           text,
  price_eur             numeric(12,2),
  province              text,
  city                  text,
  district              text,
  postal_code           text,
  lat                   double precision,
  lng                   double precision,
  bedrooms              int,
  bathrooms             int,
  area_m2               int,
  source_portal         text,            -- 'idealista' | 'fotocasa' | null
  source_url            text,
  source_external_id    text,
  is_particular         boolean,
  particular_confidence numeric(4,3),
  ranking_score         numeric(10,3) default 0,
  turbo_until           timestamptz,
  status                listing_status not null default 'draft',
  published_at          timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Índices para búsqueda eficiente
create index idx_listings_search on listings (operation, province, city, status, is_particular);
create index idx_listings_rank   on listings (status, is_particular, ranking_score desc, published_at desc);
create index idx_listings_turbo  on listings (turbo_until) where turbo_until is not null;
create unique index idx_listings_external_id on listings (source_portal, source_external_id)
  where source_external_id is not null;

-- Trigger para actualizar updated_at automáticamente
create or replace function update_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on listings
  for each row execute procedure update_updated_at();

-- ============================================================
-- Imágenes de anuncios
-- ============================================================
create table listing_images (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references listings(id) on delete cascade,
  storage_path  text,          -- ruta en Supabase Storage (anuncios directos)
  external_url  text,          -- URL externa (anuncios agregados)
  position      int default 0,
  created_at    timestamptz default now()
);

create index idx_listing_images_listing on listing_images (listing_id, position);

-- ============================================================
-- Leads / contactos recibidos por anuncio
-- ============================================================
create table listing_contacts (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  from_name   text,
  from_email  text,
  from_phone  text,
  message     text,
  created_at  timestamptz default now()
);

create index idx_listing_contacts_listing on listing_contacts (listing_id, created_at desc);

-- ============================================================
-- Analíticas de visitas a anuncios
-- ============================================================
create table listing_views (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  session_id  text,
  viewed_at   timestamptz default now()
);

create index idx_listing_views_listing on listing_views (listing_id, viewed_at desc);

-- ============================================================
-- Catálogo de productos
-- ============================================================
create table products (
  id          uuid primary key default gen_random_uuid(),
  type        product_type not null,
  slug        text unique  not null,  -- turbo_7d | visibility_30d | contract_alquiler | etc.
  name        text         not null,
  price_eur   numeric(10,2) not null,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- Productos iniciales
insert into products (type, slug, name, price_eur) values
  ('turbo',           'turbo_7d',             'Turbo semanal (bump diario 9:00 AM)',   9.00),
  ('visibility_pack', 'visibility_30d',        'Pack Visibilidad 30 días',              25.00),
  ('contract',        'contract_alquiler',     'Contrato de alquiler',                  9.00),
  ('contract',        'contract_arras',        'Contrato de arras',                     9.00),
  ('contract',        'contract_reserva',      'Contrato de reserva',                   7.00),
  ('contract',        'contract_rescision',    'Contrato de rescisión',                 9.00),
  ('contract',        'contract_pack_legal',   'Pack legal completo (4 contratos)',     29.00),
  ('report',          'report_precio_justo',   'Informe de precio justo (IA)',           5.00),
  ('kit',             'kit_difusion',          'Kit de difusión (redes/WhatsApp)',       4.00);

-- ============================================================
-- Pedidos
-- ============================================================
create table orders (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id),
  product_id            uuid not null references products(id),
  listing_id            uuid references listings(id),
  stripe_checkout_id    text,
  stripe_payment_intent text,
  amount_eur            numeric(10,2) not null,
  status                order_status default 'pending',
  created_at            timestamptz default now(),
  paid_at               timestamptz
);

create index idx_orders_user on orders (user_id, created_at desc);
create index idx_orders_listing on orders (listing_id);

-- ============================================================
-- Contratos generados
-- ============================================================
create table contract_generations (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid unique references orders(id) on delete cascade,
  user_id         uuid not null references auth.users(id),
  contract_type   text not null,    -- alquiler | arras | reserva | rescision
  input_payload   jsonb not null,
  model_used      text,
  output_html     text,
  output_pdf_url  text,
  token_input     int,
  token_output    int,
  cost_usd        numeric(10,4),
  created_at      timestamptz default now()
);

-- ============================================================
-- Registro de ejecuciones del motor Turbo (cron diario 9:00)
-- ============================================================
create table turbo_runs (
  id          uuid primary key default gen_random_uuid(),
  run_date    date not null,
  listing_id  uuid not null references listings(id) on delete cascade,
  applied     boolean default false,
  created_at  timestamptz default now(),
  unique (run_date, listing_id)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table profiles          enable row level security;
alter table listings          enable row level security;
alter table listing_images    enable row level security;
alter table listing_contacts  enable row level security;
alter table listing_views     enable row level security;
alter table orders            enable row level security;
alter table contract_generations enable row level security;

-- profiles: solo el propio usuario puede leer/actualizar su perfil
create policy "profiles: propio usuario" on profiles
  for all using (auth.uid() = user_id);

-- listings: anuncios publicados son públicos; propietario gestiona los suyos
create policy "listings: lectura pública publicados" on listings
  for select using (status = 'published');

create policy "listings: propietario gestiona los suyos" on listings
  for all using (auth.uid() = owner_user_id);

-- listing_images: siempre visibles si el anuncio es público
create policy "listing_images: lectura pública" on listing_images
  for select using (
    exists (select 1 from listings l where l.id = listing_id and l.status = 'published')
  );

-- listing_contacts: solo el propietario del anuncio lee los leads
create policy "listing_contacts: solo propietario" on listing_contacts
  for select using (
    exists (select 1 from listings l where l.id = listing_id and l.owner_user_id = auth.uid())
  );

create policy "listing_contacts: cualquiera puede insertar" on listing_contacts
  for insert with check (true);

-- orders: solo el propio usuario
create policy "orders: propio usuario" on orders
  for all using (auth.uid() = user_id);

-- contract_generations: solo el propio usuario
create policy "contract_generations: propio usuario" on contract_generations
  for all using (auth.uid() = user_id);

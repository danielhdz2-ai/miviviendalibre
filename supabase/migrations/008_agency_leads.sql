-- ============================================================
-- Mi Vivienda Libre — Leads de agencias B2B
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

create table if not exists agency_leads (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  empresa     text not null,
  email       text not null,
  telefono    text,
  plan        text default 'premium',
  mensaje     text,
  status      text default 'new',   -- new | contacted | converted | discarded
  created_at  timestamptz default now()
);

-- Solo el service_role puede leer (datos internos de ventas)
alter table agency_leads enable row level security;

create policy "Solo service_role puede ver leads"
  on agency_leads for select
  using (false);

-- Cualquiera puede insertar (formulario público)
create policy "Insert abierto para formulario"
  on agency_leads for insert
  with check (true);

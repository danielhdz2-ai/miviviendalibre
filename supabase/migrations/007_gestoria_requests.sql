-- ============================================================
-- Mi Vivienda Libre — Solicitudes de gestoría / contratos
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

create table if not exists gestoria_requests (
  id              uuid primary key default gen_random_uuid(),
  service_key     text not null,           -- slug del servicio, ej. 'arras-penitenciales'
  service_name    text not null,           -- nombre legible
  price_eur       integer not null,        -- precio en euros
  client_name     text not null,
  client_email    text not null,
  client_phone    text,
  notes           text,                    -- notas adicionales del cliente
  status          text not null default 'pending',  -- pending | in_progress | delivered | closed
  created_at      timestamptz default now()
);

-- RLS: solo admins pueden leer en el futuro; de momento service role escribe
alter table gestoria_requests enable row level security;

-- Policy de inserción para cualquier usuario (incluso sin cuenta)
create policy "gestoria: cualquiera puede solicitar"
  on gestoria_requests for insert
  with check (true);

-- Index para buscar por estado en el panel de admin
create index idx_gestoria_requests_status on gestoria_requests (status, created_at desc);

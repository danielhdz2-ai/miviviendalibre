-- ─────────────────────────────────────────────────────────────────────────────
-- 014_advertiser_leads_activity.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Columna advertiser_name en listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS advertiser_name text;

-- 2. Tabla de actividad de leads (quién pide el teléfono de quién)
CREATE TABLE IF NOT EXISTS leads_activity (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id    uuid        NOT NULL REFERENCES listings(id)   ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_activity_user_idx    ON leads_activity (user_id);
CREATE INDEX IF NOT EXISTS leads_activity_listing_idx ON leads_activity (listing_id);
CREATE INDEX IF NOT EXISTS leads_activity_created_idx ON leads_activity (created_at DESC);

-- Unique para evitar duplicados por usuario+listing (upsert desde API)
CREATE UNIQUE INDEX IF NOT EXISTS leads_activity_unique_user_listing
  ON leads_activity (user_id, listing_id);

-- RLS
ALTER TABLE leads_activity ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede leer sus leads
CREATE POLICY "user reads own leads"
  ON leads_activity FOR SELECT
  USING (auth.uid() = user_id);

-- Inserciones vía API (service_role desde endpoint autenticado)
-- El endpoint valida auth antes de insertar, por lo que
-- aquí solo necesitamos que el service_role pueda hacerlo.
-- Los usuarios autenticados también pueden insertar su propio registro.
CREATE POLICY "authenticated user inserts own lead"
  ON leads_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 029_dashboard_schema.sql
-- Dashboard Inmonest: gestoria_requests mejorada + client_docs
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. Añadir columnas que faltan en gestoria_requests
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE gestoria_requests
  ADD COLUMN IF NOT EXISTS session_id             text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent  text,
  ADD COLUMN IF NOT EXISTS amount_eur             numeric(10,2),
  ADD COLUMN IF NOT EXISTS paid_at                timestamptz,
  ADD COLUMN IF NOT EXISTS step                   integer NOT NULL DEFAULT 1,
  -- step: 1=Pago confirmado, 2=Documentación recibida, 3=En elaboración, 4=Entregado
  ADD COLUMN IF NOT EXISTS admin_notes            text,
  ADD COLUMN IF NOT EXISTS contract_path          text;  -- ruta del contrato PDF en storage

-- ─────────────────────────────────────────────────────────────────
-- 2. Tabla client_docs: archivos subidos por el cliente
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_docs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid REFERENCES gestoria_requests(id) ON DELETE CASCADE,
  session_id      text NOT NULL,
  doc_key         text NOT NULL,   -- 'dni' | 'nota-simple' | 'escrituras' | otro
  file_name       text NOT NULL,
  storage_path    text NOT NULL,   -- ruta en bucket gestoria-docs
  uploaded_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_docs_session ON client_docs(session_id);
CREATE INDEX IF NOT EXISTS idx_client_docs_request ON client_docs(request_id);

ALTER TABLE client_docs ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede insertar y leer (uploads vía API)
CREATE POLICY "client_docs_service_insert" ON client_docs
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "client_docs_service_select" ON client_docs
  FOR SELECT TO service_role USING (true);

-- ─────────────────────────────────────────────────────────────────
-- 3. Policy SELECT en gestoria_requests para usuario autenticado
--    (un cliente ve solo sus propias solicitudes por email)
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "gestoria: cliente ve sus pedidos" ON gestoria_requests;
CREATE POLICY "gestoria: cliente ve sus pedidos"
  ON gestoria_requests FOR SELECT
  TO authenticated
  USING (client_email = auth.jwt() ->> 'email');

-- ─────────────────────────────────────────────────────────────────
-- 4. Añadir admins_emails helper (tabla con emails de admin)
--    Para el panel admin verificamos que auth.email() esté aquí.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY
);

-- Inserta tu email de admin aquí:
INSERT INTO admin_users (email) VALUES ('info@inmonest.com') ON CONFLICT DO NOTHING;

-- Policy: admin puede leer todo en gestoria_requests
DROP POLICY IF EXISTS "gestoria: admin lee todo" ON gestoria_requests;
CREATE POLICY "gestoria: admin lee todo"
  ON gestoria_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
  );

-- Policy: admin puede actualizar (cambiar step, admin_notes, contract_path)
DROP POLICY IF EXISTS "gestoria: admin actualiza" ON gestoria_requests;
CREATE POLICY "gestoria: admin actualiza"
  ON gestoria_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
  );

-- Policy: admin puede leer client_docs
DROP POLICY IF EXISTS "client_docs_admin_select" ON client_docs;
CREATE POLICY "client_docs_admin_select" ON client_docs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
  );

-- ─────────────────────────────────────────────────────────────────
-- 5. Ampliar bucket gestoria-docs para permitir más tipos de archivo
-- ─────────────────────────────────────────────────────────────────
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
],
file_size_limit = 20971520  -- 20 MB
WHERE id = 'gestoria-docs';

-- Policy: cliente autenticado sube sus propios archivos
DROP POLICY IF EXISTS "gestoria_docs_client_insert" ON storage.objects;
CREATE POLICY "gestoria_docs_client_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gestoria-docs');

-- Policy: cliente lee solo sus archivos (path empieza con su session_id)
DROP POLICY IF EXISTS "gestoria_docs_client_select" ON storage.objects;
CREATE POLICY "gestoria_docs_client_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'gestoria-docs');

-- ═════════════════════════════════════════════════════════════════════════════
-- 026_gestoria_docs_bucket.sql
-- Crea el bucket privado "gestoria-docs" para almacenar los documentos
-- subidos por clientes en el flujo de Contrato de Reserva de Compra.
--
-- EJECUTAR EN SUPABASE SQL EDITOR (requiere rol postgres / service_role)
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Crear el bucket (privado, límite 20 MB, solo PDFs)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gestoria-docs',
  'gestoria-docs',
  false,
  20971520,   -- 20 MB en bytes
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Políticas RLS
--    · service_role: acceso total (necesario para generar signed URLs desde API)
--    · Nadie más puede leer/escribir directamente (bucket privado)
-- ─────────────────────────────────────────────────────────────────────────────

-- Habilitar RLS en storage.objects (ya está activo por defecto en Supabase)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Inserción vía signed upload URL (role service_role lo gestiona internamente)
CREATE POLICY "gestoria_docs_service_insert"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'gestoria-docs');

CREATE POLICY "gestoria_docs_service_select"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'gestoria-docs');

CREATE POLICY "gestoria_docs_service_delete"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'gestoria-docs');

-- Sin acceso público anónimo ni autenticado normal
-- (los uploads se hacen vía signed URL generada por service_role)

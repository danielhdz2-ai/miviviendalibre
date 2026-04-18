-- ══════════════════════════════════════════════════════════════════
-- 030_user_panel.sql
-- Panel de usuario profesional Inmonest
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. user_favorites  (corazones en listings)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id  uuid NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user    ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_listing ON user_favorites(listing_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favoritos: usuario ve los suyos"
  ON user_favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "favoritos: usuario inserta"
  ON user_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "favoritos: usuario borra los suyos"
  ON user_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────
-- 2. user_documents  (DNI, nóminas, escrituras del usuario)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_key       text NOT NULL,   -- 'dni' | 'nomina' | 'escrituras' | 'otro'
  file_name     text NOT NULL,
  storage_path  text NOT NULL,
  status        text NOT NULL DEFAULT 'uploaded',
  -- uploaded | reviewing | validated | rejected
  notes         text,
  uploaded_at   timestamptz DEFAULT now(),
  reviewed_at   timestamptz,
  UNIQUE (user_id, doc_key)
);

CREATE INDEX IF NOT EXISTS idx_user_docs_user ON user_documents(user_id);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_docs: usuario ve los suyos"
  ON user_documents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_docs: usuario inserta"
  ON user_documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_docs: usuario actualiza los suyos"
  ON user_documents FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Nota: el acceso de admin a todos los documentos se gestiona
-- desde las API routes usando la service_role key (sin RLS).

-- ──────────────────────────────────────────────────────────────────
-- 3. user_profiles   (nombre, teléfono, bio)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  phone       text,
  avatar_url  text,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: usuario ve el suyo"
  ON user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "profiles: usuario upsert"
  ON user_profiles FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────
-- 4. Bucket user-docs para documentos personales
-- ──────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'user-docs', 'user-docs', false,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp'],
  20971520
) ON CONFLICT (id) DO NOTHING;

-- Solo el propio usuario puede subir en su carpeta
CREATE POLICY "user_docs_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user_docs_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user_docs_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

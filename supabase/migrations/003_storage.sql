-- ============================================================
-- Mi Vivienda Libre — Storage para imágenes de anuncios
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Crear bucket público para imágenes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listings',
  'listings',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (cualquiera puede ver las fotos)
CREATE POLICY "listings_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listings');

-- Subida: solo el propietario puede subir a su carpeta (userId/listingId/...)
CREATE POLICY "listings_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listings'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Borrado: solo el propietario puede borrar sus imágenes
CREATE POLICY "listings_storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listings'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

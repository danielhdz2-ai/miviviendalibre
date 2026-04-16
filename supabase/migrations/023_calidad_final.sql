-- ═════════════════════════════════════════════════════════════════════════════
-- 023_calidad_final.sql
-- Limpieza drástica de calidad — EJECUTAR EN SUPABASE SQL EDITOR
--
-- REGLAS (sin excepciones, sin respetar is_particular para las 3 primeras):
--   1. Tecnocasa — cualquier rastro residual (source_portal ILIKE '%tecnocasa%')
--   2. bedrooms IS NULL  → dato incompleto, no sirve para búsquedas
--   3. < 5 fotos en listing_images → galería insuficiente
--
-- ORDEN SEGURO:
--   Paso 1 → Tecnocasa
--   Paso 2 → bedrooms NULL   (NO toca particulares con bedrooms relleno)
--   Paso 3 → < 5 fotos       (NO toca particulares con ≥5 fotos)
--   Paso 4 → Orphan images
--   Paso 5 → SELECT de diagnóstico (comentado, ejecutar primero para auditar)
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1 — Tecnocasa al 100% (cualquier variante del slug)
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM listing_images
WHERE listing_id IN (
  SELECT id FROM listings
  WHERE source_portal ILIKE '%tecnocasa%'
);

DELETE FROM listings
WHERE source_portal ILIKE '%tecnocasa%';


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2 — bedrooms IS NULL
--   Solo se aplica a anuncios de AGENCIAS.
--   Los particulares (is_particular = true) son INMORTALES — no se borran nunca
--   por falta de datos, ya que a veces no detallan habitaciones en el anuncio.
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM listings
WHERE bedrooms IS NULL
  AND (is_particular IS NULL OR is_particular = false);


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3 — Menos de 5 fotos
--   Solo se aplica a anuncios de AGENCIAS.
--   Los particulares (is_particular = true) son INMORTALES — en Milanuncios,
--   Wallapop etc. es normal tener 1–3 fotos y el lead sigue siendo valioso.
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM listings
WHERE (
  SELECT COUNT(*)
  FROM listing_images li
  WHERE li.listing_id = listings.id
) < 5
  AND (is_particular IS NULL OR is_particular = false);


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4 — Imágenes huérfanas (limpieza por si CASCADE no actuó)
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM listing_images
WHERE listing_id NOT IN (SELECT id FROM listings);


-- ═════════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO — Ejecuta esto ANTES para ver cuántos se van a borrar
-- Descomenta y ejecuta el SELECT, confirma los números, luego lanza los DELETE
-- ═════════════════════════════════════════════════════════════════════════════
/*
SELECT
  'TOTAL'                AS categoria,
  COUNT(*)               AS registros
FROM listings

UNION ALL

SELECT
  'Tecnocasa (cualquier variante)',
  COUNT(*)
FROM listings
WHERE source_portal ILIKE '%tecnocasa%'

UNION ALL

SELECT
  'Sin habitaciones (bedrooms NULL)',
  COUNT(*)
FROM listings
WHERE bedrooms IS NULL

UNION ALL

SELECT
  'Menos de 5 fotos',
  COUNT(*)
FROM listings
WHERE (
  SELECT COUNT(*) FROM listing_images li WHERE li.listing_id = listings.id
) < 5

UNION ALL

SELECT
  'QUEDARÁN (estimado, considera solapamiento)',
  COUNT(*)
FROM listings
WHERE source_portal NOT ILIKE '%tecnocasa%'
  AND bedrooms IS NOT NULL
  AND (
    SELECT COUNT(*) FROM listing_images li WHERE li.listing_id = listings.id
  ) >= 5;
*/

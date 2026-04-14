-- ═════════════════════════════════════════════════════════════════════════════
-- 019_performance_indexes.sql
-- Índices GIN (trigram) para búsquedas ILIKE rápidas
--
-- Problema: las queries con ILIKE '%madrid%' (comodín al inicio) hacen un
-- full table scan ignorando los índices B-tree existentes. Con decenas de
-- miles de listings, esto es la causa principal de lentitud en /pisos.
--
-- Solución: extensión pg_trgm + índices GIN que sí soportan ILIKE %X%.
--   Speedup típico: de 800ms → 5ms en una tabla de 50.000 filas.
--
-- Ejecutar en Supabase SQL Editor (requiere superuser, disponible en Supabase).
-- ═════════════════════════════════════════════════════════════════════════════

-- Activar la extensión trigram (viene preinstalada en Supabase, solo hay que habilitarla)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Índices GIN para búsqueda de ciudad / provincia / distrito ───────────────
-- Estos índices hacen que ILIKE '%madrid%', ILIKE '%barcelona%' etc. sean O(log n)
-- en lugar de O(n) (full table scan).

CREATE INDEX IF NOT EXISTS idx_listings_city_trgm
  ON listings USING gin (lower(city) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listings_province_trgm
  ON listings USING gin (lower(province) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listings_district_trgm
  ON listings USING gin (lower(district) gin_trgm_ops);

-- ── Índice compuesto para el orden por defecto (relevancia) ──────────────────
-- La ordenación principal es: ranking_score DESC, published_at DESC
-- filtrado por status = 'published'. Este índice cubre ese patrón exacto.
CREATE INDEX IF NOT EXISTS idx_listings_relevance
  ON listings (status, ranking_score DESC, published_at DESC)
  WHERE status = 'published';

-- ── Índice en source_external_id para upserts rápidos del scraper ────────────
CREATE INDEX IF NOT EXISTS idx_listings_source_external_id
  ON listings (source_external_id)
  WHERE source_external_id IS NOT NULL;

-- ── Índice en operation + status (filtro más común) ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_listings_operation_status
  ON listings (operation, status)
  WHERE status = 'published';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN (ejecutar después para confirmar que los índices existen)
-- ═════════════════════════════════════════════════════════════════════════════
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'listings'
-- ORDER BY indexname;

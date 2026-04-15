-- ═════════════════════════════════════════════════════════════════════════════
-- 020_limpieza_stock_seguridad.sql  (v2 — reglas estrictas)
--
-- REGLAS INNEGOCIABLES (se aplican a TODOS los portales salvo is_particular):
--   ✅ is_particular = true          → SIEMPRE se conservan, sin excepciones
--   🗑️ tecnocasa.es / tecnocasa     → 100% borrados
--   🗑️ bedrooms IS NULL             → borrados (dato incompleto)
--   🗑️ < 5 fotos en listing_images  → borrados (fotos insuficientes)
--   🗑️ título empieza por "Inmueble en" → borrados (sin datos reales)
--
-- CUOTAS (sólo para los que superan los filtros anteriores):
--   🏠 pisos.com    → 100 Madrid · 100 Barcelona · 100 Valencia
--                     100 Andalucía · 200 Resto España  (600 total)
--   🏠 tucasa.com   → 50 Madrid · 50 Barcelona · 50 Valencia
--                     50 Andalucía  (200 total)
--   🏠 gilmar.es    → 50 más recientes en total
--   🗑️ Resto        → DELETE (portales que no están explícitamente incluidos)
--
-- CÓMO USAR:
--   1. Ejecuta primero el SELECT de diagnóstico (sección DIAGNÓSTICO al final)
--   2. Si los números son razonables, ejecuta los DELETE de abajo
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1 — Borrar Tecnocasa al 100% (+ sus imágenes, aunque CASCADE lo haría)
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM listing_images
WHERE listing_id IN (
  SELECT id FROM listings
  WHERE source_portal IN ('tecnocasa.es', 'tecnocasa')
);

DELETE FROM listings
WHERE source_portal IN ('tecnocasa.es', 'tecnocasa');


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2 — Limpieza general: bedrooms NULL + < 5 fotos + título "Inmueble en"
--           (excluye particulares — ellos nunca se tocan)
-- ─────────────────────────────────────────────────────────────────────────────

-- 2a) Sin habitaciones (excepto particulares)
DELETE FROM listings
WHERE is_particular = false
  AND bedrooms IS NULL;

-- 2b) Menos de 5 fotos (excepto particulares)
DELETE FROM listings
WHERE is_particular = false
  AND (
    SELECT COUNT(*) FROM listing_images li WHERE li.listing_id = listings.id
  ) < 5;

-- 2c) Título genérico tipo "Inmueble en …" (excepto particulares)
DELETE FROM listings
WHERE is_particular = false
  AND title ILIKE 'Inmueble en%';


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3 — Cuotas por portal (DELETE de lo que excede el cupo)
--           Sólo actúa sobre pisos.com, tucasa.com y gilmar.es
--           El resto de portales no mencionados (Solvia, Aliseda, Monapart,
--           Servihabitat, Enalquiler, Milanuncios…) se conservan intactos.
-- ─────────────────────────────────────────────────────────────────────────────
WITH to_keep AS (

  -- ══════════════════════════════════════════════════════════════════
  -- BLOQUE 0 — TODOS los particulares (INTOCABLES)
  -- ══════════════════════════════════════════════════════════════════
  SELECT id FROM listings WHERE is_particular = true

  UNION ALL

  -- ══════════════════════════════════════════════════════════════════
  -- BLOQUE 1 — pisos.com (600 total)
  -- ══════════════════════════════════════════════════════════════════

  -- 100 Madrid
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings
    WHERE source_portal = 'pisos.com'
      AND is_particular = false
      AND (city ILIKE '%madrid%' OR province ILIKE '%madrid%')
  ) x WHERE rn <= 100

  UNION ALL

  -- 100 Barcelona
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings
    WHERE source_portal = 'pisos.com'
      AND is_particular = false
      AND (city ILIKE '%barcelona%' OR province ILIKE '%barcelona%')
  ) x WHERE rn <= 100

  UNION ALL

  -- 100 Valencia
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings
    WHERE source_portal = 'pisos.com'
      AND is_particular = false
      AND (city ILIKE '%valencia%' OR province ILIKE '%valencia%')
  ) x WHERE rn <= 100

  UNION ALL

  -- 100 Andalucía
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings
    WHERE source_portal = 'pisos.com'
      AND is_particular = false
      AND province ILIKE ANY(ARRAY[
        '%sevilla%','%málaga%','%malaga%','%granada%',
        '%córdoba%','%cordoba%','%huelva%','%cádiz%',
        '%cadiz%','%almería%','%almeria%','%jaén%','%jaen%'
      ])
  ) x WHERE rn <= 100

  UNION ALL

  -- 200 Resto España
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings
    WHERE source_portal = 'pisos.com'
      AND is_particular = false
      AND city   NOT ILIKE '%madrid%'    AND province NOT ILIKE '%madrid%'
      AND city   NOT ILIKE '%barcelona%' AND province NOT ILIKE '%barcelona%'
      AND city   NOT ILIKE '%valencia%'  AND province NOT ILIKE '%valencia%'
      AND province NOT ILIKE ALL(ARRAY[
        '%sevilla%','%málaga%','%malaga%','%granada%',
        '%córdoba%','%cordoba%','%huelva%','%cádiz%',
        '%cadiz%','%almería%','%almeria%','%jaén%','%jaen%'
      ])
  ) x WHERE rn <= 200

  UNION ALL

  -- ══════════════════════════════════════════════════════════════════
  -- BLOQUE 2 — tucasa.com (200 total)
  -- ══════════════════════════════════════════════════════════════════

  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings
    WHERE source_portal = 'tucasa.com'
      AND (city ILIKE '%madrid%' OR province ILIKE '%madrid%')
  ) x WHERE rn <= 50

  UNION ALL

  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings
    WHERE source_portal = 'tucasa.com'
      AND (city ILIKE '%barcelona%' OR province ILIKE '%barcelona%')
  ) x WHERE rn <= 50

  UNION ALL

  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings
    WHERE source_portal = 'tucasa.com'
      AND (city ILIKE '%valencia%' OR province ILIKE '%valencia%')
  ) x WHERE rn <= 50

  UNION ALL

  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings
    WHERE source_portal = 'tucasa.com'
      AND province ILIKE ANY(ARRAY[
        '%sevilla%','%málaga%','%malaga%','%granada%',
        '%córdoba%','%cordoba%','%huelva%','%cádiz%',
        '%cadiz%','%almería%','%almeria%','%jaén%','%jaen%'
      ])
  ) x WHERE rn <= 50

  UNION ALL

  -- ══════════════════════════════════════════════════════════════════
  -- BLOQUE 3 — gilmar.es (50 más recientes en total)
  -- ══════════════════════════════════════════════════════════════════
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings WHERE source_portal = 'gilmar.es'
  ) x WHERE rn <= 50

  UNION ALL

  -- ══════════════════════════════════════════════════════════════════
  -- BLOQUE 4 — Todos los demás portales no controlados por cuota
  --   (Solvia, Aliseda, Servihabitat, Monapart, Enalquiler,
  --    Milanuncios, Fotocasa particulares, Habitaclia…)
  -- ══════════════════════════════════════════════════════════════════
  SELECT id FROM listings
  WHERE source_portal NOT IN (
    'pisos.com', 'tucasa.com', 'tecnocasa.es', 'tecnocasa', 'gilmar.es'
  )

)
DELETE FROM listings
WHERE id NOT IN (SELECT DISTINCT id FROM to_keep)
  -- Nunca tocar particulares (doble seguro)
  AND is_particular = false;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4 — Limpiar imágenes huérfanas (listing_id sin listings existente)
--           listing_images tiene ON DELETE CASCADE, pero por si acaso
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM listing_images
WHERE listing_id NOT IN (SELECT id FROM listings);


-- ═════════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO — ejecuta este SELECT ANTES del bloque anterior para
-- ver cuántos pisos quedarán en cada portal
-- ═════════════════════════════════════════════════════════════════════════════
/*
SELECT
  source_portal,
  COUNT(*)                                                        AS total,
  SUM(CASE WHEN is_particular THEN 1 ELSE 0 END)                 AS particulares,
  SUM(CASE WHEN bedrooms IS NULL THEN 1 ELSE 0 END)              AS sin_habitaciones,
  SUM(CASE WHEN title ILIKE 'Inmueble en%' THEN 1 ELSE 0 END)    AS titulo_generico,
  SUM(CASE WHEN (
    SELECT COUNT(*) FROM listing_images li WHERE li.listing_id = listings.id
  ) < 5 THEN 1 ELSE 0 END)                                       AS menos_5_fotos
FROM listings
GROUP BY source_portal
ORDER BY total DESC;
*/

  -- ══════════════════════════════════════════════════════════════════
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings WHERE source_portal = 'tecnocasa.es'
  ) x WHERE rn <= 50

  UNION ALL

  -- ══════════════════════════════════════════════════════════════════
  -- BLOQUE 4 — Gilmar (50 total, más recientes)
  -- ══════════════════════════════════════════════════════════════════
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings WHERE source_portal = 'gilmar.es'
  ) x WHERE rn <= 50

  UNION ALL

  -- ══════════════════════════════════════════════════════════════════
  -- BLOQUE 5 — Portales no citados: conservar todos para no perder nada útil
  --   (Solvia, Aliseda, Redpiso, Monapart, Milanuncios, Fotocasa, Habitaclia…)
  -- ══════════════════════════════════════════════════════════════════
  SELECT id FROM listings
  WHERE source_portal NOT IN ('pisos.com', 'tucasa.com', 'tecnocasa.es', 'gilmar.es')

)
DELETE FROM listings
WHERE id NOT IN (SELECT DISTINCT id FROM to_keep);


-- ─────────────────────────────────────────────────────────────────────────────
-- DIAGNÓSTICO — ejecuta ANTES del DELETE para confirmar recuentos esperados
-- ─────────────────────────────────────────────────────────────────────────────
/*
SELECT source_portal, count(*) AS total,
       sum(CASE WHEN is_particular THEN 1 ELSE 0 END) AS particulares
FROM listings
GROUP BY source_portal
ORDER BY total DESC;
*/

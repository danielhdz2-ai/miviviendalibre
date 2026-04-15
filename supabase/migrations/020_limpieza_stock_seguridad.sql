-- ═════════════════════════════════════════════════════════════════════════════
-- 020_limpieza_stock_seguridad.sql
-- Reducción de ~9.000 → ~900 registros (web más rápida)
--
-- REGLAS:
--   ✅ is_particular = true  → INTOCABLES (todos se quedan)
--   🏢 pisos.com             → 100 Madrid · 100 Barcelona · 100 Valencia
--                              100 Andalucía · 200 Resto España  (600 total)
--   🏠 TuCasa                → 50 Madrid · 50 Barcelona · 50 Valencia
--                              50 Andalucía  (200 total)
--   🏢 Tecnocasa             → 50 más recientes en total
--   🏢 Gilmar                → 50 más recientes en total
--   🗑️ El resto              → DELETE
--
-- EJECUCIÓN SEGURA: primero ejecuta el SELECT de diagnóstico (al final)
-- para confirmar los recuentos antes de lanzar el DELETE.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER: zonas geográficas
-- ─────────────────────────────────────────────────────────────────────────────
-- zona_madrid    → city/province contiene 'madrid'
-- zona_barcelona → city/province contiene 'barcelona'
-- zona_valencia  → city/province contiene 'valencia'
-- zona_andalucia → province IN Sevilla, Málaga, Granada, Córdoba, Huelva, Cádiz, Almería, Jaén
-- zona_resto     → todo lo demás

-- ─────────────────────────────────────────────────────────────────────────────
-- DELETE principal — usa CTE para calcular cuáles se quedan
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
      AND province ILIKE ANY(ARRAY['%sevilla%','%málaga%','%malaga%','%granada%',
                                    '%córdoba%','%cordoba%','%huelva%','%cádiz%',
                                    '%cadiz%','%almería%','%almeria%','%jaén%','%jaen%'])
  ) x WHERE rn <= 100

  UNION ALL

  -- 200 Resto España (excluye las 4 zonas anteriores)
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) rn
    FROM listings
    WHERE source_portal = 'pisos.com'
      AND is_particular = false
      AND city   NOT ILIKE '%madrid%'    AND province NOT ILIKE '%madrid%'
      AND city   NOT ILIKE '%barcelona%' AND province NOT ILIKE '%barcelona%'
      AND city   NOT ILIKE '%valencia%'  AND province NOT ILIKE '%valencia%'
      AND province NOT ILIKE ALL(ARRAY['%sevilla%','%málaga%','%malaga%','%granada%',
                                        '%córdoba%','%cordoba%','%huelva%','%cádiz%',
                                        '%cadiz%','%almería%','%almeria%','%jaén%','%jaen%'])
  ) x WHERE rn <= 200

  UNION ALL

  -- ══════════════════════════════════════════════════════════════════
  -- BLOQUE 2 — TuCasa (200 total)
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
      AND province ILIKE ANY(ARRAY['%sevilla%','%málaga%','%malaga%','%granada%',
                                    '%córdoba%','%cordoba%','%huelva%','%cádiz%',
                                    '%cadiz%','%almería%','%almeria%','%jaén%','%jaen%'])
  ) x WHERE rn <= 50

  UNION ALL

  -- ══════════════════════════════════════════════════════════════════
  -- BLOQUE 3 — Tecnocasa (50 total, más recientes)
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

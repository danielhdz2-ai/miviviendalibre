-- ═════════════════════════════════════════════════════════════════════════════
-- 017_reparacion_historica.sql
-- Reparación histórica de is_particular en la tabla listings
--
-- Estrategia: "si el portal dijo particular, es particular"
-- Solo corregimos los casos donde el nombre del anunciante es claramente
-- corporativo (S.L., S.A., inmo…) o está vacío (registros huérfanos).
--
-- INSTRUCCIONES:
--   1. Ejecuta primero los SELECT de diagnóstico (final del script).
--   2. Ejecuta los UPDATE.
--   3. Vuelve a ejecutar los SELECT para confirmar que el resultado sea 0.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 1 — Anunciantes con sufijo societario
-- S.L., S.A., S.L.U., S.C.P., C.B., S.COOP. → agencia segura
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE listings
SET    is_particular  = false,
       ranking_score  = 30,
       updated_at     = now()
WHERE  is_particular  = true
  AND  status         = 'published'
  AND  advertiser_name IS NOT NULL
  AND  (
    advertiser_name ~* '\yS\.?\s*L\.?\s*U?\.?\s*\y'
    OR advertiser_name ~* '\yS\.?\s*A\.?\s*\y'
    OR advertiser_name ~* '\yS\.?\s*C\.?\s*P?\.?\s*\y'
    OR advertiser_name ~* '\yC\.?\s*B\.?\s*\y'
    OR advertiser_name ILIKE '%s.coop%'
    OR advertiser_name ILIKE '%sociedad limitada%'
    OR advertiser_name ILIKE '%sociedad an_nima%'
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 2 — Palabras clave corporativas en el nombre del anunciante
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE listings
SET    is_particular  = false,
       ranking_score  = 30,
       updated_at     = now()
WHERE  is_particular  = true
  AND  status         = 'published'
  AND  advertiser_name IS NOT NULL
  AND  (
    advertiser_name ILIKE '%inmobiliaria%'
    OR advertiser_name ILIKE '%inmuebles%'
    OR advertiser_name ILIKE '%gestión%'
    OR advertiser_name ILIKE '%gestion%'
    OR advertiser_name ILIKE '%asesores%'
    OR advertiser_name ILIKE '%asesoría%'
    OR advertiser_name ILIKE '%asesoria%'
    OR advertiser_name ILIKE '%finques%'
    OR advertiser_name ILIKE '%fincas%'
    OR advertiser_name ILIKE '%propiedades%'
    OR advertiser_name ILIKE '%inversiones%'
    OR advertiser_name ILIKE '%promotora%'
    OR advertiser_name ILIKE '%constructora%'
    OR advertiser_name ILIKE '%real estate%'
    OR advertiser_name ILIKE '%consulting%'
    OR advertiser_name ILIKE '%management%'
    OR advertiser_name ILIKE '%grupo inmo%'
    OR advertiser_name ILIKE '%servicios inmob%'
    OR advertiser_name ILIKE '%agencia%'
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 3 — Nombres todo en MAYÚSCULAS (4+ letras consecutivas)
-- Patrón de empresa: TUKSA, TOT FINQUES, JLL, CBRE, AEDAS…
-- Excluimos nombres cortos tipo "J.M." o iniciales legítimas de persona
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE listings
SET    is_particular  = false,
       ranking_score  = 30,
       updated_at     = now()
WHERE  is_particular  = true
  AND  status         = 'published'
  AND  advertiser_name IS NOT NULL
  -- Contiene 4+ letras en mayúsculas seguidas y NO tiene ninguna minúscula (≥3 minúsculas)
  AND  advertiser_name ~ '[A-ZÁÉÍÓÚÜÑ]{4,}'
  AND  advertiser_name !~ '[a-záéíóúüñ]{3,}';


-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 4 — Advertiser_name vacío (registros antiguos sin nombre)
-- Si no tenemos nombre de anunciante no podemos confirmar que sea particular
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE listings
SET    is_particular  = false,
       ranking_score  = 30,
       updated_at     = now()
WHERE  is_particular  = true
  AND  status         = 'published'
  AND  (advertiser_name IS NULL OR trim(advertiser_name) = '');


-- ─────────────────────────────────────────────────────────────────────────────
-- DIAGNÓSTICO — Ejecuta primero para ver cuántos afecta cada regla
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 'PARTE 1 — sufijo societario' AS regla,
       count(*) AS afectados
FROM   listings
WHERE  is_particular = true AND status = 'published'
  AND  advertiser_name IS NOT NULL
  AND  (
    advertiser_name ~* '\yS\.?\s*L\.?\s*U?\.?\s*\y'
    OR advertiser_name ~* '\yS\.?\s*A\.?\s*\y'
    OR advertiser_name ILIKE '%sociedad limitada%'
  )

UNION ALL

SELECT 'PARTE 2 — palabras clave empresa' AS regla,
       count(*) AS afectados
FROM   listings
WHERE  is_particular = true AND status = 'published'
  AND  advertiser_name IS NOT NULL
  AND  (
    advertiser_name ILIKE '%inmobiliaria%'
    OR advertiser_name ILIKE '%finques%'
    OR advertiser_name ILIKE '%promotora%'
    OR advertiser_name ILIKE '%real estate%'
  )

UNION ALL

SELECT 'PARTE 3 — todo en MAYÚSCULAS' AS regla,
       count(*) AS afectados
FROM   listings
WHERE  is_particular = true AND status = 'published'
  AND  advertiser_name IS NOT NULL
  AND  advertiser_name ~ '[A-ZÁÉÍÓÚÜÑ]{4,}'
  AND  advertiser_name !~ '[a-záéíóúüñ]{3,}'

UNION ALL

SELECT 'PARTE 4 — sin advertiser_name' AS regla,
       count(*) AS afectados
FROM   listings
WHERE  is_particular = true AND status = 'published'
  AND  (advertiser_name IS NULL OR trim(advertiser_name) = '')

ORDER BY regla;

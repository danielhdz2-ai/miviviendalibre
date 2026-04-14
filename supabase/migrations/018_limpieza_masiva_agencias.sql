-- ═════════════════════════════════════════════════════════════════════════════
-- 018_limpieza_masiva_agencias.sql
-- Reclasificación masiva: agencias infiltradas → is_particular = false
--
-- CÓMO USAR EN SUPABASE SQL EDITOR:
--   1. Ejecuta primero el bloque DIAGNÓSTICO (al final) → anota los conteos.
--   2. Ejecuta el UPDATE único de abajo.
--   3. Repite el DIAGNÓSTICO → todos deben mostrar 0.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATE ÚNICO — Un solo pase, todas las reglas en OR
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE listings
SET
  is_particular = false,
  ranking_score = 30,
  updated_at    = now()
WHERE is_particular = true
  AND status        = 'published'
  AND (

    -- ══════════════════════════════════════════════════════════════════════════
    -- BLOQUE A — Sufijos societarios (S.L., S.A., S.L.U., C.B., S.COOP…)
    -- ══════════════════════════════════════════════════════════════════════════
    advertiser_name ~* '\mS\.?\s*L\.?\s*U?\.?\s*\M'
    OR advertiser_name ~* '\mS\.?\s*A\.?\s*\M'
    OR advertiser_name ~* '\mS\.?\s*C\.?\s*P?\.?\s*\M'
    OR advertiser_name ~* '\mC\.?\s*B\.?\s*\M'
    OR advertiser_name ILIKE '%s.coop%'
    OR advertiser_name ILIKE '%sociedad limitada%'
    OR advertiser_name ILIKE '%sociedad anónima%'
    OR advertiser_name ILIKE '%sociedad anonima%'

    -- ══════════════════════════════════════════════════════════════════════════
    -- BLOQUE B — Palabras clave corporativas genéricas
    -- ══════════════════════════════════════════════════════════════════════════
    OR advertiser_name ILIKE '%inmobiliaria%'
    OR advertiser_name ILIKE '%inmuebles%'
    OR advertiser_name ILIKE '%inmo%'           -- InmoSureste, InmoMadrid…
    OR advertiser_name ILIKE '%gestión%'
    OR advertiser_name ILIKE '%gestion%'
    OR advertiser_name ILIKE '%gestoria%'
    OR advertiser_name ILIKE '%gestoría%'
    OR advertiser_name ILIKE '%asesores%'
    OR advertiser_name ILIKE '%asesoría%'
    OR advertiser_name ILIKE '%asesoria%'
    OR advertiser_name ILIKE '%consulting%'
    OR advertiser_name ILIKE '%consultores%'
    OR advertiser_name ILIKE '%real estate%'
    OR advertiser_name ILIKE '%properties%'
    OR advertiser_name ILIKE '%propiedades%'
    OR advertiser_name ILIKE '%finques%'
    OR advertiser_name ILIKE '%fincas%'
    OR advertiser_name ILIKE '%promotora%'
    OR advertiser_name ILIKE '%constructora%'
    OR advertiser_name ILIKE '%inversiones%'
    OR advertiser_name ILIKE '%grupo%'
    OR advertiser_name ILIKE '%services%'
    OR advertiser_name ILIKE '%servicios%'
    OR advertiser_name ILIKE '%homes%'          -- Infinity Homes, BCN Homes…
    OR advertiser_name ILIKE '%management%'
    OR advertiser_name ILIKE '%patrimon%'
    OR advertiser_name ILIKE '%agencia%'
    OR advertiser_name ILIKE '%alquileres%'
    OR advertiser_name ILIKE '%pisos%'

    -- ══════════════════════════════════════════════════════════════════════════
    -- BLOQUE C — Marcas conocidas de agencias (aunque no tengan S.L.)
    -- ══════════════════════════════════════════════════════════════════════════
    OR advertiser_name ILIKE '%infinity%'       -- Infinity Marbella
    OR advertiser_name ILIKE '%tot finques%'
    OR advertiser_name ILIKE '%remax%'
    OR advertiser_name ILIKE '%keller williams%'
    OR advertiser_name ILIKE '%century 21%'
    OR advertiser_name ILIKE '%engel%'          -- Engel & Völkers
    OR advertiser_name ILIKE '%coldwell%'
    OR advertiser_name ILIKE '%lucas fox%'
    OR advertiser_name ILIKE '%savills%'
    OR advertiser_name ILIKE '%cbre%'
    OR advertiser_name ILIKE '%jll%'
    OR advertiser_name ILIKE '%housell%'
    OR advertiser_name ILIKE '%donpiso%'
    OR advertiser_name ILIKE '%tecnocasa%'
    OR advertiser_name ILIKE '%redpiso%'
    OR advertiser_name ILIKE '%monapart%'
    OR advertiser_name ILIKE '%gilmar%'
    OR advertiser_name ILIKE '%servihabitat%'
    OR advertiser_name ILIKE '%solvia%'
    OR advertiser_name ILIKE '%aliseda%'
    OR advertiser_name ILIKE '%neinor%'
    OR advertiser_name ILIKE '%aedas%'
    OR advertiser_name ILIKE '%metrovacesa%'
    OR advertiser_name ILIKE '%kronos%'
    OR advertiser_name ILIKE '%anticipa%'
    OR advertiser_name ILIKE '%haya real%'
    OR advertiser_name ILIKE '%altamira%'
    OR advertiser_name ILIKE '%amat%'
    OR advertiser_name ILIKE '%habitaclia%'     -- nombre de portal usado como anunciante
    OR advertiser_name ILIKE '%fotocasa%'

    -- ══════════════════════════════════════════════════════════════════════════
    -- BLOQUE D — Nombre TODO EN MAYÚSCULAS (5+ caracteres alfa consecutivos)
    -- Patrón: INFINITY MARBELLA, TOT FINQUES, TUKSA, JLL, CBRE, AEDAS…
    -- Excluye nombres cortos tipo iniciales (J.M., A.G.)
    -- ══════════════════════════════════════════════════════════════════════════
    OR (
      advertiser_name ~ '[A-ZÁÉÍÓÚÜÑ]{5,}'     -- al menos 5 mayúsculas seguidas
      AND advertiser_name !~ '[a-záéíóúüñ]{3,}' -- sin minúsculas (≥3 consecutivas)
      AND length(trim(advertiser_name)) >= 6    -- descartar siglas muy cortas válidas
    )

    -- ══════════════════════════════════════════════════════════════════════════
    -- BLOQUE E — advertiser_name vacío (sin nombre = no podemos confirmar particular)
    -- ══════════════════════════════════════════════════════════════════════════
    OR advertiser_name IS NULL
    OR trim(advertiser_name) = ''

  );


-- ─────────────────────────────────────────────────────────────────────────────
-- DIAGNÓSTICO — Ejecuta ANTES del UPDATE para ver el impacto por bloque
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  'Total is_particular=true afectados (todos los bloques)' AS descripcion,
  count(*) AS registros
FROM listings
WHERE is_particular = true
  AND status = 'published'
  AND (
    advertiser_name ~* '\mS\.?\s*L\.?\s*U?\.?\s*\M'
    OR advertiser_name ~* '\mS\.?\s*A\.?\s*\M'
    OR advertiser_name ILIKE '%inmobiliaria%'
    OR advertiser_name ILIKE '%inmo%'
    OR advertiser_name ILIKE '%gestión%'
    OR advertiser_name ILIKE '%gestion%'
    OR advertiser_name ILIKE '%consulting%'
    OR advertiser_name ILIKE '%real estate%'
    OR advertiser_name ILIKE '%properties%'
    OR advertiser_name ILIKE '%finques%'
    OR advertiser_name ILIKE '%group%'
    OR advertiser_name ILIKE '%grupo%'
    OR advertiser_name ILIKE '%services%'
    OR advertiser_name ILIKE '%homes%'
    OR advertiser_name ILIKE '%infinity%'
    OR advertiser_name ILIKE '%tot finques%'
    OR advertiser_name ILIKE '%remax%'
    OR advertiser_name ILIKE '%tecnocasa%'
    OR advertiser_name ILIKE '%redpiso%'
    OR (
      advertiser_name ~ '[A-ZÁÉÍÓÚÜÑ]{5,}'
      AND advertiser_name !~ '[a-záéíóúüñ]{3,}'
      AND length(trim(advertiser_name)) >= 6
    )
    OR advertiser_name IS NULL
    OR trim(advertiser_name) = ''
  )

UNION ALL

SELECT 'Desglose — sufijos societarios', count(*)
FROM listings WHERE is_particular=true AND status='published'
  AND advertiser_name ~* '\mS\.?\s*[LA]\.?\s*\M'

UNION ALL

SELECT 'Desglose — palabras clave corporativas', count(*)
FROM listings WHERE is_particular=true AND status='published'
  AND (
    advertiser_name ILIKE '%inmo%' OR advertiser_name ILIKE '%gestión%'
    OR advertiser_name ILIKE '%consulting%' OR advertiser_name ILIKE '%real estate%'
    OR advertiser_name ILIKE '%properties%' OR advertiser_name ILIKE '%finques%'
    OR advertiser_name ILIKE '%services%' OR advertiser_name ILIKE '%homes%'
    OR advertiser_name ILIKE '%infinity%'
  )

UNION ALL

SELECT 'Desglose — nombres en MAYÚSCULAS (5+)', count(*)
FROM listings WHERE is_particular=true AND status='published'
  AND advertiser_name ~ '[A-ZÁÉÍÓÚÜÑ]{5,}'
  AND advertiser_name !~ '[a-záéíóúüñ]{3,}'
  AND length(trim(advertiser_name)) >= 6

UNION ALL

SELECT 'Desglose — sin advertiser_name', count(*)
FROM listings WHERE is_particular=true AND status='published'
  AND (advertiser_name IS NULL OR trim(advertiser_name) = '')

ORDER BY descripcion;


-- ─────────────────────────────────────────────────────────────────────────────
-- VISTA PREVIA de los 50 más sospechosos (antes de ejecutar el UPDATE)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  id,
  advertiser_name,
  source_portal,
  city,
  price_eur,
  created_at::date AS fecha
FROM listings
WHERE is_particular = true
  AND status = 'published'
  AND (
    advertiser_name ILIKE '%inmo%'
    OR advertiser_name ILIKE '%gestión%'
    OR advertiser_name ILIKE '%real estate%'
    OR advertiser_name ILIKE '%properties%'
    OR advertiser_name ILIKE '%finques%'
    OR advertiser_name ILIKE '%services%'
    OR advertiser_name ILIKE '%homes%'
    OR advertiser_name ILIKE '%infinity%'
    OR (
      advertiser_name ~ '[A-ZÁÉÍÓÚÜÑ]{5,}'
      AND advertiser_name !~ '[a-záéíóúüñ]{3,}'
      AND length(trim(advertiser_name)) >= 6
    )
  )
ORDER BY created_at DESC
LIMIT 50;

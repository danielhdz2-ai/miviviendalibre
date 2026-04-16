-- ═════════════════════════════════════════════════════════════════════════════
-- 024_cleanup_agencias_45dias.sql
-- Política de caducidad: Canal AGENCIA (Modo Boutique)
--
-- REGLA DE ORO:
--   Los anuncios de PARTICULARES (is_particular = true) son INMORTALES.
--   NUNCA se borran por caducidad. Solo por decisión manual explícita.
--
-- AGENCIAS: caducan a los 45 días desde created_at.
--   Esto mantiene el stock fresco y fuerza la rotación diaria de los 14 bots.
--
-- USO:
--   1. Ejecutar en Supabase SQL Editor para crear la función.
--   2. Llamar manualmente: SELECT cleanup_agencias_expired();
--   3. O programar via pg_cron (Supabase Pro):
--        SELECT cron.schedule(
--          'cleanup-agencias-diario',
--          '0 3 * * *',   -- cada día a las 03:00 UTC
--          'SELECT cleanup_agencias_expired();'
--        );
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCIÓN: cleanup_agencias_expired()
-- Borra anuncios de agencia con más de 45 días de antigüedad.
-- NUNCA toca is_particular = true.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_agencias_expired()
RETURNS TABLE(
  borrados_listings  bigint,
  borradas_imagenes  bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_listing_ids  uuid[];
  v_img_count    bigint;
  v_lst_count    bigint;
BEGIN
  -- 1. Recoger IDs caducados (solo agencias, nunca particulares)
  SELECT ARRAY_AGG(id)
  INTO   v_listing_ids
  FROM   listings
  WHERE  (is_particular IS NULL OR is_particular = false)
    AND  created_at < NOW() - INTERVAL '45 days';

  IF v_listing_ids IS NULL OR array_length(v_listing_ids, 1) = 0 THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint;
    RETURN;
  END IF;

  -- 2. Borrar imágenes primero (FK safety aunque exista CASCADE)
  DELETE FROM listing_images
  WHERE listing_id = ANY(v_listing_ids);
  GET DIAGNOSTICS v_img_count = ROW_COUNT;

  -- 3. Borrar listings caducados
  DELETE FROM listings
  WHERE id = ANY(v_listing_ids);
  GET DIAGNOSTICS v_lst_count = ROW_COUNT;

  -- 4. Devolver contadores
  RETURN QUERY SELECT v_lst_count, v_img_count;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- DIAGNÓSTICO — ¿Cuántos caducarían ahora mismo?
-- Ejecuta esto antes del DELETE para auditar.
-- ─────────────────────────────────────────────────────────────────────────────
/*
SELECT
  'Agencias candidatas a borrar (>45 días)'  AS categoria,
  COUNT(*)                                   AS registros
FROM listings
WHERE (is_particular IS NULL OR is_particular = false)
  AND created_at < NOW() - INTERVAL '45 days'

UNION ALL

SELECT
  'Particulares INMORTALES (nunca se borran)',
  COUNT(*)
FROM listings
WHERE is_particular = true

UNION ALL

SELECT
  'Agencias activas (<= 45 días)',
  COUNT(*)
FROM listings
WHERE (is_particular IS NULL OR is_particular = false)
  AND created_at >= NOW() - INTERVAL '45 days';
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- EJECUCIÓN MANUAL (cuando quieras limpiar)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT * FROM cleanup_agencias_expired();


-- ─────────────────────────────────────────────────────────────────────────────
-- PROGRAMACIÓN AUTOMÁTICA via pg_cron (solo Supabase Pro/Team)
-- Descomenta si tienes pg_cron habilitado.
-- ─────────────────────────────────────────────────────────────────────────────
/*
SELECT cron.schedule(
  'mvl-cleanup-agencias-45d',   -- nombre del job (único)
  '0 3 * * *',                  -- cada noche a las 03:00 UTC
  'SELECT cleanup_agencias_expired();'
);
*/

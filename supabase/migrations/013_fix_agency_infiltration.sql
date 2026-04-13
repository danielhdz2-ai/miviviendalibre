-- ─────────────────────────────────────────────────────────────────────────────
-- 013_fix_agency_infiltration.sql
--
-- Limpieza retroactiva de anuncios de agencia erróneamente marcados
-- como is_particular = true.
-- Se aplican 3 capas de detección, todas conservativas (nunca borran).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Capa 1: keywords de agencia en título o descripción ──────────────────────
-- Palabras que un particular nunca usaría en su anuncio.
UPDATE listings
SET
  is_particular   = false,
  ranking_score   = 30
WHERE
  is_particular = true
  AND status    = 'published'
  AND (
    -- Términos operativos de agencia
    title        ~* '\m(inmobiliaria|agencia\s+inmobiliaria|honorarios|gastos\s+de\s+gesti[oó]n|comisi[oó]n\s+de\s+agencia|asesor\s+inmobiliario|consulting\s+inmobiliario|puntos\s+de\s+venta)\M'
    OR description ~* '\m(inmobiliaria|agencia\s+inmobiliaria|honorarios|gastos\s+de\s+gesti[oó]n|comisi[oó]n\s+de\s+agencia|asesor\s+inmobiliario|consulting\s+inmobiliario|puntos\s+de\s+venta)\M'

    -- Emails corporativos (info@, ventas@, contacto@, alquiler@...)
    OR description ~* '[a-z0-9._%+\-]+(info|ventas|contacto|alquiler|pisos|venta|arrendamiento)@[a-z0-9.\-]+\.[a-z]{2,}'
    OR title       ~* '[a-z0-9._%+\-]+(info|ventas|contacto|alquiler|pisos|venta|arrendamiento)@[a-z0-9.\-]+\.[a-z]{2,}'

    -- Nombres de franquicias / cadenas conocidas
    OR title        ~* '\m(finques\s+\w+|remax|re/max|century\s*21|era\s+inmobiliaria|look\s+&\s+find|donpiso|housell|engel\s*&\s*v[oö]lkers|coldwell\s+banker|keller\s+williams|tecnocasa|redpiso|gilmar|solvia|aliseda|monapart|servihabitat|habitaclia|idealista|fotocasa|alquiler\s+seguro|vivenda\s+clau|comprarcasa|amat\s+inmobiliaris|bcn\s+advisors)\M'
    OR description  ~* '\m(finques\s+\w+|remax|re/max|century\s*21|era\s+inmobiliaria|look\s+&\s+find|donpiso|housell|engel\s*&\s*v[oö]lkers|coldwell\s+banker|keller\s+williams|tecnocasa|redpiso|gilmar|solvia|aliseda|monapart|servihabitat|habitaclia|idealista|fotocasa|alquiler\s+seguro|vivenda\s+clau|comprarcasa|amat\s+inmobiliaris|bcn\s+advisors)\M'
  );

-- ── Capa 2: portales de agencia que nunca debieron entrar como particular ─────
-- Por si el flag AGENCY_PORTALS en utils.ts no estaba activo en versiones previas.
UPDATE listings
SET
  is_particular = false,
  ranking_score = 30
WHERE
  is_particular = true
  AND status    = 'published'
  AND source_portal IN (
    'tecnocasa', 'redpiso', 'gilmar', 'solvia', 'aliseda',
    'monapart', 'servihabitat', 'habitaclia', 'fotocasa'
  );

-- ── Capa 3: teléfonos con alta frecuencia (umbral conservador: > 5 anuncios) ──
-- Un particular con > 5 pisos en BD casi seguro es una agencia/promotor.
-- Umbral conservador para evitar falsos positivos (bloque familiar, etc.).
UPDATE listings
SET
  is_particular = false,
  ranking_score = 30
WHERE
  is_particular = true
  AND status    = 'published'
  AND phone IS NOT NULL
  AND phone IN (
    SELECT phone
    FROM listings
    WHERE
      is_particular = true
      AND status    = 'published'
      AND phone     IS NOT NULL
      AND phone     != ''
    GROUP BY phone
    HAVING COUNT(*) > 5
  );

-- ── Resumen de lo afectado (ejecutar antes para previsualizar) ────────────────
-- SELECT COUNT(*) FROM listings
-- WHERE is_particular = true AND status = 'published'
-- AND (
--   title ~* '\m(inmobiliaria|honorarios|gastos de gestión|comisión de agencia)\M'
--   OR source_portal IN ('tecnocasa','redpiso','gilmar','solvia','aliseda','monapart')
-- );

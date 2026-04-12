-- 011_external_link_phone.sql
-- Añade los campos external_link y phone a la tabla listings.
-- external_link: enlace al anuncio original en el portal de origen (siempre abre en _blank).
-- phone: teléfono del anunciante, solo visible para usuarios registrados.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS external_link text,
  ADD COLUMN IF NOT EXISTS phone text;

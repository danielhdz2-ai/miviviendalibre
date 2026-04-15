-- Columna que indica si un listing tiene al menos una imagen guardada
ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_images boolean NOT NULL DEFAULT false;

-- Poblar con datos existentes
UPDATE listings l
SET has_images = true
WHERE EXISTS (
  SELECT 1 FROM listing_images li WHERE li.listing_id = l.id
);

-- Trigger: marcar has_images = true cuando se inserta una imagen
CREATE OR REPLACE FUNCTION _fn_listing_has_images()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE listings SET has_images = true WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listing_images_insert ON listing_images;
CREATE TRIGGER trg_listing_images_insert
  AFTER INSERT ON listing_images
  FOR EACH ROW EXECUTE FUNCTION _fn_listing_has_images();

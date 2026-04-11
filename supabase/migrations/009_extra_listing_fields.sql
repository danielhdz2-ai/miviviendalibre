-- Añade columna JSONB para almacenar características extra del inmueble
-- Ejemplos: { "planta": "3ª", "antigüedad": "Entre 5 y 10 años",
--             "referencia": "41121", "orientacion": "Sur",
--             "cert_energetico": "B", "area_util_m2": "85" }
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{}';

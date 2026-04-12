-- 012_owner_leads.sql
-- Tabla de leads de propietarios que quieren vender/alquilar su casa.
-- Estos leads se venderán a agencias inmobiliarias.

CREATE TABLE IF NOT EXISTS owner_leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- Paso 1: Dirección
  address       text NOT NULL,
  city          text,
  postal_code   text,
  province      text,
  lat           numeric,
  lng           numeric,

  -- Paso 2: Datos del inmueble
  property_type text,                         -- 'piso' | 'casa' | 'atico' | 'local' | 'otro'
  operation     text NOT NULL DEFAULT 'sale', -- 'sale' | 'rent'
  area_m2       integer,
  bedrooms      integer,
  condition     text,                         -- 'nuevo' | 'buen_estado' | 'reformar'
  estimated_price integer,

  -- Paso 3: Datos de contacto
  name          text NOT NULL,
  phone         text NOT NULL,
  email         text NOT NULL,

  -- Metadatos
  status        text NOT NULL DEFAULT 'new',  -- 'new' | 'contacted' | 'converted'
  notified_at   timestamptz,
  notes         text
);

-- Índice para búsquedas por ciudad/CP (agencias buscarán por zona)
CREATE INDEX IF NOT EXISTS owner_leads_city_idx ON owner_leads (city);
CREATE INDEX IF NOT EXISTS owner_leads_postal_idx ON owner_leads (postal_code);
CREATE INDEX IF NOT EXISTS owner_leads_status_idx ON owner_leads (status);

-- RLS: solo el service_role puede leer/escribir (nada público)
ALTER TABLE owner_leads ENABLE ROW LEVEL SECURITY;

-- Política: inserciones públicas (el formulario las necesita via service_role desde API)
-- La lectura queda solo para service_role (dashboard / agencias autenticadas)

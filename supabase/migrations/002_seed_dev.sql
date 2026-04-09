-- ============================================================
-- Mi Vivienda Libre — Seed de desarrollo
-- Ejecutar DESPUÉS de 001_initial_schema.sql
-- ============================================================

insert into listings (
  origin, operation, title, description,
  price_eur, province, city, district, postal_code,
  lat, lng, bedrooms, bathrooms, area_m2,
  source_portal, source_external_id,
  is_particular, particular_confidence, ranking_score,
  turbo_until, status, published_at
) values

-- Madrid — Alquiler (con Turbo activo)
(
  'direct', 'rent',
  'Piso luminoso 2 hab. en Malasaña — propietario, sin comisión',
  'Alquilo yo directamente mi piso. Sin agencias. Completamente reformado en 2023. Suelos de parquet, cocina nueva y baño reformado. Soleado todo el día. A 3 min del metro Tribunal.',
  1200, 'Madrid', 'Madrid', 'Malasaña', '28004',
  40.4276, -3.7045, 2, 1, 65,
  null, null,
  true, 0.97, 100,
  now() + interval '7 days', 'published', now()
),

-- Madrid — Alquiler
(
  'external', 'rent',
  'Apartamento 3 habitaciones con terraza en Lavapiés — trato directo',
  'Propietario alquila sin intermediarios. Piso amplio con terraza de 12m². Totalmente amueblado. Gastos de comunidad incluidos. Nuestro piso está en perfecto estado.',
  950, 'Madrid', 'Madrid', 'Lavapiés', '28012',
  40.4086, -3.7024, 3, 2, 90,
  'idealista', 'idealista-mad-001',
  true, 0.88, 80,
  null, 'published', now() - interval '2 days'
),

-- Madrid — Venta
(
  'external', 'sale',
  'Vendo ático 4 hab. con terraza en Chamberí — propietaria directa',
  'Propietaria vende sin agencia. Ático con 30m² de terraza y vistas a la Sierra. Reformado integralmente en 2022. Trato directo, precio negociable.',
  485000, 'Madrid', 'Madrid', 'Chamberí', '28010',
  40.4368, -3.7023, 4, 2, 130,
  'fotocasa', 'fotocasa-mad-001',
  true, 0.92, 85,
  null, 'published', now() - interval '1 day'
),

-- Barcelona — Alquiler
(
  'external', 'rent',
  'Estudio reformado en Gracia — dueño alquila sin agencias',
  'Alquilo mi estudio directamente. Nuestro piso está en perfecto estado, reformado en 2024. A 5 min del metro Fontana. Comunidad tranquila.',
  780, 'Barcelona', 'Barcelona', 'Gràcia', '08012',
  41.4036, 2.1575, 0, 1, 35,
  'fotocasa', 'fotocasa-bcn-001',
  true, 0.91, 70,
  null, 'published', now() - interval '3 days'
),

-- Barcelona — Venta
(
  'direct', 'sale',
  'Vendo piso 4 hab. en Eixample — propietaria directa',
  'Propietaria vende su piso sin intermediarios. Precio negociable. Piso señorial con techos altos, suelos hidráulicos originales y tres balcones a la calle. Muy luminoso.',
  380000, 'Barcelona', 'Barcelona', 'Eixample', '08009',
  41.3929, 2.1635, 4, 2, 120,
  null, null,
  true, 0.95, 90,
  null, 'published', now() - interval '4 days'
),

-- Barcelona — Alquiler
(
  'external', 'rent',
  'Piso 2 hab. amueblado en Poble Sec — particular sin comisión',
  'Sin comisión de agencia. Propietario alquila directamente. Piso reformado, amueblado con gusto. Metro Paral·lel a 3 minutos. Admito mascotas.',
  950, 'Barcelona', 'Barcelona', 'Poble Sec', '08004',
  41.3729, 2.1575, 2, 1, 60,
  'idealista', 'idealista-bcn-001',
  true, 0.86, 65,
  null, 'published', now() - interval '5 days'
),

-- Sevilla — Alquiler
(
  'external', 'rent',
  'Piso 2 dormitorios en Triana — particular sin agencia',
  'Alquilo mi piso directamente. Sin comisión. Piso reformado en zona emblemática de Triana. Todos los servicios a mano. Propietario responsable.',
  750, 'Sevilla', 'Sevilla', 'Triana', '41010',
  37.3832, -5.9977, 2, 1, 70,
  'idealista', 'idealista-sev-001',
  true, 0.85, 60,
  null, 'published', now() - interval '6 days'
),

-- Valencia — Venta
(
  'external', 'sale',
  'Casa adosada 5 hab. con jardín en Patraix — dueño vende',
  'Dueño vende sin agencia. Trato directo. Casa adosada con jardín de 80m², garaje y trastero. Zona residencial tranquila cerca del centro.',
  295000, 'Valencia', 'Valencia', 'Patraix', '46018',
  39.4517, -0.3922, 5, 3, 180,
  'fotocasa', 'fotocasa-val-001',
  true, 0.79, 55,
  null, 'published', now() - interval '7 days'
),

-- Málaga — Alquiler
(
  'external', 'rent',
  'Apartamento 1 hab. junto a la Malagueta — propietario alquila',
  'Propietario alquila directamente su apartamento frente al mar. Vistas al Mediterráneo, terraza exterior, aire acondicionado. No intermediarios.',
  850, 'Málaga', 'Málaga', 'La Malagueta', '29016',
  36.7213, -4.4094, 1, 1, 45,
  'idealista', 'idealista-mlg-001',
  true, 0.89, 72,
  null, 'published', now() - interval '2 days'
),

-- Bilbao — Alquiler
(
  'external', 'rent',
  'Piso reformado 3 hab. en Indautxu — particular, trato directo',
  'Particular alquila su piso recién reformado. Sin agencias ni comisiones. Calefacción central, ascensor, parking opcional.',
  900, 'Bizkaia', 'Bilbao', 'Indautxu', '48010',
  43.2627, -2.9357, 3, 2, 85,
  'fotocasa', 'fotocasa-bil-001',
  true, 0.83, 58,
  null, 'published', now() - interval '8 days'
);

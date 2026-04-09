// ============================================================
// Mi Vivienda Libre — Generador de contenido inicial
// Inserta ~600 anuncios realistas directamente en Supabase
// para que la web no esté vacía antes de tener usuarios reales.
//
// Uso: node scripts/seed-content.js
// ============================================================

const SUPABASE_URL  = 'https://ktsdxpmaljiyuwimcugx.supabase.co'
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY) {
  console.error('❌ Falta la variable SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Ejecúta con: $env:SUPABASE_SERVICE_ROLE_KEY="tu_clave"; node scripts/seed-content.js')
  process.exit(1)
}

// ── Datos base ────────────────────────────────────────────────────────────────

const CITIES = [
  { city: 'Madrid',    province: 'Madrid',       lat: 40.4168, lng: -3.7038,
    districts: ['Malasaña','Chueca','Lavapiés','Retiro','Salamanca','Chamberí','Moncloa','Carabanchel','Vallecas','Latina','Usera','Arganzuela','Tetuán','Hortaleza','Moratalaz'] },
  { city: 'Barcelona', province: 'Barcelona',    lat: 41.3851, lng:  2.1734,
    districts: ['Gràcia','El Raval','Eixample','Poble Sec','Sarrià','Barceloneta','Sant Martí','Les Corts','Horta','Nou Barris','Sants','Sant Andreu','Sant Pau'] },
  { city: 'Valencia',  province: 'Valencia',     lat: 39.4699, lng: -0.3763,
    districts: ['Russafa','Malvarrosa','Benimaclet','El Carmen','Patraix','Campanar','Mestalla','L\'Olivereta','Poblats Marítims'] },
  { city: 'Sevilla',   province: 'Sevilla',      lat: 37.3891, lng: -5.9845,
    districts: ['Triana','Santa Cruz','Los Remedios','Nervión','Macarena','Bellavista','San Pablo','El Arenal'] },
  { city: 'Málaga',    province: 'Málaga',       lat: 36.7213, lng: -4.4214,
    districts: ['La Malagueta','Centro','Pedregalejo','El Palo','Soho','Teatinos','La Trinidad'] },
  { city: 'Bilbao',    province: 'Bizkaia',      lat: 43.2630, lng: -2.9350,
    districts: ['Indautxu','Abando','Deusto','Casco Viejo','Santutxu','Basurto','Rekalde'] },
  { city: 'Zaragoza',  province: 'Zaragoza',     lat: 41.6488, lng: -0.8891,
    districts: ['Centro','Delicias','Actur','El Ejido','La Almozara','San José','Las Fuentes'] },
  { city: 'Alicante',  province: 'Alicante',     lat: 38.3452, lng: -0.4810,
    districts: ['Playa de San Juan','Centro','Carolinas','El Campello','Ciudad Jardín','Babel'] },
  { city: 'Granada',   province: 'Granada',      lat: 37.1773, lng: -3.5986,
    districts: ['Albaicín','Zaidín','Centro','La Chana','Ronda','Fígares','Universitaria'] },
  { city: 'Murcia',    province: 'Murcia',       lat: 37.9922, lng: -1.1307,
    districts: ['Centro','La Flota','Espinardo','San Andrés','Vista Alegre'] },
  { city: 'San Sebastián', province: 'Gipuzkoa', lat: 43.3183, lng: -1.9812,
    districts: ['Gros','Parte Vieja','Amara','Egia','Ibaeta','Antiguo'] },
  { city: 'Palma',     province: 'Illes Balears', lat: 39.5696, lng: 2.6502,
    districts: ['Centro','Can Pastilla','El Molinar','Son Armadans','Portixol'] },
  { city: 'Valladolid',province: 'Valladolid',   lat: 41.6523, lng: -4.7245,
    districts: ['Centro','Delicias','Las Flores','Arturo Eyríes','Santa Clara'] },
  { city: 'A Coruña',  province: 'A Coruña',     lat: 43.3713, lng: -8.3961,
    districts: ['Ciudad Vieja','Riazor','Matogrande','Agra del Orzán','Monte Alto'] },
  { city: 'Córdoba',   province: 'Córdoba',      lat: 37.8882, lng: -4.7794,
    districts: ['Judería','Centro','Levante','Norte','Poniente Sur','Periurbano'] },
]

// Precios realistas por ciudad (mediana mercado 2025)
const PRICE_RANGES = {
  'Madrid':       { rent: [600, 2200],  sale: [150000, 700000] },
  'Barcelona':    { rent: [700, 2500],  sale: [180000, 800000] },
  'Valencia':     { rent: [500, 1400],  sale: [100000, 400000] },
  'Sevilla':      { rent: [450, 1200],  sale: [90000,  380000] },
  'Málaga':       { rent: [600, 1600],  sale: [120000, 500000] },
  'Bilbao':       { rent: [600, 1500],  sale: [130000, 450000] },
  'Zaragoza':     { rent: [400, 900],   sale: [80000,  280000] },
  'Alicante':     { rent: [400, 1100],  sale: [80000,  320000] },
  'Granada':      { rent: [350, 900],   sale: [70000,  260000] },
  'Murcia':       { rent: [350, 800],   sale: [70000,  240000] },
  'San Sebastián':{ rent: [900, 2500],  sale: [200000, 750000] },
  'Palma':        { rent: [700, 2000],  sale: [150000, 600000] },
  'Valladolid':   { rent: [350, 800],   sale: [65000,  230000] },
  'A Coruña':     { rent: [450, 1100],  sale: [90000,  320000] },
  'Córdoba':      { rent: [350, 800],   sale: [70000,  250000] },
}

// Tokens para generación de anuncios realistas
const PARTICULARISMS = [
  'propietario alquila directamente sin agencia',
  'propietaria sin comisión ni intermediarios',
  'dueño alquila sin agencia, trato directo',
  'particular alquila, sin comisión',
  'propietaria directa, sin intermediarios',
  'alquilo yo mismo sin agentes',
  'trato directo con el propietario',
  'dueña alquila sin pasar por agencias',
]

const TITLE_TEMPLATES_RENT = [
  (beds, district, city) => `Piso ${beds} hab. ${district} — propietario sin agencia`,
  (beds, district, city) => `Piso ${beds} habitaciones ${district}, ${city} — trato directo`,
  (beds, district, city) => `Alquilo piso ${beds} hab. ${district} — sin comisión`,
  (beds, district, city) => `Apartamento ${beds} hab. en ${district} — particular`,
  (beds, district, city) => `Piso ${beds}h. reformado ${district} — propietaria directa`,
  (beds, district, city) => `Piso reformado ${beds} hab. ${district} — sin intermediarios`,
]

const TITLE_TEMPLATES_SALE = [
  (beds, district, city) => `Vendo piso ${beds} hab. ${district} — propietario directo`,
  (beds, district, city) => `Piso ${beds} habitaciones ${district} — dueño vende`,
  (beds, district, city) => `Se vende piso ${beds} hab. ${district}, sin agencia`,
  (beds, district, city) => `Piso ${beds}h. a la venta ${district} — particular vende`,
]

const DESC_TEMPLATES_RENT = [
  (beds, baths, area, part) => `${part.charAt(0).toUpperCase() + part.slice(1)}. Piso de ${area}m² con ${beds} habitaciones y ${baths} baño${baths > 1 ? 's' : ''}. Completamente reformado, cocina equipada, salón amplio. Suelos de tarima y ventanas doble acristalamiento. Muy luminoso, piso ${['bajo', 'primero', 'segundo', 'tercero', 'cuarto'][Math.floor(Math.random()*5)]} exterior. Zona bien comunicada con transporte público. Admito mascotas bajo consulta.`,
  (beds, baths, area, part) => `${part.charAt(0).toUpperCase() + part.slice(1)}. ${beds} habitaciones dobles, ${baths} baño${baths > 1 ? 's' : ''} reformado${baths > 1 ? 's' : ''}, cocina americana abierta al salón. ${area}m² totales. Edificio con ascensor y portero automático. A 5 minutos caminando del metro. No se cobran honorarios de agencia porque lo alquilo yo directamente.`,
  (beds, baths, area, part) => `Alquilo directamente, sin agencias ni comisiones extra. Piso de ${area}m² en planta ${['segunda', 'tercera', 'cuarta'][Math.floor(Math.random()*3)]} con ascensor. ${beds} habitaciones, ${baths} baño${baths > 1 ? 's' : ''}, salón con balcón al exterior. Cocina equipada con todos los electrodomésticos. Calefacción individual. Zona tranquila y residencial.`,
]

const DESC_TEMPLATES_SALE = [
  (beds, baths, area, part) => `${part.charAt(0).toUpperCase() + part.slice(1)}. Piso de ${area}m² en excelente estado. ${beds} habitaciones, ${baths} baño${baths > 1 ? 's' : ''}, salón comedor, cocina independiente. Edificio con ascensor. Orientación sur, muy soleado. Gastos de comunidad bajos. Se puede visitar con cita previa. Precio negociable para comprador serio.`,
  (beds, baths, area, part) => `Vendo mi piso directamente a través de esta plataforma, sin intermediarios. ${area}m² en zona céntrica. ${beds} habitaciones dobles, ${baths} baño${baths > 1 ? 's' : ''} completo${baths > 1 ? 's' : ''}, cocina reformada 2022. Parquet en habitaciones, tarima en salón. Precio ajustado por venta entre particulares.`,
]

// ── Generador ─────────────────────────────────────────────────────────────────

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr)       { return arr[Math.floor(Math.random() * arr.length)]  }
function fmtPrice(p)     { return Math.round(p / 50) * 50 } // redondear a 50

function generateListing(cityData, index) {
  const isRent    = Math.random() < 0.65  // 65% alquiler, 35% venta
  const operation = isRent ? 'rent' : 'sale'
  const district  = pick(cityData.districts)
  const beds      = rand(0, 5)
  const baths     = Math.max(1, Math.min(3, Math.ceil(beds / 2)))
  const area      = beds === 0 ? rand(25, 45) : rand(35 + beds * 15, 50 + beds * 25)
  const ranges    = PRICE_RANGES[cityData.city] || PRICE_RANGES['Valladolid']
  const priceBase = rand(ranges[operation][0], ranges[operation][1])
  const price     = fmtPrice(priceBase)
  const isParticular = Math.random() < 0.82  // 82% particulares
  const partText  = pick(PARTICULARISMS)
  const titleFns  = isRent ? TITLE_TEMPLATES_RENT : TITLE_TEMPLATES_SALE
  const descFns   = isRent ? DESC_TEMPLATES_RENT  : DESC_TEMPLATES_SALE
  const title     = pick(titleFns)(beds === 0 ? 'Estudio' : beds, district, cityData.city)
  const desc      = pick(descFns)(beds === 0 ? 0 : beds, baths, area, partText)
  const daysAgo   = rand(1, 30)

  return {
    origin: isParticular ? 'direct' : 'external',
    operation,
    title:                title.slice(0, 200),
    description:          desc.slice(0, 3000),
    price_eur:            price,
    province:             cityData.province,
    city:                 cityData.city,
    district,
    lat:                  cityData.lat + (Math.random() - 0.5) * 0.05,
    lng:                  cityData.lng + (Math.random() - 0.5) * 0.05,
    bedrooms:             beds,
    bathrooms:            baths,
    area_m2:              area,
    source_portal:        'mvl-gen',
    source_external_id:   `mvl-gen-${cityData.city.toLowerCase().replace(/\s/g,'-')}-${index}`,
    is_particular:        isParticular,
    particular_confidence: isParticular ? parseFloat((0.75 + Math.random() * 0.25).toFixed(2)) : parseFloat((0.1 + Math.random() * 0.35).toFixed(2)),
    ranking_score:        rand(50, 100),
    status:               'published',
    published_at:         new Date(Date.now() - daysAgo * 86400000).toISOString(),
  }
}

// ── Insertar en Supabase ───────────────────────────────────────────────────────

async function upsertBatch(listings) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?on_conflict=source_portal,source_external_id`,
    {
      method: 'POST',
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(listings),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase ${res.status}: ${err}`)
  }
}

async function main() {
  console.log('🏠 Mi Vivienda Libre — Generador de contenido')
  console.log('='.repeat(50))

  const all = []
  let idx = 0
  for (const cityData of CITIES) {
    const perCity = rand(30, 50)
    for (let i = 0; i < perCity; i++) {
      all.push(generateListing(cityData, idx++))
    }
  }

  console.log(`📋 Generados ${all.length} anuncios para ${CITIES.length} ciudades`)

  // Insertar en batches de 50
  const BATCH = 50
  let inserted = 0
  for (let i = 0; i < all.length; i += BATCH) {
    const batch = all.slice(i, i + BATCH)
    try {
      await upsertBatch(batch)
      inserted += batch.length
      process.stdout.write(`\r✅ Insertados: ${inserted}/${all.length}`)
    } catch (e) {
      console.error(`\n❌ Error batch ${i}: ${e.message}`)
    }
  }

  console.log(`\n\n🎉 Listo! ${inserted} anuncios en Supabase.`)
  console.log('   La web ya tiene contenido. ¡Abre https://miviviendalibre.vercel.app!')
}

main().catch(console.error)

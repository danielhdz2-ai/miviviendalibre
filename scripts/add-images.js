// ============================================================
// Mi Vivienda Libre — Añadir imágenes a los listings existentes
// Asigna fotos reales de propiedades (Unsplash, libre de uso)
// rotando entre un banco curado de ~60 imágenes.
//
// Uso: node scripts/add-images.js
// ============================================================

const SUPABASE_URL = 'https://ktsdxpmaljiyuwimcugx.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY) {
  console.error('❌ Falta SUPABASE_SERVICE_ROLE_KEY')
  console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="tu_clave"; node scripts/add-images.js')
  process.exit(1)
}

// ── Banco de imágenes por tipo de propiedad ───────────────────
// Fotos de Unsplash (dominio público/libre uso via unsplash.com/license)
// Agrupadas por número de habitaciones para mayor realismo

const PHOTOS_STUDIO = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&auto=format&fit=crop',
]

const PHOTOS_1BED = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1617104611622-3fbeeb0c42e6?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop',
]

const PHOTOS_2BED = [
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
]

const PHOTOS_3BED = [
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800&auto=format&fit=crop',
]

const PHOTOS_4PLUS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&auto=format&fit=crop',
]

// Fotos adicionales de interior (cocina, salón) para posición 2+
const PHOTOS_INTERIOR = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop', // cocina
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop', // salón
  'https://images.unsplash.com/photo-1600210491892-03d54730b6d1?w=800&auto=format&fit=crop', // dormitorio
  'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&auto=format&fit=crop', // baño
  'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=800&auto=format&fit=crop', // terraza
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop', // dormitorio 2
  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&auto=format&fit=crop', // salon 2
  'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&auto=format&fit=crop', // cocina 2
]

function getPhotosForListing(bedrooms) {
  if (bedrooms === 0) return PHOTOS_STUDIO
  if (bedrooms === 1) return PHOTOS_1BED
  if (bedrooms === 2) return PHOTOS_2BED
  if (bedrooms === 3) return PHOTOS_3BED
  return PHOTOS_4PLUS
}

// ── Helpers ───────────────────────────────────────────────────

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

async function supabase(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase ${res.status}: ${err}`)
  }
  if (res.status === 201 || res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('🖼️  Mi Vivienda Libre — Añadir imágenes a listings')
  console.log('='.repeat(50))

  // 1. Obtener IDs de listings SIN imágenes
  const listings = await supabase(
    '/listings?select=id,bedrooms&status=eq.published&limit=1000'
  )
  console.log(`📋 Listings publicados: ${listings.length}`)

  // IDs que ya tienen imágenes
  const existingImgs = await supabase(
    '/listing_images?select=listing_id&limit=5000'
  )
  const withImages = new Set((existingImgs ?? []).map(r => r.listing_id))

  const withoutImages = listings.filter(l => !withImages.has(l.id))
  console.log(`🏠 Sin imágenes: ${withoutImages.length}`)

  if (withoutImages.length === 0) {
    console.log('✅ Todos los listings ya tienen imágenes.')
    return
  }

  // 2. Construir registros de imágenes
  const imageRows = []
  for (const listing of withoutImages) {
    const beds = listing.bedrooms ?? 2
    const pool = getPhotosForListing(beds)
    const h = hashCode(listing.id)

    // Foto principal (portada)
    const mainPhoto = pool[h % pool.length]
    imageRows.push({
      listing_id:   listing.id,
      external_url: mainPhoto,
      position:     0,
    })

    // 1-3 fotos adicionales de interior
    const extraCount = (h % 3) + 1
    for (let i = 0; i < extraCount; i++) {
      imageRows.push({
        listing_id:   listing.id,
        external_url: PHOTOS_INTERIOR[(h + i + 1) % PHOTOS_INTERIOR.length],
        position:     i + 1,
      })
    }
  }

  console.log(`📸 Insertando ${imageRows.length} imágenes en batches...`)

  // 3. Insertar en batches de 200
  const BATCH = 200
  let inserted = 0
  for (let i = 0; i < imageRows.length; i += BATCH) {
    const batch = imageRows.slice(i, i + BATCH)
    await supabase('/listing_images', {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(batch),
    })
    inserted += batch.length
    process.stdout.write(`\r✅ ${inserted}/${imageRows.length}`)
  }

  console.log(`\n\n🎉 ¡Listo! ${inserted} imágenes añadidas.`)
  console.log('   Abre https://miviviendalibre.vercel.app/pisos para verlas.')
}

main().catch(console.error)

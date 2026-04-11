/**
 * Utilidades compartidas para todos los scrapers de Mi Vivienda Libre
 * Ejecutar con: npx tsx scripts/scrapers/utils.ts
 */

export interface ScrapedListing {
  title: string
  description?: string
  price_eur?: number
  operation: 'sale' | 'rent'
  province?: string
  city?: string
  district?: string
  postal_code?: string
  lat?: number
  lng?: number
  bedrooms?: number
  bathrooms?: number
  area_m2?: number
  source_portal: string
  source_url: string
  source_external_id: string
  is_particular: boolean
  images?: string[]
}

const SUPABASE_URL = 'https://ktsdxpmaljiyuwimcugx.supabase.co'

// Pega aquí tu service_role key de Supabase (Settings → API)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''

export async function upsertListing(listing: ScrapedListing): Promise<boolean> {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Falta SUPABASE_SERVICE_KEY en variables de entorno')
    process.exit(1)
  }

  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=ignore-duplicates,return=representation',
  }

  const body = {
    origin: 'external',
    status: 'published',
    is_particular: listing.is_particular,
    operation: listing.operation,
    title: listing.title,
    description: listing.description ?? null,
    price_eur: listing.price_eur ?? null,
    province: listing.province ?? null,
    city: listing.city ?? null,
    district: listing.district ?? null,
    postal_code: listing.postal_code ?? null,
    lat: listing.lat ?? null,
    lng: listing.lng ?? null,
    bedrooms: listing.bedrooms ?? null,
    bathrooms: listing.bathrooms ?? null,
    area_m2: listing.area_m2 ?? null,
    source_portal: listing.source_portal,
    source_url: listing.source_url,
    source_external_id: listing.source_external_id,
    ranking_score: 30,
    published_at: new Date().toISOString(),
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/listings`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    // 23505 = duplicate key — listing ya existe, no es un error real
    if (err.includes('"23505"')) return true
    console.error(`  ↳ Error upsert: ${err.slice(0, 120)}`)
    return false
  }

  // Si hay imágenes, insertarlas en listing_images
  if (listing.images?.length) {
    const data = await res.json() as Array<{ id: string }>
    const listingId = data[0]?.id
    if (listingId) {
      await insertImages(listingId, listing.images, headers)
    }
  }

  return true
}

async function insertImages(listingId: string, images: string[], headers: Record<string, string>) {
  const rows = images.slice(0, 10).map((url, i) => ({
    listing_id: listingId,
    external_url: url,
    position: i,
  }))

  await fetch(`${SUPABASE_URL}/rest/v1/listing_images`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify(rows),
  })
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function normalizePrice(text: string): number | undefined {
  const clean = text.replace(/[^\d.,]/g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) ? undefined : n
}

export function normalizeArea(text: string): number | undefined {
  const m = text.match(/(\d+)/)
  return m ? parseInt(m[1]) : undefined
}

export function normalizeRooms(text: string): number | undefined {
  const m = text.match(/(\d+)/)
  return m ? parseInt(m[1]) : undefined
}

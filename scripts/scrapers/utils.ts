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
  is_bank?: boolean
  bank_entity?: string
  external_link: string
  phone?: string
}

const SUPABASE_URL = 'https://ktsdxpmaljiyuwimcugx.supabase.co'

// Portales que son 100% agencias — nunca marcar como particular
const AGENCY_PORTALS = new Set([
  'tecnocasa', 'redpiso', 'gilmar', 'solvia', 'aliseda', 'monapart',
  'servihabitat', 'habitaclia', 'fotocasa',
])

// ── Blacklist de palabras que revelan anunciante de agencia ───────────────────
// Se chequean contra título + descripción (lowercased). Si hay match → is_particular=false.
const AGENCY_TEXT_PATTERNS = [
  // Términos operativos de agencia
  /\binmobiliaria\b/,
  /\bagencia\s+inmobiliaria\b/,
  /\bhonorarios\b/,
  /\bgastos\s+de\s+gesti[oó]n\b/,
  /\bcomisi[oó]n\s+de\s+(agencia|intermediaci[oó]n)\b/,
  /\basesor\s+inmobiliario\b/,
  /\bconsulting\s+inmobiliario\b/,
  /\bpuntos\s+de\s+venta\b/,
  // Emails corporativos
  /\b(info|ventas|contacto|alquiler|pisos|arrendamiento)@[a-z0-9.\-]+\.[a-z]{2,}/,
  // Franquicias y cadenas conocidas
  /\bfinques\s+\w+/,
  /\bre\/?max\b/,
  /\bcentury\s*21\b/,
  /\bera\s+inmobiliaria\b/,
  /\bdonpiso\b/,
  /\bhousell\b/,
  /\bengel\s*&\s*v[oö]lkers\b/,
  /\bcoldwell\s+banker\b/,
  /\bkeller\s+williams\b/,
  /\balquiler\s+seguro\b/,
  /\bamat\s+inmobiliaris\b/,
  /\bbcn\s+advisors\b/,
]

/**
 * Devuelve true si el texto (título+descripción) contiene indicios de agencia.
 * Usado como último blindaje antes del upsert.
 */
function looksLikeAgency(title: string, description?: string): boolean {
  const text = `${title} ${description ?? ''}`.toLowerCase()
  return AGENCY_TEXT_PATTERNS.some((re) => re.test(text))
}

// Pega aquí tu service_role key de Supabase (Settings → API)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''

// ─── Deduplicación por contenido ────────────────────────────────────────────
// Busca un anuncio existente en la BD usando:
//   1. GPS dentro de ~100 m (0.001 grados)
//   2. precio ±3% + superficie ±5 m² + misma ciudad + misma operación
async function findContentDuplicate(
  listing: ScrapedListing,
  headers: Record<string, string>,
): Promise<{ id: string; is_particular: boolean } | null> {

  // Estrategia 1 — coordenadas GPS
  if (listing.lat != null && listing.lng != null) {
    const δ = 0.001
    const url =
      `${SUPABASE_URL}/rest/v1/listings` +
      `?operation=eq.${listing.operation}` +
      `&lat=gte.${(listing.lat - δ).toFixed(6)}&lat=lte.${(listing.lat + δ).toFixed(6)}` +
      `&lng=gte.${(listing.lng - δ).toFixed(6)}&lng=lte.${(listing.lng + δ).toFixed(6)}` +
      `&status=eq.published&select=id,is_particular&limit=1`
    const res = await fetch(url, { headers })
    if (res.ok) {
      const rows = await res.json() as Array<{ id: string; is_particular: boolean }>
      if (rows.length > 0) return rows[0]
    }
  }

  // Estrategia 2 — precio + superficie + ciudad
  if (listing.price_eur && listing.area_m2 && listing.city) {
    const priceMin = Math.round(listing.price_eur * 0.97)
    const priceMax = Math.round(listing.price_eur * 1.03)
    const areaMin  = Math.max(0, Math.round(listing.area_m2 - 5))
    const areaMax  = Math.round(listing.area_m2 + 5)
    const url =
      `${SUPABASE_URL}/rest/v1/listings` +
      `?operation=eq.${listing.operation}` +
      `&price_eur=gte.${priceMin}&price_eur=lte.${priceMax}` +
      `&area_m2=gte.${areaMin}&area_m2=lte.${areaMax}` +
      `&city=ilike.${encodeURIComponent(listing.city)}` +
      `&status=eq.published&select=id,is_particular&limit=1`
    const res = await fetch(url, { headers })
    if (res.ok) {
      const rows = await res.json() as Array<{ id: string; is_particular: boolean }>
      if (rows.length > 0) return rows[0]
    }
  }

  return null
}

export async function upsertListing(listing: ScrapedListing): Promise<boolean> {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Falta SUPABASE_SERVICE_KEY en variables de entorno')
    process.exit(1)
  }

  const baseHeaders = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }

  // ── Paso 1: buscar duplicado exacto por source_portal + source_external_id ─
  let listingId: string | null = null
  let existingIsParticular = false

  const exactRes = await fetch(
    `${SUPABASE_URL}/rest/v1/listings` +
    `?source_portal=eq.${encodeURIComponent(listing.source_portal)}` +
    `&source_external_id=eq.${encodeURIComponent(listing.source_external_id ?? '')}` +
    `&select=id,is_particular&limit=1`,
    { headers: baseHeaders },
  )
  if (exactRes.ok) {
    const rows = await exactRes.json() as Array<{ id: string; is_particular: boolean }>
    if (rows.length > 0) {
      listingId = rows[0].id
      existingIsParticular = rows[0].is_particular
    }
  }

  // ── Paso 2: si no hay dedup exacto, buscar por contenido ──────────────────
  if (!listingId) {
    const contentMatch = await findContentDuplicate(listing, baseHeaders)
    if (contentMatch) {
      listingId = contentMatch.id
      existingIsParticular = contentMatch.is_particular
      console.log(`  📎 Dedup contenido → fusionando con id ${listingId}`)
    }
  }

  // ── Paso 3: Prioridad Particular ──────────────────────────────────────────
  // Portales de agencia → forzar is_particular=false sin excepción
  const fromAgencyPortal = AGENCY_PORTALS.has(listing.source_portal.toLowerCase())
  // Texto del anuncio delata agencia → forzar false aunque venga de URL /particulares/
  const textRevealsAgency = listing.is_particular
    ? looksLikeAgency(listing.title, listing.description)
    : false
  // Si el anuncio existente era de agencia pero el nuevo es de particular → promover
  // Nunca degradar: si ya es particular, se queda particular
  const isParticular = (fromAgencyPortal || textRevealsAgency)
    ? false
    : (listing.is_particular || existingIsParticular)
  if (textRevealsAgency) {
    console.log(`  🚫 [AGENCIA detectada por texto] ${listing.title.slice(0, 60)}`)
  }
  if (listing.is_particular && !existingIsParticular && listingId) {
    console.log(`  ⭐ Promovido a "Directo de Particular"`)
  }

  const rankingScore = isParticular ? 90 : (listing.is_bank ? 70 : 30)

  const body = {
    origin: 'external',
    status: 'published',
    is_particular: isParticular,
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
    area_m2: listing.area_m2 != null ? Math.round(listing.area_m2) : null,
    source_portal: listing.source_portal,
    source_url: listing.source_url,
    source_external_id: listing.source_external_id,
    ranking_score: rankingScore,
    published_at: new Date().toISOString(),
    is_bank: listing.is_bank ?? false,
    bank_entity: listing.bank_entity ?? null,
    external_link: listing.external_link,
    phone: listing.phone ?? null,
  }

  // ── Paso 4: PATCH si existe, INSERT si no ─────────────────────────────────
  if (listingId) {
    await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}`, {
      method: 'PATCH',
      headers: { ...baseHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify(body),
    })
    // Reemplazar imágenes
    await fetch(`${SUPABASE_URL}/rest/v1/listing_images?listing_id=eq.${listingId}`, {
      method: 'DELETE',
      headers: { ...baseHeaders, Prefer: 'return=minimal' },
    })
  } else {
    const postRes = await fetch(`${SUPABASE_URL}/rest/v1/listings`, {
      method: 'POST',
      headers: { ...baseHeaders, Prefer: 'return=representation' },
      body: JSON.stringify(body),
    })
    if (postRes.ok) {
      const data = await postRes.json() as Array<{ id: string }>
      listingId = data[0]?.id ?? null
    } else {
      const err = await postRes.text()
      // Conflicto de unique constraint (race condition) → intentar PATCH
      if (err.includes('"23505"')) {
        const retryRes = await fetch(
          `${SUPABASE_URL}/rest/v1/listings` +
          `?source_portal=eq.${encodeURIComponent(listing.source_portal)}` +
          `&source_external_id=eq.${encodeURIComponent(listing.source_external_id ?? '')}` +
          `&select=id&limit=1`,
          { headers: baseHeaders },
        )
        if (retryRes.ok) {
          const rows = await retryRes.json() as Array<{ id: string }>
          listingId = rows[0]?.id ?? null
        }
        if (listingId) {
          await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}`, {
            method: 'PATCH',
            headers: { ...baseHeaders, Prefer: 'return=minimal' },
            body: JSON.stringify(body),
          })
        }
      } else {
        console.error(`  ↳ Error upsert: ${err.slice(0, 120)}`)
        return false
      }
    }
  }

  if (listingId && listing.images?.length) {
    await insertImages(listingId, listing.images, baseHeaders)
  }

  return true
}

async function insertImages(listingId: string, images: string[], headers: Record<string, string>) {
  const rows = images.map((url, i) => ({
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

/**
 * Intenta extraer un número de teléfono del HTML de una página de detalle.
 * Busca en este orden:
 *   1. href="tel:..." — la fuente más fiable
 *   2. JSON-LD "telephone"
 *   3. Patrón de teléfono español (+34 / 6xx / 7xx / 9xx con 9 dígitos)
 * Devuelve null si no se encuentra ninguno.
 */
export function extractPhone(html: string): string | null {
  // 1. tel: link
  const telLink = html.match(/href="tel:([+\d\s\-().]{7,16})"/)
  if (telLink) return telLink[1].replace(/\s/g, '').trim()

  // 2. JSON-LD telephone
  const jsonTel = html.match(/"telephone"\s*:\s*"([+\d\s\-().]{7,16})"/)
  if (jsonTel) return jsonTel[1].replace(/\s/g, '').trim()

  // 3. Teléfono español visible en el texto (no dentro de atributos HTML)
  const spanishPhone = html.match(/(?:^|[\s"'>])(\+?34\s*[679]\d{8}|[679]\d{8})(?=[\s"'<\b])/)
  if (spanishPhone) return spanishPhone[1].replace(/\s/g, '').trim()

  return null
}

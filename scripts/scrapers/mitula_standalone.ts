/**
 * 🏠 ROBOT A — Mitula Standalone Scraper
 * ────────────────────────────────────────────────────────────────────────────
 * Target: https://pisos.mitula.com/pisos/st-{ciudad}  (venta)
 *         https://pisos.mitula.com/pisos/alquiler-st-{ciudad}  (alquiler)
 * Misión: Capturar anuncios de pisos en Mitula
 *
 * ARQUITECTURA INDEPENDIENTE: Sin dependencias de scrapers compartidos.
 * Lógica de deduplicación, conexión Supabase y manejo de errores propios.
 *
 * Uso: npx tsx scripts/scrapers/mitula_standalone.ts [operation] [city] [maxPages]
 *   operation: venta | alquiler (default: venta)
 *   city:      madrid | barcelona | valencia | sevilla | zaragoza | malaga (default: madrid)
 *   maxPages:  número de páginas (default: 5)
 */

// ─── Config ─────────────────────────────────────────────────────────────────

const SOURCE = 'mitula'
const ORIGINAL_PORTAL = 'Mitula Pisos'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const SUPABASE_URL = 'https://ktsdxpmaljiyuwimcugx.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''

const DELAY_MS = 1600

// ─── City map ────────────────────────────────────────────────────────────────

const CITY_MAP: Record<string, { province: string; city: string; slug: string }> = {
  madrid:    { province: 'Madrid',    city: 'Madrid',    slug: 'madrid' },
  barcelona: { province: 'Barcelona', city: 'Barcelona', slug: 'barcelona' },
  valencia:  { province: 'Valencia',  city: 'Valencia',  slug: 'valencia' },
  sevilla:   { province: 'Sevilla',   city: 'Sevilla',   slug: 'sevilla' },
  zaragoza:  { province: 'Zaragoza',  city: 'Zaragoza',  slug: 'zaragoza' },
  bilbao:    { province: 'Vizcaya',   city: 'Bilbao',    slug: 'bilbao' },
  malaga:    { province: 'Málaga',    city: 'Málaga',    slug: 'malaga' },
  alicante:  { province: 'Alicante',  city: 'Alicante',  slug: 'alicante' },
  murcia:    { province: 'Murcia',    city: 'Murcia',    slug: 'murcia' },
  granada:   { province: 'Granada',   city: 'Granada',   slug: 'granada' },
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface MitulaListing {
  source_external_id: string
  source_url: string
  title: string
  price_eur: number | null
  area_m2: number | null
  bedrooms: number | null
  bathrooms: number | null
  city: string
  province: string
  image_url: string | null
  external_link?: string
  phone?: string
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function parseNumber(text: string | null | undefined): number | null {
  if (!text) return null
  const n = parseFloat(text.replace(/[^\d,.]/g, '').replace(',', '.'))
  return isNaN(n) ? null : n
}

// ─── HTTP ────────────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Cache-Control': 'no-cache',
        Referer: 'https://pisos.mitula.com/',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      console.warn(`  [Mitula] ⚠️ HTTP ${res.status} → ${url}`)
      return null
    }
    return res.text()
  } catch (err) {
    console.warn(`  [Mitula] ⚠️ Fetch error: ${err}`)
    return null
  }
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

/**
 * Mitula SSR: cada card tiene una imagen en imganuncios.mitula.net cuyo
 * nombre de fichero contiene el ID numérico al final.
 * Ejemplo: https://imganuncios.mitula.net/piso_de_lujo_de_177_m2_..._2430000773136331006.jpg
 * El bloque del card contiene precio, dormitorios, baños y m².
 *
 * Estrategias en orden:
 *   1. JSON-LD (schema.org)
 *   2. data-id en <li> / <article>
 *   3. Imagen imganuncios.mitula.net → extrae contexto del bloque
 *   4. href a /inmueble/ (fallback links-only)
 */
function extractListings(html: string, cityMeta: { province: string; city: string }): MitulaListing[] {
  const results: MitulaListing[] = []
  const seen = new Set<string>()

  // Estrategia 1: JSON-LD RealEstateListing
  const jsonLdRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = jsonLdRe.exec(html))) {
    try {
      const d = JSON.parse(m[1])
      const items = Array.isArray(d) ? d : d['@graph'] ? d['@graph'] : [d]
      for (const item of items) {
        if (!item['@type'] || !/Apartment|SingleFamily|RealEstate|Residence/i.test(item['@type'])) continue
        const id = String(item['@id'] ?? item.identifier ?? '').replace(/\D/g, '').slice(0, 32)
        if (!id || seen.has(id)) continue
        seen.add(id)
        results.push({
          source_external_id: `mitula_${id}`,
          source_url: item.url ?? '',
          title: item.name ?? '',
          price_eur: parseNumber(String(item.offers?.price ?? item.price ?? '')),
          area_m2: parseNumber(String(item.floorSize?.value ?? '')),
          bedrooms: parseNumber(String(item.numberOfRooms ?? '')),
          bathrooms: parseNumber(String(item.numberOfBathroomsTotal ?? '')),
          city: item.address?.addressLocality ?? cityMeta.city,
          province: item.address?.addressRegion ?? cityMeta.province,
          image_url: Array.isArray(item.image) ? item.image[0] : (item.image ?? null),
        })
      }
    } catch {
      // silently skip malformed JSON-LD
    }
  }

  // Estrategia 2: atributos data-id en <li> o <article>
  const liRe = /<(?:li|article)[^>]+data-id="([^"]+)"([^>]*)>/gi
  while ((m = liRe.exec(html))) {
    const rawId = m[1]
    const attrs = m[2]
    if (seen.has(rawId)) continue
    const price  = (attrs.match(/data-price="([^"]+)"/))?.[1] ?? null
    const area   = (attrs.match(/data-area="([^"]+)"/))?.[1] ?? null
    const rooms  = (attrs.match(/data-rooms="([^"]+)"/))?.[1] ?? null
    const bathsM = (attrs.match(/data-baths="([^"]+)"/))?.[1] ?? null
    const slice  = html.slice(m.index, m.index + 700)
    const urlM   = slice.match(/href="(https?:\/\/[^"]+mitula[^"]+\/inmueble\/[^"]+)"/)
    seen.add(rawId)
    results.push({
      source_external_id: `mitula_${rawId}`,
      source_url: urlM ? urlM[1] : '',
      title: (slice.match(/<[^>]+class="[^"]*listing[-_]title[^"]*"[^>]*>([^<]+)/))?.[1]?.trim() ?? '',
      price_eur: parseNumber(price),
      area_m2: parseNumber(area),
      bedrooms: parseNumber(rooms),
      bathrooms: parseNumber(bathsM),
      city: cityMeta.city,
      province: cityMeta.province,
      image_url: (slice.match(/src="(https?:\/\/imganuncios\.mitula\.net\/[^"]+)"/i))?.[1] ?? null,
    })
  }

  // Estrategia 3: imagen imganuncios.mitula.net (ID en nombre de fichero)
  // src="https://imganuncios.mitula.net/titulo_piso_..._<ID>.jpg"
  if (results.length === 0) {
    const imgRe = /src="(https?:\/\/imganuncios\.mitula\.net\/([^"]+?)_(\d{10,20})\.(?:jpg|jpeg|webp|png))"/gi
    while ((m = imgRe.exec(html))) {
      const imgUrl = m[1]
      const rawId  = m[3]
      if (seen.has(rawId)) continue

      // Ventana de ~1200 chars centrada en la imagen para buscar datos del card
      const start = Math.max(0, m.index - 800)
      const block = html.slice(start, m.index + 400)

      // Precio: "1.150.000 €" o "150000 €"
      const priceM = block.match(/([\d]{2,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*€/)
      // m²
      const areaM  = block.match(/(\d+)\s*m(?:²|2)/)
      // Dormitorios
      const roomM  = block.match(/(\d+)\s*[Dd]ormitor/)
      // Baños
      const bathM  = block.match(/(\d+)\s*[Bb]a[ñn]o/)
      // href a ficha
      const urlM   = block.match(/href="(https?:\/\/[^"]+\/inmueble\/[^"]+)"/) ??
                     block.match(/href="(\/inmueble\/[^"]+)"/)
      // Título: usar el nombre del fichero de imagen (más fiable que alt)
      const titleRaw = m[2]
        .replace(/_(\d{10,20})$/, '')
        .replace(/_/g, ' ')
        .trim()
      const title = titleRaw.charAt(0).toUpperCase() + titleRaw.slice(1) || `Piso en ${cityMeta.city}`

      seen.add(rawId)
      results.push({
        source_external_id: `mitula_${rawId}`,
        source_url: urlM
          ? (urlM[1].startsWith('http') ? urlM[1] : `https://pisos.mitula.com${urlM[1]}`)
          : `https://pisos.mitula.com/inmueble/${rawId}`,
        title: title,
        price_eur: priceM ? parseNumber(priceM[1]) : null,
        area_m2: areaM ? parseNumber(areaM[1]) : null,
        bedrooms: roomM ? parseNumber(roomM[1]) : null,
        bathrooms: bathM ? parseNumber(bathM[1]) : null,
        city: cityMeta.city,
        province: cityMeta.province,
        image_url: imgUrl,
      })
    }
  }

  // Estrategia 4: href directo a /inmueble/ (links-only fallback)
  if (results.length === 0) {
    const hrefRe = /href="(https?:\/\/(?:[a-z]+\.)?mitula\.[a-z]+\/inmueble\/[^"]+)"/gi
    while ((m = hrefRe.exec(html))) {
      const url = m[1]
      const idFromUrl = url.split('/').pop()?.split('-').pop()?.replace(/\D/g, '') ?? ''
      if (!idFromUrl || seen.has(idFromUrl)) continue
      seen.add(idFromUrl)
      results.push({
        source_external_id: `mitula_${idFromUrl}`,
        source_url: url,
        title: '',
        price_eur: null,
        area_m2: null,
        bedrooms: null,
        bathrooms: null,
        city: cityMeta.city,
        province: cityMeta.province,
        image_url: null,
      })
    }
  }

  return results
}

// ─── Supabase ────────────────────────────────────────────────────────────────

/** Check if source_external_id already exists to avoid duplicates */
async function existsInDb(externalId: string): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?source_external_id=eq.${encodeURIComponent(externalId)}&select=id&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      signal: AbortSignal.timeout(10000),
    }
  )
  if (!res.ok) return false
  const data = await res.json() as unknown[]
  return data.length > 0
}

async function upsertToSupabase(listing: MitulaListing, operation: string): Promise<boolean> {
  const mapped = {
    source_external_id: listing.source_external_id,
    source_url: listing.source_url || null,
    title: listing.title || `Piso en ${listing.city}`,
    price_eur: listing.price_eur,
    area_m2: listing.area_m2,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    city: listing.city,
    province: listing.province,
    operation: operation === 'alquiler' ? 'rent' : 'sale',
    origin: 'external',
    status: 'published',
    is_particular: true,
    is_bank: false,
    source_portal: SOURCE,
    published_at: new Date().toISOString(),
    ranking_score: 50,
    external_link: listing.external_link ?? listing.source_url ?? null,
    phone: listing.phone ?? null,
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/listings`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(mapped),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const err = await res.text()
    console.warn(`  [Mitula] ⚠️ Supabase error (${res.status}): ${err}`)
    return false
  }

  // Insert cover image if available
  if (listing.image_url) {
    const idRes = await fetch(
      `${SUPABASE_URL}/rest/v1/listings?source_external_id=eq.${encodeURIComponent(listing.source_external_id)}&select=id`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: AbortSignal.timeout(10000),
      }
    )
    if (idRes.ok) {
      const rows = await idRes.json() as Array<{ id: string }>
      if (rows[0]?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/listing_images`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=ignore-duplicates,return=minimal',
          },
          body: JSON.stringify({
            listing_id: rows[0].id,
            source_url: listing.image_url,
            position: 0,
          }),
          signal: AbortSignal.timeout(10000),
        })
      }
    }
  }

  return true
}

// ─── Main scraper ────────────────────────────────────────────────────────────

async function scrapePage(
  operation: string,
  citySlug: string,
  page: number,
  cityMeta: { province: string; city: string }
): Promise<MitulaListing[]> {
  // Mitula URL pattern (confirmed from pisos.mitula.com):
  // Venta:    https://pisos.mitula.com/pisos/pisos-{ciudad}
  // Alquiler: https://pisos.mitula.com/pisos/pisos-alquiler-{ciudad}
  // Pages:    append /{page} (1-indexed, page 1 = no suffix)
  const base =
    operation === 'alquiler'
      ? `https://pisos.mitula.com/pisos/pisos-alquiler-${citySlug}`
      : `https://pisos.mitula.com/pisos/pisos-${citySlug}`

  const url = page === 1 ? base : `${base}/${page}`
  console.log(`  [Mitula] Página ${page}: ${url}`)

  const html = await fetchHtml(url)
  if (!html) return []

  const listings = extractListings(html, cityMeta)
  console.log(`  [Mitula] → ${listings.length} listings encontrados en página ${page}`)
  return listings
}

async function run() {
  if (!SUPABASE_KEY) {
    console.error('[Mitula] ❌ SUPABASE_SERVICE_KEY no definida')
    process.exit(1)
  }

  const [, , opArg = 'venta', cityArg = 'madrid', maxArg = '5'] = process.argv
  const operation = opArg.toLowerCase() === 'alquiler' ? 'alquiler' : 'venta'
  const cityKey   = cityArg.toLowerCase()
  const maxPages  = Math.min(parseInt(maxArg, 10) || 5, 20)

  const cityMeta = CITY_MAP[cityKey]
  if (!cityMeta) {
    console.error(`[Mitula] ❌ Ciudad desconocida: ${cityArg}. Opciones: ${Object.keys(CITY_MAP).join(', ')}`)
    process.exit(1)
  }

  console.log(`\n🏠 [Mitula Standalone] ${operation.toUpperCase()} · ${cityMeta.city} · máx ${maxPages} páginas`)
  console.log(`   Source: ${SOURCE} | is_particular: true | is_bank: false`)
  console.log('─'.repeat(60))

  let totalInserted = 0
  let totalSkipped  = 0

  for (let page = 1; page <= maxPages; page++) {
    const listings = await scrapePage(operation, cityMeta.slug, page, cityMeta)

    if (listings.length === 0) {
      console.log(`  [Mitula] Sin resultados en página ${page}. Fin.`)
      break
    }

    for (const listing of listings) {
      try {
        const alreadyExists = await existsInDb(listing.source_external_id)
        if (alreadyExists) {
          totalSkipped++
          continue
        }
        const ok = await upsertToSupabase(listing, operation)
        if (ok) {
          totalInserted++
          console.log(`    ✅ ${listing.source_external_id} — ${listing.title.slice(0, 50)}`)
        }
      } catch (err) {
        console.warn(`    ⚠️ Error procesando ${listing.source_external_id}: ${err}`)
      }
      await sleep(200)
    }

    if (page < maxPages) await sleep(DELAY_MS)
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`🏠 [Mitula] Fin: ${totalInserted} insertados, ${totalSkipped} ya existían`)
}

run().catch(err => {
  console.error('[Mitula] ❌ Error fatal:', err)
  process.exit(1)
})


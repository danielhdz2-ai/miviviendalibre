/**
 * 🏠 ROBOT B — Trovit Standalone Scraper
 * ────────────────────────────────────────────────────────────────────────────
 * Target:  https://casas.trovit.es/piso-{ciudad}-particular
 * Misión:  Capturar inventario de particulares de Trovit España
 *
 * ARQUITECTURA INDEPENDIENTE: Selectores y lógica propios, sin dependencias
 * de otros scrapers. Optimizado para la estructura HTML de Trovit:
 *   - Cards:   .listing_card  /  [data-source]
 *   - Precio:  .listing_card__price
 *   - Título:  .listing_card__title
 *   - Atribs:  .listing_card__details  /  [data-features]
 *
 * Deduplicación: Verifica source_external_id antes de insertar.
 * Marca: source='trovit', is_particular=true, is_bank=false
 *
 * Uso: npx tsx scripts/scrapers/trovit_standalone.ts [operation] [city] [maxPages]
 */

// ─── Config ─────────────────────────────────────────────────────────────────

const SOURCE = 'trovit'
const ORIGINAL_PORTAL = 'Trovit Casas'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const SUPABASE_URL = 'https://ktsdxpmaljiyuwimcugx.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''

const DELAY_MS = 1800

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

interface TrovitListing {
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

/** Extract a number from a human text like "3 habitaciones", "120 m²" */
function extractInt(text: string, keyword: string): number | null {
  const re = new RegExp(`(\\d+)\\s*${keyword}`, 'i')
  const m = re.exec(text)
  return m ? parseInt(m[1], 10) : null
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
        Referer: 'https://casas.trovit.es/',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      console.warn(`  [Trovit] ⚠️ HTTP ${res.status} → ${url}`)
      return null
    }
    return res.text()
  } catch (err) {
    console.warn(`  [Trovit] ⚠️ Fetch error: ${err}`)
    return null
  }
}

// ─── Parsing — Trovit-specific selectors ─────────────────────────────────────

/**
 * Trovit's HTML structure (SSR):
 *
 * <article class="listing_card ...">
 *   <a class="listing_card-image" href="https://casas.trovit.es/...html" data-id="TROVIT_ID">
 *     <img src="..." />
 *   </a>
 *   <div class="listing_card-content">
 *     <h2 class="listing_card__title"><a href="...">Título</a></h2>
 *     <span class="listing_card__price">250.000 €</span>
 *     <ul class="listing_card__details">
 *       <li>3 habitaciones</li>
 *       <li>2 baños</li>
 *       <li>100 m²</li>
 *     </ul>
 *   </div>
 * </article>
 *
 * Alternative: JSON-LD (Product / RealEstateListing)
 */
function extractListings(html: string, cityMeta: { province: string; city: string }): TrovitListing[] {
  const results: TrovitListing[] = []
  const seen = new Set<string>()

  // ── Strategy 1: JSON-LD ──────────────────────────────────────────────────
  const jsonLdRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = jsonLdRe.exec(html))) {
    try {
      const d = JSON.parse(m[1])
      const items: unknown[] = Array.isArray(d) ? d : d['@graph'] ? (d['@graph'] as unknown[]) : [d]
      for (const rawItem of items) {
        const item = rawItem as Record<string, unknown>
        if (!item['@type'] || !/Apartment|SingleFamily|RealEstate|Residence|Product/i.test(String(item['@type']))) continue
        const id = String(item['@id'] ?? item.identifier ?? item.productID ?? '').replace(/\D/g, '').slice(0, 32)
        if (!id || seen.has(id)) continue
        seen.add(id)
        const offers = item.offers as Record<string, unknown> | undefined
        results.push({
          source_external_id: `trovit_${id}`,
          source_url: String(item.url ?? ''),
          title: String(item.name ?? ''),
          price_eur: parseNumber(String(offers?.price ?? item.price ?? '')),
          area_m2: parseNumber(String((item.floorSize as Record<string, unknown>)?.value ?? '')),
          bedrooms: parseNumber(String(item.numberOfRooms ?? '')),
          bathrooms: parseNumber(String(item.numberOfBathroomsTotal ?? '')),
          city: String((item.address as Record<string, unknown>)?.addressLocality ?? cityMeta.city),
          province: String((item.address as Record<string, unknown>)?.addressRegion ?? cityMeta.province),
          image_url: Array.isArray(item.image) ? String(item.image[0]) : (item.image ? String(item.image) : null),
        })
      }
    } catch {
      // skip malformed
    }
  }

  // ── Strategy 2: <article class="listing_card ..."> ───────────────────────
  // Split by article tag to process each card independently
  const articleChunks = html.split(/<article\s[^>]*class="[^"]*listing[_-]card[^"]*"/i)
  for (let i = 1; i < articleChunks.length; i++) {
    const chunk = articleChunks[i]

    // data-id attribute on the anchor
    const idM = chunk.match(/data-id="([^"]+)"/) ?? chunk.match(/data-trovit-id="([^"]+)"/)
    const rawId = idM?.[1] ?? null

    // href for the listing URL
    const urlM = chunk.match(/href="(https?:\/\/casas\.trovit\.es\/[^"]+\.html[^"]*)"/)
    const listingUrl = urlM?.[1] ?? ''

    // Derive an ID from URL if no data-id present
    const derivedId = rawId ?? listingUrl.split('/').pop()?.replace(/\.html.*$/, '') ?? null
    if (!derivedId || seen.has(derivedId)) continue

    // Skip if we already caught this in JSON-LD
    const compositeId = `trovit_${derivedId}`
    if (results.some(r => r.source_external_id === compositeId)) {
      seen.add(derivedId)
      continue
    }
    seen.add(derivedId)

    // Title: .listing_card__title a text
    const titleM = chunk.match(/class="[^"]*listing[_-]card[^"]*title[^"]*"[^>]*>\s*<a[^>]*>([^<]+)/)
    const title = titleM?.[1]?.trim() ?? ''

    // Price: .listing_card__price
    const priceM = chunk.match(/class="[^"]*listing[_-]card[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|p)>/)
    const price = parseNumber(priceM?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null)

    // Details list text (all <li> content joined)
    const detailsM = chunk.match(/class="[^"]*listing[_-]card[^"]*details[^"]*"[^>]*>([\s\S]*?)<\/ul>/)
    const detailsText = detailsM?.[1]?.replace(/<[^>]+>/g, ' ') ?? ''

    const area     = extractInt(detailsText, 'm²|m2|metros')
    const bedrooms = extractInt(detailsText, 'hab(?:itaciones?)?|dormitorios?')
    const bathrooms = extractInt(detailsText, 'ba[ñn]os?')

    // Image
    const imgM = chunk.match(/<img[^>]+src="(https?:\/\/[^"]+(?:jpg|jpeg|webp|png)[^"]*)"/i)

    results.push({
      source_external_id: compositeId,
      source_url: listingUrl,
      title,
      price_eur: price,
      area_m2: area,
      bedrooms,
      bathrooms,
      city: cityMeta.city,
      province: cityMeta.province,
      image_url: imgM?.[1] ?? null,
    })
  }

  // ── Strategy 3: Trovit anchor hrefs fallback ──────────────────────────────
  if (results.length === 0) {
    const hrefRe = /href="(https?:\/\/casas\.trovit\.es\/[^"]+\.html)"/gi
    while ((m = hrefRe.exec(html))) {
      const url = m[1]
      const id  = url.split('/').pop()?.replace(/\.html.*$/, '') ?? ''
      if (!id || seen.has(id)) continue
      seen.add(id)
      results.push({
        source_external_id: `trovit_${id}`,
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

async function existsInDb(externalId: string): Promise<boolean> {
  try {
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
  } catch {
    return false
  }
}

async function upsertToSupabase(listing: TrovitListing, operation: string): Promise<boolean> {
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
  }

  try {
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
      console.warn(`  [Trovit] ⚠️ Supabase error (${res.status}): ${err}`)
      return false
    }

    // Insert image
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
  } catch (err) {
    console.warn(`  [Trovit] ⚠️ Fetch/insert error: ${err}`)
    return false
  }
}

// ─── Main scraper ────────────────────────────────────────────────────────────

async function scrapePage(
  operation: string,
  citySlug: string,
  page: number,
  cityMeta: { province: string; city: string }
): Promise<TrovitListing[]> {
  // Trovit URL patterns:
  // Venta:    https://casas.trovit.es/piso-{ciudad}-particular
  // Alquiler: https://casas.trovit.es/alquiler-piso-{ciudad}-particular
  // Pages:    append ?page={n} or /pagina_{n}
  const base =
    operation === 'alquiler'
      ? `https://casas.trovit.es/alquiler-piso-${citySlug}-particular`
      : `https://casas.trovit.es/piso-${citySlug}-particular`

  const url = page === 1 ? base : `${base}?page=${page}`
  console.log(`  [Trovit] Página ${page}: ${url}`)

  const html = await fetchHtml(url)
  if (!html) return []

  const listings = extractListings(html, cityMeta)
  console.log(`  [Trovit] → ${listings.length} listings encontrados en página ${page}`)
  return listings
}

async function run() {
  if (!SUPABASE_KEY) {
    console.error('[Trovit] ❌ SUPABASE_SERVICE_KEY no definida')
    process.exit(1)
  }

  const [, , opArg = 'venta', cityArg = 'madrid', maxArg = '5'] = process.argv
  const operation = opArg.toLowerCase() === 'alquiler' ? 'alquiler' : 'venta'
  const cityKey   = cityArg.toLowerCase()
  const maxPages  = Math.min(parseInt(maxArg, 10) || 5, 20)

  const cityMeta = CITY_MAP[cityKey]
  if (!cityMeta) {
    console.error(`[Trovit] ❌ Ciudad desconocida: ${cityArg}. Opciones: ${Object.keys(CITY_MAP).join(', ')}`)
    process.exit(1)
  }

  console.log(`\n🏠 [Trovit Standalone] ${operation.toUpperCase()} · ${cityMeta.city} · máx ${maxPages} páginas`)
  console.log(`   Source: ${SOURCE} | is_particular: true | is_bank: false`)
  console.log('─'.repeat(60))

  let totalInserted = 0
  let totalSkipped  = 0

  for (let page = 1; page <= maxPages; page++) {
    let listings: TrovitListing[]
    try {
      listings = await scrapePage(operation, cityMeta.slug, page, cityMeta)
    } catch (err) {
      console.warn(`  [Trovit] ⚠️ Error en página ${page}: ${err}`)
      break
    }

    if (listings.length === 0) {
      console.log(`  [Trovit] Sin resultados en página ${page}. Fin.`)
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
  console.log(`🏠 [Trovit] Fin: ${totalInserted} insertados, ${totalSkipped} ya existían`)
}

run().catch(err => {
  console.error('[Trovit] ❌ Error fatal:', err)
  process.exit(1)
})


/**
 * 🏠 ROBOT C — Kelify Standalone Scraper
 * ────────────────────────────────────────────────────────────────────────────
 * Target:  https://kelify.com/venta/pisos/particulares/{ciudad}
 *          https://kelify.com/alquiler/pisos/particulares/{ciudad}
 * Misión:  Extraer listings de particulares que Kelify ya tiene filtrados
 *
 * ARQUITECTURA INDEPENDIENTE: Selectores propios para la estructura moderna
 * de Kelify (SSR/Next.js clean). Extrae: precio, m2, habitaciones, baños,
 * galería de imágenes y enlace original.
 *
 * Deduplicación: Verifica source_external_id contra Supabase antes de insertar.
 * Marca: source='kelify', is_particular=true, is_bank=false
 *
 * Uso: npx tsx scripts/scrapers/kelify_standalone.ts [operation] [city] [maxPages]
 *   operation: venta | alquiler (default: venta)
 *   city:      madrid | barcelona | valencia | sevilla | zaragoza | malaga
 *   maxPages:  número de páginas (default: 5)
 */

// ─── Config ─────────────────────────────────────────────────────────────────

const SOURCE = 'kelify'
const ORIGINAL_PORTAL = 'Kelify'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const SUPABASE_URL = 'https://ktsdxpmaljiyuwimcugx.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''

const DELAY_MS = 1700

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

interface KelifyListing {
  source_external_id: string
  source_url: string
  title: string
  price_eur: number | null
  area_m2: number | null
  bedrooms: number | null
  bathrooms: number | null
  city: string
  province: string
  images: string[]
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
        Referer: 'https://kelify.com/',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      console.warn(`  [Kelify] ⚠️ HTTP ${res.status} → ${url}`)
      return null
    }
    return res.text()
  } catch (err) {
    console.warn(`  [Kelify] ⚠️ Fetch error: ${err}`)
    return null
  }
}

// ─── Parsing — Kelify-specific logic ─────────────────────────────────────────

/**
 * Kelify is a Next.js app (SSR). Listing data is embedded in two ways:
 *
 * 1. JSON-LD (<script type="application/ld+json">)
 *    Kelify typically embeds ItemList with ListItem children.
 *
 * 2. __NEXT_DATA__ JSON blob:
 *    <script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"listings":[...]}}}
 *    This is the most reliable source — contains structured property data.
 *
 * 3. HTML cards fallback:
 *    Cards have class patterns like "property-card", "listing-card", "[class*=Card]"
 */
function extractListings(html: string, cityMeta: { province: string; city: string }): KelifyListing[] {
  const results: KelifyListing[] = []
  const seen = new Set<string>()

  // ── Strategy 1: __NEXT_DATA__ JSON (most complete) ───────────────────────
  const nextDataM = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (nextDataM) {
    try {
      const nextData = JSON.parse(nextDataM[1]) as Record<string, unknown>
      // Walk common paths where Kelify stores listings
      const pageProps = (nextData as { props?: { pageProps?: Record<string, unknown> } })
        ?.props?.pageProps ?? {}

      // Try several candidate keys
      const candidates = [
        (pageProps as Record<string, unknown>).listings,
        (pageProps as Record<string, unknown>).properties,
        (pageProps as Record<string, unknown>).items,
        (pageProps as Record<string, unknown>).results,
        (pageProps as Record<string, unknown>).data,
      ]

      for (const candidate of candidates) {
        if (!Array.isArray(candidate)) continue
        for (const rawItem of candidate) {
          const item = rawItem as Record<string, unknown>
          const rawId = String(item.id ?? item._id ?? item.externalId ?? item.reference ?? '')
          if (!rawId || seen.has(rawId)) continue
          seen.add(rawId)

          const images: string[] = []
          if (Array.isArray(item.images)) {
            for (const img of item.images) {
              const src = typeof img === 'string' ? img : (img as Record<string, unknown>)?.url ?? (img as Record<string, unknown>)?.src
              if (typeof src === 'string') images.push(src)
            }
          } else if (typeof item.image === 'string') {
            images.push(item.image)
          }

          results.push({
            source_external_id: `kelify_${rawId}`,
            source_url: typeof item.url === 'string' ? item.url :
              typeof item.slug === 'string' ? `https://kelify.com/${item.slug}` : '',
            title: String(item.title ?? item.name ?? item.description ?? ''),
            price_eur: parseNumber(String(item.price ?? item.priceEur ?? '')),
            area_m2: parseNumber(String(item.area ?? item.areaM2 ?? item.surface ?? item.size ?? '')),
            bedrooms: typeof item.bedrooms === 'number' ? item.bedrooms :
              parseNumber(String(item.bedrooms ?? item.rooms ?? '')),
            bathrooms: typeof item.bathrooms === 'number' ? item.bathrooms :
              parseNumber(String(item.bathrooms ?? '')),
            city: String(item.city ?? item.municipality ?? cityMeta.city),
            province: String(item.province ?? item.region ?? cityMeta.province),
            images,
          })
        }
        if (results.length > 0) break
      }
    } catch {
      // silently skip
    }
  }

  // ── Strategy 2: JSON-LD ──────────────────────────────────────────────────
  if (results.length === 0) {
    const jsonLdRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    let m: RegExpExecArray | null
    while ((m = jsonLdRe.exec(html))) {
      try {
        const d = JSON.parse(m[1]) as Record<string, unknown>
        const items: unknown[] = Array.isArray(d) ? d :
          d['@graph'] ? (d['@graph'] as unknown[]) :
          d['@type'] === 'ItemList' ? ((d.itemListElement as unknown[]) ?? []) : [d]

        for (const rawItem of items) {
          const item = rawItem as Record<string, unknown>
          // ItemList wraps items in ListItem
          const inner = item['@type'] === 'ListItem' ? (item.item as Record<string, unknown> ?? item) : item
          if (!inner['@type'] || !/Apartment|SingleFamily|RealEstate|Residence|Product/i.test(String(inner['@type']))) continue

          const rawId = String(inner['@id'] ?? inner.identifier ?? '').replace(/\D/g, '').slice(0, 32)
          if (!rawId || seen.has(rawId)) continue
          seen.add(rawId)

          const offers = inner.offers as Record<string, unknown> | undefined
          results.push({
            source_external_id: `kelify_${rawId}`,
            source_url: String(inner.url ?? ''),
            title: String(inner.name ?? ''),
            price_eur: parseNumber(String(offers?.price ?? inner.price ?? '')),
            area_m2: parseNumber(String((inner.floorSize as Record<string, unknown>)?.value ?? '')),
            bedrooms: parseNumber(String(inner.numberOfRooms ?? '')),
            bathrooms: parseNumber(String(inner.numberOfBathroomsTotal ?? '')),
            city: String((inner.address as Record<string, unknown>)?.addressLocality ?? cityMeta.city),
            province: String((inner.address as Record<string, unknown>)?.addressRegion ?? cityMeta.province),
            images: Array.isArray(inner.image)
              ? (inner.image as string[])
              : inner.image ? [String(inner.image)] : [],
          })
        }
      } catch {
        // skip malformed
      }
    }
  }

  // ── Strategy 3: HTML card fallback ───────────────────────────────────────
  if (results.length === 0) {
    // Kelify cards: links to individual property pages
    const hrefRe = /href="(https?:\/\/kelify\.com\/(?:venta|alquiler)\/[^"]+\/\d+[^"]*)"/gi
    let m2: RegExpExecArray | null
    while ((m2 = hrefRe.exec(html))) {
      const url = m2[1]
      const id  = url.match(/\/(\d+)\/?$/)?.[1] ?? url.split('/').pop() ?? ''
      if (!id || seen.has(id)) continue
      seen.add(id)

      // Extract surrounding context for price/area
      const start = Math.max(0, m2.index - 500)
      const end   = Math.min(html.length, m2.index + 500)
      const ctx   = html.slice(start, end).replace(/<[^>]+>/g, ' ')

      const priceM = ctx.match(/([\d.,]+)\s*€/)
      const area   = extractInt(ctx, 'm²|m2|metros')
      const beds   = extractInt(ctx, 'hab(?:itaciones?)?|dormitorios?')
      const baths  = extractInt(ctx, 'ba[ñn]os?')
      const imgM   = html.slice(start, end).match(/<img[^>]+src="(https?:\/\/[^"]+(?:jpg|jpeg|webp|png)[^"]*)"/i)

      results.push({
        source_external_id: `kelify_${id}`,
        source_url: url,
        title: '',
        price_eur: priceM ? parseNumber(priceM[1]) : null,
        area_m2: area,
        bedrooms: beds,
        bathrooms: baths,
        city: cityMeta.city,
        province: cityMeta.province,
        images: imgM ? [imgM[1]] : [],
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

async function upsertToSupabase(listing: KelifyListing, operation: string): Promise<boolean> {
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
    ranking_score: 55, // Kelify pre-filters particulars → slightly higher quality signal
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
      console.warn(`  [Kelify] ⚠️ Supabase error (${res.status}): ${err}`)
      return false
    }

    // Fetch the inserted ID then insert images
    if (listing.images.length > 0) {
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
          const imageRows = listing.images.slice(0, 8).map((url, pos) => ({
            listing_id: rows[0].id,
            source_url: url,
            position: pos,
          }))
          await fetch(`${SUPABASE_URL}/rest/v1/listing_images`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=ignore-duplicates,return=minimal',
            },
            body: JSON.stringify(imageRows),
            signal: AbortSignal.timeout(15000),
          })
        }
      }
    }

    return true
  } catch (err) {
    console.warn(`  [Kelify] ⚠️ Fetch/insert error: ${err}`)
    return false
  }
}

// ─── Main scraper ────────────────────────────────────────────────────────────

async function scrapePage(
  operation: string,
  citySlug: string,
  page: number,
  cityMeta: { province: string; city: string }
): Promise<KelifyListing[]> {
  // Kelify URL: https://kelify.com/venta/pisos/particulares/{ciudad}?page={n}
  const base =
    operation === 'alquiler'
      ? `https://kelify.com/alquiler/pisos/particulares/${citySlug}`
      : `https://kelify.com/venta/pisos/particulares/${citySlug}`

  const url = page === 1 ? base : `${base}?page=${page}`
  console.log(`  [Kelify] Página ${page}: ${url}`)

  const html = await fetchHtml(url)
  if (!html) return []

  const listings = extractListings(html, cityMeta)
  console.log(`  [Kelify] → ${listings.length} listings encontrados en página ${page}`)
  return listings
}

async function run() {
  if (!SUPABASE_KEY) {
    console.error('[Kelify] ❌ SUPABASE_SERVICE_KEY no definida')
    process.exit(1)
  }

  const [, , opArg = 'venta', cityArg = 'madrid', maxArg = '5'] = process.argv
  const operation = opArg.toLowerCase() === 'alquiler' ? 'alquiler' : 'venta'
  const cityKey   = cityArg.toLowerCase()
  const maxPages  = Math.min(parseInt(maxArg, 10) || 5, 20)

  const cityMeta = CITY_MAP[cityKey]
  if (!cityMeta) {
    console.error(`[Kelify] ❌ Ciudad desconocida: ${cityArg}. Opciones: ${Object.keys(CITY_MAP).join(', ')}`)
    process.exit(1)
  }

  console.log(`\n🏠 [Kelify Standalone] ${operation.toUpperCase()} · ${cityMeta.city} · máx ${maxPages} páginas`)
  console.log(`   Source: ${SOURCE} | is_particular: true | is_bank: false | ranking_score: 55`)
  console.log('─'.repeat(60))

  let totalInserted = 0
  let totalSkipped  = 0

  for (let page = 1; page <= maxPages; page++) {
    let listings: KelifyListing[]
    try {
      listings = await scrapePage(operation, cityMeta.slug, page, cityMeta)
    } catch (err) {
      console.warn(`  [Kelify] ⚠️ Error en página ${page}: ${err}`)
      break
    }

    if (listings.length === 0) {
      console.log(`  [Kelify] Sin resultados en página ${page}. Fin.`)
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
  console.log(`🏠 [Kelify] Fin: ${totalInserted} insertados, ${totalSkipped} ya existían`)
}

run().catch(err => {
  console.error('[Kelify] ❌ Error fatal:', err)
  process.exit(1)
})


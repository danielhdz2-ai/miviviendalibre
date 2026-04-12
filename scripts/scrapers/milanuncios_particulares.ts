/**
 * Scraper DEDICADO a particulares de Milanuncios
 *
 * URL base:
 *   Alquiler: /alquiler-de-pisos-en-{slug}/pisos-en-alquiler-particulares.htm
 *   Venta:    /venta-de-pisos-en-{slug}/pisos-en-venta-particulares.htm
 *
 * Reglas de negocio:
 *  - Solo anuncios con precio Y con fotos (descarta los demás).
 *  - Siempre is_particular = true.
 *  - Descarta anuncios con badge "Profesional" aunque aparezcan en la URL de particulares.
 *  - Descripción completa: hasta 3 000 chars.
 *  - Imágenes: CDN images-re.milanuncios.com/images/ads/{uuid}.
 *
 * Uso:
 *   npx tsx scripts/scrapers/milanuncios_particulares.ts [op] [city] [maxPages]
 *   op: venta | alquiler   (defecto: alquiler)
 *   city: madrid | barcelona | valencia | sevilla | zaragoza | bilbao | malaga | granada ...
 *   maxPages: número máximo de páginas  (defecto: 5)
 *
 * Ejemplo:
 *   npx tsx scripts/scrapers/milanuncios_particulares.ts alquiler madrid 5
 */

import { upsertListing, type ScrapedListing } from './utils'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ─────────────────────────────────────────────────────────────────────────────
// Ciudades soportadas  (slug = segmento en la URL de Milanuncios)
// ─────────────────────────────────────────────────────────────────────────────
const CITY_MAP: Record<string, { slug: string; label: string }> = {
  madrid:    { slug: 'madrid',    label: 'Madrid' },
  barcelona: { slug: 'barcelona', label: 'Barcelona' },
  valencia:  { slug: 'valencia',  label: 'Valencia' },
  sevilla:   { slug: 'sevilla',   label: 'Sevilla' },
  zaragoza:  { slug: 'zaragoza',  label: 'Zaragoza' },
  bilbao:    { slug: 'bilbao',    label: 'Bilbao' },
  malaga:    { slug: 'malaga',    label: 'Málaga' },
  granada:   { slug: 'granada',   label: 'Granada' },
  murcia:    { slug: 'murcia',    label: 'Murcia' },
  alicante:  { slug: 'alicante',  label: 'Alicante' },
  valladolid:{ slug: 'valladolid',label: 'Valladolid' },
  pamplona:  { slug: 'pamplona',  label: 'Pamplona' },
  santander: { slug: 'santander', label: 'Santander' },
  cordoba:   { slug: 'cordoba',   label: 'Córdoba' },
}

/** Delay entre peticiones para no saturar el servidor (Milanuncios rate-limita agresivamente) */
const DELAY_MS = 2200

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────────────────────────────────────
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Cache-Control': 'no-cache',
        Referer: 'https://www.milanuncios.com/',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      console.warn(`  ⚠️ HTTP ${res.status} → ${url}`)
      return null
    }
    return res.text()
  } catch (err) {
    console.warn(`  ⚠️ Fetch error: ${err}`)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Construye la URL de búsqueda de particulares
// ─────────────────────────────────────────────────────────────────────────────
function buildSearchUrl(
  operation: 'alquiler' | 'venta',
  citySlug: string,
  page: number
): string {
  const suffix =
    operation === 'venta'
      ? 'pisos-en-venta-particulares'
      : 'pisos-en-alquiler-particulares'
  const base = `https://www.milanuncios.com/${operation}-de-pisos-en-${citySlug}/${suffix}.htm`
  return page === 1 ? base : `${base}?pagina=${page}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Extrae URLs de anuncios de la página de resultados
// Solo hrefs que terminan en un ID numérico: -{7-12 dígitos}.htm
// Excluye URLs de filtros (contienen /precio/ o no tienen ID numérico)
// ─────────────────────────────────────────────────────────────────────────────
function extractListingUrls(html: string): string[] {
  const urls = new Set<string>()
  const re = /href="(\/(?:alquiler|venta)-de-pisos-en-[^/"]+\/[^/"]+\.htm)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const path = m[1]
    if (/\/precio\//.test(path)) continue
    if (!/-\d{7,12}\.htm$/.test(path)) continue
    urls.add(`https://www.milanuncios.com${path}`)
  }
  return [...urls]
}

// ─────────────────────────────────────────────────────────────────────────────
// Extrae el external_id desde la URL del anuncio
// Ejemplo: /alquiler-de-pisos-en-madrid-madrid/chamberi-589687822.htm → "589687822"
// ─────────────────────────────────────────────────────────────────────────────
function extractExternalId(url: string): string {
  const m = url.match(/-(\d{7,12})\.htm(?:\?.*)?$/)
  return m ? m[1] : url.replace(/\W/g, '').slice(-15)
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsea el HTML de una página de DETALLE
// ─────────────────────────────────────────────────────────────────────────────
function parseDetail(html: string, url: string): {
  price: number | null
  area: number | null
  bedrooms: number | null
  bathrooms: number | null
  description: string | null
  images: string[]
  district: string | null
  postalCode: string | null
  lat: number | null
  lng: number | null
  isProfesional: boolean
} {
  // ── ¿Es profesional? ─────────────────────────────────
  // Milanuncios muestra badge "Profesional" si el anunciante tiene cuenta pro
  const isProfesional = /sui-AtomBadge-icon-text[^>]*>Profesional/.test(html)

  // ── Precio ───────────────────────────────────────────
  // Patrón: "1.200 €" o "890 €" — puede aparecer varias veces; tomamos la primera instancia > 0
  let price: number | null = null
  const priceMatches = [...html.matchAll(/([\d]+(?:\.[\d]{3})*)\s*€/g)]
  for (const pm of priceMatches) {
    const val = parseInt(pm[1].replace(/\./g, ''), 10)
    if (val > 50 && val < 100_000) { price = val; break }
  }

  // ── Superficie ───────────────────────────────────────
  let area: number | null = null
  const areaPat = [
    /([\d]{2,4})\s*m²/,
    /([\d]{2,4})\s*m2/i,
    /([\d]{2,4})\s*metros?\s*cuadrados?/i,
  ]
  for (const p of areaPat) {
    const am = html.match(p)
    if (am) { area = parseInt(am[1], 10); break }
  }

  // ── Dormitorios ──────────────────────────────────────
  // En "Datos básicos": el label "Dormitorios" seguido del valor en el siguiente <p>
  let bedrooms: number | null = null
  const dormPat = [
    /Dormitorios<\/p><p[^>]*>(\d+)/,
    /(\d+)\s*dormitori(?:os?|o)/i,
    /(\d+)\s*habitaci(?:ones?|ón)/i,
    /(\d+)\s*dorm\./i,
  ]
  for (const p of dormPat) {
    const bm = html.match(p)
    if (bm) { bedrooms = parseInt(bm[1], 10); break }
  }

  // ── Baños ────────────────────────────────────────────
  let bathrooms: number | null = null
  const bathPat = [
    /Ba[ñn]os?<\/p><p[^>]*>(\d+)/,
    /(\d+)\s*ba[ñn]o/i,
  ]
  for (const p of bathPat) {
    const bm = html.match(p)
    if (bm) { bathrooms = parseInt(bm[1], 10); break }
  }

  // ── Imágenes ─────────────────────────────────────────
  // Milanuncios usa dos CDNs según el tipo de anunciante:
  //   Particulares: /api/v1/ma-ad-media-pro/images/{uuid}  (nuevo)
  //   Profesionales: images-re.milanuncios.com/images/ads/{uuid}  (legacy)
  // Usamos ambos y deduplicamos por UUID.
  const UUID_RE = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g
  const allUuids = new Set<string>()

  // CDN 1 — particulares (API)
  for (const m of html.matchAll(/ma-ad-media-pro\/images\/([a-f0-9-]{36})/g)) allUuids.add(m[1])
  // CDN 2 — profesionales (fallback)
  for (const m of html.matchAll(/images-re\.milanuncios\.com\/images\/ads\/([a-f0-9-]{36})/g)) allUuids.add(m[1])

  // Construir URL de alta resolución (detail_640x480 es la mayor disponible)
  const images = [...allUuids].map(
    (uuid) => `https://www.milanuncios.com/api/v1/ma-ad-media-pro/images/${uuid}?rule=detail_640x480`
  )

  // ── Descripción ──────────────────────────────────────
  let description: string | null = null

  // Estrategia 1: bloque de texto entre "Ref: {id}" o el inicio de la descripción y "Publicado el"
  const externalId = extractExternalId(url)
  const refPattern = new RegExp(`Ref:\\s*${externalId}[\\s\\S]{0,200}`)
  const refIdx = html.search(refPattern)
  if (refIdx > -1) {
    const pubIdx = html.indexOf('Publicado el', refIdx)
    const endIdx = pubIdx > refIdx ? pubIdx : Math.min(refIdx + 4000, html.length)
    const raw = html.substring(refIdx, endIdx)
    description = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Estrategia 2: meta description
  if (!description || description.length < 50) {
    const metaM = html.match(/<meta[^>]*name="description"[^>]*content="([^"]{50,})"/i)
      ?? html.match(/<meta[^>]*content="([^"]{50,})"[^>]*name="description"/i)
    if (metaM) {
      const decoded = metaM[1]
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .trim()
      if (decoded.length > (description?.length ?? 0)) description = decoded
    }
  }

  if (description && description.length > 3000) {
    description = description.slice(0, 3000).trimEnd()
  }

  // ── Coordenadas (Google Maps embed en la página) ──────
  let lat: number | null = null
  let lng: number | null = null
  const coordM = html.match(/center=([-\d.]+)%2C([-\d.]+)/)
  if (coordM) {
    lat = parseFloat(coordM[1])
    lng = parseFloat(coordM[2])
  }

  // ── Código postal ────────────────────────────────────
  let postalCode: string | null = null
  const pcM = html.match(/\b(0[1-9]|[1-4]\d|5[0-2])\d{3}\b/)
  if (pcM) postalCode = pcM[0]

  // ── Barrio/Distrito desde la URL del anuncio ─────────
  // URL: /alquiler-de-pisos-en-madrid-madrid/chamberi-calle-lafuente-589687822.htm
  // → tomar el path antes del ID, limpiar el slug
  let district: string | null = null
  const distM = url.match(/\/([^/]+)-\d{7,12}\.htm/)
  if (distM) {
    // El slug tiene format "barrio-calle-extrainfo" → tomar las primeras 2 palabras
    const parts = distM[1].split('-').slice(0, 2).join(' ')
    district = parts.charAt(0).toUpperCase() + parts.slice(1)
  }

  return {
    price,
    area,
    bedrooms,
    bathrooms,
    description,
    images,
    district,
    postalCode,
    lat,
    lng,
    isProfesional,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scraper principal
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeParticulares(
  operation: 'venta' | 'alquiler',
  citySlug: string,
  maxPages: number
): Promise<void> {
  const geoInfo = CITY_MAP[citySlug]
  if (!geoInfo) {
    console.error(`❌ Ciudad no soportada: ${citySlug}`)
    console.error(`   Ciudades disponibles: ${Object.keys(CITY_MAP).join(', ')}`)
    return
  }

  const opLabel = operation === 'venta' ? 'sale' : 'rent'
  console.log(`\n🏠 milanuncios PARTICULARES — ${operation}/${citySlug} (hasta ${maxPages} pág.)`)
  console.log('─'.repeat(60))

  let imported  = 0
  let skipped   = 0
  let discarded = 0
  let emptyPages = 0   // páginas consecutivas sin anuncios → stop ante rate limiting

  for (let page = 1; page <= maxPages; page++) {
    const searchUrl = buildSearchUrl(operation, geoInfo.slug, page)
    console.log(`\n  📄 Página ${page}: ${searchUrl}`)

    const listHtml = await fetchHtml(searchUrl)
    if (!listHtml) {
      console.log('  ⛔ Sin respuesta, deteniendo')
      break
    }

    // Detectar página sin resultados (redirige a página 1 o muestra "0 anuncios")
    if (/0\s*anuncios/.test(listHtml) && page > 1) {
      console.log('  ⚠️  Sin más resultados, deteniendo')
      break
    }

    const urls = extractListingUrls(listHtml)
    console.log(`  🔗 ${urls.length} anuncios encontrados`)

    if (urls.length === 0) {
      emptyPages++
      if (emptyPages >= 2) {
        console.log('  ⚠️  2 páginas vacías seguidas (posible rate limit), deteniendo')
        break
      }
      console.log('  ⚠️  Sin anuncios en esta página, probando siguiente...')
      await sleep(DELAY_MS * 2)  // wait extra antes de siguiente página
      continue
    }
    emptyPages = 0  // reset al encontrar anuncios

    for (const detailUrl of urls) {
      await sleep(DELAY_MS)

      const detailHtml = await fetchHtml(detailUrl)
      if (!detailHtml) {
        skipped++
        continue
      }

      const parsed = parseDetail(detailHtml, detailUrl)
      const externalId = extractExternalId(detailUrl)

      // ── Validación ────────────────────────────────────
      if (!parsed.price) {
        console.log(`  ⚠️ [DESCARTADO sin precio] ${detailUrl}`)
        discarded++
        continue
      }
      if (parsed.images.length === 0) {
        console.log(`  ⚠️ [DESCARTADO sin fotos] ${detailUrl}`)
        discarded++
        continue
      }
      if (parsed.isProfesional) {
        console.log(`  ⚠️ [DESCARTADO profesional] ${detailUrl}`)
        discarded++
        continue
      }

      // ── Construir objeto para upsert ──────────────────
      const listing: ScrapedListing = {
        source_portal:      'milanuncios.com',
        source_external_id: `mil_${externalId}`,
        operation_type:     opLabel as 'rent' | 'sale',
        property_type:      'apartment',
        price:              parsed.price,
        area:               parsed.area ?? undefined,
        bedrooms:           parsed.bedrooms ?? undefined,
        bathrooms:          parsed.bathrooms ?? undefined,
        description:        parsed.description ?? undefined,
        images:             parsed.images,
        city:               geoInfo.label,
        district:           parsed.district ?? undefined,
        postal_code:        parsed.postalCode ?? undefined,
        lat:                parsed.lat ?? undefined,
        lng:                parsed.lng ?? undefined,
        is_particular:      true,
        source_url:         detailUrl,
      }

      const result = await upsertListing(listing)
      if (result === 'inserted' || result === 'updated') {
        imported++
        const imgs = parsed.images.length
        console.log(`  ✓particular [${result}] ${parsed.price}€ ${parsed.area ?? '?'}m² ${imgs}📷 — ${detailUrl.split('/').slice(-1)[0]}`)
      } else {
        skipped++
      }
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`  ✅ Importados: ${imported}  |  Omitidos: ${skipped}  |  Descartados: ${discarded}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const args      = process.argv.slice(2)
  const operation = (args[0] === 'venta' ? 'venta' : 'alquiler') as 'venta' | 'alquiler'
  const citySlug  = args[1] ?? 'madrid'
  const maxPages  = parseInt(args[2] ?? '5', 10)

  if (!['venta', 'alquiler'].includes(args[0] ?? '')) {
    // si no se pasó op explícita, avisar pero continuar con el default
  }

  await scrapeParticulares(operation, citySlug, maxPages)
}

main().catch(console.error)

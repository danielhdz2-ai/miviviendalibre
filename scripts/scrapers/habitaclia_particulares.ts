/**
 * 🏠 Scraper Habitaclia — Particulares
 *
 * Habitaclia filtra particulares via URL:
 *   https://www.habitaclia.com/comprar-pisos-en-{city}/anunciante-particular.htm?i={page-1}
 *
 * Clasificación: si la página de detalle contiene "particular" o "anunci de particular"
 * (catalán) → is_particular=true. Siempre guardamos, nunca descartamos.
 *
 * Uso:
 *   npx tsx scripts/scrapers/habitaclia_particulares.ts [operation] [city] [maxPages]
 *   operation: venta | alquiler (default: venta)
 *   city: madrid | barcelona | valencia | sevilla | zaragoza | malaga (default: madrid)
 *   maxPages: número de páginas (default: 5)
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { upsertListing, extractPhone, type ScrapedListing } from './utils'

// Playwright + Stealth — Habitaclia usa Imperva que bloquea fetch() convencional
chromium.use(StealthPlugin())

// ─── Configuración ────────────────────────────────────────────────────────────

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const DELAY_MS      = 2000
const PAGE_DELAY_MS = 3500

const CITY_MAP: Record<string, { province: string; city: string; slug: string }> = {
  madrid:    { province: 'Madrid',    city: 'Madrid',    slug: 'madrid' },
  barcelona: { province: 'Barcelona', city: 'Barcelona', slug: 'barcelona' },
  valencia:  { province: 'Valencia',  city: 'Valencia',  slug: 'valencia' },
  sevilla:   { province: 'Sevilla',   city: 'Sevilla',   slug: 'sevilla' },
  zaragoza:  { province: 'Zaragoza',  city: 'Zaragoza',  slug: 'zaragoza' },
  malaga:    { province: 'Málaga',    city: 'Málaga',    slug: 'malaga' },
  bilbao:    { province: 'Vizcaya',   city: 'Bilbao',    slug: 'bilbao' },
  alicante:  { province: 'Alicante',  city: 'Alicante',  slug: 'alicante' },
  murcia:    { province: 'Murcia',    city: 'Murcia',    slug: 'murcia' },
  granada:   { province: 'Granada',   city: 'Granada',   slug: 'granada' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// fetchHtml usa Playwright para evitar el bloqueo Imperva de Habitaclia
let _browser: import('playwright').Browser | null = null

async function getBrowser() {
  if (!_browser) {
    _browser = await chromium.launch({ headless: true })
  }
  return _browser
}

async function fetchHtml(url: string, referer = 'https://www.habitaclia.com/'): Promise<string | null> {
  try {
    const browser = await getBrowser()
    const context = await browser.newContext({
      userAgent: UA,
      extraHTTPHeaders: {
        'Accept-Language': 'es-ES,es;q=0.9,ca;q=0.8',
        Referer: referer,
      },
    })
    const page = await context.newPage()
    const res  = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    if (!res || !res.ok()) {
      console.warn(`  ⚠️ HTTP ${res?.status()} para ${url}`)
      await context.close()
      return null
    }
    const html = await page.content()
    await context.close()
    return html
  } catch (err) {
    console.warn(`  ⚠️ Fetch error: ${err}`)
    return null
  }
}

// ─── Construcción de URL de búsqueda ─────────────────────────────────────────

/**
 * Habitaclia URLs (formato verificado abril 2026):
 *   Venta pág 1:  /viviendas-particulares-{city}.htm
 *   Venta pág 2+: /viviendas-particulares-{city}.htm?i={n}
 *   Alquiler pág 1:  /alquiler-piso_particular-{city}.htm
 *   Alquiler pág 2+: /alquiler-piso_particular-{city}.htm?i={n}
 */
function buildSearchUrl(operation: 'venta' | 'alquiler', citySlug: string, page: number): string {
  const base = operation === 'venta'
    ? `https://www.habitaclia.com/viviendas-particulares-${citySlug}.htm`
    : `https://www.habitaclia.com/alquiler-piso_particular-${citySlug}.htm`
  return page === 1 ? base : `${base}?i=${page - 1}`
}

// ─── Extracción de links de detalle desde el listado ─────────────────────────

interface HabitacliaItem {
  url: string
  title: string
  price: number | null
}

function extractListingLinks(html: string): HabitacliaItem[] {
  const items: HabitacliaItem[] = []
  const seen = new Set<string>()

  // Habitaclia inyecta JSON-LD (Product/RealEstateListing) o anota las URL en data-href
  // Estrategia 1: JSON-LD
  const jsonRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = jsonRe.exec(html))) {
    try {
      const raw = m[1].trim()
      const obj = JSON.parse(raw)
      const entries = Array.isArray(obj) ? obj : [obj]
      for (const d of entries) {
        const url = d.url ?? d['@id'] ?? ''
        if (!url || seen.has(url)) continue
        const fullUrl = url.startsWith('http') ? url : `https://www.habitaclia.com${url}`
        seen.add(url)
        const price =
          typeof d.offers?.price === 'number'
            ? d.offers.price
            : typeof d.price === 'number'
              ? d.price
              : null
        items.push({ url: fullUrl, title: d.name ?? '', price })
      }
    } catch {
      // ignore
    }
  }

  if (items.length > 0) return items

  // Estrategia 2: href con patrón ID de Habitaclia (-i\d{8,}.htm)
  // Captura URLs absolutas: https://www.habitaclia.com/comprar-piso-...-madrid-i500004521959.htm
  const linkRe = /href="(https?:\/\/www\.habitaclia\.com\/(?:comprar|alquiler)-[^"?#\s]*-i\d{8,}\.htm)"/gi
  while ((m = linkRe.exec(html))) {
    const url = m[1]
    if (seen.has(url)) continue
    seen.add(url)
    items.push({ url, title: '', price: null })
  }

  return items
}

// ─── Detectar si es particular según el portal ───────────────────────────────

/**
 * Habitaclia muestra "Anunci de particular" (catalán) o "Anuncio de particular"
 * en la página de detalle. Si el portal dice particular → es particular.
 */
function isParticularListing(html: string): boolean {
  return /anunci(?:o)?\s+de\s+particular|anunciante\s+particular/i.test(html)
}

// ─── Extracción de datos de detalle ──────────────────────────────────────────

interface DetailData {
  price:          number | null
  area:           number | null
  bedrooms:       number | null
  bathrooms:      number | null
  description:    string | null
  images:         string[]
  postalCode:     string | null
  lat:            number | null
  lng:            number | null
  advertiserName: string | null
}

function extractDetailData(html: string, fallbackPrice: number | null): DetailData {
  // ── Precio ──────────────────────────────────────────────────────────────────
  let price = fallbackPrice
  if (!price) {
    const priceRe = [
      /"price"\s*:\s*(\d{4,8})/,
      /itemprop="price"[^>]*content="(\d{4,8})"/,
      /(\d{4,8})\s*€/,
    ]
    for (const pat of priceRe) {
      const m = html.match(pat)
      if (m) { price = parseInt(m[1], 10); break }
    }
  }

  // ── Superficie, habitaciones, baños ─────────────────────────────────────────
  const areaM    = html.match(/(\d{2,4})\s*m[²2]/i)
  const area     = areaM ? parseInt(areaM[1], 10) : null
  const bedsM    = html.match(/(\d{1,2})\s*(?:habitacion|dormitori|dormitorio)/i)
  const bedrooms = bedsM ? parseInt(bedsM[1], 10) : null
  const bathM    = html.match(/(\d{1,2})\s*(?:ba[ñn]o|bany)/i)
  const bathrooms = bathM ? parseInt(bathM[1], 10) : null

  // ── Descripción ──────────────────────────────────────────────────────────────
  let description: string | null = null
  const descPatterns = [
    /"description"\s*:\s*"((?:[^"\\]|\\.){80,})"/,
    /<meta[^>]+name="description"[^>]+content="([^"]{30,})"/i,
  ]
  for (const pat of descPatterns) {
    const m = html.match(pat)
    if (m && m[1].length > 80) {
      description = m[1]
        .replace(/\\n/g, '\n').replace(/\\r/g, '')
        .replace(/\\u([\da-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\"/g, '"')
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
        .trim()
      break
    }
  }

  // ── Código postal ────────────────────────────────────────────────────────────
  let postalCode: string | null = null
  const pcM = html.match(/\b(0[1-9]|[1-4]\d|5[0-2])\d{3}\b/)
  if (pcM) postalCode = pcM[0]

  // ── Coordenadas ──────────────────────────────────────────────────────────────
  let lat: number | null = null
  let lng: number | null = null
  const latM  = html.match(/"lat(?:itude)?"\s*:\s*"?([-\d.]+)"?/i)
  const lngM  = html.match(/"l(?:ng|on|ongitude)"\s*:\s*"?([-\d.]+)"?/i)
  if (latM) lat = parseFloat(latM[1])
  if (lngM) lng = parseFloat(lngM[1])

  // ── Imágenes ─────────────────────────────────────────────────────────────────
  const images: string[] = []
  const seen = new Set<string>()
  // Habitaclia usa CDN: https://cdn.habitaclia.com/images/{id}/{n}.jpg
  const imgRe = /https:\/\/(?:cdn|static)\.habitaclia\.com\/(?:images|fotos)\/[^\s"']+\.(?:jpg|jpeg|png|webp)/gi
  let imgM: RegExpExecArray | null
  while ((imgM = imgRe.exec(html))) {
    const url = imgM[0].split('?')[0]
    if (seen.has(url)) continue
    // Excluir miniaturas (thumbnail, thumb, small)
    if (/thumb|small|mini|logo|avatar/i.test(url)) continue
    seen.add(url)
    images.push(url)
    if (images.length >= 15) break
  }

  // ── Nombre del anunciante ─────────────────────────────────────────────────────
  let advertiserName: string | null = null
  const adPatterns = [
    /data-(?:advertiser|owner|contact)-name="([^"]{3,80})"/i,
    /"(?:agent|author|seller|provider)"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]{4,80})"/,
    /class="[^"]*(?:advertiser-name|contact-name|owner-name|nom-anunciant)[^"]*"[^>]*>\s*([^<]{3,80})\s*</i,
  ]
  for (const pat of adPatterns) {
    const m = html.match(pat)
    if (m) { advertiserName = m[1].trim(); break }
  }

  return { price, area, bedrooms, bathrooms, description, images, postalCode, lat, lng, advertiserName }
}

// ─── Scraper principal ────────────────────────────────────────────────────────

async function scrapeHabitacliaParticulares(
  operation: 'venta' | 'alquiler',
  citySlug: string,
  maxPages: number,
): Promise<void> {
  const geoInfo = CITY_MAP[citySlug]
  if (!geoInfo) {
    console.error(`❌ Ciudad no soportada: ${citySlug}`)
    console.error(`   Disponibles: ${Object.keys(CITY_MAP).join(', ')}`)
    process.exit(1)
  }

  const opLabel = operation === 'venta' ? 'sale' : 'rent'
  console.log(`\n🏠 HABITACLIA PARTICULARES — ${operation}/${citySlug} (${maxPages} páginas)`)
  console.log('─'.repeat(70))

  let imported  = 0
  let rejected  = 0   // guardados con is_particular=false (portal no dijo particular)
  let skipped   = 0   // error de red / datos insuficientes

  for (let page = 1; page <= maxPages; page++) {
    const searchUrl = buildSearchUrl(operation, geoInfo.slug, page)
    console.log(`\n  📄 Página ${page}: ${searchUrl}`)

    const listHtml = await fetchHtml(searchUrl)
    if (!listHtml) {
      console.warn(`  ⚠️ No se pudo cargar página ${page}, parando`)
      break
    }

    if (
      listHtml.includes('No s\'han trobat resultats') ||
      listHtml.includes('no s\'han trouve') ||
      listHtml.includes('no s\'han encontrado') ||
      listHtml.includes('No hemos encontrado')
    ) {
      console.log(`  ✅ Sin más resultados en página ${page}`)
      break
    }

    const items = extractListingLinks(listHtml)
    if (items.length === 0) {
      console.log(`  ⚠️ Sin anuncios en página ${page}, parando`)
      break
    }

    console.log(`  → ${items.length} anuncios encontrados`)

    for (const item of items) {
      await sleep(DELAY_MS)

      const detailHtml = await fetchHtml(item.url, searchUrl)
      if (!detailHtml) { skipped++; continue }

      const confirmedParticular = isParticularListing(detailHtml)
      if (!confirmedParticular) {
        console.log(`    🏢 [AGENCIA] guardando con is_particular=false: ${item.url.split('/').slice(-1)[0]}`)
      }

      const detail = extractDetailData(detailHtml, item.price)
      if (!detail.price || detail.images.length === 0) {
        console.log(`    ⚠️ [DESCARTADO sin precio/fotos] ${item.url}`)
        skipped++
        continue
      }

      // Título: usar el del JSON-LD o construir uno
      const title =
        item.title.trim() ||
        [
          detail.bedrooms ? `${detail.bedrooms} hab.` : '',
          detail.area     ? `${detail.area} m²`       : '',
        ].filter(Boolean).join(' · ') +
        ` – ${operation === 'venta' ? 'Venta' : 'Alquiler'} en ${geoInfo.city}`

      const externalId = `hab_${item.url.replace(/https?:\/\/[^/]+/,'').replace(/[^a-zA-Z0-9]/g,'_').slice(-60)}`

      const listing: ScrapedListing = {
        title:               title || `Piso en ${operation} – ${geoInfo.city}`,
        description:         detail.description ?? undefined,
        price_eur:           detail.price,
        operation:           opLabel as 'sale' | 'rent',
        province:            geoInfo.province,
        city:                geoInfo.city,
        postal_code:         detail.postalCode ?? undefined,
        bedrooms:            detail.bedrooms   ?? undefined,
        bathrooms:           detail.bathrooms  ?? undefined,
        area_m2:             detail.area       ?? undefined,
        lat:                 detail.lat        ?? undefined,
        lng:                 detail.lng        ?? undefined,
        source_portal:       'habitaclia.com',
        source_url:          item.url,
        source_external_id:  externalId,
        is_particular:       confirmedParticular,
        images:              detail.images,
        external_link:       item.url,
        phone:               extractPhone(detailHtml) ?? undefined,
        advertiser_name:     detail.advertiserName ?? undefined,
      }

      const ok = await upsertListing(listing)
      if (ok) {
        if (confirmedParticular) {
          imported++
          console.log(
            `    ✅ [${imported}] 🏠 PARTICULAR: ${title.slice(0, 50)} | ${detail.price.toLocaleString('es-ES')}€ | ${detail.area ?? '?'}m²`,
          )
        } else {
          rejected++
          console.log(
            `    🏢 [AGENCIA] guardada: ${title.slice(0, 50)} | ${detail.price.toLocaleString('es-ES')}€`,
          )
        }
      } else {
        skipped++
      }

      await sleep(DELAY_MS)
    }

    if (page < maxPages) {
      console.log(`  ⏳ Esperando ${PAGE_DELAY_MS / 1000}s...`)
      await sleep(PAGE_DELAY_MS)
    }
  }

  console.log('\n' + '─'.repeat(70))
  console.log(`📊 HABITACLIA PARTICULARES — ${operation}/${citySlug}:`)
  console.log(`   ✅ ${imported} importados como particular`)
  console.log(`   🏢 ${rejected} agencias guardadas con is_particular=false`)
  console.log(`   ⚠️ ${skipped} omitidos (datos insuficientes o error)`)
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args      = process.argv.slice(2)
  const operation = (args[0] as 'venta' | 'alquiler') || 'venta'
  const city      = args[1] || 'madrid'
  const maxPages  = parseInt(args[2] || '5', 10)
  try {
    await scrapeHabitacliaParticulares(operation, city, maxPages)
  } finally {
    if (_browser) await _browser.close()
  }
}

main().catch(console.error)

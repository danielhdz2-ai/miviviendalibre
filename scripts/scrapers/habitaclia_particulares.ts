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

// Imperva requiere headless:false (TLS fingerprint distinto al de Chrome headless).
// Estrategia: warm-then-navigate — visitamos la home en la misma página y navegamos
// directamente al listado (Referer natural). Las páginas de detalle abren en nuevas
// pestañas del mismo contexto (cookies compartidas).
let _browser: import('playwright').Browser | null = null
let _context: import('playwright').BrowserContext | null = null

async function getContext(): Promise<import('playwright').BrowserContext> {
  if (_context) return _context
  _browser = await chromium.launch({ headless: false })
  _context = await _browser.newContext({
    userAgent: UA,
    locale: 'es-ES',
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: {
      'Accept-Language': 'es-ES,es;q=0.9,ca;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  })
  return _context
}

/**
 * Fetch de la página de LISTADO:
 * - Primera vez: visita home, después navega al listado en la MISMA página (Referer natural).
 * - Páginas 2+: nueva pestaña en el contexto existente (cookies de sesión ya establecidas).
 */
async function fetchListingPage(url: string, isFirstPage: boolean): Promise<string | null> {
  try {
    const ctx = await getContext()
    const page = await ctx.newPage()
    try {
      if (isFirstPage) {
        console.log('  🔑 Pre-warm: visitando home...')
        await page.goto('https://www.habitaclia.com/', { waitUntil: 'domcontentloaded', timeout: 25000 })
        await page.mouse.move(400, 300, { steps: 15 })
        await page.waitForTimeout(800)
        await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }))
        await page.waitForTimeout(4000)
        console.log('  ✅ Pre-warm OK, cargando listado...')
      }
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(2000)
      const html = await page.content()
      if (html.includes('Pardon Our Interruption') || html.includes('Request ID:')) {
        console.warn(`  ⚠️ Imperva block en ${url}`)
        return null
      }
      return html
    } finally {
      await page.close().catch(() => {})
    }
  } catch (err) {
    console.warn(`  ⚠️ Fetch error (listing): ${err}`)
    return null
  }
}

/** Fetch de página de DETALLE: nueva pestaña en contexto existente (cookies compartidas). */
async function fetchHtml(url: string, referer = 'https://www.habitaclia.com/'): Promise<string | null> {
  try {
    const ctx = await getContext()
    const page = await ctx.newPage()
    await page.setExtraHTTPHeaders({ Referer: referer })
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
      if (!res || !res.ok()) {
        console.warn(`  ⚠️ HTTP ${res?.status()} para ${url}`)
        return null
      }
      const html = await page.content()
      if (html.includes('Pardon Our Interruption') || html.includes('Request ID:')) {
        console.warn(`  ⚠️ Imperva block en ${url}`)
        return null
      }
      return html
    } finally {
      await page.close().catch(() => {})
    }
  } catch (err) {
    console.warn(`  ⚠️ Fetch error: ${err}`)
    return null
  }
}

async function closeSession() {
  await _context?.close().catch(() => {})
  await _browser?.close().catch(() => {})
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

// ─── Extracción de datos del listado ─────────────────────────────────────────
//
// Habitaclia embebe toda la info necesaria en cada <article>:
//   - data-href       → URL limpia del anuncio
//   - data-esparticular="PRIVATE" → clasificación particular
//   - data-image="//images.habimg.com/...G.jpg" → todas las fotos del carrusel
//   - itemprop="price">\d+ € → precio en formato europeo

interface HabitacliaItem {
  url:          string
  title:        string
  price:        number | null
  isParticular: boolean
  images:       string[]
}

/** Extrae precio en formato europeo ("925.000 €" → 925000, "300.000€" → 300000) */
function parseEuropeanPrice(text: string): number | null {
  // Busca patrón: 1-4 dígitos + (punto + 3 dígitos)* + espacio opcional + €
  const m = text.match(/(\d{1,4}(?:\.\d{3})*)\s*€/)
  if (!m) {
    // fallback: dígitos sin punto separador
    const m2 = text.match(/(\d{4,9})\s*€/)
    return m2 ? parseInt(m2[1], 10) : null
  }
  return parseInt(m[1].replace(/\./g, ''), 10)
}

function extractListingItems(html: string): HabitacliaItem[] {
  const items: HabitacliaItem[] = []
  const seen = new Set<string>()

  // Cada anuncio está en <article id="id{8+digitos}" data-href="..." data-esparticular="...">
  const articleStartRe = /<article\b[^>]+\bid="id(\d{8,})"[^>]*>/gi
  let artM: RegExpExecArray | null
  const starts: Array<{ idx: number; attrs: string }> = []

  while ((artM = articleStartRe.exec(html)) !== null) {
    starts.push({ idx: artM.index, attrs: artM[0] })
  }

  for (let i = 0; i < starts.length; i++) {
    const { idx, attrs } = starts[i]
    const end = i + 1 < starts.length ? starts[i + 1].idx : idx + 8000
    const artHtml = html.substring(idx, Math.min(end, idx + 8000))

    // URL: data-href (con parámetros de filtro; usamos URL limpia)
    const hrefM = attrs.match(/data-href="([^"]+)"/)
    if (!hrefM) continue
    const rawUrl = hrefM[1].replace(/&amp;/g, '&')
    const url = rawUrl.split('?')[0]
    if (seen.has(url)) continue
    seen.add(url)

    // ¿Es particular?
    const isParticular = /data-esparticular="PRIVATE"/i.test(attrs)

    // Imágenes: data-image attrs del carrusel (lazy-loaded)
    const images: string[] = []
    const imgRe = /data-image="(\/\/images\.habimg\.com\/[^"]+)"/gi
    let imgM: RegExpExecArray | null
    while ((imgM = imgRe.exec(artHtml)) !== null) {
      const url = 'https:' + imgM[1]
      if (!images.includes(url)) images.push(url)
    }
    // Fallback: src= (primera imagen visible en el DOM)
    const srcRe = /src="(\/\/images\.habimg\.com\/[^"]+)"/gi
    while ((imgM = srcRe.exec(artHtml)) !== null) {
      const url = 'https:' + imgM[1]
      if (!images.includes(url)) images.push(url)
    }

    // Precio (formato europeo)
    const price = parseEuropeanPrice(artHtml)

    // Título: itemprop="name" o alt de la primera imagen
    let title = ''
    const nameM = artHtml.match(/itemprop="name"[^>]*>\s*([^<]{5,120})\s*</)
               ?? artHtml.match(/alt="([^"]{10,120})"/)
    if (nameM) title = nameM[1].trim()

    items.push({ url, title, price, isParticular, images })
  }

  return items
}

// ─── Detectar si es particular según el portal ───────────────────────────────

/**
 * Habitaclia muestra "Anunci de particular" (catalán), "Anuncio de particular",
 * "Anunciante particular" o simplemente "Particular" como tipo de anunciante.
 * También acepta si el HTML tiene f=particulares en la URL canónica.
 */
function isParticularListing(html: string): boolean {
  return (
    /data-esparticular="PRIVATE"/i.test(html) ||          // listing article attr
    /<span[^>]*class="[^"]*title[^"]*"[^>]*>\s*Particular\s*<\/span>/i.test(html) || // detail page
    /Contactar\s+Particular/i.test(html) ||               // contact form label
    /data-gtmbrand="[^"]*Particular[^"]*"/i.test(html) || // analytics attribute
    /anunci(?:o)?\s+de\s+particular/i.test(html) ||
    /anunciante[:\s]+particular/i.test(html) ||
    /tipus\s+d['']anunciant[^<]{0,40}particular/i.test(html) ||
    /tipo\s+de\s+anunciante[^<]{0,40}particular/i.test(html) ||
    /f=particulares/.test(html)
  )
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
  features:       Record<string, string>
}

function extractDetailData(html: string, fallbackPrice: number | null, detailUrl?: string): DetailData {
  // ── Precio ──────────────────────────────────────────────────────────────────
  // Habitaclia detail: itemprop="price">925.000 € (formato europeo)
  // IMPORTANTE: siempre intentar extraer del detalle; fallbackPrice solo como último recurso.
  let price: number | null = null
  // itemprop con texto (sin content=)
  const ipM = html.match(/itemprop="price">([\d.,\s]+)\s*€/)
  if (ipM) {
    price = parseInt(ipM[1].replace(/[\s.]/g, '').replace(/,/g, ''), 10) || null
  }
  if (!price) {
    // Buscar en contenedor específico de precio de Habitaclia
    const priceContM = html.match(/class="[^"]*(?:list-item-price|detail-price|ficha-precio)[^"]*"[^>]*>([\s\S]{0,200}?)(?:<\/|itemprop)/)
    if (priceContM) price = parseEuropeanPrice(priceContM[1])
  }
  if (!price) price = fallbackPrice

  // ── Superficie, habitaciones, baños ─────────────────────────────────────────
  // Habitaclia HTML: <li>Superficie 161&nbsp;m<sup>2</sup></li>
  // The sidebar has <option value="50">50 m2</option> before the real stats.
  // Key insight: real data is tagged with "Superficie NNN" or inside <li> with
  // the exact HTML entity (&nbsp;) + <sup>2</sup> pattern.
  let area: number | null = null
  const areaPatterns: RegExp[] = [
    // 1. Habitaclia exact: "Superficie NNN&nbsp;m<sup>2</sup>"
    /[Ss]uperficie\s+(?:construida\s+)?(\d{2,4})(?:&nbsp;|\s+)m<sup>/i,
    // 2. Habitaclia in <li>: ">NNN&nbsp;m<sup>2</sup><"
    />(\d{2,4})(?:&nbsp;|\s+)m<sup>2<\/sup></i,
    // 3. URL slug: "-NNNm2_" or "_NNNm2-" (very reliable, appears in img URLs)
    /[-_](\d{2,4})m2[-_]/i,
    // 4. Plain text fallback — only match ≥3 digits to skip sidebar 50/60/70/80…
    /(\d{3,4})\s*m[²2]/,
  ]
  for (const pat of areaPatterns) {
    const m = html.match(pat)
    if (m) {
      const v = parseInt(m[1], 10)
      if (v >= 18 && v <= 5000) { area = v; break }
    }
  }
  // Habitaclia: <li>5 habitaciones</li> or <li>2 Baños</li>
  const bedsM    = html.match(/>(\d{1,2})\s*(?:habitacion|dormitori|dormitorio)/i)
               ?? html.match(/(\d{1,2})\s*(?:habitacion|dormitori|dormitorio)/i)
  const bedrooms = bedsM ? parseInt(bedsM[1], 10) : null
  const bathM    = html.match(/>(\d{1,2})\s*(?:ba[ñn]o|bany)/i)
               ?? html.match(/(\d{1,2})\s*(?:ba[ñn]o|bany)/i)
  const bathrooms = bathM ? parseInt(bathM[1], 10) : null

  // ── Descripción ──────────────────────────────────────────────────────────────
  // Intentar el cuerpo real del texto (itemprop="description") antes del meta truncado.
  let description: string | null = null

  function cleanHtmlText(raw: string): string {
    return raw
      .replace(/<[^>]+>/g, ' ')  // eliminar tags HTML
      .replace(/\\n/g, '\n').replace(/\\r/g, '')
      .replace(/\\u([\da-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\"/g, '"')
      .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  // 1) itemprop="description" en el cuerpo (texto completo, puede tener HTML interno)
  const itempropDescM = html.match(/itemprop="description"[^>]*>([\s\S]{80,8000}?)<\/(?:p|div|section)\s*>/i)
  if (itempropDescM) {
    const cleaned = cleanHtmlText(itempropDescM[1])
    if (cleaned.length > 80) description = cleaned
  }

  // 2) JSON-LD description
  if (!description) {
    const jsonDescM = html.match(/"description"\s*:\s*"((?:[^"\\]|\\.){80,})"/)
    if (jsonDescM) description = cleanHtmlText(jsonDescM[1])
  }

  // 3) meta description (último recurso, ~160 chars)
  if (!description) {
    const metaM = html.match(/<meta[^>]+name="description"[^>]+content="([^"]{30,})"/i)
    if (metaM && metaM[1].length > 80) description = cleanHtmlText(metaM[1])
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
  // Habitaclia detail: //images.habimg.com/imgh/{codem}-{id}/{slug}_{uuid}XL.jpg
  // IMPORTANTE: el final de la página tiene "Anuncios similares" con fotos de otros
  // inmuebles. Filtramos por el path del inmueble actual usando data-codem/data-codinm.
  const codemAttr  = html.match(/data-codem="(\d+)"/)?.[1]
  const codinmAttr = html.match(/data-codinm="(\d+)"/)?.[1]
  const propertyPath = (codemAttr && codinmAttr) ? `/imgh/${codemAttr}-${codinmAttr}/` : null

  const images: string[] = []
  const seenImgs = new Set<string>()
  const imgRe = /(?:https?:)?\/\/images\.habimg\.com\/imgh\/[^\s"'<>)]+\.(?:jpg|jpeg|png|webp)/gi
  let imgM: RegExpExecArray | null
  while ((imgM = imgRe.exec(html))) {
    const raw = imgM[0].replace(/\);?$/, '') // strip trailing ); from CSS url()
    const url = raw.startsWith('//') ? 'https:' + raw : raw
    if (seenImgs.has(url)) continue
    if (propertyPath && !url.includes(propertyPath)) continue // ignorar fotos de otros inmuebles
    if (/[Pp]\.(?:jpg|jpeg|png|webp)$/.test(url)) continue  // skip preview (P) size
    if (/logo|avatar|banner/i.test(url)) continue
    seenImgs.add(url)
    images.push(url)
    if (images.length >= 20) break
  }

  // ── Amenidades ───────────────────────────────────────────────────────────────
  // Habitaclia lists amenities in <li class="feature">TEXTO</li> elements.
  const features: Record<string, string> = {}
  const amenityMap: Array<[string, RegExp]> = [
    ['ascensor',           /ascensor/i],
    ['terraza',            /terraza/i],
    ['garaje',             /garaje|parking|plaza\s*de?\s*park/i],
    ['piscina',            /piscina/i],
    ['trastero',           /trastero/i],
    ['jardin',             /jard[ií]n/i],
    ['aire_acondicionado', /aire\s*acondicionado/i],
    ['calefaccion',        /calefacci[oó]n/i],
    ['armarios_empotrados',/armarios?\s*empotrados?/i],
    ['exterior',           /\bexterior\b/i],
    ['vigilancia',         /vigilancia|conserjería/i],
  ]
  // Extract text from feature elements
  const featRe = /class="[^"]*\bfeature\b[^"]*"[^>]*>\s*([^<]{3,60}?)\s*</gi
  const featTexts: string[] = []
  let featM: RegExpExecArray | null
  while ((featM = featRe.exec(html))) featTexts.push(featM[1].trim())
  const featBlob = featTexts.join(' ') + ' ' + html
  for (const [key, re] of amenityMap) {
    if (re.test(featBlob)) features[key] = 'true'
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

  return { price, area, bedrooms, bathrooms, description, images, postalCode, lat, lng, advertiserName, features }
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

    const listHtml = await fetchListingPage(searchUrl, page === 1)
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

    const items = extractListingItems(listHtml)
    if (items.length === 0) {
      console.log(`  ⚠️ Sin anuncios en página ${page}, parando`)
      break
    }

    const particulars = items.filter(i => i.isParticular)
    const agencies    = items.filter(i => !i.isParticular)
    console.log(`  → ${items.length} anuncios (${particulars.length} particulares, ${agencies.length} agencias)`)

    for (const item of items) {
      // Saltar agencias directamente desde el listado
      if (!item.isParticular) {
        console.log(`    🏢 [AGENCIA] saltando: ${item.url.split('/').pop()}`)
        continue
      }

      // Datos primarios del listado (precio + imágenes ya disponibles)
      let price  = item.price
      let images = [...item.images]
      let detail: Awaited<ReturnType<typeof extractDetailData>> | null = null

      // Enriquecimiento opcional con página de detalle
      await sleep(DELAY_MS)
      const detailHtml = await fetchHtml(item.url, searchUrl)
      if (detailHtml) {
        detail = extractDetailData(detailHtml, price, item.url)
        if (detail.price)              price  = detail.price
        if (detail.images.length > 0)  images = detail.images
      }

      // Si no tenemos precio ni fotos (ni de listing ni de detalle) → descartar
      if (!price || images.length === 0) {
        console.log(`    ⚠️ [DESCARTADO sin precio/fotos] ${item.url}`)
        skipped++
        continue
      }

      const confirmedParticular = detailHtml ? isParticularListing(detailHtml) : true

      // Título desde el listing o desde la página de detalle (h1)
      let title = item.title.trim()
      if (!title && detailHtml) {
        const h1M = detailHtml.match(/<h1[^>]*>([^<]{5,120})<\/h1>/i)
        if (h1M) title = h1M[1].trim()
      }
      if (!title) {
        title = [
          detail?.bedrooms ? `${detail.bedrooms} hab.` : '',
          detail?.area     ? `${detail.area} m²`       : '',
        ].filter(Boolean).join(' · ') + ` – ${operation === 'venta' ? 'Venta' : 'Alquiler'} en ${geoInfo.city}`
      }

      const externalId = `hab_${item.url.replace(/https?:\/\/[^/]+/,'').replace(/[^a-zA-Z0-9]/g,'_').slice(-60)}`

      const listing: ScrapedListing = {
        title:               title || `Piso en ${operation} – ${geoInfo.city}`,
        description:         detail?.description ?? undefined,          features:            detail?.features && Object.keys(detail.features).length > 0 ? detail.features : undefined,        price_eur:           price,
        operation:           opLabel as 'sale' | 'rent',
        province:            geoInfo.province,
        city:                geoInfo.city,
        postal_code:         detail?.postalCode ?? undefined,
        bedrooms:            detail?.bedrooms   ?? undefined,
        bathrooms:           detail?.bathrooms  ?? undefined,
        area_m2:             detail?.area       ?? undefined,
        lat:                 detail?.lat        ?? undefined,
        lng:                 detail?.lng        ?? undefined,
        source_portal:       'habitaclia.com',
        source_url:          item.url,
        source_external_id:  externalId,
        is_particular:       confirmedParticular,
        images:              images,
        external_link:       item.url,
        phone:               detailHtml ? (extractPhone(detailHtml) ?? undefined) : undefined,
        advertiser_name:     detail?.advertiserName ?? undefined,
      }

      const ok = await upsertListing(listing)
      if (ok) {
        if (confirmedParticular) {
          imported++
          console.log(
            `    ✅ [${imported}] 🏠 PARTICULAR: ${title.slice(0, 50)} | ${price.toLocaleString('es-ES')}€ | ${detail?.area ?? '?'}m²`,
          )
        } else {
          rejected++
          console.log(
            `    🏢 [AGENCIA] guardada: ${title.slice(0, 50)} | ${price.toLocaleString('es-ES')}€`,
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
    await closeSession()
  }
}

main().catch(console.error)

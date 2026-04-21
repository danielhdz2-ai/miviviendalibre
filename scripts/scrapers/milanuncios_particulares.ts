/**
 * Scraper DEDICADO a particulares de Milanuncios
 * VERSIÃ“N 2 â€” Playwright + Stealth + window.__INITIAL_PROPS__
 *
 * Milanuncios usa Imperva bot detection que bloquea fetch() convencional.
 * La soluciÃ³n es Playwright (navegador real) con stealth plugin + extracciÃ³n
 * directa del JSON embebido en window.__INITIAL_PROPS__, que ya contiene
 * todos los datos de los anuncios sin necesidad de visitar pÃ¡ginas de detalle.
 *
 * Flujo por ciudad+operaciÃ³n:
 *   1. Se lanza UN Chromium con stealth (cold start solo una vez por run)
 *   2. Por cada pÃ¡gina: se abre un nuevo contexto, navega, extrae el JSON
 *      y cierra el contexto INMEDIATAMENTE (el browser sigue vivo)
 *   3. Los datos del JSON se parsean y upserten en Supabase (sin navegador)
 *   4. El navegador se cierra en el bloque finally al finalizar
 *
 * Uso:
 *   npx tsx scripts/scrapers/milanuncios_particulares.ts [op] [city] [maxPages]
 *   op: venta | alquiler   (defecto: alquiler)
 *   city: madrid | barcelona | valencia | sevilla | zaragoza | bilbao | malaga | granada ...
 *   maxPages: nÃºmero mÃ¡ximo de pÃ¡ginas  (defecto: 5)
 *
 * Ejemplo:
 *   npx tsx scripts/scrapers/milanuncios_particulares.ts alquiler madrid 5
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { upsertListing, type ScrapedListing } from './utils'

// Registrar el plugin stealth â€” oculta huellas de automatizaciÃ³n ante Imperva
chromium.use(StealthPlugin())

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Pausa entre pÃ¡ginas (ms) â€” esencial para no disparar rate limiting de Imperva */
const PAGE_DELAY_MS = 3500

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Ciudades soportadas  (slug = segmento de la URL de Milanuncios)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CITY_MAP: Record<string, { slug: string; city: string; province: string }> = {
  madrid:    { slug: 'madrid',    city: 'Madrid',    province: 'Madrid'    },
  barcelona: { slug: 'barcelona', city: 'Barcelona', province: 'Barcelona' },
  valencia:  { slug: 'valencia',  city: 'Valencia',  province: 'Valencia'  },
  sevilla:   { slug: 'sevilla',   city: 'Sevilla',   province: 'Sevilla'   },
  zaragoza:  { slug: 'zaragoza',  city: 'Zaragoza',  province: 'Zaragoza'  },
  bilbao:    { slug: 'bilbao',    city: 'Bilbao',    province: 'Vizcaya'   },
  malaga:    { slug: 'malaga',    city: 'MÃ¡laga',    province: 'MÃ¡laga'    },
  granada:   { slug: 'granada',   city: 'Granada',   province: 'Granada'   },
  murcia:    { slug: 'murcia',    city: 'Murcia',    province: 'Murcia'    },
  alicante:  { slug: 'alicante',  city: 'Alicante',  province: 'Alicante'  },
  valladolid:{ slug: 'valladolid',city: 'Valladolid',province: 'Valladolid'},
  pamplona:  { slug: 'pamplona',  city: 'Pamplona',  province: 'Navarra'   },
  santander: { slug: 'santander', city: 'Santander', province: 'Cantabria' },
  cordoba:   { slug: 'cordoba',   city: 'CÃ³rdoba',   province: 'CÃ³rdoba'   },
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// URL de la pÃ¡gina de bÃºsqueda de particulares
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildSearchUrl(operation: 'alquiler' | 'venta', citySlug: string, page: number): string {
  const suffix =
    operation === 'venta'
      ? 'pisos-en-venta-particulares'
      : 'pisos-en-alquiler-particulares'
  const base = `https://www.milanuncios.com/${operation}-de-pisos-en-${citySlug}/${suffix}.htm`
  return page === 1 ? base : `${base}?pagina=${page}`
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Extrae el external_id numÃ©rico desde la URL del anuncio
// Ejemplo: /alquiler-de-pisos-en-madrid-madrid/chamberi-589687822.htm â†’ "589687822"
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function extractExternalId(url: string): string {
  const m = url.match(/-(\d{7,12})\.htm/)
  return m ? m[1] : url.replace(/\W/g, '').slice(-15)
}
// ───────────────────────────────────────────────────────────────────────────
// Filtro de anuncios de DEMANDA (compradores buscando inmueble)
// Milanuncios mezcla oferta y demanda; solo queremos vendedores/arrendadores.
// ───────────────────────────────────────────────────────────────────────────
const DEMAND_PATTERNS = [
  /^\s*(?:compro|compramos|busco|buscamos|necesito|necesitamos|quiero\s+comprar|quiero\s+alquilar|buscando|interesado\s+en\s+comprar|interesado\s+en\s+alquilar)\b/i,
  /\bpagamos?\s+al\s+contado\b/i,
  /\bse\s+busca\s+(?:piso|casa|local|inmueble|vivienda)\b/i,
  /\bcompro\s+(?:piso|casa|local|inmueble|vivienda|finca|chalet|apartamento)\b/i,
  /\bbusco\s+(?:piso|casa|local|inmueble|vivienda|finca|chalet|apartamento)\b/i,
  /\bcompro\s+inmueble\b/i,
  /\bcompro\s+vivienda\b/i,
  /\bbusco\s+para\s+(?:comprar|alquilar)\b/i,
  /\bquiero\s+(?:comprar|alquilar)\b/i,
]

// Listados de "activo ocupado" / inversión con inquilino — no son viviendas normales
const INVESTMENT_PATTERNS = [
  /activo\s*o[ck]up/i,
  /\binmueble\s+ocup/i,
  /\bpiso\s+ocup/i,
  /\bcasa\s+ocup/i,
  /\brentabilidad\s+\d/i,
  /\binversi[oó]n\s+con\s+(?:inquilino|renta)/i,
  /\bcon\s+inquilino\s+dentro\b/i,
  /\brenta\s+garantizada\b/i,
  /sareb|banco\s+malo/i,
]

/**
 * Devuelve true si el anuncio es de DEMANDA (alguien buscando comprar/alquilar).
 * Se evalúa el título y los primeros 200 caracteres de la descripción.
 */
function isDemandListing(title: string, description?: string | null): boolean {
  if (DEMAND_PATTERNS.some(re => re.test(title))) return true
  if (description && DEMAND_PATTERNS.some(re => re.test(description.slice(0, 200)))) return true
  return false
}
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tipos del JSON window.__INITIAL_PROPS__ (estructura de la API de Milanuncios)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface MilaTag { type: string; text: string }

interface MilaAd {
  id?: number
  url?: string
  title?: string
  description?: string
  sellerType?: string   // 'private' | 'professional'
  price?: { cashPrice?: { value?: number } }
  images?: string[]     // paths CDN sin scheme: "images.milanuncios.com/api/..."
  tags?: MilaTag[]      // [{type:'dormitorios',text:'2'}, {type:'baÃ±os',text:'1'}, ...]
  location?: {
    city?:     { name?: string }
    province?: { name?: string }
  }
}

interface MilaProps {
  adListPagination?: {
    adList?:     { ads?: MilaAd[] }
    pagination?: { page?: number; totalPages?: number; totalAds?: number }
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Navega una pÃ¡gina de resultados con Playwright y extrae window.__INITIAL_PROPS__
//
// â€¢ Bloquea imÃ¡genes, CSS, fuentes y trackers para reducir tiempo de carga.
// â€¢ Ejecuta un mouse.move() aleatorio como seÃ±al humana ante Imperva.
// â€¢ Lanza Error('BLOQUEO_IMPERVA') si detecta la pantalla de bloqueo.
// â€¢ Cierra el contexto del navegador inmediatamente tras extraer el JSON.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchInitialProps(
  browser: import('playwright').Browser,
  url: string,
): Promise<MilaProps | null> {
  const context = await browser.newContext({
    userAgent:         UA,
    locale:            'es-ES',
    viewport:          { width: 1366, height: 768 },
    javaScriptEnabled: true,
  })

  // Bloquear recursos que no aportan datos (ahorro de ancho de banda y tiempo)
  await context.route('**/*', (route) => {
    const type = route.request().resourceType()
    if (['image', 'media', 'font', 'stylesheet'].includes(type)) return route.abort()
    const reqUrl = route.request().url()
    const TRACKER_PATTERNS = [
      'googletagmanager', 'google-analytics', 'doubleclick', 'googlesyndication',
      'facebook.net', 'criteo', 'scorecardresearch', 'omtrdc',
      'taboola', 'outbrain', 'pubads.g.doubleclick',
    ]
    if (TRACKER_PATTERNS.some((t) => reqUrl.includes(t))) return route.abort()
    return route.continue()
  })

  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    // â”€â”€ DetecciÃ³n de Imperva â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const pageTitle = await page.title()
    if (pageTitle.includes('Pardon Our Interruption')) throw new Error('BLOQUEO_IMPERVA')

    const hasBlockPage = await page.evaluate(
      () => document.documentElement.innerHTML.includes('showBlockPage'),
    )
    if (hasBlockPage) throw new Error('BLOQUEO_IMPERVA')

    // â”€â”€ Movimiento de ratÃ³n aleatorio (seÃ±al humana ante Imperva) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const vp = page.viewportSize() ?? { width: 1366, height: 768 }
    await page.mouse.move(
      Math.floor(Math.random() * vp.width  * 0.5 + vp.width  * 0.25),
      Math.floor(Math.random() * vp.height * 0.5 + vp.height * 0.25),
      { steps: 8 },
    )

    // â”€â”€ Extraer window.__INITIAL_PROPS__ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Estrategia 1: leer el objeto JS ya resuelto por el motor del navegador.
    // Es mÃ¡s fiable que parsear el string crudo del <script> porque el motor
    // ya ha resuelto los escapes y la estructura del objeto.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props: MilaProps | null = await page.evaluate((): any => {
      // @ts-ignore â€” variable global inyectada por el servidor de Milanuncios
      return typeof window.__INITIAL_PROPS__ !== 'undefined' ? window.__INITIAL_PROPS__ : null
    })
    if (props) return props

    // Estrategia 2 (fallback): parsear el contenido crudo del tag <script>
    const rawJson = await page.evaluate((): string | null => {
      for (const script of Array.from(document.querySelectorAll('script'))) {
        const text = script.textContent ?? ''
        if (!text.includes('__INITIAL_PROPS__')) continue
        const m = text.match(/window\.__INITIAL_PROPS__\s*=\s*JSON\.parse\("(.+?)"\);/)
        if (m) return m[1]
      }
      return null
    })
    if (!rawJson) {
      console.warn(`  âš ï¸ No se encontrÃ³ __INITIAL_PROPS__ en: ${url}`)
      return null
    }
    return JSON.parse(rawJson.replace(/\\"/g, '"').replace(/\\\\/g, '\\')) as MilaProps
  } finally {
    // Cerrar el contexto inmediatamente tras obtener el JSON
    // El browser sigue vivo para la siguiente pÃ¡gina â€” no hay cold start repetido
    await context.close()
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Parsea un anuncio del JSON â†’ ScrapedListing
// Toda la informaciÃ³n se extrae del JSON del listado (sin visitar la pÃ¡gina de detalle)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function parseAdFromJson(
  ad: MilaAd,
  operation: 'sale' | 'rent',
  defaultCity: string,
  defaultProvince: string,
): ScrapedListing | null {
  if (!ad.url) return null

  // Filtrar anuncios de demanda (compradores buscando inmueble)
  if (isDemandListing(ad.title ?? '', ad.description)) return null

  // Filtrar "activo ocupado" e inversiones con inquilino
  const titleDesc = `${ad.title ?? ''} ${(ad.description ?? '').slice(0, 300)}`
  if (INVESTMENT_PATTERNS.some(re => re.test(titleDesc))) return null

  const price = ad.price?.cashPrice?.value ?? null
  if (!price || price <= 0) return null

  // ImÃ¡genes: los paths del JSON carecen de scheme â†’ aÃ±adir https://
  // Forzar formato JPEG (?rule=detail_640x480) — Supabase Storage no soporta AVIF
  const images = (ad.images ?? [])
    .map((img) => {
      const full = img.startsWith('http') ? img : `https://${img}`
      // Reemplazar o añadir rule=detail_640x480 que fuerza JPEG en el CDN de Milanuncios
      if (full.includes('milanuncios.com')) {
        const base = full.split('?')[0]
        return `${base}?rule=detail_640x480`
      }
      return full
    })
    .filter(Boolean)
  if (images.length === 0) return null

  // Tags â†’ dormitorios / baÃ±os / metros cuadrados
  const tags    = ad.tags ?? []
  const tagVal  = (type: string): string | null => tags.find((t) => t.type === type)?.text ?? null
  const bedrooms  = tagVal('dormitorios')      ? (parseInt(tagVal('dormitorios')!,       10) || null) : null
  const bathrooms = tagVal('baÃ±os')            ? (parseInt(tagVal('baÃ±os')!,             10) || null) : null
  const areaRaw   = tagVal('metros cuadrados')
  const area      = areaRaw ? (parseInt(areaRaw.replace(/[^\d]/g, ''), 10) || null) : null

  // Ciudad y provincia del JSON â€” mÃ¡s precisas que los parÃ¡metros del scraper
  const city     = ad.location?.city?.name     ?? defaultCity
  const province = ad.location?.province?.name ?? defaultProvince

  // Barrio/distrito desde el slug de la URL del anuncio
  // /alquiler-de-pisos-en-madrid-madrid/chamberi-calle-lafuente-589687822.htm
  const urlPath  = ad.url.startsWith('/') ? ad.url : new URL(ad.url).pathname
  const distM    = urlPath.match(/\/([^/]+)-\d{7,12}\.htm$/)
  const district = distM
    ? distM[1].split('-').slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : null

  const externalId = extractExternalId(ad.url)
  const detailUrl  = ad.url.startsWith('http')
    ? ad.url
    : `https://www.milanuncios.com${ad.url}`

  return {
    title:              ad.title ?? `Piso en ${city}`,
    description:        ad.description ? ad.description.slice(0, 3000) : undefined,
    price_eur:          price,
    operation,
    province,
    city,
    district:           district  ?? undefined,
    bedrooms:           bedrooms  ?? undefined,
    bathrooms:          bathrooms ?? undefined,
    area_m2:            area      ?? undefined,
    images,
    source_portal:      'milanuncios.com',
    source_url:         detailUrl,
    source_external_id: `mil_${externalId}`,
    is_particular:      ad.sellerType === 'private',
    external_link:      detailUrl,
    // upload_to_storage eliminado: política global = external_url → img-proxy
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Scraper principal
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function scrapeParticulares(
  operation: 'venta' | 'alquiler',
  citySlug: string,
  maxPages: number,
  maxImport = Infinity,
): Promise<void> {
  const geoInfo = CITY_MAP[citySlug]
  if (!geoInfo) {
    console.error(`âŒ Ciudad no soportada: ${citySlug}`)
    console.error(`   Ciudades disponibles: ${Object.keys(CITY_MAP).join(', ')}`)
    process.exit(1)
  }

  const opLabel = operation === 'venta' ? 'sale' : 'rent'
  console.log(`\nðŸ  milanuncios PARTICULARES v2 [Playwright+Stealth] â€” ${operation}/${citySlug} (hasta ${maxPages} pÃ¡g.)`)
  console.log('â”€'.repeat(70))

  let imported  = 0
  let rejected  = 0
  let skipped   = 0
  let discarded = 0

  // Un Ãºnico browser para toda la ejecuciÃ³n â€” cold start de Chromium solo una vez
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1366,768',
    ],
  })

  try {
    for (let page = 1; page <= maxPages; page++) {
      const searchUrl = buildSearchUrl(operation, geoInfo.slug, page)
      console.log(`\n  ðŸ“„ PÃ¡gina ${page}: ${searchUrl}`)

      let props: MilaProps | null = null
      try {
        props = await fetchInitialProps(browser, searchUrl)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'BLOQUEO_IMPERVA') {
          console.error(`  ðŸš« BLOQUEO_IMPERVA â€” Imperva ha detectado el robot en pÃ¡gina ${page}. Abortando ciudad.`)
          break
        }
        console.warn(`  âš ï¸ Error en pÃ¡gina ${page}: ${msg}`)
        break
      }

      if (!props) {
        console.warn(`  âš ï¸ Sin datos en pÃ¡gina ${page}, deteniendo`)
        break
      }

      // El contexto del navegador ya fue liberado dentro de fetchInitialProps
      const pagination   = props.adListPagination?.pagination
      const allAds       = props.adListPagination?.adList?.ads ?? []

      const nPrivate = allAds.filter((a) => a.sellerType === 'private').length
      console.log(
        `  🔗 ${allAds.length} anuncios totales → ${nPrivate} particulares` +
        ` (pág. ${pagination?.page ?? page}/${pagination?.totalPages ?? '?'}, total: ${pagination?.totalAds ?? '?'})`,
      )

      if (allAds.length === 0) {
        console.log('  âš ï¸ PÃ¡gina vacÃ­a, deteniendo')
        break
      }

      for (const ad of allAds) {
        const listing = parseAdFromJson(ad, opLabel as 'sale' | 'rent', geoInfo.city, geoInfo.province)
        if (!listing) {
          discarded++
          console.log(`  âš ï¸ [DESCARTADO sin precio/fotos] ${ad.url ?? '(sin url)'}`)
          continue
        }
        const result = await upsertListing(listing)
        if (result) {
          if (listing.is_particular) {
            imported++
            console.log(
              `  ✓ [${listing.price_eur}€ ${listing.area_m2 ?? '?'}m²` +
              ` ${listing.images?.length ?? 0}📷 ${listing.bedrooms ?? '?'}hab]` +
              ` ${listing.title} – ${(ad.url ?? '').split('/').slice(-1)[0]}`,
            )
            if (imported >= maxImport) {
              console.log(`\n  ⏹️  Límite de importación alcanzado (${maxImport}). Parando.`)
              return
            }
          } else {
            rejected++
            console.log(
              `  🏢 [AGENCIA] ${listing.title.slice(0, 50)} | ${listing.price_eur}€ | guardada is_particular=false`,
            )
          }
        } else {
          skipped++
        }
      }

      if (page >= (pagination?.totalPages ?? maxPages)) break
      await sleep(PAGE_DELAY_MS)
    }
  } finally {
    await browser.close()
    console.log('\n  ðŸ”’ Navegador cerrado')
  }

  console.log('\n' + 'â”€'.repeat(70))
  console.log(`  ✅ Importados: ${imported}  |  🏢 Agencias: ${rejected}  |  Omitidos: ${skipped}  |  Descartados: ${discarded}`)
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Punto de entrada
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function main() {
  const args      = process.argv.slice(2)
  const operation = (args[0] === 'venta' ? 'venta' : 'alquiler') as 'venta' | 'alquiler'
  const citySlug  = args[1] ?? 'madrid'
  const maxPages  = parseInt(args[2] ?? '5', 10)
  const maxImport = args[3] ? parseInt(args[3], 10) : Infinity

  await scrapeParticulares(operation, citySlug, maxPages, maxImport)
}

main().catch(console.error)

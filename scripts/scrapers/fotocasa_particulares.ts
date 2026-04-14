/**
 * 🏠 Scraper de PARTICULARES en Fotocasa
 *
 * Fotocasa filtra anunciantes particulares con el parámetro commercial=0.
 * La página es Next.js → se extrae window.__NEXT_DATA__ con Playwright + Stealth.
 *
 * MURO DE CONTENCIÓN: solo se acepta un anuncio como particular si el campo
 * advertiser.commercialTypeId !== 2 (profesional/agencia). Cualquier duda = false.
 *
 * Uso:
 *   npx tsx scripts/scrapers/fotocasa_particulares.ts [op] [city] [maxPages]
 *   op: venta | alquiler   (defecto: venta)
 *   city: madrid | barcelona | valencia | sevilla | zaragoza | malaga | bilbao | alicante ...
 *   maxPages: máximo de páginas  (defecto: 5)
 *
 * Ejemplo:
 *   npx tsx scripts/scrapers/fotocasa_particulares.ts venta madrid 3
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { upsertListing, type ScrapedListing } from './utils'

chromium.use(StealthPlugin())

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const PAGE_DELAY_MS = 3500

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── Ciudades soportadas ───────────────────────────────────────────────────
// slug = fragmento que fotocasa usa en la URL (zona geográfica)
const CITY_MAP: Record<string, { slug: string; city: string; province: string }> = {
  madrid:     { slug: 'madrid-capital',    city: 'Madrid',     province: 'Madrid'    },
  barcelona:  { slug: 'barcelona-capital', city: 'Barcelona',  province: 'Barcelona' },
  valencia:   { slug: 'valencia-capital',  city: 'Valencia',   province: 'Valencia'  },
  sevilla:    { slug: 'sevilla',           city: 'Sevilla',    province: 'Sevilla'   },
  zaragoza:   { slug: 'zaragoza',          city: 'Zaragoza',   province: 'Zaragoza'  },
  malaga:     { slug: 'malaga',            city: 'Málaga',     province: 'Málaga'    },
  bilbao:     { slug: 'bilbao',            city: 'Bilbao',     province: 'Vizcaya'   },
  alicante:   { slug: 'alicante-alacant',  city: 'Alicante',   province: 'Alicante'  },
  murcia:     { slug: 'murcia',            city: 'Murcia',     province: 'Murcia'    },
  granada:    { slug: 'granada',           city: 'Granada',    province: 'Granada'   },
  valladolid: { slug: 'valladolid',        city: 'Valladolid', province: 'Valladolid'},
  cordoba:    { slug: 'cordoba',           city: 'Córdoba',    province: 'Córdoba'   },
  santander:  { slug: 'santander',         city: 'Santander',  province: 'Cantabria' },
}

// ─── URL de búsqueda ──────────────────────────────────────────────────────
// commercial=0 → solo anunciantes particulares (no profesionales)
function buildSearchUrl(
  operation: 'venta' | 'alquiler',
  citySlug: string,
  page: number,
): string {
  const segment = operation === 'venta' ? 'comprar' : 'alquiler'
  const base = `https://www.fotocasa.es/es/${segment}/viviendas/${citySlug}/todas-las-zonas/l?commercial=0`
  return page === 1 ? base : `${base}&page=${page}`
}

// ─── Tipos del JSON __NEXT_DATA__ de Fotocasa ─────────────────────────────
interface FotoImage {
  url?: string
}

interface FotoAddress {
  location?:     { latitude?: number; longitude?: number }
  municipality?: string
  province?:     string
  postalCode?:   string
  sublevel1?:    string  // barrio/distrito
}

interface FotoFeatures {
  rooms?:             number
  bathsNumber?:       number
  constructedArea?:   number
  floor?:             string | number
}

interface FotoAdvertiser {
  name?:               string
  commercialName?:     string
  commercialTypeId?:   number  // 1 = particular, 2 = profesional/agencia
}

interface FotoPriceInfo {
  amount?:       number
}

interface FotoMultimedia {
  images?: FotoImage[]
}

interface FotoRealEstate {
  id?:             number | string
  address?:        FotoAddress
  priceInfo?:      FotoPriceInfo
  features?:       FotoFeatures
  multimedia?:     FotoMultimedia
  description?:    Record<string, string>  // { 'es_ES': '...' }
  advertiser?:     FotoAdvertiser
  portal?:         { regularUrl?: string }  // URL del detalle
  detail?:         string                   // some versions embed URL here
}

// ─── Extraer __NEXT_DATA__ de la página ───────────────────────────────────
async function fetchNextData(
  browser: import('playwright').Browser,
  url: string,
): Promise<FotoRealEstate[] | null> {
  const context = await browser.newContext({
    userAgent:         UA,
    locale:            'es-ES',
    viewport:          { width: 1366, height: 768 },
    javaScriptEnabled: true,
  })

  // Bloquear imágenes, CSS, fuentes y trackers → menor carga
  await context.route('**/*', (route) => {
    const type = route.request().resourceType()
    if (['image', 'media', 'font', 'stylesheet'].includes(type)) return route.abort()
    const reqUrl = route.request().url()
    const BLOCK = [
      'googletagmanager', 'google-analytics', 'doubleclick', 'googlesyndication',
      'facebook.net', 'criteo', 'scorecardresearch', 'omtrdc',
      'taboola', 'outbrain', 'rubicon', 'quantserve',
    ]
    if (BLOCK.some((t) => reqUrl.includes(t))) return route.abort()
    return route.continue()
  })

  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35_000 })

    // ── Detección de bloqueo ─────────────────────────────────────────────
    const pageTitle = await page.title()
    if (
      pageTitle.includes('Pardon Our Interruption') ||
      pageTitle.includes('Access Denied') ||
      pageTitle.includes('robot')
    ) {
      throw new Error('BLOQUEO_BOT')
    }

    // ── Movimiento de ratón (señal humana) ───────────────────────────────
    const vp = page.viewportSize() ?? { width: 1366, height: 768 }
    await page.mouse.move(
      Math.floor(Math.random() * vp.width  * 0.5 + vp.width  * 0.25),
      Math.floor(Math.random() * vp.height * 0.5 + vp.height * 0.25),
      { steps: 10 },
    )

    // ── Extraer __NEXT_DATA__ del DOM ────────────────────────────────────
    // Estrategia 1: leer window.__NEXT_DATA__ directamente del motor JS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextData: any = await page.evaluate(() => {
      // @ts-ignore
      if (typeof window.__NEXT_DATA__ !== 'undefined') return window.__NEXT_DATA__
      const el = document.getElementById('__NEXT_DATA__')
      if (el?.textContent) {
        try { return JSON.parse(el.textContent) } catch { return null }
      }
      return null
    })

    if (!nextData) {
      console.warn(`  ⚠️ No se encontró __NEXT_DATA__ en: ${url}`)
      return null
    }

    // ── Navegar el árbol JSON para encontrar los listings ────────────────
    // Fotocasa puede tener la estructura en diferentes rutas según la versión.
    // Intentamos todas las rutas conocidas.
    const tryPaths = [
      // Ruta moderna (Next.js con initialState)
      () => nextData?.props?.pageProps?.initialState?.realEstate?.search?.result?.realEstates,
      // Ruta alternativa con initialProps
      () => nextData?.props?.pageProps?.initialProps?.result?.realEstates,
      () => nextData?.props?.pageProps?.initialProps?.realEstates,
      // Ruta legacy
      () => nextData?.props?.pageProps?.data?.realEstates,
    ]

    for (const tryPath of tryPaths) {
      const result = tryPath()
      if (Array.isArray(result) && result.length > 0) {
        return result as FotoRealEstate[]
      }
    }

    // Estrategia 2 (fallback): parsear el tag <script id="__NEXT_DATA__"> como texto
    const rawJson = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__')
      return el?.textContent ?? null
    })
    if (rawJson) {
      try {
        const parsed = JSON.parse(rawJson) as { props?: object }
        const tryPaths2 = [
          () => (parsed as any)?.props?.pageProps?.initialState?.realEstate?.search?.result?.realEstates,
          () => (parsed as any)?.props?.pageProps?.initialProps?.result?.realEstates,
        ]
        for (const tryPath of tryPaths2) {
          const result = tryPath()
          if (Array.isArray(result) && result.length > 0) return result as FotoRealEstate[]
        }
      } catch {
        //
      }
    }

    console.warn(`  ⚠️ Árbol __NEXT_DATA__ no tiene ruta de realEstates en: ${url}`)
    return null
  } finally {
    await context.close()
  }
}

// ─── Verificar si el anunciante es un particular ──────────────────────────
// MURO DE CONTENCIÓN: si no se puede confirmar positivamente → rechazar
function isParticularAdvertiser(advertiser: FotoAdvertiser | undefined): boolean {
  if (!advertiser) return false

  // commercialTypeId: 1 = particular, 2 = profesional/agencia
  // Si el campo existe y es 1 → particular confirmado
  if (typeof advertiser.commercialTypeId === 'number') {
    return advertiser.commercialTypeId === 1
  }

  // Señales corporativas en el nombre → rechazar
  const name = (advertiser.name ?? advertiser.commercialName ?? '').trim()
  if (!name) return false

  // Nombre todo en mayúsculas (TUKSA, JLL, CBRE…) → agencia
  if (/^[A-ZÁÉÍÓÚÜÑ\s·&-]{4,}$/.test(name) && !/[a-záéíóúüñ]/.test(name)) return false

  // Sufijos societarios → agencia
  if (/\bS\.?\s*L\.?\b|\bS\.?\s*A\.?\b|\bS\.?\s*L\.?\s*U\.?\b/i.test(name)) return false

  // Palabras de agencia en el nombre → rechazar
  if (/inmobiliaria|asesores|gestión|gestion|propiedades|consultores|inversiones|grupo|agencia/i.test(name)) return false

  // Sin campo confirmatorio → duda → false (muro de contención)
  return false
}

// ─── Construir ScrapedListing desde un elemento del JSON ──────────────────
function parseRealEstate(
  re: FotoRealEstate,
  operation: 'sale' | 'rent',
  defaultCity: string,
  defaultProvince: string,
): ScrapedListing | null {
  if (!re.id) return null

  const price = re.priceInfo?.amount ?? null
  if (!price || price <= 0) return null

  // Imágenes
  const images = (re.multimedia?.images ?? [])
    .map((img) => img.url)
    .filter((u): u is string => !!u && u.startsWith('http'))
    .slice(0, 15)
  if (images.length === 0) return null

  // Datos geográficos
  const lat  = re.address?.location?.latitude  ?? null
  const lng  = re.address?.location?.longitude ?? null
  const city     = re.address?.municipality ?? defaultCity
  const province = re.address?.province     ?? defaultProvince
  const district = re.address?.sublevel1    ?? undefined
  const postalCode = re.address?.postalCode  ?? undefined

  // Características
  const bedrooms  = re.features?.rooms            ?? null
  const bathrooms = re.features?.bathsNumber      ?? null
  const area      = re.features?.constructedArea  ?? null
  const floorRaw  = re.features?.floor

  // Descripción (fotocasa lo guarda por idioma)
  const description = re.description?.['es_ES'] ?? re.description?.['ca_ES'] ?? null

  // URL del detalle
  const detailUrl =
    re.portal?.regularUrl ??
    re.detail ??
    `https://www.fotocasa.es/es/${operation === 'sale' ? 'comprar' : 'alquiler'}/vivienda/${String(re.id)}`
  const fullDetailUrl = detailUrl.startsWith('http')
    ? detailUrl
    : `https://www.fotocasa.es${detailUrl}`

  // Nombre del anunciante
  const advertiserName = re.advertiser?.name ?? re.advertiser?.commercialName ?? undefined

  // Título: fotocasa no siempre incluye título en el JSON del listado
  // Construimos uno descriptivo a partir de los datos disponibles
  const bedroomsText = bedrooms ? `${bedrooms} hab.` : ''
  const areaText     = area     ? `${area} m²`       : ''
  const parts = [bedroomsText, areaText].filter(Boolean).join(' · ')
  const title = parts
    ? `Piso en ${operation === 'sale' ? 'venta' : 'alquiler'} – ${parts} – ${city}`
    : `Piso en ${operation === 'sale' ? 'venta' : 'alquiler'} – ${city}`

  const externalId = `fc_${re.id}`

  const listing: ScrapedListing = {
    title,
    description: description ?? undefined,
    price_eur: price,
    operation,
    province,
    city,
    district,
    postal_code: postalCode,
    bedrooms:   bedrooms  ?? undefined,
    bathrooms:  bathrooms ?? undefined,
    area_m2:    area      ?? undefined,
    lat:        lat       ?? undefined,
    lng:        lng       ?? undefined,
    source_portal:       'fotocasa',
    source_url:          fullDetailUrl,
    source_external_id:  externalId,
    is_particular:       true,
    advertiser_name:     advertiserName,
    images,
    external_link:       fullDetailUrl,
    // phone: fotocasa oculta el teléfono tras login — no disponible sin autenticación
  }

  // Añadir planta si está disponible
  if (floorRaw !== undefined && floorRaw !== null) {
    ;(listing as ScrapedListing & { floor?: string }).floor = String(floorRaw)
  }

  return listing
}

// ─── Función principal de scraping ───────────────────────────────────────
async function scrapeFotocasaParticulares(
  operation: 'venta' | 'alquiler',
  cityKey: string,
  maxPages: number,
): Promise<void> {
  const geo = CITY_MAP[cityKey]
  if (!geo) {
    console.error(`❌ Ciudad no soportada: "${cityKey}". Disponibles: ${Object.keys(CITY_MAP).join(', ')}`)
    return
  }

  const opLabel = operation === 'venta' ? 'sale' : 'rent'
  console.log(`\n🏠 FOTOCASA PARTICULARES — ${operation}/${cityKey} (máx. ${maxPages} páginas)`)
  console.log(`   Filtro activo: commercial=0 (solo particulares)\n`)

  const browser = await chromium.launch({ headless: true })

  let imported  = 0
  let rejected  = 0
  let skipped   = 0

  try {
    for (let page = 1; page <= maxPages; page++) {
      const url = buildSearchUrl(operation, geo.slug, page)
      console.log(`  📄 Página ${page}: ${url}`)

      let listings: FotoRealEstate[] | null = null
      try {
        listings = await fetchNextData(browser, url)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('BLOQUEO_BOT')) {
          console.log(`  🛑 Bloqueo de bot detectado en página ${page}, parando`)
          break
        }
        console.warn(`  ⚠️ Error en página ${page}: ${msg}`)
        break
      }

      if (!listings || listings.length === 0) {
        console.log(`  ✅ Sin más anuncios en página ${page}, parando`)
        break
      }

      console.log(`  → ${listings.length} anuncios encontrados`)

      for (const re of listings) {
        // ── MURO DE CONTENCIÓN ──────────────────────────────────────────
        if (!isParticularAdvertiser(re.advertiser)) {
          rejected++
          const name = re.advertiser?.name ?? 'sin nombre'
          console.log(`    ⛔ Rechazado (no particular): ${name} (commercialTypeId=${re.advertiser?.commercialTypeId ?? '?'})`)
          continue
        }

        const item = parseRealEstate(re, opLabel as 'sale' | 'rent', geo.city, geo.province)
        if (!item) { skipped++; continue }

        const ok = await upsertListing(item)
        if (ok) {
          imported++
          console.log(
            `    ✅ [${imported}] 🏠 ${item.title.slice(0, 55)} | ${item.price_eur?.toLocaleString('es-ES')}€`,
          )
        } else {
          skipped++
        }

        await sleep(400)  // pausa ligera entre upserts (no entre páginas)
      }

      if (page < maxPages) {
        console.log(`  ⏳ Esperando ${PAGE_DELAY_MS / 1000}s antes de la siguiente página…`)
        await sleep(PAGE_DELAY_MS)
      }
    }
  } finally {
    await browser.close()
  }

  console.log(`\n📊 FOTOCASA PARTICULARES — ${operation}/${cityKey}:`)
  console.log(`   ✅ ${imported} importados`)
  console.log(`   ⛔ ${rejected} rechazados (no eran particulares)`)
  console.log(`   ⚠️ ${skipped} omitidos (datos incompletos o error)`)
}

// ─── CLI ──────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const operation = (args[0] as 'venta' | 'alquiler') || 'venta'
  const city      = args[1] || 'madrid'
  const maxPages  = parseInt(args[2] || '5', 10)
  await scrapeFotocasaParticulares(operation, city, maxPages)
}

main().catch(console.error)

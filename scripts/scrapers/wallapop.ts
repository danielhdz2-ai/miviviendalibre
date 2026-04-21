/**
 * Scraper Wallapop Inmobiliaria — Solo Particulares
 *
 * Wallapop usa React SPA en los listados (se necesita Playwright para paginar)
 * pero las páginas de DETALLE son SSR → fetch simple.
 *
 * El flujo es:
 *   1. Playwright abre la página de listado de Wallapop filtrando particulares
 *   2. Extrae todos los href de anuncios visibles
 *   3. Cierra Playwright
 *   4. Para cada URL de detalle: fetch → parsea JSON-LD + HTML → extrae datos
 *   5. Upsert en Supabase
 *
 * IMPORTANTE: Wallapop NO tiene teléfonos públicos. Su contacto es por chat interno.
 * Guardamos external_link para que el usuario contacte directamente en Wallapop.
 *
 * Uso:
 *   npx tsx scripts/scrapers/wallapop.ts [operation] [city] [maxPages]
 *   operation: venta | alquiler  (default: alquiler)
 *   city: madrid | barcelona | valencia | sevilla | zaragoza | malaga | bilbao (default: barcelona)
 *   maxPages: número de páginas a scrapear (default: 5, cada página ≈ 20-40 items)
 *
 * Ejemplos:
 *   npx tsx scripts/scrapers/wallapop.ts alquiler barcelona 10
 *   npx tsx scripts/scrapers/wallapop.ts venta madrid 8
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { upsertListing, type ScrapedListing, sleep } from './utils'

chromium.use(StealthPlugin())

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ── Ciudades soportadas ───────────────────────────────────────────────────────
const CITY_MAP: Record<string, {
  city: string
  province: string
  lat: number
  lng: number
  slug: string   // slug de Wallapop para la URL de categoría
}> = {
  madrid:    { city: 'Madrid',    province: 'Madrid',    lat: 40.4168, lng: -3.7038, slug: 'madrid'    },
  barcelona: { city: 'Barcelona', province: 'Barcelona', lat: 41.3879, lng:  2.1699, slug: 'barcelona' },
  valencia:  { city: 'Valencia',  province: 'Valencia',  lat: 39.4699, lng: -0.3763, slug: 'valencia'  },
  sevilla:   { city: 'Sevilla',   province: 'Sevilla',   lat: 37.3891, lng: -5.9845, slug: 'sevilla'   },
  zaragoza:  { city: 'Zaragoza',  province: 'Zaragoza',  lat: 41.6488, lng: -0.8891, slug: 'zaragoza'  },
  malaga:    { city: 'Málaga',    province: 'Málaga',    lat: 36.7202, lng: -4.4203, slug: 'malaga'    },
  bilbao:    { city: 'Bilbao',    province: 'Vizcaya',   lat: 43.2630, lng: -2.9350, slug: 'bilbao'    },
  granada:   { city: 'Granada',   province: 'Granada',   lat: 37.1773, lng: -3.5986, slug: 'granada'   },
  alicante:  { city: 'Alicante',  province: 'Alicante',  lat: 38.3452, lng: -0.4815, slug: 'alicante'  },
  murcia:    { city: 'Murcia',    province: 'Murcia',    lat: 37.9922, lng: -1.1307, slug: 'murcia'    },
}

const PAGE_DELAY_MS = 3000
const DETAIL_DELAY_MS = 1200

// ── URL de búsqueda de Wallapop ───────────────────────────────────────────────
// Wallapop filtra "Pro" / "Particular" con user_type=x
// category_ids=200 = Inmobiliaria
// Usamos la URL de tipo landing con slug ciudad para evitar SPA pura
function buildListUrl(operation: 'venta' | 'alquiler', slug: string): string {
  const opSlug = operation === 'alquiler' ? 'alquilar-piso' : 'piso'
  return `https://es.wallapop.com/inmobiliaria/${opSlug}/${slug}`
}

// ── Extrae listado de URLs de detalle via Playwright ─────────────────────────
async function scrapeListPage(
  page: import('playwright').Page,
  url: string,
  pageNum: number
): Promise<string[]> {
  const targetUrl = pageNum === 1 ? url : `${url}?page=${pageNum}`
  console.log(`  🌐 Navegando: ${targetUrl}`)

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // Esperar a que carguen los items (React hidratación)
    await page.waitForSelector('a[href*="/item/"]', { timeout: 15000 }).catch(() => {})
    await sleep(1500)

    // Extraer todos los href de items inmobiliarios
    const hrefs = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/item/"]')
      const urls = new Set<string>()
      links.forEach((a) => {
        const href = (a as HTMLAnchorElement).href
        if (href && href.includes('/item/') && !href.includes('loginSource')) {
          urls.add(href)
        }
      })
      return Array.from(urls)
    })

    // Filtrar solo urls de inmobiliaria (piso, casa, ático, etc.)
    const filtered = hrefs.filter((h) =>
      /\/(piso|casa|chalet|atico|apartamento|estudio|local|duplex|loft|vivienda)-/i.test(h) ||
      /\/item\/[a-z]+-en-(venta|alquiler|compra|arrendamiento)-/i.test(h) ||
      /\/item\/se-(vende|alquila|alquiler|venta)-/i.test(h) ||
      /\/item\/(alquil|vend|piso|casa|chalet|atico|apart|estudio)/i.test(h)
    )

    console.log(`  → ${filtered.length} anuncios inmobiliarios encontrados`)
    return [...new Set(filtered)]
  } catch (err) {
    console.warn(`  ⚠️ Error en página ${pageNum}: ${err}`)
    return []
  }
}

// ── Función auxiliar: limpia HTML entities ────────────────────────────────────
function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Scraping de página de detalle (SSR) ──────────────────────────────────────
interface WallapopDetail {
  title: string
  description?: string
  price?: number
  operation: 'sale' | 'rent'
  images: string[]
  bedrooms?: number
  bathrooms?: number
  area_m2?: number
  city?: string
  district?: string
  lat?: number
  lng?: number
  advertiser_name?: string
  is_particular: boolean
  external_id: string
}

async function fetchDetail(url: string): Promise<WallapopDetail | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        Referer: 'https://es.wallapop.com/',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      console.warn(`  ⚠️ HTTP ${res.status} para ${url}`)
      return null
    }
    const html = await res.text()

    // ── JSON-LD (fuente principal) ──────────────────────────────────────────
    let title = ''
    let description: string | undefined
    let price: number | undefined
    let operationRaw = 'sale'
    const jldImages: string[] = []
    let lat: number | undefined
    let lng: number | undefined
    let city: string | undefined
    let district: string | undefined

    for (const block of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const j = JSON.parse(block[1])
        if (j['@type'] === 'Product' || j.name) {
          if (j.name) title = decodeHtml(j.name)
          if (j.description) description = decodeHtml(j.description).slice(0, 2000)
          if (j.offers?.price) price = parseFloat(j.offers.price)
          if (j.image) {
            const imgs = Array.isArray(j.image) ? j.image : [j.image]
            imgs.forEach((img: unknown) => {
              if (typeof img === 'string') jldImages.push(img)
              else if (typeof img === 'object' && img !== null && 'url' in img) jldImages.push((img as { url: string }).url)
            })
          }
          if (j.address?.addressLocality) city = j.address.addressLocality
          if (j.address?.addressRegion) district = j.address.addressRegion
          if (j.geo?.latitude) lat = parseFloat(j.geo.latitude)
          if (j.geo?.longitude) lng = parseFloat(j.geo.longitude)
        }
      } catch { /* noop */ }
    }

    // ── Next.js __NEXT_DATA__ (más rico en datos) ───────────────────────────
    let bedrooms: number | undefined
    let bathrooms: number | undefined
    let area_m2: number | undefined
    let advertiser_name: string | undefined
    let is_particular = true
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1])
        // Los datos del item suelen estar en pageProps.itemDetail o pageProps.item
        const item =
          nextData?.props?.pageProps?.itemDetail ??
          nextData?.props?.pageProps?.item ??
          nextData?.props?.pageProps?.initialState?.itemDetail

        if (item) {
          // Título: en la API actual es item.title.original
          const rawTitle = item.title?.original ?? item.title?.text ?? item.name ?? (typeof item.title === 'string' ? item.title : '')
          if (!title && rawTitle) title = decodeHtml(rawTitle)
          // Descripción
          const rawDesc = item.description?.original ?? item.description?.text ?? (typeof item.description === 'string' ? item.description : '')
          if (!description && rawDesc) description = decodeHtml(rawDesc).slice(0, 2000)
          // Precio: estructura actual es item.price.cash.amount
          price = price ?? item.price?.cash?.amount ?? item.sale_price?.amount ?? item.price?.amount
          // Imágenes: solo la mejor calidad (W800), deduplicadas por ID de imagen
          if (item.images && Array.isArray(item.images)) {
            const seenIds = new Set<string>()
            for (const img of item.images) {
              const imgUrl = img.urls?.big ?? img.urls?.medium ?? img.urls?.small ?? img.large ?? img.medium ?? img.original ?? img.url
              if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                // Extraer ID único de la imagen (sin query string ni tamaño)
                const baseUrl = imgUrl.split('?')[0]
                if (!seenIds.has(baseUrl)) {
                  seenIds.add(baseUrl)
                  jldImages.push(imgUrl)
                }
              }
            }
          }
          // Características: realEstateInfo (estructura actual) o extra_info (legacy)
          const rei = item.realEstateInfo
          if (rei) {
            if (bedrooms === undefined && rei.rooms?.value !== undefined) bedrooms = parseInt(rei.rooms.value, 10) || undefined
            if (bathrooms === undefined && rei.bathrooms?.value !== undefined) bathrooms = parseInt(rei.bathrooms.value, 10) || undefined
            if (area_m2 === undefined && rei.surface?.value !== undefined) area_m2 = parseFloat(rei.surface.value) || undefined
            if (rei.operation?.value === 'rent') operationRaw = 'rent'
            else if (rei.operation?.value === 'sale') operationRaw = 'sale'
          } else {
            const extra = item.extra_info ?? item.attributes ?? []
            if (Array.isArray(extra)) {
              for (const attr of extra) {
                const key = (attr.attribute_key ?? attr.key ?? '').toLowerCase()
                const val = attr.attribute_value ?? attr.value
                if (key.includes('room') || key.includes('bedroom') || key.includes('habitaci')) bedrooms = parseInt(val, 10) || undefined
                if (key.includes('bath') || key.includes('baño')) bathrooms = parseInt(val, 10) || undefined
                if (key.includes('surface') || key.includes('area') || key.includes('m2') || key.includes('metros')) area_m2 = parseFloat(val) || undefined
                if (key.includes('rent') || key.includes('alquil')) operationRaw = 'rent'
                if (key.includes('sale') || key.includes('venta') || key.includes('compra')) operationRaw = 'sale'
              }
            }
          }
          // Anunciante: itemSeller está en pageProps, no en item
          const sellerData = nextData?.props?.pageProps?.itemSeller ?? item.user ?? item.seller ?? item.owner
          if (sellerData) {
            advertiser_name = sellerData.microName ?? sellerData.micro_name ?? sellerData.name ?? undefined
            // Pro: type es 'professional'/'agency', o badgeType/sellerType = 'pro'
            if (sellerData.type === 'professional' || sellerData.type === 'agency' ||
                sellerData.badgeType === 'pro' || sellerData.sellerType === 'pro' ||
                sellerData.pro_badge === true || sellerData.is_pro === true) {
              is_particular = false
            }
          }
          // Localización
          if (!lat && item.location?.latitude) lat = item.location.latitude
          if (!lng && item.location?.longitude) lng = item.location.longitude
          if (!city && item.location?.city) city = item.location.city
          if (!district && (item.location?.district ?? item.location?.postalCode)) district = item.location.district ?? item.location.postalCode
        }
      } catch { /* noop */ }
    }

    // ── Fallback: parsear HTML si JSON-LD/NEXT_DATA falló ───────────────────
    if (!title) {
      const h1 = html.match(/<h1[^>]*>([\s\S]{3,150}?)<\/h1>/)
      if (h1) title = decodeHtml(h1[1])
    }
    // Fallback descripción: meta description de la página
    if (!description) {
      const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,})["']/i)
                    ?? html.match(/<meta[^>]+content=["']([^"']{10,})["'][^>]+name=["']description["']/i)
      if (metaDesc) description = decodeHtml(metaDesc[1]).slice(0, 2000)
    }

    // Imágenes: usar solo las de __NEXT_DATA__ (ya deduplicadas por ID)
    // NO usar regex sobre HTML — captura URLs malformadas con ); o múltiples tamaños
    // Filtrar logos de portales competidores (yaencontre, idealista, etc.) que se suben como foto en Wallapop.
    // Los logos son cuadrados (ratio ~1:1). Se detectan leyendo las cabeceras Content-Length
    // y las dimensiones del JPEG via los primeros bytes (SOF marker).
    const cdnImgsRaw = jldImages
      .filter(u => u.startsWith('http') && !u.includes('logo') && !u.includes('placeholder') && u.length > 40)
      .slice(0, 20)

    // Verificar dimensiones via fetch parcial (primeros 4KB del JPEG bastan para leer SOF0)
    const cdnImgs: string[] = []
    for (const imgUrl of cdnImgsRaw) {
      try {
        const res = await fetch(imgUrl, {
          headers: { Range: 'bytes=0-4096', Referer: 'https://es.wallapop.com/', 'User-Agent': UA },
          signal: AbortSignal.timeout(5000),
        })
        const buf = Buffer.from(await res.arrayBuffer())
        // Buscar marker SOF0 (0xFFC0) o SOF2 (0xFFC2) en el buffer para leer W/H
        let isLogoLike = false
        for (let i = 0; i < buf.length - 8; i++) {
          if (buf[i] === 0xFF && (buf[i+1] === 0xC0 || buf[i+1] === 0xC2)) {
            const h = buf.readUInt16BE(i + 5)
            const w = buf.readUInt16BE(i + 7)
            if (h > 0 && w > 0) {
              const ratio = w / h
              // Cuadrado (0.85–1.15) con lado > 250px → probable logo portal
              if (ratio >= 0.85 && ratio <= 1.15 && Math.min(w, h) > 250) {
                isLogoLike = true
              }
              // Muy vertical (ratio < 0.5) → también descartar
              if (ratio < 0.5) {
                isLogoLike = true
              }
            }
            break
          }
        }
        if (!isLogoLike) cdnImgs.push(imgUrl)
        else console.log(`    🚫 Imagen descartada (logo/cuadrada): ${imgUrl.split('/').pop()}`)
      } catch {
        // Si falla el fetch de verificación, incluir la imagen de todos modos
        cdnImgs.push(imgUrl)
      }
    }
    // Limitar a 15 fotos finales
    cdnImgs.splice(15)

    // Precio desde HTML si falta
    if (!price) {
      const priceM = html.match(/(\d{2,7})\s*€/)
      if (priceM) price = parseInt(priceM[1], 10)
    }

    // Detectar operación desde URL o texto
    if (url.includes('alquil') || (description ?? '').toLowerCase().includes('alquiler')) {
      operationRaw = 'rent'
    }
    if (url.includes('venta') || url.includes('vende')) {
      operationRaw = 'sale'
    }

    // Dormitorios desde HTML
    if (bedrooms === undefined) {
      const hm = html.match(/(\d+)\s*(?:habitaci[oó]n|dormitorio|bedroom)/i)
      if (hm) bedrooms = parseInt(hm[1], 10)
    }
    if (bathrooms === undefined) {
      const bm = html.match(/(\d+)\s*(?:ba[ñn]o|baños|bathroom)/i)
      if (bm) bathrooms = parseInt(bm[1], 10)
    }
    if (area_m2 === undefined) {
      const am = html.match(/(\d{2,4})\s*m[²2]/i)
      if (am) area_m2 = parseInt(am[1], 10)
    }

    // Pro badge desde HTML
    if (html.includes('wallapop-pro') || html.includes('"is_pro":true') || html.includes('"pro_badge":true')) {
      is_particular = false
    }

    // ── Verificación secundaria: señales de agencia en título/descripción ────────
    // Aunque Wallapop no marque al vendedor como "pro", las agencias publican anuncios
    // usando cuentas de usuario normal (ej. "Yaencontre..") y delatan su naturaleza
    // en el texto: "La Casa Agency presenta en exclusiva…", "en exclusiva", etc.
    // Si hay señales inequívocas de agencia en el contenido → reclasificar.
    if (is_particular) {
      const textCheck = `${title} ${description ?? ''}`.toLowerCase()
      const AGENCY_TEXT_SIGNALS = [
        'agency',              // inglés — ej: "La Casa Agency"
        'en exclusiva',        // frase típica de agencias
        'presenta en exclusiva',
        'agencia inmobiliaria',
        'inmobiliaria',
        'honorarios',
        'comisión de agencia',
        'gastos de agencia',
        'nuestros inmuebles',
        'nuestra cartera',
        'grupo inmobiliario',
        'servicios inmobiliarios',
        'asesor inmobiliario',
        'gestión integral',
        'gestión inmobiliaria',
        'real estate',
        'info@',
        'ventas@',
        'contacto@',
      ]
      const agencySignal = AGENCY_TEXT_SIGNALS.find(s => textCheck.includes(s))
      if (agencySignal) {
        is_particular = false
        console.log(`    🏢 [AGENCIA por texto] "${agencySignal}" → is_particular=false: ${title.slice(0, 55)}`)
      }
    }
    // Extraer external_id desde la URL: /item/piso-en-alquiler-1234567890
    const idMatch = url.match(/-(\d{8,13})$/)
    const external_id = idMatch ? idMatch[1] : url.split('/item/')[1]?.replace(/[^a-z0-9-]/gi, '').slice(0, 50) ?? ''

    if (!title || !price) return null

    // Normalizar microName: Wallapop los devuelve en TODO_MAYÚSCULAS
    // → looksLikeCorporateName los detectaría como empresa. Convertir a Title Case.
    const normalizedName = advertiser_name
      ? /^[A-ZÁÉÍÓÚÑ0-9\s]+$/.test(advertiser_name.trim())
        ? advertiser_name.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
        : advertiser_name
      : undefined

    return {
      title,
      description,
      price,
      operation: operationRaw as 'sale' | 'rent',
      images: cdnImgs,
      bedrooms,
      bathrooms,
      area_m2,
      city,
      district,
      lat,
      lng,
      advertiser_name: normalizedName,
      is_particular,
      external_id,
    }
  } catch (err) {
    console.warn(`  ⚠️ Error fetching detail ${url}: ${err}`)
    return null
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const opArg = (process.argv[2] ?? 'alquiler').toLowerCase() as 'alquiler' | 'venta'
  const cityArg = (process.argv[3] ?? 'barcelona').toLowerCase()
  const maxPages = parseInt(process.argv[4] ?? '5', 10)
  // maxImport: límite de importaciones (útil para tests — máx 3 al probar)
  const maxImport = process.argv[5] ? parseInt(process.argv[5], 10) : Infinity
  // Filtro de precio (€) — undefined = sin límite
  const minPrice = process.argv[6] ? parseInt(process.argv[6], 10) : undefined
  const maxPrice = process.argv[7] ? parseInt(process.argv[7], 10) : undefined

  const cityInfo = CITY_MAP[cityArg]
  if (!cityInfo) {
    console.error(`❌ Ciudad no soportada: ${cityArg}. Opciones: ${Object.keys(CITY_MAP).join(', ')}`)
    process.exit(1)
  }

  const operation: 'sale' | 'rent' = opArg === 'venta' ? 'sale' : 'rent'
  const listUrl = buildListUrl(opArg, cityInfo.slug)

  const priceLabel = minPrice || maxPrice
    ? ` | precio: ${minPrice ? minPrice.toLocaleString('es-ES') + '€' : '0€'} – ${maxPrice ? maxPrice.toLocaleString('es-ES') + '€' : '∞'}`
    : ''
  console.log(`\n🟠 Wallapop — ${opArg} en ${cityInfo.city} (${maxPages} páginas)${priceLabel}`)
  console.log(`   URL base: ${listUrl}\n`)

  // ── Fase 1: Playwright para extraer URLs ─────────────────────────────────
  let allDetailUrls: string[] = []

  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      userAgent: UA,
      locale: 'es-ES',
      viewport: { width: 1280, height: 800 },
    })
    const page = await context.newPage()

    // Rechazar cookies si aparece el banner
    page.on('dialog', (d) => d.dismiss().catch(() => {}))

    for (let p = 1; p <= maxPages; p++) {
      console.log(`📄 Página ${p}/${maxPages}`)
      const urls = await scrapeListPage(page, listUrl, p)
      allDetailUrls.push(...urls)
      if (urls.length === 0) {
        console.log('  ⏹️ Sin más resultados')
        break
      }
      if (p < maxPages) await sleep(PAGE_DELAY_MS)
    }

    await context.close()
  } finally {
    await browser.close()
  }

  // Deduplicar
  allDetailUrls = [...new Set(allDetailUrls)]
  console.log(`\n📋 Total URLs únicas a procesar: ${allDetailUrls.length}`)

  if (allDetailUrls.length === 0) {
    console.log('⚠️  No se encontraron anuncios. Puede que Wallapop haya cambiado la estructura.')
    process.exit(0)
  }

  // ── Fase 2: fetch detalle + upsert ───────────────────────────────────────
  let inserted = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < allDetailUrls.length; i++) {
    if (inserted >= maxImport) {
      console.log(`\n⏹️  Límite de importación alcanzado (${maxImport}). Parando.`)
      break
    }
    const url = allDetailUrls[i]
    process.stdout.write(`[${i + 1}/${allDetailUrls.length}] `)

    const detail = await fetchDetail(url)
    if (!detail) {
      console.log(`⚠️  Sin datos: ${url.split('/item/')[1] ?? url}`)
      errors++
      await sleep(500)
      continue
    }

    // Filtro de precio
    if (minPrice !== undefined && (detail.price ?? 0) < minPrice) {
      console.log(`⏭️  Precio ${detail.price?.toLocaleString('es-ES')}€ < mín ${minPrice.toLocaleString('es-ES')}€ — omitido`)
      continue
    }
    if (maxPrice !== undefined && (detail.price ?? Infinity) > maxPrice) {
      console.log(`⏭️  Precio ${detail.price?.toLocaleString('es-ES')}€ > máx ${maxPrice.toLocaleString('es-ES')}€ — omitido`)
      continue
    }

    const listing: ScrapedListing = {
      title: detail.title,
      description: detail.description,
      price_eur: detail.price,
      operation,
      province: cityInfo.province,
      city: detail.city ?? cityInfo.city,
      district: detail.district,
      lat: detail.lat,
      lng: detail.lng,
      bedrooms: detail.bedrooms,
      bathrooms: detail.bathrooms,
      area_m2: detail.area_m2,
      source_portal: 'wallapop',
      source_url: url,
      source_external_id: `wallapop_${detail.external_id}`,
      is_particular: detail.is_particular,
      is_bank: false,
      images: detail.images.length > 0 ? detail.images : undefined,
      // NO upload_to_storage: las URLs del CDN de Wallapop se sirven via img-proxy
      // El proxy cachea en Vercel Edge 7 días → cero egress de Supabase Storage
      external_link: url,
      phone: undefined,  // Wallapop no expone teléfonos
      // Normalizar nombre: microName de Wallapop suele ser TODO_MAYÚSCULAS, lo que
      // dispararía looksLikeCorporateName → title-case para que no se detecte como empresa
      advertiser_name: detail.advertiser_name
        ? detail.advertiser_name.replace(/^[A-ZÁÉÍÓÚÑ\s]+$/, (s) =>
            s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()))
        : undefined,
    }

    const ok = await upsertListing(listing)
    if (ok) {
      inserted++
      const priceStr = detail.price?.toLocaleString('es-ES') + ' €' ?? '?'
      const imgStr = detail.images.length > 0 ? ` 🖼️ ${detail.images.length}` : ' ⚠️ sin imgs'
      const partStr = detail.is_particular ? ' 👤' : ' 🏢'
      console.log(`✅ ${detail.title.slice(0, 45)} — ${priceStr}${imgStr}${partStr}`)
    } else {
      skipped++
      console.log(`↩️  Ya existe: ${detail.title.slice(0, 45)}`)
    }

    await sleep(DETAIL_DELAY_MS)
  }

  console.log(`\n✨ Completado: ${inserted} nuevos, ${skipped} ya existían, ${errors} errores`)
  console.log(`   👤 Todos son particulares (Wallapop filtra por categoría)\n`)
}

main().catch(console.error)

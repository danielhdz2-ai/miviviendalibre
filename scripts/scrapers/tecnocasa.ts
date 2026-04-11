/**
 * Scraper Tecnocasa España
 * Extrae pisos en venta y alquiler de tecnocasa.es
 * 
 * USO:
 *   SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/tecnocasa.ts
 *   SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/tecnocasa.ts --operation rent --city madrid --max 100
 * 
 * OPCIONES:
 *   --operation   sale | rent (default: sale)
 *   --city        madrid | barcelona | valencia | sevilla | ... (default: madrid)
 *   --max         número máximo de anuncios a scrapear (default: 200)
 *   --headless    false para ver el navegador (default: true)
 */

import { chromium } from 'playwright'
import { upsertListing, sleep, normalizePrice, normalizeArea, normalizeRooms } from './utils.js'

// ─── Configuración por args ─────────────────────────────────────────────────
const args = process.argv.slice(2)
const getArg = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : def
}

const OPERATION = getArg('operation', 'sale') as 'sale' | 'rent'
const CITY      = getArg('city', 'madrid')
const MAX       = parseInt(getArg('max', '200'))
const HEADLESS  = getArg('headless', 'true') !== 'false'

// ─── URLs por operación ─────────────────────────────────────────────────────
const BASE_URLS: Record<string, Record<string, string>> = {
  sale: {
    madrid:    'https://www.tecnocasa.es/venta/piso/comunidad-de-madrid/madrid/madrid.html',
    barcelona: 'https://www.tecnocasa.es/venta/piso/cataluna/barcelona/barcelona.html',
    valencia:  'https://www.tecnocasa.es/venta/piso/comunidad-valenciana/valencia/valencia.html',
    sevilla:   'https://www.tecnocasa.es/venta/piso/andalucia/sevilla/sevilla.html',
    zaragoza:  'https://www.tecnocasa.es/venta/piso/aragon/zaragoza/zaragoza.html',
    bilbao:    'https://www.tecnocasa.es/venta/piso/pais-vasco/vizcaya/bilbao.html',
    malaga:    'https://www.tecnocasa.es/venta/piso/andalucia/malaga/malaga.html',
  },
  rent: {
    madrid:    'https://www.tecnocasa.es/alquiler/piso/comunidad-de-madrid/madrid/madrid.html',
    barcelona: 'https://www.tecnocasa.es/alquiler/piso/cataluna/barcelona/barcelona.html',
    valencia:  'https://www.tecnocasa.es/alquiler/piso/comunidad-valenciana/valencia/valencia.html',
    sevilla:   'https://www.tecnocasa.es/alquiler/piso/andalucia/sevilla/sevilla.html',
    zaragoza:  'https://www.tecnocasa.es/alquiler/piso/aragon/zaragoza/zaragoza.html',
    bilbao:    'https://www.tecnocasa.es/alquiler/piso/pais-vasco/vizcaya/bilbao.html',
    malaga:    'https://www.tecnocasa.es/alquiler/piso/andalucia/malaga/malaga.html',
  },
}

const PROVINCE_MAP: Record<string, string> = {
  madrid: 'Madrid', barcelona: 'Barcelona', valencia: 'Valencia',
  sevilla: 'Sevilla', zaragoza: 'Zaragoza', bilbao: 'Vizcaya', malaga: 'Málaga',
}

async function run() {
  const startUrl = BASE_URLS[OPERATION]?.[CITY]
  if (!startUrl) {
    console.error(`❌ Ciudad no soportada: ${CITY}. Usa: ${Object.keys(BASE_URLS.sale).join(' | ')}`)
    process.exit(1)
  }

  console.log(`\n🏠 Tecnocasa scraper`)
  console.log(`   Operación : ${OPERATION}`)
  console.log(`   Ciudad    : ${CITY}`)
  console.log(`   Máximo    : ${MAX} anuncios`)
  console.log(`   Inicio    : ${startUrl}\n`)

  const browser = await chromium.launch({ headless: HEADLESS })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'es-ES',
  })

  const page = await context.newPage()
  // Bloquear recursos innecesarios para ir más rápido
  await page.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2,mp4,webm,css}', r => r.abort())
  
  let collected = 0
  let currentUrl = startUrl
  let pageNum = 1

  try {
    while (collected < MAX) {
      console.log(`📄 Página ${pageNum}: ${currentUrl}`)
      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await sleep(1500 + Math.random() * 1000)

      // Extraer links de anuncios en esta página
      const listingLinks = await page.$$eval(
        'a[href*="/annuncio/"], a[href*="/anuncio/"], .property-card a, .listing-item a, article a',
        (links) => [...new Set(
          (links as HTMLAnchorElement[])
            .map(a => a.href)
            .filter(h => h.includes('tecnocasa.es') && (h.includes('/annuncio/') || h.includes('/anuncio/') || h.includes('/inmueble/')))
        )]
      )

      if (listingLinks.length === 0) {
        // Intentar selector alternativo
        const allLinks = await page.$$eval('a[href]', links =>
          (links as HTMLAnchorElement[]).map(a => a.href)
        )
        const filtered = allLinks.filter(h =>
          h.startsWith('http') &&
          /tecnocasa\.es\/.+\/\d{4,}\.html/.test(h) &&
          !h.includes('#')
        )
        console.log(`  ↳ 0 links con selector principal, ${filtered.length} candidatos alternativos`)
        if (filtered.length === 0) break
        listingLinks.push(...filtered.slice(0, 20))
      }

      const uniqueLinks = [...new Set(listingLinks)].slice(0, MAX - collected)
      console.log(`  ↳ ${uniqueLinks.length} anuncios encontrados`)

      // Scrapear cada anuncio individualmente
      for (const link of uniqueLinks) {
        if (collected >= MAX) break
        const ok = await scrapeListing(context, link, OPERATION, CITY)
        if (ok) {
          collected++
          console.log(`  ✅ [${collected}/${MAX}] ${link.slice(-60)}`)
        } else {
          console.log(`  ⚠️  [skip] ${link.slice(-60)}`)
        }
        await sleep(800 + Math.random() * 700)
      }

      // Buscar botón "siguiente página"
      const nextUrl = await page.$eval(
        'a[rel="next"], a.next, .pagination a[aria-label*="iguiente"], .pagination a:last-child',
        (el) => (el as HTMLAnchorElement).href
      ).catch(() => null)

      if (!nextUrl || nextUrl === currentUrl) break
      currentUrl = nextUrl
      pageNum++
      await sleep(2000)
    }
  } finally {
    await browser.close()
  }

  console.log(`\n✅ Completado: ${collected} anuncios importados de Tecnocasa (${CITY}, ${OPERATION})`)
}

async function scrapeListing(
  context: Awaited<ReturnType<typeof chromium.launch>>['contexts'][0] extends never ? never : any,
  url: string,
  operation: 'sale' | 'rent',
  city: string
): Promise<boolean> {
  const page = await context.newPage()
  await page.route('**/*.{gif,svg,woff,woff2,mp4,webm}', r => r.abort())

  try {
    // Tecnocasa es SPA — esperar a que cargue el JS
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await sleep(1000)

    // Extraer datos estructurados (JSON-LD si existe)
    const jsonLd = await page.$eval('script[type="application/ld+json"]', el => el.textContent).catch(() => null)
    let ldData: Record<string, any> = {}
    if (jsonLd) {
      try { ldData = JSON.parse(jsonLd) } catch { /* ignore */ }
    }

    // Título
    const title = await page.$eval(
      'h1, .property-title, .listing-title, [class*="title"]',
      el => el.textContent?.trim() ?? ''
    ).catch(() => '')

    if (!title) { await page.close(); return false }

    // Precio
    const priceText = await page.$eval(
      '[class*="price"], [class*="precio"], .price, .prezzo',
      el => el.textContent ?? ''
    ).catch(() => '')
    const price_eur = normalizePrice(priceText) || (ldData.offers?.price ? parseFloat(ldData.offers.price) : undefined)

    // Descripción
    const description = await page.$eval(
      '[class*="description"], [class*="descripcion"], [class*="descrizione"], .description',
      el => el.textContent?.trim()?.slice(0, 1500) ?? ''
    ).catch(() => '')

    // Características
    const features = await page.$$eval(
      '[class*="feature"], [class*="detail"], [class*="caratteristiche"] li, .specs li, dt, dd',
      els => (els as HTMLElement[]).map(e => e.textContent?.trim() ?? '').filter(Boolean)
    ).catch(() => [] as string[])

    const featuresText = features.join(' ')

    const area_m2 = normalizeArea(
      featuresText.match(/(\d+)\s*m[²2]/i)?.[0] ?? ''
    )
    const bedrooms = normalizeRooms(
      featuresText.match(/(\d+)\s*(dormitorio|habitacion|bedroom|camera)/i)?.[0] ?? ''
    )
    const bathrooms = normalizeRooms(
      featuresText.match(/(\d+)\s*(ba[ñn]o|bathroom|bagno)/i)?.[0] ?? ''
    )

    // Imágenes
    const images = await page.$$eval(
      'img[src*="tecnocasa"], img[data-src*="tecnocasa"], .gallery img, .slider img, [class*="photo"] img',
      imgs => [...new Set(
        (imgs as HTMLImageElement[])
          .map(i => i.src || i.dataset.src || '')
          .filter(s => s.startsWith('http') && (s.includes('.jpg') || s.includes('.jpeg') || s.includes('.webp')))
      )].slice(0, 10)
    ).catch(() => [] as string[])

    // ID externo desde URL
    const externalIdMatch = url.match(/\/(\d{5,})[\/\-_]?/)
    const source_external_id = externalIdMatch?.[1] ?? url.split('/').filter(Boolean).pop() ?? ''

    if (!source_external_id) { await page.close(); return false }

    await upsertListing({
      title: title.slice(0, 200),
      description,
      price_eur,
      operation,
      province: PROVINCE_MAP[city] ?? city,
      city: city.charAt(0).toUpperCase() + city.slice(1),
      area_m2,
      bedrooms,
      bathrooms,
      source_portal: 'tecnocasa',
      source_url: url,
      source_external_id: `tecnocasa_${source_external_id}`,
      is_particular: false,
      images,
    })

    await page.close()
    return true
  } catch (err) {
    await page.close()
    return false
  }
}

run().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})

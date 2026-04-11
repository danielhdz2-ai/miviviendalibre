/**
 * Scraper Redpiso España
 * Extrae pisos en venta y alquiler de redpiso.com
 * 
 * USO:
 *   SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/redpiso.ts
 *   SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/redpiso.ts --operation rent --city madrid --max 150
 *
 * OPCIONES:
 *   --operation   sale | rent (default: sale)
 *   --city        madrid | barcelona | valencia | sevilla (default: madrid)
 *   --max         número máximo (default: 200)
 *   --headless    false para ver el navegador (default: true)
 */

import { chromium, Page } from 'playwright'
import { upsertListing, sleep, normalizePrice, normalizeArea, normalizeRooms } from './utils.js'

const args = process.argv.slice(2)
const getArg = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : def
}

const OPERATION = getArg('operation', 'sale') as 'sale' | 'rent'
const CITY      = getArg('city', 'madrid')
const MAX       = parseInt(getArg('max', '200'))
const HEADLESS  = getArg('headless', 'true') !== 'false'

// Redpiso organiza por operación y zona
const BASE_URLS: Record<string, Record<string, string>> = {
  sale: {
    madrid:    'https://www.redpiso.es/venta-de-pisos-y-casas/madrid',
    barcelona: 'https://www.redpiso.es/venta-de-pisos-y-casas/barcelona',
    valencia:  'https://www.redpiso.es/venta-de-pisos-y-casas/valencia',
    sevilla:   'https://www.redpiso.es/venta-de-pisos-y-casas/sevilla',
  },
  rent: {
    madrid:    'https://www.redpiso.es/alquiler-de-pisos-y-casas/madrid',
    barcelona: 'https://www.redpiso.es/alquiler-de-pisos-y-casas/barcelona',
    valencia:  'https://www.redpiso.es/alquiler-de-pisos-y-casas/valencia',
    sevilla:   'https://www.redpiso.es/alquiler-de-pisos-y-casas/sevilla',
  },
}

const PROVINCE_MAP: Record<string, string> = {
  madrid: 'Madrid', barcelona: 'Barcelona', valencia: 'Valencia', sevilla: 'Sevilla',
}

async function run() {
  const startUrl = BASE_URLS[OPERATION]?.[CITY]
  if (!startUrl) {
    console.error(`❌ Ciudad no soportada: ${CITY}`)
    process.exit(1)
  }

  console.log(`\n🏠 Redpiso scraper`)
  console.log(`   Operación : ${OPERATION}`)
  console.log(`   Ciudad    : ${CITY}`)
  console.log(`   Máximo    : ${MAX}`)
  console.log(`   Inicio    : ${startUrl}\n`)

  const browser = await chromium.launch({ headless: HEADLESS })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'es-ES',
  })

  const listPage = await context.newPage()
  await listPage.route('**/*.{gif,svg,woff,woff2,mp4,webm,css}', r => r.abort())

  let collected = 0
  let currentUrl = startUrl
  let pageNum = 1

  try {
    while (collected < MAX) {
      console.log(`📄 Página ${pageNum}: ${currentUrl}`)
      await listPage.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await sleep(2000 + Math.random() * 1000)

      // Extraer links de anuncios
      const links = await listPage.$$eval('a[href]', (anchors) => {
        return [...new Set(
          (anchors as HTMLAnchorElement[])
            .map(a => a.href)
            .filter(h => /redpiso\.es\/.+\/(inmueble|piso|casa|apartamento)[-\/]/.test(h) || /redpiso\.es\/inmuebles\/\d+/.test(h))
        )]
      })

      // Fallback: buscar por patrón de URL numérica
      const fallbackLinks = links.length === 0
        ? await listPage.$$eval('a[href*="redpiso.es"]', anchors =>
            [...new Set((anchors as HTMLAnchorElement[]).map(a => a.href).filter(h => /\/\d{4,}[-\/]/.test(h)))]
          )
        : []

      const allLinks = [...new Set([...links, ...fallbackLinks])].slice(0, MAX - collected)
      console.log(`  ↳ ${allLinks.length} anuncios encontrados`)

      if (allLinks.length === 0) break

      for (const link of allLinks) {
        if (collected >= MAX) break
        const ok = await scrapeListingPage(context, link, OPERATION, CITY)
        if (ok) {
          collected++
          console.log(`  ✅ [${collected}/${MAX}] ${link.slice(-60)}`)
        }
        await sleep(700 + Math.random() * 800)
      }

      // Paginación
      const nextUrl = await listPage.$eval(
        'a[rel="next"], .pagination .next a, a[aria-label*="iguiente"], [class*="pagination"] a:last-child',
        el => (el as HTMLAnchorElement).href
      ).catch(() => null)

      if (!nextUrl || nextUrl === currentUrl) break
      currentUrl = nextUrl
      pageNum++
      await sleep(2500)
    }
  } finally {
    await browser.close()
  }

  console.log(`\n✅ Completado: ${collected} anuncios importados de Redpiso (${CITY}, ${OPERATION})`)
}

async function scrapeListingPage(
  context: any,
  url: string,
  operation: 'sale' | 'rent',
  city: string
): Promise<boolean> {
  const page: Page = await context.newPage()
  await page.route('**/*.{gif,svg,woff,woff2,mp4,webm}', r => r.abort())

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })

    const title = await page.$eval(
      'h1, [class*="title"][class*="property"], [class*="titulo"]',
      el => el.textContent?.trim() ?? ''
    ).catch(() => '')

    if (!title || title.length < 5) { await page.close(); return false }

    // Precio
    const priceText = await page.$eval(
      '[class*="price"], [class*="precio"], .price-value',
      el => el.textContent ?? ''
    ).catch(() => '')
    const price_eur = normalizePrice(priceText)

    // Descripción
    const description = await page.$eval(
      '[class*="description"], [class*="descripcion"], [itemprop="description"]',
      el => el.textContent?.trim()?.slice(0, 1500) ?? ''
    ).catch(() => '')

    // Atributos
    const rawText = await page.$eval('body', el => el.innerText ?? '').catch(() => '')

    const area_m2 = normalizeArea(rawText.match(/(\d+)\s*m[²2]/i)?.[0] ?? '')
    const bedrooms = normalizeRooms(rawText.match(/(\d+)\s*(dormitorio|habitaci[oó]n)/i)?.[0] ?? '')
    const bathrooms = normalizeRooms(rawText.match(/(\d+)\s*ba[ñn]o/i)?.[0] ?? '')

    // Imágenes
    const images = await page.$$eval(
      'img[src*="redpiso"], img[src*="inmueble"], .gallery img, [class*="photo"] img, [class*="imagen"] img',
      imgs => [...new Set(
        (imgs as HTMLImageElement[])
          .map(i => i.src)
          .filter(s => s.startsWith('http') && /\.(jpg|jpeg|webp|png)/i.test(s))
      )].slice(0, 10)
    ).catch(() => [] as string[])

    // ID externo
    const externalIdMatch = url.match(/\/(\d{4,})[-\/]?/)
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
      source_portal: 'redpiso',
      source_url: url,
      source_external_id: `redpiso_${source_external_id}`,
      is_particular: false,
      images,
    })

    await page.close()
    return true
  } catch {
    await page.close()
    return false
  }
}

run().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})

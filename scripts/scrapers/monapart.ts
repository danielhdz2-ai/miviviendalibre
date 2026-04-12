/**
 * Scraper Monapart España (agencia premium Barcelona/Madrid)
 * Tienen JSON-LD en cada listing → extracción muy limpia
 * 
 * USO:
 *   SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/monapart.ts
 *   SUPABASE_SERVICE_KEY=xxx npx tsx scripts/scrapers/monapart.ts --operation rent --max 100
 */

import { chromium } from 'playwright'
import { upsertListing, sleep, normalizePrice } from './utils.js'

const args = process.argv.slice(2)
const getArg = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : def
}

const OPERATION = getArg('operation', 'sale') as 'sale' | 'rent'
const MAX       = parseInt(getArg('max', '150'))
const HEADLESS  = getArg('headless', 'true') !== 'false'

const LIST_URLS: Record<string, string> = {
  sale: 'https://www.monapart.com/es/comprar',
  rent: 'https://www.monapart.com/es/alquilar',
}

async function run() {
  console.log(`\n🏠 Monapart scraper`)
  console.log(`   Operación : ${OPERATION}`)
  console.log(`   Máximo    : ${MAX}\n`)

  const browser = await chromium.launch({ headless: HEADLESS })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-ES',
    viewport: { width: 1440, height: 900 },
  })

  const page = await context.newPage()
  await page.route('**/*.{gif,woff,woff2,mp4,webm}', r => r.abort())

  let collected = 0
  let currentUrl = LIST_URLS[OPERATION]
  let pageNum = 1

  try {
    while (collected < MAX) {
      console.log(`📄 Página ${pageNum}: ${currentUrl}`)
      await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await sleep(1500)

      // Monapart carga dinámicamente — esperar cards
      await page.waitForSelector('[class*="property"], [class*="listing"], article, .card', { timeout: 10000 }).catch(() => {})

      const links = await page.$$eval('a[href]', anchors =>
        [...new Set(
          (anchors as HTMLAnchorElement[]).map(a => a.href)
            .filter(h => /monapart\.com\/(es|en)\/(comprar|alquilar|buy|rent)\/.+\/.+/.test(h))
        )]
      )

      console.log(`  ↳ ${links.length} anuncios encontrados`)
      if (links.length === 0) break

      const batch = links.slice(0, MAX - collected)

      for (const link of batch) {
        if (collected >= MAX) break
        const ok = await scrapeListing(context, link, OPERATION)
        if (ok) {
          collected++
          console.log(`  ✅ [${collected}/${MAX}] ${link.slice(-60)}`)
        }
        await sleep(600 + Math.random() * 600)
      }

      const nextUrl = await page.$eval(
        'a[rel="next"], [aria-label*="iguiente"], .pagination a:last-child',
        el => (el as HTMLAnchorElement).href
      ).catch(() => null)

      if (!nextUrl || nextUrl === currentUrl) break
      currentUrl = nextUrl
      pageNum++
      await sleep(2000)
    }
  } finally {
    await browser.close()
  }

  console.log(`\n✅ Completado: ${collected} anuncios importados de Monapart`)
}

async function scrapeListing(context: any, url: string, operation: 'sale' | 'rent'): Promise<boolean> {
  const page = await context.newPage()
  await page.route('**/*.{gif,woff,woff2,mp4,webm}', r => r.abort())

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })

    // Intentar JSON-LD primero (Monapart suele incluirlo)
    const jsonLdText = await page.$eval(
      'script[type="application/ld+json"]',
      el => el.textContent ?? ''
    ).catch(() => '')

    let ldData: any = {}
    if (jsonLdText) {
      try { ldData = JSON.parse(jsonLdText) } catch { /* ignore */ }
    }

    const title = ldData.name
      || await page.$eval('h1', el => el.textContent?.trim() ?? '').catch(() => '')

    if (!title) { await page.close(); return false }

    const priceText = await page.$eval(
      '[class*="price"], [itemprop="price"], [class*="precio"]',
      el => el.textContent ?? el.getAttribute('content') ?? ''
    ).catch(() => '')

    const price_eur = ldData.offers?.price
      ? parseFloat(String(ldData.offers.price))
      : normalizePrice(priceText)

    const description = ldData.description
      || await page.$eval('[itemprop="description"], [class*="description"]', el => el.textContent?.trim()?.slice(0, 1500) ?? '').catch(() => '')

    // Dirección desde LD
    const city = ldData.address?.addressLocality ?? 'Barcelona'
    const province = ldData.address?.addressRegion ?? 'Barcelona'

    // Características
    const bodyText = await page.$eval('body', el => el.innerText).catch(() => '')
    const area_m2 = parseInt(bodyText.match(/(\d+)\s*m[²2]/i)?.[1] ?? '') || undefined
    const bedrooms = parseInt(bodyText.match(/(\d+)\s*(dormitorio|hab)/i)?.[1] ?? '') || undefined
    const bathrooms = parseInt(bodyText.match(/(\d+)\s*ba[ñn]o/i)?.[1] ?? '') || undefined

    // Imágenes
    const images = await page.$$eval(
      'img[src*="monapart"], img[src*="media"], .gallery img, [class*="photo"] img',
      imgs => [...new Set(
        (imgs as HTMLImageElement[]).map(i => i.src || i.dataset.src || '')
          .filter(s => s.startsWith('http') && /\.(jpg|jpeg|webp)/i.test(s))
      )].slice(0, 10)
    ).catch(() => [] as string[])

    // ID externo
    const segments = url.split('/').filter(Boolean)
    const source_external_id = segments[segments.length - 1] ?? ''
    if (!source_external_id) { await page.close(); return false }

    await upsertListing({
      title: String(title).slice(0, 200),
      description: String(description).slice(0, 1500),
      price_eur,
      operation,
      province,
      city,
      area_m2,
      bedrooms,
      bathrooms,
      source_portal: 'monapart',
      source_url: url,
      source_external_id: `monapart_${source_external_id}`,
      is_particular: false,
      images,
      external_link: url,
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

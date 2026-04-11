/**
 * Scraper Aliseda Inmobiliaria — Oportunidades Bancarias
 * ─────────────────────────────────────────────────────────
 * Portafolio: activos inmobiliarios de Banco Santander y Blackstone Real Estate.
 * Aliseda Inmobiliaria = servicer de activos del Santander (Blackstone adquirió
 * el portfolio en 2018, pero Aliseda gestiona la desinversión).
 *
 * Entidad bancaria mostrada: 'Banco Santander (Aliseda / Blackstone)'
 *
 * Requiere Playwright: Aliseda es una SPA (React ou similar) con cookie wall
 * que bloquea el SSR — el contenido sólo aparece tras ejecutar JavaScript.
 *
 * Estructura de URLs:
 *   Búsqueda venta:    https://www.alisedainmobiliaria.com/es/inmuebles/?tipo_operacion=VT
 *   Búsqueda alquiler: https://www.alisedainmobiliaria.com/es/inmuebles/?tipo_operacion=AL
 *   Detalle:           https://www.alisedainmobiliaria.com/es/inmuebles/{slug}/{id}/
 *
 * USO:
 *   npx tsx scripts/scrapers/aliseda.ts [operacion] [ciudad] [maxPaginas]
 *   operacion:  venta | alquiler (default: venta)
 *   ciudad:     madrid | barcelona | valencia | sevilla | malaga | all (default: all)
 *   maxPaginas: número de páginas a scrapear (default: 5)
 */

import { chromium, type Page } from 'playwright'
import { upsertListing, type ScrapedListing } from './utils'

const BANK_ENTITY = 'Banco Santander (Aliseda / Blackstone)'
const DELAY_MS    = 1000

const CITY_MAP: Record<string, { province: string; city: string; slug: string }> = {
  madrid:    { province: 'Madrid',    city: 'Madrid',    slug: 'madrid' },
  barcelona: { province: 'Barcelona', city: 'Barcelona', slug: 'barcelona' },
  valencia:  { province: 'Valencia',  city: 'Valencia',  slug: 'valencia' },
  sevilla:   { province: 'Sevilla',   city: 'Sevilla',   slug: 'sevilla' },
  malaga:    { province: 'Málaga',    city: 'Málaga',    slug: 'malaga' },
  zaragoza:  { province: 'Zaragoza',  city: 'Zaragoza',  slug: 'zaragoza' },
}

// ─── Aceptar cookies en Aliseda ─────────────────────────────────────────────
async function acceptCookies(page: Page): Promise<void> {
  try {
    // Aliseda usa un banner con botón "Aceptar todas" o "Aceptar todo"
    const acceptBtn = page.locator(
      'button:has-text("Aceptar todas"), button:has-text("Aceptar todo"), button:has-text("Accept all"), #acceptCookies, .cookie-accept'
    ).first()
    await acceptBtn.waitFor({ timeout: 6000 })
    await acceptBtn.click()
    await page.waitForTimeout(800)
    console.log('  🍪 Cookies aceptadas')
  } catch {
    console.log('  ℹ️  Banner de cookies no encontrado, continuando')
  }
}

// ─── Extraer listado de una página ──────────────────────────────────────────
async function extractListingCards(page: Page): Promise<Array<{
  url: string
  title: string
  price: number | null
  area: number | null
  bedrooms: number | null
  bathrooms: number | null
  province: string | null
  city: string | null
  isBankBadge: boolean
}>> {
  return page.evaluate(() => {
    const results: Array<{
      url: string; title: string; price: number | null; area: number | null
      bedrooms: number | null; bathrooms: number | null
      province: string | null; city: string | null; isBankBadge: boolean
    }> = []

    // Aliseda usa cards con selector principal .inmueble, .property-card o article
    const cards = Array.from(
      document.querySelectorAll(
        '.inmueble, .property-card, .card-inmueble, [class*="PropertyCard"], article.listitem, .listing-item, [data-testid*="property"]'
      )
    )
    if (cards.length === 0) return results

    for (const card of cards) {
      const linkEl = card.querySelector('a[href*="/inmuebles/"]') as HTMLAnchorElement | null
      if (!linkEl) continue

      const url = linkEl.href || ''
      if (!url) continue

      const titleEl = card.querySelector('h2, h3, .title, .inmueble-title, [class*="title"]')
      const title = titleEl?.textContent?.trim() ?? ''

      // Precio
      let price: number | null = null
      const priceEl = card.querySelector('.precio, .price, [class*="price"], [class*="Price"]')
      if (priceEl) {
        const priceText = priceEl.textContent ?? ''
        const priceNum = priceText.replace(/[^\d]/g, '')
        if (priceNum && parseInt(priceNum) > 1000) price = parseInt(priceNum)
      }

      // Superficie
      let area: number | null = null
      const areaEl = card.querySelector('.superficie, [class*="area"], [class*="Area"]')
      if (areaEl) {
        const areaM = areaEl.textContent?.match(/([\d.,]+)\s*m/)
        if (areaM) area = parseFloat(areaM[1].replace(',', '.'))
      }

      // Habitaciones y baños (pueden estar en iconos con texto)
      let bedrooms: number | null = null
      let bathrooms: number | null = null
      card.querySelectorAll('[class*="features"] li, [class*="feature"], .caracteristica, .specs li').forEach(el => {
        const t = el.textContent ?? ''
        const n = t.match(/(\d+)/)
        if (!n) return
        if (/dorm|hab|room/i.test(t)) bedrooms = parseInt(n[1])
        else if (/ba[ñn]o|bath/i.test(t)) bathrooms = parseInt(n[1])
        else if (/m[²2]/i.test(t) && !area) area = parseFloat(n[1])
      })

      // Localización
      let province: string | null = null
      let city: string | null = null
      const locEl = card.querySelector('.localidad, .location, [class*="location"], [class*="Location"]')
      if (locEl) {
        const locText = locEl.textContent?.trim() ?? ''
        const locParts = locText.split(/[,/]/)
        if (locParts.length >= 2) { city = locParts[0].trim(); province = locParts[1].trim() }
        else if (locParts.length === 1) city = locParts[0].trim()
      }

      // Badge bancario (Aliseda puede mostrar "Oportunidad bancaria" o "Inmueble de banco")
      const cardText = card.textContent ?? ''
      const isBankBadge = /oportunidad\s+bancaria|inmueble\s+de\s+banco|gesti[oó]n\s+banco|santander/i.test(cardText)

      results.push({ url, title, price, area, bedrooms, bathrooms, province, city, isBankBadge })
    }
    return results
  })
}

// ─── Extraer datos del detalle ───────────────────────────────────────────────
async function extractDetailData(page: Page): Promise<{
  description: string | null
  price: number | null
  area: number | null
  bedrooms: number | null
  bathrooms: number | null
  province: string | null
  city: string | null
  postalCode: string | null
  lat: number | null
  lng: number | null
  images: string[]
  features: Record<string, string>
}> {
  return page.evaluate(() => {
    // Descripción
    let description: string | null = null
    const descEl = document.querySelector(
      '.descripcion, .description, [class*="description"], [class*="Description"], #descripcion'
    )
    if (descEl) description = descEl.textContent?.trim().replace(/\s{3,}/g, '\n\n') ?? null

    // Precio
    let price: number | null = null
    const priceEl = document.querySelector('.precio, .price, [class*="detailPrice"], [class*="DetailPrice"], h2.price')
    if (priceEl) {
      const txt = priceEl.textContent ?? ''
      const n = txt.replace(/[^\d]/g, '')
      if (n && parseInt(n) > 1000) price = parseInt(n)
    }

    // Superficie (preferir JSON-LD)
    let area: number | null = null
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try {
        const obj = JSON.parse(s.textContent ?? '')
        const val = obj.floorSize?.value ?? obj.floorSize
        if (val) area = parseFloat(String(val))
      } catch { /* ignorar */ }
    })
    if (!area) {
      const areaEl = document.querySelector('[class*="area"], [class*="superficie"], .superficie')
      const areaM = areaEl?.textContent?.match(/([\d.,]+)\s*m/)
      if (areaM) area = parseFloat(areaM[1].replace(',', '.'))
    }

    // Habitaciones y baños
    let bedrooms: number | null = null
    let bathrooms: number | null = null
    document.querySelectorAll('[class*="feature"], [class*="Feature"], .caracteristica, li.specs-item').forEach(el => {
      const t = el.textContent ?? ''
      const n = t.match(/(\d+)/)?.[1]
      if (!n) return
      if (/dorm|hab|room/i.test(t)) bedrooms = parseInt(n)
      else if (/ba[ñn]o|bath/i.test(t)) bathrooms = parseInt(n)
    })

    // Localización
    let province: string | null = null
    let city: string | null = null
    let postalCode: string | null = null
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try {
        const obj = JSON.parse(s.textContent ?? '')
        const addr = obj.address
        if (addr) {
          province   = addr.addressRegion ?? province
          city       = addr.addressLocality ?? city
          postalCode = addr.postalCode ?? postalCode
        }
      } catch { /* ignorar */ }
    })

    // Coordenadas
    let lat: number | null = null
    let lng: number | null = null
    const allScripts = document.querySelectorAll('script:not([src])')
    allScripts.forEach(s => {
      const t = s.textContent ?? ''
      if (lat) return
      const latM = t.match(/"lat(?:itude)?"\s*:\s*"?([-\d.]+)"?/i)
      const lngM = t.match(/"l(?:ng|on|ongitude)"\s*:\s*"?([-\d.]+)"?/i)
      if (latM && lngM) {
        lat = parseFloat(latM[1])
        lng = parseFloat(lngM[1])
      }
    })

    // Imágenes
    const images: string[] = []
    const seenImgs = new Set<string>()
    document.querySelectorAll('img[src*="aliseda"], [class*="gallery"] img, [class*="slider"] img, .fotos img').forEach(img => {
      const src = (img as HTMLImageElement).src ?? ''
      if (src && !seenImgs.has(src) && !src.includes('logo') && !src.includes('svg')) {
        seenImgs.add(src)
        images.push(src)
      }
    })

    // Features extra
    const features: Record<string, string> = {}
    document.querySelectorAll('.caracteristicas li, [class*="feature"] li, dl.specs dt').forEach(dt => {
      const dd = dt.nextElementSibling
      const key = dt.textContent?.trim().toLowerCase().replace(/\s+/g, '_') ?? ''
      const val = dd?.textContent?.trim() ?? dt.textContent?.trim() ?? ''
      if (key && val && key.length < 40) features[key] = val
    })

    return { description, price, area, bedrooms, bathrooms, province, city, postalCode, lat, lng, images, features }
  })
}

// ─── Scraper principal ───────────────────────────────────────────────────────
async function scrapeAliseda(operation: 'venta' | 'alquiler', cityKey: string, maxPages: number) {
  const opCode   = operation === 'venta' ? 'VT' : 'AL'
  const opLabel: 'sale' | 'rent' = operation === 'venta' ? 'sale' : 'rent'

  const geoInfo = cityKey !== 'all' ? CITY_MAP[cityKey] : null
  const cityFilter = geoInfo ? `&localidad=${geoInfo.slug}` : ''

  console.log(`\n🏦 Aliseda (Santander/Blackstone) — ${operation}${geoInfo ? ' ' + geoInfo.city : ' (todo España)'} (hasta ${maxPages} páginas)`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'es-ES',
  })

  // Bloquear recursos pesados para ir más rápido
  const page = await context.newPage()
  await page.route('**/*.{woff,woff2,mp4,webm}', r => r.abort())

  let imported = 0; let skipped = 0
  const seenUrls = new Set<string>()

  try {
    const startUrl = `https://www.alisedainmobiliaria.com/es/inmuebles/?tipo_operacion=${opCode}${cityFilter}`
    console.log(`  🌐 URL inicial: ${startUrl}`)
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await acceptCookies(page)

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`  📄 Página ${pageNum}`)

      // Esperar a que se carguen los cards
      try {
        await page.waitForSelector(
          '.inmueble, .property-card, .card-inmueble, [class*="PropertyCard"], article.listitem',
          { timeout: 15_000 }
        )
      } catch {
        console.log(`  ⚠️  No se encontraron tarjetas en página ${pageNum} — puede que los selectores hayan cambiado`)
        break
      }

      const cards = await extractListingCards(page)
      const newCards = cards.filter(c => c.url && !seenUrls.has(c.url))

      if (newCards.length === 0) {
        console.log('  ✅ Sin tarjetas nuevas, fin de resultados')
        break
      }
      console.log(`  → ${newCards.length} anuncios nuevos`)

      for (const card of newCards) {
        seenUrls.add(card.url)

        // Abrir detalle
        const detailPage = await context.newPage()
        await detailPage.route('**/*.{woff,woff2,mp4,webm}', r => r.abort())

        try {
          await detailPage.goto(card.url, { waitUntil: 'domcontentloaded', timeout: 25_000 })
          await detailPage.waitForTimeout(1500) // dar tiempo al React para renderizar

          const det = await extractDetailData(detailPage)

          // External ID: último segmento numérico de la URL
          const extIdM = card.url.match(/\/(\d+)\/?$/)
          const externalId = `aliseda_${extIdM ? extIdM[1] : card.url.split('/').filter(Boolean).pop()}`

          const listing: ScrapedListing = {
            title:       card.title || `Piso en ${operation} — Aliseda`,
            description: det.description ?? undefined,
            price_eur:   det.price ?? card.price ?? undefined,
            operation:   opLabel,
            province:    det.province ?? card.province ?? geoInfo?.province ?? undefined,
            city:        det.city ?? card.city ?? geoInfo?.city ?? undefined,
            postal_code: det.postalCode ?? undefined,
            lat:         det.lat ?? undefined,
            lng:         det.lng ?? undefined,
            bedrooms:    det.bedrooms ?? card.bedrooms ?? undefined,
            bathrooms:   det.bathrooms ?? card.bathrooms ?? undefined,
            area_m2:     det.area ?? card.area ?? undefined,
            source_portal: 'alisedainmobiliaria.com',
            source_url:    card.url,
            source_external_id: externalId,
            is_particular: false,
            is_bank:       true,
            bank_entity:   BANK_ENTITY,
            images:        det.images,
            features:      Object.keys(det.features).length ? det.features : undefined,
          }

          const ok = await upsertListing(listing)
          if (ok) {
            imported++
            console.log(`    ✅ [${imported}] 🏦 ${(card.title).slice(0, 55)} | ${(det.price ?? card.price)?.toLocaleString('es-ES') ?? '?'}€`)
          } else {
            skipped++
          }
        } catch (err) {
          console.warn(`  ⚠️  Error en detalle ${card.url}: ${err}`)
          skipped++
        } finally {
          await detailPage.close()
          await new Promise(r => setTimeout(r, DELAY_MS))
        }
      }

      // Página siguiente
      const nextBtn = page.locator(
        'a[rel="next"], button:has-text("Siguiente"), a:has-text("Siguiente"), .pagination-next, [aria-label="Next page"]'
      ).first()

      const hasNext = await nextBtn.count() > 0
      if (!hasNext || pageNum >= maxPages) break

      await nextBtn.click()
      await page.waitForTimeout(2000)
    }
  } finally {
    await browser.close()
  }

  console.log(`\n✅ Aliseda — TOTAL: ${imported} importados, ${skipped} saltados`)
}

// ─── Entry point ─────────────────────────────────────────────────────────────
const [op = 'venta', city = 'all', maxPagesStr = '5'] = process.argv.slice(2)
if (op !== 'venta' && op !== 'alquiler') {
  console.error('❌ Operación inválida. Usa: venta | alquiler')
  process.exit(1)
}
if (city !== 'all' && !CITY_MAP[city]) {
  console.error(`❌ Ciudad no soportada. Usa: ${Object.keys(CITY_MAP).join(' | ')} | all`)
  process.exit(1)
}
scrapeAliseda(op, city, parseInt(maxPagesStr, 10))

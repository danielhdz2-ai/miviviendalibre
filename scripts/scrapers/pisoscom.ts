/**
 * Scraper para pisos.com
 * - SSR (no Playwright), usa fetch simple
 * - Extrae JSON-LD de la página de listados
 * - Visita cada detalle para obtener precio, m², dormitorios, baños
 * Uso: npx tsx scripts/scrapers/pisoscom.ts [operation] [city] [maxPages]
 *   operation: venta | alquiler (default: venta)
 *   city: madrid | barcelona | valencia | sevilla | zaragoza | bilbao | malaga (default: madrid)
 *   maxPages: número de páginas a scraper (default: 5)
 */

import { upsertListing, type ScrapedListing } from './utils'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const CITY_MAP: Record<string, { province: string; city: string }> = {
  madrid:    { province: 'Madrid',    city: 'Madrid' },
  barcelona: { province: 'Barcelona', city: 'Barcelona' },
  valencia:  { province: 'Valencia',  city: 'Valencia' },
  sevilla:   { province: 'Sevilla',   city: 'Sevilla' },
  zaragoza:  { province: 'Zaragoza',  city: 'Zaragoza' },
  bilbao:    { province: 'Vizcaya',   city: 'Bilbao' },
  malaga:    { province: 'Málaga',    city: 'Málaga' },
}

// Rate limiting: espera entre requests (ms)
const DELAY_MS = 1200

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      console.warn(`  ⚠️ HTTP ${res.status} para ${url}`)
      return null
    }
    return res.text()
  } catch (err) {
    console.warn(`  ⚠️ Fetch error: ${err}`)
    return null
  }
}

// Extrae todos los bloques JSON-LD de tipo SingleFamilyResidence 
function extractJsonLdListings(
  html: string
): Array<{ id: string; url: string; name: string; image: string; City: string }> {
  const results: Array<{ id: string; url: string; name: string; image: string; City: string }> = []
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(html))) {
    try {
      const d = JSON.parse(m[1])
      if (
        d['@type'] === 'SingleFamilyResidence' ||
        d['@type'] === 'Apartment' ||
        d['@type'] === 'RealEstateListing'
      ) {
        results.push({
          id: d['@id'] ?? '',
          url: d.url ?? '',
          name: d.name ?? '',
          image: d.image ?? '',
          City: d.address?.addressLocality ?? '',
        })
      }
    } catch {
      // JSON-LD inválido, ignorar
    }
  }
  return results
}

// Extrae datos del HTML de una página de detalle de pisos.com
function extractDetailData(html: string): {
  price: number | null
  area: number | null
  bedrooms: number | null
  bathrooms: number | null
  description: string | null
  images: string[]
  district: string | null
  postalCode: string | null
} {
  // Precio: del title "por 550.000 €" o de class="toolbar-mobile__price"
  let price: number | null = null
  const priceInTitle = html.match(/por\s+([\d.]+)\s*€/)
  if (priceInTitle) {
    price = parseInt(priceInTitle[1].replace(/\./g, ''), 10)
  }
  if (!price) {
    // Buscar en el HTML directo: 550.000€ o 550.000 €
    const priceRaw = html.match(/class="toolbar-mobile__price"[^>]*>\s*([\d.]+)\s*€/)
    if (priceRaw) price = parseInt(priceRaw[1].replace(/\./g, ''), 10)
  }
  if (!price) {
    // Fallback: primer precio grande en el HTML
    const m = html.match(/(\d{1,3}(?:\.\d{3})+)\s*€/)
    if (m) price = parseInt(m[1].replace(/\./g, ''), 10)
  }

  // Metros cuadrados: "64 m²" o "64m²"
  let area: number | null = null
  const areaM = html.match(/(\d+)\s*m[²2]/)
  if (areaM) area = parseInt(areaM[1], 10)

  // Habitaciones/dormitorios
  let bedrooms: number | null = null
  const bedroomsM = html.match(/(\d+)\s*(?:hab\.|habitacion|dormitor)/i)
  if (bedroomsM) bedrooms = parseInt(bedroomsM[1], 10)

  // Baños
  let bathrooms: number | null = null
  const bathroomsM = html.match(/(\d+)\s*ba[ñn]o/i)
  if (bathroomsM) bathrooms = parseInt(bathroomsM[1], 10)

  // Descripción: meta description
  let description: string | null = null
  const descM = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)
  if (descM) description = descM[1].replace(/&#x[0-9A-Fa-f]+;/g, c =>
    String.fromCharCode(parseInt(c.slice(3, -1), 16))
  ).replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()

  // Código postal
  let postalCode: string | null = null
  const pcM = html.match(/\b(0[1-9]|[1-4]\d|5[0-2])\d{3}\b/)
  if (pcM) postalCode = pcM[0]

  // Barrio/distrito de la URL o de la meta
  let district: string | null = null
  const distM = html.match(/en\s+([A-Za-záéíóúñÁÉÍÓÚÑ\s-]+?)\s+por\s+\d/)
  if (distM) district = distM[1].trim()

  // Imágenes: buscar srcset o src en img con fotos del anuncio
  const images: string[] = []
  const imgRegex = /src="(https:\/\/fotos\.imghs\.net\/[^"]+)"/g
  let imgM: RegExpExecArray | null
  const seen = new Set<string>()
  while ((imgM = imgRegex.exec(html)) && images.length < 8) {
    const url = imgM[1]
    if (!seen.has(url)) { seen.add(url); images.push(url) }
  }

  return { price, area, bedrooms, bathrooms, description, images, district, postalCode }
}

async function scrapeCity(
  operation: 'venta' | 'alquiler',
  citySlug: string,
  maxPages: number
): Promise<void> {
  const geoInfo = CITY_MAP[citySlug]
  if (!geoInfo) {
    console.error(`Ciudad no soportada: ${citySlug}`)
    return
  }

  const opLabel = operation === 'venta' ? 'sale' : 'rent'
  const opEs = operation // 'venta' | 'alquiler'
  console.log(`\n🔍 pisos.com — ${opEs} pisos/${citySlug} (hasta ${maxPages} páginas)`)

  let imported = 0
  let skipped = 0

  for (let page = 1; page <= maxPages; page++) {
    const searchUrl =
      page === 1
        ? `https://www.pisos.com/${opEs}/pisos-${citySlug}/`
        : `https://www.pisos.com/${opEs}/pisos-${citySlug}/${page}/`

    console.log(`  📄 Página ${page}: ${searchUrl}`)
    const html = await fetchHtml(searchUrl)
    if (!html) {
      console.log(`  ⚠️ No se pudo cargar la página ${page}, parando`)
      break
    }

    // Verificar que no es página de "no resultados"
    if (html.includes('No se han encontrado resultados') || html.includes('no encontramos')) {
      console.log(`  ✅ No hay más resultados en página ${page}`)
      break
    }

    const listings = extractJsonLdListings(html)
    if (listings.length === 0) {
      console.log(`  ⚠️ Sin JSON-LD listings en página ${page}, parando`)
      break
    }

    console.log(`  → ${listings.length} anuncios encontrados`)

    for (const item of listings) {
      if (!item.url) continue
      const detailUrl = item.url.startsWith('http')
        ? item.url
        : `https://www.pisos.com${item.url}`

      await sleep(DELAY_MS)

      const detailHtml = await fetchHtml(detailUrl)
      if (!detailHtml) { skipped++; continue }

      const detail = extractDetailData(detailHtml)

      // Extraer ID externo del @id en JSON-LD (ej: "63412235710.528715")
      const externalId = item.id || item.url.replace(/\//g, '_')

      // Título: limpiar HTML entities
      const title = item.name
        .replace(/&#x[0-9A-Fa-f]+;/g, c => String.fromCharCode(parseInt(c.slice(3, -1), 16)))
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#\d+;/g, c => String.fromCharCode(parseInt(c.slice(2, -1), 10)))
        .trim()

      const listing: ScrapedListing = {
        title: title || `Piso en ${opEs} – ${geoInfo.city}`,
        description: detail.description,
        price_eur: detail.price ?? undefined,
        operation: opLabel as 'sale' | 'rent',
        province: geoInfo.province,
        city: geoInfo.city,
        district: detail.district || item.City || undefined,
        postal_code: detail.postalCode ?? undefined,
        bedrooms: detail.bedrooms ?? undefined,
        bathrooms: detail.bathrooms ?? undefined,
        area_m2: detail.area ?? undefined,
        source_portal: 'pisos.com',
        source_url: detailUrl,
        source_external_id: externalId,
        is_particular: false,
        images: detail.images,
      }

      const ok = await upsertListing(listing)
      if (ok) {
        imported++
        console.log(
          `    ✅ [${imported}] ${title.slice(0, 55)} | ${detail.price?.toLocaleString('es-ES')}€ | ${detail.area}m²`
        )
      } else {
        skipped++
      }

      await sleep(DELAY_MS)
    }

    // Pausa entre páginas
    if (page < maxPages) await sleep(2000)
  }

  console.log(`\n📊 pisos.com ${opEs}/${citySlug}: ${imported} importados, ${skipped} errores`)
}

// Punto de entrada
async function main() {
  const args = process.argv.slice(2)
  const operation = (args[0] as 'venta' | 'alquiler') || 'venta'
  const city = args[1] || 'madrid'
  const maxPages = parseInt(args[2] || '5', 10)

  await scrapeCity(operation, city, maxPages)
}

main().catch(console.error)

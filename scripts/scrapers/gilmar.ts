/**
 * Scraper para Gilmar Consulting Inmobiliario
 * - Usa WordPress REST API para paginar los 3.124 inmuebles
 * - Visita la página de detalle de cada inmueble para extraer datos desde meta description
 * - Meta description de Gilmar tiene formato: "Barrio, 123m², 4 habitaciones y 2 baños por 845.000€"
 * Uso: npx tsx scripts/scrapers/gilmar.ts [operation] [maxItems]
 *   operation: venta | alquiler (default: venta) — filtra por class_list del WP post
 *   maxItems: máximo de propiedades a importar (default: 200)
 */

import { upsertListing, type ScrapedListing } from './utils'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const BASE_REST = 'https://www.gilmar.es/wp-json/wp/v2/property'
const DELAY_MS = 1000

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

interface GilmarWPItem {
  id: number
  link: string
  title: { rendered: string }
  class_list: string[]
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'application/json',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,*/*',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

// Extrae datos desde meta description + HTML de la página de detalle de Gilmar
// Meta description: "Prosperidad, 123.0m², 4 habitaciones y 2 baños por 845.000€."
function parseGilmarDetail(html: string): {
  price: number | null
  area: number | null
  bedrooms: number | null
  bathrooms: number | null
  district: string | null
  description: string | null
  images: string[]
  postalCode: string | null
} {
  // Meta description
  const metaM = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)
  const meta = metaM ? metaM[1] : ''

  // Precio: "por 845.000€" o "por 845.000 €"
  let price: number | null = null
  const priceM = meta.match(/por\s+([\d.]+)\s*€/) || html.match(/class="price"[^>]*>\s*Precio[^;]*?([\d.]+)€/)
  if (priceM) price = parseInt(priceM[1].replace(/\./g, ''), 10)

  // Área: "123.0m²" o "123 m²"
  let area: number | null = null
  const areaM = meta.match(/([\d.]+)\s*m[²2]/) || html.match(/(\d+)\s*m[²2]/)
  if (areaM) area = Math.round(parseFloat(areaM[1]))

  // Dormitorios: "4 habitaciones" — en meta siempre es "N habitaciones"
  let bedrooms: number | null = null
  const bedsM = meta.match(/(\d+)\s*habitacion/i) || html.match(/(\d+)\s*(?:Habitacion|habitacion|dormitor)/i)
  if (bedsM) bedrooms = parseInt(bedsM[1], 10)

  // Baños: "2 baños"
  let bathrooms: number | null = null
  const bathsM = meta.match(/(\d+)\s*ba[ñn]o/i) || html.match(/(\d+)\s*[Bb]a[ñn]o/i)
  if (bathsM) bathrooms = parseInt(bathsM[1], 10)

  // Barrio/distrito: primera parte de meta description antes de la coma
  let district: string | null = null
  const distM = meta.match(/^([^,]+),/)
  if (distM) district = distM[1].trim()

  // Descripción: contenido real del HTML (entre <article> o <div class="description">)
  let description: string | null = meta || null

  // Código postal
  let postalCode: string | null = null
  const pcM = html.match(/\b(0[1-9]|[1-4]\d|5[0-2])\d{3}\b/)
  if (pcM) postalCode = pcM[0]

  // Imágenes: buscar srcset img en el slider de fotos de Gilmar
  const images: string[] = []
  // Gilmar usa URLs tipo https://www.gilmar.es/.../foto.jpg o CDN
  const imgPatterns = [
    /data-src="(https:\/\/[^"]+\.(?:jpg|jpeg|webp|png)[^"]*)"/gi,
    /src="(https:\/\/[^"]*gilmar\.es[^"]*\.(?:jpg|jpeg|webp)[^"]*)"/gi,
    /"(https:\/\/images\.gilmar\.es[^"]+)"/gi,
    // OG image
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
  ]
  const seen = new Set<string>()
  for (const p of imgPatterns) {
    let imgM: RegExpExecArray | null
    while ((imgM = (p as RegExp).exec(html)) && images.length < 8) {
      const url = imgM[1]
      if (url && !seen.has(url) && !url.includes('logo') && !url.includes('favicon')) {
        seen.add(url)
        images.push(url)
      }
    }
  }

  return { price, area, bedrooms, bathrooms, district, description, images, postalCode }
}

// Inferir operación desde class_list del WP post
function inferOperation(classList: string[]): 'sale' | 'rent' | null {
  if (classList.some(c => c.includes('comprar') || c.includes('venta'))) return 'sale'
  if (classList.some(c => c.includes('alquiler') || c.includes('arrendar'))) return 'rent'
  return null
}

// Inferir ciudad/zona de la URL
function inferCityFromUrl(url: string): { city: string; province: string } {
  const cityMap: Record<string, { city: string; province: string }> = {
    madrid:       { city: 'Madrid',    province: 'Madrid' },
    barcelona:    { city: 'Barcelona', province: 'Barcelona' },
    'costa-del-sol': { city: 'Marbella', province: 'Málaga' },
    malaga:       { city: 'Málaga',    province: 'Málaga' },
    sevilla:      { city: 'Sevilla',   province: 'Sevilla' },
    valencia:     { city: 'Valencia',  province: 'Valencia' },
    cadiz:        { city: 'Cádiz',     province: 'Cádiz' },
    canarias:     { city: 'Las Palmas',province: 'Las Palmas' },
  }
  const lower = url.toLowerCase()
  for (const [key, val] of Object.entries(cityMap)) {
    if (lower.includes(key)) return val
  }
  return { city: 'España', province: 'España' }
}

async function scrapeGilmar(filterOp: 'venta' | 'alquiler' | 'all', maxItems: number): Promise<void> {
  console.log(`\n🏠 Gilmar REST API — operación: ${filterOp} | max: ${maxItems} items\n`)

  let imported = 0
  let skipped = 0
  let page = 1
  const perPage = 100

  while (imported + skipped < maxItems) {
    const url = `${BASE_REST}?per_page=${perPage}&page=${page}&_fields=id,title,link,class_list`
    console.log(`  📋 REST página ${page}: ${url}`)

    const items = await fetchJson<GilmarWPItem[]>(url)
    if (!items || items.length === 0) {
      console.log('  ✅ No hay más items en la API')
      break
    }
    console.log(`  → ${items.length} propiedades`)

    for (const item of items) {
      if (imported + skipped >= maxItems) break

      // Filtrar por operación si se pide
      const op = inferOperation(item.class_list)
      if (filterOp !== 'all' && op !== (filterOp === 'venta' ? 'sale' : 'rent')) {
        skipped++
        continue
      }

      // Si no se puede inferir la operación, asumir venta (la mayoría)
      const finalOp = op ?? 'sale'

      await sleep(DELAY_MS)

      const html = await fetchHtml(item.link)
      if (!html) { skipped++; continue }

      const detail = parseGilmarDetail(html)

      const geo = inferCityFromUrl(item.link)

      // Título: limpiar HTML entities
      const title = item.title.rendered
        .replace(/&#\d+;/g, c => String.fromCharCode(parseInt(c.slice(2, -1), 10)))
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/\s*–\s*\|\s*Gilmar.*$/, '')  // eliminar " – Madrid | Gilmar..."
        .replace(/\s*\|.*$/, '')
        .trim()

      const listing: ScrapedListing = {
        title,
        description: detail.description ?? undefined,
        price_eur: detail.price ?? undefined,
        operation: finalOp,
        province: geo.province,
        city: geo.city,
        district: detail.district ?? undefined,
        postal_code: detail.postalCode ?? undefined,
        bedrooms: detail.bedrooms ?? undefined,
        bathrooms: detail.bathrooms ?? undefined,
        area_m2: detail.area ?? undefined,
        source_portal: 'gilmar.es',
        source_url: item.link,
        source_external_id: String(item.id),
        is_particular: false,
        images: detail.images,
        external_link: item.link,
      }

      const ok = await upsertListing(listing)
      if (ok) {
        imported++
        console.log(
          `  ✅ [${imported}] ${title.slice(0, 50)} | ${detail.price?.toLocaleString('es-ES')}€ | ${detail.area}m²`
        )
      } else {
        skipped++
      }
    }

    if (items.length < perPage) {
      console.log('  ✅ Última página recibida')
      break
    }

    page++
    await sleep(2000)
  }

  console.log(`\n📊 Gilmar: ${imported} importados, ${skipped} omitidos/errores`)
}

// Punto de entrada
async function main() {
  const args = process.argv.slice(2)
  const operation = (args[0] as 'venta' | 'alquiler' | 'all') || 'venta'
  const maxItems = parseInt(args[1] || '200', 10)

  await scrapeGilmar(operation, maxItems)
}

main().catch(console.error)

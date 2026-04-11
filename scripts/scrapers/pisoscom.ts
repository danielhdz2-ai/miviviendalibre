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
  lat: number | null
  lng: number | null
  floor: string | null
} {
  // ── Precio ──────────────────────────────────────────────
  let price: number | null = null
  const priceMeta = html.match(/por\s+([\d.]+(?:\.[\d]{3})*)\s*€/)
  if (priceMeta) price = parseInt(priceMeta[1].replace(/\./g, ''), 10)
  if (!price) {
    const p1 = html.match(/([\d]{2,3}(?:\.[\d]{3})+)\s*€/)
    if (p1) price = parseInt(p1[1].replace(/\./g, ''), 10)
  }
  if (!price) {
    const p2 = html.match(/(\d{5,7})\s*€/)
    if (p2) price = parseInt(p2[1], 10)
  }

  // ── Superficie ───────────────────────────────────────────
  let area: number | null = null
  const areaM = html.match(/(\d{2,4})\s*m[²2]/)
  if (areaM) area = parseInt(areaM[1], 10)

  // ── Habitaciones ─────────────────────────────────────────
  let bedrooms: number | null = null
  const bedPats = [
    /(\d+)\s*habitaci(?:ones|ón)/i,
    /(\d+)\s*dormitori(?:os|o)/i,
    /(\d+)\s*hab\b/i,
    /"numberOfRooms"\s*:\s*(\d+)/,
    /"rooms"\s*:\s*(\d+)/,
  ]
  for (const pat of bedPats) {
    const m = html.match(pat)
    if (m) { bedrooms = parseInt(m[1], 10); break }
  }

  // ── Baños ────────────────────────────────────────────────
  let bathrooms: number | null = null
  const bathPats = [
    /(\d+)\s*ba[ñn]o/i,
    /"numberOfBathroomsTotal"\s*:\s*(\d+)/,
    /"bathrooms"\s*:\s*(\d+)/,
  ]
  for (const pat of bathPats) {
    const m = html.match(pat)
    if (m) { bathrooms = parseInt(m[1], 10); break }
  }

  // ── Descripción completa ─────────────────────────────────
  // 1) Intentar desde JSON incrustado en scripts
  let description: string | null = null
  const jsonDescPats = [
    /"texto"\s*:\s*"((?:[^"\\]|\\.)*)"/,
    /"descripcion"\s*:\s*"((?:[^"\\]|\\.)*)"/,
    /"body"\s*:\s*"((?:[^"\\]|\\.){100,})"/,
  ]
  for (const pat of jsonDescPats) {
    const m = html.match(pat)
    if (m && m[1].length > 80) {
      description = m[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\u([\da-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\"/g, '"')
        .trim()
      break
    }
  }
  // 2) Meta description (limitado a ~300 chars por pisos.com, pero es lo que hay)
  if (!description || description.length < 50) {
    const metaM = html.match(/<meta[^>]*name="description"[^>]*content="([^"]{20,})"/i)
    if (metaM) {
      description = metaM[1]
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .trim()
    }
  }

  // ── Código postal ────────────────────────────────────────
  let postalCode: string | null = null
  const pcSlug = html.match(/\/(?:comprar|alquiler|venta)\/[^/]+-(\d{5})[-_]/)
  if (pcSlug) postalCode = pcSlug[1]
  if (!postalCode) {
    const pcText = html.match(/\b(0[1-9]|[1-4]\d|5[0-2])\d{3}\b/)
    if (pcText) postalCode = pcText[0]
  }

  // ── Planta ───────────────────────────────────────────────
  let floor: string | null = null
  const floorM = html.match(/[Pp]lanta\s*[:\s]+([^\s<,;"]{1,15})/)
  if (floorM && /^\d+|Baja|Alta|B\./.test(floorM[1])) floor = floorM[1].trim()

  // ── Coordenadas ──────────────────────────────────────────
  let lat: number | null = null
  let lng: number | null = null
  const latM = html.match(/"lat(?:itude)?"\s*:\s*"?([-\d.]+)"?/i)
  const lngM = html.match(/"l(?:ng|on|ongitude)"\s*:\s*"?([-\d.]+)"?/i)
  if (latM) lat = parseFloat(latM[1])
  if (lngM) lng = parseFloat(lngM[1])

  // ── Imágenes ─────────────────────────────────────────────
  // El CDN de pisos.com (fotos.imghs.net) sirve el mismo archivo en múltiples tamaños:
  // xl-wp (~1200px), fch-wp (completo), fchm-wp (thumb), apps-wp, appswm-wp, prof-wp (logos — EXCLUIR)
  // El filename puede ser: {agent}_{externalId}_{uuid}.ext  O  {agent}_{externalId}_{seq}_{timestamp}.ext
  // Estrategia: deduplificar por filename base (sin tamaño), usar xl-wp siempre
  const images: string[] = []
  const seenFilenames = new Set<string>()

  const imgRe = /fotos\.imghs\.net\/([\w-]+)\/(\d+)\/([^"'\s)\\]+)/g
  let imgM: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((imgM = imgRe.exec(html))) {
    const size = imgM[1]
    const agent = imgM[2]
    const rest = imgM[3]

    // Excluir logos de agencias
    if (size === 'prof-wp' || rest.includes('logo') || rest.includes('Logo') || rest.includes('avatar')) continue
    // Excluir thumbnails de agencias
    if (agent === 'logos') continue

    // La "clave" es la parte sin el tamaño (agent + filename)
    const key = `${agent}/${rest}`
    if (seenFilenames.has(key)) continue
    seenFilenames.add(key)

    // Siempre usar xl-wp (alta resolución), funciona para todos los archivos del CDN
    images.push(`https://fotos.imghs.net/xl-wp/${agent}/${rest}`)
  }

  return { price, area, bedrooms, bathrooms, description, images, district: null, postalCode, lat, lng, floor }
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

      // Barrio/distrito desde el slug de la URL
      // URL: /comprar/piso-collblanc08904-63392603320_525021/
      let district: string | undefined
      const slugM = detailUrl.match(/\/(?:comprar|alquiler)\/[^-]+-([a-záéíóúñ_]{3,})\d*/i)
      if (slugM) {
        district = slugM[1].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
      }
      district = district || item.City || undefined

      // Código postal también desde la URL: piso-barrio08904
      let postalCode = detail.postalCode
      if (!postalCode) {
        const pcUrl = detailUrl.match(/(\d{5})[-_]/)
        if (pcUrl) postalCode = pcUrl[1]
      }

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
        district,
        postal_code: postalCode ?? undefined,
        bedrooms: detail.bedrooms ?? undefined,
        bathrooms: detail.bathrooms ?? undefined,
        area_m2: detail.area ?? undefined,
        lat: detail.lat ?? undefined,
        lng: detail.lng ?? undefined,
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

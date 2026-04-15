/**
 * 🔥 DIVISIÓN DE ÉLITE — Scraper Milanuncios (Inmobiliaria de Particulares)
 * Milanuncios es el portal con mayor % de particulares reales en España (~80%)
 * Usa fetch ligero (sin Playwright) aprovechando que Milanuncios tiene SSR parcial
 *
 * Uso: npx tsx scripts/scrapers/milanuncios.ts [operation] [city] [maxPages]
 *   operation: venta | alquiler (default: venta)
 *   city: madrid | barcelona | valencia | sevilla | zaragoza | bilbao | malaga (default: madrid)
 *   maxPages: número de páginas (default: 5)
 *
 * URLs base:
 *   Venta:    https://www.milanuncios.com/pisos-en-venta-en-{city}/
 *   Alquiler: https://www.milanuncios.com/pisos-en-alquiler-en-{city}/
 *   Filtro solo particulares: &demandante=par
 */

import { upsertListing, type ScrapedListing } from './utils'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Milanuncios usa slugs de ciudad diferentes
const CITY_MAP: Record<string, { province: string; city: string; slug: string }> = {
  madrid:    { province: 'Madrid',    city: 'Madrid',    slug: 'madrid' },
  barcelona: { province: 'Barcelona', city: 'Barcelona', slug: 'barcelona' },
  valencia:  { province: 'Valencia',  city: 'Valencia',  slug: 'valencia' },
  sevilla:   { province: 'Sevilla',   city: 'Sevilla',   slug: 'sevilla' },
  zaragoza:  { province: 'Zaragoza',  city: 'Zaragoza',  slug: 'zaragoza' },
  bilbao:    { province: 'Vizcaya',   city: 'Bilbao',    slug: 'bilbao' },
  malaga:    { province: 'Málaga',    city: 'Málaga',    slug: 'malaga' },
  alicante:  { province: 'Alicante',  city: 'Alicante',  slug: 'alicante' },
  murcia:    { province: 'Murcia',    city: 'Murcia',    slug: 'murcia' },
  granada:   { province: 'Granada',   city: 'Granada',   slug: 'granada' },
}

const DELAY_MS = 1500

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
        Referer: 'https://www.milanuncios.com/',
      },
      signal: AbortSignal.timeout(20000),
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

/**
 * Extrae los anuncios del HTML de listado de Milanuncios.
 * Milanuncios renderiza parcialmente en SSR: los anuncios están en
 * <article data-adid="..."> o en scripts JSON incrustados.
 */
function extractListings(html: string): Array<{ id: string; url: string; title: string }> {
  const results: Array<{ id: string; url: string; title: string }> = []

  // Estrategia 1: buscar enlaces de anuncio en el HTML
  // Patrón: href="/pisos-en-venta-en-madrid/anuncio/..."
  const linkRe = /href="(\/(?:pisos-en-(?:venta|alquiler)-en-[^/]+)\/anuncio\/[^"]+)"/g
  const seenUrls = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(html))) {
    const path = m[1]
    if (seenUrls.has(path)) continue
    seenUrls.add(path)

    // Extraer ID del slug: /pisos-en-venta-en-madrid/anuncio/titulo-del-anuncio-12345678.htm
    const idM = path.match(/-(\d{6,12})\.htm/)
    const id = idM ? idM[1] : path

    // Intentar extraer título desde el contexto cercano (title="" o aria-label="")
    const titleRe = new RegExp(
      `href="${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*(?:title|aria-label)="([^"]{5,})"`, 'i'
    )
    const titleMatch = html.match(titleRe)
    const title = titleMatch ? titleMatch[1] : ''

    results.push({ id, url: `https://www.milanuncios.com${path}`, title })
  }

  // Estrategia 2: JSON incrustado en __NEXT_DATA__ o similar
  if (results.length === 0) {
    const nextDataM = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (nextDataM) {
      try {
        const data = JSON.parse(nextDataM[1])
        // Navegar el árbol de Next.js para encontrar listings
        const str = JSON.stringify(data)
        const adRe = /"id":"(\d{6,12})"[^}]*"url":"([^"]+)"[^}]*"title":"([^"]+)"/g
        while ((m = adRe.exec(str))) {
          results.push({ id: m[1], url: m[2], title: m[3] })
        }
      } catch {
        // JSON inválido
      }
    }
  }

  return results
}

/**
 * Extrae los datos de detalle de un anuncio de Milanuncios.
 * Nota: Milanuncios tiene más info en SSR que pisos.com para particulares.
 */
function extractDetailData(html: string, url: string): {
  price: number | null
  area: number | null
  bedrooms: number | null
  bathrooms: number | null
  description: string | null
  images: string[]
  postalCode: string | null
  district: string | null
  lat: number | null
  lng: number | null
  isParticular: boolean
} {
  // ── Precio ────────────────────────────────────────────────
  let price: number | null = null
  const pricePatterns = [
    /(\d{1,3}(?:\.\d{3})*)\s*€/,
    /"price"\s*:\s*"?([\d.]+)"?/,
    /precio[^€\d]*(\d{1,3}(?:\.\d{3})*)/i,
  ]
  for (const pat of pricePatterns) {
    const m = html.match(pat)
    if (m) {
      price = parseInt(m[1].replace(/\./g, ''), 10)
      if (price > 1000) break // filtrar precios ridículos
    }
  }

  // ── Superficie ────────────────────────────────────────────
  let area: number | null = null
  const areaM = html.match(/(\d{2,4})\s*m[²2²]/)
  if (areaM) area = parseInt(areaM[1], 10)

  // ── Habitaciones ─────────────────────────────────────────
  let bedrooms: number | null = null
  const bedPats = [
    /(\d+)\s*habitaci(?:ones|ón)/i,
    /(\d+)\s*dormitori(?:os|o)/i,
    /(\d+)\s*hab\b/i,
    /"rooms"\s*:\s*(\d+)/,
    /"numberOfRooms"\s*:\s*(\d+)/,
  ]
  for (const pat of bedPats) {
    const m = html.match(pat)
    if (m) { bedrooms = parseInt(m[1], 10); break }
  }

  // ── Baños ─────────────────────────────────────────────────
  let bathrooms: number | null = null
  const bathPats = [
    /(\d+)\s*ba[ñn]o/i,
    /"bathrooms"\s*:\s*(\d+)/,
  ]
  for (const pat of bathPats) {
    const m = html.match(pat)
    if (m) { bathrooms = parseInt(m[1], 10); break }
  }

  // ── Descripción ───────────────────────────────────────────
  // Milanuncios SÍ tiene la descripción completa en el HTML (a diferencia de pisos.com)
  let description: string | null = null
  const descPatterns = [
    // Descripción en tag <p> con clase de descripción
    /<p[^>]*class="[^"]*(?:description|descripcion|ad-description)[^"]*"[^>]*>([\s\S]{50,500}?)<\/p>/i,
    // Meta description (más corta pero siempre disponible)
    /<meta[^>]*name="description"[^>]*content="([^"]{30,})"/i,
    // og:description
    /<meta[^>]*property="og:description"[^>]*content="([^"]{30,})"/i,
    // JSON incrustado
    /"description"\s*:\s*"((?:[^"\\]|\\.){50,})"/,
    /"body"\s*:\s*"((?:[^"\\]|\\.){50,})"/,
  ]
  for (const pat of descPatterns) {
    const m = html.match(pat)
    if (m) {
      description = m[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\\n/g, '\n').replace(/\\r/g, '')
        .replace(/\\u([\da-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ').trim()
      if (description.length > 30) break
    }
  }

  // ── Código postal ─────────────────────────────────────────
  let postalCode: string | null = null
  const pcM = html.match(/\b(0[1-9]|[1-4]\d|5[0-2])\d{3}\b/)
  if (pcM) postalCode = pcM[0]

  // ── Distrito/barrio ───────────────────────────────────────
  let district: string | null = null
  const distM = url.match(/en-([a-z-]{3,})-\d{5}/) || url.match(/en-([a-z-]{3,})\/anuncio/)
  if (distM) district = distM[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // ── Coordenadas ───────────────────────────────────────────
  let lat: number | null = null
  let lng: number | null = null
  const latM = html.match(/"lat(?:itude)?"\s*:\s*"?([-\d.]+)"?/i)
  const lngM = html.match(/"l(?:ng|on|ongitude)"\s*:\s*"?([-\d.]+)"?/i)
  if (latM) lat = parseFloat(latM[1])
  if (lngM) lng = parseFloat(lngM[1])

  // ── Imágenes ─────────────────────────────────────────────
  const images: string[] = []
  const seenUrls = new Set<string>()

  // Milanuncios usa CDN propio: s1.milanuncios.com/imagenes/
  const imgPatterns = [
    /https?:\/\/s\d+\.milanuncios\.com\/imagenes\/[^"'\s)>]+\.(?:jpg|jpeg|png|webp)/gi,
    /https?:\/\/cdn\.milanuncios\.com\/[^"'\s)>]+\.(?:jpg|jpeg|png|webp)/gi,
    /"image"\s*:\s*"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi,
  ]
  for (const re of imgPatterns) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(html))) {
      const url = m[1] || m[0]
      // Excluir logos y thumbnails muy pequeños
      if (url.includes('logo') || url.includes('avatar') || url.includes('profile')) continue
      if (seenUrls.has(url)) continue
      seenUrls.add(url)
      images.push(url)
    }
  }

  // ── ¿Es particular? ───────────────────────────────────────
  const lower = html.toLowerCase()
  const isParticular =
    lower.includes('particular') ||
    lower.includes('propietario') ||
    lower.includes('sin agencia') ||
    lower.includes('no agencia') ||
    lower.includes('vendo directamente')

  return { price, area, bedrooms, bathrooms, description, images, postalCode, district, lat, lng, isParticular }
}

export async function scrapeMilanuncios(
  operation: 'venta' | 'alquiler',
  citySlug: string,
  maxPages: number,
  maxItems: number = 9999
): Promise<{ inserted: number; skipped: number }> {
  const geoInfo = CITY_MAP[citySlug]
  if (!geoInfo) {
    console.error(`Ciudad no soportada: ${citySlug}. Disponibles: ${Object.keys(CITY_MAP).join(', ')}`)
    return
  }

  const opLabel = operation === 'venta' ? 'sale' : 'rent'
  const opSlug = operation === 'venta' ? 'venta' : 'alquiler'
  console.log(`\n🔥 MILANUNCIOS ÉLITE — ${operation}/${citySlug} (${maxPages} páginas)`)
  console.log(`   Filtro: &demandante=par (solo particulares)\n`)

  let imported = 0
  let skipped = 0
  let rejected = 0

  for (let page = 1; page <= maxPages; page++) {
    // demandante=par filtra solo anunciantes particulares en Milanuncios
    const searchUrl =
      `https://www.milanuncios.com/pisos-en-${opSlug}-en-${geoInfo.slug}/` +
      `?demandante=par&pagina=${page}`

    console.log(`  📄 Página ${page}: ${searchUrl}`)
    const html = await fetchHtml(searchUrl)
    if (!html) {
      console.log(`  ⚠️ No se pudo cargar la página ${page}, parando`)
      break
    }

    if (
      html.includes('No hemos encontrado') ||
      html.includes('no encontramos resultados') ||
      html.includes('0 anuncios')
    ) {
      console.log(`  ✅ Sin más resultados en página ${page}`)
      break
    }

    const listings = extractListings(html)
    if (listings.length === 0) {
      console.log(`  ⚠️ No se encontraron anuncios en página ${page} — posible bloqueo o cambio de estructura`)
      // Log del HTML para diagnóstico (solo 500 chars)
      console.log(`  🔍 HTML snippet: ${html.slice(0, 500).replace(/\n/g, ' ')}`)
      break
    }

    console.log(`  → ${listings.length} anuncios encontrados`)

    for (const item of listings) {
      await sleep(DELAY_MS)

      const detailHtml = await fetchHtml(item.url)
      if (!detailHtml) { skipped++; continue }

      const detail = extractDetailData(detailHtml, item.url)

      // Verificación extra de particular
      if (!detail.isParticular) {
        rejected++
        console.log(`    ⛔ No verificado como particular: ${item.title.slice(0, 50)}`)
        continue
      }

      // Boutique: solo anuncios con ≥5 imágenes reales
      if (detail.images.length < 5) {
        rejected++
        console.log(`    ⚠️ Solo ${detail.images.length} fotos (<5), descartado: ${item.title.slice(0, 50)}`)
        await sleep(DELAY_MS)
        continue
      }

      const listing: ScrapedListing = {
        title: item.title || `Particular Milanuncios – ${geoInfo.city}`,
        description: detail.description,
        price_eur: detail.price ?? undefined,
        operation: opLabel as 'sale' | 'rent',
        province: geoInfo.province,
        city: geoInfo.city,
        district: detail.district ?? undefined,
        postal_code: detail.postalCode ?? undefined,
        bedrooms: detail.bedrooms ?? undefined,
        bathrooms: detail.bathrooms ?? undefined,
        area_m2: detail.area ?? undefined,
        lat: detail.lat ?? undefined,
        lng: detail.lng ?? undefined,
        source_portal: 'milanuncios',
        source_url: item.url,
        source_external_id: `mila_${item.id}`,
        is_particular: true, // ✅ Siempre true
        images: detail.images,
      }

      const ok = await upsertListing(listing)
      if (ok) {
        imported++
        console.log(
          `    ✅ [${imported}/${maxItems}] 🏠 ${item.title.slice(0, 50)} | ${detail.price?.toLocaleString('es-ES')}€ | ${detail.area}m²`
        )
        if (imported >= maxItems) { console.log(`  🎯 Límite de ${maxItems} alcanzado`); break }
      } else {
        skipped++
      }

      await sleep(DELAY_MS)
    }

    if (imported >= maxItems) break
    if (page < maxPages) await sleep(3000)
  }

  console.log(`\n📊 MILANUNCIOS ${operation}/${citySlug}:`)
  console.log(`   ✅ ${imported} importados`)
  console.log(`   ⛔ ${rejected} rechazados (no verificados como particular)`)
  console.log(`   ⚠️ ${skipped} errores`)
  return { inserted: imported, skipped: rejected + skipped }
}

async function main() {
  const args = process.argv.slice(2)
  const operation = (args[0] as 'venta' | 'alquiler') || 'venta'
  const city = args[1] || 'madrid'
  const maxPages = parseInt(args[2] || '5', 10)
  const maxItems = parseInt(args[3] || '9999', 10)
  await scrapeMilanuncios(operation, city, maxPages, maxItems)
}

if (process.argv[1]?.includes('milanuncios')) {
  main().catch(console.error)
}

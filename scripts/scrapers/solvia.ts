/**
 * Scraper Solvia / Haya Real Estate — Oportunidades Bancarias
 * ─────────────────────────────────────────────────────────────
 * NOTA: haya.es fue absorbida completamente por Solvia (Intrum) en 2023.
 *       haya.es redirige ahora a solvia.es → este scraper cubre ambas marcas.
 *
 * Portafolio: activos inmobiliarios de Banco Sabadell (servicer: Intrum/Solvia)
 * Entidad bancaria mostrada: 'Banco Sabadell (Solvia/Intrum)'
 *
 * Badges propios de Solvia detectados:
 *   INMUEBLE DE BANCO   → is_bank = true (ranking +40 puntos)
 *   EN SITUACIÓN ESPECIAL, VENTA FLASH, NOVEDAD → se guardan en features
 *
 * Estructura de URLs:
 *   Listado venta:    https://www.solvia.es/es/comprar/piso/?pagina=N
 *   Listado alquiler: https://www.solvia.es/es/alquilar/piso/?pagina=N
 *   Detalle:          https://www.solvia.es/es/propiedades/{op}/{slug}-{id1}-{id2}
 *
 * CDN imágenes: cdnsolvproep.solvia.es/uploaded/img_{UUID}.ORIGINAL.jpg
 *
 * USO:
 *   npx tsx scripts/scrapers/solvia.ts [operacion] [maxPaginas]
 *   operacion:  venta | alquiler (default: venta)
 *   maxPaginas: número de páginas a intentar (default: 5, una pág. ≈ 20 pisos)
 */

import { upsertListing, type ScrapedListing } from './utils'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const BANK_ENTITY = 'Banco Sabadell (Solvia/Intrum)'
const DELAY_MS    = 1500

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
      signal: AbortSignal.timeout(20_000),
      redirect: 'follow',
    })
    if (!res.ok) {
      console.warn(`  ⚠️  HTTP ${res.status} para ${url}`)
      return null
    }
    return res.text()
  } catch (err) {
    console.warn(`  ⚠️  Fetch error: ${err}`)
    return null
  }
}

// ─── Extraer URLs de listado del HTML de la página ──────────────────────────
function extractListingUrls(html: string): Array<{ url: string; isBankBadge: boolean }> {
  const results: Array<{ url: string; isBankBadge: boolean }> = []
  const seen = new Set<string>()

  // Los hrefs de las tarjetas apuntan a /es/propiedades/{op}/{slug}-{id1}-{id2}
  const linkRe = /href="(https:\/\/www\.solvia\.es\/es\/propiedades\/[^"]+)"/g
  let m: RegExpExecArray | null

  // Extraer todos los links con contexto para detectar badge bancario
  // El texto "INMUEBLE DE BANCO" aparece en el bloque anterior al href
  while ((m = linkRe.exec(html))) {
    const url = m[1]
    if (seen.has(url)) continue
    seen.add(url)

    // Inspeccionar los ~400 chars antes del enlace para detectar el badge
    const before = html.slice(Math.max(0, m.index - 500), m.index)
    const isBankBadge = /INMUEBLE\s+DE\s+BANCO/i.test(before)

    results.push({ url, isBankBadge })
  }

  return results
}

// ─── Parsear datos de la página de detalle ──────────────────────────────────
function parseDetailPage(html: string, sourceUrl: string): {
  title: string | null
  description: string | null
  price: number | null
  area: number | null
  bedrooms: number | null
  bathrooms: number | null
  province: string | null
  city: string | null
  district: string | null
  postalCode: string | null
  lat: number | null
  lng: number | null
  images: string[]
  isBankProperty: boolean
  specialBadge: string | null
} {
  // ── Título ─────────────────────────────────────────────────────────────────
  let title: string | null = null
  const h1m = html.match(/<h1[^>]*>([^<]{10,200})<\/h1>/i)
  if (h1m) title = h1m[1].replace(/\s+/g, ' ').trim()
  if (!title) {
    const metaTitle = html.match(/<title>([^<]{10,200})<\/title>/i)
    if (metaTitle) title = metaTitle[1].split('|')[0].trim()
  }
  if (!title) {
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]{10,200})"/i)
    if (ogTitle) title = ogTitle[1].trim()
  }

  // ── Descripción ────────────────────────────────────────────────────────────
  let description: string | null = null
  // JSON-LD (común en Solvia)
  const ldBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? []
  for (const block of ldBlocks) {
    const inner = block.replace(/<\/?script[^>]*>/gi, '')
    try {
      const obj = JSON.parse(inner)
      const candidate = obj.description ?? obj['@graph']?.[0]?.description
      if (typeof candidate === 'string' && candidate.length > 60) {
        description = candidate.trim()
        break
      }
    } catch { /* ignorar */ }
  }
  if (!description) {
    const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]{40,}?)"/i)
    if (metaDesc) description = metaDesc[1].trim()
  }

  // ── Precio ─────────────────────────────────────────────────────────────────
  let price: number | null = null
  // "Desde 220.000 €", "220.000€", "80.000€"
  const pricePats = [
    /(?:Desde\s+|Precio de salida\s*)?([\d]{2,3}(?:\.[\d]{3})+)\s*€/,
    /(\d{5,7})\s*€/,
  ]
  for (const p of pricePats) {
    const pm = html.match(p)
    if (pm) { price = parseInt(pm[1].replace(/\./g, ''), 10); break }
  }

  // ── Superficie ─────────────────────────────────────────────────────────────
  let area: number | null = null
  const areaPats = [
    /"floorSize"\s*:\s*\{[^}]*"value"\s*:\s*"?([\d.]+)/i,
    /(\d{2,4}(?:\.\d{1,2})?)\s*m[²2]/,
  ]
  for (const p of areaPats) {
    const am = html.match(p)
    if (am) { area = parseFloat(am[1].replace(',', '.')); break }
  }

  // ── Habitaciones ───────────────────────────────────────────────────────────
  let bedrooms: number | null = null
  // Desde URL: /{slug}-{N}-dormitorios-{id1}-{id2}
  const bedsFromUrl = sourceUrl.match(/-(\d+)-dormitorios-/)
  if (bedsFromUrl) bedrooms = parseInt(bedsFromUrl[1], 10)
  if (!bedrooms) {
    const bedPats = [
      /"numberOfRooms"\s*:\s*(\d+)/,
      /(\d+)\s*dormitori(?:os|o)/i,
      /(\d+)\s*habitaci(?:ones|ón)/i,
    ]
    for (const p of bedPats) {
      const bm = html.match(p)
      if (bm) { bedrooms = parseInt(bm[1], 10); break }
    }
  }

  // ── Baños ──────────────────────────────────────────────────────────────────
  let bathrooms: number | null = null
  const bathPats = [
    /"numberOfBathroomsTotal"\s*:\s*(\d+)/,
    /(\d+)\s*baño/i,
  ]
  for (const p of bathPats) {
    const bm = html.match(p)
    if (bm) { bathrooms = parseInt(bm[1], 10); break }
  }

  // ── Provincia + Ciudad ─────────────────────────────────────────────────────
  // Título de detalle: "Piso en venta, C/ Calle, Ciudad, Provincia M12345"
  let province: string | null = null
  let city: string | null = null
  let district: string | null = null

  // Desde JSON-LD address
  for (const block of ldBlocks) {
    const inner = block.replace(/<\/?script[^>]*>/gi, '')
    try {
      const obj = JSON.parse(inner)
      const addr = obj.address ?? obj['@graph']?.[0]?.address
      if (addr) {
        province = addr.addressRegion ?? province
        city     = addr.addressLocality ?? city
        break
      }
    } catch { /* ignorar */ }
  }
  // Fallback: desde el title "... Olot - Girona" o "Madrid , Escorial (El)"
  if (!province || !city) {
    // Formato de lista: "Girona , Olot - C/ X" → province = Girona, city = Olot
    const locM = html.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s/()]+)\s*,\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s()]+)\s*-\s*/)
    if (locM) { province = locM[1].trim(); city = locM[2].trim() }
  }

  // ── Código postal ──────────────────────────────────────────────────────────
  let postalCode: string | null = null
  const pcm = html.match(/"postalCode"\s*:\s*"(\d{5})"/)
    ?? html.match(/\b(0[1-9]|[1-4]\d|5[0-2])\d{3}\b/)
  if (pcm) postalCode = pcm[1]

  // ── Coordenadas ────────────────────────────────────────────────────────────
  let lat: number | null = null
  let lng: number | null = null
  const latm = html.match(/"lat(?:itude)?"\s*:\s*"?([-\d.]+)"?/i)
  const lngm = html.match(/"l(?:ng|on|ongitude)"\s*:\s*"?([-\d.]+)"?/i)
  if (latm) lat = parseFloat(latm[1])
  if (lngm) lng = parseFloat(lngm[1])

  // ── Imágenes ───────────────────────────────────────────────────────────────
  const images: string[] = []
  const seenImgs = new Set<string>()
  // CDN: cdnsolvproep.solvia.es/uploaded/img_{UUID}.ORIGINAL.jpg
  const imgRe = /https:\/\/cdnsolvproep\.solvia\.es\/uploaded\/([^"'\s\\]+)/g
  let im: RegExpExecArray | null
  while ((im = imgRe.exec(html))) {
    const raw = im[0]
    // Normalizar a .ORIGINAL.jpg (máxima calidad)
    const normalized = raw.replace(/\.(ORIGINAL|jpg|jpeg|png|webp)/i, '.ORIGINAL.jpg')
      .split('?')[0]
    if (!seenImgs.has(normalized)) {
      seenImgs.add(normalized)
      images.push(normalized)
    }
  }
  // Fallback: Open Graph image
  if (images.length === 0) {
    const ogImg = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    if (ogImg) images.push(ogImg[1])
  }

  // ── Badges bancarios y especiales ─────────────────────────────────────────
  const isBankProperty = /INMUEBLE\s+DE\s+BANCO/i.test(html)
  let specialBadge: string | null = null
  if (/EN\s+SITUACI[ÓO]N\s+ESPECIAL/i.test(html)) specialBadge = 'EN SITUACIÓN ESPECIAL'
  else if (/VENTA\s+FLASH/i.test(html)) specialBadge = 'VENTA FLASH'
  else if (/NOVEDAD/i.test(html)) specialBadge = 'NOVEDAD'

  return {
    title, description, price, area, bedrooms, bathrooms,
    province, city, district, postalCode, lat, lng, images,
    isBankProperty, specialBadge,
  }
}

// ─── Scraper principal ───────────────────────────────────────────────────────
async function scrapeSolvia(operation: 'venta' | 'alquiler', maxPages: number) {
  const opEs   = operation === 'venta' ? 'comprar' : 'alquilar'
  const opLabel: 'sale' | 'rent' = operation === 'venta' ? 'sale' : 'rent'

  console.log(`\n🏦 Solvia (Banco Sabadell) — ${operation} pisos (hasta ${maxPages} páginas)`)

  let imported = 0; let skipped = 0
  const seenUrls = new Set<string>()

  for (let page = 1; page <= maxPages; page++) {
    const listUrl = `https://www.solvia.es/es/${opEs}/piso/?pagina=${page}`
    console.log(`  📄 Página ${page}: ${listUrl}`)

    const listHtml = await fetchHtml(listUrl)
    if (!listHtml) { console.log('  ⚠️  Sin respuesta, parando'); break }

    if (listHtml.includes('No hemos encontrado resultados') || listHtml.includes('sin resultados')) {
      console.log('  ✅ Sin más resultados'); break
    }

    const items = extractListingUrls(listHtml)
    const newItems = items.filter(it => !seenUrls.has(it.url))

    if (newItems.length === 0) {
      console.log('  ⚠️  Sin URLs nuevas (paginación JS no soportada en modo fetch) — parando')
      break
    }

    console.log(`  → ${newItems.length} anuncios nuevos encontrados`)

    for (const it of newItems) {
      seenUrls.add(it.url)
      await sleep(DELAY_MS)

      const detailHtml = await fetchHtml(it.url)
      if (!detailHtml) { skipped++; continue }

      const d = parseDetailPage(detailHtml, it.url)

      // El external ID es el último número en la URL: …-161982-199642 → 199642
      const extIdM = it.url.match(/-(\d+)$/)
      const externalId = `solvia_${extIdM ? extIdM[1] : it.url.split('/').pop()}`

      const isBankProp = it.isBankBadge || d.isBankProperty

      const features: Record<string, string> = {}
      if (d.specialBadge) features.badge_solvia = d.specialBadge

      const listing: ScrapedListing = {
        title:       d.title ?? `Piso en ${operation} — Solvia`,
        description: d.description ?? undefined,
        price_eur:   d.price ?? undefined,
        operation:   opLabel,
        province:    d.province ?? undefined,
        city:        d.city ?? undefined,
        district:    d.district ?? undefined,
        postal_code: d.postalCode ?? undefined,
        lat:         d.lat ?? undefined,
        lng:         d.lng ?? undefined,
        bedrooms:    d.bedrooms ?? undefined,
        bathrooms:   d.bathrooms ?? undefined,
        area_m2:     d.area ?? undefined,
        source_portal: 'solvia.es',
        source_url:    it.url,
        source_external_id: externalId,
        is_particular: false,
        is_bank:       isBankProp,
        bank_entity:   BANK_ENTITY,
        images:        d.images,
        features,
      }

      const ok = await upsertListing(listing)
      if (ok) {
        imported++
        const bankTag = isBankProp ? '🏦 ' : ''
        console.log(
          `    ✅ [${imported}] ${bankTag}${(d.title ?? '').slice(0, 55)} | ${d.price?.toLocaleString('es-ES') ?? '?'}€ | ${d.area ?? '?'}m²`
        )
      } else {
        skipped++
      }
    }

    console.log(`  📊 Página ${page}: importados ${imported}, saltados ${skipped}`)
    await sleep(DELAY_MS * 2)
  }

  console.log(`\n✅ Solvia — TOTAL: ${imported} importados, ${skipped} saltados`)
}

// ─── Entry point ─────────────────────────────────────────────────────────────
const [op = 'venta', maxPagesStr = '5'] = process.argv.slice(2)
if (op !== 'venta' && op !== 'alquiler') {
  console.error('❌ Operación inválida. Usa: venta | alquiler')
  process.exit(1)
}
scrapeSolvia(op, parseInt(maxPagesStr, 10))

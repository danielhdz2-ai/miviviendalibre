/**
 * Scraper DEDICADO a particulares de pisos.com
 *
 * URL base:  /alquiler/pisos-{city}/particulares/
 *            /venta/pisos-{city}/particulares/
 *
 * Reglas de negocio:
 *  - Solo anuncios con precio Y con fotos (descarta los demás).
 *  - Siempre is_particular = true.
 *  - Descripción completa: hasta 3000 chars sin recortar.
 *  - Imágenes: galería completa desde CDN xl-wp (alta resolución).
 *
 * Uso:
 *   npx tsx scripts/scrapers/pisoscom_particulares.ts [op] [city] [maxPages]
 *   op: venta | alquiler   (defecto: alquiler)
 *   city: madrid | barcelona | valencia | sevilla | zaragoza | bilbao | malaga | granada | murcia | alicante
 *   maxPages: número máximo de páginas (defecto: 6)
 *
 * Ejemplo:
 *   npx tsx scripts/scrapers/pisoscom_particulares.ts alquiler madrid 6
 */

import { upsertListing, extractPhone, type ScrapedListing } from './utils'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ─────────────────────────────────────────────────────────────────────────────
// Ciudades soportadas
// ─────────────────────────────────────────────────────────────────────────────
const CITY_MAP: Record<string, { province: string; city: string }> = {
  madrid:    { province: 'Madrid',    city: 'Madrid' },
  barcelona: { province: 'Barcelona', city: 'Barcelona' },
  valencia:  { province: 'Valencia',  city: 'Valencia' },
  sevilla:   { province: 'Sevilla',   city: 'Sevilla' },
  zaragoza:  { province: 'Zaragoza',  city: 'Zaragoza' },
  bilbao:    { province: 'Vizcaya',   city: 'Bilbao' },
  malaga:    { province: 'Málaga',    city: 'Málaga' },
  granada:   { province: 'Granada',   city: 'Granada' },
  murcia:    { province: 'Murcia',    city: 'Murcia' },
  alicante:  { province: 'Alicante',  city: 'Alicante' },
  valladolid:{ province: 'Valladolid',city: 'Valladolid' },
  pamplona:  { province: 'Navarra',   city: 'Pamplona' },
  santander: { province: 'Cantabria', city: 'Santander' },
  cordoba:   { province: 'Córdoba',   city: 'Córdoba' },
}

/** Delay entre peticiones para no sobrecargar el servidor */
const DELAY_MS = 1300

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────────────────────────────────────
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Cache-Control': 'no-cache',
        Referer: 'https://www.pisos.com/',
      },
      signal: AbortSignal.timeout(18000),
    })
    if (!res.ok) {
      console.warn(`  ⚠️ HTTP ${res.status} → ${url}`)
      return null
    }
    return res.text()
  } catch (err) {
    console.warn(`  ⚠️ Fetch error: ${err}`)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Extrae las URLs de detalle de la página de resultados
// pisos.com sirve URLs RELATIVAS en los hrefs y en el JSON-LD
// ─────────────────────────────────────────────────────────────────────────────
function extractListingUrls(html: string, opEs: string): string[] {
  const BASE = 'https://www.pisos.com'
  const urls = new Set<string>()
  const hrefVerb = opEs === 'venta' ? 'comprar' : 'alquilar'

  /** Normaliza a URL absoluta con trailing slash */
  const canonicalize = (u: string): string => {
    const abs = u.startsWith('http') ? u : `${BASE}${u}`
    return abs.endsWith('/') ? abs : `${abs}/`
  }

  // 1) JSON-LD — URLs pueden ser relativas o absolutas
  const jsonRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = jsonRe.exec(html))) {
    try {
      const d = JSON.parse(m[1])
      const addUrl = (u: string | undefined) => {
        if (!u) return
        const abs = canonicalize(u)
        if (abs.includes(`/${hrefVerb}/`)) urls.add(abs)
      }
      addUrl(d.url)
      if (Array.isArray(d.itemListElement)) {
        for (const item of d.itemListElement) {
          addUrl(item.url)
          addUrl(item.item?.url)
        }
      }
    } catch { /* ignorar JSON inválido */ }
  }

  // 2) href relativo — patrón: href="/{hrefVerb}/{tipo}-{barrio}-{numId}_{agentId}/"
  const hrefRe = new RegExp(
    `href="(/${hrefVerb}/[\\w-]+-[\\w.-]+-\\d{6,}_\\d{4,}/?)"`,
    'gi'
  )
  let hm: RegExpExecArray | null
  while ((hm = hrefRe.exec(html))) {
    urls.add(canonicalize(hm[1]))
  }

  return [...urls]
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsea el HTML de una página de DETALLE
// ─────────────────────────────────────────────────────────────────────────────
function parseDetail(html: string): {
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
  areaUseful: number | null
  referenceId: string | null
  isParticularConfirmed: boolean
  phone: string | null
} {
  // ── Verificar que el anunciante es particular ──────────
  const isParticularConfirmed = /Anunciante\s+particular/i.test(html)

  // ── Precio ───────────────────────────────────────────
  let price: number | null = null
  const pricePat = [
    /(\d{1,3}(?:\.\d{3})+)\s*€/,   // 1.200 € o 250.000 €
    /(\d{4,7})\s*€/,                // 1200€ o 250000€
    /"price"\s*:\s*"?([\d.]+)"?/,   // JSON-LD
    /"precio"\s*:\s*"?([\d.]+)"?/,  // JSON incrustado
  ]
  for (const p of pricePat) {
    const pm = html.match(p)
    if (pm) {
      const raw = pm[1].replace(/\./g, '')
      const val = parseInt(raw, 10)
      if (val > 0) { price = val; break }
    }
  }

  // ── Superficie ───────────────────────────────────────
  let area: number | null = null
  const areaPat = [
    /(\d{2,4})\s*m[²2]/,
    /"floorSize"\s*:\s*\{\s*"value"\s*:\s*"?(\d+)/,
    /"superficie"\s*:\s*"?(\d+)/i,
  ]
  for (const p of areaPat) {
    const am = html.match(p)
    if (am) { area = parseInt(am[1], 10); break }
  }

  // ── Habitaciones ─────────────────────────────────────
  let bedrooms: number | null = null
  const bedPat = [
    /(\d+)\s*habitaci(?:ones|[oó]n)/i,
    /(\d+)\s*dormitori(?:os|o)/i,
    /"numberOfRooms"\s*:\s*(\d+)/,
    /"habitaciones"\s*:\s*"?(\d+)/i,
    /(\d+)\s*habs?\b/i,
  ]
  for (const p of bedPat) {
    const bm = html.match(p)
    if (bm) { bedrooms = parseInt(bm[1], 10); break }
  }

  // ── Baños ────────────────────────────────────────────
  let bathrooms: number | null = null
  const bathPat = [
    /(\d+)\s*ba[ñn]o/i,
    /"numberOfBathroomsTotal"\s*:\s*(\d+)/,
    /"banos"\s*:\s*"?(\d+)/i,
  ]
  for (const p of bathPat) {
    const bm = html.match(p)
    if (bm) { bathrooms = parseInt(bm[1], 10); break }
  }

  // ── Planta ───────────────────────────────────────────
  let floor: string | null = null
  const floorPat = [
    /"planta"\s*:\s*"([^"]{1,20})"/i,
    /[Pp]lanta\s*[:\s]+([^\s<,;"]{1,15})/,
  ]
  for (const p of floorPat) {
    const fm = html.match(p)
    if (fm && /^\d|[Bb]aj|[Aa]lt|[Áá]tic|[Ee]ntr|[Ss]emi/.test(fm[1])) { floor = fm[1].trim(); break }
  }

  // ── Superficie útil ──────────────────────────────────
  let areaUseful: number | null = null
  const areaUsefulPat = [
    /superficieUtil(?:es)?"\s*:\s*"?(\d+)/i,
    /[Ss]uperficie\s+[úu]til\s*[:\s.,]*(\d{2,4})\s*m/,
  ]
  for (const p of areaUsefulPat) {
    const am = html.match(p)
    if (am) { areaUseful = parseInt(am[1], 10); break }
  }

  // ── Referencia ───────────────────────────────────────
  let referenceId: string | null = null
  const refPat = [
    /"referencia"\s*:\s*"([^"]{2,30})"/i,
    /[Rr]eferencia[:\s]+(\w{3,20})/,
  ]
  for (const p of refPat) {
    const rm = html.match(p)
    if (rm) { referenceId = rm[1].trim(); break }
  }

  // ── Coordenadas ──────────────────────────────────────
  let lat: number | null = null
  let lng: number | null = null
  const latM = html.match(/"lat(?:itude)?"\s*:\s*"?([-\d.]{4,})"/i)
  const lngM = html.match(/"l(?:ng|on|ongitude)"\s*:\s*"?([-\d.]{4,})"/i)
  if (latM) lat = parseFloat(latM[1])
  if (lngM) lng = parseFloat(lngM[1])

  // ── Código postal ────────────────────────────────────
  let postalCode: string | null = null
  const pcPat = html.match(/\b(0[1-9]|[1-4]\d|5[0-2])\d{3}\b/)
  if (pcPat) postalCode = pcPat[0]

  // ── Descripción COMPLETA ──────────────────────────────
  // Prioridad: JSON incrustado > JSON-LD > meta description
  let description: string | null = null

  // 1) JSON incrustado con campo de texto largo
  const jsonDescPat = [
    /"texto"\s*:\s*"((?:[^"\\]|\\.){80,})"/,
    /"descripcion"\s*:\s*"((?:[^"\\]|\\.){80,})"/,
    /"description"\s*:\s*"((?:[^"\\]|\\.){80,})"/,
    /"body"\s*:\s*"((?:[^"\\]|\\.){80,})"/,
  ]
  for (const p of jsonDescPat) {
    const dm = html.match(p)
    if (dm && dm[1].length > 80) {
      description = dm[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\u([\da-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\"/g, '"')
        .replace(/\\t/g, ' ')
        .trim()
      break
    }
  }

  // 2) JSON-LD description (suele ser la más completa en pisos.com)
  if (!description || description.length < 80) {
    const ldBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? []
    for (const block of ldBlocks) {
      const inner = block.replace(/<\/?script[^>]*>/gi, '')
      try {
        const obj = JSON.parse(inner)
        const candidate: string | undefined =
          obj.description ?? obj['@graph']?.[0]?.description
        if (typeof candidate === 'string' && candidate.length > (description?.length ?? 0)) {
          description = candidate.trim()
        }
      } catch { /* ignorar */ }
    }
  }

  // 3) Meta description (fallback)
  if (!description || description.length < 50) {
    const mm = html.match(/<meta[^>]*name="description"[^>]*content="([^"]{20,})"/i)
    if (mm) {
      description = mm[1]
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .trim()
    }
  }

  // Limitar a 3000 chars preservando texto completo
  if (description && description.length > 3000) {
    description = description.slice(0, 3000).trimEnd()
  }

  // ── Imágenes ─────────────────────────────────────────
  // CDN de pisos.com: fotos.imghs.net/{size}/{agentId}/{externalListingId}/{filename}
  // Tamaños: xl-wp (1200px), fch-wp (full), fchm-wp (thumb), m-wp (card), prof-wp (logos)
  // Excluir: prof-wp (logos agencias), avatar, logo
  const images: string[] = []
  const seenKeys = new Set<string>()

  const imgRe = /fotos\.imghs\.net\/([\w-]+)\/(\d+)\/(\d+)\/([\w._-]+)/g
  let imgM: RegExpExecArray | null
  while ((imgM = imgRe.exec(html))) {
    const size     = imgM[1]
    const agentId  = imgM[2]
    const listingN = imgM[3]
    const filename = imgM[4]

    // Excluir logos de agencias y avatares
    if (size === 'prof-wp') continue
    if (/logo|Logo|avatar|Avatar/.test(filename)) continue

    // Deduplicar por clave agente+listing+filename
    const key = `${agentId}/${listingN}/${filename}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)

    // Usar siempre xl-wp (alta resolución, compatible con todos los archivos del CDN)
    images.push(`https://fotos.imghs.net/xl-wp/${agentId}/${listingN}/${filename}`)
  }

  return {
    price,
    area,
    bedrooms,
    bathrooms,
    description,
    images,
    district: null,
    postalCode,
    lat,
    lng,
    floor,
    areaUseful,
    referenceId,
    isParticularConfirmed,
    phone: extractPhone(html),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Extrae el external_id del URL de detalle
// URL: /alquilar/piso-barrio08001-63412235710_528715/  → "63412235710.528715"
// ─────────────────────────────────────────────────────────────────────────────
function extractExternalId(url: string): string {
  const m = url.match(/[/-](\d{8,})_(\d{4,})\//)
  if (m) return `${m[1]}.${m[2]}`
  return url.replace(/\//g, '_').slice(-40)
}

// ─────────────────────────────────────────────────────────────────────────────
// Scraper principal
// ─────────────────────────────────────────────────────────────────────────────
export async function scrapeParticulares(
  operation: 'venta' | 'alquiler',
  citySlug: string,
  maxPages: number,
  maxItems: number = 9999
): Promise<{ inserted: number; skipped: number }> {
  const geoInfo = CITY_MAP[citySlug]
  if (!geoInfo) {
    console.error(`❌ Ciudad no soportada: ${citySlug}`)
    console.error(`   Ciudades disponibles: ${Object.keys(CITY_MAP).join(', ')}`)
    return
  }

  const opLabel  = operation === 'venta' ? 'sale' : 'rent'
  console.log(`\n🏠 pisos.com PARTICULARES — ${operation}/${citySlug} (hasta ${maxPages} pág.)`)
  console.log('─'.repeat(60))

  let imported  = 0
  let skipped   = 0
  let discarded = 0   // sin precio o sin fotos
  console.log(`   Límite: ${maxItems} anuncios nuevos con foto`)

  for (let page = 1; page <= maxPages; page++) {
    const searchUrl =
      page === 1
        ? `https://www.pisos.com/${operation}/pisos-${citySlug}/particulares/`
        : `https://www.pisos.com/${operation}/pisos-${citySlug}/particulares/${page}/`

    console.log(`\n  📄 Página ${page}: ${searchUrl}`)
    const html = await fetchHtml(searchUrl)
    if (!html) {
      console.log('  ⛔ Sin respuesta, deteniendo')
      break
    }

    if (
      html.includes('No se han encontrado resultados') ||
      html.includes('no encontramos')
    ) {
      console.log('  ✅ No hay más resultados')
      break
    }

    const listingUrls = extractListingUrls(html, operation)
    if (listingUrls.length === 0) {
      console.log('  ⚠️ Sin URLs de anuncios en esta página, deteniendo')
      break
    }

    console.log(`  → ${listingUrls.length} anuncios encontrados`)

    for (const detailUrl of listingUrls) {
      await sleep(DELAY_MS)

      const detailHtml = await fetchHtml(detailUrl)
      if (!detailHtml) { skipped++; continue }

      const detail = parseDetail(detailHtml)

      // ── Validación crítica ──────────────────────────────
      if (!detail.price) {
        discarded++
        console.log(`    ⚠️ [DESCARTADO - sin precio] ${detailUrl.slice(30, 80)}`)
        continue
      }
      if (detail.images.length === 0) {
        discarded++
        console.log(`    ⚠️ [DESCARTADO - sin fotos] ${detailUrl.slice(30, 80)}`)
        continue
      }
      if (!detail.isParticularConfirmed) {
        discarded++
        console.log(`    ⚠️ [DESCARTADO - agencia] ${detailUrl.slice(30, 80)}`)
        continue
      }

      // Título desde URL + ciudad fallback
      // URL: /alquilar/piso-sant_gervasi_galvany08006-62574760584_109800/
      let title = ''
      const slugTitleM = detailUrl.match(/\/(?:alquilar|comprar)\/([^/]+)\//)
      if (slugTitleM) {
        title = slugTitleM[1]
          .replace(/[-_]/g, ' ')
          .replace(/\d{4,}/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase())
      }
      title = title || `Piso en ${operation} – ${geoInfo.city}`

      // Barrio / distrito desde slug de la URL
      let district: string | undefined
      const districtM = detailUrl.match(/\/(?:alquilar|comprar)\/[^-]+-([a-z\u00e0-\u00ff_]{4,})\d*/i)
      if (districtM) {
        district = districtM[1]
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
          .trim()
      }

      // Código postal también desde la URL si no está en el HTML
      let postalCode = detail.postalCode
      if (!postalCode) {
        const pcUrl = detailUrl.match(/(\d{5})[-_]/)
        if (pcUrl) postalCode = pcUrl[1]
      }

      const externalId = extractExternalId(detailUrl)

      const listing: ScrapedListing = {
        title,
        description: detail.description ?? undefined,
        price_eur:   detail.price,
        operation:   opLabel as 'sale' | 'rent',
        province:    geoInfo.province,
        city:        geoInfo.city,
        district,
        postal_code: postalCode ?? undefined,
        bedrooms:    detail.bedrooms   ?? undefined,
        bathrooms:   detail.bathrooms  ?? undefined,
        area_m2:     detail.area       ?? undefined,
        lat:         detail.lat        ?? undefined,
        lng:         detail.lng        ?? undefined,
        source_portal:     'pisos.com',
        source_url:         detailUrl,
        source_external_id: externalId,
        is_particular:      true,   // Confirmado por "Anunciante particular" en el HTML
        images:             detail.images,
        external_link:      detailUrl,
        phone:              detail.phone ?? undefined,
      }

      const ok = await upsertListing(listing)
      if (ok) {
        imported++
        const priceLabel = detail.price.toLocaleString('es-ES')
        const conf = detail.isParticularConfirmed ? '✓particular' : '~particular'
        console.log(
          `    ✅ [${imported}/${maxItems}] ${title.slice(0, 48).padEnd(48)} ` +
          `${priceLabel.padStart(8)}€ | ${detail.area ?? '?'}m² | ` +
          `🖼️ ${detail.images.length} | ${conf}`
        )
        if (imported >= maxItems) { console.log(`  🎯 Límite de ${maxItems} alcanzado`); break }
      } else {
        skipped++
      }

      await sleep(DELAY_MS)
    }

    if (imported >= maxItems) break
    if (page < maxPages) await sleep(2200)
  }

  console.log('\n' + '─'.repeat(60))
  console.log(
    `📊 pisos.com particulares ${operation}/${citySlug}: ` +
    `${imported} importados | ${discarded} descartados (sin precio/fotos/agencia) | ${skipped} errores`
  )
  return { inserted: imported, skipped: discarded + skipped }
}

// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  const operation = (args[0] as 'venta' | 'alquiler') || 'alquiler'
  const city      = args[1] || 'madrid'
  const maxPages  = parseInt(args[2] || '6', 10)
  const maxItems  = parseInt(args[3] || '9999', 10)

  if (!['venta', 'alquiler'].includes(operation)) {
    console.error(`❌ Operación inválida: ${operation}. Usa 'venta' o 'alquiler'`)
    process.exit(1)
  }

  await scrapeParticulares(operation, city, maxPages, maxItems)
}

if (process.argv[1]?.includes('pisoscom_particulares')) {
  main().catch(console.error)
}

/**
 * Scraper yaencontre.com — Pisos de particulares (alquiler y venta)
 * ──────────────────────────────────────────────────────────────────
 * yaencontre.com es el 3er mayor portal inmobiliario en España (~300k+ anuncios).
 * Usa Cloudflare con TLS fingerprinting → requiere Playwright + StealthPlugin.
 *
 * Filtro nativo /e-particulares excluye agencias.
 * El prefijo 'u' en la URL del anuncio confirma que es particular:
 *   Particular: .../inmueble-u{advId}_{listingId}   (prefijo 'u', separador '_')
 *   Agencia:    .../inmueble-{agencyId}-{listingId}  (sin 'u', separador '-')
 *
 * CDN imágenes:
 *   https://media.yaencontre.com/img/photo/w630/{folder}/{folder}-{listingId}-{seq}.jpg.webp
 *
 * USO:
 *   npx tsx scripts/scrapers/yaencontre.ts [op] [provincia] [maxPages] [maxItems]
 *   op:       venta | alquiler   (default: alquiler)
 *   provincia: madrid | barcelona | valencia | sevilla | malaga | bilbao |
 *              zaragoza | alicante | murcia | granada | cordoba | cadiz
 *   maxPages: máximo de páginas de listado a visitar (default: 5)
 *   maxItems: máximo de anuncios a importar en este run (default: 9999)
 *
 * Ejemplos:
 *   npx tsx scripts/scrapers/yaencontre.ts alquiler madrid 3
 *   npx tsx scripts/scrapers/yaencontre.ts venta barcelona 2 10
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { upsertListing, extractAmenities, type ScrapedListing } from './utils'

chromium.use(StealthPlugin())

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** ms de pausa entre requests para no disparar rate limiting */
const DELAY_MS = 2500

// ─────────────────────────────────────────────────────────────────────────────
// Mapa de provincias/ciudades → slug de URL de yaencontre
// ─────────────────────────────────────────────────────────────────────────────
const PROVINCE_MAP: Record<string, { slug: string; province: string; city: string }> = {
  madrid:    { slug: 'madrid-provincia',     province: 'Madrid',    city: 'Madrid'    },
  barcelona: { slug: 'barcelona-provincia',  province: 'Barcelona', city: 'Barcelona' },
  valencia:  { slug: 'valencia-provincia',   province: 'Valencia',  city: 'Valencia'  },
  sevilla:   { slug: 'sevilla-provincia',    province: 'Sevilla',   city: 'Sevilla'   },
  malaga:    { slug: 'malaga-provincia',     province: 'Málaga',    city: 'Málaga'    },
  bilbao:    { slug: 'vizcaya-provincia',    province: 'Vizcaya',   city: 'Bilbao'    },
  zaragoza:  { slug: 'zaragoza-provincia',   province: 'Zaragoza',  city: 'Zaragoza'  },
  alicante:  { slug: 'alicante-provincia',   province: 'Alicante',  city: 'Alicante'  },
  murcia:    { slug: 'murcia-provincia',     province: 'Murcia',    city: 'Murcia'    },
  granada:   { slug: 'granada-provincia',    province: 'Granada',   city: 'Granada'   },
  cordoba:   { slug: 'cordoba-provincia',    province: 'Córdoba',   city: 'Córdoba'   },
  cadiz:     { slug: 'cadiz-provincia',      province: 'Cádiz',     city: 'Cádiz'     },
  tenerife:  { slug: 'tenerife-provincia',   province: 'Tenerife',  city: 'Santa Cruz de Tenerife' },
  palmas:    { slug: 'las-palmas-provincia', province: 'Las Palmas',city: 'Las Palmas de Gran Canaria' },
}

// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Obtiene el HTML de una URL.
 * Reutiliza el mismo contexto Playwright para que las cookies de Cloudflare
 * persistan entre peticiones (crítico para pasar el JS challenge).
 */
async function getHtml(
  page: import('playwright').Page,
  url: string,
): Promise<string | null> {
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    if (!resp) {
      console.warn(`  ⚠️ Sin respuesta → ${url}`)
      return null
    }
    // Espera breve para que DataDome resuelva el JS challenge si lo hay
    await sleep(1500)
    const finalUrl = page.url()
    if (finalUrl.includes('challenge') || finalUrl.includes('/cdn-cgi/')) {
      console.warn(`  ⚠️ Challenge detectado → ${finalUrl}`)
      return null
    }
    const status = resp.status()
    if (status >= 400) {
      const snippet = (await page.content()).slice(0, 300).replace(/\s+/g, ' ')
      console.warn(`  ⚠️ HTTP ${status} → ${url}`)
      console.warn(`  📄 Snippet: ${snippet}`)
      return null
    }
    return await page.content()
  } catch (err) {
    console.warn(`  ⚠️ Error navegando a ${url}: ${err}`)
    return null
  }
}

/** URL del listado de particulares de una provincia + operación + página */
function listingPageUrl(op: string, slug: string, page: number): string {
  const base = `https://www.yaencontre.com/${op}/pisos/${slug}/e-particulares`
  return page === 1 ? base : `${base}/pag-${page}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Extrae los stubs de anuncios de particular de la página de listado
//
// Distinción de URLs:
//   Particular: .../inmueble-u{advId}_{listingId}   ← prefijo 'u', separador '_'
//   Agencia:    .../inmueble-{agencyId}-{listingId} ← sin 'u', separador '-'
//
// El regex solo captura las URLs de particular (u-prefix + underscore).
// ─────────────────────────────────────────────────────────────────────────────
interface ListingStub {
  id:    string   // listingId numérico
  advId: string   // advertiser id con prefijo 'u' (p.ej. "u15286659")
  url:   string   // URL completa del detalle
}

function extractStubs(html: string): ListingStub[] {
  const stubs: ListingStub[] = []
  const seen  = new Set<string>()

  // Captura: grupo1=URL completa, grupo2=advId_num, grupo3=listingId
  const re =
    /href="(https:\/\/www\.yaencontre\.com\/(?:venta|alquiler)\/piso\/inmueble-u([\w]+)_([\d]+))"/gi
  let m: RegExpExecArray | null

  while ((m = re.exec(html))) {
    const url  = m[1]
    const advN = m[2]  // sin 'u'
    const id   = m[3]
    if (seen.has(id)) continue
    seen.add(id)
    stubs.push({ id, advId: `u${advN}`, url })
  }

  return stubs
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsea datos completos de la PÁGINA DE DETALLE
// ─────────────────────────────────────────────────────────────────────────────
interface DetailData {
  title:          string
  price:          number | null
  beds:           number | null
  baths:          number | null
  area:           number | null
  description:    string | null
  images:         string[]
  district:       string | null
  city:           string | null
  province:       string | null
  advertiserName: string | null
  lat:            number | null
  lng:            number | null
  features:       Record<string, string>
}

function parseDetail(
  html: string,
  fallbackCity: string,
  fallbackProvince: string,
  listingId: string,
  advId: string,
): DetailData {

  // ── Título ──────────────────────────────────────────────────────────────────
  let title = ''
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1) title = h1[1].replace(/<[^>]+>/g, '').trim().slice(0, 200)
  if (!title) {
    const ogTitle =
      html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) ??
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)
    if (ogTitle) title = ogTitle[1].trim()
  }

  // ── Precio ──────────────────────────────────────────────────────────────────
  // Formato en la web: "840.000 €" (punto miles) o "1.300 €/mes"
  let price: number | null = null
  const pricePats: RegExp[] = [
    /"priceValue"\s*[:|=]\s*['"]?([\d.,]+)/i,
    /data-price="([\d.,]+)"/i,
    /"price"\s*:\s*"?([\d.,]+)"?/,
    /(\d{1,3}(?:\.\d{3})+)\s*(?:€|&euro;|&#8364;)/,   // 1.300.000 €
    /(\d{3,7})\s*(?:€|&euro;|&#8364;)/,                // 840000€
  ]
  for (const p of pricePats) {
    const pm = html.match(p)
    if (pm) {
      const raw = pm[1].replace(/\./g, '').replace(/,/g, '')
      const val = parseInt(raw, 10)
      if (!isNaN(val) && val > 100) { price = val; break }
    }
  }

  // ── Habitaciones ────────────────────────────────────────────────────────────
  let beds: number | null = null
  const bedPats: RegExp[] = [
    /(\d+)\s*hab(?:itaci(?:ón|ones))?\.?\b/i,
    /(\d+)\s*dormitori(?:o|os)/i,
    /"numberOfRooms"\s*:\s*(\d+)/,
  ]
  for (const p of bedPats) {
    const bm = html.match(p)
    if (bm) { beds = parseInt(bm[1], 10); break }
  }

  // ── Baños ────────────────────────────────────────────────────────────────────
  let baths: number | null = null
  const bathPats: RegExp[] = [
    /(\d+)\s*ba[ñn]o/i,
    /"numberOfBathroomsTotal"\s*:\s*(\d+)/,
  ]
  for (const p of bathPats) {
    const bm = html.match(p)
    if (bm) { baths = parseInt(bm[1], 10); break }
  }

  // ── Superficie ───────────────────────────────────────────────────────────────
  let area: number | null = null
  const areaPats: RegExp[] = [
    /(\d{2,4})\s*m[²2]/i,
    /(\d{2,4})\s*metros\s*cuadrados/i,
    /"floorSize"[\s\S]{0,80}"value"\s*:\s*"?(\d+)/i,
  ]
  for (const p of areaPats) {
    const am = html.match(p)
    if (am) { area = parseInt(am[1], 10); break }
  }

  // ── Descripción ──────────────────────────────────────────────────────────────
  let description: string | null = null

  // 1) Buscar en JSON-LD
  const ldBlocks =
    html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? []
  for (const block of ldBlocks) {
    try {
      const inner = block.replace(/<\/?script[^>]*>/gi, '')
      const obj   = JSON.parse(inner)
      const desc  = obj.description ?? obj['@graph']?.[0]?.description
      if (typeof desc === 'string' && desc.length > 30) {
        description = desc.replace(/\\n/g, ' ').trim().slice(0, 3000)
        break
      }
    } catch { /* ignorar */ }
  }

  // 2) og:description
  if (!description || description.length < 30) {
    const og =
      html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i) ??
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i)
    if (og) description = og[1].replace(/&#[0-9]+;/g, ' ').trim().slice(0, 3000)
  }

  // 3) meta name="description"
  if (!description || description.length < 30) {
    const metaD =
      html.match(/<meta[^>]+name="description"[^>]+content="([^"]{30,})"/i) ??
      html.match(/<meta[^>]+content="([^"]{30,})"[^>]+name="description"/i)
    if (metaD) description = metaD[1].trim().slice(0, 3000)
  }

  // ── Imágenes ──────────────────────────────────────────────────────────────────
  // CDN patrón: media.yaencontre.com/img/photo/{size}/{folder}/{folder}-{listingId}-{seq}.jpg.webp
  // Ejemplo:    media.yaencontre.com/img/photo/w380/u15286659/u15286659-56685187-1485529939.jpg.webp
  // Normalizamos a w630 (mayor tamaño público disponible).
  const images: string[] = []
  const imgSeen = new Set<string>()
  const imgRe =
    /https:\/\/media\.yaencontre\.com\/img\/photo\/[^"'\s]+\.(?:jpg|webp)/gi
  let im: RegExpExecArray | null
  while ((im = imgRe.exec(html))) {
    let imgUrl = im[0]
    // Solo imágenes que pertenecen a este anuncio (contienen el listingId o advId)
    if (!imgUrl.includes(listingId) && !imgUrl.includes(advId)) continue
    // Normalizar a tamaño w630 (mejor calidad pública)
    imgUrl = imgUrl.replace(/\/w\d+\//g, '/w630/')
    // Preferir .jpg.webp sobre .jpg duplicado
    if (!imgSeen.has(imgUrl)) {
      imgSeen.add(imgUrl)
      images.push(imgUrl)
    }
  }

  // ── Ubicación ────────────────────────────────────────────────────────────────
  let district: string | null = null
  let city:     string | null = null
  let province: string | null = null

  // 1) JSON-LD address
  for (const block of ldBlocks) {
    try {
      const inner = block.replace(/<\/?script[^>]*>/gi, '')
      const obj   = JSON.parse(inner)
      const addr  = obj.address ?? obj['@graph']?.[0]?.address
      if (addr) {
        if (addr.addressLocality && !city)     city     = addr.addressLocality
        if (addr.addressRegion   && !province) province = addr.addressRegion
        if (addr.addressLocality && !district) district = addr.addressLocality
      }
    } catch { /* ignorar */ }
  }

  // 2) Breadcrumb links
  // yaencontre usa URLs como:
  //   /pisos/madrid               → ciudad
  //   /pisos/madrid/distrito-salamanca → distrito
  //   /pisos/madrid/barrio-guindalera  → barrio
  if (!city) {
    const cityBc = html.match(/\/(?:venta|alquiler)\/pisos\/([^\/?"]+)"[^>]*>([^<]+)<\/a>/i)
    if (cityBc) city = cityBc[2].replace(/\s*\([^)]+\)/g, '').trim()
  }
  if (!district) {
    const barrioM = html.match(/\/barrio-[^"]+"\s*[^>]*>([^<]+)<\/a>/i)
    const distrM  = html.match(/\/distrito-[^"]+"\s*[^>]*>([^<]+)<\/a>/i)
    district = barrioM?.[1]?.trim() ?? distrM?.[1]?.trim() ?? null
  }

  city     = city     ?? fallbackCity
  province = province ?? fallbackProvince

  // ── Coordenadas ───────────────────────────────────────────────────────────────
  let lat: number | null = null
  let lng: number | null = null

  const latPats: RegExp[] = [
    /"latitude"\s*:\s*"?(3[6-9]\.[0-9]+|4[0-3]\.[0-9]+)"?/i,
    /data-lat="([\d.-]+)"/i,
    /lat(?:itud)?["']?\s*[:=,]\s*"?([\d.]+)"?/i,
  ]
  const lngPats: RegExp[] = [
    /"longitude"\s*:\s*"?([-\d.]+)"?/i,
    /data-l(?:ng|on)="([-\d.]+)"/i,
  ]
  for (const p of latPats) {
    const lm = html.match(p)
    if (lm) { const v = parseFloat(lm[1]); if (v > 36 && v < 44) { lat = v; break } }
  }
  for (const p of lngPats) {
    const lm = html.match(p)
    if (lm) { const v = parseFloat(lm[1]); if (v > -10 && v < 5) { lng = v; break } }
  }

  // ── Nombre del anunciante ─────────────────────────────────────────────────────
  // En la página de detalle aparece como "Ver todos los inmuebles de Carlos Martínez"
  let advertiserName: string | null = null
  const advMatch =
    html.match(/Ver\s+todos?\s+los\s+inmuebles\s+de\s+([^<"\n]{3,60})/i) ??
    html.match(/"name"\s*:\s*"([^"]{3,60})"[^}]*"@type"\s*:\s*"Person"/i) ??
    html.match(/"@type"\s*:\s*"Person"[^}]*"name"\s*:\s*"([^"]{3,60})"/i)
  if (advMatch) advertiserName = advMatch[1].trim().replace(/<[^>]+>/g, '')

  // ── Amenidades ────────────────────────────────────────────────────────────────
  const features = extractAmenities(html)

  return {
    title,
    price,
    beds,
    baths,
    area,
    description,
    images,
    district,
    city,
    province,
    advertiserName,
    lat,
    lng,
    features,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const args     = process.argv.slice(2)
  const opArg    = (args[0] ?? 'alquiler').toLowerCase()
  const provArg  = (args[1] ?? 'madrid').toLowerCase()
  const maxPages = Math.max(1, parseInt(args[2] ?? '5', 10))
  const maxItems = Math.max(1, parseInt(args[3] ?? '9999', 10))

  const op:   'venta' | 'alquiler' = opArg === 'venta' ? 'venta' : 'alquiler'
  const dbOp: 'sale'  | 'rent'     = op === 'venta'    ? 'sale'  : 'rent'

  const provInfo = PROVINCE_MAP[provArg]
  if (!provInfo) {
    console.error(`❌ Provincia desconocida: "${provArg}"`)
    console.error(`   Válidas: ${Object.keys(PROVINCE_MAP).join(', ')}`)
    process.exit(1)
  }

  console.log(
    `\n🏠 yaencontre PARTICULARES — ${op}/${provArg} (hasta ${maxPages} pág. | max ${maxItems} anuncios)`,
  )
  console.log(`${'─'.repeat(70)}\n`)

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
    ],
  })

  let imported  = 0
  let skipped   = 0
  let discarded = 0

  try {
    // Crear UN contexto persistente y UNA página reutilizable.
    // Esto permite que las cookies de Cloudflare se mantengan entre peticiones.
    const ctx  = await browser.newContext({ userAgent: UA })
    const page = await ctx.newPage()

    // Pre-warm: visita homepage para establecer cookies de sesión DataDome
    console.log('  🔥 Pre-warm: visitando homepage...')
    try {
      const warmResp = await page.goto('https://www.yaencontre.com/', { waitUntil: 'domcontentloaded', timeout: 20000 })
      console.log(`  🌐 Pre-warm status: ${warmResp?.status()} | URL final: ${page.url()}`)
    } catch (e) {
      console.warn(`  ⚠️ Pre-warm error: ${e}`)
    }
    await sleep(3000)

    for (let page_n = 1; page_n <= maxPages; page_n++) {
      if (imported >= maxItems) break

      const url  = listingPageUrl(op, provInfo.slug, page_n)
      console.log(`  📄 Página ${page_n}: ${url}`)

      const html = await getHtml(page, url)
      if (!html) {
        console.warn(`  ⚠️ Sin respuesta para pág. ${page_n}`)
        break
      }

      const stubs = extractStubs(html)
      console.log(`  🔗 ${stubs.length} anuncios de particulares encontrados`)

      if (stubs.length === 0) {
        console.log('  ✅ Sin más anuncios — fin de paginación')
        break
      }

      for (const stub of stubs) {
        if (imported >= maxItems) break

        await sleep(DELAY_MS)

        const detailHtml = await getHtml(page, stub.url)
        if (!detailHtml) {
          console.warn(`  ⚠️ Sin detalle para ${stub.id}`)
          discarded++
          continue
        }

        const d = parseDetail(detailHtml, provInfo.city, provInfo.province, stub.id, stub.advId)

        if (!d.title) {
          console.warn(`  ⚠️ [DESCARTADO sin título] ${stub.id}`)
          discarded++
          continue
        }
        if (d.images.length === 0) {
          console.warn(`  ⚠️ [DESCARTADO sin fotos] ${d.title.slice(0, 60)}`)
          discarded++
          continue
        }

        const listing: ScrapedListing = {
          title:              d.title,
          description:        d.description ?? undefined,
          price_eur:          d.price ?? undefined,
          operation:          dbOp,
          province:           d.province ?? provInfo.province,
          city:               d.city     ?? provInfo.city,
          district:           d.district ?? undefined,
          bedrooms:           d.beds     ?? undefined,
          bathrooms:          d.baths    ?? undefined,
          area_m2:            d.area     ?? undefined,
          source_portal:      'yaencontre',
          source_url:         stub.url,
          source_external_id: stub.id,
          is_particular:      true,
          advertiser_name:    d.advertiserName ?? undefined,
          images:             d.images,
          lat:                d.lat ?? undefined,
          lng:                d.lng ?? undefined,
          features:           Object.keys(d.features).length ? d.features : undefined,
        }

        const ok = await upsertListing(listing)
        if (ok !== false) {
          imported++
          console.log(
            `  ✅ [${imported}] ${d.title.slice(0, 60)} | ${d.price ? d.price.toLocaleString('es-ES') + '€' : '?'} | ${d.images.length} fotos`,
          )
        } else {
          skipped++
        }
      }

      if (page_n < maxPages && imported < maxItems) await sleep(DELAY_MS)
    }
  } finally {
    await browser.close()
  }

  console.log(`\n${'─'.repeat(70)}`)
  console.log(
    `  ✅ Importados: ${imported}  |  ⏭️  Ya existían: ${skipped}  |  🗑️  Descartados: ${discarded}`,
  )
}

main().catch((err) => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})

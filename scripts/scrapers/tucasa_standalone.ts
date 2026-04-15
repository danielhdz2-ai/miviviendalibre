/**
 * Scraper para tucasa.com
 * Uso: npx tsx scripts/scrapers/tucasa_standalone.ts [operation] [city] [maxPages]
 *   operation: venta | alquiler (default: venta)
 *   city: madrid | barcelona | valencia | sevilla | zaragoza | malaga | alicante | murcia | granada | bilbao (default: madrid)
 *   maxPages: número de páginas (default: 5)
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
  malaga:    { province: 'Málaga',    city: 'Málaga' },
  alicante:  { province: 'Alicante',  city: 'Alicante' },
  murcia:    { province: 'Murcia',    city: 'Murcia' },
  granada:   { province: 'Granada',   city: 'Granada' },
  bilbao:    { province: 'Vizcaya',   city: 'Bilbao' },
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

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractListings(
  html: string,
  city: string,
  province: string,
  operation: 'sale' | 'rent'
): ScrapedListing[] {
  const listings: ScrapedListing[] = []
  const seen = new Set<string>()

  // Cada card empieza con el alt del primer imagen: alt="Imagen 1 de "
  const delimMatches = [...html.matchAll(/alt="Imagen 1 de /gi)]
  if (delimMatches.length === 0) {
    console.warn('  ⚠️ No se encontraron cards de listings en la página')
    return []
  }

  const positions = delimMatches.map(m => m.index!)
  positions.push(html.length)

  const opSegment = operation === 'sale' ? 'compra-venta' : 'alquiler-residencial'

  for (let i = 0; i < positions.length - 1; i++) {
    const card = html.slice(positions[i], positions[i + 1])

    // URL y ID: el href del anuncio tiene ?i=&id=XXXXXX
    const urlMatch = card.match(
      /href="((?:https?:\/\/www\.tucasa\.com)?\/[^"]*\?i=&id=(\d+))"/
    )
    if (!urlMatch) continue

    const id = urlMatch[2]
    if (seen.has(id)) continue
    seen.add(id)

    const sourceUrl = urlMatch[1].startsWith('http')
      ? urlMatch[1]
      : `https://www.tucasa.com${urlMatch[1]}`

    // Filtrar por operación (en compra-venta a veces aparecen alquiler en secciones relacionadas)
    if (!sourceUrl.includes(`/${opSegment}/`)) continue

    // Texto plano del card
    const text = htmlToText(card)

    // Título: buscar en TODOS los anchors de este card que tengan el mismo ID
    // y extraer su texto (puede haber sub-tags internos como <strong>)
    let title = `Inmueble en ${city}`
    const anchorRe = new RegExp(
      `href="[^"]*\\?i=&id=${id}[^"]*"[^>]*>([\\s\\S]*?)<\\/a>`,
      'gi'
    )
    for (const am of card.matchAll(anchorRe)) {
      const anchorText = htmlToText(am[1]).trim()
      // Patrón "Barrio (Ciudad)"
      if (/\S.{1,60}\s*\([^()]{2,35}\)\s*$/.test(anchorText)) {
        title = anchorText.replace(/\s+/g, ' ')
        break
      }
    }

    // Distrito del título
    const distM = title.match(/^(.+?)\s*\(/)
    const district = distM ? distM[1].trim() : undefined

    // Precio: formato español NNN.NNN o N.NNN
    const priceM = text.match(/([\d]{1,3}(?:\.[\d]{3})+) €/)
    const price_eur = priceM
      ? parseInt(priceM[1].replace(/\./g, ''), 10)
      : undefined

    // Superficie: primera coincidencia de "NNN m2/m²", también "m 2" (si hay tag <sup>2</sup>)
    const areaM =
      text.match(/\b(\d{2,4})\s+m[²2](?!\s*[\/€])/i) ??
      text.match(/\b(\d{2,4})\s+m\s+2\b/i)
    const area_m2 = areaM ? parseInt(areaM[1], 10) : undefined

    // Dormitorios
    const bedsM = text.match(/(\d+) habitaci[oó]n/i)
    const bedrooms = bedsM ? parseInt(bedsM[1], 10) : undefined

    // Baños
    const bathsM = text.match(/(\d+) ba[ñn]o/i)
    const bathrooms = bathsM ? parseInt(bathsM[1], 10) : undefined

    // Descripción: texto desde "Venta de" / "Alquiler de" hasta UI element
    const descM = text.match(
      /((?:Venta|Alquiler) de [a-z\u00e0-\u00ff]{2,20}[,. ].{30,1200}?)(?:\s+(?:Email|Contactar|Guardar|Coraz[oó]n|A[ñn]adir|Compartir|Anunciante))/i
    )
    const description = descM ? descM[1].replace(/\s+/g, ' ').trim() : undefined

    // Imagen de portada de la tarjeta (thumbnail)
    const imageUrls: string[] = []
    const imgRe = /(?:src|data-src|data-lazy-src|data-original)="(https?:\/\/(?:www\.)?tucasa\.com\/cacheimg\/[^"]+)"/gi
    for (const im of card.matchAll(imgRe)) {
      const url = im[1].replace('/cacheimg/small/', '/cacheimg/big/')
      if (!imageUrls.includes(url)) imageUrls.push(url)
    }
    // Fallback: si no hay imágenes en el card, poner array vacío y el detalle las traerá
    const cardImages = imageUrls.slice(0, 1)

    listings.push({
      title,
      description,
      price_eur,
      operation,
      province,
      city,
      district,
      area_m2,
      bedrooms,
      bathrooms,
      source_portal: 'tucasa',
      source_url: sourceUrl,
      source_external_id: `tucasa_${id}`,
      is_particular: false,
      is_bank: false,
      images: cardImages.length > 0 ? cardImages : undefined,
      external_link: sourceUrl,
      phone: undefined,
      _needsDetail: true,
    } as ScrapedListing & { _needsDetail?: boolean })
  }

  return listings
}

// Extrae imágenes, descripción y teléfono de la página de detalle
export async function scrapeDetail(url: string): Promise<{
  images: string[]
  description?: string
  phone?: string
}> {
  const html = await fetchHtml(url)
  if (!html) return { images: [] }

  // Imágenes: todas las cacheimg del detalle → usar /big/ para calidad
  const cacheImgSet = new Set<string>()
  for (const m of html.matchAll(/cacheimg\/(?:small|big)\/[\w/]+(?: |[./]jpg|[./]jpeg|[./]png|[./]webp)/gi)) {
    // relimpiar
  }
  for (const m of html.matchAll(/\/cacheimg\/(?:small|big)\/[^"'\s<>]+/gi)) {
    const bigUrl = `https://www.tucasa.com${m[0].replace('/cacheimg/small/', '/cacheimg/big/')}`
    cacheImgSet.add(bigUrl)
  }
  // Imagen del JSON-LD (apinmo.com, alta resolución)
  const jldImgs: string[] = []
  for (const block of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(block[1])
      if (typeof j.image === 'string') jldImgs.push(j.image)
      else if (Array.isArray(j.image)) jldImgs.push(...j.image.filter((x: unknown) => typeof x === 'string'))
    } catch { /* noop */ }
  }
  // Preferir apinmo (alta res) si está, luego cacheimg/big
  const images = [...new Set([...jldImgs, ...cacheImgSet])].slice(0, 12)

  // Descripción: de JSON-LD
  let description: string | undefined
  for (const block of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(block[1])
      if (j.description && j.description.length > 30) {
        description = j.description
          .replace(/<[^>]+>/g, ' ')
          .replace(/&lt;[^&]+&gt;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        break
      }
    } catch { /* noop */ }
  }

  // Teléfono: buscar en data-phone, o cerca de "teléfono" en el texto
  let phone: string | undefined
  const dataPhone = html.match(/data-phone[^=]*?=["']([6-9]\d{8})["']/i)
  if (dataPhone) {
    phone = dataPhone[1]
  } else {
    // Buscar teléfonos españoles cerca de la palabra contacto/teléfono
    const contactZone = html.match(/(?:tel[eé]fono|contacto|llamar)[^<]{0,200}([6-9]\d{8})/i)
    if (contactZone) phone = contactZone[1]
  }

  return { images, description, phone }
}

async function scrapePage(
  url: string,
  city: string,
  province: string,
  operation: 'sale' | 'rent'
): Promise<ScrapedListing[]> {
  const html = await fetchHtml(url)
  if (!html) return []
  return extractListings(html, city, province, operation)
}

export async function runTucasa(
  opArg: string,
  cityArg: string,
  maxPages: number,
  maxItems: number = 9999
): Promise<{ inserted: number; skipped: number }> {
  const cityInfo = CITY_MAP[cityArg]
  if (!cityInfo) throw new Error(`Ciudad no soportada: ${cityArg}`)

  const operation: 'sale' | 'rent' = opArg === 'alquiler' ? 'rent' : 'sale'
  const baseSegment = opArg === 'alquiler' ? 'alquiler-residencial' : 'compra-venta'

  console.log(
    `\n🏠 tucasa.com — ${opArg} en ${cityInfo.city} (${maxPages} páginas)\n`
  )

  let totalInserted = 0
  let totalSkipped = 0

  for (let page = 1; page <= maxPages; page++) {
    const url =
      page === 1
        ? `https://www.tucasa.com/${baseSegment}/viviendas/${cityArg}/`
        : `https://www.tucasa.com/${baseSegment}/viviendas/${cityArg}/?pgn=${page}`

    console.log(`📄 Página ${page}: ${url}`)
    const listings = await scrapePage(url, cityInfo.city, cityInfo.province, operation)
    console.log(`  → Encontrados: ${listings.length} listings`)

    if (listings.length === 0) {
      console.log('  ⏹️ Sin más resultados, deteniendo.')
      break
    }

    for (const listing of listings) {
      // Visitar página de detalle para obtener imágenes completas, descripción y teléfono
      const detail = await scrapeDetail(listing.source_url!)
      await sleep(800)
      if (detail.images.length > 0) listing.images = detail.images
      if (detail.description && (!listing.description || listing.description.length < 50))
        listing.description = detail.description
      if (detail.phone) listing.phone = detail.phone

      // Regla boutique: solo subir si tiene imágenes
      if (!listing.images?.length) {
        console.log(`  ⚠️ Sin imágenes, descartado: ${listing.title?.slice(0, 60)}`)
        totalSkipped++
        await sleep(DELAY_MS)
        continue
      }

      const inserted = await upsertListing(listing)
      if (inserted) {
        totalInserted++
        const priceStr = listing.price_eur
          ? listing.price_eur.toLocaleString('es-ES') + ' €'
          : 'sin precio'
        const imgStr = ` 🖼️ ${listing.images.length} img`
        const telStr = listing.phone ? ` 📞 ${listing.phone}` : ''
        console.log(
          `  ✅ [${totalInserted}/${maxItems}] ${listing.title} — ${priceStr}${imgStr}${telStr}`
        )
        if (totalInserted >= maxItems) { console.log(`  🎯 Límite de ${maxItems} alcanzado`); break }
      } else {
        totalSkipped++
      }
      await sleep(DELAY_MS)
    }

    if (totalInserted >= maxItems) break

    if (page < maxPages) {
      await sleep(DELAY_MS)
    }
  }

  console.log(
    `\n✨ Completado: ${totalInserted} insertados, ${totalSkipped} ya existían\n`
  )
  return { inserted: totalInserted, skipped: totalSkipped }
}

async function main() {
  const opArg = (process.argv[2] ?? 'venta').toLowerCase()
  const cityArg = (process.argv[3] ?? 'madrid').toLowerCase()
  const maxPages = parseInt(process.argv[4] ?? '5', 10)
  const maxItems = parseInt(process.argv[5] ?? '9999', 10)
  await runTucasa(opArg, cityArg, maxPages, maxItems)
}

if (process.argv[1]?.includes('tucasa_standalone')) {
  main().catch(console.error)
}

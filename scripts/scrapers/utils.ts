/**
 * Utilidades compartidas para todos los scrapers de Mi Vivienda Libre
 * Ejecutar con: npx tsx scripts/scrapers/utils.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
// Carga .env.local desde la raíz del proyecto (2 niveles arriba de scripts/scrapers/)
config({ path: resolve(process.cwd(), '.env.local') })

export interface ScrapedListing {
  title: string
  description?: string
  price_eur?: number
  operation: 'sale' | 'rent'
  province?: string
  city?: string
  district?: string
  postal_code?: string
  lat?: number
  lng?: number
  bedrooms?: number
  bathrooms?: number
  area_m2?: number
  source_portal: string
  source_url: string
  source_external_id: string
  is_particular: boolean
  advertiser_name?: string   // nombre pila (particular) o marca comercial (agencia)
  images?: string[]
  is_bank?: boolean
  bank_entity?: string
  external_link?: string
  phone?: string             // siempre guardar, incluso para agencias
  features?: Record<string, string>  // campos extra: planta, antiguedad, tipo_casa, etc.
  video_url?: string         // URL de vídeo del inmueble (YouTube embed, etc.)
  virtual_tour_url?: string  // URL de tour virtual (Matterport, etc.)
  // upload_to_storage eliminado: política global = external_url → img-proxy → caché Vercel Edge
}

/**
 * Extrae amenidades canónicas de un fragmento de HTML o texto plano.
 * Devuelve un objeto con claves canónicas y valor 'true' (o valor concreto).
 * Usada por TODOS los scrapers → datos homogéneos en la BD.
 */
export function extractAmenities(text: string): Record<string, string> {
  const feat: Record<string, string> = {}

  // JSON-LD amenityFeature (cuando se pasa HTML completo)
  const ldBlocks = text.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? []
  for (const block of ldBlocks) {
    const inner = block.replace(/<\/?script[^>]*>/gi, '')
    try {
      const obj = JSON.parse(inner)
      const amenities: Array<{ name?: string; value?: unknown }> = (
        obj.amenityFeature ?? obj['@graph']?.[0]?.amenityFeature ?? []
      )
      for (const a of amenities) {
        if (a.name && (a.value === true || a.value === 'true' || a.value === 1))
          feat[a.name.toLowerCase().replace(/\s+/g, '_')] = 'true'
      }
    } catch { /* ignorar */ }
  }

  // Patrones textuales — clave canónica siempre en minúsculas con guión bajo
  const PATS: Array<[RegExp, string]> = [
    [/ascensor/i,                               'ascensor'],
    [/piscina/i,                                'piscina'],
    [/garaje|plaza\s+de\s+parking|\bparking\b/i,'garaje'],
    [/trastero/i,                               'trastero'],
    [/terraza|balc[oó]n/i,                      'terraza'],
    [/jard[ií]n/i,                              'jardin'],
    [/aire\s+acondicionado|\ba\/c\b/i,          'aire_acondicionado'],
    [/armarios?\s+empotrados?/i,                'armarios_empotrados'],
    [/calefacci[oó]n/i,                         'calefaccion'],
    [/exterior/i,                               'exterior'],
    [/obra\s+nueva/i,                           'obra_nueva'],
    [/a\s+reformar/i,                           'a_reformar'],
    [/buen\s+estado/i,                          'buen_estado'],
    [/portero\s+autom[aá]tico|videoportero/i,   'portero_automatico'],
    [/amueblado/i,                              'amueblado'],
  ]
  for (const [re, key] of PATS) {
    if (re.test(text) && !feat[key]) feat[key] = 'true'
  }

  // Planta (valor numérico o texto)
  const plantaM = text.match(/(\d+)[ºª]?\s*planta/i) ?? text.match(/planta\s+(\w+)/i)
  if (plantaM) feat['planta'] = plantaM[1]

  // Año de construcción
  const anioM =
    text.match(/construid[oa][^<\n]*?(\d{4})/i) ??
    text.match(/a[ñn]o(?:\s+de)?\s+construcci[oó]n[^<\n]*?(\d{4})/i)
  if (anioM) {
    const yr = parseInt(anioM[1])
    if (yr > 1900 && yr <= new Date().getFullYear()) feat['anio_construccion'] = anioM[1]
  }

  // Calificación energética (A–G)
  const enM =
    text.match(/calificaci[oó]n\s+energ[eé]tica[^A-G\n]{0,30}([A-G])\b/i) ??
    text.match(/certificado[^A-G\n]{0,30}\bclase\s+([A-G])\b/i) ??
    text.match(/energ[eé]tica[^:\n]{0,10}:\s*([A-G])\b/i)
  if (enM) feat['eficiencia_energetica'] = enM[1].toUpperCase()

  return feat
}

/**
 * Normaliza el nombre de una ciudad para almacenamiento canónico.
 * - Elimina código postal embebido: "Barcelona 08001" → "Barcelona"
 * - Elimina sufijo de provincia en paréntesis: "El Escorial (Madrid)" → "El Escorial"
 * - Capitaliza correctamente, elimina espacios múltiples
 */
export function normalizeCity(raw: string | null | undefined): string | null {
  if (!raw || raw.trim() === '') return null
  let s = raw.trim()
  // Código postal al final: "Barcelona 08001"
  s = s.replace(/\s+\d{5}\s*$/, '').trim()
  // Provincia en paréntesis: "Valencia (Valencia)"
  s = s.replace(/\s*\([^)]+\)\s*$/, '').trim()
  // Espacios múltiples
  s = s.replace(/\s{2,}/g, ' ')
  // Capitalizar (los artículos/preposiciones van en minúsculas salvo la primera palabra)
  const LOWER = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'els', 'les', 'i', 'y', 'a'])
  s = s
    .split(' ')
    .map((w, i) =>
      i === 0 || !LOWER.has(w.toLowerCase())
        ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        : w.toLowerCase(),
    )
    .join(' ')
  return s || null
}

const SUPABASE_URL = 'https://ktsdxpmaljiyuwimcugx.supabase.co'

// Portales que son 100% agencias — nunca marcar como particular
const AGENCY_PORTALS = new Set([
  'tecnocasa', 'redpiso', 'gilmar', 'solvia', 'aliseda', 'monapart',
  'servihabitat', 'habitaclia',
  // fotocasa: NO incluir aquí — fotocasa_particulares.ts lo usa con commercial=0
  // y tiene su propia lógica de verificación de anunciante
])

// ── Blacklist de contenido basura / productos no permitidos en Inmonest ───────
// Productos financiero-legales que no son inmobiliaria residencial estándar.
// Si aparecen en el título o descripción → el anuncio se descarta completamente.
const CONTENT_BLACKLIST: RegExp[] = [
  /\bhipoteca\b/i,
  /\bdeuda\b/i,
  /\bnuda\s+propiedad\b/i,
  /\bindiviso\b/i,
  /\bembargo\b/i,
  /\bsubasta\b/i,
  /\brenta\s+antigua\b/i,
  /\bherencia\b/i,
  /\bproindiviso\b/i,
  /\buso\s+fructo\b/i,
  /\busufructo\b/i,
]

/**
 * Devuelve true si el anuncio contiene palabras de la blacklist de contenido.
 * Usado para descartar productos financieros/legales que dañan el SEO.
 */
export function isBlacklistedContent(title: string, description?: string): boolean {
  const text = `${title} ${description ?? ''}`.toLowerCase()
  return CONTENT_BLACKLIST.some(re => re.test(text))
}

// ── Filtro de precios irreales ─────────────────────────────────────────────────
const MIN_SALE_PRICE  = 30_000   // € — menos de esto es error o gancho falso
const MIN_RENT_PRICE  = 200      // €/mes — menos de esto no es alquiler de vivienda real

/**
 * Devuelve true si el precio es inválido para la operación dada.
 */
export function isUnrealisticPrice(price: number | undefined, operation: 'sale' | 'rent'): boolean {
  if (!price) return false  // sin precio → no filtrar (puede ser "consultar")
  if (operation === 'sale'  && price < MIN_SALE_PRICE)  return true
  if (operation === 'rent'  && price < MIN_RENT_PRICE)  return true
  return false
}

// ── Blacklist de palabras que revelan anunciante de agencia ───────────────────
// Se chequean contra título + descripción (lowercased). Si hay match → is_particular=false.
// IMPORTANTE: NO usar \binmobiliaria\b solo — un particular puede decir "sin inmobiliaria".
const AGENCY_TEXT_PATTERNS = [
  // Términos operativos de agencia (contexto positivo, no negativo)
  /\bagencia\s+inmobiliaria\b/,
  /(?<!sin\s|no\s|ninguna\s)\binmobiliaria\b(?!\s*(?:no\b|sin\b|directa))/,
  /\bhonorarios\b/,
  /\bgastos\s+de\s+(gesti[oó]n|agencia)\b/,
  /\bcomisi[oó]n\s+de\s+(agencia|intermediaci[oó]n)\b/,
  /\basesor(?:a)?\s+inmobiliario\b/,
  /\bconsulting\s+inmobiliario\b/,
  /\bver\s+inmuebles\s+de\b/,        // "Ver inmuebles de TUKSA"
  /\bnuestros?\s+inmuebles\b/,       // "nuestros inmuebles"
  /\bnuestra\s+cartera\b/,           // "nuestra cartera de pisos"
  /\bregistro\s+de\s+agentes\s+inmobiliarios\b/,  // badge pisos.com agente colegiado
  /\bregistre\s+d'agents\s+immobiliaris\b/,        // badge catalán pisos.com
  /\banunciante\s+profesional\b/,    // pisos.com badge para agencias
  // Emails corporativos
  /\b(info|ventas|contacto|alquiler|pisos|arrendamiento)@[a-z0-9.\-]+\.[a-z]{2,}/,
  // Franquicias y cadenas conocidas
  /\bfinques\s+\w+/,
  /\bre\/?max\b/,
  /\bcentury\s*21\b/,
  /\bera\s+inmobiliaria\b/,
  /\bdonpiso\b/,
  /\bhousell\b/,
  /\bengel\s*&\s*v[oö]lkers\b/,
  /\bcoldwell\s+banker\b/,
  /\bkeller\s+williams\b/,
  /\balquiler\s+seguro\b/,
  /\bamat\s+inmobiliaris\b/,
  /\bbcn\s+advisors\b/,
  /\blucas\s+fox\b/,
  /\bcushman\s+&\s+wakefield\b/,
  /\bcolliers\b/,
  /\bsavills\b/,
  /\bcbre\b/,
  /\bneinor\s+homes\b/,
  /\bmetrovacesa\b/,
  /\bvía\s+céle?re\b/,
  /\bhaya\s+real\s+estate\b/,
  /\baltamira\s+real\b/,
  /\banticipa\s+real\b/,
  /\btuksa\b/,  // Agencia conocida en Barcelona
]

/**
 * Devuelve true si el texto (título+descripción) contiene indicios de agencia.
 * Usado como último blindaje antes del upsert.
 */
function looksLikeAgency(title: string, description?: string): boolean {
  const text = `${title} ${description ?? ''}`.toLowerCase()
  return AGENCY_TEXT_PATTERNS.some((re) => re.test(text))
}

// Formas societarias que revelan empresa (→ is_particular = false)
const CORPORATE_SUFFIXES = /\b(s\.?l\.?|s\.?a\.?|s\.?l\.?u\.?|s\.?l\.?l\.?|s\.?c\.?|s\.?c\.?p\.?|sociedad\s+limitada|sociedad\s+an[oó]nima)\b/i

// Nombres de marca de agencias conocidas (sin sufijo S.L. pero inequívocas)
const KNOWN_AGENCY_BRANDS = new Set([
  'tuksa', 'aedas', 'neinor', 'metrovacesa', 'cbre', 'jll', 'savills', 'cushman',
  'colliers', 'inmoglaciar', 'kronos', 'anticipa', 'haya', 'altamira', 'solvia',
  'gilmar', 'amat', 'tecnocasa', 'donpiso', 'habitaclia', 'redpiso', 'monapart',
  'aliseda', 'servihabitat', 'lucas fox', 'bcn advisors', 'engel', 'coldwell',
  'housell', 'fincas habermas', 'api grupo',
])

/**
 * Detecta si el nombre del anunciante parece una empresa/agencia incluso sin sufijo S.L.
 * Casos: nombres en MAYÚSCULAS tipo TUKSA, CBRE, JLL; marcas conocidas.
 */
function looksLikeCorporateName(name: string | undefined): boolean {
  if (!name || name.trim().length < 2) return false
  const n = name.trim()
  // Excluir nombres genéricos que siempre son particulares
  if (/^propietario\s*particular$/i.test(n)) return false
  // All-caps acronym style: TUKSA, CBRE, JLL, AEDAS (3+ letras todas mayúsculas)
  if (/^[A-ZÁÉÍÓÚÑ]{3,}(\s[A-ZÁÉÍÓÚÑ]{2,})*$/.test(n)) return true
  // Nombre contiene sufijo societario (ya cubierto por CORPORATE_SUFFIXES pero por si acaso)
  if (CORPORATE_SUFFIXES.test(n)) return true
  // Marca conocida en el nombre
  const lower = n.toLowerCase()
  for (const brand of KNOWN_AGENCY_BRANDS) {
    if (lower.includes(brand)) return true
  }
  return false
}

/**
 * Normaliza el nombre del anunciante:
 * - Si es particular: devuelve el primer nombre o "Propietario Particular"
 * - Si es agencia: devuelve la marca comercial o "Agencia en {portal}"
 * También detecta sufijos societarios S.L./S.A. → fuerza is_particular=false
 */
export function sanitizeAdvertiserName(
  rawName: string | undefined,
  isParticular: boolean,
  sourcePortal: string,
): { name: string; forceAgency: boolean } {
  if (!rawName || rawName.trim() === '') {
    return {
      name: isParticular ? 'Propietario Particular' : `Agencia en ${sourcePortal}`,
      forceAgency: false,
    }
  }

  const trimmed = rawName.trim()

  // Detectar sufijos societarios → siempre agencia
  const hasCorporateSuffix = CORPORATE_SUFFIXES.test(trimmed)

  if (isParticular && !hasCorporateSuffix) {
    // Extraer primer nombre de pila
    const genericNames = /^(particular|propietario|propietaria|owner|vendedor|vendedora|anunciante)$/i
    const firstName = trimmed.split(/\s+/)[0]
    const name = genericNames.test(trimmed) || genericNames.test(firstName)
      ? 'Propietario Particular'
      : firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    return { name, forceAgency: false }
  }

  // Agencia: devolver nombre en title case limpio, sin términos como "Anunciante:" al inicio
  const cleaned = trimmed
    .replace(/^(anunciante|agente|agencia|inmobiliaria)\s*:?\s*/i, '')
    .trim()
  const name = cleaned !== ''
    ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    : `Agencia en ${sourcePortal}`

  return { name, forceAgency: hasCorporateSuffix }
}

// Pega aquí tu service_role key de Supabase (Settings → API)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''

// ─── Deduplicación por contenido ────────────────────────────────────────────
// Busca un anuncio existente en la BD usando:
//   1. GPS dentro de ~100 m (0.001 grados)
//   2. precio ±3% + superficie ±5 m² + misma ciudad + misma operación
async function findContentDuplicate(
  listing: ScrapedListing,
  headers: Record<string, string>,
): Promise<{ id: string; is_particular: boolean } | null> {

  // Estrategia 1 — coordenadas GPS
  // Radio: ~33 m (0.0003°) — suficiente para cubrir imprecisión GPS pero no mezclar edificios distintos
  if (listing.lat != null && listing.lng != null) {
    const δ = 0.0003
    const url =
      `${SUPABASE_URL}/rest/v1/listings` +
      `?operation=eq.${listing.operation}` +
      `&lat=gte.${(listing.lat - δ).toFixed(6)}&lat=lte.${(listing.lat + δ).toFixed(6)}` +
      `&lng=gte.${(listing.lng - δ).toFixed(6)}&lng=lte.${(listing.lng + δ).toFixed(6)}` +
      `&status=eq.published&select=id,is_particular&limit=1`
    const res = await fetch(url, { headers })
    if (res.ok) {
      const rows = await res.json() as Array<{ id: string; is_particular: boolean }>
      if (rows.length > 0) return rows[0]
    }
  }

  // Estrategia 2 — precio + superficie + ciudad
  if (listing.price_eur && listing.area_m2 && listing.city) {
    const priceMin = Math.round(listing.price_eur * 0.97)
    const priceMax = Math.round(listing.price_eur * 1.03)
    const areaMin  = Math.max(0, Math.round(listing.area_m2 - 5))
    const areaMax  = Math.round(listing.area_m2 + 5)
    const url =
      `${SUPABASE_URL}/rest/v1/listings` +
      `?operation=eq.${listing.operation}` +
      `&price_eur=gte.${priceMin}&price_eur=lte.${priceMax}` +
      `&area_m2=gte.${areaMin}&area_m2=lte.${areaMax}` +
      `&city=ilike.${encodeURIComponent(listing.city)}` +
      `&status=eq.published&select=id,is_particular&limit=1`
    const res = await fetch(url, { headers })
    if (res.ok) {
      const rows = await res.json() as Array<{ id: string; is_particular: boolean }>
      if (rows.length > 0) return rows[0]
    }
  }

  return null
}

export async function upsertListing(listing: ScrapedListing): Promise<boolean> {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Falta SUPABASE_SERVICE_KEY en variables de entorno')
    process.exit(1)
  }

  // ── Filtro de contenido basura (blacklist) ────────────────────────────────
  if (isBlacklistedContent(listing.title, listing.description)) {
    console.log(`  🚫 [BLACKLIST] Descartado: "${listing.title.slice(0, 70)}"`)
    return false
  }

  // ── Filtro de precios irreales ─────────────────────────────────────────────
  if (isUnrealisticPrice(listing.price_eur, listing.operation)) {
    console.log(`  🚫 [PRECIO IRREAL] ${listing.operation === 'sale' ? 'Venta' : 'Alquiler'} a ${listing.price_eur}€ — Descartado: "${listing.title.slice(0, 60)}"`)
    return false
  }

  const baseHeaders = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }

  // ── Paso 1: buscar duplicado exacto por source_portal + source_external_id ─
  let listingId: string | null = null
  let existingIsParticular = false
  let isExactMatch = false  // true = mismo portal+id; false = coincidencia por contenido

  const exactRes = await fetch(
    `${SUPABASE_URL}/rest/v1/listings` +
    `?source_portal=eq.${encodeURIComponent(listing.source_portal)}` +
    `&source_external_id=eq.${encodeURIComponent(listing.source_external_id ?? '')}` +
    `&select=id,is_particular&limit=1`,
    { headers: baseHeaders },
  )
  if (exactRes.ok) {
    const rows = await exactRes.json() as Array<{ id: string; is_particular: boolean }>
    if (rows.length > 0) {
      listingId = rows[0].id
      existingIsParticular = rows[0].is_particular
      isExactMatch = true
    }
  }

  // ── Paso 2: si no hay dedup exacto, buscar por contenido ──────────────────
  if (!listingId) {
    const contentMatch = await findContentDuplicate(listing, baseHeaders)
    if (contentMatch) {
      // ⚠️ PROTECCIÓN CRÍTICA: nunca dejar que un anuncio de AGENCIA absorba
      // un registro existente de PARTICULAR. Son propiedades distintas o el particular
      // es la fuente más fiable → ignorar el de agencia, el particular ya está cubierto.
      if (!listing.is_particular && contentMatch.is_particular) {
        console.log(`  ℹ️ Omitido (agencia vs particular cercano): preservando registro particular ${contentMatch.id.slice(0, 8)}`)
        return true  // "procesado" — no crear duplicado, el particular es el canónico
      }
      listingId = contentMatch.id
      existingIsParticular = contentMatch.is_particular
      isExactMatch = false
      console.log(`  📎 Dedup contenido → fusionando con id ${listingId}`)
    }
  }

  // ── Paso 3: Determinación de is_particular ────────────────────────────────
  // Portales 100% agencia → forzar false sin excepción
  const fromAgencyPortal = AGENCY_PORTALS.has(listing.source_portal.toLowerCase())

  // Texto del anuncio delata agencia — se evalúa SIEMPRE (no solo cuando incoming=true)
  // Para bloquear "promociones" cuando el texto indica claramente que es agencia
  const textRevealsAgency = looksLikeAgency(listing.title, listing.description)

  // Nombre del anunciante: sufijo societario S.L./S.A. o nombre corporativo (TUKSA, CBRE…)
  const { name: advertiserName, forceAgency: nameRevealsAgency } = sanitizeAdvertiserName(
    listing.advertiser_name, listing.is_particular, listing.source_portal
  )
  const corpNameRevealsAgency = looksLikeCorporateName(listing.advertiser_name)

  const hardAgency = fromAgencyPortal || textRevealsAgency || nameRevealsAgency || corpNameRevealsAgency

  // Lógica definitiva:
  //   - Si hay señal dura de agencia → siempre false
  //   - Coincidencia EXACTA (mismo portal+id): confiar en el valor que trae el scraper
  //     excepto que una confirmación previa de particular no se degrada por un scraper
  //     que por defecto pone false (ej: pisoscom.ts general)
  //   - Coincidencia CONTENIDO (mismo tipo garantizado por el bloqueo en paso 2):
  //     promover si alguno de los dos es particular
  let isParticular: boolean
  if (hardAgency) {
    isParticular = false
  } else if (isExactMatch) {
    // Para coincidencia exacta: respetar el valor del scraper SALVO si
    // el scraper simplemente hace default false (no tiene lógica de detección).
    // Heurística: si el scraper pone false PERO el existente era true (confirmed),
    // y NO hay señales de agencia en texto/nombre → preservar el true existente.
    isParticular = listing.is_particular || existingIsParticular
  } else {
    // Coincidencia de contenido misma familia (ambos particular o ambos agencia)
    isParticular = listing.is_particular || existingIsParticular
  }

  if (hardAgency) {
    const reason = fromAgencyPortal ? 'portal' : textRevealsAgency ? 'texto' : nameRevealsAgency ? 'nombre(sufijo)' : 'nombre(marca)'
    console.log(`  🚫 [AGENCIA — ${reason}] ${listing.title.slice(0, 60)}`)
  }
  if (listing.is_particular && !existingIsParticular && listingId && !hardAgency) {
    console.log(`  ⭐ Promovido a "Directo de Particular"`)
  }

  const rankingScore = isParticular ? 90 : (listing.is_bank ? 70 : 30)

  const body = {
    origin: 'external',
    status: 'published',
    is_particular: isParticular,
    operation: listing.operation,
    title: listing.title,
    description: listing.description ?? null,
    advertiser_name: advertiserName,
    price_eur: listing.price_eur ?? null,
    province: listing.province ?? null,
    city: listing.city ?? null,
    district: listing.district ?? null,
    postal_code: listing.postal_code ?? null,
    lat: listing.lat ?? null,
    lng: listing.lng ?? null,
    bedrooms: listing.bedrooms ?? null,
    bathrooms: listing.bathrooms ?? null,
    area_m2: listing.area_m2 != null ? Math.round(listing.area_m2) : null,
    source_portal: listing.source_portal,
    source_url: listing.source_url,
    source_external_id: listing.source_external_id,
    ranking_score: rankingScore,
    published_at: new Date().toISOString(),
    is_bank: listing.is_bank ?? false,
    bank_entity: listing.bank_entity ?? null,
    external_link: listing.external_link ?? null,
    phone: listing.phone ?? null,  // siempre guardar aunque sea agencia
    features: listing.features && Object.keys(listing.features).length > 0
      ? listing.features
      : undefined,
    video_url: listing.video_url ?? null,
    virtual_tour_url: listing.virtual_tour_url ?? null,
  }

  // ── Paso 4: PATCH si existe, INSERT si no ─────────────────────────────────
  if (listingId) {
    await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}`, {
      method: 'PATCH',
      headers: { ...baseHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify(body),
    })
    // Reemplazar imágenes
    await fetch(`${SUPABASE_URL}/rest/v1/listing_images?listing_id=eq.${listingId}`, {
      method: 'DELETE',
      headers: { ...baseHeaders, Prefer: 'return=minimal' },
    })
  } else {
    const postRes = await fetch(`${SUPABASE_URL}/rest/v1/listings`, {
      method: 'POST',
      headers: { ...baseHeaders, Prefer: 'return=representation' },
      body: JSON.stringify(body),
    })
    if (postRes.ok) {
      const data = await postRes.json() as Array<{ id: string }>
      listingId = data[0]?.id ?? null
    } else {
      const err = await postRes.text()
      // Conflicto de unique constraint (race condition) → intentar PATCH
      if (err.includes('"23505"')) {
        const retryRes = await fetch(
          `${SUPABASE_URL}/rest/v1/listings` +
          `?source_portal=eq.${encodeURIComponent(listing.source_portal)}` +
          `&source_external_id=eq.${encodeURIComponent(listing.source_external_id ?? '')}` +
          `&select=id&limit=1`,
          { headers: baseHeaders },
        )
        if (retryRes.ok) {
          const rows = await retryRes.json() as Array<{ id: string }>
          listingId = rows[0]?.id ?? null
        }
        if (listingId) {
          await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}`, {
            method: 'PATCH',
            headers: { ...baseHeaders, Prefer: 'return=minimal' },
            body: JSON.stringify(body),
          })
        }
      } else {
        console.error(`  ↳ Error upsert: ${err.slice(0, 120)}`)
        return false
      }
    }
  }

  if (listingId && listing.images?.length) {
    await insertImages(listingId, listing.images, baseHeaders)
  }

  return true
}

// ── Supabase Storage upload ─────────────────────────────────────────────────
const STORAGE_BUCKET = 'listings'
const STORAGE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ── Filtro ratio 1:1 (logos cuadrados) ───────────────────────────────────────
/**
 * Extrae dimensiones de los primeros bytes de una imagen (PNG y WebP VP8 lossy).
 * Para JPEG no es trivial (SOF marker variable), se ignora → fail-open.
 */
function parseDimensionsFromBuffer(buf: Uint8Array): { width: number; height: number } | null {
  // PNG: firma(8) + IHDR: length(4) + type(4) + width(4) + height(4) — bytes 16-23
  if (buf.length >= 24 &&
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    const w = ((buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19]) >>> 0
    const h = ((buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23]) >>> 0
    if (w > 0 && h > 0) return { width: w, height: h }
  }
  // WebP VP8 lossy: "RIFF"(4)+fileSize(4)+"WEBP"(4)+"VP8 "(4)+chunkSize(4)+frame(3)+w_m1(2)+h_m1(2)
  if (buf.length >= 30 &&
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50 &&
      buf[12] === 0x56 && buf[13] === 0x50 && buf[14] === 0x38 && buf[15] === 0x20) {
    const w = ((buf[27] & 0x3F) << 8 | buf[26]) + 1
    const h = ((buf[29] & 0x3F) << 8 | buf[28]) + 1
    if (w > 0 && h > 0) return { width: w, height: h }
  }
  return null
}

/** Ratio dentro del rango [0.85, 1.18] — ±15% de cuadrado → probable logo */
function isSquareRatio(w: number, h: number): boolean {
  const r = w / h
  return r >= 0.85 && r <= 1.18
}

/**
 * Descarga los primeros 512 bytes de una URL y comprueba si la imagen es ~cuadrada.
 * Fail-open: devuelve false si no se puede determinar (→ la imagen se mantiene).
 */
async function isSquareImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { Range: 'bytes=0-511', 'User-Agent': STORAGE_UA },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok && res.status !== 206) return false
    const buf = new Uint8Array(await res.arrayBuffer())
    const dims = parseDimensionsFromBuffer(buf)
    if (!dims) return false
    return isSquareRatio(dims.width, dims.height)
  } catch {
    return false
  }
}

/**
 * Descarga una imagen desde externalUrl y la sube al bucket 'listings' de
 * Supabase Storage usando service_role key (bypassa RLS).
 * @param externalUrl  URL origen de la imagen
 * @param storagePath  Ruta dentro del bucket, e.g. "scraper/tucasa/12345/0.jpg"
 * @param referer      Referer HTTP a enviar (para eludir bloqueo de hotlinking)
 * @returns URL pública del Storage, o null si falla
 */
export async function uploadImageToStorage(
  externalUrl: string,
  storagePath: string,
  referer?: string,
): Promise<string | null> {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? ''
  if (!serviceKey) return null

  try {
    const imgRes = await fetch(externalUrl, {
      headers: {
        'User-Agent': STORAGE_UA,
        // No pedir AVIF: Supabase Storage no lo soporta → forzar JPEG/WebP
        Accept: 'image/webp,image/jpeg,image/png,image/*;q=0.8',
        ...(referer ? { Referer: referer } : {}),
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!imgRes.ok) return null

    const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
    // Rechazar AVIF explícitamente — Supabase Storage devuelve 415
    if (!contentType.startsWith('image/') || contentType.includes('avif')) return null

    const buffer = await imgRes.arrayBuffer()
    if (buffer.byteLength < 1024) return null  // demasiado pequeño → página de error

    // Filtrar logos cuadrados antes de subir al bucket
    const bytes = new Uint8Array(buffer)
    const dims = parseDimensionsFromBuffer(bytes)
    if (dims && isSquareRatio(dims.width, dims.height)) {
      console.log(`  ⬛ [Logo 1:1] ${dims.width}×${dims.height} — descartando: ${storagePath}`)
      return null
    }

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: buffer,
      },
    )
    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      console.warn(`  ⚠️ Storage upload (${uploadRes.status}): ${err.slice(0, 80)}`)
      return null
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`
  } catch (err) {
    console.warn(`  ⚠️ uploadImageToStorage error: ${err}`)
    return null
  }
}

// Política global de imágenes:
// NUNCA subir a Supabase Storage (genera egress caro).
// Siempre guardar external_url → servidas via /api/img-proxy → cacheadas en
// Vercel Edge CDN 7 días (s-maxage=604800). La primera visita paga 1 fetch;
// todas las demás las sirve Vercel gratis desde su red perimetral.
async function insertImages(
  listingId: string,
  images: string[],
  headers: Record<string, string>,
) {
  const capped = images.slice(0, 15)
  if (capped.length === 0) return

  // Filtrar imágenes con ratio 1:1 (logos cuadrados) en paralelo
  const squareFlags = await Promise.all(capped.map(url => isSquareImage(url)))
  const filtered = capped.filter((_, i) => !squareFlags[i])
  if (filtered.length < capped.length) {
    console.log(`  🖼 Filtradas ${capped.length - filtered.length} imagen(es) 1:1 (logos)`)
  }
  if (filtered.length === 0) return

  const rows = filtered.map((url, i) => ({
    listing_id: listingId,
    external_url: url,
    storage_path: null,
    position: i,
  }))

  await fetch(`${SUPABASE_URL}/rest/v1/listing_images`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify(rows),
  })
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function normalizePrice(text: string): number | undefined {
  const clean = text.replace(/[^\d.,]/g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) ? undefined : n
}

export function normalizeArea(text: string): number | undefined {
  const m = text.match(/(\d+)/)
  return m ? parseInt(m[1]) : undefined
}

export function normalizeRooms(text: string): number | undefined {
  const m = text.match(/(\d+)/)
  return m ? parseInt(m[1]) : undefined
}

/**
 * Intenta extraer un número de teléfono del HTML de una página de detalle.
 * Busca en este orden:
 *   1. href="tel:..." — la fuente más fiable
 *   2. JSON-LD "telephone"
 *   3. Patrón de teléfono español (+34 / 6xx / 7xx / 9xx con 9 dígitos)
 * Devuelve null si no se encuentra ninguno.
 */
export function extractPhone(html: string): string | null {
  // 1. tel: link
  const telLink = html.match(/href="tel:([+\d\s\-().]{7,16})"/)
  if (telLink) return telLink[1].replace(/\s/g, '').trim()

  // 2. JSON-LD telephone
  const jsonTel = html.match(/"telephone"\s*:\s*"([+\d\s\-().]{7,16})"/)
  if (jsonTel) return jsonTel[1].replace(/\s/g, '').trim()

  // 3. Teléfono español visible en el texto (no dentro de atributos HTML)
  const spanishPhone = html.match(/(?:^|[\s"'>])(\+?34\s*[679]\d{8}|[679]\d{8})(?=[\s"'<\b])/)
  if (spanishPhone) return spanishPhone[1].replace(/\s/g, '').trim()

  return null
}

/**
 * /api/maintenance — Vercel Cron Job de mantenimiento de calidad
 *
 * Se ejecuta 4 veces al día (configurado en vercel.json).
 * Realiza 3 limpiezas en orden seguro:
 *
 *   1. Anuncios de DEMANDA  — títulos con "Compro", "Busco", "Pagamos al contado", etc.
 *      (aplica a todos los portales, no solo Milanuncios)
 *
 *   2. Imágenes rotas  — verifica via img-proxy la primera imagen de cada anuncio;
 *      si responde con error → anuncio eliminado
 *      (solo se comprueban portales con hotlinking conocido, máx. 80 anuncios/run)
 *
 *   3. Anuncios con < 5 fotos — solo para AGENCIAS (is_particular = false);
 *      los particulares son inmortales aunque tengan pocas fotos
 *
 * Seguridad: requiere Authorization: Bearer <CRON_SECRET>
 * Vercel lo inyecta automáticamente en los cron jobs configurados en vercel.json.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY
                  ?? process.env.SUPABASE_SERVICE_ROLE_KEY

// Portales donde las URLs de imagen son externas (susceptibles de hotlinking)
const HOTLINK_PORTALS = ['tucasa', 'pisoscom', 'milanuncios', 'enalquiler', 'habitaclia', 'fotocasa']

// ── REST helpers ───────────────────────────────────────────────────────────
function h(): Record<string, string> {
  return {
    apikey:          SERVICE_KEY!,
    Authorization:   `Bearer ${SERVICE_KEY}`,
    'Content-Type':  'application/json',
    Prefer:          'return=minimal',
  }
}

/** Convierte "Compro %" → URL-safe PostgREST ilike value */
function ilike(column: string, value: string): string {
  const safe = value.replace(/ /g, '%20').replace(/%/g, '%25')
  return `${column}.ilike.${safe}`
}

async function del(table: string, filter: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: h(),
  })
}

// ── TAREA 1: Anuncios de demanda ───────────────────────────────────────────
async function cleanDemandListings(): Promise<{ deleted: number }> {
  const conditions = [
    ilike('title', 'Compro %'),
    ilike('title', 'Compramos %'),
    ilike('title', 'Busco %'),
    ilike('title', 'Buscamos %'),
    ilike('title', 'Necesito %'),
    ilike('title', 'Necesitamos %'),
    ilike('title', 'Busco piso%'),
    ilike('title', 'Busco casa%'),
    ilike('title', 'Busco inmueble%'),
    ilike('title', 'Compro inmueble%'),
    ilike('title', 'Compro vivienda%'),
    ilike('title', '%pagamos al contado%'),
    ilike('title', '%se busca piso%'),
    ilike('title', '%se busca casa%'),
    ilike('title', '%quiero comprar%'),
    ilike('title', '%quiero alquilar%'),
  ].join(',')

  const orFilter = `or=(${conditions})`

  // Buscar IDs afectados primero (para borrar imágenes en cascada segura)
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?${orFilter}&select=id&limit=500`,
    { headers: h() }
  )
  if (!res.ok) return { deleted: 0 }

  const rows = await res.json() as Array<{ id: string }>
  if (rows.length === 0) return { deleted: 0 }

  const ids = rows.map(r => r.id).join(',')
  await del('listing_images', `listing_id=in.(${ids})`)
  await del('listings',       `id=in.(${ids})`)

  return { deleted: rows.length }
}

// ── TAREA 2: Imágenes rotas ────────────────────────────────────────────────
async function cleanBrokenImages(origin: string): Promise<{ deleted: number; checked: number }> {
  const portalOr = `or=(${HOTLINK_PORTALS.map(p => ilike('source_portal', `${p}%`)).join(',')})`

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?status=eq.published&${portalOr}&select=id&limit=80&order=published_at.asc`,
    { headers: h() }
  )
  if (!res.ok) return { deleted: 0, checked: 0 }

  const listings = await res.json() as Array<{ id: string }>
  let deleted = 0

  // Verificar en paralelo (máx. 10 concurrentes para no sobrecargar)
  const CONCURRENCY = 10
  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const batch = listings.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(async ({ id }) => {
      // Obtener primera imagen del anuncio
      const imgRes = await fetch(
        `${SUPABASE_URL}/rest/v1/listing_images?listing_id=eq.${id}&select=external_url&order=position.asc&limit=1`,
        { headers: h() }
      )
      if (!imgRes.ok) return

      const imgs = await imgRes.json() as Array<{ external_url: string }>
      const firstUrl = imgs[0]?.external_url
      if (!firstUrl) {
        // Sin imágenes registradas → eliminar
        await del('listings', `id=eq.${id}`)
        deleted++
        return
      }

      // Verificar imagen via proxy (HEAD para no descargar el body)
      try {
        const proxyUrl = `${origin}/api/img-proxy?url=${encodeURIComponent(firstUrl)}`
        const check = await fetch(proxyUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(6000),
        })
        if (!check.ok) {
          await del('listing_images', `listing_id=eq.${id}`)
          await del('listings',       `id=eq.${id}`)
          deleted++
        }
      } catch {
        // Timeout u error de red → no eliminar defensivamente (puede ser transitorio)
      }
    }))
  }

  return { deleted, checked: listings.length }
}

// ── TAREA 3: Anuncios de agencia con < 5 fotos ─────────────────────────────
async function cleanFewPhotosAgencies(): Promise<{ deleted: number }> {
  // Traer agencias publicadas en lotes de 200
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?status=eq.published&is_particular=eq.false&select=id&limit=200&order=published_at.asc`,
    { headers: h() }
  )
  if (!res.ok) return { deleted: 0 }

  const listings = await res.json() as Array<{ id: string }>
  let deleted = 0

  const CONCURRENCY = 15
  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const batch = listings.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(async ({ id }) => {
      const countRes = await fetch(
        `${SUPABASE_URL}/rest/v1/listing_images?listing_id=eq.${id}&select=id`,
        { headers: { ...h(), Prefer: 'count=exact' } }
      )
      const total = parseInt(countRes.headers.get('content-range')?.split('/')[1] ?? '0', 10)
      if (total < 5) {
        await del('listing_images', `listing_id=eq.${id}`)
        await del('listings',       `id=eq.${id}`)
        deleted++
      }
    }))
  }

  return { deleted }
}

// ── Handler principal ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {

  // ── Autenticación ─────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!SERVICE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_KEY no configurado' }, { status: 500 })
  }

  const origin    = request.nextUrl.origin
  const startedAt = Date.now()
  console.log('[maintenance] ▶ Inicio limpieza de calidad')

  const [demandR, brokenR, photosR] = await Promise.allSettled([
    cleanDemandListings(),
    cleanBrokenImages(origin),
    cleanFewPhotosAgencies(),
  ])

  function unwrap<T>(r: PromiseSettledResult<T>, fallback: T): T {
    return r.status === 'fulfilled' ? r.value : fallback
  }
  function errStr(r: PromiseSettledResult<unknown>): string | undefined {
    return r.status === 'rejected' ? String(r.reason) : undefined
  }

  const demand = unwrap(demandR, { deleted: 0 })
  const broken = unwrap(brokenR, { deleted: 0, checked: 0 })
  const photos = unwrap(photosR, { deleted: 0 })
  const elapsed = Math.round((Date.now() - startedAt) / 1000)
  const totalDeleted = demand.deleted + broken.deleted + photos.deleted

  console.log(`[maintenance] ✅ ${totalDeleted} eliminados en ${elapsed}s`)

  return NextResponse.json({
    ok: true,
    elapsed_s: elapsed,
    total_deleted: totalDeleted,
    tasks: {
      demand_listings: { ...demand, error: errStr(demandR) },
      broken_images:   { ...broken, error: errStr(brokenR) },
      few_photos:      { ...photos, error: errStr(photosR) },
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY

// Portales donde las imágenes son externas y pueden quedar rotas
const HOTLINK_PORTALS = ['tucasa', 'pisoscom', 'milanuncios', 'enalquiler', 'habitaclia', 'fotocasa']

// Patrones de anuncios de DEMANDA (compradores buscando, no vendiendo)
const DEMAND_PATTERNS_SQL = `(
  title ILIKE 'Compro %'         OR
  title ILIKE 'Compramos %'      OR
  title ILIKE 'Busco %'          OR
  title ILIKE 'Buscamos %'       OR
  title ILIKE 'Necesito %'       OR
  title ILIKE 'Necesitamos %'    OR
  title ILIKE 'Busco piso%'      OR
  title ILIKE 'Busco casa%'      OR
  title ILIKE 'Busco inmueble%'  OR
  title ILIKE 'Compro inmueble%' OR
  title ILIKE 'Compro vivienda%' OR
  title ILIKE '%pagamos al contado%' OR
  title ILIKE '%se busca piso%'  OR
  title ILIKE '%se busca casa%'  OR
  title ILIKE '%quiero comprar%' OR
  title ILIKE '%quiero alquilar%'
)`

// ── Helpers ────────────────────────────────────────────────────────────────
function baseHeaders(): Record<string, string> {
  return {
    apikey:        SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer:        'return=minimal',
  }
}

async function supabaseDelete(table: string, filter: string): Promise<number> {
  // HEAD request first to count
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${filter}&select=id`,
    { headers: { ...baseHeaders(), Prefer: 'count=exact' } }
  )
  const count = parseInt(countRes.headers.get('content-range')?.split('/')[1] ?? '0', 10)

  if (count === 0) return 0

  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: baseHeaders(),
  })
  return count
}

async function getListingIds(filter: string, limit = 200): Promise<Array<{ id: string; source_portal: string }>> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?${filter}&select=id,source_portal&limit=${limit}&order=id.asc`,
    { headers: baseHeaders() }
  )
  if (!res.ok) return []
  return res.json()
}

async function countImages(listingId: string): Promise<number> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listing_images?listing_id=eq.${listingId}&select=id`,
    { headers: { ...baseHeaders(), Prefer: 'count=exact' } }
  )
  return parseInt(res.headers.get('content-range')?.split('/')[1] ?? '0', 10)
}

async function getFirstImage(listingId: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listing_images?listing_id=eq.${listingId}&select=external_url&order=position.asc&limit=1`,
    { headers: baseHeaders() }
  )
  if (!res.ok) return null
  const rows = await res.json() as Array<{ external_url: string }>
  return rows[0]?.external_url ?? null
}

async function deleteListingAndImages(id: string): Promise<void> {
  const h = baseHeaders()
  await fetch(`${SUPABASE_URL}/rest/v1/listing_images?listing_id=eq.${id}`, { method: 'DELETE', headers: h })
  await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${id}`, { method: 'DELETE', headers: h })
}

/**
 * Verifica si una imagen (via img-proxy) devuelve 200 OK.
 * Usa un HEAD request para no descargar el body.
 */
async function isImageAlive(externalUrl: string, origin: string): Promise<boolean> {
  try {
    const proxyUrl = `${origin}/api/img-proxy?url=${encodeURIComponent(externalUrl)}`
    const res = await fetch(proxyUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(6000),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── TAREA 1: Anuncios de demanda ───────────────────────────────────────────
async function cleanDemandListings(): Promise<{ deleted: number }> {
  // Borrar imágenes primero (por si CASCADE no está activo o hay retraso)
  const imgFilter = `listing_id=in.(select:id:from:listings:where:${encodeURIComponent(DEMAND_PATTERNS_SQL)})`

  // Más simple: DELETE directo con subquery via RPC o con filtros encadenados
  // La API REST de Supabase no soporta subqueries directas → usamos dos pasos
  const affected = await getListingIds(
    `status=eq.published&${encodeURIComponent(DEMAND_PATTERNS_SQL).replace(/%20/g, '+')}`
      .replace(/%28/g, '(').replace(/%29/g, ')').replace(/%27/g, "'")
      .replace(/%25/g, '%'),
    500
  )

  // Forma más directa usando PostgREST raw filter
  const demandIds = await (async () => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/listings?select=id&limit=500&` +
      `title=ilike.Compro *,` +
      `or=(title.ilike.Compro *,title.ilike.Compramos *,title.ilike.Busco *,` +
        `title.ilike.Buscamos *,title.ilike.Necesito *,title.ilike.Necesitamos *,` +
        `title.ilike.%pagamos al contado%,title.ilike.%se busca piso%,` +
        `title.ilike.%quiero comprar%,title.ilike.%quiero alquilar%,` +
        `title.ilike.Compro inmueble%,title.ilike.Compro vivienda%)`,
      { headers: baseHeaders() }
    )
    if (!res.ok) return [] as string[]
    const rows = await res.json() as Array<{ id: string }>
    return rows.map(r => r.id)
  })()

  if (demandIds.length === 0) return { deleted: 0 }

  // Borrar en batch
  for (const id of demandIds) {
    await deleteListingAndImages(id)
  }
  return { deleted: demandIds.length }
}

// ── TAREA 2: Imágenes rotas ────────────────────────────────────────────────
async function cleanBrokenImages(origin: string): Promise<{ deleted: number; checked: number }> {
  // Solo verificar portales con hotlinking conocido, máx. 80 anuncios por run
  const portalFilter = HOTLINK_PORTALS.map(p => `source_portal.ilike.${p}*`).join(',')
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listings` +
    `?status=eq.published&or=(${portalFilter})` +
    `&select=id,source_portal&limit=80&order=published_at.asc`,
    { headers: baseHeaders() }
  )
  if (!res.ok) return { deleted: 0, checked: 0 }
  const listings = await res.json() as Array<{ id: string; source_portal: string }>

  let deleted = 0
  const checked = listings.length

  for (const listing of listings) {
    const imgUrl = await getFirstImage(listing.id)
    if (!imgUrl) {
      // Sin imágenes → eliminar
      await deleteListingAndImages(listing.id)
      deleted++
      continue
    }

    const alive = await isImageAlive(imgUrl, origin)
    if (!alive) {
      await deleteListingAndImages(listing.id)
      deleted++
    }
  }

  return { deleted, checked }
}

// ── TAREA 3: Anuncios con < 5 fotos (solo agencias) ───────────────────────
async function cleanFewPhotosAgencies(): Promise<{ deleted: number }> {
  // Agencias con 0-4 fotos — particulares son inmortales
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/listings` +
    `?status=eq.published` +
    `&is_particular=eq.false` +
    `&select=id&limit=200&order=published_at.asc`,
    { headers: baseHeaders() }
  )
  if (!res.ok) return { deleted: 0 }
  const listings = await res.json() as Array<{ id: string }>

  let deleted = 0
  for (const listing of listings) {
    const n = await countImages(listing.id)
    if (n < 5) {
      await deleteListingAndImages(listing.id)
      deleted++
    }
  }
  return { deleted }
}

// ── Handler principal ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {

  // ── Autenticación ─────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_KEY no configurado' }, { status: 500 })
  }

  const origin = request.nextUrl.origin
  const startedAt = Date.now()

  console.log('[maintenance] ▶ Iniciando limpieza de calidad')

  const [demandResult, brokenResult, photosResult] = await Promise.allSettled([
    cleanDemandListings(),
    cleanBrokenImages(origin),
    cleanFewPhotosAgencies(),
  ])

  const demand = demandResult.status === 'fulfilled' ? demandResult.value : { deleted: 0, error: String((demandResult as PromiseRejectedResult).reason) }
  const broken = brokenResult.status === 'fulfilled' ? brokenResult.value : { deleted: 0, checked: 0, error: String((brokenResult as PromiseRejectedResult).reason) }
  const photos = photosResult.status === 'fulfilled' ? photosResult.value : { deleted: 0, error: String((photosResult as PromiseRejectedResult).reason) }

  const elapsed = Math.round((Date.now() - startedAt) / 1000)
  const totalDeleted =
    ('deleted' in demand ? demand.deleted : 0) +
    ('deleted' in broken ? broken.deleted : 0) +
    ('deleted' in photos ? photos.deleted : 0)

  console.log(`[maintenance] ✅ Completado en ${elapsed}s — ${totalDeleted} anuncios eliminados`)

  return NextResponse.json({
    ok: true,
    elapsed_s: elapsed,
    total_deleted: totalDeleted,
    tasks: {
      demand_listings: demand,
      broken_images:   broken,
      few_photos:      photos,
    },
  })
}

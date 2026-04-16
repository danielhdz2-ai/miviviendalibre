import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY
                  ?? process.env.SUPABASE_SERVICE_ROLE_KEY

const HOTLINK_PORTALS = ['tucasa', 'pisoscom', 'milanuncios', 'enalquiler', 'habitaclia', 'fotocasa']

function h(): Record<string, string> {
  return {
    apikey:         SERVICE_KEY!,
    Authorization:  `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer:         'return=minimal',
  }
}

function ilike(column: string, value: string): string {
  const safe = value.replace(/%/g, '*')
  return `${column}.ilike.${safe}`
}

async function del(table: string, filter: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: h(),
  })
}

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

  const orFilter = "or=(" + conditions + ")"

  const res = await fetch(
    SUPABASE_URL + "/rest/v1/listings?" + orFilter + "&select=id&limit=500",
    { headers: h() }
  )
  if (!res.ok) return { deleted: 0 }

  const rows = await res.json() as Array<{ id: string }>
  if (rows.length === 0) return { deleted: 0 }

  const ids = rows.map(r => r.id).join(',')
  await del('listing_images', "listing_id=in.(" + ids + ")")
  await del('listings', "id=in.(" + ids + ")")

  return { deleted: rows.length }
}

async function cleanBrokenImages(origin: string): Promise<{ deleted: number; checked: number }> {
  const portalOr = "or=(" + HOTLINK_PORTALS.map(p => ilike('source_portal', p + '%')).join(',') + ")"

  const res = await fetch(
    SUPABASE_URL + "/rest/v1/listings?status=eq.published&" + portalOr + "&select=id&limit=80&order=published_at.asc",
    { headers: h() }
  )
  if (!res.ok) return { deleted: 0, checked: 0 }

  const listings = await res.json() as Array<{ id: string }>
  let deleted = 0

  const CONCURRENCY = 10
  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const batch = listings.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(async ({ id }) => {
      const imgRes = await fetch(
        SUPABASE_URL + "/rest/v1/listing_images?listing_id=eq." + id + "&select=external_url&order=position.asc&limit=1",
        { headers: h() }
      )
      if (!imgRes.ok) return

      const imgs = await imgRes.json() as Array<{ external_url: string }>
      const firstUrl = imgs[0]?.external_url
      if (!firstUrl) {
        await del('listings', "id=eq." + id)
        deleted++
        return
      }

      try {
        const proxyUrl = origin + "/api/img-proxy?url=" + encodeURIComponent(firstUrl)
        const check = await fetch(proxyUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(6000),
        })
        if (!check.ok) {
          await del('listing_images', "listing_id=eq." + id)
          await del('listings', "id=eq." + id)
          deleted++
        }
      } catch {
        // Timeout transitorio
      }
    }))
  }

  return { deleted, checked: listings.length }
}

async function cleanFewPhotosAgencies(): Promise<{ deleted: number }> {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/listings?status=eq.published&is_particular=eq.false&select=id&limit=200&order=published_at.asc",
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
        SUPABASE_URL + "/rest/v1/listing_images?listing_id=eq." + id + "&select=id",
        { headers: { ...h(), Prefer: 'count=exact' } }
      )
      const total = parseInt(countRes.headers.get('content-range')?.split('/')[1] ?? '0', 10)
      if (total < 5) {
        await del('listing_images', "listing_id=eq." + id)
        await del('listings', "id=eq." + id)
        deleted++
      }
    }))
  }

  return { deleted }
}

function errStr(r: PromiseSettledResult<unknown>): string | undefined {
  return r.status === 'rejected' ? String(r.reason) : undefined
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== "Bearer " + cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!SERVICE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_KEY no configurado' }, { status: 500 })
  }

  const origin    = request.nextUrl.origin
  const startedAt = Date.now()

  const [demandR, brokenR, photosR] = await Promise.allSettled([
    cleanDemandListings(),
    cleanBrokenImages(origin),
    cleanFewPhotosAgencies(),
  ])

  const demand = demandR.status === 'fulfilled' ? demandR.value : { deleted: 0 }
  const broken = brokenR.status === 'fulfilled' ? brokenR.value : { deleted: 0, checked: 0 }
  const photos = photosR.status === 'fulfilled' ? photosR.value : { deleted: 0 }

  return NextResponse.json({
    ok:      true,
    elapsed: Date.now() - startedAt,
    tasks: {
      demand_listings: { ...demand, error: errStr(demandR) },
      broken_images:   { ...broken, error: errStr(brokenR) },
      few_photos:      { ...photos, error: errStr(photosR) },
    },
  })
}
  }

  if (!SERVICE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_KEY no configurado' }, { status: 500 })
  }

  const origin    = request.nextUrl.origin
  const startedAt = Date.now()

  const [demandR, brokenR, photosR] = await Promise.allSettled([
    cleanDemandListings(),
    cleanBrokenImages(origin),
    cleanFewPhotosAgencies(),
  ])

  const demand = demandR.status === 'fulfilled' ? demandR.value : { deleted: 0 }
  const broken = brokenR.status === 'fulfilled' ? brokenR.value : { deleted: 0, checked: 0 }
  const photos = photosR.status === 'fulfilled' ? photosR.value : { deleted: 0 }

  return NextResponse.json({
    ok:      true,
    elapsed: Date.now() - startedAt,
    tasks: {
      demand_listings: { ...demand, error: errStr(demandR) },
      broken_images:   { ...broken, error: errStr(brokenR) },
      few_photos:      { ...photos, error: errStr(photosR) },
    },
  })
}
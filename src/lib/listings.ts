import { createClient as createClient_ } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Listing, SearchParams } from '@/types/listings'
import { applyProFilters, parseProParams } from '@/lib/search-filters'

const PAGE_SIZE = 50

function getDb() {
  return createClient_(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function searchListings(params: SearchParams): Promise<{
  listings: Listing[]
  total: number
}> {
  const supabase = getDb()
  const pagina = params.pagina ?? 1
  const offset = (pagina - 1) * PAGE_SIZE

  // ── 1. Count query (sin range → nunca lanza PGRST103) ────────────────
  let countQuery = supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('has_images', true)

  if (params.operacion)        countQuery = countQuery.eq('operation', params.operacion)
  if (params.ciudad)           countQuery = countQuery.ilike('city', `%${params.ciudad}%`)
  if (params.solo_particulares) countQuery = countQuery.eq('is_particular', true)
  if (params.solo_bancarias)   countQuery = countQuery.eq('is_bank', true)
  if (params.solo_agencias)    countQuery = countQuery.eq('is_particular', false).eq('is_bank', false)
  if (params.habitaciones_min) countQuery = countQuery.gte('bedrooms', params.habitaciones_min)
  if (params.habitaciones)     countQuery = countQuery.eq('bedrooms', params.habitaciones)
  if (params.precio_min)       countQuery = countQuery.gte('price_eur', params.precio_min)
  if (params.precio_max)       countQuery = countQuery.lte('price_eur', params.precio_max)
  if (params.area_min)         countQuery = countQuery.gte('area_m2', params.area_min)
  if (params.area_max)         countQuery = countQuery.lte('area_m2', params.area_max)

  const pro = parseProParams(params)
  countQuery = applyProFilters(countQuery, pro)

  const { count, error: countError } = await countQuery
  if (countError) {
    console.error('[searchListings] count error:', countError.message, '| code:', countError.code)
    return { listings: [], total: 0 }
  }
  const total = count ?? 0

  // Si no hay resultados o la página está fuera de rango, devolver vacío
  if (total === 0 || offset >= total) {
    return { listings: [], total }
  }

  // ── 2. Data query (range seguro porque offset < total) ────────────────
  let dataQuery = supabase
    .from('listings')
    .select('*')
    .eq('status', 'published')
    .eq('has_images', true)

  if (params.operacion)        dataQuery = dataQuery.eq('operation', params.operacion)
  if (params.ciudad)           dataQuery = dataQuery.ilike('city', `%${params.ciudad}%`)
  if (params.solo_particulares) dataQuery = dataQuery.eq('is_particular', true)
  if (params.solo_bancarias)   dataQuery = dataQuery.eq('is_bank', true)
  if (params.solo_agencias)    dataQuery = dataQuery.eq('is_particular', false).eq('is_bank', false)
  if (params.habitaciones_min) dataQuery = dataQuery.gte('bedrooms', params.habitaciones_min)
  if (params.habitaciones)     dataQuery = dataQuery.eq('bedrooms', params.habitaciones)
  if (params.precio_min)       dataQuery = dataQuery.gte('price_eur', params.precio_min)
  if (params.precio_max)       dataQuery = dataQuery.lte('price_eur', params.precio_max)
  if (params.area_min)         dataQuery = dataQuery.gte('area_m2', params.area_min)
  if (params.area_max)         dataQuery = dataQuery.lte('area_m2', params.area_max)

  dataQuery = applyProFilters(dataQuery, pro)

  dataQuery = dataQuery.range(offset, offset + PAGE_SIZE - 1)

  switch (params.ordenar) {
    case 'precio_asc':  dataQuery = dataQuery.order('price_eur', { ascending: true, nullsFirst: false }); break
    case 'precio_desc': dataQuery = dataQuery.order('price_eur', { ascending: false, nullsFirst: false }); break
    case 'recientes':   dataQuery = dataQuery.order('published_at', { ascending: false }); break
    case 'superficie':  dataQuery = dataQuery.order('area_m2', { ascending: false, nullsFirst: false }); break
    default:
      dataQuery = dataQuery.order('ranking_score', { ascending: false }).order('published_at', { ascending: false })
  }

  const { data, error } = await dataQuery

  if (error) {
    console.error('[searchListings] data error:', error.message, '| code:', error.code)
    return { listings: [], total }
  }

  // Batch-load imágenes (máx 5 por listing) en una sola query
  const rows = data ?? []
  if (rows.length > 0) {
    const ids = rows.map((l: { id: string }) => l.id)
    const { data: imgs } = await supabase
      .from('listing_images')
      .select('listing_id, id, external_url, storage_path, position')
      .in('listing_id', ids)
      .lte('position', 4)
      .order('listing_id')
      .order('position', { ascending: true })

    if (imgs?.length) {
      const imgMap = new Map<string, typeof imgs>()
      for (const img of imgs) {
        if (!imgMap.has(img.listing_id)) imgMap.set(img.listing_id, [])
        imgMap.get(img.listing_id)!.push(img)
      }
      for (const listing of rows) {
        (listing as Record<string, unknown>).listing_images = imgMap.get(listing.id) ?? []
      }
    }
  }

  return { listings: rows as Listing[], total }
}

export async function getListingById(id: string): Promise<Listing | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error || !data) return null

  // Buscar imágenes en tabla separada (el join FK no está en schema PostgREST)
  const { data: images } = await supabase
    .from('listing_images')
    .select('id, storage_path, external_url, position')
    .eq('listing_id', id)
    .order('position', { ascending: true })

  return {
    ...data,
    listing_images: images ?? [],
  } as Listing
}

export async function recordView(listingId: string, sessionId: string) {
  const supabase = await createClient()
  await supabase
    .from('listing_views')
    .insert({ listing_id: listingId, session_id: sessionId })
}

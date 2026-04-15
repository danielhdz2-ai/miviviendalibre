import { createClient as createClient_ } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Listing, SearchParams } from '@/types/listings'

const PAGE_SIZE = 24

const LIST_SELECT =
  'id, origin, operation, title, price_eur, province, city, district, postal_code, lat, lng, bedrooms, bathrooms, area_m2, source_portal, is_particular, particular_confidence, ranking_score, turbo_until, status, views_count, published_at, created_at, is_bank, bank_entity, features, advertiser_name, source_external_id'

const PRIVATE_FIELDS = ['phone', 'external_link', 'source_url'] as const

function stripPrivateFields(listing: Record<string, unknown>): Listing {
  const copy = { ...listing }
  for (const f of PRIVATE_FIELDS) delete copy[f]
  return copy as unknown as Listing
}

// Cliente directo (igual que debug-db — confirmado que devuelve 1229 registros)
function getPublicDb() {
  return createClient_(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function _searchListings(params: SearchParams): Promise<{
  listings: Listing[]
  total: number
}> {
  const supabase = getPublicDb()
  const pagina = params.pagina ?? 1
  const from = (pagina - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('listings')
    .select(LIST_SELECT, { count: 'exact' })
    .range(from, to)

  // Ordenación
  switch (params.ordenar) {
    case 'precio_asc':
      query = query.order('price_eur', { ascending: true, nullsFirst: false })
      break
    case 'precio_desc':
      query = query.order('price_eur', { ascending: false, nullsFirst: false })
      break
    case 'recientes':
      query = query.order('published_at', { ascending: false })
      break
    case 'superficie':
      query = query.order('area_m2', { ascending: false, nullsFirst: false })
      break
    default: // relevancia
      query = query
        .order('ranking_score', { ascending: false })
        .order('published_at', { ascending: false })
  }

  if (params.operacion) {
    query = query.eq('operation', params.operacion)
  }

  if (params.solo_particulares) {
    query = query.eq('is_particular', true)
  }

  if (params.solo_bancarias) {
    query = query.eq('is_bank', true)
  }

  if (params.ciudad) {
    const ciudad = params.ciudad.toLowerCase()
    query = query.or(
      `city.ilike.%${ciudad}%,province.ilike.%${ciudad}%,district.ilike.%${ciudad}%`
    )
  }

  if (params.habitaciones != null) {
    if (params.habitaciones >= 4) {
      query = query.gte('bedrooms', 4)
    } else if (params.habitaciones === 0) {
      query = query.eq('bedrooms', 0)
    } else {
      query = query.eq('bedrooms', params.habitaciones)
    }
  }

  if (params.banos_min != null) {
    query = query.gte('bathrooms', params.banos_min)
  }

  if (params.precio_min != null) {
    query = query.gte('price_eur', params.precio_min)
  }

  if (params.precio_max != null) {
    query = query.lte('price_eur', params.precio_max)
  }

  if (params.area_min != null) {
    query = query.gte('area_m2', params.area_min)
  }

  if (params.area_max != null) {
    query = query.lte('area_m2', params.area_max)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[searchListings] ERROR:', error.message, '| code:', error.code, '| hint:', error.hint)
    return { listings: [], total: 0 }
  }

  console.log('[searchListings] OK — total:', count, '| params:', JSON.stringify(params))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = ((data ?? []) as any[]).map((l) => stripPrivateFields({ ...l, listing_images: [] }))

  return { listings, total: count ?? 0 }
}

export const searchListings = _searchListings

export async function getListingById(id: string): Promise<Listing | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select('*, listing_images(id, storage_path, external_url, position)')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error || !data) return null

  return {
    ...data,
    listing_images: (data.listing_images ?? []).sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  } as Listing
}

export async function recordView(listingId: string, sessionId: string) {
  const supabase = await createClient()
  await supabase
    .from('listing_views')
    .insert({ listing_id: listingId, session_id: sessionId })
}

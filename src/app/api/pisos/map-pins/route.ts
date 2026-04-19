import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { applyProFilters, parseProParams } from '@/lib/search-filters'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ciudad = searchParams.get('ciudad') ?? ''
  const operacion = searchParams.get('operacion') ?? ''
  const soloParticulares = searchParams.get('solo_particulares') === 'true'
  const soloBancarias = searchParams.get('solo_bancarias') === 'true'
  const precioMin = searchParams.get('precio_min') ? Number(searchParams.get('precio_min')) : null
  const precioMax = searchParams.get('precio_max') ? Number(searchParams.get('precio_max')) : null
  const habitaciones = searchParams.get('hab') ? Number(searchParams.get('hab')) : null
  const areaMin = searchParams.get('area_min') ? Number(searchParams.get('area_min')) : null
  const areaMax = searchParams.get('area_max') ? Number(searchParams.get('area_max')) : null

  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('id, lat, lng, price_eur, operation, city')
    .eq('status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(3000)

  if (operacion) query = query.eq('operation', operacion)
  if (soloParticulares) query = query.eq('is_particular', true)
  if (soloBancarias) query = query.eq('is_bank', true)
  if (ciudad) {
    const c = ciudad.toLowerCase()
    query = query.or(`city.ilike.%${c}%,province.ilike.%${c}%,district.ilike.%${c}%`)
  }
  if (precioMin != null) query = query.gte('price_eur', precioMin)
  if (precioMax != null) query = query.lte('price_eur', precioMax)
  if (habitaciones != null) {
    if (habitaciones >= 4) query = query.gte('bedrooms', 4)
    else if (habitaciones === 0) query = query.eq('bedrooms', 0)
    else query = query.eq('bedrooms', habitaciones)
  }
  if (areaMin != null) query = query.gte('area_m2', areaMin)
  if (areaMax != null) query = query.lte('area_m2', areaMax)

  // Filtros pro (ascensor, piscina, estado, energía, etc.)
  query = applyProFilters(query, parseProParams({
    estado:     searchParams.get('estado')     ?? undefined,
    caract:     searchParams.get('caract')     ?? undefined,
    planta:     searchParams.get('planta')     ?? undefined,
    energia:    searchParams.get('energia')    ?? undefined,
    multimedia: searchParams.get('multimedia') ?? undefined,
    fecha_pub:  searchParams.get('fecha_pub')  ?? undefined,
  }))

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ pins: [] }, { status: 500 })
  }

  return NextResponse.json({ pins: data ?? [] })
}

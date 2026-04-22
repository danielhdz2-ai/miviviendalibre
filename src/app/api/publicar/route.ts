import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAiDescription } from '@/lib/ai-description'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // ── Límite: máximo 2 anuncios activos ──────────────────────────────────────
  const { count: activeCount, error: countError } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', user.id)
    .in('status', ['published', 'active'])

  if (!countError && (activeCount ?? 0) >= 2) {
    return NextResponse.json(
      {
        error: 'limit_reached',
        message: 'Has alcanzado el límite de 2 anuncios gratuitos. Contrata el Plan Profesional para publicar sin límites.',
      },
      { status: 403 },
    )
  }

  const body = await req.json()
  const { operation, province, city, district, postal_code, price, bedrooms, bathrooms, area, title, description, features } = body

  if (!operation || !city?.trim() || !price || !title?.trim()) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const priceNum = parseFloat(price)
  if (isNaN(priceNum) || priceNum <= 0) {
    return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      origin: 'direct',
      owner_user_id: user.id,
      operation,
      title: String(title).trim().slice(0, 200),
      description: description ? String(description).trim().slice(0, 3000) : null,
      price_eur: priceNum,
      province: (province || city).trim(),
      city: String(city).trim(),
      district: district ? String(district).trim() : null,
      postal_code: postal_code ? String(postal_code).trim() : null,
      bedrooms:          bedrooms !== '' && bedrooms != null ? parseInt(bedrooms) : null,
      bathrooms:         bathrooms !== '' && bathrooms != null ? parseInt(bathrooms) : null,
      area_m2:           area !== '' && area != null ? parseFloat(area) : null,
      features:          (features && typeof features === 'object') ? features : {},
      is_particular:     true,
      particular_confidence: 1.0,
      ranking_score: 70,
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Genera descripción IA en background (sin bloquear respuesta) ───────────
  const openrouterKey = process.env.OPENROUTER_API_KEY
  if (openrouterKey && data?.id) {
    const listingForAi = {
      id: data.id,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      operation,
      city: String(city).trim(),
      district: district ? String(district).trim() : null,
      province: (province || city).trim(),
      price_eur: priceNum,
      bedrooms: bedrooms !== '' && bedrooms != null ? parseInt(bedrooms) : null,
      bathrooms: bathrooms !== '' && bathrooms != null ? parseInt(bathrooms) : null,
      area_m2: area !== '' && area != null ? parseFloat(area) : null,
    }
    generateAiDescription(listingForAi, openrouterKey)
      .then(async (aiDesc) => {
        if (!aiDesc) return
        const adminSb = await createClient()
        await adminSb
          .from('listings')
          .update({ ai_description: aiDesc })
          .eq('id', data.id)
      })
      .catch(() => { /* silencioso: el cron lo reintentará */ })
  }

  return NextResponse.json({ id: data.id })
}

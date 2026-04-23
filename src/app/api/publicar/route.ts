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
      is_particular: true,
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

  // ── Notificación al admin cuando un particular publica ────────────────────
  const resendKey   = process.env.RESEND_API_KEY
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL ?? 'info@inmonest.com'
  const fromEmail   = process.env.CONTACT_FROM_EMAIL   ?? 'Inmonest <info@inmonest.com>'

  if (resendKey && data?.id) {
    const fecha = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
    const listingUrl = `https://inmonest.com/pisos/${data.id}`
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to:   [notifyEmail],
        subject: `🏠 Nuevo anuncio de particular — ${String(city).trim()}`,
        html: `
          <div style="font-family:sans-serif;max-width:580px;margin:auto;background:#f9f9f9;padding:24px;border-radius:8px">
            <h2 style="color:#c9962a;margin:0 0 4px">¡Nuevo anuncio publicado!</h2>
            <p style="color:#888;font-size:12px;margin:0 0 20px">${fecha}</p>
            <div style="background:#fff;border-radius:8px;padding:20px;border:1px solid #e5e7eb">
              <table style="width:100%;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:7px;font-weight:700;color:#374151;width:120px">Título</td><td style="padding:7px">${String(title).trim()}</td></tr>
                <tr style="background:#f9fafb"><td style="padding:7px;font-weight:700;color:#374151">Ciudad</td><td style="padding:7px">${String(city).trim()}</td></tr>
                <tr><td style="padding:7px;font-weight:700;color:#374151">Operación</td><td style="padding:7px">${operation === 'rent' ? 'Alquiler' : 'Venta'}</td></tr>
                <tr style="background:#f9fafb"><td style="padding:7px;font-weight:700;color:#374151">Precio</td><td style="padding:7px;color:#c9962a;font-weight:700">${priceNum.toLocaleString('es-ES')} €${operation === 'rent' ? '/mes' : ''}</td></tr>
                <tr><td style="padding:7px;font-weight:700;color:#374151">Usuario</td><td style="padding:7px;font-size:12px;color:#888">${user.email ?? user.id}</td></tr>
              </table>
            </div>
            <div style="text-align:center;margin-top:20px">
              <a href="${listingUrl}" style="background:#c9962a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
                Ver anuncio →
              </a>
            </div>
          </div>
        `,
      }),
    }).catch(() => { /* no bloquear respuesta */ })
  }

  return NextResponse.json({ id: data.id })
}

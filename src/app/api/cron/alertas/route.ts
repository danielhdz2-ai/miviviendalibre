import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Protección con secret para evitar ejecuciones no autorizadas
function isAuthorized(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  const expected = process.env.CRON_SECRET
  if (!expected) return true // si no hay secret configurado, permite en dev
  return secret === expected
}

// Construye el label legible a partir de filtros
function buildLabel(filters: Record<string, unknown>): string {
  const parts: string[] = []
  if (filters.operacion === 'rent') parts.push('Alquiler')
  else if (filters.operacion === 'sale') parts.push('Venta')
  if (filters.ciudad) parts.push(`en ${filters.ciudad}`)
  if (filters.precio_max) parts.push(`≤${filters.precio_max}€`)
  if (filters.habitaciones) parts.push(`${filters.habitaciones} hab.`)
  return parts.length ? parts.join(' · ') : 'Búsqueda general'
}

// Construye la URL de búsqueda para el email
function buildSearchUrl(filters: Record<string, unknown>): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://inmonest.com'
  const params = new URLSearchParams()
  if (filters.ciudad)            params.set('ciudad',    String(filters.ciudad))
  if (filters.operacion)         params.set('operacion', String(filters.operacion))
  if (filters.precio_min)        params.set('precio_min', String(filters.precio_min))
  if (filters.precio_max)        params.set('precio_max', String(filters.precio_max))
  if (filters.habitaciones)      params.set('hab',        String(filters.habitaciones))
  if (filters.solo_particulares) params.set('solo_particulares', '1')
  if (filters.solo_bancarias)    params.set('solo_bancarias',    '1')
  return `${base}/pisos?${params.toString()}`
}

// Genera el HTML del email de alerta
function buildEmailHtml(
  label: string,
  searchUrl: string,
  listings: Array<{ id: string; title: string; price_eur: number | null; city: string | null; operation: string }>
): string {
  const listingRows = listings.slice(0, 6).map(l => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <a href="https://inmonest.com/pisos/${l.id}" style="font-weight:600; color:#0d1a0f; text-decoration:none;">
          ${l.title}
        </a><br/>
        <span style="font-size:13px; color:#666;">
          ${l.city ?? ''} ·
          ${l.price_eur ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(l.price_eur) : 'Consultar'}
          ${l.operation === 'rent' ? '/mes' : ''}
        </span>
      </td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="es">
    <body style="margin:0; padding:0; background:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7; padding: 40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; max-width:600px;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0d1a0f 0%, #1a3320 100%); padding: 32px 40px; text-align:center;">
                <div style="font-size:28px; font-weight:800; color:#c9962a; letter-spacing:-0.5px;">Inmonest</div>
                <div style="color:#9ca3af; font-size:13px; margin-top:6px;">Portal de particulares</div>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 32px 40px;">
                <h2 style="margin:0 0 6px 0; font-size:20px; color:#0d1a0f;">
                  🔔 Nuevos pisos para tu alerta
                </h2>
                <p style="margin:0 0 24px 0; color:#666; font-size:14px;">
                  <strong>${label}</strong> — ${listings.length} nuevo${listings.length !== 1 ? 's' : ''} desde tu última consulta
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${listingRows}
                </table>
                ${listings.length > 6 ? `<p style="color:#666; font-size:13px; margin-top:16px;">Y ${listings.length - 6} más...</p>` : ''}
                <!-- CTA -->
                <div style="text-align:center; margin-top:32px;">
                  <a href="${searchUrl}"
                     style="display:inline-block; background:#c9962a; color:#fff; text-decoration:none;
                            padding:14px 32px; border-radius:10px; font-weight:700; font-size:15px;">
                    Ver todos los resultados →
                  </a>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f4f5f7; padding:20px 40px; text-align:center;">
                <p style="margin:0; font-size:12px; color:#9ca3af;">
                  Recibes este email porque guardaste una alerta de búsqueda en Inmonest.<br/>
                  <a href="https://inmonest.com/mi-cuenta/alertas" style="color:#c9962a;">Gestionar mis alertas</a>
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
}

// Vercel invoca los crons con GET — exportamos GET como handler principal
export async function GET(req: NextRequest) {
  return handler(req)
}

// También admitimos POST para poder dispararlo manualmente desde scripts
export async function POST(req: NextRequest) {
  return handler(req)
}

async function handler(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Usamos service_role para poder leer auth.users emails
  const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const RESEND_KEY = process.env.RESEND_API_KEY ?? ''
  const now        = new Date()
  let processed    = 0
  let emailed      = 0

  // Obtener alertas activas que toca procesar
  const { data: alerts, error: alertErr } = await adminSupabase
    .from('search_alerts')
    .select('id, user_id, label, filters, frequency, last_sent_at')
    .eq('active', true)

  if (alertErr || !alerts) {
    return NextResponse.json({ error: alertErr?.message ?? 'Error leyendo alertas' }, { status: 500 })
  }

  for (const alert of alerts) {
    // Determinar si toca enviar según frecuencia
    const lastSent = alert.last_sent_at ? new Date(alert.last_sent_at) : null
    const shouldSend = (() => {
      if (!lastSent) return true
      const msAgo = now.getTime() - lastSent.getTime()
      if (alert.frequency === 'immediate') return msAgo >= 1  * 60 * 60 * 1000 // 1h mínimo
      if (alert.frequency === 'daily')     return msAgo >= 20 * 60 * 60 * 1000 // 20h
      if (alert.frequency === 'weekly')    return msAgo >= 6  * 24 * 60 * 60 * 1000 // 6 días
      return false
    })()

    if (!shouldSend) continue
    processed++

    // Construir query de listings nuevos desde last_sent_at (o últimas 24h si nunca)
    const since = lastSent ?? new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const f     = alert.filters as Record<string, unknown>

    let query = adminSupabase
      .from('listings')
      .select('id, title, price_eur, city, operation')
      .eq('status', 'published')
      .gt('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    if (f.ciudad)            query = query.ilike('city', `%${f.ciudad}%`)
    if (f.operacion)         query = query.eq('operation', f.operacion)
    if (f.precio_min)        query = query.gte('price_eur', f.precio_min)
    if (f.precio_max)        query = query.lte('price_eur', f.precio_max)
    if (f.habitaciones)      query = query.gte('bedrooms', f.habitaciones)
    if (f.banos_min)         query = query.gte('bathrooms', f.banos_min)
    if (f.area_min)          query = query.gte('area_m2', f.area_min)
    if (f.solo_particulares) query = query.eq('is_particular', true)
    if (f.solo_bancarias)    query = query.eq('is_bank', true)

    const { data: matchedListings } = await query

    if (!matchedListings || matchedListings.length === 0) {
      // Actualizar last_sent_at igualmente para no volver a procesar
      await adminSupabase
        .from('search_alerts')
        .update({ last_sent_at: now.toISOString() })
        .eq('id', alert.id)
      continue
    }

    // Obtener email del usuario desde auth.users
    const { data: { user } } = await adminSupabase.auth.admin.getUserById(alert.user_id)
    if (!user?.email) continue

    // Enviar email
    const label     = alert.label ?? buildLabel(f)
    const searchUrl = buildSearchUrl(f)
    const html      = buildEmailHtml(label, searchUrl, matchedListings)

    const emailRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from:    'Inmonest Alertas <alertas@inmonest.com>',
        to:      user.email,
        subject: `🔔 ${matchedListings.length} nuevo${matchedListings.length !== 1 ? 's' : ''} piso${matchedListings.length !== 1 ? 's' : ''}: ${label}`,
        html,
      }),
    })

    if (emailRes.ok) {
      emailed++
      await adminSupabase
        .from('search_alerts')
        .update({
          last_sent_at:  now.toISOString(),
          last_match_at: now.toISOString(),
          total_sent:    ((alert as unknown as { total_sent: number }).total_sent ?? 0) + 1,
        })
        .eq('id', alert.id)
    }
  }

  return NextResponse.json({ ok: true, processed, emailed })
}

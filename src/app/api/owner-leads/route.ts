import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Notificación por email (usando Resend si RESEND_API_KEY está configurado,
// si no, solo registra en consola de Vercel)
async function sendNotification(lead: Record<string, unknown>) {
  const RESEND_KEY = process.env.RESEND_API_KEY
  const NOTIFY_EMAIL = process.env.OWNER_LEADS_NOTIFY_EMAIL ?? process.env.ADMIN_EMAIL

  if (!RESEND_KEY || !NOTIFY_EMAIL) {
    // Sin configuración de email → solo log (Vercel Functions logs)
    console.log('[owner-lead] Nuevo lead de vendedor:', JSON.stringify(lead, null, 2))
    return
  }

  const body = {
    from: 'MiViviendaLibre <noreply@miviviendalibre.com>',
    to: [NOTIFY_EMAIL],
    subject: `🏠 Nuevo lead de vendedor — ${lead.address ?? ''} (${lead.city ?? ''})`,
    html: `
      <h2 style="color:#c9962a">Nuevo lead de propietario vendedor</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
        <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Nombre</td><td style="padding:6px 12px">${lead.name}</td></tr>
        <tr style="background:#fafafa"><td style="padding:6px 12px;font-weight:bold;color:#555">Teléfono</td><td style="padding:6px 12px"><a href="tel:${lead.phone}">${lead.phone}</a></td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Email</td><td style="padding:6px 12px"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
        <tr style="background:#fafafa"><td style="padding:6px 12px;font-weight:bold;color:#555">Dirección</td><td style="padding:6px 12px">${lead.address}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Ciudad</td><td style="padding:6px 12px">${lead.city} ${lead.postal_code ?? ''}</td></tr>
        <tr style="background:#fafafa"><td style="padding:6px 12px;font-weight:bold;color:#555">Operación</td><td style="padding:6px 12px">${lead.operation === 'rent' ? 'Alquiler' : 'Venta'}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Tipo</td><td style="padding:6px 12px">${lead.property_type ?? '—'}</td></tr>
        <tr style="background:#fafafa"><td style="padding:6px 12px;font-weight:bold;color:#555">Superficie</td><td style="padding:6px 12px">${lead.area_m2 ? `${lead.area_m2} m²` : '—'}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Habitaciones</td><td style="padding:6px 12px">${lead.bedrooms ?? '—'}</td></tr>
        <tr style="background:#fafafa"><td style="padding:6px 12px;font-weight:bold;color:#555">Estado</td><td style="padding:6px 12px">${lead.condition ?? '—'}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Precio estimado</td><td style="padding:6px 12px">${lead.estimated_price ? `${Number(lead.estimated_price).toLocaleString('es-ES')} €` : '—'}</td></tr>
      </table>
      <p style="margin-top:20px;color:#888;font-size:12px">Generado el ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
    `,
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json() as Record<string, unknown>

    // Validación mínima
    const { name, phone, email, address } = data
    if (!name || !phone || !email || !address) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Insertar en Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/owner_leads`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        address:         data.address,
        city:            data.city ?? null,
        postal_code:     data.postal_code ?? null,
        province:        data.province ?? null,
        lat:             data.lat ?? null,
        lng:             data.lng ?? null,
        property_type:   data.property_type ?? null,
        operation:       data.operation ?? 'sale',
        area_m2:         data.area_m2 ?? null,
        bedrooms:        data.bedrooms ?? null,
        condition:       data.condition ?? null,
        estimated_price: data.estimated_price ?? null,
        name:            data.name,
        phone:           data.phone,
        email:           data.email,
        status:          'new',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[owner-lead] Supabase error:', err)
      return NextResponse.json({ error: 'Error al guardar el lead' }, { status: 500 })
    }

    const [lead] = await res.json() as Array<Record<string, unknown>>

    // Enviar notificación (no bloqueante)
    sendNotification({ ...data, id: lead?.id }).catch(console.error)

    return NextResponse.json({ ok: true, id: lead?.id })
  } catch (err) {
    console.error('[owner-lead] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

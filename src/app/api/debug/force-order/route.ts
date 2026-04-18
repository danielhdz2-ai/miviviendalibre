import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeKey, decodeEnvKey } from '@/lib/stripe-key'

export const dynamic = 'force-dynamic'

const RESEND_API = 'https://api.resend.com/emails'
const BASE_URL   = 'https://inmonest.com'

// Protección mínima: token en query param
// Uso: /api/debug/force-order?token=inmonest2026&session_id=cs_xxx
const DEBUG_TOKEN = 'inmonest2026'

const SERVICE_NAMES: Record<string, string> = {
  'arras-penitenciales':   'Contrato de Arras Penitenciales',
  'arras-confirmatorias':  'Contrato de Arras Confirmatorias',
  'reserva-compra':        'Contrato de Reserva de Compra',
  'alquiler-vivienda-lau': 'Contrato de Alquiler de Vivienda (LAU)',
  'alquiler-temporada':    'Contrato de Alquiler por Temporada',
  'alquiler-habitacion':   'Contrato de Alquiler de Habitación',
  'reserva-alquiler':      'Contrato de Reserva de Alquiler',
  'rescision-alquiler':    'Contrato de Rescisión de Alquiler',
  'liquidacion-fianza':    'Liquidación de Fianza',
  'devolucion-fianzas':    'Solicitud de Devolución de Fianzas',
}

async function sendEmail(payload: {
  from: string; to: string[]; subject: string; html: string; reply_to?: string
}): Promise<{ ok: boolean; info: string }> {
  const resendKey = decodeEnvKey(process.env.RESEND_API_KEY ?? '')
  if (!resendKey) return { ok: false, info: 'RESEND_API_KEY no configurada' }

  const res  = await fetch(RESEND_API, {
    method:  'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) return { ok: false, info: JSON.stringify(data) }
  return { ok: true, info: data.id }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const token          = searchParams.get('token')          ?? ''
  const session_id     = searchParams.get('session_id')     ?? ''
  const payment_intent = searchParams.get('payment_intent') ?? ''

  // ── Seguridad básica ─────────────────────────────────────────────────
  if (token !== DEBUG_TOKEN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (!session_id.startsWith('cs_') && !payment_intent.startsWith('pi_')) {
    return NextResponse.json({
      error: 'Parámetro requerido. Uso: ?token=inmonest2026&session_id=cs_xxx  O  ?token=inmonest2026&payment_intent=pi_xxx'
    }, { status: 400 })
  }

  const log: string[] = []
  const push = (msg: string) => { console.log('[force-order]', msg); log.push(msg) }

  const stripeKey = getStripeKey()
  if (!stripeKey) return NextResponse.json({ error: 'STRIPE_SECRET_KEY no configurada', log }, { status: 500 })

  // ── 1. Obtener sesión de Stripe ──────────────────────────────────────
  let session: Record<string, unknown>

  if (session_id.startsWith('cs_')) {
    push(`Buscando por session_id: ${session_id}`)
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session_id)}`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    )
    session = await res.json()
    if (!res.ok) {
      push(`ERROR Stripe: ${(session.error as { message?: string })?.message}`)
      return NextResponse.json({ error: (session.error as { message?: string })?.message, log }, { status: 404 })
    }
  } else {
    // Buscar checkout session por payment_intent
    push(`Buscando sesión por payment_intent: ${payment_intent}`)
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions?payment_intent=${encodeURIComponent(payment_intent)}&limit=1`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    )
    const list = await res.json() as { data?: Record<string, unknown>[]; error?: { message: string } }
    if (!res.ok || !list.data?.length) {
      const msg = list.error?.message ?? 'No se encontró ninguna sesión para ese payment_intent'
      push(`ERROR: ${msg}`)
      return NextResponse.json({ error: msg, log }, { status: 404 })
    }
    session = list.data[0]
    push(`Sesión encontrada: ${session.id}`)
  }

  push(`Sesión Stripe OK. payment_status: ${session.payment_status}`)
  const custDetails = session.customer_details as { email?: string } | undefined
  push(`customer_email: ${custDetails?.email ?? session.customer_email ?? '(vacío)'}`)

  if (session.payment_status !== 'paid') {
    push('ADVERTENCIA: pago no completado — procesando igualmente para debug')
  }

  const meta        = (session.metadata as Record<string, string>) ?? {}
  const amountRaw   = typeof session.amount_total === 'number' ? session.amount_total : 0
  const amount      = (amountRaw / 100).toFixed(2)
  const clientEmail = custDetails?.email ?? (session.customer_email as string) ?? meta.client_email ?? ''
  const clientName  = meta.client_name  ?? 'Cliente'
  const clientPhone = meta.client_phone ?? '—'
  const serviceKey  = meta.service_key  ?? ''
  const serviceName = SERVICE_NAMES[serviceKey] ?? serviceKey.replace(/-/g, ' ')
  const fecha = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })

  const FROM_EMAIL   = decodeEnvKey(process.env.CONTACT_FROM_EMAIL   ?? '') || 'Inmonest <info@inmonest.com>'
  const NOTIFY_EMAIL = decodeEnvKey(process.env.CONTACT_NOTIFY_EMAIL ?? '') || 'info@inmonest.com'

  push(`Servicio: ${serviceKey} | Cliente: ${clientEmail} | Importe: ${amount}€`)

  // ── 2. Guardar en gestoria_requests ──────────────────────────────────
  const supabase = await createClient()
  const { error: grErr } = await supabase
    .from('gestoria_requests')
    .upsert({
      session_id:            session.id,
      service_key:           serviceKey,
      client_email:          clientEmail,
      client_name:           clientName,
      client_phone:          clientPhone,
      amount_eur:            parseFloat(amount),
      status:                'paid',
      paid_at:               new Date().toISOString(),
      stripe_payment_intent: session.payment_intent ?? null,
    }, { onConflict: 'session_id' })

  if (grErr) push(`DB ERROR: ${grErr.message}`)
  else       push('gestoria_requests guardado OK ✅')

  // ── 3. Email al ADMIN ────────────────────────────────────────────────
  push(`Enviando email ADMIN a ${NOTIFY_EMAIL}...`)
  const adminResult = await sendEmail({
    from:    FROM_EMAIL,
    to:      [NOTIFY_EMAIL],
    subject: `💰 [FORCE] Nueva venta ${amount}€ — ${serviceKey}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#f9f9f9;padding:24px;border-radius:8px">
        <h2 style="color:#c9962a">¡Nueva venta en Inmonest!</h2>
        <p style="color:#888;font-size:12px">${fecha} · Procesado manualmente vía force-order</p>
        <table style="width:100%;font-size:14px;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden">
          <tr><td style="padding:10px;font-weight:700;color:#374151;width:130px">Servicio</td><td style="padding:10px">${serviceName}</td></tr>
          <tr style="background:#f9fafb"><td style="padding:10px;font-weight:700;color:#374151">Importe</td><td style="padding:10px;color:#c9962a;font-weight:700;font-size:18px">${amount} €</td></tr>
          <tr><td style="padding:10px;font-weight:700;color:#374151">Cliente</td><td style="padding:10px">${clientName}</td></tr>
          <tr style="background:#f9fafb"><td style="padding:10px;font-weight:700;color:#374151">Email</td><td style="padding:10px"><a href="mailto:${clientEmail}" style="color:#c9962a">${clientEmail}</a></td></tr>
          <tr><td style="padding:10px;font-weight:700;color:#374151">Teléfono</td><td style="padding:10px">${clientPhone}</td></tr>
          <tr style="background:#f9fafb"><td style="padding:10px;font-weight:700;color:#374151">Sesión</td><td style="padding:10px;font-size:11px;color:#888">${session.id}</td></tr>
        </table>
      </div>
    `,
  })
  push(`Email ADMIN: ${adminResult.ok ? '✅ OK id=' + adminResult.info : '❌ ' + adminResult.info}`)

  // ── 4. Email al CLIENTE ──────────────────────────────────────────────
  let clientResult = { ok: false, info: 'Sin email de cliente' }
  if (clientEmail) {
    push(`Enviando email CLIENTE a ${clientEmail}...`)
    clientResult = await sendEmail({
      from:     FROM_EMAIL,
      to:       [clientEmail],
      reply_to: NOTIFY_EMAIL,
      subject:  `✅ Confirmación de tu pedido — Inmonest`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <div style="background:linear-gradient(135deg,#7a5c1e,#c9962a);padding:32px 24px;border-radius:8px 8px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px">¡Gracias por confiar en Inmonest!</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px">
            <p style="color:#374151;font-size:15px">Hola <strong>${clientName}</strong>,</p>
            <p style="color:#374151;font-size:15px">Hemos recibido tu pago correctamente.</p>
            <div style="background:#fef9e8;border:1px solid #f4c94a;border-radius:8px;padding:16px;margin:24px 0">
              <p style="margin:0;font-size:14px;color:#7a5c1e;font-weight:700">Detalles del pedido</p>
              <p style="margin:8px 0 0;font-size:14px;color:#374151">Servicio: <strong>${serviceName}</strong></p>
              <p style="margin:4px 0 0;font-size:14px;color:#374151">Importe: <strong style="color:#c9962a">${amount} €</strong></p>
            </div>
            <p style="color:#374151;font-size:14px">Nuestro equipo te contactará en las próximas <strong>24 horas</strong>.</p>
            <div style="text-align:center;margin:28px 0">
              <a href="${BASE_URL}/mis-documentos" style="background:#c9962a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
                Ver mi zona de documentos →
              </a>
            </div>
            <p style="color:#9ca3af;font-size:12px;text-align:center">¿Dudas? <a href="mailto:${NOTIFY_EMAIL}" style="color:#c9962a">${NOTIFY_EMAIL}</a></p>
          </div>
        </div>
      `,
    })
    push(`Email CLIENTE: ${clientResult.ok ? '✅ OK id=' + clientResult.info : '❌ ' + clientResult.info}`)
  } else {
    push('Sin email de cliente — email omitido')
  }

  return NextResponse.json({
    ok: true,
    session_id,
    service: serviceName,
    client_email: clientEmail,
    amount_eur: amount,
    db: grErr ? `ERROR: ${grErr.message}` : 'OK',
    email_admin:  adminResult,
    email_client: clientResult,
    log,
  })
}

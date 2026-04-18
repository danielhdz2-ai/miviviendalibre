import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeKey } from '@/lib/stripe-key'

export const dynamic = 'force-dynamic'

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

interface StripeSession {
  id: string
  payment_status: string
  customer_email: string | null
  customer_details?: { email?: string | null }
  metadata?: Record<string, string>
  amount_total?: number | null
  payment_intent?: string | null
  error?: { message: string }
}

/**
 * GET /api/gestoria/confirmar-pago?session_id=cs_xxx
 *
 * 1. Verifica el pago con Stripe (fetch nativo, sin SDK)
 * 2. Guarda / actualiza el registro en gestoria_requests (idempotente)
 * 3. Devuelve { ok, service_name, customer_email } para mostrar en pantalla
 *
 * Los emails se envían desde el webhook (/api/stripe/webhook) para evitar duplicados.
 */
export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session_id')

  if (!session_id?.startsWith('cs_')) {
    return NextResponse.json({ error: 'session_id inválido' }, { status: 400 })
  }

  const key = getStripeKey()
  if (!key) {
    console.error('[confirmar-pago] STRIPE_SECRET_KEY no configurada')
    return NextResponse.json({ error: 'Pago no disponible temporalmente' }, { status: 503 })
  }

  console.log('[confirmar-pago] Verificando sesión:', session_id)

  // ── 1. Verificar sesión en Stripe (fetch nativo) ──────────────────────
  let session: StripeSession
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session_id)}`,
      { headers: { Authorization: `Bearer ${key}` } }
    )
    session = await res.json() as StripeSession
    if (!res.ok) {
      console.error('[confirmar-pago] Stripe error:', session.error?.message)
      return NextResponse.json(
        { error: session.error?.message ?? 'Sesión de pago no encontrada' },
        { status: 404 }
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de red'
    console.error('[confirmar-pago] fetch Stripe error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // ── 2. Comprobar que el pago está completado ──────────────────────────
  if (session.payment_status !== 'paid') {
    console.log('[confirmar-pago] Pago no completado. status:', session.payment_status)
    return NextResponse.json({ error: 'pago_pendiente' }, { status: 402 })
  }

  const meta          = session.metadata ?? {}
  const service_key   = meta.service_key ?? ''
  const service_name  = SERVICE_NAMES[service_key] ?? service_key.replace(/-/g, ' ')
  const client_email  = session.customer_details?.email ?? session.customer_email ?? ''
  const client_name   = meta.client_name ?? ''
  const client_phone  = meta.client_phone ?? ''
  const amount_eur    = session.amount_total != null ? session.amount_total / 100 : null

  console.log('[confirmar-pago] Pago OK — servicio:', service_key, '| cliente:', client_email)

  // ── 3. Guardar en gestoria_requests (idempotente) ─────────────────────
  try {
    const supabase = await createClient()
    const { error: dbErr } = await supabase
      .from('gestoria_requests')
      .upsert(
        {
          session_id:   session.id,
          service_key,
          client_email,
          client_name,
          client_phone,
          amount_eur,
          status:       'paid',
          paid_at:      new Date().toISOString(),
          stripe_payment_intent: session.payment_intent ?? null,
        },
        { onConflict: 'session_id' }
      )
    if (dbErr) {
      console.error('[confirmar-pago] gestoria_requests upsert error:', dbErr.message)
    } else {
      console.log('[confirmar-pago] gestoria_requests guardado OK')
    }
  } catch (err) {
    // No bloqueamos la respuesta al usuario si falla el guardado
    console.error('[confirmar-pago] Supabase error:', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ ok: true, service_name, customer_email: client_email })
}

import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session_id')

  if (!session_id?.startsWith('cs_')) {
    return NextResponse.json({ error: 'session_id inválido' }, { status: 400 })
  }

  const key = getStripeKey()
  if (!key) {
    return NextResponse.json({ error: 'Stripe no configurado' }, { status: 503 })
  }

  console.log('[confirm-payment] Verificando sesión:', session_id)

  // Llamada nativa a Stripe REST API (sin SDK — compatible con Vercel Hobby)
  let session: StripeSession
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session_id)}`,
      { headers: { Authorization: `Bearer ${key}` } }
    )
    session = await res.json() as StripeSession
    if (!res.ok) {
      console.error('[confirm-payment] Stripe error:', session.error?.message)
      return NextResponse.json({ error: session.error?.message ?? 'Sesión no encontrada' }, { status: 404 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de red'
    console.error('[confirm-payment] fetch error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  if (session.payment_status !== 'paid') {
    console.log('[confirm-payment] Pago no completado. status:', session.payment_status)
    return NextResponse.json({ error: 'pago_pendiente' }, { status: 402 })
  }

  const service_key    = session.metadata?.service_key ?? ''
  const service_name   = SERVICE_NAMES[service_key] ?? service_key.replace(/-/g, ' ')
  const customer_email = session.customer_details?.email ?? session.customer_email ?? ''

  console.log('[confirm-payment] Pago OK — servicio:', service_key, '| cliente:', customer_email)

  return NextResponse.json({ ok: true, service_name, customer_email })
}

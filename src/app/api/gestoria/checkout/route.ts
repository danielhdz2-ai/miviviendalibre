import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://inmonest.com'

const STRIPE_SERVICES: Record<string, { name: string; price_eur: number }> = {
  'arras-penitenciales':   { name: 'Contrato de Arras Penitenciales',       price_eur: 120 },
  'arras-confirmatorias':  { name: 'Contrato de Arras Confirmatorias',       price_eur: 120 },
  'reserva-compra':        { name: 'Contrato de Reserva de Compra',          price_eur: 50  },
  'alquiler-vivienda-lau': { name: 'Contrato de Alquiler de Vivienda (LAU)', price_eur: 90  },
  'alquiler-temporada':    { name: 'Contrato de Alquiler por Temporada',     price_eur: 80  },
  'alquiler-habitacion':   { name: 'Contrato de Alquiler de Habitación',     price_eur: 60  },
  'reserva-alquiler':      { name: 'Contrato de Reserva de Alquiler',        price_eur: 50  },
  'rescision-alquiler':    { name: 'Contrato de Rescisión de Alquiler',      price_eur: 60  },
  'liquidacion-fianza':    { name: 'Liquidación de Fianza',                  price_eur: 30  },
  'devolucion-fianzas':    { name: 'Solicitud de Devolución de Fianzas',     price_eur: 40  },
}

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'Pago no disponible. Contacta con info@inmonest.com' },
      { status: 503 }
    )
  }

  let body: { service_key?: string; client_email?: string; client_name?: string; client_phone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { service_key, client_email, client_name, client_phone } = body

  if (!service_key?.trim()) {
    return NextResponse.json({ error: 'service_key requerido' }, { status: 400 })
  }

  const service = STRIPE_SERVICES[service_key]
  if (!service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  const safeEmail = client_email?.trim().slice(0, 200) || undefined
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (safeEmail && !EMAIL_RE.test(safeEmail)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const successPath = service_key === 'reserva-compra'
    ? '/gestoria/carga-documentos'
    : '/mis-documentos'

  // Llamada directa a la API REST de Stripe con fetch nativo (sin SDK)
  const params = new URLSearchParams()
  params.set('mode', 'payment')
  params.set('line_items[0][quantity]', '1')
  params.set('line_items[0][price_data][currency]', 'eur')
  params.set('line_items[0][price_data][unit_amount]', String(service.price_eur * 100))
  params.set('line_items[0][price_data][product_data][name]', service.name)
  params.set('line_items[0][price_data][product_data][description]', 'Inmonest — Gestoría inmobiliaria')
  params.set('success_url', `${BASE_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`)
  params.set('cancel_url', `${BASE_URL}/gestoria`)
  params.set('locale', 'es')
  params.set('payment_method_types[0]', 'card')
  params.set('billing_address_collection', 'auto')
  params.set('metadata[service_key]', service_key)
  params.set('metadata[client_name]',  (client_name?.trim() ?? '').slice(0, 120))
  params.set('metadata[client_phone]', (client_phone?.trim() ?? '').slice(0, 30))
  if (safeEmail) params.set('customer_email', safeEmail)

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key.trim()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await res.json() as { url?: string; error?: { message: string } }

    if (!res.ok) {
      console.error('[gestoria/checkout] Stripe API error:', data.error)
      return NextResponse.json({ error: data.error?.message ?? 'Error en Stripe' }, { status: 500 })
    }

    return NextResponse.json({ url: data.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de red'
    console.error('[gestoria/checkout] fetch error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const BASE_URL = 'https://inmonest.com'

// Servicios de gestoría con pago directo en Stripe
const STRIPE_SERVICES: Record<string, { name: string; price_eur: number }> = {
  'reserva-compra': { name: 'Contrato de Reserva de Compra', price_eur: 50 },
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
}

export async function POST(req: NextRequest) {
  let body: { service_key?: string; client_email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { service_key, client_email } = body

  if (!service_key?.trim()) {
    return NextResponse.json({ error: 'service_key requerido' }, { status: 400 })
  }

  const service = STRIPE_SERVICES[service_key]
  if (!service) {
    return NextResponse.json({ error: 'Servicio no disponible para pago directo' }, { status: 404 })
  }

  // Validar email opcional
  const safeEmail = client_email?.trim().slice(0, 200) || undefined
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (safeEmail && !EMAIL_RE.test(safeEmail)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: service.price_eur * 100,
          product_data: { name: service.name },
        },
      },
    ],
    customer_email: safeEmail,
    metadata: { service_key },
    success_url: `${BASE_URL}/gestoria/carga-documentos?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/gestoria`,
    locale: 'es',
    payment_method_types: ['card'],
    billing_address_collection: 'auto',
  })

  return NextResponse.json({ url: session.url })
}

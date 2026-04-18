import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://inmonest.com'

// Todos los servicios de gestoría con pago directo en Stripe
const STRIPE_SERVICES: Record<string, { name: string; price_eur: number }> = {
  'arras-penitenciales':  { name: 'Contrato de Arras Penitenciales',     price_eur: 120 },
  'arras-confirmatorias': { name: 'Contrato de Arras Confirmatorias',     price_eur: 120 },
  'reserva-compra':       { name: 'Contrato de Reserva de Compra',        price_eur: 50  },
  'alquiler-vivienda-lau':{ name: 'Contrato de Alquiler de Vivienda (LAU)', price_eur: 90 },
  'alquiler-temporada':   { name: 'Contrato de Alquiler por Temporada',   price_eur: 80  },
  'alquiler-habitacion':  { name: 'Contrato de Alquiler de Habitación',   price_eur: 60  },
  'reserva-alquiler':     { name: 'Contrato de Reserva de Alquiler',      price_eur: 50  },
  'rescision-alquiler':   { name: 'Contrato de Rescisión de Alquiler',    price_eur: 60  },
  'liquidacion-fianza':   { name: 'Liquidación de Fianza',                price_eur: 30  },
  'devolucion-fianzas':   { name: 'Solicitud de Devolución de Fianzas',   price_eur: 40  },
}

// Instancia singleton — configurada para entornos serverless (0 reintentos,
// timeout explícito para no agotar los 30s del plan de Vercel)
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
      maxNetworkRetries: 0,  // falla rápido — sin reintentos que agoten el tiempo
      timeout: 8000,         // 8 segundos máximo por intento
    })
  }
  return _stripe
}

export async function POST(req: NextRequest) {
  // Verificar que la clave de Stripe está configurada
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'El pago con tarjeta no está disponible en este momento. Contacta con info@inmonest.com' },
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
    return NextResponse.json({ error: 'Servicio no disponible para pago directo' }, { status: 404 })
  }

  // Validar email opcional
  const safeEmail = client_email?.trim().slice(0, 200) || undefined
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (safeEmail && !EMAIL_RE.test(safeEmail)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  // Para reserva-compra (requiere documentación): redirect a carga de docs
  // Para el resto: redirect a página de confirmación
  const successPath = service_key === 'reserva-compra'
    ? '/gestoria/carga-documentos'
    : '/gestoria/gracias'

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: service.price_eur * 100,
            product_data: {
              name: service.name,
              description: 'Inmonest — Servicio de gestoría inmobiliaria',
            },
          },
        },
      ],
      customer_email: safeEmail,
      metadata: {
        service_key,
        client_name:  client_name?.trim().slice(0, 120) ?? '',
        client_phone: client_phone?.trim().slice(0, 30) ?? '',
      },
      success_url: `${BASE_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${BASE_URL}/gestoria`,
      locale: 'es',
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    // Log completo en servidor para diagnóstico
    const stripeErr = err as Stripe.errors.StripeError
    console.error('[gestoria/checkout] Stripe error:', {
      type:    stripeErr.type,
      code:    stripeErr.code,
      message: stripeErr.message,
      raw:     stripeErr.raw,
    })
    const msg = stripeErr.message ?? 'Error al crear la sesión de pago'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

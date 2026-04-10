import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://miviviendalibre.vercel.app'

// Mapa slug → Stripe Price ID (se configuran en Vercel como env vars)
// STRIPE_PRICE_TURBO_7D, STRIPE_PRICE_VISIBILITY_30D
const SLUG_TO_PRICE: Record<string, string | undefined> = {
  turbo_7d: process.env.STRIPE_PRICE_TURBO_7D,
  visibility_30d: process.env.STRIPE_PRICE_VISIBILITY_30D,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let body: { slug: string; listing_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { slug, listing_id } = body
  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 })

  // Buscar producto en Supabase
  const { data: product } = await supabase
    .from('products')
    .select('id, slug, name, price_eur')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  // Si hay Stripe Price ID configurado, usarlo; si no, crear precio dinámico
  const stripePriceId = SLUG_TO_PRICE[slug]

  let priceData: Stripe.Checkout.SessionCreateParams['line_items'] = []

  if (stripePriceId) {
    priceData = [{ price: stripePriceId, quantity: 1 }]
  } else {
    priceData = [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(Number(product.price_eur) * 100),
        product_data: { name: product.name },
      },
    }]
  }

  // Crear order pendiente en Supabase
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      product_id: product.id,
      listing_id: listing_id ?? null,
      amount_eur: product.price_eur,
      status: 'pending',
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 })
  }

  // Crear sesión Stripe Checkout
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: priceData,
    metadata: {
      order_id: order.id,
      user_id: user.id,
      listing_id: listing_id ?? '',
      product_slug: slug,
    },
    customer_email: user.email ?? undefined,
    success_url: `${BASE_URL}/turbo/exito?session_id={CHECKOUT_SESSION_ID}&listing_id=${listing_id ?? ''}`,
    cancel_url: `${BASE_URL}/turbo/cancelado?listing_id=${listing_id ?? ''}`,
    locale: 'es',
    payment_method_types: ['card'],
    billing_address_collection: 'auto',
  })

  // Guardar checkout_id en la order
  await supabase
    .from('orders')
    .update({ stripe_checkout_id: session.id })
    .eq('id', order.id)

  return NextResponse.json({ url: session.url })
}

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata ?? {}

    const supabase = await createClient()

    // Marcar order como pagada
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        stripe_payment_intent: session.payment_intent as string ?? null,
        paid_at: new Date().toISOString(),
      })
      .eq('stripe_checkout_id', session.id)

    // Si es Turbo: activar turbo_until en el anuncio (+7 días)
    if (meta.product_slug === 'turbo_7d' && meta.listing_id) {
      const until = new Date()
      until.setDate(until.getDate() + 7)
      await supabase
        .from('listings')
        .update({ turbo_until: until.toISOString() })
        .eq('id', meta.listing_id)
        .eq('owner_user_id', meta.user_id)
    }

    // Si es Pack Visibilidad 30 días: ranking_score += 30 durante 30 días
    // (implementación simplificada: bump de ranking + turbo_until 30 días)
    if (meta.product_slug === 'visibility_30d' && meta.listing_id) {
      const until = new Date()
      until.setDate(until.getDate() + 30)
      await supabase
        .from('listings')
        .update({
          turbo_until: until.toISOString(),
          ranking_score: 100,
        })
        .eq('id', meta.listing_id)
        .eq('owner_user_id', meta.user_id)
    }
  }

  return NextResponse.json({ received: true })
}

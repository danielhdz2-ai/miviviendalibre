import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const DOCS = ['dni', 'nota-simple', 'escrituras'] as const

export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session_id')
  if (!session_id?.startsWith('cs_')) {
    return NextResponse.json({ error: 'session_id inválido' }, { status: 400 })
  }

  // Verificar pago con Stripe
  const stripe = getStripe()
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(session_id)
  } catch {
    return NextResponse.json({ error: 'Sesión de pago no encontrada' }, { status: 404 })
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'pago_pendiente' }, { status: 402 })
  }

  // Generar signed upload URLs (una por documento)
  const supabase = getSupabaseAdmin()
  const urls: Record<string, { signedUrl: string; token: string; path: string }> = {}

  for (const doc of DOCS) {
    const path = `${session_id}/${doc}.pdf`
    const { data, error } = await supabase.storage
      .from('gestoria-docs')
      .createSignedUploadUrl(path)

    if (error || !data) {
      return NextResponse.json({ error: `Error generando URL para ${doc}: ${error?.message}` }, { status: 500 })
    }
    urls[doc] = { signedUrl: data.signedUrl, token: data.token, path }
  }

  return NextResponse.json({ urls, customer_email: session.customer_details?.email ?? session.customer_email ?? '' })
}

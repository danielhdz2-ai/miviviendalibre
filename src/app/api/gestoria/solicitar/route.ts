import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { service_key, service_name, price_eur, client_name, client_email, client_phone, notes } = body

  if (!service_key?.trim() || !service_name?.trim() || !price_eur) {
    return NextResponse.json({ error: 'Servicio inválido' }, { status: 400 })
  }
  if (!client_name?.trim()) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 422 })
  }
  if (!client_email?.trim() || !EMAIL_RE.test(client_email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 422 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('gestoria_requests').insert({
    service_key: service_key.trim(),
    service_name: service_name.trim(),
    price_eur: parseInt(String(price_eur), 10),
    client_name: client_name.trim().slice(0, 120),
    client_email: client_email.trim().toLowerCase().slice(0, 200),
    client_phone: client_phone?.trim().slice(0, 30) || null,
    notes: notes?.trim().slice(0, 1000) || null,
    status: 'pending',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

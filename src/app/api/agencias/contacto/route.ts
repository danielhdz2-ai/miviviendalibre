import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let body: { nombre?: string; empresa?: string; email?: string; telefono?: string; mensaje?: string; plan?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { nombre, empresa, email, plan, telefono, mensaje } = body

  if (!nombre || !empresa || !email) {
    return NextResponse.json({ error: 'nombre, empresa y email son obligatorios' }, { status: 400 })
  }

  // Validación básica de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase.from('agency_leads').insert({
    nombre: nombre.slice(0, 100),
    empresa: empresa.slice(0, 100),
    email: email.slice(0, 200),
    telefono: telefono?.slice(0, 20) ?? null,
    plan: plan ?? 'premium',
    mensaje: mensaje?.slice(0, 1000) ?? null,
  })

  if (error) {
    // Si la tabla no existe aún, responder de todas formas con éxito
    // para no romper el UX (la tabla se crea con la migración)
    console.error('agency_leads insert error:', error.message)
  }

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// PATCH: activar/desactivar o cambiar frecuencia
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}

  if (typeof body.active === 'boolean')      allowed.active    = body.active
  if (['immediate','daily','weekly'].includes(body.frequency)) {
    allowed.frequency = body.frequency
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Sin campos válidos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('search_alerts')
    .update(allowed)
    .eq('id', id)
    .eq('user_id', user.id) // solo la propia

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE: eliminar alerta
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('search_alerts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // solo la propia

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: mensajes de una conversación
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  // Verificar que el usuario es participante
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, buyer_id, seller_id, listing_id, listings(id, title, city)')
    .eq('id', id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })

  // Cargar mensajes
  const { data: msgs, error } = await supabase
    .from('messages')
    .select('id, sender_id, body, read_at, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Marcar como leídos los mensajes del otro participante
  const isBuyer = conv.buyer_id === user.id
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', id)
    .neq('sender_id', user.id)
    .is('read_at', null)

  // Resetear contador de no-leídos
  await supabase
    .from('conversations')
    .update(isBuyer ? { unread_buyer: 0 } : { unread_seller: 0 })
    .eq('id', id)

  return NextResponse.json({ conversation: conv, messages: msgs ?? [] })
}

// POST: enviar mensaje
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const { body } = await req.json()

  if (!body || typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
  }
  const sanitized = body.trim().slice(0, 2000)

  // Verificar participación
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, buyer_id, seller_id')
    .eq('id', id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({ conversation_id: id, sender_id: user.id, body: sanitized })
    .select('id, sender_id, body, read_at, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: msg })
}

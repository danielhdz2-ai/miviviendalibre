import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: listar conversaciones del usuario
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      listing_id,
      buyer_id,
      seller_id,
      last_message,
      last_message_at,
      unread_buyer,
      unread_seller,
      created_at,
      listings ( id, title, city )
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ conversations: data ?? [] })
}

// POST: crear o recuperar conversación existente
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { listing_id, initial_message } = await req.json()
  if (!listing_id) return NextResponse.json({ error: 'listing_id requerido' }, { status: 400 })

  // Obtener el propietario del anuncio
  const { data: listing } = await supabase
    .from('listings')
    .select('id, owner_user_id, title')
    .eq('id', listing_id)
    .single()

  if (!listing?.owner_user_id) {
    return NextResponse.json({ error: 'Anuncio no encontrado o sin propietario' }, { status: 404 })
  }
  if (listing.owner_user_id === user.id) {
    return NextResponse.json({ error: 'No puedes contactar con tu propio anuncio' }, { status: 400 })
  }

  // Upsert conversación (unique buyer + listing)
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .upsert({
      listing_id,
      buyer_id:  user.id,
      seller_id: listing.owner_user_id,
    }, { onConflict: 'buyer_id,listing_id', ignoreDuplicates: false })
    .select('id')
    .single()

  if (convErr || !conv) {
    return NextResponse.json({ error: convErr?.message ?? 'Error creando conversación' }, { status: 500 })
  }

  // Si hay mensaje inicial, insertarlo
  if (initial_message && typeof initial_message === 'string') {
    const body = initial_message.slice(0, 2000).trim()
    if (body) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_id:       user.id,
        body,
      })
    }
  }

  return NextResponse.json({ conversation_id: conv.id })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return user.email === process.env.CONTACT_NOTIFY_EMAIL
}

// GET: listar documentos de una session o todos
export async function GET(req: NextRequest) {
  const supabase   = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const sessionId = req.nextUrl.searchParams.get('session_id')
  let query = supabase.from('client_docs').select('*').order('uploaded_at', { ascending: false })
  if (sessionId) query = query.eq('session_id', sessionId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ docs: data ?? [] })
}

// POST: generar URL firmada de descarga para un doc
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { storage_path } = await req.json()
  if (!storage_path) return NextResponse.json({ error: 'storage_path requerido' }, { status: 400 })

  const { data, error } = await supabase
    .storage
    .from('gestoria-docs')
    .createSignedUrl(storage_path, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}

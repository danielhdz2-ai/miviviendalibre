import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { session_id, doc_key, file_name } = body

  if (!session_id || !doc_key || !file_name) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Validar que session_id pertenece a este usuario
  const { data: record } = await supabase
    .from('gestoria_requests')
    .select('id')
    .eq('session_id', session_id)
    .eq('client_email', user.email)
    .single()

  if (!record) return NextResponse.json({ error: 'Sesion no valida' }, { status: 403 })

  // Extensión segura
  const ext  = file_name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'bin'
  const path = `${session_id}/${doc_key}.${ext}`

  const { data: signedData, error } = await supabase
    .storage
    .from('gestoria-docs')
    .createSignedUploadUrl(path)

  if (error || !signedData) {
    return NextResponse.json({ error: error?.message ?? 'Error al generar URL' }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: signedData.signedUrl, path })
}

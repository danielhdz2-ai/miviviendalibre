import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { session_id, doc_key, file_name, storage_path } = body

  if (!session_id || !doc_key || !file_name || !storage_path) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  // Verificar que session pertenece al usuario
  const { data: record } = await supabase
    .from('gestoria_requests')
    .select('id')
    .eq('session_id', session_id)
    .eq('client_email', user.email)
    .single()

  if (!record) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Usar admin client para insertar en client_docs (service_role)
  const adminSupabase = await import('@/lib/supabase/server').then(m => m.createClient())

  const { error } = await adminSupabase
    .from('client_docs')
    .upsert({
      request_id:   record.id,
      session_id,
      doc_key,
      file_name,
      storage_path,
    }, { onConflict: 'request_id,doc_key' })

  if (error) {
    console.error('[register-doc] error:', error)
    // No fallar — el archivo ya se subió
  }

  // Notificar al admin
  const adminEmail = process.env.CONTACT_NOTIFY_EMAIL
  if (adminEmail) {
    const RESEND_KEY = process.env.RESEND_API_KEY ?? ''
    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from:    'Inmonest <noreply@inmonest.com>',
        to:      adminEmail,
        subject: `[Inmonest] Nuevo documento subido: ${doc_key}`,
        html:    `<p><strong>${user.email}</strong> ha subido el documento <strong>${doc_key}</strong> (${file_name}) para la sesión <code>${session_id}</code>.</p>`,
      }),
    }).catch(() => null)
  }

  return NextResponse.json({ ok: true })
}

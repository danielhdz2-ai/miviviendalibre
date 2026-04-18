import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return user.email === process.env.CONTACT_NOTIFY_EMAIL
}

// POST: subir contrato PDF y guardar ruta en gestoria_requests
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const formData  = await req.formData()
  const requestId = formData.get('request_id') as string
  const file      = formData.get('file') as File | null

  if (!requestId || !file) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  // Verificar que el pedido existe
  const { data: record } = await supabase
    .from('gestoria_requests')
    .select('session_id')
    .eq('id', requestId)
    .single()

  if (!record) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  const path = `${record.session_id}/contrato.pdf`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadErr } = await supabase
    .storage
    .from('gestoria-docs')
    .upload(path, arrayBuffer, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  // Actualizar contract_path y step=4 en gestoria_requests
  const { error: updateErr } = await supabase
    .from('gestoria_requests')
    .update({ contract_path: path, step: 4 })
    .eq('id', requestId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Notificar al cliente
  const { data: fullRecord } = await supabase
    .from('gestoria_requests')
    .select('client_email, client_name, service_key')
    .eq('id', requestId)
    .single()

  if (fullRecord?.client_email) {
    const RESEND_KEY = process.env.RESEND_API_KEY ?? ''
    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from:    'Inmonest <noreply@inmonest.com>',
        to:      fullRecord.client_email,
        subject: 'Tu contrato esta listo - Inmonest',
        html:    `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#c9962a">Tu contrato esta listo</h2>
            <p>Hola ${fullRecord.client_name ?? ''},</p>
            <p>Tu contrato <strong>${fullRecord.service_key.replace(/-/g, ' ')}</strong> esta disponible.</p>
            <p>Accede a tu area personal para descargarlo:</p>
            <a href="https://inmonest.com/mis-documentos" 
               style="display:inline-block;background:#c9962a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
              Descargar contrato
            </a>
            <p style="color:#888;font-size:12px;margin-top:24px">
              Inmonest &mdash; info@inmonest.com
            </p>
          </div>
        `,
      }),
    }).catch(() => null)
  }

  return NextResponse.json({ ok: true, path })
}

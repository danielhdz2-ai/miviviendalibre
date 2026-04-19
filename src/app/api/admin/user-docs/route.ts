import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )
}

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return user.email === process.env.CONTACT_NOTIFY_EMAIL
}

// GET: listar todos los documentos personales de usuarios
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const adminSb = getAdminClient()

  // Traer todos los user_documents con perfil
  const { data: docs, error } = await adminSb
    .from('user_documents')
    .select('id, user_id, doc_key, file_name, status, uploaded_at, notes, storage_path')
    .order('uploaded_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Obtener emails de los user_ids únicos
  const uniqueUserIds = [...new Set((docs ?? []).map(d => d.user_id))]
  const emailMap: Record<string, string> = {}
  const nameMap:  Record<string, string> = {}

  // Batch fetch profiles (nombre)
  if (uniqueUserIds.length > 0) {
    const { data: profiles } = await adminSb
      .from('user_profiles')
      .select('user_id, full_name')
      .in('user_id', uniqueUserIds)
    ;(profiles ?? []).forEach(p => { nameMap[p.user_id] = p.full_name ?? '' })

    // Batch fetch emails via auth.admin
    await Promise.all(uniqueUserIds.map(async (uid) => {
      const { data } = await adminSb.auth.admin.getUserById(uid)
      if (data?.user?.email) emailMap[uid] = data.user.email
    }))
  }

  const enriched = (docs ?? []).map(d => ({
    ...d,
    user_email: emailMap[d.user_id] ?? d.user_id,
    user_name:  nameMap[d.user_id]  ?? '',
  }))

  return NextResponse.json({ docs: enriched })
}

// POST: generar URL firmada de descarga
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { storage_path } = await req.json()
  if (!storage_path) return NextResponse.json({ error: 'storage_path requerido' }, { status: 400 })

  const adminSb = getAdminClient()
  const { data, error } = await adminSb.storage
    .from('user-docs')
    .createSignedUrl(storage_path, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}

// PATCH: actualizar estado / notas de un documento
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { doc_id, status, notes } = await req.json()
  if (!doc_id) return NextResponse.json({ error: 'doc_id requerido' }, { status: 400 })

  const adminSb = getAdminClient()
  const { data, error } = await adminSb
    .from('user_documents')
    .update({ status, notes })
    .eq('id', doc_id)
    .select('id, status, notes')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, doc: data })
}

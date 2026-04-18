import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return user.email === process.env.CONTACT_NOTIFY_EMAIL
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const { request_id, step, admin_notes } = body

  if (!request_id || !step) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { step }
  if (admin_notes !== undefined) updateData.admin_notes = admin_notes

  const { error } = await supabase
    .from('gestoria_requests')
    .update(updateData)
    .eq('id', request_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

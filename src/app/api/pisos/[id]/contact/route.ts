import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params

  // ── Autenticación ────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Registro requerido', code: 'AUTH_REQUIRED' },
      { status: 403 }
    )
  }

  // ── Obtener solo los campos de contacto del listing ──────────────────────
  const { data: listing, error } = await supabase
    .from('listings')
    .select('id, phone, advertiser_name, external_link, source_url, is_particular')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error || !listing) {
    return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 })
  }

  // ── Registrar lead en leads_activity (upsert: 1 fila por usuario+listing) ─
  // Ignoramos errores aquí para no bloquear la respuesta
  await supabase
    .from('leads_activity')
    .upsert(
      { user_id: user.id, listing_id: id },
      { onConflict: 'user_id,listing_id', ignoreDuplicates: true }
    )

  return NextResponse.json({
    phone:           listing.phone ?? null,
    advertiser_name: listing.advertiser_name ?? null,
    external_link:   listing.external_link ?? listing.source_url ?? null,
    is_particular:   listing.is_particular,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeKey } from '@/lib/stripe-key'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase   = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const requestId = req.nextUrl.searchParams.get('request_id')
  if (!requestId) return NextResponse.json({ error: 'request_id requerido' }, { status: 400 })

  // Verificar que el pedido pertenece al usuario
  const { data: record, error } = await supabase
    .from('gestoria_requests')
    .select('id, contract_path, client_email')
    .eq('id', requestId)
    .eq('client_email', user.email)
    .single()

  if (error || !record) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  if (!record.contract_path) return NextResponse.json({ error: 'Contrato no disponible aún' }, { status: 404 })

  // Generar URL firmada de descarga (1 hora)
  const { data: signedData, error: signErr } = await supabase
    .storage
    .from('gestoria-docs')
    .createSignedUrl(record.contract_path, 3600)

  if (signErr || !signedData?.signedUrl) {
    return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })
  }

  return NextResponse.json({ url: signedData.signedUrl })
}

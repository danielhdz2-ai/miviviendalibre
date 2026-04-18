import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: listar alertas del usuario
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('search_alerts')
    .select('id,label,filters,frequency,active,last_sent_at,total_sent,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alerts: data ?? [] })
}

// POST: crear alerta
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Límite: máx. 10 alertas por usuario
  const { count } = await supabase
    .from('search_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: 'Máximo 10 alertas por usuario' }, { status: 400 })
  }

  const body = await req.json()
  const { filters, label, frequency } = body

  if (!filters || typeof filters !== 'object') {
    return NextResponse.json({ error: 'Filtros inválidos' }, { status: 400 })
  }
  if (!label || typeof label !== 'string') {
    return NextResponse.json({ error: 'Etiqueta requerida' }, { status: 400 })
  }

  const validFrequencies = ['immediate', 'daily', 'weekly']
  const freq = validFrequencies.includes(frequency) ? frequency : 'daily'

  const { data, error } = await supabase
    .from('search_alerts')
    .insert({
      user_id:   user.id,
      filters,
      label:     String(label).slice(0, 200),
      frequency: freq,
      active:    true,
    })
    .select('id,label,filters,frequency,active,created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alert: data })
}

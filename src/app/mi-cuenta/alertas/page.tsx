import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AlertasClient from './AlertasClient'

export const metadata = { title: 'Mis alertas — Inmonest' }

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: alerts } = await supabase
    .from('search_alerts')
    .select('id,label,filters,frequency,active,last_sent_at,total_sent,created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis alertas de búsqueda</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Recibe un email cuando aparezcan pisos que encajen con tus filtros.
          </p>
        </div>
        <Link
          href="/pisos"
          className="flex-shrink-0 inline-flex items-center gap-2 bg-[#c9962a] hover:bg-[#b8841e] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Crear desde búsqueda
        </Link>
      </div>

      <AlertasClient initialAlerts={alerts ?? []} />
    </div>
  )
}

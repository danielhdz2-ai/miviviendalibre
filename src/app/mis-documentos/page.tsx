import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/NavbarServer'
import MisDocumentosClient, { type GestoriaRequest } from './MisDocumentosClient'

export const metadata: Metadata = {
  title: 'Mi area personal - Inmonest',
  description: 'Gestiona tus contratos, sube documentos y sigue el estado de tu tramite.',
}

export default async function MisDocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params    = await searchParams
  const sessionId = params.session_id ?? null

  if (!user && !sessionId) {
    redirect('/auth/login?next=/mis-documentos')
  }

  let requests: GestoriaRequest[] = []

  if (user) {
    const { data } = await supabase
      .from('gestoria_requests')
      .select('id,session_id,service_key,client_name,client_email,amount_eur,status,step,paid_at,contract_path,created_at')
      .eq('client_email', user.email)
      .order('paid_at', { ascending: false })
    requests = (data ?? []) as GestoriaRequest[]
  } else if (sessionId) {
    const { data } = await supabase
      .from('gestoria_requests')
      .select('id,session_id,service_key,client_name,client_email,amount_eur,status,step,paid_at,contract_path,created_at')
      .eq('session_id', sessionId)
      .limit(1)
    requests = (data ?? []) as GestoriaRequest[]
  }

  const justPaid = !!sessionId

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f8f5f0] pt-24 pb-16 px-4">
        <MisDocumentosClient
          requests={requests}
          justPaid={justPaid}
          userEmail={user?.email ?? requests[0]?.client_email ?? ''}
        />
      </main>
    </>
  )
}
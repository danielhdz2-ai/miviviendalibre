import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/NavbarServer'
import AdminPanel from './AdminPanel'

export const metadata: Metadata = {
  title: 'Admin - Inmonest',
}

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmail = process.env.CONTACT_NOTIFY_EMAIL
  if (!user || user.email !== adminEmail) {
    redirect('/')
  }

  // Cargar todos los pedidos server-side
  const { data } = await supabase
    .from('gestoria_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
        <AdminPanel initialRequests={data ?? []} />
      </main>
    </>
  )
}

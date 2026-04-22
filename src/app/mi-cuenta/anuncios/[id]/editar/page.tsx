import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditarAnuncioForm from './EditarAnuncioForm'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Editar anuncio — Inmonest',
  robots: { index: false },
}

export default async function EditarAnuncioPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: listing } = await supabase
    .from('listings')
    .select('id,title,description,price_eur,operation,city,district,province,bedrooms,bathrooms,area_m2,status,owner_user_id')
    .eq('id', id)
    .single()

  if (!listing) notFound()
  if (listing.owner_user_id !== user.id) notFound()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar anuncio</h1>
        <p className="text-sm text-gray-500 mt-1">{listing.title}</p>
      </div>
      <EditarAnuncioForm listing={listing} />
    </div>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from './DashboardSidebar'

export const metadata: Metadata = {
  title: 'Mi cuenta — Inmonest',
}

export default async function MiCuentaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/mi-cuenta')

  // Datos del perfil
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, avatar_url')
    .eq('user_id', user.id)
    .single()

  // Contador favoritos
  const { count: favCount } = await supabase
    .from('user_favorites')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Contador alertas activas
  const { count: alertCount } = await supabase
    .from('search_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('active', true)

  // Contador mensajes no leídos (usando nuevo sistema conversations)
  const { data: anuncios } = await supabase
    .from('listings')
    .select('id')
    .eq('owner_user_id', user.id)

  const anuncioIds = (anuncios ?? []).map(a => a.id)
  const { count: msgCount } = anuncioIds.length > 0
    ? await supabase
        .from('listing_contacts')
        .select('id', { count: 'exact', head: true })
        .in('listing_id', anuncioIds)
    : { count: 0 }

  // Mensajes no leídos en conversaciones internas
  const { data: convs } = await supabase
    .from('conversations')
    .select('buyer_id, unread_buyer, unread_seller')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

  const unreadConvs = (convs ?? []).reduce((acc, c) => {
    return acc + (c.buyer_id === user.id ? (c.unread_buyer ?? 0) : (c.unread_seller ?? 0))
  }, 0)

  const totalMsgCount = (msgCount ?? 0) + unreadConvs

  const displayName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Usuario'
  const initials    = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col">
      <DashboardSidebar
        email={user.email ?? ''}
        displayName={displayName}
        initials={initials}
        avatarUrl={profile?.avatar_url ?? null}
        favCount={favCount ?? 0}
        msgCount={totalMsgCount}
        alertCount={alertCount ?? 0}
      >
        {children}
      </DashboardSidebar>
    </div>
  )
}

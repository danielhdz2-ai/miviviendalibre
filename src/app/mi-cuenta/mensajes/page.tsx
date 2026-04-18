import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MensajesConvClient from './MensajesConvClient'

export const metadata = { title: 'Mensajes — Inmonest' }

export default async function MensajesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Conversaciones del nuevo sistema
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`id, listing_id, buyer_id, seller_id, last_message, last_message_at, unread_buyer, unread_seller, created_at, listings ( id, title, city )`)
    .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(50)

  const { data: anuncios } = await supabase
    .from('listings')
    .select('id,title')
    .eq('owner_user_id', user!.id)

  const anuncioIds = (anuncios ?? []).map((a: { id: string }) => a.id)
  const anuncioMap = Object.fromEntries((anuncios ?? []).map((a: { id: string; title: string }) => [a.id, a.title]))

  const { data: leads } = anuncioIds.length > 0
    ? await supabase
        .from('listing_contacts')
        .select('id,listing_id,from_name,from_email,from_phone,message,created_at')
        .in('listing_id', anuncioIds)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] }

  const totalUnread = (conversations ?? []).reduce((acc: number, c: { buyer_id: string; unread_buyer: number; unread_seller: number }) =>
    acc + (user!.id === c.buyer_id ? c.unread_buyer : c.unread_seller), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalUnread > 0 ? `${totalUnread} sin leer · ` : ''}{(conversations ?? []).length} conversaciones
        </p>
      </div>

      {/* Conversaciones internas */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Conversaciones</h2>
        <MensajesConvClient
          userId={user!.id}
          initialConversations={(conversations ?? []).map(c => ({ ...c, listings: Array.isArray(c.listings) ? c.listings[0] ?? null : (c.listings as { id: string; title: string; city: string | null } | null) })) as Parameters<typeof MensajesConvClient>[0]['initialConversations']}
        />
      </div>

      {/* Contactos recibidos legacy */}
      {leads && leads.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Formularios de contacto recibidos</h2>
          <div className="space-y-3">
            {leads.map((lead: { id: string; listing_id: string; from_name: string; from_email: string; from_phone?: string; message: string; created_at: string }) => (
              <div key={lead.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9962a] to-[#7a5c1e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(lead.from_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{lead.from_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a href={`mailto:${lead.from_email}`} className="text-xs text-[#c9962a] hover:underline">{lead.from_email}</a>
                        {lead.from_phone && (
                          <>
                            <span className="text-gray-300">·</span>
                            <a href={`tel:${lead.from_phone}`} className="text-xs text-[#c9962a] hover:underline">{lead.from_phone}</a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(lead.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className="mt-3 text-sm text-gray-700 leading-relaxed">{lead.message}</p>
                <p className="mt-2 text-xs text-gray-400 italic truncate">
                  Anuncio: {anuncioMap[lead.listing_id] ?? lead.listing_id}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

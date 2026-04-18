'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

interface ConvListing {
  id: string
  title: string
  city: string | null
}

interface Conversation {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  last_message: string | null
  last_message_at: string | null
  unread_buyer: number
  unread_seller: number
  created_at: string
  listings: ConvListing | null
}

interface Props {
  userId: string
  initialConversations: Conversation[]
}

export default function MensajesConvClient({ userId, initialConversations }: Props) {
  const [convs, setConvs]             = useState<Conversation[]>(initialConversations)
  const [selected, setSelected]       = useState<Conversation | null>(null)
  const [messages, setMessages]       = useState<Message[]>([])
  const [newMsg, setNewMsg]           = useState('')
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending]         = useState(false)
  const bottomRef                     = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async (conv: Conversation) => {
    setLoadingMsgs(true)
    try {
      const res  = await fetch(`/api/mensajes/${conv.id}`)
      const data = await res.json()
      setMessages(data.messages ?? [])
      // Resetear unread en UI
      setConvs(prev => prev.map(c =>
        c.id === conv.id
          ? { ...c, unread_buyer: 0, unread_seller: 0 }
          : c
      ))
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  useEffect(() => {
    if (selected) loadMessages(selected)
  }, [selected, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!selected || !newMsg.trim() || sending) return
    setSending(true)
    const body = newMsg.trim()
    setNewMsg('')
    try {
      const res  = await fetch(`/api/mensajes/${selected.id}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ body }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, data.message])
        setConvs(prev => prev.map(c =>
          c.id === selected.id ? { ...c, last_message: body } : c
        ))
      }
    } finally {
      setSending(false)
    }
  }

  function getUnread(conv: Conversation) {
    return userId === conv.buyer_id ? conv.unread_buyer : conv.unread_seller
  }

  if (convs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
        <div className="text-5xl mb-4">💬</div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Sin conversaciones aún</h2>
        <p className="text-sm text-gray-400 mb-6">
          Cuando contactes con un anunciante o recibas un mensaje, aparecerá aquí.
        </p>
        <Link href="/pisos" className="inline-block bg-[#c9962a] hover:bg-[#b8841e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
          Buscar pisos
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ height: '620px' }}>
      <div className="flex h-full">

        {/* ── Lista de conversaciones ─────────────────────────────── */}
        <div className={`w-full lg:w-72 border-r border-gray-100 flex flex-col flex-shrink-0 ${selected ? 'hidden lg:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Conversaciones</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convs.map(conv => {
              const unread   = getUnread(conv)
              const isActive = selected?.id === conv.id
              const isBuyer  = userId === conv.buyer_id
              const role     = isBuyer ? 'Vendedor' : 'Comprador'

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-amber-50 border-l-2 border-l-[#c9962a]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">{role}</p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {conv.listings?.title ?? 'Anuncio'}
                      </p>
                      {conv.last_message && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{conv.last_message}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      {conv.last_message_at && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(conv.last_message_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {unread > 0 && (
                        <span className="w-5 h-5 bg-[#c9962a] text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Chat ────────────────────────────────────────────────── */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header del chat */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                className="lg:hidden text-gray-400 hover:text-gray-700 p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{selected.listings?.title}</p>
                <p className="text-xs text-gray-400">
                  {selected.listings?.city ?? ''}
                  {' · '}
                  <Link href={`/pisos/${selected.listing_id}`} className="text-[#c9962a] hover:underline" target="_blank">
                    Ver anuncio →
                  </Link>
                </p>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <span className="animate-spin w-6 h-6 border-2 border-[#c9962a] border-t-transparent rounded-full" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <div className="text-3xl mb-2">👋</div>
                    <p className="text-sm text-gray-400">Sé el primero en escribir</p>
                  </div>
                </div>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.sender_id === userId
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isOwn
                          ? 'bg-[#c9962a] text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}>
                        <p className="leading-relaxed">{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${isOwn ? 'text-amber-200' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && msg.read_at && ' · Leído'}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-end gap-2">
                <textarea
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  maxLength={2000}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9962a]/30 focus:border-[#c9962a]"
                  style={{ maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMsg.trim() || sending}
                  className="flex-shrink-0 w-10 h-10 bg-[#c9962a] hover:bg-[#b8841e] disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  {sending ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 text-right">{newMsg.length}/2000</p>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center text-center p-8">
            <div>
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm text-gray-400">Selecciona una conversación</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

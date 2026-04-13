'use client'

import { useState } from 'react'

interface Props {
  listingId: string
  isParticular: boolean | null
  isLoggedIn: boolean
}

interface ContactData {
  phone: string | null
  advertiser_name: string | null
  external_link: string | null
}

export default function RevealContact({ listingId, isParticular, isLoggedIn }: Props) {
  const [state, setState] = useState<'locked' | 'loading' | 'revealed' | 'error'>('locked')
  const [contact, setContact] = useState<ContactData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleReveal() {
    if (!isLoggedIn) {
      // Redirigir al login con return_to
      window.location.href = `/auth/login?next=/pisos/${listingId}`
      return
    }

    setState('loading')
    try {
      const res = await fetch(`/api/pisos/${listingId}/contact`)
      if (res.status === 403) {
        window.location.href = `/auth/login?next=/pisos/${listingId}`
        return
      }
      if (!res.ok) {
        setErrorMsg('No se pudo obtener el contacto. Inténtalo de nuevo.')
        setState('error')
        return
      }
      const data: ContactData = await res.json()
      setContact(data)
      setState('revealed')
    } catch {
      setErrorMsg('Error de red. Inténtalo de nuevo.')
      setState('error')
    }
  }

  // Estado revelado
  if (state === 'revealed' && contact) {
    return (
      <div className="mt-4 space-y-2">
        {contact.advertiser_name && (
          <p className="text-xs text-gray-500 text-center">
            {isParticular ? '👤' : '🏢'} {contact.advertiser_name}
          </p>
        )}
        {contact.phone ? (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            📞 {contact.phone}
          </a>
        ) : (
          <p className="text-xs text-center text-gray-400 italic">Sin teléfono disponible</p>
        )}
        {contact.external_link && (
          <a
            href={contact.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Ver anuncio original ↗
          </a>
        )}
      </div>
    )
  }

  // Estado error
  if (state === 'error') {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-xs text-red-500 text-center">{errorMsg}</p>
        <button
          onClick={() => setState('locked')}
          className="w-full text-xs text-gray-400 underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // Estado bloqueado / cargando
  return (
    <button
      onClick={handleReveal}
      disabled={state === 'loading'}
      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {state === 'loading' ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Obteniendo contacto…
        </>
      ) : (
        <>
          🔒 {isLoggedIn ? 'Ver teléfono de contacto' : 'Regístrate para ver el teléfono'}
        </>
      )}
    </button>
  )
}

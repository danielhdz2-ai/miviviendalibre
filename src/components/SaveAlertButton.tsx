'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

// Construye el label legible para la alerta a partir de los params actuales
function buildLabel(params: URLSearchParams): string {
  const parts: string[] = []
  const op = params.get('operacion')
  if (op === 'rent') parts.push('Alquiler')
  else if (op === 'sale') parts.push('Venta')
  const ciudad = params.get('ciudad')
  if (ciudad) parts.push(`en ${ciudad}`)
  const precioMax = params.get('precio_max')
  if (precioMax) parts.push(`≤${precioMax}€`)
  const hab = params.get('hab')
  if (hab) parts.push(`${hab} hab.`)
  if (params.get('solo_particulares')) parts.push('Solo particulares')
  if (params.get('solo_bancarias'))    parts.push('Solo bancarios')
  return parts.length ? parts.join(' · ') : 'Búsqueda general'
}

// Convierte los search params a filtros del tipo esperado por la API
function buildFilters(params: URLSearchParams): Record<string, unknown> {
  const f: Record<string, unknown> = {}
  if (params.get('ciudad'))            f.ciudad            = params.get('ciudad')
  if (params.get('operacion'))         f.operacion         = params.get('operacion')
  if (params.get('precio_min'))        f.precio_min        = Number(params.get('precio_min'))
  if (params.get('precio_max'))        f.precio_max        = Number(params.get('precio_max'))
  if (params.get('hab'))               f.habitaciones      = Number(params.get('hab'))
  if (params.get('banos'))             f.banos_min         = Number(params.get('banos'))
  if (params.get('area_min'))          f.area_min          = Number(params.get('area_min'))
  if (params.get('area_max'))          f.area_max          = Number(params.get('area_max'))
  if (params.get('solo_particulares')) f.solo_particulares = true
  if (params.get('solo_bancarias'))    f.solo_bancarias    = true
  return f
}

export default function SaveAlertButton() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'auth'>('idle')

  async function saveAlert() {
    if (state === 'saving' || state === 'saved') return
    setState('saving')

    const filters = buildFilters(searchParams)
    const label   = buildLabel(searchParams)

    try {
      const res = await fetch('/api/alertas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ filters, label, frequency: 'daily' }),
      })

      if (res.status === 401) { setState('auth'); return }
      if (!res.ok) {
        const data = await res.json()
        if (data.error?.includes('Máximo')) {
          alert('Has alcanzado el límite de 10 alertas. Elimina alguna desde Mi cuenta → Alertas.')
          setState('idle')
          return
        }
        setState('error')
        return
      }
      setState('saved')
    } catch {
      setState('error')
    }
  }

  if (state === 'auth') {
    return (
      <a
        href="/auth/login?next=/pisos"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#c9962a] border border-gray-200 hover:border-[#c9962a] px-3 py-2 rounded-xl transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Inicia sesión para guardar alerta
      </a>
    )
  }

  if (state === 'saved') {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Alerta guardada · <a href="/mi-cuenta/alertas" className="underline hover:text-green-800">Ver mis alertas</a>
      </div>
    )
  }

  return (
    <button
      onClick={saveAlert}
      disabled={state === 'saving'}
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#c9962a] border border-gray-200 hover:border-[#c9962a] px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
    >
      {state === 'saving' ? (
        <span className="animate-spin w-4 h-4 border-2 border-[#c9962a] border-t-transparent rounded-full" />
      ) : state === 'error' ? (
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )}
      {state === 'error' ? 'Error, reintentar' : 'Guardar alerta'}
    </button>
  )
}

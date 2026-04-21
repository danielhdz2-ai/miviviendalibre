'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useListingCount } from '@/hooks/useListingCount'

type TipoAnunciante = 'particulares' | 'bancarios' | 'agencias' | ''

interface SearchFormProps {
  compact?: boolean
  defaultValues?: {
    ciudad?: string
    operacion?: 'rent' | 'sale'
    soloParticulares?: boolean
    soloBancarias?: boolean
    soloAgencias?: boolean
  }
}

export default function SearchForm({ compact = false, defaultValues }: SearchFormProps) {
  const router = useRouter()

  const [ciudad, setCiudad] = useState(defaultValues?.ciudad ?? '')
  const [operacion, setOperacion] = useState<'rent' | 'sale'>(defaultValues?.operacion ?? 'rent')

  const initialTipo: TipoAnunciante =
    defaultValues?.soloBancarias ? 'bancarios' :
    defaultValues?.soloAgencias  ? 'agencias'  :
    defaultValues?.soloParticulares !== false ? 'particulares' : ''

  const [tipoAnunciante, setTipoAnunciante] = useState<TipoAnunciante>(initialTipo)

  function buildParams(extra?: Partial<{ ciudad: string; operacion: string; tipo: TipoAnunciante }>) {
    const c = extra?.ciudad    ?? ciudad
    const op = extra?.operacion ?? operacion
    const tipo = extra?.tipo    ?? tipoAnunciante
    const params = new URLSearchParams()
    if (c.trim()) params.set('ciudad', c.trim().toLowerCase())
    params.set('operacion', op)
    if (tipo === 'particulares') params.set('solo_particulares', 'true')
    if (tipo === 'bancarios')    params.set('solo_bancarias', 'true')
    if (tipo === 'agencias')     params.set('solo_agencias', 'true')
    return params
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/pisos?${buildParams().toString()}`)
  }

  // Conteo en tiempo real para el botón del formulario hero
  const liveOverrides: Record<string, string> = {}
  if (ciudad.trim()) liveOverrides.ciudad = ciudad.trim().toLowerCase()
  liveOverrides.operacion = operacion
  if (tipoAnunciante === 'particulares') liveOverrides.solo_particulares = 'true'
  if (tipoAnunciante === 'bancarios')    liveOverrides.solo_bancarias = 'true'
  if (tipoAnunciante === 'agencias')     liveOverrides.solo_agencias = 'true'

  const { count: liveCount, loading: countLoading } = useListingCount(liveOverrides)

  // Pills de tipo de anunciante (3 opciones, mutuamente excluyentes)
  const TIPO_PILLS: { value: TipoAnunciante; label: string; icon: string; activeClass: string }[] = [
    {
      value: 'bancarios',
      label: 'Fondos bancarios',
      icon: '🏦',
      activeClass: 'bg-blue-600 text-white border-blue-600',
    },
    {
      value: 'particulares',
      label: 'Solo particulares',
      icon: '👤',
      activeClass: 'bg-[#c9962a] text-white border-[#c9962a]',
    },
    {
      value: 'agencias',
      label: 'Agencias',
      icon: '🏢',
      activeClass: 'bg-gray-700 text-white border-gray-700',
    },
  ]

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Selector operación compacto */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
            <button
              type="button"
              onClick={() => setOperacion('rent')}
              className={`px-3 py-1.5 text-sm font-semibold transition-colors ${operacion === 'rent' ? 'bg-gold-500 text-white' : 'text-gray-600 hover:bg-gold-50'}`}
            >
              Alquiler
            </button>
            <button
              type="button"
              onClick={() => setOperacion('sale')}
              className={`px-3 py-1.5 text-sm font-semibold transition-colors ${operacion === 'sale' ? 'bg-gold-500 text-white' : 'text-gray-600 hover:bg-gold-50'}`}
            >
              Compra
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Ciudad, barrio o código postal..."
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-gold-500 text-white rounded-lg text-sm font-semibold hover:bg-gold-600 transition-colors shrink-0 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar
          </button>
        </div>

        {/* Pills tipo anunciante — fila separada */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TIPO_PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setTipoAnunciante(tipoAnunciante === pill.value ? '' : pill.value)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${
                tipoAnunciante === pill.value
                  ? pill.activeClass
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              <span>{pill.icon}</span>
              <span>{pill.label}</span>
            </button>
          ))}
        </div>
      </form>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col gap-3 max-w-3xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Selector operación */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setOperacion('rent')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${operacion === 'rent' ? 'bg-gold-500 text-white' : 'text-gray-600 hover:bg-gold-50'}`}
          >
            Alquiler
          </button>
          <button
            type="button"
            onClick={() => setOperacion('sale')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${operacion === 'sale' ? 'bg-gold-500 text-white' : 'text-gray-600 hover:bg-gold-50'}`}
          >
            Compra
          </button>
        </div>

        {/* Input ciudad */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Ciudad, barrio o código postal..."
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            className="w-full h-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          />
        </div>

        {/* Botón buscar con conteo en tiempo real */}
        <button
          type="submit"
          disabled={countLoading}
          className="px-6 py-2.5 bg-gold-500 text-white rounded-lg text-sm font-semibold hover:bg-gold-600 transition-colors shrink-0 flex items-center gap-2 disabled:opacity-80"
        >
          {countLoading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Buscando…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {liveCount !== null
                ? `Ver ${liveCount.toLocaleString('es-ES')} anuncio${liveCount !== 1 ? 's' : ''}`
                : 'Buscar'}
            </>
          )}
        </button>
      </div>

      {/* Pills tipo de anunciante */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium shrink-0">Tipo de anunciante:</span>
        {TIPO_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => setTipoAnunciante(tipoAnunciante === pill.value ? '' : pill.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors ${
              tipoAnunciante === pill.value
                ? pill.activeClass
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            <span>{pill.icon}</span>
            <span>{pill.label}</span>
          </button>
        ))}
      </div>
    </form>
  )
}


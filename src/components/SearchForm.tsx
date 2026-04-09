'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface SearchFormProps {
  compact?: boolean
  defaultValues?: {
    ciudad?: string
    operacion?: 'rent' | 'sale'
    soloParticulares?: boolean
  }
}

export default function SearchForm({ compact = false, defaultValues }: SearchFormProps) {
  const router = useRouter()

  const [ciudad, setCiudad] = useState(defaultValues?.ciudad ?? '')
  const [operacion, setOperacion] = useState<'rent' | 'sale'>(defaultValues?.operacion ?? 'rent')
  const [soloParticulares, setSoloParticulares] = useState(defaultValues?.soloParticulares ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (ciudad.trim()) params.set('ciudad', ciudad.trim().toLowerCase())
    params.set('operacion', operacion)
    if (soloParticulares) params.set('solo_particulares', 'true')
    router.push(`/pisos?${params.toString()}`)
  }

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
      >
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

        <label className="flex items-center gap-1.5 text-sm text-gray-700 font-medium cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={soloParticulares}
            onChange={(e) => setSoloParticulares(e.target.checked)}
            className="w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-400 cursor-pointer"
          />
          <span className="hidden sm:inline">Solo particulares</span>
          <span className="sm:hidden">Particulares</span>
        </label>

        <button
          type="submit"
          className="px-4 py-1.5 bg-gold-500 text-white rounded-lg text-sm font-semibold hover:bg-gold-600 transition-colors shrink-0 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar
        </button>
      </form>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto"
    >
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

      {/* Checkbox solo particulares */}
      <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer shrink-0 px-1">
        <input
          type="checkbox"
          checked={soloParticulares}
          onChange={(e) => setSoloParticulares(e.target.checked)}
          className="w-4 h-4 text-[#c9962a] border-gray-300 rounded focus:ring-[#c9962a] cursor-pointer"
        />
        Solo particulares
      </label>

      {/* Botón buscar */}
      <button
        type="submit"
          className="px-6 py-2.5 bg-gold-500 text-white rounded-lg text-sm font-semibold hover:bg-gold-600 transition-colors shrink-0 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Buscar
      </button>
    </form>
  )
}


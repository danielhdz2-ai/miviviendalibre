'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { SortOption, VistaOption } from '@/types/listings'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'recientes', label: 'Más recientes' },
  { value: 'superficie', label: 'Mayor superficie' },
]

interface ResultsHeaderProps {
  total: number
  onOpenFilters: () => void
  activeFilterCount: number
}

export default function ResultsHeader({ total, onOpenFilters, activeFilterCount }: ResultsHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = (searchParams.get('ordenar') as SortOption) ?? 'relevancia'
  const currentVista = (searchParams.get('vista') as VistaOption) ?? 'lista'

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString())
    p.delete('pagina')
    if (value) p.set(key, value)
    else p.delete(key)
    router.push(`/pisos?${p.toString()}`)
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      {/* Contador + botón filtros mobile */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-600">
          <span className="font-bold text-gray-900 text-base">{total.toLocaleString('es-ES')}</span>
          {' '}{total === 1 ? 'resultado' : 'resultados'}
        </p>

        {/* Botón filtros (solo mobile) */}
        <button
          onClick={onOpenFilters}
          className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gold-400 hover:text-gold-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filtros
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-gold-500 text-white text-xs flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Derecha: sort + toggle vista */}
      <div className="flex items-center gap-2">
        {/* Selector de orden */}
        <select
          value={currentSort}
          onChange={(e) => setParam('ordenar', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gold-400 cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Toggle vista */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
          <button
            title="Vista lista"
            onClick={() => setParam('vista', 'lista')}
            className={`p-2 transition-colors ${
              currentVista === 'lista'
                ? 'bg-gold-500 text-white'
                : 'text-gray-400 hover:bg-gold-50 hover:text-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            title="Vista grid"
            onClick={() => setParam('vista', 'grid')}
            className={`p-2 transition-colors ${
              currentVista === 'grid'
                ? 'bg-gold-500 text-white'
                : 'text-gray-400 hover:bg-gold-50 hover:text-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

const HABITACIONES_OPTIONS = [
  { label: 'Estudio', value: '0' },
  { label: '1 hab.', value: '1' },
  { label: '2 hab.', value: '2' },
  { label: '3 hab.', value: '3' },
  { label: '4+ hab.', value: '4' },
]

const BANOS_OPTIONS = [
  { label: '1 baño', value: '1' },
  { label: '2+ baños', value: '2' },
]

interface FiltersPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function FiltersPanel({ isOpen, onClose }: FiltersPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estado local de los filtros
  const [precioMin, setPrecioMin] = useState(searchParams.get('precio_min') ?? '')
  const [precioMax, setPrecioMax] = useState(searchParams.get('precio_max') ?? '')
  const [habitaciones, setHabitaciones] = useState(searchParams.get('hab') ?? '')
  const [banosMin, setBanosMin] = useState(searchParams.get('banos') ?? '')
  const [areaMin, setAreaMin] = useState(searchParams.get('area_min') ?? '')
  const [areaMax, setAreaMax] = useState(searchParams.get('area_max') ?? '')

  const buildParams = useCallback(
    (overrides: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString())
      // Resetar página al cambiar filtros
      p.delete('pagina')
      Object.entries(overrides).forEach(([k, v]) => {
        if (v) p.set(k, v)
        else p.delete(k)
      })
      return p
    },
    [searchParams]
  )

  function applyFilters() {
    const p = buildParams({
      precio_min: precioMin,
      precio_max: precioMax,
      hab: habitaciones,
      banos: banosMin,
      area_min: areaMin,
      area_max: areaMax,
    })
    router.push(`/pisos?${p.toString()}`)
    onClose()
  }

  function clearFilters() {
    setPrecioMin('')
    setPrecioMax('')
    setHabitaciones('')
    setBanosMin('')
    setAreaMin('')
    setAreaMax('')
    const p = new URLSearchParams(searchParams.toString())
    ;['precio_min', 'precio_max', 'hab', 'banos', 'area_min', 'area_max'].forEach((k) =>
      p.delete(k)
    )
    router.push(`/pisos?${p.toString()}`)
    onClose()
  }

  const hasActiveFilters =
    precioMin || precioMax || habitaciones || banosMin || areaMin || areaMax

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-gray-900 text-base">Filtros</h2>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Limpiar todo
            </button>
          )}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-gray-400 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Precio */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2.5">Precio</h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="Mín."
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
                onBlur={applyFilters}
                className="w-full pl-3 pr-6 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
            </div>
            <span className="text-gray-300 text-sm shrink-0">—</span>
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="Máx."
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                onBlur={applyFilters}
                className="w-full pl-3 pr-6 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
            </div>
          </div>
        </div>

        {/* Habitaciones */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2.5">Habitaciones</h3>
          <div className="flex flex-wrap gap-1.5">
            {HABITACIONES_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  const val = habitaciones === opt.value ? '' : opt.value
                  setHabitaciones(val)
                  const p = buildParams({ hab: val })
                  router.push(`/pisos?${p.toString()}`)
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  habitaciones === opt.value
                    ? 'bg-gold-500 text-white border-gold-500'
                    : 'border-gray-200 text-gray-600 hover:border-gold-400 hover:text-gold-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Baños */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2.5">Baños</h3>
          <div className="flex flex-wrap gap-1.5">
            {BANOS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  const val = banosMin === opt.value ? '' : opt.value
                  setBanosMin(val)
                  const p = buildParams({ banos: val })
                  router.push(`/pisos?${p.toString()}`)
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  banosMin === opt.value
                    ? 'bg-gold-500 text-white border-gold-500'
                    : 'border-gray-200 text-gray-600 hover:border-gold-400 hover:text-gold-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Superficie */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2.5">Superficie</h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="Mín."
                value={areaMin}
                onChange={(e) => setAreaMin(e.target.value)}
                onBlur={applyFilters}
                className="w-full pl-3 pr-7 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
            </div>
            <span className="text-gray-300 text-sm shrink-0">—</span>
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="Máx."
                value={areaMax}
                onChange={(e) => setAreaMax(e.target.value)}
                onBlur={applyFilters}
                className="w-full pl-3 pr-7 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón aplicar (mobile) */}
      <div className="lg:hidden pt-4 border-t border-gray-100 mt-4">
        <button
          onClick={applyFilters}
          className="w-full py-3 rounded-full bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 transition-colors"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: sidebar fija */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
        <div className="sticky top-20 bg-white rounded-xl border border-gray-100 shadow-sm p-5 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {content}
        </div>
      </aside>

      {/* Mobile: drawer overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          {/* Panel */}
          <div className="relative ml-auto w-80 max-w-full h-full bg-white shadow-2xl p-5 overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </>
  )
}

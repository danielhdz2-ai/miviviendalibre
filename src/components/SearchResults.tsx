'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import FiltersPanel from './FiltersPanel'
import ResultsHeader from './ResultsHeader'
import ListingCard from './ListingCard'
import ListingCardList from './ListingCardList'
import type { Listing, VistaOption } from '@/types/listings'
import Link from 'next/link'

const MapSearchView = dynamic(() => import('./MapSearchView'), { ssr: false })

interface CurrentParams {
  ciudad: string
  operacion: string
  soloParticulares: boolean
  ordenar: string
  vista: string
  precioMin?: number
  precioMax?: number
  habitaciones?: number
  banosMin?: number
  areaMin?: number
  areaMax?: number
}

interface SearchResultsProps {
  listings: Listing[]
  total: number
  pagina: number
  totalPaginas: number
  vista: VistaOption
  currentParams: CurrentParams
  activeFilterCount: number
}

export default function SearchResults({
  listings,
  total,
  pagina,
  totalPaginas,
  vista,
  currentParams,
  activeFilterCount,
}: SearchResultsProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  function buildHref(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    if (currentParams.ciudad) p.set('ciudad', currentParams.ciudad)
    if (currentParams.operacion) p.set('operacion', currentParams.operacion)
    if (currentParams.soloParticulares) p.set('solo_particulares', 'true')
    if (currentParams.ordenar && currentParams.ordenar !== 'relevancia') p.set('ordenar', currentParams.ordenar)
    if (currentParams.vista && currentParams.vista !== 'lista') p.set('vista', currentParams.vista)
    if (currentParams.precioMin) p.set('precio_min', String(currentParams.precioMin))
    if (currentParams.precioMax) p.set('precio_max', String(currentParams.precioMax))
    if (currentParams.habitaciones != null) p.set('hab', String(currentParams.habitaciones))
    if (currentParams.banosMin) p.set('banos', String(currentParams.banosMin))
    if (currentParams.areaMin) p.set('area_min', String(currentParams.areaMin))
    if (currentParams.areaMax) p.set('area_max', String(currentParams.areaMax))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v)
      else p.delete(k)
    })
    return `/pisos?${p.toString()}`
  }

  return (
    <div className={`flex gap-6 items-start ${vista === 'mapa' ? 'overflow-hidden' : ''}`}>
      {/* Sidebar filtros — oculto en vista mapa (el chat IA reemplaza su función) */}
      {vista !== 'mapa' && <FiltersPanel isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />}

      {/* Columna principal */}
      <div className="flex-1 min-w-0">
        {/* Header resultados */}
        <ResultsHeader
          total={total}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={activeFilterCount}
        />

        {/* Listado / Mapa */}
        {listings.length > 0 ? (
          vista === 'mapa' ? (
            <MapSearchView
              listings={listings}
              total={total}
              ciudad={currentParams.ciudad}
              searchQuery={(() => {
                const p = new URLSearchParams()
                if (currentParams.ciudad) p.set('ciudad', currentParams.ciudad)
                if (currentParams.operacion) p.set('operacion', currentParams.operacion)
                if (currentParams.soloParticulares) p.set('solo_particulares', 'true')
                if (currentParams.precioMin) p.set('precio_min', String(currentParams.precioMin))
                if (currentParams.precioMax) p.set('precio_max', String(currentParams.precioMax))
                if (currentParams.habitaciones != null) p.set('hab', String(currentParams.habitaciones))
                if (currentParams.banosMin) p.set('banos', String(currentParams.banosMin))
                if (currentParams.areaMin) p.set('area_min', String(currentParams.areaMin))
                if (currentParams.areaMax) p.set('area_max', String(currentParams.areaMax))
                return p.toString()
              })()}
            />
          ) : vista === 'lista' ? (
            <div className="flex flex-col gap-3">
              {listings.map((listing) => (
                <ListingCardList key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-lg font-semibold text-gray-700">No encontramos anuncios</h2>
            <p className="text-gray-500 mt-1 text-sm">Prueba con otra ciudad o amplía los filtros</p>
            <Link
              href="/pisos"
              className="mt-5 inline-block px-5 py-2.5 bg-gold-500 text-white rounded-full text-sm font-semibold hover:bg-gold-600 transition-colors"
            >
              Ver todos los anuncios
            </Link>
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            {pagina > 1 && (
              <Link
                href={buildHref({ pagina: String(pagina - 1) })}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ← Anterior
              </Link>
            )}
            <span className="px-4 py-2 rounded-lg bg-gold-500 text-white text-sm font-semibold">
              {pagina} / {totalPaginas}
            </span>
            {pagina < totalPaginas && (
              <Link
                href={buildHref({ pagina: String(pagina + 1) })}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Siguiente →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

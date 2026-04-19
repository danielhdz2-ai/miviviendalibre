import Navbar from '@/components/NavbarServer'
import SearchResults from '@/components/SearchResults'
import type { Metadata } from 'next'
import type { OperationType, SortOption, VistaOption } from '@/types/listings'
import { searchListings } from '@/lib/listings'
import Link from 'next/link'
import SearchForm from '@/components/SearchForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PisosPageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export async function generateMetadata({ searchParams }: PisosPageProps): Promise<Metadata> {
  const params = await searchParams
  const ciudad = params.ciudad
  const operacion = params.operacion
  const soloParticulares = params.solo_particulares === 'true'

  const opLabel = operacion === 'sale' ? 'en venta' : operacion === 'rent' ? 'en alquiler' : ''
  const ciudadLabel = ciudad ? ` en ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}` : ''
  const particulares = soloParticulares ? ' de particulares' : ''

  const title = `Pisos${opLabel ? ' ' + opLabel : ''}${ciudadLabel}${particulares} — Inmonest`
  const description = `Encuentra pisos${opLabel ? ' ' + opLabel : ''}${ciudadLabel} publicados directamente por sus propietarios. Sin comisiones de agencia.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `/pisos${ciudad ? `?ciudad=${encodeURIComponent(ciudad)}` : ''}`,
    },
  }
}

const PAGE_SIZE = 24

export default async function PisosPage({ searchParams }: PisosPageProps) {
  const params = await searchParams

  const ciudad = params.ciudad ?? ''
  const operacion = (params.operacion as OperationType) || undefined
  const soloParticulares = params.solo_particulares === 'true'
  const soloBancarias    = params.solo_bancarias === 'true'
  const soloAgencias     = params.solo_agencias === 'true'
  const ordenar = (params.ordenar as SortOption) || 'relevancia'
  const vista = (params.vista as VistaOption) || 'grid'
  const pagina = Math.max(1, parseInt(params.pagina ?? '1', 10))

  const habitaciones = params.hab ? parseInt(params.hab, 10) : undefined
  const banosMin = params.banos ? parseInt(params.banos, 10) : undefined
  const precioMin = params.precio_min ? parseInt(params.precio_min, 10) : undefined
  const precioMax = params.precio_max ? parseInt(params.precio_max, 10) : undefined
  const areaMin = params.area_min ? parseInt(params.area_min, 10) : undefined
  const areaMax = params.area_max ? parseInt(params.area_max, 10) : undefined

  // Filtros pro
  const estado     = params.estado     || undefined
  const caract     = params.caract     || undefined
  const planta     = params.planta     || undefined
  const energia    = params.energia    || undefined
  const multimedia = params.multimedia || undefined
  const fechaPub   = params.fecha_pub  || undefined

  const { listings, total } = await searchListings({
    ciudad: ciudad || undefined,
    operacion,
    solo_particulares: soloParticulares,
    solo_bancarias: soloBancarias,
    solo_agencias: soloAgencias,
    ordenar,
    habitaciones,
    banos_min: banosMin,
    precio_min: precioMin,
    precio_max: precioMax,
    area_min: areaMin,
    area_max: areaMax,
    pagina,
    estado,
    caract,
    planta,
    energia,
    multimedia,
    fecha_pub: fechaPub,
  })

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Contar filtros activos (para badge en mobile)
  const activeFilterCount = [
    precioMin, precioMax, habitaciones, banosMin, areaMin, areaMax,
    estado, caract, planta, energia, multimedia, fechaPub,
  ].filter((v) => v != null && v !== '').length

  // Título SEO de la página
  const pageTitle = ciudad
    ? `Pisos en ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}`
    : 'Todos los pisos'

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Barra de búsqueda compacta */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <SearchForm
            compact
            defaultValues={{
              ciudad: ciudad || undefined,
              operacion: operacion || 'rent',
              soloParticulares,
              soloBancarias,
              soloAgencias,
            }}
          />
        </div>
      </div>

      {/* Layout según vista: mapa=full-width, resto=contenedor */}
      {vista === 'mapa' ? (
        <div className="w-full overflow-hidden">
          {/* Breadcrumb + título compacto */}
          <div className="px-4 sm:px-6 lg:px-8 py-2 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <nav className="text-xs text-gray-400 flex items-center gap-1.5">
                  <a href="/" className="hover:text-gray-600">Inicio</a>
                  <span>/</span>
                  <span className="text-gray-600">
                    {operacion === 'sale' ? 'Venta' : operacion === 'rent' ? 'Alquiler' : 'Pisos'}
                  </span>
                  {ciudad && (
                    <>
                      <span>/</span>
                      <span className="text-gray-900 font-medium">
                        {ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}
                      </span>
                    </>
                  )}
                </nav>
                <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2 mt-0.5">
                  {pageTitle}
                  {operacion && (
                    <span className="text-gray-500 font-normal">
                      · {operacion === 'rent' ? 'Alquiler' : 'Venta'}
                    </span>
                  )}
                  {soloParticulares && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-[#fef0c0] text-[#a87a20] rounded-full">
                      👤 Solo particulares
                    </span>
                  )}
                  {soloBancarias && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                      🏦 Fondos bancarios
                    </span>
                  )}
                  {soloAgencias && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                      🏢 Agencias
                    </span>
                  )}
                </h1>
              </div>
            </div>
          </div>
          <SearchResults
            listings={listings}
            total={total}
            pagina={pagina}
            totalPaginas={totalPaginas}
            vista={vista}
            currentParams={{
              ciudad,
              operacion: operacion ?? '',
              soloParticulares,
              soloBancarias,
              soloAgencias,
              ordenar,
              vista,
              precioMin,
              precioMax,
              habitaciones,
              banosMin,
              areaMin,
              areaMax,
              estado,
              caract,
              planta,
              energia,
              multimedia,
              fechaPub,
            }}
            activeFilterCount={activeFilterCount}
          />
        </div>
      ) : (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb + título */}
          <div className="mb-4">
            <nav className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
              <Link href="/" className="hover:text-gray-600">Inicio</Link>
              <span>/</span>
              <span className="text-gray-600">
                {operacion === 'sale' ? 'Venta' : operacion === 'rent' ? 'Alquiler' : 'Pisos'}
              </span>
              {ciudad && (
                <>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">
                    {ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}
                  </span>
                </>
              )}
            </nav>
            <h1 className="text-xl font-bold text-gray-900">
              {pageTitle}
              {operacion && (
                <span className="text-gray-500 font-normal text-base ml-2">
                  · {operacion === 'rent' ? 'Alquiler' : 'Venta'}
                </span>
              )}
              {soloParticulares && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-[#fef0c0] text-[#a87a20] rounded-full align-middle">
                  👤 Solo particulares
                </span>
              )}
              {soloBancarias && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full align-middle">
                  🏦 Fondos bancarios
                </span>
              )}
              {soloAgencias && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full align-middle">
                  🏢 Agencias
                </span>
              )}
            </h1>
          </div>

          {/* Layout sidebar + resultados */}
          <SearchResults
            listings={listings}
            total={total}
            pagina={pagina}
            totalPaginas={totalPaginas}
            vista={vista}
            currentParams={{
              ciudad,
              operacion: operacion ?? '',
              soloParticulares,
              soloBancarias,
              soloAgencias,
              ordenar,
              vista,
              precioMin,
              precioMax,
              habitaciones,
              banosMin,
              areaMin,
              areaMax,
              estado,
              caract,
              planta,
              energia,
              multimedia,
              fechaPub,
            }}
            activeFilterCount={activeFilterCount}
          />
        </div>
      )}
    </div>
  )
}


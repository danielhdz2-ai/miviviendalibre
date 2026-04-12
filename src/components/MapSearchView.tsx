'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Listing } from '@/types/listings'

const IASearchSidebar = dynamic(() => import('./IASearchSidebar'), { ssr: false })

function formatPriceShort(price: number | null, operation: string): string {
  if (!price) return '?'
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M€`
  if (price >= 1_000) return `${Math.round(price / 1_000)}K€${operation === 'rent' ? '/m' : ''}`
  return `${price}€${operation === 'rent' ? '/m' : ''}`
}

function formatPriceFull(price: number | null, operation: string): string {
  if (!price) return 'Consultar precio'
  const f = price.toLocaleString('es-ES')
  return operation === 'rent' ? `${f} €/mes` : `${f} €`
}

// Coordenadas de ciudades principales para zoom rápido
const CIUDAD_COORDS: Record<string, [number, number]> = {
  madrid: [40.4168, -3.7038],
  barcelona: [41.3879, 2.1699],
  valencia: [39.4699, -0.3763],
  sevilla: [37.3891, -5.9845],
  zaragoza: [41.6488, -0.8891],
  malaga: [36.7202, -4.4203],
  málaga: [36.7202, -4.4203],
  alicante: [38.3452, -0.4815],
  murcia: [37.9922, -1.1307],
  granada: [37.1773, -3.5986],
  bilbao: [43.2630, -2.9350],
  valladolid: [41.6523, -4.7245],
  córdoba: [37.8882, -4.7794],
  cordoba: [37.8882, -4.7794],
  vigo: [42.2314, -8.7124],
  gijón: [43.5322, -5.6611],
  gijon: [43.5322, -5.6611],
  salamanca: [40.9650, -5.6643],
  pamplona: [42.8169, -1.6432],
  toledo: [39.8628, -4.0273],
  palma: [39.5696, 2.6502],
  donostia: [43.3183, -1.9812],
  'san sebastián': [43.3183, -1.9812],
}

interface Props {
  listings: Listing[]
  total?: number
  ciudad?: string
}

export default function MapSearchView({ listings, total, ciudad }: Props) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapObjRef = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  const withCoords = listings.filter((l) => l.lat != null && l.lng != null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createPriceIcon(L: any, listing: Listing, isActive: boolean) {
    const label = formatPriceShort(listing.price_eur, listing.operation)
    const bg = isActive ? '#c9962a' : 'white'
    const color = isActive ? 'white' : '#374151'
    const border = isActive ? '#a87a20' : '#d1d5db'
    const shadow = isActive ? '0 2px 8px rgba(201,150,42,0.5)' : '0 1px 4px rgba(0,0,0,0.18)'
    return L.divIcon({
      html: `<div style="background:${bg};color:${color};border:1.5px solid ${border};font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;white-space:nowrap;box-shadow:${shadow};font-family:sans-serif;cursor:pointer;">${label}</div>`,
      className: '',
      iconAnchor: [24, 16],
    })
  }

  useEffect(() => {
    if (!mapElRef.current || mapObjRef.current) return

    if (!document.getElementById('leaflet-css-search')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css-search'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const map = L.map(mapElRef.current, { scrollWheelZoom: true, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    withCoords.forEach((listing) => {
      const icon = createPriceIcon(L, listing, false)
      const marker = L.marker([listing.lat!, listing.lng!], { icon })
      marker.on('click', () => {
        setActiveId(listing.id)
        const el = cardRefs.current[listing.id]
        if (el && listRef.current) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
      marker.addTo(map)
      markersRef.current[listing.id] = marker
    })

    // Si hay ciudad buscada hacer zoom a ella; si no, ajustar a marcadores disponibles
    const ciudadKey = ciudad?.toLowerCase().trim() ?? ''
    const cityCoords = CIUDAD_COORDS[ciudadKey]
    if (cityCoords) {
      map.setView(cityCoords, 12)
    } else if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map((l) => [l.lat!, l.lng!]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
    } else {
      map.setView([40.4168, -3.7038], 6)
    }

    mapObjRef.current = map
    return () => {
      map.remove()
      mapObjRef.current = null
      markersRef.current = {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapObjRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet')
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const listing = listings.find((l) => l.id === id)
      if (!listing) return
      marker.setIcon(createPriceIcon(L, listing, id === activeId))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  return (
    /* Layout 3 columnas: [chat IA] [lista] [mapa] */
    <div className="flex h-[calc(100vh-128px)] min-h-[500px]">

      {/* ── Columna 1: Buscador IA ──────────────────────────────── */}
      <div className="w-72 shrink-0 hidden lg:flex flex-col border-r border-gray-200">
        <IASearchSidebar />
      </div>

      {/* ── Columna 2: Lista de inmuebles ───────────────────────── */}
      <div
        ref={listRef}
        className="w-80 xl:w-96 shrink-0 overflow-y-auto flex flex-col gap-2 p-3 bg-white border-r border-gray-100"
      >
        {/* Contador */}
        <p className="text-xs text-gray-500 font-medium px-1 pb-1 border-b border-gray-100">
          {total != null ? `+${total.toLocaleString('es-ES')} resultados` : `${listings.length} resultados`}
        </p>

        {listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No hay resultados con los filtros actuales</div>
        ) : (
          listings.map((listing) => {
            const img = listing.listing_images?.[0]
            const imgUrl = img?.storage_path ?? img?.external_url ?? null
            const isActive = listing.id === activeId
            const hasCoords = listing.lat != null && listing.lng != null

            return (
              <Link
                key={listing.id}
                href={`/pisos/${listing.id}`}
                ref={(el) => { cardRefs.current[listing.id] = el }}
                className={`flex bg-white rounded-xl overflow-hidden border transition-all hover:shadow-md ${
                  isActive
                    ? 'border-[#c9962a] shadow-[#c9962a]/20 shadow-md ring-1 ring-[#c9962a]/30'
                    : listing.is_bank
                    ? 'border-blue-200 hover:border-blue-300'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                onMouseEnter={() => { if (hasCoords) setActiveId(listing.id) }}
                onMouseLeave={() => setActiveId(null)}
              >
                {/* Imagen cuadrada más grande */}
                <div className="w-32 h-32 shrink-0 bg-gray-100 overflow-hidden relative">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt={listing.title} className="w-full h-full object-cover absolute inset-0" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                    </div>
                  )}
                  {listing.is_bank && (
                    <span className="absolute top-1 left-1 bg-blue-900 text-yellow-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      🏦
                    </span>
                  )}
                  {listing.is_particular && (
                    <span className="absolute bottom-1 left-1 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      💎
                    </span>
                  )}
                  <span className={`absolute top-1 right-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${listing.operation === 'rent' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                    {listing.operation === 'rent' ? 'Alq.' : 'Venta'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 px-3 py-2.5 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm leading-tight">
                      {formatPriceFull(listing.price_eur, listing.operation)}
                    </p>
                    <p className="text-xs text-gray-700 line-clamp-2 leading-snug mt-0.5 font-medium">
                      {listing.title}
                    </p>
                    {listing.description && (
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-snug mt-1">
                        {listing.description.slice(0, 90)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1.5 text-xs text-gray-500 flex-wrap">
                    {listing.bedrooms != null && (
                      <span>🛏 {listing.bedrooms === 0 ? 'Estudio' : listing.bedrooms}</span>
                    )}
                    {listing.bathrooms != null && (
                      <span>🚿 {listing.bathrooms}</span>
                    )}
                    {listing.area_m2 && <span>📐 {listing.area_m2}m²</span>}
                    {listing.city && <span className="truncate text-gray-400">📍 {listing.city}</span>}
                  </div>
                </div>
              </Link>
            )
          })
        )}

        {listings.length > 0 && (
          <p className="text-xs text-gray-300 text-center py-2">
            {withCoords.length} de {listings.length} con ubicación exacta
          </p>
        )}
      </div>

      {/* ── Columna 3: Mapa ─────────────────────────────────────── */}
      <div
        ref={mapElRef}
        className="flex-1 overflow-hidden"
        style={{ minWidth: 0 }}
      />
    </div>
  )
}

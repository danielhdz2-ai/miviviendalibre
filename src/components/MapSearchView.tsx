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

interface MapPin {
  id: string
  lat: number
  lng: number
  price_eur: number | null
  operation: string
  city: string | null
}

interface Props {
  listings: Listing[]
  total?: number
  ciudad?: string
  searchQuery?: string
}

export default function MapSearchView({ listings, total, ciudad, searchQuery }: Props) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapObjRef = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({})
  const allPinMarkersRef = useRef<ReturnType<typeof import('leaflet')['marker']>[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  // Añadir coords de ciudad como fallback para listings sin lat/lng exacto (solo para la lista)
  const listingsWithCoords = listings.map((l) => {
    if (l.lat != null && l.lng != null) return l
    const cityKey = l.city?.toLowerCase().trim() ?? ''
    const fallback = CIUDAD_COORDS[cityKey]
    if (!fallback) return l
    return { ...l, lat: fallback[0] + (Math.random() - 0.5) * 0.01, lng: fallback[1] + (Math.random() - 0.5) * 0.01, _cityFallback: true }
  })
  const withCoords = listingsWithCoords.filter((l) => l.lat != null && l.lng != null)

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

    // Marcadores interactivos para los 24 de la página actual
    withCoords.forEach((listing) => {
      const icon = createPriceIcon(L, listing, false)
      const marker = L.marker([listing.lat!, listing.lng!], { icon, opacity: (listing as Record<string, unknown>)._cityFallback ? 0.7 : 1 })
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

    // Cargar TODOS los pins del mapa vía API (sin límite de página)
    if (searchQuery) {
      fetch(`/api/pisos/map-pins?${searchQuery}`)
        .then((r) => r.json())
        .then(({ pins }: { pins: MapPin[] }) => {
          if (!mapObjRef.current) return
          // Marcar los ids que ya tienen marcador interactivo
          const interactiveIds = new Set(withCoords.map((l) => l.id))
          const dotIcon = L.divIcon({
            html: `<div style="width:10px;height:10px;background:#c9962a;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
            className: '',
            iconAnchor: [5, 5],
          })
          pins.forEach((pin) => {
            if (interactiveIds.has(pin.id)) return // ya tiene precio label
            const m = L.marker([pin.lat, pin.lng], { icon: dotIcon, opacity: 0.85 })
            m.addTo(map)
            allPinMarkersRef.current.push(m)
          })
          // Si no había ciudad para hacer zoom, hacer fitBounds con todos los pins
          if (!cityCoords && pins.length > 0 && withCoords.length === 0) {
            const allBounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]))
            map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 13 })
          }
        })
        .catch(() => { /* silenciar errores de red */ })
    }

    return () => {
      map.remove()
      mapObjRef.current = null
      markersRef.current = {}
      allPinMarkersRef.current = []
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
        className="w-96 xl:w-[440px] shrink-0 overflow-y-auto flex flex-col gap-2 p-3 bg-white border-r border-gray-100"
      >
        {/* Contador */}
        <p className="text-xs text-gray-500 font-medium px-1 pb-1 border-b border-gray-100">
          {total != null ? `+${total.toLocaleString('es-ES')} resultados` : `${listings.length} resultados`}
        </p>

        {listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No hay resultados con los filtros actuales</div>
        ) : (
          listingsWithCoords.map((listing) => {
            const img = listing.listing_images?.[0]
            const imgUrl = img?.storage_path ?? img?.external_url ?? null
            const isActive = listing.id === activeId

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
                onMouseEnter={() => { if (listingsWithCoords.find(l => l.id === listing.id)?.lat != null) setActiveId(listing.id) }}
                onMouseLeave={() => setActiveId(null)}
              >
                {/* Imagen — se estira al alto del contenido */}
                <div className="w-36 shrink-0 self-stretch bg-gray-100 overflow-hidden relative" style={{ minHeight: '110px' }}>
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt="" className="w-full h-full object-cover absolute inset-0" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 px-3 py-2 min-w-0">
                  {/* Fila superior: precio + badge operación */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm leading-tight">
                      {formatPriceFull(listing.price_eur, listing.operation)}
                    </span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      listing.operation === 'rent' ? 'bg-sky-100 text-sky-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {listing.operation === 'rent' ? 'ALQ' : 'VENTA'}
                    </span>
                  </div>
                  {/* Título */}
                  <p className="text-xs text-gray-600 line-clamp-2 leading-snug mt-1">
                    {listing.title}
                  </p>
                  {/* Iconos: habs · m² · ciudad */}
                  <div className="flex gap-2 mt-1.5 text-xs text-gray-400 flex-wrap items-center">
                    {listing.bedrooms != null && (
                      <span>🛏 {listing.bedrooms === 0 ? 'Estudio' : listing.bedrooms}</span>
                    )}
                    {listing.area_m2 && <span>📐 {listing.area_m2}m²</span>}
                    {listing.city && <span className="truncate">📍 {listing.city}</span>}
                  </div>
                  {/* Badges */}
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {listing.is_particular && (
                      <span className="inline-flex items-center bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                        ✓ PROPIETARIO DIRECTO
                      </span>
                    )}
                    {listing.is_bank && (
                      <span className="inline-flex items-center bg-blue-900 text-yellow-300 text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                        🏦 BANCO
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}

        {listings.length > 0 && (
          <p className="text-xs text-gray-300 text-center py-2">
            {withCoords.length} de {listings.length} en el mapa
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

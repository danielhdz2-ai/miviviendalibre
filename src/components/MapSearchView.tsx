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

// ── Clustering ligero para pins secundarios ────────────────────────────────
// Agrupa pins que caen en la misma celda de grid (≈500 m a zoom 12)
function deduplicatePins(pins: MapPin[]): Array<{ pin: MapPin; count: number }> {
  const GRID = 150 // ~0.007° ≈ 500 m
  const cells = new Map<string, { pin: MapPin; count: number }>()
  for (const pin of pins) {
    const key = `${Math.round(pin.lat * GRID)},${Math.round(pin.lng * GRID)}`
    if (cells.has(key)) {
      cells.get(key)!.count++
    } else {
      cells.set(key, { pin, count: 1 })
    }
  }
  return Array.from(cells.values())
}

function clusterIconHtml(count: number): string {
  const sz = count > 20 ? '32px' : '26px'
  const fs = count > 20 ? '12px' : '11px'
  return `<div style="width:${sz};height:${sz};border-radius:50%;background:#c9962a;border:2px solid #fff;color:#fff;font-size:${fs};font-weight:800;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);box-shadow:0 2px 8px rgba(0,0,0,0.25);font-family:-apple-system,system-ui,sans-serif;cursor:pointer;">${count > 99 ? '99+' : count}</div>`
}

// Genera HTML del badge de precio centrado en el pin del mapa
// iconAnchor:[0,0] + translate(-50%,-50%) = centrado exacto en la coordenada
function priceIconHtml(label: string, active: boolean, small = false): string {
  const bg = active ? '#c9962a' : '#ffffff'
  const color = active ? '#ffffff' : '#111827'
  const border = '#c9962a'
  const shadow = active
    ? '0 3px 12px rgba(201,150,42,0.55)'
    : '0 2px 6px rgba(0,0,0,0.22)'
  const fs = small ? '10px' : '12px'
  const fw = '800'
  const px = small ? '7px' : '10px'
  const py = small ? '2px' : '4px'
  const br = '20px'
  return `<div style="display:inline-block;background:${bg};color:${color};border:2px solid ${border};font-size:${fs};font-weight:${fw};padding:${py} ${px};border-radius:${br};white-space:nowrap;box-shadow:${shadow};font-family:-apple-system,system-ui,sans-serif;cursor:pointer;transform:translate(-50%,-50%);line-height:1.3;">${label}</div>`
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
  const withCoords = listingsWithCoords.filter(
    (l) => l.lat != null && l.lng != null && !(l as Record<string, unknown>)._cityFallback
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createPriceIcon(L: any, listing: Listing, isActive: boolean) {
    const label = formatPriceShort(listing.price_eur, listing.operation)
    return L.divIcon({
      html: priceIconHtml(label, isActive, false),
      className: '',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createSecondaryPriceIcon(L: any, pin: MapPin) {
    const label = formatPriceShort(pin.price_eur, pin.operation)
    return L.divIcon({
      html: priceIconHtml(label, false, true),
      className: '',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
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
      const marker = L.marker([listing.lat!, listing.lng!], {
        icon,
        opacity: (listing as Record<string, unknown>)._cityFallback ? 0.7 : 1,
        zIndexOffset: 100,
      })
      const rawImg = listing.listing_images?.[0]?.storage_path
        ?? (listing.listing_images?.[0]?.external_url
          ? `/api/img-proxy?url=${encodeURIComponent(listing.listing_images[0].external_url)}`
          : null)
      const imgUrl = rawImg
      const priceFull = formatPriceFull(listing.price_eur, listing.operation)
      const opLabel = listing.operation === 'rent' ? 'Alquiler' : 'Venta'
      const opColor = listing.operation === 'rent' ? '#0284c7' : '#ea580c'
      marker.bindPopup(
        `<div style="font-family:-apple-system,system-ui,sans-serif;width:200px;overflow:hidden;border-radius:8px;">
          ${imgUrl ? `<img src="${imgUrl}" alt="" style="width:100%;height:110px;object-fit:cover;display:block;margin:-10px -20px 0;width:calc(100% + 40px);" />` : ''}
          <div style="padding:${imgUrl ? '8px 0 0' : '0'};">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span style="font-weight:800;font-size:15px;color:#111827;">${priceFull}</span>
              <span style="font-size:10px;font-weight:700;background:${opColor};color:white;padding:2px 6px;border-radius:20px;">${opLabel}</span>
            </div>
            <p style="margin:4px 0 0;font-size:11px;color:#6b7280;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${listing.title}</p>
            ${listing.bedrooms != null || listing.area_m2 != null ? `<p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">${[listing.bedrooms != null ? `🛏 ${listing.bedrooms} hab` : null, listing.area_m2 != null ? `📐 ${listing.area_m2}m²` : null].filter(Boolean).join(' · ')}</p>` : ''}
          </div>
        </div>`,
        { offset: [0, -4], maxWidth: 220 }
      )
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
          const nonInteractive = pins.filter((p) => !interactiveIds.has(p.id))
          const clustered = deduplicatePins(nonInteractive)
          clustered.forEach(({ pin, count }) => {
            const icon = count > 1
              ? L.divIcon({ html: clusterIconHtml(count), className: '', iconSize: [0, 0], iconAnchor: [0, 0] })
              : createSecondaryPriceIcon(L, pin)
            const m = L.marker([pin.lat, pin.lng], { icon, opacity: 0.9, zIndexOffset: -100 })
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
        className="w-[340px] xl:w-[380px] shrink-0 overflow-y-auto flex flex-col gap-3 p-3 bg-gray-50 border-r border-gray-200"
      >
        {/* Contador */}
        <p className="text-xs text-gray-500 font-medium px-1 pb-1 border-b border-gray-200">
          {total != null ? `+${total.toLocaleString('es-ES')} resultados` : `${listings.length} resultados`}
        </p>

        {listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No hay resultados con los filtros actuales</div>
        ) : (
          listingsWithCoords.map((listing) => {
            const img = listing.listing_images?.[0]
            const imgUrl = img?.storage_path
              ?? (img?.external_url ? `/api/img-proxy?url=${encodeURIComponent(img.external_url)}` : null)
            const isActive = listing.id === activeId

            return (
              <Link
                key={listing.id}
                href={`/pisos/${listing.id}`}
                ref={(el) => { cardRefs.current[listing.id] = el }}
                className={`block bg-white rounded-2xl overflow-hidden border transition-all duration-150 hover:shadow-xl hover:-translate-y-0.5 ${
                  isActive
                    ? 'border-[#c9962a] shadow-[#c9962a]/40 shadow-xl ring-2 ring-[#c9962a]/30'
                    : listing.is_bank
                    ? 'border-blue-200 shadow-sm'
                    : 'border-gray-100 shadow-sm hover:border-[#c9962a]/40'
                }`}
                onMouseEnter={() => { if (listingsWithCoords.find(l => l.id === listing.id)?.lat != null) setActiveId(listing.id) }}
                onMouseLeave={() => setActiveId(null)}
              >
                {/* Imagen — arriba, panorámica */}
                <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                    </div>
                  )}
                  {/* Badge operación */}
                  <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full ${
                    listing.operation === 'rent' ? 'bg-sky-600 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {listing.operation === 'rent' ? 'Alquiler' : 'Venta'}
                  </span>
                  {/* Badge particular */}
                  {listing.is_particular && (
                    <span className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      💎 Particular
                    </span>
                  )}
                  {listing.is_bank && (
                    <span className="absolute top-2 right-2 bg-blue-900 text-yellow-300 text-xs font-bold px-2 py-1 rounded-full">
                      🏦 Banco
                    </span>
                  )}
                </div>

                {/* Info — abajo */}
                <div className="p-3">
                  {/* Precio */}
                  <p className={`font-extrabold text-xl leading-tight ${isActive ? 'text-[#c9962a]' : 'text-gray-900'}`}>
                    {formatPriceFull(listing.price_eur, listing.operation)}
                  </p>

                  {/* Título */}
                  <p className="text-sm font-medium text-gray-700 line-clamp-1 mt-1">
                    {listing.title}
                  </p>

                  {/* Localización */}
                  {listing.city && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      📍 {[listing.district, listing.city].filter(Boolean).join(', ')}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-3 mt-2 text-sm text-gray-600">
                    {listing.bedrooms != null && (
                      <span>🛏 {listing.bedrooms === 0 ? 'Estudio' : `${listing.bedrooms} hab`}</span>
                    )}
                    {listing.bathrooms != null && (
                      <span>🚿 {listing.bathrooms}</span>
                    )}
                    {listing.area_m2 != null && (
                      <span>📐 {listing.area_m2} m²</span>
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

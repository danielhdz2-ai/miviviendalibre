'use client'

import { useEffect, useRef } from 'react'

interface MapProps {
  lat: number
  lng: number
  title: string
  price?: string
  zoom?: number
  circleRadius?: number
}

export default function ListingMap({ lat, lng, title, price, zoom = 15, circleRadius = 200 }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Carga dinámica de Leaflet para SSR
    import('leaflet').then((L) => {
      // Fix iconos en Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Icono custom dorado
      const goldIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:32px;height:32px;
          background:#c9962a;
          border:3px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })

      if (!mapRef.current) return
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Círculo de zona aproximada (privacidad — no se muestra dirección exacta)
      L.circle([lat, lng], {
        color: '#c9962a',
        fillColor: '#c9962a',
        fillOpacity: 0.1,
        radius: circleRadius,
        weight: 2,
      }).addTo(map)

      L.marker([lat, lng], { icon: goldIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;min-width:140px">
            <p style="font-weight:700;font-size:13px;margin:0 0 4px">${title.slice(0, 50)}</p>
            ${price ? `<p style="color:#c9962a;font-weight:700;font-size:15px;margin:0">${price}</p>` : ''}
           </div>`,
          { offset: [0, -20] }
        )
        .openPopup()

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapInstanceRef.current as any).remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng, title, price, zoom, circleRadius])

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapRef} className="w-full h-[280px] rounded-xl overflow-hidden z-0" />
    </>
  )
}

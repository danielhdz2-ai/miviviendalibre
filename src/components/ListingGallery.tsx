'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

const ListingMap = dynamic(() => import('@/components/ListingMap'), { ssr: false })

interface ImageItem {
  id: string
  storage_path?: string | null
  external_url?: string | null
}

interface Props {
  images: ImageItem[]
  title: string
  lat?: number | null
  lng?: number | null
  priceLabel?: string
}

export default function ListingGallery({ images, title, lat, lng, priceLabel }: Props) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lightboxTab, setLightboxTab] = useState<'fotos' | 'mapa'>('fotos')

  const prev = useCallback(() => setCurrent(c => (c - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent(c => (c + 1) % images.length), [images.length])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, prev, next])

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  const getUrl = (img: ImageItem) => {
    if (img.storage_path) return img.storage_path
    if (img.external_url) return `/api/img-proxy?url=${encodeURIComponent(img.external_url)}`
    return ''
  }

  const openAt = (i: number) => { setCurrent(i); setLightboxTab('fotos'); setLightbox(true) }

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[16/7] bg-gray-100 flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        </svg>
      </div>
    )
  }

  // ── Mosaico: 1 grande izquierda + hasta 4 pequeñas derecha ────────────
  const thumb = images.slice(1, 5)
  const remaining = images.length - 5

  return (
    <>
      {/* ── Mosaico edge-to-edge ─────────────────────────────────────── */}
      <div className="w-full">
        {images.length === 1 ? (
          /* Solo 1 foto — ocupa todo el ancho */
          <div
            className="relative w-full aspect-[16/7] overflow-hidden cursor-zoom-in bg-gray-100"
            onClick={() => openAt(0)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getUrl(images[0])} alt={title} className="w-full h-full object-cover" />
            <div className="absolute bottom-4 right-4">
              <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                📷 Ver foto
              </span>
            </div>
          </div>
        ) : (
          /* Mosaico */
          <div className="grid gap-1" style={{ gridTemplateColumns: '3fr 2fr', height: '480px' }}>
            {/* Foto grande izquierda */}
            <div
              className="relative overflow-hidden cursor-zoom-in bg-gray-100 group"
              onClick={() => openAt(0)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getUrl(images[0])}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>

            {/* Grid 2×2 derecha */}
            <div className="grid grid-rows-2 grid-cols-2 gap-1">
              {thumb.map((img, i) => {
                const isLast = i === 3 && images.length > 5
                return (
                  <div
                    key={img.id}
                    className="relative overflow-hidden cursor-zoom-in bg-gray-100 group"
                    onClick={() => openAt(i + 1)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getUrl(img)}
                      alt={`Foto ${i + 2}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {isLast && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">+{remaining + 1} fotos</span>
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Rellenar celdas vacías si hay menos de 4 miniaturas */}
              {Array.from({ length: Math.max(0, 4 - thumb.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-100" />
              ))}
            </div>
          </div>
        )}

        {/* Botón "Ver todas las fotos" superpuesto abajo a la derecha */}
        {images.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
            <span className="text-sm text-gray-500">{images.length} fotos</span>
            <button
              onClick={() => openAt(0)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#c9962a] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Ver todas las fotos
            </button>
          </div>
        )}
      </div>

      {/* ── Lightbox pantalla completa ─────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={e => { if (e.target === e.currentTarget) setLightbox(false) }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setLightboxTab('fotos')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  lightboxTab === 'fotos' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
                }`}
              >
                📷 Fotos ({images.length})
              </button>
              {lat && lng && (
                <button
                  onClick={() => setLightboxTab('mapa')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    lightboxTab === 'mapa' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
                  }`}
                >
                  🗺️ Mapa
                </button>
              )}
            </div>
            {lightboxTab === 'fotos' && (
              <span className="text-white/60 text-sm">{current + 1} / {images.length}</span>
            )}
            <button
              onClick={() => setLightbox(false)}
              aria-label="Cerrar"
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {lightboxTab === 'fotos' ? (
            <>
              <div className="flex-1 relative min-h-0 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getUrl(images[current])}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-contain select-none"
                  draggable={false}
                />
                {images.length > 1 && (
                  <>
                    <button onClick={prev} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full w-11 h-11 flex items-center justify-center transition-colors z-10">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={next} aria-label="Siguiente" className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full w-11 h-11 flex items-center justify-center transition-colors z-10">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto justify-center">
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setCurrent(i)}
                      className={`shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${i === current ? 'border-white opacity-100 scale-105' : 'border-transparent opacity-40 hover:opacity-70'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getUrl(img)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 relative">
              <div className="absolute inset-4 rounded-xl overflow-hidden">
                {lat && lng && <ListingMap lat={lat} lng={lng} title={title} price={priceLabel} />}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}


export default function ListingGallery({ images, title, lat, lng, priceLabel }: Props) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lightboxTab, setLightboxTab] = useState<'fotos' | 'mapa'>('fotos')

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % images.length)
  }, [images.length])

  // Teclado dentro del lightbox
  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, prev, next])

  // Bloquear scroll al abrir lightbox
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-gray-100 rounded-xl flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
        </svg>
      </div>
    )
  }

  const getUrl = (img: ImageItem) => {
    if (img.storage_path) return img.storage_path
    if (img.external_url) return `/api/img-proxy?url=${encodeURIComponent(img.external_url)}`
    return ''
  }

  return (
    <>
      {/* ── Galería principal ─────────────────────────── */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
        {/* Imagen principal — clic abre lightbox */}
        <div
          className="relative aspect-[16/9] overflow-hidden bg-gray-100 cursor-zoom-in group"
          onClick={() => { setLightboxTab('fotos'); setLightbox(true) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getUrl(images[current])}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Flechas en imagen principal */}
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                aria-label="Anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                aria-label="Siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Contador + botón ampliar */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {images.length > 1 && (
              <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none">
                {current + 1} / {images.length} fotos
              </span>
            )}
            <span className="bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 cursor-zoom-in">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Ver todo
            </span>
          </div>
        </div>

        {/* Miniaturas */}
        {images.length > 1 && (
          <div className="flex gap-1 p-1 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrent(i)}
                className={`relative shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all ${
                  i === current ? 'border-[#c9962a] opacity-100' : 'border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getUrl(img)} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
            {/* Botón mapa si hay coords */}
            {lat && lng && (
              <button
                onClick={() => { setLightboxTab('mapa'); setLightbox(true) }}
                className="shrink-0 w-20 h-14 rounded overflow-hidden border-2 border-transparent opacity-60 hover:opacity-90 bg-blue-50 flex flex-col items-center justify-center gap-0.5 text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-[10px] font-medium">Mapa</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox pantalla completa ─────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={e => { if (e.target === e.currentTarget) setLightbox(false) }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            {/* Tabs Fotos / Mapa */}
            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setLightboxTab('fotos')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  lightboxTab === 'fotos' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
                }`}
              >
                📷 Fotos ({images.length})
              </button>
              {lat && lng && (
                <button
                  onClick={() => setLightboxTab('mapa')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    lightboxTab === 'mapa' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
                  }`}
                >
                  🗺️ Mapa
                </button>
              )}
            </div>

            {/* Contador */}
            {lightboxTab === 'fotos' && (
              <span className="text-white/60 text-sm">
                {current + 1} / {images.length}
              </span>
            )}

            {/* Cerrar */}
            <button
              onClick={() => setLightbox(false)}
              aria-label="Cerrar"
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido */}
          {lightboxTab === 'fotos' ? (
            <>
              {/* Imagen grande — ocupa todo el espacio disponible */}
              <div className="flex-1 relative min-h-0 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getUrl(images[current])}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-contain select-none"
                  draggable={false}
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      aria-label="Anterior"
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full w-11 h-11 flex items-center justify-center transition-colors z-10"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={next}
                      aria-label="Siguiente"
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full w-11 h-11 flex items-center justify-center transition-colors z-10"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Miniaturas en lightbox */}
              {images.length > 1 && (
                <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto justify-center">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrent(i)}
                      className={`shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                        i === current ? 'border-white opacity-100 scale-105' : 'border-transparent opacity-40 hover:opacity-70'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getUrl(img)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Mapa pantalla completa */
            <div className="flex-1 relative">
              <div className="absolute inset-4 rounded-xl overflow-hidden">
                {lat && lng && (
                  <ListingMap
                    lat={lat}
                    lng={lng}
                    title={title}
                    price={priceLabel}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

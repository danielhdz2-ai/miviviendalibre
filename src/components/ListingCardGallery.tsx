'use client'

import { useState } from 'react'

interface ImageItem {
  id: string
  storage_path?: string | null
  external_url?: string | null
}

interface Props {
  images: ImageItem[]
  title: string
  aspectClass?: string
  className?: string
}

export default function ListingCardGallery({
  images,
  title,
  aspectClass = 'aspect-[4/3]',
  className = '',
}: Props) {
  const [current, setCurrent] = useState(0)
  const [imgError, setImgError] = useState(false)

  if (images.length === 0) {
    return (
      <div className={`${aspectClass} ${className} bg-gray-100 flex items-center justify-center`}>
        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
        </svg>
      </div>
    )
  }

  function buildUrl(img: ImageItem) {
    if (img.storage_path) return img.storage_path
    if (img.external_url) return `/api/img-proxy?url=${encodeURIComponent(img.external_url)}`
    return ''
  }
  const imageUrl = buildUrl(images[current])

  const prev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgError(false)
    setCurrent(c => (c - 1 + images.length) % images.length)
  }

  const next = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgError(false)
    setCurrent(c => (c + 1) % images.length)
  }

  return (
    <div className={`relative ${aspectClass} ${className} bg-gray-100 overflow-hidden group`}>
      {imgError || !imageUrl ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
          </svg>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      )}

      {images.length > 1 && (
        <>
          {/* Flecha izquierda */}
          <button
            onClick={prev}
            aria-label="Imagen anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Flecha derecha */}
          <button
            onClick={next}
            aria-label="Imagen siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Contador */}
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md pointer-events-none">
            {current + 1} / {images.length}
          </span>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
            {images.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

import Link from 'next/link'
import type { Listing } from '@/types/listings'
import ListingCardGallery from './ListingCardGallery'

interface ListingCardListProps {
  listing: Listing
}

function formatPrice(price: number | null, operation: string): string {
  if (!price) return 'Consultar precio'
  const formatted = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
  return operation === 'rent' ? `${formatted}/mes` : formatted
}

export default function ListingCardList({ listing }: ListingCardListProps) {
  const isTurboActive = listing.turbo_until
    ? new Date(listing.turbo_until) > new Date()
    : false

  const images = listing.listing_images ?? []

  return (
    <Link href={`/pisos/${listing.id}`} className="group block">
      <article
        className={`bg-white rounded-xl overflow-hidden border flex transition-all duration-200 hover:shadow-md ${
          listing.is_bank
            ? 'border-blue-200 shadow-blue-50 shadow-sm'
            : isTurboActive
            ? 'border-amber-300 shadow-amber-50 shadow-sm'
            : 'border-gray-100 shadow-sm'
        }`}
      >
        {/* Imagen con flechas */}
        <div className="relative w-52 sm:w-64 md:w-72 shrink-0 min-h-[160px]">
          <ListingCardGallery images={images} title={listing.title} aspectClass="" className="absolute inset-0" />

          {/* Badge Turbo */}
          {listing.is_bank && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-yellow-300 z-20 pointer-events-none">
              🏦 Banco
            </span>
          )}
          {isTurboActive && !listing.is_bank && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-900 z-20 pointer-events-none">
              ⚡ Turbo
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {/* Badges y operación */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  listing.operation === 'rent'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {listing.operation === 'rent' ? 'Alquiler' : 'Venta'}
              </span>
              {listing.is_bank && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-yellow-300">
                  🏦 Oportunidad Bancaria
                </span>
              )}
              {listing.is_particular && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gold-100 text-gold-700">
                  Particular
                </span>
              )}
              {listing.origin === 'direct' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  Publicado aquí
                </span>
              )}
            </div>

            {/* Precio */}
            <p className="text-2xl font-extrabold text-gray-900">
              {formatPrice(listing.price_eur, listing.operation)}
            </p>

            {/* Título */}
            <h3 className="mt-1 text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
              {listing.title}
            </h3>

            {/* Localización */}
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {[listing.district, listing.city, listing.province].filter(Boolean).join(', ')}
            </p>
          </div>

          {/* Stats + descripción */}
          <div className="mt-3">
            {/* Características */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {listing.bedrooms != null && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="font-medium">{listing.bedrooms}</span>
                  <span className="text-gray-400 text-xs">hab.</span>
                </span>
              )}
              {listing.bathrooms != null && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16M4 12a8 8 0 0116 0M4 12V8a4 4 0 014-4h8a4 4 0 014 4v4" />
                  </svg>
                  <span className="font-medium">{listing.bathrooms}</span>
                  <span className="text-gray-400 text-xs">baño{listing.bathrooms !== 1 ? 's' : ''}</span>
                </span>
              )}
              {listing.area_m2 != null && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className="font-medium">{listing.area_m2}</span>
                  <span className="text-gray-400 text-xs">m²</span>
                </span>
              )}
            </div>

            {/* Descripción recortada */}
            {listing.description && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed hidden sm:block">
                {listing.description}
              </p>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

import Link from 'next/link'
import type { Listing } from '@/types/listings'
import ListingCardGallery from './ListingCardGallery'
import FavoriteButton from './FavoriteButton'
import { decodeHtml } from '@/lib/html'

interface ListingCardProps {
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

export default function ListingCard({ listing }: ListingCardProps) {
  const isTurboActive = listing.turbo_until
    ? new Date(listing.turbo_until) > new Date()
    : false

  const images = listing.listing_images ?? []

  return (
    <Link href={`/pisos/${listing.id}`} className="group block">
      <article className={`bg-white rounded-xl overflow-hidden border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${listing.is_bank ? 'border-blue-200 shadow-blue-50 shadow-md' : isTurboActive ? 'border-amber-300 shadow-amber-50 shadow-md' : 'border-gray-100 shadow-sm'}`}>
        {/* Galería con flechas */}
        <div className="relative">
          <ListingCardGallery images={images} title={listing.title} aspectClass="aspect-[4/3]" />

          {/* Badges superpuestos */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 pointer-events-none z-20">
            {listing.is_bank && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-yellow-300 flex items-center gap-1">
                🏦 Banco
              </span>
            )}
            {isTurboActive && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-900 flex items-center gap-1">
                ⚡ Turbo
              </span>
            )}
            {listing.is_particular && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-700 text-white flex items-center gap-1">
                💎 Propietario Directo
              </span>
            )}
            {listing.origin === 'direct' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">
                Publicado aquí
              </span>
            )}
          </div>

          {/* Operación */}
          <div className="absolute top-2 right-2 pointer-events-none z-20">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${listing.operation === 'rent' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
              {listing.operation === 'rent' ? 'Alquiler' : 'Venta'}
            </span>
          </div>

          {/* Favorito */}
          <FavoriteButton listingId={listing.id} />
        </div>

        {/* Contenido */}
        <div className="p-4">
          {/* Precio */}
          <p className="text-xl font-bold text-gray-900">
            {formatPrice(listing.price_eur, listing.operation)}
          </p>

          {/* Título */}
          <h3 className="mt-1 text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
            {decodeHtml(listing.title)}
          </h3>

          {/* Localización */}
          <p className="mt-1 text-xs text-gray-500">
            {[decodeHtml(listing.district), decodeHtml(listing.city), decodeHtml(listing.province)].filter(Boolean).join(', ')}
          </p>

          {/* Entidad bancaria */}
          {listing.is_bank && listing.bank_entity && (
            <p className="mt-1 text-xs font-medium text-blue-700 flex items-center gap-1">
              🏦 {listing.bank_entity}
            </p>
          )}

          {/* Características */}
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
            {listing.bedrooms != null && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {listing.bedrooms} hab.
              </span>
            )}
            {listing.bathrooms != null && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {listing.bathrooms} baño{listing.bathrooms !== 1 ? 's' : ''}
              </span>
            )}
            {listing.area_m2 != null && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {listing.area_m2} m²
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

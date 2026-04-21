'use client'

import Link from 'next/link'
import type { Listing } from '@/types/listings'
import { decodeHtml } from '@/lib/html'

interface Props {
  listings: Listing[]
  title?: string
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

function getImageUrl(listing: Listing): string | null {
  const img = listing.listing_images?.[0]
  if (!img) return null
  if (img.storage_path) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${img.storage_path}`
  }
  return img.external_url ?? null
}

export default function SimilarListingsCarousel({
  listings,
  title = 'Personas que buscan algo similar también han visto...',
}: Props) {
  if (!listings.length) return null

  return (
    <section className="py-8 border-t border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">{title}</h2>

      {/* Carrusel scroll-snap horizontal */}
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {listings.map(listing => {
          const imgUrl = getImageUrl(listing)
          const titleStr = decodeHtml(listing.title)
          const location = [decodeHtml(listing.district), decodeHtml(listing.city)].filter(Boolean).join(', ')

          return (
            <Link
              key={listing.id}
              href={`/pisos/${listing.id}`}
              className="snap-start shrink-0 w-[220px] sm:w-[240px] group"
            >
              <article className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col">
                {/* Imagen */}
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl}
                      alt={titleStr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏠</div>
                  )}
                  {/* Contador fotos */}
                  {(listing.listing_images?.length ?? 0) > 0 && (
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-md">
                      1/{listing.listing_images!.length}
                    </span>
                  )}
                  {/* Badge particular */}
                  {listing.is_particular && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-700 text-white">
                      💎 Propietario
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1 flex-1">
                  <p className="text-base font-bold text-gray-900">
                    {formatPrice(listing.price_eur, listing.operation)}
                  </p>
                  <p className="text-xs text-gray-700 line-clamp-2 leading-snug">{titleStr}</p>
                  {location && (
                    <p className="text-xs text-gray-400 mt-auto pt-1 truncate">📍 {location}</p>
                  )}
                  {(listing.bedrooms != null || listing.area_m2 != null) && (
                    <p className="text-xs text-gray-500 flex gap-2">
                      {listing.bedrooms != null && <span>{listing.bedrooms === 0 ? 'Estudio' : `${listing.bedrooms} hab.`}</span>}
                      {listing.area_m2 != null && <span>{listing.area_m2} m²</span>}
                    </p>
                  )}
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

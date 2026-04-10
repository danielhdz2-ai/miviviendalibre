'use server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Navbar from '@/components/NavbarServer'
import ContactForm from './ContactForm'
import { getListingById } from '@/lib/listings'
import type { Metadata } from 'next'

const ListingMap = dynamic(() => import('@/components/ListingMap'), { ssr: false })

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getListingById(id)
  if (!listing) return { title: 'Anuncio no encontrado' }
  return {
    title: `${listing.title} — Mi Vivienda Libre`,
    description: listing.description?.slice(0, 160) ?? undefined,
  }
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

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing) notFound()

  const isTurboActive = listing.turbo_until
    ? new Date(listing.turbo_until) > new Date()
    : false

  const images = listing.listing_images ?? []

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-5 flex items-center gap-1.5">
          <Link href="/pisos" className="hover:text-gray-700">Anuncios</Link>
          <span>/</span>
          {listing.city && (
            <>
              <Link
                href={`/pisos?ciudad=${listing.city.toLowerCase()}`}
                className="hover:text-gray-700"
              >
                {listing.city}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 font-medium line-clamp-1">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda: imágenes + descripción */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galería de imágenes */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              {images.length > 0 ? (
                <>
                  {/* Imagen principal */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images[0].storage_path ?? images[0].external_url ?? ''}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    {images.length > 1 && (
                      <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                        1 / {images.length} fotos
                      </span>
                    )}
                  </div>
                  {/* Grid de miniaturas */}
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-1 p-1">
                      {images.slice(1, 5).map((img, i) => (
                        <div key={img.id} className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.storage_path ?? img.external_url ?? ''}
                            alt={`Foto ${i + 2}`}
                            className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
                          />
                          {i === 3 && images.length > 5 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">+{images.length - 5}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
                  </svg>
                </div>
              )}

            </div>

            {/* Descripción */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">Descripción</h2>
              {listing.description ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                  {listing.description}
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic">Sin descripción</p>
              )}
            </div>

            {/* Características básicas */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Características básicas</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {listing.bedrooms != null && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">🛏️</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Habitaciones</dt>
                      <dd className="font-semibold text-gray-900">{listing.bedrooms === 0 ? 'Estudio' : listing.bedrooms}</dd>
                    </div>
                  </div>
                )}
                {listing.bathrooms != null && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">🚿</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Baños</dt>
                      <dd className="font-semibold text-gray-900">{listing.bathrooms}</dd>
                    </div>
                  </div>
                )}
                {listing.area_m2 != null && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">📐</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Superficie</dt>
                      <dd className="font-semibold text-gray-900">{listing.area_m2} m²</dd>
                    </div>
                  </div>
                )}
                {listing.area_m2 && listing.price_eur && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">💶</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Precio/m²</dt>
                      <dd className="font-semibold text-gray-900">
                        {Math.round(listing.price_eur / listing.area_m2).toLocaleString('es-ES')} €/m²
                      </dd>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">🔑</span>
                  <div>
                    <dt className="text-gray-500 text-xs">Operación</dt>
                    <dd className="font-semibold text-gray-900">{listing.operation === 'rent' ? 'Alquiler' : 'Venta'}</dd>
                  </div>
                </div>
                {listing.province && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">📍</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Provincia</dt>
                      <dd className="font-semibold text-gray-900">{listing.province}</dd>
                    </div>
                  </div>
                )}
                {listing.postal_code && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">📮</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Código postal</dt>
                      <dd className="font-semibold text-gray-900">{listing.postal_code}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            {/* Mapa */}
            {listing.lat && listing.lng && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-3">Ubicación aproximada</h2>
                <p className="text-xs text-gray-400 mb-3">
                  Se muestra una zona aproximada para proteger la privacidad del propietario.
                </p>
                <ListingMap
                  lat={listing.lat}
                  lng={listing.lng}
                  title={listing.title}
                  price={formatPrice(listing.price_eur, listing.operation)}
                />
                <p className="text-xs text-gray-400 mt-2">
                  📍 {[listing.district, listing.city, listing.province].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Columna derecha: precio + contacto */}
          <div className="space-y-4">
            {/* Tarjeta de precio */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm sticky top-20">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {isTurboActive && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    ⚡ Turbo activo
                  </span>
                )}
                {listing.is_particular && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fef0c0] text-[#a87a20]">
                    ✓ Particular verificado
                  </span>
                )}
                {listing.origin === 'direct' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    Publicado aquí
                  </span>
                )}
              </div>

              <p className="text-3xl font-extrabold text-gray-900">
                {formatPrice(listing.price_eur, listing.operation)}
              </p>
              <h1 className="mt-2 text-base font-semibold text-gray-800 leading-snug">
                {listing.title}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {[listing.district, listing.city, listing.province].filter(Boolean).join(', ')}
              </p>

              {/* Formulario de contacto */}
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Contactar con el propietario</h3>
                <ContactForm listingId={listing.id} />
              </div>

              {/* Fuente externa */}
              {listing.source_url && (
                <a
                  href={listing.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block text-center text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Ver anuncio original →
                </a>
              )}
            </div>

            {/* Análisis de precio */}
            {listing.price_eur && listing.area_m2 && (
              <div className="bg-[#fef9e8] rounded-xl p-5 border border-[#f4c94a]/40">
                <p className="text-xs font-bold text-[#a87a20] uppercase tracking-wider mb-3">📊 Análisis del precio</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio total</span>
                    <span className="font-semibold text-gray-900">
                      {listing.price_eur.toLocaleString('es-ES')} €{listing.operation === 'rent' ? '/mes' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio por m²</span>
                    <span className="font-semibold text-[#c9962a]">
                      {Math.round(listing.price_eur / listing.area_m2).toLocaleString('es-ES')} €/m²
                    </span>
                  </div>
                  {listing.operation === 'rent' && listing.area_m2 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coste anual</span>
                      <span className="font-semibold text-gray-900">
                        {(listing.price_eur * 12).toLocaleString('es-ES')} €
                      </span>
                    </div>
                  )}
                </div>
                {listing.is_particular && (
                  <p className="mt-3 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    ✓ Anuncio de particular — sin comisión de agencia
                  </p>
                )}
              </div>
            )}

            {/* CTA contratos */}
            <div className="bg-[#fef9e8] rounded-xl p-5 border border-[#f4c94a]/30">
              <p className="text-sm font-semibold text-[#42300a] mb-1">
                ¿Vas a cerrar el trato?
              </p>
              <p className="text-xs text-[#a87a20] mb-3">
                Genera tu contrato de alquiler o arras en minutos desde 7 €.
              </p>
              <Link
                href="/documentos"
                className="block text-center px-4 py-2 rounded-full bg-[#c9962a] text-white text-sm font-semibold hover:bg-[#a87a20] transition-colors"
              >
                Ver contratos →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

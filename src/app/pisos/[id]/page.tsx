'use server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/NavbarServer'
import ContactForm from './ContactForm'
import MapWrapper from './MapWrapper'
import ViewTracker from './ViewTracker'
import ListingGallery from '@/components/ListingGallery'
import DescriptionExpand from './DescriptionExpand'
import { getListingById } from '@/lib/listings'
import type { Metadata } from 'next'

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

async function geocodeCity(district: string | null, city: string | null, province: string | null): Promise<{ lat: number; lng: number } | null> {
  const parts = [district, city, province, 'España'].filter(Boolean)
  if (parts.length < 2) return null
  const q = encodeURIComponent(parts.join(', '))
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=es`,
      { headers: { 'User-Agent': 'miviviendalibre.com/1.0' }, next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data = await res.json() as Array<{ lat: string; lon: string }>
    if (!data[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing) notFound()

  const isTurboActive = listing.turbo_until
    ? new Date(listing.turbo_until) > new Date()
    : false

  const images = listing.listing_images ?? []

  // Coordenadas: usar las del listing si existen, si no geocodificar por ciudad/barrio
  let mapLat = listing.lat
  let mapLng = listing.lng
  let mapZoom = 15
  let mapCircleRadius = 200
  if (!mapLat || !mapLng) {
    const geocoded = await geocodeCity(listing.district, listing.city, listing.province)
    if (geocoded) {
      mapLat = geocoded.lat
      mapLng = geocoded.lng
      mapZoom = 13
      mapCircleRadius = 800
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <ViewTracker listingId={listing.id} />

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
            <ListingGallery
              images={images}
              title={listing.title}
              lat={listing.lat}
              lng={listing.lng}
              priceLabel={formatPrice(listing.price_eur, listing.operation)}
            />

            {/* Descripción */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">Descripción</h2>
              {listing.description ? (
                <DescriptionExpand text={listing.description} />
              ) : (
                <p className="text-gray-400 text-sm italic">Sin descripción</p>
              )}
            </div>

            {/* Características básicas */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Características</h2>
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
                      <dt className="text-gray-500 text-xs">Sup. construida</dt>
                      <dd className="font-semibold text-gray-900">{listing.area_m2} m²</dd>
                    </div>
                  </div>
                )}
                {listing.features?.area_util_m2 && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">📏</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Sup. útil</dt>
                      <dd className="font-semibold text-gray-900">{listing.features.area_util_m2} m²</dd>
                    </div>
                  </div>
                )}
                {listing.features?.planta && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">🏢</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Planta</dt>
                      <dd className="font-semibold text-gray-900">{listing.features.planta}</dd>
                    </div>
                  </div>
                )}
                {listing.features?.antiguedad && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">🏚️</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Antigüedad</dt>
                      <dd className="font-semibold text-gray-900">{listing.features.antiguedad}</dd>
                    </div>
                  </div>
                )}
                {listing.features?.referencia && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">🔖</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Referencia</dt>
                      <dd className="font-semibold text-gray-900">{listing.features.referencia}</dd>
                    </div>
                  </div>
                )}
                {listing.features?.orientacion && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">🧭</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Orientación</dt>
                      <dd className="font-semibold text-gray-900">{listing.features.orientacion}</dd>
                    </div>
                  </div>
                )}
                {listing.features?.cert_energetico && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">⚡</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Cert. energético</dt>
                      <dd className="font-semibold text-gray-900">{listing.features.cert_energetico}</dd>
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
                {listing.bank_entity && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">🏦</span>
                    <div>
                      <dt className="text-gray-500 text-xs">Entidad bancaria</dt>
                      <dd className="font-semibold text-blue-800">{listing.bank_entity}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            {/* Mapa */}
            {mapLat && mapLng && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-3">Ubicación aproximada</h2>
                <p className="text-xs text-gray-400 mb-3">
                  {listing.lat && listing.lng
                    ? 'Se muestra una zona aproximada para proteger la privacidad del propietario.'
                    : 'Ubicación orientativa basada en la ciudad/barrio indicados.'}
                </p>
                <MapWrapper
                  lat={mapLat}
                  lng={mapLng}
                  title={listing.title}
                  price={formatPrice(listing.price_eur, listing.operation)}
                  zoom={mapZoom}
                  circleRadius={mapCircleRadius}
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
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-700 text-white flex items-center gap-1">
                    💎 Propietario Directo
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
                  <p className="mt-3 text-xs text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2 font-medium">
                    💎 Propietario Directo — sin comisión de agencia
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

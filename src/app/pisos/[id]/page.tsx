'use server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/NavbarServer'
import ContactForm from './ContactForm'
import MapWrapper from './MapWrapper'
import ViewTracker from './ViewTracker'
import ListingGallery from '@/components/ListingGallery'
import DescriptionExpand from './DescriptionExpand'
import RevealContact from './RevealContact'
import { getListingById } from '@/lib/listings'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getListingById(id)
  if (!listing) return { title: 'Anuncio no encontrado' }
  return {
    title: `${listing.title} — Inmonest`,
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
      { headers: { 'User-Agent': 'inmonest.com/1.0' }, next: { revalidate: 86400 } }
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

  // Verificar si el usuario está autenticado
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <ViewTracker listingId={listing.id} />

      {/* ── Galería edge-to-edge (sin contenedor, sin márgenes) ── */}
      <ListingGallery
        images={images}
        title={listing.title}
        lat={listing.lat}
        lng={listing.lng}
        priceLabel={formatPrice(listing.price_eur, listing.operation)}
      />

      {/* ── Contenido principal ── */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
          <Link href="/pisos" className="hover:text-gray-600">Anuncios</Link>
          <span>/</span>
          {listing.city && (
            <>
              <Link href={`/pisos?ciudad=${listing.city.toLowerCase()}`} className="hover:text-gray-600">
                {listing.city}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-700 font-medium line-clamp-1">{listing.title}</span>
        </nav>

        <div className="flex gap-10 items-start">

          {/* ── Columna principal ── */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* Título + precio + badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {isTurboActive && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">⚡ Turbo activo</span>
                )}
                {listing.is_particular && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-700 text-white">💎 Propietario Directo</span>
                )}
                {listing.origin === 'direct' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Publicado aquí</span>
                )}
                {listing.is_bank && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800">🏦 {listing.bank_entity ?? 'Banco'}</span>
                )}
              </div>
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {formatPrice(listing.price_eur, listing.operation)}
              </p>
              {listing.area_m2 && listing.price_eur && (
                <p className="text-sm text-gray-400 mt-1">
                  {Math.round(listing.price_eur / listing.area_m2).toLocaleString('es-ES')} €/m²
                </p>
              )}
              <h1 className="mt-3 text-xl font-semibold text-gray-800 leading-snug">{listing.title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                📍 {[listing.district, listing.city, listing.province].filter(Boolean).join(', ')}
              </p>

              {/* Stats rápidas inline */}
              <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-gray-100 text-sm text-gray-700">
                {listing.bedrooms != null && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">🛏</span>
                    <span className="font-semibold">{listing.bedrooms === 0 ? 'Estudio' : listing.bedrooms}</span>
                    <span className="text-gray-400 text-xs">hab.</span>
                  </span>
                )}
                {listing.bathrooms != null && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">🚿</span>
                    <span className="font-semibold">{listing.bathrooms}</span>
                    <span className="text-gray-400 text-xs">baño{listing.bathrooms !== 1 ? 's' : ''}</span>
                  </span>
                )}
                {listing.area_m2 != null && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">📐</span>
                    <span className="font-semibold">{listing.area_m2}</span>
                    <span className="text-gray-400 text-xs">m²</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="text-base">🔑</span>
                  <span className="font-semibold">{listing.operation === 'rent' ? 'Alquiler' : 'Venta'}</span>
                </span>
              </div>
            </div>

            {/* Descripción */}
            {listing.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h2>
                <DescriptionExpand text={listing.description} />
              </div>
            )}

            {/* Características — sin bordes de caja, solo separador */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Características</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6 text-sm">
                {listing.bedrooms != null && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Habitaciones</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.bedrooms === 0 ? 'Estudio' : listing.bedrooms}</dd>
                  </div>
                )}
                {listing.bathrooms != null && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Baños</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.bathrooms}</dd>
                  </div>
                )}
                {listing.area_m2 != null && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sup. construida</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.area_m2} m²</dd>
                  </div>
                )}
                {listing.features?.area_util_m2 && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sup. útil</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.features.area_util_m2} m²</dd>
                  </div>
                )}
                {listing.features?.planta && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Planta</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.features.planta}</dd>
                  </div>
                )}
                {listing.features?.antiguedad && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Antigüedad</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.features.antiguedad}</dd>
                  </div>
                )}
                {listing.features?.orientacion && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Orientación</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.features.orientacion}</dd>
                  </div>
                )}
                {listing.features?.cert_energetico && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Cert. energético</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.features.cert_energetico}</dd>
                  </div>
                )}
                {listing.features?.referencia && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Referencia</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.features.referencia}</dd>
                  </div>
                )}
                {listing.area_m2 && listing.price_eur && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Precio/m²</dt>
                    <dd className="font-semibold text-[#c9962a] text-base">
                      {Math.round(listing.price_eur / listing.area_m2).toLocaleString('es-ES')} €/m²
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Operación</dt>
                  <dd className="font-semibold text-gray-900 text-base">{listing.operation === 'rent' ? 'Alquiler' : 'Venta'}</dd>
                </div>
                {listing.province && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Provincia</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.province}</dd>
                  </div>
                )}
                {listing.postal_code && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Código postal</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.postal_code}</dd>
                  </div>
                )}
              </dl>

              {/* Tags de extras */}
              {listing.features && Object.keys(listing.features).some(k =>
                ['ascensor', 'terraza', 'garaje', 'piscina', 'trastero', 'jardin', 'aire_acondicionado',
                 'armarios_empotrados', 'exterior', 'accesible', 'lujo', 'vistas_mar'].includes(k)
                && listing.features![k] === 'true'
              ) && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    ['ascensor', 'Ascensor'], ['terraza', 'Terraza'], ['garaje', 'Garaje'],
                    ['piscina', 'Piscina'], ['trastero', 'Trastero'], ['jardin', 'Jardín'],
                    ['aire_acondicionado', 'A/C'], ['armarios_empotrados', 'Armarios'],
                    ['exterior', 'Exterior'], ['accesible', 'Accesible'],
                    ['lujo', 'Lujo'], ['vistas_mar', 'Vistas al mar'],
                  ].filter(([k]) => listing.features?.[k] === 'true').map(([, label]) => (
                    <span key={label} className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Mapa — ancho completo, sin caja, solo el mapa */}
            {mapLat && mapLng && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Ubicación</h2>
                <p className="text-xs text-gray-400 mb-4">
                  {listing.lat && listing.lng
                    ? 'Zona aproximada para proteger la privacidad del propietario.'
                    : 'Ubicación orientativa basada en ciudad/barrio.'}
                </p>
                <div className="w-full rounded-2xl overflow-hidden" style={{ height: 340 }}>
                  <MapWrapper
                    lat={mapLat}
                    lng={mapLng}
                    title={listing.title}
                    price={formatPrice(listing.price_eur, listing.operation)}
                    zoom={mapZoom}
                    circleRadius={mapCircleRadius}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  📍 {[listing.district, listing.city, listing.province].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

          </div>

          {/* ── Sidebar flotante ── */}
          <div className="hidden lg:block w-80 xl:w-[340px] shrink-0 sticky top-20 self-start space-y-4">

            {/* Tarjeta de contacto */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-gray-100 overflow-hidden">
              <div className="p-6 pb-4 border-b border-gray-50">
                <p className="text-2xl font-extrabold text-gray-900">
                  {formatPrice(listing.price_eur, listing.operation)}
                </p>
                {listing.area_m2 && listing.price_eur && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Math.round(listing.price_eur / listing.area_m2).toLocaleString('es-ES')} €/m²
                  </p>
                )}
              </div>

              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm">Contacta con el anunciante</h3>
                <ContactForm listingId={listing.id} />

                <RevealContact
                  listingId={listing.id}
                  isParticular={listing.is_particular}
                  isLoggedIn={!!user}
                />

                {user && (listing.external_link || listing.source_url) && (
                  <a
                    href={(listing.external_link ?? listing.source_url)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Ver anuncio original ↗
                  </a>
                )}
              </div>
            </div>

            {/* Análisis de precio */}
            {listing.price_eur && listing.area_m2 && (
              <div className="bg-[#fef9e8] rounded-2xl p-5 border border-[#f4c94a]/30">
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
                  {listing.operation === 'rent' && (
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
                    💎 Sin comisión de agencia
                  </p>
                )}
              </div>
            )}

            {/* CTA contratos */}
            <div className="bg-[#fef9e8] rounded-2xl p-5 border border-[#f4c94a]/30">
              <p className="text-sm font-semibold text-[#42300a] mb-1">¿Vas a cerrar el trato?</p>
              <p className="text-xs text-[#a87a20] mb-3">Genera tu contrato de alquiler o arras en minutos desde 7 €.</p>
              <Link
                href="/gestoria"
                className="block text-center px-4 py-2 rounded-full bg-[#c9962a] text-white text-sm font-semibold hover:bg-[#a87a20] transition-colors"
              >
                Ver contratos →
              </Link>
            </div>

          </div>
        </div>

        {/* ── Sidebar mobile: debajo del contenido ── */}
        <div className="lg:hidden mt-10 space-y-4">
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-gray-100 overflow-hidden">
            <div className="p-6 pb-4 border-b border-gray-50">
              <p className="text-2xl font-extrabold text-gray-900">
                {formatPrice(listing.price_eur, listing.operation)}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Contacta con el anunciante</h3>
              <ContactForm listingId={listing.id} />
              <RevealContact
                listingId={listing.id}
                isParticular={listing.is_particular}
                isLoggedIn={!!user}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

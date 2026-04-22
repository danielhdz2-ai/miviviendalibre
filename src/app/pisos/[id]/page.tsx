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
import SimilarListingsCarousel from '@/components/SimilarListingsCarousel'
import MortgageCalculator from '@/components/MortgageCalculator'
import { getListingById, getSimilarListings } from '@/lib/listings'
import { createClient } from '@/lib/supabase/server'
import { decodeHtml } from '@/lib/html'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getListingById(id)
  if (!listing) return { title: 'Anuncio no encontrado' }
  return {
    title: `${decodeHtml(listing.title)} — Inmonest`,
    description: decodeHtml(listing.description)?.slice(0, 160) ?? undefined,
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

// Coordenadas aproximadas de ciudades españolas (fallback cuando Nominatim falla)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'madrid':       { lat: 40.4168, lng: -3.7038 },
  'barcelona':    { lat: 41.3851, lng: 2.1734  },
  'valencia':     { lat: 39.4699, lng: -0.3763 },
  'sevilla':      { lat: 37.3891, lng: -5.9845 },
  'zaragoza':     { lat: 41.6488, lng: -0.8891 },
  'málaga':       { lat: 36.7213, lng: -4.4214 },
  'malaga':       { lat: 36.7213, lng: -4.4214 },
  'bilbao':       { lat: 43.2630, lng: -2.9350 },
  'granada':      { lat: 37.1773, lng: -3.5986 },
  'murcia':       { lat: 37.9922, lng: -1.1307 },
  'alicante':     { lat: 38.3452, lng: -0.4815 },
  'valladolid':   { lat: 41.6523, lng: -4.7245 },
  'pamplona':     { lat: 42.8169, lng: -1.6432 },
  'santander':    { lat: 43.4623, lng: -3.8099 },
  'córdoba':      { lat: 37.8882, lng: -4.7794 },
  'cordoba':      { lat: 37.8882, lng: -4.7794 },
  'palma':        { lat: 39.5696, lng: 2.6502  },
  'las palmas':   { lat: 28.1235, lng: -15.4366},
  'santa cruz de tenerife': { lat: 28.4636, lng: -16.2518 },
  'vitoria':      { lat: 42.8467, lng: -2.6726 },
  'oviedo':       { lat: 43.3614, lng: -5.8593 },
  'donostia':     { lat: 43.3128, lng: -1.9754 },
  'san sebastián':{ lat: 43.3128, lng: -1.9754 },
  'logroño':      { lat: 42.4628, lng: -2.4449 },
  'badajoz':      { lat: 38.8794, lng: -6.9706 },
  'huelva':       { lat: 37.2614, lng: -6.9447 },
  'burgos':       { lat: 42.3440, lng: -3.6969 },
  'salamanca':    { lat: 40.9701, lng: -5.6635 },
  'albacete':     { lat: 38.9942, lng: -1.8564 },
  'girona':       { lat: 41.9794, lng: 2.8214  },
  'lleida':       { lat: 41.6176, lng: 0.6200  },
  'tarragona':    { lat: 41.1189, lng: 1.2445  },
  'sabadell':     { lat: 41.5433, lng: 2.1094  },
  'terrassa':     { lat: 41.5632, lng: 2.0089  },
  'hospitalet de llobregat': { lat: 41.3599, lng: 2.0994 },
  'badalona':     { lat: 41.4499, lng: 2.2474  },
  'sant feliu de llobregat': { lat: 41.3803, lng: 2.0447 },
  'sant boi de llobregat': { lat: 41.3427, lng: 2.0353 },
  'granollers':   { lat: 41.6083, lng: 2.2872  },
  'mataró':       { lat: 41.5394, lng: 2.4462  },
  'getafe':       { lat: 40.3089, lng: -3.7325 },
  'alcalá de henares': { lat: 40.4818, lng: -3.3636 },
  'leganés':      { lat: 40.3289, lng: -3.7641 },
  'móstoles':     { lat: 40.3227, lng: -3.8644 },
  'fuenlabrada':  { lat: 40.2842, lng: -3.7950 },
  'torrejón de ardoz': { lat: 40.4594, lng: -3.4791 },
  'alcorcón':     { lat: 40.3489, lng: -3.8246 },
}

function cityCoordFallback(city: string | null, province: string | null): { lat: number; lng: number } | null {
  const search = [city, province].filter(Boolean).map(s => s!.toLowerCase().trim())
  for (const key of search) {
    if (CITY_COORDS[key]) return CITY_COORDS[key]
    // coincidencia parcial
    const match = Object.keys(CITY_COORDS).find(k => key.includes(k) || k.includes(key))
    if (match) return CITY_COORDS[match]
  }
  return null
}

async function geocodeCity(district: string | null, city: string | null, province: string | null): Promise<{ lat: number; lng: number } | null> {
  const parts = [district, city, province, 'España'].filter(Boolean)
  if (parts.length < 2) return cityCoordFallback(city, province)
  const q = encodeURIComponent(parts.join(', '))
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=es`,
      { headers: { 'User-Agent': 'inmonest.com/1.0' }, next: { revalidate: 86400 } }
    )
    if (!res.ok) return cityCoordFallback(city, province)
    const data = await res.json() as Array<{ lat: string; lon: string }>
    if (!data[0]) return cityCoordFallback(city, province)
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return cityCoordFallback(city, province)
  }
}

export default async function ListingDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = searchParams ? await searchParams : {}
  const justPublished = sp.publicado === '1'
  const listing = await getListingById(id)

  if (!listing) notFound()

  // Decode HTML entities in all text fields from scrapers
  const title    = decodeHtml(listing.title)
  const city     = decodeHtml(listing.city)
  const district = decodeHtml(listing.district)
  const province = decodeHtml(listing.province)

  // Verificar si el usuario está autenticado
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isTurboActive = listing.turbo_until
    ? new Date(listing.turbo_until) > new Date()
    : false

  // Pisos similares para el carrusel (misma ciudad, operación, precio ±20%)
  const similarListings = await getSimilarListings(
    listing.id,
    listing.city,
    listing.operation,
    listing.price_eur,
  )

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

      {/* Banner publicación exitosa */}
      {justPublished && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">¡Anuncio publicado con éxito!</p>
              <p className="text-amber-700 text-xs">Tu anuncio ya es visible para todos los interesados. Compártelo para llegar a más personas.</p>
            </div>
          </div>
        </div>
      )}

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
          {listing.is_particular && (
            <>
              <Link href="/pisos?solo_particulares=1" className="hover:text-gray-600">Particulares</Link>
              <span>/</span>
            </>
          )}
          {listing.city && (
            <>
              <Link href={`/pisos?ciudad=${listing.city.toLowerCase()}`} className="hover:text-gray-600">
                {city}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-700 font-medium line-clamp-1">{title}</span>
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
              <h1 className="mt-3 text-xl font-semibold text-gray-800 leading-snug">{title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                📍 {[district, city, province].filter(Boolean).join(', ')}
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
                <DescriptionExpand text={decodeHtml(listing.description)} />
              </div>
            )}

            {/* Descripción IA */}
            {listing.ai_description && (
              <div className="bg-[#fef9e8] rounded-2xl p-5 border border-[#f4c94a]/30">
                <p className="text-xs font-bold text-[#a87a20] uppercase tracking-wider mb-3">✨ Análisis del anuncio</p>
                <DescriptionExpand text={listing.ai_description} />
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
                    <dd className="font-semibold text-gray-900 text-base">{province}</dd>
                  </div>
                )}
                {listing.postal_code && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">Código postal</dt>
                    <dd className="font-semibold text-gray-900 text-base">{listing.postal_code}</dd>
                  </div>
                )}
              </dl>

              {/* Fecha de publicación */}
              {(listing.published_at || listing.created_at) && (
                <p className="mt-6 text-xs text-gray-400">
                  Publicado el{' '}
                  {new Date(listing.published_at ?? listing.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}

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
                  title={title}
                    price={formatPrice(listing.price_eur, listing.operation)}
                    zoom={mapZoom}
                    circleRadius={mapCircleRadius}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  📍 {[district, city, province].filter(Boolean).join(', ')}
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
                <ContactForm
                  listingId={listing.id}
                  initialName={user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? undefined}
                  initialEmail={user?.email ?? undefined}
                />

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

            {/* Calculadora hipotecaria — solo venta */}
            {listing.operation === 'sale' && (
              <MortgageCalculator precioVivienda={listing.price_eur ?? undefined} />
            )}

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
              <ContactForm
                listingId={listing.id}
                initialName={user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? undefined}
                initialEmail={user?.email ?? undefined}
              />
              <RevealContact
                listingId={listing.id}
                isParticular={listing.is_particular}
                isLoggedIn={!!user}
              />
            </div>
          </div>

          {/* Calculadora hipotecaria mobile — solo venta */}
          {listing.operation === 'sale' && (
            <MortgageCalculator precioVivienda={listing.price_eur ?? undefined} />
          )}
        </div>

        {/* ── Carrusel de pisos similares ── */}
        {similarListings.length > 0 && (
          <div className="mt-10">
            <SimilarListingsCarousel listings={similarListings} />
          </div>
        )}

      </div>
    </div>
  )
}

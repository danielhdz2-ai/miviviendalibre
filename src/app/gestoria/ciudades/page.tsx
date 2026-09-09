import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import PageHeroImage from '@/components/PageHeroImage'
import Footer from '@/components/Footer'
import SellosConfianza from '@/components/SellosConfianza'
import GestoriaUrlsIndexacion from '@/components/GestoriaUrlsIndexacion'
import {
  CIUDADES_DESTACADAS,
  CIUDADES_SEO,
  LANDINGS_GENERICAS,
  LANDINGS_POR_CIUDAD,
  SERVICIOS_GUIA,
  contarLandingsPorCiudad,
  filterCiudadesLandingActiva,
  getLandingPrecioDisplay,
  getNombreCiudad,
  getServicioGuiaHref,
} from '@/lib/gestoria-ciudades-inventario'

export const metadata: Metadata = {
  title: 'Gestoría inmobiliaria por ciudad',
  description: 'Servicios de gestoría inmobiliaria en las principales ciudades de España: Madrid, Barcelona, Valencia, Sevilla y más. Contratos, trámites y asesoría legal online.',
  keywords: 'gestoría inmobiliaria madrid, gestoría inmobiliaria barcelona, contrato arras ciudad, contrato alquiler ciudad, servicios gestoría españa',
  openGraph: {
    title: 'Gestoría inmobiliaria por ciudad',
    description: 'Servicios de gestoría inmobiliaria en las principales ciudades de España. Contratos, trámites y asesoría legal online.',
    type: 'website',
  },
}

const totalPorCiudad = contarLandingsPorCiudad()

export default function CiudadesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <section className="bg-gradient-to-r from-[#2b4c7e] to-[#1e3a5f] text-white py-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Gestoría Inmobiliaria en <span className="text-gold-500">Toda España</span>
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-6">
              Servicios profesionales de gestoría inmobiliaria online en las principales ciudades de España.
              Contratos, trámites y asesoría legal desde 61€.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {CIUDADES_DESTACADAS.map((ciudad) => (
                <span
                  key={ciudad.slug}
                  className="px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm font-medium"
                >
                  {ciudad.nombre}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 py-10">
          <PageHeroImage
            src="/inmonestexterior.png"
            alt="Gestoría inmobiliaria por ciudad en España"
            className="mb-0"
          />
        </div>

        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Guías y Servicios por Ciudad</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Selecciona el servicio que necesitas y encuentra información específica para tu ciudad
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICIOS_GUIA.map((servicio) => (
                <div
                  key={servicio.slug}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative h-40 w-full bg-gray-100">
                    <Image
                      src={servicio.imagen}
                      alt={servicio.titulo}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gold-700 border border-gold-500/20">
                      {servicio.categoria}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{servicio.titulo}</h3>
                    <p className="text-gray-600 text-sm mb-4 flex-1">{servicio.descripcion}</p>

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Disponible en toda España
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {CIUDADES_DESTACADAS.slice(0, 4).map((ciudad) => (
                        <span
                          key={ciudad.slug}
                          className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700"
                        >
                          {ciudad.nombre}
                        </span>
                      ))}
                      <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                        +40 ciudades
                      </span>
                    </div>

                    <Link
                      href={getServicioGuiaHref(servicio.slug)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-[#a68939] text-white rounded-lg font-semibold transition-colors shadow-md"
                    >
                      Ver servicio completo
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-bold text-gold-500 uppercase tracking-widest mb-2">
                  Inventario SEO
                </p>
                <h2 className="text-3xl font-bold text-gray-900">Landing Pages por Ciudad</h2>
                <p className="text-gray-600 mt-2 max-w-2xl">
                  Todas las páginas locales activas: contratos inmobiliarios, arras, alquiler LAU, alquiler de
                  habitación, local comercial, due diligence, hubs de gestoría, venta completa y portal
                  inmobiliario por ciudad.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-cream-100 text-gold-800 text-sm font-semibold border border-gold-200">
                  {totalPorCiudad} páginas activas
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-50 text-blue-800 text-sm font-semibold border border-blue-200">
                  {LANDINGS_POR_CIUDAD.length} tipos de servicio
                </span>
              </div>
            </div>

            <div className="space-y-8">
              {LANDINGS_POR_CIUDAD.map((servicio) => (
                <div
                  key={servicio.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 sm:p-8"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <h3 className="text-lg font-bold text-gray-900">{servicio.nombre}</h3>
                    {getLandingPrecioDisplay(servicio) && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gold-500/15 text-[#8a6420] border border-gold-500/25">
                        {getLandingPrecioDisplay(servicio)}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {servicio.ciudades.length} ciudad{servicio.ciudades.length !== 1 ? 'es' : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {filterCiudadesLandingActiva(servicio.id, servicio.ciudades).map((slug) => (
                      <Link
                        key={slug}
                        href={servicio.href(slug)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gold-200 text-sm font-medium text-gold-800 hover:bg-cream-100 hover:border-gold-300 transition-colors shadow-sm"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cream-1000 shrink-0" />
                        {getNombreCiudad(slug)}
                        <span className="text-gold-600 text-xs">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h3 className="text-xl font-bold text-gray-900">Landing Pages Genéricas</h3>
                <span className="text-sm font-semibold text-gray-500">
                  {LANDINGS_GENERICAS.length} páginas sin variante local
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {LANDINGS_GENERICAS.map((page) => (
                  <Link
                    key={page.slug}
                    href={page.href ?? `/gestoria/${page.slug}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-gold-500 hover:bg-cream-100 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate group-hover:text-[#8a6420]">
                        {page.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {page.href ?? `/gestoria/${page.slug}`}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gold-500 shrink-0">{getLandingPrecioDisplay(page)}</span>
                  </Link>
                ))}
              </div>
            </div>

            <GestoriaUrlsIndexacion />
          </div>
        </section>

        <section className="py-16 px-6 bg-gradient-to-r from-[#2b4c7e] to-[#1e3a5f]">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">¿No encuentras tu ciudad?</h2>
            <p className="text-xl text-white/90 mb-8">
              Nuestros servicios de gestoría inmobiliaria online están disponibles en toda España.
              Contáctanos y te ayudamos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+34745022862"
                className="px-8 py-4 bg-white text-[#2b4c7e] rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Llamar: 745 022 862
              </a>
              <a
                href="https://wa.me/34745022862?text=Hola,%20necesito%20información%20sobre%20servicios%20de%20gestoría"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#25d366] text-white rounded-lg font-bold text-lg hover:bg-[#20ba5a] transition-colors shadow-lg"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Gestoría Inmobiliaria Online en Toda España
            </h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              En <strong>Inmonest</strong> ofrecemos servicios de gestoría inmobiliaria online para todas las
              ciudades de España. Ya sea que estés en Madrid, Barcelona, Valencia, Sevilla o cualquier otra
              ciudad, puedes contar con nuestros servicios profesionales de redacción de contratos, asesoría
              legal y acompañamiento en operaciones inmobiliarias.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir una gestoría inmobiliaria online?
            </h3>

            <ul className="space-y-3 text-gray-700 mb-6 list-none pl-0">
              {[
                ['Ahorro de tiempo', 'Sin desplazamientos, todo online desde tu casa'],
                ['Precios transparentes', 'Desde 61€, sin sorpresas'],
                ['Profesionales especializados', 'Expertos en derecho inmobiliario'],
                ['Servicio rápido', 'Contratos listos en 24-48 horas'],
                ['Disponible en toda España', 'No importa dónde estés'],
              ].map(([titulo, desc]) => (
                <li key={titulo} className="flex items-start gap-3">
                  <span className="mt-1 w-5 h-5 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center text-xs font-bold shrink-0">
                    ✓
                  </span>
                  <span>
                    <strong>{titulo}:</strong> {desc}
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">Servicios más demandados por ciudad</h3>

            <p className="text-gray-700 leading-relaxed mb-4">
              Cada ciudad tiene sus particularidades en el mercado inmobiliario. Por eso ofrecemos información
              específica y servicios adaptados a la legislación autonómica de cada comunidad:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 not-prose">
              {CIUDADES_SEO.map((ciudad) => (
                <div
                  key={ciudad.slug}
                  className="bg-white p-5 rounded-lg shadow-sm border border-gray-200"
                >
                  <h4 className="font-bold text-gray-900 mb-2">{ciudad.nombre}</h4>
                  <p className="text-sm text-gray-600">{ciudad.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SellosConfianza />
      <Footer />
    </>
  )
}

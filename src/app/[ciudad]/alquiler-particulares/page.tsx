import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/NavbarServer'
import ListingCard from '@/components/ListingCard'
import LeadCaptureForm from '@/components/LeadCaptureForm'
import { searchListings } from '@/lib/listings'

const BASE_URL = 'https://inmonest.com'

const CIUDADES: Record<string, string> = {
  madrid:    'Madrid',
  barcelona: 'Barcelona',
  valencia:  'Valencia',
  sevilla:   'Sevilla',
  malaga:    'Málaga',
  bilbao:    'Bilbao',
  zaragoza:  'Zaragoza',
  alicante:  'Alicante',
}

// ─── Datos SEO específicos por ciudad ────────────────────────────────────────
const DATOS: Record<string, {
  precio_medio: string
  barrios: string[]
  descripcion_seo: string
  faq: Array<{ q: string; a: string }>
}> = {
  madrid: {
    precio_medio: '1.300 – 1.800 €/mes',
    barrios: ['Lavapiés', 'Chamberí', 'Vallecas', 'Carabanchel', 'Tetuan', 'Ciudad Lineal'],
    descripcion_seo: 'Madrid concentra la mayor oferta de alquiler de particulares de España. Desde estudios en el centro hasta pisos familiares en los barrios del sur, Inmonest te conecta directamente con el propietario sin comisión de agencia. Ahorra entre 500 € y 1.500 € en honorarios de intermediación.',
    faq: [
      { q: '¿Cuánto cuesta alquilar un piso de particular en Madrid?', a: 'El precio medio de un piso de alquiler de particular en Madrid se sitúa entre 1.300 € y 1.800 €/mes según el distrito. Los barrios del sur (Vallecas, Carabanchel) ofrecen opciones desde 900 €/mes.' },
      { q: '¿Es necesario un contrato de alquiler aunque sea entre particulares?', a: 'Sí, es imprescindible. Un contrato LAU protege tanto al arrendador como al arrendatario. En Inmonest puedes generar tu contrato de alquiler homologado por solo 90 €.' },
      { q: '¿Cómo verifico que el anuncio es de un particular y no de una agencia?', a: 'En Inmonest filtramos y clasificamos los anuncios con IA. Los marcados con el símbolo "Particular verificado" han superado nuestro proceso de validación.' },
    ],
  },
  barcelona: {
    precio_medio: '1.400 – 2.000 €/mes',
    barrios: ['Eixample', 'Gràcia', 'Sants', 'Horta', 'Nou Barris', 'Sant Andreu'],
    descripcion_seo: 'Barcelona es una de las ciudades con mayor presión de alquiler de Europa. Encontrar piso de particular en Barcelona puede ahorrarte hasta 2 mensualidades de comisión de agencia. Inmonest te pone en contacto directo con propietarios verificados en todos los barrios.',
    faq: [
      { q: '¿Cuánto cuesta alquilar de particular en Barcelona?', a: 'Los alquileres de particulares en Barcelona van de 1.200 € en periferias como Nou Barris hasta 2.000 € en Eixample o Gràcia. La zona tensionada limita las subidas para grandes tenedores pero no afecta a pequeños propietarios.' },
      { q: '¿Necesito aval bancario para alquilar de particular en Barcelona?', a: 'Depende del propietario. Muchos particulares aceptan garantías alternativas como el seguro de impago de alquiler, que suele ser más accesible.' },
      { q: '¿Cómo evito fraudes en anuncios de alquiler en Barcelona?', a: 'Nunca pagues nada sin ver el piso en persona. Verifica que quien te enseña el piso sea el titular registrado o tenga poder notarial. Todos los anuncios de Inmonest incluyen validación anti-fraude.' },
    ],
  },
  valencia: {
    precio_medio: '800 – 1.200 €/mes',
    barrios: ['Ruzafa', 'Benimaclet', 'Patraix', 'Quatre Carreres', 'Campanar', 'Orriols'],
    descripcion_seo: 'Valencia es la ciudad con mayor crecimiento de precios de alquiler de España, impulsado por la llegada de nómadas digitales y estudiantes internacionales. Alquilar de particular en Valencia te garantiza precios más justos y trato directo sin intermediarios.',
    faq: [
      { q: '¿Por qué han subido tanto los alquileres en Valencia?', a: 'El crecimiento de más del 15 % anual en Valencia se debe al fuerte incremento de demanda (nómadas digitales, estudiantes, trabajadores del sector tecnológico) con una oferta de vivienda que no ha podido crecer al mismo ritmo.' },
      { q: '¿Cuánto se paga de alquiler de particular en Valencia?', a: 'Un piso de 2 habitaciones en Valencia cuesta entre 800 € y 1.100 €/mes de media. Los barrios más demandados como Ruzafa o Benimaclet son algo más caros.' },
      { q: '¿Qué documentos necesito para alquilar en Valencia?', a: 'Normalmente: DNI o NIE, tres últimas nóminas o declaración de renta, y en ocasiones un aval o fianza adicional. Los particulares suelen ser más flexibles que las agencias.' },
    ],
  },
  sevilla: {
    precio_medio: '700 – 1.100 €/mes',
    barrios: ['Triana', 'Nervión', 'Los Remedios', 'Macarena', 'Bellavista', 'San Pablo'],
    descripcion_seo: 'Sevilla ofrece una excelente relación calidad-precio en el alquiler de particulares. Con precios muy por debajo de Madrid o Barcelona, alquilar directamente de propietario en Sevilla supone el mayor ahorro proporcional en comisiones de toda España.',
    faq: [
      { q: '¿Cuánto cuesta alquilar un piso de particular en Sevilla?', a: 'El alquiler medio de particular en Sevilla está entre 700 € y 950 €/mes para un piso de dos habitaciones. El barrio de Triana y el Centro están algo por encima de la media.' },
      { q: '¿Qué ventajas tiene alquilar de particular en Sevilla?', a: 'Principalmente el ahorro en comisiones (que pueden superar el mes de renta), mayor flexibilidad en las condiciones y trato personal directo con el propietario.' },
      { q: '¿Cómo puedo publicar mi piso en alquiler en Sevilla como particular?', a: 'En Inmonest puedes publicar tu anuncio de alquiler en Sevilla completamente gratis. Tu piso aparecerá visible a miles de inquilinos potenciales sin ningún coste.' },
    ],
  },
  malaga: {
    precio_medio: '1.000 – 1.600 €/mes',
    barrios: ['Centro Histórico', 'Teatinos', 'El Palo', 'Churriana', 'Pedregalejo', 'Cruz de Humilladero'],
    descripcion_seo: 'Málaga lidera el crecimiento de precios inmobiliarios en España. Alquilar de particular en Málaga sin agencia es especialmente valioso aquí, donde las comisiones pueden superar los 2.000 €. Inmonest te conecta con propietarios reales que alquilan sin intermediarios.',
    faq: [
      { q: '¿Por qué son tan caros los alquileres en Málaga?', a: 'Málaga atrae trabajadores remotos europeos, expats tecnológicos y estudiantes internacionales. La oferta de vivienda no ha crecido al ritmo de esta demanda, disparando los precios un 18 % en 2024.' },
      { q: '¿Dónde encontrar alquiler más barato en Málaga?', a: 'Barrios como Cruz de Humilladero, Churriana o las zonas alejadas del centro ofrecen alquileres desde 750 €/mes, manteniendo buena conexión con el centro por metro y autobús.' },
      { q: '¿Puedo alquilar en Málaga siendo autónomo?', a: 'Sí. Los propietarios particulares son más flexibles que las agencias y suelen aceptar la declaración de IRPF como justificante de ingresos para autónomos.' },
    ],
  },
  bilbao: {
    precio_medio: '900 – 1.400 €/mes',
    barrios: ['Abando', 'Deusto', 'Indautxu', 'Begoña', 'Rekalde', 'Basurto'],
    descripcion_seo: 'Bilbao tiene un mercado de alquiler sólido y estable. Alquilar de particular en Bilbao ofrece seguridad jurídica y ahorro en comisiones en una ciudad con alta demanda y bajo índice de vivienda vacía.',
    faq: [
      { q: '¿Cuánto cuesta alquilar de particular en Bilbao?', a: 'Un piso de dos habitaciones en Bilbao de particular cuesta entre 900 € y 1.200 €/mes según el barrio. Los más céntricos como Abando o Indautxu son los más demandados y caros.' },
      { q: '¿Qué es el depósito de garantía en el alquiler en el País Vasco?', a: 'En Euskadi la fianza legal es de una mensualidad para vivienda habitual. Debe depositarse en el organismo autonómico correspondiente (ASAP). El contrato de alquiler debe recoger este extremo.' },
      { q: '¿Cómo es el mercado de alquiler de habitaciones en Bilbao?', a: 'Existe una demanda creciente de habitaciones en Bilbao, especialmente cerca de las universidades (Deusto, UPV). Los precios van de 350 € a 600 €/mes por habitación.' },
    ],
  },
  zaragoza: {
    precio_medio: '600 – 950 €/mes',
    barrios: ['Centro', 'Delicias', 'Universidad', 'Oliver', 'Las Fuentes', 'Casablanca'],
    descripcion_seo: 'Zaragoza es la capital española con mejor relación calidad-precio en alquiler de particulares. Con precios muy asequibles y buena calidad de vida, alquilar directamente de propietario en Zaragoza ahorra costes significativos sin renunciar a nada.',
    faq: [
      { q: '¿Cuánto cuesta alquilar de particular en Zaragoza?', a: 'Zaragoza ofrece los alquileres más asequibles de las grandes capitales: entre 550 € y 800 €/mes para un piso de dos habitaciones. Es la capital española con mayor relación calidad-precio.' },
      { q: '¿Es buena ciudad Zaragoza para alquilar a largo plazo?', a: 'Sí. Zaragoza combina buena calidad de vida, excelente conectividad por AVE, y un mercado de alquiler estable con precios moderados. Muy elegida por familias jóvenes y trabajadores del sector logístico.' },
      { q: '¿Hay muchos pisos de particulares disponibles en Zaragoza?', a: 'Sí, Zaragoza tiene una oferta amplia de pisos de alquiler de particulares. La rotación es menor que en otras ciudades, lo que indica inquilinos satisfechos y propietarios que mantienen buenos precios.' },
    ],
  },
  alicante: {
    precio_medio: '700 – 1.100 €/mes',
    barrios: ['Centro', 'Playa de San Juan', 'Benalúa', 'Carolinas', 'Vistahermosa', 'San Blas'],
    descripcion_seo: 'Alicante atrae tanto a residentes nacionales como a extranjeros del norte de Europa. Alquilar de particular en Alicante ofrece acceso a pisos con vistas al mar, cerca de la playa y a precios muy competitivos comparados con otras ciudades costeras.',
    faq: [
      { q: '¿Cuánto cuesta alquilar de particular en Alicante?', a: 'Los alquileres de particulares en Alicante van desde 650 €/mes en barrios del interior hasta 1.100 € en zonas de costa como Playa de San Juan. El precio medio es de unos 850 €/mes.' },
      { q: '¿Puedo alquilar en Alicante siendo extranjero?', a: 'Sí, pero necesitas NIE o pasaporte. Los propietarios particulares en Alicante están habituados a alquilar a extranjeros residentes. El contrato puede redactarse en español e inglés.' },
      { q: '¿Qué tipo de pisos de alquiler hay en Alicante?', a: 'Alicante tiene oferta variada: pisos modernos en el centro, apartamentos cerca de la playa, casas adosadas en urbanizaciones y áticos con terraza. Los particulares suelen ofrecer mejor precio que las agencias inmobiliarias.' },
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(CIUDADES).map((ciudad) => ({ ciudad }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ciudad: string }>
}): Promise<Metadata> {
  const { ciudad } = await params
  const nombre = CIUDADES[ciudad]
  if (!nombre) return {}
  const datos = DATOS[ciudad]
  return {
    title: `Pisos de Alquiler de Particulares en ${nombre} | Sin Comisión — Inmonest`,
    description: `Encuentra tu próximo hogar en ${nombre} sin pagar comisión de agencia. Alquiler directo de particulares verificados. Precio medio: ${datos?.precio_medio ?? 'consultar'}.`,
    keywords: `alquiler particulares ${nombre.toLowerCase()}, pisos alquiler sin agencia ${nombre.toLowerCase()}, alquiler directo propietario ${nombre.toLowerCase()}, piso alquiler ${nombre.toLowerCase()} sin comision, habitaciones alquiler ${nombre.toLowerCase()}`,
    alternates: { canonical: `/${ciudad}/alquiler-particulares` },
    openGraph: {
      title: `Alquiler de Particulares en ${nombre} — Sin Comisión`,
      description: `Pisos de alquiler en ${nombre} directamente de sus propietarios. Sin intermediarios. Trato directo y contratos legales.`,
      url: `${BASE_URL}/${ciudad}/alquiler-particulares`,
      locale: 'es_ES',
      type: 'article',
      siteName: 'Inmonest',
    },
  }
}

export default async function AlquilerParticularesPage({
  params,
}: {
  params: Promise<{ ciudad: string }>
}) {
  const { ciudad } = await params
  const nombre = CIUDADES[ciudad]
  if (!nombre) notFound()

  const datos = DATOS[ciudad]

  // ── Fetch listings reales ───────────────────────────────────────────────────
  const { listings } = await searchListings({
    ciudad,
    operacion: 'rent',
    solo_particulares: true,
    pagina: 1,
  })

  // ── JSON-LD ─────────────────────────────────────────────────────────────────
  const articleJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Alquiler de Particulares en ${nombre}: Pisos sin Comisión`,
    description: datos.descripcion_seo,
    author: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    datePublished: '2025-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/${ciudad}/alquiler-particulares`,
    },
  })

  const breadcrumbJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Alquiler',
        item: `${BASE_URL}/pisos?operacion=rent`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Alquiler Particulares ${nombre}`,
        item: `${BASE_URL}/${ciudad}/alquiler-particulares`,
      },
    ],
  })

  const faqJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: datos.faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleJson }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJson }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqJson }}
      />

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0d1a0f]">
        {/* Imagen de cabecera */}
        <Image
          src="/imagencabezera.jpg"
          alt={`Piso de alquiler de particulares en ${nombre}`}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Overlay oscuro para legibilidad del texto */}
        <div className="absolute inset-0 bg-[#0d1a0f]/75" />
        {/* Gradiente dorado sutil en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0d1a0f] to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/40 mb-8">
            <Link href="/" className="hover:text-white/70 transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/pisos?operacion=rent" className="hover:text-white/70 transition-colors">Alquiler</Link>
            <span>/</span>
            <span className="text-white/70">{nombre}</span>
          </nav>

          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#c9962a]/15 border border-[#c9962a]/30 rounded-full px-3.5 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f4c94a] animate-pulse" />
              <span className="text-xs font-semibold text-[#f4c94a] tracking-wide uppercase">
                Solo particulares verificados
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Pisos de alquiler<br />
              <span className="text-[#f4c94a]">de particulares</span> en {nombre}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-white/65 leading-relaxed max-w-xl">
              Encuentra tu próximo hogar en {nombre} sin pagar comisión de agencia.
              Contratos directos con particulares verificados legalmente por Inmonest.
            </p>

            {/* Stats row */}
            <div className="mt-8 flex flex-wrap gap-4">
              {[
                { label: 'Anuncios activos', value: listings.length > 0 ? `${listings.length}+` : 'Actualizados' },
                { label: 'Precio medio', value: datos.precio_medio },
                { label: 'Ahorro vs agencia', value: '1 – 2 meses de renta' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3"
                >
                  <p className="text-xs text-white/45 mb-0.5">{label}</p>
                  <p className="text-sm font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Filtros rápidos ────────────────────────────────────────────── */}
          <div className="mt-10 flex flex-wrap gap-2">
            {[
              {
                label: '🏠 Todos los pisos',
                href: `/pisos?operacion=rent&ciudad=${ciudad}&solo_particulares=true`,
                active: true,
              },
              {
                label: '🛏 Alquiler de habitaciones',
                href: `/pisos?operacion=rent&ciudad=${ciudad}&solo_particulares=true&habitaciones_min=1`,
                active: false,
              },
              {
                label: '🌴 Alquiler de temporada',
                href: `/pisos?operacion=rent&ciudad=${ciudad}`,
                active: false,
              },
              {
                label: '📋 Ver con mapa',
                href: `/pisos?operacion=rent&ciudad=${ciudad}&solo_particulares=true&vista=mapa`,
                active: false,
              },
            ].map(({ label, href, active }) => (
              <Link
                key={label}
                href={href}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#c9962a] text-white shadow-lg shadow-[#c9962a]/30 hover:bg-[#f4c94a] hover:text-[#0d1a0f]'
                    : 'bg-white/8 border border-white/15 text-white/75 hover:bg-white/15 hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ── LISTING GRID ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900">
              Pisos de particulares en {nombre}
              {listings.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({listings.length} anuncios)
                </span>
              )}
            </h2>
            <Link
              href={`/pisos?operacion=rent&ciudad=${ciudad}&solo_particulares=true`}
              className="text-sm font-medium text-[#c9962a] hover:text-[#a87a20] transition-colors"
            >
              Ver todos →
            </Link>
          </div>

          {listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.slice(0, 12).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {listings.length > 12 && (
                <div className="mt-10 text-center">
                  <Link
                    href={`/pisos?operacion=rent&ciudad=${ciudad}&solo_particulares=true`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0d1a0f] text-white font-semibold text-sm hover:bg-[#1a3320] transition-colors shadow-lg"
                  >
                    Ver todos los anuncios en {nombre}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </>
          ) : (
            // Empty state — siempre hay CTA aunque no haya listings todavía
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pronto más anuncios en {nombre}
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Estamos ampliando nuestra cobertura en {nombre}. Mientras tanto,
                explora todos los anuncios disponibles.
              </p>
              <Link
                href={`/pisos?operacion=rent&ciudad=${ciudad}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c9962a] text-white font-semibold text-sm hover:bg-[#a87a20] transition-colors"
              >
                Ver anuncios en {nombre}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── BARRIOS ──────────────────────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Barrios con más alquileres de particulares en {nombre}
          </h2>
          <div className="flex flex-wrap gap-3">
            {datos.barrios.map((barrio) => (
              <Link
                key={barrio}
                href={`/pisos?operacion=rent&ciudad=${ciudad}&solo_particulares=true`}
                className="group flex items-center gap-2 bg-gray-50 hover:bg-[#fef9e8] border border-gray-200 hover:border-[#f4c94a]/50 rounded-xl px-4 py-2.5 transition-all"
              >
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#a87a20]">
                  {barrio}
                </span>
                <svg
                  className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#c9962a] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEXTO SEO ────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Alquiler de particulares en {nombre}: guía completa
            </h2>

            <p className="text-gray-600 leading-relaxed mb-6">{datos.descripcion_seo}</p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ¿Por qué alquilar directamente de un particular en {nombre}?
            </h3>
            <ul className="space-y-2 text-gray-600 mb-6">
              {[
                `Sin comisión de agencia: ahorra entre 500 € y 2.000 € en honorarios de intermediación.`,
                `Trato directo: negocia las condiciones cara a cara con el propietario real.`,
                `Más flexibilidad: plazos, mascotas, reformas… los particulares son más abiertos a negociar.`,
                `Contratos legales: Inmonest ofrece contratos LAU homologados desde 90 €, sin necesidad de agencia.`,
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#c9962a] mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ¿Cómo funciona Inmonest para alquiler de particulares en {nombre}?
            </h3>
            <ol className="space-y-3 text-gray-600 mb-6">
              {[
                'Encuentra el piso que te interesa en nuestra base de datos actualizada diariamente.',
                'Contacta directamente con el propietario desde la ficha del anuncio.',
                'Visita el piso y acuerda las condiciones con el propietario sin intermediarios.',
                'Formaliza el contrato con nuestro servicio de contratos de alquiler por solo 90 €.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#c9962a] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Preguntas frecuentes sobre alquiler de particulares en {nombre}
          </h2>
          <div className="space-y-4">
            {datos.faq.map(({ q, a }) => (
              <details
                key={q}
                className="group bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none font-semibold text-gray-900 hover:bg-gray-100 transition-colors">
                  {q}
                  <svg
                    className="w-5 h-5 text-gray-400 shrink-0 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEAD CAPTURE ─────────────────────────────────────────────────────── */}
      <section className="bg-[#0d1a0f] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#c9962a] mb-3">
              ¿Ya encontraste tu piso?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Protégete con un contrato legal en minutos
            </h2>
            <p className="text-white/60 text-sm max-w-lg mx-auto">
              Genera un contrato de alquiler LAU homologado, revisado por abogados especializados.
              Solo 90 € — sin sorpresas, sin desplazamientos.
            </p>
          </div>
          <LeadCaptureForm
            serviceKey="alquiler-vivienda-lau"
            price={90}
            label={`Contrato de alquiler para ${nombre} — revisado por gestoría`}
          />
        </div>
      </section>

      {/* ── ENLACES RELACIONADOS ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
            También puede interesarte
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: `Alquiler sin agencia en ${nombre}`, href: `/${ciudad}/alquiler-sin-agencia` },
              { label: `Pisos en ${nombre}`, href: `/${ciudad}/pisos` },
              { label: `Contrato de alquiler en ${nombre}`, href: `/${ciudad}/contrato-alquiler` },
              { label: `Vender piso en ${nombre}`, href: `/${ciudad}/vender-piso` },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="block bg-white rounded-xl border border-gray-200 hover:border-[#c9962a]/40 hover:shadow-md px-4 py-3 text-sm font-medium text-gray-700 hover:text-[#a87a20] transition-all"
              >
                {label} →
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

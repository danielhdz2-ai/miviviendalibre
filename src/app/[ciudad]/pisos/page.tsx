import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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

// Datos de mercado por ciudad
const MERCADO: Record<string, {
  precio_venta: string
  precio_alquiler: string
  precio_m2: string
  tendencia_venta: string
  tendencia_alquiler: string
  barrios: string[]
  descripcion: string
}> = {
  madrid: {
    precio_venta: '380.000 €',
    precio_alquiler: '1.450 €/mes',
    precio_m2: '4.200 €/m²',
    tendencia_venta: '+8 % anual',
    tendencia_alquiler: '+12 % anual',
    barrios: ['Salamanca', 'Chamberí', 'Malasaña', 'Lavapiés', 'Carabanchel', 'Vallecas'],
    descripcion: 'Madrid es la ciudad con mayor volumen de transacciones inmobiliarias de España. La demanda supera sistemáticamente a la oferta, especialmente en el centro y los distritos del norte.',
  },
  barcelona: {
    precio_venta: '420.000 €',
    precio_alquiler: '1.600 €/mes',
    precio_m2: '4.500 €/m²',
    tendencia_venta: '+10 % anual',
    tendencia_alquiler: '+9 % anual',
    barrios: ['Eixample', 'Gràcia', 'Sarrià-Sant Gervasi', 'Sant Martí', 'Sants', 'Horta-Guinardó'],
    descripcion: 'Barcelona combina alta demanda local e internacional. Las zonas tensionadas reguladas por la Generalitat limitan las subidas de alquiler para grandes tenedores, pero el mercado de compraventa sigue al alza.',
  },
  valencia: {
    precio_venta: '230.000 €',
    precio_alquiler: '950 €/mes',
    precio_m2: '2.400 €/m²',
    tendencia_venta: '+12 % anual',
    tendencia_alquiler: '+15 % anual',
    barrios: ['Ruzafa', 'El Carmen', 'Benimaclet', 'Campanar', 'Patraix', 'Quatre Carreres'],
    descripcion: 'Valencia experimenta el mayor crecimiento relativo de precios de España, impulsado por la llegada de nómadas digitales, estudiantes internacionales y el boom turístico del área metropolitana.',
  },
  sevilla: {
    precio_venta: '200.000 €',
    precio_alquiler: '850 €/mes',
    precio_m2: '2.100 €/m²',
    tendencia_venta: '+4 % anual',
    tendencia_alquiler: '+7 % anual',
    barrios: ['Triana', 'El Centro', 'Los Remedios', 'Nervión', 'Macarena', 'Bellavista'],
    descripcion: 'Sevilla ofrece precios más accesibles que las grandes capitales con buena calidad de vida. El alquiler vacacional en el centro presiona los precios residenciales, especialmente en Triana y el Casco Histórico.',
  },
  malaga: {
    precio_venta: '320.000 €',
    precio_alquiler: '1.200 €/mes',
    precio_m2: '3.100 €/m²',
    tendencia_venta: '+15 % anual',
    tendencia_alquiler: '+18 % anual',
    barrios: ['Centro Histórico', 'El Palo', 'Teatinos', 'Churriana', 'Carretera de Cádiz', 'Pedregalejo'],
    descripcion: 'Málaga lidera el crecimiento de precios en España. La llegada masiva de trabajadores remotos europeos y el auge tecnológico del área de innovación han disparado la demanda muy por encima de la oferta disponible.',
  },
  bilbao: {
    precio_venta: '290.000 €',
    precio_alquiler: '1.100 €/mes',
    precio_m2: '3.300 €/m²',
    tendencia_venta: '+6 % anual',
    tendencia_alquiler: '+8 % anual',
    barrios: ['Abando', 'Indautxu', 'Deusto', 'Begoña', 'Rekalde', 'San Francisco'],
    descripcion: 'Bilbao mantiene un mercado sólido con demanda estable. El mercado de segunda mano domina las transacciones y los precios crecen de forma moderada comparado con otras capitales.',
  },
  zaragoza: {
    precio_venta: '165.000 €',
    precio_alquiler: '700 €/mes',
    precio_m2: '1.900 €/m²',
    tendencia_venta: '+3 % anual',
    tendencia_alquiler: '+5 % anual',
    barrios: ['Centro', 'Delicias', 'Universidad', 'Las Fuentes', 'Oliver', 'Miralbueno'],
    descripcion: 'Zaragoza es una de las capitales más asequibles de España con buena conectividad por AVE. Su mercado inmobiliario es estable y ofrece una de las mejores relaciones calidad-precio del país.',
  },
  alicante: {
    precio_venta: '200.000 €',
    precio_alquiler: '850 €/mes',
    precio_m2: '2.200 €/m²',
    tendencia_venta: '+9 % anual',
    tendencia_alquiler: '+11 % anual',
    barrios: ['Centro', 'Playa de San Juan', 'Benalúa', 'Carolinas', 'Vistahermosa', 'El Cabo'],
    descripcion: 'Alicante atrae compradores nacionales e internacionales por su clima y precios competitivos. La provincia lidera las ventas a extranjeros en España, especialmente del norte de Europa.',
  },
}

export function generateStaticParams() {
  return Object.keys(CIUDADES).map((ciudad) => ({ ciudad }))
}

export async function generateMetadata({ params }: { params: Promise<{ ciudad: string }> }): Promise<Metadata> {
  const { ciudad } = await params
  const nombre = CIUDADES[ciudad]
  if (!nombre) return {}
  const mercado = MERCADO[ciudad]

  return {
    title: `Pisos en ${nombre} | Compra y Alquiler sin Comisiones — Inmonest`,
    description: `Encuentra pisos en ${nombre} directamente de particulares. Precio medio ${mercado?.precio_m2 ?? ''} en venta, ${mercado?.precio_alquiler ?? ''} en alquiler. Sin agencias, sin comisiones.`,
    keywords: `pisos en ${nombre.toLowerCase()}, piso en venta ${nombre.toLowerCase()}, piso alquiler ${nombre.toLowerCase()}, comprar piso ${nombre.toLowerCase()}, pisos particulares ${nombre.toLowerCase()}, inmuebles ${nombre.toLowerCase()}`,
    alternates: { canonical: `/${ciudad}/pisos` },
    openGraph: {
      title: `Pisos en ${nombre} — Compra y Alquiler sin Comisiones`,
      description: `Miles de pisos en ${nombre} directamente de propietarios particulares. Ahorra la comisión de la agencia.`,
      url: `${BASE_URL}/${ciudad}/pisos`,
      locale: 'es_ES',
      type: 'article',
      siteName: 'Inmonest',
    },
  }
}

export default async function PisosCiudadPage({ params }: { params: Promise<{ ciudad: string }> }) {
  const { ciudad } = await params
  const nombre = CIUDADES[ciudad]
  if (!nombre) notFound()

  const mercado = MERCADO[ciudad]

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Pisos en ${nombre}: Compra y Alquiler sin Comisiones`,
    description: `Guía del mercado inmobiliario de ${nombre} con datos de precios, barrios y cómo comprar o alquilar sin agencia.`,
    author: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    datePublished: '2025-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/${ciudad}/pisos` },
  })

  const breadcrumbJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Pisos', item: `${BASE_URL}/pisos` },
      { '@type': 'ListItem', position: 3, name: `Pisos en ${nombre}`, item: `${BASE_URL}/${ciudad}/pisos` },
    ],
  })

  const faqJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Cuánto cuesta un piso en ${nombre}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `El precio medio de un piso en ${nombre} es de ${mercado?.precio_m2 ?? 'mercado'}, con un precio medio de venta de unos ${mercado?.precio_venta ?? '—'}. Los precios varían significativamente por barrio y estado del inmueble.`,
        },
      },
      {
        '@type': 'Question',
        name: `¿Cuánto cuesta alquilar un piso en ${nombre}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `El precio medio de alquiler en ${nombre} se sitúa en torno a ${mercado?.precio_alquiler ?? '—'}. La tendencia es de ${mercado?.tendencia_alquiler ?? 'subida'} según los datos de mercado actuales.`,
        },
      },
      {
        '@type': 'Question',
        name: `¿Dónde están los pisos más baratos de ${nombre}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `En ${nombre}, los barrios con precios más accesibles suelen ser los alejados del centro histórico. Los barrios más demandados son: ${mercado?.barrios.join(', ') ?? '—'}. Los precios varían entre ellos notablemente.`,
        },
      },
      {
        '@type': 'Question',
        name: `¿Puedo comprar o alquilar un piso en ${nombre} sin agencia?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Sí. En Inmonest todos los anuncios son de propietarios particulares de ${nombre}. Puedes contactar directamente sin intermediarios y ahorrarte entre el 3 % y el 6 % del precio en comisiones al comprar, o entre 1 y 2 meses de renta al alquilar.`,
        },
      },
      {
        '@type': 'Question',
        name: `¿Qué documentos necesito para comprar un piso en ${nombre}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Para comprar un piso necesitas: DNI o NIE vigente, número de cuenta bancaria, y si necesitas hipoteca, los tres últimos recibos de nómina y la declaración de la renta. El proceso incluye contrato de arras, escritura notarial e inscripción en el Registro de la Propiedad.',
        },
      },
    ],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJson }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJson }} />

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-[#c9962a] transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/pisos" className="hover:text-[#c9962a] transition-colors">Pisos</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Pisos en {nombre}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
          Pisos en {nombre}:<br />
          <span className="text-[#c9962a]">Compra y alquiler directo de particulares</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {mercado?.descripcion} En Inmonest encontrarás pisos directamente de sus propietarios,
          sin comisiones de agencia.
        </p>

        {/* Datos de mercado */}
        {mercado && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">Precio m²</p>
              <p className="text-lg font-black text-gray-900">{mercado.precio_m2}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">Venta media</p>
              <p className="text-base font-black text-gray-900">{mercado.precio_venta}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">Alquiler medio</p>
              <p className="text-base font-black text-gray-900">{mercado.precio_alquiler}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">Tendencia venta</p>
              <p className="text-sm font-bold text-[#c9962a]">{mercado.tendencia_venta}</p>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <Link
            href={`/pisos?operacion=sale&ciudad=${ciudad}`}
            className="flex items-center justify-center gap-2 bg-[#0d1a0f] hover:bg-[#1a2e1c] text-white font-bold px-6 py-4 rounded-xl text-base transition-colors shadow-md"
          >
            🏠 Ver pisos en venta en {nombre} →
          </Link>
          <Link
            href={`/pisos?operacion=rent&ciudad=${ciudad}`}
            className="flex items-center justify-center gap-2 bg-[#c9962a] hover:bg-[#b8841f] text-white font-bold px-6 py-4 rounded-xl text-base transition-colors shadow-md"
          >
            🔑 Ver pisos en alquiler en {nombre} →
          </Link>
        </div>

        <article className="prose prose-gray max-w-none">

          <h2>Mercado inmobiliario en {nombre}</h2>
          <p>
            El precio medio de un piso en {nombre} es de <strong>{mercado?.precio_m2}</strong>.
            La tendencia de venta es de <strong>{mercado?.tendencia_venta}</strong> y el alquiler
            crece a un ritmo de <strong>{mercado?.tendencia_alquiler}</strong>.
          </p>

          <h2>Barrios de {nombre} donde buscar piso</h2>
          <p>Los barrios más demandados de {nombre} son:</p>
          <ul>
            {mercado?.barrios.map((barrio) => (
              <li key={barrio}><strong>{barrio}</strong></li>
            ))}
          </ul>
          <p>
            Cada barrio tiene su perfil de precio y demanda. Te recomendamos usar los filtros
            de Inmonest para comparar opciones dentro de {nombre} y encontrar la mejor relación
            calidad-precio según tu presupuesto.
          </p>

          <h2>¿Por qué comprar o alquilar sin agencia en {nombre}?</h2>
          <p>
            Las agencias inmobiliarias cobran entre el <strong>3 % y el 6 %</strong> del precio
            de venta al comprador o vendedor, y hasta <strong>dos mensualidades</strong> al
            inquilino. En {nombre}, con precios medios de {mercado?.precio_venta} en venta,
            eso puede suponer entre 6.000 € y 25.000 € en comisiones evitables.
          </p>
          <p>
            Inmonest conecta directamente compradores e inquilinos con propietarios particulares
            de {nombre}. Sin intermediarios, sin comisiones, sin sorpresas.
          </p>

          <h2>¿Cómo publicar tu piso en {nombre}?</h2>
          <p>
            Si eres propietario en {nombre} y quieres vender o alquilar sin agencia, publica
            tu anuncio gratis en Inmonest en menos de 5 minutos. Tu piso llega directamente
            a miles de compradores e inquilinos reales de {nombre}.
          </p>

        </article>

        {/* Publicar CTA */}
        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Tienes un piso en {nombre}?</h2>
          <p className="text-gray-600 text-sm mb-5">
            Publica tu anuncio gratis y llega directamente a compradores e inquilinos. Sin comisiones.
          </p>
          <Link
            href="/publicar-anuncio"
            className="inline-flex items-center gap-2 bg-[#c9962a] hover:bg-[#b8841f] text-white font-bold px-7 py-3.5 rounded-xl text-base transition-colors shadow-md"
          >
            Publicar anuncio gratis →
          </Link>
        </div>

        {/* Links internos a servicios de la ciudad */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-4">Servicios inmobiliarios en {nombre}:</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${ciudad}/contrato-arras`} className="text-sm bg-gray-100 hover:bg-amber-50 px-4 py-2 rounded-full text-gray-700 hover:text-[#c9962a] transition-colors">
              Contrato de arras en {nombre} →
            </Link>
            <Link href={`/${ciudad}/contrato-alquiler`} className="text-sm bg-gray-100 hover:bg-amber-50 px-4 py-2 rounded-full text-gray-700 hover:text-[#c9962a] transition-colors">
              Contrato de alquiler en {nombre} →
            </Link>
            <Link href={`/${ciudad}/alquiler-sin-agencia`} className="text-sm bg-gray-100 hover:bg-amber-50 px-4 py-2 rounded-full text-gray-700 hover:text-[#c9962a] transition-colors">
              Alquiler sin agencia en {nombre} →
            </Link>
            <Link href={`/${ciudad}/vender-piso`} className="text-sm bg-gray-100 hover:bg-amber-50 px-4 py-2 rounded-full text-gray-700 hover:text-[#c9962a] transition-colors">
              Vender piso sin comisión en {nombre} →
            </Link>
          </div>
        </div>

      </main>
    </>
  )
}

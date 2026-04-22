import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://inmonest.com'
const FECHA = '2026-04-22'

export const metadata: Metadata = {
  title: 'Pisos de fondo bancario baratos: cómo encontrarlos y qué revisar — Inmonest',
  description:
    'Solvia, Aliseda, Servihabitat... Los bancos tienen miles de pisos entre 40.000 € y 150.000 €. Aprende cómo acceder, negociar el precio y qué revisar antes de comprar un piso bancario.',
  keywords: 'pisos fondo bancario, pisos baratos banco, solvia pisos, aliseda pisos, servihabitat pisos, pisos banco baratos',
  alternates: { canonical: '/blog/pisos-fondo-bancario-baratos' },
  openGraph: {
    title: 'Pisos de fondo bancario baratos: guía de compra 2026',
    description: 'Cómo encontrar y comprar pisos de banco entre 40.000 € y 150.000 € con todas las garantías.',
    url: `${BASE_URL}/blog/pisos-fondo-bancario-baratos`,
    locale: 'es_ES',
    type: 'article',
    siteName: 'Inmonest',
    publishedTime: FECHA,
  },
}

export default function PisosFondoBancarioPage() {
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Pisos de fondo bancario baratos: cómo encontrarlos y qué tener en cuenta',
    author: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } },
    datePublished: FECHA,
    dateModified: FECHA,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/pisos-fondo-bancario-baratos` },
  })

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: 'Pisos de fondo bancario', item: `${BASE_URL}/blog/pisos-fondo-bancario-baratos` },
    ],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbSchema }} />

      <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
        <nav aria-label="Navegación" className="text-sm text-gray-500 mb-8">
          <ol className="flex flex-wrap gap-1">
            <li><Link href="/" className="hover:underline">Inicio</Link></li>
            <li aria-hidden="true" className="mx-1">/</li>
            <li><Link href="/blog" className="hover:underline">Blog</Link></li>
            <li aria-hidden="true" className="mx-1">/</li>
            <li aria-current="page" className="text-gray-700">Pisos de fondo bancario</li>
          </ol>
        </nav>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Compra</span>
            <span className="text-xs text-gray-400">6 min de lectura · 22 de abril de 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Pisos de fondo bancario baratos: cómo encontrarlos y qué tener en cuenta
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Los bancos acumulan miles de inmuebles procedentes de ejecuciones hipotecarias y adjudicaciones. Muchos están disponibles entre 40.000 € y 150.000 €, muy por debajo del precio de mercado. Pero comprar un piso bancario tiene sus particularidades.
          </p>
        </header>

        <article className="prose prose-gray max-w-none">
          <h2>¿Qué son los pisos de fondo bancario?</h2>
          <p>
            Son inmuebles que los bancos han adquirido mediante ejecuciones hipotecarias (cuando el propietario no pudo pagar la hipoteca) o que el propio banco financió en promociones que no llegaron a venderse. Al no ser su actividad principal, los bancos quieren deshacerse de ellos con rapidez, lo que genera oportunidades de precio para compradores particulares.
          </p>
          <p>
            Los principales fondos bancarios en España en 2026 son:
          </p>
          <ul>
            <li><strong>Solvia</strong> — Cartera inmobiliaria de Banco Sabadell. Algunos pisos desde 43.000 €.</li>
            <li><strong>Aliseda</strong> — Cartera de Blackstone/Santander. Requiere gestión más compleja.</li>
            <li><strong>Servihabitat</strong> — Cartera de CaixaBank. Una de las mayores de España.</li>
            <li><strong>Haya Real Estate</strong> — Gestiona carteras de Bankia (absorbido por CaixaBank) y otras entidades.</li>
            <li><strong>Altamira</strong> — Cartera de Santander y otros bancos.</li>
          </ul>

          <h2>¿Por qué están tan baratos? ¿Hay trampa?</h2>
          <p>
            No siempre hay trampa, pero hay razones reales para el descuento. Las más frecuentes:
          </p>
          <ul>
            <li><strong>Estado de conservación:</strong> muchos han estado vacíos años o han sido vandalizados. Pueden requerir reformas importantes.</li>
            <li><strong>Ubicación:</strong> muchos están en zonas periféricas, municipios pequeños o áreas con baja demanda.</li>
            <li><strong>Ocupación ilegal:</strong> algunos tienen inquilinos u ocupantes que hay que desalojar (proceso legal que puede llevar meses).</li>
            <li><strong>Cargas ocultas:</strong> deudas de comunidad de propietarios, IBI impagado o hipotecas subordinadas pendientes.</li>
            <li><strong>Sin escritura de primera ocupación:</strong> algunos inmuebles tienen problemas de legalización o certificado de habitabilidad.</li>
          </ul>

          <h2>Dónde encontrar pisos bancarios en Inmonest</h2>
          <p>
            En Inmonest publicamos regularmente pisos procedentes de fondos bancarios verificados, con precio, fotos reales, estado del inmueble y documentación básica. Puedes filtrar específicamente por origen bancario para ver solo estas oportunidades.
          </p>

          <h2>Qué revisar antes de comprar un piso de banco</h2>
          <p>Antes de hacer una oferta, verifica obligatoriamente:</p>
          <ul>
            <li><strong>Nota simple registral actualizada</strong> — Solicítala en el Registro de la Propiedad (9 €). Muestra cargas, hipotecas y si hay algún embargo pendiente.</li>
            <li><strong>Deudas de comunidad</strong> — La comunidad de propietarios puede reclamar hasta 3 años de cuotas impagadas al nuevo propietario. Pide certificado de deuda.</li>
            <li><strong>IBI impagado</strong> — El Ayuntamiento puede reclamar los últimos 4 años. Solicita certificado de deuda al vendedor.</li>
            <li><strong>Estado de ocupación real</strong> — Visita el inmueble o comprueba documentalmente si hay alguien viviendo dentro.</li>
            <li><strong>Certificado de eficiencia energética</strong> — Obligatorio para la compraventa. Si el banco no lo tiene, deberá aportarlo antes de la firma.</li>
            <li><strong>Informe de estado del inmueble</strong> — Pide a un arquitecto o aparejador una inspección básica si hay dudas sobre la estructura o instalaciones.</li>
          </ul>

          <h2>¿Se puede negociar el precio?</h2>
          <p>
            Sí, especialmente en inmuebles que llevan mucho tiempo en el mercado. Los fondos bancarios tienen objetivos de desinversión y son más flexibles en precio cuando el inmueble lleva más de 6-12 meses publicado. Un descuento del 5-15 % sobre el precio de publicación es habitual si la oferta es formal y con financiación garantizada.
          </p>
          <p>
            La mejor estrategia es acudir con una oferta por escrito, justificada con comparativas de mercado, y demostrar que tienes capacidad financiera real (preaprobación hipotecaria o fondos propios suficientes).
          </p>

          <h2>¿Puedo pedir hipoteca para un piso de banco?</h2>
          <p>
            Sí. Los pisos de fondos bancarios son perfectamente hipotecables. De hecho, el propio banco vendedor a veces ofrece condiciones hipotecarias especiales para facilitar la venta. Sin embargo, estas condiciones no siempre son las mejores del mercado: compara siempre con otras entidades antes de aceptar la hipoteca del banco que vende.
          </p>
        </article>

        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-2">¿Encontraste un chollo bancario? Asegura la operación con arras</h2>
          <p className="text-gray-600 text-sm mb-5">
            Antes de cerrar cualquier compraventa, protégete con un contrato de arras redactado por abogados especializados. Entrega en 48h.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/pisos?origen=fondos-bancarios" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Ver pisos bancarios en Inmonest
            </Link>
            <Link href="/gestoria/arras-penitenciales" className="border border-amber-400 text-amber-700 hover:bg-amber-50 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Contrato de arras — 120 €
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link href="/blog" className="text-sm text-amber-600 hover:text-amber-700 font-semibold">← Volver al blog</Link>
        </div>
      </main>
    </>
  )
}

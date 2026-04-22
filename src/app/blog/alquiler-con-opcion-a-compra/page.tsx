import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://inmonest.com'
const FECHA = '2026-04-22'

export const metadata: Metadata = {
  title: 'Alquiler con opción a compra: cómo funciona y qué debes saber — Inmonest',
  description:
    'Alquilas hoy y compras cuando quieras. Aprende cómo funciona el alquiler con opción a compra en España, qué se descuenta del precio, cuándo te conviene y los riesgos.',
  keywords: 'alquiler con opcion a compra, como funciona opcion compra, contrato alquiler opcion compra, alquiler compra piso',
  alternates: { canonical: '/blog/alquiler-con-opcion-a-compra' },
  openGraph: {
    title: 'Alquiler con opción a compra: ventajas, riesgos y cómo funciona',
    description: 'Todo lo que necesitas saber sobre el alquiler con opción a compra en España en 2026.',
    url: `${BASE_URL}/blog/alquiler-con-opcion-a-compra`,
    locale: 'es_ES',
    type: 'article',
    siteName: 'Inmonest',
    publishedTime: FECHA,
  },
}

export default function AlquilerOpcionCompraPage() {
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Alquiler con opción a compra: ventajas, riesgos y cómo funciona en España',
    author: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } },
    datePublished: FECHA,
    dateModified: FECHA,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/alquiler-con-opcion-a-compra` },
  })

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: 'Alquiler con opción a compra', item: `${BASE_URL}/blog/alquiler-con-opcion-a-compra` },
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
            <li aria-current="page" className="text-gray-700">Alquiler con opción a compra</li>
          </ol>
        </nav>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide bg-orange-100 text-orange-700 px-3 py-1 rounded-full">Compraventa</span>
            <span className="text-xs text-gray-400">6 min de lectura · 22 de abril de 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Alquiler con opción a compra: ventajas, riesgos y cómo funciona en España
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Es el contrato más versátil del mercado inmobiliario español: alquilas ahora la vivienda que quieres comprar y, cuando estés listo (o la hipoteca esté aprobada), la compras a un precio ya fijado hoy. Pero hay cosas que debes saber antes de firmar.
          </p>
        </header>

        <article className="prose prose-gray max-w-none">
          <h2>¿Qué es exactamente el alquiler con opción a compra?</h2>
          <p>
            Es un contrato doble que regula dos relaciones jurídicas simultáneas:
          </p>
          <ol>
            <li><strong>El arrendamiento</strong> — el inquilino vive en la vivienda y paga una renta mensual.</li>
            <li><strong>La opción de compra</strong> — el inquilino tiene el derecho exclusivo e irrevocable de comprar esa vivienda durante un plazo determinado, al precio pactado en el contrato.</li>
          </ol>
          <p>
            El precio de compra queda <strong>fijado e inalterable</strong> desde el momento de la firma, independientemente de lo que haga el mercado durante el período de alquiler.
          </p>

          <h2>¿Se descuenta el alquiler del precio de compra?</h2>
          <p>
            Depende de lo que pacten las partes en el contrato. Las opciones más habituales son:
          </p>
          <ul>
            <li><strong>Descuento del 100 % de las rentas:</strong> todo lo que pagas de alquiler se descuenta del precio final. Es la opción más favorable para el comprador.</li>
            <li><strong>Descuento parcial (50-80 %):</strong> solo una parte de cada mensualidad se imputa al precio. El resto es el "coste" del período de opción.</li>
            <li><strong>Sin descuento de rentas:</strong> el alquiler se paga como tal y el precio de compra no varía. Solo tiene sentido si el precio de compra ya está ajustado a esa situación.</li>
          </ul>
          <p>
            En el contrato debe quedar absolutamente claro qué porcentaje de cada mensualidad se descuenta, cómo se acumula y qué pasa si el período de alquiler se extiende.
          </p>

          <h2>La prima de opción: qué es y qué pasa si no compras</h2>
          <p>
            Además de las mensualidades, el comprador suele pagar una <strong>prima de opción</strong> al firmar el contrato: un importe inicial (habitualmente entre el 3 % y el 5 % del precio de compra) que garantiza al vendedor que el comprador tiene intención real.
          </p>
          <p>
            Si al final del período de opción el comprador decide <strong>no comprar</strong>, pierde la prima de opción. Las mensualidades ya pagadas también se pierden si el contrato lo establece así (a menos que se hayan acordado como descuento del precio y por tanto hayan cumplido su función).
          </p>

          <h2>¿Cuándo es conveniente para el comprador?</h2>
          <ul>
            <li>Cuando aún no tienes la hipoteca aprobada pero quieres asegurarte el precio actual antes de que suba.</li>
            <li>Cuando necesitas tiempo para mejorar tu perfil crediticio (más ahorro, estabilidad laboral).</li>
            <li>Cuando quieres "probar" la vivienda antes de comprarla definitivamente.</li>
            <li>Cuando el mercado está subiendo y quieres bloquear hoy el precio de dentro de 2 años.</li>
          </ul>

          <h2>¿Cuándo es conveniente para el vendedor?</h2>
          <ul>
            <li>Cuando quiere vender pero el mercado está lento y prefiere generar ingresos por alquiler mientras tanto.</li>
            <li>Cuando quiere asegurarse un comprador comprometido sin cerrar definitivamente la venta aún.</li>
            <li>Cuando acepta diferir el cobro total a cambio de una renta mensual garantizada durante el período de espera.</li>
          </ul>

          <h2>Implicaciones fiscales que no debes ignorar</h2>
          <p>
            El alquiler con opción a compra tiene un tratamiento fiscal específico. La prima de opción tributa como rendimiento de capital inmobiliario para el vendedor. Cuando se ejerce la opción de compra, las rentas de alquiler descontadas se computan como parte del precio de adquisición, lo que puede reducir la ganancia patrimonial sujeta a IRPF.
          </p>
          <p>
            Recomendamos consultar con un asesor fiscal antes de firmar, especialmente para el vendedor.
          </p>
        </article>

        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Contrato de alquiler con opción a compra redactado por abogados</h2>
          <p className="text-gray-600 text-sm mb-5">
            El contrato más complejo del mercado, con arrendamiento y derecho de opción integrados. Personalizado y con todas las cláusulas que te protegen. Entrega en 48h.
          </p>
          <Link href="/gestoria/alquiler-opcion-compra" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors inline-block">
            Solicitar contrato de opción a compra — 150 €
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link href="/blog" className="text-sm text-amber-600 hover:text-amber-700 font-semibold">← Volver al blog</Link>
        </div>
      </main>
    </>
  )
}

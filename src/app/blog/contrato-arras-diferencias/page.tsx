import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://inmonest.com'
const FECHA = '2026-04-22'

export const metadata: Metadata = {
  title: 'Arras penitenciales vs confirmatorias: diferencias y cuándo usar cada una — Inmonest',
  description:
    'Descubre las diferencias entre arras penitenciales y confirmatorias en la compraventa de inmuebles, cuándo elegir cada tipo y qué consecuencias tiene el incumplimiento.',
  keywords: 'arras penitenciales, arras confirmatorias, diferencias arras, contrato arras, compraventa piso',
  alternates: { canonical: '/blog/contrato-arras-diferencias' },
  openGraph: {
    title: 'Arras penitenciales vs confirmatorias: ¿cuál te conviene?',
    description: 'Diferencias clave entre los dos tipos de arras y sus consecuencias jurídicas.',
    url: `${BASE_URL}/blog/contrato-arras-diferencias`,
    locale: 'es_ES',
    type: 'article',
    siteName: 'Inmonest',
    publishedTime: FECHA,
  },
}

export default function ArrasDiferenciasPage() {
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Arras penitenciales vs confirmatorias: diferencias y cuándo usar cada una',
    author: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } },
    datePublished: FECHA,
    dateModified: FECHA,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/contrato-arras-diferencias` },
  })

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: 'Arras penitenciales vs confirmatorias', item: `${BASE_URL}/blog/contrato-arras-diferencias` },
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
            <li aria-current="page" className="text-gray-700">Arras: diferencias</li>
          </ol>
        </nav>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide bg-orange-100 text-orange-700 px-3 py-1 rounded-full">Compraventa</span>
            <span className="text-xs text-gray-400">6 min de lectura · 22 de abril de 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Arras penitenciales vs confirmatorias: ¿cuál te conviene en tu compraventa?
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Son los dos contratos más utilizados antes de firmar la escritura de compraventa, pero funcionan de forma muy diferente. Elegir mal puede costarte la operación.
          </p>
        </header>

        <article className="prose prose-gray max-w-none">
          <h2>¿Qué son las arras?</h2>
          <p>
            Las arras son una cantidad de dinero que el comprador entrega al vendedor como señal de que ambas partes tienen la intención firme de cerrar la compraventa de un inmueble. Ese dinero queda en poder del vendedor hasta que se firma la escritura pública, momento en el que se descuenta del precio total.
          </p>
          <p>
            Lo que diferencia a los dos tipos de arras es <strong>qué pasa si una de las partes no cumple</strong>. Y ahí está la clave que muchos compradores y vendedores no conocen antes de firmar.
          </p>

          <h2>Arras penitenciales: la opción de desistir tiene un precio</h2>
          <p>
            Reguladas en el <strong>artículo 1454 del Código Civil</strong>, las arras penitenciales funcionan como una válvula de escape bilateral: cualquiera de las partes puede echarse atrás, pero pagando una penalización económica.
          </p>
          <ul>
            <li><strong>Si se echa atrás el comprador:</strong> pierde la totalidad del importe entregado como señal.</li>
            <li><strong>Si se echa atrás el vendedor:</strong> debe devolver el doble de la señal recibida al comprador.</li>
          </ul>
          <p>
            Este mecanismo hace que ninguna de las dos partes pueda alejarse de la operación sin un coste real, pero tampoco queda atrapada contra su voluntad. Por eso son <strong>el tipo de arras más frecuente en España</strong>, especialmente en operaciones donde la hipoteca aún no está aprobada definitivamente.
          </p>

          <h2>Arras confirmatorias: compromiso total, sin marcha atrás</h2>
          <p>
            Las arras confirmatorias no están reguladas específicamente en el Código Civil, pero la jurisprudencia española las reconoce plenamente. Su efecto es radicalmente distinto: <strong>no permiten desistir pagando una penalización</strong>.
          </p>
          <p>
            Si una parte incumple con arras confirmatorias, la otra tiene dos opciones:
          </p>
          <ul>
            <li><strong>Exigir el cumplimiento forzoso del contrato</strong> por vía judicial.</li>
            <li><strong>Resolver el contrato y reclamar daños y perjuicios</strong> ante los tribunales.</li>
          </ul>
          <p>
            Son la opción correcta cuando ambas partes tienen certeza absoluta de cerrar la operación: financiación ya aprobada, ningún condicionante externo pendiente y voluntad firme de escriturar.
          </p>

          <h2>Tabla comparativa</h2>
          <div className="overflow-x-auto my-6">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600"></th>
                  <th className="px-4 py-2 text-left font-semibold text-orange-700">Penitenciales</th>
                  <th className="px-4 py-2 text-left font-semibold text-blue-700">Confirmatorias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-2 font-medium">¿Puedes desistir?</td><td className="px-4 py-2">Sí, pagando penalización</td><td className="px-4 py-2">No</td></tr>
                <tr><td className="px-4 py-2 font-medium">Si incumple el comprador</td><td className="px-4 py-2">Pierde la señal</td><td className="px-4 py-2">Cumplimiento forzoso o daños</td></tr>
                <tr><td className="px-4 py-2 font-medium">Si incumple el vendedor</td><td className="px-4 py-2">Devuelve el doble</td><td className="px-4 py-2">Cumplimiento forzoso o daños</td></tr>
                <tr><td className="px-4 py-2 font-medium">Uso más frecuente</td><td className="px-4 py-2">Hipoteca pendiente de aprobar</td><td className="px-4 py-2">Operación 100 % cerrada</td></tr>
                <tr><td className="px-4 py-2 font-medium">Base legal</td><td className="px-4 py-2">Art. 1454 Código Civil</td><td className="px-4 py-2">Jurisprudencia del TS</td></tr>
              </tbody>
            </table>
          </div>

          <h2>¿Cuánto suele ser la señal de arras?</h2>
          <p>
            No existe una cantidad legal mínima ni máxima. La práctica habitual en España es entre el <strong>5 % y el 10 % del precio de venta</strong>. Por debajo del 5 %, la señal pierde fuerza disuasoria para el vendedor (no es suficientemente doloroso perderla doble). Por encima del 10 %, el comprador asume un riesgo importante si el banco le deniega la hipoteca.
          </p>

          <h2>Cláusula suspensiva por hipoteca: protégete si aún no tienes financiación</h2>
          <p>
            Si firmas arras antes de tener la hipoteca aprobada, incluye siempre una <strong>cláusula suspensiva por financiación</strong>: si el banco deniega el préstamo, el comprador recupera la señal íntegramente sin penalización. Sin esta cláusula, si el banco dice que no, el comprador pierde la señal.
          </p>
          <p>
            Nuestros contratos de arras la incorporan por defecto cuando hay financiación pendiente.
          </p>

          <h2>¿Necesito notario para las arras?</h2>
          <p>
            No. El contrato de arras tiene plena validez jurídica con firma privada entre las partes, sin necesidad de notario. Solo la escritura de compraventa definitiva requiere notario obligatoriamente.
          </p>
        </article>

        {/* CTA */}
        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-2">¿Necesitas redactar tu contrato de arras?</h2>
          <p className="text-gray-600 text-sm mb-5">
            Nuestros abogados especializados en compraventa inmobiliaria redactan el contrato personalizado con tus datos reales. Entrega en 48h.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/gestoria/arras-penitenciales" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Arras Penitenciales — 120 €
            </Link>
            <Link href="/gestoria/arras-confirmatorias" className="border border-amber-400 text-amber-700 hover:bg-amber-50 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Arras Confirmatorias — 120 €
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

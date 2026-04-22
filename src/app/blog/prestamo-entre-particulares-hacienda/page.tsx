import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://inmonest.com'
const FECHA = '2026-04-22'

export const metadata: Metadata = {
  title: 'Préstamo entre familiares: cómo formalizarlo y declararlo ante Hacienda — Inmonest',
  description:
    'Un préstamo sin contrato entre familiares puede convertirse en una donación sujeta a impuestos. Aprende a documentarlo correctamente: modelo 600, ITP y obligaciones fiscales.',
  keywords: 'prestamo entre familiares hacienda, contrato prestamo particulares, prestamo privado impuestos, modelo 600 prestamo',
  alternates: { canonical: '/blog/prestamo-entre-particulares-hacienda' },
  openGraph: {
    title: 'Préstamo entre familiares: cómo hacerlo legal ante Hacienda',
    description: 'Sin contrato, Hacienda puede considerarlo una donación y liquidar el Impuesto de Donaciones.',
    url: `${BASE_URL}/blog/prestamo-entre-particulares-hacienda`,
    locale: 'es_ES',
    type: 'article',
    siteName: 'Inmonest',
    publishedTime: FECHA,
  },
}

export default function PrestamoParticulaesHaciendaPage() {
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Préstamo entre familiares: cómo formalizarlo y declararlo ante Hacienda',
    author: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } },
    datePublished: FECHA,
    dateModified: FECHA,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/prestamo-entre-particulares-hacienda` },
  })

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: 'Préstamo entre particulares', item: `${BASE_URL}/blog/prestamo-entre-particulares-hacienda` },
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
            <li aria-current="page" className="text-gray-700">Préstamo entre particulares</li>
          </ol>
        </nav>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide bg-green-100 text-green-700 px-3 py-1 rounded-full">Financiación</span>
            <span className="text-xs text-gray-400">7 min de lectura · 22 de abril de 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Préstamo entre familiares: cómo formalizarlo y declararlo ante Hacienda
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Millones de españoles prestan o reciben dinero de familiares o amigos sin contrato escrito. Pero lo que parece un favor entre conocidos puede convertirse en un problema fiscal grave si Hacienda lo interpreta como una donación encubierta.
          </p>
        </header>

        <article className="prose prose-gray max-w-none">
          <h2>El riesgo que nadie te cuenta: Hacienda y las donaciones encubiertas</h2>
          <p>
            La Agencia Tributaria tiene acceso a los movimientos bancarios. Si detecta una transferencia importante entre particulares sin justificación documental, puede presumir que se trata de una <strong>donación encubierta</strong> y liquidar el <strong>Impuesto de Donaciones</strong> con recargos e intereses de demora.
          </p>
          <p>
            El Impuesto sobre Sucesiones y Donaciones está cedido a las comunidades autónomas y los tipos varían mucho: en algunas comunidades hay bonificaciones del 99 %, pero en otras (Madrid entre familiares directos suele estar muy bonificado, pero en otras como Andalucía o Baleares pueden ser tipos más elevados para cantidades grandes entre no parientes directos).
          </p>
          <p>
            Para demostrar que es un préstamo y no una donación, necesitas <strong>contrato escrito y declaración ante la AEAT</strong>.
          </p>

          <h2>¿Un préstamo entre particulares tiene que tributar?</h2>
          <p>
            Sí, pero mucho menos de lo que crees. Un préstamo entre particulares tributa por el <strong>Impuesto de Transmisiones Patrimoniales (ITP)</strong>, modalidad de "Transmisiones patrimoniales onerosas". La buena noticia: <strong>la cuota es cero euros</strong> si el préstamo no devenga intereses (tipo 0 %).
          </p>
          <p>
            Aunque la cuota a pagar sea cero, el préstamo debe declararse a la AEAT mediante el <strong>Modelo 600</strong> en la comunidad autónoma del prestatario (quien recibe el dinero). Esto crea el rastro documental que protege a ambas partes ante una comprobación.
          </p>

          <h2>¿Y si el préstamo tiene intereses?</h2>
          <p>
            Si el préstamo devenga intereses, el prestamista debe declarar esos intereses como <strong>rendimientos de capital mobiliario</strong> en su declaración del IRPF. El prestatario, si es persona jurídica, puede deducirlos como gasto financiero. Si es persona física, no hay deducción salvo excepciones tasadas.
          </p>
          <p>
            Además, si el préstamo devenga intereses, tributa por ITP pero con tipo del 1 % sobre el capital (no sobre los intereses). En algunos casos puede ser conveniente estructurar el préstamo como gratuito (0 %) para simplificar la gestión fiscal.
          </p>

          <h2>Qué debe incluir el contrato de préstamo privado</h2>
          <ul>
            <li><strong>Identificación completa de prestamista y prestatario</strong> (nombre, DNI, domicilio)</li>
            <li><strong>Importe exacto del préstamo</strong></li>
            <li><strong>Tipo de interés</strong> (o cero si es gratuito, expresamente indicado)</li>
            <li><strong>Plazo de devolución</strong> (fecha de vencimiento o cuotas mensuales)</li>
            <li><strong>Consecuencias del impago</strong> (vencimiento anticipado, intereses de demora)</li>
            <li><strong>Garantías</strong> si las hay (aval personal de un tercero, prenda sobre bienes)</li>
            <li><strong>Domicilio a efectos de notificaciones</strong></li>
          </ul>

          <h2>¿Necesito notario para un préstamo privado?</h2>
          <p>
            No es obligatorio para importes pequeños o medianos. El contrato privado entre particulares tiene plena validez jurídica. Sin embargo, si el préstamo supera ciertos importes o si quieres garantías adicionales como una hipoteca sobre un inmueble, sí necesitarías escritura notarial.
          </p>
          <p>
            Para importes entre 5.000 € y 100.000 € sin garantía real, el contrato privado firmado por ambas partes es suficiente y perfectamente ejecutable judicialmente.
          </p>

          <h2>Cómo reclamar si no te devuelven el dinero</h2>
          <p>
            Con contrato escrito y declaración ante la AEAT, dispones de un título que te permite:
          </p>
          <ul>
            <li>Iniciar un <strong>juicio monitorio</strong> (proceso judicial para reclamar deudas dinerarias líquidas). Rápido, económico y eficaz para impagos inferiores a 250.000 €.</li>
            <li>Si hay oposición, convertirlo en juicio ordinario o verbal según la cuantía.</li>
            <li>Solicitar embargo preventivo de bienes del deudor si hay riesgo de que desaparezcan los activos.</li>
          </ul>
          <p>
            Sin contrato escrito, demostrar el préstamo ante un juzgado es extremadamente difícil, aunque haya transferencia bancaria (el deudor puede alegar que era un regalo o pago por servicios).
          </p>
        </article>

        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Contrato de préstamo entre particulares con nota fiscal incluida</h2>
          <p className="text-gray-600 text-sm mb-5">
            Redactado por abogados especializados. Incluye orientación sobre la declaración del Modelo 600 y la tributación correcta ante la AEAT. Entrega en 48h.
          </p>
          <Link href="/gestoria/prestamo-particulares" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors inline-block">
            Solicitar contrato de préstamo — 90 €
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link href="/blog" className="text-sm text-amber-600 hover:text-amber-700 font-semibold">← Volver al blog</Link>
        </div>
      </main>
    </>
  )
}

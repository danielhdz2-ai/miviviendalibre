import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://inmonest.com'
const FECHA = '2026-04-22'

export const metadata: Metadata = {
  title: 'Contrato de alquiler 2026: qué tiene que incluir para ser válido — Inmonest',
  description:
    'La Ley de Vivienda 2023 cambió muchas reglas del alquiler. Descubre qué cláusulas son obligatorias, cuáles están prohibidas y qué pasa si tu contrato tiene errores.',
  keywords: 'contrato alquiler 2026, ley vivienda alquiler, contrato arrendamiento LAU, clausulas contrato alquiler',
  alternates: { canonical: '/blog/contrato-alquiler-vivienda-guia' },
  openGraph: {
    title: 'Contrato de alquiler 2026: guía completa y actualizada',
    description: 'Cláusulas obligatorias, prohibidas y todo lo que debe incluir un contrato de alquiler válido en 2026.',
    url: `${BASE_URL}/blog/contrato-alquiler-vivienda-guia`,
    locale: 'es_ES',
    type: 'article',
    siteName: 'Inmonest',
    publishedTime: FECHA,
  },
}

export default function ContratoAlquilerGuiaPage() {
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Contrato de alquiler 2026: qué tiene que incluir para ser válido y protegerte',
    author: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } },
    datePublished: FECHA,
    dateModified: FECHA,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/contrato-alquiler-vivienda-guia` },
  })

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: 'Contrato de alquiler 2026', item: `${BASE_URL}/blog/contrato-alquiler-vivienda-guia` },
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
            <li aria-current="page" className="text-gray-700">Contrato de alquiler 2026</li>
          </ol>
        </nav>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Alquiler</span>
            <span className="text-xs text-gray-400">8 min de lectura · 22 de abril de 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Contrato de alquiler 2026: qué tiene que incluir para ser válido y protegerte
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            La Ley de Vivienda 2023 y sus modificaciones de 2025-2026 han cambiado bastantes reglas del juego. Muchas plantillas que circulan por internet son directamente ilegales. Aquí tienes lo que realmente debe incluir un contrato de alquiler hoy.
          </p>
        </header>

        <article className="prose prose-gray max-w-none">
          <h2>¿Qué ley regula el alquiler de vivienda en España en 2026?</h2>
          <p>
            El alquiler de vivienda habitual se rige principalmente por:
          </p>
          <ul>
            <li><strong>Ley de Arrendamientos Urbanos (LAU)</strong> — Ley 29/1994, modificada en varias ocasiones.</li>
            <li><strong>Ley de Vivienda 2023</strong> — Ley 12/2023, que introduce cambios importantes en duración, renta y zonas tensionadas.</li>
            <li>Normativa autonómica específica (especialmente en Cataluña, donde el Decreto Ley de Contenció de Rendes aplica sus propias limitaciones adicionales).</li>
          </ul>

          <h2>Duración mínima: 5 años que no se pueden saltarse</h2>
          <p>
            Para personas físicas (propietarios que son particulares), la duración mínima de un contrato de alquiler de vivienda habitual es de <strong>5 años</strong>. Para personas jurídicas (sociedades que alquilan), es de <strong>7 años</strong>.
          </p>
          <p>
            Aunque el contrato ponga una duración menor (por ejemplo, 1 año), el inquilino tiene derecho legal a permanecer en la vivienda hasta los 5 años prorrogando automáticamente año a año. Cualquier cláusula que intente acortar este plazo sin causa legal es nula.
          </p>
          <p>
            <strong>Excepciones:</strong> si el propietario necesita la vivienda para uso propio o para un familiar de primer grado, puede recuperarla con preaviso de 2 meses pasado el primer año. Debe quedar recogido expresamente en el contrato.
          </p>

          <h2>Actualización de renta: los límites de 2026</h2>
          <p>
            La actualización de renta ya no es libre. En 2026, los límites son:
          </p>
          <ul>
            <li><strong>Pequeños propietarios (menos de 10 inmuebles):</strong> máximo IPC + 2 %.</li>
            <li><strong>Grandes tenedores (10 o más inmuebles):</strong> máximo el índice de referencia del INE (en 2026, ~3 %).</li>
            <li><strong>Zonas tensionadas:</strong> la renta del nuevo contrato no puede superar la del contrato anterior salvo excepciones tasadas.</li>
          </ul>
          <p>
            Una cláusula de actualización libre en un contrato firmado en 2026 es nula de pleno derecho.
          </p>

          <h2>Fianza: lo que dice la ley</h2>
          <p>
            La LAU exige como mínimo <strong>una mensualidad de renta como fianza</strong>. Esa fianza debe depositarse en el organismo autonómico correspondiente dentro del plazo legal (variable según comunidad autónoma: entre 30 y 60 días desde la firma del contrato).
          </p>
          <p>
            Además, propietario e inquilino pueden acordar garantías adicionales de hasta 2 mensualidades más, pero el <strong>total de garantías no puede superar 3 mensualidades</strong> en arrendamientos de vivienda habitual.
          </p>

          <h2>Cláusulas que son nulas aunque estén en el contrato</h2>
          <p>Estas cláusulas, aunque aparezcan escritas y firmadas, no tienen efecto legal:</p>
          <ul>
            <li>Duración inferior a 5 años sin causa legal justificada.</li>
            <li>Actualización de renta superior a los límites legales.</li>
            <li>Renuncia del inquilino a sus derechos de prórroga legal.</li>
            <li>Obligación del inquilino de pagar todos los gastos de comunidad o IBI (más allá de lo permitido).</li>
            <li>Penalizaciones por salida anticipada superiores a las previstas en la LAU.</li>
            <li>Prohibición absoluta de tener mascotas (según recientes pronunciamientos judiciales en algunas CCAA).</li>
          </ul>

          <h2>Lo que sí debe incluir obligatoriamente</h2>
          <ul>
            <li>Identificación completa de arrendador y arrendatario (nombre, DNI, domicilio)</li>
            <li>Descripción del inmueble arrendado (dirección, referencia catastral)</li>
            <li>Duración y fecha de inicio del contrato</li>
            <li>Renta mensual y fórmula de actualización</li>
            <li>Importe de la fianza y organismo donde se deposita</li>
            <li>Referencia al certificado de eficiencia energética (con nota)</li>
            <li>Inventario de mobiliario y electrodomésticos como anexo firmado</li>
          </ul>

          <h2>¿Y si estoy en zona tensionada?</h2>
          <p>
            En zonas de mercado residencial tensionado declaradas por la comunidad autónoma (parte de Cataluña, Madrid, País Vasco, etc.), aplican limitaciones adicionales: la renta del nuevo contrato no puede superar en más de un 10 % la del contrato anterior de los últimos 5 años, con excepciones para obras de mejora.
          </p>
          <p>
            Nuestros abogados conocen la normativa específica de cada CCAA y adaptan cada contrato a la regulación concreta de la ubicación del inmueble.
          </p>
        </article>

        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Contrato de alquiler actualizado a la Ley de Vivienda 2026</h2>
          <p className="text-gray-600 text-sm mb-5">
            Nuestros abogados redactan tu contrato de alquiler personalizado, adaptado a tu comunidad autónoma y a la normativa vigente en 2026. Entrega en 48h.
          </p>
          <Link href="/gestoria/contrato-alquiler" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors inline-block">
            Solicitar contrato de alquiler — 90 €
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link href="/blog" className="text-sm text-amber-600 hover:text-amber-700 font-semibold">← Volver al blog</Link>
        </div>
      </main>
    </>
  )
}

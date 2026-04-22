import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://inmonest.com'
const FECHA = '2026-04-22'

export const metadata: Metadata = {
  title: 'Cómo alquilar tu piso sin agencia en 2026: guía completa para propietarios — Inmonest',
  description:
    'Guía paso a paso para alquilar tu piso sin pagar comisión a ninguna agencia: publicar anuncio, seleccionar inquilino, redactar contrato y depositar fianza en 2026.',
  keywords: 'alquilar piso sin agencia, como alquilar piso particular, alquiler sin intermediarios, propietario alquiler',
  alternates: { canonical: '/blog/como-alquilar-piso-sin-agencia' },
  openGraph: {
    title: 'Cómo alquilar tu piso sin agencia en 2026 — Guía para propietarios',
    description: 'Todo lo que necesitas para alquilar directamente, sin pagar comisiones.',
    url: `${BASE_URL}/blog/como-alquilar-piso-sin-agencia`,
    locale: 'es_ES',
    type: 'article',
    siteName: 'Inmonest',
    publishedTime: FECHA,
  },
}

export default function ComoAlquilarSinAgenciaPage() {
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Cómo alquilar tu piso sin agencia en 2026: guía completa para propietarios',
    author: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } },
    datePublished: FECHA,
    dateModified: FECHA,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/como-alquilar-piso-sin-agencia` },
  })

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: 'Alquilar sin agencia', item: `${BASE_URL}/blog/como-alquilar-piso-sin-agencia` },
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
            <li aria-current="page" className="text-gray-700">Alquilar sin agencia</li>
          </ol>
        </nav>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Alquiler</span>
            <span className="text-xs text-gray-400">7 min de lectura · 22 de abril de 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Cómo alquilar tu piso sin agencia en 2026: guía completa para propietarios
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Alquilar sin agencia significa ahorrarte entre una y dos mensualidades de renta en honorarios. Aquí tienes todo el proceso, paso a paso, sin saltar ningún detalle legal importante.
          </p>
        </header>

        <article className="prose prose-gray max-w-none">
          <h2>¿Cuánto me ahorro al alquilar sin agencia?</h2>
          <p>
            Las agencias inmobiliarias cobran habitualmente una mensualidad de renta (a veces más) para gestionar el alquiler de un propietario. En un piso con renta de 1.000 €/mes, estás pagando entre 1.000 € y 1.200 € en honorarios. Alquilar directamente es perfectamente legal y cada vez más habitual gracias a portales como Inmonest, donde solo publican propietarios particulares.
          </p>

          <h2>Paso 1 — Prepara la documentación previa</h2>
          <p>Antes de publicar el anuncio, ten listos estos documentos:</p>
          <ul>
            <li><strong>Certificado de eficiencia energética</strong> (obligatorio desde 2013, necesitas un técnico que lo emita). Sin él, el contrato puede ser nulo.</li>
            <li><strong>Cédula de habitabilidad</strong> (exigida en Cataluña, Valencia, Navarra y Murcia; en el resto de España, el certificado energético la sustituye).</li>
            <li><strong>Nota simple registral</strong> del inmueble (se pide online al Registro de la Propiedad por 9 €).</li>
            <li><strong>Último recibo del IBI</strong> (el inquilino puede pedírtelo para verificar la propiedad).</li>
          </ul>

          <h2>Paso 2 — Fija el precio correcto</h2>
          <p>
            El error más frecuente de los propietarios que alquilan solos es salir al mercado con un precio incorrecto: demasiado alto generará meses vacíos (cada mes vacío a 1.000 € es lo mismo que bajar el precio toda la temporada), y demasiado bajo dejará dinero encima de la mesa.
          </p>
          <p>
            Consulta los precios reales de pisos similares en tu zona en Inmonest, no el precio de publicación de otras plataformas (suelen estar inflados un 10-15 % respecto al precio de cierre real). Si tienes dudas, puedes solicitar una valoración orientativa a través de nuestro portal.
          </p>
          <p>
            Recuerda también que la <strong>Ley de Vivienda 2023</strong> establece índices de referencia de precios en zonas tensionadas. Si tu municipio está declarado zona tensionada (muchos barrios de Barcelona, Madrid, Cataluña y grandes ciudades), hay límites legales a lo que puedes cobrar.
          </p>

          <h2>Paso 3 — Publica el anuncio con garantías</h2>
          <p>Un buen anuncio tiene:</p>
          <ul>
            <li>Al menos 8-12 fotos de calidad (natural, habitaciones ordenadas, luz abierta)</li>
            <li>Descripción precisa: superficie, habitaciones, planta, ascensor, calefacción, extras</li>
            <li>Precio visible (ocultar el precio reduce un 40 % las consultas)</li>
            <li>Datos de contacto directo sin intermediarios</li>
          </ul>
          <p>
            En Inmonest puedes publicar gratis y llegar a inquilinos verificados que buscan alquiler directo de propietarios. Nuestra IA filtra los anuncios de agencias disfrazadas de particulares.
          </p>

          <h2>Paso 4 — Selecciona al inquilino correctamente</h2>
          <p>Esta es la fase más crítica para evitar impagos futuros. Pide siempre:</p>
          <ul>
            <li>Últimas 3 nóminas o declaración de IRPF del último año</li>
            <li>Contrato de trabajo (indefinido vs. temporal cambia el riesgo)</li>
            <li>DNI o NIE en vigor</li>
            <li>Referencias del anterior propietario (si las tiene)</li>
          </ul>
          <p>
            La regla general de solvencia es que el inquilino dedique <strong>como máximo el 30-35 % de sus ingresos netos mensuales</strong> a la renta. Por encima de ese porcentaje el riesgo de impago aumenta significativamente.
          </p>

          <h2>Paso 5 — Redacta un contrato legal, no una plantilla de internet</h2>
          <p>
            El contrato de alquiler de vivienda habitual está regulado por la <strong>LAU (Ley de Arrendamientos Urbanos)</strong> y la <strong>Ley de Vivienda 2023</strong>. Muchas plantillas gratuitas que circulan por internet incluyen cláusulas que ya son ilegales (por ejemplo, actualización de renta libre, duración inferior a 5 años sin causa justificada, o penalizaciones por salida anticipada superiores a las permitidas).
          </p>
          <p>
            Un contrato mal redactado puede declararse nulo o permitir al inquilino exigir condiciones que no tenías previstas. Recomendamos usar un contrato redactado por abogados especializados que esté actualizado a la normativa 2026.
          </p>

          <h2>Paso 6 — Fianza y garantías adicionales</h2>
          <p>
            La <strong>LAU obliga a depositar una mensualidad de fianza</strong> como mínimo. Esa fianza debe ingresarse en el organismo autonómico correspondiente (Incasol en Cataluña, IVIMA en Madrid, etc.) dentro del plazo que marca cada comunidad autónoma. Si no la depositas, puedes ser sancionado.
          </p>
          <p>
            Además de la fianza legal, puedes pedir garantías adicionales de hasta 2 mensualidades más (aval bancario, fianza adicional), aunque la LAU limita el total a 3 mensualidades para arrendamientos de vivienda habitual.
          </p>

          <h2>Paso 7 — Inventario del inmueble antes de la entrega</h2>
          <p>
            Antes de entregar las llaves, haz un inventario fotográfico y escrito del estado del piso: electrodomésticos, muebles, paredes, suelos, ventanas, contadores. Adjúntalo como anexo al contrato firmado por ambas partes. Este documento es tu única protección real si al final del contrato hay desacuerdo sobre la fianza.
          </p>
        </article>

        {/* CTA */}
        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Publica tu anuncio y redacta el contrato con Inmonest</h2>
          <p className="text-gray-600 text-sm mb-5">
            Publicación gratuita sin intermediarios y contratos de alquiler redactados por abogados especializados. Todo en un solo lugar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/publicar-anuncio" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Publicar anuncio gratis
            </Link>
            <Link href="/gestoria/contrato-alquiler" className="border border-amber-400 text-amber-700 hover:bg-amber-50 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Contrato de alquiler LAU — 90 €
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

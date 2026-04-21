import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://inmonest.com'
const FECHA_PUBLICACION = '2026-04-21'

export const metadata: Metadata = {
  title: 'Vender tu piso sin comisiones: guía completa para propietarios 2026',
  description:
    'Aprende a vender tu piso sin pagar comisiones a agencias inmobiliarias en 2026. Guía paso a paso: documentación, precio, anuncio y negociación sin intermediarios.',
  keywords:
    'vender piso sin comisiones, vender piso sin agencia, vender piso particular, cómo vender un piso, guía venta piso 2026',
  alternates: { canonical: '/blog/vender-piso-sin-comisiones' },
  openGraph: {
    title: 'Vender tu piso sin comisiones: guía completa para propietarios 2026',
    description:
      'Aprende a vender tu piso sin pagar comisiones a agencias inmobiliarias en 2026. Guía paso a paso para propietarios.',
    url: `${BASE_URL}/blog/vender-piso-sin-comisiones`,
    locale: 'es_ES',
    type: 'article',
    siteName: 'Inmonest',
    publishedTime: FECHA_PUBLICACION,
  },
}

export default function VenderPisoSinComisionesPage() {
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Vender tu piso sin comisiones: guía completa para propietarios 2026',
    description:
      'Aprende a vender tu piso sin pagar comisiones a agencias inmobiliarias en 2026. Guía paso a paso: documentación, precio, anuncio y negociación sin intermediarios.',
    author: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Inmonest',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
    },
    datePublished: FECHA_PUBLICACION,
    dateModified: FECHA_PUBLICACION,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/vender-piso-sin-comisiones`,
    },
  })

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Vender tu piso sin comisiones',
        item: `${BASE_URL}/blog/vender-piso-sin-comisiones`,
      },
    ],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbSchema }} />

      <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
        {/* Breadcrumb */}
        <nav aria-label="Navegación de migas de pan" className="text-sm text-gray-500 mb-8">
          <ol className="flex flex-wrap gap-1">
            <li><Link href="/" className="hover:underline">Inicio</Link></li>
            <li aria-hidden="true" className="mx-1">/</li>
            <li><span>Blog</span></li>
            <li aria-hidden="true" className="mx-1">/</li>
            <li aria-current="page"><span className="text-gray-700">Vender sin comisiones</span></li>
          </ol>
        </nav>

        {/* Cabecera */}
        <header className="mb-10">
          <p className="text-sm text-amber-600 font-semibold uppercase tracking-wide mb-2">
            Guía para propietarios · Abril 2026
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
            Vender tu piso sin comisiones: guía completa para propietarios 2026
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Cada año, miles de propietarios pagan entre el 3% y el 6% del precio de venta de su vivienda
            en comisiones a agencias inmobiliarias. En un piso de 250.000 €, eso son entre <strong>7.500 € y 15.000 €</strong>{' '}
            que podrías ahorrarte. Esta guía te explica exactamente cómo hacerlo.
          </p>
          <time className="block mt-4 text-sm text-gray-400" dateTime={FECHA_PUBLICACION}>
            Publicado el 21 de abril de 2026
          </time>
        </header>

        <article className="prose prose-gray max-w-none space-y-8">

          {/* Sección 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              ¿Por qué las inmobiliarias cobran comisiones?
            </h2>
            <p>
              Las agencias inmobiliarias justifican sus honorarios en los servicios que ofrecen: fotografía profesional,
              home staging, gestión de visitas, negociación con compradores y asesoramiento jurídico. En el mercado
              español, la comisión estándar oscila entre el 3% y el 5% del precio de venta, aunque en ciudades como
              Madrid o Barcelona puede llegar al 6%.
            </p>
            <p>
              El problema es que estos servicios <strong>no siempre están alineados con tu interés como propietario</strong>.
              Una agencia cobra lo mismo si vende tu piso en dos semanas que si tarda seis meses. Su incentivo es cerrar
              la operación, no necesariamente al mejor precio posible para ti.
            </p>
            <p>
              Además, en muchos casos la comisión se paga doble: comprador y vendedor, cada uno a su agencia respectiva.
              Esta práctica, habitual en operaciones intermediadas, puede añadir entre un 5% y un 10% al coste total de
              la transacción, lo que en la práctica encarece artificialmente el precio de mercado.
            </p>
            <p>
              La buena noticia es que <strong>Internet ha democratizado completamente el acceso a compradores</strong>.
              Las mismas herramientas que usan las agencias están disponibles para cualquier particular: fotografía
              de calidad con un smartphone moderno, redacción asistida por IA, y plataformas como Inmonest que
              agregan a compradores reales sin intermediarios.
            </p>
          </section>

          {/* Sección 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Cómo funciona Inmonest
            </h2>
            <p>
              Inmonest es un portal inmobiliario español pensado exclusivamente para conectar propietarios
              particulares con compradores e inquilinos reales, sin la intervención de agencias. A diferencia
              de otros portales generalistas, <strong>todos los anuncios en Inmonest son verificados</strong> para
              confirmar que provienen de propietarios directos.
            </p>
            <p>
              El funcionamiento es sencillo:
            </p>
            <ol className="list-decimal pl-6 space-y-2 my-4">
              <li>
                <strong>Publicar es gratuito.</strong> Cualquier propietario puede crear su anuncio sin coste.
                Incluye hasta 20 fotos, descripción completa, precio y datos de contacto.
              </li>
              <li>
                <strong>Verificación automática por IA.</strong> Nuestro sistema analiza el texto de cada anuncio
                para detectar si proviene de una agencia disfrazada de particular. Más de 70 señales textuales
                se comprueban en tiempo real.
              </li>
              <li>
                <strong>Visibilidad opcional.</strong> Si quieres destacar tu anuncio, puedes activar el modo
                Turbo para aparecer en los primeros resultados durante los días más competitivos.
              </li>
              <li>
                <strong>Contacto directo.</strong> Los compradores o inquilinos contactan directamente contigo.
                Sin formularios de agencia, sin intermediarios, sin comisiones.
              </li>
            </ol>
            <p>
              Para los propietarios que necesiten apoyo jurídico, Inmonest ofrece{' '}
              <Link href="/gestoria" className="text-amber-600 hover:underline font-medium">
                servicios de gestoría online
              </Link>{' '}
              para contratos de arras, notas simples y asesoramiento legal a precios fijos muy por debajo del
              coste de una agencia convencional.
            </p>
          </section>

          {/* Sección 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Pasos para vender tu piso sin agencia
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              1. Prepara la documentación desde el primer día
            </h3>
            <p>
              Antes de publicar tu anuncio, reúne los documentos esenciales: título de propiedad o escritura de compraventa,
              nota simple del Registro de la Propiedad (solicítala online en menos de 24h por 9,02 €), certificado
              energético (obligatorio para vender en España), último recibo del IBI, y si hay hipoteca, el certificado
              de deuda pendiente de tu banco.
            </p>
            <p>
              Tener esta documentación lista desde el inicio transmite seriedad a los compradores y acelera el proceso
              cuando llegue la oferta.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              2. Fija el precio con datos reales
            </h3>
            <p>
              Evita el error más común: fijar el precio basándote en el precio de anuncios similares, no en el precio
              real al que se venden. Hay una diferencia media del 8-12% entre precio de publicación y precio de cierre.
              Usa el portal del Ministerio de Vivienda o el índice de precios de transacciones del Catastro para
              obtener valores reales de compraventas en tu zona.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              3. Haz fotos que vendan el espacio
            </h3>
            <p>
              No necesitas un fotógrafo profesional, pero sí necesitas luz natural, orden total y un gran angular.
              Fotografía todas las estancias en horizontal, a la altura de la cadera. La foto de portada debe ser
              la más luminosa o la de mayor amplitud visual. Evita fotos nocturnas o con objetos personales visibles.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              4. Redacta un anuncio honesto y detallado
            </h3>
            <p>
              Un buen anuncio describe primero lo objetivo (metros, habitaciones, planta, ascensor, orientación) y
              después lo subjetivo (el barrio, la luz, la tranquilidad). Sé específico: "cocina reformada en 2022 con
              electrodomésticos Bosch" vende más que "cocina moderna". Indica también gastos de comunidad, IBI anual y
              si acepta financiación bancaria.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              5. Gestiona las visitas y la negociación
            </h3>
            <p>
              Agrupa las visitas en bloques de tiempo (sábado por la mañana, por ejemplo) para generar sensación de
              demanda. Ante una oferta, no aceptes ni rechaces en el momento: pide tiempo para valorarla. Si recibes
              varias ofertas, puedes pedir a los interesados su "mejor oferta final". Cuando haya acuerdo, formaliza
              con un contrato de arras penitenciales (señal del 10% del precio).
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              6. Cierra la operación con seguridad jurídica
            </h3>
            <p>
              La escritura pública de compraventa debe firmarse ante notario. El notario lo elige el comprador si
              paga con hipoteca, o por acuerdo mutuo si es operación al contado. Los gastos de notaría los suele
              pagar el comprador; el vendedor paga el impuesto de plusvalía municipal y la parte proporcional del IBI.
              Si necesitas asesoramiento para esta fase, nuestro{' '}
              <Link href="/gestoria" className="text-amber-600 hover:underline font-medium">
                servicio de gestoría
              </Link>{' '}
              puede acompañarte.
            </p>
          </section>

          {/* Sección 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Errores comunes al vender por tu cuenta
            </h2>

            <ul className="space-y-4 my-4">
              <li>
                <strong>Precio demasiado alto desde el inicio.</strong> El primer mes de publicación concentra el
                80% del interés. Si el precio es excesivo, los compradores activos lo descartan y después es muy
                difícil recuperar la tracción, aunque bajes el precio.
              </li>
              <li>
                <strong>No verificar la solvencia del comprador.</strong> Antes de firmar arras, pide una
                pre-aprobación bancaria o un extracto de cuenta que acredite la capacidad de pago. Evitarás
                perder meses con un comprador que finalmente no obtiene financiación.
              </li>
              <li>
                <strong>Descargas de visitas mal cualificadas.</strong> Responde siempre por escrito a los
                interesados antes de la visita. Pregunta su situación (si tienen piso que vender, si tienen
                hipoteca pre-aprobada, cuándo quieren mudarse). Filtra así a curiosos y vitrineadores.
              </li>
              <li>
                <strong>No declarar cargas o defectos conocidos.</strong> Ocultar una derrama pendiente, una
                comunidad conflictiva o humedades puede derivar en reclamaciones post-venta e incluso en la
                nulidad del contrato. La transparencia protege al vendedor.
              </li>
              <li>
                <strong>Ignorar el impacto fiscal.</strong> La ganancia patrimonial por la venta tributa en el
                IRPF entre el 19% y el 28% dependiendo del importe. Si vendes tu vivienda habitual y reinviertes
                en otra vivienda habitual en los dos años siguientes, puedes aplicar la exención por reinversión.
                Consulta a un gestor antes de cerrar la operación.
              </li>
            </ul>
          </section>

          {/* Sección 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Verificación por IA: tu piso es real
            </h2>
            <p>
              Uno de los mayores problemas de los portales inmobiliarios generalistas es que mezclan anuncios de
              particulares con anuncios de agencias, a veces sin diferenciación clara. En Inmonest, cada anuncio
              pasa por un sistema de verificación basado en inteligencia artificial que analiza más de 70 señales
              textuales para confirmar que el anunciante es un propietario directo.
            </p>
            <p>
              El sistema detecta patrones habituales de agencias: fórmulas como "en exclusiva", términos corporativos,
              emails de empresa o referencias a "nuestra cartera de inmuebles". Si un anuncio supera el umbral de
              sospecha, se marca automáticamente para revisión manual antes de publicarse.
            </p>
            <p>
              Esto significa que, como comprador, cada anuncio que ves en Inmonest corresponde a un propietario real
              al que puedes contactar directamente. Y como propietario, <strong>tu anuncio compite en igualdad de condiciones
              con el mercado, sin que agencias con presupuesto publicitario superior oculten tu vivienda</strong>.
            </p>
            <p>
              Esta verificación es parte del compromiso de Inmonest con la transparencia inmobiliaria: un mercado
              donde compradores y vendedores se encuentran sin barreras artificiales ni comisiones encubiertas.
            </p>
          </section>

          {/* CTA final */}
          <section className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              ¿Listo para vender tu piso sin comisiones?
            </h2>
            <p className="text-gray-600 mb-6">
              Publica tu anuncio gratis en Inmonest y llega a miles de compradores reales en tu zona.
              Sin intermediarios. Sin comisiones. Con verificación IA incluida.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/vender-casa"
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Publicar mi anuncio gratis
              </Link>
              <Link
                href="/gestoria"
                className="bg-white hover:bg-gray-50 text-gray-800 font-semibold px-6 py-3 rounded-xl border border-gray-200 transition-colors"
              >
                Ver servicios de gestoría
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              ¿Eres agencia y quieres colaborar?{' '}
              <Link href="/agencias" className="text-amber-600 hover:underline">
                Conoce nuestro programa para agencias
              </Link>
            </p>
          </section>
        </article>
      </main>
    </>
  )
}

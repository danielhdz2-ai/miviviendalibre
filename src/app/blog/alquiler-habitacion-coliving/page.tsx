import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://inmonest.com'
const FECHA = '2026-04-22'

export const metadata: Metadata = {
  title: 'Alquilar una habitación en 2026: contrato, fianza y derechos del propietario — Inmonest',
  description:
    'El alquiler de habitaciones no lo cubre la LAU. Aprende qué ley aplica, cómo protegerte como propietario, qué normas puedes exigir y cómo recuperar la habitación.',
  keywords: 'alquiler habitacion contrato, alquiler habitacion coliving, contrato habitacion piso compartido, arrendamiento habitacion',
  alternates: { canonical: '/blog/alquiler-habitacion-coliving' },
  openGraph: {
    title: 'Alquilar una habitación: contrato, fianza y derechos en 2026',
    description: 'Todo lo que necesitas saber si alquilas habitaciones en un piso compartido.',
    url: `${BASE_URL}/blog/alquiler-habitacion-coliving`,
    locale: 'es_ES',
    type: 'article',
    siteName: 'Inmonest',
    publishedTime: FECHA,
  },
}

export default function AlquilerHabitacionColivingPage() {
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Alquilar una habitación en 2026: contrato, fianza y derechos del propietario',
    author: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Inmonest', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } },
    datePublished: FECHA,
    dateModified: FECHA,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/alquiler-habitacion-coliving` },
  })

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: 'Alquiler de habitación', item: `${BASE_URL}/blog/alquiler-habitacion-coliving` },
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
            <li aria-current="page" className="text-gray-700">Alquiler de habitación</li>
          </ol>
        </nav>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Alquiler</span>
            <span className="text-xs text-gray-400">5 min de lectura · 22 de abril de 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Alquilar una habitación en 2026: contrato, fianza y derechos del propietario
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            El alquiler de habitaciones es uno de los negocios más frecuentes entre propietarios que viven en pisos grandes o invierten en coliving. Pero muchos lo hacen sin contrato escrito, exponiéndose a problemas graves. Aquí tienes todo lo que necesitas saber.
          </p>
        </header>

        <article className="prose prose-gray max-w-none">
          <h2>¿La LAU protege el alquiler de habitaciones?</h2>
          <p>
            No directamente. La Ley de Arrendamientos Urbanos (LAU) regula el arrendamiento de la <strong>vivienda completa</strong> como residencia habitual. El alquiler de una habitación dentro de una vivienda (donde el arrendador también reside o donde ya hay más inquilinos) no encaja en ese régimen y se rige por el <strong>Código Civil</strong> (artículos 1542 y siguientes sobre arrendamientos de cosas).
          </p>
          <p>
            Esto significa más libertad de pactos entre las partes, pero también más vulnerabilidad si no hay contrato escrito: el Código Civil es mucho más escueto en derechos y protecciones que la LAU.
          </p>

          <h2>¿Qué debe incluir el contrato de alquiler de habitación?</h2>
          <p>Un contrato de habitación bien redactado debe regular al menos:</p>
          <ul>
            <li><strong>Identificación de las partes</strong> (propietario e inquilino con DNI/NIE)</li>
            <li><strong>Descripción de la habitación</strong> y las zonas comunes a las que tiene acceso</li>
            <li><strong>Renta mensual</strong> y fecha de pago</li>
            <li><strong>Fianza</strong> y condiciones de devolución</li>
            <li><strong>Duración y prórrogas</strong> (sin los mínimos de la LAU, puedes acordar cualquier plazo)</li>
            <li><strong>Normas de convivencia</strong>: uso de cocina, baño, horarios de silencio, visitas, mascotas</li>
            <li><strong>Condiciones de salida anticipada</strong> (preaviso mínimo, penalización si procede)</li>
            <li><strong>Estado inicial de la habitación</strong> como anexo fotográfico</li>
          </ul>

          <h2>¿Puedo pedir fianza por una habitación?</h2>
          <p>
            Sí, aunque no es obligatorio legalmente (la LAU no aplica aquí), es muy recomendable. Lo habitual es pedir <strong>una mensualidad de renta como fianza</strong>. Incluye en el contrato el plazo máximo para devolvería (habitualmente 30 días desde la entrega de llaves) y las condiciones en que puedes retenerla (daños, facturas pendientes, renta impagada).
          </p>

          <h2>Normas de convivencia: ¿qué puedo exigir legalmente?</h2>
          <p>
            Al no estar sometido a la LAU, tienes mucha más libertad para pactar normas de convivencia. Puedes incluir en el contrato:
          </p>
          <ul>
            <li>Horarios máximos de música y ruido</li>
            <li>Restricción de visitas nocturnas</li>
            <li>Prohibición de fumar en la vivienda</li>
            <li>Normas de limpieza de zonas comunes</li>
            <li>Política de mascotas</li>
            <li>Límite de uso de wifi y suministros incluidos</li>
          </ul>
          <p>
            Todo lo que quede escrito y firmado en el contrato es exigible. Lo que no se pacte por escrito es difícilmente reclamable después.
          </p>

          <h2>¿Qué pasa si el inquilino no paga o no se va?</h2>
          <p>
            Sin contrato escrito, el proceso de desahucio o reclamación de impago es complicado porque es muy difícil demostrar las condiciones pactadas. Con contrato firmado, tienes título jurídico para iniciar un procedimiento monitorio (reclamación de impago) o de desahucio, según el caso.
          </p>
          <p>
            En los contratos regidos por el Código Civil (como el de habitación), el desahucio puede tramitarse con relativa agilidad si hay documento firmado que acredite el incumplimiento.
          </p>

          <h2>Coliving: ¿necesito varios contratos?</h2>
          <p>
            Sí. Si tienes un piso con 4 habitaciones alquiladas a 4 personas distintas, lo correcto es tener <strong>un contrato independiente por habitación</strong>. Cada contrato regula la relación con ese inquilino de forma individual, lo que te permite gestionar entradas y salidas de forma independiente sin que un inquilino afecte al contrato de los demás.
          </p>
        </article>

        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Contrato de alquiler de habitación redactado por abogados</h2>
          <p className="text-gray-600 text-sm mb-5">
            Personalizado con tus normas de convivencia, fianza y condiciones de salida. Entrega en 48h. PDF firmable digitalmente.
          </p>
          <Link href="/gestoria/alquiler-habitaciones" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors inline-block">
            Solicitar contrato de habitación — 100 €
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link href="/blog" className="text-sm text-amber-600 hover:text-amber-700 font-semibold">← Volver al blog</Link>
        </div>
      </main>
    </>
  )
}

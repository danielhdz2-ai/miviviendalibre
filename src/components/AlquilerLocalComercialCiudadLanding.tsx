import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/NavbarServer'
import JsonLd from '@/components/JsonLd'
import GestoriaLandingExtras from '@/components/GestoriaLandingExtras'
import GestoriaPanelShowcase from '@/components/GestoriaPanelShowcase'
import GestoriaBlindajeOperacion from '@/components/GestoriaBlindajeOperacion'
import ComoTrabajamosGestoria from '@/components/ComoTrabajamosGestoria'
import { GestoriaCheckIcon } from '@/components/ui/GestoriaCheckIcon'
import { RELACIONADOS_LOCAL_COMERCIAL } from '@/lib/gestoria-relacionados'
import WhatsAppButton from '@/components/WhatsAppButton'
import type { AlquilerLocalComercialCiudadConfig } from '@/lib/alquiler-local-comercial-ciudad-data'
import {
  ALQUILER_LOCAL_CIUDADES_LIST,
} from '@/lib/alquiler-local-comercial-ciudad-data'
import {
  ALQUILER_LOCAL_COMERCIAL_PRECIO,
  LOCAL_COMERCIAL_BASES_LEGALES,
  LOCAL_COMERCIAL_COMPARATIVA,
  LOCAL_COMERCIAL_INCLUYE,
  LOCAL_COMERCIAL_PARA_QUIEN_BASE,
  LOCAL_COMERCIAL_PASOS,
  mercadoTradicionalMax,
  mercadoTradicionalMin,
  ahorroVsMercadoTradicional,
} from '@/lib/alquiler-local-comercial-servicio-content'
import { GestoriaCtaBanner } from '@/components/ui/GestoriaImageBanner'
import { getCiudadCtaImage } from '@/lib/gestoria-images'
import { ORGANIZATION_SCHEMA_ID } from '@/lib/organization-schema'
import { precioLabel } from '@/lib/gestoria-precios-ui'
import { getAlquilerLocalEnriquecimiento } from '@/lib/alquiler-local-comercial-ciudad-enriquecimiento'

const BASE_URL = 'https://inmonest.com'
const SOLICITAR_URL = '/gestoria/solicitar/alquiler-local-comercial'
const SERVICIO_SLUG = 'alquiler-local-comercial'

const FAQ_BASE = [
  {
    q: '¿Cuánto cuesta el contrato de alquiler de local comercial?',
    a: `${ALQUILER_LOCAL_COMERCIAL_PRECIO}€ IVA incluido. Tarifa plana por contrato LAU empresarial personalizado, redacción jurídica y asesoramiento de un gestor inmobiliario experto. Entrega en 48 horas laborables.`,
  },
  {
    q: '¿Es lo mismo que un contrato de alquiler de vivienda?',
    a: 'No. Los locales comerciales se rigen por el Título III de la LAU (uso distinto de vivienda). No tienen las prórrogas obligatorias del alquiler de vivienda y la libertad de pactos es mayor — por eso un contrato genérico es especialmente arriesgado.',
  },
  {
    q: '¿Puedo regular el traspaso de negocio en el contrato?',
    a: 'Sí. El contrato puede limitar, condicionar o prohibir el traspaso, regular el derecho de tanteo del propietario y fijar qué ocurre con las obras realizadas por el arrendatario.',
  },
  {
    q: '¿Debo inscribir el contrato en el Registro de la Propiedad?',
    a: 'Si la renta anual supera 9.000 €, la inscripción es obligatoria. Tu gestor te indica si aplica a tu caso y qué documentación necesitas.',
  },
  {
    q: '¿El gestor me acompaña después de entregar el contrato?',
    a: 'Sí. Antes de la firma resolvemos todas tus dudas. Si surge una incidencia durante el arrendamiento, puedes consultarnos para saber cómo actuar conforme al contrato y la ley.',
  },
] as const

type Props = {
  config: AlquilerLocalComercialCiudadConfig
}

export default function AlquilerLocalComercialCiudadLanding({ config }: Props) {
  const { nombre, slug, region } = config
  const local = getAlquilerLocalEnriquecimiento(slug)
  const tradicionalMin = mercadoTradicionalMin()
  const tradicionalMax = mercadoTradicionalMax()
  const ahorroMin = ahorroVsMercadoTradicional()
  const paraQuien = [...LOCAL_COMERCIAL_PARA_QUIEN_BASE, ...config.paraQuienExtra]
  const faq = [...FAQ_BASE, ...config.faqExtra]
  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Contrato de Alquiler de Local Comercial en ${nombre}`,
    description: `Redacción profesional de contratos LAU empresariales para particulares en ${nombre}. Gestor experto y entrega en 48h.`,
    areaServed: {
      '@type': 'City',
      name: nombre,
      containedIn: { '@type': 'Country', name: 'España' },
    },
    provider: { '@id': ORGANIZATION_SCHEMA_ID },
    offers: {
      '@type': 'Offer',
      price: String(ALQUILER_LOCAL_COMERCIAL_PRECIO),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2026-12-31',
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Gestoría', item: `${BASE_URL}/gestoria` },
      { '@type': 'ListItem', position: 3, name: 'Alquiler Local Comercial', item: `${BASE_URL}/gestoria/alquiler-local-comercial` },
      { '@type': 'ListItem', position: 4, name: nombre, item: `${BASE_URL}/gestoria/alquiler-local-comercial/${slug}` },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <JsonLd schema={[schemaJson, breadcrumbSchema, faqSchema]} />
      <Navbar />
      <WhatsAppButton />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-100 py-16 px-4 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
            <Link href="/" className="hover:text-gold-500">Inicio</Link>
            <span>/</span>
            <Link href="/gestoria" className="hover:text-gold-500">Gestoría</Link>
            <span>/</span>
            <Link href="/gestoria/alquiler-local-comercial" className="hover:text-gold-500">Local Comercial</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{nombre}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-gold-700 bg-cream-100 border border-gold-300 px-3 py-1 rounded-full mb-4">
                Particulares · LAU empresarial · {region}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {local?.heroH1 ?? (
                  <>
                    Contrato alquiler local comercial en <span className="text-gold-500">{nombre}</span>
                  </>
                )}
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {local?.heroLead ?? (
                  <>
                    ¿Alquilas o arriendas un local en {nombre}? Inmonest está diseñado para{' '}
                    <strong className="text-gray-900">particulares</strong> que quieren formalizar su operación
                    con la mayor garantía y seriedad — sin pagar comisión de agencia. Un{' '}
                    <strong>gestor inmobiliario experto</strong> redacta tu contrato LAU empresarial: tanteo, obras,
                    traspaso y renta.{' '}
                    <strong className="text-gray-900">{ALQUILER_LOCAL_COMERCIAL_PRECIO}€ IVA incluido.</strong>
                  </>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href={SOLICITAR_URL}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gold-500 text-white font-semibold hover:bg-gold-600 transition-colors"
                >
                  Contratar — {ALQUILER_LOCAL_COMERCIAL_PRECIO}€ IVA incluido
                </Link>
                <a
                  href="#gestor-local"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-lg border-2 border-gray-300 text-gray-800 font-semibold hover:border-gold-500 hover:text-gold-700 transition-colors"
                >
                  Hablar con tu gestor
                </a>
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><GestoriaCheckIcon className="text-gold-500" /> Gestor en 24h</li>
                <li className="flex items-center gap-2"><GestoriaCheckIcon className="text-gold-500" /> Entrega en 48h</li>
                <li className="flex items-center gap-2"><GestoriaCheckIcon className="text-gold-500" /> 0% comisión agencia</li>
              </ul>
              <p className="mt-4 text-sm text-gray-500">
                {config.localesGestionados} locales comerciales gestionados en {nombre} · Renta media orientativa{' '}
                {config.rentaEjemploMensual.toLocaleString('es-ES')}€/mes
              </p>
            </div>
            <div className="relative h-72 md:h-96 rounded-xl overflow-hidden shadow-lg">
              <Image
                src={config.heroImage}
                alt={`Contrato alquiler local comercial ${nombre}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <GestoriaPanelShowcase
        servicioLabel={`alquiler de local comercial en ${nombre}`}
        ciudadNombre={nombre}
        panelServicio="Alquiler local comercial LAU"
        clausulas={
          local?.panelClausulas ?? [
            {
              titulo: 'Actividad y licencia municipal',
              estado: 'Revisada',
              nota: `Uso comercial compatible con licencia en ${nombre}. Cláusula suspensiva si no se obtiene apertura.`,
            },
            {
              titulo: 'Derecho de tanteo y retracto',
              estado: 'Asesorada',
              nota: 'Plazos y notificación ante venta del local explicados al propietario.',
            },
            {
              titulo: 'Obras, IBI y traspaso',
              estado: 'Ajustada',
              nota: `Reparto de mejoras y traspaso pactados por escrito en ${nombre}.`,
            },
          ]
        }
      />

      {/* Presentación Inmonest + mercado local */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-3 text-center">
            Gestoría inmobiliaria para particulares
          </p>
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {local?.inmonestTitulo ?? 'Inmonest: trámites de particular con garantía profesional'}
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">{config.mercadoIntro}</p>
          <p className="text-gray-600 leading-relaxed">
            {local?.inmonestParrafoExtra ?? (
              <>
                Cuando contratas, se te asigna un <strong className="text-gray-900">gestor inmobiliario dedicado</strong>{' '}
                que conoce el mercado de {nombre}, te explica el Título III LAU, qué cláusulas necesitas según tu
                actividad y cómo protegerte ante impagos, obras no amortizadas o traspasos no autorizados.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Blindaje + Por qué contratar */}
      <section className="py-16 px-4 bg-slate-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto">
          <GestoriaBlindajeOperacion servicioSlug={SERVICIO_SLUG} />
        </div>
      </section>

      {/* Bases legales */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            {local?.basesLegalesTitulo ?? 'Bases legales del alquiler de local comercial'}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {local?.basesLegalesIntro ?? (
              <>En {nombre} el marco es el Título III LAU. Tu gestor adapta el contrato a la normativa estatal y a las particularidades del mercado local.</>
            )}
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {(local?.basesLegalesLocal ?? LOCAL_COMERCIAL_BASES_LEGALES).map((block) => (
              <div key={block.titulo} className="bg-slate-50 p-8 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{block.titulo}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qué incluye */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Qué incluye el contrato ({ALQUILER_LOCAL_COMERCIAL_PRECIO}€)
          </h2>
          <ul className="grid md:grid-cols-2 gap-3 max-w-4xl mx-auto">
            {LOCAL_COMERCIAL_INCLUYE.map((item) => (
              <li key={item} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100 text-sm text-gray-700">
                <GestoriaCheckIcon className="mt-0.5 text-gold-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cómo trabajamos — pasos detallados */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Cómo trabajamos contigo en {nombre}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Desde la primera consulta hasta la entrega del PDF firmable. Atención personalizada en cada fase.
          </p>
          <div className="grid md:grid-cols-5 gap-6">
            {(local?.pasosLocal ?? LOCAL_COMERCIAL_PASOS).map((paso) => (
              <div key={paso.num} className="text-center">
                <div className="w-12 h-12 bg-forest-800 text-gold-500 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {paso.num}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug">{paso.titulo}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo trabajamos — contacto gestor */}
      <section className="py-16 px-4 bg-cream-50 border-y border-gold-300/30">
        <div className="max-w-6xl mx-auto">
          <ComoTrabajamosGestoria servicioSlug={SERVICIO_SLUG} servicioNombre="Alquiler de Local Comercial" />
        </div>
      </section>

      {/* Tabla ahorro */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Cuánto ahorras en {nombre}
          </h2>
          {local?.comparativaIntro && (
            <p className="text-center text-gray-600 mb-6 max-w-2xl mx-auto text-sm leading-relaxed">
              {local.comparativaIntro}
            </p>
          )}
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 text-left font-semibold">Opción</th>
                  <th className="p-4 text-center font-semibold text-gold-700">Inmonest</th>
                  <th className="p-4 text-center font-semibold text-gray-500">Plantilla / sin gestoría</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">Contrato local comercial ({nombre})</td>
                  <td className="p-4 text-center font-bold text-green-700">{ALQUILER_LOCAL_COMERCIAL_PRECIO}€</td>
                  <td className="p-4 text-center text-red-600 line-through">
                    {tradicionalMin}–{tradicionalMax}€
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Tu ahorro estimado</td>
                  <td className="p-4 text-center font-bold text-gold-700" colSpan={2}>
                    Hasta {ahorroMin}€ frente a gestoría tradicional · 0€ comisión de agencia
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Renta orientativa en {nombre}: {config.rentaEjemploMensual.toLocaleString('es-ES')}€/mes.
            Un conflicto por traspaso o impago puede costar 3.000–8.000€ en gestoría externa y meses sin cobrar renta.
          </p>
        </div>
      </section>

      {/* Comparativa */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Alquilar local con Inmonest vs. por tu cuenta
          </h2>
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 text-left">Aspecto</th>
                  <th className="p-4 text-center text-gold-700">Con Inmonest</th>
                  <th className="p-4 text-center text-gray-500">Por tu cuenta</th>
                </tr>
              </thead>
              <tbody>
                {LOCAL_COMERCIAL_COMPARATIVA.map((row, i) => (
                  <tr key={row.aspecto} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="p-4 font-medium text-gray-900">{row.aspecto}</td>
                    <td className="p-4 text-center text-green-700 font-semibold">{row.inmonest}</td>
                    <td className="p-4 text-center text-gray-600">{row.solo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Para quién */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            ¿Para quién es este servicio en {nombre}?
          </h2>
          <ul className="space-y-4">
            {paraQuien.map((item) => (
              <li key={item} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-gray-100">
                <GestoriaCheckIcon className="mt-0.5 text-gold-500" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Regulación local */}
      <section className="py-14 px-4 bg-slate-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
            Normativa local en {nombre}
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Tu gestor conoce los trámites habituales en {region} y los incluye en el contrato cuando aplica.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {config.regulacionLocal.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-4">
                <span className="text-gold-500 font-bold shrink-0">✓</span>
                <span className="text-sm text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gestor local */}
      <section className="py-16 px-4 bg-white" id="gestor-local">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-[140px_1fr] gap-8 items-start">
            <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-lg mx-auto md:mx-0">
              <Image
                src={config.gestor.foto}
                alt={config.gestor.nombre}
                fill
                className="object-cover object-top"
                sizes="144px"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-2">
                Atención personalizada
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{config.gestor.nombre}</h2>
              <p className="text-sm text-gold-700 font-medium mb-4">{config.gestor.rol}</p>
              <p className="text-gray-600 leading-relaxed mb-4">{config.gestor.bio}</p>
              <p className="text-sm text-gray-500">
                {config.localesGestionados} operaciones de local comercial en {nombre} · Respuesta en menos de 24h
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Zonas */}
      <section className="py-12 px-4 bg-slate-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Barrios y zonas en {nombre}</h2>
          <p className="text-gray-600 mb-8">{config.zonasIntro}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {config.zonas.map((z) => (
              <span key={z} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700">
                {z}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Otras ciudades */}
      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-4">Alquiler de local comercial también disponible en:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/gestoria/alquiler-local-comercial" className="text-sm font-semibold text-gold-500 hover:underline">
              España (general)
            </Link>
            {ALQUILER_LOCAL_CIUDADES_LIST.filter((c) => c.slug !== slug).map((c) => (
              <Link
                key={c.slug}
                href={`/gestoria/alquiler-local-comercial/${c.slug}`}
                className="text-sm font-semibold text-gold-500 hover:underline"
              >
                {c.nombre}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <GestoriaLandingExtras
        servicio={SERVICIO_SLUG}
        servicioNombre={`Alquiler de local comercial en ${nombre}`}
        ciudad={nombre}
        whatsappMessage={`Hola, necesito un contrato de alquiler de local comercial en ${nombre}`}
        skipCiudades
        skipRelacionados
        skipTestimonios
        skipDaniel
        phase="contact"
        className="max-w-5xl mx-auto px-4 sm:px-6"
      />

      {/* FAQ */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Preguntas frecuentes en {nombre}
          </h2>
          <div className="space-y-4">
            {faq.map((item) => (
              <details key={item.q} className="bg-white p-6 rounded-xl border border-gray-200">
                <summary className="font-bold text-gray-900 cursor-pointer">{item.q}</summary>
                <p className="mt-4 text-gray-600 text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <GestoriaLandingExtras
        servicio={SERVICIO_SLUG}
        servicioNombre={`Alquiler de local comercial en ${nombre}`}
        ciudad={nombre}
        testimonioLanding={config.testimoniosLanding}
        relacionados={RELACIONADOS_LOCAL_COMERCIAL}
        skipCiudades
        skipDaniel
        skipLlamaGestor
        phase="footer"
        className="max-w-5xl mx-auto px-4 sm:px-6"
      />

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <GestoriaCtaBanner
            eyebrow={`Local comercial · ${nombre}`}
            title={`Alquila tu local en ${nombre} con respaldo jurídico`}
            description={`Contrato LAU empresarial por ${ALQUILER_LOCAL_COMERCIAL_PRECIO}€ IVA incluido. Gestor asignado y entrega en 48 horas.`}
            primaryHref={SOLICITAR_URL}
            primaryLabel={`Contratar ahora — ${ALQUILER_LOCAL_COMERCIAL_PRECIO}€`}
            imageSrc={getCiudadCtaImage(config.slug).src}
            imageAlt={`Contrato alquiler local comercial en ${nombre}`}
            imagePosition="left"
          />
        </div>
      </section>
    </>
  )
}

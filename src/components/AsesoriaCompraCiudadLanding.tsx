import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/NavbarServer'
import CiudadHubFaq from '@/components/CiudadHubFaq'
import CiudadHubServiciosGrid from '@/components/CiudadHubServiciosGrid'
import JsonLd from '@/components/JsonLd'
import LocalRegulationsBlock from '@/components/LocalRegulationsBlock'
import GestoriaLandingExtras from '@/components/GestoriaLandingExtras'
import GestoriaCiudadHero from '@/components/GestoriaCiudadHero'
import { GestoriaCheckIcon } from '@/components/ui/GestoriaCheckIcon'
import { RELACIONADOS_ASESORIA_COMPRA } from '@/lib/gestoria-relacionados'
import WhatsAppButton from '@/components/WhatsAppButton'
import type { AsesoriaCompraCiudadConfig } from '@/lib/asesoria-compra-ciudad-data'
import {
  ASESORIA_COMPRA_CIUDADES_LIST,
  ASESORIA_COMPRA_PRECIO,
  ASESORIA_COMPRA_TRAMITES,
  comisionAgenciaMax,
  comisionAgenciaMin,
} from '@/lib/asesoria-compra-ciudad-data'
import { getAsesoriaCompraFaq } from '@/lib/asesoria-compra-ciudad-faq'
import { getAsesoriaCompraEnriquecimiento } from '@/lib/asesoria-compra-ciudad-enriquecimiento'
import {
  buildFaqSchema,
  buildLegalServiceSchema,
  buildServiceOfferSchema,
} from '@/lib/gestoria-ciudad-schema'
import { getDueDiligenceHref } from '@/lib/gestoria-compra-cross-sell'
import { GestoriaCtaBanner } from '@/components/ui/GestoriaImageBanner'
import { getCiudadCtaImage } from '@/lib/gestoria-images'

const BASE_URL = 'https://inmonest.com'
const SOLICITAR_URL = '/gestoria/solicitar/compra-completa-reserva-escritura'
const SERVICIO_SLUG = 'compra-completa-reserva-escritura'

const BENEFICIOS = [
  {
    titulo: 'Sin comisión sobre el piso',
    desc: 'Las agencias cobran 3-5% del precio. Inmonest cobra 687€ fijos aunque el piso cueste 200.000€ o 500.000€.',
  },
  {
    titulo: 'Gestor asignado de verdad',
    desc: 'No eres un ticket: tienes nombre, teléfono y WhatsApp de un gestor inmobiliario que conoce tu operación.',
  },
  {
    titulo: 'Trabajamos para ti, no para el vendedor',
    desc: 'La agencia defiende al que paga la comisión (el vendedor). Nosotros revisamos contratos pensando en tu interés como comprador.',
  },
  {
    titulo: 'Evitas errores de miles de euros',
    desc: 'Arras mal redactadas, cargas ocultas o derramas no detectadas pueden costarte mucho más que 687€.',
  },
  {
    titulo: '100% online, respuesta en 24h',
    desc: 'Ideal si compras desde otra ciudad o tienes poco tiempo. Videollamada, WhatsApp y revisión documental a distancia.',
  },
  {
    titulo: 'De reserva a llaves',
    desc: 'No solo revisamos un contrato suelto: te acompañamos en todo el proceso hasta la firma en notaría.',
  },
] as const

const PASOS = [
  {
    titulo: 'Primera llamada con tu gestor',
    desc: 'En menos de 24h un gestor experto analiza tu operación: precio, plazos, vendedor y documentación disponible.',
  },
  {
    titulo: 'Contratas el servicio (687€)',
    desc: 'Tarifa plana IVA incluido. Sin comisión sobre el precio del piso. Comenzamos la revisión de inmediato.',
  },
  {
    titulo: 'Revisión de reserva y arras',
    desc: 'Analizamos contratos, nota simple, cargas, deudas de comunidad y documentación técnica obligatoria.',
  },
  {
    titulo: 'Acompañamiento hasta escritura',
    desc: 'Coordinación con notaría, resolución de dudas y verificación final antes de firmar.',
  },
] as const

type AsesoriaCompraCiudadLandingProps = {
  config: AsesoriaCompraCiudadConfig
}

export default function AsesoriaCompraCiudadLanding({ config }: AsesoriaCompraCiudadLandingProps) {
  const { nombre, slug, region, precioEjemploPiso } = config
  const agenciaMin = comisionAgenciaMin(precioEjemploPiso)
  const agenciaMax = comisionAgenciaMax(precioEjemploPiso)
  const ahorroMin = agenciaMin - ASESORIA_COMPRA_PRECIO
  const local = getAsesoriaCompraEnriquecimiento(slug)
  const faq = getAsesoriaCompraFaq(slug, nombre, region, precioEjemploPiso, config.faqPrioritarias)
  const waHref = `https://wa.me/34745022862?text=${encodeURIComponent(`Hola Daniel, necesito asesoría para comprar piso en ${nombre}`)}`

  return (
    <>
      <JsonLd
        schema={[
          buildLegalServiceSchema(nombre, slug, {
            path: `${BASE_URL}/gestoria/asesoria-compra-piso/${slug}`,
            name: `Inmonest Asesoría Compra Piso ${nombre}`,
          }),
          buildServiceOfferSchema('Asesoría Compra de Piso', nombre, ASESORIA_COMPRA_PRECIO),
          buildFaqSchema(faq),
        ]}
      />
      <Navbar />
      <WhatsAppButton />

      <GestoriaCiudadHero
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Gestoría', href: '/gestoria' },
          { label: 'Compra completa', href: '/gestoria/compra-completa-reserva-escritura' },
          { label: nombre },
        ]}
        badge={`Compra entre particulares · ${region}`}
        title={config.hero.h1}
        lead={config.hero.lead}
        precio={ASESORIA_COMPRA_PRECIO}
        imageSrc={config.heroImage}
        imageAlt={`Asesoría compra piso ${nombre}`}
        solicitarHref={SOLICITAR_URL}
        footnote={
          <>
            También disponible:{' '}
            <Link href={getDueDiligenceHref(slug)} className="text-gold-300 hover:text-gold-200 underline">
              Due diligence documental (350€)
            </Link>
          </>
        }
      />

      <section className="py-14 px-4 bg-slate-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
            {local?.beneficiosTitulo ?? '¿Por qué contratar Inmonest si compras de particular?'}
          </h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            {local?.beneficiosIntro ?? (
              <>Comprar sin agencia ahorra comisiones, pero no elimina el riesgo legal. Un gestor profesional te protege en cada trámite.</>
            )}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFICIOS.map((b) => (
              <div key={b.titulo} className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-2">{b.titulo}</h3>
                <p className="text-sm text-gray-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
            {local?.tramitesTitulo ?? `Trámites que gestionamos por ti en ${nombre}`}
          </h2>
          <p className="text-center text-gray-600 mb-8">
            {local?.tramitesIntro ?? (
              <>Todo lo que una agencia haría en la parte legal — sin cobrarte un porcentaje del piso.</>
            )}
          </p>
          <ul className="grid sm:grid-cols-2 gap-3">
            {[...(local?.tramitesLocales ?? []), ...ASESORIA_COMPRA_TRAMITES].map((t, i) => (
              <li key={`${i}-${t.slice(0, 24)}`} className="flex items-start gap-2 text-sm text-gray-700 bg-slate-50 rounded-lg p-3">
                <GestoriaCheckIcon className="mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            {local?.pasosTitulo ?? 'Proceso en 4 pasos'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(local?.pasos ?? PASOS).map((paso, i) => (
              <div key={paso.titulo} className="bg-slate-50 border border-gray-200 rounded-xl p-5">
                <span className="text-3xl font-black text-gold-500/30 block mb-2">0{i + 1}</span>
                <h3 className="font-bold text-gray-900 mb-2">{paso.titulo}</h3>
                <p className="text-sm text-gray-600">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LocalRegulationsBlock ciudad={nombre} region={region} servicio="compra" />

      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Tabla de precios</h2>
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 text-left font-semibold">Servicio</th>
                  <th className="p-4 text-center font-semibold text-gold-700">Inmonest</th>
                  <th className="p-4 text-center font-semibold text-gray-500">Agencia tradicional</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">Asesoría compra completa ({nombre})</td>
                  <td className="p-4 text-center font-bold text-green-700">{ASESORIA_COMPRA_PRECIO}€</td>
                  <td className="p-4 text-center text-red-600">
                    {agenciaMin.toLocaleString('es-ES')}–{agenciaMax.toLocaleString('es-ES')}€ (3-5%)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Tu ahorro estimado</td>
                  <td className="p-4 text-center font-bold text-gold-700" colSpan={2}>
                    Hasta {ahorroMin.toLocaleString('es-ES')}€ en un piso de {precioEjemploPiso.toLocaleString('es-ES')}€
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
            Casos reales en {nombre}
          </h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            Compradores particulares que encontraron piso sin agencia y contrataron gestoría profesional.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {config.casosReales.map((caso) => (
              <article key={caso.titulo} className="border border-gray-200 rounded-xl p-6 bg-slate-50">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-700 mb-2">{caso.perfil}</p>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{caso.titulo}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  <strong className="text-gray-800">Situación:</strong> {caso.situacion}
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  <strong className="text-gray-800">Resultado:</strong> {caso.resultado}
                </p>
                {caso.ahorro && (
                  <p className="text-sm font-semibold text-green-700">Ahorro estimado: {caso.ahorro}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 px-4 bg-slate-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-4">Zonas con cobertura en {nombre}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {config.zonas.map((z) => (
              <span key={z} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700">
                {z}
              </span>
            ))}
          </div>
        </div>
      </section>

      <CiudadHubServiciosGrid
        ciudad={nombre}
        ciudadSlug={slug}
        subtitulo={`Otros servicios de gestoría en ${nombre}. Precios transparentes, sin comisiones.`}
        excluirServicios={['compra-completa-reserva-escritura']}
      />

      <section className="py-10 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-3">Asesoría compra también en:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {ASESORIA_COMPRA_CIUDADES_LIST.filter((c) => c.slug !== slug).map((c) => (
              <Link
                key={c.slug}
                href={`/gestoria/asesoria-compra-piso/${c.slug}`}
                className="text-sm font-semibold text-gold-500 hover:underline"
              >
                {c.nombre} →
              </Link>
            ))}
          </div>
        </div>
      </section>

      <GestoriaLandingExtras
        servicio={SERVICIO_SLUG}
        servicioNombre={`Compra completa de piso en ${nombre}`}
        ciudad={nombre}
        whatsappMessage={`Hola Daniel, quiero comprar un piso en ${nombre} entre particulares`}
        skipCiudades
        skipRelacionados
        skipTestimonios
        phase="contact"
        className="max-w-5xl mx-auto px-4 sm:px-6"
      />

      <CiudadHubFaq
        ciudad={nombre}
        items={faq}
        titulo={`Preguntas frecuentes — Asesoría compra piso en ${nombre}`}
        subtitulo="Resolvemos las dudas más habituales antes de contratar."
      />

      <GestoriaLandingExtras
        servicio={SERVICIO_SLUG}
        servicioNombre={`Compra completa de piso en ${nombre}`}
        ciudad={nombre}
        testimonioLanding={config.testimoniosLanding}
        relacionados={RELACIONADOS_ASESORIA_COMPRA}
        skipCiudades
        skipDaniel
        skipLlamaGestor
        phase="footer"
        className="max-w-5xl mx-auto px-4 sm:px-6"
      />

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <GestoriaCtaBanner
            eyebrow={`Asesoría compra · ${nombre}`}
            title={`Compra en ${nombre} con total seguridad`}
            description="687€ fijos · Gestor asignado · Sin comisión de agencia · Respuesta en 24h"
            primaryHref={SOLICITAR_URL}
            primaryLabel="Solicitar online"
            imageSrc={getCiudadCtaImage(config.slug).src}
            imageAlt={`Asesoría compra piso en ${nombre}`}
            imagePosition="right"
          />
        </div>
      </section>
    </>
  )
}

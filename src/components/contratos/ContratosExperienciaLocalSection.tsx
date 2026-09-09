import Image from 'next/image'
import Link from 'next/link'
import type { ContratosCiudadEnriquecimiento } from '@/lib/contratos-inmobiliarios-ciudad-enriquecimiento'
import type { ContratosInmobiliariosCiudadConfig } from '@/lib/contratos-inmobiliarios-ciudades'
import { BadgeCheck, Building2, FileText, Scale, Shield, Users } from '@/components/ui/Icons'

type Props = {
  ciudad: ContratosInmobiliariosCiudadConfig
  enriquecido: ContratosCiudadEnriquecimiento
}

const BENEFICIOS = [
  {
    Icon: FileText,
    titulo: 'Redacción personalizada',
    desc: 'Cada contrato refleja datos reales de las partes, importes y cláusulas de vuestra operación — no un Word genérico.',
  },
  {
    Icon: Scale,
    titulo: 'Normativa autonómica',
    desc: 'LAU, Ley de Vivienda 2026, fianzas, inventarios y arras adaptados a la CCAA donde está el inmueble.',
  },
  {
    Icon: Users,
    titulo: 'Gestor humano asignado',
    desc: 'Nombre, teléfono y WhatsApp directo. Hablas con quien redacta tu expediente, no con un ticket anónimo.',
  },
  {
    Icon: Shield,
    titulo: 'Panel y trazabilidad',
    desc: 'Subes documentación, sigues el timeline del expediente y descargas el PDF cuando el gestor entrega.',
  },
  {
    Icon: Building2,
    titulo: 'Sin comisión de agencia',
    desc: 'Tarifa plana desde 145 € en arras o alquiler. Acompañamiento de compra 687 € fijos, sin porcentaje sobre el piso.',
  },
  {
    Icon: BadgeCheck,
    titulo: 'Revisiones incluidas',
    desc: 'Ajustes gratuitos en los 7 días posteriores a la entrega si cambian datos o plazos antes de firmar.',
  },
] as const

export default function ContratosExperienciaLocalSection({ ciudad, enriquecido }: Props) {
  const { nombre, region, mercadoIntro, normativaIntro } = ciudad

  return (
    <>
      <section className="border-t border-gray-100 bg-cream-100 px-4 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
              Gestoría inmobiliaria en {nombre}
            </span>
            <h2 className="mt-2 mb-4 text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Contratos redactados por profesionales, no plantillas de internet
            </h2>
            <p className="mb-4 leading-relaxed text-gray-600">{mercadoIntro}</p>
            <p className="mb-4 leading-relaxed text-gray-600">
              Inmonest nació como portal de pisos entre particulares. En {nombre} vimos el mismo
              patrón una y otra vez: compradores, vendedores y arrendadores firmando arras o
              alquileres descargados gratis, sin revisión jurídica, que acababan en litigios por
              cláusulas nulas, fianzas mal depositadas o inventarios inexistentes.
            </p>
            <p className="mb-6 leading-relaxed text-gray-600">
              Por eso la Gestoría Inmonest redacta cada documento a mano:{' '}
              <strong className="font-semibold text-gray-800">{enriquecido.serviciosRapidos.arras}</strong>{' '}
              En alquiler,{' '}
              <strong className="font-semibold text-gray-800">{enriquecido.serviciosRapidos.alquiler}</strong>
            </p>
            <Link
              href="/gestoria/solicitar"
              className="inline-flex rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-gold-600"
            >
              Solicitar contrato en {nombre} →
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={ciudad.heroImage.src}
              alt={`Gestoría inmobiliaria Inmonest en ${nombre}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
              Por qué Inmonest en {nombre}
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
              Lo que diferencia nuestra gestoría en {region}
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base">
              {normativaIntro} Además, {enriquecido.serviciosRapidos.compra}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFICIOS.map(({ Icon, titulo, desc }) => (
              <div
                key={titulo}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:border-gold-300/40"
              >
                <Icon className="mb-3 h-6 w-6 text-gold-600" />
                <h3 className="mb-2 text-sm font-bold text-gray-900">{titulo}</h3>
                <p className="text-xs leading-relaxed text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

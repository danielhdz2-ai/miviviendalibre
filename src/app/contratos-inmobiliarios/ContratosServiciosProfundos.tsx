import Image from 'next/image'
import Link from 'next/link'
import {
  CONTRATOS_SERVICIOS_PROFUNDOS,
  type ContratoServicioProfundo,
} from '@/lib/contratos-inmobiliarios-secciones'
import type { ContratosServicioRapidoLocal } from '@/lib/contratos-inmobiliarios-ciudad-enriquecimiento'
import { BadgeCheck, CheckCircle } from '@/components/ui/Icons'

export type ContratosServiciosProfundosLinks = {
  arrasInfo?: string
  alquilerInfo?: string
  compraInfo?: string
  ventaInfo?: string
  packVendedorInfo?: string
}

type Props = {
  ciudadNombre?: string
  ciudadSlug?: string
  sectionIntro?: string
  serviciosLocales?: ContratosServicioRapidoLocal
  links?: ContratosServiciosProfundosLinks
}

const LOCAL_KEY_BY_ID: Record<string, keyof ContratosServicioRapidoLocal | 'venta'> = {
  arras: 'arras',
  alquiler: 'alquiler',
  'acompanamiento-compra': 'compra',
  'acompanamiento-venta': 'venta',
  'pack-arras-vendedor': 'packVendedor',
}

const TITULOS_CIUDAD: Record<string, (ciudad: string) => string> = {
  arras: (c) => `Contrato de arras en ${c}`,
  alquiler: (c) => `Contrato de alquiler en ${c} con inventario y fianza`,
  'acompanamiento-compra': (c) => `Acompañamiento de compra en ${c}`,
  'acompanamiento-venta': (c) => `Acompañamiento de venta en ${c}`,
  'pack-arras-vendedor': (c) => `Pack Arras Plus Vendedor en ${c}`,
}

function buildServicios(
  ciudadNombre: string | undefined,
  serviciosLocales: ContratosServicioRapidoLocal | undefined,
  links: ContratosServiciosProfundosLinks | undefined,
  ciudadSlug: string | undefined,
): ContratoServicioProfundo[] {
  return CONTRATOS_SERVICIOS_PROFUNDOS.map((s) => {
    if (!ciudadNombre) return s

    const localKey = LOCAL_KEY_BY_ID[s.id]
    let parrafoLocal: string | null = null
    if (localKey && serviciosLocales) {
      if (localKey === 'venta') {
        parrafoLocal = serviciosLocales.venta ?? serviciosLocales.packVendedor
      } else {
        parrafoLocal = serviciosLocales[localKey] ?? null
      }
    }

    let ctaSecundarioHref = s.ctaSecundarioHref
    if (s.id === 'arras' && links?.arrasInfo) ctaSecundarioHref = links.arrasInfo
    if (s.id === 'alquiler' && links?.alquilerInfo) ctaSecundarioHref = links.alquilerInfo
    if (s.id === 'acompanamiento-compra') {
      ctaSecundarioHref =
        links?.compraInfo ??
        (ciudadSlug ? `/gestoria/asesoria-compra-piso/${ciudadSlug}` : s.ctaSecundarioHref)
    }
    if (s.id === 'acompanamiento-venta') {
      ctaSecundarioHref =
        links?.ventaInfo ??
        (ciudadSlug
          ? `/gestoria/venta-completa-reserva-escritura/${ciudadSlug}`
          : s.ctaSecundarioHref)
    }
    if (s.id === 'pack-arras-vendedor' && links?.packVendedorInfo) {
      ctaSecundarioHref = links.packVendedorInfo
    }

    const tituloFn = TITULOS_CIUDAD[s.id]
    const titulo = tituloFn ? tituloFn(ciudadNombre) : s.titulo

    return {
      ...s,
      titulo,
      intro: parrafoLocal
        ? `${s.intro} Contexto en ${ciudadNombre}: ${parrafoLocal}`
        : s.intro,
      imagenAlt: `${s.imagenAlt} — ${ciudadNombre}`,
      ctaSecundarioHref,
    }
  })
}

const NAV_ITEMS = CONTRATOS_SERVICIOS_PROFUNDOS.map((s) => ({
  id: s.id,
  label: s.kicker,
}))

export default function ContratosServiciosProfundos({
  ciudadNombre,
  ciudadSlug,
  sectionIntro,
  serviciosLocales,
  links,
}: Props) {
  const servicios = buildServicios(ciudadNombre, serviciosLocales, links, ciudadSlug)

  return (
    <section className="border-t border-gray-100 bg-white" aria-labelledby="servicios-contratos-titulo">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
            Cada servicio, un apartado
          </span>
          <h2
            id="servicios-contratos-titulo"
            className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl"
          >
            {ciudadNombre
              ? `Nuestros servicios de contratos inmobiliarios en ${ciudadNombre}`
              : 'Arras, alquiler, compra y venta entre particulares'}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
            {sectionIntro ??
              (ciudadNombre
                ? `Cinco servicios independientes con imagen, precio cerrado y enlace directo para contratar. Gestores que conocen ${ciudadNombre}.`
                : 'Cinco servicios independientes: arras, alquiler LAU con inventario, acompañamiento de compra, acompañamiento de venta y pack para vendedores.')}
          </p>
        </div>

        <nav
          aria-label="Ir a un servicio"
          className="mb-10 flex flex-wrap justify-center gap-2"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#servicio-${item.id}`}
              className="rounded-full border border-gold-200 bg-cream-50 px-4 py-2 text-xs font-semibold text-gold-800 transition hover:border-gold-400 hover:bg-gold-50"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {servicios.map((s, index) => (
        <article
          key={s.id}
          id={`servicio-${s.id}`}
          className={`scroll-mt-24 border-t border-gray-200 px-4 py-16 sm:py-20 ${index % 2 === 1 ? 'bg-cream-50' : 'bg-white'}`}
        >
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div className={s.invertido ? 'lg:order-2' : ''}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold-500/10 px-3 py-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold-700">
                  Apartado {index + 1} · {s.kicker}
                </span>
              </div>
              <h3 className="mb-4 text-2xl font-extrabold leading-snug text-gray-900 sm:text-3xl">
                {s.titulo}
              </h3>
              <p className="mb-6 leading-relaxed text-gray-600">{s.intro}</p>

              <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold-600">
                  Cómo lo hacemos en Inmonest
                </p>
                <ol className="space-y-3">
                  {s.pasosRedaccion.map((paso, i) => (
                    <li key={paso} className="flex gap-3 text-sm text-gray-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{paso}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <ul className="mb-5 space-y-2.5">
                {s.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">{s.extra}</p>

              <div className="mb-6 rounded-2xl border-2 border-gold-300 bg-[#fdfbf5] p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600">
                      {s.precioNota ?? 'Precio cerrado · IVA incluido'}
                    </p>
                    <p className="text-4xl font-extrabold text-gold-600">{s.precio} €</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-gold-600" />
                    Entrega habitual 48 h · revisiones incluidas
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={s.ctaHref}
                  className="rounded-xl bg-gold-500 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-gold-600"
                >
                  {s.ctaLabel} →
                </Link>
                {s.ctaSecundarioHref && s.ctaSecundarioLabel && (
                  <Link
                    href={s.ctaSecundarioHref}
                    className="rounded-xl border border-gold-300 bg-white px-6 py-3.5 text-sm font-bold text-gold-700 transition hover:bg-gold-50"
                  >
                    {s.ctaSecundarioLabel}
                  </Link>
                )}
              </div>
            </div>

            <div className={`relative lg:sticky lg:top-24 ${s.invertido ? 'lg:order-1' : ''}`}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5">
                <Image
                  src={s.imagen}
                  alt={s.imagenAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={index < 2}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                  aria-hidden
                />
                <div className="absolute top-4 right-4 rounded-xl bg-gold-500 px-4 py-2 shadow-lg">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Precio</p>
                  <p className="text-2xl font-extrabold text-white">{s.precio} €</p>
                </div>
                <div className="absolute right-4 bottom-4 left-4 rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600">
                    Inmonest Gestoría
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900">{s.kicker}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {ciudadNombre
                      ? `${ciudadNombre} · panel online · gestor asignado`
                      : 'Toda España · panel online · gestor asignado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}

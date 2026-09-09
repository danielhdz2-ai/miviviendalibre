'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import GestoriaHeroFullBleed from '@/components/GestoriaHeroFullBleed'
import HomeTestimonials from '@/components/home/HomeTestimonials'
import FirmaCertIncluidaSection from '@/components/FirmaCertIncluidaSection'
import AgenciaGestoriaPanelDemo from '@/app/agencias/gestoria/AgenciaGestoriaPanelDemo'
import ContratosServiciosProfundos from './ContratosServiciosProfundos'
import ContratosComoFuncionaSection from '@/components/contratos/ContratosComoFuncionaSection'
import ContratosInmobiliariosComparativa from '@/components/ContratosInmobiliariosComparativa'
import GestoriaLandingExtras from '@/components/GestoriaLandingExtras'
import { GestoriaCtaBanner } from '@/components/ui/GestoriaImageBanner'
import { BRAND_IMAGES } from '@/lib/brand-images'
import { GESTORIA_PRECIO_MIN } from '@/lib/gestoria-catalogo'
import {
  CONTRATOS_CIUDADES_LOCAL,
  CONTRATOS_INMOBILIARIOS_FAQ,
} from '@/lib/contratos-inmobiliarios-config'
import {
  BadgeCheck,
  Building2,
  FileText,
  Scale,
  Shield,
  Users,
  Zap,
} from '@/components/ui/Icons'

export default function ContratosInmobiliariosContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <main className="min-h-screen bg-white">
      <GestoriaHeroFullBleed
        imageSrc={BRAND_IMAGES.gestoria.src}
        imageAlt="Contratos inmobiliarios redactados por profesionales — Inmonest"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Contratos inmobiliarios' },
        ]}
      >
        <span className="mb-4 inline-block rounded-full bg-gold-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white sm:text-xs">
          Redacción profesional · Particulares
        </span>
        <h1 className="mb-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
          Contratos inmobiliarios redactados por profesionales
        </h1>
        <p className="mb-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
          Somos expertos en contratos inmobiliarios para particulares: arras, alquiler LAU,
          compraventa y más. Desde {GESTORIA_PRECIO_MIN} € · entrega en 48 h · sin plantillas
          genéricas.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/gestoria/solicitar"
            className="rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-gold-600"
          >
            Solicitar mi contrato →
          </Link>
          <Link
            href="/gestoria"
            className="rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
          >
            Ver catálogo completo
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/60">
          <span>★ 4,9 en Google</span>
          <span>+500 contratos redactados</span>
          <span>Toda España</span>
          <span>Revisiones incluidas</span>
        </div>
      </GestoriaHeroFullBleed>

      {/* Historia Inmonest */}
      <section className="bg-cream-100 px-4 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
              Nuestra historia
            </span>
            <h2 className="mt-2 mb-4 text-2xl font-extrabold text-gray-900 sm:text-3xl">
              De portal inmobiliario a expertos en contratos
            </h2>
            <p className="mb-4 leading-relaxed text-gray-600">
              Inmonest nació como portal de pisos entre particulares sin comisiones de agencia.
              Desde el primer día vimos el mismo patrón: compradores, vendedores e inquilinos
              firmando contratos descargados de internet, sin revisión jurídica, que acababan en
              conflictos costosos y procesos evitables.
            </p>
            <p className="mb-6 leading-relaxed text-gray-600">
              Por eso creamos la Gestoría Inmonest: redactamos contratos inmobiliarios
              personalizados por profesionales especializados en derecho inmobiliario español. No
              somos generadores automáticos de plantillas. Cada documento refleja vuestra operación
              concreta, vuestra CCAA y la normativa vigente en 2026.
            </p>
            <div className="space-y-3">
              {[
                { Icon: Scale, text: 'Equipo de gestoría especializado en contratos inmobiliarios' },
                { Icon: Building2, text: 'Conocimiento autonómico: Cataluña, Madrid, Valencia, País Vasco…' },
                { Icon: BadgeCheck, text: 'Revisiones gratuitas en los 7 días tras la entrega' },
                { Icon: Shield, text: 'Confidencialidad total de datos y operaciones' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-start gap-3 text-sm text-gray-700">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                  {text}
                </div>
              ))}
            </div>
          </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={BRAND_IMAGES.gestoria.src}
              alt="Equipo de gestoría Inmonest revisando contratos inmobiliarios"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Por qué profesionales vs plantillas */}
      <section className="border-t border-gray-100 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
              Por qué Inmonest
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
              Redactamos contratos inmobiliarios, no vendemos PDFs genéricos
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500">
              La búsqueda &quot;contratos inmobiliarios&quot; mezcla plantillas gratuitas, despachos
              locales y plataformas online. Nosotros combinamos precio accesible, velocidad y
              revisión humana profesional.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                Icon: FileText,
                titulo: 'Personalización real',
                desc: 'Datos de las partes, inmueble, importes y cláusulas adaptadas a vuestra operación.',
              },
              {
                Icon: Zap,
                titulo: 'Entrega en 48 h',
                desc: 'PDF firmable digitalmente. Sin citas presenciales ni esperas de semanas.',
              },
              {
                Icon: Scale,
                titulo: 'Normativa 2026',
                desc: 'LAU, Ley de Vivienda, Código Civil y tributación ITP actualizados.',
              },
              {
                Icon: Users,
                titulo: 'Para particulares',
                desc: 'Pensado para quien compra, vende o alquila sin agencia intermediaria.',
              },
              {
                Icon: Shield,
                titulo: 'Revisión registral',
                desc: 'Nota simple y coherencia urbanística cuando aplica a la operación.',
              },
              {
                Icon: BadgeCheck,
                titulo: 'Reseñas verificadas',
                desc: 'Clientes reales en Google valoran la agilidad y el trato profesional.',
              },
            ].map(({ Icon, titulo, desc }) => (
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

      <ContratosServiciosProfundos />

      <FirmaCertIncluidaSection />

      <AgenciaGestoriaPanelDemo audience="particular" />

      <ContratosComoFuncionaSection />

      <ContratosInmobiliariosComparativa showBeneficios={false} precioEjemploVenta={250_000} />

      {/* CTA cuenta */}
      <section className="border-t border-gray-100 bg-cream-100 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-3 text-xl font-extrabold text-gray-900 sm:text-2xl">
            Publica tu piso y gestiona tus contratos desde una cuenta
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            Cuenta gratuita con 2 anuncios incluidos, formularios con datos prefilled e historial
            de todos tus contratos inmobiliarios en el panel de gestoría.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-gold-600"
            >
              Crear cuenta gratis →
            </Link>
            <Link
              href="/gestoria/acceso-cliente"
              className="rounded-xl border border-gold-300 bg-white px-6 py-3 text-sm font-bold text-gold-700 transition hover:bg-gold-50"
            >
              Acceso clientes gestoría
            </Link>
          </div>
        </div>
      </section>

      <HomeTestimonials />

      <GestoriaLandingExtras
        servicio="arras-penitenciales"
        servicioNombre="Contratos inmobiliarios"
        whatsappMessage="Hola Daniel, necesito redactar un contrato inmobiliario"
        skipCiudades
        skipRelacionados
        skipTestimonios
        phase="contact"
        className="mx-auto max-w-5xl px-4 sm:px-6"
      />

      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <GestoriaCtaBanner
            eyebrow="Contratos inmobiliarios · Inmonest"
            title="Redacta tu contrato con gestor asignado"
            description={`Arras, alquiler LAU con inventario y fianza, o acompañamiento de compra. Desde ${GESTORIA_PRECIO_MIN} € · Entrega 48 h · Panel online`}
            primaryHref="/gestoria/solicitar"
            primaryLabel="Solicitar contrato online"
            secondaryHref="#gestor-daniel"
            secondaryLabel="Hablar con Daniel"
            imageSrc="/keys.jpg"
            imageAlt="Contratos inmobiliarios redactados por Inmonest"
            imagePosition="right"
          />
        </div>
      </section>

      {/* SEO local */}
      <section className="border-t border-gray-100 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
              Cobertura nacional
            </span>
            <h2 className="mt-2 text-xl font-extrabold text-gray-900">
              Contratos inmobiliarios en toda España
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              Servicio online con adaptación autonómica. Landings locales en 12 ciudades:
              Madrid, Barcelona, Valencia, Sevilla, Málaga, Bilbao, Zaragoza, Alicante, Palma,
              Murcia, A Coruña y Pamplona.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {CONTRATOS_CIUDADES_LOCAL.map((c) => (
              <Link
                key={c.slug}
                href={c.href}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gold-400 hover:text-gold-700"
              >
                {c.label}
              </Link>
            ))}
            <Link
              href="/gestoria/ciudades"
              className="rounded-full border border-gold-300 bg-gold-50 px-4 py-2 text-sm font-semibold text-gold-700 transition hover:bg-gold-100"
            >
              Todas las ciudades →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900">Preguntas frecuentes</h2>
            <p className="mt-2 text-sm text-gray-500">
              Sobre redacción de contratos inmobiliarios para particulares
            </p>
          </div>
          <div className="space-y-3">
            {CONTRATOS_INMOBILIARIOS_FAQ.map(({ q, a }, i) => (
              <div
                key={q}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-gray-900"
                  aria-expanded={openFaq === i}
                >
                  {q}
                  <svg
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <p className="border-t border-gray-50 px-5 pb-4 pt-2 text-sm leading-relaxed text-gray-600">
                    {a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-gradient-to-r from-gold-700 to-gold-500 px-4 py-14">
        <div className="mx-auto max-w-2xl text-center text-white">
          <h2 className="mb-3 text-2xl font-extrabold sm:text-3xl">
            ¿Necesitas redactar un contrato inmobiliario?
          </h2>
          <p className="mb-6 text-base text-white/85">
            Desde {GESTORIA_PRECIO_MIN} €. Profesionales reales. Entrega en 48 h. Sin plantillas
            genéricas.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/gestoria/solicitar"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-gold-600 shadow-lg transition hover:bg-cream-100"
            >
              Solicitar contrato ahora
            </Link>
            <Link
              href="/contacto"
              className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Hablar con el equipo
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

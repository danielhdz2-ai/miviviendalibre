'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import GestoriaHeroFullBleed from '@/components/GestoriaHeroFullBleed'
import HomeTestimonials from '@/components/home/HomeTestimonials'
import { getContratosCiudadEnriquecimiento } from '@/lib/contratos-inmobiliarios-ciudad-enriquecimiento'
import {
  CONTRATOS_CIUDAD_PRECIOS,
  CONTRATOS_INMOBILIARIOS_CIUDADES,
  CONTRATOS_INMOBILIARIOS_CIUDAD_SLUGS,
  type ContratosInmobiliariosCiudadConfig,
} from '@/lib/contratos-inmobiliarios-ciudades'
import { GESTORIA_PRECIO_MIN } from '@/lib/gestoria-catalogo'
import { Building2, Scale } from '@/components/ui/Icons'

type Props = {
  ciudad: ContratosInmobiliariosCiudadConfig
}

export default function ContratosInmobiliariosCiudadContent({ ciudad }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const precios = CONTRATOS_CIUDAD_PRECIOS
  const enriquecido = getContratosCiudadEnriquecimiento(ciudad.slug)

  const otrasCiudades = CONTRATOS_INMOBILIARIOS_CIUDAD_SLUGS.filter((s) => s !== ciudad.slug)

  return (
    <main className="min-h-screen bg-white">
      <GestoriaHeroFullBleed
        imageSrc={ciudad.heroImage.src}
        imageAlt={ciudad.heroImage.alt}
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Contratos inmobiliarios', href: '/contratos-inmobiliarios' },
          { label: ciudad.nombre },
        ]}
      >
        <span className="mb-4 inline-block rounded-full bg-gold-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white sm:text-xs">
          {ciudad.region} · Particulares
        </span>
        <h1 className="mb-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
          {enriquecido.heroTitulo}{' '}
          <span className="text-gold-300">{enriquecido.heroHighlight}</span>
        </h1>
        <p className="mb-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
          {ciudad.heroLead}
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {ciudad.heroTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/gestoria/solicitar"
            className="rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-gold-600"
          >
            Solicitar contrato en {ciudad.nombre} →
          </Link>
          <Link
            href={ciudad.enlaceGestoria}
            className="rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
          >
            Gestoría {ciudad.nombre}
          </Link>
        </div>
      </GestoriaHeroFullBleed>

      {/* Mercado local */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
              {enriquecido.mercadoKicker}
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
              {ciudad.mercadoTitulo}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base">
              {ciudad.mercadoIntro}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {ciudad.mercadoCards.map((card) => (
              <div
                key={card.titulo}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-6 transition hover:border-gold-300/40"
              >
                <Building2 className="mb-3 h-6 w-6 text-gold-600" />
                <h3 className="mb-2 text-base font-bold text-gray-900">{card.titulo}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Normativa autonómica */}
      <section className="border-t border-gray-100 bg-cream-50 px-4 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
              {enriquecido.normativaKicker}
            </span>
            <h2 className="mt-2 mb-4 text-2xl font-extrabold text-gray-900">
              {ciudad.normativaTitulo}
            </h2>
            <p className="mb-5 leading-relaxed text-gray-600">{ciudad.normativaIntro}</p>
            <ul className="space-y-3">
              {ciudad.normativaPuntos.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <Scale className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={ciudad.heroImage.src}
              alt={ciudad.heroImage.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Barrios */}
      <section className="border-t border-gray-100 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
              {enriquecido.barriosKicker}
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">{ciudad.barriosTitulo}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-500">{ciudad.barriosIntro}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ciudad.barrios.map((b) => (
              <div
                key={b.nombre}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gold-300/50"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600">
                  {b.contexto}
                </p>
                <h3 className="mt-1 mb-2 text-base font-bold text-gray-900">{b.nombre}</h3>
                <p className="text-xs leading-relaxed text-gray-600">{b.operativa}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios rápidos ciudad */}
      <section className="bg-cream-100 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900">{ciudad.serviciosTitulo}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">{ciudad.serviciosIntro}</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              {
                titulo: `Arras penitenciales en ${ciudad.nombre}`,
                desc: enriquecido.serviciosRapidos.arras,
                precio: precios.arras,
                href: ciudad.enlaceArras ?? '/gestoria/solicitar/arras-penitenciales',
                imagen: '/gestoria1.jpg',
              },
              {
                titulo: `Alquiler LAU en ${ciudad.nombre}`,
                desc: enriquecido.serviciosRapidos.alquiler,
                precio: precios.alquiler,
                href: ciudad.enlaceAlquiler ?? '/gestoria/solicitar/contrato-alquiler',
                imagen: '/gestoria7.jpg',
              },
              {
                titulo: `Pack Arras Plus Vendedor`,
                desc: enriquecido.serviciosRapidos.packVendedor,
                precio: precios.packVendedor,
                href: '/gestoria/solicitar/pack-arras-plus-vendedor',
                imagen: '/contratodearras.jpg',
              },
              {
                titulo: `Acompañamiento de compra`,
                desc: enriquecido.serviciosRapidos.compra,
                precio: precios.compraCompleta,
                href: '/gestoria/solicitar/compra-completa-reserva-escritura',
                imagen: '/gestoria11.jpg',
              },
            ].map((s) => (
              <Link
                key={s.titulo}
                href={s.href}
                className="group flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-gold-400 hover:shadow-md"
              >
                <div className="relative hidden w-32 shrink-0 sm:block">
                  <Image src={s.imagen} alt="" fill className="object-cover" sizes="128px" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-1 text-sm font-bold text-gray-900 group-hover:text-gold-700">
                    {s.titulo}
                  </h3>
                  <p className="mb-3 flex-1 text-xs leading-relaxed text-gray-600">{s.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-gold-600">{s.precio} €</span>
                    <span className="text-xs font-semibold text-gold-600 group-hover:underline">
                      Ver más →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ ciudad */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Preguntas frecuentes en {ciudad.nombre}
            </h2>
          </div>
          <div className="space-y-3">
            {ciudad.faq.map(({ q, a }, i) => (
              <div key={q} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
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

      {/* Otras ciudades */}
      <section className="border-t border-gray-100 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gold-500">
            Otras ciudades
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/contratos-inmobiliarios"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-gold-400"
            >
              España (hub)
            </Link>
            {otrasCiudades.map((slug) => (
              <Link
                key={slug}
                href={`/contratos-inmobiliarios/${slug}`}
                className="rounded-full border border-gold-200 bg-gold-50 px-4 py-2 text-sm font-semibold text-gold-700 hover:bg-gold-100"
              >
                {CONTRATOS_INMOBILIARIOS_CIUDADES[slug].nombre}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeTestimonials />

      {/* CTA final */}
      <section className="bg-gradient-to-r from-gold-700 to-gold-500 px-4 py-14">
        <div className="mx-auto max-w-2xl text-center text-white">
          <h2 className="mb-3 text-2xl font-extrabold sm:text-3xl">
            Contratos inmobiliarios en {ciudad.nombre}
          </h2>
          <p className="mb-6 text-base text-white/85">
            Desde {GESTORIA_PRECIO_MIN} €. Gestores que conocen {ciudad.region}. Entrega en 48 h.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/gestoria/solicitar"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-gold-600 shadow-lg transition hover:bg-cream-100"
            >
              Solicitar contrato
            </Link>
            <Link
              href="/contratos-inmobiliarios"
              className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Ver hub nacional
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

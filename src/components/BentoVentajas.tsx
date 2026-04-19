'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface CardData {
  id: string
  titulo: string
  subtitulo: string
  imagen: string
  tag: string
  tagBg: string
  desc: string
  features: string[]
  cta: string
  href: string
}

const CARDS: CardData[] = [
  {
    id: 'particulares',
    titulo: 'Solo\nparticulares',
    subtitulo: 'Sin agencias. Solo propietarios reales.',
    imagen: '/familia1.jpg',
    tag: '🔍 Verificación IA',
    tagBg: 'bg-amber-500',
    desc: 'Nuestro sistema de inteligencia artificial analiza y filtra automáticamente los anuncios de agencias y profesionales. Cada propiedad que ves en Inmonest la publica un propietario real: precios más bajos, condiciones directas y sin comisiones ocultas de ningún tipo.',
    features: [
      'IA que detecta agencias disfrazadas de particular',
      'Solo anuncios verificados de propietarios reales',
      'Ahorra hasta un 10% al no pagar honorarios de agencia',
    ],
    cta: 'Ver pisos de particulares →',
    href: '/pisos?solo_particulares=true',
  },
  {
    id: 'directo',
    titulo: 'Trato\ndirecto',
    subtitulo: 'De persona a persona. Sin intermediarios.',
    imagen: '/amigos1.jpg',
    tag: '💬 Sin intermediarios',
    tagBg: 'bg-emerald-600',
    desc: 'Olvídate de comerciales y gestores que encarecen cada paso. En Inmonest contactas directamente con el dueño del piso: hablas, visitas y cierras el trato de igual a igual, con total transparencia y sin que nadie se lleve su parte del acuerdo.',
    features: [
      'Chat y llamada directa con el propietario',
      'Sin honorarios ni comisiones de intermediarios',
      'Negociación transparente y sin presiones',
    ],
    cta: 'Explorar anuncios →',
    href: '/pisos',
  },
  {
    id: 'contratos',
    titulo: 'Contratos\nseguros',
    subtitulo: 'Jurídicamente revisados. Desde 7 €.',
    imagen: '/interior1.jpg',
    tag: '📄 Desde 7 €',
    tagBg: 'bg-blue-600',
    desc: 'Genera contratos de alquiler, arras y reserva redactados y revisados por nuestro equipo jurídico especializado. Completamente personalizables, legalmente sólidos y listos en minutos para que firmes con total confianza y sin sorpresas.',
    features: [
      'Contrato de alquiler listo en menos de 5 minutos',
      'Contrato de arras y señal para compraventas',
      'Revisado por abogados especializados en inmobiliario',
    ],
    cta: 'Ver contratos disponibles →',
    href: '/gestoria',
  },
  {
    id: 'gratis',
    titulo: 'Publicar\nes gratis',
    subtitulo: 'Tu anuncio online en menos de 5 minutos.',
    imagen: '/familia3.jpg',
    tag: '🆓 Sin coste',
    tagBg: 'bg-violet-600',
    desc: 'Crea tu anuncio de alquiler o venta sin suscripciones, sin límites y sin coste. Nuestra IA genera automáticamente el título y la descripción perfectos para tu propiedad. Si quieres más visibilidad, activa el servicio Turbo exactamente cuando lo necesites.',
    features: [
      'Publicación completamente gratuita, sin trampas',
      'IA genera el título y descripción óptimos',
      'Turbo opcional para máxima visibilidad',
    ],
    cta: 'Publicar mi anuncio gratis →',
    href: '/publicar-anuncio',
  },
]

export default function BentoVentajas() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const card = CARDS.find(c => c.id === activeId) ?? null

  useEffect(() => {
    if (!activeId) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveId(null) }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [activeId])

  return (
    <>
      {/* ── Bento Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-3 sm:gap-4 lg:h-[600px]">

        {/* Card 1: Solo particulares — ancha (2/3) */}
        <BentoCard
          card={CARDS[0]}
          className="h-64 sm:h-64 lg:h-auto lg:col-span-2 lg:row-start-1"
          onOpen={() => setActiveId(CARDS[0].id)}
        />

        {/* Card 2: Trato directo — alta (col 3, filas 1-2) */}
        <BentoCard
          card={CARDS[1]}
          className="h-64 sm:h-64 lg:h-auto lg:col-start-3 lg:row-start-1 lg:row-span-2"
          onOpen={() => setActiveId(CARDS[1].id)}
        />

        {/* Card 3: Contratos seguros */}
        <BentoCard
          card={CARDS[2]}
          className="h-64 sm:h-64 lg:h-auto lg:col-start-1 lg:row-start-2"
          onOpen={() => setActiveId(CARDS[2].id)}
        />

        {/* Card 4: Publicar es gratis */}
        <BentoCard
          card={CARDS[3]}
          className="h-64 sm:h-64 lg:h-auto lg:col-start-2 lg:row-start-2"
          onOpen={() => setActiveId(CARDS[3].id)}
        />
      </div>

      {/* ── Modal Full-Screen ──────────────────────────────────── */}
      {activeId && card && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/75 backdrop-blur-md"
          onClick={e => { if (e.target === e.currentTarget) setActiveId(null) }}
        >
          <div
            className="relative bg-white rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl flex flex-col lg:flex-row"
            style={{ maxHeight: '90vh' }}
          >

            {/* Imagen izquierda */}
            <div className="relative w-full lg:w-[42%] shrink-0 h-60 lg:h-auto">
              <Image
                src={card.imagen}
                alt={card.titulo.replace('\n', ' ')}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
              />
              {/* Degradado lateral hacia el texto */}
              <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
              {/* Tag sobre la imagen */}
              <div className="absolute top-4 left-4">
                <span className={`${card.tagBg} text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm`}>
                  {card.tag}
                </span>
              </div>
            </div>

            {/* Contenido derecha */}
            <div className="flex flex-col p-8 lg:p-10 flex-1 overflow-y-auto">

              {/* Botón cerrar */}
              <button
                onClick={() => setActiveId(null)}
                aria-label="Cerrar"
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/95 text-gray-500 hover:text-gray-900 hover:bg-white flex items-center justify-center shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <p className={`${card.tagBg} text-white text-xs font-semibold px-3 py-1.5 rounded-full w-fit mb-4 lg:hidden`}>
                {card.tag}
              </p>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight whitespace-pre-line">
                {card.titulo}
              </h2>
              <p className="text-base text-gray-500 font-medium mt-2">{card.subtitulo}</p>

              <p className="text-gray-600 leading-relaxed mt-5 text-[15px]">{card.desc}</p>

              <ul className="mt-6 space-y-3">
                {card.features.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#c9962a] flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-gray-700 text-sm font-medium leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={card.href}
                onClick={() => setActiveId(null)}
                className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#c9962a] text-white text-sm font-semibold hover:bg-[#a87a20] transition-colors shadow-lg shadow-[#c9962a]/30 w-fit"
              >
                {card.cta}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Sub-componente de tarjeta ────────────────────────────────────
function BentoCard({
  card,
  className,
  onOpen,
}: {
  card: CardData
  className: string
  onOpen: () => void
}) {
  return (
    <div
      onClick={onOpen}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer select-none ${className}`}
    >
      {/* Imagen de fondo con zoom suave en hover */}
      <Image
        src={card.imagen}
        alt={card.titulo.replace('\n', ' ')}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
      />

      {/* Overlay oscuro: más fuerte en la base */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />
      {/* Extra overlay en hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />

      {/* Contenido posicionado en la parte inferior */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">

        {/* Badge */}
        <span
          className={`${card.tagBg} text-white text-[11px] font-bold px-2.5 py-1 rounded-full w-fit mb-3 transition-all duration-300`}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {card.tag}
        </span>

        {/* Título */}
        <h3 className="text-white font-extrabold leading-tight text-2xl sm:text-[26px] drop-shadow whitespace-pre-line">
          {card.titulo}
        </h3>

        {/* Subtítulo: aparece en hover */}
        <p className="text-white/80 text-sm mt-1.5 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 line-clamp-2">
          {card.subtitulo}
        </p>

        {/* "Saber más" hint */}
        <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 delay-75">
          <span className="text-white/90 text-xs font-semibold">Saber más</span>
          <svg className="w-3.5 h-3.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/NavbarServer'
import SearchForm from '@/components/SearchForm'

const CIUDADES_POPULARES = [
  { nombre: 'Madrid', slug: 'madrid' },
  { nombre: 'Barcelona', slug: 'barcelona' },
  { nombre: 'Valencia', slug: 'valencia' },
  { nombre: 'Sevilla', slug: 'sevilla' },
  { nombre: 'Málaga', slug: 'malaga' },
  { nombre: 'Bilbao', slug: 'bilbao' },
  { nombre: 'Zaragoza', slug: 'zaragoza' },
  { nombre: 'Alicante', slug: 'alicante' },
]

const VENTAJAS = [
  {
    icon: '🔍',
    titulo: 'Solo particulares',
    desc: 'Filtramos automáticamente anuncios de agencias. Solo verás propietarios reales.',
  },
  {
    icon: '💬',
    titulo: 'Trato directo',
    desc: 'Contacta directamente con el dueño del piso. Sin intermediarios que encarezcan el alquiler.',
  },
  {
    icon: '📄',
    titulo: 'Contratos seguros',
    desc: 'Contratos de alquiler, arras y reserva redactados y revisados por nuestro equipo jurídico.',
  },
  {
    icon: '🆓',
    titulo: 'Publicar es gratis',
    desc: 'Sube tu anuncio sin coste. Gana visibilidad extra con nuestro servicio Turbo opcional.',
  },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* ── HERO con imagen de cabecera ─────────────────────────── */}
      <section className="relative overflow-hidden min-h-[520px] sm:min-h-[620px] flex items-center">
        <Image
          src="/imagencabezera.jpg"
          alt="Encuentra tu hogar ideal"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Overlay cálido oscuro */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0d00]/85 via-[#2e1900]/65 to-[#1a0d00]/35" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28 w-full">
          <div className="max-w-2xl mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#c9962a]/30 text-[#f4c94a] border border-[#c9962a]/40 mb-5 backdrop-blur-sm">
              ✦ Solo propietarios particulares
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
              Encuentra tu hogar.
              <br />
              <span className="text-[#f4c94a]">Sin agencias. Sin comisiones.</span>
            </h1>
            <p className="mt-5 text-lg text-white/80 max-w-xl leading-relaxed">
              Conectamos propietarios e inquilinos directamente. Ahorra tiempo y dinero buscando solo entre particulares.
            </p>
          </div>

          {/* Tarjeta de búsqueda flotante */}
          <div className="bg-white/96 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/30 border border-[#e8b52a]/20 p-4 sm:p-5 max-w-3xl">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* ── Strip de confianza ──────────────────────────────────── */}
      <section className="bg-[#fef9e8] border-y border-[#f4c94a]/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-sm text-gray-600">
          {[
            'Publicación gratuita',
            'Sin intermediarios',
            'Contratos jurídicos desde 7 €',
            'IA para verificar particulares',
          ].map((text) => (
            <span key={text} className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#c9962a] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {text}
            </span>
          ))}
        </div>
      </section>

      {/* ── Ciudades populares ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-lg font-semibold text-gray-700 mb-5">Buscar por ciudad</h2>
        <div className="flex flex-wrap gap-2">
          {CIUDADES_POPULARES.map((ciudad) => (
            <Link
              key={ciudad.slug}
              href={`/pisos?ciudad=${ciudad.slug}&solo_particulares=true`}
              className="px-4 py-2 rounded-full border border-[#e8b52a]/50 bg-white text-sm font-medium text-gray-700 hover:border-[#c9962a] hover:text-[#a87a20] hover:bg-[#fef9e8] transition-colors shadow-sm"
            >
              {ciudad.nombre}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Ventajas ────────────────────────────────────────────── */}
      <section className="bg-[#fffdf5] border-y border-[#f4c94a]/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            ¿Por qué Mi Vivienda Libre?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VENTAJAS.map((v) => (
              <div
                key={v.titulo}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-white border border-[#f4c94a]/30 shadow-sm hover:shadow-md hover:border-[#c9962a]/50 transition-all"
              >
                <span className="text-3xl mb-3">{v.icon}</span>
                <h3 className="font-semibold text-gray-900 mb-1.5">{v.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA publicar ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl shadow-xl bg-[#1a0d00] min-h-[300px] flex">
          {/* Columna izquierda — texto */}
          <div className="relative z-10 flex flex-col justify-center px-8 sm:px-12 py-12 flex-1">
            <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9962a]/25 text-[#f4c94a] text-xs font-semibold border border-[#c9962a]/40 mb-5">
              🏠 Para propietarios
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              ¿Tienes un piso para<br />alquilar o vender?
            </h2>
            <p className="mt-3 text-white/65 text-sm sm:text-base leading-relaxed max-w-sm">
              Crea tu anuncio en menos de 5 minutos. Nuestra IA genera el título y la descripción por ti.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                href="/publicar"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#c9962a] text-white font-semibold hover:bg-[#a87a20] transition-colors text-sm shadow-lg shadow-[#c9962a]/40"
              >
                Publicar mi anuncio gratis →
              </Link>
              <Link
                href="/vender-casa"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/25 text-white/80 font-medium hover:bg-white/10 transition-colors text-sm"
              >
                Buscar agencia inmobiliaria
              </Link>
            </div>
          </div>

          {/* Columna derecha — imagen */}
          <div className="hidden lg:block relative w-[420px] shrink-0">
            <Image
              src="/keys.jpg"
              alt="Llaves de casa"
              fill
              className="object-cover"
              sizes="420px"
            />
            {/* Fade hacia la izquierda para fusionar con el fondo */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a0d00] via-[#1a0d00]/20 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-[#f4c94a]/20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Mi Vivienda Libre" width={200} height={60} className="h-14 w-auto opacity-90" />
            <span>© 2026 Mi Vivienda Libre. Todos los derechos reservados.</span>
          </div>
          <div className="flex gap-5">
            <Link href="/aviso-legal" className="hover:text-[#c9962a] transition-colors">Aviso legal</Link>
            <Link href="/privacidad" className="hover:text-[#c9962a] transition-colors">Privacidad</Link>
            <Link href="/contacto" className="hover:text-[#c9962a] transition-colors">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}


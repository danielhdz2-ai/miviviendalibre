import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/NavbarServer'
import SearchForm from '@/components/SearchForm'
import BentoVentajas from '@/components/BentoVentajas'

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
              Inmonest: Quédate con<br />
              <span className="text-[#f4c94a]">el 100% de tu venta</span>
            </h1>
            <p className="mt-5 text-lg text-white/80 max-w-xl leading-relaxed">
              Tu nido, directo y sin comisiones. Conectamos propietarios e inquilinos directamente. Sin agencias, sin intermediarios.
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

      {/* ── ¿Por qué Inmonest? — Bento Grid ───────────────────── */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#c9962a]/15 text-[#a87a20] border border-[#c9962a]/25 mb-4">
              ✦ Nuestra propuesta de valor
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              ¿Por qué Inmonest?
            </h2>
            <p className="mt-3 text-gray-500 text-base max-w-xl mx-auto">
              Todo lo que necesitas para alquilar o comprar sin agencias, sin comisiones y con total seguridad.
            </p>
          </div>
          <BentoVentajas />
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
                href="/publicar-anuncio"
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

      {/* ── Buscador de Chollos ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative overflow-hidden rounded-3xl shadow-xl bg-[#0d1a0f] min-h-[300px] flex">
          {/* Columna izquierda — imagen */}
          <div className="hidden lg:block relative w-[420px] shrink-0 order-first">
            <Image
              src="/familia2.jpg"
              alt="Personas buscando chollos inmobiliarios"
              fill
              className="object-cover object-center"
              sizes="420px"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#0d1a0f] via-[#0d1a0f]/20 to-transparent" />
          </div>

          {/* Columna derecha — texto */}
          <div className="relative z-10 flex flex-col justify-center px-8 sm:px-12 py-12 flex-1">
            <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9962a]/25 text-[#f4c94a] text-xs font-semibold border border-[#c9962a]/40 mb-5">
              🔍 Oportunidades exclusivas
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              Buscador de<br /><span className="text-[#f4c94a]">Chollos</span>
            </h2>
            <p className="mt-3 text-white/65 text-sm sm:text-base leading-relaxed max-w-sm">
              Busca los chollos más interesantes de tu ciudad. Pisos de fondos bancarios, embargos y oportunidades únicas a precio de mercado o por debajo.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                href="/pisos?origen=fondos-bancarios"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#c9962a] text-white font-semibold hover:bg-[#a87a20] transition-colors text-sm shadow-lg shadow-[#c9962a]/40"
              >
                Ver chollos disponibles →
              </Link>
              <Link
                href="/pisos"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/25 text-white/80 font-medium hover:bg-white/10 transition-colors text-sm"
              >
                Explorar todos los pisos
              </Link>
            </div>
          </div>

          {/* Destellos decorativos */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9962a]/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-[#f4c94a]/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* ── ¿Buscas hipoteca? ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative overflow-hidden rounded-3xl shadow-xl bg-[#1a0d00] min-h-[300px] flex">
          {/* Columna izquierda — texto */}
          <div className="relative z-10 flex flex-col justify-center px-8 sm:px-12 py-12 flex-1">
            <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9962a]/25 text-[#f4c94a] text-xs font-semibold border border-[#c9962a]/40 mb-5">
              🏦 Financiación
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              ¿Estás buscando<br /><span className="text-[#f4c94a]">hipoteca?</span>
            </h2>
            <p className="mt-3 text-white/65 text-sm sm:text-base leading-relaxed max-w-sm">
              Te ayudamos a conseguir la mejor financiación a tu medida. Comparamos las mejores ofertas hipotecarias para que pagues menos cada mes.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                href="/gestoria?servicio=hipoteca"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#c9962a] text-white font-semibold hover:bg-[#a87a20] transition-colors text-sm shadow-lg shadow-[#c9962a]/40"
              >
                Quiero mi hipoteca →
              </Link>
              <Link
                href="/gestoria"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/25 text-white/80 font-medium hover:bg-white/10 transition-colors text-sm"
              >
                Ver todos los servicios
              </Link>
            </div>
          </div>

          {/* Columna derecha — imagen */}
          <div className="hidden lg:block relative w-[420px] shrink-0">
            <Image
              src="/familia3.jpg"
              alt="Familia buscando hipoteca"
              fill
              className="object-cover object-center"
              sizes="420px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a0d00] via-[#1a0d00]/20 to-transparent" />
          </div>
        </div>
      </section>


    </div>
  )
}


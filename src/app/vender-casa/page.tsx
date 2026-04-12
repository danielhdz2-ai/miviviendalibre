import type { Metadata } from 'next'
import Navbar from '@/components/NavbarServer'
import VenderForm from '@/components/VenderForm'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vende tu casa rápido — Inmonest',
  description: 'Conectamos propietarios con las mejores agencias inmobiliarias de tu zona. Gratis, sin compromiso y en menos de 24 horas.',
}

const PASOS = [
  {
    n: '1',
    icon: '📍',
    titulo: 'Indica la dirección',
    desc: 'Escribe la dirección exacta o aproximada de tu inmueble.',
  },
  {
    n: '2',
    icon: '🏠',
    titulo: 'Describe el inmueble',
    desc: 'Metros, habitaciones y estado. Cuanto más detalle, mejor valoración.',
  },
  {
    n: '3',
    icon: '📬',
    titulo: 'Contacta hasta 4 agencias',
    desc: 'Te ponemos en contacto con las agencias más adecuadas de tu zona. Sin compromiso.',
  },
]

const GARANTIAS = [
  { icon: '🆓', label: 'Gratis y sin compromiso' },
  { icon: '⚡', label: 'Respuesta en menos de 24h' },
  { icon: '🔒', label: 'Tus datos son privados' },
  { icon: '🤝', label: 'Máximo 4 agencias contactadas' },
]

const TESTIMONIOS = [
  {
    name: 'Carlos M.',
    city: 'Madrid',
    text: 'En 2 días ya tenía 3 agencias visitando mi piso. Lo vendí en 3 semanas.',
    stars: 5,
  },
  {
    name: 'Laura G.',
    city: 'Barcelona',
    text: 'Muy fácil de usar. Las agencias que contactaron eran profesionales y locales.',
    stars: 5,
  },
  {
    name: 'Javier R.',
    city: 'Valencia',
    text: 'Mejor que llamar yo mismo a cada agencia. Ahorra muchísimo tiempo.',
    stars: 5,
  },
]

export default function VenderCasaPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0d00] via-[#2e1900] to-[#42300a] min-h-[420px] sm:min-h-[500px] flex items-center">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #f4c94a 0%, transparent 60%), radial-gradient(circle at 75% 20%, #c9962a 0%, transparent 50%)' }}
        />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#c9962a]/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-[#f4c94a]/8 blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Copy */}
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#c9962a]/20 text-[#f4c94a] border border-[#c9962a]/30 mb-6">
                🏷️ Para propietarios
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                Las mejores agencias<br />
                <span className="text-[#f4c94a]">para vender tu casa</span><br />
                rápido
              </h1>
              <p className="mt-5 text-white/70 text-lg leading-relaxed max-w-lg">
                Encontramos las agencias inmobiliarias más adecuadas de tu zona.
                Solo tienes que indicarnos dónde está tu inmueble.
              </p>

              {/* Garantías */}
              <div className="mt-8 flex flex-wrap gap-3">
                {GARANTIAS.map(g => (
                  <span
                    key={g.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/85 text-xs font-medium border border-white/10"
                  >
                    {g.icon} {g.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Formulario flotante */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 p-6 sm:p-8 border border-white/10">
              <VenderForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              ¿Qué pasos debo seguir para vender mi casa?
            </h2>
            <p className="mt-3 text-gray-500">En menos de 3 minutos conectamos tu inmueble con las mejores agencias.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PASOS.map((p, i) => (
              <div key={p.n} className="relative flex flex-col items-center text-center">
                {/* Línea conectora */}
                {i < PASOS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-0.5 bg-[#c9962a]/20" />
                )}
                {/* Número */}
                <div className="w-20 h-20 rounded-2xl bg-[#fef9e8] border-2 border-[#c9962a]/20 flex items-center justify-center mb-5 relative z-10">
                  <span className="text-3xl">{p.icon}</span>
                </div>
                <div className="absolute -top-2 -right-2 md:static md:hidden w-6 h-6 rounded-full bg-[#c9962a] text-white text-xs font-extrabold flex items-center justify-center">
                  {p.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{p.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#fffdf5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-extrabold text-gray-900 mb-10">
            Propietarios que ya confiaron en nosotros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIOS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="text-[#c9962a] text-sm">★</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#fef9e8] border border-[#c9962a]/20 flex items-center justify-center text-sm font-bold text-[#c9962a]">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {[
              {
                q: '¿Es gratis el servicio?',
                a: 'Sí, totalmente gratis para el propietario. Las agencias pagan por acceder a los leads.',
              },
              {
                q: '¿Cuántas agencias me contactarán?',
                a: 'Un máximo de 4 agencias de tu zona, seleccionadas por su especialización y valoraciones.',
              },
              {
                q: '¿Qué pasa con mis datos?',
                a: 'Solo los compartimos con las agencias que seleccionamos. No los vendemos a terceros ni usamos para spam.',
              },
              {
                q: '¿También sirve para alquilar?',
                a: 'Sí. Puedes indicar en el formulario si quieres vender o poner en alquiler tu inmueble.',
              },
            ].map(item => (
              <details key={item.q} className="group border border-gray-100 rounded-2xl overflow-hidden">
                <summary className="flex justify-between items-center cursor-pointer px-5 py-4 font-semibold text-gray-900 hover:bg-[#fffdf5] select-none list-none">
                  {item.q}
                  <span className="text-[#c9962a] group-open:rotate-180 transition-transform duration-200 text-xl font-light">⌄</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────────────── */}
      <section className="py-14 bg-gradient-to-r from-[#2e1900] to-[#42300a]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-[#f4c94a] font-bold text-lg mb-2">¿Listado para agencias?</p>
          <p className="text-white/70 text-sm mb-6">Si eres una agencia inmobiliaria, accede a los leads de tu zona.</p>
          <Link
            href="/agencias"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#c9962a] text-white font-semibold text-sm hover:bg-[#a87a20] transition-colors"
          >
            Ver plan para agencias →
          </Link>
        </div>
      </section>
    </div>
  )
}

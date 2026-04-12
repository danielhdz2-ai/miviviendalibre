import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import NavbarServer from '@/components/NavbarServer'
import PublicarLandingClient from './PublicarLandingClient'

export const metadata = {
  title: 'Publica tu anuncio gratis — MiviviendaLibre',
  description: 'Publica tu piso o casa en MiviviendaLibre. 2 anuncios gratis, visibilidad Turbo inmediata, trato directo con compradores e inquilinos verificados.',
}

const PASOS = [
  {
    num: '01',
    icon: '🏠',
    titulo: 'Describe tu inmueble',
    desc: 'Nuestro formulario inteligente autocompleta tu dirección y te sugiere el precio óptimo basado en propiedades similares en tu zona.',
    detalle: 'Título automático, descripción IA, datos de m² y habitaciones.',
    color: 'from-blue-50 to-indigo-50',
    border: 'border-blue-100',
    iconBg: 'bg-blue-100',
    numColor: 'text-blue-300',
  },
  {
    num: '02',
    icon: '📸',
    titulo: 'Sube fotos de calidad',
    desc: 'Sistema drag & drop para cargar hasta 30 fotos. Ordénalas fácilmente y destaca las mejores.',
    detalle: '💡 Consejo Inmovía: Los anuncios con más de 10 fotos reciben un 40% más de contactos.',
    color: 'from-amber-50 to-yellow-50',
    border: 'border-amber-100',
    iconBg: 'bg-amber-100',
    numColor: 'text-amber-300',
    highlight: true,
  },
  {
    num: '03',
    icon: '🚀',
    titulo: 'Activa el Modo Turbo',
    desc: 'Al publicar, tu anuncio se distribuye automáticamente a nuestra red de compradores e inversores verificados en toda España.',
    detalle: 'Alertas inmediatas a usuarios que buscan propiedades como la tuya.',
    color: 'from-orange-50 to-red-50',
    border: 'border-orange-100',
    iconBg: 'bg-orange-100',
    numColor: 'text-orange-300',
  },
  {
    num: '04',
    icon: '🔒',
    titulo: 'Tú controlas el contacto',
    desc: 'Decide si muestras tu teléfono o gestionas todo a través de nuestro chat interno. Sin acoso de agencias, solo contactos serios.',
    detalle: 'Filtro anti-spam integrado. Bloquea contactos no deseados.',
    color: 'from-green-50 to-emerald-50',
    border: 'border-green-100',
    iconBg: 'bg-green-100',
    numColor: 'text-green-300',
  },
]

const VENTAJAS = [
  { icon: '🆓', titulo: '2 anuncios gratuitos', desc: 'Publica tus primeros 2 anuncios completamente gratis. Sin tarjeta de crédito.' },
  { icon: '⚡', titulo: 'Publicación inmediata', desc: 'Tu anuncio aparece en segundos. Sin moderación manual ni esperas.' },
  { icon: '👥', titulo: 'Compradores verificados', desc: 'Nuestra red de Modo Turbo solo incluye usuarios con intención real de compra o alquiler.' },
  { icon: '📊', titulo: 'Estadísticas en tiempo real', desc: 'Ve cuántas visitas y contactos ha recibido tu anuncio desde tu panel privado.' },
  { icon: '⚖️', titulo: 'Contratos legales incluidos', desc: 'Accede a contratos de arras, alquiler y reserva redactados por nuestro equipo jurídico.' },
  { icon: '🛡️', titulo: 'Protección de datos', desc: 'Tu teléfono nunca se muestra públicamente a menos que tú lo decidas.' },
]

const FAQS = [
  {
    q: '¿Cuántos anuncios puedo publicar gratis?',
    a: 'Los 2 primeros anuncios son completamente gratuitos y sin límite de tiempo. Para publicar más, puedes contratar el Plan Profesional.',
  },
  {
    q: '¿Cuánto tiempo tarda en aparecer mi anuncio?',
    a: 'La publicación es inmediata. En cuanto termines el formulario, tu anuncio estará visible y los usuarios del Modo Turbo recibirán una alerta.',
  },
  {
    q: '¿Pueden contactarme agencias inmobiliarias?',
    a: 'No si no quieres. Puedes activar el modo "Solo particulares" para que solo vean tu contacto usuarios verificados como particulares.',
  },
  {
    q: '¿Qué es el Modo Turbo?',
    a: 'Al activar Turbo, tu anuncio se promociona activamente entre nuestra base de compradores e inquilinos registrados que tienen alertas activas para propiedades como la tuya.',
  },
  {
    q: '¿Puedo editar o eliminar mi anuncio después?',
    a: 'Sí, desde tu panel "Mi cuenta" puedes editar, pausar o eliminar tus anuncios en cualquier momento.',
  },
]

export default async function PublicarAnuncioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <NavbarServer />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[540px] flex items-center">
        <Image
          src="/publicar-hero.jpg"
          alt="Publica tu anuncio inmobiliario"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0d00]/92 via-[#2e1900]/80 to-[#1a0d00]/50" />

        {/* Destellos decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9962a]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#f4c94a]/8 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#c9962a]/20 text-[#f4c94a] border border-[#c9962a]/30 mb-5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f4c94a] animate-pulse" />
              2 anuncios completamente gratis
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
              Cómo poner un anuncio<br />
              <span className="text-[#f4c94a]">en MiviviendaLibre</span>
            </h1>
            <p className="text-lg text-white/75 mb-8 leading-relaxed">
              Tus 2 primeros anuncios son gratuitos. Sin comisiones, trato directo
              con compradores reales. Visibilidad inmediata en toda España.
            </p>

            {/* Checklist rápida */}
            <ul className="space-y-2 mb-8">
              {[
                'Sin tarjeta de crédito',
                'Publicación en segundos',
                'Red de compradores verificados',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4 text-[#f4c94a] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA principal */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <PublicarLandingClient isLoggedIn={isLoggedIn} />
              <span className="text-xs text-white/40">
                ¿Eres profesional?{' '}
                <a href="/agencias" className="text-[#f4c94a]/80 hover:text-[#f4c94a] underline-offset-2 hover:underline">
                  Conoce nuestras soluciones para agencias
                </a>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 PASOS ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#c9962a] mb-3 block">Proceso simplificado</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              ¿Qué pasos seguir para publicar<br className="hidden sm:block" /> tu anuncio como propietario?
            </h2>
            <p className="mt-3 text-gray-500 text-base max-w-xl mx-auto">
              Hay 4 puntos clave para vender o alquilar cuanto antes tu inmueble.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PASOS.map((paso) => (
              <div
                key={paso.num}
                className={`relative rounded-2xl border ${paso.border} bg-gradient-to-br ${paso.color} p-7 overflow-hidden`}
              >
                {/* Número grande decorativo */}
                <span className={`absolute -top-4 -right-2 text-8xl font-black ${paso.numColor} select-none pointer-events-none`}>
                  {paso.num}
                </span>

                <div className={`w-12 h-12 ${paso.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                  {paso.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{paso.titulo}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{paso.desc}</p>

                {paso.highlight ? (
                  <div className="bg-[#c9962a]/10 border border-[#c9962a]/20 rounded-xl px-4 py-2.5 text-xs text-[#8a6520] font-medium leading-snug">
                    {paso.detalle}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">{paso.detalle}</p>
                )}
              </div>
            ))}
          </div>

          {/* CTA repetido */}
          <div className="text-center mt-12">
            <PublicarLandingClient isLoggedIn={isLoggedIn} />
            <p className="mt-3 text-sm text-gray-400">Sin registro previo. Crea tu cuenta al publicar.</p>
          </div>
        </div>
      </section>

      {/* ── FOTO + VENTAJAS ────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Imagen */}
            <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/publicar-deal.jpg"
                alt="Trato directo entre propietario y comprador"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0d00]/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/95 backdrop-blur rounded-2xl px-5 py-4 shadow-lg">
                  <p className="text-sm font-bold text-gray-900">🤝 Miles de tratos cerrados</p>
                  <p className="text-xs text-gray-500 mt-0.5">Entre propietarios y compradores particulares, sin pagar comisiones.</p>
                </div>
              </div>
            </div>

            {/* Ventajas */}
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#c9962a] mb-3 block">Por qué elegirnos</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-8">
                Todo lo que necesitas<br />en un solo lugar
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VENTAJAS.map((v) => (
                  <div key={v.titulo} className="flex gap-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{v.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{v.titulo}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANES ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#fef9e8]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#c9962a] mb-3 block">Precios transparentes</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-10">Elige tu plan</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Plan Gratuito */}
            <div className="bg-white rounded-2xl border border-gray-200 p-7 text-left shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Particular</p>
              <p className="text-3xl font-black text-gray-900 mb-1">Gratis</p>
              <p className="text-xs text-gray-400 mb-5">Para siempre · Sin tarjeta</p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-6">
                {['Hasta 2 anuncios activos', 'Fotos ilimitadas', 'Chat directo', 'Estadísticas básicas'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <PublicarLandingClient isLoggedIn={isLoggedIn} />
            </div>

            {/* Plan Profesional */}
            <div className="bg-gradient-to-br from-[#1a0d00] to-[#2e1900] rounded-2xl p-7 text-left shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-[#c9962a] text-white text-xs font-bold px-3 py-1 rounded-full">
                Popular
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#f4c94a]/70 mb-2">Profesional</p>
              <p className="text-3xl font-black text-white mb-1">29€<span className="text-base font-medium text-white/50">/mes</span></p>
              <p className="text-xs text-white/40 mb-5">Sin permanencia · Cancela cuando quieras</p>
              <ul className="space-y-2.5 text-sm text-white/80 mb-6">
                {['Anuncios ilimitados', 'Modo Turbo incluido', 'CRM de contactos', 'Estadísticas avanzadas', 'Contratos legales'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#f4c94a]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/agencias"
                className="inline-flex w-full justify-center items-center gap-2 px-6 py-3 rounded-full bg-[#c9962a] text-white font-bold text-sm hover:bg-[#a87a20] transition-colors"
              >
                Contratar ahora →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none font-semibold text-gray-900 text-sm hover:bg-gray-100 transition-colors">
                  {faq.q}
                  <svg className="w-4 h-4 text-[#c9962a] transition-transform group-open:rotate-180 flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#1a0d00] via-[#2e1900] to-[#1a0d00]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6 text-5xl">🏡</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Empieza a publicar gratis hoy
          </h2>
          <p className="text-white/60 text-base mb-8 max-w-xl mx-auto">
            Únete a miles de propietarios que ya venden y alquilan sin comisiones ni intermediarios.
          </p>
          <PublicarLandingClient isLoggedIn={isLoggedIn} />
          <p className="mt-4 text-xs text-white/30">
            Sin contratos. Sin pagos. Cancela cuando quieras.
          </p>
        </div>
      </section>
    </div>
  )
}

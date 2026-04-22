import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/NavbarServer'
import WhatsAppButton from '@/components/WhatsAppButton'
import HipotecaCalculadora from './HipotecaCalculadora'
import HipotecaContactForm from './HipotecaContactForm'

const BASE_URL = 'https://inmonest.com'

export const metadata: Metadata = {
  title: 'Hipoteca sin estrés — Te ayudamos a conseguir la mejor financiación',
  description: 'Compara las mejores hipotecas del mercado. Calculadora de cuota mensual, análisis de viabilidad financiera y gestión personalizada con nuestro equipo de expertos.',
  alternates: { canonical: `${BASE_URL}/hipoteca` },
  openGraph: {
    title: '¿Buscas hipoteca? Te ayudamos a conseguir la mejor financiación — Inmonest',
    description: 'Calculadora hipotecaria, comparativa de las mejores ofertas y asesoramiento personalizado. Sin compromiso.',
    url: `${BASE_URL}/hipoteca`,
    type: 'website',
    siteName: 'Inmonest',
    locale: 'es_ES',
  },
}

const VENTAJAS = [
  {
    icon: '🏆',
    titulo: 'Mejores condiciones del mercado',
    desc: 'Negociamos en tu nombre con más de 15 entidades bancarias para conseguirte el tipo de interés más bajo posible.',
  },
  {
    icon: '⚡',
    titulo: 'Respuesta en 24-48 horas',
    desc: 'Analizamos tu perfil financiero y te presentamos las mejores opciones en menos de 48 horas. Sin papeleo interminable.',
  },
  {
    icon: '🔒',
    titulo: 'Sin coste para ti',
    desc: 'Nuestro servicio de intermediación hipotecaria es completamente gratuito para el comprador. El banco nos remunera.',
  },
  {
    icon: '📋',
    titulo: 'Gestión integral del proceso',
    desc: 'Desde la tasación hasta la firma ante notario, te acompañamos en cada paso. Tú solo tienes que decidir.',
  },
]

const HIPOTECAS = [
  {
    entidad: 'Hipoteca Variable',
    tag: 'Tipo variable',
    tagColor: 'bg-blue-100 text-blue-700',
    tin: 'Euríbor + 0,49%',
    tae: 'TAE variable: 4,09%',
    plazo: 'Hasta 30 años',
    financiacion: 'Hasta el 80% del valor',
    destacado: false,
    pros: ['Sin comisión de apertura', 'Amortización anticipada sin coste', 'Bonificable con nómina + seguro'],
  },
  {
    entidad: 'Hipoteca Fija',
    tag: '⭐ Más elegida',
    tagColor: 'bg-[#fef0c0] text-[#a87a20]',
    tin: '2,95% TIN',
    tae: 'TAE: 3,28%',
    plazo: 'Hasta 30 años',
    financiacion: 'Hasta el 80% del valor',
    destacado: true,
    pros: ['Cuota fija para siempre', 'Sin sorpresas en la cuota', 'Precio de mercado competitivo'],
  },
  {
    entidad: 'Hipoteca Mixta',
    tag: 'Fija + Variable',
    tagColor: 'bg-purple-100 text-purple-700',
    tin: '2,30% primeros 10 años',
    tae: 'TAE variable: 3,82%',
    plazo: 'Hasta 30 años',
    financiacion: 'Hasta el 80% del valor',
    destacado: false,
    pros: ['Seguridad los primeros años', 'Posibilidad de beneficiarse de bajadas', 'Muy popular en 2025'],
  },
]

const PASOS = [
  { n: '01', titulo: 'Calcula tu cuota', desc: 'Usa nuestra calculadora para ver cuánto pagarías cada mes según precio, entrada y plazo.' },
  { n: '02', titulo: 'Consulta tu viabilidad', desc: 'Envíanos tu situación laboral e ingresos. Te decimos en 24h si un banco te concedería la hipoteca.' },
  { n: '03', titulo: 'Comparamos ofertas', desc: 'Contactamos con 15+ entidades en tu nombre y negociamos las mejores condiciones.' },
  { n: '04', titulo: 'Firma sin estrés', desc: 'Te acompañamos hasta la firma ante notario. Gestión completa, sin sorpresas.' },
]

const FAQS = [
  {
    q: '¿Cuánto necesito ahorrado para comprar un piso?',
    a: 'Los bancos financian hasta el 80% del valor de tasación, así que necesitas al menos el 20% de entrada más un 10-12% adicional para gastos de compraventa (notaría, registro, impuestos). En total, calcula entre el 30-32% del precio del piso.',
  },
  {
    q: '¿Qué ingresos necesito para que me concedan una hipoteca?',
    a: 'La regla general es que la cuota mensual no supere el 35% de tus ingresos netos. Si la cuota es 700 €/mes, necesitas ganar al menos 2.000 € netos. Con contrato indefinido y más de 2 años en la empresa, las posibilidades aumentan mucho.',
  },
  {
    q: '¿Hipoteca fija o variable en 2025?',
    a: 'Con el Euríbor en niveles moderados, las hipotecas fijas ofrecen muy buenas condiciones. Si valoras la estabilidad y dormir tranquilo, la fija es la mejor opción. Si tienes perfil de riesgo y un buen colchón de ahorro, la variable puede salir más barata a largo plazo.',
  },
  {
    q: '¿Cuánto tarda en concederse una hipoteca?',
    a: 'Con la documentación completa, una hipoteca tarda entre 3 y 6 semanas desde la solicitud hasta la firma. Con nuestro equipo, el proceso es más rápido porque gestionamos el expediente con los bancos directamente.',
  },
  {
    q: '¿Es gratuito vuestro servicio de hipotecas?',
    a: 'Sí, completamente gratis para ti. Somos intermediarios de crédito registrados ante el Banco de España y cobramos una comisión al banco, no al cliente.',
  },
]

export default function HipotecaPage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden bg-[#0d1a0f]">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <Image
            src="/familia6.jpg"
            alt="Familia buscando hipoteca"
            fill
            className="object-cover object-center opacity-40"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1a0f] via-[#0d1a0f]/80 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 sm:px-10 py-20 flex flex-col lg:flex-row gap-12 items-center w-full">
          {/* Texto izquierda */}
          <div className="flex-1 text-white">
            <span className="inline-flex items-center gap-2 bg-[#c9962a]/20 border border-[#c9962a]/40 text-[#f4c94a] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
              🏠 Financiación
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
              ¿Estás buscando<br />
              <span className="text-[#c9962a]">hipoteca?</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-md leading-relaxed">
              Te ayudamos a conseguir la mejor financiación a tu medida. Comparamos las mejores ofertas hipotecarias para que pagues menos cada mes.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 bg-[#c9962a] hover:bg-[#b8841e] text-white font-bold px-7 py-3.5 rounded-full transition-colors text-sm"
              >
                Quiero mi hipoteca →
              </a>
              <a
                href="#calculadora"
                className="inline-flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-3.5 rounded-full transition-colors text-sm"
              >
                Ver calculadora
              </a>
            </div>

            {/* Mini stats */}
            <div className="flex flex-wrap gap-8 mt-10 pt-8 border-t border-white/10">
              <div>
                <p className="text-2xl font-extrabold text-[#f4c94a]">15+</p>
                <p className="text-xs text-white/50 mt-0.5">Entidades bancarias</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#f4c94a]">48h</p>
                <p className="text-xs text-white/50 mt-0.5">Respuesta garantizada</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#f4c94a]">0 €</p>
                <p className="text-xs text-white/50 mt-0.5">Coste para ti</p>
              </div>
            </div>
          </div>

          {/* Calculadora flotante */}
          <div id="calculadora" className="w-full lg:w-[420px] shrink-0">
            <HipotecaCalculadora />
          </div>
        </div>
      </section>

      {/* ── VENTAJAS ── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-[#c9962a] uppercase tracking-widest mb-3">Por qué elegirnos</span>
            <h2 className="text-3xl font-bold text-gray-900">Tu hipoteca, sin complicaciones</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VENTAJAS.map(v => (
              <div key={v.titulo} className="bg-[#fef9e8] rounded-2xl p-6 border border-[#f4c94a]/20">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{v.titulo}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEJORES HIPOTECAS ── */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-[#c9962a] uppercase tracking-widest mb-3">Comparativa</span>
            <h2 className="text-3xl font-bold text-gray-900">Las mejores hipotecas del mercado</h2>
            <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">Condiciones orientativas. Las condiciones finales dependen de tu perfil y la entidad. Nuestro equipo negocia en tu nombre para mejorarlas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HIPOTECAS.map(h => (
              <div
                key={h.entidad}
                className={`relative rounded-2xl p-6 border flex flex-col ${
                  h.destacado
                    ? 'bg-[#0d1a0f] border-[#c9962a] text-white shadow-xl shadow-[#c9962a]/20'
                    : 'bg-white border-gray-100 text-gray-900'
                }`}
              >
                {/* Tag */}
                <span className={`self-start text-xs font-bold px-3 py-1 rounded-full mb-4 ${h.tagColor}`}>
                  {h.tag}
                </span>

                <h3 className={`text-xl font-extrabold mb-1 ${h.destacado ? 'text-white' : 'text-gray-900'}`}>
                  {h.entidad}
                </h3>
                <p className={`text-2xl font-black mb-0.5 ${h.destacado ? 'text-[#f4c94a]' : 'text-[#c9962a]'}`}>
                  {h.tin}
                </p>
                <p className={`text-xs mb-6 ${h.destacado ? 'text-white/50' : 'text-gray-400'}`}>{h.tae}</p>

                <dl className={`space-y-2 text-xs mb-6 ${h.destacado ? 'text-white/70' : 'text-gray-500'}`}>
                  <div className="flex justify-between">
                    <dt>Plazo máximo</dt>
                    <dd className="font-semibold">{h.plazo}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Financiación</dt>
                    <dd className="font-semibold">{h.financiacion}</dd>
                  </div>
                </dl>

                <ul className="space-y-1.5 mb-8 flex-1">
                  {h.pros.map(p => (
                    <li key={p} className={`flex items-start gap-2 text-xs ${h.destacado ? 'text-white/70' : 'text-gray-600'}`}>
                      <span className="text-[#c9962a] mt-0.5 font-bold shrink-0">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contacto"
                  className={`block text-center py-3 rounded-xl text-sm font-bold transition-colors ${
                    h.destacado
                      ? 'bg-[#c9962a] hover:bg-[#b8841e] text-white'
                      : 'border border-[#c9962a] text-[#c9962a] hover:bg-[#fef9e8]'
                  }`}
                >
                  Solicitar esta hipoteca
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            * Tipos orientativos a {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}. Sujetos a tasación y aprobación bancaria.
          </p>
        </div>
      </section>

      {/* ── FOTO + PASOS ── */}
      <section className="bg-white py-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          {/* Imagen */}
          <div className="relative w-full lg:w-1/2 h-[400px] rounded-3xl overflow-hidden shrink-0">
            <Image
              src="/familia20.jpg"
              alt="Familia en su nuevo hogar"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a0f]/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white font-bold text-xl">Más de 200 familias</p>
              <p className="text-white/70 text-sm">ya han conseguido su hipoteca con Inmonest</p>
            </div>
          </div>

          {/* Pasos */}
          <div className="flex-1">
            <span className="inline-block text-xs font-bold text-[#c9962a] uppercase tracking-widest mb-4">Cómo funciona</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Tu hipoteca en 4 pasos</h2>
            <div className="space-y-6">
              {PASOS.map(p => (
                <div key={p.n} className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-[#fef9e8] border border-[#f4c94a]/30 flex items-center justify-center">
                    <span className="text-xs font-black text-[#c9962a]">{p.n}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{p.titulo}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="#contacto"
              className="inline-flex items-center gap-2 mt-8 bg-[#c9962a] hover:bg-[#b8841e] text-white font-bold px-7 py-3.5 rounded-full transition-colors text-sm"
            >
              Consultar viabilidad financiera →
            </a>
          </div>
        </div>
      </section>

      {/* ── SEGUNDA IMAGEN ── */}
      <section className="relative h-64 overflow-hidden">
        <Image
          src="/familia2.jpg"
          alt="Familia feliz en su nuevo hogar"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0d1a0f]/60 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <p className="text-2xl sm:text-3xl font-extrabold mb-2">¿Cuánto puedes pedir de hipoteca?</p>
            <p className="text-white/70 text-sm max-w-lg mx-auto">Usa nuestra calculadora y descúbrelo en segundos. Sin registrarte.</p>
            <a href="#calculadora" className="inline-block mt-4 bg-[#c9962a] hover:bg-[#b8841e] text-white font-bold px-6 py-2.5 rounded-full text-sm transition-colors">
              Ir a la calculadora ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── FORMULARIO DE CONTACTO ── */}
      <section id="contacto" className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-start">

          {/* Texto izquierda */}
          <div className="lg:w-1/2">
            <span className="inline-block text-xs font-bold text-[#c9962a] uppercase tracking-widest mb-4">Consulta gratuita</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Analiza tu viabilidad financiera</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Cuéntanos tu situación y nuestro equipo de expertos hipotecarios te dirá en 24-48 horas si un banco te concedería la hipoteca y en qué condiciones. Sin compromiso, sin costes.
            </p>

            {/* Imagen */}
            <div className="relative h-56 rounded-2xl overflow-hidden">
              <Image
                src="/familia3.jpg"
                alt="Pareja con su nuevo bebé en su hogar"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Garantías */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: '🔒', txt: 'Datos 100% privados' },
                { icon: '🆓', txt: 'Sin coste para ti' },
                { icon: '⚡', txt: 'Respuesta en 24-48h' },
                { icon: '🤝', txt: 'Sin compromiso' },
              ].map(g => (
                <div key={g.txt} className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100">
                  <span className="text-lg">{g.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{g.txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario derecha */}
          <div className="w-full lg:w-1/2">
            <HipotecaContactForm />
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-[#c9962a] uppercase tracking-widest mb-3">Preguntas frecuentes</span>
            <h2 className="text-3xl font-bold text-gray-900">Todo lo que necesitas saber</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(f => (
              <details key={f.q} className="group bg-[#fef9e8] rounded-2xl border border-[#f4c94a]/20 overflow-hidden">
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer select-none">
                  <span className="font-semibold text-gray-900 text-sm">{f.q}</span>
                  <span className="text-[#c9962a] font-bold text-lg group-open:rotate-45 transition-transform shrink-0">+</span>
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-[#f4c94a]/20 pt-4">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-[#0d1a0f] py-16 px-6">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-extrabold mb-4">¿Listo para encontrar tu hipoteca ideal?</h2>
          <p className="text-white/60 text-sm mb-8 max-w-lg mx-auto">
            Nuestro equipo de expertos hipotecarios está disponible para ayudarte. Consulta gratuita, sin compromiso.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="#contacto"
              className="bg-[#c9962a] hover:bg-[#b8841e] text-white font-bold px-8 py-3.5 rounded-full transition-colors"
            >
              Consultar gratis →
            </a>
            <Link
              href="/gestoria"
              className="border border-white/30 text-white hover:bg-white/10 font-semibold px-7 py-3.5 rounded-full transition-colors"
            >
              Ver servicios jurídicos
            </Link>
          </div>
        </div>
      </section>

      <WhatsAppButton />
    </>
  )
}

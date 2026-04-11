'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANES = [
  {
    name: 'Escaparate Básico',
    price: '0',
    period: '/mes',
    highlight: false,
    features: [
      'Hasta 10 inmuebles publicados',
      'Fotos hasta 5 por anuncio',
      'Apareces en resultados estándar',
      'Ficha de agencia pública',
    ],
    cta: 'Empezar gratis',
    ctaHref: '/registro?tipo=agencia',
  },
  {
    name: 'Agencia Premium',
    price: '49',
    period: '/mes',
    highlight: true,
    features: [
      'Inmuebles ilimitados',
      'Fotos ilimitadas por anuncio',
      'Posición destacada en resultados',
      'Logo y marca en cada anuncio',
      'Importación automática por feed XML',
      'Panel de estadísticas avanzadas',
      'Turbo gratuito en 2 anuncios/mes',
    ],
    cta: 'Contactar para alta',
    ctaHref: '#contactar',
  },
  {
    name: 'Red de Franquicia',
    price: 'A medida',
    period: '',
    highlight: false,
    features: [
      'Todo de Premium',
      'Gestión centralizada multi-oficina',
      'Feed XML automatizado con tu CRM',
      'API de integración directa',
      'Manager de cuenta dedicado',
    ],
    cta: 'Hablar con ventas',
    ctaHref: '#contactar',
  },
]

const STATS = [
  { value: '615+', label: 'Inmuebles activos' },
  { value: '100%', label: 'Sin comisiones de portal' },
  { value: '3 días', label: 'Alta media de agencias' },
  { value: '24h', label: 'Importación via feed XML' },
]

const FAQS = [
  {
    q: '¿Cómo funciona la importación por feed XML?',
    a: 'Nos envías la URL de tu feed XML estándar (compatible con los formatos de Inmovilla, Witei, Sooprema y otros CRMs). Cada 24 horas sincronizamos automáticamente tus inmuebles: nuevos, actualizados y eliminados.',
  },
  {
    q: '¿Qué formatos XML admitís?',
    a: 'El estándar InmoFeed (el más común en España), así como cualquier XML con campos básicos de inmueble. También aceptamos JSON. Contacta con nosotros para revisar tu formato específico.',
  },
  {
    q: '¿Puedo publicar inmuebles manualmente sin XML?',
    a: 'Sí. En el plan Básico puedes publicar hasta 10 inmuebles manualmente desde tu panel. En Premium tienes inmuebles ilimitados tanto por feed como manualmente.',
  },
  {
    q: '¿Aparecerán mis anuncios diferenciados como agencia?',
    a: 'En el plan Premium, cada anuncio tuyo lleva tu logo, nombre de agencia y un badge "Agencia verificada". En el plan Básico aparece tu nombre sin logo.',
  },
  {
    q: '¿Tienen contrato de permanencia?',
    a: 'No. El plan Premium es mensual, puedes cancelar cuando quieras. Las altas de red de franquicia pueden tener condiciones específicas.',
  },
]

export default function AgenciasContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [form, setForm] = useState({ nombre: '', empresa: '', email: '', telefono: '', mensaje: '', plan: 'premium' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/agencias/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Error al enviar')
      setSent(true)
    } catch {
      setError('Hubo un problema al enviar. Por favor escríbenos a hola@miviviendalibre.com')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="bg-white min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-[#c9962a] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
            Para inmobiliarias
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Tu inmobiliaria,<br />
            <span className="text-[#f4c94a]">sin intermediarios de portal</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Publica tus inmuebles ante compradores y arrendatarios cualificados.
            Sin coste por clic. Sin pujas de visibilidad. Sin ruido de portales masificados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#planes" className="px-8 py-4 bg-[#c9962a] text-white font-bold rounded-full text-base hover:bg-[#a87a20] transition-colors">
              Ver planes y precios
            </a>
            <a href="#contactar" className="px-8 py-4 border border-white/30 text-white font-semibold rounded-full text-base hover:bg-white/10 transition-colors">
              Hablar con nosotros
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {STATS.map((s, i) => (
            <div key={i} className="py-8 px-6 text-center">
              <div className="text-3xl font-bold text-[#c9962a]">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">
            Estar en Mi Vivienda Libre es así de fácil
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Regístrate como agencia', desc: 'Crea tu cuenta en 2 minutos. Verificamos tu empresa con CIF y licencia.' },
              { step: '02', title: 'Conecta tu feed XML', desc: 'Péganos la URL de tu feed del CRM (Inmovilla, Witei, Sooprema...) y sincronizamos automáticamente cada 24h.' },
              { step: '03', title: 'Recibe contactos directos', desc: 'Los interesados contactan contigo directamente. Sin comisiones añadidas, sin intermediarios.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-black text-gray-100 mb-2">{item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planes ───────────────────────────────────────────── */}
      <section id="planes" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">Planes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANES.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? 'bg-gray-900 text-white ring-2 ring-[#c9962a] shadow-xl relative'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9962a] text-white text-xs font-bold px-4 py-1 rounded-full">
                    Más popular
                  </span>
                )}
                <h3 className={`text-lg font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-[#f4c94a]' : 'text-[#c9962a]'}`}>
                    {plan.price === '0' ? 'Gratis' : plan.price === 'A medida' ? plan.price : `${plan.price}€`}
                  </span>
                  <span className={`text-sm pb-1 ${plan.highlight ? 'text-gray-400' : 'text-gray-400'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="text-[#c9962a] mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaHref}
                  className={`block text-center py-3 rounded-full font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-[#c9962a] text-white hover:bg-[#a87a20]'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feed XML info ─────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <span className="text-[#c9962a] text-xs font-bold uppercase tracking-widest">Integración técnica</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
              Tu CRM ya tiene el feed.<br />Nosotros lo importamos.
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              La mayoría de CRMs inmobiliarios generan automáticamente un feed XML con todos tus inmuebles.
              Solo tienes que darnos la URL y activamos la sincronización automática diaria.
            </p>
            <div className="space-y-3">
              {['Inmovilla', 'Witei', 'Sooprema', 'Inmofactory', 'Cualquier XML estándar'].map((crm, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
                  {crm}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-gray-900 rounded-2xl p-6 text-sm font-mono text-green-400 overflow-x-auto">
            <div className="text-gray-500 mb-2">{/* Ejemplo INMOFEED estándar */}</div>
            <pre className="text-xs leading-relaxed">{`<inmuebles>
  <inmueble>
    <referencia>MV-001</referencia>
    <operacion>venta</operacion>
    <precio>250000</precio>
    <provincia>Madrid</provincia>
    <localidad>Madrid</localidad>
    <superficie>85</superficie>
    <habitaciones>3</habitaciones>
    <banos>1</banos>
    <titulo>Piso en Chamberí</titulo>
    <fotos>
      <foto>https://...</foto>
    </fotos>
  </inmueble>
</inmuebles>`}</pre>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  className="w-full text-left px-6 py-4 flex justify-between items-center gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-sm text-gray-900">{faq.q}</span>
                  <span className="text-[#c9962a] text-xl flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formulario de contacto ────────────────────────────── */}
      <section id="contactar" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Empieza hoy</h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            Cuéntanos sobre tu agencia y te contactamos en 24h
          </p>

          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-bold text-green-800 mb-2">¡Mensaje recibido!</h3>
              <p className="text-green-700 text-sm">Te contactaremos en menos de 24 horas.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre *</label>
                  <input
                    required
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9962a]/30"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Empresa *</label>
                  <input
                    required
                    value={form.empresa}
                    onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9962a]/30"
                    placeholder="Inmobiliaria XYZ"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email *</label>
                  <input
                    required type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9962a]/30"
                    placeholder="hola@tuagencia.es"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teléfono</label>
                  <input
                    value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9962a]/30"
                    placeholder="600 000 000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Plan de interés</label>
                <select
                  value={form.plan}
                  onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9962a]/30 bg-white"
                >
                  <option value="basico">Escaparate Básico (gratis)</option>
                  <option value="premium">Agencia Premium (49€/mes)</option>
                  <option value="franquicia">Red de Franquicia (a medida)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cuéntanos sobre tu agencia</label>
                <textarea
                  rows={3}
                  value={form.mensaje}
                  onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9962a]/30 resize-none"
                  placeholder="Número de inmuebles, ciudades donde operas, CRM que usas..."
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 bg-[#c9962a] text-white font-bold rounded-full text-sm hover:bg-[#a87a20] transition-colors disabled:opacity-60"
              >
                {sending ? 'Enviando...' : 'Solicitar alta como agencia →'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-14 px-4 text-center">
        <p className="text-gray-400 text-sm mb-2">¿Prefieres hablar directamente?</p>
        <a href="mailto:hola@miviviendalibre.com" className="text-[#f4c94a] font-semibold hover:underline">
          hola@miviviendalibre.com
        </a>
      </section>
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { gtmPush } from '@/components/GTMProvider'

interface Props {
  serviceKey: string
  price: number
  /** Texto descriptivo del servicio, ej: "Revisión legal de tu contrato de arras" */
  label: string
}

const BENEFITS = [
  {
    icon: '⚖️',
    title: 'Seguridad jurídica',
    desc: 'Contratos revisados por abogados especializados en derecho inmobiliario.',
  },
  {
    icon: '⚡',
    title: 'Entrega en 24 horas',
    desc: 'Recibes el informe completo en tu email antes de 24 horas hábiles.',
  },
  {
    icon: '🔒',
    title: 'Pago 100 % seguro',
    desc: 'Procesado por Stripe. Tus datos bancarios nunca pasan por nuestros servidores.',
  },
  {
    icon: '✍️',
    title: 'Redactado a medida',
    desc: 'Adaptado a la normativa vigente y a las condiciones de tu operación concreta.',
  },
]

const SPINNER = (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

const LOCK_ICON = (
  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

export default function LeadCaptureForm({ serviceKey, price, label }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'sending' | 'error'>('loading')
  const [errMsg, setErrMsg] = useState('')
  // When user is logged-in we can skip the form entirely and go straight to Stripe
  const [loggedIn, setLoggedIn] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  // Auto-fill from session on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return
        if (user) {
          setLoggedIn(true)
          setForm(prev => ({
            name:  prev.name  || (user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || '',
            email: prev.email || user.email || '',
            phone: prev.phone || (user.user_metadata?.phone as string | undefined) || '',
          }))
        }
      } catch {
        // silently ignore — form works without session
      } finally {
        if (!cancelled) setStatus('idle')
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrMsg('')

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.name.trim())                  { setErrMsg('El nombre es obligatorio.');         setStatus('error'); return }
    if (!EMAIL_RE.test(form.email.trim()))  { setErrMsg('Introduce un email válido.');        setStatus('error'); return }
    if (!form.phone.trim())                 { setErrMsg('El teléfono es obligatorio.');       setStatus('error'); return }

    // ── Evento GTM: usuario completó el formulario (lead capturado) ───────────
    gtmPush({
      event:       'generate_lead',
      service_key: serviceKey,
      value:       price,
      currency:    'EUR',
    })

    try {
      const res = await fetch('/api/gestoria/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_key:  serviceKey,
          client_name:  form.name.trim().slice(0, 120),
          client_email: form.email.trim().slice(0, 200),
          client_phone: form.phone.trim().slice(0, 30),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago')
      if (data.url) {
        // ── Evento GTM: usuario inicia el pago en Stripe ─────────────────────
        gtmPush({
          event:       'begin_checkout',
          service_key: serviceKey,
          value:       price,
          currency:    'EUR',
          items:       [{ item_name: label, item_id: serviceKey, price, quantity: 1 }],
        })
        window.location.href = data.url
      }
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error inesperado. Inténtalo de nuevo.')
      setStatus('error')
    }
  }

  const inp = [
    'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-[#c9962a]/40 focus:border-[#c9962a]',
    'placeholder:text-gray-400 bg-white transition',
  ].join(' ')

  const isSending = status === 'sending'
  const isLoading = status === 'loading'

  return (
    <div className="rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* ── Dos columnas ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row">

        {/* ── Columna izquierda: confianza ──────────────────────────── */}
        <div className="md:w-[42%] bg-gradient-to-br from-[#1a2f1c] to-[#0d1a0f] p-8 flex flex-col text-white">

          {/* Logo */}
          <div className="flex items-center mb-7 gap-0">
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-white">Inmo</span><span className="text-[#f4c94a]">nest</span>
            </span>
          </div>

          {/* Servicio + precio */}
          <div className="bg-white/10 rounded-xl p-4 mb-7 border border-white/20">
            <p className="text-[10px] text-[#f4c94a] font-bold uppercase tracking-widest mb-1">Servicio seleccionado</p>
            <p className="text-sm font-semibold leading-snug text-white/90">{label}</p>
            <p className="text-4xl font-extrabold text-[#f4c94a] mt-2">{price} €</p>
            <p className="text-xs text-white/50 mt-0.5">Pago único · Sin suscripción</p>
          </div>

          {/* Beneficios */}
          <div className="space-y-5 flex-1">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex gap-3 items-start">
                <span className="text-xl leading-none mt-0.5">{b.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white/95">{b.title}</p>
                  <p className="text-xs text-white/55 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stripe badge */}
          <div className="mt-8 flex items-center gap-2 text-white/40 text-xs">
            {LOCK_ICON}
            <span>Pago procesado por Stripe. PCI DSS compliant.</span>
          </div>
        </div>

        {/* ── Columna derecha: formulario ───────────────────────────── */}
        <div className="flex-1 bg-white p-8 flex flex-col justify-center">
          <h3 className="text-lg font-extrabold text-gray-900 mb-1">Solicitar ahora</h3>
          <p className="text-sm text-gray-500 mb-6">
            Introduce tus datos y te redirigiremos al pago seguro.
          </p>

          {loggedIn && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
              ✅ Sesión detectada — datos rellenados automáticamente. Revisa y confirma.
            </p>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2 text-sm">
              {SPINNER} Cargando…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="María García López"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  disabled={isSending}
                  className={inp}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  disabled={isSending}
                  className={inp}
                />
                <p className="text-[11px] text-gray-400 mt-1">Te enviaremos el contrato a esta dirección.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+34 600 000 000"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  disabled={isSending}
                  className={inp}
                />
              </div>

              {status === 'error' && errMsg && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  ⚠️ {errMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2 bg-[#c9962a] hover:bg-[#b8841f] active:scale-[0.98] disabled:opacity-60 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-all shadow-md mt-2"
              >
                {isSending
                  ? <>{SPINNER} Procesando…</>
                  : <>{LOCK_ICON} Pagar con tarjeta — {price} €</>
                }
              </button>

              <p className="text-[11px] text-center text-gray-400 leading-relaxed">
                Al continuar aceptas los{' '}
                <a href="/aviso-legal" className="underline hover:text-[#c9962a]">términos de servicio</a>.
                {' '}Tus datos bancarios nunca pasan por nuestros servidores.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

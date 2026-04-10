'use client'

import { useState } from 'react'

interface Service {
  key: string
  name: string
  price: number
}

interface Props {
  service: Service | null
  onClose: () => void
}

export default function SolicitarModal({ service, onClose }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  if (!service) return null

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrMsg('')
    try {
      const res = await fetch('/api/gestoria/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_key: service.key,
          service_name: service.name,
          price_eur: service.price,
          client_name: form.name,
          client_email: form.email,
          client_phone: form.phone,
          notes: form.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      setStatus('sent')
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : 'Error al enviar')
      setStatus('error')
    }
  }

  const input = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9962a] focus:border-[#c9962a]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7a5c1e] to-[#c9962a] rounded-t-2xl px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1">Solicitar servicio</p>
              <h3 className="text-lg font-bold leading-tight">{service.name}</h3>
              <p className="text-2xl font-extrabold mt-1">{service.price} €</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white mt-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {status === 'sent' ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-1">¡Solicitud recibida!</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nuestro equipo de gestoría se pondrá en contacto contigo en menos de <strong>24 horas</strong> para confirmar los detalles y proceder al pago.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2.5 bg-[#c9962a] text-white rounded-full text-sm font-semibold hover:bg-[#a87a20] transition-colors"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="María García López"
                  className={input}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="maria@ejemplo.com"
                  className={input}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="600 000 000"
                  className={input}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas o información adicional</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Comunidad autónoma, fecha deseada, particularidades del contrato..."
                  className={`${input} resize-none`}
                />
              </div>

              {status === 'error' && (
                <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{errMsg}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full py-3 bg-[#c9962a] text-white rounded-xl font-bold text-sm hover:bg-[#a87a20] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {status === 'sending' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                      </svg>
                      Enviando...
                    </>
                  ) : 'Solicitar este servicio'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Te contactamos en 24h · Sin pago por adelantado
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

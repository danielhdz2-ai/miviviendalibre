'use client'

import { useState } from 'react'

interface FormState {
  nombre: string
  email: string
  telefono: string
  ingresos: string
  precio_piso: string
  entrada: string
  empleo: string
  mensaje: string
}

export default function HipotecaContactForm() {
  const [form, setForm] = useState<FormState>({
    nombre: '', email: '', telefono: '',
    ingresos: '', precio_piso: '', entrada: '',
    empleo: 'indefinido', mensaje: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const resendKey = ''  // handled server-side via /api/contacto
      const body = `
        <b>Consulta hipoteca</b><br>
        Nombre: ${form.nombre}<br>
        Email: ${form.email}<br>
        Teléfono: ${form.telefono}<br>
        Ingresos netos/mes: ${form.ingresos} €<br>
        Precio del piso: ${form.precio_piso} €<br>
        Entrada disponible: ${form.entrada} €<br>
        Tipo de empleo: ${form.empleo}<br>
        Mensaje: ${form.mensaje}
      `
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          asunto: `[Hipoteca] Consulta de ${form.nombre}`,
          mensaje: `Ingresos: ${form.ingresos}€/mes | Precio piso: ${form.precio_piso}€ | Entrada: ${form.entrada}€ | Empleo: ${form.empleo}\n\n${form.mensaje}`,
        }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        setError('No se pudo enviar. Inténtalo de nuevo o escríbenos a info@inmonest.com')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9962a]/40 focus:border-[#c9962a] transition-colors bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'

  if (sent) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">¡Consulta recibida!</h3>
        <p className="text-gray-500 text-sm">
          Nuestro equipo analizará tu perfil y te responderá en <strong>menos de 48 horas</strong> con las mejores opciones hipotecarias para ti.
        </p>
        <p className="text-xs text-gray-400 mt-4">Revisa también tu carpeta de spam.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-4">
      <h3 className="font-bold text-gray-900 text-lg mb-2">Consulta tu viabilidad financiera</h3>
      <p className="text-xs text-gray-400 mb-4">Rellena el formulario y te respondemos en menos de 48h. Sin compromiso.</p>

      {/* Nombre + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nombre *</label>
          <input type="text" required value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} placeholder="Tu nombre" />
        </div>
        <div>
          <label className={labelCls}>Email *</label>
          <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="tu@email.com" />
        </div>
      </div>

      {/* Teléfono + Tipo empleo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Teléfono</label>
          <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} className={inputCls} placeholder="600 000 000" />
        </div>
        <div>
          <label className={labelCls}>Tipo de empleo</label>
          <select value={form.empleo} onChange={e => set('empleo', e.target.value)} className={inputCls + ' bg-white'}>
            <option value="indefinido">Contrato indefinido</option>
            <option value="temporal">Contrato temporal</option>
            <option value="autonomo">Autónomo</option>
            <option value="funcionario">Funcionario</option>
            <option value="empresario">Empresario</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      {/* Ingresos + Precio piso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Ingresos netos/mes (€)</label>
          <input type="number" min={0} value={form.ingresos} onChange={e => set('ingresos', e.target.value)} className={inputCls} placeholder="Ej: 2500" />
        </div>
        <div>
          <label className={labelCls}>Precio del piso (€)</label>
          <input type="number" min={0} value={form.precio_piso} onChange={e => set('precio_piso', e.target.value)} className={inputCls} placeholder="Ej: 220000" />
        </div>
      </div>

      {/* Entrada */}
      <div>
        <label className={labelCls}>Entrada disponible (€)</label>
        <input type="number" min={0} value={form.entrada} onChange={e => set('entrada', e.target.value)} className={inputCls} placeholder="Ej: 44000 (20% de 220.000 €)" />
      </div>

      {/* Mensaje */}
      <div>
        <label className={labelCls}>¿Algo más que quieras contarnos?</label>
        <textarea
          rows={3}
          value={form.mensaje}
          onChange={e => set('mensaje', e.target.value)}
          className={inputCls + ' resize-none'}
          placeholder="Situación especial, deudas actuales, segunda residencia..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-[#c9962a] hover:bg-[#b8841e] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
      >
        {sending ? 'Enviando...' : 'Consultar viabilidad financiera →'}
      </button>

      <p className="text-[11px] text-gray-400 text-center">
        Servicio gratuito · Tus datos son privados · Sin compromiso
      </p>
    </form>
  )
}

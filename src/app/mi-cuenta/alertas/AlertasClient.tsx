'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SearchAlert {
  id: string
  label: string
  filters: Record<string, unknown>
  frequency: string
  active: boolean
  last_sent_at: string | null
  total_sent: number
  created_at: string
}

const FREQ_LABELS: Record<string, string> = {
  immediate: '⚡ Inmediata (cada hora)',
  daily:     '📅 Diaria',
  weekly:    '📆 Semanal',
}

export default function AlertasClient({ initialAlerts }: { initialAlerts: SearchAlert[] }) {
  const [alerts, setAlerts]     = useState<SearchAlert[]>(initialAlerts)
  const [loading, setLoading]   = useState<string | null>(null)

  async function toggleActive(id: string, current: boolean) {
    setLoading(id + '-toggle')
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !current } : a))
    try {
      await fetch(`/api/alertas/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ active: !current }),
      })
    } catch {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: current } : a))
    } finally {
      setLoading(null)
    }
  }

  async function changeFrequency(id: string, frequency: string) {
    setLoading(id + '-freq')
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, frequency } : a))
    await fetch(`/api/alertas/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ frequency }),
    })
    setLoading(null)
  }

  async function deleteAlert(id: string) {
    if (!confirm('¿Eliminar esta alerta?')) return
    setAlerts(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/alertas/${id}`, { method: 'DELETE' })
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5">🔔</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Sin alertas creadas</h2>
        <p className="text-sm text-gray-400 max-w-sm mx-auto mb-8">
          Busca pisos en el portal y haz clic en <strong>"Guardar alerta"</strong> para que te avisemos cuando aparezcan nuevos inmuebles.
        </p>
        <Link
          href="/pisos"
          className="inline-flex items-center gap-2 bg-[#c9962a] hover:bg-[#b8841e] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Ir a buscar pisos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">💡</span>
        <p className="text-sm text-blue-800">
          Tienes <strong>{alerts.length} alerta{alerts.length !== 1 ? 's' : ''}</strong>.
          Máximo 10. Para crear más, busca pisos y guarda tus filtros desde la página de resultados.
        </p>
      </div>

      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`bg-white rounded-2xl border-2 transition-all ${
            alert.active ? 'border-gray-200 hover:border-gray-300' : 'border-gray-100 opacity-60'
          }`}
        >
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              {/* Info alerta */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">{alert.active ? '🔔' : '🔕'}</span>
                  <h3 className="font-semibold text-gray-900 text-base truncate">{alert.label}</h3>
                  {!alert.active && (
                    <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Pausada</span>
                  )}
                </div>

                {/* Filtros como chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(alert.filters).map(([k, v]) => {
                    if (!v) return null
                    const labels: Record<string, string> = {
                      ciudad: `📍 ${v}`, operacion: v === 'rent' ? '🏠 Alquiler' : '🏷️ Venta',
                      precio_max: `≤${v}€`, precio_min: `≥${v}€`,
                      habitaciones: `${v} hab.`, banos_min: `${v}+ baños`,
                      area_min: `≥${v} m²`, area_max: `≤${v} m²`,
                      solo_particulares: '💎 Solo particulares',
                      solo_bancarias: '🏦 Solo bancarios',
                    }
                    const chip = labels[k]
                    if (!chip) return null
                    return (
                      <span key={k} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        {chip}
                      </span>
                    )
                  })}
                </div>

                {/* Estadísticas */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>Creada {new Date(alert.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                  {alert.last_sent_at && (
                    <span>Último aviso {new Date(alert.last_sent_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                  )}
                  {alert.total_sent > 0 && (
                    <span>{alert.total_sent} email{alert.total_sent !== 1 ? 's' : ''} enviado{alert.total_sent !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle on/off */}
                <button
                  onClick={() => toggleActive(alert.id, alert.active)}
                  disabled={loading === alert.id + '-toggle'}
                  title={alert.active ? 'Pausar alerta' : 'Activar alerta'}
                  className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                    alert.active ? 'bg-[#c9962a]' : 'bg-gray-200'
                  } disabled:opacity-60`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    alert.active ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>

                {/* Eliminar */}
                <button
                  onClick={() => deleteAlert(alert.id)}
                  title="Eliminar alerta"
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Frecuencia */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Frecuencia:</span>
              {(['immediate', 'daily', 'weekly'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => changeFrequency(alert.id, f)}
                  disabled={loading === alert.id + '-freq'}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                    alert.frequency === f
                      ? 'bg-[#c9962a] text-white border-[#c9962a]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {FREQ_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'

const SERVICE_LABELS: Record<string, string> = {
  'arras-confirmatorias':  'Contrato de Arras Confirmatorias',
  'arras-penitenciales':   'Contrato de Arras Penitenciales',
  'alquiler-vivienda-lau': 'Contrato de Alquiler Residencial (LAU)',
  'alquiler-temporada':    'Contrato de Alquiler de Temporada',
  'opcion-compra':         'Contrato de Opción de Compra',
  'reserva-compra':        'Contrato de Reserva de Compra',
  'rescision-alquiler':    'Rescisión de Alquiler',
  'compraventa-privada':   'Contrato de Compraventa Privada',
  'cesion-derechos':       'Contrato de Cesión de Derechos',
  'alquiler-habitacion':   'Contrato de Alquiler de Habitación',
  'liquidacion-fianza':    'Liquidación de Fianza',
  'devolucion-fianzas':    'Devolución de Fianzas',
}

const STEPS = [
  { n: 1, label: 'Pago confirmado',      icon: '💳' },
  { n: 2, label: 'Docs recibidos',       icon: '📋' },
  { n: 3, label: 'En elaboración',       icon: '⚙️' },
  { n: 4, label: 'Contrato entregado',   icon: '✅' },
]

export interface GestoriaRequest {
  id: string
  session_id: string | null
  service_key: string
  client_name: string | null
  client_email: string | null
  amount_eur: number | null
  status: string
  step: number | null
  paid_at: string | null
  contract_path: string | null
  created_at: string
}

interface Props {
  requests: GestoriaRequest[]
  justPaid: boolean
  userEmail: string
}

// ── Upload state ──────────────────────────────────────────────────────────────
type UploadStatus = 'idle' | 'uploading' | 'done' | 'error'
interface FileEntry { file: File | null; status: UploadStatus; error?: string }

export default function MisDocumentosClient({ requests, justPaid, userEmail }: Props) {
  const [tab, setTab] = useState<'contratos' | 'docs' | 'estado'>(justPaid ? 'estado' : 'contratos')
  const [selectedRequest, setSelectedRequest] = useState<GestoriaRequest | null>(requests[0] ?? null)
  const [files, setFiles] = useState<Record<string, FileEntry>>({
    dni:           { file: null, status: 'idle' },
    'nota-simple': { file: null, status: 'idle' },
    escrituras:    { file: null, status: 'idle' },
  })
  const [uploadDone, setUploadDone] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null)

  const DOC_DEFS = [
    { key: 'dni',           label: 'DNI / NIE (ambas caras)',    hint: 'PDF o imagen con anverso y reverso' },
    { key: 'nota-simple',   label: 'Nota Simple registral',      hint: 'Del Registro de la Propiedad' },
    { key: 'escrituras',    label: 'Escrituras del inmueble',     hint: 'Escritura de propiedad o contrato previo' },
  ]

  // ── Descarga del contrato via signed URL ───────────────────────────────────
  async function handleDownload(req: GestoriaRequest) {
    if (!req.contract_path) return
    setDownloadLoading(req.id)
    try {
      const res  = await fetch(`/api/dashboard/download-contract?request_id=${req.id}`)
      const data = await res.json()
      if (data.url) window.open(data.url, '_blank')
      else alert('No se pudo generar el enlace de descarga.')
    } finally {
      setDownloadLoading(null)
    }
  }

  // ── Upload de documentos ──────────────────────────────────────────────────
  async function handleUpload() {
    if (!selectedRequest?.session_id) return alert('Selecciona un pedido primero')
    const toUpload = DOC_DEFS.filter(d => files[d.key]?.file)
    if (!toUpload.length) return alert('Selecciona al menos un archivo')

    for (const def of toUpload) {
      const entry = files[def.key]
      if (!entry.file) continue
      setFiles(prev => ({ ...prev, [def.key]: { ...prev[def.key], status: 'uploading' } }))

      try {
        // 1. Obtener signed upload URL
        const urlRes = await fetch('/api/dashboard/upload-url', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ session_id: selectedRequest.session_id, doc_key: def.key, file_name: entry.file.name }),
        })
        const { signedUrl, path, error } = await urlRes.json()
        if (error || !signedUrl) throw new Error(error ?? 'No se obtuvo URL de subida')

        // 2. Upload directo a Supabase Storage
        const uploadRes = await fetch(signedUrl, {
          method:  'PUT',
          headers: { 'Content-Type': entry.file.type },
          body:    entry.file,
        })
        if (!uploadRes.ok) throw new Error('Fallo al subir el archivo')

        // 3. Registrar en client_docs
        await fetch('/api/dashboard/register-doc', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ session_id: selectedRequest.session_id, doc_key: def.key, file_name: entry.file.name, storage_path: path }),
        })

        setFiles(prev => ({ ...prev, [def.key]: { ...prev[def.key], status: 'done' } }))
      } catch (err) {
        setFiles(prev => ({ ...prev, [def.key]: { ...prev[def.key], status: 'error', error: err instanceof Error ? err.message : 'Error' } }))
      }
    }
    setUploadDone(true)
  }

  const currentStep = selectedRequest?.step ?? 1

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">Mi área personal</h1>
        <p className="text-gray-500 text-sm">{userEmail}</p>
      </div>

      {/* Alerta pago reciente */}
      {justPaid && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-green-800">¡Pago confirmado! Tu pedido está siendo procesado.</p>
            <p className="text-green-700 text-sm">Recibirás el contrato en 24–48 horas.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {([
          { id: 'contratos', label: '📄 Mis contratos' },
          { id: 'docs',      label: '📤 Subir documentos' },
          { id: 'estado',    label: '📊 Estado del trámite' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-[#c9962a] shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CONTRATOS ─────────────────────────────────────────────────── */}
      {tab === 'contratos' && (
        <div>
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <div className="text-5xl mb-4">📄</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Aún no tienes contratos</h2>
              <p className="text-gray-500 text-sm mb-6">Cuando adquieras un contrato en nuestra gestoría, aparecerá aquí.</p>
              <Link href="/gestoria" className="inline-block bg-[#c9962a] hover:bg-[#b8841e] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors">
                Ver contratos disponibles →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          req.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </span>
                        {req.paid_at && (
                          <span className="text-gray-400 text-xs">
                            {new Date(req.paid_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-base">
                        {SERVICE_LABELS[req.service_key] ?? req.service_key.replace(/-/g, ' ')}
                      </h3>
                      {req.client_name && <p className="text-gray-400 text-sm mt-0.5">{req.client_name}</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[#c9962a] font-bold text-xl">
                        {req.amount_eur != null ? `${Number(req.amount_eur).toFixed(2)} €` : '—'}
                      </span>
                      {req.contract_path ? (
                        <button
                          onClick={() => handleDownload(req)}
                          disabled={downloadLoading === req.id}
                          className="flex items-center gap-1.5 bg-[#c9962a] hover:bg-[#b8841e] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                        >
                          {downloadLoading === req.id ? (
                            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          )}
                          Descargar PDF
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-2 rounded-lg">En preparación</span>
                      )}
                    </div>
                  </div>
                  {/* Mini progress inline */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      {STEPS.map((s, i) => (
                        <div key={s.n} className="flex items-center gap-1 flex-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            (req.step ?? 1) >= s.n ? 'bg-[#c9962a] text-white' : 'bg-gray-200 text-gray-400'
                          }`}>{s.n}</div>
                          <span className={`text-xs hidden sm:inline ${(req.step ?? 1) >= s.n ? 'text-[#c9962a]' : 'text-gray-400'}`}>{s.label}</span>
                          {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 ${(req.step ?? 1) > s.n ? 'bg-[#c9962a]' : 'bg-gray-200'}`} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: SUBIR DOCUMENTOS ─────────────────────────────────────────── */}
      {tab === 'docs' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Subir documentación</h2>
          <p className="text-gray-500 text-sm mb-5">Sube aquí los documentos necesarios para completar tu trámite.</p>

          {/* Selector de pedido */}
          {requests.length > 1 && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pedido al que aplica</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9962a]"
                value={selectedRequest?.id ?? ''}
                onChange={e => setSelectedRequest(requests.find(r => r.id === e.target.value) ?? null)}
              >
                {requests.map(r => (
                  <option key={r.id} value={r.id}>
                    {SERVICE_LABELS[r.service_key] ?? r.service_key} — {r.paid_at ? new Date(r.paid_at).toLocaleDateString('es-ES') : 'sin fecha'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {uploadDone ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🎉</div>
              <p className="font-semibold text-gray-900 mb-1">¡Documentos enviados!</p>
              <p className="text-gray-500 text-sm">Nuestro equipo los revisará y avanzará tu trámite al siguiente paso.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {DOC_DEFS.map(def => {
                  const entry = files[def.key]
                  return (
                    <div key={def.key} className={`border rounded-xl p-4 transition-colors ${
                      entry.status === 'done'  ? 'border-green-300 bg-green-50' :
                      entry.status === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{def.label}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{def.hint}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {entry.status === 'done' ? (
                            <span className="text-green-600 text-sm font-medium">✓ Subido</span>
                          ) : entry.status === 'uploading' ? (
                            <span className="animate-spin w-5 h-5 border-2 border-[#c9962a] border-t-transparent rounded-full inline-block" />
                          ) : (
                            <label className="cursor-pointer text-sm text-[#c9962a] font-medium hover:underline">
                              {entry.file ? entry.file.name.slice(0, 20) + '…' : 'Seleccionar archivo'}
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={e => {
                                  const file = e.target.files?.[0] ?? null
                                  setFiles(prev => ({ ...prev, [def.key]: { file, status: 'idle' } }))
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                      {entry.status === 'error' && <p className="text-red-600 text-xs mt-1">{entry.error}</p>}
                    </div>
                  )
                })}
              </div>
              <button
                onClick={handleUpload}
                className="mt-5 w-full bg-[#c9962a] hover:bg-[#b8841e] text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Enviar documentación →
              </button>
            </>
          )}
        </div>
      )}

      {/* ── TAB: ESTADO DEL TRÁMITE ─────────────────────────────────────── */}
      {tab === 'estado' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              No hay pedidos activos.
            </div>
          ) : requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">{SERVICE_LABELS[req.service_key] ?? req.service_key}</h3>
                  <p className="text-gray-400 text-sm">{req.paid_at ? new Date(req.paid_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
                </div>
                <span className="text-[#c9962a] font-bold">{req.amount_eur != null ? `${Number(req.amount_eur).toFixed(2)} €` : ''}</span>
              </div>
              {/* Steps visuales */}
              <div className="space-y-3">
                {STEPS.map((s) => {
                  const done    = (req.step ?? 1) > s.n
                  const current = (req.step ?? 1) === s.n
                  return (
                    <div key={s.n} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                      current ? 'bg-amber-50 border border-amber-200' :
                      done    ? 'bg-green-50'  : 'bg-gray-50'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                        current ? 'bg-[#c9962a] text-white shadow-md' :
                        done    ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}>
                        {done ? '✓' : s.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${current ? 'text-[#7a5c1e]' : done ? 'text-green-700' : 'text-gray-400'}`}>
                          Paso {s.n}: {s.label}
                          {current && <span className="ml-2 inline-block w-2 h-2 bg-[#c9962a] rounded-full animate-pulse" />}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Aviso de docs si está en paso 1 */}
              {(req.step ?? 1) === 1 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                  <strong>Acción requerida:</strong> Sube tu documentación en la pestaña &quot;Subir documentos&quot; para avanzar al siguiente paso.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer info */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        ¿Tienes dudas? Escríbenos a{' '}
        <a href="mailto:info@inmonest.com" className="font-semibold underline">info@inmonest.com</a>
      </div>
    </div>
  )
}

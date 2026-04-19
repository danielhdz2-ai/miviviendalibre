'use client'

import { useState, useRef } from 'react'

const SERVICE_LABELS: Record<string, string> = {
  'arras-confirmatorias':  'Arras Confirmatorias',
  'arras-penitenciales':   'Arras Penitenciales',
  'alquiler-vivienda-lau': 'Alquiler Residencial (LAU)',
  'alquiler-temporada':    'Alquiler Temporada',
  'opcion-compra':         'Opcion de Compra',
  'reserva-compra':        'Reserva de Compra',
  'rescision-alquiler':    'Rescision de Alquiler',
  'compraventa-privada':   'Compraventa Privada',
  'cesion-derechos':       'Cesion de Derechos',
  'alquiler-habitacion':   'Alquiler Habitacion',
  'liquidacion-fianza':    'Liquidacion de Fianza',
  'devolucion-fianzas':    'Devolucion de Fianzas',
}

const STEP_LABELS: Record<number, string> = {
  1: 'Pago confirmado',
  2: 'Docs recibidos',
  3: 'En elaboracion',
  4: 'Entregado',
}

interface GestoriaRequest {
  id: string
  session_id: string | null
  service_key: string
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  amount_eur: number | null
  status: string
  step: number | null
  paid_at: string | null
  contract_path: string | null
  admin_notes: string | null
  created_at: string
}

interface ClientDoc {
  id: string
  request_id: string
  session_id: string
  doc_key: string
  file_name: string
  storage_path: string
  uploaded_at: string
}

interface UserDocument {
  id: string
  user_id: string
  user_email: string
  user_name: string
  doc_key: string
  file_name: string
  status: string
  uploaded_at: string
  notes: string | null
  storage_path: string
}

const DOC_LABELS: Record<string, string> = {
  'dni':                  '🪪 DNI / CIF',
  'nomina':               '💼 Nómina',
  'escrituras':           '📜 Escrituras',
  'nota-simple':          '🏛️ Nota Simple',
  'contrato-alquiler':    '📋 Contrato Alquiler/Arras',
  'cert-energetico':      '⚡ Cert. Energético',
  'cedula-habitabilidad': '🏠 Cédula Habitabilidad',
  'facturas':             '🧾 Facturas',
  'otro':                 '📄 Otros',
}

const STATUS_OPTS = [
  { value: 'uploaded',  label: 'Subido',      color: 'bg-blue-100 text-blue-700' },
  { value: 'reviewing', label: 'En revisión', color: 'bg-amber-100 text-amber-700' },
  { value: 'validated', label: 'Validado',    color: 'bg-green-100 text-green-700' },
  { value: 'rejected',  label: 'Rechazado',   color: 'bg-red-100 text-red-700' },
]

interface Props {
  initialRequests: GestoriaRequest[]
}

export default function AdminPanel({ initialRequests }: Props) {
  const [requests, setRequests]     = useState<GestoriaRequest[]>(initialRequests)
  const [tab, setTab]               = useState<'pedidos' | 'boveda' | 'userdocs'>('pedidos')
  const [selected, setSelected]     = useState<GestoriaRequest | null>(null)
  const [userDocs, setUserDocs]     = useState<UserDocument[] | null>(null)
  const [userDocsLoading, setUserDocsLoading] = useState(false)
  const [docs, setDocs]             = useState<ClientDoc[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [stepSaving, setStepSaving] = useState(false)
  const [notesVal, setNotesVal]     = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all')
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const contractInputRef = useRef<HTMLInputElement>(null)

  const filtered = requests.filter(r =>
    filterStatus === 'all' ? true : r.status === filterStatus
  )

  async function loadDocs(req: GestoriaRequest) {
    setSelected(req)
    setNotesVal(req.admin_notes ?? '')
    setDocsLoading(true)
    setDocs([])
    try {
      const res  = await fetch(`/api/admin/docs?session_id=${req.session_id ?? ''}`)
      const data = await res.json()
      setDocs(data.docs ?? [])
    } finally {
      setDocsLoading(false)
    }
  }

  async function handleDownloadDoc(doc: ClientDoc) {
    const res  = await fetch('/api/admin/docs', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ storage_path: doc.storage_path }),
    })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
    else alert('No se pudo generar el enlace')
  }

  async function handleUpdateStep(newStep: number) {
    if (!selected) return
    setStepSaving(true)
    try {
      await fetch('/api/admin/update-step', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ request_id: selected.id, step: newStep, admin_notes: notesVal }),
      })
      setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, step: newStep, admin_notes: notesVal } : r))
      setSelected(prev => prev ? { ...prev, step: newStep, admin_notes: notesVal } : null)
    } finally {
      setStepSaving(false)
    }
  }

  async function handleUploadContract(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || !e.target.files?.[0]) return
    const file     = e.target.files[0]
    const formData = new FormData()
    formData.append('request_id', selected.id)
    formData.append('file', file)
    setUploadProgress('Subiendo contrato...')
    try {
      const res  = await fetch('/api/admin/upload-contract', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.ok) {
        setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, step: 4, contract_path: data.path } : r))
        setSelected(prev => prev ? { ...prev, step: 4, contract_path: data.path } : null)
        setUploadProgress('Contrato subido y cliente notificado')
      } else {
        setUploadProgress(`Error: ${data.error}`)
      }
    } catch {
      setUploadProgress('Error de red')
    }
  }

  const stats = {
    total:   requests.length,
    paid:    requests.filter(r => r.status === 'paid').length,
    pending: requests.filter(r => r.status !== 'paid').length,
    revenue: requests.filter(r => r.status === 'paid').reduce((s, r) => s + (Number(r.amount_eur) || 0), 0),
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administracion</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion interna Inmonest</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-500">Sistema operativo</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total pedidos', value: stats.total,   color: 'text-gray-900' },
          { label: 'Pagados',       value: stats.paid,    color: 'text-green-600' },
          { label: 'Pendientes',    value: stats.pending, color: 'text-amber-600' },
          { label: 'Ingresos',      value: `${stats.revenue.toFixed(2)} EUR`, color: 'text-[#c9962a]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {([
          { id: 'pedidos',  label: '📋 Pedidos' },
          { id: 'boveda',   label: '🔒 Bóveda' },
          { id: 'userdocs', label: '📂 Docs usuarios' },
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

      {/* ── TAB PEDIDOS ──────────────────────────────────────────────────────── */}
      {tab === 'pedidos' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Tabla izquierda */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Todos los pedidos</h2>
                <select
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                >
                  <option value="all">Todos</option>
                  <option value="paid">Pagados</option>
                  <option value="pending">Pendientes</option>
                </select>
              </div>
              <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No hay pedidos</div>
                ) : filtered.map(req => (
                  <button
                    key={req.id}
                    onClick={() => loadDocs(req)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selected?.id === req.id ? 'bg-amber-50 border-l-2 border-[#c9962a]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {SERVICE_LABELS[req.service_key] ?? req.service_key}
                        </p>
                        <p className="text-xs text-gray-400">{req.client_email}</p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          req.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </span>
                        <span className="text-xs text-gray-400">
                          Paso {req.step ?? 1}/4 &middot; {req.amount_eur ? `${req.amount_eur} EUR` : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel derecho - detalle */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {SERVICE_LABELS[selected.service_key] ?? selected.service_key}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Cliente:</span> {selected.client_name}</p>
                    <p><span className="font-medium">Email:</span> {selected.client_email}</p>
                    {selected.client_phone && <p><span className="font-medium">Tel:</span> {selected.client_phone}</p>}
                    <p><span className="font-medium">Importe:</span> {selected.amount_eur ? `${selected.amount_eur} EUR` : '—'}</p>
                    <p><span className="font-medium">Fecha:</span> {selected.paid_at ? new Date(selected.paid_at).toLocaleDateString('es-ES') : '—'}</p>
                  </div>
                </div>

                {/* Cambiar paso */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Estado del tramite</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[1,2,3,4].map(n => (
                      <button
                        key={n}
                        onClick={() => handleUpdateStep(n)}
                        disabled={stepSaving}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                          (selected.step ?? 1) === n
                            ? 'bg-[#c9962a] text-white border-[#c9962a]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#c9962a]'
                        }`}
                      >
                        Paso {n}: {STEP_LABELS[n]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas admin */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Notas internas</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#c9962a]"
                    rows={3}
                    value={notesVal}
                    onChange={e => setNotesVal(e.target.value)}
                    placeholder="Anotaciones solo visibles para el admin..."
                  />
                  <button
                    onClick={() => handleUpdateStep(selected.step ?? 1)}
                    disabled={stepSaving}
                    className="mt-1.5 w-full bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-60"
                  >
                    Guardar notas
                  </button>
                </div>

                {/* Subir contrato */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Subir contrato PDF</p>
                  {selected.contract_path ? (
                    <p className="text-xs text-green-600 bg-green-50 rounded-lg p-2">
                      Contrato ya subido. Puedes reemplazarlo.
                    </p>
                  ) : null}
                  <input
                    ref={contractInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleUploadContract}
                  />
                  <button
                    onClick={() => contractInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-[#c9962a] rounded-xl p-3 text-sm text-gray-500 hover:text-[#c9962a] transition-colors"
                  >
                    {uploadProgress ?? 'Seleccionar PDF del contrato'}
                  </button>
                </div>

                {/* Docs del cliente */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Documentacion del cliente</p>
                  {docsLoading ? (
                    <div className="flex justify-center py-4">
                      <span className="animate-spin w-5 h-5 border-2 border-[#c9962a] border-t-transparent rounded-full" />
                    </div>
                  ) : docs.length === 0 ? (
                    <p className="text-xs text-gray-400">El cliente no ha subido documentos aun.</p>
                  ) : (
                    <div className="space-y-2">
                      {docs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{doc.doc_key}</p>
                            <p className="text-xs text-gray-400 truncate">{doc.file_name}</p>
                          </div>
                          <button
                            onClick={() => handleDownloadDoc(doc)}
                            className="flex-shrink-0 ml-2 text-xs bg-[#c9962a] text-white px-2 py-1 rounded-lg hover:bg-[#b8841e] transition-colors"
                          >
                            Descargar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
                <div className="text-4xl mb-3">👆</div>
                <p className="text-sm">Selecciona un pedido para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB BOVEDA ────────────────────────────────────────────────────────── */}
      {tab === 'boveda' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Boveda de documentacion</h2>
          <p className="text-sm text-gray-500 mb-6">
            Todos los documentos subidos por los clientes, organizados por pedido. Los archivos se almacenan de forma privada y solo son accesibles via enlace firmado de 1 hora.
          </p>
          <div className="space-y-4">
            {requests.filter(r => r.status === 'paid').map(req => (
              <BoveadaRow
                key={req.id}
                req={req}
                serviceLabel={SERVICE_LABELS[req.service_key] ?? req.service_key}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── TAB DOCUMENTOS USUARIOS ─────────────────────────────────────────── */}
      {tab === 'userdocs' && (
        <UserDocsTab
          docs={userDocs}
          loading={userDocsLoading}
          onLoad={async () => {
            if (userDocs !== null) return
            setUserDocsLoading(true)
            try {
              const res  = await fetch('/api/admin/user-docs')
              const data = await res.json()
              setUserDocs(data.docs ?? [])
            } finally {
              setUserDocsLoading(false)
            }
          }}
          onStatusChange={(docId, status, notes) => {
            setUserDocs(prev => (prev ?? []).map(d =>
              d.id === docId ? { ...d, status, notes } : d
            ))
          }}
        />
      )}
    </div>
  )
}

// ── Subcomponente fila Boveda ─────────────────────────────────────────────────
function BoveadaRow({ req, serviceLabel }: { req: GestoriaRequest; serviceLabel: string }) {
  const [docs, setDocs]   = useState<ClientDoc[] | null>(null)
  const [open, setOpen]   = useState(false)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (docs !== null) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/docs?session_id=${req.session_id ?? ''}`)
      const data = await res.json()
      setDocs(data.docs ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function download(doc: ClientDoc) {
    const res  = await fetch('/api/admin/docs', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ storage_path: doc.storage_path }),
    })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <p className="font-medium text-gray-900 text-sm">{serviceLabel}</p>
          <p className="text-xs text-gray-400">{req.client_email} &middot; {req.paid_at ? new Date(req.paid_at).toLocaleDateString('es-ES') : ''}</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-3">
              <span className="animate-spin w-5 h-5 border-2 border-[#c9962a] border-t-transparent rounded-full" />
            </div>
          ) : docs?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center">Sin documentos subidos</p>
          ) : (
            <div className="space-y-2">
              {docs?.map(doc => (
                <div key={doc.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.doc_key}</p>
                    <p className="text-xs text-gray-400">{doc.file_name} &middot; {new Date(doc.uploaded_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <button
                    onClick={() => download(doc)}
                    className="text-sm bg-[#c9962a] text-white px-3 py-1.5 rounded-lg hover:bg-[#b8841e] transition-colors font-medium"
                  >
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Documentos personales de usuarios ────────────────────────────────────────
interface UserDocsTabProps {
  docs: UserDocument[] | null
  loading: boolean
  onLoad: () => void
  onStatusChange: (docId: string, status: string, notes: string | null) => void
}

function UserDocsTab({ docs, loading, onLoad, onStatusChange }: UserDocsTabProps) {
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editNotes, setEditNotes]   = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving]         = useState(false)

  // Cargar al montar el tab
  const loadedRef = useState(false)
  if (!loadedRef[0]) { loadedRef[1](true); onLoad() }

  async function handleDownload(doc: UserDocument) {
    const res  = await fetch('/api/admin/user-docs', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ storage_path: doc.storage_path }),
    })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
    else alert('No se pudo generar el enlace')
  }

  async function handleSave(doc: UserDocument) {
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/user-docs', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ doc_id: doc.id, status: editStatus, notes: editNotes || null }),
      })
      const data = await res.json()
      if (data.ok) {
        onStatusChange(doc.id, editStatus, editNotes || null)
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading || !docs) {
    return (
      <div className="flex justify-center py-20">
        <span className="animate-spin w-8 h-8 border-2 border-[#c9962a] border-t-transparent rounded-full" />
      </div>
    )
  }

  // Agrupar por usuario
  const byUser: Record<string, { email: string; name: string; docs: UserDocument[] }> = {}
  for (const doc of docs) {
    if (!byUser[doc.user_id]) byUser[doc.user_id] = { email: doc.user_email, name: doc.user_name, docs: [] }
    byUser[doc.user_id].docs.push(doc)
  }
  const users = Object.entries(byUser)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Documentos personales de usuarios</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {docs.length} documento{docs.length !== 1 ? 's' : ''} de {users.length} usuario{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg">
          Acceso solo admin · URLs firmadas 1h
        </span>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-400 text-sm">Ningun usuario ha subido documentos todavia</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map(([userId, user]) => (
            <div key={userId} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Header del usuario */}
              <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#c9962a]/20 flex items-center justify-center text-sm font-bold text-[#c9962a]">
                  {user.email[0]?.toUpperCase()}
                </div>
                <div>
                  {user.name && <p className="text-sm font-semibold text-gray-900">{user.name}</p>}
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span className="ml-auto text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                  {user.docs.length} doc{user.docs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Documentos del usuario */}
              <div className="divide-y divide-gray-100">
                {user.docs.map(doc => {
                  const statusCfg = STATUS_OPTS.find(s => s.value === doc.status) ?? STATUS_OPTS[0]
                  const isEditing = editingId === doc.id
                  return (
                    <div key={doc.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">
                              {DOC_LABELS[doc.doc_key] ?? doc.doc_key}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.file_name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(doc.uploaded_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {doc.notes && !isEditing && (
                            <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5 mt-2">{doc.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="flex items-center gap-1.5 text-xs bg-[#c9962a] hover:bg-[#b8841e] text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(isEditing ? null : doc.id)
                              setEditStatus(doc.status)
                              setEditNotes(doc.notes ?? '')
                            }}
                            className="text-xs border border-gray-200 hover:border-gray-400 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {isEditing ? 'Cancelar' : 'Revisar'}
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-3">
                          <div className="flex gap-2 flex-wrap">
                            {STATUS_OPTS.map(s => (
                              <button
                                key={s.value}
                                onClick={() => setEditStatus(s.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                  editStatus === s.value
                                    ? s.color + ' border-current'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#c9962a]"
                            rows={2}
                            placeholder="Notas internas (visible solo para admin)..."
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                          />
                          <button
                            onClick={() => handleSave(doc)}
                            disabled={saving}
                            className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-60 transition-colors"
                          >
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

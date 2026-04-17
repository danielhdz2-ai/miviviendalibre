'use client'

import { useEffect, useRef, useState } from 'react'

interface UploadEntry {
  signedUrl: string
  token: string
  path: string
}

interface UploadUrls {
  dni: UploadEntry
  'nota-simple': UploadEntry
  escrituras: UploadEntry
}

interface ApiResponse {
  urls: UploadUrls
  customer_email: string
  error?: string
}

type DocKey = 'dni' | 'nota-simple' | 'escrituras'

interface DocDef {
  key: DocKey
  label: string
  hint: string
}

const DOCS: DocDef[] = [
  { key: 'dni', label: 'DNI / NIE (ambas caras)', hint: 'PDF con anverso y reverso del documento de identidad' },
  { key: 'nota-simple', label: 'Nota Simple registral', hint: 'Nota simple del Registro de la Propiedad del inmueble' },
  { key: 'escrituras', label: 'Escrituras del inmueble', hint: 'Escritura de propiedad o contrato de compraventa previo' },
]

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

interface FileState {
  file: File | null
  state: UploadState
  error?: string
}

export default function CargaDocumentosContent({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(true)
  const [paymentError, setPaymentError] = useState(false)
  const [email, setEmail] = useState('')
  const [urls, setUrls] = useState<UploadUrls | null>(null)
  const [files, setFiles] = useState<Record<DocKey, FileState>>({
    dni: { file: null, state: 'idle' },
    'nota-simple': { file: null, state: 'idle' },
    escrituras: { file: null, state: 'idle' },
  })
  const [globalState, setGlobalState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [drag, setDrag] = useState<DocKey | null>(null)
  const inputRefs = useRef<Record<DocKey, HTMLInputElement | null>>({
    dni: null,
    'nota-simple': null,
    escrituras: null,
  })

  useEffect(() => {
    if (!sessionId) {
      setPaymentError(true)
      setLoading(false)
      return
    }
    fetch(`/api/gestoria/upload-urls?session_id=${sessionId}`)
      .then(r => r.json() as Promise<ApiResponse>)
      .then(data => {
        if (data.error) {
          setPaymentError(true)
        } else {
          setUrls(data.urls)
          setEmail(data.customer_email)
        }
      })
      .catch(() => setPaymentError(true))
      .finally(() => setLoading(false))
  }, [sessionId])

  const setFile = (key: DocKey, file: File | null) => {
    setFiles(prev => ({ ...prev, [key]: { file, state: 'idle' } }))
  }

  const handleDrop = (key: DocKey, e: React.DragEvent) => {
    e.preventDefault()
    setDrag(null)
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') setFile(key, f)
  }

  const allSelected = DOCS.every(d => files[d.key].file !== null)

  const handleUpload = async () => {
    if (!urls || !allSelected) return
    setGlobalState('uploading')

    // Upload each file sequentially to its signed URL
    for (const doc of DOCS) {
      const { file } = files[doc.key]
      if (!file) continue
      setFiles(prev => ({ ...prev, [doc.key]: { ...prev[doc.key], state: 'uploading' } }))

      try {
        const res = await fetch(urls[doc.key].signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/pdf' },
          body: file,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setFiles(prev => ({ ...prev, [doc.key]: { ...prev[doc.key], state: 'done' } }))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al subir'
        setFiles(prev => ({ ...prev, [doc.key]: { ...prev[doc.key], state: 'error', error: msg } }))
        setGlobalState('error')
        return
      }
    }

    // Notify via email
    try {
      await fetch('/api/gestoria/notify-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } catch {
      // non-critical — docs already uploaded
    }

    setGlobalState('done')
  }

  const fmtSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 text-[#c9962a] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Verificando pago…</p>
        </div>
      </main>
    )
  }

  // ─── Payment error ───────────────────────────────────────────────────────────
  if (paymentError) {
    return (
      <main className="min-h-screen bg-[#faf8f4] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pago no completado</h2>
          <p className="text-sm text-gray-500 mb-6">
            No hemos podido verificar tu pago. Si crees que es un error, escríbenos a{' '}
            <a href="mailto:info@inmonest.com" className="text-[#c9962a] font-medium">info@inmonest.com</a>.
          </p>
          <a
            href="/gestoria"
            className="inline-block px-6 py-2.5 bg-[#c9962a] text-white rounded-full text-sm font-semibold hover:bg-[#a87a20] transition-colors"
          >
            Volver a gestoría
          </a>
        </div>
      </main>
    )
  }

  // ─── Success ─────────────────────────────────────────────────────────────────
  if (globalState === 'done') {
    return (
      <main className="min-h-screen bg-[#faf8f4] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Documentos recibidos!</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-1">
            Hemos recibido tu documentación correctamente.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Nuestro equipo la revisará y se pondrá en contacto contigo{email ? ` en <strong>${email}</strong>` : ''} en menos de <strong>24 horas</strong>.
          </p>
          <a
            href="/gestoria"
            className="inline-block px-6 py-2.5 bg-[#c9962a] text-white rounded-full text-sm font-semibold hover:bg-[#a87a20] transition-colors"
          >
            Volver a gestoría
          </a>
        </div>
      </main>
    )
  }

  // ─── Upload form ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#faf8f4] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Pago confirmado
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Carga tu documentación</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Para redactar el contrato de reserva necesitamos los siguientes documentos en formato PDF.
            {email && <span className="block mt-1">Los resultados se enviarán a <strong className="text-gray-700">{email}</strong>.</span>}
          </p>
        </div>

        {/* Upload zones */}
        <div className="space-y-4 mb-8">
          {DOCS.map(doc => {
            const state = files[doc.key]
            const isDragging = drag === doc.key
            const isDone = state.state === 'done'
            const isError = state.state === 'error'
            const isUploading = state.state === 'uploading'

            return (
              <div key={doc.key}
                className={`relative bg-white rounded-2xl border-2 transition-all duration-200 ${
                  isDone ? 'border-green-400 bg-green-50/30' :
                  isError ? 'border-red-400 bg-red-50/30' :
                  isDragging ? 'border-[#c9962a] bg-amber-50/40 scale-[1.01]' :
                  state.file ? 'border-[#c9962a]/60' : 'border-dashed border-gray-200 hover:border-[#c9962a]/50'
                }`}
                onDragOver={e => { e.preventDefault(); setDrag(doc.key) }}
                onDragLeave={() => setDrag(null)}
                onDrop={e => handleDrop(doc.key, e)}
              >
                <input
                  ref={el => { inputRefs.current[doc.key] = el }}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => setFile(doc.key, e.target.files?.[0] ?? null)}
                />

                <div className="p-5 flex items-center gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                    isDone ? 'bg-green-100' : isError ? 'bg-red-100' : 'bg-amber-50'
                  }`}>
                    {isDone ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isUploading ? (
                      <svg className="animate-spin w-5 h-5 text-[#c9962a]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-[#c9962a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{doc.label}</p>
                    {state.file ? (
                      <p className="text-xs text-gray-500 truncate">
                        {state.file.name} · {fmtSize(state.file.size)}
                        {isError && <span className="text-red-500 ml-1">— {state.error}</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">{doc.hint}</p>
                    )}
                  </div>

                  {/* Action */}
                  {!isDone && !isUploading && (
                    <button
                      type="button"
                      onClick={() => inputRefs.current[doc.key]?.click()}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-[#c9962a] border border-[#c9962a]/40 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      {state.file ? 'Cambiar' : 'Seleccionar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Error global */}
        {globalState === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
            Hubo un error al subir uno de los archivos. Inténtalo de nuevo o contacta con <a href="mailto:info@inmonest.com" className="font-medium underline">info@inmonest.com</a>.
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleUpload}
          disabled={!allSelected || globalState === 'uploading'}
          className="w-full py-4 bg-gradient-to-r from-[#7a5c1e] to-[#c9962a] text-white rounded-2xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
        >
          {globalState === 'uploading' ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              Subiendo documentos…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Enviar documentación
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Archivos cifrados en tránsito · Solo PDF · Máx. 20 MB por archivo
        </p>
      </div>
    </main>
  )
}

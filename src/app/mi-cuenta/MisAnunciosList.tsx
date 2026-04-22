'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Anuncio {
  id: string
  title: string
  city: string | null
  price_eur: number | null
  operation: string
  status: string
  published_at: string | null
  views_count: number | null
  turbo_until: string | null
}

function formatPrice(price: number | null, operation: string) {
  if (!price) return 'Sin precio'
  const f = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
  return operation === 'rent' ? `${f}/mes` : f
}

export default function MisAnunciosList({ anuncios }: { anuncios: Anuncio[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [turboLoadingId, setTurboLoadingId] = useState<string | null>(null)

  async function changeStatus(id: string, status: 'published' | 'paused' | 'archived') {
    setLoadingId(id)
    try {
      await fetch(`/api/mis-anuncios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  async function activarTurbo(id: string) {
    setTurboLoadingId(id)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'turbo_7d', listing_id: id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setTurboLoadingId(null)
    }
  }

  if (anuncios.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
        <p className="text-gray-500 text-sm mb-4">Aún no tienes ningún anuncio publicado.</p>
        <Link
          href="/publicar"
          className="inline-block px-5 py-2.5 bg-[#c9962a] text-white rounded-full text-sm font-semibold hover:bg-[#a87a20] transition-colors"
        >
          Publicar mi primer anuncio
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {anuncios.map((a) => {
        const isLoading = loadingId === a.id
        const isTurboLoading = turboLoadingId === a.id
        const isTurboActive = a.turbo_until ? new Date(a.turbo_until) > new Date() : false
        return (
          <div
            key={a.id}
            className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-4 flex-wrap transition-opacity ${
              isLoading ? 'opacity-60 pointer-events-none' : 'border-gray-100'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate text-sm">{a.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {a.city} · {a.operation === 'rent' ? 'Alquiler' : 'Venta'} · {formatPrice(a.price_eur, a.operation)}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Badge estado */}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                a.status === 'published' ? 'bg-[#fef0c0] text-[#a87a20]' :
                a.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {a.status === 'published' ? '● Publicado' : a.status === 'paused' ? '◌ Pausado' : a.status}
              </span>

              {/* Visitas */}
              <span className="text-xs text-gray-400">{a.views_count ?? 0} visitas</span>

              {/* Acciones */}
              <Link
                href={`/pisos/${a.id}`}
                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Ver
              </Link>

              <Link
                href={`/mi-cuenta/anuncios/${a.id}/editar`}
                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-[#c9962a] hover:text-[#c9962a] hover:bg-[#fef9e8] transition-colors"
              >
                Editar
              </Link>

              {/* Botón Turbo */}
              {a.status === 'published' && (
                isTurboActive ? (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 font-semibold">
                    ⚡ Turbo activo
                  </span>
                ) : (
                  <button
                    onClick={() => activarTurbo(a.id)}
                    disabled={isTurboLoading}
                    className="text-xs px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors font-semibold disabled:opacity-50"
                  >
                    {isTurboLoading ? '...' : '⚡ Turbo 9€'}
                  </button>
                )
              )}

              {a.status === 'published' ? (
                <button
                  onClick={() => changeStatus(a.id, 'paused')}
                  disabled={isLoading}
                  className="text-xs px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  Pausar
                </button>
              ) : a.status === 'paused' ? (
                <button
                  onClick={() => changeStatus(a.id, 'published')}
                  disabled={isLoading}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[#f4c94a] text-[#a87a20] hover:bg-[#fef9e8] transition-colors"
                >
                  Activar
                </button>
              ) : null}

              {a.status !== 'archived' && (
                <button
                  onClick={() => {
                    if (confirm('¿Archivar este anuncio? Desaparecerá del buscador.')) {
                      changeStatus(a.id, 'archived')
                    }
                  }}
                  disabled={isLoading}
                  className="text-xs px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Archivar
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

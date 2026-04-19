'use client'

/**
 * SearchCountButton
 * Botón dinámico que muestra "Ver X anuncios" en tiempo real.
 *
 * Colócalo en FiltersSidebar (fondo del panel) o en ResultsHeader.
 *
 * USO dentro de FiltersSidebar, después del bloque de secciones:
 *   <SearchCountButton onClick={applyAll} />
 *
 * USO standalone (p.ej. barra superior):
 *   <SearchCountButton />
 */

import Link from 'next/link'
import { useListingCount } from '@/hooks/useListingCount'

interface Props {
  /** Si se pasa, el botón llama a onClick; si no, navega a /pisos con los params actuales */
  onClick?: () => void
  className?: string
}

export default function SearchCountButton({ onClick, className }: Props) {
  const { count, loading } = useListingCount()

  const label = loading
    ? 'Buscando…'
    : count === null
      ? 'Ver anuncios'
      : `Ver ${count.toLocaleString('es-ES')} anuncio${count !== 1 ? 's' : ''}`

  const base =
    'inline-flex items-center justify-center gap-2 rounded-full ' +
    'bg-gold-500 hover:bg-gold-600 active:bg-gold-700 ' +
    'text-white text-sm font-semibold ' +
    'transition-colors px-5 py-2.5 ' +
    (className ?? '')

  if (onClick) {
    return (
      <button onClick={onClick} disabled={loading} className={base}>
        {loading && (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        )}
        {label}
      </button>
    )
  }

  return (
    <Link href="/pisos" className={base}>
      {label}
    </Link>
  )
}

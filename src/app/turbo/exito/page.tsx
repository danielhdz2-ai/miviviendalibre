import Link from 'next/link'
import Navbar from '@/components/NavbarServer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '¡Inmonest Turbo activado!' }

interface Props {
  searchParams: Promise<{ listing_id?: string; session_id?: string }>
}

export default async function TurboExitoPage({ searchParams }: Props) {
  const { listing_id } = await searchParams

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fef9e8] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Icono */}
          <div className="w-24 h-24 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-200">
            <span className="text-5xl">⚡</span>
          </div>

          <h1 className="text-3xl font-extrabold text-[#7a5c1e] mb-3">
            ¡Turbo activado!
          </h1>
          <p className="text-gray-600 leading-relaxed mb-6">
            Tu anuncio aparecerá en las primeras posiciones durante <strong>7 días</strong>. El bump se aplica cada día a las 9:00 AM.
          </p>

          <div className="bg-white rounded-2xl p-5 border border-[#f4c94a]/40 mb-6">
            <ul className="space-y-2 text-sm text-gray-700 text-left">
              {[
                '✅ Pago confirmado',
                '⚡ Posición destacada activada',
                '📈 Bump diario a las 9:00 AM durante 7 días',
                '📧 Recibirás confirmación por email',
              ].map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {listing_id && (
              <Link
                href={`/pisos/${listing_id}`}
                className="px-6 py-3 bg-[#c9962a] text-white rounded-full font-semibold text-sm hover:bg-[#a87a20] transition-colors"
              >
                Ver mi anuncio
              </Link>
            )}
            <Link
              href="/mi-cuenta"
              className="px-6 py-3 border border-[#f4c94a] text-[#a87a20] rounded-full font-semibold text-sm hover:bg-[#fef0c0] transition-colors"
            >
              Ir a mi cuenta
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

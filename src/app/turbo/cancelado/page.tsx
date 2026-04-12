import Link from 'next/link'
import Navbar from '@/components/NavbarServer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pago cancelado — Inmonest' }

interface Props {
  searchParams: Promise<{ listing_id?: string }>
}

export default async function TurboCanceladoPage({ searchParams }: Props) {
  const { listing_id } = await searchParams

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">↩️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Pago cancelado</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            No se ha realizado ningún cargo. Puedes activar el Turbo cuando quieras desde el panel de tu cuenta.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {listing_id && (
              <Link
                href={`/pisos/${listing_id}`}
                className="px-6 py-3 bg-[#c9962a] text-white rounded-full font-semibold text-sm hover:bg-[#a87a20] transition-colors"
              >
                Volver al anuncio
              </Link>
            )}
            <Link
              href="/mi-cuenta"
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors"
            >
              Mi cuenta
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

import Link from 'next/link'
import Navbar from '@/components/NavbarServer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pago cancelado — Inmonest',
  // Private post-payment page — must not appear in search results
  robots: { index: false, follow: false },
}

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
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
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

          {/* Información útil tras cancelación */}
          <div className="text-left space-y-5 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-bold text-gray-900">¿Qué ha pasado?</h2>

            <p className="text-sm text-gray-600 leading-relaxed">
              Has cancelado el proceso de pago antes de completarlo. No se ha realizado ningún cargo
              en tu tarjeta ni en tu cuenta. Tu anuncio sigue publicado exactamente igual que antes,
              sin cambios en su posición ni visibilidad.
            </p>

            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">¿Puedo activar el Turbo más adelante?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sí, puedes activarlo cuando quieras desde el panel de tu anuncio. El modo Turbo no
                caduca: si decides activarlo mañana, la semana que viene o el mes que viene, el precio
                y las condiciones serán los mismos. No hay penalización por cancelar ahora.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">¿Cuándo es mejor activar el Turbo?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Los mejores momentos para activar el Turbo son el lunes o el martes por la mañana,
                cuando la actividad de búsqueda en el portal es más alta. También es útil activarlo
                justo después de actualizar las fotos o la descripción del anuncio, para que los nuevos
                visitantes vean la mejor versión de tu piso.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Alternativas gratuitas para mejorar tu visibilidad</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Mientras decides si activar el Turbo, puedes mejorar la visibilidad de tu anuncio
                de forma gratuita: actualiza el precio si ha pasado más de una semana desde la publicación,
                añade fotos nuevas o de mejor calidad, y comparte el enlace del anuncio en redes sociales
                o grupos de vecinos. Pequeños cambios en el anuncio hacen que Inmonest lo recoloque
                automáticamente como “recientemente actualizado”.
              </p>
            </div>

            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <strong>¿Tienes alguna duda?</strong> Escríbenos desde el formulario de{' '}
                <Link href="/contacto" className="text-[#c9962a] hover:underline">contacto</Link>{' '}
                y te respondemos en menos de 24 horas.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

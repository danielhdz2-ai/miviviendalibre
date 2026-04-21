import Link from 'next/link'
import Navbar from '@/components/NavbarServer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '¡Inmonest Turbo activado!',
  // Private post-payment page — must not appear in search results
  robots: { index: false, follow: false },
}

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

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
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

          {/* Información sobre el modo Turbo */}
          <div className="text-left space-y-6 mt-4 border-t border-amber-100 pt-8">
            <h2 className="text-xl font-bold text-gray-900">¿Qué pasa ahora?</h2>

            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Bump diario a las 9:00 AM</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Cada mañana a las 9:00 AM (hora de España), tu anuncio sube automáticamente a la primera
                posición de los resultados de búsqueda en tu ciudad y categoría. Esto maximiza la visibilidad
                durante las horas de mayor tráfico del portal, que suelen concentrarse entre las 9:00 y las 13:00.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Duración: 7 días naturales</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                El modo Turbo está activo durante 7 días completos desde la activación. Durante ese periodo
                tu anuncio recibe el bump diario sin necesidad de hacer nada más. Al finalizar, el anuncio
                permanece publicado en su posición natural.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Cómo aprovechar al máximo el Turbo</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Para maximizar el impacto, te recomendamos revisar el anuncio antes de que entre en vigor
                el primer bump: actualiza las fotos si es necesario, revisa que el precio sea competitivo
                y asegúrate de que la descripción sea completa y honesta. Los compradores que lleguen en
                los próximos 7 días serán los más activos del mercado.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Confirmación por email</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Recibirás un email de confirmación con el resumen del pago y los detalles de activación.
                Si en 10 minutos no ves el email, revisa la carpeta de spam. Puedes contactarnos en
                cualquier momento desde la sección de contacto si tienes alguna duda.
              </p>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Consejo:</strong> Los anuncios Turbo reciben de media 3 veces más visitas que
                los anuncios estándar durante la semana de activación. Responde rápido a los mensajes
                que recibas para no perder contactos interesados.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

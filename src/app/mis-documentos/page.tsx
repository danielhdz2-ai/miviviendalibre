import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/NavbarServer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mis documentos — Inmonest',
  description: 'Accede a tus contratos y documentos adquiridos en Inmonest.',
}

const SERVICE_LABELS: Record<string, string> = {
  'arras-confirmatorias':     'Contrato de Arras Confirmatorias',
  'arras-penitenciales':      'Contrato de Arras Penitenciales',
  'alquiler-residencial':     'Contrato de Alquiler Residencial (LAU)',
  'alquiler-temporada':       'Contrato de Alquiler de Temporada',
  'opcion-compra':            'Contrato de Opción de Compra',
  'rescision-mutuo-acuerdo':  'Rescisión por Mutuo Acuerdo',
  'reserva-inmueble':         'Contrato de Reserva de Inmueble',
  'compraventa-privada':      'Contrato de Compraventa Privada',
  'cesion-derechos':          'Contrato de Cesión de Derechos',
  'alquiler-habitacion':      'Contrato de Alquiler de Habitación',
}

interface GestoriaRequest {
  id: string
  session_id: string
  service_key: string
  client_name: string | null
  client_email: string | null
  amount_eur: number | null
  status: string
  paid_at: string | null
  created_at: string
}

export default async function MisDocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const params = await searchParams
  const sessionId = params.session_id ?? null

  // Si hay session_id en URL, intentamos recuperar el pedido aunque no esté logueado
  // Si no hay session_id y no está logueado → redirigir
  if (!user && !sessionId) {
    redirect('/auth/login?next=/mis-documentos')
  }

  let requests: GestoriaRequest[] = []

  if (user) {
    // Usuario autenticado: mostrar todos sus pedidos
    const { data } = await supabase
      .from('gestoria_requests')
      .select('*')
      .eq('client_email', user.email)
      .order('paid_at', { ascending: false })
    requests = (data ?? []) as GestoriaRequest[]
  } else if (sessionId) {
    // Acceso por session_id (desde el email de confirmación)
    const { data } = await supabase
      .from('gestoria_requests')
      .select('*')
      .eq('session_id', sessionId)
      .limit(1)
    requests = (data ?? []) as GestoriaRequest[]
  }

  const justPaid = !!sessionId && requests.length > 0

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f8f5f0] pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Mis documentos</h1>
            <p className="text-gray-500 text-sm">Aquí encontrarás todos los contratos y documentos que has adquirido.</p>
          </div>

          {/* Aviso de pago exitoso */}
          {justPaid && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8 flex items-start gap-4">
              <div className="text-3xl">✅</div>
              <div>
                <p className="font-semibold text-green-800 text-base mb-1">¡Pago completado con éxito!</p>
                <p className="text-green-700 text-sm">
                  Hemos recibido tu pedido. Nuestro equipo lo procesará y recibirás los documentos por email en un plazo de <strong>24–48 horas</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Lista de pedidos */}
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="text-5xl mb-4">📄</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Aún no tienes documentos</h2>
              <p className="text-gray-500 text-sm mb-6">
                Cuando adquieras un contrato en nuestra gestoría, aparecerá aquí.
              </p>
              <Link
                href="/gestoria"
                className="inline-block bg-[#c9962a] hover:bg-[#b8841e] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
              >
                Ver contratos disponibles
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id ?? req.session_id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        req.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {req.paid_at
                          ? new Date(req.paid_at).toLocaleDateString('es-ES', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base truncate">
                      {SERVICE_LABELS[req.service_key] ?? req.service_key.replace(/-/g, ' ')}
                    </h3>
                    {req.client_name && (
                      <p className="text-gray-500 text-sm mt-0.5">{req.client_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-[#c9962a] font-bold text-xl">
                      {req.amount_eur != null ? `${req.amount_eur.toFixed(2)} €` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info gestión */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
            <p className="font-semibold mb-1">¿Cuándo recibiré mi contrato?</p>
            <p>Nuestro equipo te enviará los documentos al email facilitado en un plazo de <strong>24–48 horas laborables</strong>. Si tienes alguna duda, escríbenos a{' '}
              <a href="mailto:info@inmonest.com" className="underline font-medium">info@inmonest.com</a>.
            </p>
          </div>

        </div>
      </main>
    </>
  )
}

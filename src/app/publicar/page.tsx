import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/NavbarServer'
import PublicarWizard from './PublicarWizard'

export const metadata = {
  title: 'Publicar anuncio gratis — Mi Vivienda Libre',
  description: 'Publica tu piso gratis. Sin comisiones, trato directo entre propietario e inquilino.',
}

export default async function PublicarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/publicar-anuncio')

  // Comprobar límite de 2 anuncios activos
  const { count: activeCount } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', user.id)
    .in('status', ['published', 'active'])

  const limitReached = (activeCount ?? 0) >= 2

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fef9e8] py-10 px-4">
        {limitReached ? (
          <div className="max-w-lg mx-auto text-center pt-10">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#f4c94a]/30">
              <div className="w-16 h-16 bg-[#fef0c0] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🚀
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Has publicado tus 2 anuncios gratuitos
              </h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Con el <strong>Plan Profesional</strong> puedes publicar anuncios ilimitados, activar visibilidad Turbo y gestionar leads desde tu panel.
              </p>
              <Link
                href="/agencias"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#c9962a] text-white font-bold text-sm hover:bg-[#a87a20] transition-colors shadow-md shadow-[#c9962a]/30"
              >
                Ver Plan Profesional →
              </Link>
              <div className="mt-4">
                <Link href="/mi-cuenta" className="text-sm text-gray-400 hover:text-[#c9962a]">
                  Gestionar mis anuncios actuales
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <PublicarWizard userId={user.id} />
        )}
      </main>
    </>
  )
}

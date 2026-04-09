import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/NavbarServer'
import Link from 'next/link'

export default async function MiCuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener sus anuncios
  const { data: misAnuncios } = await supabase
    .from('listings')
    .select('id, title, city, price_eur, operation, status, published_at, views_count')
    .eq('user_id', user.id)
    .order('published_at', { ascending: false })
    .limit(20)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi cuenta</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          </div>
          <Link
            href="/publicar"
            className="px-5 py-2.5 bg-[#c9962a] text-white rounded-full text-sm font-semibold hover:bg-[#a87a20] transition-colors"
          >
            + Publicar anuncio
          </Link>
        </div>

        {/* Mis anuncios */}
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Mis anuncios</h2>
          {!misAnuncios || misAnuncios.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <p className="text-gray-500 text-sm mb-4">Aún no tienes ningún anuncio publicado.</p>
              <Link
                href="/publicar"
                className="inline-block px-5 py-2.5 bg-[#c9962a] text-white rounded-full text-sm font-semibold hover:bg-[#a87a20] transition-colors"
              >
                Publicar mi primer anuncio
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {misAnuncios.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.city} · {a.operation === 'rent' ? 'Alquiler' : 'Venta'} · {' '}
                      {a.price_eur
                        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(a.price_eur)
                        : 'Sin precio'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.status === 'published' ? 'bg-[#fef0c0] text-[#a87a20]' :
                      a.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {a.status === 'published' ? 'Publicado' : a.status === 'paused' ? 'Pausado' : a.status}
                    </span>
                    <span className="text-xs text-gray-400">{a.views_count ?? 0} visitas</span>
                    <Link
                      href={`/pisos/${a.id}`}
                      className="text-xs text-[#c9962a] hover:underline"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cerrar sesión */}
        <form action="/auth/signout" method="POST" className="mt-10">
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}

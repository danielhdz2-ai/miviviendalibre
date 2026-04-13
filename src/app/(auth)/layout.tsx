import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Columna izquierda: marketing ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col relative overflow-hidden bg-[#0f1a12]">

        {/* Imágenes en grid */}
        <div className="absolute inset-0 grid grid-rows-2">
          {/* Imagen superior — decorado */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/decorado1.jpg"
            alt="Vivienda moderna"
            className="w-full h-full object-cover"
          />
          {/* Imagen inferior — gestoría */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gestoria1.jpg"
            alt="Asesoría inmobiliaria"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Overlay oscuro degradado */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />

        {/* Contenido sobre las imágenes */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

          {/* Logo */}
          <Link href="/" className="flex items-center w-fit mb-auto">
            <span className="text-3xl font-black tracking-tight">
              <span className="text-white">Inmo</span><span className="text-[#c9962a]">nest</span>
            </span>
          </Link>

          {/* Texto central */}
          <div className="py-12">
            <p className="text-[#c9962a] text-sm font-semibold uppercase tracking-widest mb-3">Portal inmobiliario de particulares</p>
            <h1 className="text-white text-4xl xl:text-5xl font-black leading-tight mb-6">
              Tu nido, directo<br />y sin comisiones
            </h1>
            <p className="text-gray-300 text-base xl:text-lg leading-relaxed mb-10 max-w-md">
              Inmonest es el portal dedicado a conectar <strong className="text-white">propietarios directos</strong> con
              compradores e inquilinos, eliminando intermediarios y ahorrando miles de euros en comisiones.
            </p>

            {/* Servicios */}
            <div className="grid grid-cols-1 gap-4 max-w-md">
              {[
                { icon: '🏡', title: 'Vende o alquila tu piso gratis', desc: 'Publica tu anuncio en minutos y llega a miles de compradores directos.' },
                { icon: '🔍', title: 'Encuentra pisos sin agencia', desc: 'Miles de inmuebles de particulares en venta y alquiler, sin comisión.' },
                { icon: '📄', title: 'Contratos y gestoría online', desc: 'Genera contratos de arras y alquiler en minutos desde 7 €.' },
                { icon: '🤖', title: 'Buscador con IA', desc: 'Describe lo que buscas en lenguaje natural y la IA lo encuentra por ti.' },
              ].map((s) => (
                <div key={s.title} className="flex gap-3 items-start">
                  <span className="text-2xl mt-0.5">{s.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{s.title}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-gray-500 text-xs mt-auto">
            © {new Date().getFullYear()} Inmonest · Tu nido, directo y sin comisiones
          </p>
        </div>
      </div>

      {/* ── Columna derecha: formulario ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-gradient-to-br from-[#fef9e8] to-white">

        {/* Mini header móvil */}
        <header className="flex lg:hidden p-5">
          <Link href="/" className="flex items-center w-fit">
            <span className="text-2xl font-black tracking-tight">
              <span className="text-[#1a0d00]">Inmo</span><span className="text-[#c9962a]">nest</span>
            </span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          {children}
        </main>

        <footer className="flex lg:hidden text-center text-xs text-gray-400 py-4 justify-center">
          © {new Date().getFullYear()} Inmonest · Tu nido, directo y sin comisiones
        </footer>
      </div>

    </div>
  )
}


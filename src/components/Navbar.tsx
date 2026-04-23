'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface NavbarProps {
  isLoggedIn?: boolean
}

const NAV_ITEMS = [
  { label: 'Alquiler',             href: '/pisos?operacion=rent' },
  { label: 'Pisos de Particulares', href: '/pisos?operacion=rent&solo_particulares=true' },
  { label: 'Compra',               href: '/pisos?operacion=sale' },
  { label: 'Publicar gratis',      href: '/publicar-anuncio' },
  { label: 'Vender casa',          href: '/vender-casa' },
  { label: 'Gestoría',             href: '/gestoria' },
  { label: 'Agencias',             href: '/agencias' },
  { label: 'Hipotecas',            href: '/hipoteca' },
  { label: 'Blog',                 href: '/blog' },
]

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const [sideOpen, setSideOpen] = useState(false)

  // Bloquear scroll del body cuando el panel está abierto
  useEffect(() => {
    document.body.style.overflow = sideOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sideOpen])

  const close = () => setSideOpen(false)

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center h-16 px-3 sm:px-5 gap-3">

          {/* Hamburger — siempre visible */}
          <button
            onClick={() => setSideOpen(true)}
            className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:bg-[#fef9e8] hover:text-[#c9962a] transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo — pegado a la izquierda */}
          <Link href="/" className="flex items-end gap-0 flex-shrink-0 -ml-0.5">
            <Image
              src="/logo.png"
              alt="Inmonest"
              width={160}
              height={42}
              className="h-10 w-auto object-contain mb-0.5"
              priority
            />
            <span className="text-xl font-extrabold tracking-tight leading-none pb-1">
              <span className="text-[#1a0d00]">Inmo</span><span className="text-[#c9962a]">nest</span>
            </span>
          </Link>

          {/* Nav links — solo desktop, en el centro */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-gray-600 ml-6 flex-1">
            <Link href="/pisos?operacion=rent"                        className="hover:text-[#c9962a] transition-colors whitespace-nowrap">Alquiler</Link>
            <Link href="/pisos?operacion=rent&solo_particulares=true" className="hover:text-[#c9962a] transition-colors whitespace-nowrap">Pisos de Particulares</Link>
            <Link href="/pisos?operacion=sale"                        className="hover:text-[#c9962a] transition-colors whitespace-nowrap">Compra</Link>
            <Link href="/publicar-anuncio"                            className="hover:text-[#c9962a] transition-colors whitespace-nowrap">Publicar gratis</Link>
            <Link href="/vender-casa"                                 className="hover:text-[#c9962a] transition-colors whitespace-nowrap">Vender casa</Link>
            <Link href="/gestoria"                                    className="hover:text-[#c9962a] transition-colors whitespace-nowrap">Gestoría</Link>
            <Link href="/agencias"                                    className="hover:text-[#c9962a] transition-colors whitespace-nowrap">Agencias</Link>
            <Link href="/hipoteca"                                    className="hover:text-[#c9962a] transition-colors whitespace-nowrap font-semibold text-[#c9962a]">Hipotecas</Link>
          </nav>

          {/* Spacer para empujar CTAs a la derecha */}
          <div className="flex-1 lg:flex-none" />

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link
              href="/publicar-anuncio"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full bg-[#c9962a] text-white text-sm font-semibold hover:bg-[#b8841e] transition-colors whitespace-nowrap"
            >
              Publicar anuncio
            </Link>
            {isLoggedIn ? (
              <Link
                href="/mi-cuenta"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border border-[#c9962a]/40 text-[#c9962a] text-sm font-medium hover:bg-[#fef9e8] transition-colors whitespace-nowrap"
              >
                Mi cuenta
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border border-[#c9962a]/40 text-[#c9962a] text-sm font-medium hover:bg-[#fef9e8] transition-colors whitespace-nowrap"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Panel lateral tipo Fotocasa ── */}

      {/* Overlay */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 z-[70] h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          sideOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del panel */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Link href="/" onClick={close} className="flex items-end gap-0">
            <Image src="/logo.png" alt="Inmonest" width={120} height={32} className="h-8 w-auto object-contain mb-0.5" />
            <span className="text-lg font-extrabold tracking-tight leading-none pb-0.5">
              <span className="text-[#1a0d00]">Inmo</span><span className="text-[#c9962a]">nest</span>
            </span>
          </Link>
          <button
            onClick={close}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Links de navegación */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="flex items-center gap-3 px-6 py-3.5 text-sm font-medium text-gray-800 hover:bg-[#fef9e8] hover:text-[#c9962a] transition-colors border-b border-gray-50 last:border-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer del panel */}
        <div className="p-5 border-t border-gray-100 space-y-2">
          <Link
            href="/publicar-anuncio"
            onClick={close}
            className="block text-center py-2.5 rounded-full bg-[#c9962a] text-white text-sm font-semibold hover:bg-[#b8841e] transition-colors"
          >
            Publicar anuncio gratis
          </Link>
          {isLoggedIn ? (
            <Link
              href="/mi-cuenta"
              onClick={close}
              className="block text-center py-2.5 rounded-full border border-[#c9962a]/40 text-[#c9962a] text-sm font-medium hover:bg-[#fef9e8] transition-colors"
            >
              Mi cuenta
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={close}
              className="block text-center py-2.5 rounded-full border border-[#c9962a]/40 text-[#c9962a] text-sm font-medium hover:bg-[#fef9e8] transition-colors"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </>
  )
}

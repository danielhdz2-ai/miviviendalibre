'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface NavbarProps {
  isLoggedIn?: boolean
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gold-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold tracking-tight leading-none">
              <span className="text-gray-900">Mivivienda</span><span className="text-[#c9962a]">Libre</span>
            </span>
          </Link>

          {/* Nav links - desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/pisos?operacion=rent" className="hover:text-gold-600 transition-colors">
              Alquiler
            </Link>
            <Link href="/pisos?operacion=sale" className="hover:text-gold-600 transition-colors">
              Compra
            </Link>
            <Link href="/publicar" className="hover:text-gold-600 transition-colors">
              Publicar gratis
            </Link>
            <Link href="/vender-casa" className="hover:text-gold-600 transition-colors">
              Vender casa
            </Link>
            <Link href="/gestoria" className="hover:text-gold-600 transition-colors">
              Contratos
            </Link>
            <Link href="/agencias" className="hover:text-gold-600 transition-colors">
              Agencias
            </Link>
          </nav>

          {/* CTA + menu mobile */}
          <div className="flex items-center gap-3">
            <Link
              href="/publicar"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 transition-colors"
            >
              Publicar anuncio
            </Link>
            {isLoggedIn ? (
              <Link
                href="/mi-cuenta"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border border-gold-200 text-gold-700 text-sm font-medium hover:bg-gold-50 transition-colors"
              >
                Mi cuenta
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border border-gold-200 text-gold-700 text-sm font-medium hover:bg-gold-50 transition-colors"
              >
                Entrar
              </Link>
            )}

            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gold-50"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gold-100 py-3 space-y-1">
            <Link href="/pisos?operacion=rent" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gold-50" onClick={() => setMenuOpen(false)}>Alquiler</Link>
            <Link href="/pisos?operacion=sale" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gold-50" onClick={() => setMenuOpen(false)}>Compra</Link>
            <Link href="/publicar" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gold-50" onClick={() => setMenuOpen(false)}>Publicar gratis</Link>
            <Link href="/vender-casa" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gold-50" onClick={() => setMenuOpen(false)}>Vender casa</Link>
            <Link href="/gestoria" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gold-50" onClick={() => setMenuOpen(false)}>Contratos</Link>
            <Link href="/agencias" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gold-50" onClick={() => setMenuOpen(false)}>Agencias</Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/publicar" className="block px-3 py-2 rounded-full bg-gold-500 text-white text-sm font-semibold text-center hover:bg-gold-600" onClick={() => setMenuOpen(false)}>Publicar anuncio</Link>
              {isLoggedIn ? (
                <Link href="/mi-cuenta" className="block px-3 py-2 rounded-full border border-gold-200 text-gold-700 text-sm font-medium text-center hover:bg-gold-50" onClick={() => setMenuOpen(false)}>Mi cuenta</Link>
              ) : (
                <Link href="/login" className="block px-3 py-2 rounded-full border border-gold-200 text-gold-700 text-sm font-medium text-center hover:bg-gold-50" onClick={() => setMenuOpen(false)}>Entrar</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const NAV_ITEMS = [
  {
    href:  '/mi-cuenta',
    exact: true,
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    label: 'Inicio',
    badge: null,
  },
  {
    href:  '/mi-cuenta/anuncios',
    exact: false,
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    label: 'Mis anuncios',
    badge: null,
  },
  {
    href:  '/mi-cuenta/favoritos',
    exact: false,
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    label: 'Favoritos',
    badge: 'fav',
  },
  {
    href:  '/mi-cuenta/mensajes',
    exact: false,
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    label: 'Mensajes',
    badge: 'msg',
  },
  {
    href:  '/mi-cuenta/alertas',
    exact: false,
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    label: 'Mis alertas',
    badge: 'alert',
  },
  {
    href:  '/mi-cuenta/contratos',
    exact: false,
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    label: 'Contratos',
    badge: null,
  },
  {
    href:  '/mi-cuenta/perfil',
    exact: false,
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    label: 'Mi perfil',
    badge: null,
  },
]

interface Props {
  email: string
  displayName: string
  initials: string
  avatarUrl: string | null
  favCount: number
  msgCount: number
  alertCount: number
  children: React.ReactNode
}

export default function DashboardSidebar({
  email, displayName, initials, avatarUrl, favCount, msgCount, alertCount, children
}: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  function isActive(item: (typeof NAV_ITEMS)[0]) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  function getBadge(item: (typeof NAV_ITEMS)[0]) {
    if (item.badge === 'fav'   && favCount   > 0) return favCount
    if (item.badge === 'msg'   && msgCount   > 0) return msgCount
    if (item.badge === 'alert' && alertCount > 0) return alertCount
    return null
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-0">
          <Image src="/logo.png" alt="Inmonest" width={36} height={36} className="object-contain" />
          <span className="text-lg font-extrabold tracking-tight leading-none">
            <span className="text-gray-900">Inmo</span><span className="text-[#c9962a]">nest</span>
          </span>
        </Link>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-gradient-to-r from-[#fdf6e8] to-[#fef9f0] rounded-xl p-3">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={40} height={40} className="rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9962a] to-[#7a5c1e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = isActive(item)
          const badge  = getBadge(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-[#c9962a] text-white shadow-sm shadow-amber-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={active ? 'text-white' : 'text-gray-400 group-hover:text-[#c9962a] transition-colors'}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {badge !== null && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-[#fef0c0] text-[#a87a20]'
                }`}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Publish CTA */}
      <div className="px-4 py-4 border-t border-gray-100">
        <Link
          href="/publicar"
          className="flex items-center justify-center gap-2 w-full bg-[#c9962a] hover:bg-[#b8841e] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Publicar anuncio
        </Link>
        <form action="/auth/signout" method="POST" className="mt-2">
          <button type="submit" className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1.5">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Sidebar desktop ─────────────────────────────────────────── */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex-col">
        <SidebarContent />
      </div>

      {/* ── Mobile topbar ────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-0">
          <Image src="/logo.png" alt="Inmonest" width={32} height={32} className="object-contain" />
          <span className="text-base font-extrabold tracking-tight leading-none">
            <span className="text-gray-900">Inmo</span><span className="text-[#c9962a]">nest</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Abrir menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-72 bg-white h-full flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="lg:ml-64 flex-1 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </>
  )
}

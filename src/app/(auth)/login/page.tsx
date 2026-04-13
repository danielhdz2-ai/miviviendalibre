'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogle() {
    setLoadingGoogle(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      setError('No se pudo conectar con Google. Inténtalo de nuevo.')
      setLoadingGoogle(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setError('No se pudo enviar el enlace. Inténtalo de nuevo.')
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="w-14 h-14 bg-[#fef0c0] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#c9962a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h1>
          <p className="text-gray-500 text-sm mb-1">Hemos enviado un enlace mágico a</p>
          <p className="font-semibold text-gray-800 mb-6">{email}</p>
          <p className="text-xs text-gray-400">Haz clic en el enlace del email para entrar. Válido 10 minutos.</p>
          <button onClick={() => { setSent(false); setEmail('') }} className="mt-6 text-sm text-[#c9962a] hover:underline">
            Usar otro email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

        {/* Cabecera */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            Inicia sesión o regístrate
          </h1>
          <p className="text-sm text-gray-500">
            para publicar en <span className="font-bold text-[#c9962a]">Inmonest</span>
          </p>
        </div>

        {/* Badges de beneficios */}
        <div className="flex gap-2 justify-center flex-wrap mb-6">
          {[
            { icon: '📢', text: '2 anuncios gratis' },
            { icon: '🚀', text: 'Visibilidad Turbo' },
            { icon: '🔓', text: 'Sin intermediarios' },
          ].map((b) => (
            <span key={b.text} className="flex items-center gap-1 bg-[#fef9e8] border border-[#f0dfa0] text-[#7a5c10] text-xs font-semibold px-2.5 py-1 rounded-full">
              {b.icon} {b.text}
            </span>
          ))}
        </div>

        {/* Botón Google */}
        <button
          onClick={handleGoogle}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors mb-3 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {loadingGoogle ? 'Conectando...' : 'Continuar con Google'}
        </button>

        {/* Divisor */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">o continúa con email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Formulario email */}
        <form onSubmit={handleMagicLink} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1">Tu email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9962a] focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#c9962a] text-white rounded-xl text-sm font-bold hover:bg-[#a87a20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Continuar →'}
          </button>
        </form>

        {/* Texto legal */}
        <p className="text-center text-[11px] text-gray-400 mt-4">
          Al continuar aceptas nuestros{' '}
          <Link href="/terminos" className="underline hover:text-gray-600">términos de uso</Link>
          {' '}y{' '}
          <Link href="/privacidad" className="underline hover:text-gray-600">privacidad</Link>.
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            ¿Primera vez?{' '}
            <Link href="/registro" className="text-[#c9962a] font-semibold hover:underline">
              Crea tu cuenta gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


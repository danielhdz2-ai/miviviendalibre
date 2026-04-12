'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  redirectTo?: string
  title?: string
  subtitle?: string
}

export default function AuthModal({
  isOpen,
  onClose,
  redirectTo = '/publicar',
  title = 'Publica tu anuncio gratis',
  subtitle = 'Publica gratis tus 2 primeros anuncios. Gestión directa con particulares y visibilidad Turbo inmediata.',
}: AuthModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingApple, setLoadingApple] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    setLoading(false)
    if (error) {
      setError('No se pudo enviar el enlace. Inténtalo de nuevo.')
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    setLoadingGoogle(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) {
      setError('No se pudo conectar con Google. Inténtalo de nuevo.')
      setLoadingGoogle(false)
    }
    // Si no hay error, redirige automáticamente
  }

  async function handleApple() {
    setLoadingApple(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) {
      setError('No se pudo conectar con Apple. Inténtalo de nuevo.')
      setLoadingApple(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay oscuro */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel del modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Banda dorada superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#c9962a] via-[#f4c94a] to-[#c9962a]" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 py-7">

          {sent ? (
            /* Estado: enlace enviado */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#fef0c0] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#c9962a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Revisa tu correo!</h2>
              <p className="text-sm text-gray-500 mb-1">
                Hemos enviado un enlace mágico a
              </p>
              <p className="font-semibold text-gray-800 mb-5">{email}</p>
              <p className="text-xs text-gray-400 mb-6">
                Haz clic en el enlace para acceder. Válido 10 minutos.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-sm text-[#c9962a] hover:underline"
              >
                Usar otro email
              </button>
            </div>
          ) : (
            <>
              {/* Cabecera */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                  Inicia sesión o regístrate<br />para publicar en{' '}
                  <span className="text-[#c9962a]">Inmovía</span>
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {/* Garantías */}
              <div className="flex gap-3 mb-5">
                {['🆓 2 anuncios gratis', '🚀 Visibilidad Turbo', '🔒 Sin intermediarios'].map((badge) => (
                  <span
                    key={badge}
                    className="flex-1 text-center text-xs bg-[#fef9e8] text-[#8a6520] border border-[#f4c94a]/40 rounded-full px-2 py-1 font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loadingGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-3"
              >
                {loadingGoogle ? (
                  <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Continuar con Google
              </button>

              {/* Apple */}
              <button
                onClick={handleApple}
                disabled={loadingApple}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-4"
              >
                {loadingApple ? (
                  <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                )}
                Continuar con Apple
              </button>

              {/* Divisor */}
              <div className="relative flex items-center mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="px-3 text-xs text-gray-400 font-medium">o continúa con email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Formulario email */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div>
                  <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Tu email
                  </label>
                  <input
                    id="modal-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9962a] focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#c9962a] text-white rounded-xl text-sm font-bold hover:bg-[#a87a20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#c9962a]/30"
                >
                  {loading ? 'Enviando enlace...' : 'Continuar →'}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-gray-400">
                Al continuar aceptas nuestros{' '}
                <a href="/legal/terminos" className="text-[#c9962a] hover:underline">términos de uso</a>{' '}
                y{' '}
                <a href="/legal/privacidad" className="text-[#c9962a] hover:underline">privacidad</a>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

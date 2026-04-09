'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
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
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="w-14 h-14 bg-[#fef0c0] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#c9962a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h1>
          <p className="text-gray-500 text-sm mb-1">
            Hemos enviado un enlace mágico a
          </p>
          <p className="font-semibold text-gray-800 mb-6">{email}</p>
          <p className="text-xs text-gray-400">
            Haz clic en el enlace del email para entrar. Válido 10 minutos.
          </p>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="mt-6 text-sm text-[#c9962a] hover:underline"
          >
            Usar otro email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Accede a tu cuenta</h1>
        <p className="text-sm text-gray-500 mb-6">
          Sin contraseñas. Recibirás un enlace en tu correo.
        </p>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9962a] focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#c9962a] text-white rounded-lg text-sm font-semibold hover:bg-[#a87a20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Enviar enlace mágico'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            ¿Primera vez?{' '}
            <Link href="/registro" className="text-[#c9962a] font-medium hover:underline">
              Crea tu cuenta gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function GraciasContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id') ?? ''

  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [serviceName, setServiceName] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  useEffect(() => {
    if (!sessionId.startsWith('cs_')) {
      setState('error')
      return
    }
    // Verificamos el pago y confirmamos en DB
    fetch(`/api/gestoria/confirmar-pago?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setState('error')
        } else {
          setServiceName(data.service_name ?? '')
          setClientEmail(data.customer_email ?? '')
          setState('ok')
        }
      })
      .catch(() => setState('error'))
  }, [sessionId])

  if (state === 'loading') {
    return (
      <main className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-[#c9962a] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Verificando pago…</p>
        </div>
      </main>
    )
  }

  if (state === 'error') {
    return (
      <main className="min-h-screen bg-[#faf8f4] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pago no completado</h2>
          <p className="text-sm text-gray-500 mb-6">
            No pudimos confirmar tu pago. Si crees que es un error, escríbenos a{' '}
            <a href="mailto:info@inmonest.com" className="text-[#c9962a] font-medium">info@inmonest.com</a>.
          </p>
          <Link
            href="/gestoria"
            className="inline-block px-6 py-2.5 bg-[#c9962a] text-white rounded-full text-sm font-semibold hover:bg-[#a87a20] transition-colors"
          >
            Volver a gestoría
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg w-full text-center">

        {/* Icono éxito */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Pago confirmado!</h1>
        {serviceName && (
          <p className="text-[#c9962a] font-semibold text-sm mb-4">{serviceName}</p>
        )}

        {/* Mensaje */}
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          Hemos recibido tu pedido correctamente.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Nuestro equipo de gestoría revisará los detalles y{' '}
          {clientEmail
            ? <><strong>te enviará el contrato a {clientEmail}</strong> en menos de</>
            : 'se pondrá en contacto contigo en menos de'}{' '}
          <strong>48 horas</strong>.
        </p>

        {/* Pasos informativos */}
        <div className="bg-amber-50 rounded-xl p-5 text-left mb-8 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#a87a20] mb-2">¿Qué ocurre ahora?</h3>
          {[
            'Recibirás un email de confirmación en breve.',
            'Nuestro gestor revisará tu solicitud y preparará el contrato personalizado.',
            'En menos de 48h recibirás el documento listo para firmar digitalmente.',
            'Si necesitas algo urgente, escríbenos a info@inmonest.com.',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#c9962a] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-600">{step}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/gestoria"
            className="px-5 py-2.5 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-[#c9962a] hover:text-[#c9962a] transition-colors"
          >
            Volver a gestoría
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-[#c9962a] text-white rounded-full text-sm font-semibold hover:bg-[#a87a20] transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}

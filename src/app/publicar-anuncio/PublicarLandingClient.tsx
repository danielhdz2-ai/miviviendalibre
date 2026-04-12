'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthModal from '@/components/AuthModal'

interface Props {
  isLoggedIn: boolean
}

export default function PublicarLandingClient({ isLoggedIn }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  function handleCTA() {
    if (isLoggedIn) {
      router.push('/publicar')
    } else {
      setModalOpen(true)
    }
  }

  return (
    <>
      <button
        onClick={handleCTA}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#c9962a] text-white font-bold text-base hover:bg-[#a87a20] transition-all shadow-xl shadow-[#c9962a]/40 hover:scale-105 active:scale-95"
      >
        Pon tu anuncio gratis
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>

      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        redirectTo="/publicar"
      />
    </>
  )
}

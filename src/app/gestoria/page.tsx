import type { Metadata } from 'next'
import Navbar from '@/components/NavbarServer'
import GestoriaContent from './GestoriaContent'

export const metadata: Metadata = {
  title: 'Contratos inmobiliarios — Gestoría experta | Inmonest',
  description: 'Contratos de arras, alquiler, reserva y rescisión redactados por abogados especializados en derecho inmobiliario. Desde 30 €. Entrega en 48h.',
  openGraph: {
    title: 'Contratos inmobiliarios redactados por expertos — Inmonest',
    description: 'Arras, alquiler LAU, temporada, rescisión y más. Abogados especializados, sin plantillas genéricas. Desde 30 €.',
    type: 'website',
  },
}

export default function GestoriaPage() {
  return (
    <>
      <Navbar />
      <GestoriaContent />
    </>
  )
}

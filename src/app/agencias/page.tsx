import type { Metadata } from 'next'
import Navbar from '@/components/NavbarServer'
import AgenciasContent from './AgenciasContent'

export const metadata: Metadata = {
  title: 'Agencias Inmobiliarias — Publica en Inmonest',
  description: 'Escaparate premium para inmobiliarias. Publica tus inmuebles ante miles de compradores y arrendatarios sin comisiones de portal.',
}

export default function AgenciasPage() {
  return (
    <>
      <Navbar />
      <AgenciasContent />
    </>
  )
}

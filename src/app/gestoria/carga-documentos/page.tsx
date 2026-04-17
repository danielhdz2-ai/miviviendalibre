import type { Metadata } from 'next'
import Navbar from '@/components/NavbarServer'
import CargaDocumentosContent from './CargaDocumentosContent'

export const metadata: Metadata = {
  title: 'Cargar documentación — Inmonest Gestoría',
  robots: 'noindex, nofollow',
}

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CargaDocumentosPage({ searchParams }: Props) {
  const { session_id } = await searchParams
  return (
    <>
      <Navbar />
      <CargaDocumentosContent sessionId={session_id ?? ''} />
    </>
  )
}

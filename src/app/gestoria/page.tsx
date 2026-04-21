import type { Metadata } from 'next'
import Script from 'next/script'
import Navbar from '@/components/NavbarServer'
import GestoriaContent from './GestoriaContent'
import WhatsAppButton from '@/components/WhatsAppButton'

const BASE_URL = 'https://inmonest.com'

export const metadata: Metadata = {
  title: 'Contratos inmobiliarios — Gestoría experta',
  description: 'Contratos de arras, alquiler, reserva y rescisión redactados por abogados especializados en derecho inmobiliario. Desde 30 €. Entrega en 48h.',
  alternates: {
    canonical: `${BASE_URL}/gestoria`,
  },
  openGraph: {
    title: 'Contratos inmobiliarios redactados por expertos — Inmonest',
    description: 'Arras, alquiler LAU, temporada, rescisión y más. Abogados especializados, sin plantillas genéricas. Desde 30 €.',
    url: `${BASE_URL}/gestoria`,
    type: 'website',
    siteName: 'Inmonest',
    locale: 'es_ES',
  },
}

const schemaJson = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Contratos inmobiliarios — Gestoría Inmonest',
  description: 'Contratos de arras, alquiler LAU, temporada, rescisión y reserva redactados por abogados especializados en derecho inmobiliario. Entrega en 48h.',
  url: `${BASE_URL}/gestoria`,
  provider: {
    '@type': 'Organization',
    name: 'Inmonest',
    url: BASE_URL,
  },
  areaServed: { '@type': 'Country', name: 'España' },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'EUR',
    price: '30',
    priceSpecification: {
      '@type': 'PriceSpecification',
      minPrice: '30',
      priceCurrency: 'EUR',
    },
  },
  serviceType: 'Gestoría inmobiliaria',
})

export default function GestoriaPage() {
  return (
    <>
      <Script
        id="schema-gestoria"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
      />
      <Navbar />
      <GestoriaContent />
      <WhatsAppButton />
    </>
  )
}

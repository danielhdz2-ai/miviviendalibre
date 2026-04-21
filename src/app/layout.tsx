import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import Footer from "@/components/Footer";
import GTMProvider from "@/components/GTMProvider";

const GTM_ID = 'GTM-57Q8NRVN'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://inmonest.com'),

  // title.template: todas las subpáginas heredan automáticamente "Título | Inmonest"
  title: {
    default: 'Inmonest | Pisos entre particulares sin comisiones',
    template: '%s | Inmonest',
  },
  description:
    'Compra, vende o alquila tu piso directamente entre particulares. Sin agencias, sin comisiones. Miles de inmuebles en toda España.',
  keywords: [
    'pisos particulares',
    'vender casa sin comisión',
    'alquiler sin agencia',
    'comprar piso sin intermediarios',
    'inmuebles particulares España',
    'portal inmobiliario sin comisiones',
    'contratos de arras',
    'contrato de alquiler',
    'gestoría inmobiliaria online',
    'inmonest',
  ],
  authors: [{ name: 'Inmonest', url: 'https://inmonest.com' }],
  creator: 'Inmonest',
  publisher: 'Inmonest',
  applicationName: 'Inmonest',

  icons: {
    // Google uses the first icon that fits ≥48×48 for mobile search results
    icon: [
      { url: '/icon.png',    type: 'image/png', sizes: '192x192' },
      { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple:    [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },

  // Directivas de rastreo — permite que Google indexe todo el contenido útil
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph — imagen cuando alguien comparte un link
  openGraph: {
    title: 'Inmonest | Pisos entre particulares sin comisiones',
    description:
      'Compra, vende o alquila tu piso directamente entre particulares. Sin agencias, sin comisiones.',
    url: 'https://inmonest.com',
    siteName: 'Inmonest',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',  // crea public/og-image.jpg a 1200×630px para mejor resultado
        width: 1200,
        height: 630,
        alt: 'Inmonest — Pisos sin comisiones entre particulares',
      },
    ],
  },

  // Twitter / X Card
  twitter: {
    card: 'summary_large_image',
    title: 'Inmonest | Pisos entre particulares sin comisiones',
    description: 'Compra, vende o alquila tu piso directamente. Sin agencias, sin comisiones.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {/* GTM script — afterInteractive: fires after hydration, non-blocking */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />

        {/* SPA route-change page_view tracker */}
        <GTMProvider />

        {children}
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}

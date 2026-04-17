import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import WhatsAppButton from "@/components/WhatsAppButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inmonest | Venta de pisos entre particulares sin comisiones",
  description: "La plataforma líder para vender tu casa directamente. Sin agencias, sin comisiones. Quédate con el 100% de tu venta.",
  keywords: "pisos particulares, vender casa sin comisión, alquiler sin agencia, compra sin intermediarios, inmuebles particulares España, inmonest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://inmonest.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Inmonest | Venta de pisos sin comisiones",
    description: "La plataforma líder para vender tu casa directamente. Sin agencias, sin comisiones.",
    locale: "es_ES",
    type: "website",
    siteName: "Inmonest",
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
      <head>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-57Q8NRVN');` }} />
        {/* End Google Tag Manager */}
      </head>
      <body className="min-h-full flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-57Q8NRVN"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
        <ChatWidget />
        <WhatsAppButton />
      </body>
    </html>
  );
}

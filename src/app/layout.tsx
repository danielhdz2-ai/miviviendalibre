import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

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
      <body className="min-h-full flex flex-col">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}

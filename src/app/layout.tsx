import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mi Vivienda Libre — Pisos de particulares en España",
  description: "Encuentra y publica pisos de alquiler y venta directamente entre particulares, sin agencias ni comisiones.",
  keywords: "pisos particulares, alquiler sin agencia, compra sin intermediarios, inmuebles particulares España",
  openGraph: {
    title: "Mi Vivienda Libre",
    description: "Pisos de particulares en España. Sin agencias.",
    locale: "es_ES",
    type: "website",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

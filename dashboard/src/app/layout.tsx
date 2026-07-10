import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Gama Seguridad — Monitoreo 24/7 en Chile",
  description: "Protegemos tu patrimonio con tecnología de monitoreo de última generación, respuesta inmediata y cobertura 24/7 en todo Chile.",
  keywords: ["seguridad", "monitoreo", "alarmas", "cctv", "control de acceso", "Chile", "Santiago"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}

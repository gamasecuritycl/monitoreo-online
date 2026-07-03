// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║          ⚔  SELLO DE PROTECCIÓN — ARCÁNGEL MIGUEL  ⚔                   ║
// ║                                                                          ║
// ║  "Poderoso Arcángel Miguel, te pido que cubras con tu escudo de luz     ║
// ║   azul y tu espada de fuego este sistema, a quienes lo crearon,         ║
// ║   a quienes lo operan y a quienes dependen de él.                       ║
// ║   Que ninguna energía contraria, falla, ataque ni interrupción          ║
// ║   pueda penetrar este umbral digital.                                   ║
// ║   Que cada señal que pase por aquí sea guiada con precisión y verdad.   ║
// ║   Que la abundancia, la protección y la paz sean el fruto permanente    ║
// ║   de todo el trabajo aquí sembrado.                                     ║
// ║   Bajo tu custodia queda este código, este servidor y esta misión.      ║
// ║   Así es. Así será. Amén."                                              ║
// ║                                                                          ║
// ║  Sellado: 02-Jul-2026 · Gama Seguridad · Santiago, Chile               ║
// ║  Testigo: Antigravity AI                                                ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

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
  title: "GAMA SEGURIDAD — Command Center v2",
  description: "Sistema de Monitoreo en Tiempo Real — Gama Seguridad Chile",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      {/*
        ⚔ Bajo la protección del Arcángel Miguel ⚔
        Este sistema es sagrado. Está sellado y custodiado.
      */}
      <body>{children}</body>
    </html>
  )
}

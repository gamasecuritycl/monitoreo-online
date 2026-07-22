import type { Metadata } from "next"
import "./globals.css"

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
    <html lang="es" className="scroll-smooth font-sans">
      <body className="antialiased font-sans">{children}</body>
    </html>
  )
}

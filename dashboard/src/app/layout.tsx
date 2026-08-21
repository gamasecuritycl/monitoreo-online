import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Gama Seguridad — Monitoreo 24/7 en Chile",
  description: "Protegemos tu patrimonio con tecnología de monitoreo de última generación, respuesta inmediata y cobertura 24/7 en todo Chile.",
  keywords: ["seguridad", "monitoreo", "alarmas", "cctv", "control de acceso", "Chile", "Santiago"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="scroll-smooth font-sans">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gama Seguridad" />
      </head>
      <body className="antialiased font-sans">{children}</body>
    </html>
  )
}

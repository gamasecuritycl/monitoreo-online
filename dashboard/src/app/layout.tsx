import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

const SITE_URL = "https://www.gamasecurity.cl"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GAMA SECURITY — Monitoreo Electrónico y Alarmas Vetti 24/7 en Chile",
    template: "%s | GAMA SECURITY",
  },
  description:
    "Empresa líder en monitoreo electrónico 24/7, Alarma Inteligente Vetti con App NT CLICK, teclados DSC PK5501, cámaras 4K y cercos eléctricos. Más de 20 años protegiendo a Chile.",
  keywords: ["seguridad", "monitoreo", "alarmas", "cctv", "control de acceso", "Chile", "Santiago"],
  manifest: "/manifest.json",
  applicationName: "GAMA SECURITY",
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
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITE_URL,
    siteName: "GAMA SECURITY",
    title: "GAMA SECURITY — Monitoreo 24/7 y Alarmas Vetti en Chile",
    description:
      "Monitoreo electrónico 24/7, Alarma Vetti con App NT CLICK, cámaras 4K IA y cercos eléctricos. +20 años protegiendo hogares y empresas en Chile.",
    images: [
      {
        url: "/og-gama.png",
        width: 1200,
        height: 630,
        alt: "GAMA SECURITY — Central de Monitoreo 24/7",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GAMA SECURITY — Monitoreo 24/7 y Alarmas Vetti",
    description:
      "Monitoreo 24/7, Alarmas Vetti, cámaras 4K y cercos eléctricos. +20 años en Chile.",
    images: ["/og-gama.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`scroll-smooth font-sans ${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GAMA SECURITY" />
      </head>
      <body className="antialiased font-sans">
        <a
          href="#inicio"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#0066cc] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Saltar al contenido principal
        </a>
        {children}
      </body>
    </html>
  )
}

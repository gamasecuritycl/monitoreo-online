import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

const SITE_URL = "https://www.gamasecurity.cl"

export const viewport: Viewport = {
  themeColor: "#050d1a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GAMA SECURITY — Monitoreo de Alarmas 24/7 en Chile",
    template: "%s | GAMA SECURITY Chile",
  },
  description:
    "Líder en monitoreo de alarmas 24/7 en Chile. Alarmas inteligentes Vetti con App, cámaras 4K con IA y cercos eléctricos. Evaluación técnica sin costo.",
  keywords: [
    "monitoreo de alarmas",
    "alarmas para casas",
    "alarmas para empresas",
    "seguridad electrónica Chile",
    "cámaras de seguridad CCTV",
    "cercos eléctricos certificados",
    "alarma Vetti Chile",
    "central de monitoreo 24/7",
    "alarmas Santiago",
    "alarmas Valparaíso",
    "GAMA Security",
  ],
  manifest: "/manifest.json",
  applicationName: "GAMA SECURITY",
  authors: [{ name: "GAMA SECURITY", url: SITE_URL }],
  creator: "GAMA SECURITY",
  publisher: "GAMA SECURITY",
  category: "security",
  classification: "Sistemas de Seguridad Electrónica y Monitoreo de Alarmas 24/7",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    title: "GAMA SECURITY — Monitoreo 24/7 y Alarmas Inteligentes en Chile",
    description:
      "Monitoreo electrónico 24/7, Alarmas Vetti con App NT CLICK, cámaras 4K IA y cercos eléctricos. +20 años protegiendo hogares y empresas en Chile.",
    images: [
      {
        url: "/og-gama.png",
        width: 1200,
        height: 630,
        alt: "GAMA SECURITY — Central de Monitoreo de Alarmas 24/7 en Chile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GAMA SECURITY — Monitoreo 24/7 y Alarmas Inteligentes",
    description:
      "Monitoreo 24/7, Alarmas Vetti, cámaras 4K y cercos eléctricos en Chile. Evaluación técnica gratuita.",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GAMA SECURITY" />
        <meta name="format-detection" content="telephone=yes" />
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

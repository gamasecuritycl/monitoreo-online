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
    default: "Alarmas para Casa en Chile: Precios y Monitoreo 24/7 desde 0,9 UF | GAMA SECURITY",
    template: "%s | GAMA SECURITY Chile",
  },
  description:
    "Empresa líder en alarmas para casa, empresas y monitoreo 24/7 en Chile desde 0,9 UF + IVA. Equipos 100% propios sin comodato ni arriendos infinitos. Instalación de alarmas DSC, Honeywell, Paradox, Vetti, cámaras CCTV 4K con IA y cercos eléctricos SEC. Alternativa transparente a Verisure, ADT y Prosegur. Cotización online en 30 segundos.",
  keywords: [
    // Búsquedas principales de alarmas para casa y hogar en Chile
    "alarmas para casa chile",
    "alarmas para casa",
    "alarmas para hogar",
    "sistema de alarmas chile",
    "precios de alarmas para casa",
    "cuanto cuesta una alarma en chile",
    "monitoreo de alarmas 24/7",
    "empresas de alarmas en chile",
    "ranking empresas de alarmas chile",
    "alarmas residenciales chile",
    "instalacion de alarmas chile",
    "alarmas sin comodato",
    "alarmas sin arriendo",
    "cotizador de alarmas online chile",
    "alarmas para parcelas chile",
    "alarmas para departamentos",
    "alarmas para condominios",
    "alarmas comunitarias chile",
    "seguridad electronica chile",
    "empresas de seguridad electronica santiago",

    // Búsquedas de competencia, comparativas y migración
    "alternativa a verisure chile",
    "verisure chile precios",
    "verisure opiniones chile",
    "cuanto cobra verisure chile",
    "dar de baja verisure chile",
    "cambiar de verisure a otra empresa",
    "reclamos verisure comodato",
    "alternativa adt chile",
    "adt chile precios",
    "migrar alarma adt chile",
    "liberar alarma adt chile",
    "reprogramar alarma adt dsc",
    "prosegur alarmas chile precios",
    "movistar prosegur alarmas chile",
    "alternativa prosegur chile",
    "first security chile alarmas",
    "first security precios",
    "federal smart chile",
    "federal security chile",
    "feelsecure chile",
    "brinks alarmas chile",
    "securitas chile tecnologia",
    "tecnored alarmas chile",
    "enel x alarmas hogar",

    // Marcas de alarmas y hardware bancario / homologado
    "marcas de alarmas chile",
    "cual es la mejor marca de alarmas en chile",
    "alarmas dsc chile",
    "alarma dsc powerseries pc1832",
    "alarma dsc pc585",
    "alarma dsc neo chile",
    "dsc neo hs2032 hs2064",
    "teclado dsc pk5501",
    "teclado dsc rfk5500",
    "comunicador tl280 dsc",
    "sensor pir antimascotas lc-100-pi",
    "alarma honeywell vista chile",
    "honeywell vista 48la",
    "teclado 6160 honeywell",
    "alarmas paradox chile",
    "paradox magellan mg5050",
    "paradox spectra sp4000",
    "paradox evo192 digiplex",
    "modulo ip150 paradox",
    "hikvision ax pro chile",
    "hikvision pircam sensor",
    "dahua airshield chile",
    "alarma vetti smart",
    "app nt click alarma",
    "bosch security sistemas chile",
    "risco group chile",
    "intelbras alarmas chile",
    "barreras perimetrales infrarrojas optex",
    "sensores takex perimetrales",

    // Cámaras de seguridad y CCTV
    "camaras de seguridad cctv chile",
    "instalacion de camaras de seguridad santiago",
    "camaras ip 4k con inteligencia artificial",
    "hikvision colorvu chile",
    "hikvision acusense nvr",
    "dahua wizsense cctv",
    "dahua tioc camaras",
    "camaras solares 4g para parcelas",
    "camaras de seguridad para condominios",
    "videoverificacion de alarmas central cra",
    "grabador dvr nvr western digital purple",

    // Cercos eléctricos certificados SEC
    "cercos electricos certificados sec chile",
    "instalacion de cerco electrico santiago",
    "mantencion de cerco electrico santiago",
    "tramite te1 sec cerco electrico",
    "normativa sec cercos electricos chile",
    "energizador speedrite chile",
    "energizador nemtek chile",
    "energizador jva cerco electrico",
    "cerco electrico para parcelas",

    // Control de acceso y citofonía
    "control de acceso empresas chile",
    "reloj control biometrico zkteco",
    "reconocimiento facial hikvision minmoe",
    "cerraduras electromagneticas 600 lbs 1200 lbs",
    "barreras vehiculares condominios bft came",
    "citofonia y videocitofonia ip edificios",
    "citofono commax aiphone hikvision",
    "deteccion de incendio certificada chile",
    "redes de datos estructurados santiago",

    // Cobertura geográfica clave en Chile
    "alarmas santiago",
    "alarmas las condes",
    "alarmas providencia",
    "alarmas vitacura",
    "alarmas lo barnechea",
    "alarmas la reina",
    "alarmas nunoa",
    "alarmas la florida",
    "alarmas puente alto",
    "alarmas maipu",
    "alarmas colina chicureo",
    "alarmas lampa batuco",
    "alarmas buin paine",
    "alarmas talagante calera de tango",
    "alarmas curacavi melipilla",
    "alarmas vina del mar",
    "alarmas valparaiso",
    "alarmas concon reñaca",
    "alarmas quilpue",
    "alarmas villa alemana",
    "GAMA Security",
    "Gama Seguridad SpA",
    "gamasecurity.cl",
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
    title: "Alarmas para Casa en Chile: Precios y Monitoreo 24/7 | GAMA SECURITY",
    description:
      "Monitoreo 24/7 desde 0,9 UF + IVA. Alarmas para casas y empresas con equipos propios sin comodato. Reprogramación de alarmas ADT/DSC a costo $0 y tecnología de última generación.",
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
    title: "Alarmas para Casa en Chile: Monitoreo 24/7 y Precios Reales",
    description:
      "Monitoreo 24/7 desde 0,9 UF + IVA. Equipos propios sin comodato. Cámaras 4K y cercos eléctricos SEC en Chile.",
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

import type { Metadata } from 'next'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Servicios from '@/components/landing/Servicios'
import VettiShowcase from '@/components/landing/VettiShowcase'
import QuienesSomos from '@/components/landing/QuienesSomos'
import Tecnologia from '@/components/landing/Tecnologia'
import Testimonios from '@/components/landing/Testimonios'
import CTAEmergencia from '@/components/landing/CTAEmergencia'
import LandingInteractiveLayer from '@/components/landing/LandingInteractiveLayer'
import WhatsAppFloating from '@/components/landing/WhatsAppFloating'

const SITE_URL = 'https://www.gamasecurity.cl'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'GAMA SECURITY — Monitoreo Electrónico y Alarmas Vetti 24/7 en Chile',
  description:
    'Empresa líder en monitoreo electrónico 24/7, Alarma Inteligente Vetti con App NT CLICK, teclados DSC PK5501, cámaras 4K y cercos eléctricos. Más de 20 años protegiendo a Chile.',
  keywords: [
    'seguridad',
    'monitoreo 24/7',
    'alarma Vetti',
    'App NT CLICK',
    'DSC PK5501',
    'cercos eléctricos',
    'cámaras IA',
    'Chile',
    'GAMA Security',
    'gamasecurity.cl',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: SITE_URL,
    siteName: 'GAMA SECURITY',
    title: 'GAMA SECURITY — Monitoreo 24/7 y Alarmas Vetti en Chile',
    description:
      'Monitoreo electrónico 24/7, Alarma Vetti con App NT CLICK, cámaras 4K IA y cercos eléctricos. +20 años protegiendo hogares y empresas en Chile.',
    images: [
      {
        url: '/og-gama.png',
        width: 1200,
        height: 630,
        alt: 'GAMA SECURITY — Central de Monitoreo 24/7',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GAMA SECURITY — Monitoreo 24/7 y Alarmas Vetti',
    description:
      'Monitoreo 24/7, Alarmas Vetti, cámaras 4K y cercos eléctricos. +20 años en Chile.',
    images: ['/og-gama.png'],
  },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SecurityService',
  '@id': `${SITE_URL}/#organizacion`,
  name: 'GAMA SECURITY',
  alternateName: 'Gama Seguridad SpA',
  url: SITE_URL,
  logo: `${SITE_URL}/logo-gama.png`,
  image: `${SITE_URL}/og-gama.png`,
  description:
    'Empresa chilena de monitoreo electrónico 24/7, alarmas Vetti, cámaras 4K con IA, cercos eléctricos y detección de incendio.',
  telephone: '+56991016912',
  email: 'contacto@gamasecurity.cl',
  taxID: '78.297.009-7',
  areaServed: {
    '@type': 'Country',
    name: 'Chile',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Av. Valparaíso 351',
    addressLocality: 'Villa Alemana',
    addressRegion: 'Región de Valparaíso',
    addressCountry: 'CL',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -33.0472,
    longitude: -71.3736,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
    ],
    opens: '09:00',
    closes: '18:00',
  },
  sameAs: ['https://www.gamasecurity.cl'],
  priceRange: '$$',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050d1a] relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <Navbar />
      <Hero />
      <Servicios />
      <VettiShowcase />
      <QuienesSomos />
      <Tecnologia />
      <Testimonios />
      <CTAEmergencia />
      <LandingInteractiveLayer />
      <WhatsAppFloating />
    </main>
  )
}

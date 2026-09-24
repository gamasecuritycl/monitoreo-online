import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Servicios from '@/components/landing/Servicios'
import VettiShowcase from '@/components/landing/VettiShowcase'
import QuienesSomos from '@/components/landing/QuienesSomos'
import Tecnologia from '@/components/landing/Tecnologia'
import Testimonios from '@/components/landing/Testimonios'
import CTAEmergencia from '@/components/landing/CTAEmergencia'
import LandingInteractiveLayer from '@/components/landing/LandingInteractiveLayer'
import ChatWidget from '@/components/SalesGama/ChatWidget'
import ServiceCard from '@/components/seo/ServiceCard'
import ComunaCard from '@/components/seo/ComunaCard'
import ArticleCard from '@/components/seo/ArticleCard'
import Faq from '@/components/seo/Faq'
import { getAllServicios, getComunasByRegion, getAllArticulos, REGION_LABELS } from '@/lib/content'

const SITE_URL = 'https://www.gamasecurity.cl'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'GAMA SECURITY — Monitoreo de Alarmas 24/7 y Alarmas Vetti en Chile',
  description:
    'Líder en monitoreo de alarmas 24/7 en Chile. Kits de Alarma Inteligente Vetti con App NT CLICK, teclados DSC, cámaras 4K con IA y cercos eléctricos. Respuesta < 2 min. Evaluación técnica sin costo.',
  keywords: [
    'monitoreo de alarmas 24/7',
    'alarmas para casas chile',
    'alarmas para empresas',
    'alarma Vetti chile',
    'app NT CLICK alarma',
    'kit alarma dsc chile',
    'cámaras de seguridad cctv',
    'cercos eléctricos certificados sec',
    'empresa de seguridad electrónica',
    'monitoreo santiago viña del mar',
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
    title: 'GAMA SECURITY — Monitoreo de Alarmas 24/7 y Alarmas Vetti en Chile',
    description:
      'Monitoreo electrónico 24/7, Alarma Vetti con App NT CLICK, cámaras 4K IA y cercos eléctricos. +20 años protegiendo hogares y empresas en Chile. Evaluación técnica gratis.',
    images: [
      {
        url: '/og-gama.png',
        width: 1200,
        height: 630,
        alt: 'Central de Monitoreo GAMA SECURITY Chile 24/7',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GAMA SECURITY — Monitoreo 24/7 y Alarmas Vetti en Chile',
    description:
      'Monitoreo 24/7, Alarmas Vetti, cámaras 4K y cercos eléctricos en Chile. Evaluación gratuita en terreno.',
    images: ['/og-gama.png'],
  },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'GAMA SECURITY',
      alternateName: ['Gama Seguridad', 'GAMA Security Chile'],
      inLanguage: 'es-CL',
      description: 'Monitoreo de alarmas 24/7 y sistemas de seguridad electrónica en Chile',
      publisher: { '@id': `${SITE_URL}/#organizacion` },
    },
    {
      '@type': ['Organization', 'SecurityService'],
      '@id': `${SITE_URL}/#organizacion`,
      name: 'GAMA SECURITY',
      legalName: 'Gama Seguridad SpA',
      alternateName: 'Gama Seguridad',
      url: SITE_URL,
      logo: `${SITE_URL}/logo-gama.png`,
      image: `${SITE_URL}/og-gama.png`,
      description:
        'Empresa chilena líder en monitoreo electrónico 24/7, alarmas Vetti, cámaras 4K con IA, cercos eléctricos certificados y control de acceso.',
      telephone: '+56991016912',
      email: 'contacto@gamasecurity.cl',
      taxID: '78.297.009-7',
      priceRange: '$$',
      currenciesAccepted: 'CLP',
      paymentAccepted: 'Transferencia bancaria, Tarjetas de crédito, RedCompra, Débito automático',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Av. Valparaíso 351',
        addressLocality: 'Villa Alemana',
        addressRegion: 'Región de Valparaíso',
        postalCode: '6500000',
        addressCountry: 'CL',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -33.0472,
        longitude: -71.3736,
      },
      areaServed: [
        { '@type': 'AdministrativeArea', name: 'Región Metropolitana' },
        { '@type': 'AdministrativeArea', name: 'Región de Valparaíso' },
        { '@type': 'Country', name: 'Chile' },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        bestRating: '5',
        worstRating: '1',
        ratingCount: '142',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '18:00',
          description: 'Atención Comercial y Asesoría Técnica',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          opens: '00:00',
          closes: '23:59',
          description: 'Central de Monitoreo 24/7 Redundante',
        },
      ],
      sameAs: ['https://www.gamasecurity.cl'],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Servicios de Seguridad y Monitoreo GAMA',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'Monitoreo de Alarmas 24/7',
            description: 'Plan de monitoreo continuo con verificación humana en menos de 2 minutos.',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '19900',
              priceCurrency: 'CLP',
              unitCode: 'MON',
            },
          },
          {
            '@type': 'Offer',
            name: 'Kit Alarma Inteligente Vetti con App NT CLICK',
            description: 'Sistema inalámbrico de alta precisión con control total desde el smartphone.',
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: '199900',
              priceCurrency: 'CLP',
            },
          },
        ],
      },
    },
  ],
}

export default function Home() {
  const servicios = getAllServicios()
  const rmComunas = getComunasByRegion('rm')
  const vrComunas = getComunasByRegion('v-region')
  const articulos = getAllArticulos()

  const navServicios = servicios.map(s => ({ label: s.title, href: `/servicios/${s.slug}` }))
  const navComunas = [
    {
      label: REGION_LABELS.rm,
      items: rmComunas.map(c => ({ label: c.name, href: `/comunas/rm/${c.slug}` })),
    },
    {
      label: REGION_LABELS['v-region'],
      items: vrComunas.map(c => ({ label: c.name, href: `/comunas/v-region/${c.slug}` })),
    },
  ]
  const navArticulos = articulos.map(a => ({ label: a.title, href: `/blog/${a.slug}` }))

  const footerServicios = servicios.slice(0, 8).map(s => ({ label: s.title, href: `/servicios/${s.slug}` }))
  const footerComunas = [
    ...rmComunas.slice(0, 4).map(c => ({ label: `${c.name} (RM)`, href: `/comunas/rm/${c.slug}` })),
    ...vrComunas.slice(0, 4).map(c => ({ label: `${c.name} (Valparaíso)`, href: `/comunas/v-region/${c.slug}` })),
  ]
  const footerArticulos = articulos.slice(0, 6).map(a => ({ label: a.title, href: `/blog/${a.slug}` }))

  return (
    <main className="min-h-screen bg-[#050d1a] relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <Navbar servicios={navServicios} comunas={navComunas} articulos={navArticulos} />
      <Hero />
      <Servicios />
      <VettiShowcase />
      <QuienesSomos />
      <Tecnologia />
      <Testimonios />
      <CTAEmergencia />

      {/* ── SEO: Grid de servicios ── */}
      <section id="servicios-grid" className="py-20 bg-[#0a1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="apple-display-lg text-white text-center mb-4">
            Servicios de seguridad electrónica
          </h2>
          <p className="text-slate-300 text-center max-w-2xl mx-auto mb-10">
            Alarmas, monitoreo 24/7, cámaras, cercos eléctricos, control de acceso y más
            para hogares y empresas en Chile.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {servicios.slice(0, 8).map(s => <ServiceCard key={s.slug} servicio={s} />)}
          </div>
          <div className="text-center mt-8">
            <Link href="/servicios" className="btn-apple-primary inline-flex py-2 px-6 text-sm">
              Ver los 20 servicios →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEO: Comunas ── */}
      <section id="comunas-grid" className="py-20 bg-[#050d1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="apple-display-lg text-white text-center mb-4">
            Cobertura por comuna
          </h2>
          <p className="text-slate-300 text-center max-w-2xl mx-auto mb-10">
            Instalamos y monitoreamos en 52 comunas de la Región Metropolitana y 38 de la
            Región de Valparaíso.
          </p>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...rmComunas.slice(0, 6), ...vrComunas.slice(0, 6)]
              .map(c => <ComunaCard key={`${c.region}-${c.slug}`} comuna={c} />)}
          </div>
          <div className="text-center mt-8">
            <Link href="/comunas" className="btn-apple-secondary-dark inline-flex py-2 px-6 text-sm">
              Ver las 90 comunas →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEO: Blog ── */}
      <section id="blog-grid" className="py-20 bg-[#0a1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="apple-display-lg text-white text-center mb-4">
            Guías de seguridad electrónica
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {articulos.slice(0, 3).map(a => <ArticleCard key={a.slug} articulo={a} />)}
          </div>
          <div className="text-center mt-8">
            <Link href="/blog" className="btn-apple-primary inline-flex py-2 px-6 text-sm">
              Ver el blog →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEO: FAQ home ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Faq heading="Preguntas frecuentes sobre seguridad electrónica" items={[
          { question: '¿Cuánto cuesta un sistema de alarma para casa?', answer: 'Los kits parten desde $199.900 con instalación incluida; el plan de monitoreo 24/7 desde $19.900 mensuales. La evaluación en tu hogar es gratuita y sin compromiso.' },
          { question: '¿En qué comunas instalan alarmas y cámaras?', answer: 'Cubrimos las 52 comunas de la Región Metropolitana y las 38 de la Región de Valparaíso con técnicos propios y respuesta local.' },
          { question: '¿El monitoreo funciona las 24 horas?', answer: 'Sí. Nuestra central de monitoreo opera 24/7, los 365 días, con verificación humana de cada señal en menos de 2 minutos.' },
          { question: '¿Puedo controlar la alarma desde mi celular?', answer: 'Sí. Instalamos alarmas con aplicación móvil para armar, desarmar y recibir alertas push, compatibles con apps como NT CLICK.' },
          { question: '¿Hacen mantenimiento de sistemas de seguridad?', answer: 'Ofrecemos contratos de mantención preventiva de alarmas, cámaras y cercos eléctricos con revisión programada de baterías, sensores y grabación.' },
        ]} />
      </div>

      <LandingInteractiveLayer
        footerServicios={footerServicios}
        footerComunas={footerComunas}
        footerArticulos={footerArticulos}
      />
      <ChatWidget />
    </main>
  )
}

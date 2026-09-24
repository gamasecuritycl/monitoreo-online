import type { Metadata } from 'next'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Faq from '@/components/seo/Faq'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import ContactForm from './ContactForm'

const SITE_URL = 'https://www.gamasecurity.cl'

export const metadata: Metadata = {
  title: 'Contacto y Cotización de Alarmas 24/7 en Chile',
  description:
    'Contacta a GAMA SECURITY: cotiza sistemas de alarma inteligente, cámaras de seguridad CCTV y monitoreo 24/7 en Chile. WhatsApp +56 9 9101 6912. Evaluación en terreno gratis.',
  alternates: { canonical: '/contacto' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: `${SITE_URL}/contacto`,
    siteName: 'GAMA SECURITY',
    title: 'Contacto y Cotización de Alarmas 24/7 — GAMA SECURITY Chile',
    description:
      'Cotiza sistemas de alarma, cámaras de seguridad y monitoreo 24/7 en Chile. WhatsApp +56 9 9101 6912. Evaluación gratuita.',
    images: [
      {
        url: '/og-gama.png',
        width: 1200,
        height: 630,
        alt: 'Contacto GAMA SECURITY Central 24/7',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contacto y Cotización de Alarmas 24/7 — GAMA SECURITY',
    description:
      'Cotiza sistemas de alarma, cámaras y monitoreo 24/7 en Chile. Evaluación gratuita.',
    images: ['/og-gama.png'],
  },
}

const WA = 'https://wa.me/56991016912'

const faq = [
  {
    question: '¿La evaluación tiene costo?',
    answer:
      'No. La evaluación inicial en tu propiedad es gratuita y sin compromiso; te entregamos una propuesta técnica con precio cerrado.',
  },
  {
    question: '¿En qué comunas atienden?',
    answer:
      'Instalamos y monitoreamos en las 52 comunas de la Región Metropolitana y las 38 de la Región de Valparaíso, con técnicos propios.',
  },
  {
    question: '¿Cuánto demoran en responder?',
    answer:
      'Nuestra central de monitoreo opera 24/7 y verifica cada señal en menos de 2 minutos. Para visitas técnicas agendamos en menos de 48 horas hábiles.',
  },
  {
    question: '¿Cómo cotizo alarma, cámaras o cerco eléctrico?',
    answer:
      'Completa el formulario, escríbenos por WhatsApp al +56 9 9101 6912 o llama al mismo número. Respondemos en el día hábil.',
  },
]

export default function ContactoPage() {
  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          url: `${SITE_URL}/contacto`,
          name: 'Contacto GAMA SECURITY',
          about: {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organizacion`,
            name: 'GAMA SECURITY',
            url: SITE_URL,
            telephone: '+56991016912',
            email: 'contacto@gamasecurity.cl',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Av. Valparaíso 351',
              addressLocality: 'Villa Alemana',
              addressRegion: 'Región de Valparaíso',
              addressCountry: 'CL',
            },
          },
        }}
      />
      <Breadcrumbs items={[{ label: 'Contacto', href: '/contacto' }]} />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <header className="space-y-4">
          <h1 className="apple-display-lg text-white">Contacto y cotización</h1>
          <p className="text-slate-300 apple-lead max-w-3xl">
            Cuéntanos qué necesitas proteger — casa, negocio, oficina o comuna — y te
            enviamos una propuesta técnica sin costo. También puedes escribirnos por
            WhatsApp o llamar directo a nuestra central.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <ContactForm />
          <div className="space-y-4">
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="apple-card-dark p-6 block hover:border-[#2997ff]/50 transition-colors">
              <h2 className="text-white font-semibold mb-1">WhatsApp</h2>
              <p className="text-[#2997ff] text-sm">+56 9 9101 6912 →</p>
            </a>
            <a href="tel:+56991016912" className="apple-card-dark p-6 block hover:border-[#2997ff]/50 transition-colors">
              <h2 className="text-white font-semibold mb-1">Teléfono</h2>
              <p className="text-[#2997ff] text-sm">+56 9 9101 6912</p>
            </a>
            <a href="mailto:contacto@gamasecurity.cl" className="apple-card-dark p-6 block hover:border-[#2997ff]/50 transition-colors">
              <h2 className="text-white font-semibold mb-1">Email</h2>
              <p className="text-[#2997ff] text-sm">contacto@gamasecurity.cl</p>
            </a>
            <div className="apple-card-dark p-6">
              <h2 className="text-white font-semibold mb-1">Dirección</h2>
              <p className="text-slate-400 text-sm">Av. Valparaíso 351, Villa Alemana<br />Región de Valparaíso, Chile</p>
              <p className="text-slate-500 text-xs mt-2">RUT 78.297.009-7</p>
            </div>
          </div>
        </div>

        <Hashtags tags={['ContactoSeguridad', 'CotizaciónAlarma', 'SistemaDeAlarma', 'GamaSecurity']} />
        <Faq items={faq} />
      </section>
    </main>
  )
}

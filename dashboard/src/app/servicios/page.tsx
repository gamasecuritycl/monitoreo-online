import type { Metadata } from 'next'
import { getAllServicios } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import ServiceCard from '@/components/seo/ServiceCard'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'

const SITE_URL = 'https://www.gamasecurity.cl'

export const metadata: Metadata = {
  title: 'Servicios de Seguridad Electrónica y Monitoreo de Alarmas 24/7',
  description:
    'Alarmas para casas y empresas, monitoreo 24/7, cámaras CCTV con IA, cercos eléctricos certificados y control de acceso. Instalación profesional en Chile.',
  alternates: { canonical: '/servicios' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: `${SITE_URL}/servicios`,
    siteName: 'GAMA SECURITY',
    title: 'Servicios de Seguridad Electrónica y Monitoreo 24/7 — GAMA SECURITY Chile',
    description:
      'Alarmas para casas y empresas, monitoreo 24/7, cámaras CCTV, cercos eléctricos y control de acceso en Chile.',
    images: [
      {
        url: '/og-servicio.png',
        width: 1200,
        height: 630,
        alt: 'Servicios de Seguridad Electrónica GAMA SECURITY',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Servicios de Seguridad Electrónica y Monitoreo 24/7 — GAMA SECURITY',
    description:
      'Alarmas, monitoreo 24/7, cámaras CCTV con IA y cercos eléctricos en Chile.',
    images: ['/og-servicio.png'],
  },
}

export default function ServiciosIndex() {
  const servicios = getAllServicios()
  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'ItemList',
        itemListElement: servicios.map((s, i) => ({
          '@type': 'ListItem', position: i + 1, name: s.title,
          url: `https://www.gamasecurity.cl/servicios/${s.slug}`,
        })),
      }} />
      <Breadcrumbs items={[{ label: 'Servicios', href: '/servicios' }]} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="apple-display-lg text-white mb-4">
          Servicios de seguridad electrónica y corrientes débiles
        </h1>
        <p className="text-slate-300 apple-lead max-w-3xl mb-10">
          Diseñamos e instalamos sistemas integrales de protección: alarmas, monitoreo
          24/7, videovigilancia, cercos eléctricos, control de acceso, citofonía,
          redes de datos y detección de incendio para hogares, comercios y empresas
          en la Región Metropolitana y Región de Valparaíso.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map(s => <ServiceCard key={s.slug} servicio={s} />)}
        </div>
        <Hashtags tags={['SeguridadElectrónica', 'SistemaDeAlarma', 'CámarasDeSeguridad', 'Monitoreo24_7', 'CorrientesDébiles', 'GamaSecurity']} />
      </section>
    </main>
  )
}

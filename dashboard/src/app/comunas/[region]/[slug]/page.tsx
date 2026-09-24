import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllComunas, getComuna, getServicio, REGION_LABELS } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Faq from '@/components/seo/Faq'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import ServiceCard from '@/components/seo/ServiceCard'

const SITE_URL = 'https://www.gamasecurity.cl'
const WA = 'https://wa.me/56991016912'
const VALID_REGIONS = ['rm', 'v-region']

export function generateStaticParams() {
  return getAllComunas().map(c => ({ region: c.region, slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ region: string; slug: string }> }): Promise<Metadata> {
  const { region, slug } = await params
  const c = getComuna(region, slug)
  if (!c) return {}
  const canonicalUrl = `${SITE_URL}/comunas/${region}/${slug}`
  return {
    title: c.title,
    description: c.description,
    keywords: c.keywords,
    alternates: { canonical: `/comunas/${region}/${slug}` },
    openGraph: {
      type: 'website',
      locale: 'es_CL',
      url: canonicalUrl,
      siteName: 'GAMA SECURITY',
      title: c.title,
      description: c.description,
      images: [
        {
          url: '/og-comuna.png',
          width: 1200,
          height: 630,
          alt: `Sistemas de Seguridad y Alarmas en ${c.name} — GAMA SECURITY`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: c.title,
      description: c.description,
      images: ['/og-comuna.png'],
    },
  }
}

export default async function ComunaPage({ params }: { params: Promise<{ region: string; slug: string }> }) {
  const { region, slug } = await params
  if (!VALID_REGIONS.includes(region)) notFound()
  const c = getComuna(region, slug)
  if (!c) notFound()

  const servicios = c.serviciosDestacados.map(getServicio).filter(Boolean)
  const regionLabel = REGION_LABELS[region as 'rm' | 'v-region']

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['SecurityService', 'LocalBusiness'],
    '@id': `${SITE_URL}/comunas/${region}/${slug}#localbusiness`,
    name: `GAMA SECURITY — Sistemas de Seguridad y Alarmas en ${c.name}`,
    url: `${SITE_URL}/comunas/${region}/${slug}`,
    telephone: '+56991016912',
    image: `${SITE_URL}/og-comuna.png`,
    priceRange: '$$',
    currenciesAccepted: 'CLP',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Valparaíso 351',
      addressLocality: 'Villa Alemana',
      addressRegion: 'Región de Valparaíso',
      postalCode: '6500000',
      addressCountry: 'CL',
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: c.name,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
        description: 'Atención Comercial y Asistencia en Terreno',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
        description: 'Central de Monitoreo 24/7 Redundante',
      },
    ],
  }

  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[
        { label: 'Comunas', href: '/comunas' },
        { label: regionLabel, href: '/comunas' },
        { label: c.name, href: `/comunas/${region}/${slug}` },
      ]} />
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <header className="space-y-4">
          <h1 className="apple-display-lg text-white">
            Sistemas de alarma y seguridad electrónica en {c.name}
          </h1>
          <p className="text-slate-300 apple-lead">{c.lead}</p>
          <div className="flex flex-wrap gap-3">
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-apple-primary text-sm py-2 px-5">Cotizar en {c.name} por WhatsApp</a>
            <a href="tel:+56991016912" className="btn-apple-secondary-dark text-sm py-2 px-5">Llamar +56 9 9101 6912</a>
          </div>
        </header>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Servicios disponibles en {c.name}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map(s => <ServiceCard key={s!.slug} servicio={s!} />)}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Zonas y sectores que cubrimos en {c.name}</h2>
          <ul className="flex flex-wrap gap-2">
            {c.sectors.map(sec => (
              <li key={sec} className="text-sm text-slate-300 bg-[#0f2240] border border-[#1e3a5f] rounded-full px-4 py-1.5">
                {sec}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">¿Por qué elegir GAMA en {c.name}?</h2>
          <p className="text-slate-300 leading-relaxed">{c.reasonExtra}</p>
        </section>

        <Hashtags tags={c.hashtags} />
        <Faq items={c.faq} />

        {/* ── Conversión Directa Comuna ── */}
        <div className="apple-card-dark p-8 text-center space-y-4 border border-[#2997ff]/40 bg-gradient-to-b from-[#0f2240] to-[#0a1628] rounded-2xl">
          <h3 className="text-2xl font-bold text-white">¿Vives o tienes tu empresa en {c.name}?</h3>
          <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
            Nuestros técnicos están en ruta en {c.name}. Agenda hoy una visita técnica y evaluación de seguridad sin costo ni compromiso.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-apple-primary text-sm py-2.5 px-6">
              Cotizar en {c.name} por WhatsApp →
            </a>
            <a href="/contacto" className="btn-apple-secondary-dark text-sm py-2.5 px-6">
              Solicitar Visita Técnica Gratuita
            </a>
          </div>
        </div>
      </article>
    </main>
  )
}

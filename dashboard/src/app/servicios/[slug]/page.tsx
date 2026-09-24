import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllServicios, getServicio, getComunasByRegion } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Faq from '@/components/seo/Faq'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import MarkdownBody from '@/components/seo/MarkdownBody'
import ComunaCard from '@/components/seo/ComunaCard'
import ServiceCard from '@/components/seo/ServiceCard'

const SITE_URL = 'https://www.gamasecurity.cl'
const WA = 'https://wa.me/56991016912'

export function generateStaticParams() {
  return getAllServicios().map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const s = getServicio(slug)
  if (!s) return {}
  const canonicalUrl = `${SITE_URL}/servicios/${s.slug}`
  return {
    title: s.title,
    description: s.description,
    keywords: s.keywords,
    alternates: { canonical: `/servicios/${s.slug}` },
    openGraph: {
      type: 'website',
      locale: 'es_CL',
      url: canonicalUrl,
      siteName: 'GAMA SECURITY',
      title: s.title,
      description: s.description,
      images: [
        {
          url: '/og-servicio.png',
          width: 1200,
          height: 630,
          alt: `${s.title} — GAMA SECURITY Chile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: s.title,
      description: s.description,
      images: ['/og-servicio.png'],
    },
  }
}

export default async function ServicioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = getServicio(slug)
  if (!s) notFound()

  const relacionados = s.relatedServicios.map(getServicio).filter(Boolean)
  const comunasTop = [...getComunasByRegion('rm'), ...getComunasByRegion('v-region')].slice(0, 6)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/servicios/${s.slug}#service`,
    name: s.title,
    description: s.description,
    serviceType: 'Seguridad Electrónica y Monitoreo 24/7',
    url: `${SITE_URL}/servicios/${s.slug}`,
    provider: {
      '@type': ['Organization', 'SecurityService'],
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
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Región Metropolitana' },
      { '@type': 'AdministrativeArea', name: 'Región de Valparaíso' },
    ],
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CLP',
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[
        { label: 'Servicios', href: '/servicios' },
        { label: s.title, href: `/servicios/${s.slug}` },
      ]} />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="space-y-4">
          <h1 className="apple-display-lg text-white">{s.h1}</h1>
          <div className="flex flex-wrap gap-3">
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-apple-primary text-sm py-2 px-5">Cotizar por WhatsApp Inmediato</a>
            <a href="tel:+56991016912" className="btn-apple-secondary-dark text-sm py-2 px-5">Llamar +56 9 9101 6912</a>
          </div>
        </header>
        <MarkdownBody markdown={s.body} />
        <Hashtags tags={s.hashtags} />
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Comunas donde instalamos este servicio</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comunasTop.map(c => <ComunaCard key={`${c.region}-${c.slug}`} comuna={c} />)}
          </div>
        </section>
        <Faq items={s.faq} />
        
        {/* ── Conversión Directa ── */}
        <div className="apple-card-dark p-8 text-center space-y-4 border border-[#2997ff]/40 bg-gradient-to-b from-[#0f2240] to-[#0a1628] rounded-2xl">
          <h3 className="text-2xl font-bold text-white">¿Necesitas cotizar este servicio en tu propiedad?</h3>
          <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
            Nuestros especialistas evalúan tu casa, empresa o comunidad sin costo y te entregan una propuesta técnica con precio cerrado en menos de 24 horas.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-apple-primary text-sm py-2.5 px-6">
              Cotizar por WhatsApp Ahora →
            </a>
            <a href="/contacto" className="btn-apple-secondary-dark text-sm py-2.5 px-6">
              Formulario de Cotización Online
            </a>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Servicios relacionados</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relacionados.map(r => <ServiceCard key={r!.slug} servicio={r!} />)}
          </div>
        </section>
      </article>
    </main>
  )
}

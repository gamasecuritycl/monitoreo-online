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
  return {
    title: c.title,
    description: c.description,
    keywords: c.keywords,
    alternates: { canonical: `/comunas/${region}/${slug}` },
    openGraph: { title: c.title, description: c.description, images: ['/og-comuna.png'] },
    twitter: { card: 'summary_large_image', title: c.title, description: c.description },
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
    '@type': 'LocalBusiness',
    name: 'GAMA SECURITY',
    url: SITE_URL,
    telephone: '+56991016912',
    image: `${SITE_URL}/og-comuna.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Valparaíso 351',
      addressLocality: 'Villa Alemana',
      addressRegion: regionLabel,
      addressCountry: 'CL',
    },
    areaServed: { '@type': 'City', name: c.name },
    openingHours: 'Mo-Fr 09:00-18:00',
    priceRange: '$$',
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
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-apple-primary text-sm py-2 px-5">Cotizar en {c.name}</a>
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
      </article>
    </main>
  )
}

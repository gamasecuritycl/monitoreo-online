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
  return {
    title: s.title,
    description: s.description,
    keywords: s.keywords,
    alternates: { canonical: `/servicios/${s.slug}` },
    openGraph: { title: s.title, description: s.description, images: ['/og-servicio.png'] },
    twitter: { card: 'summary_large_image', title: s.title, description: s.description },
  }
}

export default async function ServicioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = getServicio(slug)
  if (!s) notFound()

  const relacionados = s.relatedServicios.map(getServicio).filter(Boolean)
  const comunasTop = [...getComunasByRegion('rm'), ...getComunasByRegion('v-region')].slice(0, 5)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.title,
    description: s.description,
    provider: { '@type': 'Organization', name: 'GAMA SECURITY', url: SITE_URL },
    areaServed: [
      { '@type': 'State', name: 'Región Metropolitana' },
      { '@type': 'State', name: 'Región de Valparaíso' },
    ],
    url: `${SITE_URL}/servicios/${s.slug}`,
    telephone: '+56991016912',
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
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-apple-primary text-sm py-2 px-5">Cotizar por WhatsApp</a>
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

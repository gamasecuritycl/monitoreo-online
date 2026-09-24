import type { Metadata } from 'next'
import { getAllArticulos } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import ArticleCard from '@/components/seo/ArticleCard'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'

const SITE_URL = 'https://www.gamasecurity.cl'

export const metadata: Metadata = {
  title: 'Blog de Seguridad Electrónica: Precios, Guías y Comparativas 2026',
  description:
    'Guías expertas sobre alarmas para casas, cámaras CCTV, cercos eléctricos y monitoreo 24/7 en Chile. Precios reales, comparativas y consejos de seguridad.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: `${SITE_URL}/blog`,
    siteName: 'GAMA SECURITY',
    title: 'Blog de Seguridad Electrónica en Chile — GAMA SECURITY',
    description:
      'Guías sobre alarmas, cámaras, cercos eléctricos y monitoreo 24/7 en Chile: precios y consejos de expertos.',
    images: [
      {
        url: '/og-blog.png',
        width: 1200,
        height: 630,
        alt: 'Blog de Seguridad Electrónica GAMA SECURITY',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog de Seguridad Electrónica — GAMA SECURITY Chile',
    description:
      'Guías, comparativas y precios de alarmas y monitoreo 24/7 en Chile.',
    images: ['/og-blog.png'],
  },
}

export default function BlogIndex() {
  const articulos = getAllArticulos()
  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Blog',
        name: 'Blog GAMA SECURITY',
        blogPost: articulos.map(a => ({
          '@type': 'BlogPosting', headline: a.title,
          url: `https://www.gamasecurity.cl/blog/${a.slug}`, datePublished: a.date,
        })),
      }} />
      <Breadcrumbs items={[{ label: 'Blog', href: '/blog' }]} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="apple-display-lg text-white mb-4">Blog de seguridad electrónica</h1>
        <p className="text-slate-300 apple-lead max-w-3xl mb-10">
          Guías prácticas, comparativas y precios de sistemas de alarma, cámaras de
          seguridad y monitoreo 24/7 para hogares y empresas en Chile.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articulos.map(a => <ArticleCard key={a.slug} articulo={a} />)}
        </div>
        <Hashtags tags={['BlogSeguridad', 'SistemaDeAlarma', 'CámarasDeSeguridad', 'Monitoreo24_7', 'GamaSecurity']} />
      </section>
    </main>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllArticulos, getArticulo, getServicio } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Faq from '@/components/seo/Faq'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import MarkdownBody from '@/components/seo/MarkdownBody'
import ServiceCard from '@/components/seo/ServiceCard'

const SITE_URL = 'https://www.gamasecurity.cl'

export function generateStaticParams() {
  return getAllArticulos().map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const a = getArticulo(slug)
  if (!a) return {}
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: {
      type: 'article', title: a.title, description: a.description,
      publishedTime: a.date, images: ['/og-blog.png'],
    },
    twitter: { card: 'summary_large_image', title: a.title, description: a.description },
  }
}

export default async function ArticuloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const a = getArticulo(slug)
  if (!a) notFound()

  const servicios = a.relatedServicios.map(getServicio).filter(Boolean)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    author: { '@type': 'Organization', name: 'GAMA SECURITY' },
    publisher: { '@type': 'Organization', name: 'GAMA SECURITY', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${a.slug}`,
    image: `${SITE_URL}/og-blog.png`,
  }

  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[
        { label: 'Blog', href: '/blog' },
        { label: a.title, href: `/blog/${a.slug}` },
      ]} />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <time dateTime={a.date}>{a.date}</time>
            <span>· {a.readingMinutes} min de lectura</span>
          </div>
          <h1 className="apple-display-lg text-white">{a.h1}</h1>
        </header>
        <MarkdownBody markdown={a.body} />
        <Hashtags tags={a.hashtags} />
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Servicios relacionados</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map(s => <ServiceCard key={s!.slug} servicio={s!} />)}
          </div>
        </section>
        <Faq items={a.faq} />
      </article>
    </main>
  )
}

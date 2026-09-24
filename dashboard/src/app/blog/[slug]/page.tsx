import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllArticulos, getArticulo, getServicio } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
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
  const canonicalUrl = `${SITE_URL}/blog/${a.slug}`
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: {
      type: 'article',
      locale: 'es_CL',
      url: canonicalUrl,
      siteName: 'GAMA SECURITY',
      title: a.title,
      description: a.description,
      publishedTime: a.date,
      images: [
        {
          url: '/og-blog.png',
          width: 1200,
          height: 630,
          alt: `${a.title} — Blog GAMA SECURITY`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: a.title,
      description: a.description,
      images: ['/og-blog.png'],
    },
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
    '@id': `${SITE_URL}/blog/${a.slug}#article`,
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    dateModified: a.date,
    author: {
      '@type': 'Organization',
      name: 'GAMA SECURITY',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'GAMA SECURITY',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo-gama.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${a.slug}`,
    },
    image: `${SITE_URL}/og-blog.png`,
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: a.faq.map(i => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
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

        {/* ── Conversión Asesoría Blog ── */}
        <div className="apple-card-dark p-8 text-center space-y-4 border border-[#2997ff]/40 bg-gradient-to-b from-[#0f2240] to-[#0a1628] rounded-2xl">
          <h3 className="text-2xl font-bold text-white">¿Quieres asesoría técnica personalizada para tu proyecto?</h3>
          <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
            Nuestros ingenieros en seguridad electrónica resuelven tus dudas y dimensionan la solución exacta de alarmas, monitoreo o cámaras para tu hogar o empresa.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <a href="https://wa.me/56991016912" target="_blank" rel="noopener noreferrer" className="btn-apple-primary text-sm py-2.5 px-6">
              Hablar con un Especialista por WhatsApp →
            </a>
            <a href="/contacto" className="btn-apple-secondary-dark text-sm py-2.5 px-6">
              Solicitar Cotización por Escrito
            </a>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Servicios relacionados</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map(s => <ServiceCard key={s!.slug} servicio={s!} />)}
          </div>
        </section>
        <JsonLd data={faqJsonLd} />
      </article>
    </main>
  )
}

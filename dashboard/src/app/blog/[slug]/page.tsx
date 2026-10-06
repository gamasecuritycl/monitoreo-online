import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllArticulos, getArticulo, getServicio } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import MarkdownBody from '@/components/seo/MarkdownBody'
import ServiceCard from '@/components/seo/ServiceCard'
import ArticleCard from '@/components/seo/ArticleCard'
import Faq from '@/components/seo/Faq'

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

  // Extraer encabezados H2 para el índice estructurado
  const headings = a.body
    .split('\n')
    .filter(line => line.startsWith('## '))
    .map(line => line.replace(/^##\s+/, '').trim())
    .filter(h => h.length > 0 && !h.toLowerCase().includes('conclusión') && !h.toLowerCase().includes('preguntas frecuentes'))

  // Artículos relacionados para la navegación cruzada
  const articulosRelacionados = getAllArticulos()
    .filter(other => other.slug !== a.slug)
    .slice(0, 3)

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

  return (
    <main className="min-h-screen bg-[#050d1a] text-slate-100">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[
        { label: 'Blog', href: '/blog' },
        { label: a.title, href: `/blog/${a.slug}` },
      ]} />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Encabezado estructurado con badges */}
        <header className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-full font-bold">
              🛡️ Análisis Gama Seguridad
            </span>
            <time dateTime={a.date} className="text-slate-400">📅 {a.date}</time>
            <span className="text-slate-400">⏱️ {a.readingMinutes} min de lectura</span>
            <span className="text-emerald-400 font-sans font-semibold">✓ Verificado 2026</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            {a.h1}
          </h1>

          {/* Caja de Resumen Ejecutivo Destacado */}
          <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border border-sky-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-2">
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <span>📌</span> Resumen Ejecutivo del Artículo
            </div>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
              {a.description}
            </p>
          </div>

          {/* Índice estructurado de lectura rápida */}
          {headings.length > 0 && (
            <nav className="bg-slate-900/50 border border-slate-800/90 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>📋</span> Puntos Clave Tratados en Esta Guía
              </div>
              <ul className="grid sm:grid-cols-2 gap-2.5 text-xs sm:text-sm font-medium text-slate-300">
                {headings.map((h, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-950 border border-sky-500/30 text-sky-400 font-mono text-[11px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="line-clamp-1">{h}</span>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </header>

        {/* Cuerpo estructurado en Markdown */}
        <div className="bg-slate-950/40 p-2 sm:p-6 rounded-3xl border border-slate-800/80">
          <MarkdownBody markdown={a.body} />
        </div>

        {/* Hashtags */}
        <Hashtags tags={a.hashtags} />

        {/* Banner Cotizador Online Destacado */}
        <div className="bg-gradient-to-r from-[#000080]/90 to-blue-950 border border-blue-400/50 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <span className="text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow">
            💰 Cotizador en Línea 2026
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white">¿Cuánto te ahorrarías protegiendo tu propiedad con Gama?</h3>
          <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Calcula tu cotización en 30 segundos: si ya tienes alarma (ADT u otra) puedes migrar pagando <strong>$0 en equipos</strong> y solo <strong>0,9 UF + IVA mensual</strong>.
          </p>
          <div className="pt-2">
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3.5 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-base cursor-pointer"
            >
              <span>📊</span> Calcular Mi Cotización en Línea Ahora →
            </Link>
          </div>
        </div>

        {/* Preguntas frecuentes visibles en pantalla */}
        {a.faq && a.faq.length > 0 && (
          <div className="pt-6 border-t border-slate-800">
            <Faq items={a.faq} heading="Preguntas Frecuentes Respondidas" />
          </div>
        )}

        {/* Conversión Asesoría Blog */}
        <div className="p-8 text-center space-y-4 border border-[#2997ff]/40 bg-gradient-to-b from-[#0f2240] to-[#0a1628] rounded-2xl shadow-xl">
          <h3 className="text-2xl font-bold text-white">¿Quieres coordinar una visita técnica a terreno?</h3>
          <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
            Nuestros técnicos evalúan tu propiedad en terreno, revisan la compatibilidad de tu alarma existente y te entregan un presupuesto formal cerrado.
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

        {/* Artículos Relacionados */}
        {articulosRelacionados.length > 0 && (
          <section className="pt-8 border-t border-slate-800 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Otras guías recomendadas</h2>
              <p className="text-slate-400 text-sm">Continúa informándote sobre seguridad y ahorro en Chile.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {articulosRelacionados.map(rel => (
                <ArticleCard key={rel.slug} articulo={rel} />
              ))}
            </div>
          </section>
        )}

        {/* Servicios relacionados */}
        {servicios.length > 0 && (
          <section className="pt-6 border-t border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-6">Servicios de Seguridad Relacionados</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicios.map(s => <ServiceCard key={s!.slug} servicio={s!} />)}
            </div>
          </section>
        )}

      </article>
    </main>
  )
}

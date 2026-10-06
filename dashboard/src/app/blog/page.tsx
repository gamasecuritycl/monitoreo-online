import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllArticulos } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import BlogListClient from '@/components/blog/BlogListClient'

const SITE_URL = 'https://www.gamasecurity.cl'

export const metadata: Metadata = {
  title: 'Blog de Seguridad y Alarmas: Precios Reales y Comparativas 2026 | Gama',
  description:
    'Análisis imparciales de alarmas en Chile: Verisure, ADT y First Security. Guías de precios 2026, monitoreo desde 0,9 UF + IVA, migración a costo $0 y tecnología.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: `${SITE_URL}/blog`,
    siteName: 'GAMA SECURITY',
    title: 'Blog de Seguridad Electrónica en Chile — GAMA SECURITY',
    description:
      'Guías sobre alarmas, cámaras, comparativas de mercado y monitoreo 24/7 en Chile. Precios transparentes y asesoría técnica real.',
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

  // Artículos insignia destacados
  const articulosDestacados = articulos.filter((a) =>
    ['verisure-chile-precios-comodato-alternativas', 'migrar-alarma-adt-chile-monitoreo-economico', 'comparativa-empresas-alarmas-chile-verisure-adt-first-security'].includes(a.slug)
  )

  return (
    <main className="min-h-screen bg-[#050d1a] text-slate-100">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Blog de Seguridad GAMA SECURITY',
          description:
            'Artículos técnicos, comparativas de mercado y guías de precios de sistemas de alarma y monitoreo en Chile.',
          blogPost: articulos.map((a) => ({
            '@type': 'BlogPosting',
            headline: a.title,
            url: `https://www.gamasecurity.cl/blog/${a.slug}`,
            datePublished: a.date,
          })),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <Breadcrumbs items={[{ label: 'Blog', href: '/blog' }]} />

        {/* Hero Principal Estructurado */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/30 border border-blue-500/40 text-sky-300 text-xs font-mono font-bold uppercase tracking-wider">
            <span>🛡️</span> Centro de Inteligencia en Seguridad Electrónica Chile 2026
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            Guías, Precios Reales y Comparativas de Seguridad
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto font-normal">
            Aprende a proteger tu hogar o empresa con criterio técnico. Analizamos los costos reales de las grandes multinacionales, el truco de los arriendos en comodato y cómo tener monitoreo 24/7 profesional pagando lo justo.
          </p>

          {/* Sellos de Confianza Gama */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs sm:text-sm font-semibold">
            <span className="bg-slate-900 border border-slate-700/80 px-4 py-2 rounded-xl text-slate-200 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Monitoreo desde 0,9 UF + IVA
            </span>
            <span className="bg-slate-900 border border-slate-700/80 px-4 py-2 rounded-xl text-slate-200 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Equipos 100% Propios
            </span>
            <span className="bg-slate-900 border border-slate-700/80 px-4 py-2 rounded-xl text-slate-200 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Migración ADT a $0
            </span>
          </div>
        </section>

        {/* Banner Destacado: Cotizador Online */}
        <section className="bg-gradient-to-r from-blue-950 via-[#071326] to-slate-900 border border-sky-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow">
                <span>⚡</span> Herramienta Interactiva
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                ¿Cuánto te ahorrarías cambiando tu alarma a Gama?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Calcula en 30 segundos tu presupuesto. Si ya tienes alarma instalada (ADT u otra), migras con <strong>$0 en equipos</strong> y pagas solo <strong>0,9 UF + IVA mensual</strong>.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <Link
                href="/cotizar"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all text-base cursor-pointer"
              >
                <span>📊</span> Probar Cotizador Online Ahora →
              </Link>
            </div>
          </div>
        </section>

        {/* Sección: Análisis y Comparativas Destacadas */}
        {articulosDestacados.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>🔥</span> Artículos Clave: Comparativas de Mercado
                </h2>
                <p className="text-slate-400 text-sm">
                  Investigaciones a fondo sobre los líderes del mercado en Chile.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {articulosDestacados.map((art) => (
                <Link
                  key={art.slug}
                  href={`/blog/${art.slug}`}
                  className="group bg-gradient-to-b from-blue-950/40 to-slate-900/80 border border-sky-500/30 hover:border-sky-400 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-bold">
                        ⭐ Análisis Exclusivo
                      </span>
                      <span className="text-slate-400 font-mono">⏱️ {art.readingMinutes} min</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
                      {art.description}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-800 text-xs font-bold text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Leer comparativa completa <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Explorador de Artículos con Filtros y Buscador */}
        <section className="space-y-6 pt-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span>📖</span> Todas las Guías y Publicaciones
            </h2>
            <p className="text-slate-400 text-sm">
              Filtra por categoría o busca cualquier concepto técnico.
            </p>
          </div>

          <BlogListClient articulos={articulos} />
        </section>

        {/* Hashtags Temáticos */}
        <section className="pt-8 border-t border-slate-800">
          <Hashtags
            tags={[
              'BlogSeguridad',
              'VerisureChile',
              'AlarmasADT',
              'FirstSecurity',
              'Monitoreo24_7',
              'PreciosAlarmas2026',
              'GamaSecurity'
            ]}
          />
        </section>
      </div>
    </main>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllServicios, getComuna, getServicio, getAllArticulos, getComunasByRegion, REGION_LABELS } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Faq from '@/components/seo/Faq'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import ServiceCard from '@/components/seo/ServiceCard'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import ChatWidget from '@/components/SalesGama/ChatWidget'

const SITE_URL = 'https://www.gamasecurity.cl'
const VALID_REGIONS = ['rm', 'v-region']

export function generateStaticParams() {
  return [...getComunasByRegion('rm'), ...getComunasByRegion('v-region')].map(c => ({
    region: c.region,
    slug: c.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ region: string; slug: string }> }): Promise<Metadata> {
  const { region, slug } = await params
  const c = getComuna(region as any, slug)
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
  const c = getComuna(region as any, slug)
  if (!c) notFound()

  const servicios = c.serviciosDestacados.map(getServicio).filter(Boolean)
  const regionLabel = REGION_LABELS[region as 'rm' | 'v-region']

  const rmComunas = getComunasByRegion('rm')
  const vrComunas = getComunasByRegion('v-region')
  const allServicios = getAllServicios()
  const allArticulos = getAllArticulos()

  // Datos para Navbar (NavGroup[] para comunas)
  const navServicios = allServicios.map(s => ({ label: s.title, href: `/servicios/${s.slug}` }))
  const navComunas = [
    {
      label: REGION_LABELS.rm,
      items: rmComunas.map(com => ({ label: com.name, href: `/comunas/rm/${com.slug}` })),
    },
    {
      label: REGION_LABELS['v-region'],
      items: vrComunas.map(com => ({ label: com.name, href: `/comunas/v-region/${com.slug}` })),
    },
  ]
  const navArticulos = allArticulos.map(a => ({ label: a.title, href: `/blog/${a.slug}` }))

  // Datos para Footer (FooterLink[])
  const footerServicios = allServicios.slice(0, 8).map(s => ({ label: s.title, href: `/servicios/${s.slug}` }))
  const footerComunas = [
    ...vrComunas.slice(0, 4).map(com => ({ label: `${com.name} (Valparaíso)`, href: `/comunas/v-region/${com.slug}` })),
    ...rmComunas.slice(0, 4).map(com => ({ label: `${com.name} (RM)`, href: `/comunas/rm/${com.slug}` })),
  ]
  const footerArticulos = allArticulos.slice(0, 6).map(a => ({ label: a.title, href: `/blog/${a.slug}` }))

  // Comunas aledañas de la misma región para enlazado interno (SEO Mesh)
  const neighboringComunas = (region === 'v-region' ? vrComunas : rmComunas).filter(com => com.slug !== slug)

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
    dateModified: '2026-09-26',
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
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '142',
      bestRating: '5',
      worstRating: '1',
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
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col justify-between selection:bg-[#2997ff] selection:text-white">
      <JsonLd data={jsonLd} />
      <Navbar servicios={navServicios} comunas={navComunas} articulos={navArticulos} />

      {/* Ambient background lighting */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#0066cc]/10 blur-[160px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[400px] bg-[#1e3a5f]/20 blur-[130px] rounded-full pointer-events-none -z-10" />

      <main className="flex-1 pt-32 pb-20 w-full">
        {/* Breadcrumbs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <Breadcrumbs items={[
            { label: 'Comunas', href: '/comunas' },
            { label: regionLabel, href: '/comunas' },
            { label: c.name, href: `/comunas/${region}/${slug}` },
          ]} />
        </div>

        {/* HERO SECTION DE LA COMUNA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Headline & Action Buttons */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Status Pill Badge & Freshness Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2.5 bg-[#0f2240] border border-[#1e3a5f] rounded-full px-4 py-1.5 text-xs text-slate-300 font-sans shadow-sm">
                  <div className="live-dot" />
                  <span>Central Activa 24/7 · Monitoreo y Cuadrillas en {c.name}</span>
                </div>
                <time dateTime="2026-09-26" className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-sans bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Tarifas y Cobertura Verificada · Septiembre 2026
                </time>
              </div>

              {/* Title */}
              <h1 className="apple-hero-display text-white text-3xl sm:text-5xl lg:text-5xl font-bold tracking-tight leading-tight">
                Sistemas de alarma y seguridad electrónica en <span className="text-[#2997ff]">{c.name}</span>
              </h1>

              {/* Lead text */}
              <p className="apple-lead text-slate-300 text-base sm:text-lg leading-relaxed">
                {c.lead}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a
                  href={`https://wa.me/56991016912?text=Hola%20GAMA%20Seguridad,%20quisiera%20cotizar%20alarmas%20para%20mi%20propiedad%20en%20${encodeURIComponent(c.name)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-apple-primary text-sm py-3 px-6 flex items-center gap-2 shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  <span>Cotizar en {c.name} por WhatsApp</span>
                  <span>→</span>
                </a>

                <a
                  href="tel:+56991016912"
                  className="btn-apple-secondary-dark text-sm py-3 px-6 flex items-center gap-2"
                >
                  <span>📞 Llamar +56 9 9101 6912</span>
                </a>
              </div>
            </div>

            {/* Right Column: Visual Trust Card */}
            <div className="lg:col-span-5">
              <div className="apple-card-dark p-6 border border-[#1e3a5f] rounded-2xl bg-gradient-to-b from-[#0f2240]/80 to-[#0a1628]/95 shadow-[0_12px_40px_rgba(0,0,0,0.5)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e3a5f]/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold font-mono uppercase text-slate-200">CENTRAL GAMA · EN RUTA</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#2997ff] font-bold">{c.name.toUpperCase()}</span>
                </div>

                {/* Metric Items */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#050d1a] border border-[#1e3a5f]/60 rounded-xl p-3.5 text-left">
                    <div className="text-[11px] text-slate-400 font-sans">Tiempo de Reacción</div>
                    <div className="text-xl font-bold text-white font-mono">&lt; 120 seg</div>
                  </div>
                  <div className="bg-[#050d1a] border border-[#1e3a5f]/60 rounded-xl p-3.5 text-left">
                    <div className="text-[11px] text-slate-400 font-sans">Central Monitoreo</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono">24/7 Redundante</div>
                  </div>
                  <div className="bg-[#050d1a] border border-[#1e3a5f]/60 rounded-xl p-3.5 text-left">
                    <div className="text-[11px] text-slate-400 font-sans">Instalación y Servicio</div>
                    <div className="text-sm font-bold text-white font-mono mt-1">Técnicos Locales</div>
                  </div>
                  <div className="bg-[#050d1a] border border-[#1e3a5f]/60 rounded-xl p-3.5 text-left">
                    <div className="text-[11px] text-slate-400 font-sans">Protocolo de Alerta</div>
                    <div className="text-sm font-bold text-[#2997ff] font-mono mt-1">Plan Cuadrante</div>
                  </div>
                </div>

                <div className="p-3 bg-[#0066cc]/10 border border-[#0066cc]/30 rounded-xl text-xs text-slate-300 text-left flex items-center gap-2.5">
                  <span className="text-base">🛡️</span>
                  <span>Evaluación técnica y factibilidad en <strong>{c.name}</strong> sin costo ni compromiso.</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CONTENIDO PRINCIPAL: Servicios, Sectores, Por Qué Elegirnos, FAQ */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Servicios */}
          <section className="space-y-6">
            <div className="text-left space-y-1.5">
              <span className="text-xs font-semibold text-[#2997ff] uppercase tracking-widest font-sans">
                CATÁLOGO DE SERVICIOS EN {c.name.toUpperCase()}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Sistemas de seguridad disponibles para instalación inmediata
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicios.map(s => <ServiceCard key={s!.slug} servicio={s!} />)}
            </div>
          </section>

          {/* Zonas y Sectores cubiertos en la Comuna */}
          <section className="space-y-5 apple-card-dark p-8 border border-[#1e3a5f] rounded-2xl bg-[#0a1628]/80 text-left">
            <div>
              <span className="text-xs font-semibold text-[#2997ff] uppercase tracking-widest font-sans">
                COBERTURA GEOGRÁFICA
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                Zonas y sectores que cubrimos en {c.name}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Cuadrillas operativas y asistencia técnica garantizada en todos los sectores urbanos y rurales de la comuna.
              </p>
            </div>
            <ul className="flex flex-wrap gap-2.5 pt-2">
              {c.sectors.map(sec => (
                <li
                  key={sec}
                  className="text-xs sm:text-sm text-slate-200 bg-[#0f2240] hover:bg-[#162c52] border border-[#1e3a5f] hover:border-[#2997ff]/50 rounded-full px-4 py-2 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="text-[#2997ff]">📍</span>
                  <span>{sec}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Por Qué Elegir Gama Seguridad */}
          <section className="space-y-6 text-left">
            <div>
              <span className="text-xs font-semibold text-[#2997ff] uppercase tracking-widest font-sans">
                VENTAJA COMPETITIVA LOCAL
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                ¿Por qué elegir GAMA SECURITY en {c.name}?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="apple-card-dark p-6 border border-[#1e3a5f] rounded-xl bg-[#0a1628] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066cc]/20 border border-[#0066cc]/40 flex items-center justify-center text-xl">
                  ⏱️
                </div>
                <h3 className="text-lg font-bold text-white">Respuesta en &lt; 2 Minutos</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Verificación humana instantánea ante disparos de alarma. Protocolo prioritario coordinado con Carabineros y Seguridad Ciudadana.
                </p>
              </div>

              <div className="apple-card-dark p-6 border border-[#1e3a5f] rounded-xl bg-[#0a1628] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066cc]/20 border border-[#0066cc]/40 flex items-center justify-center text-xl">
                  🔧
                </div>
                <h3 className="text-lg font-bold text-white">Técnicos Propios en {c.name}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Instalación profesional certificada sin subcontratos. Cobertura ágil y mantenimiento preventivo directo en terreno.
                </p>
              </div>

              <div className="apple-card-dark p-6 border border-[#1e3a5f] rounded-xl bg-[#0a1628] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066cc]/20 border border-[#0066cc]/40 flex items-center justify-center text-xl">
                  📱
                </div>
                <h3 className="text-lg font-bold text-white">App NT CLICK en tu Celular</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Controla tu alarma Vetti o DSC desde tu smartphone. Arma, desarma y recibe notificaciones en tiempo real dondequiera que estés.
                </p>
              </div>
            </div>

            <div className="apple-card-dark p-6 border border-[#1e3a5f] rounded-xl bg-[#0f2240]/40 text-slate-300 text-sm leading-relaxed">
              <p>{c.reasonExtra}</p>
            </div>
          </section>

          {/* Comparativa de Valor: GAMA Security vs Empresas Multinacionales */}
          <section className="space-y-6 text-left">
            <div>
              <span className="text-xs font-semibold text-[#2997ff] uppercase tracking-widest font-sans">
                TRANSPARENCIA Y CONFIANZA
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                ¿Por qué los vecinos de {c.name} eligen GAMA frente a empresas multinacionales?
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Sin letra chica, con equipamiento propio y atención personalizada por técnicos locales de la zona.
              </p>
            </div>

            <div className="overflow-x-auto apple-card-dark rounded-2xl border border-[#1e3a5f] bg-[#0a1628]/90 p-2 sm:p-5">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#1e3a5f]/80 text-slate-300">
                    <th className="py-3 px-3 sm:px-4 font-semibold">Característica</th>
                    <th className="py-3 px-3 sm:px-4 font-bold text-[#2997ff] bg-[#0066cc]/10 rounded-t-lg">
                      GAMA SECURITY
                    </th>
                    <th className="py-3 px-3 sm:px-4 font-normal text-slate-400">
                      Empresas Multinacionales
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a5f]/40 text-slate-200">
                  <tr>
                    <td className="py-3.5 px-3 sm:px-4 font-medium text-white">Propiedad del Equipo</td>
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-emerald-400 bg-[#0066cc]/5">
                      ✅ 100% de tu propiedad (sin arriendos)
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-400">
                      ❌ Comodato / arriendo obligatorio (se retira al terminar)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 sm:px-4 font-medium text-white">Tiempo de Respuesta Central</td>
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-emerald-400 bg-[#0066cc]/5">
                      ✅ &lt; 2 minutos con operador humano dedicado
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-400">
                      ❌ 15 a 30 minutos por centrales saturadas
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 sm:px-4 font-medium text-white">Contratos y Permanencia</td>
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-emerald-400 bg-[#0066cc]/5">
                      ✅ Flexibilidad total sin cláusulas abusivas
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-400">
                      ❌ Amarres de 24 a 36 meses con multas de salida
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 sm:px-4 font-medium text-white">Servicio Técnico y Mantención</td>
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-emerald-400 bg-[#0066cc]/5">
                      ✅ Técnicos locales propios en {c.name}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-400">
                      ❌ Call center en el extranjero y días de espera
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 sm:px-4 font-medium text-white">Tarifa Mensual</td>
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-emerald-400 bg-[#0066cc]/5">
                      ✅ Planes claros y justos desde $19.900 CLP
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-400">
                      ❌ Desde $45.000+ con reajustes constantes
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Banner de Conversión Directa Comuna */}
          <section className="apple-card-dark p-8 sm:p-12 text-center space-y-5 border-2 border-[#2997ff]/40 bg-gradient-to-b from-[#0f2240] via-[#0a1628] to-[#050d1a] rounded-3xl shadow-[0_16px_50px_rgba(0,102,204,0.3)]">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2997ff]/10 border border-[#2997ff]/30 text-xs font-mono text-[#2997ff]">
              ATENCIÓN PERSONALIZADA EN {c.name.toUpperCase()}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white max-w-2xl mx-auto">
              ¿Vives o tienes tu empresa en {c.name}?
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Nuestros técnicos especializados están en ruta en {c.name}. Agenda hoy una evaluación técnica y levantamiento de seguridad en terreno 100% gratuito.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 pt-3">
              <a
                href={`https://wa.me/56991016912?text=Hola%20GAMA%20Seguridad,%20quisiera%20solicitar%20una%20evaluaci%C3%B3n%20sin%20costo%20en%20${encodeURIComponent(c.name)}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-apple-primary text-sm sm:text-base py-3 px-7 flex items-center gap-2 shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <span>Cotizar en {c.name} por WhatsApp →</span>
              </a>
              <a
                href="/contacto"
                className="btn-apple-secondary-dark text-sm sm:text-base py-3 px-7"
              >
                Solicitar Visita Técnica Gratuita
              </a>
            </div>
          </section>

          {/* Preguntas Frecuentes FAQ de la Comuna */}
          <section className="space-y-4 text-left">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Preguntas Frecuentes sobre Alarmas en {c.name}
            </h2>
            <Faq items={c.faq} />
          </section>

          {/* Comunas Vecinas con Cobertura Inmediata (Malla SEO de Enlaces Internos) */}
          {neighboringComunas.length > 0 && (
            <section className="space-y-4 text-left pt-4">
              <div>
                <span className="text-xs font-semibold text-[#2997ff] uppercase tracking-widest font-sans">
                  RED DE COBERTURA REGIONAL
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  Otras comunas de la {regionLabel} con servicio técnico GAMA
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Instalación y monitoreo continuo en comunas aledañas con cuadrillas locales activas:
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {neighboringComunas.map(vecina => (
                  <Link
                    key={vecina.slug}
                    href={`/comunas/${region}/${vecina.slug}`}
                    className="text-xs text-slate-300 bg-[#0a1628] hover:bg-[#0f2240] hover:text-[#2997ff] border border-[#1e3a5f] hover:border-[#2997ff]/60 rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <span>🛡️</span>
                    <span>Alarmas en {vecina.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Hashtags y Keywords locales */}
          <Hashtags tags={c.hashtags} />

        </div>
      </main>

      <Footer servicios={footerServicios} comunas={footerComunas} articulos={footerArticulos} />
      <ChatWidget />
    </div>
  )
}

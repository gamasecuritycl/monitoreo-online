import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import HeroCarousel from '@/components/landing/HeroCarousel'
import PromoPopupModal from '@/components/landing/PromoPopupModal'
import Servicios from '@/components/landing/Servicios'
import VettiShowcase from '@/components/landing/VettiShowcase'
import QuienesSomos from '@/components/landing/QuienesSomos'
import Tecnologia from '@/components/landing/Tecnologia'
import Testimonios from '@/components/landing/Testimonios'
import CTAEmergencia from '@/components/landing/CTAEmergencia'
import LandingInteractiveLayer from '@/components/landing/LandingInteractiveLayer'
import ChatWidget from '@/components/SalesGama/ChatWidget'
import ServiceCard from '@/components/seo/ServiceCard'
import ComunaCard from '@/components/seo/ComunaCard'
import ArticleCard from '@/components/seo/ArticleCard'
import Faq from '@/components/seo/Faq'
import { getAllServicios, getComunasByRegion, getAllArticulos, REGION_LABELS } from '@/lib/content'
import { supabase } from '@/lib/supabase'
import { DEFAULT_LANDING_MARKETING_CONFIG, LandingMarketingConfig } from '@/lib/landing-marketing/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SITE_URL = 'https://www.gamasecurity.cl'


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Alarmas para Casa en Chile: Precios y Monitoreo 24/7 | GAMA SECURITY',
  description:
    'Empresa líder en alarmas para casa y empresas en Chile con monitoreo 24/7 desde 0,9 UF + IVA. Equipos 100% propios sin comodato. Reprogramamos alarmas ADT y DSC a costo $0. Cotiza online.',
  keywords: [
    'alarmas para casa chile',
    'alarmas para casa',
    'alarmas para hogar',
    'sistema de alarmas chile',
    'precios de alarmas para casa',
    'cuanto cuesta una alarma en chile',
    'monitoreo de alarmas 24/7',
    'empresas de alarmas en chile',
    'ranking empresas de alarmas chile',
    'alarmas residenciales chile',
    'instalacion de alarmas chile',
    'alarmas sin comodato',
    'alarmas sin arriendo',
    'cotizador de alarmas online chile',
    'alarmas para parcelas chile',
    'alarmas para condominios',
    'seguridad electronica chile',
    'empresas de seguridad electronica santiago',
    'alternativa a verisure chile',
    'verisure chile precios',
    'verisure opiniones chile',
    'cuanto cobra verisure chile',
    'dar de baja verisure chile',
    'cambiar de verisure',
    'alternativa adt chile',
    'adt chile precios',
    'migrar alarma adt chile',
    'liberar alarma adt dsc',
    'prosegur alarmas chile precios',
    'first security chile alarmas',
    'federal smart chile',
    'feelsecure chile',
    'marcas de alarmas chile',
    'alarmas dsc chile',
    'alarma dsc powerseries pc1832',
    'alarma dsc neo chile',
    'alarma honeywell vista chile',
    'honeywell vista 48la',
    'alarmas paradox chile',
    'paradox magellan mg5050',
    'hikvision ax pro chile',
    'dahua airshield chile',
    'alarmas vetti smart',
    'cercos electricos certificados sec',
    'tramite te1 sec cerco electrico',
    'camaras de seguridad cctv chile',
    'camaras ip 4k con inteligencia artificial',
    'control de acceso biometrico zkteco',
    'GAMA Security',
    'Gama Seguridad SpA',
    'gamasecurity.cl',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: SITE_URL,
    siteName: 'GAMA SECURITY',
    title: 'Alarmas para Casa en Chile: Precios y Monitoreo 24/7 | GAMA SECURITY',
    description:
      'Alarmas para casas y empresas con monitoreo 24/7 desde 0,9 UF + IVA. Equipos 100% propios sin comodato ni arriendos infinitos. Alternativa transparente a Verisure y ADT.',
    images: [
      {
        url: '/og-gama.png',
        width: 1200,
        height: 630,
        alt: 'Central de Monitoreo GAMA SECURITY Chile 24/7',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alarmas para Casa en Chile: Monitoreo 24/7 y Precios Reales',
    description:
      'Monitoreo 24/7 desde 0,9 UF + IVA. Equipos propios sin comodato en Chile. Cotiza online.',
    images: ['/og-gama.png'],
  },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'GAMA SECURITY',
      alternateName: ['Gama Seguridad', 'GAMA Security Chile'],
      inLanguage: 'es-CL',
      description: 'Alarmas para casa, empresas y monitoreo 24/7 en Chile con equipos propios y sin comodato.',
      publisher: { '@id': `${SITE_URL}/#organizacion` },
    },
    {
      '@type': ['Organization', 'SecurityService'],
      '@id': `${SITE_URL}/#organizacion`,
      name: 'GAMA SECURITY',
      legalName: 'Gama Seguridad SpA',
      alternateName: 'Gama Seguridad',
      url: SITE_URL,
      logo: `${SITE_URL}/logo-gama.png`,
      image: `${SITE_URL}/og-gama.png`,
      description:
        'Empresa chilena líder en alarmas para casa, monitoreo electrónico 24/7 desde 0,9 UF, alarmas DSC, Honeywell, Paradox, Vetti, cámaras 4K con IA y cercos eléctricos SEC.',
      telephone: '+56991016912',
      email: 'contacto@gamasecurity.cl',
      taxID: '78.297.009-7',
      priceRange: '$$',
      currenciesAccepted: 'CLP, CLF',
      paymentAccepted: 'Transferencia bancaria, Tarjetas de crédito, RedCompra, Débito automático',
      knowsAbout: [
        'Alarmas para casa en Chile',
        'Alternativas a Verisure Chile',
        'Migración de Alarmas ADT Chile',
        'Prosegur Alarmas Chile',
        'First Security Chile',
        'Federal Smart Chile',
        'Marcas de alarmas en Chile',
        'Alarmas DSC PowerSeries y Neo',
        'Honeywell Vista 48LA',
        'Paradox Magellan y Spectra',
        'Hikvision CCTV y AX PRO',
        'Dahua AirShield y WizSense',
        'Cercos Eléctricos Certificados SEC',
        'Monitoreo de Alarmas 24/7 con Plan Cuadrante Carabineros',
        'Control de Acceso Biométrico ZKTeco',
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Av. Valparaíso 351',
        addressLocality: 'Villa Alemana',
        addressRegion: 'Región de Valparaíso',
        postalCode: '6500000',
        addressCountry: 'CL',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -33.0472,
        longitude: -71.3736,
      },
      areaServed: [
        { '@type': 'AdministrativeArea', name: 'Región Metropolitana' },
        { '@type': 'AdministrativeArea', name: 'Región de Valparaíso' },
        { '@type': 'Country', name: 'Chile' },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        bestRating: '5',
        worstRating: '1',
        ratingCount: '184',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '18:00',
          description: 'Atención Comercial y Asesoría Técnica',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          opens: '00:00',
          closes: '23:59',
          description: 'Central de Monitoreo 24/7 Redundante',
        },
      ],
      sameAs: ['https://www.gamasecurity.cl'],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Servicios de Seguridad y Monitoreo GAMA',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'Monitoreo de Alarmas Residencial 24/7 (0,9 UF + IVA)',
            description: 'Plan de monitoreo continuo 24/7 con verificación humana y coordinación inmediata con Carabineros.',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '35000',
              priceCurrency: 'CLP',
              unitCode: 'MON',
            },
          },
          {
            '@type': 'Offer',
            name: 'Kit de Alarma para Casa Inalámbrico Propio',
            description: 'Sistema inalámbrico inteligente con sensores de impacto, teclado y app móvil. 100% propio sin arriendos.',
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: '199900',
              priceCurrency: 'CLP',
            },
          },
          {
            '@type': 'Offer',
            name: 'Migración de Alarma ADT / DSC a $0 en Hardware',
            description: 'Reprogramación técnica de tu panel DSC o Honeywell existente hacia nuestra central receptora sin costo de equipos.',
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: '0',
              priceCurrency: 'CLP',
            },
          },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cuánto cuesta un sistema de alarma para casa en Chile?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Los kits de alarma para casa parten desde $199.900 con instalación incluida y equipos 100% propios sin comodato. El plan de monitoreo profesional 24/7 con verificación humana y coordinación con Carabineros cuesta desde 0,9 UF + IVA mensuales (~$35.000 CLP). Si ya tienes una alarma instalada (ADT, DSC, Honeywell), la reprogramamos a costo $0 en hardware.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Por qué conviene cambiarse de Verisure o ADT a Gama Seguridad?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Frente a Verisure y ADT, que cobran entre $60.000 y $85.000 mensuales bajo arriendo o comodato indefinido, en Gama Seguridad eres dueño absoluto de tus equipos y pagas desde 0,9 UF + IVA (~$35.000). Esto genera un ahorro real de más de $350.000 al año con la misma cobertura de central receptora 24/7 y sin penalizaciones al terminar contrato.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué marcas de alarmas son compatibles con la central de Gama Seguridad?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nuestra central opera bajo protocolos internacionales abiertos y homologados: DSC (PowerSeries y Neo), Honeywell Vista, Paradox (Magellan y Spectra), Hikvision AX PRO, Dahua AirShield y Vetti Smart. No amarramos a los clientes a marcas propietarias cerradas.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo funciona la migración a costo $0 si tengo una alarma ADT o DSC instalada?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nuestros técnicos especializados evalúan tu panel existente (marcas DSC, Honeywell o Paradox) y lo reprograman o instalan un comunicador 4G moderno para enlazarlo a nuestra central de monitoreo. No tienes que comprar sensores nuevos ni romper paredes, reduciendo tu mensualidad inmediatamente a 0,9 UF + IVA.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué protocolo se sigue ante una activación de alarma?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ante una señal de intrusión, nuestra central de monitoreo 24/7 verifica el evento mediante zonificación inteligente o videoverificación, contacta inmediatamente al titular y despacha aviso prioritario al Plan Cuadrante de Carabineros de Chile (133) y servicios de emergencia comunales.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Los cercos eléctricos que instalan cumplen con la normativa SEC?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí. Todos nuestros cercos eléctricos perimetrales se instalan bajo la estricta normativa de la Superintendencia de Electricidad y Combustibles (SEC), utilizando energizadores homologados (Speedrite, Nemtek, JVA), letreros de advertencia normalizados, puesta a tierra certificada y gestión de trámite TE-1 SEC.',
          },
        },
      ],
    },
  ],
}

async function getLandingMarketingConfig(): Promise<LandingMarketingConfig> {
  try {
    const { data, error } = await supabase
      .from('config_sales_gama')
      .select('value')
      .eq('key', 'config')
      .single()

    if (!error && data?.value?.landing_marketing) {
      return data.value.landing_marketing as LandingMarketingConfig
    }
  } catch (err) {
    console.warn('[Landing Home] Error fetching marketing config, fallback to default:', err)
  }
  return DEFAULT_LANDING_MARKETING_CONFIG
}

export default async function Home() {
  const marketingConfig = await getLandingMarketingConfig()
  const servicios = getAllServicios()
  const rmComunas = getComunasByRegion('rm')
  const vrComunas = getComunasByRegion('v-region')
  const articulos = getAllArticulos()

  const navServicios = servicios.map(s => ({ label: s.title, href: `/servicios/${s.slug}` }))
  const navComunas = [
    {
      label: REGION_LABELS.rm,
      items: rmComunas.map(c => ({ label: c.name, href: `/comunas/rm/${c.slug}` })),
    },
    {
      label: REGION_LABELS['v-region'],
      items: vrComunas.map(c => ({ label: c.name, href: `/comunas/v-region/${c.slug}` })),
    },
  ]
  const navArticulos = articulos.map(a => ({ label: a.title, href: `/blog/${a.slug}` }))

  const footerServicios = servicios.slice(0, 8).map(s => ({ label: s.title, href: `/servicios/${s.slug}` }))
  const footerComunas = [
    ...rmComunas.slice(0, 4).map(c => ({ label: `${c.name} (RM)`, href: `/comunas/rm/${c.slug}` })),
    ...vrComunas.slice(0, 4).map(c => ({ label: `${c.name} (Valparaíso)`, href: `/comunas/v-region/${c.slug}` })),
  ]
  const footerArticulos = articulos.slice(0, 6).map(a => ({ label: a.title, href: `/blog/${a.slug}` }))

  return (
    <main className="min-h-screen bg-[#050d1a] relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <Navbar servicios={navServicios} comunas={navComunas} articulos={navArticulos} />
      <HeroCarousel slides={marketingConfig.heroSlides} />
      <Servicios />
      <VettiShowcase />
      <QuienesSomos />
      <Tecnologia />
      <Testimonios />
      <CTAEmergencia />


      {/* ── SEO: Grid de servicios ── */}
      <section id="servicios-grid" className="py-20 bg-[#0a1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="apple-display-lg text-white text-center mb-4">
            Servicios de seguridad electrónica en Chile
          </h2>
          <p className="text-slate-300 text-center max-w-2xl mx-auto mb-10">
            Alarmas para casas, monitoreo 24/7 desde 0,9 UF, cámaras CCTV 4K, cercos eléctricos certificados SEC y control de acceso para hogares y empresas.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {servicios.slice(0, 8).map(s => <ServiceCard key={s.slug} servicio={s} />)}
          </div>
          <div className="text-center mt-8">
            <Link href="/servicios" className="btn-apple-primary inline-flex py-2 px-6 text-sm">
              Ver los 20 servicios de seguridad →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEO ESTRATÉGICO: Comparativa de Empresas y Tecnologías Compatibles ── */}
      <section className="py-20 bg-[#050d1a] border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Header Comparativa */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/40 border border-blue-500/40 text-sky-300 text-xs font-mono font-bold uppercase">
              ⚖️ Comparativa de Mercado Chile 2026
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ¿Por qué cientos de clientes migran a Gama Seguridad?
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Compara con total transparencia cómo operamos frente a las grandes multinacionales del rubro. Sin comodato forzoso y con tarifas fijas desde 0,9 UF + IVA.
            </p>
          </div>

          {/* Tabla Comparativa de Competencia */}
          <div className="overflow-x-auto border border-slate-800 rounded-3xl bg-slate-900/60 shadow-2xl">
            <table className="w-full text-left border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-gradient-to-r from-[#000080] to-blue-950 text-white font-black text-xs uppercase tracking-wider border-b border-slate-700">
                  <th className="p-4 sm:p-5">Criterio de Evaluación</th>
                  <th className="p-4 sm:p-5 text-emerald-300 bg-blue-900/50">Gama Seguridad SpA</th>
                  <th className="p-4 sm:p-5 text-slate-300">Verisure Chile</th>
                  <th className="p-4 sm:p-5 text-slate-300">ADT Chile</th>
                  <th className="p-4 sm:p-5 text-slate-300">Prosegur / First Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                <tr className="hover:bg-slate-800/30">
                  <td className="p-4 sm:p-5 font-bold text-white">Tarifa Mensual de Monitoreo</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-black bg-blue-950/30">Desde 0,9 UF + IVA (~$35.000)</td>
                  <td className="p-4 sm:p-5">$65.000 a $80.000/mes</td>
                  <td className="p-4 sm:p-5">$50.000 a $68.000/mes</td>
                  <td className="p-4 sm:p-5">$55.000 a $70.000/mes</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-4 sm:p-5 font-bold text-white">Propiedad de los Equipos</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-bold bg-blue-950/30">100% Propios del Cliente</td>
                  <td className="p-4 sm:p-5 text-rose-400 font-bold">Comodato (Arriendo eterno)</td>
                  <td className="p-4 sm:p-5">Comodato o Venta condicionada</td>
                  <td className="p-4 sm:p-5">Comodato habitual</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-4 sm:p-5 font-bold text-white">Migración de Alarmas Existentes</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-black bg-blue-950/30">$0 en Hardware (Reprogramación)</td>
                  <td className="p-4 sm:p-5 text-slate-500">Incompatible (Sistema cerrado)</td>
                  <td className="p-4 sm:p-5 text-slate-500">No aplica</td>
                  <td className="p-4 sm:p-5 text-slate-500">Cambio forzoso de panel</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-4 sm:p-5 font-bold text-white">Protocolo de Verificación Humana</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-bold bg-blue-950/30">Verificación 24/7 sin intermediarios</td>
                  <td className="p-4 sm:p-5">Central CRA automatizada</td>
                  <td className="p-4 sm:p-5">Central telefónica remota</td>
                  <td className="p-4 sm:p-5">Central receptora estándar</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Marcas de Seguridad Compatibles */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">
                  Tecnología y Marcas de Grado Bancario Homologadas en Chile
                </h3>
                <p className="text-slate-400 text-sm sm:text-base text-center sm:text-left mt-1">
                  Nuestra central es compatible con las principales marcas de seguridad electrónica del mercado internacional. No quedas cautivo a tecnología propietaria.
                </p>
              </div>
              <Link
                href="/blog/marcas-de-alarmas-en-chile-dsc-paradox-honeywell-hikvision"
                className="text-sky-400 hover:text-sky-300 text-sm font-bold inline-flex items-center gap-1 shrink-0"
              >
                Guía completa de marcas →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-2 text-center">
              <Link
                href="/blog/marcas-de-alarmas-en-chile-dsc-paradox-honeywell-hikvision"
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all block group"
              >
                <div className="font-black text-sky-400 group-hover:text-sky-300 text-base">DSC</div>
                <div className="text-xs text-slate-400 mt-1">PowerSeries & Neo</div>
              </Link>
              <Link
                href="/blog/marcas-de-alarmas-en-chile-dsc-paradox-honeywell-hikvision"
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all block group"
              >
                <div className="font-black text-sky-400 group-hover:text-sky-300 text-base">Honeywell</div>
                <div className="text-xs text-slate-400 mt-1">Vista 48 & Vista 20P</div>
              </Link>
              <Link
                href="/servicios/alarma-con-app"
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all block group"
              >
                <div className="font-black text-sky-400 group-hover:text-sky-300 text-base">Vetti Smart</div>
                <div className="text-xs text-slate-400 mt-1">Inalámbrico & NT CLICK</div>
              </Link>
              <Link
                href="/servicios/camaras-de-seguridad"
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all block group"
              >
                <div className="font-black text-sky-400 group-hover:text-sky-300 text-base">Hikvision</div>
                <div className="text-xs text-slate-400 mt-1">AX PRO & Cámaras 4K</div>
              </Link>
              <Link
                href="/blog/marcas-de-alarmas-en-chile-dsc-paradox-honeywell-hikvision"
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all block group"
              >
                <div className="font-black text-sky-400 group-hover:text-sky-300 text-base">Paradox</div>
                <div className="text-xs text-slate-400 mt-1">Magellan & Spectra</div>
              </Link>
              <Link
                href="/servicios/camaras-ip"
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all block group"
              >
                <div className="font-black text-sky-400 group-hover:text-sky-300 text-base">Dahua</div>
                <div className="text-xs text-slate-400 mt-1">AirShield & CCTV IA</div>
              </Link>
            </div>
          </div>

          {/* Hub de Soluciones de Seguridad Electrónica en Chile */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="text-2xl">🚨</div>
              <h4 className="text-lg font-bold text-white">Monitoreo 24/7 sin Comodato</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Central receptora propia con respuesta humana 24/7 y coordinación directa con Plan Cuadrante de Carabineros desde 0,9 UF + IVA.
              </p>
              <Link href="/servicios/monitoreo-de-alarmas-24-7" className="text-sky-400 hover:text-sky-300 text-xs font-bold inline-block">
                Ver plan de monitoreo →
              </Link>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="text-2xl">📹</div>
              <h4 className="text-lg font-bold text-white">Cámaras CCTV 4K con IA</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Hikvision ColorVu y Dahua WizSense con analíticas avanzadas de personas y vehículos, grabación continua y visualización remota en el celular.
              </p>
              <Link href="/servicios/camaras-de-seguridad" className="text-sky-400 hover:text-sky-300 text-xs font-bold inline-block">
                Instalación de cámaras →
              </Link>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="text-2xl">⚡</div>
              <h4 className="text-lg font-bold text-white">Cercos Eléctricos SEC</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Instalación certificada bajo norma de la Superintendencia de Electricidad y Combustibles con energizadores Speedrite, Nemtek y JVA.
              </p>
              <Link href="/servicios/cerco-electrico" className="text-sky-400 hover:text-sky-300 text-xs font-bold inline-block">
                Cercos eléctricos certificados →
              </Link>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="text-2xl">⚖️</div>
              <h4 className="text-lg font-bold text-white">Ranking de Empresas 2026</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Compara precios, contratos y letras chicas entre Verisure, ADT, Prosegur, First Security y Gama Seguridad.
              </p>
              <Link href="/blog/empresas-de-alarmas-en-chile-ranking-precios" className="text-sky-400 hover:text-sky-300 text-xs font-bold inline-block">
                Ver ranking comparativo →
              </Link>
            </div>
          </div>

          {/* Banner al Cotizador Online */}
          <div className="bg-gradient-to-r from-blue-950 via-[#071326] to-slate-900 border border-sky-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-left">
              <span className="text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow">
                ⚡ Cotizador en Línea 2026
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Calcula el ahorro de tu propiedad en 30 segundos
              </h3>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl">
                Ingresa tu dirección y comuna para obtener un presupuesto detallado. Ahorra hasta $350.000 al año frente a Verisure o ADT.
              </p>
            </div>
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all text-base cursor-pointer"
            >
              <span>📊</span> Ir al Cotizador Online →
            </Link>
          </div>

        </div>
      </section>

      {/* ── SEO: Comunas ── */}
      <section id="comunas-grid" className="py-20 bg-[#050d1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="apple-display-lg text-white text-center mb-4">
            Cobertura de alarmas y seguridad por comuna en Chile
          </h2>
          <p className="text-slate-300 text-center max-w-2xl mx-auto mb-10">
            Instalamos y monitoreamos en 52 comunas de la Región Metropolitana y 38 de la
            Región de Valparaíso con técnicos locales propios.
          </p>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...rmComunas.slice(0, 6), ...vrComunas.slice(0, 6)]
              .map(c => <ComunaCard key={`${c.region}-${c.slug}`} comuna={c} />)}
          </div>
          <div className="text-center mt-8">
            <Link href="/comunas" className="btn-apple-secondary-dark inline-flex py-2 px-6 text-sm">
              Ver las 90 comunas con cobertura →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEO: Blog ── */}
      <section id="blog-grid" className="py-20 bg-[#0a1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="apple-display-lg text-white text-center mb-4">
            Guías, comparativas y precios de alarmas en Chile
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {articulos.slice(0, 3).map(a => <ArticleCard key={a.slug} articulo={a} />)}
          </div>
          <div className="text-center mt-8">
            <Link href="/blog" className="btn-apple-primary inline-flex py-2 px-6 text-sm">
              Ver todas las guías del blog →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEO: FAQ home ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Faq heading="Preguntas frecuentes sobre alarmas para casa y seguridad electrónica" items={[
          { question: '¿Cuánto cuesta un sistema de alarma para casa en Chile?', answer: 'Los kits de alarma para casa parten desde $199.900 con instalación incluida y equipos 100% propios sin comodato. El plan de monitoreo profesional 24/7 con verificación humana y coordinación con Carabineros cuesta desde 0,9 UF + IVA mensuales (~$35.000 CLP). Si ya tienes una alarma instalada (ADT, DSC, Honeywell), la reprogramamos a costo $0 en hardware.' },
          { question: '¿Por qué conviene cambiarse de Verisure o ADT a Gama Seguridad?', answer: 'Frente a Verisure y ADT, que cobran entre $60.000 y $85.000 mensuales bajo arriendo o comodato indefinido, en Gama Seguridad eres dueño absoluto de tus equipos y pagas desde 0,9 UF + IVA (~$35.000). Esto genera un ahorro real de más de $350.000 al año con la misma cobertura de central receptora 24/7 y sin penalizaciones al terminar contrato.' },
          { question: '¿Qué marcas de alarmas son compatibles con la central de Gama Seguridad?', answer: 'Nuestra central opera bajo protocolos internacionales abiertos y homologados: DSC (PowerSeries y Neo), Honeywell Vista, Paradox (Magellan y Spectra), Hikvision AX PRO, Dahua AirShield y Vetti Smart. No amarramos a los clientes a marcas propietarias cerradas.' },
          { question: '¿Cómo funciona la migración a costo $0 si tengo una alarma ADT o DSC instalada?', answer: 'Nuestros técnicos especializados evalúan tu panel existente (marcas DSC, Honeywell o Paradox) y lo reprograman o instalan un comunicador 4G moderno para enlazarlo a nuestra central de monitoreo. No tienes que comprar sensores nuevos ni romper paredes, reduciendo tu mensualidad inmediatamente a 0,9 UF + IVA.' },
          { question: '¿Qué protocolo se sigue ante una activación de alarma?', answer: 'Ante una señal de intrusión, nuestra central de monitoreo 24/7 verifica el evento mediante zonificación inteligente o videoverificación, contacta inmediatamente al titular y despacha aviso prioritario al Plan Cuadrante de Carabineros de Chile (133) y servicios de emergencia comunales.' },
          { question: '¿Los cercos eléctricos que instalan cumplen con la normativa SEC?', answer: 'Sí. Todos nuestros cercos eléctricos perimetrales se instalan bajo la estricta normativa de la Superintendencia de Electricidad y Combustibles (SEC), utilizando energizadores homologados (Speedrite, Nemtek, JVA), letreros de advertencia normalizados, puesta a tierra certificada y gestión de trámite TE-1 SEC.' },
          { question: '¿En qué comunas instalan alarmas y cámaras de seguridad?', answer: 'Cubrimos las 52 comunas de la Región Metropolitana (Las Condes, Lo Barnechea, Providencia, Chicureo, Colina, Maipú, Puente Alto, etc.) y las 38 de la Región de Valparaíso (Viña del Mar, Concón, Valparaíso, Quilpué, Villa Alemana) con técnicos locales propios y tiempo de instalación de 24 a 48 horas.' },
        ]} />
      </div>

      <LandingInteractiveLayer
        footerServicios={footerServicios}
        footerComunas={footerComunas}
        footerArticulos={footerArticulos}
      />
      <PromoPopupModal initialConfig={marketingConfig.popup} />
      <ChatWidget />
    </main>
  )
}


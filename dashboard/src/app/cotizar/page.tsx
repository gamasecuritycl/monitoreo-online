import type { Metadata } from 'next'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import JsonLd from '@/components/seo/JsonLd'
import CotizadorOnline from '@/components/cotizador/CotizadorOnline'

const SITE_URL = 'https://www.gamasecurity.cl'

export const metadata: Metadata = {
  title: 'Cotizador de Alarmas Online Chile 2026 | Gama Seguridad',
  description:
    'Calcula en 30 segundos el costo de proteger tu casa o negocio. Compara el ahorro frente a Verisure y ADT: monitoreo 24/7 desde 0,9 UF + IVA con equipos propios.',
  alternates: { canonical: '/cotizar' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: `${SITE_URL}/cotizar`,
    siteName: 'GAMA SECURITY',
    title: 'Cotizador de Alarmas Online Chile 2026 — GAMA SECURITY',
    description:
      'Cotiza tu alarma online: si tienes ADT migras con $0 en equipos y monitoreo desde 0,9 UF + IVA. Equipos 100% tuyos sin contratos de arriendo infinito.',
    images: [
      {
        url: '/og-cotizador.png',
        width: 1200,
        height: 630,
        alt: 'Cotizador de Alarmas Online GAMA SECURITY',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cotizador de Alarmas Online Chile — GAMA SECURITY',
    description: 'Calcula tu ahorro y cotiza tu sistema de seguridad en 30 segundos.',
    images: ['/og-cotizador.png'],
  },
}

export default function CotizarPage() {
  return (
    <main className="min-h-screen bg-[#050d1a] text-slate-100 py-6 sm:py-10">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Cotizador de Alarmas Online Chile 2026 - Gama Seguridad',
          description:
            'Herramienta de cotización online interactiva para sistemas de alarma residencial y comercial con cálculo de ahorro frente a Verisure y ADT.',
          url: `${SITE_URL}/cotizar`,
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Cotizador Online', href: '/cotizar' }]} />

        {/* Hero explicativo */}
        <div className="text-center max-w-3xl mx-auto my-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/40 border border-blue-500/40 text-blue-300 text-xs font-mono font-bold uppercase tracking-wider">
            <span>🛡️</span> Transparencia Total Gama Seguridad 2026
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Cotizador Inteligente de Alarmas y Monitoreo 24/7
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Obtén un presupuesto estimado al instante. Ingresa los datos de tu propiedad y te contactaremos para confirmar la factibilidad técnica en tu comuna.
          </p>
        </div>

        {/* Componente Interactivo de Cotización */}
        <CotizadorOnline origen="pagina_cotizar" />

        {/* Garantías y Diferenciadores */}
        <section className="mt-16 grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="text-2xl">💰</div>
            <h3 className="text-lg font-bold text-white">Tarifa Fija y Transparente</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Monitoreo profesional desde <strong>0,9 UF + IVA mensual</strong>. Sin cargos sorpresa de mantención ni reajustes ocultos.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="text-2xl">📦</div>
            <h3 className="text-lg font-bold text-white">Equipos 100% Propios</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No creemos en el comodato de arriendo eterno. La tecnología es tuya desde el primer día, amortizada con hardware al costo.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="text-2xl">🔄</div>
            <h3 className="text-lg font-bold text-white">Migración ADT a Costo $0</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Si ya tienes paneles DSC, Honeywell o Vista instalados, los reprogramamos a nuestra central sin botar tu inversión.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

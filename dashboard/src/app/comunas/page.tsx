import type { Metadata } from 'next'
import { getComunasByRegion, REGION_LABELS } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import ComunaCard from '@/components/seo/ComunaCard'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'

const SITE_URL = 'https://www.gamasecurity.cl'

export const metadata: Metadata = {
  title: 'Cobertura de Alarmas y Seguridad Electrónica por Comuna en Chile',
  description:
    'Instalación y monitoreo de alarmas, cámaras CCTV y cercos eléctricos en 90 comunas de la Región Metropolitana y Región de Valparaíso. Encuentra tu comuna y cotiza.',
  alternates: { canonical: '/comunas' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: `${SITE_URL}/comunas`,
    siteName: 'GAMA SECURITY',
    title: 'Cobertura de Alarmas y Seguridad en 90 Comunas — GAMA SECURITY Chile',
    description:
      'Instalación de alarmas, cámaras y cercos eléctricos en RM y Región de Valparaíso. Cotiza en tu comuna.',
    images: [
      {
        url: '/og-comuna.png',
        width: 1200,
        height: 630,
        alt: 'Cobertura por Comuna GAMA SECURITY',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cobertura de Alarmas y Seguridad en 90 Comunas — GAMA SECURITY',
    description:
      'Instalación y monitoreo de alarmas en 90 comunas de Chile. Evaluación gratis.',
    images: ['/og-comuna.png'],
  },
}

export default function ComunasIndex() {
  const rm = getComunasByRegion('rm')
  const vr = getComunasByRegion('v-region')
  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'ItemList',
        itemListElement: [...rm, ...vr].map((c, i) => ({
          '@type': 'ListItem', position: i + 1, name: c.title,
          url: `https://www.gamasecurity.cl/comunas/${c.region}/${c.slug}`,
        })),
      }} />
      <Breadcrumbs items={[{ label: 'Comunas', href: '/comunas' }]} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="apple-display-lg text-white mb-4">
          Seguridad electrónica por comuna en Chile
        </h1>
        <p className="text-slate-300 apple-lead max-w-3xl mb-10">
          Instalamos y monitoreamos alarmas, cámaras de seguridad, cercos eléctricos y
          control de acceso en {rm.length + vr.length} comunas de la {REGION_LABELS.rm} y
          la {REGION_LABELS['v-region']}. Selecciona tu comuna para ver servicios,
          cobertura y precios locales.
        </p>
        {([[rm, 'rm'], [vr, 'v-region']] as const).map(([list, region]) => (
          <div key={region} className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">{REGION_LABELS[region]}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {list.map(c => <ComunaCard key={c.slug} comuna={c} />)}
            </div>
          </div>
        ))}
        <Hashtags tags={['SeguridadElectrónica', 'AlarmasPorComuna', 'CámarasDeSeguridad', 'RegiónMetropolitana', 'VRegión']} />
      </section>
    </main>
  )
}

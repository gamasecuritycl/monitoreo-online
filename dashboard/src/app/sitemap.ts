import type { MetadataRoute } from 'next'
import { getAllServicios, getAllComunas, getAllArticulos } from '@/lib/content'

const SITE_URL = 'https://www.gamasecurity.cl'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/cotizar`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/servicios`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${SITE_URL}/comunas`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/contacto`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const servicios: MetadataRoute.Sitemap = getAllServicios().map(s => {
    const isPriority = s.slug === 'alarmas-para-casa' || s.slug === 'monitoreo-de-alarmas-24-7'
    return {
      url: `${SITE_URL}/servicios/${s.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: isPriority ? 1.0 : 0.85,
    }
  })

  const comunas: MetadataRoute.Sitemap = getAllComunas().map(c => ({
    url: `${SITE_URL}/comunas/${c.region}/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  const articulos: MetadataRoute.Sitemap = getAllArticulos().map(a => {
    const isCompetitor =
      a.slug.includes('verisure') ||
      a.slug.includes('adt') ||
      a.slug.includes('comparativa') ||
      a.slug.includes('cuanto-cuesta') ||
      a.slug.includes('marcas') ||
      a.slug.includes('empresas')
    return {
      url: `${SITE_URL}/blog/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: 'weekly',
      priority: isCompetitor ? 0.95 : 0.8,
    }
  })

  return [...staticRoutes, ...servicios, ...comunas, ...articulos]
}

import type { MetadataRoute } from 'next'
import { getAllServicios, getAllComunas, getAllArticulos } from '@/lib/content'

const SITE_URL = 'https://www.gamasecurity.cl'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/servicios`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/comunas`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/contacto`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const servicios: MetadataRoute.Sitemap = getAllServicios().map(s => ({
    url: `${SITE_URL}/servicios/${s.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  const comunas: MetadataRoute.Sitemap = getAllComunas().map(c => ({
    url: `${SITE_URL}/comunas/${c.region}/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  const articulos: MetadataRoute.Sitemap = getAllArticulos().map(a => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  return [...staticRoutes, ...servicios, ...comunas, ...articulos]
}

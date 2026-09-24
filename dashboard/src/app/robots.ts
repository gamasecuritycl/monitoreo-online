import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/operacion',
          '/operaciones',
          '/app',
          '/portal',
          '/tecnico',
          '/areaclientes',
          '/actualizar',
          '/live/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://www.gamasecurity.cl/sitemap.xml',
    host: 'https://www.gamasecurity.cl',
  }
}

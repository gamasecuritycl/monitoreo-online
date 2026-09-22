# Design: SEO completo gamasecurity.cl (landing + servicios + comunas + blog)

**Fecha:** 2026-09-22
**Estado:** Aprobado por el usuario
**Repo:** `gamasecuritycl/monitoreo-online` (rama `main`)
**Sitio:** https://www.gamasecurity.cl (Next.js 16, App Router, Vercel)

## Objetivo

Posicionar `gamasecurity.cl` en Google Chile para búsquedas genéricas de seguridad
electrónica y corrientes débiles ("sistema de alarma para casa", "alarmas para
negocios", "cámaras de seguridad en [comuna]", etc.), alcanzando el máximo volumen
de páginas indexables con contenido único de calidad.

## Alcance

- ~135 URLs SSG: 20 servicios + 90 comunas (52 RM + 38 V Región) + 20 artículos
  de blog + índices + `/contacto`.
- ~75.000 palabras indexables únicas.
- JSON-LD en todas las páginas, sitemap dinámico, navegación y footer ampliados.
- Keywords genéricas (no centradas en marcas); hashtags visibles como etiquetas.

**Fuera de alcance:** multilenguaje, AMP, Google Business Profile (manual por el
usuario), backlinks externos, cambios en APIs/portal/WhatsApp.

## Decisiones de diseño

- **Opción A (aprobada):** catálogo estático con plantillas dinámicas + contenido
  en archivos Markdown/JSON versionados con git. No CMS (Supabase) por
  complejidad innecesaria y peor encaje con SSG.
- Contenido en `src/content/` con frontmatter; loader tipado en `src/lib/content.ts`.
- Markdown con `gray-matter` para servicios/blog; JSON para datos locales de comunas.
- Anti doorway/thin content: cada página ≥300 palabras únicas; comunas con datos
  locales (barrios/sectores) reales y distintos por comuna.
- Hashtags: etiquetas visibles al pie de páginas/artículos; se entiende que Google
  los ignora (aportan al compartir en redes).

## Arquitectura de URLs

```
/                                 home (existente)
/servicios                        índice de servicios
/servicios/[slug]                 20 páginas de servicio
/comunas                          índice (RM + V Región)
/comunas/rm/[slug]                52 comunas
/comunas/v-region/[slug]          38 comunas
/blog                             índice
/blog/[slug]                      20 artículos
/contacto                         landing de contacto
/sitemap.xml                      dinámico (~135 URLs)
/robots.txt                       existente, sin cambios
```

Rutas internas bloqueadas en robots (sin cambios): `/operacion`, `/app`,
`/portal`, `/tecnico`, `/areaclientes`, `/actualizar`, `/live/`, `/api/`.

## Catálogo de servicios (20)

Slugs keyword-genéricos:

1. `alarmas-para-casa`
2. `alarmas-para-negocios`
3. `sistema-alarma-inalambrico`
4. `sistema-alarma-cableada`
5. `monitoreo-de-alarmas-24-7`
6. `camaras-de-seguridad`
7. `camaras-ip`
8. `cerco-electrico`
9. `control-de-acceso`
10. `citofonia`
11. `videoportero`
12. `deteccion-de-incendio`
13. `prevencion-de-robo`
14. `redes-de-datos`
15. `sistemas-de-voceo`
16. `domotica`
17. `alarma-con-app` (compatible con App NT CLICK mencionada como referencia)
18. `sensores-de-presencia`
19. `sistemas-de-alarma-para-empresas`
20. `mantencion-de-sistemas-de-seguridad`

## Plantilla de página de servicio

- Metadata: título ≤60 chars, descripción ≤155 chars, keywords, canonical, OG.
- H1 keyword principal; lead 40-60 palabras.
- H2 ¿Qué es y cómo funciona? (150-250 palabras).
- H2 Tipos/modelos (bullets con keywords de cola larga).
- H2 ¿Cuánto cuesta? con tabla de rangos (FAQ schema).
- H2 Ventajas y beneficios.
- H2 Proceso de instalación (4 pasos).
- H2 ¿Por qué GAMA SECURITY? (trust signals).
- FAQ ×4 con JSON-LD FAQPage.
- CTA: cotizar + WhatsApp + teléfono (+56 9 9101 6912).
- Relacionados: 3 servicios + 5 comunas.
- Hashtags visibles.
- JSON-LD: Service + FAQPage + BreadcrumbList.
- Objetivo: 3.000-8.000 palabras totales entre las 20 páginas (150-400 mín./página).

## Plantilla de página de comuna

- Metadata: "Seguridad Electrónica y Alarmas en {Comuna} | GAMA".
- H1 con comuna; lead con contexto local real (plaza/calle principal).
- H2 Servicios disponibles en {Comuna} (cards con enlace).
- H2 Zonas y sectores que cubrimos (barrios únicos por comuna).
- H2 ¿Por qué elegirnos en {Comuna}?
- FAQ ×3; CTA WhatsApp + mapa embed.
- JSON-LD: LocalBusiness (addressLocality={Comuna}) + Service + FAQPage + Breadcrumb.
- ~300-500 palabras únicas por comuna (~36.000 en total).

## Plantilla de artículo de blog (20)

Lista de slugs (keywords genéricas):

1. `cuanto-cuesta-sistema-de-alarma-chile-2026`
2. `alarma-inalambrica-vs-cableada`
3. `como-elegir-alarmas-para-casa`
4. `alarmas-para-negocios-y-comercios`
5. `monitoreo-24-7-que-es`
6. `camaras-de-seguridad-cuantas-necesitas`
7. `cerco-electrico-legalidad-chile`
8. `sistemas-de-deteccion-de-incendio`
9. `control-de-acceso-empresas`
10. `citofonia-y-videocitofonia-guia`
11. `domotica-para-hogar-inteligente`
12. `prevencion-de-robo-en-comercios`
13. `alarma-con-app-celular-como-funciona`
14. `mantencion-de-sistemas-de-seguridad`
15. `sensores-de-presencia-y-deteccion-perimetral`
16. `redes-de-datos-estructurados-empresas`
17. `voceo-y-musica-ambiente-profesional`
18. `cctv-ip-vs-analogico`
19. `sistema-de-alarma-para-condominios`
20. `errores-comunes-al-contratar-seguridad-electronica`

Formato: 1.200-1.800 palabras/artículo, H2/H3, tablas comparativas, FAQ ×3-5
(FAQPage JSON-LD), CTA a servicios relacionados, hashtags, JSON-LD Article +
FAQPage + Breadcrumb, 3-5 enlaces internos. Total ~30.000 palabras.

## Home y navegación

- Navbar con dropdowns: Servicios (20), Comunas (2 regiones), Blog, Contacto.
- Footer con 3 columnas: 20 servicios, 10 comunas top, 10 artículos recientes,
  enlaces legales.
- Home: bloques nuevos — grid de servicios (H2 + enlaces), grid de comunas,
  últimos 3 artículos, FAQ visible.
- Breadcrumbs en todas las páginas nuevas.

## SEO técnico

| Elemento | Implementación |
|---|---|
| Sitemap | dinámico ~135 URLs con lastModified real |
| Canonical | absoluto con metadataBase |
| Metadatos | únicos por página; title.template en layout |
| JSON-LD | Organization (home), Service+FAQPage (servicios), LocalBusiness+areaServed (comunas), Article (blog), BreadcrumbList (todas) |
| OpenGraph | variantes og-servicio/og-comuna/og-blog |
| Imágenes | alt descriptivo + sizes |
| Performance | SSG + next/font Inter (ya implementado) |
| Idioma | lang="es" |

## Estructura de código

```
src/app/servicios/page.tsx
src/app/servicios/[slug]/page.tsx     → generateStaticParams + metadata
src/app/comunas/page.tsx
src/app/comunas/[region]/[slug]/page.tsx
src/app/blog/page.tsx
src/app/blog/[slug]/page.tsx
src/app/contacto/page.tsx
src/content/servicios/*.md            (20)
src/content/comunas/rm/*.json         (52)
src/content/comunas/v-region/*.json   (38)
src/content/blog/*.md                 (20)
src/components/seo/Breadcrumbs.tsx, JsonLd.tsx, Faq.tsx,
                 RelatedLinks.tsx, ServiceCard.tsx, ComunaCard.tsx
src/lib/content.ts                    loader tipado + validación frontmatter
```

Archivos modificados: `navbar`, `footer`, home `page.tsx`, `sitemap.ts`
(dinámico).

## Calidad y validación

- Cada página ≥300 palabras únicas; sin copypaste entre comunas.
- Script de validación que falla el build si falta título/descripción/keywords
  o contenido <150 palabras.
- Verificación: `npm run build` SSG sin errores, Rich Results Test, lint (cero
  errores nuevos en archivos tocados).
- No tocar: WhatsApp server, portal técnico, APIs de operación.

## Riesgos

- **Thin content / doorway pages** en comunas → mitigado con datos locales
  únicos y mínimo de palabras por página.
- **Memoria de build** (Turbopack con ~135 páginas) → usar
  `NODE_OPTIONS=--max-old-space-size=4096` si hace falta.
- **Largo tiempo de redacción** → el contenido lo genera la IA en fases dentro
  del plan (servicios → comunas → blog).

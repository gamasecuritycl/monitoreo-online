# SEO Completo gamasecurity.cl — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir ~135 páginas indexables (20 servicios, 90 comunas, 20 artículos de blog, contacto) con contenido único, JSON-LD, sitemap dinámico y navegación ampliada para posicionar gamasecurity.cl en Google Chile.

**Architecture:** Next.js 16 App Router con SSG (`generateStaticParams`). Contenido en `src/content/` (Markdown+frontmatter para servicios/blog, JSON para comunas), cargado por un loader tipado (`src/lib/content.ts`) y validado en build (`scripts/validate-content.mjs`). Componentes SEO reutilizables + páginas de plantilla por tipo de contenido.

**Tech Stack:** Next.js 16.2.9, React 19, TypeScript, Tailwind v4 (+ `@tailwindcss/typography`), `gray-matter`, `react-markdown`, `remark-gfm`, `node:test` para tests del validador.

## Global Constraints

- URL base: `https://www.gamasecurity.cl` (constante `SITE_URL`).
- Teléfono: `+56 9 9101 6912`; WhatsApp: `https://wa.me/56991016912`; email: `contacto@gamasecurity.cl`; RUT: `78.297.009-7`; dirección: Av. Valparaíso 351, Villa Alemana.
- `title` máx. 60 caracteres; `description` máx. 155; ≥5 keywords; ≥3 hashtags por página.
- Mín. palabras: servicio body ≥300; artículo body ≥1200; comuna lead ≥40 + reasonExtra ≥80 + ≥5 sectors + ≥3 FAQ. Páginas servidas ≥300 palabras únicas (campos únicos + plantilla).
- Keywords **genéricas** (no centradas en marcas); DSC/Vetti/NT CLICK solo como mención secundaria de compatibilidad.
- Hashtags visibles al pie de cada página/artículo; nunca como única estrategia.
- Regiones: `rm` (52 comunas) y `v-region` (38 comunas) únicamente.
- JSON-LD por tipo: Service+FAQPage+BreadcrumbList (servicios); LocalBusiness+Service+FAQPage+BreadcrumbList (comunas); Article+FAQPage+BreadcrumbList (blog); ContactPage (contacto); ItemList/Blog (índices).
- **PROHIBIDO** tocar: `sincronizador.py`, `editor_remoto.py`, `watchdog_total.vbs`, APIs `/api/*`, portal/tecnico/operacion/app/areaclientes, WhatsApp server, `.baileys-session/`.
- Build con memoria: `$env:NODE_OPTIONS='--max-old-space-size=4096'` antes de `npm run build`.
- Commits convencionales por tarea; NO commitear logs (`_gama_log.txt`, `_editor_remoto_log.txt`); push al final del trabajo por orden del usuario.
- Slugs en minúsculas sin acentos con guiones: `vina-del-mar`, `maipu`, `nunoa`.

## File Structure

```
dashboard/
  package.json                          MOD: deps + scripts validate:content/build
  scripts/validate-content.mjs          CRI: validador (falla build si contenido inválido)
  scripts/validate-content.test.mjs     CRI: tests node:test
  scripts/make-og.ps1                   CRI: genera og-servicio/og-comuna/og-blog.png
  src/lib/content.ts                    CRI: tipos + loaders (fs + gray-matter)
  src/components/seo/JsonLd.tsx          CRI
  src/components/seo/Breadcrumbs.tsx     CRI
  src/components/seo/Faq.tsx             CRI
  src/components/seo/Hashtags.tsx        CRI
  src/components/seo/MarkdownBody.tsx    CRI
  src/components/seo/ServiceCard.tsx     CRI
  src/components/seo/ComunaCard.tsx      CRI
  src/components/seo/ArticleCard.tsx     CRI
  src/content/servicios/*.md             CRI: 20 archivos
  src/content/comunas/rm/*.json          CRI: 52 archivos
  src/content/comunas/v-region/*.json    CRI: 38 archivos
  src/content/blog/*.md                  CRI: 20 archivos
  src/app/servicios/page.tsx             CRI
  src/app/servicios/[slug]/page.tsx      CRI
  src/app/comunas/page.tsx               CRI
  src/app/comunas/[region]/[slug]/page.tsx CRI
  src/app/blog/page.tsx                  CRI
  src/app/blog/[slug]/page.tsx           CRI
  src/app/contacto/page.tsx              CRI
  src/app/contacto/ContactForm.tsx       CRI: client → POST /api/contacto-landing
  src/app/sitemap.ts                     MOD: sitemap dinámico
  src/app/page.tsx                       MOD: bloques servicios/comunas/blog/FAQ
  src/components/landing/Navbar.tsx      MOD: dropdowns Servicios/Comunas/Blog
  src/components/landing/Footer.tsx      MOD: 3 columnas de enlaces reales
  public/og-servicio.png                 CRI
  public/og-comuna.png                   CRI
  public/og-blog.png                     CRI
```

---

### Task 1: Dependencias + content loader + validador con tests

**Files:**
- Modify: `dashboard/package.json`
- Create: `dashboard/src/lib/content.ts`
- Create: `dashboard/scripts/validate-content.mjs`
- Create: `dashboard/scripts/validate-content.test.mjs`

**Interfaces:**
- Produces (todo lo demás consume estos tipos/funciones exactos):

```ts
export interface FaqItem { question: string; answer: string }

export interface ServicioContent {
  slug: string; title: string; description: string
  keywords: string[]; hashtags: string[]; h1: string
  faq: FaqItem[]; relatedServicios: string[]; body: string
}
export interface ComunaContent {
  slug: string; region: 'rm' | 'v-region'; name: string
  title: string; description: string; keywords: string[]; hashtags: string[]
  lead: string; sectors: string[]; reasonExtra: string
  faq: FaqItem[]; serviciosDestacados: string[]
}
export interface ArticuloContent {
  slug: string; title: string; description: string
  keywords: string[]; hashtags: string[]; date: string
  readingMinutes: number; h1: string; faq: FaqItem[]
  relatedServicios: string[]; body: string
}
export const REGION_LABELS: { rm: string; 'v-region': string }
export function getAllServicios(): ServicioContent[]
export function getServicio(slug: string): ServicioContent | undefined
export function getAllComunas(): ComunaContent[]
export function getComunasByRegion(region: 'rm' | 'v-region'): ComunaContent[]
export function getComuna(region: string, slug: string): ComunaContent | undefined
export function getAllArticulos(): ArticuloContent[]   // orden desc por date
export function getArticulo(slug: string): ArticuloContent | undefined
```

**Frontmatter de `*.md` (servicios y blog):**

```yaml
---
title: ...
description: ...
keywords: [a, b, c, d, e]
hashtags: [SistemaDeAlarma, SeguridadElectrónica]
h1: ...
faq:
  - question: ...
    answer: ...
relatedServicios: [slug-a, slug-b, slug-c]
# blog agrega: date: 2026-09-22 | readingMinutes: 7
---
markdown body...
```

- [ ] **Step 1: Instalar dependencias**

```bash
cd dashboard
npm i gray-matter react-markdown remark-gfm
npm i -D @tailwindcss/typography
```

- [ ] **Step 2: Escribir el test del validador (failing)**

Crea `scripts/validate-content.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { validateContentDir } from './validate-content.mjs'

function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-'))
  fs.mkdirSync(path.join(dir, 'servicios'))
  return dir
}

const goodServicio = `---
title: "Sistema de alarma para casa"
description: "Instalación de sistemas de alarma para casa con monitoreo 24/7 en Chile. Cotiza hoy."
keywords: [alarma para casa, sistema de alarma, alarma hogar, alarma inalambrica, alarmas chile]
hashtags: [SistemaDeAlarma, SeguridadElectrónica]
h1: "Sistema de alarma para casa"
faq:
  - question: "¿Cuánto cuesta una alarma para casa?"
    answer: "Desde $199.900 según el plan elegido. La evaluación inicial es gratuita."
relatedServicios: [alarmas-para-negocios, sistema-alarma-inalambrico, monitoreo-de-alarmas-24-7]
---
${'palabra '.repeat(310)}
`

test('validador acepta un servicio bien formado', () => {
  const dir = makeFixture()
  fs.writeFileSync(path.join(dir, 'servicios', 'alarma-para-casa.md'), goodServicio)
  assert.deepStrictEqual(validateContentDir(dir), [])
})

test('validador rechaza título >60', () => {
  const dir = makeFixture()
  const bad = goodServicio.replace(/title: .*/, `title: "${'x'.repeat(70)}"`)
  fs.writeFileSync(path.join(dir, 'servicios', 'alarma-para-casa.md'), bad)
  const errs = validateContentDir(dir)
  assert.ok(errs.some(e => e.includes('title')))
})

test('validador rechaza body corto', () => {
  const dir = makeFixture()
  const bad = goodServicio.replace(/palabra[\s\S]*$/, 'solo tres palabras')
  fs.writeFileSync(path.join(dir, 'servicios', 'alarma-para-casa.md'), bad)
  const errs = validateContentDir(dir)
  assert.ok(errs.some(e => e.includes('body')))
})

test('validador rechaza descripción duplicada entre archivos', () => {
  const dir = makeFixture()
  fs.writeFileSync(path.join(dir, 'servicios', 'a.md'), goodServicio)
  fs.writeFileSync(path.join(dir, 'servicios', 'b.md'),
    goodServicio.replace(/title: .*/, 'title: "Otro titulo distinto aqui"'))
  const errs = validateContentDir(dir)
  assert.ok(errs.some(e => e.includes('duplicada')))
})

test('directorio vacío no genera errores', () => {
  assert.deepStrictEqual(validateContentDir(makeFixture()), [])
})
```

- [ ] **Step 3: Ejecutar y verificar FAIL**

```bash
node --test scripts/validate-content.test.mjs
```
Expected: FAIL con `Cannot find module './validate-content.mjs'`.

- [ ] **Step 4: Implementar `scripts/validate-content.mjs`**

```js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content')

export function words(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length
}

function readFiles(dir, ext) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith(ext)).map(f => ({
    file: f, slug: f.replace(ext, ''), raw: fs.readFileSync(path.join(dir, f), 'utf8'),
  }))
}

export function validateContentDir(contentRoot = ROOT) {
  const errs = []
  const titles = new Map()
  const descs = new Map()
  const push = (f, msg) => errs.push(`${f}: ${msg}`)

  const checkMeta = (f, d) => {
    if (!d.title || d.title.length > 60) push(f, `title ausente o >60 (${d.title?.length ?? 0})`)
    if (!d.description || d.description.length > 155) push(f, 'description ausente o >155')
    if (!Array.isArray(d.keywords) || d.keywords.length < 5) push(f, 'keywords <5')
    if (!Array.isArray(d.hashtags) || d.hashtags.length < 3) push(f, 'hashtags <3')
    if (!d.h1) push(f, 'h1 ausente')
    if (!Array.isArray(d.faq) || d.faq.length < 3) push(f, 'faq <3')
    if (d.title) {
      if (titles.has(d.title)) push(f, `title duplicada con ${titles.get(d.title)}`)
      else titles.set(d.title, f)
    }
    if (d.description) {
      if (descs.has(d.description)) push(f, `description duplicada con ${descs.get(d.description)}`)
      else descs.set(d.description, f)
    }
  }

  const servicioSlugs = new Set()

  for (const { file, slug, raw } of readFiles(path.join(contentRoot, 'servicios'), '.md')) {
    const { data, content } = matter(raw)
    servicioSlugs.add(slug)
    checkMeta(file, data)
    if (words(content) < 300) push(file, `body <300 palabras (${words(content)})`)
    if (!Array.isArray(data.relatedServicios) || data.relatedServicios.length < 3) push(file, 'relatedServicios <3')
  }

  for (const { file, raw } of readFiles(path.join(contentRoot, 'blog'), '.md')) {
    const { data, content } = matter(raw)
    checkMeta(file, data)
    if (words(content) < 1200) push(file, `body <1200 palabras (${words(content)})`)
    if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) push(file, 'date inválida')
    if (!data.readingMinutes) push(file, 'readingMinutes ausente')
    if (!Array.isArray(data.relatedServicios) || data.relatedServicios.length < 3) push(file, 'relatedServicios <3')
  }

  const comunaNames = new Set()
  for (const region of ['rm', 'v-region']) {
    for (const { file, raw } of readFiles(path.join(contentRoot, 'comunas', region), '.json')) {
      let data
      try { data = JSON.parse(raw) } catch { push(file, 'JSON inválido'); continue }
      data.region = region
      checkMeta(file, data)
      if (words(data.lead || '') < 40) push(file, 'lead <40 palabras')
      if (words(data.reasonExtra || '') < 80) push(file, 'reasonExtra <80 palabras')
      if (!Array.isArray(data.sectors) || data.sectors.length < 5) push(file, 'sectors <5')
      if (!Array.isArray(data.serviciosDestacados) || data.serviciosDestacados.length < 6) push(file, 'serviciosDestacados <6')
      if (data.name) {
        if (comunaNames.has(data.name)) push(file, 'name de comuna duplicada')
        else comunaNames.add(data.name)
      }
    }
  }

  if (servicioSlugs.size > 0) {
    for (const { file, raw } of readFiles(path.join(contentRoot, 'servicios'), '.md')) {
      const { data } = matter(raw)
      for (const r of data.relatedServicios || []) if (!servicioSlugs.has(r)) push(file, `relatedServicio desconocido: ${r}`)
    }
    for (const region of ['rm', 'v-region']) {
      for (const { file, raw } of readFiles(path.join(contentRoot, 'comunas', region), '.json')) {
        let data; try { data = JSON.parse(raw) } catch { continue }
        for (const s of data.serviciosDestacados || []) if (!servicioSlugs.has(s)) push(file, `servicioDestacado desconocido: ${s}`)
      }
    }
    for (const { file, raw } of readFiles(path.join(contentRoot, 'blog'), '.md')) {
      const { data } = matter(raw)
      for (const r of data.relatedServicios || []) if (!servicioSlugs.has(r)) push(file, `relatedServicio desconocido: ${r}`)
    }
  }

  return errs
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  const errs = validateContentDir()
  if (errs.length) {
    console.error(`✗ ${errs.length} errores de contenido:`)
    for (const e of errs) console.error('  -', e)
    process.exit(1)
  }
  console.log('✓ contenido OK')
}
```

- [ ] **Step 5: Ejecutar tests y verificar PASS**

```bash
node --test scripts/validate-content.test.mjs
```
Expected: 5 tests PASS.

- [ ] **Step 6: Implementar `src/lib/content.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export interface FaqItem { question: string; answer: string }

export interface ServicioContent {
  slug: string; title: string; description: string
  keywords: string[]; hashtags: string[]; h1: string
  faq: FaqItem[]; relatedServicios: string[]; body: string
}
export interface ComunaContent {
  slug: string; region: 'rm' | 'v-region'; name: string
  title: string; description: string; keywords: string[]; hashtags: string[]
  lead: string; sectors: string[]; reasonExtra: string
  faq: FaqItem[]; serviciosDestacados: string[]
}
export interface ArticuloContent {
  slug: string; title: string; description: string
  keywords: string[]; hashtags: string[]; date: string
  readingMinutes: number; h1: string; faq: FaqItem[]
  relatedServicios: string[]; body: string
}

export const REGION_LABELS = {
  rm: 'Región Metropolitana',
  'v-region': 'Región de Valparaíso',
} as const

const BASE = path.join(process.cwd(), 'src', 'content')

function readMd(dir: string): string[] {
  const p = path.join(BASE, dir)
  return fs.existsSync(p) ? fs.readdirSync(p).filter(f => f.endsWith('.md')) : []
}

function parseMd<T>(dir: string, file: string): T {
  const { data, content } = matter(fs.readFileSync(path.join(BASE, dir, file), 'utf8'))
  return { ...data, slug: file.replace(/\.md$/, ''), body: content } as T
}

export function getAllServicios(): ServicioContent[] {
  return readMd('servicios').map(f => parseMd<ServicioContent>('servicios', f))
}
export function getServicio(slug: string) {
  return getAllServicios().find(s => s.slug === slug)
}
export function getAllComunas(): ComunaContent[] {
  const out: ComunaContent[] = []
  for (const region of ['rm', 'v-region'] as const) {
    const p = path.join(BASE, 'comunas', region)
    if (!fs.existsSync(p)) continue
    for (const f of fs.readdirSync(p).filter(f => f.endsWith('.json'))) {
      const data = JSON.parse(fs.readFileSync(path.join(p, f), 'utf8'))
      out.push({ ...data, region, slug: f.replace(/\.json$/, '') })
    }
  }
  return out
}
export function getComunasByRegion(region: 'rm' | 'v-region') {
  return getAllComunas().filter(c => c.region === region)
}
export function getComuna(region: string, slug: string) {
  return getComunasByRegion(region as 'rm' | 'v-region').find(c => c.slug === slug)
}
export function getAllArticulos(): ArticuloContent[] {
  return readMd('blog').map(f => parseMd<ArticuloContent>('blog', f))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}
export function getArticulo(slug: string) {
  return getAllArticulos().find(a => a.slug === slug)
}
```

- [ ] **Step 7: Wire scripts en `package.json`**

Reemplazar:
```json
"build": "next build"
```
por:
```json
"build": "node scripts/validate-content.mjs && next build",
"validate:content": "node scripts/validate-content.mjs"
```

- [ ] **Step 8: Verificar validador CLI + tsc**

```bash
node scripts/validate-content.mjs
npx tsc --noEmit
```
Expected: `✓ contenido OK` y tsc sin errores.

- [ ] **Step 9: Commit**

```bash
git add dashboard/package.json dashboard/package-lock.json dashboard/scripts/ dashboard/src/lib/content.ts
git commit -m "feat seo: content loader tipado y validador de contenido con tests"
```

---

### Task 2: Componentes SEO reutilizables

**Files:**
- Create: `dashboard/src/components/seo/JsonLd.tsx`
- Create: `dashboard/src/components/seo/Breadcrumbs.tsx`
- Create: `dashboard/src/components/seo/Faq.tsx`
- Create: `dashboard/src/components/seo/Hashtags.tsx`
- Create: `dashboard/src/components/seo/MarkdownBody.tsx`
- Create: `dashboard/src/components/seo/ServiceCard.tsx`
- Create: `dashboard/src/components/seo/ComunaCard.tsx`
- Create: `dashboard/src/components/seo/ArticleCard.tsx`
- Modify: `dashboard/src/app/globals.css`

**Interfaces:**
- Consumes: tipos de Task 1 (`ServicioContent`, `ComunaContent`, `ArticuloContent`, `FaqItem`)
- Produces:
  - `JsonLd({ data }: { data: object })`
  - `Breadcrumbs({ items }: { items: { label: string; href: string }[] })`
  - `Faq({ items, heading? }: { items: FaqItem[]; heading?: string })`
  - `Hashtags({ tags }: { tags: string[] })`
  - `MarkdownBody({ markdown }: { markdown: string })`
  - `ServiceCard({ servicio }: { servicio: ServicioContent })`
  - `ComunaCard({ comuna }: { comuna: ComunaContent })`
  - `ArticleCard({ articulo }: { articulo: ArticuloContent })`

- [ ] **Step 1: Añadir typography a `globals.css`**

Abre `dashboard/src/app/globals.css` y añade junto a las directivas `@theme`/`@plugin` existentes (al inicio del archivo, tras `@import "tailwindcss";` si existe):

```css
@plugin "@tailwindcss/typography";
```

- [ ] **Step 2: Crear `JsonLd.tsx`**

```tsx
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

- [ ] **Step 3: Crear `Breadcrumbs.tsx`**

```tsx
import Link from 'next/link'
import JsonLd from './JsonLd'

interface Crumb { label: string; href: string }

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: 'Inicio', href: '/' }, ...items]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.label,
      item: `https://www.gamasecurity.cl${c.href}`,
    })),
  }
  return (
    <>
      <JsonLd data={jsonLd} />
      <nav aria-label="Migas de pan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-slate-400">
        <ol className="flex flex-wrap items-center gap-2">
          {all.map((c, i) => (
            <li key={`${c.href}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>›</span>}
              {i === all.length - 1 ? (
                <span className="text-white" aria-current="page">{c.label}</span>
              ) : (
                <Link href={c.href} className="hover:text-[#2997ff] transition-colors">{c.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
```

- [ ] **Step 4: Crear `Faq.tsx`**

```tsx
import type { FaqItem } from '@/lib/content'
import JsonLd from './JsonLd'

export default function Faq({ items, heading = 'Preguntas frecuentes' }: { items: FaqItem[]; heading?: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(i => ({
      '@type': 'Question', name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  }
  return (
    <section className="max-w-4xl mx-auto py-16 space-y-8">
      <JsonLd data={jsonLd} />
      <h2 className="apple-display-lg text-white text-center">{heading}</h2>
      <dl className="space-y-6">
        {items.map(i => (
          <div key={i.question} className="apple-card-dark p-6">
            <dt className="text-white font-semibold mb-2">{i.question}</dt>
            <dd className="text-slate-300 text-sm leading-relaxed">{i.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
```

- [ ] **Step 5: Crear `Hashtags.tsx`**

```tsx
export default function Hashtags({ tags }: { tags: string[] }) {
  if (!tags?.length) return null
  return (
    <div className="flex flex-wrap gap-2 pt-8" aria-label="Etiquetas">
      {tags.map(t => (
        <span key={t} className="text-xs font-mono text-[#2997ff] bg-[#0f2240] border border-[#1e3a5f] rounded-full px-3 py-1">
          #{t}
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Crear `MarkdownBody.tsx`**

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-invert prose-headings:text-white prose-a:text-[#2997ff] max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}
```

- [ ] **Step 7: Crear `ServiceCard.tsx`**

```tsx
import Link from 'next/link'
import type { ServicioContent } from '@/lib/content'

export default function ServiceCard({ servicio }: { servicio: ServicioContent }) {
  return (
    <Link
      href={`/servicios/${servicio.slug}`}
      className="apple-card-dark p-6 block group hover:border-[#2997ff]/50 transition-colors"
    >
      <h3 className="text-white font-semibold mb-2 group-hover:text-[#2997ff] transition-colors">
        {servicio.title}
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{servicio.description}</p>
      <span className="inline-block mt-4 text-sm text-[#2997ff]">Ver más →</span>
    </Link>
  )
}
```

- [ ] **Step 8: Crear `ComunaCard.tsx`**

```tsx
import Link from 'next/link'
import type { ComunaContent } from '@/lib/content'

export default function ComunaCard({ comuna }: { comuna: ComunaContent }) {
  return (
    <Link
      href={`/comunas/${comuna.region}/${comuna.slug}`}
      className="apple-card-dark p-5 block group hover:border-[#2997ff]/50 transition-colors"
    >
      <h3 className="text-white font-semibold group-hover:text-[#2997ff] transition-colors">
        {comuna.name}
      </h3>
      <p className="text-slate-400 text-xs mt-1 line-clamp-2">{comuna.description}</p>
    </Link>
  )
}
```

- [ ] **Step 9: Crear `ArticleCard.tsx`**

```tsx
import Link from 'next/link'
import type { ArticuloContent } from '@/lib/content'

export default function ArticleCard({ articulo }: { articulo: ArticuloContent }) {
  return (
    <Link
      href={`/blog/${articulo.slug}`}
      className="apple-card-dark p-6 block group hover:border-[#2997ff]/50 transition-colors"
    >
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 font-mono">
        <time dateTime={articulo.date}>{articulo.date}</time>
        <span>· {articulo.readingMinutes} min de lectura</span>
      </div>
      <h3 className="text-white font-semibold group-hover:text-[#2997ff] transition-colors">
        {articulo.title}
      </h3>
      <p className="text-slate-400 text-sm mt-2 line-clamp-3">{articulo.description}</p>
    </Link>
  )
}
```

- [ ] **Step 10: Verificar compilación**

```bash
npx tsc --noEmit
```
Expected: 0 errores.

- [ ] **Step 11: Commit**

```bash
git add dashboard/src/components/seo/ dashboard/src/app/globals.css
git commit -m "feat seo: componentes reutilizables Breadcrumbs, FAQ, JsonLd, cards"
```

---

### Task 3: Rutas /servicios (índice + detalle) con contenido exemplar

**Files:**
- Create: `dashboard/src/app/servicios/page.tsx`
- Create: `dashboard/src/app/servicios/[slug]/page.tsx`
- Create: `dashboard/src/content/servicios/alarmas-para-casa.md`

**Interfaces:**
- Consumes: `getAllServicios`, `getServicio`, `getComunasByRegion`, componentes SEO (Tasks 1-2)
- Produces: rutas SSG `/servicios`, `/servicios/[slug]`; metadata con canonical, OG `/og-servicio.png`, keywords

- [ ] **Step 1: Escribir el contenido exemplar `alarmas-para-casa.md`**

```markdown
---
title: "Sistema de alarma para casa | GAMA"
description: "Sistema de alarma para casa con instalación profesional y monitoreo 24/7 en Chile. Alarms inalámbricas y cableadas. Cotiza sin costo."
keywords: [alarma para casa, sistema de alarma, alarmas para hogar, alarma inalambrica para casa, alarma casera]
hashtags: [SistemaDeAlarma, AlarmaParaCasa, SeguridadElectrónica, ProtegeTuHogar, GamaSecurity]
h1: "Sistema de alarma para casa"
faq:
  - question: "¿Cuánto cuesta instalar una alarma para casa en Chile?"
    answer: "Los sistemas de alarma para casa parten desde $199.900 e incluyen central, sensores y teclado. El valor final depende del tamaño de la vivienda y del plan de monitoreo elegido. Solicita una evaluación sin costo y te enviamos una propuesta con precio cerrado."
  - question: "¿Necesito internet para que funcione la alarma de mi casa?"
    answer: "No es obligatorio. Nuestras alarmas transmiten por IP y GPRS de forma redundante: si se cae el internet de tu hogar, la señal viaja por red celular y la central recibe la alerta igual."
  - question: "¿La alarma de casa avisa a mi celular?"
    answer: "Sí. Recibes notificaciones push en tu celular al instante y, si no confirmas, nuestra central de monitoreo 24/7 verifica el evento y coordina la respuesta según tu plan."
  - question: "¿Hacen instalación de alarmas en mi comuna?"
    answer: "Instalamos sistemas de alarma en toda la Región Metropolitana y Región de Valparaíso con técnicos propios. Agendamos la visita en menos de 48 horas hábiles."
relatedServicios: [alarmas-para-negocios, sistema-alarma-inalambrico, monitoreo-de-alarmas-24-7]
---

Proteger tu casa con un **sistema de alarma para casa** es la forma más efectiva de
disuadir robos y recibir alertas inmediatas ante cualquier intento de intrusión.
En GAMA SECURITY diseñamos, instalamos y monitoreamos alarmas residenciales
adaptadas al tamaño de tu vivienda, con respuesta verificada las 24 horas desde
nuestra central de operaciones.

## ¿Qué es un sistema de alarma para casa?

Un sistema de alarma residencial está compuesto por una central receptora, un
teclado de armado, sensores de apertura y movimiento, y un módulo de comunicación
que envía las señales a una central de monitoreo. Cuando alguien abre una puerta
o detecta movimiento en un sector de la casa, el sistema activa la sirena y
transmite el evento al instante. Nuestro equipo calibra cada sensor para evitar
falsas alarmas por mascotas o corrientes de aire, y te enseña a armar y desarmar
el sistema en menos de cinco minutos.

## Tipos de alarma para casa que instalamos

- **Alarma inalámbrica para casa:** sin obra civil, ideal para departamentos y
  casas en arriendo. Se comunica por radiofrecuencia y red celular.
- **Alarma cableada:** máxima estabilidad para casas en construcción o con
  remodelación en curso.
- **Alarma con app celular:** controla armado, desarmado y eventos desde tu
  teléfono, compatible con aplicaciones de monitoreo como NT CLICK.
- **Alarma con detectores de movimiento y contactos magnéticos** para puertas,
  ventanas y accesos secundarios.

## ¿Cuánto cuesta una alarma para casa?

| Componente | Rango de precio |
|---|---|
| Kit básico (central + 2 sensores + teclado) | $199.900 – $349.900 |
| Casa 3 dormitorios (4-6 sensores) | $349.900 – $549.900 |
| Plan de monitoreo 24/7 | desde $19.900/mes |
| Instalación profesional | incluida en la mayoría de los planes |

Los valores varían según la superficie, la cantidad de accesos y el tipo de
comunicación (IP/GPRS). La evaluación en tu hogar es gratuita y sin compromiso.

## Ventajas de una alarma monitoreada 24/7

- Detección inmediata de intrusión, incendio y emergencia médica.
- Verificación humana de cada señal: menos falsas alarmas, respuesta real.
- Notificación a tu celular y a tus contactos de confianza.
- Disuasión visible: las placas y la sirena reducen el riesgo de intento.
- Integración con cámaras y cerco eléctrico desde una sola plataforma.

## Proceso de instalación en 4 pasos

1. **Evaluación gratuita** en tu hogar: medimos accesos y puntos vulnerables.
2. **Propuesta técnica** con plano de zonas, equipos y precio cerrado.
3. **Instalación profesional** en 2 a 4 horas, sin dañar acabados.
4. **Capacitación y monitoreo:** te enseñamos a operarla y queda conectada a
   nuestra central 24/7 el mismo día.

## ¿Por qué elegir GAMA SECURITY?

Llevamos más de 20 años monitoreando propiedades en Chile. Nuestra central opera
con redundancia de energía y conectividad, por lo que seguimos recepcionando
señales aunque falle la red de tu sector. Trabajamos con tecnología de marcas
reconocidas del mercado (como DSC y Vetti), técnicos certificados y contratos de
mantención programada. Atendemos toda la Región Metropolitana y Región de
Valparaíso con tiempo de respuesta inferior a 2 minutos para eventos verificados.

#Alarmas #SistemaDeAlarma #SeguridadElectrónica #ProtegeTuHogar #Monitoreo24_7
```

- [ ] **Step 2: Crear índice `/servicios/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { getAllServicios } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import ServiceCard from '@/components/seo/ServiceCard'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Servicios de seguridad electrónica y corrientes débiles',
  description:
    'Alarmas para casa y negocios, monitoreo 24/7, cámaras de seguridad, cercos eléctricos, control de acceso, citofonía y más. Instalación profesional en Chile.',
  alternates: { canonical: '/servicios' },
  openGraph: { images: ['/og-servicio.png'] },
}

export default function ServiciosIndex() {
  const servicios = getAllServicios()
  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'ItemList',
        itemListElement: servicios.map((s, i) => ({
          '@type': 'ListItem', position: i + 1, name: s.title,
          url: `https://www.gamasecurity.cl/servicios/${s.slug}`,
        })),
      }} />
      <Breadcrumbs items={[{ label: 'Servicios', href: '/servicios' }]} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="apple-display-lg text-white mb-4">
          Servicios de seguridad electrónica y corrientes débiles
        </h1>
        <p className="text-slate-300 apple-lead max-w-3xl mb-10">
          Diseñamos e instalamos sistemas integrales de protección: alarmas, monitoreo
          24/7, videovigilancia, cercos eléctricos, control de acceso, citofonía,
          redes de datos y detección de incendio para hogares, comercios y empresas
          en la Región Metropolitana y Región de Valparaíso.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map(s => <ServiceCard key={s.slug} servicio={s} />)}
        </div>
        <Hashtags tags={['SeguridadElectrónica', 'SistemaDeAlarma', 'CámarasDeSeguridad', 'Monitoreo24_7', 'CorrientesDébiles', 'GamaSecurity']} />
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Crear detalle `/servicios/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllServicios, getServicio, getComunasByRegion } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Faq from '@/components/seo/Faq'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import MarkdownBody from '@/components/seo/MarkdownBody'
import ComunaCard from '@/components/seo/ComunaCard'
import ServiceCard from '@/components/seo/ServiceCard'

const SITE_URL = 'https://www.gamasecurity.cl'
const WA = 'https://wa.me/56991016912'

export function generateStaticParams() {
  return getAllServicios().map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const s = getServicio(slug)
  if (!s) return {}
  return {
    title: s.title,
    description: s.description,
    keywords: s.keywords,
    alternates: { canonical: `/servicios/${s.slug}` },
    openGraph: { title: s.title, description: s.description, images: ['/og-servicio.png'] },
    twitter: { card: 'summary_large_image', title: s.title, description: s.description },
  }
}

export default async function ServicioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = getServicio(slug)
  if (!s) notFound()

  const relacionados = s.relatedServicios.map(getServicio).filter(Boolean)
  const comunasTop = [...getComunasByRegion('rm'), ...getComunasByRegion('v-region')].slice(0, 5)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.title,
    description: s.description,
    provider: { '@type': 'Organization', name: 'GAMA SECURITY', url: SITE_URL },
    areaServed: [
      { '@type': 'State', name: 'Región Metropolitana' },
      { '@type': 'State', name: 'Región de Valparaíso' },
    ],
    url: `${SITE_URL}/servicios/${s.slug}`,
    telephone: '+56991016912',
  }

  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[
        { label: 'Servicios', href: '/servicios' },
        { label: s.title, href: `/servicios/${s.slug}` },
      ]} />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="space-y-4">
          <h1 className="apple-display-lg text-white">{s.h1}</h1>
          <div className="flex flex-wrap gap-3">
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-apple-primary text-sm py-2 px-5">Cotizar por WhatsApp</a>
            <a href="tel:+56991016912" className="btn-apple-secondary-dark text-sm py-2 px-5">Llamar +56 9 9101 6912</a>
          </div>
        </header>
        <MarkdownBody markdown={s.body} />
        <Hashtags tags={s.hashtags} />
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Comunas donde instalamos este servicio</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comunasTop.map(c => <ComunaCard key={`${c.region}-${c.slug}`} comuna={c} />)}
          </div>
        </section>
        <Faq items={s.faq} />
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Servicios relacionados</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relacionados.map(r => <ServiceCard key={r!.slug} servicio={r!} />)}
          </div>
        </section>
      </article>
    </main>
  )
}
```

- [ ] **Step 4: Build y verificar rutas**

```bash
$env:NODE_OPTIONS='--max-old-space-size=4096'; npm run build
```
Expected: PASS; rutas `○ /servicios` y `○ /servicios/alarmas-para-casa` presentes.

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/app/servicios/ dashboard/src/content/
git commit -m "feat seo: rutas de servicios SSG con primer contenido"
```

---

### Task 4: Contenido de servicios 1-10 (faltantes)

**Files:**
- Create: `dashboard/src/content/servicios/alarmas-para-negocios.md`
- Create: `dashboard/src/content/servicios/sistema-alarma-inalambrico.md`
- Create: `dashboard/src/content/servicios/sistema-alarma-cableada.md`
- Create: `dashboard/src/content/servicios/monitoreo-de-alarmas-24-7.md`
- Create: `dashboard/src/content/servicios/camaras-de-seguridad.md`
- Create: `dashboard/src/content/servicios/camaras-ip.md`
- Create: `dashboard/src/content/servicios/cerco-electrico.md`
- Create: `dashboard/src/content/servicios/control-de-acceso.md`
- Create: `dashboard/src/content/servicios/citofonia.md`
- Create: `dashboard/src/content/servicios/videoportero.md`

**Interfaces:**
- Consumes: frontmatter/estructura de `alarmas-para-casa.md` (Task 3), validador (Task 1)
- Produces: 10 `ServicioContent` válidos en `getAllServicios()`

**Reglas comunes (aplican a los 10 archivos):** título ≤60, desc ≤155 únicas, ≥5 keywords (incluye kw principal), ≥3 hashtags, h1, ≥4 FAQ con respuestas de 40+ palabras, ≥3 relatedServicios (slugs de la tabla), body ≥300 palabras con secciones `##` (¿Qué es…? / tipos o características / ¿Cuánto cuesta? + tabla / ventajas / proceso de instalación / ¿Por qué GAMA?) y hashtags inline `#Tag` al final. Prosa original por tema, sin copiar el exemplar.

**Especificación por archivo:**

| slug | title (≤60) | description (≤155) | kw principal | H2s del body | relatedServicios |
|---|---|---|---|---|---|
| `alarmas-para-negocios` | "Alarma para negocios y empresas \| GAMA" | "Alarmas para negocios, comercios y empresas con monitoreo 24/7. Protección antirrobo con verificación de señales. Cotiza hoy." | alarma para negocios | Alarma antirrobo para comercio; Multi-punto y multiusuario; Central con respaldo de energía; Alarmas para bodega y retail; Integración con cámaras | sistema-de-alarma-para-empresas, monitoreo-de-alarmas-24-7, camaras-de-seguridad |
| `sistema-alarma-inalambrico` | "Sistema de alarma inalámbrica \| GAMA" | "Sistema de alarma inalámbrica sin obra civil: instalación rápida, sensores por radiofrecuencia y transmisión celular. Evaluación gratis." | sistema alarma inalambrica | Cómo funciona la radiofrecuencia; Sensores inalámbricos; Sin obra civil; Baterías y autonomía; Alcance y repetidores | sistema-alarma-cableada, alarma-con-app, alarma-para-casa |
| `sistema-alarma-cableada` | "Sistema de alarma cableada \| GAMA" | "Alarmas cableadas de alta fiabilidad para casas y empresas en construcción. Sensores con línea dedicada e interferencias cero. Cotiza." | sistema alarma cableada | Cableado dedicado; Zonas y circuitos; Ventajas vs inalámbrica; Ideal en construcción; Mantención | sistema-alarma-inalambrico, sensores-de-presencia, sistemas-de-alarma-para-empresas |
| `monitoreo-de-alarmas-24-7` | "Monitoreo de alarmas 24/7 \| GAMA" | "Central de monitoreo de alarmas 24 horas, los 365 días. Verificación humana de señales en menos de 2 minutos en todo Chile." | monitoreo de alarmas 24 7 | Cómo opera la central; Tiempo de respuesta <2 min; Redundancia; Protocolos de verificación; Planes de monitoreo | alarmas-para-casa, alarma-para-negocios, deteccion-de-incendio |
| `camaras-de-seguridad` | "Cámaras de seguridad \| GAMA" | "Cámaras de seguridad y CCTV 4K con inteligencia artificial. Diseño, instalación y monitoreo de video para hogares y empresas." | camaras de seguridad | CCTV 4K y analítica IA; Cuántas cámaras según el espacio; Grabación local y nube; Instalación profesional; Monitoreo de video | camaras-ip, sensores-de-presencia, prevencion-de-robo |
| `camaras-ip` | "Cámaras IP y video vigilancia \| GAMA" | "Cámaras IP con acceso remoto desde el celular, grabación en la nube y analítica de video. Ideal para empresas y hogares." | camaras ip | IP vs analógico; Acceso remoto seguro; NVR y nube; Analítica de video; PoE y cableado | camaras-de-seguridad, redes-de-datos, sistemas-de-alarma-para-empresas |
| `cerco-electrico` | "Cerco eléctrico \| GAMA" | "Cercos eléctricos disuasivos para casas, quintas y plantas industriales, integrados a la central de monitoreo. Instalación certificada." | cerco electrico | Cercos de alta y baja tensión; Integración con monitoreo; Marco legal en Chile; Secciones y zonas; Mantención programada | prevencion-de-robo, sensores-de-presencia, camaras-de-seguridad |
| `control-de-acceso` | "Control de acceso \| GAMA" | "Control de acceso con tarjetas, biométrico y app para edificios, oficinas y comunas. Registro de ingresos y portones automáticos." | control de acceso | Tarjeta, PIN y biométrico; Control de portones; Registro de auditoría; App de acceso; Integración con alarmas | sistemas-de-alarma-para-empresas, citofonia, domotica |
| `citofonia` | "Citofonía \| GAMA" | "Sistemas de citofonía y videocitofonía para edificios y casas. Comunicación de áreas comunes y portería profesional." | citofonia | Citofonía convencional vs digital; Videocitofonía; Edificios multi-domicilio; Integración con portería; Instalación y mantención | videoportero, control-de-acceso, redes-de-datos |
| `videoportero` | "Videoporteros \| GAMA" | "Videoporteros y videocitofonía con cámara, apertura remota y visión nocturna. Seguridad en la entrada de tu hogar o edificio." | videoportero | Componentes (monitor y cámara); Apertura remota; Visión nocturna; Multi-apartamento vs casa; Videoportero IP | citofonia, control-de-acceso, domotica |

- [ ] **Step 1: Crear los 10 archivos** con la estructura y reglas anteriores.
- [ ] **Step 2: Validar** → `node scripts/validate-content.mjs` → `✓ contenido OK`.
- [ ] **Step 3: Build** → PASS con 11 rutas `/servicios/*` (10 + exemplar).
- [ ] **Step 4: Commit**

```bash
git add dashboard/src/content/servicios/
git commit -m "content servicios: 10 paginas (negocios, inalambrica, monitoreo, camaras, cerco, acceso, citofonia, videoportero)"
```

---

### Task 5: Contenido de servicios 11-20

**Files:**
- Create: `dashboard/src/content/servicios/deteccion-de-incendio.md`
- Create: `dashboard/src/content/servicios/prevencion-de-robo.md`
- Create: `dashboard/src/content/servicios/redes-de-datos.md`
- Create: `dashboard/src/content/servicios/sistemas-de-voceo.md`
- Create: `dashboard/src/content/servicios/domotica.md`
- Create: `dashboard/src/content/servicios/alarma-con-app.md`
- Create: `dashboard/src/content/servicios/sensores-de-presencia.md`
- Create: `dashboard/src/content/servicios/sistemas-de-alarma-para-empresas.md`
- Create: `dashboard/src/content/servicios/mantencion-de-sistemas-de-seguridad.md`

(Son 9: total 20 = 1 exemplar + 10 de Task 4 + 9 de Task 5.)

**Interfaces:** mismas reglas que Task 4. Produces 9 `ServicioContent` → total 20. Al cerrar este task el validador exige `relatedServicios` válidos entre los 20.

**Especificación por archivo:**

| slug | title (≤60) | description (≤155) | kw principal | H2s del body | relatedServicios |
|---|---|---|---|---|---|
| `deteccion-de-incendio` | "Detección de incendio \| GAMA" | "Sistemas de detección de incendio con detectores de humo y temperatura, alarma temprana y conexión 24/7 a nuestra central." | deteccion de incendio | Detectores de humo, temperatura y calor; Normativa Chile; Integración con central; Protocolo de emergencia; Mantención | monitoreo-de-alarmas-24-7, sistemas-de-alarma-para-empresas, alarma-para-negocios |
| `prevencion-de-robo` | "Prevención de robo \| GAMA" | "Prevención de robo con auditoría de seguridad, placas disuasivas, cercos y alarmas para comercios, bodegas y oficinas." | prevencion de robo | Auditoría de vulnerabilidades; Medidas disuasivas; Iluminación y señales visuales; Zonas calientes; Plan de respuesta | cerco-electrico, camaras-de-seguridad, alarma-para-negocios |
| `redes-de-datos` | "Redes de datos \| GAMA" | "Redes de datos y cableado estructurado CAT6 y fibra para empresas, edificios y data centers. Certificación y documentación incluida." | redes de datos | Cableado CAT6/6A y fibra; Rack y patch panel; Certificación; Estándar TIA; Soporte | camaras-ip, sistemas-de-voceo, control-de-acceso |
| `sistemas-de-voceo` | "Sistemas de voceo \| GAMA" | "Sistemas de voceo y música ambiente para colegios, plantas, iglesias y empresas. Altavoces, amplificadores e instalación profesional." | sistemas de voceo | Altavoces de línea de 100V; Amplificadores y zonas; Música ambiente; Emergencia y evacuación; Instalación | redes-de-datos, citofonia, sistemas-de-alarma-para-empresas |
| `domotica` | "Domótica \| GAMA" | "Domótica y automatización del hogar: iluminación, persianas, escenas y control por app. Integración con alarmas y cámaras." | domotica | Qué es la domótica; Escenas y automatizaciones; Control por app; Integración con seguridad; Instalación por etapas | alarma-con-app, control-de-acceso, videoportero |
| `alarma-con-app` | "Alarma con app para celular \| GAMA" | "Alarmas con aplicación para celular: arma, desarma y recibe alertas desde tu teléfono. Compatible con apps como NT CLICK." | alarma con app celular | Cómo funciona la app; Armado y desarmado remoto; Alertas push; Multiusuario para la familia; Requisitos de conexión | sistema-alarma-inalambrico, alarma-para-casa, monitoreo-de-alarmas-24-7 |
| `sensores-de-presencia` | "Sensores de presencia \| GAMA" | "Sensores de movimiento y presencia para interiores y exteriores. Detección perimetral con inmunidad a mascotas y clima." | sensores de presencia | Tipos de sensores (PIR, microonda, outdoor); Inmunidad a mascotas; Cobertura y ángulos; Ubicación óptima; Integración con alarma | sistema-alarma-inalambrico, camaras-de-seguridad, cerco-electrico |
| `sistemas-de-alarma-para-empresas` | "Sistemas de alarma para empresas \| GAMA" | "Alarmas para empresas multi-sede: zonas por área, usuarios por turno y reportes de armado y desarmado centralizados." | sistema de alarma para empresas | Multi-sede y zonas; Control por turnos; Reportes y auditoría; Integración con control de acceso; Escalamiento | alarmas-para-negocios, control-de-acceso, monitoreo-de-alarmas-24-7 |
| `mantencion-de-sistemas-de-seguridad` | "Mantención de sistemas de seguridad \| GAMA" | "Mantención preventiva de alarmas, cámaras y cercos eléctricos. Revisión de baterías, firmware y pruebas de señal." | mantencion sistemas seguridad | Mantención preventiva vs correctiva; Checklist (baterías, sensores, NVR); Frecuencia; Contratos de servicio; Beneficios | monitoreo-de-alarmas-24-7, camaras-de-seguridad, cerco-electrico |

- [ ] **Step 1: Crear los 9 archivos** con las reglas de Task 4.
- [ ] **Step 2: Validar** → `✓ contenido OK`.
- [ ] **Step 3: Build** → PASS con las 20 rutas `/servicios/[slug]`.
- [ ] **Step 4: Commit**

```bash
git add dashboard/src/content/servicios/
git commit -m "content servicios: completar catalogo de 20 servicios"
```

---

### Task 6: Rutas /comunas (índice + detalle) con exemplar

**Files:**
- Create: `dashboard/src/app/comunas/page.tsx`
- Create: `dashboard/src/app/comunas/[region]/[slug]/page.tsx`
- Create: `dashboard/src/content/comunas/v-region/villa-alemana.json`

**Interfaces:**
- Consumes: `getAllComunas`, `getComunasByRegion`, `getComuna`, `getServicio`, `REGION_LABELS`, componentes SEO
- Produces: rutas SSG `/comunas`, `/comunas/[region]/[slug]` (`[region]` ∈ `rm`|`v-region`)

- [ ] **Step 1: Crear exemplar `villa-alemana.json`**

```json
{
  "name": "Villa Alemana",
  "title": "Seguridad electrónica en Villa Alemana | GAMA",
  "description": "Sistemas de alarma, cámaras y cercos eléctricos en Villa Alemana. Instalación local, monitoreo 24/7 y respuesta rápida. Evaluación gratuita.",
  "keywords": ["alarma villa alemana", "camaras villa alemana", "seguridad electronica v region", "cerco electrico villa alemana", "alarmas quilpue"],
  "hashtags": ["VillaAlemana", "SeguridadElectrónica", "VRegión", "SistemaDeAlarma", "GamaSecurity"],
  "lead": "Protegemos hogares y empresas en Villa Alemana con sistemas de alarma, cámaras de seguridad y cercos eléctricos instalados por técnicos locales. Nuestra central de monitoreo opera 24 horas y coordina la respuesta en minutos para todo el sector de la comuna, desde el centro hasta Quilpué y el eje de la Ruta 68. Solicita una evaluación sin compromiso y conoce las opciones disponibles para tu propiedad.",
  "sectors": ["Centro Villa Alemana", "Las Palmas", "Quilpué sector norte", "Villa Alemana Sur", "Ruta 68 sector industrial", "Los Aromos", "El Melón"],
  "reasonExtra": "Somos una empresa con sede operativa en la zona, por lo que llegamos a Villa Alemana el mismo día en casos urgentes y agendamos instalaciones programadas en menos de 48 horas hábiles. Conocemos las comunas vecinas —Quilpué, Limache, Quillota y Olmué— y mantenemos técnicos disponibles en todo el eje Marga Marga. Cada sistema instalado en Villa Alemana queda conectado a nuestra central redundante, con verificación humana de señales y notificación inmediata a tu celular y a tus contactos de confianza según el plan que elijas.",
  "faq": [
    {"question": "¿Cuánto cuesta una alarma en Villa Alemana?", "answer": "Los kits de alarma para casa en Villa Alemana parten desde $199.900 e incluyen instalación y configuración. El precio final depende de la cantidad de accesos y del plan de monitoreo; la evaluación en tu propiedad es gratuita."},
    {"question": "¿Hacen instalación de cámaras en Villa Alemana?", "answer": "Sí. Instalamos cámaras IP y CCTV en casas, negocios y bodegas de Villa Alemana y comunas vecinas, con grabación local o en la nube y acceso desde tu celular."},
    {"question": "¿Cuánto demoran en responder una alarma en Villa Alemana?", "answer": "Nuestra central verifica la señal en menos de 2 minutos y, según tu plan, coordinamos contacto con carabineros o guardias en la comuna. El tiempo de traslado local suele ser inferior a 15 minutos."}
  ],
  "serviciosDestacados": ["alarmas-para-casa", "camaras-de-seguridad", "cerco-electrico", "monitoreo-de-alarmas-24-7", "control-de-acceso", "prevencion-de-robo"]
}
```

- [ ] **Step 2: Crear índice `/comunas/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { getComunasByRegion, REGION_LABELS } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import ComunaCard from '@/components/seo/ComunaCard'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Comunas donde instalamos seguridad electrónica',
  description:
    'Instalación de alarmas, cámaras y cercos eléctricos en 90 comunas de la Región Metropolitana y Región de Valparaíso. Encuentra tu comuna y cotiza.',
  alternates: { canonical: '/comunas' },
  openGraph: { images: ['/og-comuna.png'] },
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
```

- [ ] **Step 3: Crear detalle `/comunas/[region]/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllComunas, getComuna, getServicio, REGION_LABELS } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Faq from '@/components/seo/Faq'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import ServiceCard from '@/components/seo/ServiceCard'

const SITE_URL = 'https://www.gamasecurity.cl'
const WA = 'https://wa.me/56991016912'
const VALID_REGIONS = ['rm', 'v-region']

export function generateStaticParams() {
  return getAllComunas().map(c => ({ region: c.region, slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ region: string; slug: string }> }): Promise<Metadata> {
  const { region, slug } = await params
  const c = getComuna(region, slug)
  if (!c) return {}
  return {
    title: c.title,
    description: c.description,
    keywords: c.keywords,
    alternates: { canonical: `/comunas/${region}/${slug}` },
    openGraph: { title: c.title, description: c.description, images: ['/og-comuna.png'] },
    twitter: { card: 'summary_large_image', title: c.title, description: c.description },
  }
}

export default async function ComunaPage({ params }: { params: Promise<{ region: string; slug: string }> }) {
  const { region, slug } = await params
  if (!VALID_REGIONS.includes(region)) notFound()
  const c = getComuna(region, slug)
  if (!c) notFound()

  const servicios = c.serviciosDestacados.map(getServicio).filter(Boolean)
  const regionLabel = REGION_LABELS[region as 'rm' | 'v-region']

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'GAMA SECURITY',
    url: SITE_URL,
    telephone: '+56991016912',
    image: `${SITE_URL}/og-comuna.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Valparaíso 351',
      addressLocality: 'Villa Alemana',
      addressRegion: regionLabel,
      addressCountry: 'CL',
    },
    areaServed: { '@type': 'City', name: c.name },
    openingHours: 'Mo-Fr 09:00-18:00',
    priceRange: '$$',
  }

  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[
        { label: 'Comunas', href: '/comunas' },
        { label: regionLabel, href: '/comunas' },
        { label: c.name, href: `/comunas/${region}/${slug}` },
      ]} />
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <header className="space-y-4">
          <h1 className="apple-display-lg text-white">
            Sistemas de alarma y seguridad electrónica en {c.name}
          </h1>
          <p className="text-slate-300 apple-lead">{c.lead}</p>
          <div className="flex flex-wrap gap-3">
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-apple-primary text-sm py-2 px-5">Cotizar en {c.name}</a>
            <a href="tel:+56991016912" className="btn-apple-secondary-dark text-sm py-2 px-5">Llamar +56 9 9101 6912</a>
          </div>
        </header>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Servicios disponibles en {c.name}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map(s => <ServiceCard key={s!.slug} servicio={s!} />)}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Zonas y sectores que cubrimos en {c.name}</h2>
          <ul className="flex flex-wrap gap-2">
            {c.sectors.map(sec => (
              <li key={sec} className="text-sm text-slate-300 bg-[#0f2240] border border-[#1e3a5f] rounded-full px-4 py-1.5">
                {sec}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">¿Por qué elegir GAMA en {c.name}?</h2>
          <p className="text-slate-300 leading-relaxed">{c.reasonExtra}</p>
        </section>

        <Hashtags tags={c.hashtags} />
        <Faq items={c.faq} />
      </article>
    </main>
  )
}
```

- [ ] **Step 4: Build y verificar rutas**

```bash
$env:NODE_OPTIONS='--max-old-space-size=4096'; npm run build
```
Expected: PASS; `○ /comunas` y `○ /comunas/v-region/villa-alemana`.

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/app/comunas/ dashboard/src/content/comunas/
git commit -m "feat seo: rutas de comunas SSG con exemplar Villa Alemana"
```

---

### Task 7: Contenido comunas RM (52 archivos)

**Files:**
- Create: `dashboard/src/content/comunas/rm/*.json` — 52 archivos

**Interfaces:**
- Consumes: esquema JSON del exemplar `villa-alemana.json` (Task 6); `serviciosDestacados` deben ser slugs de los 20 servicios (Tasks 3-5)
- Produces: 52 `ComunaContent` con `region: "rm"` (el campo region lo agrega el loader; NO incluirlo en el JSON)

**Lista oficial RM (52)** — slug = nombre sin acentos en minúsculas con guiones:

`santiago, cerrillos, cerro-navia, conchali, el-bosque, estacion-central, huechuraba, independencia, la-cisterna, la-florida, la-granja, la-pintana, la-reina, las-condes, lo-barnechea, lo-espejo, lo-prado, macul, maipu, nunoa, padre-hurtado, penalolen, providencia, pudahuel, quilicura, quinta-normal, recoleta, renca, san-bernardo, san-joaquin, san-miguel, san-ramon, vitacura, puente-alto, pirque, san-jose-de-maipo, colina, lampa, tiltil, san-antonio, buin, calera-de-tango, paine, melipilla, talagante, el-monte, isla-de-maipo, penaflor, curacavi, maria-pinto, san-pedro, peñagolpe (verificar nombre oficial de la 52ª: puede ser `santiago` duplicado — contar archivos al final: deben ser EXACTAMENTE 52; si la lista anterior da 51, verificar en https://es.wikipedia.org/wiki/Anexo:Comunas_de_la_Regi%C3%B3n_Metropolitana_de_Santiago la comuna faltante y añadirla).`

**Reglas de contenido único por comuna (CRÍTICO anti-thin-content):**
- `name`: Nombre visible con acento original (\"Ñuñoa\", \"Maipú\").
- `title` ≤60: `\"Seguridad electrónica en {Comuna} | GAMA\"` (si no cabe: `\"Alarmas y cámaras en {Comuna} | GAMA\"`).
- `description` ≤155, única por comuna.
- `keywords` ≥5: `\"alarma {slug-humano}\"`, `\"camaras {slug-humano}\"`, `\"seguridad electronica {slug-humano}\"`, + 2 locales.
- `hashtags` ≥3: `[\"{ComunaSinAcento}\", \"SeguridadElectrónica\", \"SistemaDeAlarma\", ...]`.
- `lead` ≥40 palabras: comuna + 1-2 referencias geográficas REALES (plaza, avenida principal, radio de cobertura) + llamado a cotizar. **Estructura y frases distintas en cada comuna** (no repetir el mismo párrafo con el nombre cambiado).
- `sectors`: 5-7 barrios/sectores REALES de esa comuna (ej. Santiago: Lastarria, Bellavista, Barrio Italia, Estación Central, Santa Lucía, Cívico, Yungay; Las Condes: El Golf, Apoquindo, Los Leones, Escuela Militar, Lo Curro; Providencia: Manuel Montt, Pedro de Valdivia, Los Leones, Italia, Ensueño).
- `reasonExtra` ≥80 palabras: tiempo de respuesta, técnicos en la zona, comunas vecinas específicas de esa comuna (distintas por comuna).
- `faq` ≥3 con `{Comuna}` interpolado en al menos 2 preguntas; respuestas 40+ palabras.
- `serviciosDestacados`: 6-8 slugs reales. Residenciales (la-florida, puente-alto, maipu, nunoa, la-reina, penalolen…): `alarmas-para-casa, camaras-de-seguridad, sistema-alarma-inalambrico, monitoreo-de-alarmas-24-7, cerco-electrico, alarma-con-app`. Comerciales/industriales (santiago, providencia, las-condes, quilicura, estacion-central, san-bernardo, huechuraba, macul…): añadir `alarmas-para-negocios` o `sistemas-de-alarma-para-empresas` o `control-de-acceso`.

- [ ] **Step 1: Crear los 52 JSON** con el mismo shape que `villa-alemana.json` (sin campo `region`), siguiendo las reglas anteriores; interpolar `{Comuna}` y sectores reales.
- [ ] **Step 2: Contar archivos** → `Get-ChildItem dashboard/src/content/comunas/rm/*.json | Measure-Object` → debe ser 52; si no, verificar la lista oficial en Wikipedia y corregir.
- [ ] **Step 3: Validar** → `node scripts/validate-content.mjs` → `✓ contenido OK`.
- [ ] **Step 4: Build** → PASS con 52 rutas `/comunas/rm/*`.
- [ ] **Step 5: Commit**

```bash
git add dashboard/src/content/comunas/rm/
git commit -m "content comunas: 52 comunas de la Region Metropolitana"
```

---

### Task 8: Contenido comunas V Región (38 archivos)

**Files:**
- Create: `dashboard/src/content/comunas/v-region/*.json` — 37 archivos (villa-alemana.json ya existe de Task 6)

**Interfaces:** mismo esquema y reglas que Task 7. Produces 38 `ComunaContent` con región `v-region`.

**Lista candidata V Región (38)** — verificar obligatoriamente contra la fuente oficial antes de crear:

`valparaiso, vina-del-mar, concon, quilpue, quintero, puchuncavi, casablanca, san-antonio, cartagena, el-quisco, algarrobo, el-tabo, santo-domingo, san-felipe, los-andes, calle-larga, rinconada, santa-maria, panquehue, quillota, la-calera, hijuelas, la-ligua, petorca, zapallar, papudo, cabildo, nogales, la-cruz, limache, olmue, putaendo, llay-llay, catemu, maria-pinto, santiago? (NO — santiago es RM; eliminar), ...`

- [ ] **Step 1: Verificar lista oficial (OBLIGATORIO)**

```bash
# Fuente: https://es.wikipedia.org/wiki/Anexo:Comunas_de_la_Región_de_Valparaíso
```
Abrir la fuente, confirmar las 38 comunas oficiales, corregir la lista candidata (quitar inexistentes, agregar faltantes). Este paso evita publicar comunas falsas.

- [ ] **Step 2: Crear los 37 JSON faltantes** con las mismas reglas que Task 7. Ajustes por tipo de comuna: costeras (algarrobo, el-tabo, papudo, zapallar, cartagena, el-quisco, puchuncavi, quintero, concon, santo-domingo): priorizar `cerco-electrico` y `camaras-de-seguridad`; urbanas/comerciales (valparaiso, vina-del-mar): añadir `sistemas-de-alarma-para-empresas` y `control-de-acceso`. Sectores/sectores reales por comuna (ej. Viña del Mar: Cerro Castillo, Placeres, Oscuro, Barón, Concón sector cordillera; Valparaíño: Puerto, Barón, Arturo Prat, Playa Ancha, Evangelista).

- [ ] **Step 3: Contar** → total archivos en `comunas/v-region/` = 38; total global = 90.
- [ ] **Step 4: Validar** → `✓ contenido OK`.
- [ ] **Step 5: Build** → PASS con 90 rutas `/comunas/*`.
- [ ] **Step 6: Commit**

```bash
git add dashboard/src/content/comunas/v-region/
git commit -m "content comunas: 38 comunas de la Quinta Region"
```

---

### Task 9: Rutas /blog (índice + detalle) con artículo exemplar

**Files:**
- Create: `dashboard/src/app/blog/page.tsx`
- Create: `dashboard/src/app/blog/[slug]/page.tsx`
- Create: `dashboard/src/content/blog/alarma-inalambrica-vs-cableada.md`

**Interfaces:**
- Consumes: `getAllArticulos`, `getArticulo`, `getServicio`, componentes SEO
- Produces: rutas SSG `/blog`, `/blog/[slug]`

- [ ] **Step 1: Crear artículo exemplar `alarma-inalambrica-vs-cableada.md`**

Frontmatter (completo):

```yaml
---
title: "Alarma inalámbrica vs cableada: cuál elegir"
description: "Comparativa completa entre alarma inalámbrica y cableada: precio, instalación, fiabilidad y cuál conviene para tu casa o negocio en Chile."
keywords: [alarma inalambrica vs cableada, alarma inalambrica, alarma cableada, sistema de alarma, comparativa alarmas]
hashtags: [AlarmaInalambrica, AlarmaCableada, SistemaDeAlarma, SeguridadElectrónica, GamaSecurity]
h1: "Alarma inalámbrica vs cableada: cuál elegir para tu propiedad"
date: 2026-09-15
readingMinutes: 8
faq:
  - question: "¿Cuál es mejor, alarma inalámbrica o cableada?"
    answer: "La alarma inalámbrica es mejor para casas terminadas, departamentos y arriendos porque no requiere obra civil. La cableada ofrece mayor estabilidad en instalaciones nuevas o remodelaciones. La decisión depende de tu propiedad y del presupuesto; una evaluación gratuita lo define."
  - question: "¿La alarma inalámbrica es confiable?"
    answer: "Sí. Las alarmas inalámbricas modernas usan encriptación y supervisión de batería; si un sensor se desconecta o la pila baja, la central recibe el aviso al instante. Sumado al monitoreo 24/7, la fiabilidad es comparable a la cableada."
  - question: "¿Cuánto cuesta instalar cada tipo de alarma?"
    answer: "Un kit inalámbrico de casa parte desde $199.900 con instalación incluida. Una cableada puede costar entre un 15% y un 30% más por materiales y mano de obra del tendido. En ambos casos el plan de mensual de monitoreo es similar."
relatedServicios: [sistema-alarma-inalambrico, sistema-alarma-cableada, alarma-para-casa]
---
```

**Cuerpo (≥1200 palabras) — esquema con contenido obligatorio por sección (el ejecutor expande cada punto a prosa de 150-250 palabras; NO dejar puntos ni `...`):**

1. Intro (80-100 palabras): dilema inalámbrica vs cableada al proteger casa/negocio en Chile.
2. `## ¿Cómo funciona una alarma inalámbrica?` — sensores PIR/contactos con radiofrecuencia encriptada al panel; transmisión IP+GPRS; supervisión de batería; sin cables desde sensor a central.
3. `## ¿Cómo funciona una alarma cableada?` — línea dedicada por cada sensor al panel (zonas cableadas); alimentación central; mayor inmunidad a interferencias; requiere tendido con tubing.
4. `## Comparativa: instalación, precio y fiabilidad` — tabla Markdown: Instalación (1-2h sin obra / 3-6h con obra), Obra civil (No / Sí), Precio kit (desde $199.900 / desde $259.900), Ideal para (casas terminadas y arriendos / obras nuevas), Mantención (baterías / revisión de cableado), Fiabilidad (alta con supervisión / muy alta).
5. `## ¿Cuál te conviene? Casos de uso` — departamento: inalámbrica; casa en arriendo: inalámbrica; casa nueva en obra: cableada; negocio con estructura existente: inalámbrica; industrial greenfield: cableada.
6. `## Errores comunes al elegir` — elegir solo por precio, no considerar monitoreo, no pedir plano de zonas, ignorar mantenimiento de baterías, instalar sin evaluación.
7. `## Preguntas frecuentes respondidas` — reformular las 3 FAQ del frontmatter en prosa.
8. Conclusión (100 palabras) + CTA: evaluación gratuita, WhatsApp +56 9 9101 6912, enlaces internos a `/servicios/sistema-alarma-inalambrico` y `/servicios/sistema-alarma-cableada`.
9. Línea final de hashtags inline: `#AlarmaInalambrica #AlarmaCableada #SistemaDeAlarma #SeguridadElectrónica`.

- [ ] **Step 2: Crear índice `/blog/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { getAllArticulos } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import ArticleCard from '@/components/seo/ArticleCard'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Blog de seguridad electrónica',
  description:
    'Guías sobre alarmas, cámaras, cercos eléctricos y monitoreo 24/7: precios, comparativas y consejos para proteger tu hogar o negocio en Chile.',
  alternates: { canonical: '/blog' },
  openGraph: { images: ['/og-blog.png'] },
}

export default function BlogIndex() {
  const articulos = getAllArticulos()
  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Blog',
        name: 'Blog GAMA SECURITY',
        blogPost: articulos.map(a => ({
          '@type': 'BlogPosting', headline: a.title,
          url: `https://www.gamasecurity.cl/blog/${a.slug}`, datePublished: a.date,
        })),
      }} />
      <Breadcrumbs items={[{ label: 'Blog', href: '/blog' }]} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="apple-display-lg text-white mb-4">Blog de seguridad electrónica</h1>
        <p className="text-slate-300 apple-lead max-w-3xl mb-10">
          Guías prácticas, comparativas y precios de sistemas de alarma, cámaras de
          seguridad y monitoreo 24/7 para hogares y empresas en Chile.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articulos.map(a => <ArticleCard key={a.slug} articulo={a} />)}
        </div>
        <Hashtags tags={['BlogSeguridad', 'SistemaDeAlarma', 'CámarasDeSeguridad', 'Monitoreo24_7', 'GamaSecurity']} />
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Crear detalle `/blog/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllArticulos, getArticulo, getServicio } from '@/lib/content'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Faq from '@/components/seo/Faq'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import MarkdownBody from '@/components/seo/MarkdownBody'
import ServiceCard from '@/components/seo/ServiceCard'

const SITE_URL = 'https://www.gamasecurity.cl'

export function generateStaticParams() {
  return getAllArticulos().map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const a = getArticulo(slug)
  if (!a) return {}
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: {
      type: 'article', title: a.title, description: a.description,
      publishedTime: a.date, images: ['/og-blog.png'],
    },
    twitter: { card: 'summary_large_image', title: a.title, description: a.description },
  }
}

export default async function ArticuloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const a = getArticulo(slug)
  if (!a) notFound()

  const servicios = a.relatedServicios.map(getServicio).filter(Boolean)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    author: { '@type': 'Organization', name: 'GAMA SECURITY' },
    publisher: { '@type': 'Organization', name: 'GAMA SECURITY', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${a.slug}`,
    image: `${SITE_URL}/og-blog.png`,
  }

  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[
        { label: 'Blog', href: '/blog' },
        { label: a.title, href: `/blog/${a.slug}` },
      ]} />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <time dateTime={a.date}>{a.date}</time>
            <span>· {a.readingMinutes} min de lectura</span>
          </div>
          <h1 className="apple-display-lg text-white">{a.h1}</h1>
        </header>
        <MarkdownBody markdown={a.body} />
        <Hashtags tags={a.hashtags} />
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Servicios relacionados</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map(s => <ServiceCard key={s!.slug} servicio={s!} />)}
          </div>
        </section>
        <Faq items={a.faq} />
      </article>
    </main>
  )
}
```

- [ ] **Step 4: Escribir el cuerpo completo del exemplar** (≥1200 palabras) siguiendo el esquema del Step 1.
- [ ] **Step 5: Validar + Build**

```bash
node scripts/validate-content.mjs
$env:NODE_OPTIONS='--max-old-space-size=4096'; npm run build
```
Expected: `✓ contenido OK`; rutas `○ /blog` y `○ /blog/alarma-inalambrica-vs-cableada`.

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/app/blog/ dashboard/src/content/blog/
git commit -m "feat seo: rutas de blog SSG con primer articulo"
```

---

### Task 10: Artículos de blog 1-11 (faltantes)

**Files:**
- Create: `dashboard/src/content/blog/cuanto-cuesta-sistema-de-alarma-chile-2026.md`
- Create: `dashboard/src/content/blog/como-elegir-alarmas-para-casa.md`
- Create: `dashboard/src/content/blog/alarmas-para-negocios-y-comercios.md`
- Create: `dashboard/src/content/blog/monitoreo-24-7-que-es.md`
- Create: `dashboard/src/content/blog/camaras-de-seguridad-cuantas-necesitas.md`
- Create: `dashboard/src/content/blog/cerco-electrico-legalidad-chile.md`
- Create: `dashboard/src/content/blog/sistemas-de-deteccion-de-incendio.md`
- Create: `dashboard/src/content/blog/control-de-acceso-empresas.md`
- Create: `dashboard/src/content/blog/citofonia-y-videocitofonia-guia.md`
- Create: `dashboard/src/content/blog/domotica-para-hogar-inteligente.md`
- Create: `dashboard/src/content/blog/prevencion-de-robo-en-comercios.md`

**Interfaces:**
- Consumes: frontmatter/estructura del exemplar (Task 9), validador (≥1200 palabras)
- Produces: 11 `ArticuloContent` (total con exemplar = 12)

**Reglas comunes:** título ≤60, desc ≤155 únicas, ≥5 keywords, ≥3 hashtags, h1, date `2026-09-XX`, readingMinutes 7-10, ≥3 FAQ (respuestas 40+ palabras), ≥3 relatedServicios; body ≥1200 palabras con 6-8 secciones `##` de 150-250 palabras, 1 tabla comparativa, hashtags inline al final y 3-5 enlaces internos en prosa a `/servicios/...`. Keyword genérica, no de marca.

**Especificación por archivo:**

| slug | title (≤60) | kw principal | H2 principales | relatedServicios |
|---|---|---|---|---|
| `cuanto-cuesta-sistema-de-alarma-chile-2026` | "¿Cuánto cuesta un sistema de alarma en Chile? 2026" | precio sistema de alarma | Precio del kit; Monitoreo mensual; Instalación; Factores que suben el precio; Tabla resumen 2026 | alarma-para-casa, sistema-alarma-inalambrico, monitoreo-de-alarmas-24-7 |
| `como-elegir-alarmas-para-casa` | "Cómo elegir alarmas para casa: guía 2026" | como elegir alarma para casa | Evaluación de accesos; Inalámbrica vs cableada; Cuántos sensores; App y monitoreo; Checklist de compra | alarma-para-casa, sistema-alarma-inalambrico, alarma-con-app |
| `alarmas-para-negocios-y-comercios` | "Alarmas para negocios y comercios: guía" | alarma para comercio | Riesgos del retail; Multi-punto y horarios; Reportes de armado; Integración con cámaras; Costo vs beneficio | alarma-para-negocios, camaras-de-seguridad, prevencion-de-robo |
| `monitoreo-24-7-que-es` | "Monitoreo 24/7: qué es y cómo funciona" | monitoreo 24 7 | Definición; Cómo recibe la central las señales; Verificación humana; Qué pasa ante una alarma; IP vs GPRS | monitoreo-de-alarmas-24-7, alarmas-para-casa, sistemas-de-alarma-para-empresas |
| `camaras-de-seguridad-cuantas-necesitas` | "¿Cuántas cámaras de seguridad necesitas?" | cuantas camaras de seguridad | Regla por superficie; Puntos críticos; Interiores vs exteriores; 4K vs 1080p; Tabla por tipo de local | camaras-de-seguridad, camaras-ip, prevencion-de-robo |
| `cerco-electrico-legalidad-chile` | "Cerco eléctrico en Chile: ¿es legal?" | cerco electrico legal chile | Normativa; Requisitos de instalación; Cercos vs rejas; Integración con monitoreo; Mantención | cerco-electrico, prevencion-de-robo, sensores-de-presencia |
| `sistemas-de-deteccion-de-incendio` | "Detección de incendio: guía para empresas" | deteccion de incendio | Detectores (humo, calor, llama); Normativa chilena; Integración con central; Protocolo de evacuación; Mantención | deteccion-de-incendio, monitoreo-de-alarmas-24-7, sistemas-de-alarma-para-empresas |
| `control-de-acceso-empresas` | "Control de acceso para empresas" | control de acceso empresa | Credenciales vs biométrico; Registro de auditoría; Portones y torniquetes; Integración con alarmas; Escalabilidad | control-de-acceso, sistemas-de-alarma-para-empresas, citofonia |
| `citofonia-y-videocitofonia-guia` | "Citofonía y videocitofonía: guía de compra" | citofonia y videocitofonia | Convencional vs digital; Videocitofonía IP; Multi-domicilio; Intercomunicación de áreas comunes; Instalación | citofonia, videoportero, redes-de-datos |
| `domotica-para-hogar-inteligente` | "Domótica para hogar inteligente: cómo empezar" | domotica hogar inteligente | Qué incluye; Escenas; Seguridad + domótica; Ahorro energético; Presupuesto por etapas | domotica, alarma-con-app, control-de-acceso |
| `prevencion-de-robo-en-comercios` | "Prevención de robo en comercios" | prevencion de robo comercio | Diagnóstico; Disuasión visual; Alarmas y cámaras; Iluminación y accesos; Protocolo del personal | prevencion-de-robo, alarma-para-negocios, camaras-de-seguridad |

- [ ] **Step 1: Crear los 11 artículos** (≥1200 palabras cada uno, prosa original por tema, tabla, FAQ, enlaces internos).
- [ ] **Step 2: Validar** → `✓ contenido OK`.
- [ ] **Step 3: Build** → PASS con 12 rutas `/blog/*`.
- [ ] **Step 4: Commit**

```bash
git add dashboard/src/content/blog/
git commit -m "content blog: 11 articulos guia de seguridad electronica"
```

---

### Task 11: Artículos de blog restantes (total 20)

**Files:**
- Create: `dashboard/src/content/blog/alarma-con-app-celular-como-funciona.md`
- Create: `dashboard/src/content/blog/mantencion-de-sistemas-de-seguridad.md`
- Create: `dashboard/src/content/blog/sensores-de-presencia-y-deteccion-perimetral.md`
- Create: `dashboard/src/content/blog/redes-de-datos-estructurados-empresas.md`
- Create: `dashboard/src/content/blog/voceo-y-musica-ambiente-profesional.md`
- Create: `dashboard/src/content/blog/cctv-ip-vs-analogico.md`
- Create: `dashboard/src/content/blog/sistema-de-alarma-para-condominios.md`
- Create: `dashboard/src/content/blog/errores-comunes-al-contratar-seguridad-electronica.md`

**Interfaces:** mismas reglas que Task 10. Produces 8 artículos → total 20.

**Especificación por archivo:**

| slug | title (≤60) | kw principal | H2 principales | relatedServicios |
|---|---|---|---|---|
| `alarma-con-app-celular-como-funciona` | "Alarma con app celular: cómo funciona" | alarma con app | Armar y desarmar remoto; Alertas push; Multiusuario; Requisitos técnicos; Seguridad de la app | alarma-con-app, sistema-alarma-inalambrico, monitoreo-de-alarmas-24-7 |
| `mantencion-de-sistemas-de-seguridad` | "Mantención de sistemas de seguridad" | mantencion sistemas seguridad | Preventiva vs correctiva; Checklist; Frecuencia; Contratos; Señales de falla | mantencion-de-sistemas-de-seguridad, camaras-de-seguridad, cerco-electrico |
| `sensores-de-presencia-y-deteccion-perimetral` | "Sensores de presencia y detección perimetral" | sensores de presencia | Tipos PIR y microonda; Indoor vs outdoor; Inmunidad a mascotas; Ubicación; Integración | sensores-de-presencia, sistema-alarma-inalambrico, cerco-electrico |
| `redes-de-datos-estructurados-empresas` | "Redes de datos estructurados para empresas" | redes de datos estructurados | CAT6 vs fibra; Rack y patch; Certificación; Normas; Convergencia CCTV + datos | redes-de-datos, camaras-ip, sistemas-de-voceo |
| `voceo-y-musica-ambiente-profesional` | "Voceo y música ambiente profesional" | voceo musica ambiente | Sistemas de 100V; Zonificación; Emergencias; Equipamiento; Casos (colegios, plantas) | sistemas-de-voceo, redes-de-datos, citofonia |
| `cctv-ip-vs-analogico` | "CCTV IP vs analógico: cuál elegir" | cctv ip vs analogico | Resolución; Cableado; Acceso remoto; Costo; Cuándo sigue conveniendo analógico | camaras-ip, camaras-de-seguridad, redes-de-datos |
| `sistema-de-alarma-para-condominios` | "Sistema de alarma para condominios" | alarma condominio | Zonas comunes vs privadas; Armado por administración; Videocitofonía; Presupuesto de consorcio; Normativa | sistemas-de-alarma-para-empresas, control-de-acceso, citofonia |
| `errores-comunes-al-contratar-seguridad-electronica` | "Errores al contratar seguridad electrónica" | errores contratar seguridad electronica | Elegir solo por precio; Sin monitoreo; Instalador sin certificación; Sin mantención; Sin contrato claro | mantencion-de-sistemas-de-seguridad, monitoreo-de-alarmas-24-7, alarma-para-casa |

- [ ] **Step 1: Crear los 8 artículos** (mismas reglas que Task 10).
- [ ] **Step 2: Validar** → `✓ contenido OK` (20 artículos).
- [ ] **Step 3: Build** → PASS con 21 rutas `/blog/*`.
- [ ] **Step 4: Commit**

```bash
git add dashboard/src/content/blog/
git commit -m "content blog: completar 20 articulos"
```

---

### Task 12: Página /contacto

**Files:**
- Create: `dashboard/src/app/contacto/page.tsx`
- Create: `dashboard/src/app/contacto/ContactForm.tsx`
- Read: `dashboard/src/app/api/contacto-landing/route.ts` (SOLO leer, NO modificar)

**Interfaces:**
- Consumes: API existente `POST /api/contacto-landing` (NO modificar); componentes SEO
- Produces: ruta SSG `/contacto` con H1, datos de contacto, formulario client, FAQ ×4, JSON-LD ContactPage + FAQPage

- [ ] **Step 1: Leer `route.ts` de `/api/contacto-landing`** y anotar los campos exactos que espera el body (nombre, email, teléfono, mensaje, etc.). Ajustar los `name` del formulario del Step 2 a esos campos.

- [ ] **Step 2: Crear `ContactForm.tsx`** (client) con los campos reales de la API:

```tsx
'use client'

import { useState } from 'react'

const inputCls =
  'w-full bg-[#0f2240] border border-[#1e3a5f] rounded-lg px-4 py-3 text-white placeholder:text-slate-500'

export default function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries())
    try {
      const res = await fetch('/api/contacto-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setState(res.ok ? 'ok' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'ok') {
    return (
      <div className="apple-card-dark p-8 text-center space-y-3">
        <h3 className="text-white text-xl font-semibold">¡Solicitud recibida!</h3>
        <p className="text-slate-300">Te contactaremos dentro de las próximas 24 horas hábiles.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="apple-card-dark p-6 sm:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <input name="nombre" required placeholder="Nombre y apellido" aria-label="Nombre" className={inputCls} />
        <input name="telefono" required placeholder="Teléfono" aria-label="Teléfono" className={inputCls} />
      </div>
      <input name="email" type="email" placeholder="Email (opcional)" aria-label="Email" className={inputCls} />
      <input name="comuna" placeholder="Comuna" aria-label="Comuna" className={inputCls} />
      <textarea
        name="mensaje" required rows={4}
        placeholder="¿Qué necesitas proteger? (casa, negocio, oficina…)"
        aria-label="Mensaje" className={inputCls}
      />
      <button type="submit" disabled={state === 'sending'} className="btn-apple-primary w-full justify-center py-3">
        {state === 'sending' ? 'Enviando…' : 'Enviar solicitud'}
      </button>
      {state === 'error' && (
        <p className="text-red-400 text-sm">
          No se pudo enviar. Escríbenos por WhatsApp al +56 9 9101 6912.
        </p>
      )}
    </form>
  )
}
```

(Ajustar `name`s a la API según Step 1.)

- [ ] **Step 3: Crear `page.tsx`**

```tsx
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import Faq from '@/components/seo/Faq'
import Hashtags from '@/components/seo/Hashtags'
import JsonLd from '@/components/seo/JsonLd'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Contacta a GAMA SECURITY: cotiza sistemas de alarma, cámaras y monitoreo 24/7 en Chile. WhatsApp +56 9 9101 6912, evaluación sin costo.',
  alternates: { canonical: '/contacto' },
  openGraph: { images: ['/og-gama.png'] },
}

const WA = 'https://wa.me/56991016912'

const faq = [
  {
    question: '¿La evaluación tiene costo?',
    answer:
      'No. La evaluación inicial en tu propiedad es gratuita y sin compromiso; te entregamos una propuesta técnica con precio cerrado.',
  },
  {
    question: '¿En qué comunas atienden?',
    answer:
      'Instalamos y monitoreamos en las 52 comunas de la Región Metropolitana y las 38 de la Región de Valparaíso, con técnicos propios.',
  },
  {
    question: '¿Cuánto demoran en responder?',
    answer:
      'Nuestra central de monitoreo opera 24/7 y verifica cada señal en menos de 2 minutos. Para visitas técnicas agendamos en menos de 48 horas hábiles.',
  },
  {
    question: '¿Cómo cotizo alarma, cámaras o cerco eléctrico?',
    answer:
      'Completa el formulario, escríbenos por WhatsApp al +56 9 9101 6912 o llama al mismo número. Respondemos en el día hábil.',
  },
]

export default function ContactoPage() {
  return (
    <main className="min-h-screen bg-[#050d1a]">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          url: 'https://www.gamasecurity.cl/contacto',
          name: 'Contacto GAMA SECURITY',
        }}
      />
      <Breadcrumbs items={[{ label: 'Contacto', href: '/contacto' }]} />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <header className="space-y-4">
          <h1 className="apple-display-lg text-white">Contacto y cotización</h1>
          <p className="text-slate-300 apple-lead max-w-3xl">
            Cuéntanos qué necesitas proteger — casa, negocio, oficina o comuna — y te
            enviamos una propuesta técnica sin costo. También puedes escribirnos por
            WhatsApp o llamar directo a nuestra central.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <ContactForm />
          <div className="space-y-4">
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="apple-card-dark p-6 block hover:border-[#2997ff]/50 transition-colors">
              <h2 className="text-white font-semibold mb-1">WhatsApp</h2>
              <p className="text-[#2997ff] text-sm">+56 9 9101 6912 →</p>
            </a>
            <a href="tel:+56991016912" className="apple-card-dark p-6 block hover:border-[#2997ff]/50 transition-colors">
              <h2 className="text-white font-semibold mb-1">Teléfono</h2>
              <p className="text-[#2997ff] text-sm">+56 9 9101 6912</p>
            </a>
            <a href="mailto:contacto@gamasecurity.cl" className="apple-card-dark p-6 block hover:border-[#2997ff]/50 transition-colors">
              <h2 className="text-white font-semibold mb-1">Email</h2>
              <p className="text-[#2997ff] text-sm">contacto@gamasecurity.cl</p>
            </a>
            <div className="apple-card-dark p-6">
              <h2 className="text-white font-semibold mb-1">Dirección</h2>
              <p className="text-slate-400 text-sm">Av. Valparaíso 351, Villa Alemana<br />Región de Valparaíso, Chile</p>
            </div>
          </div>
        </div>

        <Hashtags tags={['ContactoSeguridad', 'CotizaciónAlarma', 'SistemaDeAlarma', 'GamaSecurity']} />
        <Faq items={faq} />
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Build** → PASS con `○ /contacto`.
- [ ] **Step 5: Commit**

```bash
git add dashboard/src/app/contacto/
git commit -m "feat seo: pagina de contacto con formulario y FAQ"
```

---

### Task 13: Navbar, Footer y bloques del Home

**Files:**
- Modify: `dashboard/src/components/landing/Navbar.tsx`
- Modify: `dashboard/src/components/landing/Footer.tsx`
- Modify: `dashboard/src/app/page.tsx`
- Read primero: los 3 archivos completos (Footer usa `new Date()` y modales; verificar si tiene `'use client'` y hooks antes de tocar)

**Interfaces:**
- Consumes: `getAllServicios`, `getComunasByRegion`, `getAllArticulos` (Task 1); `ServiceCard`, `ComunaCard`, `ArticleCard`, `Faq`, `JsonLd` (Task 2)
- Produces: navegación a `/servicios`, `/comunas`, `/blog`, `/contacto`; footer con columnas de enlaces reales; home con bloques nuevos (server components importando el loader)

- [ ] **Step 1: Leer los 3 archivos completos** y anotar: si Footer es `'use client'`, si tiene hooks (useState para ModalLegalPublico), y la estructura de columnas actual.

- [ ] **Step 2: Modificar `Navbar.tsx`** (es `'use client'` — no importa loader de fs aquí; los dropdowns usan arrays estáticos de slugs):

Reemplazar `NAV_LINKS` por:

```ts
const NAV_LINKS = [
  { id: 'inicio', label: 'Inicio', href: '/' },
  { id: 'servicios', label: 'Servicios', href: '/servicios' },
  { id: 'comunas', label: 'Comunas', href: '/comunas' },
  { id: 'quienes-somos', label: 'Nosotros', href: '/#quienes-somos' },
  { id: 'blog', label: 'Blog', href: '/blog' },
  { id: 'contacto', label: 'Contacto', href: '/contacto' },
]
```

Cambios en el render:
- Desktop links: usar `<Link href={link.href}>` de `next/link` (ya importado) en vez de `<a href={\`#${link.id}\`}>`.
- Añadir estado `openMenu: string | null` para dropdowns desktop en "Servicios" y "Comunas": al hacer hover/click mostrar panel `absolute top-full left-0 bg-[#0a1628] border border-[#1e3a5f] rounded-xl p-4 grid grid-cols-2 gap-2 max-h-80 overflow-y-auto z-50` con `<Link>` a los 20 slugs de servicios y los dos índices de región (`/comunas` con anclas de texto "Región Metropolitana", "Región de Valparaíso"). Arrays estáticos locales:

```ts
const SERVICIOS_DROPDOWN = [
  ['Alarmas para casa', '/servicios/alarmas-para-casa'],
  ['Alarmas para negocios', '/servicios/alarmas-para-negocios'],
  ['Alarma inalámbrica', '/servicios/sistema-alarma-inalambrico'],
  ['Alarma cableada', '/servicios/sistema-alarma-cableada'],
  ['Monitoreo 24/7', '/servicios/monitoreo-de-alarmas-24-7'],
  ['Cámaras de seguridad', '/servicios/camaras-de-seguridad'],
  ['Cámaras IP', '/servicios/camaras-ip'],
  ['Cerco eléctrico', '/servicios/cerco-electrico'],
  ['Control de acceso', '/servicios/control-de-acceso'],
  ['Citofonía', '/servicios/citofonia'],
  ['Videoporteros', '/servicios/videoportero'],
  ['Detección de incendio', '/servicios/deteccion-de-incendio'],
  ['Prevención de robo', '/servicios/prevencion-de-robo'],
  ['Redes de datos', '/servicios/redes-de-datos'],
  ['Sistemas de voceo', '/servicios/sistemas-de-voceo'],
  ['Domótica', '/servicios/domotica'],
  ['Alarma con app', '/servicios/alarma-con-app'],
  ['Sensores de presencia', '/servicios/sensores-de-presencia'],
  ['Alarmas para empresas', '/servicios/sistemas-de-alarma-para-empresas'],
  ['Mantención', '/servicios/mantencion-de-sistemas-de-seguridad'],
] as const

const COMUNAS_DROPDOWN = [
  ['Ver todas las comunas', '/comunas'],
  ['Región Metropolitana', '/comunas'],
  ['Región de Valparaíso', '/comunas'],
] as const
```

- Logo `href="#inicio"` → `href="/"`.
- CTA "Solicitar Cotización" `href="#contacto"` → `href="/contacto"` (desktop y mobile).
- "Atención Clientes" en la barra superior → `href="/contacto"`.
- Mobile menu: mismos links de `NAV_LINKS` con `Link`, `onClick={closeMenu}`.

- [ ] **Step 3: Modificar `Footer.tsx`**

Si Footer es server component (sin `'use client'` ni hooks): importar directamente `getAllServicios`, `getComunasByRegion`, `getAllArticulos`. Si es client con hooks (modal): **pasar datos como props** desde `page.tsx` — pero Footer solo se usa en home, así que opción simple: convertir las columnas en server y dejar el botón del modal en un hijo client existente (`ModalLegalPublico` ya es client). Elegir el camino más simple según lo observado en Step 1.

Columnas nuevas (reemplazar los `<a href="#servicios">` y `#quienes-somos` del bloque de enlaces):

```tsx
// Columna Servicios (primeros 10 + link "Ver los 20 servicios")
{getAllServicios().slice(0, 10).map(s => (
  <Link key={s.slug} href={`/servicios/${s.slug}`}
    className="hover:text-[#0066cc] transition-colors text-left block">
    {s.title}
  </Link>
))}
<Link href="/servicios" className="hover:text-[#0066cc] font-semibold block">
  Ver todos los servicios →
</Link>

// Columna Comunas (10 top: primeras 5 RM + primeras 5 V Región)
{[...getComunasByRegion('rm').slice(0, 5), ...getComunasByRegion('v-region').slice(0, 5)].map(c => (
  <Link key={`${c.region}-${c.slug}`} href={`/comunas/${c.region}/${c.slug}`}
    className="hover:text-[#0066cc] transition-colors text-left block">
    Seguridad en {c.name}
  </Link>
))}
<Link href="/comunas" className="hover:text-[#0066cc] font-semibold block">
  Ver todas las comunas →
</Link>

// Columna Blog (5 recientes)
{getAllArticulos().slice(0, 5).map(a => (
  <Link key={a.slug} href={`/blog/${a.slug}`}
    className="hover:text-[#0066cc] transition-colors text-left block">
    {a.title}
  </Link>
))}
<Link href="/blog" className="hover:text-[#0066cc] font-semibold block">
  Ver el blog →
</Link>
```

Mantener columnas existentes de legales/contacto. Importar `Link` si no lo tiene.

- [ ] **Step 4: Bloques nuevos en `page.tsx` (home)** — añadir ANTES de `<WhatsAppFloating />`, con imports nuevos:

```tsx
import { getAllServicios, getComunasByRegion, getAllArticulos } from '@/lib/content'
import ServiceCard from '@/components/seo/ServiceCard'
import ComunaCard from '@/components/seo/ComunaCard'
import ArticleCard from '@/components/seo/ArticleCard'
import Faq from '@/components/seo/Faq'
import JsonLd from '@/components/seo/JsonLd'
import Link from 'next/link'
```

```tsx
{/* ── SEO: Grid de servicios ── */}
<section id="servicios-grid" className="py-20 bg-[#0a1628]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="apple-display-lg text-white text-center mb-4">
      Servicios de seguridad electrónica
    </h2>
    <p className="text-slate-300 text-center max-w-2xl mx-auto mb-10">
      Alarmas, monitoreo 24/7, cámaras, cercos eléctricos, control de acceso y más
      para hogares y empresas en Chile.
    </p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {getAllServicios().slice(0, 8).map(s => <ServiceCard key={s.slug} servicio={s} />)}
    </div>
    <div className="text-center mt-8">
      <Link href="/servicios" className="btn-apple-primary inline-flex py-2 px-6 text-sm">
        Ver los 20 servicios →
      </Link>
    </div>
  </div>
</section>

{/* ── SEO: Comunas ── */}
<section id="comunas-grid" className="py-20 bg-[#050d1a]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="apple-display-lg text-white text-center mb-4">
      Cobertura por comuna
    </h2>
    <p className="text-slate-300 text-center max-w-2xl mx-auto mb-10">
      Instalamos y monitoreamos en 52 comunas de la Región Metropolitana y 38 de la
      Región de Valparaíso.
    </p>
    <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {[...getComunasByRegion('rm').slice(0, 6), ...getComunasByRegion('v-region').slice(0, 6)]
        .map(c => <ComunaCard key={`${c.region}-${c.slug}`} comuna={c} />)}
    </div>
    <div className="text-center mt-8">
      <Link href="/comunas" className="btn-apple-secondary-dark inline-flex py-2 px-6 text-sm">
        Ver las 90 comunas →
      </Link>
    </div>
  </div>
</section>

{/* ── SEO: Blog ── */}
<section id="blog-grid" className="py-20 bg-[#0a1628]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="apple-display-lg text-white text-center mb-4">
      Guías de seguridad electrónica
    </h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
      {getAllArticulos().slice(0, 3).map(a => <ArticleCard key={a.slug} articulo={a} />)}
    </div>
    <div className="text-center mt-8">
      <Link href="/blog" className="btn-apple-primary inline-flex py-2 px-6 text-sm">
        Ver el blog →
      </Link>
    </div>
  </div>
</section>

{/* ── SEO: FAQ home ── */}
<Faq heading="Preguntas frecuentes sobre seguridad electrónica" items={[
  { question: '¿Cuánto cuesta un sistema de alarma para casa?', answer: 'Los kits parten desde $199.900 con instalación incluida; el plan de monitoreo 24/7 desde $19.900 mensuales. La evaluación en tu hogar es gratuita y sin compromiso.' },
  { question: '¿En qué comunas instalan alarmas y cámaras?', answer: 'Cubrimos las 52 comunas de la Región Metropolitana y las 38 de la Región de Valparaíso con técnicos propios y respuesta local.' },
  { question: '¿El monitoreo funciona las 24 horas?', answer: 'Sí. Nuestra central de monitoreo opera 24/7, los 365 días, con verificación humana de cada señal en menos de 2 minutos.' },
  { question: '¿Puedo controlar la alarma desde mi celular?', answer: 'Sí. Instalamos alarmas con aplicación móvil para armar, desarmar y recibir alertas push, compatibles con apps como NT CLICK.' },
  { question: '¿Hacen mantenimiento de sistemas de seguridad?', answer: 'Ofrecemos contratos de mantención preventiva de alarmas, cámaras y cercos eléctricos con revisión programada de baterías, sensores y grabación.' },
]} />
```

Insertar el FAQ después de la sección de blog y antes de `LandingInteractiveLayer`. No duplicar el FAQ si ya existe uno visible en la home (verificar en Step 1).

- [ ] **Step 5: Build + revisar home**

```bash
$env:NODE_OPTIONS='--max-old-space-size=4096'; npm run build
```
Expected: PASS. Verificar en el build que `/` genera sin errores y los enlaces del footer/nav apuntan a rutas nuevas.

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/app/page.tsx dashboard/src/components/landing/Navbar.tsx dashboard/src/components/landing/Footer.tsx
git commit -m "feat seo: nav y footer con enlaces reales, bloques SEO en home"
```

---

### Task 14: sitemap.ts dinámico

**Files:**
- Modify: `dashboard/src/app/sitemap.ts` (reemplazar contenido completo)

**Interfaces:**
- Consumes: `getAllServicios`, `getAllComunas`, `getAllArticulos` (Task 1)
- Produces: `/sitemap.xml` con ~135 URLs

- [ ] **Step 1: Reemplazar `sitemap.ts`**

```ts
import type { MetadataRoute } from 'next'
import { getAllServicios, getAllComunas, getAllArticulos } from '@/lib/content'

const SITE_URL = 'https://www.gamasecurity.cl'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/servicios`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/comunas`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

  const servicios: MetadataRoute.Sitemap = getAllServicios().map(s => ({
    url: `${SITE_URL}/servicios/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const comunas: MetadataRoute.Sitemap = getAllComunas().map(c => ({
    url: `${SITE_URL}/comunas/${c.region}/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const articulos: MetadataRoute.Sitemap = getAllArticulos().map(a => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...servicios, ...comunas, ...articulos]
}
```

- [ ] **Step 2: Build y verificar `/sitemap.xml`**

```bash
$env:NODE_OPTIONS='--max-old-space-size=4096'; npm run build
```
Expected: PASS; tras el build, contar `<loc>` en `.next/server/app/sitemap.xml.body` o buscar en el HTML generado — deben ser ≥135 (5 + 20 + 90 + 20).

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/app/sitemap.ts
git commit -m "feat seo: sitemap dinamico con todas las rutas indexables"
```

---

### Task 15: Imágenes OG variantes + verificación final + push

**Files:**
- Create: `dashboard/scripts/make-og.ps1`
- Create: `dashboard/public/og-servicio.png`
- Create: `dashboard/public/og-comuna.png`
- Create: `dashboard/public/og-blog.png`

**Interfaces:**
- Consumes: `dashboard/public/og-gama.png` (1200×630, ya existe)
- Produces: 3 variantes 1200×630 referenciadas por las metadata de servicios/comunas/blog

- [ ] **Step 1: Crear `scripts/make-og.ps1`**

```powershell
Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot '..' 'public' 'og-gama.png'
$base = [System.Drawing.Image]::FromFile((Resolve-Path $src).Path)

$labels = @{ 'og-servicio' = 'SERVICIOS DE SEGURIDAD'
             'og-comuna'    = 'COBERTURA POR COMUNA'
             'og-blog'      = 'BLOG DE SEGURIDAD' }

foreach ($name in $labels.Keys) {
  $bmp = New-Object System.Drawing.Bitmap(1200, 630)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($base, 0, 0, 1200, 630)

  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 5, 13, 26))
  $g.FillRectangle($brush, 0, 540, 1200, 90)

  $font = New-Object System.Drawing.Font('Segoe UI', 36, [System.Drawing.FontStyle]::Bold)
  $white = [System.Drawing.Brushes]::White
  $g.DrawString($labels[$name], $font, $white, 40, 555)

  $g.Dispose()
  $out = Join-Path $PSScriptRoot '..' 'public' "$name.png"
  $bmp.Save((Join-Path (Resolve-Path (Split-Path $out)).Path "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "OK $name.png"
}
$base.Dispose()
```

- [ ] **Step 2: Ejecutar**

```powershell
powershell -ExecutionPolicy Bypass -File scripts\make-og.ps1
```
Expected: `OK og-servicio.png`, `OK og-comuna.png`, `OK og-blog.png` en `dashboard/public/`.

- [ ] **Step 3: Validación final completa**

```bash
node scripts/validate-content.mjs
$env:NODE_OPTIONS='--max-old-space-size=4096'; npm run build
```
Expected: `✓ contenido OK` y build PASS con todas las rutas:
`/`, `/servicios`, `/servicios/[20]`, `/comunas`, `/comunas/[90]`, `/blog`, `/blog/[20]`, `/contacto`, `/robots.txt`, `/sitemap.xml`.

- [ ] **Step 4: Lint de archivos tocados** (los errores del repo preexistentes se ignoran; verificar que NO hay errores NUEVOS en `src/app/{servicios,comunas,blog,contacto,sitemap.ts,page.tsx}`, `src/components/seo/`, `src/lib/content.ts`):

```bash
$env:NODE_OPTIONS='--max-old-space-size=4096'; npx eslint src/app/servicios src/app/comunas src/app/blog src/app/contacto src/components/seo src/lib/content.ts src/app/sitemap.ts
```
Expected: 0 errores.

- [ ] **Step 5: Commit final + push de TODO** (orden del usuario: "haz el commit y push de todo cuando termines")

```bash
git add dashboard/public/og-servicio.png dashboard/public/og-comuna.png dashboard/public/og-blog.png dashboard/scripts/make-og.ps1
git commit -m "feat seo: variantes OG para servicios, comunas y blog"
git status   # confirmar que NO hay logs sin trackear (_gama_log.txt, _editor_remoto_log.txt)
git push origin main
```

NO pushear si `git status` muestra archivos de log modificados sin descartar — esos NO se agregan (van en `.gitignore`); el resto de cambios de este plan ya está commiteado por tarea.

---

## Plan Self-Review (ejecutado al escribir el plan)

1. **Spec coverage:** URLs/arquitectura → Tasks 3/6/9/12/14; 20 servicios → Tasks 3-5; 90 comunas → Tasks 6-8; 20 artículos → Tasks 9-11; home/nav/footer → Task 13; sitemap → Task 14; OG variantes → Task 15; JSON-LD por tipo → Tasks 3/6/9/12; validación anti-thin → Task 1 (validador) + reglas de contenido; hashtags → componentes + reglas. ✅
2. **Placeholders:** sin TBD/TODO; los esquemas de contenido tienen specs por archivo (tabla con title/desc/kw/H2/related) + exemplar completo por tipo. ✅
3. **Type consistency:** tipos y firmas definidos en Task 1 se usan igual en Tasks 2-14; `REGION_LABELS` y slugs consistentes entre tablas de servicios y `relatedServicios`. ✅


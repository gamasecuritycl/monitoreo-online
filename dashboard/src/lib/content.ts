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

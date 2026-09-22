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

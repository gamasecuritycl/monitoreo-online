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
hashtags: [SistemaDeAlarma, SeguridadElectrónica, Monitoreo24_7]
h1: "Sistema de alarma para casa"
faq:
  - question: "¿Cuánto cuesta una alarma para casa?"
    answer: "Desde $199.900 según el plan elegido. La evaluación inicial es gratuita."
  - question: "¿La alarma funciona sin internet?"
    answer: "Sí, comunica por GSM y radiofrecuencia y sigue activa si se cae internet o la luz."
  - question: "¿Cuánto demora la instalación?"
    answer: "Entre 2 y 4 horas según la cantidad de sensores instalados en el lugar."
relatedServicios: [alarmas-para-negocios, sistema-alarma-inalambrico, monitoreo-de-alarmas-24-7]
---
${'palabra '.repeat(310)}
`

function writeStubServicio(dir, slug) {
  const md = `---
title: "Servicio ${slug} fixture"
description: "Descripción única para el fixture ${slug} con texto válido para el validador."
keywords: [alarma, seguridad, monitoreo, hogar, chile]
hashtags: [SistemaDeAlarma, SeguridadElectronica, Monitoreo24h]
h1: "Servicio ${slug} fixture"
faq:
  - question: "¿Qué es ${slug}?"
    answer: "Es un servicio de seguridad validado por el fixture del validador de contenido."
  - question: "¿Cómo se instala ${slug}?"
    answer: "Con técnicos certificados y equipos de alta gama en todo Chile."
  - question: "¿Cuánto cuesta ${slug}?"
    answer: "Depende del plano; la evaluación inicial siempre es gratuita para el cliente."
relatedServicios: [alarma-para-casa, alarmas-para-negocios, sistema-alarma-inalambrico]
---
${'palabra '.repeat(310)}
`
  fs.writeFileSync(path.join(dir, 'servicios', `${slug}.md`), md)
}

test('validador acepta un servicio bien formado', () => {
  const dir = makeFixture()
  fs.writeFileSync(path.join(dir, 'servicios', 'alarma-para-casa.md'), goodServicio)
  for (const slug of ['alarmas-para-negocios', 'sistema-alarma-inalambrico', 'monitoreo-de-alarmas-24-7']) {
    writeStubServicio(dir, slug)
  }
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

const goodComuna = {
  name: 'Villa Alemana',
  title: 'Alarmas y video vigilancia en Villa Alemana',
  description: 'Sistemas de alarma, cámaras y monitoreo 24/7 para hogares y negocios en Villa Alemana.',
  keywords: ['alarma villa alemana', 'camaras villa alemana', 'monitoreo seguridad', 'alarmas region', 'seguridad hogar'],
  hashtags: ['SistemaDeAlarma', 'SeguridadElectronica', 'Monitoreo24h'],
  faq: [
    { question: '¿Necesito alarma en Villa Alemana?', answer: 'Sí, protege tu hogar o negocio con monitoreo permanente.' },
    { question: '¿Cuánto cuesta instalar?', answer: 'Desde $199.900 según el plano; la evaluación inicial es gratuita.' },
    { question: '¿Hay monitoreo 24/7?', answer: 'Sí, la central monitorea tu propiedad las 24 horas del día.' },
  ],
  lead: 'palabra '.repeat(45).trim(),
  reasonExtra: 'palabra '.repeat(90).trim(),
  sectors: ['centro', 'el bello', 'villa fresia', 'lonquén', 'la punta'],
  serviciosDestacados: ['s1', 's2', 's3', 's4', 's5', 's6'],
}

test('comuna JSON sin h1 pasa el validador', () => {
  const dir = makeFixture()
  fs.mkdirSync(path.join(dir, 'comunas', 'rm'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'comunas', 'rm', 'villa-alemana.json'), JSON.stringify(goodComuna, null, 2))
  assert.deepStrictEqual(validateContentDir(dir), [])
})

test('servicio .md sin h1 genera error', () => {
  const dir = makeFixture()
  const bad = goodServicio.replace(/^h1: .*$/m, '')
  fs.writeFileSync(path.join(dir, 'servicios', 'alarma-para-casa.md'), bad)
  const errs = validateContentDir(dir)
  assert.ok(errs.some(e => e.includes('h1')))
})

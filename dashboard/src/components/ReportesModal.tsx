'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { getPromptConfig } from './ConfigModal'

const API_URL = 'https://bitacora.gamasecurity.cl/api-bitacora.php'

type ReporteTab = 'diario' | 'semanal' | 'cliente' | 'fallas' | 'ranking' | 'operadores'

const _fmtChile = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' })

function hoyChile(): string {
  return _fmtChile.format(new Date())
}

function desdeChile(): string {
  const ahora = new Date()
  const p = Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(ahora)
  const dia = parseInt(p.find(x => x.type === 'day')!.value)
  const mes = parseInt(p.find(x => x.type === 'month')!.value) - 1
  const año = parseInt(p.find(x => x.type === 'year')!.value)
  const chile = new Date(año, mes, dia, 12, 0, 0)
  chile.setDate(chile.getDate() - 7)
  return _fmtChile.format(chile)
}

export default function ReportesModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<ReporteTab>('diario')
  const [desde, setDesde] = useState(() => desdeChile())
  const [hasta, setHasta] = useState(() => hoyChile())
  const [datos, setDatos] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [aiAnalizando, setAiAnalizando] = useState(false)
  const [aiResultado, setAiResultado] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiTruncado, setAiTruncado] = useState(false)
  const [mostrarAI, setMostrarAI] = useState(false)
  const [correoDestino, setCorreoDestino] = useState('operaciones@gamasecurity.cl')

  const tabs: { id: ReporteTab; label: string }[] = [
    { id: 'diario', label: 'RESUMEN DEL DÍA' },
    { id: 'semanal', label: 'SEMANAL/MENSUAL' },
    { id: 'cliente', label: 'POR CLIENTE' },
    { id: 'fallas', label: 'FALLAS' },
    { id: 'ranking', label: 'RANKING' },
    { id: 'operadores', label: 'OPERADORES' },
  ]

  const cargarEventos = async () => {
    setCargando(true)
    try {
      const r = await fetch(`${API_URL}?action=eventos&desde=${encodeURIComponent(desde + ' 00:00')}&hasta=${encodeURIComponent(hasta + ' 23:59')}`)
      if (r.ok) setDatos(await r.json())
    } catch {}
    setCargando(false)
  }

  useEffect(() => { cargarEventos() }, [])

  const exportarExcel = () => {
    if (datos.length === 0) return
    const filas = datos.map((e: any) => ({
      Fecha: new Date(e.created_at).toLocaleDateString('es-CL'),
      Hora: new Date(e.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      Abonado: e.abonado_cod || '',
      Tipo: e.tipo_nombre || '',
      Responsable: e.responsable_nombre || '',
      Comentario: e.comentario || '',
    }))
    const XLSX2 = XLSX
    const wb = XLSX2.utils.book_new()
    const ws = XLSX2.utils.json_to_sheet(filas)
    XLSX2.utils.book_append_sheet(wb, ws, 'Reporte')
    XLSX2.writeFile(wb, `reporte_${desde}_${hasta}.xlsx`)
  }

  const exportarPDF = () => {
    const filas = datos.map((e: any) => `<tr><td>${new Date(e.created_at).toLocaleDateString('es-CL')}</td><td>${new Date(e.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td><td>${e.abonado_cod || ''}</td><td>${e.tipo_nombre || ''}</td><td>${e.responsable_nombre || ''}</td><td>${e.comentario || ''}</td></tr>`).join('')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte ${tab}</title><style>
body{font-family:Calibri,sans-serif;font-size:10pt;padding:20px}
h1{font-size:14pt;color:#1e293b;border-bottom:2px solid #1e293b;padding-bottom:5px}
table{width:100%;border-collapse:collapse;margin-top:10px}
th{background:#1e293b;color:#fff;padding:5px 8px;text-align:left;font-size:9pt}
td{padding:4px 8px;border-bottom:1px solid #ddd;font-size:9pt}
tr:nth-child(even){background:#f8f8f8}
@media print{@page{size:landscape;margin:15mm}}
</style></head><body><h1>REPORTE</h1><table><thead><tr><th>Fecha</th><th>Hora</th><th>Abonado</th><th>Tipo</th><th>Responsable</th><th>Comentario</th></tr></thead><tbody>${filas}</tbody></table><script>window.print()</script></body></html>`)
    win.document.close()
  }

  const analizarConIA = async () => {
    if (datos.length === 0) return
    setAiAnalizando(true)
    setAiError('')
    setAiResultado('')
    setAiTruncado(false)
    setMostrarAI(true)
    try {
      const resumen = {
        total: datos.length,
        rango: `${desde} → ${hasta}`,
        porTipo: Object.entries(datos.reduce((acc: any, e: any) => {
          const t = e.tipo_nombre || 'SIN TIPO'
          acc[t] = (acc[t] || 0) + 1
          return acc
        }, {})).map(([t, c]) => `${t}: ${c}`).join(', '),
        topClientes: Object.entries(datos.reduce((acc: any, e: any) => {
          const cod = e.abonado_cod || 'SIN CÓDIGO'
          const nom = e.abonado_nombre || ''
          const clave = nom ? `${nom} (${cod})` : cod
          acc[clave] = (acc[clave] || 0) + 1
          return acc
        }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([c, n]) => `${c} (${n})`).join(', '),
        fallas: datos.filter((e: any) => {
          const t = (e.tipo_nombre || '').toUpperCase()
          return t.includes('FALLA') || t.includes('ENERG') || t.includes('BATER')
        }).length,
        aperturas: datos.filter((e: any) => {
          const t = (e.tipo_nombre || '').toUpperCase()
          return t.includes('APERTURA') || t.includes('CIERRE')
        }).length,
      }
      const eventosDetalle = datos.slice(0, 100).map((e: any) => {
        const f = new Date(e.created_at).toLocaleString('es-CL')
        const a = e.abonado_nombre || e.abonado_cod || '?'
        const t = e.tipo_nombre || '?'
        const r = e.responsable_nombre || ''
        const c = (e.comentario || '').slice(0, 120).replace(/\n/g, ' | ')
        return `${f} | ${a} | ${t} | ${r} | ${c}`
      }).join('\n')
      const promptTemplate = getPromptConfig()
      const prompt = promptTemplate
        .replace(/\{rango\}/g, resumen.rango)
        .replace(/\{total\}/g, String(resumen.total))
        .replace(/\{porTipo\}/g, resumen.porTipo)
        .replace(/\{topClientes\}/g, resumen.topClientes)
        .replace(/\{fallas\}/g, String(resumen.fallas))
        .replace(/\{aperturas\}/g, String(resumen.aperturas))
        .replace(/\{eventosDetalle\}/g, eventosDetalle)
      const r = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const d = await r.json()
      if (d.ok) {
        setAiResultado(d.texto + (d.truncado ? '\n\n⚠ [Análisis incompleto — el límite de tokens de salida se alcanzó. Se aumentó a 65536, si persiste reduce la cantidad de eventos en el prompt]' : ''))
        setAiTruncado(d.truncado || false)
      } else setAiError(d.error || 'Error al analizar')
    } catch (e: any) {
      setAiError(e.message)
    }
    setAiAnalizando(false)
  }

  const renderAIContent = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let inList = false
    lines.forEach((l, i) => {
      const t = l.trim()
      if (!t) {
        if (inList) { inList = false; elements.push(<br key={`br${i}`} />) }
        return
      }
      if (t.startsWith('## ')) {
        inList = false
        elements.push(
          <div key={`h${i}`} className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
            <div className="w-1 h-5 bg-purple-500 rounded-full" />
            <span className="text-purple-300 font-bold text-sm tracking-wide">{t.replace(/^##\s*/, '')}</span>
          </div>
        )
      } else if (t.startsWith('- ') || t.startsWith('* ')) {
        inList = true
        elements.push(
          <div key={`l${i}`} className="flex items-start gap-2 ml-2 mb-1">
            <span className="text-cyan-400 mt-1 text-xs">▪</span>
            <span className="text-slate-200 text-sm leading-relaxed flex-1">{t.replace(/^[-*]\s*/, '')}</span>
          </div>
        )
      } else if (t.startsWith('> ')) {
        inList = false
        elements.push(
          <div key={`q${i}`} className="border-l-2 border-cyan-700 pl-3 my-2 text-slate-400 text-sm italic">
            {t.replace(/^>\s*/, '')}
          </div>
        )
      } else {
        inList = false
        elements.push(
          <p key={`p${i}`} className="text-slate-200 text-sm leading-relaxed mb-1">{t}</p>
        )
      }
    })
    return elements
  }

  const enviarPorCorreo = async () => {
    if (!aiResultado) return
    const lineas = aiResultado.split('\n')
    let inList = false
    const bodyHtml = lineas.map(l => {
      const t = l.trim()
      if (!t) {
        if (inList) { inList = false; return '</ul>' }
        return '<div style="height:8px"></div>'
      }
      if (t.startsWith('## ')) {
        inList = false
        const titulo = t.replace(/^##\s*/, '')
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 8px"><tr><td width="4" bgcolor="#7c3aed" style="border-radius:2px">&nbsp;</td><td style="padding-left:10px"><h2 style="margin:0;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px">${titulo}</h2></td></tr></table>`
      }
      if (t.startsWith('- ') || t.startsWith('* ')) {
        const item = t.replace(/^[-*]\s*/, '')
        if (!inList) { inList = true; return `<ul style="margin:2px 0 2px;padding-left:16px"><li style="font-family:Arial,sans-serif;font-size:12px;color:#333;line-height:1.6;margin:2px 0">${item}</li>` }
        return `<li style="font-family:Arial,sans-serif;font-size:12px;color:#333;line-height:1.6;margin:2px 0">${item}</li>`
      }
      if (t.startsWith('> ')) {
        inList = false
        return `<div style="border-left:3px solid #0891b2;padding:6px 12px;margin:6px 0;background:#f0fdfa;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:12px;color:#555;font-style:italic">${t.replace(/^>\s*/, '')}</div>`
      }
      inList = false
      return `<p style="font-family:Arial,sans-serif;font-size:12px;color:#333;line-height:1.6;margin:4px 0">${t}</p>`
    }).join('')
    if (inList) bodyHtml + '</ul>'
    const fallas = datos.filter((e: any) => { const t = (e.tipo_nombre || '').toUpperCase(); return t.includes('FALLA') || t.includes('ENERG') || t.includes('BATER') }).length
    const aperturas = datos.filter((e: any) => { const t = (e.tipo_nombre || '').toUpperCase(); return t.includes('APERTURA') || t.includes('CIERRE') }).length
    const now = new Date()
    const fechaChile = new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(now)
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:0;background:#e8e8e8;font-family:Arial,Helvetica,sans-serif}
.wrap{max-width:620px;margin:24px auto;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
.top{background:#1e293b;padding:22px 28px 18px}
.top h1{margin:0;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:0.3px}
.top .sub{margin:4px 0 0;font-size:11px;color:#94a3b8;letter-spacing:0.5px}
.stats{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:14px 28px}
.stats table{width:100%}
.stats td{text-align:center;font-size:11px;color:#64748b;font-weight:600;padding:0 6px;font-family:Arial,sans-serif}
.stats .num{display:block;font-size:18px;font-weight:700;color:#1e293b;margin-bottom:2px}
.body{padding:8px 28px 20px}
.footer{background:#1e293b;padding:14px 28px;font-size:10px;color:#94a3b8;text-align:center;letter-spacing:0.3px}
h2{font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 8px}
ul{margin:2px 0 2px;padding-left:16px}
li{font-family:Arial,sans-serif;font-size:12px;color:#333;line-height:1.6;margin:2px 0}
p{font-family:Arial,sans-serif;font-size:12px;color:#333;line-height:1.6;margin:4px 0}
.blockquote{border-left:3px solid #0891b2;padding:6px 12px;margin:6px 0;background:#f0fdfa;border-radius:0 4px 4px 0;font-size:12px;color:#555;font-style:italic}
</style></head><body>
<div class="wrap">
<div class="top">
<h1>GAMA SEGURIDAD · INFORME DE TURNO</h1>
<div class="sub">${desde} → ${hasta} · Generado ${fechaChile}</div>
</div>
<div class="stats">
<table><tr>
<td><span class="num">${datos.length}</span>Total Eventos</td>
<td><span class="num">${fallas}</span>Fallas / Energía</td>
<td><span class="num">${aperturas}</span>Aperturas / Cierres</td>
</tr></table>
</div>
<div class="body">${bodyHtml}</div>
<div class="footer">Gama Seguridad Chile · Este informe fue generado automáticamente · ${fechaChile}</div>
</div></body></html>`
    const destino = correoDestino.trim() || 'operaciones@gamasecurity.cl'
    try {
      const r = await fetch('/api/enviar-reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destino,
          asunto: `📊 Informe de Turno Gama Seguridad — ${desde} → ${hasta}`,
          html,
        }),
      })
      if (r.ok) alert(`✅ Correo enviado a ${destino}`)
      else {
        const d = await r.json()
        alert('❌ Error: ' + (d.error || ''))
      }
    } catch {
      alert('❌ Error de red')
    }
  }

  const renderDiario = () => {
    const hoy = datos.filter((e: any) => new Date(e.created_at).toDateString() === new Date().toDateString())
    const porTipo: Record<string, number> = {}
    const porAbonado: Record<string, number> = {}
    hoy.forEach((e: any) => {
      const t = e.tipo_nombre || 'SIN TIPO'
      porTipo[t] = (porTipo[t] || 0) + 1
      const a = `${e.abonado_cod || ''}`
      porAbonado[a] = (porAbonado[a] || 0) + 1
    })
    const topClientes = Object.entries(porAbonado).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return (
      <div className="space-y-4">
        <div className="bg-[#1e293b] rounded p-3">
          <div className="text-cyan-400 font-bold text-lg">{hoy.length}</div>
          <div className="text-slate-400 text-xs font-bold">Eventos hoy</div>
        </div>
        <div>
          <div className="text-slate-300 font-bold text-sm mb-2">POR TIPO</div>
          <div className="space-y-1">
            {Object.entries(porTipo).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => (
              <div key={tipo} className="flex justify-between bg-[#1e293b] rounded px-3 py-1.5 text-sm">
                <span className="text-slate-300">{tipo}</span>
                <span className="text-cyan-400 font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-slate-300 font-bold text-sm mb-2">TOP 5 CLIENTES</div>
          <div className="space-y-1">
            {topClientes.map(([cod, count]) => (
              <div key={cod} className="flex justify-between bg-[#1e293b] rounded px-3 py-1.5 text-sm">
                <span className="text-slate-300">{cod || 'SIN CÓDIGO'}</span>
                <span className="text-cyan-400 font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderSemanal = () => {
    const porDia: Record<string, number> = {}
    datos.forEach((e: any) => {
      const d = new Date(e.created_at).toLocaleDateString('es-CL')
      porDia[d] = (porDia[d] || 0) + 1
    })
    return (
      <div>
        <div className="text-slate-300 font-bold text-sm mb-2">EVENTOS POR DÍA</div>
        <div className="space-y-1">
          {Object.entries(porDia).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).map(([dia, count]) => (
            <div key={dia} className="flex justify-between bg-[#1e293b] rounded px-3 py-1.5 text-sm">
              <span className="text-slate-300">{dia}</span>
              <span className="text-cyan-400 font-bold">{count}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-slate-400 text-xs font-bold">Total: {datos.length} eventos</div>
      </div>
    )
  }

  const renderCliente = () => {
    const porAbonado: Record<string, { cod: string; nombre: string; count: number; tipos: Record<string, number> }> = {}
    datos.forEach((e: any) => {
      const cod = e.abonado_cod || 'SIN CÓDIGO'
      if (!porAbonado[cod]) porAbonado[cod] = { cod, nombre: e.abonado_nombre || '', count: 0, tipos: {} }
      porAbonado[cod].count++
      const t = e.tipo_nombre || 'SIN TIPO'
      porAbonado[cod].tipos[t] = (porAbonado[cod].tipos[t] || 0) + 1
    })
    const sorted = Object.values(porAbonado).sort((a, b) => b.count - a.count)
    return (
      <div className="space-y-2">
        {sorted.map(a => (
          <div key={a.cod} className="bg-[#1e293b] rounded p-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-cyan-400 font-bold text-sm">{a.cod}</span>
                {a.nombre && <span className="text-slate-400 text-xs ml-2">{a.nombre}</span>}
              </div>
              <span className="text-slate-100 font-bold">{a.count}</span>
            </div>
            <div className="flex gap-2 mt-1 flex-wrap">
              {Object.entries(a.tipos).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tipo, count]) => (
                <span key={tipo} className="text-[10px] bg-[#334155] text-slate-300 px-1.5 py-0.5 rounded font-bold">{tipo}: {count}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderFallas = () => {
    const fallas = datos.filter((e: any) => {
      const t = (e.tipo_nombre || '').toUpperCase()
      return t.includes('FALLA') || t.includes('ENERG') || t.includes('BATER') || t.includes('COMUNIC')
    })
    return (
      <div>
        <div className="text-slate-300 font-bold text-sm mb-2">{fallas.length} eventos de falla</div>
        <div className="space-y-1">
          {fallas.slice(0, 50).map((e: any) => (
            <div key={e.id} className="bg-[#1e293b] rounded px-3 py-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-cyan-400 font-bold text-xs">{e.abonado_cod || ''}</span>
                <span className="text-slate-500 text-xs">{new Date(e.created_at).toLocaleString('es-CL')}</span>
              </div>
              <div className="text-yellow-400 text-xs font-bold">{e.tipo_nombre}</div>
              <div className="text-slate-400 text-xs">{e.comentario || ''}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRanking = () => {
    const porAbonado: Record<string, { cod: string; nombre: string; count: number }> = {}
    datos.forEach((e: any) => {
      const cod = e.abonado_cod || 'SIN CÓDIGO'
      if (!porAbonado[cod]) porAbonado[cod] = { cod, nombre: e.abonado_nombre || '', count: 0 }
      porAbonado[cod].count++
    })
    const sorted = Object.values(porAbonado).sort((a, b) => b.count - a.count)
    return (
      <div>
        <div className="space-y-1">
          {sorted.map((a, i) => (
            <div key={a.cod} className="flex justify-between items-center bg-[#1e293b] rounded px-3 py-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${i < 3 ? 'text-yellow-400' : 'text-slate-500'}`}>#{i + 1}</span>
                <span className="text-cyan-400 font-bold">{a.cod}</span>
                {a.nombre && <span className="text-slate-400 text-xs truncate max-w-[200px]">{a.nombre}</span>}
              </div>
              <span className="text-slate-100 font-bold">{a.count}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderOperadores = () => {
    const porOp: Record<string, number> = {}
    datos.forEach((e: any) => {
      const op = e.responsable_nombre || 'SIN ASIGNAR'
      porOp[op] = (porOp[op] || 0) + 1
    })
    return (
      <div>
        <div className="text-slate-300 font-bold text-sm mb-2">EVENTOS POR OPERADOR</div>
        <div className="space-y-1">
          {Object.entries(porOp).sort((a, b) => b[1] - a[1]).map(([op, count]) => (
            <div key={op} className="flex justify-between bg-[#1e293b] rounded px-3 py-1.5 text-sm">
              <span className="text-slate-300">{op}</span>
              <span className="text-cyan-400 font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTab = () => {
    switch (tab) {
      case 'diario': return renderDiario()
      case 'semanal': return renderSemanal()
      case 'cliente': return renderCliente()
      case 'fallas': return renderFallas()
      case 'ranking': return renderRanking()
      case 'operadores': return renderOperadores()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-2 pt-[5vh] overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full md:w-[1000px] h-[90vh] bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#1e293b] flex justify-between items-center px-4 py-2 shrink-0 border-b border-[#334155]">
          <span className="text-slate-100 font-bold text-base tracking-wide">📊 REPORTES</span>
          <div className="flex items-center gap-2">
            <button onClick={analizarConIA} disabled={aiAnalizando || datos.length === 0} className="text-xs text-purple-400 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-purple-800 transition-colors disabled:opacity-50">🤖 IA</button>
            <button onClick={exportarExcel} className="text-xs text-slate-400 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-slate-700">📊 XLS</button>
            <button onClick={exportarPDF} className="text-xs text-slate-400 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-slate-700">📄 PDF</button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold px-1.5 leading-none hover:bg-slate-700 rounded">&times;</button>
          </div>
        </div>
        <div className="flex gap-2 px-4 pt-3 shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded transition-colors whitespace-nowrap ${tab === t.id ? 'bg-cyan-700 text-white' : 'bg-[#1e293b] text-slate-400 hover:text-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 px-4 py-2 shrink-0 items-center">
          <input type="date" className="bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-sm text-slate-100" value={desde} onChange={e => setDesde(e.target.value)} />
          <span className="text-slate-500 text-sm">→</span>
          <input type="date" className="bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-sm text-slate-100" value={hasta} onChange={e => setHasta(e.target.value)} />
          <button onClick={cargarEventos} className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-bold px-3 py-1 rounded" disabled={cargando}>{cargando ? 'CARGANDO...' : 'FILTRAR'}</button>
        </div>
        <div className="flex-1 flex gap-4 overflow-hidden px-4 pb-4">
          <div className={`overflow-y-auto ${mostrarAI ? 'w-1/2' : 'w-full'}`}>
            {renderTab()}
          </div>
          {mostrarAI && (
            <div className="w-1/2 overflow-y-auto border-l border-[#334155] pl-4 flex flex-col">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <span className="text-purple-400 font-bold text-sm">🤖 ANÁLISIS IA</span>
                <div className="flex items-center gap-1">
                  <button onClick={enviarPorCorreo} disabled={!aiResultado} className="text-xs text-blue-400 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-blue-800 disabled:opacity-50">📧 ENVIAR</button>
                  <button onClick={() => setMostrarAI(false)} className="text-xs text-slate-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-700">✕</button>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-3 shrink-0">
                <span className="text-slate-500 text-[10px] font-bold">Para:</span>
                <input type="email" value={correoDestino} onChange={e => setCorreoDestino(e.target.value)}
                  className="flex-1 bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-700"
                  placeholder="correo@dominio.cl" />
              </div>
              {aiAnalizando && <div className="text-slate-400 text-sm animate-pulse">Analizando con Gemini...</div>}
              {aiError && <div className="text-red-400 text-sm font-bold">❌ {aiError}</div>}
              {aiTruncado && <div className="text-yellow-400 text-xs font-bold mb-2">⚠ Análisis truncado por límite de longitud — puedes aumentar tokens en CONFIGURACIÓN</div>}
              {aiResultado && (
                <div className="overflow-y-auto">
                  {renderAIContent(aiResultado)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { getPromptConfig } from './ConfigModal'

const API_URL = 'https://bitacora.gamasecurity.cl/api-bitacora.php'

type ReporteTab = 'diario' | 'semanal' | 'cliente' | 'fallas' | 'ranking' | 'operadores'

export default function ReportesModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<ReporteTab>('diario')
  const [desde, setDesde] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [hasta, setHasta] = useState(() => new Date().toISOString().split('T')[0])
  const [datos, setDatos] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [aiAnalizando, setAiAnalizando] = useState(false)
  const [aiResultado, setAiResultado] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiTruncado, setAiTruncado] = useState(false)
  const [mostrarAI, setMostrarAI] = useState(false)

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
      const eventosDetalle = datos.slice(0, 150).map((e: any) => {
        const f = new Date(e.created_at).toLocaleString('es-CL')
        const a = e.abonado_nombre || e.abonado_cod || 'S/ID'
        const t = e.tipo_nombre || 'S/T'
        const r = e.responsable_nombre || ''
        const c = (e.comentario || '').replace(/\n/g, ' | ')
        return `[${f}] ${a} | ${t} | ${r} | ${c}`
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
        setAiResultado(d.texto + (d.truncado ? '\n\n⚠ [El análisis se truncó por longitud — aumenta maxOutputTokens en api/gemini/route.ts o acorta el prompt]' : ''))
        setAiTruncado(d.truncado || false)
      } else setAiError(d.error || 'Error al analizar')
    } catch (e: any) {
      setAiError(e.message)
    }
    setAiAnalizando(false)
  }

  const enviarPorCorreo = async () => {
    if (!aiResultado) return
    const html = `<div style="font-family:Calibri,sans-serif;padding:20px;max-width:700px">
<h1 style="color:#1e293b;border-bottom:2px solid #1e293b;padding-bottom:5px">📊 Análisis IA - Reporte ${desde} → ${hasta}</h1>
<p style="color:#666;font-size:12px">Generado por Gemini AI — Gama Seguridad</p>
<div style="white-space:pre-wrap;font-size:13px;line-height:1.6;color:#333">${aiResultado.replace(/\n/g, '<br>')}</div>
</div>`
    try {
      const r = await fetch('/api/enviar-reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destino: 'operaciones@gamasecurity.cl',
          asunto: `Análisis IA - Reporte ${desde} → ${hasta}`,
          html,
        }),
      })
      if (r.ok) alert('✅ Correo enviado a operaciones@gamasecurity.cl')
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
            <div className="w-1/2 overflow-y-auto border-l border-[#334155] pl-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-purple-400 font-bold text-sm">🤖 ANÁLISIS IA</span>
                <div className="flex gap-1">
                  <button onClick={enviarPorCorreo} disabled={!aiResultado} className="text-xs text-blue-400 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-blue-800 disabled:opacity-50">📧 ENVIAR</button>
                  <button onClick={() => setMostrarAI(false)} className="text-xs text-slate-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-700">✕</button>
                </div>
              </div>
              {aiAnalizando && <div className="text-slate-400 text-sm animate-pulse">Analizando con Gemini...</div>}
              {aiError && <div className="text-red-400 text-sm font-bold">❌ {aiError}</div>}
              {aiTruncado && <div className="text-yellow-400 text-xs font-bold mb-2">⚠ Análisis truncado por límite de longitud — puedes aumentar tokens en CONFIGURACIÓN</div>}
              {aiResultado && (
                <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{aiResultado}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

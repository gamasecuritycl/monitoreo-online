'use client'

import React, { useState, useEffect } from 'react'
import { 
  Building2, Search, Key, ExternalLink, FileText, 
  RefreshCw, AlertCircle, CheckCircle2, Clock, 
  Sparkles, Check, X, MapPin, ArrowUpDown, Filter, Copy,
  Brain, Download, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, TrendingUp
} from 'lucide-react'

export interface LicitacionChileCompra {
  CodigoExterno: string
  Nombre: string
  CodigoEstado: number
  Estado: string
  Organismo: string
  Region?: string
  Comuna?: string
  RutComprador?: string
  DireccionUnidad?: string
  FechaCierre: string
  MontoEstimado: number
  Moneda: string
  Rubro: string
  Descripcion: string
  Tipo: string
  Contacto?: string
  EnlaceMercadoPublico: string
  EsDemo?: boolean
}

interface MercadoPublicoModuleProps {
  onCotizarLicitacion: (lic: LicitacionChileCompra) => void
}

export default function MercadoPublicoModule({ onCotizarLicitacion }: MercadoPublicoModuleProps) {
  const [licitaciones, setLicitaciones] = useState<LicitacionChileCompra[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroRubro, setFiltroRubro] = useState<string>('todos')
  const [filtroRegion, setFiltroRegion] = useState<string>('todas')
  const [filtroEstado, setFiltroEstado] = useState<string>('todas')
  const [ordenCriterio, setOrdenCriterio] = useState<string>('cierre_pronto') // Predeterminado: Cierre más pronta primero
  const [busqueda, setBusqueda] = useState<string>('')
  const [ticketApi, setTicketApi] = useState<string>('')
  const [modalTicketAbierto, setModalTicketAbierto] = useState(false)
  const [ticketInput, setTicketInput] = useState('')
  const [modoApi, setModoApi] = useState<string>('catalogo_seguridad_radar')
  const [mensajeApi, setMensajeApi] = useState<string>('')
  const [errorApi, setErrorApi] = useState<string>('')
  const [probandoTicket, setProbandoTicket] = useState(false)
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; msg: string } | null>(null)
  
  // Estado para la Ficha Técnica de Licitación y Copiado
  const [licitacionFicha, setLicitacionFicha] = useState<LicitacionChileCompra | null>(null)
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  // Estado para el Análisis IA
  const [analizandoIA, setAnalizandoIA] = useState(false)
  const [informeIA, setInformeIA] = useState<any>(null)
  const [errorIA, setErrorIA] = useState<string>('')
  const [seccionExpandida, setSeccionExpandida] = useState<string>('resumen')
  const [modalInformeAbierto, setModalInformeAbierto] = useState(false)

  // Cargar ticket guardado en localStorage
  useEffect(() => {
    try {
      const guardado = localStorage.getItem('gama_mercadopublico_ticket') || ''
      if (guardado) {
        setTicketApi(guardado)
        setTicketInput(guardado)
      }
    } catch {}
  }, [])

  // ── ANÁLISIS IA DE LICITACIÓN ──
  const handleAnalizarIA = async (lic: LicitacionChileCompra) => {
    setAnalizandoIA(true)
    setErrorIA('')
    setInformeIA(null)
    setModalInformeAbierto(true)
    try {
      const res = await fetch('/api/mercado-publico/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: lic.CodigoExterno,
          ticket: ticketApi || '',
          licitacion_basica: lic
        })
      })
      const data = await res.json()
      if (data.success && data.informe) {
        setInformeIA(data.informe)
      } else {
        setErrorIA(data.error || 'No se pudo generar el informe.')
      }
    } catch (e: any) {
      setErrorIA(`Error de conexión: ${e.message}`)
    } finally {
      setAnalizandoIA(false)
    }
  }

  // ── EXPORTAR INFORME PDF ──
  const exportarInformePDF = async () => {
    if (!informeIA || !licitacionFicha) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const margin = 15
      const pageW = 210
      const contentW = pageW - margin * 2
      let y = margin

      // Header
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageW, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('GAMA SEGURIDAD — ANÁLISIS IA DE LICITACIÓN', margin, 15)
      doc.setFontSize(9)
      doc.setTextColor(148, 163, 184)
      doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, margin, 23)
      doc.setTextColor(99, 102, 241)
      doc.text(`Viabilidad: ${informeIA.viabilidad || 'N/A'} (${informeIA.puntaje_viabilidad || 0}/100)`, margin, 30)
      y = 45

      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('LICITACIÓN', margin, y); y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const nombreLines = doc.splitTextToSize(licitacionFicha.Nombre, contentW)
      doc.text(nombreLines, margin, y); y += nombreLines.length * 5 + 3
      doc.text(`ID: ${licitacionFicha.CodigoExterno}  |  Organismo: ${licitacionFicha.Organismo}`, margin, y); y += 5
      doc.text(`Región: ${licitacionFicha.Region || 'N/A'}  |  Monto: $${Math.round(licitacionFicha.MontoEstimado).toLocaleString('es-CL')} CLP`, margin, y); y += 5
      doc.text(`Cierre: ${licitacionFicha.FechaCierre ? new Date(licitacionFicha.FechaCierre).toLocaleString('es-CL') : 'N/A'}`, margin, y); y += 10

      const addSection = (titulo: string, contenido: string) => {
        if (y > 260) { doc.addPage(); y = margin }
        doc.setFillColor(99, 102, 241)
        doc.rect(margin, y, contentW, 6, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text(titulo.toUpperCase(), margin + 2, y + 4.5); y += 9
        doc.setTextColor(15, 23, 42)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        const lines = doc.splitTextToSize(contenido, contentW)
        lines.forEach((line: string) => {
          if (y > 272) { doc.addPage(); y = margin }
          doc.text(line, margin, y); y += 5
        })
        y += 4
      }

      if (informeIA.resumen_ejecutivo) addSection('Resumen Ejecutivo', informeIA.resumen_ejecutivo)
      if (informeIA.alineacion_servicios) addSection('Alineación con Servicios de Gama', informeIA.alineacion_servicios)

      if (Array.isArray(informeIA.plan_de_accion) && informeIA.plan_de_accion.length > 0) {
        addSection('Plan de Acción', informeIA.plan_de_accion.map((p: any) => `${p.paso}. ${p.accion} [${p.plazo}] — ${p.responsable}`).join('\n'))
      }
      if (Array.isArray(informeIA.requisitos_tecnicos) && informeIA.requisitos_tecnicos.length > 0) {
        addSection('Requisitos Técnicos', informeIA.requisitos_tecnicos.map((r: any) => `${r.gama_cumple ? '✓' : '✗'} ${r.requisito}`).join('\n'))
      }
      if (Array.isArray(informeIA.requisitos_administrativos) && informeIA.requisitos_administrativos.length > 0) {
        addSection('Requisitos Administrativos', informeIA.requisitos_administrativos.map((r: any) => `${r.gama_cumple ? '✓' : '✗'} ${r.requisito}`).join('\n'))
      }
      if (Array.isArray(informeIA.riesgos) && informeIA.riesgos.length > 0) {
        addSection('Riesgos Identificados', informeIA.riesgos.map((r: any) => `[${r.tipo}/${r.impacto}] ${r.descripcion}`).join('\n'))
      }
      if (informeIA.precio_referencial) {
        const p = informeIA.precio_referencial
        addSection('Precio Referencial', `Mínimo: $${(p.minimo_clp||0).toLocaleString('es-CL')} CLP | Recomendado: $${(p.recomendado_clp||0).toLocaleString('es-CL')} CLP | Máximo: $${(p.maximo_clp||0).toLocaleString('es-CL')} CLP\n${p.justificacion || ''}`)
      }
      if (informeIA.notas_estrategicas) addSection('Notas Estratégicas', informeIA.notas_estrategicas)

      doc.save(`Informe_IA_${licitacionFicha.CodigoExterno}.pdf`)
    } catch (e: any) {
      console.error('Error generando PDF:', e)
    }
  }

  const fetchLicitaciones = async () => {
    setCargando(true)
    setErrorApi('')
    setMensajeApi('')
    try {
      const params = new URLSearchParams()
      if (ticketApi) params.append('ticket', ticketApi)
      if (filtroRubro !== 'todos') params.append('rubro', filtroRubro)
      if (filtroRegion !== 'todas') params.append('region', filtroRegion)

      const res = await fetch(`/api/mercado-publico?${params.toString()}`)
      const data = await res.json()
      if (data.licitaciones) {
        setLicitaciones(data.licitaciones)
        setModoApi(data.modo || 'catalogo_seguridad_radar')
        if (data.mensaje) setMensajeApi(data.mensaje)
        if (data.error) setErrorApi(data.error)
      }
    } catch (err: any) {
      console.error('Error cargando licitaciones:', err)
      setErrorApi('Error de conexión al consultar el radar.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    fetchLicitaciones()
  }, [ticketApi, filtroRubro, filtroRegion])

  const guardarTicket = () => {
    const val = ticketInput.trim()
    setTicketApi(val)
    try {
      localStorage.setItem('gama_mercadopublico_ticket', val)
    } catch {}
    setModalTicketAbierto(false)
    setResultadoPrueba(null)
  }

  const handleProbarTicket = async () => {
    const t = ticketInput.trim()
    if (!t) {
      setResultadoPrueba({ ok: false, msg: 'Por favor ingresa un ticket antes de probar.' })
      return
    }
    setProbandoTicket(true)
    setResultadoPrueba(null)
    try {
      const res = await fetch(`/api/mercado-publico?accion=test_ticket&ticket=${encodeURIComponent(t)}`)
      const data = await res.json()
      if (data.ticket_valido) {
        setResultadoPrueba({ ok: true, msg: data.mensaje || '¡Ticket válido y activo ante ChileCompra!' })
      } else {
        setResultadoPrueba({ ok: false, msg: data.error || 'ChileCompra rechazó el ticket.' })
      }
    } catch (err: any) {
      setResultadoPrueba({ ok: false, msg: `Error al probar: ${err.message}` })
    } finally {
      setProbandoTicket(false)
    }
  }

  // Filtrado local estricto por rubro, región, estado, búsqueda y ordenamiento por fecha de cierre más pronta
  const licitacionesFiltradas = licitaciones
    .filter(l => {
      // 1. Filtro estricto por Rubro de la pestaña seleccionada
      if (filtroRubro === 'cctv' && !l.Rubro.includes('CCTV')) return false
      if (filtroRubro === 'monitoreo' && !l.Rubro.includes('Monitoreo')) return false
      if (filtroRubro === 'guardias' && !l.Rubro.includes('Guardias')) return false
      if (filtroRubro === 'acceso' && !l.Rubro.includes('Acceso')) return false

      // 2. Filtro por Región
      if (filtroRegion !== 'todas') {
        const reg = (l.Region || '').toLowerCase()
        const com = (l.Comuna || '').toLowerCase()
        const f = filtroRegion.toLowerCase()
        if (!reg.includes(f) && !com.includes(f)) return false
      }

      // 3. Filtro por Estado
      if (filtroEstado !== 'todas') {
        const est = (l.Estado || '').toLowerCase()
        if (filtroEstado === 'publicada' && est !== 'publicada' && l.CodigoEstado !== 5) return false
        if (filtroEstado === 'cerrada' && est !== 'cerrada' && l.CodigoEstado !== 6) return false
        if (filtroEstado === 'adjudicada' && est !== 'adjudicada' && l.CodigoEstado !== 8) return false
      }

      // 4. Filtro por búsqueda de texto
      if (!busqueda.trim()) return true
      const q = busqueda.toLowerCase()
      return (
        l.Nombre.toLowerCase().includes(q) ||
        l.Organismo.toLowerCase().includes(q) ||
        (l.Region && l.Region.toLowerCase().includes(q)) ||
        (l.Comuna && l.Comuna.toLowerCase().includes(q)) ||
        l.CodigoExterno.toLowerCase().includes(q) ||
        l.Descripcion.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      // 5. Ordenamiento: Por fecha de cierre más pronta primero (Default)
      if (ordenCriterio === 'cierre_pronto') {
        const timeA = a.FechaCierre ? new Date(a.FechaCierre).getTime() : Infinity
        const timeB = b.FechaCierre ? new Date(b.FechaCierre).getTime() : Infinity
        return timeA - timeB
      }
      if (ordenCriterio === 'cierre_lejano') {
        const timeA = a.FechaCierre ? new Date(a.FechaCierre).getTime() : -Infinity
        const timeB = b.FechaCierre ? new Date(b.FechaCierre).getTime() : -Infinity
        return timeB - timeA
      }
      if (ordenCriterio === 'monto_desc') {
        return (b.MontoEstimado || 0) - (a.MontoEstimado || 0)
      }
      if (ordenCriterio === 'monto_asc') {
        return (a.MontoEstimado || 0) - (b.MontoEstimado || 0)
      }
      return 0
    })

  // KPIs
  const montoTotalEnJuego = licitacionesFiltradas.reduce((acc, l) => acc + (l.MontoEstimado || 0), 0)
  const cantMonitoreoCctv = licitacionesFiltradas.filter(l => l.Rubro.includes('CCTV') || l.Rubro.includes('Monitoreo')).length
  const cantGuardias = licitacionesFiltradas.filter(l => l.Rubro.includes('Guardias')).length

  return (
    <div className="space-y-6">
      {/* Banner Principal & Radar Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ChileCompra · Radar Oficial 24/7
              </span>
              {ticketApi ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ticket Configurado
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Modo Demostrativo
                </span>
              )}

              {modoApi === 'api_real_chilecompra' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Servidor Oficial Conectado
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <Building2 className="w-7 h-7 text-indigo-400" />
              Mercado Público & Licitaciones Estatales
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Monitoreo activo de licitaciones públicas de seguridad privada, CCTV con analítica, televigilancia y alarmas. Prepara cotizaciones oficiales con 1 solo clic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setModalTicketAbierto(true)
                setResultadoPrueba(null)
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition shadow-sm cursor-pointer"
            >
              <Key className="w-4 h-4 text-indigo-400" />
              {ticketApi ? 'Gestionar Ticket API' : 'Configurar Ticket API'}
            </button>

            <button
              onClick={fetchLicitaciones}
              disabled={cargando}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar Radar
            </button>
          </div>
        </div>

        {/* Mini KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block">Licitaciones Listadas</span>
            <span className="text-xl font-black text-white">{licitacionesFiltradas.length}</span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block">Monto Estimado en Juego</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              ${Math.round(montoTotalEnJuego).toLocaleString('es-CL')} CLP
            </span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block">CCTV & Monitoreo 24/7</span>
            <span className="text-xl font-black text-cyan-400">{cantMonitoreoCctv}</span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block">Guardias & Control</span>
            <span className="text-xl font-black text-indigo-400">{cantGuardias}</span>
          </div>
        </div>
      </div>

      {/* Alerta si ChileCompra rechazó el ticket o dio error */}
      {errorApi && (
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="font-bold block text-white">Aviso de API ChileCompra:</strong>
              <span>{errorApi}</span>
            </div>
          </div>
          <button
            onClick={() => {
              setModalTicketAbierto(true)
              setResultadoPrueba(null)
            }}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 cursor-pointer transition shadow"
          >
            Verificar Ticket
          </button>
        </div>
      )}

      {/* Mensaje de estado informativo de la API */}
      {mensajeApi && !errorApi && (
        <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-2xl p-3 px-4 flex items-center gap-2.5 text-xs text-indigo-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensajeApi}</span>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda Avanzada */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5">
        {/* Fila 1: Pestañas de Rubro */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'todos', label: 'Todas las Licitaciones' },
            { id: 'cctv', label: 'CCTV & Cámaras' },
            { id: 'monitoreo', label: 'Monitoreo & Alarmas' },
            { id: 'guardias', label: 'Guardias OS-10' },
            { id: 'acceso', label: 'Control de Acceso' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroRubro(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroRubro === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Fila 2: Filtros de Región, Estado, Ordenamiento y Buscador */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
          {/* Selector de Región (Todas las 16 regiones de Chile) */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
            <select
              value={filtroRegion}
              onChange={(e) => setFiltroRegion(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-bold focus:outline-none cursor-pointer w-full"
            >
              <option value="todas" className="bg-slate-900">🗺️ Todas las Regiones</option>
              <option value="valparaíso" className="bg-slate-900 font-bold text-cyan-400">⭐ V Región de Valparaíso</option>
              <option value="metropolitana" className="bg-slate-900 font-bold text-cyan-400">⭐ Región Metropolitana (RM)</option>
              <option value="arica" className="bg-slate-900">XV Región de Arica y Parinacota</option>
              <option value="tarapacá" className="bg-slate-900">I Región de Tarapacá</option>
              <option value="antofagasta" className="bg-slate-900">II Región de Antofagasta</option>
              <option value="atacama" className="bg-slate-900">III Región de Atacama</option>
              <option value="coquimbo" className="bg-slate-900">IV Región de Coquimbo</option>
              <option value="o'higgins" className="bg-slate-900">VI Región de O&apos;Higgins</option>
              <option value="maule" className="bg-slate-900">VII Región del Maule</option>
              <option value="ñuble" className="bg-slate-900">XVI Región de Ñuble</option>
              <option value="biobío" className="bg-slate-900">VIII Región del Biobío</option>
              <option value="araucanía" className="bg-slate-900">IX Región de La Araucanía</option>
              <option value="los ríos" className="bg-slate-900">XIV Región de Los Ríos</option>
              <option value="los lagos" className="bg-slate-900">X Región de Los Lagos</option>
              <option value="aysén" className="bg-slate-900">XI Región de Aysén</option>
              <option value="magallanes" className="bg-slate-900">XII Región de Magallanes</option>
            </select>
          </div>

          {/* Selector de Estado */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-4 h-4 text-indigo-400 shrink-0" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-bold focus:outline-none cursor-pointer w-full"
            >
              <option value="todas" className="bg-slate-900">Todos los Estados</option>
              <option value="publicada" className="bg-slate-900 text-emerald-400 font-bold">🟢 Publicadas / Activas</option>
              <option value="cerrada" className="bg-slate-900 text-slate-400">🔒 Cerradas (Evaluación)</option>
              <option value="adjudicada" className="bg-slate-900 text-blue-400">🏆 Adjudicadas</option>
            </select>
          </div>

          {/* Selector de Ordenamiento (Cierre más pronta primero) */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <ArrowUpDown className="w-4 h-4 text-indigo-400 shrink-0" />
            <select
              value={ordenCriterio}
              onChange={(e) => setOrdenCriterio(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-bold focus:outline-none cursor-pointer w-full"
            >
              <option value="cierre_pronto" className="bg-slate-900">⏱️ Cierre más pronta primero (Urgentes)</option>
              <option value="monto_desc" className="bg-slate-900">💰 Mayor Monto Estimado</option>
              <option value="monto_asc" className="bg-slate-900">💵 Menor Monto Estimado</option>
              <option value="cierre_lejano" className="bg-slate-900">📅 Cierre más lejano primero</option>
            </select>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por organismo, código..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Listado de Licitaciones */}
      {cargando ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-300">Consultando API de Mercado Público...</p>
          <p className="text-xs text-slate-500 mt-1">Conectando con base de datos oficial de ChileCompra</p>
        </div>
      ) : licitacionesFiltradas.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-300">No se encontraron licitaciones con ese criterio</p>
          <p className="text-xs text-slate-500 mt-1">Intenta seleccionar &quot;Todas las Licitaciones&quot;, &quot;Todas las Regiones&quot; o &quot;Todos los Estados&quot;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {licitacionesFiltradas.map((lic) => {
            const rubroColor = 
              lic.Rubro.includes('CCTV') ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800' :
              lic.Rubro.includes('Guardias') ? 'text-indigo-400 bg-indigo-950/60 border-indigo-800' :
              lic.Rubro.includes('Acceso') ? 'text-amber-400 bg-amber-950/60 border-amber-800' :
              'text-emerald-400 bg-emerald-950/60 border-emerald-800'

            const fechaCierreFormateada = lic.FechaCierre 
              ? new Date(lic.FechaCierre).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Consultar portal'

            return (
              <div 
                key={lic.CodigoExterno}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${rubroColor}`}>
                          {lic.Rubro}
                        </span>
                        {lic.EsDemo ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Ejemplo Demostrativo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ChileCompra Oficial Real
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-indigo-300 transition">
                        {lic.Nombre}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800">
                        {lic.CodigoExterno}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(lic.CodigoExterno)
                          setCopiadoId(lic.CodigoExterno)
                          setTimeout(() => setCopiadoId(null), 2000)
                        }}
                        title="Copiar código al portapapeles"
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        {copiadoId === lic.CodigoExterno ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Organismo Comprador y Región Geográfica */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-300 mb-3 bg-slate-950/80 px-3.5 py-2.5 rounded-xl border border-slate-800/80 shadow-2xs">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-bold text-white tracking-wide truncate">{lic.Organismo}</span>
                    </div>
                    {lic.Region && (
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span>{lic.Region}{lic.Comuna ? ` · ${lic.Comuna}` : ''}</span>
                      </span>
                    )}
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {lic.Descripcion}
                  </p>
                </div>

                {/* Métricas y Acciones */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Monto Estimado</span>
                      <span className="font-bold font-mono text-emerald-400">
                        ${Math.round(lic.MontoEstimado).toLocaleString('es-CL')} {lic.Moneda}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Cierre Ofertas</span>
                      <span className="font-bold text-amber-300 flex items-center justify-end gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        {fechaCierreFormateada}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLicitacionFicha(lic)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700/80 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ver Ficha</span>
                    </button>

                    <button
                      onClick={() => onCotizarLicitacion(lic)}
                      className="flex-2 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Cotizar con 1 Clic</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL INFORME IA ── */}
      {modalInformeAbierto && licitacionFicha && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[96vh]">
            {/* Header Modal IA */}
            <div className="flex items-center justify-between gap-3 p-5 border-b border-slate-800 bg-gradient-to-r from-indigo-950 to-slate-900 rounded-t-3xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Informe IA — Gama Seguridad</h3>
                  <p className="text-[11px] text-indigo-300 font-mono truncate max-w-xs">{licitacionFicha.CodigoExterno} · {licitacionFicha.Organismo.slice(0, 35)}{licitacionFicha.Organismo.length > 35 ? '...' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {informeIA && (
                  <button
                    onClick={exportarInformePDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                )}
                <button
                  onClick={() => { setModalInformeAbierto(false); setInformeIA(null); setErrorIA('') }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido Modal IA */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {analizandoIA && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                    <Brain className="w-7 h-7 text-indigo-400 absolute inset-0 m-auto" />
                  </div>
                  <p className="text-sm font-bold text-white">Gemini 2.5 Flash analizando la licitación...</p>
                  <p className="text-xs text-slate-400 text-center max-w-xs">Consultando ChileCompra y procesando los ítems del proceso. Esto toma ~15 segundos.</p>
                  <div className="flex gap-1.5 mt-2">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {errorIA && !analizandoIA && (
                <div className="bg-red-950/60 border border-red-500/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-200">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white mb-1">No se pudo generar el análisis</strong>
                    <span>{errorIA}</span>
                    <p className="mt-2 text-slate-400">Verifica que tu ticket de API esté configurado y activo.</p>
                  </div>
                </div>
              )}

              {informeIA && !analizandoIA && (() => {
                const viabilidadColor = informeIA.viabilidad === 'ALTA'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : informeIA.viabilidad === 'MEDIA'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-red-500/20 text-red-300 border-red-500/50'

                const Seccion = ({ id, titulo, icono, children }: { id: string; titulo: string; icono: React.ReactNode; children: React.ReactNode }) => (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setSeccionExpandida(s => s === id ? '' : id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">{icono}{titulo}</span>
                      {seccionExpandida === id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {seccionExpandida === id && <div className="px-4 pb-4 pt-1 text-xs text-slate-300 space-y-2">{children}</div>}
                  </div>
                )

                return (
                  <div className="space-y-3">
                    {/* Badge de Viabilidad */}
                    <div className={`flex items-center justify-between gap-3 p-4 rounded-2xl border ${viabilidadColor}`}>
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-wider opacity-70 block">Viabilidad para Gama Seguridad</span>
                        <span className="text-2xl font-black">{informeIA.viabilidad || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-black font-mono">{informeIA.puntaje_viabilidad || 0}</span>
                        <span className="text-xs font-bold opacity-70 block">/100 puntos</span>
                      </div>
                    </div>

                    {/* Resumen Ejecutivo */}
                    <Seccion id="resumen" titulo="Resumen Ejecutivo" icono={<TrendingUp className="w-4 h-4 text-indigo-400" />}>
                      <p className="leading-relaxed">{informeIA.resumen_ejecutivo}</p>
                      {informeIA.alineacion_servicios && <p className="mt-2 text-indigo-300 leading-relaxed">{informeIA.alineacion_servicios}</p>}
                    </Seccion>

                    {/* Plan de Acción */}
                    {Array.isArray(informeIA.plan_de_accion) && informeIA.plan_de_accion.length > 0 && (
                      <Seccion id="plan" titulo={`Plan de Acción (${informeIA.plan_de_accion.length} pasos)`} icono={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}>
                        <div className="space-y-2">
                          {informeIA.plan_de_accion.map((p: any) => (
                            <div key={p.paso} className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                                p.prioridad === 'ALTA' ? 'bg-red-500/20 text-red-300' :
                                p.prioridad === 'MEDIA' ? 'bg-amber-500/20 text-amber-300' :
                                'bg-slate-700 text-slate-300'
                              }`}>{p.paso}</span>
                              <div className="flex-1">
                                <p className="font-semibold text-white">{p.accion}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-md">⏰ {p.plazo}</span>
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">👤 {p.responsable}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Seccion>
                    )}

                    {/* Requisitos Técnicos */}
                    {Array.isArray(informeIA.requisitos_tecnicos) && informeIA.requisitos_tecnicos.length > 0 && (
                      <Seccion id="req_tec" titulo="Requisitos Técnicos" icono={<ShieldCheck className="w-4 h-4 text-cyan-400" />}>
                        <div className="space-y-1.5">
                          {informeIA.requisitos_tecnicos.map((r: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                                r.gama_cumple ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {r.gama_cumple ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              </span>
                              <div>
                                <p className={r.gama_cumple ? 'text-slate-200' : 'text-red-200'}>{r.requisito}</p>
                                {!r.gama_cumple && r.accion_requerida && <p className="text-amber-300 mt-0.5">→ {r.accion_requerida}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Seccion>
                    )}

                    {/* Requisitos Administrativos */}
                    {Array.isArray(informeIA.requisitos_administrativos) && informeIA.requisitos_administrativos.length > 0 && (
                      <Seccion id="req_adm" titulo="Requisitos Administrativos" icono={<FileText className="w-4 h-4 text-amber-400" />}>
                        <div className="space-y-1.5">
                          {informeIA.requisitos_administrativos.map((r: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                                r.gama_cumple ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {r.gama_cumple ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              </span>
                              <div>
                                <p className={r.gama_cumple ? 'text-slate-200' : 'text-red-200'}>{r.requisito}</p>
                                {!r.gama_cumple && r.accion_requerida && <p className="text-amber-300 mt-0.5">→ {r.accion_requerida}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Seccion>
                    )}

                    {/* Servicios Requeridos */}
                    {Array.isArray(informeIA.servicios_requeridos) && informeIA.servicios_requeridos.length > 0 && (
                      <Seccion id="servicios" titulo="Servicios Requeridos" icono={<Building2 className="w-4 h-4 text-slate-400" />}>
                        <div className="space-y-1.5">
                          {informeIA.servicios_requeridos.map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                s.aplica_gama ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                              }`}>
                                {s.aplica_gama ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              </span>
                              <span className={s.aplica_gama ? 'text-slate-200 font-medium' : 'text-slate-500'}>{s.servicio}</span>
                              {s.nota && <span className="text-[10px] text-slate-500 ml-auto shrink-0">{s.nota}</span>}
                            </div>
                          ))}
                        </div>
                      </Seccion>
                    )}

                    {/* Riesgos */}
                    {Array.isArray(informeIA.riesgos) && informeIA.riesgos.length > 0 && (
                      <Seccion id="riesgos" titulo="Riesgos Identificados" icono={<AlertTriangle className="w-4 h-4 text-amber-400" />}>
                        <div className="space-y-2">
                          {informeIA.riesgos.map((r: any, i: number) => (
                            <div key={i} className={`p-3 rounded-xl border ${
                              r.impacto === 'ALTO' ? 'bg-red-950/40 border-red-800/60' :
                              r.impacto === 'MEDIO' ? 'bg-amber-950/40 border-amber-800/60' :
                              'bg-slate-900/40 border-slate-800'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  r.impacto === 'ALTO' ? 'bg-red-500/20 text-red-300' :
                                  r.impacto === 'MEDIO' ? 'bg-amber-500/20 text-amber-300' :
                                  'bg-slate-700 text-slate-300'
                                }`}>{r.tipo} — {r.impacto}</span>
                              </div>
                              <p className="text-slate-200">{r.descripcion}</p>
                              {r.mitigacion && <p className="text-emerald-400 mt-1 text-[11px]">💡 {r.mitigacion}</p>}
                            </div>
                          ))}
                        </div>
                      </Seccion>
                    )}

                    {/* Precio Referencial */}
                    {informeIA.precio_referencial && (
                      <Seccion id="precio" titulo="Precio Referencial de Oferta" icono={<TrendingUp className="w-4 h-4 text-emerald-400" />}>
                        <div className="grid grid-cols-3 gap-2 text-center mb-3">
                          <div className="bg-slate-800 rounded-xl p-3">
                            <span className="text-[10px] text-slate-500 block">Mínimo</span>
                            <span className="font-mono font-bold text-slate-300 text-xs">${((informeIA.precio_referencial.minimo_clp)||0).toLocaleString('es-CL')}</span>
                          </div>
                          <div className="bg-emerald-950/60 border border-emerald-700/60 rounded-xl p-3">
                            <span className="text-[10px] text-emerald-400 block font-bold">Recomendado</span>
                            <span className="font-mono font-black text-emerald-300 text-sm">${((informeIA.precio_referencial.recomendado_clp)||0).toLocaleString('es-CL')}</span>
                          </div>
                          <div className="bg-slate-800 rounded-xl p-3">
                            <span className="text-[10px] text-slate-500 block">Máximo</span>
                            <span className="font-mono font-bold text-slate-300 text-xs">${((informeIA.precio_referencial.maximo_clp)||0).toLocaleString('es-CL')}</span>
                          </div>
                        </div>
                        {informeIA.precio_referencial.justificacion && <p className="text-slate-400">{informeIA.precio_referencial.justificacion}</p>}
                      </Seccion>
                    )}

                    {/* Notas Estratégicas */}
                    {informeIA.notas_estrategicas && (
                      <div className="bg-indigo-950/40 border border-indigo-700/50 rounded-2xl p-4 text-xs">
                        <p className="text-[10px] uppercase font-black text-indigo-400 mb-2 tracking-wider">💡 Nota Estratégica de Gama IA</p>
                        <p className="text-indigo-200 leading-relaxed">{informeIA.notas_estrategicas}</p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Footer Modal IA */}
            {!analizandoIA && (
              <div className="flex items-center justify-between gap-3 p-5 border-t border-slate-800 shrink-0">
                <button
                  onClick={() => { setModalInformeAbierto(false); setInformeIA(null); setErrorIA('') }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cerrar
                </button>
                <div className="flex gap-2">
                  {informeIA && (
                    <button
                      onClick={exportarInformePDF}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Exportar PDF
                    </button>
                  )}
                  {licitacionFicha && (
                    <button
                      onClick={() => { setModalInformeAbierto(false); onCotizarLicitacion(licitacionFicha) }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Cotizar con 1 Clic
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL FICHA TÉCNICA OFICIAL DE LICITACIÓN ── */}
      {licitacionFicha && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono font-black text-xs text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded-lg border border-indigo-700/80">
                      ID: {licitacionFicha.CodigoExterno}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      {licitacionFicha.Estado}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {licitacionFicha.Rubro}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                    {licitacionFicha.Nombre}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setLicitacionFicha(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos Clave */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Organismo Comprador</span>
                <strong className="text-white text-sm block">{licitacionFicha.Organismo}</strong>
                <span className="text-slate-400 font-mono block">RUT: {licitacionFicha.RutComprador || 'No especificado'}</span>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Ubicación Geográfica</span>
                <strong className="text-white text-sm block flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                  {licitacionFicha.Region || 'Chile'}{licitacionFicha.Comuna ? ` (${licitacionFicha.Comuna})` : ''}
                </strong>
                <span className="text-slate-400 block truncate">📍 {licitacionFicha.DireccionUnidad || 'Dirección no indicada'}</span>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Monto Estimado de Referencia</span>
                <span className="text-base font-black font-mono text-emerald-400 block">
                  ${Math.round(licitacionFicha.MontoEstimado).toLocaleString('es-CL')} {licitacionFicha.Moneda}
                </span>
                <span className="text-[10px] text-slate-500">Monto base para la formulación de propuesta</span>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Fecha Límite Cierre de Ofertas</span>
                <span className="text-sm font-black font-mono text-amber-300 block flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {licitacionFicha.FechaCierre ? new Date(licitacionFicha.FechaCierre).toLocaleString('es-CL') : 'Ver en portal'}
                </span>
                <span className="text-[10px] text-slate-500">Tipo: {licitacionFicha.Tipo}</span>
              </div>
            </div>

            {/* Requerimiento Técnico */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                Especificaciones Técnicas / Resumen del Servicio
              </span>
              <p className="text-slate-300 leading-relaxed font-medium">
                {licitacionFicha.Descripcion}
              </p>
            </div>

            {/* Caja de Acceso al Portal Oficial sin error de permisos */}
            <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-white block flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  ¿Cómo verla en Mercado Público sin errores?
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Copia el código ID <strong>{licitacionFicha.CodigoExterno}</strong> y pégalo directamente en el buscador oficial de licitaciones de ChileCompra.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(licitacionFicha.CodigoExterno)
                  setCopiadoId(licitacionFicha.CodigoExterno)
                  window.open('https://www.mercadopublico.cl/Portal/Modules/Site/Busquedas/BuscarLicitacion.aspx?qs=1', '_blank')
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shrink-0 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{copiadoId === licitacionFicha.CodigoExterno ? '¡ID Copiado! Abriendo Portal...' : 'Copiar ID e Ir al Portal'}</span>
              </button>
            </div>

            {/* Footer con Acciones */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLicitacionFicha(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAnalizarIA(licitacionFicha)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition cursor-pointer"
                >
                  <Brain className="w-4 h-4" />
                  <span>Analizar con IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const item = licitacionFicha
                    setLicitacionFicha(null)
                    onCotizarLicitacion(item)
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Cotizar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración y Prueba de Ticket ChileCompra */}
      {modalTicketAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Key className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Ticket de API ChileCompra</h3>
                <p className="text-xs text-slate-400">Acceso oficial gratuito a Mercado Público</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-bold text-slate-300 block">Ingresa o verifica tu Ticket:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => {
                    setTicketInput(e.target.value)
                    setResultadoPrueba(null)
                  }}
                  placeholder="Ej: F8E490D0-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleProbarTicket}
                  disabled={probandoTicket}
                  className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {probandoTicket ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>Probar Conexión</span>
                </button>
              </div>
            </div>

            {/* Resultado de prueba del ticket */}
            {resultadoPrueba && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-medium border flex items-start gap-2.5 ${
                resultadoPrueba.ok 
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                  : 'bg-red-950/60 border-red-500/50 text-red-200'
              }`}>
                {resultadoPrueba.ok ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{resultadoPrueba.msg}</span>
              </div>
            )}

            {/* Pasos para conseguir el ticket gratis */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-5 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-indigo-400 block">¿Cómo obtener o revisar tu ticket gratuito?</span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                <li>Ingresa a <a href="https://api.mercadopublico.cl" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">api.mercadopublico.cl</a>.</li>
                <li>Haz clic en <strong>&quot;Participa&quot;</strong> e inicia sesión con tu <strong>ClaveÚnica</strong>.</li>
                <li>En <em>Motivo</em>, escribe <strong>&quot;Solicitud de Ticket&quot;</strong>.</li>
                <li>ChileCompra te enviará el ticket por correo. Cópialo completo y pégalo arriba.</li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setModalTicketAbierto(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={guardarTicket}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-md cursor-pointer"
              >
                Guardar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

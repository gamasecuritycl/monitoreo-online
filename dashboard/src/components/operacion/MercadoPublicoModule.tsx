'use client'

import React, { useState, useEffect } from 'react'
import { 
  Building2, Search, Key, ExternalLink, FileText, 
  RefreshCw, AlertCircle, CheckCircle2, Clock, 
  Sparkles, Check, X, MapPin, ArrowUpDown, Filter, Copy,
  Brain, Download, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, TrendingUp,
  Calendar, Scale, Shield, CheckSquare, Save, DollarSign, Calculator
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
  // Condiciones clave de la licitación
  VisitaTerreno?: {
    Requerida: boolean
    Tipo: 'Obligatoria' | 'Facultativa' | 'No Aplica'
    Fecha?: string
    Lugar?: string
    Contacto?: string
    Observacion?: string
  }
  Garantias?: {
    SeriedadOferta?: { Requerida: boolean; MontoClp: number; VigenciaDias: number; Tipo: string }
    FielCumplimiento?: { Requerida: boolean; Porcentaje: number; VigenciaDias: number }
  }
  Ponderaciones?: {
    Economica: number
    Tecnica: number
    Experiencia: number
    Remuneraciones: number
    Formal: number
  }
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
  
  // Modal de Licitación 360° & Postulación
  const [licitacionModal, setLicitacionModal] = useState<LicitacionChileCompra | null>(null)
  const [tabModal, setTabModal] = useState<'ficha' | 'visita' | 'garantias' | 'ponderaciones' | 'postulacion' | 'ia'>('ficha')
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  // Formulario de Postulación en Modal
  const [postulacionNeto, setPostulacionNeto] = useState<number>(0)
  const [checklist, setChecklist] = useState({
    visitaTerreno: false,
    polizaSeriedad: false,
    chileProveedores: true,
    os10Vigente: true,
    propuestaTecnica: false,
    anexoFirmado: false
  })
  const [postulacionGuardada, setPostulacionGuardada] = useState(false)
  const [postulacionesGuardadas, setPostulacionesGuardadas] = useState<Record<string, any>>({})

  // Estado para el Análisis IA
  const [analizandoIA, setAnalizandoIA] = useState(false)
  const [informeIA, setInformeIA] = useState<any>(null)
  const [errorIA, setErrorIA] = useState<string>('')
  const [seccionExpandida, setSeccionExpandida] = useState<string>('resumen')

  // Cargar ticket y postulaciones guardadas (con sincronización móvil automática)
  useEffect(() => {
    try {
      const guardado = localStorage.getItem('gama_mercadopublico_ticket') || ''
      if (guardado) {
        setTicketApi(guardado)
        setTicketInput(guardado)
      } else {
        // Consultar ticket compartido desde el servidor / Supabase para dispositivos móviles
        fetch('/api/mercado-publico?accion=get_ticket')
          .then(r => r.json())
          .then(d => {
            if (d.ticket) {
              setTicketApi(d.ticket)
              setTicketInput(d.ticket)
              try { localStorage.setItem('gama_mercadopublico_ticket', d.ticket) } catch {}
            }
          })
          .catch(() => {})
      }
      const postGuardadas = localStorage.getItem('gama_postulaciones_mercadopublico')
      if (postGuardadas) {
        setPostulacionesGuardadas(JSON.parse(postGuardadas))
      }
    } catch {}
  }, [])

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

  // Abrir Modal de Licitación 360°
  const abrirModalLicitacion = (lic: LicitacionChileCompra, tabInicial: 'ficha' | 'visita' | 'garantias' | 'ponderaciones' | 'postulacion' | 'ia' = 'ficha') => {
    setLicitacionModal(lic)
    setTabModal(tabInicial)
    setInformeIA(null)
    setErrorIA('')
    setPostulacionGuardada(false)
    
    // Sugerir monto neto al 89% del monto estimado para ganar puntaje económico
    const montoBase = lic.MontoEstimado > 0 ? lic.MontoEstimado : 35000000
    const sugeridoNeto = Math.round((montoBase * 0.89) / 1.19)
    setPostulacionNeto(sugeridoNeto)

    // Cargar checklist guardado si existe
    if (postulacionesGuardadas[lic.CodigoExterno]) {
      const p = postulacionesGuardadas[lic.CodigoExterno]
      if (p.montoNeto) setPostulacionNeto(p.montoNeto)
      if (p.checklist) setChecklist(p.checklist)
      setPostulacionGuardada(true)
    } else {
      setChecklist({
        visitaTerreno: false,
        polizaSeriedad: false,
        chileProveedores: true,
        os10Vigente: true,
        propuestaTecnica: false,
        anexoFirmado: false
      })
    }
  }

  // Guardar Postulación en CRM sin salir de Mercado Público
  const handleGuardarPostulacion = () => {
    if (!licitacionModal) return
    const id = licitacionModal.CodigoExterno
    const iva = Math.round(postulacionNeto * 0.19)
    const total = postulacionNeto + iva

    const nuevaData = {
      ...postulacionesGuardadas,
      [id]: {
        codigo: id,
        organismo: licitacionModal.Organismo,
        nombre: licitacionModal.Nombre,
        montoNeto: postulacionNeto,
        iva,
        total,
        checklist,
        fechaRegistro: new Date().toISOString(),
        estado: 'Registrada en CRM'
      }
    }

    setPostulacionesGuardadas(nuevaData)
    try {
      localStorage.setItem('gama_postulaciones_mercadopublico', JSON.stringify(nuevaData))
    } catch {}
    setPostulacionGuardada(true)
  }

  // ── ANÁLISIS IA DE LICITACIÓN ──
  const handleAnalizarIA = async (lic: LicitacionChileCompra) => {
    setAnalizandoIA(true)
    setErrorIA('')
    setInformeIA(null)
    setTabModal('ia')
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
    if (!licitacionModal) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const margin = 15
      const pageW = 210
      const contentW = pageW - margin * 2
      let y = margin

      // Header Corporativo
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageW, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('GAMA SEGURIDAD — FICHA DE POSTULACIÓN A LICITACIÓN', margin, 15)
      doc.setFontSize(9)
      doc.setTextColor(148, 163, 184)
      doc.text(`ID Mercado Público: ${licitacionModal.CodigoExterno}  |  Generado: ${new Date().toLocaleString('es-CL')}`, margin, 23)
      doc.setTextColor(99, 102, 241)
      doc.text(`Organismo: ${licitacionModal.Organismo}`, margin, 30)
      y = 45

      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('DATOS DE LA LICITACIÓN', margin, y); y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const nombreLines = doc.splitTextToSize(licitacionModal.Nombre, contentW)
      doc.text(nombreLines, margin, y); y += nombreLines.length * 5 + 3
      doc.text(`Monto Estimado Estado: $${Math.round(licitacionModal.MontoEstimado).toLocaleString('es-CL')} CLP`, margin, y); y += 5
      doc.text(`Región / Ubicación: ${licitacionModal.Region || 'Chile'} ${licitacionModal.Comuna ? `(${licitacionModal.Comuna})` : ''}`, margin, y); y += 5
      doc.text(`Cierre de Ofertas: ${licitacionModal.FechaCierre ? new Date(licitacionModal.FechaCierre).toLocaleString('es-CL') : 'N/A'}`, margin, y); y += 10

      // Visita Técnica
      doc.setFont('helvetica', 'bold')
      doc.text('VISITA TÉCNICA A TERRENO', margin, y); y += 5
      doc.setFont('helvetica', 'normal')
      doc.text(`Carácter: Obligatoria (Se exige certificado de asistencia firmado por el inspector)`, margin, y); y += 5
      doc.text(`Lugar: ${licitacionModal.DireccionUnidad || licitacionModal.Organismo}`, margin, y); y += 8

      // Garantías
      doc.setFont('helvetica', 'bold')
      doc.text('GARANTÍAS EXIGIDAS', margin, y); y += 5
      doc.setFont('helvetica', 'normal')
      const seriedad = Math.round(licitacionModal.MontoEstimado * 0.05)
      doc.text(`- Seriedad de la Oferta: $${seriedad.toLocaleString('es-CL')} CLP (5%) - Póliza de Seguro Electrónica`, margin, y); y += 5
      doc.text(`- Fiel Cumplimiento de Contrato: 10% del contrato adjudicado`, margin, y); y += 8

      // Ponderaciones
      doc.setFont('helvetica', 'bold')
      doc.text('PAUTA DE EVALUACIÓN Y PONDERACIONES', margin, y); y += 5
      doc.setFont('helvetica', 'normal')
      doc.text(`- Oferta Económica: 45%  |  Propuesta Técnica & SLA 24/7: 25%`, margin, y); y += 5
      doc.text(`- Experiencia & OS-10: 15%  |  Remuneraciones y Empleo: 10%  |  Formales: 5%`, margin, y); y += 10

      // Propuesta Gama
      if (postulacionNeto > 0) {
        const iva = Math.round(postulacionNeto * 0.19)
        const total = postulacionNeto + iva
        doc.setFillColor(241, 245, 249)
        doc.rect(margin, y, contentW, 22, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text('OFERTA ECONÓMICA FORMULADA POR GAMA SEGURIDAD', margin + 3, y + 6)
        doc.setFont('helvetica', 'normal')
        doc.text(`Neto: $${postulacionNeto.toLocaleString('es-CL')} CLP  +  IVA (19%): $${iva.toLocaleString('es-CL')} CLP`, margin + 3, y + 12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(16, 185, 129)
        doc.text(`TOTAL OFERTADO: $${total.toLocaleString('es-CL')} CLP`, margin + 3, y + 18)
      }

      doc.save(`Postulacion_Gama_${licitacionModal.CodigoExterno}.pdf`)
    } catch (e: any) {
      console.error('Error generando PDF:', e)
    }
  }

  // Filtrado local estricto por rubro, región, estado, búsqueda y ordenamiento por fecha de cierre más pronta
  const licitacionesFiltradas = licitaciones
    .filter(l => {
      // 1. Filtro estricto por Rubro
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

              {Object.keys(postulacionesGuardadas).length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <CheckSquare className="w-3 h-3 text-purple-400" /> {Object.keys(postulacionesGuardadas).length} Postulaciones en CRM
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <Building2 className="w-7 h-7 text-indigo-400" />
              Mercado Público & Licitaciones Estatales
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Monitoreo y postulación directa a licitaciones públicas de seguridad privada, CCTV, televigilancia y alarmas. Consulta visitas técnicas, garantías y ponderaciones en ventana emergente sin abandonar la pantalla.
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

      {/* Alerta de error de API si aplica */}
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

      {/* Barra de Filtros y Búsqueda */}
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
          <p className="text-xs text-slate-500 mt-1">Intenta seleccionar &quot;Todas las Licitaciones&quot; o &quot;Todas las Regiones&quot;.</p>
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

            const estaPostulada = Boolean(postulacionesGuardadas[lic.CodigoExterno])

            return (
              <div 
                key={lic.CodigoExterno}
                onClick={() => abrirModalLicitacion(lic, 'ficha')}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/10 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${rubroColor}`}>
                          {lic.Rubro}
                        </span>
                        {estaPostulada ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black bg-purple-950 text-purple-300 border border-purple-700 flex items-center gap-1">
                            <CheckSquare className="w-3 h-3 text-purple-400" /> Postulada en CRM
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ChileCompra Oficial
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

                  {/* Chips Clave de Licitación (Visita Técnica, Garantías y Ponderaciones) */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3 pt-1">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      Visita: Obligatoria
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-indigo-400" />
                      Garantía: ~5% (${Math.round((lic.MontoEstimado || 35000000) * 0.05 / 1000000 * 10) / 10}M)
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Scale className="w-3 h-3 text-emerald-400" />
                      Pauta: 45% Econ / 25% Téc
                    </span>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-slate-400 line-clamp-2 sm:line-clamp-3 mb-3 leading-relaxed">
                    {lic.Descripcion}
                  </p>
                </div>

                {/* Métricas y Acciones */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Monto Estimado</span>
                      <span className="font-bold font-mono text-emerald-400 text-xs sm:text-sm">
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

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => abrirModalLicitacion(lic, 'postulacion')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{estaPostulada ? 'Ver Postulación' : '🎯 Postular'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAnalizarIA(lic)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition cursor-pointer"
                    >
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                      <span>Analizar IA</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── VENTANA EMERGENTE: MODAL LICITACIÓN 360° & POSTULACIÓN OFICIAL RESPONSIVE ── */}
      {licitacionModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-700 w-full sm:max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[94vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
            {/* Header Modal Responsive */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 shadow-md">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-black text-[11px] sm:text-xs text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-lg border border-indigo-700/80">
                        ID: {licitacionModal.CodigoExterno}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                        {licitacionModal.Estado}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {licitacionModal.Rubro}
                      </span>
                      {licitacionModal.Region && (
                        <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700/60 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400" />
                          {licitacionModal.Region}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-lg font-black text-white leading-snug line-clamp-2 sm:line-clamp-none">
                      {licitacionModal.Nombre}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={exportarInformePDF}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
                    title="Exportar Resumen a PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button
                    onClick={() => setLicitacionModal(null)}
                    className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Selector Móvil de Pestañas (Visible en pantallas < 640px) */}
              <div className="sm:hidden mt-3">
                <select
                  value={tabModal}
                  onChange={(e) => setTabModal(e.target.value as any)}
                  className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs font-bold text-indigo-200 focus:outline-none"
                >
                  <option value="ficha">📋 Ficha & Alcance</option>
                  <option value="visita">📍 Visita a Terreno (Obligatoria)</option>
                  <option value="garantias">🛡️ Garantías Exigidas</option>
                  <option value="ponderaciones">⚖️ Ponderaciones & Evaluación</option>
                  <option value="postulacion">🎯 Formular Postulación</option>
                  <option value="ia">🧠 Análisis con IA</option>
                </select>
              </div>

              {/* Pestañas de Navegación del Modal (Desktop y Tablet con scroll táctil suave) */}
              <div className="hidden sm:flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'ficha', label: 'Ficha & Alcance', icon: FileText },
                  { id: 'visita', label: 'Visita a Terreno', icon: Calendar },
                  { id: 'garantias', label: 'Garantías Exigidas', icon: Shield },
                  { id: 'ponderaciones', label: 'Ponderaciones', icon: Scale },
                  { id: 'postulacion', label: '🎯 Formular Postulación', icon: CheckSquare },
                  { id: 'ia', label: '🧠 Análisis con IA', icon: Brain },
                ].map(tab => {
                  const Icon = tab.icon
                  const active = tabModal === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setTabModal(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                        active 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Contenido según pestaña */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs text-slate-300">
              {/* ── PESTAÑA 1: FICHA & ALCANCE ── */}
              {tabModal === 'ficha' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Monto Estimado</span>
                      <strong className="text-base font-black font-mono text-emerald-400 block mt-0.5">
                        ${Math.round(licitacionModal.MontoEstimado).toLocaleString('es-CL')} {licitacionModal.Moneda}
                      </strong>
                    </div>
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Cierre de Ofertas</span>
                      <strong className="text-sm font-bold text-amber-300 block mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {licitacionModal.FechaCierre ? new Date(licitacionModal.FechaCierre).toLocaleString('es-CL') : 'Ver bases'}
                      </strong>
                    </div>
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Tipo de Proceso</span>
                      <strong className="text-xs font-bold text-white block mt-0.5 truncate">{licitacionModal.Tipo}</strong>
                    </div>
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Organismo / RUT</span>
                      <strong className="text-xs font-bold text-white block mt-0.5 truncate">{licitacionModal.Organismo}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">RUT: {licitacionModal.RutComprador || '60.000.000-0'}</span>
                    </div>
                  </div>

                  {/* Ubicación y Entrega */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-white block">Lugar de Ejecución / Recinto</strong>
                      <span className="text-slate-300">{licitacionModal.DireccionUnidad || 'Dirección de dependencias del organismo convocante'} ({licitacionModal.Region || 'Chile'})</span>
                    </div>
                  </div>

                  {/* Descripción / Requerimiento Técnico */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                      Resumen del Requerimiento Oficial de Bases Técnicas
                    </span>
                    <p className="text-slate-300 leading-relaxed font-medium">
                      {licitacionModal.Descripcion}
                    </p>
                  </div>

                  {/* Calendario de Etapas */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Calendario de Hitos Oficiales
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">1. Consultas</span>
                        <span className="font-bold text-slate-200">Abiertas en Portal</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">2. Visita Técnica</span>
                        <span className="font-bold text-amber-300">Obligatoria en Terreno</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">3. Cierre Ofertas</span>
                        <span className="font-bold text-red-400">{licitacionModal.FechaCierre ? new Date(licitacionModal.FechaCierre).toLocaleDateString('es-CL') : 'Programado'}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">4. Apertura</span>
                        <span className="font-bold text-emerald-400">Electrónica 24 hrs post</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PESTAÑA 2: VISITA TÉCNICA ── */}
              {tabModal === 'visita' && (
                <div className="space-y-4">
                  <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-200 font-bold block">Condición Crítica: Visita a Terreno Obligatoria</strong>
                      <p className="text-amber-300/90 text-xs mt-1 leading-relaxed">
                        Para licitaciones de seguridad privada, CCTV, alarmas y control de acceso, la visita a terreno es de carácter <strong>OBLIGATORIO</strong>. La no concurrencia o la falta del <em>Certificado de Visita Técnica</em> emitido y firmado por el organismo comprador dejará la oferta <strong>automáticamente INADMISIBLE</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Fecha y Hora Programada</span>
                      <strong className="text-sm font-black text-white block flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        5 días hábiles previos al cierre (10:30 hrs)
                      </strong>
                      <span className="text-[11px] text-slate-400">Puntualidad estricta. Tolerancia máxima: 10 minutos.</span>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Lugar de Presentación</span>
                      <strong className="text-sm font-bold text-white block truncate flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                        {licitacionModal.DireccionUnidad || licitacionModal.Organismo}
                      </strong>
                      <span className="text-[11px] text-slate-400">Presentarse con Cédula de Identidad y EPP reglamentarios.</span>
                    </div>
                  </div>

                  {/* Checklist de la Visita */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                      Protocolo de Visita Técnica para Operaciones Gama
                    </span>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-center gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.visitaTerreno}
                          onChange={(e) => setChecklist(c => ({ ...c, visitaTerreno: e.target.checked }))}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span className="text-slate-200">Visita técnica agendada / asistida por técnico Gama con firma de certificado</span>
                      </label>
                      <div className="text-[11px] text-slate-400 pl-2 space-y-1">
                        <p>✓ Inspección de puntos de enlace, ductación existente y acometida eléctrica para CCTV.</p>
                        <p>✓ Verificación de cobertura perimetral y zonas ciegas para detección de intrusión.</p>
                        <p>✓ Solicitud de timbre y firma del Certificado Oficial de Visita emitido por la contraparte.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PESTAÑA 3: GARANTÍAS ── */}
              {tabModal === 'garantias' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Garantía de Seriedad de la Oferta */}
                    <div className="bg-slate-950/80 p-5 rounded-2xl border border-indigo-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold">
                        <Shield className="w-5 h-5" />
                        <h4 className="text-sm text-white">1. Garantía de Seriedad de la Oferta</h4>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Asegura que el oferente mantendrá su propuesta hasta la adjudicación.
                      </p>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Monto Exigido:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            ${Math.round(licitacionModal.MontoEstimado * 0.05).toLocaleString('es-CL')} CLP (~5%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Vigencia Requerida:</span>
                          <span className="font-bold text-slate-200">60 días corridos post-cierre</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Instrumento:</span>
                          <span className="font-bold text-cyan-400">Póliza de Seguro Electrónica</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1">
                        <span className="font-bold text-slate-300 block">Glosa Exigida:</span>
                        <p className="font-mono italic text-indigo-300">&quot;Para garantizar la seriedad de la oferta en licitación {licitacionModal.CodigoExterno}&quot;</p>
                      </div>
                    </div>

                    {/* Garantía de Fiel Cumplimiento */}
                    <div className="bg-slate-950/80 p-5 rounded-2xl border border-emerald-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <ShieldCheck className="w-5 h-5" />
                        <h4 className="text-sm text-white">2. Garantía de Fiel Cumplimiento de Contrato</h4>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Se entrega una vez adjudicada la licitación, previo a la suscripción del contrato.
                      </p>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Porcentaje:</span>
                          <span className="font-mono font-bold text-emerald-400">10% del Valor Contratado</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Monto Estimado:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            ${Math.round(licitacionModal.MontoEstimado * 0.10).toLocaleString('es-CL')} CLP
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Vigencia:</span>
                          <span className="font-bold text-slate-200">Duración del contrato + 60 días</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1">
                        <span className="font-bold text-slate-300 block">Emisión:</span>
                        <p className="text-slate-300">Gama Seguridad tramita pólizas digitales vía corredora asociada en 24 horas.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PESTAÑA 4: PONDERACIONES & EVALUACIÓN ── */}
              {tabModal === 'ponderaciones' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-400" />
                      Pauta Oficial de Evaluación y Criterios de Adjudicación (100%)
                    </h4>
                    <p className="text-slate-400 text-[11px]">
                      Ponderación típica estandarizada de ChileCompra para contratos de televigilancia, CCTV y seguridad privada:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        titulo: '1. Oferta Económica (Precio Ofertado)',
                        porcentaje: 45,
                        color: 'bg-emerald-500',
                        formula: 'Puntaje = (Precio Mínimo Ofertado / Precio Oferta Gama) * 45 puntos',
                        consejo: 'Ajustar al 89% del presupuesto para obtener 43-45 puntos sin destruir margen.'
                      },
                      {
                        titulo: '2. Calidad Técnica, Metodología & SLA 24/7',
                        porcentaje: 25,
                        color: 'bg-blue-500',
                        formula: 'Evaluación de tiempos de respuesta (<4 hrs), enlace de central y planes de contingencia',
                        consejo: 'Adjuntar certificado de enlace de central de monitoreo y protocolos de respuesta móvil.'
                      },
                      {
                        titulo: '3. Experiencia del Oferente & Acreditación OS-10',
                        porcentaje: 15,
                        color: 'bg-purple-500',
                        formula: 'Contratos similares vigentes en el Estado + acreditación de dotación técnica',
                        consejo: 'Adjuntar certificados de recepción conforme de municipalidades u hospitales clientes.'
                      },
                      {
                        titulo: '4. Condiciones de Empleo y Remuneraciones',
                        porcentaje: 10,
                        color: 'bg-amber-500',
                        formula: 'Remuneraciones por sobre el ingreso mínimo + póliza de seguro complementario',
                        consejo: 'Declarar tramo de sueldos técnicos superiores al promedio de la industria.'
                      },
                      {
                        titulo: '5. Cumplimiento de Requisitos Formales',
                        porcentaje: 5,
                        color: 'bg-cyan-500',
                        formula: 'Presentación completa y correcta de antecedentes en el acto de apertura',
                        consejo: 'Subir todos los anexos 24 horas antes para no perder estos 5 puntos vitales.'
                      },
                    ].map((crit, idx) => (
                      <div key={idx} className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-white text-xs">{crit.titulo}</strong>
                          <span className="font-mono font-black text-xs text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-md">
                            {crit.porcentaje}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className={`h-full ${crit.color}`} style={{ width: `${crit.porcentaje}%` }} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-400 gap-1 pt-1">
                          <span>Fórmula: {crit.formula}</span>
                          <span className="text-indigo-300 font-semibold">💡 {crit.consejo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PESTAÑA 5: FORMULAR POSTULACIÓN GAMA ── */}
              {tabModal === 'postulacion' && (
                <div className="space-y-4">
                  {postulacionGuardada && (
                    <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-200">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <strong className="text-white block">¡Postulación Registrada en Gama CRM!</strong>
                          <span className="text-xs">Los datos y el presupuesto interno quedaron guardados sin salir de Mercado Público.</span>
                        </div>
                      </div>
                      <button
                        onClick={exportarInformePDF}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  )}

                  {/* Simulador de Oferta Económica */}
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-emerald-400" />
                        Formulación de Oferta Económica Gama
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Presupuesto Estado: ${Math.round(licitacionModal.MontoEstimado).toLocaleString('es-CL')} CLP
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">Monto Neto Propuesto ($ CLP)</label>
                        <input
                          type="number"
                          value={postulacionNeto}
                          onChange={(e) => setPostulacionNeto(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">IVA 19% ($ CLP)</label>
                        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-slate-400">
                          ${Math.round(postulacionNeto * 0.19).toLocaleString('es-CL')}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-emerald-400 block">Total Bruto a Ofertar ($ CLP)</label>
                        <div className="w-full bg-emerald-950/40 border border-emerald-500/50 rounded-xl px-3 py-2 text-base font-mono font-black text-emerald-400">
                          ${Math.round(postulacionNeto * 1.19).toLocaleString('es-CL')}
                        </div>
                      </div>
                    </div>

                    {/* Indicador de Competitividad */}
                    {licitacionModal.MontoEstimado > 0 && (
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Comparativa con presupuesto licitado:</span>
                        {(() => {
                          const total = Math.round(postulacionNeto * 1.19)
                          const diff = licitacionModal.MontoEstimado - total
                          const pct = Math.round((diff / licitacionModal.MontoEstimado) * 100)
                          if (diff >= 0) {
                            return (
                              <span className="font-bold text-emerald-400">
                                ✓ Ofertando un {pct}% por debajo del tope ($ {diff.toLocaleString('es-CL')} ahorro) · Alta probabilidad
                              </span>
                            )
                          }
                          return (
                            <span className="font-bold text-red-400">
                              ⚠️ Oferta supera el presupuesto en {Math.abs(pct)}% ($ {Math.abs(diff).toLocaleString('es-CL')}) · Riesgo de inadmisibilidad
                            </span>
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Checklist de Documentos Obligatorios */}
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                      Checklist de Verificación Previo a la Subida al Portal
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'visitaTerreno', label: '1. Certificado de Visita Técnica firmado por inspector' },
                        { key: 'polizaSeriedad', label: '2. Póliza de Garantía de Seriedad de la Oferta emitida' },
                        { key: 'chileProveedores', label: '3. Certificado de Habilidad ChileProveedores vigente' },
                        { key: 'os10Vigente', label: '4. Copia de credenciales OS-10 de guardias / operadores' },
                        { key: 'propuestaTecnica', label: '5. Propuesta técnica con SLA 24/7 y protocolos de central' },
                        { key: 'anexoFirmado', label: '6. Formulario de Anexo Económico firmado por Rep. Legal' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-900 transition">
                          <input
                            type="checkbox"
                            checked={(checklist as any)[item.key]}
                            onChange={(e) => setChecklist(c => ({ ...c, [item.key]: e.target.checked }))}
                            className="w-4 h-4 accent-indigo-600 rounded"
                          />
                          <span className={(checklist as any)[item.key] ? 'text-white font-medium' : 'text-slate-400'}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Acciones de Postulación */}
                  <div className="p-4 bg-slate-950/90 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-300">
                      <span className="font-bold text-white block">Postulación Formal Gama Seguridad</span>
                      <span>Guarda los datos en el CRM y accede a ChileCompra para cargar los archivos.</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleGuardarPostulacion}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Postulación en CRM</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(licitacionModal.CodigoExterno)
                          setCopiadoId(licitacionModal.CodigoExterno)
                          window.open('https://www.mercadopublico.cl/Portal/Modules/Site/Busquedas/BuscarLicitacion.aspx?qs=1', '_blank')
                        }}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copiar ID e Ir a ChileCompra</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PESTAÑA 6: ANÁLISIS IA GAMA ── */}
              {tabModal === 'ia' && (
                <div className="space-y-4">
                  {!informeIA && !analizandoIA && (
                    <div className="bg-slate-950/80 p-8 rounded-2xl border border-purple-500/30 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto">
                        <Brain className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-white">Análisis Inteligente de Licitación con IA</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Examina los pliegos técnicos, documentos, plazos y condiciones comerciales con el perfil operativo de Gama Seguridad para generar un informe de viabilidad y recomendaciones de oferta.
                      </p>
                      <button
                        onClick={() => handleAnalizarIA(licitacionModal)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition cursor-pointer inline-flex items-center gap-2"
                      >
                        <Brain className="w-4 h-4" />
                        <span>Iniciar Análisis con IA</span>
                      </button>
                    </div>
                  )}

                  {analizandoIA && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full border-4 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                        <Brain className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
                      </div>
                      <p className="text-sm font-bold text-white">Analizando pliegos y condiciones con IA...</p>
                      <p className="text-xs text-slate-400 text-center max-w-xs">Procesando requerimientos técnicos de ChileCompra. Esto toma unos segundos.</p>
                    </div>
                  )}

                  {errorIA && !analizandoIA && (
                    <div className="bg-red-950/60 border border-red-500/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-200">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white mb-1">Aviso de análisis</strong>
                        <span>{errorIA}</span>
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

                        <Seccion id="resumen" titulo="Resumen Ejecutivo" icono={<TrendingUp className="w-4 h-4 text-indigo-400" />}>
                          <p className="leading-relaxed">{informeIA.resumen_ejecutivo}</p>
                          {informeIA.alineacion_servicios && <p className="mt-2 text-indigo-300 leading-relaxed">{informeIA.alineacion_servicios}</p>}
                        </Seccion>

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

                        {informeIA.precio_referencial && (
                          <Seccion id="precio" titulo="Precio Referencial Sugerido" icono={<TrendingUp className="w-4 h-4 text-emerald-400" />}>
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
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Footer Modal con Acciones Principales */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setLicitacionModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cerrar Ventana
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setTabModal('postulacion')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Formular Postulación</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const item = licitacionModal
                    onCotizarLicitacion(item)
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700/80 cursor-pointer"
                  title="Abrir presupuesto avanzado en CRM"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Editor Presupuesto CRM</span>
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
                  onClick={async () => {
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
                  }}
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

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setModalTicketAbierto(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const val = ticketInput.trim()
                  setTicketApi(val)
                  try { localStorage.setItem('gama_mercadopublico_ticket', val) } catch {}
                  if (val) {
                    fetch(`/api/mercado-publico?accion=save_ticket&ticket=${encodeURIComponent(val)}`).catch(() => {})
                  }
                  setModalTicketAbierto(false)
                  setResultadoPrueba(null)
                }}
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

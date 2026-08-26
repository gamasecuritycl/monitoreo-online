'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase, type EventoMonitoreo } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

interface Props {
  onClose: () => void
  clientesMap?: Record<string, Record<string, string>>
  codigosMap?: Record<string, { descripcion: string; zn_us: string; color: string }>
  onVerExpediente?: (cuenta: string) => void
  onVerZonificacion?: (cuenta: string) => void
  onVerCamaras?: (cuenta: string) => void
  onEnviarWhatsApp?: (telefono: string, cuenta?: string) => void
}

interface ContactoDirectorio {
  cuenta: string
  nombreCliente: string
  prioridad: number
  nombreContacto: string
  telefono: string
  cargo: string
  direccion: string
  comuna: string
}

const SYSTEM_ACCOUNTS = new Set([
  'CLIENTES',
  'CODIGOS',
  'ZONAS',
  '__SINCRONIZADOR__',
  'CAMARAS',
  'CONFIG_OPERADORES',
  'HORARIOS',
  'ORDENES_TRABAJO',
  'ENTREGAS_TURNO',
  'CONFIGURACION',
  'CONFIGURACIONES',
  'NOVEDADES'
])

function isRealAccount(cuentaRaw?: string): boolean {
  if (!cuentaRaw) return false
  const c = cuentaRaw.trim().toUpperCase()
  if (!c || c.length < 3 || c.length > 6) return false
  if (c.includes(':') || c.includes('-') || c.includes('/') || c.includes(' ')) return false
  if (SYSTEM_ACCOUNTS.has(c) || c.startsWith('__') || c.startsWith('DAHUA') || c.startsWith('CAMARA') || c.startsWith('CONFIG')) return false
  if (/\d+:\d+:\d+/.test(c)) return false
  if (!/^[A-Z0-9]{3,6}$/.test(c)) return false
  return true
}

export default function BuscadorUniversalModal({
  onClose,
  clientesMap = {},
  codigosMap = {},
  onVerExpediente,
  onVerZonificacion,
  onVerCamaras,
  onEnviarWhatsApp
}: Props) {
  const [pestana, setPestana] = useState<'universal' | 'historico' | 'directorio'>('universal')

  // Estados de Búsqueda Universal
  const [queryUniversal, setQueryUniversal] = useState('')
  const [resultadosEventos, setResultadosEventos] = useState<EventoMonitoreo[]>([])
  const [cargandoUniversal, setCargandoUniversal] = useState(false)

  // Estados de Auditoría Histórica
  const hoyStr = new Date().toISOString().split('T')[0]
  const haceSieteDiasStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [fechaDesde, setFechaDesde] = useState(haceSieteDiasStr)
  const [fechaHasta, setFechaHasta] = useState(hoyStr)
  const [cuentaFiltro, setCuentaFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<'todos' | 'robo' | 'incendio_panico' | 'aperturas_cierres' | 'energia_tecnico' | 'autotest'>('todos')
  const [limiteFiltro, setLimiteFiltro] = useState<number>(200)
  const [eventosHistoricos, setEventosHistoricos] = useState<EventoMonitoreo[]>([])
  const [cargandoHistorico, setCargandoHistorico] = useState(false)

  // Estados de Directorio
  const [queryDirectorio, setQueryDirectorio] = useState('')

  // Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 🔍 BÚSQUEDA UNIVERSAL (Realtime / Cache DB + Supabase query)
  const ejecutarBusquedaUniversal = useCallback(async (q: string) => {
    const term = q.trim().toUpperCase()
    if (!term) {
      setResultadosEventos([])
      return
    }
    try {
      setCargandoUniversal(true)
      const { data, error } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .or(`cuenta.ilike.%${term}%,nombre_abonado.ilike.%${term}%,evento.ilike.%${term}%,zona.ilike.%${term}%,usuario.ilike.%${term}%`)
        .order('fecha_hora', { ascending: false })
        .limit(150)

      if (error) {
        console.error('Error buscando eventos:', error)
      } else {
        const filtrados = (data || []).filter(e => isRealAccount(e.cuenta))
        setResultadosEventos(filtrados)
      }
    } catch (err) {
      console.error('Error en búsqueda universal:', err)
    } finally {
      setCargandoUniversal(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (queryUniversal.trim()) {
        ejecutarBusquedaUniversal(queryUniversal)
      } else {
        setResultadosEventos([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [queryUniversal, ejecutarBusquedaUniversal])

  // 📁 BÚSQUEDA HISTÓRICA PROFUNDA CON FILTROS
  const ejecutarBusquedaHistorica = useCallback(async () => {
    try {
      setCargandoHistorico(true)
      let query = supabase
        .from('eventos_monitoreo')
        .select('*')
        .order('fecha_hora', { ascending: false })
        .limit(limiteFiltro)

      if (fechaDesde) {
        query = query.gte('fecha_hora', `${fechaDesde}T00:00:00`)
      }
      if (fechaHasta) {
        query = query.lte('fecha_hora', `${fechaHasta}T23:59:59`)
      }
      if (cuentaFiltro.trim()) {
        const cNorm = cuentaFiltro.trim().toUpperCase()
        query = query.ilike('cuenta', `%${cNorm}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error cargando histórico:', error)
        return
      }

      let res = (data || []).filter(e => isRealAccount(e.cuenta))

      // Filtrar por categoría
      if (categoriaFiltro !== 'todos') {
        res = res.filter(e => {
          const ev = (e.evento || '').toLowerCase()
          if (categoriaFiltro === 'robo') return ev.includes('robo') || ev.includes('alarma') || ev.includes('intrus')
          if (categoriaFiltro === 'incendio_panico') return ev.includes('incendio') || ev.includes('panico') || ev.includes('medica') || ev.includes('humo') || ev.includes('fuego')
          if (categoriaFiltro === 'aperturas_cierres') return ev.includes('cierre') || ev.includes('apertura') || ev.includes('armado') || ev.includes('desarmado')
          if (categoriaFiltro === 'energia_tecnico') return ev.includes('energia') || ev.includes('bateria') || ev.includes('corte') || ev.includes('tecnico') || ev.includes('fallo') || ev.includes('red')
          if (categoriaFiltro === 'autotest') return ev.includes('test') || ev.includes('autotest') || ev.includes('periodico')
          return true
        })
      }

      setEventosHistoricos(res)
    } catch (err) {
      console.error('Error ejecutando consulta histórica:', err)
    } finally {
      setCargandoHistorico(false)
    }
  }, [fechaDesde, fechaHasta, cuentaFiltro, categoriaFiltro, limiteFiltro])

  // Cargar histórico automáticamente al cambiar pestaña a histórico
  useEffect(() => {
    if (pestana === 'historico' && eventosHistoricos.length === 0) {
      ejecutarBusquedaHistorica()
    }
  }, [pestana, eventosHistoricos.length, ejecutarBusquedaHistorica])

  // 👥 EXTRAER DIRECTORIO DE CONTACTOS DE CLIENTES
  const listaContactosDirectorio = useMemo(() => {
    const arr: ContactoDirectorio[] = []
    Object.entries(clientesMap).forEach(([cuentaKey, datos]) => {
      if (!isRealAccount(cuentaKey)) return
      const nombreCliente = datos.nombre || datos.empresa || 'TITULAR'
      const direccion = datos.direccion || ''
      const comuna = datos.sector || datos.ciudad || datos.comuna || ''

      for (let i = 1; i <= 7; i++) {
        const nom = (datos[`nombre${i}`] || '').trim()
        const tel = (datos[`t${i}`] || datos[`telefono${i}`] || '').trim()
        const carg = (datos[`carg${i}`] || datos[`cargo${i}`] || '').trim()
        if (nom || tel) {
          arr.push({
            cuenta: cuentaKey.padStart(4, '0'),
            nombreCliente: nombreCliente.toUpperCase(),
            prioridad: i,
            nombreContacto: nom.toUpperCase() || `CONTACTO ${i}`,
            telefono: tel || 'Sin número',
            cargo: carg.toUpperCase() || (i === 1 ? 'TITULAR' : 'CONTACTO'),
            direccion,
            comuna
          })
        }
      }
    })
    return arr
  }, [clientesMap])

  // Filtrado de contactos en vivo
  const contactosFiltrados = useMemo(() => {
    const q = queryDirectorio.trim().toUpperCase()
    if (!q) return listaContactosDirectorio
    return listaContactosDirectorio.filter(c =>
      c.cuenta.includes(q) ||
      c.nombreCliente.includes(q) ||
      c.nombreContacto.includes(q) ||
      c.telefono.includes(q) ||
      c.cargo.includes(q) ||
      c.direccion.toUpperCase().includes(q)
    )
  }, [listaContactosDirectorio, queryDirectorio])

  // 📊 EXPORTAR A EXCEL (.xlsx)
  const exportarExcel = (lista: EventoMonitoreo[], titulo: string) => {
    if (!lista || lista.length === 0) {
      alert('No hay eventos para exportar.')
      return
    }
    const dataFormatted = lista.map((e, idx) => ({
      NRO: idx + 1,
      FECHA_HORA: e.fecha_hora,
      CUENTA: e.cuenta,
      ABONADO: e.nombre_abonado || clientesMap[e.cuenta]?.nombre || '---',
      EVENTO: e.evento,
      ZONA: e.zona || '--',
      USUARIO: e.usuario || '--',
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataFormatted)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Eventos_Monitoreo')
    XLSX.writeFile(workbook, `Reporte_${titulo.replace(/\s+/g, '_')}_${hoyStr}.xlsx`)
  }

  // 📄 EXPORTAR A PDF (.pdf)
  const exportarPDF = (lista: EventoMonitoreo[], titulo: string) => {
    if (!lista || lista.length === 0) {
      alert('No hay eventos para generar PDF.')
      return
    }
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(`GAMA SEGURIDAD — ${titulo.toUpperCase()}`, 14, 15)
    doc.setFontSize(9)
    doc.text(`Fecha de emisión: ${new Date().toLocaleString('es-CL')} | Total registros: ${lista.length}`, 14, 22)
    doc.line(14, 25, 196, 25)

    let y = 32
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('FECHA/HORA', 14, y)
    doc.text('CTA', 55, y)
    doc.text('ABONADO', 75, y)
    doc.text('EVENTO', 135, y)
    doc.text('ZN/US', 185, y)
    doc.line(14, y + 2, 196, y + 2)
    y += 7

    doc.setFont('helvetica', 'normal')
    lista.slice(0, 45).forEach((e) => {
      if (y > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(String(e.fecha_hora || '').substring(0, 19), 14, y)
      doc.text(String(e.cuenta || ''), 55, y)
      doc.text(String(e.nombre_abonado || clientesMap[e.cuenta]?.nombre || '').substring(0, 28), 75, y)
      doc.text(String(e.evento || '').substring(0, 26), 135, y)
      doc.text(`${e.zona || '-'}/${e.usuario || '-'}`, 185, y)
      y += 5.5
    })

    if (lista.length > 45) {
      doc.text(`... y ${lista.length - 45} registros adicionales guardados en la exportación Excel completa.`, 14, y + 5)
    }

    doc.save(`GAMA_Reporte_${titulo.replace(/\s+/g, '_')}_${hoyStr}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in font-sans">
      <div className="bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden rounded-sm">
        
        {/* HEADER BARRA ESTILO SCORPION WINDOWS 95 */}
        <div className="bg-[#000080] text-white px-3 py-1.5 flex items-center justify-between shrink-0 border-b border-black">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <circle cx="12" cy="12" r="7" stroke="#ffffff" strokeWidth="2.5" fill="#3b82f6"/>
              <circle cx="10" cy="10" r="3" fill="#ffffff" opacity="0.8"/>
              <line x1="17" y1="17" x2="26" y2="26" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="square"/>
            </svg>
            <span className="font-bold text-xs tracking-wider uppercase">
              Buscador Universal de Central & Auditoría Histórica (Command Center)
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-5 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 text-black font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-white active:translate-y-0.5"
            title="Cerrar (ESC)"
          >
            ✕
          </button>
        </div>

        {/* BARRA DE PESTAÑAS (TABS) */}
        <div className="bg-[#c0c0c0] px-2 pt-2 border-b-2 border-gray-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPestana('universal')}
              className={`px-3 py-1 text-xs font-bold border-t-2 border-x-2 rounded-t-sm cursor-pointer transition-all ${
                pestana === 'universal'
                  ? 'bg-[#d4d0c8] border-t-white border-l-white border-r-gray-700 text-[#000080] -mb-[2px] pb-1.5 z-10'
                  : 'bg-[#b0b0b0] border-gray-400 text-gray-700 hover:bg-[#c8c8c8]'
              }`}
            >
              🔍 BÚSQUEDA UNIVERSAL RAPIDA
            </button>
            <button
              onClick={() => setPestana('historico')}
              className={`px-3 py-1 text-xs font-bold border-t-2 border-x-2 rounded-t-sm cursor-pointer transition-all ${
                pestana === 'historico'
                  ? 'bg-[#d4d0c8] border-t-white border-l-white border-r-gray-700 text-[#000080] -mb-[2px] pb-1.5 z-10'
                  : 'bg-[#b0b0b0] border-gray-400 text-gray-700 hover:bg-[#c8c8c8]'
              }`}
            >
              📁 AUDITORÍA HISTÓRICA & LOGS
            </button>
            <button
              onClick={() => setPestana('directorio')}
              className={`px-3 py-1 text-xs font-bold border-t-2 border-x-2 rounded-t-sm cursor-pointer transition-all ${
                pestana === 'directorio'
                  ? 'bg-[#d4d0c8] border-t-white border-l-white border-r-gray-700 text-[#000080] -mb-[2px] pb-1.5 z-10'
                  : 'bg-[#b0b0b0] border-gray-400 text-gray-700 hover:bg-[#c8c8c8]'
              }`}
            >
              👥 DIRECTORIO DE CONTACTOS ({listaContactosDirectorio.length})
            </button>
          </div>

          <span className="text-[10px] font-mono text-gray-700 font-bold hidden sm:inline">
            SCORPION ENGINE v5.1
          </span>
        </div>

        {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
        <div className="flex-1 overflow-hidden p-3 bg-[#d4d0c8] flex flex-col gap-3">
          
          {/* PESTAÑA 1: BÚSQUEDA UNIVERSAL */}
          {pestana === 'universal' && (
            <div className="flex flex-col h-full gap-3 overflow-hidden">
              {/* Barra de Entrada de Búsqueda */}
              <div className="bg-[#e0e0e0] p-2.5 border-2 border-t-gray-600 border-l-gray-600 border-b-white border-r-white shrink-0 flex flex-col sm:flex-row items-center gap-2">
                <span className="font-bold text-xs text-gray-800 whitespace-nowrap">Buscador Multi-Criterio:</span>
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={queryUniversal}
                    onChange={(e) => setQueryUniversal(e.target.value)}
                    placeholder="Escriba número de cuenta (ej: C7C9, 0014), nombre abonado, zona, evento o usuario..."
                    autoFocus
                    className="w-full bg-white border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-3 py-1.5 text-xs font-bold text-black focus:outline-none focus:bg-yellow-50"
                  />
                  {queryUniversal && (
                    <button
                      onClick={() => setQueryUniversal('')}
                      className="absolute right-2 top-1.5 text-gray-500 font-bold hover:text-black text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {cargandoUniversal && (
                  <span className="text-xs font-bold text-blue-800 animate-pulse whitespace-nowrap">
                    Buscando en Supabase...
                  </span>
                )}
              </div>

              {/* Resultados */}
              <div className="flex-1 bg-white border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto min-h-[300px]">
                {resultadosEventos.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🔍</span>
                    <p className="text-xs font-bold text-gray-700">
                      {queryUniversal.trim()
                        ? 'No se encontraron eventos coincidentes con su criterio.'
                        : 'Ingrese un término de búsqueda arriba para consultar eventos en tiempo real.'}
                    </p>
                    <p className="text-[11px] text-gray-500 max-w-md">
                      Puede buscar por código de cuenta (ej: 0014), palabras clave del evento (ej: ALARMA DE ROBO, APERTURA), o nombre del cliente.
                    </p>
                  </div>
                ) : (
                  <table className="w-full border-collapse text-xs text-left">
                    <thead className="sticky top-0 bg-[#c0c0c0] border-b-2 border-gray-400 font-bold text-gray-900 z-10">
                      <tr>
                        <th className="p-2 border-r border-gray-400">FECHA / HORA</th>
                        <th className="p-2 border-r border-gray-400">CTA</th>
                        <th className="p-2 border-r border-gray-400">ABONADO / DIRECCIÓN</th>
                        <th className="p-2 border-r border-gray-400">EVENTO</th>
                        <th className="p-2 border-r border-gray-400 text-center">ZN</th>
                        <th className="p-2 border-r border-gray-400 text-center">US</th>
                        <th className="p-2 text-center">ACCIONES RÁPIDAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {resultadosEventos.map((ev, idx) => {
                        const infoCli = clientesMap[ev.cuenta] || {}
                        const telContacto = infoCli.t1 || infoCli.telefono1 || ''
                        const tieneCamaras = infoCli.camaras || infoCli.cctv
                        return (
                          <tr key={idx} className="hover:bg-blue-50 font-mono transition-colors">
                            <td className="p-2 whitespace-nowrap font-bold text-slate-800">
                              {ev.fecha_hora}
                            </td>
                            <td className="p-2 whitespace-nowrap font-black text-blue-900 bg-blue-100/50 text-center">
                              {ev.cuenta}
                            </td>
                            <td className="p-2 font-sans font-bold text-gray-900">
                              <div>{ev.nombre_abonado || infoCli.nombre || 'ABONADO DE CENTRAL'}</div>
                              {infoCli.direccion && (
                                <div className="text-[10px] text-gray-500 font-normal truncate max-w-xs">
                                  📍 {infoCli.direccion} ({infoCli.sector || infoCli.ciudad || 'Santiago'})
                                </div>
                              )}
                            </td>
                            <td className="p-2 font-sans font-bold text-red-900">
                              {ev.evento}
                            </td>
                            <td className="p-2 text-center font-bold text-amber-800">
                              {ev.zona || '--'}
                            </td>
                            <td className="p-2 text-center font-bold text-emerald-800">
                              {ev.usuario || '--'}
                            </td>
                            <td className="p-2">
                              <div className="flex items-center justify-center gap-1 font-sans">
                                {onVerExpediente && (
                                  <button
                                    onClick={() => onVerExpediente(ev.cuenta)}
                                    className="px-2 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-[10px] font-bold hover:bg-white active:translate-y-0.5"
                                    title="Abrir Expediente"
                                  >
                                    📋 Ficha
                                  </button>
                                )}
                                {onVerZonificacion && (
                                  <button
                                    onClick={() => onVerZonificacion(ev.cuenta)}
                                    className="px-2 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-[10px] font-bold hover:bg-white active:translate-y-0.5"
                                    title="Ver Zonas"
                                  >
                                    🌿 Zonas
                                  </button>
                                )}
                                {onVerCamaras && (
                                  <button
                                    onClick={() => onVerCamaras(ev.cuenta)}
                                    className="px-2 py-0.5 bg-blue-900 text-white border border-t-blue-400 border-l-blue-400 border-b-black border-r-black text-[10px] font-bold hover:bg-blue-800 active:translate-y-0.5"
                                    title="Ver Cámaras"
                                  >
                                    🎥 CCTV
                                  </button>
                                )}
                                {onEnviarWhatsApp && telContacto && (
                                  <button
                                    onClick={() => onEnviarWhatsApp(telContacto, ev.cuenta)}
                                    className="px-2 py-0.5 bg-emerald-700 text-white border border-t-emerald-400 border-l-emerald-400 border-b-black border-r-black text-[10px] font-bold hover:bg-emerald-600 active:translate-y-0.5"
                                    title="Enviar WhatsApp"
                                  >
                                    💬 WA
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 2: AUDITORÍA HISTÓRICA */}
          {pestana === 'historico' && (
            <div className="flex flex-col h-full gap-3 overflow-hidden">
              {/* Filtros de Rango de Fecha y Categorías */}
              <div className="bg-[#e0e0e0] p-2.5 border-2 border-t-gray-600 border-l-gray-600 border-b-white border-r-white shrink-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">FECHA DESDE:</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full bg-white border border-gray-600 px-2 py-1 text-xs font-bold text-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">FECHA HASTA:</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full bg-white border border-gray-600 px-2 py-1 text-xs font-bold text-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">CUENTA ESPECÍFICA:</label>
                  <input
                    type="text"
                    value={cuentaFiltro}
                    onChange={(e) => setCuentaFiltro(e.target.value)}
                    placeholder="Ej: 0014"
                    className="w-full bg-white border border-gray-600 px-2 py-1 text-xs font-bold text-black uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">CATEGORÍA:</label>
                  <select
                    value={categoriaFiltro}
                    onChange={(e: any) => setCategoriaFiltro(e.target.value)}
                    className="w-full bg-white border border-gray-600 px-2 py-1 text-xs font-bold text-black"
                  >
                    <option value="todos">Todas las categorías</option>
                    <option value="robo">Alarmas de Robo / Intrusión</option>
                    <option value="incendio_panico">Incendio / Pánico / Médica</option>
                    <option value="aperturas_cierres">Aperturas / Cierres</option>
                    <option value="energia_tecnico">Fallo Energía AC / Batería / Técnico</option>
                    <option value="autotest">Autotest Periódico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">LÍMITE MÁXIMO:</label>
                  <select
                    value={limiteFiltro}
                    onChange={(e: any) => setLimiteFiltro(Number(e.target.value))}
                    className="w-full bg-white border border-gray-600 px-2 py-1 text-xs font-bold text-black"
                  >
                    <option value={100}>100 registros</option>
                    <option value={200}>200 registros</option>
                    <option value={500}>500 registros</option>
                    <option value={1000}>1000 registros</option>
                  </select>
                </div>
                <div>
                  <button
                    onClick={ejecutarBusquedaHistorica}
                    disabled={cargandoHistorico}
                    className="w-full h-8 bg-[#000080] text-white border-2 border-t-blue-400 border-l-blue-400 border-b-black border-r-black font-bold text-xs cursor-pointer hover:bg-blue-900 active:translate-y-0.5 disabled:opacity-50"
                  >
                    {cargandoHistorico ? 'Consultando...' : '🔍 FILTRAR LOGS'}
                  </button>
                </div>
              </div>

              {/* Grilla de Auditoría */}
              <div className="flex-1 bg-white border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto min-h-[280px]">
                <table className="w-full border-collapse text-xs text-left">
                  <thead className="sticky top-0 bg-[#c0c0c0] border-b-2 border-gray-400 font-bold text-gray-900 z-10">
                    <tr>
                      <th className="p-2 border-r border-gray-400 w-8 text-center">#</th>
                      <th className="p-2 border-r border-gray-400">FECHA Y HORA</th>
                      <th className="p-2 border-r border-gray-400 text-center">CTA</th>
                      <th className="p-2 border-r border-gray-400">NOMBRE ABONADO</th>
                      <th className="p-2 border-r border-gray-400">DESCRIPCIÓN EVENTO</th>
                      <th className="p-2 border-r border-gray-400 text-center">ZONA</th>
                      <th className="p-2 text-center">USUARIO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {eventosHistoricos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500 font-bold italic">
                          No se encontraron registros en el rango seleccionado. Presione "FILTRAR LOGS" para actualizar.
                        </td>
                      </tr>
                    ) : (
                      eventosHistoricos.map((ev, idx) => (
                        <tr key={idx} className="hover:bg-amber-50 font-mono">
                          <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                          <td className="p-2 whitespace-nowrap font-bold text-gray-800">{ev.fecha_hora}</td>
                          <td className="p-2 text-center font-black text-blue-900 bg-blue-50">{ev.cuenta}</td>
                          <td className="p-2 font-sans font-bold text-gray-900">{ev.nombre_abonado || '---'}</td>
                          <td className="p-2 font-sans font-bold text-slate-900">{ev.evento}</td>
                          <td className="p-2 text-center font-bold text-amber-800">{ev.zona || '--'}</td>
                          <td className="p-2 text-center font-bold text-emerald-800">{ev.usuario || '--'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Botonera de Exportación en Footer */}
              <div className="flex items-center justify-between bg-[#e0e0e0] p-2 border-t border-gray-400 shrink-0">
                <span className="text-xs font-bold text-gray-800">
                  Total de registros en auditoría: <span className="text-blue-900 font-mono">{eventosHistoricos.length}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportarExcel(eventosHistoricos, 'Auditoria_Historica')}
                    className="px-3 py-1 bg-emerald-800 text-white border-2 border-t-emerald-400 border-l-emerald-400 border-b-black border-r-black text-xs font-bold hover:bg-emerald-700 active:translate-y-0.5 cursor-pointer flex items-center gap-1"
                  >
                    📊 EXPORTAR A EXCEL (.XLSX)
                  </button>
                  <button
                    onClick={() => exportarPDF(eventosHistoricos, 'Auditoria_Historica')}
                    className="px-3 py-1 bg-red-800 text-white border-2 border-t-red-400 border-l-red-400 border-b-black border-r-black text-xs font-bold hover:bg-red-700 active:translate-y-0.5 cursor-pointer flex items-center gap-1"
                  >
                    📄 GENERAR REPORTES PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 3: DIRECTORIO DE CONTACTOS */}
          {pestana === 'directorio' && (
            <div className="flex flex-col h-full gap-3 overflow-hidden">
              {/* Filtro Directorio */}
              <div className="bg-[#e0e0e0] p-2.5 border-2 border-t-gray-600 border-l-gray-600 border-b-white border-r-white shrink-0 flex items-center gap-2">
                <span className="font-bold text-xs text-gray-800 whitespace-nowrap">Filtrar Contactos:</span>
                <input
                  type="text"
                  value={queryDirectorio}
                  onChange={(e) => setQueryDirectorio(e.target.value)}
                  placeholder="Buscar por nombre de contacto, teléfono, cargo o cuenta (ej: Juan Perez, +569...)"
                  className="w-full bg-white border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-3 py-1 text-xs font-bold text-black focus:outline-none"
                />
              </div>

              {/* Tabla de Contactos */}
              <div className="flex-1 bg-white border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto min-h-[300px]">
                <table className="w-full border-collapse text-xs text-left">
                  <thead className="sticky top-0 bg-[#c0c0c0] border-b-2 border-gray-400 font-bold text-gray-900 z-10">
                    <tr>
                      <th className="p-2 border-r border-gray-400 text-center w-12">PRIO</th>
                      <th className="p-2 border-r border-gray-400 text-center">CTA</th>
                      <th className="p-2 border-r border-gray-400">PROPIEDAD / CLIENTE</th>
                      <th className="p-2 border-r border-gray-400">NOMBRE CONTACTO</th>
                      <th className="p-2 border-r border-gray-400">CARGO</th>
                      <th className="p-2 border-r border-gray-400">TELÉFONO</th>
                      <th className="p-2 text-center">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contactosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500 font-bold italic">
                          No se encontraron contactos coincidentes.
                        </td>
                      </tr>
                    ) : (
                      contactosFiltrados.map((cont, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50">
                          <td className="p-2 text-center font-bold text-blue-900 bg-blue-50">
                            #{cont.prioridad}
                          </td>
                          <td className="p-2 text-center font-black font-mono text-gray-900">
                            {cont.cuenta}
                          </td>
                          <td className="p-2 font-bold text-gray-900">
                            <div>{cont.nombreCliente}</div>
                            {cont.direccion && (
                              <div className="text-[10px] text-gray-500 font-normal">
                                📍 {cont.direccion} ({cont.comuna})
                              </div>
                            )}
                          </td>
                          <td className="p-2 font-bold text-emerald-900">
                            {cont.nombreContacto}
                          </td>
                          <td className="p-2 font-semibold text-gray-700">
                            {cont.cargo}
                          </td>
                          <td className="p-2 font-mono font-bold text-blue-800">
                            {cont.telefono}
                          </td>
                          <td className="p-2 text-center">
                            {onEnviarWhatsApp && cont.telefono && cont.telefono !== 'Sin número' && (
                              <button
                                onClick={() => onEnviarWhatsApp(cont.telefono, cont.cuenta)}
                                className="px-2.5 py-1 bg-emerald-700 text-white border border-t-emerald-400 border-l-emerald-400 border-b-black border-r-black text-[10px] font-bold hover:bg-emerald-600 active:translate-y-0.5 cursor-pointer"
                              >
                                💬 Enviar WhatsApp
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* PIE DE PÁGINA */}
        <div className="bg-[#c0c0c0] p-2 border-t-2 border-white flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-gray-700 font-mono">
            Gama Security Command Center © {new Date().getFullYear()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 text-xs font-bold hover:bg-gray-200 active:translate-y-0.5 cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  )
}

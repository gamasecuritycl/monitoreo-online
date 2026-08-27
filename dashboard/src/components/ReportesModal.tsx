'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { supabase, type EventoMonitoreo } from '@/lib/supabase'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesFallback = clientesDataRaw as Record<string, Record<string, string>>

interface ReportesModalProps {
  onClose: () => void
  cuentaInicial?: string
  clientesMap?: Record<string, any>
  operadorNombre?: string
}

interface ZonaInfo {
  numero: string
  dispositivo: string
  area: string
}

const _fmtChile = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function hoyChile(): string {
  return _fmtChile.format(new Date())
}

function formatearFechaHora(isoStr?: string): { fecha: string; hora: string } {
  if (!isoStr) return { fecha: '--/--/----', hora: '--:--:--' }
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) {
      const parts = isoStr.split(' ')
      return { fecha: parts[0] || isoStr, hora: parts[1] || '' }
    }
    const fecha = d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Santiago'
    })
    const hora = d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Santiago'
    })
    return { fecha, hora }
  } catch {
    return { fecha: isoStr.slice(0, 10), hora: isoStr.slice(11, 19) }
  }
}

export default function ReportesModal({
  onClose,
  cuentaInicial = '',
  clientesMap: propClientesMap,
  operadorNombre = 'OPERADOR DE TURNO',
}: ReportesModalProps) {
  // Base de datos de clientes local o heredada
  const [clientes, setClientesMap] = useState<Record<string, any>>(
    propClientesMap && Object.keys(propClientesMap).length > 0 ? propClientesMap : clientesFallback
  )
  
  // Mapa de Zonas sincronizadas desde MDB (ZONAS)
  const [zonasMap, setZonasMap] = useState<Record<string, ZonaInfo[]>>({})

  // Estado del abonado seleccionado
  const [cuentaInput, setCuentaInput] = useState(cuentaInicial ? cuentaInicial.toUpperCase().trim() : '')
  const [nombreBusqueda, setNombreBusqueda] = useState('')
  const [cuentaActiva, setCuentaActiva] = useState(cuentaInicial ? cuentaInicial.toUpperCase().trim() : '')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null)

  // Filtros de Rango de Fechas
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7) // Por defecto últimos 7 días
    return _fmtChile.format(d)
  })
  const [horaDesde, setHoraDesde] = useState('00:00')
  const [fechaHasta, setFechaHasta] = useState(() => hoyChile())
  const [horaHasta, setHoraHasta] = useState('23:59')

  // Filtro de Categoría de Señales
  const [filtroTipo, setFiltroTipo] = useState<string>('TODAS')
  const [filtroTexto, setFiltroTexto] = useState<string>('')

  // Estado de Datos y Carga
  const [eventos, setEventos] = useState<EventoMonitoreo[]>([])
  const [cargando, setCargando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [reporteGenerado, setReporteGenerado] = useState(false)
  const [fechaEmision, setFechaEmision] = useState<string>('')

  // Referencia para impresión directa
  const printableAreaRef = useRef<HTMLDivElement>(null)

  // 1. Cargar base de datos maestra de clientes si no venía en props
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'CLIENTES')
          .limit(1)
        if (data && data.length > 0 && !error) {
          const raw = data[0].nombre_abonado
          if (raw) {
            const map = JSON.parse(raw)
            setClientesMap(map)
          }
        }
      } catch (err) {
        console.warn('[REPORTES] Usando clientes locales fallback.')
      }
    }
    if (!propClientesMap || Object.keys(propClientesMap).length === 0) {
      cargarClientes()
    }
  }, [propClientesMap])

  // 2. Cargar ZONAS desde Supabase
  useEffect(() => {
    const cargarZonas = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'ZONAS')
          .order('id', { ascending: false })
          .limit(6)
        if (data && data.length > 0 && !error) {
          const filaValida = data.find(r => r.evento === 'SINCRONIZACION ZONAS MDB' || r.evento === 'CONFIGURACION_ZONAS') || data[0]
          if (filaValida?.nombre_abonado) {
            const mz = JSON.parse(filaValida.nombre_abonado)
            setZonasMap(mz)
          }
        }
      } catch (err) {
        console.warn('[REPORTES] No se pudieron cargar zonas MDB:', err)
      }
    }
    cargarZonas()
  }, [])

  // 3. Inicializar selección si venía cuentaInicial
  useEffect(() => {
    if (cuentaInicial) {
      const cUpper = cuentaInicial.toUpperCase().trim()
      setCuentaInput(cUpper)
      setCuentaActiva(cUpper)
      if (clientes[cUpper]) {
        setClienteSeleccionado(clientes[cUpper])
      }
    } else {
      // Si no viene ninguna, seleccionar el primer cliente disponible
      const keys = Object.keys(clientes)
      if (keys.length > 0) {
        const primera = keys[0]
        setCuentaInput(primera)
        setCuentaActiva(primera)
        setClienteSeleccionado(clientes[primera])
      }
    }
  }, [cuentaInicial, clientes])

  // Lista filtrada de usuarios para el panel derecho "BUSCAR USUARIO"
  const usuariosFiltrados = useMemo(() => {
    const entries = Object.entries(clientes)
    if (!nombreBusqueda.trim()) return entries.slice(0, 100)
    const term = nombreBusqueda.toLowerCase().trim()
    return entries.filter(([cta, datos]: [string, any]) => {
      const nombre = (datos?.nombre || datos?.NOMBRE || datos?.razon_social || '').toLowerCase()
      const direccion = (datos?.direccion || datos?.DIRECCION || '').toLowerCase()
      const ctaStr = cta.toLowerCase()
      return ctaStr.includes(term) || nombre.includes(term) || direccion.includes(term)
    }).slice(0, 100)
  }, [clientes, nombreBusqueda])

  // Manejar selección de un cliente de la lista
  const seleccionarCliente = (cta: string, datos: any) => {
    const cUpper = cta.toUpperCase().trim()
    setCuentaInput(cUpper)
    setCuentaActiva(cUpper)
    setClienteSeleccionado(datos)
    // Opcional: auto-consultar al hacer click
    consultarSenales(cUpper, datos)
  }

  // Presets rápidos de fechas
  const aplicarPreset = (tipo: 'hoy' | 'ayer' | 'ultimos7' | 'esteMes' | 'mesAnterior') => {
    const hoy = new Date()
    const hoyStr = _fmtChile.format(hoy)
    
    if (tipo === 'hoy') {
      setFechaDesde(hoyStr)
      setHoraDesde('00:00')
      setFechaHasta(hoyStr)
      setHoraHasta('23:59')
    } else if (tipo === 'ayer') {
      const ayer = new Date(hoy)
      ayer.setDate(hoy.getDate() - 1)
      const ayerStr = _fmtChile.format(ayer)
      setFechaDesde(ayerStr)
      setHoraDesde('00:00')
      setFechaHasta(ayerStr)
      setHoraHasta('23:59')
    } else if (tipo === 'ultimos7') {
      const d7 = new Date(hoy)
      d7.setDate(hoy.getDate() - 7)
      setFechaDesde(_fmtChile.format(d7))
      setHoraDesde('00:00')
      setFechaHasta(hoyStr)
      setHoraHasta('23:59')
    } else if (tipo === 'esteMes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      setFechaDesde(_fmtChile.format(primerDia))
      setHoraDesde('00:00')
      setFechaHasta(hoyStr)
      setHoraHasta('23:59')
    } else if (tipo === 'mesAnterior') {
      const primerDiaPrev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const ultimoDiaPrev = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
      setFechaDesde(_fmtChile.format(primerDiaPrev))
      setHoraDesde('00:00')
      setFechaHasta(_fmtChile.format(ultimoDiaPrev))
      setHoraHasta('23:59')
    }
  }

  // Consultar señales en Supabase (solo señales reales de eventos_monitoreo)
  const consultarSenales = async (ctaParam?: string, clienteParam?: any) => {
    const cta = (ctaParam || cuentaInput || cuentaActiva).toUpperCase().trim()
    if (!cta) {
      setErrorMsg('Por favor ingrese o seleccione un número de cuenta / abonado.')
      return
    }

    setCargando(true)
    setErrorMsg('')
    setReporteGenerado(false)

    try {
      // Formatear timestamps ISO
      const desdeIso = `${fechaDesde}T${horaDesde}:00`
      const hastaIso = `${fechaHasta}T${horaHasta}:59`

      // 1. Consultar señales de esta cuenta en Supabase
      const { data, error } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .eq('cuenta', cta)
        .gte('fecha_hora', desdeIso)
        .lte('fecha_hora', hastaIso)
        .order('fecha_hora', { ascending: true }) // Cronológico: el más antiguo arriba, más reciente al final
        .limit(2000)

      if (error) {
        throw error
      }

      const rawEventos: EventoMonitoreo[] = data || []

      // Deduplicar eventos duplicados si hubiese
      const vistos = new Set<string>()
      const unicos: EventoMonitoreo[] = []
      for (const ev of rawEventos) {
        const key = `${ev.cuenta}_${ev.evento}_${ev.zona}_${ev.usuario}_${ev.fecha_hora}`
        if (!vistos.has(key)) {
          vistos.add(key)
          unicos.push(ev)
        }
      }

      setEventos(unicos)
      setCuentaActiva(cta)
      setClienteSeleccionado(clienteParam || clientes[cta] || null)
      setFechaEmision(new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }))
      setReporteGenerado(true)

      if (unicos.length === 0) {
        setErrorMsg(`No se registraron señales para la cuenta ${cta} entre el ${fechaDesde} y ${fechaHasta}.`)
      }
    } catch (err: any) {
      console.error('[REPORTES] Error consultando señales:', err)
      setErrorMsg(`Error al consultar señales: ${err.message || 'Error de conexión'}`)
    } finally {
      setCargando(false)
    }
  }

  // Enriquecer zona con nombre de área
  const obtenerNombreZona = (cta: string, numZona: string): string => {
    if (!numZona || numZona === '000' || numZona === '---') return ''
    const zonasAbonado = zonasMap[cta] || []
    const match = zonasAbonado.find(z => z.numero.toString().padStart(3, '0') === numZona.padStart(3, '0') || z.numero === numZona)
    if (match && match.area) {
      return `${match.area}${match.dispositivo ? ` (${match.dispositivo})` : ''}`
    }
    return ''
  }

  // Filtrado de eventos en memoria según tipo y texto
  const eventosFiltrados = useMemo(() => {
    return eventos.filter(ev => {
      const evName = (ev.evento || '').toUpperCase()
      
      // Filtro por categoría
      if (filtroTipo === 'ALARMAS') {
        const esAlarma = evName.includes('ALARMA') || evName.includes('ROBO') || evName.includes('PANICO') || evName.includes('INCENDIO') || evName.includes('EMERGENCIA')
        if (!esAlarma) return false
      } else if (filtroTipo === 'APERTURAS_CIERRES') {
        const esApCi = evName.includes('APERTURA') || evName.includes('CIERRE') || evName.includes('ARMADO') || evName.includes('DESARMADO')
        if (!esApCi) return false
      } else if (filtroTipo === 'FALLAS') {
        const esFalla = evName.includes('FALLA') || evName.includes('BATER') || evName.includes('ENERG') || evName.includes('CORTE') || evName.includes('RED')
        if (!esFalla) return false
      } else if (filtroTipo === 'TESTS') {
        const esTest = evName.includes('TEST') || evName.includes('PERIODICO') || evName.includes('PRUEBA')
        if (!esTest) return false
      } else if (filtroTipo === 'RESTABLECIMIENTOS') {
        const esRest = evName.includes('RESTABLECIMIENTO') || evName.includes('NORMAL') || evName.includes('RESTAURACION')
        if (!esRest) return false
      }

      // Filtro por texto libre
      if (filtroTexto.trim()) {
        const t = filtroTexto.toLowerCase()
        const matchEv = evName.toLowerCase().includes(t)
        const matchZn = (ev.zona || '').toLowerCase().includes(t)
        const matchUs = (ev.usuario || '').toLowerCase().includes(t)
        const matchNomZn = obtenerNombreZona(ev.cuenta, ev.zona).toLowerCase().includes(t)
        return matchEv || matchZn || matchUs || matchNomZn
      }

      return true
    })
  }, [eventos, filtroTipo, filtroTexto, zonasMap])

  // Estadísticas del reporte
  const stats = useMemo(() => {
    let alarmas = 0
    let aperturas = 0
    let cierres = 0
    let restablecimientos = 0
    let fallas = 0
    let tests = 0

    eventos.forEach(e => {
      const nom = (e.evento || '').toUpperCase()
      if (nom.includes('ALARMA') || nom.includes('ROBO') || nom.includes('PANICO') || nom.includes('INCENDIO')) alarmas++
      else if (nom.includes('APERTURA') || nom.includes('DESARMADO')) aperturas++
      else if (nom.includes('CIERRE') || nom.includes('ARMADO')) cierres++
      else if (nom.includes('RESTABLECIMIENTO') || nom.includes('NORMAL')) restablecimientos++
      else if (nom.includes('FALLA') || nom.includes('BATER') || nom.includes('CORTE') || nom.includes('RED')) fallas++
      else if (nom.includes('TEST') || nom.includes('PERIODICO')) tests++
    })

    return {
      total: eventos.length,
      alarmas,
      aperturas,
      cierres,
      restablecimientos,
      fallas,
      tests,
    }
  }, [eventos])

  // Nombre de cliente display
  const nombreClienteDisplay = clienteSeleccionado?.nombre || 
    clienteSeleccionado?.NOMBRE || 
    clienteSeleccionado?.razon_social || 
    (eventos.length > 0 ? eventos[0].nombre_abonado : '') || 
    `ABONADO ${cuentaActiva}`

  const direccionClienteDisplay = clienteSeleccionado?.direccion || 
    clienteSeleccionado?.DIRECCION || 
    clienteSeleccionado?.comuna || 
    'DIRECCIÓN REGISTRADA EN CENTRAL GAMA'

  const telefonoClienteDisplay = clienteSeleccionado?.telefono || 
    clienteSeleccionado?.TELEFONO || 
    clienteSeleccionado?.telefono_fijo || 
    ''

  // Exportar a Excel (.xlsx)
  const exportarAExcel = () => {
    if (eventosFiltrados.length === 0) {
      alert('No hay eventos para exportar en este rango.')
      return
    }

    // 1. Datos del encabezado y metadatos
    const metaFilas = [
      ['GAMA SEGURIDAD — REPORTE OFICIAL DE SEÑALES DE MONITOREO'],
      ['Central de Operaciones 24/7 — Santiago de Chile — www.gamasecurity.cl'],
      [''],
      ['N° DE ABONADO / CUENTA:', cuentaActiva],
      ['NOMBRE / RAZÓN SOCIAL:', nombreClienteDisplay],
      ['DIRECCIÓN:', direccionClienteDisplay],
      ['TELÉFONO:', telefonoClienteDisplay],
      ['RANGO CONSULTADO:', `${fechaDesde} ${horaDesde} hasta ${fechaHasta} ${horaHasta}`],
      ['FECHA DE EMISIÓN:', fechaEmision || new Date().toLocaleString('es-CL')],
      ['OPERADOR EMISOR:', operadorNombre],
      ['TOTAL SEÑALES EXPORTADAS:', eventosFiltrados.length],
      [''],
      ['RESUMEN EJECUTIVO:'],
      ['Total Señales:', stats.total, 'Alarmas:', stats.alarmas, 'Aperturas:', stats.aperturas, 'Cierres:', stats.cierres, 'Fallas:', stats.fallas, 'Tests:', stats.tests],
      [''],
      ['--- DETALLE DE SEÑALES RECIBIDAS ---'],
      ['N°', 'FECHA', 'HORA', 'CUENTA', 'EVENTO / SEÑAL', 'ZONA (ZN)', 'DESCRIPCIÓN DE ZONA', 'USUARIO (US)', 'PARTICIÓN (PAR)']
    ]

    // 2. Filas de eventos
    const eventosFilas = eventosFiltrados.map((e, index) => {
      const { fecha, hora } = formatearFechaHora(e.fecha_hora)
      const descZona = obtenerNombreZona(e.cuenta, e.zona)
      return [
        index + 1,
        fecha,
        hora,
        e.cuenta,
        e.evento || 'SEÑAL SIN IDENTIFICAR',
        e.zona || '---',
        descZona || '',
        e.usuario || '---',
        '01'
      ]
    })

    const worksheetData = [...metaFilas, ...eventosFilas]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)

    // Ajustar anchos de columnas
    ws['!cols'] = [
      { wch: 6 },  // N°
      { wch: 12 }, // Fecha
      { wch: 10 }, // Hora
      { wch: 10 }, // Cuenta
      { wch: 32 }, // Evento
      { wch: 10 }, // Zona
      { wch: 30 }, // Desc Zona
      { wch: 15 }, // Usuario
      { wch: 10 }, // Partición
    ]

    XLSX.utils.book_append_sheet(wb, ws, `Señales_${cuentaActiva}`)
    const filename = `Reporte_Senales_${cuentaActiva}_${fechaDesde}_al_${fechaHasta}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  // Imprimir en Hoja Tamaño Carta (PDF / Print)
  const imprimirReporteCarta = () => {
    if (eventosFiltrados.length === 0) {
      alert('No hay eventos cargados para imprimir.')
      return
    }

    const filasHtml = eventosFiltrados.map((e, idx) => {
      const { fecha, hora } = formatearFechaHora(e.fecha_hora)
      const descZona = obtenerNombreZona(e.cuenta, e.zona)
      const evUpper = (e.evento || '').toUpperCase()
      
      let badgeColor = '#334155'
      let badgeBg = '#f1f5f9'
      let rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc'

      if (evUpper.includes('ALARMA') || evUpper.includes('ROBO') || evUpper.includes('PANICO') || evUpper.includes('INCENDIO')) {
        badgeColor = '#b91c1c'
        badgeBg = '#fee2e2'
        rowBg = '#fef2f2'
      } else if (evUpper.includes('RESTABLECIMIENTO') || evUpper.includes('NORMAL')) {
        badgeColor = '#854d0e'
        badgeBg = '#fef9c3'
      } else if (evUpper.includes('APERTURA') || evUpper.includes('DESARMADO')) {
        badgeColor = '#0369a1'
        badgeBg = '#e0f2fe'
      } else if (evUpper.includes('CIERRE') || evUpper.includes('ARMADO')) {
        badgeColor = '#15803d'
        badgeBg = '#dcfce7'
      } else if (evUpper.includes('FALLA') || evUpper.includes('BATER') || evUpper.includes('CORTE')) {
        badgeColor = '#c2410c'
        badgeBg = '#ffedd5'
      }

      return `
        <tr style="background-color: ${rowBg}; page-break-inside: avoid;">
          <td style="padding: 4px 6px; border-bottom: 1px solid #cbd5e1; font-size: 8.5pt; font-family: monospace; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 4px 6px; border-bottom: 1px solid #cbd5e1; font-size: 8.5pt; font-family: monospace; text-align: center; font-weight: bold; color: #1e293b;">${fecha}</td>
          <td style="padding: 4px 6px; border-bottom: 1px solid #cbd5e1; font-size: 8.5pt; font-family: monospace; text-align: center; color: #334155;">${hora}</td>
          <td style="padding: 4px 6px; border-bottom: 1px solid #cbd5e1; font-size: 8.5pt; font-family: sans-serif;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 8pt; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}33;">
              ${e.evento || 'SEÑAL'}
            </span>
          </td>
          <td style="padding: 4px 6px; border-bottom: 1px solid #cbd5e1; font-size: 8.5pt; font-family: sans-serif;">
            <strong style="color: #0f172a;">${e.zona && e.zona !== '000' ? `ZN ${e.zona}` : '---'}</strong>
            ${descZona ? `<span style="color: #475569; font-size: 8pt; margin-left: 4px;">• ${descZona}</span>` : ''}
          </td>
          <td style="padding: 4px 6px; border-bottom: 1px solid #cbd5e1; font-size: 8.5pt; font-family: monospace; text-align: center; color: #475569;">
            ${e.usuario && e.usuario !== '000' && e.usuario !== '---' ? `US ${e.usuario}` : '---'}
          </td>
          <td style="padding: 4px 6px; border-bottom: 1px solid #cbd5e1; font-size: 8.5pt; font-family: monospace; text-align: center; color: #64748b;">01</td>
        </tr>
      `
    }).join('')

    const win = window.open('', '_blank')
    if (!win) {
      alert('Por favor permita las ventanas emergentes (popups) para abrir la vista de impresión/PDF.')
      return
    }

    const docHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Señales - Abonado ${cuentaActiva} - GAMA Seguridad</title>
        <style>
          @page {
            size: letter portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 9pt;
            line-height: 1.3;
          }
          .page-header {
            border-bottom: 2px solid #002b49;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo-box {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-badge {
            background: #002b49;
            color: #ffffff;
            font-weight: 900;
            font-size: 18pt;
            padding: 4px 12px;
            border-radius: 4px;
            letter-spacing: 2px;
          }
          .company-info h1 {
            margin: 0;
            font-size: 13pt;
            font-weight: 800;
            color: #002b49;
            letter-spacing: 0.5px;
          }
          .company-info p {
            margin: 2px 0 0 0;
            font-size: 7.5pt;
            color: #475569;
          }
          .meta-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1.2fr 2fr 1.4fr;
            gap: 8px 16px;
            font-size: 8.5pt;
          }
          .meta-item {
            display: flex;
            flex-direction: column;
          }
          .meta-label {
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
          }
          .meta-value {
            font-size: 9pt;
            font-weight: 700;
            color: #0f172a;
          }
          .stats-bar {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 6px;
            margin-bottom: 12px;
          }
          .stat-box {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 4px 6px;
            text-align: center;
          }
          .stat-val {
            font-size: 11pt;
            font-weight: 800;
            color: #0f172a;
          }
          .stat-lbl {
            font-size: 6.5pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
          }
          th {
            background: #002b49;
            color: #ffffff;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            padding: 5px 6px;
            text-align: left;
            border: 1px solid #002b49;
          }
          .page-footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 7.5pt;
            color: #64748b;
          }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="page-header">
          <div class="logo-box">
            <div class="logo-badge">GAMA</div>
            <div class="company-info">
              <h1>GAMA SEGURIDAD</h1>
              <p>Central de Monitoreo & Telemetría 24/7 • www.gamasecurity.cl • Santiago de Chile</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11pt; font-weight: 800; color: #002b49;">INFORME DE SEÑALES</div>
            <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">DOCUMENTO OFICIAL DE MONITOREO</div>
          </div>
        </div>

        <div class="meta-card">
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">N° Abonado / Cuenta:</span>
              <span class="meta-value" style="font-size: 12pt; color: #002b49; font-family: monospace;">${cuentaActiva}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Nombre / Razón Social:</span>
              <span class="meta-value">${nombreClienteDisplay}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Rango del Reporte:</span>
              <span class="meta-value" style="font-size: 8pt;">${fechaDesde} ${horaDesde} → ${fechaHasta} ${horaHasta}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Dirección:</span>
              <span class="meta-value" style="font-size: 8pt; font-weight: normal;">${direccionClienteDisplay}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Emisión & Operador:</span>
              <span class="meta-value" style="font-size: 8pt; font-weight: normal;">${fechaEmision || new Date().toLocaleString('es-CL')} (Op: ${operadorNombre})</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Señales:</span>
              <span class="meta-value" style="color: #002b49;">${eventosFiltrados.length} evento(s)</span>
            </div>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-box">
            <div class="stat-val">${stats.total}</div>
            <div class="stat-lbl">Total Señales</div>
          </div>
          <div class="stat-box" style="background: #fee2e2; border-color: #fca5a5;">
            <div class="stat-val" style="color: #991b1b;">${stats.alarmas}</div>
            <div class="stat-lbl" style="color: #991b1b;">Alarmas</div>
          </div>
          <div class="stat-box" style="background: #e0f2fe; border-color: #bae6fd;">
            <div class="stat-val" style="color: #075985;">${stats.aperturas}</div>
            <div class="stat-lbl" style="color: #075985;">Aperturas</div>
          </div>
          <div class="stat-box" style="background: #dcfce7; border-color: #bbf7d0;">
            <div class="stat-val" style="color: #166534;">${stats.cierres}</div>
            <div class="stat-lbl" style="color: #166534;">Cierres</div>
          </div>
          <div class="stat-box" style="background: #ffedd5; border-color: #fed7aa;">
            <div class="stat-val" style="color: #9a3412;">${stats.fallas}</div>
            <div class="stat-lbl" style="color: #9a3412;">Fallas Técnicas</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${stats.tests}</div>
            <div class="stat-lbl">Test Periódico</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">#</th>
              <th style="width: 75px; text-align: center;">Fecha</th>
              <th style="width: 65px; text-align: center;">Hora</th>
              <th>Evento / Señal de Monitoreo</th>
              <th>Zona / Dispositivo Involucrado</th>
              <th style="width: 65px; text-align: center;">Usuario</th>
              <th style="width: 35px; text-align: center;">Par</th>
            </tr>
          </thead>
          <tbody>
            ${filasHtml}
          </tbody>
        </table>

        <div class="page-footer">
          <div>Certificado de Telemetría Oficial • GAMA Seguridad SpA • Documento Inalterable</div>
          <div>Página 1 de 1 • Hoja Carta Standard (8.5" x 11")</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
      </html>
    `

    win.document.open()
    win.document.write(docHtml)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e1726] border-2 border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-200 font-sans">
        
        {/* ── HEADER SUPERIOR MODAL (ESTILO SCORPION / COMMAND CENTER) ── */}
        <div className="bg-gradient-to-r from-[#002b49] via-[#0a3866] to-[#002b49] px-4 py-2.5 border-b border-cyan-800/60 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-1 rounded text-cyan-300 font-black text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              SCORPION • REPORTES
            </div>
            <h2 className="text-sm font-black text-white tracking-wide uppercase">
              REPORTE DE EVENTOS Y SEÑALES POR ABONADO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
            title="Cerrar ventana"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── CUERPO PRINCIPAL: PANEL DE CONTROL SUPERIOR + VISTA DE RESULTADOS ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a101d]">
          
          {/* Fila 1: Layout Dual estilo Scorpion (Izquierda: Reporte Params, Derecha: Buscar Usuario) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* 1.1 CUADRO DE PARÁMETROS DE REPORTE (7 cols) */}
            <div className="md:col-span-7 bg-[#111c2e] border border-slate-700/80 rounded-lg p-3.5 flex flex-col justify-between shadow-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PARÁMETROS DEL REPORTE
                  </span>
                  {cuentaActiva && (
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-2 py-0.5 rounded">
                      CTA: {cuentaActiva}
                    </span>
                  )}
                </div>

                {/* Input de Cuenta manual */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <label className="col-span-3 text-[11px] font-bold text-slate-300 uppercase">
                    CUENTA:
                  </label>
                  <div className="col-span-9 flex gap-2">
                    <input
                      type="text"
                      value={cuentaInput}
                      onChange={(e) => setCuentaInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setCuentaActiva(cuentaInput.toUpperCase().trim())
                          consultarSenales(cuentaInput.toUpperCase().trim())
                        }
                      }}
                      placeholder="Ej: C7CA, 0014, C760"
                      className="flex-1 bg-[#090e17] border border-slate-600 rounded px-2.5 py-1 text-xs text-white font-mono font-bold focus:border-cyan-400 focus:outline-none uppercase"
                    />
                    <button
                      onClick={() => {
                        const c = cuentaInput.toUpperCase().trim()
                        if (c) {
                          setCuentaActiva(c)
                          setClienteSeleccionado(clientes[c] || null)
                          consultarSenales(c)
                        }
                      }}
                      className="bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold px-3 py-1 rounded transition-colors"
                    >
                      Fijar
                    </button>
                  </div>
                </div>

                {/* Rango de Fechas: DESDE y HASTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Desde */}
                  <div className="bg-[#090e17] border border-slate-700/80 rounded p-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      DESDE (FECHA / HORA):
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="flex-1 bg-[#152136] border border-slate-600 rounded px-2 py-0.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                      />
                      <input
                        type="time"
                        value={horaDesde}
                        onChange={(e) => setHoraDesde(e.target.value)}
                        className="w-20 bg-[#152136] border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Hasta */}
                  <div className="bg-[#090e17] border border-slate-700/80 rounded p-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      HASTA (FECHA / HORA):
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="flex-1 bg-[#152136] border border-slate-600 rounded px-2 py-0.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                      />
                      <input
                        type="time"
                        value={horaHasta}
                        onChange={(e) => setHoraHasta(e.target.value)}
                        className="w-20 bg-[#152136] border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Presets Rápidos */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Rápido:</span>
                  {[
                    { id: 'hoy', label: 'Hoy' },
                    { id: 'ayer', label: 'Ayer' },
                    { id: 'ultimos7', label: 'Últimos 7d' },
                    { id: 'esteMes', label: 'Este Mes' },
                    { id: 'mesAnterior', label: 'Mes Anterior' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => aplicarPreset(p.id as any)}
                      className="bg-slate-800 hover:bg-slate-700 active:bg-cyan-900 border border-slate-600 px-2 py-0.5 rounded text-[10px] text-slate-300 font-medium transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón Acción Principal: GENERAR REPORTE */}
              <div className="pt-3 mt-2 border-t border-slate-700/80 flex items-center gap-2">
                <button
                  onClick={() => consultarSenales()}
                  disabled={cargando}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] text-white font-black text-xs py-2 px-4 rounded shadow-lg flex items-center justify-center gap-2 tracking-wider uppercase transition-all disabled:opacity-50 cursor-pointer"
                >
                  {cargando ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      CONSULTANDO SEÑALES...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      GENERAR REPORTE
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 1.2 CUADRO DE BÚSQUEDA DE USUARIOS (5 cols) */}
            <div className="md:col-span-5 bg-[#111c2e] border border-slate-700/80 rounded-lg p-3.5 flex flex-col shadow-md">
              <div className="border-b border-slate-700 pb-1.5 mb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  BUSCAR USUARIO / ABONADO
                </span>
              </div>

              {/* Filtro por nombre */}
              <div className="space-y-2 flex-1 flex flex-col">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    NOMBRE / ABONADO:
                  </label>
                  <input
                    type="text"
                    value={nombreBusqueda}
                    onChange={(e) => setNombreBusqueda(e.target.value)}
                    placeholder="Filtrar por nombre o cuenta..."
                    className="w-full bg-[#090e17] border border-slate-600 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Listado estilo Scorpion clásico (Caja azul/oscura con scroll) */}
                <div className="flex-1 min-h-[120px] max-h-[145px] bg-[#000080]/90 border border-blue-900 rounded p-1 overflow-y-auto space-y-0.5 shadow-inner">
                  {usuariosFiltrados.length === 0 ? (
                    <div className="text-blue-300/60 text-[10px] p-2 text-center italic">
                      No se encontraron abonados con ese nombre.
                    </div>
                  ) : (
                    usuariosFiltrados.map(([cta, datos]: [string, any]) => {
                      const nom = datos?.nombre || datos?.NOMBRE || datos?.razon_social || `Abonado ${cta}`
                      const esSeleccionado = cuentaActiva === cta
                      return (
                        <div
                          key={cta}
                          onClick={() => seleccionarCliente(cta, datos)}
                          className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center justify-between ${
                            esSeleccionado
                              ? 'bg-amber-400 text-black shadow font-black'
                              : 'text-white hover:bg-blue-700/80'
                          }`}
                        >
                          <span className="truncate pr-2 uppercase">{nom}</span>
                          <span className="font-mono text-[10px] opacity-80 shrink-0">[{cta}]</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Fila 2: Barra de Acciones de Exportación y Filtros de Señales */}
          {reporteGenerado && (
            <div className="bg-[#111c2e] border border-slate-700 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
              
              {/* Filtros de la tabla */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Filtrar Señales:</span>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="bg-[#090e17] border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="TODAS">TODAS LAS SEÑALES ({eventos.length})</option>
                  <option value="ALARMAS">🚨 ALARMAS / PÁNICO ({stats.alarmas})</option>
                  <option value="APERTURAS_CIERRES">🔑 APERTURAS & CIERRES ({stats.aperturas + stats.cierres})</option>
                  <option value="FALLAS">⚠️ FALLAS TÉCNICAS ({stats.fallas})</option>
                  <option value="TESTS">📡 TEST PERIÓDICO ({stats.tests})</option>
                  <option value="RESTABLECIMIENTOS">✅ RESTABLECIMIENTOS ({stats.restablecimientos})</option>
                </select>

                <input
                  type="text"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  placeholder="Buscar en evento, zona o usuario..."
                  className="bg-[#090e17] border border-slate-600 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none w-48"
                />
              </div>

              {/* Botones de Exportación Oficial */}
              <div className="flex items-center gap-2">
                {/* Exportar Excel */}
                <button
                  onClick={exportarAExcel}
                  className="bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar Excel (.xlsx)
                </button>

                {/* Imprimir / Guardar PDF Tamaño Carta */}
                <button
                  onClick={imprimirReporteCarta}
                  className="bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-bold text-xs px-3.5 py-1.5 rounded shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir / PDF Carta
                </button>
              </div>

            </div>
          )}

          {/* Mensaje de Error si aplica */}
          {errorMsg && (
            <div className="bg-amber-950/60 border border-amber-600/60 text-amber-200 px-4 py-2 rounded-lg text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── Fila 3: VISTA PREVIA DEL REPORTE (HOJA MEMBRETADA) ── */}
          {reporteGenerado && (
            <div className="bg-[#111c2e] border border-slate-700 rounded-lg p-4 shadow-xl space-y-4">
              
              {/* Encabezado del Documento */}
              <div className="bg-[#0b1320] border border-slate-700/80 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#002b49] text-white font-black text-2xl px-3.5 py-1.5 rounded-lg border border-cyan-500/40 tracking-wider shadow">
                    GAMA
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wide">
                      {nombreClienteDisplay}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold">ABONADO: {cuentaActiva}</span>
                      <span>•</span>
                      <span>{direccionClienteDisplay}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <div className="text-slate-300 font-bold">Período del Reporte</div>
                  <div className="font-mono text-cyan-300 text-[11px]">{fechaDesde} {horaDesde} → {fechaHasta} {horaHasta}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Emisión: {fechaEmision} • Op: {operadorNombre}</div>
                </div>
              </div>

              {/* Tarjetas KPI de Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <div className="bg-[#090e17] border border-slate-800 rounded p-2 text-center">
                  <div className="text-lg font-black text-white">{stats.total}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Total Señales</div>
                </div>
                <div className="bg-red-950/40 border border-red-800/60 rounded p-2 text-center">
                  <div className="text-lg font-black text-red-400">{stats.alarmas}</div>
                  <div className="text-[9px] font-bold text-red-300 uppercase">Alarmas / Pánico</div>
                </div>
                <div className="bg-sky-950/40 border border-sky-800/60 rounded p-2 text-center">
                  <div className="text-lg font-black text-sky-400">{stats.aperturas}</div>
                  <div className="text-[9px] font-bold text-sky-300 uppercase">Aperturas</div>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/60 rounded p-2 text-center">
                  <div className="text-lg font-black text-emerald-400">{stats.cierres}</div>
                  <div className="text-[9px] font-bold text-emerald-300 uppercase">Cierres</div>
                </div>
                <div className="bg-amber-950/40 border border-amber-800/60 rounded p-2 text-center">
                  <div className="text-lg font-black text-amber-400">{stats.fallas}</div>
                  <div className="text-[9px] font-bold text-amber-300 uppercase">Fallas Técnicas</div>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded p-2 text-center">
                  <div className="text-lg font-black text-slate-300">{stats.tests}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Test Periódicos</div>
                </div>
              </div>

              {/* Tabla de Señales Recibidas */}
              <div className="border border-slate-700/80 rounded-lg overflow-hidden">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#002b49] text-slate-200 uppercase text-[10px] font-bold tracking-wider z-10 border-b border-cyan-800">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">#</th>
                        <th className="py-2 px-3 text-center w-24">Fecha</th>
                        <th className="py-2 px-3 text-center w-20">Hora</th>
                        <th className="py-2 px-3">Evento / Señal de Monitoreo</th>
                        <th className="py-2 px-3">Zona / Dispositivo</th>
                        <th className="py-2 px-3 text-center w-20">Usuario</th>
                        <th className="py-2 px-3 text-center w-14">Par</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-sans">
                      {eventosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                            No hay señales que coincidan con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        eventosFiltrados.map((e, idx) => {
                          const { fecha, hora } = formatearFechaHora(e.fecha_hora)
                          const descZona = obtenerNombreZona(e.cuenta, e.zona)
                          const evUpper = (e.evento || '').toUpperCase()

                          let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700'
                          if (evUpper.includes('ALARMA') || evUpper.includes('ROBO') || evUpper.includes('PANICO') || evUpper.includes('INCENDIO')) {
                            badgeStyle = 'bg-red-950/80 text-red-300 border-red-700 font-bold'
                          } else if (evUpper.includes('RESTABLECIMIENTO') || evUpper.includes('NORMAL')) {
                            badgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-700'
                          } else if (evUpper.includes('APERTURA') || evUpper.includes('DESARMADO')) {
                            badgeStyle = 'bg-sky-950/80 text-sky-300 border-sky-700'
                          } else if (evUpper.includes('CIERRE') || evUpper.includes('ARMADO')) {
                            badgeStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                          } else if (evUpper.includes('FALLA') || evUpper.includes('BATER') || evUpper.includes('CORTE')) {
                            badgeStyle = 'bg-orange-950/80 text-orange-300 border-orange-700 font-bold'
                          }

                          return (
                            <tr key={e.id || idx} className="hover:bg-[#152136] transition-colors">
                              <td className="py-1.5 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                              <td className="py-1.5 px-3 text-center font-mono font-semibold text-slate-300">{fecha}</td>
                              <td className="py-1.5 px-3 text-center font-mono text-cyan-300">{hora}</td>
                              <td className="py-1.5 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] border ${badgeStyle}`}>
                                  {e.evento || 'SEÑAL'}
                                </span>
                              </td>
                              <td className="py-1.5 px-3">
                                <span className="font-bold text-white font-mono">{e.zona && e.zona !== '000' ? `ZN ${e.zona}` : '---'}</span>
                                {descZona && <span className="text-slate-400 text-[11px] ml-1.5">• {descZona}</span>}
                              </td>
                              <td className="py-1.5 px-3 text-center font-mono text-slate-300">
                                {e.usuario && e.usuario !== '000' && e.usuario !== '---' ? `US ${e.usuario}` : '---'}
                              </td>
                              <td className="py-1.5 px-3 text-center font-mono text-slate-500">01</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ── FOOTER MODAL ── */}
        <div className="bg-[#0b1320] px-4 py-2.5 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span>Base de datos en tiempo real (Supabase Monitoreo 24/7)</span>
          </div>

          <div className="flex items-center gap-2">
            {reporteGenerado && (
              <span className="text-xs text-slate-400 mr-2">
                Mostrando <strong>{eventosFiltrados.length}</strong> de <strong>{eventos.length}</strong> señales
              </span>
            )}
            <button
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-bold text-xs px-4 py-1.5 rounded transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

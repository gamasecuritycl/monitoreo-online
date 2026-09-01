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

      // Deduplicar eventos duplicados si hubiese e ignorar filas no operativas
      const vistos = new Set<string>()
      const unicos: EventoMonitoreo[] = []
      for (const ev of rawEventos) {
        if ((ev.evento || '').toUpperCase().trim() === 'PREMIUM') continue
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-sans p-2 select-none overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-6xl max-h-[92vh] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-1 shadow-[4px_4px_12px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden">
        
        {/* ── HEADER SUPERIOR MODAL (ESTILO SCORPION WINDOWS 95) ── */}
        <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center select-none shrink-0 h-6">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">📑</span>
            <span className="text-[11px] tracking-wide uppercase font-mono font-bold">
              Scorpion - Reporte de Eventos y Señales por Abonado
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center text-[10px] pb-0.5 cursor-pointer hover:bg-red-600 hover:text-white"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* ── CUERPO PRINCIPAL: PANEL DE CONTROL SUPERIOR + VISTA DE RESULTADOS ── */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-[#d4d0c8]">
          
          {/* Fila 1: Layout Dual estilo Scorpion (Izquierda: Reporte Params, Derecha: Buscar Usuario) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            
            {/* 1.1 CUADRO DE PARÁMETROS DE REPORTE (7 cols) */}
            <div className="md:col-span-7 bg-[#d4d0c8] border border-gray-400 p-2.5 relative flex flex-col justify-between">
              <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[9px] font-bold text-gray-700 uppercase">
                PARÁMETROS DEL REPORTE
              </div>

              <div className="space-y-2 mt-1">
                {/* Input de Cuenta manual */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-3 text-[10px] font-bold text-gray-800 uppercase">
                    CUENTA:
                  </span>
                  <div className="col-span-9 flex gap-1.5">
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
                      placeholder="Ej: C703, C740, 0014"
                      className="flex-1 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-0.5 text-xs text-blue-900 font-mono font-bold uppercase focus:outline-blue-700"
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
                      className="bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black text-[10px] font-bold px-2.5 py-0.5 hover:bg-white active:border-t-gray-700 cursor-pointer"
                    >
                      Fijar
                    </button>
                  </div>
                </div>

                {/* Rango de Fechas: DESDE y HASTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  {/* Desde */}
                  <div className="bg-[#e0e0e0] border border-gray-400 p-1.5 space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-700 uppercase block">
                      DESDE (FECHA / HORA):
                    </span>
                    <div className="flex gap-1">
                      <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="flex-1 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 text-xs text-black font-bold focus:outline-none"
                      />
                      <input
                        type="time"
                        value={horaDesde}
                        onChange={(e) => setHoraDesde(e.target.value)}
                        className="w-18 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 text-xs text-black font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Hasta */}
                  <div className="bg-[#e0e0e0] border border-gray-400 p-1.5 space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-700 uppercase block">
                      HASTA (FECHA / HORA):
                    </span>
                    <div className="flex gap-1">
                      <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="flex-1 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 text-xs text-black font-bold focus:outline-none"
                      />
                      <input
                        type="time"
                        value={horaHasta}
                        onChange={(e) => setHoraHasta(e.target.value)}
                        className="w-18 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 text-xs text-black font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Presets Rápidos */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[9px] text-gray-700 font-bold uppercase mr-1">Rápido:</span>
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
                      className="bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 py-0.5 text-[10px] font-bold text-black hover:bg-white active:border-t-gray-700 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón Acción Principal: GENERAR REPORTE */}
              <div className="pt-2 mt-2 border-t border-gray-400">
                <button
                  onClick={() => consultarSenales()}
                  disabled={cargando}
                  className="w-full bg-[#000080] text-white border-2 border-t-blue-400 border-l-blue-400 border-b-black border-r-black font-black text-xs py-1.5 px-4 shadow flex items-center justify-center gap-2 tracking-wider uppercase hover:bg-blue-900 active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
                >
                  {cargando ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      CONSULTANDO SEÑALES...
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>GENERAR REPORTE</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 1.2 CUADRO DE BÚSQUEDA DE USUARIOS (5 cols) */}
            <div className="md:col-span-5 bg-[#d4d0c8] border border-gray-400 p-2.5 relative flex flex-col justify-between">
              <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[9px] font-bold text-gray-700 uppercase">
                BUSCAR USUARIO / ABONADO
              </div>

              {/* Filtro por nombre */}
              <div className="space-y-1.5 flex-1 flex flex-col mt-1">
                <div>
                  <span className="text-[9px] font-bold text-gray-700 uppercase block mb-0.5">
                    NOMBRE / ABONADO:
                  </span>
                  <input
                    type="text"
                    value={nombreBusqueda}
                    onChange={(e) => setNombreBusqueda(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (usuariosFiltrados.length > 0) {
                          const [cta, datos] = usuariosFiltrados[0]
                          seleccionarCliente(cta, datos)
                        }
                      }
                    }}
                    placeholder="Escriba cuenta o nombre (ENTER para fijar)..."
                    className="w-full bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-0.5 text-xs text-black font-bold focus:outline-blue-700"
                  />
                </div>

                {/* Listado estilo Scorpion clásico (Caja azul marina con scroll) */}
                <div className="flex-1 min-h-[110px] max-h-[135px] bg-[#000080] text-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white p-0.5 overflow-y-auto space-y-0.5 font-mono text-[10px]">
                  {usuariosFiltrados.length === 0 ? (
                    <div className="text-white/60 text-[10px] p-2 text-center italic">
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
                          className={`px-1.5 py-0.5 cursor-pointer select-none font-bold flex items-center justify-between ${
                            esSeleccionado
                              ? 'bg-yellow-400 text-black font-black'
                              : 'text-white hover:bg-blue-900'
                          }`}
                        >
                          <span className="truncate pr-2 uppercase">{nom}</span>
                          <span className="opacity-80 shrink-0">[{cta}]</span>
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
            <div className="bg-[#e0e0e0] border border-gray-400 p-2 flex flex-wrap items-center justify-between gap-2">
              
              {/* Filtros de la tabla */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-gray-800 uppercase">Filtrar Señales:</span>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="bg-white border border-gray-600 px-2 py-0.5 text-xs text-black font-bold focus:outline-none"
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
                  className="bg-white border border-gray-600 px-2 py-0.5 text-xs text-black font-bold placeholder-gray-500 focus:outline-none w-48"
                />
              </div>

              {/* Botones de Exportación Oficial */}
              <div className="flex items-center gap-1.5">
                {/* Exportar Excel */}
                <button
                  onClick={exportarAExcel}
                  className="bg-emerald-800 text-white border border-t-emerald-400 border-l-emerald-400 border-b-black border-r-black font-bold text-xs px-3 py-1 hover:bg-emerald-700 active:translate-y-0.5 flex items-center gap-1 cursor-pointer"
                >
                  <span>📊</span>
                  <span>Exportar Excel (.xlsx)</span>
                </button>

                {/* Imprimir / Guardar PDF Tamaño Carta */}
                <button
                  onClick={imprimirReporteCarta}
                  className="bg-blue-900 text-white border border-t-blue-400 border-l-blue-400 border-b-black border-r-black font-bold text-xs px-3 py-1 hover:bg-blue-800 active:translate-y-0.5 flex items-center gap-1 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Imprimir / PDF Carta</span>
                </button>
              </div>

            </div>
          )}

          {/* Mensaje de Error si aplica */}
          {errorMsg && (
            <div className="bg-red-100 border border-red-400 text-red-900 px-3 py-1.5 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── Fila 3: VISTA PREVIA DEL REPORTE (HOJA MEMBRETADA) ── */}
          {reporteGenerado && (
            <div className="bg-white border border-gray-400 p-3 shadow space-y-3">
              
              {/* Encabezado del Documento */}
              <div className="bg-[#f4f4f4] border border-gray-300 p-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#002b49] text-white font-black text-xl px-2.5 py-1 tracking-wider border border-black shadow-xs">
                    GAMA
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase">
                      {nombreClienteDisplay}
                    </h3>
                    <p className="text-[11px] text-gray-600 font-bold flex items-center gap-2">
                      <span className="font-mono text-blue-900">ABONADO: {cuentaActiva}</span>
                      <span>•</span>
                      <span>{direccionClienteDisplay}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-gray-700">
                  <div className="font-bold text-gray-900">Período del Reporte</div>
                  <div className="font-mono text-blue-900 font-bold">{fechaDesde} {horaDesde} → {fechaHasta} {horaHasta}</div>
                  <div className="text-[10px] text-gray-500">Emisión: {fechaEmision} • Op: {operadorNombre}</div>
                </div>
              </div>

              {/* Tarjetas KPI de Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                <div className="bg-[#f0f0f0] border border-gray-300 p-1.5 text-center">
                  <div className="text-base font-black text-gray-900">{stats.total}</div>
                  <div className="text-[8px] font-bold text-gray-600 uppercase">Total Señales</div>
                </div>
                <div className="bg-red-50 border border-red-300 p-1.5 text-center">
                  <div className="text-base font-black text-red-700">{stats.alarmas}</div>
                  <div className="text-[8px] font-bold text-red-700 uppercase">Alarmas / Pánico</div>
                </div>
                <div className="bg-sky-50 border border-sky-300 p-1.5 text-center">
                  <div className="text-base font-black text-sky-800">{stats.aperturas}</div>
                  <div className="text-[8px] font-bold text-sky-800 uppercase">Aperturas</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-300 p-1.5 text-center">
                  <div className="text-base font-black text-emerald-800">{stats.cierres}</div>
                  <div className="text-[8px] font-bold text-emerald-800 uppercase">Cierres</div>
                </div>
                <div className="bg-amber-50 border border-amber-300 p-1.5 text-center">
                  <div className="text-base font-black text-amber-800">{stats.fallas}</div>
                  <div className="text-[8px] font-bold text-amber-800 uppercase">Fallas Técnicas</div>
                </div>
                <div className="bg-gray-100 border border-gray-300 p-1.5 text-center">
                  <div className="text-base font-black text-gray-700">{stats.tests}</div>
                  <div className="text-[8px] font-bold text-gray-600 uppercase">Test Periódicos</div>
                </div>
              </div>

              {/* Tabla de Señales Recibidas */}
              <div className="border border-gray-400 overflow-hidden">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="sticky top-0 bg-[#c0c0c0] text-gray-900 uppercase text-[10px] font-bold tracking-wider z-10 border-b-2 border-gray-400">
                      <tr>
                        <th className="py-1 px-2 text-center w-10 border-r border-gray-400">#</th>
                        <th className="py-1 px-2 text-center w-24 border-r border-gray-400">Fecha</th>
                        <th className="py-1 px-2 text-center w-20 border-r border-gray-400">Hora</th>
                        <th className="py-1 px-2 border-r border-gray-400">Evento / Señal de Monitoreo</th>
                        <th className="py-1 px-2 border-r border-gray-400">Zona / Dispositivo</th>
                        <th className="py-1 px-2 text-center w-16 border-r border-gray-400">Usuario</th>
                        <th className="py-1 px-2 text-center w-12">Par</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {eventosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500 italic">
                            No hay señales que coincidan con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        eventosFiltrados.map((e, idx) => {
                          const { fecha, hora } = formatearFechaHora(e.fecha_hora)
                          const descZona = obtenerNombreZona(e.cuenta, e.zona)
                          const evUpper = (e.evento || '').toUpperCase()

                          let badgeStyle = 'bg-gray-100 text-gray-800 border-gray-300'
                          if (evUpper.includes('ALARMA') || evUpper.includes('ROBO') || evUpper.includes('PANICO') || evUpper.includes('INCENDIO')) {
                            badgeStyle = 'bg-red-600 text-white font-bold'
                          } else if (evUpper.includes('RESTABLECIMIENTO') || evUpper.includes('NORMAL')) {
                            badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300'
                          } else if (evUpper.includes('APERTURA') || evUpper.includes('DESARMADO')) {
                            badgeStyle = 'bg-sky-100 text-sky-900 border-sky-300'
                          } else if (evUpper.includes('CIERRE') || evUpper.includes('ARMADO')) {
                            badgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          } else if (evUpper.includes('FALLA') || evUpper.includes('BATER') || evUpper.includes('CORTE')) {
                            badgeStyle = 'bg-orange-600 text-white font-bold'
                          }

                          return (
                            <tr key={e.id || idx} className="hover:bg-blue-50">
                              <td className="py-1 px-2 text-center text-gray-500 text-[10px] border-r border-gray-200">{idx + 1}</td>
                              <td className="py-1 px-2 text-center font-bold text-gray-800 border-r border-gray-200">{fecha}</td>
                              <td className="py-1 px-2 text-center font-bold text-blue-900 border-r border-gray-200">{hora}</td>
                              <td className="py-1 px-2 border-r border-gray-200 font-bold">
                                <span className={`inline-block px-1.5 py-0.5 rounded-xs text-[10px] ${badgeStyle}`}>
                                  {e.evento || 'SEÑAL'}
                                </span>
                              </td>
                              <td className="py-1 px-2 border-r border-gray-200">
                                <span className="font-bold text-amber-800">{e.zona && e.zona !== '000' ? `ZN ${e.zona}` : '---'}</span>
                                {descZona && <span className="text-gray-600 font-sans text-[11px] ml-1.5">• {descZona}</span>}
                              </td>
                              <td className="py-1 px-2 text-center font-bold text-emerald-800 border-r border-gray-200">
                                {e.usuario && e.usuario !== '000' && e.usuario !== '---' ? `US ${e.usuario}` : '---'}
                              </td>
                              <td className="py-1 px-2 text-center text-gray-600">01</td>
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
        <div className="bg-[#d4d0c8] px-3 py-1.5 border-t border-gray-400 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-gray-700 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-600" />
            <span>Base de datos en tiempo real (Supabase Monitoreo 24/7)</span>
          </div>

          <div className="flex items-center gap-2">
            {reporteGenerado && (
              <span className="text-[11px] text-gray-700 font-bold mr-2">
                Mostrando <strong>{eventosFiltrados.length}</strong> de <strong>{eventos.length}</strong> señales
              </span>
            )}
            <button
              onClick={onClose}
              className="bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 text-black font-bold text-xs px-4 py-1 hover:bg-white active:border-t-gray-800 cursor-pointer"
            >
              CERRAR
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

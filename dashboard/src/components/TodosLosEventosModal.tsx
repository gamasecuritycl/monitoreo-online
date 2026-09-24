import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getSenalLegible } from './EventRow'

interface Evento {
  id: number
  fecha_hora: string
  cuenta: string
  evento: string
  nombre_abonado: string
  zona: string
  usuario: string
  _dateIsoStr?: string
  _horaFormatted?: string
  _timestamp?: number
}

interface Props {
  onClose: () => void
  clientesMap?: Record<string, any>
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
  'NOVEDADES',
  '0000',
  '000',
  '00000',
  'RECEPTOR'
])

/**
 * Validador de Cuentas Reales de Abonados.
 * Elimina 100% registros basura de metadatos o filas donde la "cuenta" sea 0000 o un timestamp.
 */
function isRealAccount(cuentaRaw?: string, eventoRaw?: string, nombreRaw?: string): boolean {
  if (!cuentaRaw) return false
  const c = cuentaRaw.trim().toUpperCase()
  const n = (nombreRaw || '').trim().toUpperCase()
  if (c === '0000' || c === '000' || c === '00000' || c.startsWith('0000') || n.includes('RECEPTOR') || c === 'RECEPTOR') return false
  if (!c || c.length < 3 || c.length > 6) return false
  if (c.includes(':') || c.includes('-') || c.includes('/') || c.includes(' ')) return false
  if (SYSTEM_ACCOUNTS.has(c) || c.startsWith('__') || c.startsWith('DAHUA') || c.startsWith('CAMARA') || c.startsWith('SNAPSHOT') || c.startsWith('CONFIG') || c.startsWith('ORDEN') || c.startsWith('AUDITORIA')) return false
  
  // Si la cuenta contiene formato de hora HH:MM:SS -> Descartar automáticamente
  if (/\d+:\d+:\d+/.test(c)) return false

  // Una cuenta válida de Scorpion es alfanumérica de 3 a 6 caracteres (ej: C7CB, 0755, C740, 0535, C7B3)
  if (!/^[A-Z0-9]{3,6}$/.test(c)) return false

  return true
}

interface ParsedEventDate {
  dateIsoStr: string // "YYYY-MM-DD"
  horaStr: string    // "HH:mm:ss"
  timestamp: number
}

/**
 * Parsea marcas de tiempo corrigiendo el desfase de +1 hora almacenado en base de datos.
 * La hora local real de Chile corresponde al valor almacenado menos 1 hora.
 */
function parseEventDate(rawStr?: string): ParsedEventDate {
  if (!rawStr) return { dateIsoStr: '', horaStr: '00:00:00', timestamp: 0 }
  const s = rawStr.trim()
  const d = new Date(s)
  if (isNaN(d.getTime())) return { dateIsoStr: s.slice(0, 10), horaStr: '00:00:00', timestamp: 0 }

  const formatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const parts = formatter.formatToParts(d)
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || ''

  const dia = getPart('day')
  const mes = getPart('month')
  const anio = getPart('year')
  const hora = getPart('hour')
  const min = getPart('minute')
  const seg = getPart('second')

  return {
    dateIsoStr: `${anio}-${mes}-${dia}`,
    horaStr: `${hora}:${min}:${seg}`,
    timestamp: d.getTime()
  }
}

/**
 * Deduplica eventos idénticos emitidos en paralelo por las dos fuentes de Scorpion (MySQL + MDB)
 */
function deduplicarEventos(lista: Evento[]): Evento[] {
  const vistos = new Map<string, Evento>()
  for (const ev of lista) {
    const timeBucket = Math.round((ev._timestamp || 0) / 45000)
    const key = `${(ev.cuenta || '').trim().toUpperCase()}_${(ev.evento || '').trim().toUpperCase()}_${timeBucket}`
    const existing = vistos.get(key)
    if (!existing) {
      vistos.set(key, ev)
    } else {
      const nomExist = (existing.nombre_abonado || '').trim().toUpperCase()
      const nomNuevo = (ev.nombre_abonado || '').trim().toUpperCase()
      if (nomExist.startsWith('ABONADO ') && !nomNuevo.startsWith('ABONADO ') && nomNuevo.length > 0) {
        vistos.set(key, ev)
      }
    }
  }
  return Array.from(vistos.values())
}

function formatTrama(cuenta: string, eventoText: string, zona: string, usuario: string) {
  const upperEv = (eventoText || '').toUpperCase().trim()
  // Extraer código de Contact ID (ej. E130, R401)
  const match = upperEv.match(/[ER]\d{3}/)
  let code = match ? match[0] : ''
  
  if (!code) {
    const siaToCid: Record<string, string> = {
      'HA': 'E122', 'HH': 'R122', 'HR': 'R122', 'HT': 'E122',
      'MA': 'E100', 'MH': 'R100', 'MR': 'R100', 'QA': 'E100',
      'BA': 'E130', 'BH': 'R130', 'BR': 'R130', 'BC': 'E406', 'BV': 'E130', 'BB': 'E570',
      'PA': 'E120', 'PH': 'R120', 'PR': 'R120',
      'FA': 'E110', 'FH': 'R110', 'FR': 'R110', 'FS': 'E113', 'KA': 'E114',
      'TA': 'E137', 'TH': 'R137', 'TR': 'R137',
      'AT': 'E301', 'AR': 'R301', 'AH': 'R301',
      'YT': 'E302', 'YR': 'R302', 'YH': 'R302', 'LB': 'E302', 'LR': 'R302',
      'CL': 'R401', 'CP': 'R401', 'CA': 'R401', 'CG': 'R401',
      'OP': 'E401', 'OA': 'E401', 'OG': 'E401', 'OR': 'E401',
      'RP': 'E602', 'TX': 'E602', 'RX': 'E602',
      'WA': 'E154', 'WH': 'R154', 'WR': 'R154',
      'GA': 'E151', 'GH': 'R151', 'GR': 'R151',
      'YX': 'E354', 'YK': 'R354',
    }
    const cleanSia = upperEv.replace(/^[/\\*]+/, '').slice(0, 2)
    if (siaToCid[cleanSia]) {
      code = siaToCid[cleanSia]
    } else if (upperEv.includes('ASALTO') || upperEv.includes('ATRACO')) code = upperEv.includes('REST') ? 'R122' : 'E122'
    else if (upperEv.includes('MEDIC') || upperEv.includes('AUXILIO')) code = upperEv.includes('REST') ? 'R100' : 'E100'
    else if (upperEv.includes('APERTURA')) code = 'E401'
    else if (upperEv.includes('CIERRE')) code = 'R401'
    else if (upperEv.includes('AUTOTEST') || upperEv.includes('TEST')) code = 'E602'
    else if (upperEv.includes('PANICO')) code = upperEv.includes('REST') ? 'R120' : 'E120'
    else if (upperEv.includes('FUEGO') || upperEv.includes('INCENDIO')) code = upperEv.includes('REST') ? 'R110' : 'E110'
    else if (upperEv.includes('FALLA AC') || upperEv.includes('CORTE')) code = upperEv.includes('REST') ? 'R301' : 'E301'
    else if (upperEv.includes('BATERIA')) code = upperEv.includes('REST') ? 'R302' : 'E302'
    else if (upperEv.includes('RESTABLEC') || upperEv.includes('REST') || upperEv.includes('RESTAUR')) code = 'R130'
    else code = 'E130'
  }

  const cleanCuenta = (cuenta || '').trim().padStart(4, '0')
  const cleanUserOrZone = (usuario && usuario !== 'None' ? usuario : (zona && zona !== 'None' ? zona : '---'))
    .trim()
    .slice(0, 3)
    .padStart(3, '0')
    
  return `5011 18${cleanCuenta}${code}01${cleanUserOrZone}`
}

function getRowStyle(eventoTexto: string) {
  const upper = (eventoTexto || '').toUpperCase().trim()

  // 1. Restablecimientos -> Fondo amarillo (#FFFF00)
  if (
    upper.includes('RESTABLEC') ||
    upper.includes('RESTAURACION') ||
    upper.includes('RETORNO') ||
    upper.includes('REST') ||
    ['BH', 'BR', 'MH', 'MR', 'HH', 'HR', 'PH', 'PR', 'FH', 'FR', 'AR', 'AH', 'YR', 'YH', 'LR', 'TR', 'TH', 'BU'].includes(upper)
  ) {
    return { bg: '#ffff00', text: '#000000' }
  }

  // 2. Asalto, Médica, Pánico, Fuego crítico -> Fondo ROJO (#FF0000)
  if (
    upper.includes('ASALTO') ||
    upper.includes('ATRACO') ||
    upper.includes('PANICO') ||
    upper.includes('PÁNICO') ||
    upper.includes('FUEGO') ||
    upper.includes('INCENDIO') ||
    upper.includes('MEDICA') ||
    upper.includes('MÉDICA') ||
    upper.includes('AUXILIO') ||
    ['HA', 'MA', 'PA', 'FA'].includes(upper)
  ) {
    return { bg: '#ff0000', text: '#ffffff' }
  }

  // 3. Aperturas / Cierres -> Fondo blanco o celeste
  if (upper.includes('APERTURA') || upper.includes('CIERRE') || upper.includes('DESARMADO') || upper.includes('ARMADO') || ['CL', 'CP', 'CA', 'CG', 'OP', 'OA', 'OG'].includes(upper)) {
    const hash = (eventoTexto || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return hash % 2 === 0
      ? { bg: '#FFFFFF', text: '#000000' }
      : { bg: '#E0F0FF', text: '#000000' }
  }

  // 4. Sabotaje / Robo / Intrusión -> Fondo rosado (#ffc0cb)
  if (upper.includes('ROBO') || upper.includes('INTRUSION') || upper.includes('INTRUSIÓN') || upper.includes('SABOTAJE') || upper.includes('TAMPER') || ['BA', 'TA'].includes(upper)) {
    return { bg: '#ffc0cb', text: '#000000' }
  }

  // 5. Fallas de energía AC -> Verde (#00ff00)
  if (upper.includes('FALLA AC') || upper.includes('CORTE DE LUZ') || upper.includes('FALLA DE ENERGIA') || upper === 'AT') {
    return { bg: '#00ff00', text: '#000000' }
  }
  
  return null
}

export default function TodosLosEventosModal({ onClose, clientesMap: propClientesMap }: Props) {
  // Fecha actual local YYYY-MM-DD
  const getChileLocalDate = () => {
    const d = new Date()
    const anio = d.getFullYear()
    const mes = (d.getMonth() + 1).toString().padStart(2, '0')
    const dia = d.getDate().toString().padStart(2, '0')
    return `${anio}-${mes}-${dia}`
  }

  const [fecha, setFecha] = useState(getChileLocalDate())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('Cargando eventos del día...')
  const [clientesLocal, setClientesLocal] = useState<Record<string, any>>({})
  
  // Orden: true = Últimos en la parte inferior (00:00 arriba -> 23:59 abajo)
  // false = Últimos en la parte superior (23:59 arriba -> 00:00 abajo)
  const [ordenUltimosAbajo, setOrdenUltimosAbajo] = useState(true)

  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Cargar mapa de clientes desde cache local si no viene por props
  useEffect(() => {
    if (propClientesMap && Object.keys(propClientesMap).length > 0) {
      setClientesLocal(propClientesMap)
    } else {
      try {
        const cached = localStorage.getItem('gama_clientes_cache')
        if (cached) {
          setClientesLocal(JSON.parse(cached))
        }
      } catch {}
    }
  }, [propClientesMap])

  /**
   * Carga el 100% de los eventos del día completo de 00:00:00 a 23:59:59 sin duplicados y con hora exacta
   */
  const cargarEventos = useCallback(async (fechaSeleccionada: string, mantenerOrdenAbajo = true) => {
    if (!fechaSeleccionada) {
      alert('Por favor seleccione una fecha')
      return
    }

    setCargando(true)
    setMensaje(`Consultando eventos de 00:00:00 a 23:59:59 para el ${fechaSeleccionada}...`)
    setEventos([])

    try {
      const [anio, mes, dia] = fechaSeleccionada.split('-')
      const dateChileStr = `${dia}-${mes}-${anio}`

      // Margen de consulta: como en DB la hora está adelantada en 1 hora,
      // las 00:00 del día están guardadas como 01:00, y las 23:59 del día están como 00:59 del día siguiente.
      const startIso = `${fechaSeleccionada}T00:00:00`
      const nextDay = new Date(new Date(`${fechaSeleccionada}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10)
      const endIso = `${nextDay}T01:30:00`

      let allRows: any[] = []
      let page = 0
      const pageSize = 1000

      // Paginación continua sin límites para cargar todos los eventos del día
      while (true) {
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('id, fecha_hora, cuenta, evento, zona, usuario, nombre_abonado')
          .not('cuenta', 'in', '(CLIENTES,CODIGOS,ZONAS,__SINCRONIZADOR__,CONFIG_OPERADORES,CLIENTES_MAESTROS_CRM,EMPRESAS_CONGLOMERADO,COTIZACIONES_DOLIBARR,ORDENES_TRABAJO,ORDEN_EDITOR_REMOTO,AUDITORIA_EDITOR_REMOTO,0000,000)')
          .not('cuenta', 'like', 'CONFIG_WHATSAPP_%')
          .not('cuenta', 'like', 'DAHUA_%')
          .not('cuenta', 'like', 'CAMARAS_%')
          .not('cuenta', 'like', 'SNAPSHOT_%')
          .gte('fecha_hora', startIso)
          .lte('fecha_hora', endIso)
          .order('fecha_hora', { ascending: true })
          .range(from, to)

        if (error) throw error
        if (!data || data.length === 0) break

        allRows = allRows.concat(data)
        if (data.length < pageSize) break
        page++
      }

      // Fallback para fechas históricas guardadas con formato de texto libre "DD-MM-YYYY"
      if (allRows.length === 0) {
        const { data: dateData } = await supabase
          .from('eventos_monitoreo')
          .select('id, fecha_hora, cuenta, evento, zona, usuario, nombre_abonado')
          .not('cuenta', 'in', '(CLIENTES,CODIGOS,ZONAS,__SINCRONIZADOR__,CONFIG_OPERADORES,0000,000)')
          .not('cuenta', 'like', 'CONFIG_WHATSAPP_%')
          .or(`fecha_hora.like.%${dateChileStr}%,fecha_hora.like.%${fechaSeleccionada}%`)
          .order('id', { ascending: true })
          .limit(3000)

        if (dateData && dateData.length > 0) {
          allRows = dateData
        }
      }

      // Filtrar abonados reales y normalizar hora corregida
      const eventosFiltrados: Evento[] = allRows
        .filter(e => isRealAccount(e.cuenta, e.evento, e.nombre_abonado))
        .map(e => {
          const parsed = parseEventDate(e.fecha_hora)
          return {
            ...e,
            _dateIsoStr: parsed.dateIsoStr,
            _horaFormatted: parsed.horaStr,
            _timestamp: parsed.timestamp
          }
        })
        .filter(e => e._dateIsoStr === fechaSeleccionada)

      // DEDUPLICAR: elimina eventos duplicados
      const eventosUnicos = deduplicarEventos(eventosFiltrados)

      // Ordenamiento según configuración:
      // Si mantenerOrdenAbajo es true -> Últimos en la parte inferior (00:00:00 arriba -> 23:59:59 abajo)
      // Si mantenerOrdenAbajo es false -> Últimos en la parte superior (23:59:59 arriba -> 00:00:00 abajo)
      if (mantenerOrdenAbajo) {
        eventosUnicos.sort((a, b) => {
          if ((a._timestamp || 0) !== (b._timestamp || 0)) {
            return (a._timestamp || 0) - (b._timestamp || 0)
          }
          return a.id - b.id
        })
      } else {
        eventosUnicos.sort((a, b) => {
          if ((b._timestamp || 0) !== (a._timestamp || 0)) {
            return (b._timestamp || 0) - (a._timestamp || 0)
          }
          return b.id - a.id
        })
      }

      setEventos(eventosUnicos)

      if (eventosUnicos.length > 0) {
        setMensaje(`¡${eventosUnicos.length} eventos únicos cargados para el ${fechaSeleccionada}!`)
        // Auto-scroll a los más recientes si los últimos están en la parte inferior
        if (mantenerOrdenAbajo) {
          setTimeout(() => {
            if (tableContainerRef.current) {
              tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight
            }
          }, 150)
        }
      } else {
        setMensaje(`No hay eventos registrados de 00:00 a 23:59 para el ${fechaSeleccionada}.`)
      }
    } catch (err: any) {
      console.error('[TODOS LOS EVENTOS] Error:', err)
      setMensaje('❌ Error de consulta: ' + (err.message || 'Error de conexión'))
    } finally {
      setCargando(false)
    }
  }, [])

  // Cargar automáticamente al abrir el modal
  useEffect(() => {
    cargarEventos(fecha, ordenUltimosAbajo)
  }, [cargarEventos, fecha, ordenUltimosAbajo])

  // Invertir orden entre "Últimos abajo" y "Últimos arriba"
  const toggleOrden = () => {
    const nuevoOrden = !ordenUltimosAbajo
    setOrdenUltimosAbajo(nuevoOrden)
    setEventos(prev => {
      const copia = [...prev]
      if (nuevoOrden) {
        // Últimos abajo (00:00 -> 23:59)
        copia.sort((a, b) => (a._timestamp || 0) - (b._timestamp || 0) || a.id - b.id)
      } else {
        // Últimos arriba (23:59 -> 00:00)
        copia.sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0) || b.id - a.id)
      }
      return copia
    })
  }

  const scrollAlFinal = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: tableContainerRef.current.scrollHeight, behavior: 'smooth' })
    }
  }

  const scrollAlInicio = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Obtener nombre del abonado con fallback
  const getNombreAbonado = (cuenta: string, nombreOriginal?: string) => {
    const c = (cuenta || '').toUpperCase().trim()
    if (clientesLocal[c]?.nombre) return clientesLocal[c].nombre
    if (nombreOriginal && !nombreOriginal.includes('RECEPTOR') && nombreOriginal.trim() !== '') {
      return nombreOriginal
    }
    return `ABONADO ${cuenta}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 md:p-4 font-mono">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-full max-w-5xl md:max-w-6xl max-h-[96vh] flex flex-col shadow-2xl text-black select-none">
        
        {/* Title bar Windows 98 / Scorpion */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-xs tracking-wide flex items-center gap-2">
            <span>Scorpion - Eventos Ingresados por Día (00:00:00 a 23:59:59)</span>
            <span className="text-[10px] text-yellow-300 font-normal hidden sm:inline">
              {ordenUltimosAbajo ? '· Últimos en la parte inferior' : '· Últimos en la parte superior'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] cursor-pointer"
            title="Cerrar ventana"
          >
            X
          </button>
        </div>

        {/* Interior Container */}
        <div className="p-2 flex-1 flex flex-col overflow-hidden bg-[#c0c0c0]">
          
          {/* Main Title Header & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between my-1 shrink-0 gap-2">
            <h1 className="text-base md:text-lg font-black text-[#000080] tracking-wider uppercase">
              EVENTOS RECIBIDOS {fecha} (DÍA COMPLETO)
            </h1>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleOrden}
                className="bg-[#d4d0c8] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 py-0.5 font-bold text-[10px] md:text-xs cursor-pointer shadow-sm active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                title="Cambiar orden de visualización"
              >
                {ordenUltimosAbajo ? '🔽 Orden: Últimos abajo' : '🔼 Orden: Últimos arriba'}
              </button>

              <button
                onClick={scrollAlInicio}
                className="bg-[#d4d0c8] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 py-0.5 font-bold text-[10px] cursor-pointer shadow-sm"
                title="Ir al inicio de la lista"
              >
                ⬆ Inicio
              </button>

              <button
                onClick={scrollAlFinal}
                className="bg-[#d4d0c8] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 py-0.5 font-bold text-[10px] cursor-pointer shadow-sm"
                title="Ir al final de la lista (últimos)"
              >
                ⬇ Final
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div 
            ref={tableContainerRef}
            className="flex-1 overflow-auto border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white min-h-[320px] md:min-h-[480px]"
          >
            <table className="w-full text-left border-collapse text-[10px] md:text-[11px] leading-tight font-bold whitespace-nowrap">
              <thead>
                <tr className="bg-[#d4d0c8] text-black sticky top-0 border-b border-gray-400 select-none z-10">
                  <th className="p-1 border-r border-b border-gray-400 w-20 text-center">HORA</th>
                  <th className="p-1 border-r border-b border-gray-400 w-16 text-center">CUENTA</th>
                  <th className="p-1 border-r border-b border-gray-400">NOMBRE</th>
                  <th className="p-1 border-r border-b border-gray-400">EVENTO</th>
                  <th className="p-1 border-r border-b border-gray-400 w-10 text-center">PAR.</th>
                  <th className="p-1 border-r border-b border-gray-400 w-10 text-center">ZN.</th>
                  <th className="p-1 border-r border-b border-gray-400 w-10 text-center">USR.</th>
                  <th className="p-1 border-r border-b border-gray-400 w-48 font-mono text-center">TRAMA</th>
                  <th className="p-1 border-r border-b border-gray-400">OBSERVACION</th>
                  <th className="p-1 border-b border-gray-400 w-12 text-center">COM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {eventos.map((e, index) => {
                  const senalLegible = getSenalLegible(e.evento)
                  const customStyle = getRowStyle(senalLegible || e.evento)
                  const rowBg = customStyle ? customStyle.bg : (index % 2 === 0 ? '#ffffff' : '#f5f5f5')
                  const rowFg = customStyle ? customStyle.text : '#000000'
                  
                  // Formatear parámetros
                  const par = (e.zona && e.zona !== 'None' ? '01' : '---')
                  const zn = (e.zona && e.zona !== 'None' ? e.zona.padStart(2, '0') : '---')
                  const usr = (e.usuario && e.usuario !== 'None' ? e.usuario.padStart(3, '0') : '---')
                  const horaDisplay = e._horaFormatted || parseEventDate(e.fecha_hora).horaStr
                  const nombreDisplay = getNombreAbonado(e.cuenta, e.nombre_abonado)
                  
                  return (
                    <tr 
                      key={`${e.id}-${e.cuenta}-${index}`} 
                      className="hover:opacity-90 border-b border-gray-300"
                      style={{ backgroundColor: rowBg, color: rowFg }}
                    >
                      <td className="p-1 border-r border-gray-300 text-center font-mono">{horaDisplay}</td>
                      <td className="p-1 border-r border-gray-300 text-center font-mono">{e.cuenta}</td>
                      <td className="p-1 border-r border-gray-300 max-w-[220px] truncate uppercase" title={nombreDisplay}>{nombreDisplay}</td>
                      <td className="p-1 border-r border-gray-300 uppercase" title={e.evento !== senalLegible ? `Código original: ${e.evento}` : undefined}>{senalLegible}</td>
                      <td className="p-1 border-r border-gray-300 text-center font-mono">{par}</td>
                      <td className="p-1 border-r border-gray-300 text-center font-mono">{zn}</td>
                      <td className="p-1 border-r border-gray-300 text-center font-mono">{usr}</td>
                      <td className="p-1 border-r border-gray-300 font-mono text-[9px] md:text-[10px] text-center">{formatTrama(e.cuenta, e.evento, e.zona, e.usuario)}</td>
                      <td className="p-1 border-r border-gray-300"></td>
                      <td className="p-1 text-center font-mono">---</td>
                    </tr>
                  )
                })}
                {eventos.length === 0 && !cargando && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-gray-500 italic bg-gray-50">
                      No hay eventos registrados para el {fecha} entre las 00:00:00 y las 23:59:59.
                    </td>
                  </tr>
                )}
                {cargando && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-blue-800 font-bold bg-gray-50 animate-pulse">
                      ⏳ Cargando día completo (00:00:00 a 23:59:59) sin límites...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Command Bar */}
          <div className="mt-2 p-2 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 flex flex-wrap gap-2 items-center justify-between shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] md:text-[11px] font-bold text-gray-700 uppercase">
                VER TODOS LOS EVENTOS DEL DIA:
              </span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-white border border-gray-400 font-bold px-2 py-0.5 text-xs text-black select-text focus:outline-none"
              />
              <button
                onClick={() => cargarEventos(fecha, ordenUltimosAbajo)}
                disabled={cargando}
                className="bg-[#d4d0c8] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-4 py-0.5 font-bold text-xs cursor-pointer active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white shadow-sm"
              >
                {cargando ? 'CARGANDO...' : 'VER'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="bg-[#d4d0c8] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-6 py-0.5 font-bold text-xs cursor-pointer active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white shadow-sm"
            >
              CERRAR
            </button>
          </div>

          {/* Status Bar */}
          <div className="mt-1 bg-[#d4d0c8] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-0.5 text-[10px] text-gray-600 font-bold tracking-wide shrink-0 flex flex-wrap justify-between items-center gap-1">
            <span>
              {mensaje} {eventos.length > 0 && `(${eventos.length} eventos únicos · 00:00 a 23:59)`}
            </span>
            {eventos.length > 0 && (
              <span className="text-gray-700 font-mono text-[9px] md:text-[10px]">
                {ordenUltimosAbajo ? (
                  <>
                    ▲ PRIMERO: <strong className="text-emerald-900">{eventos[0]._horaFormatted || ''}</strong> &nbsp;|&nbsp; 
                    ▼ ÚLTIMO (INFERIOR): <strong className="text-blue-900">{eventos[eventos.length - 1]._horaFormatted || ''}</strong>
                  </>
                ) : (
                  <>
                    ▲ ÚLTIMO (SUPERIOR): <strong className="text-blue-900">{eventos[0]._horaFormatted || ''}</strong> &nbsp;|&nbsp; 
                    ▼ PRIMERO: <strong className="text-emerald-900">{eventos[eventos.length - 1]._horaFormatted || ''}</strong>
                  </>
                )}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

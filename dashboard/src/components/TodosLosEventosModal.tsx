import React, { useState, useEffect, useCallback } from 'react'
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
 * Parsea cualquier marca de tiempo de eventos_monitoreo en hora oficial de Chile (America/Santiago)
 */
function parseEventDate(rawStr?: string): ParsedEventDate {
  if (!rawStr) return { dateIsoStr: '', horaStr: '00:00:00', timestamp: 0 }
  const s = rawStr.trim()

  // 1. Formato "DD-MM-YYYY HH:mm:ss" o "DD/MM/YYYY HH:mm:ss" (ej: "25-08-2026 20:53:57")
  const matchDDMM = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/)
  if (matchDDMM) {
    const [, dia, mes, anio, hh = '00', mm = '00', ss = '00'] = matchDDMM
    const dateIsoStr = `${anio}-${mes}-${dia}`
    const horaStr = `${hh}:${mm}:${ss}`
    const dObj = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hh), Number(mm), Number(ss))
    return { dateIsoStr, horaStr, timestamp: dObj.getTime() }
  }

  // 2. Formato ISO o timestamp nativo con conversión estricta a zona horaria de Chile
  try {
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const formatterFecha = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const formatterHora = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })

      return {
        dateIsoStr: formatterFecha.format(d),
        horaStr: formatterHora.format(d),
        timestamp: d.getTime()
      }
    }
  } catch {}

  return { dateIsoStr: s.slice(0, 10), horaStr: '00:00:00', timestamp: 0 }
}

function formatTrama(cuenta: string, eventoText: string, zona: string, usuario: string) {
  const upperEv = (eventoText || '').toUpperCase()
  // Extraer código de Contact ID (ej. E130, R401)
  const match = upperEv.match(/[ER]\d{3}/)
  let code = match ? match[0] : 'E130'
  
  if (!match) {
    if (upperEv.includes('APERTURA')) code = 'E401'
    else if (upperEv.includes('CIERRE')) code = 'R401'
    else if (upperEv.includes('AUTOTEST') || upperEv.includes('TEST')) code = 'E602'
    else if (upperEv.includes('PANICO')) code = 'E120'
    else if (upperEv.includes('FUEGO') || upperEv.includes('INCENDIO')) code = 'E110'
    else if (upperEv.includes('FALLA') || upperEv.includes('CORTE')) code = 'E300'
    else if (upperEv.includes('RESTABLEC') || upperEv.includes('REST') || upperEv.includes('RESTAUR')) code = 'R130'
  }

  const cleanCuenta = (cuenta || '').trim().padStart(4, '0')
  const cleanUserOrZone = (usuario && usuario !== 'None' ? usuario : (zona && zona !== 'None' ? zona : '---'))
    .trim()
    .slice(0, 3)
    .padStart(3, '0')
    
  return `5011 18${cleanCuenta}${code}01${cleanUserOrZone}`
}

function getRowStyle(eventoTexto: string) {
  const upper = (eventoTexto || '').toUpperCase()

  // 1. Aperturas / Cierres -> Fondo blanco o celeste
  if (upper.includes('APERTURA') || upper.includes('CIERRE') || upper.includes('DESARMADO') || upper.includes('ARMADO')) {
    const hash = (eventoTexto || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return hash % 2 === 0
      ? { bg: '#FFFFFF', text: '#000000' }
      : { bg: '#E0F0FF', text: '#000000' }
  }
  // 2. Fuego / Incendio Falla -> Fondo verde
  if ((upper.includes('FUEGO') || upper.includes('INCENDIO') || upper.includes('HUMO')) && upper.includes('FALLA')) {
    return { bg: '#00ff00', text: '#000000' }
  }
  // 3. Fuego / Incendio Restablecimiento -> Fondo amarillo
  if ((upper.includes('FUEGO') || upper.includes('INCENDIO') || upper.includes('HUMO')) && (upper.includes('RESTABLEC') || upper.includes('REST') || upper.includes('RESTAUR'))) {
    return { bg: '#ffff00', text: '#000000' }
  }
  // 4. Sabotaje / Robo / Pánico -> Fondo rosado/rojo
  if (upper.includes('PANICO') || upper.includes('ROBO') || upper.includes('INTRUSION')) {
    return { bg: '#ffc0cb', text: '#000000' }
  }
  
  return null
}

export default function TodosLosEventosModal({ onClose, clientesMap: propClientesMap }: Props) {
  // Fecha actual en hora local de Chile YYYY-MM-DD
  const getChileLocalDate = () => {
    const d = new Date()
    const formatterFecha = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    return formatterFecha.format(d)
  }

  const [fecha, setFecha] = useState(getChileLocalDate())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('Cargando eventos del día...')
  const [clientesLocal, setClientesLocal] = useState<Record<string, any>>({})

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
   * Carga la totalidad de los eventos del día seleccionado en orden DESCENDENTE
   * (El más reciente arriba, el primero del día abajo en la parte inferior).
   */
  const cargarEventos = useCallback(async (fechaSeleccionada: string) => {
    if (!fechaSeleccionada) {
      alert('Por favor seleccione una fecha')
      return
    }

    setCargando(true)
    setMensaje(`Consultando todos los eventos del ${fechaSeleccionada}...`)
    setEventos([])

    try {
      const [anio, mes, dia] = fechaSeleccionada.split('-')
      const dateChileStr = `${dia}-${mes}-${anio}`

      // Ventana ISO amplia para cubrir la totalidad del día en cualquier huso de Chile (-04:00 / -03:00)
      const startIso = `${fechaSeleccionada}T00:00:00-05:00`
      const endIso = `${fechaSeleccionada}T23:59:59+01:00`

      let allRows: any[] = []
      let page = 0
      const pageSize = 1000

      // Paginación continua para garantizar la carga del 100% de los eventos del día
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
          .order('id', { ascending: false })
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
          .like('fecha_hora', `%${dateChileStr}%`)
          .order('id', { ascending: false })
          .limit(3000)

        if (dateData && dateData.length > 0) {
          allRows = dateData
        }
      }

      // Filtrar abonados reales y normalizar fecha/hora a zona horaria de Chile
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

      // ORDEN DESCENDENTE:
      // El evento más reciente del día arriba (índice 0).
      // El PRIMERO del día seleccionado en la parte inferior (último índice).
      eventosFiltrados.sort((a, b) => {
        if ((b._timestamp || 0) !== (a._timestamp || 0)) {
          return (b._timestamp || 0) - (a._timestamp || 0)
        }
        return b.id - a.id
      })

      setEventos(eventosFiltrados)

      if (eventosFiltrados.length > 0) {
        setMensaje(`¡${eventosFiltrados.length} eventos cargados para el ${fechaSeleccionada}!`)
      } else {
        setMensaje(`No hay eventos registrados para el ${fechaSeleccionada}.`)
      }
    } catch (err: any) {
      console.error('[TODOS LOS EVENTOS] Error:', err)
      setMensaje('❌ Error de consulta: ' + (err.message || 'Error de conexión'))
    } finally {
      setCargando(false)
    }
  }, [])

  // Cargar automáticamente los eventos de la fecha seleccionada al montar el componente
  useEffect(() => {
    cargarEventos(fecha)
  }, [cargarEventos, fecha])

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
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-full max-w-5xl md:max-w-6xl max-h-[95vh] flex flex-col shadow-2xl text-black select-none">
        
        {/* Title bar Windows 98 / Scorpion */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-xs tracking-wide flex items-center gap-2">
            <span>Scorpion - Eventos Ingresados por Día</span>
            <span className="text-[10px] text-yellow-300 font-normal hidden sm:inline">
              (Orden descendente · Primero del día en parte inferior)
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
          
          {/* Main Title Header */}
          <div className="text-center my-1 shrink-0">
            <h1 className="text-base md:text-lg font-black text-[#000080] tracking-wider uppercase">
              EVENTOS RECIBIDOS {fecha}
            </h1>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white min-h-[300px] md:min-h-[450px]">
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
                      key={e.id} 
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
                      No hay eventos registrados para el {fecha}.
                    </td>
                  </tr>
                )}
                {cargando && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-blue-800 font-bold bg-gray-50 animate-pulse">
                      ⏳ Cargando todos los eventos del {fecha}...
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
                onClick={() => cargarEventos(fecha)}
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
              {mensaje} {eventos.length > 0 && `(${eventos.length} eventos · orden descendente)`}
            </span>
            {eventos.length > 0 && (
              <span className="text-gray-700 font-mono text-[9px] md:text-[10px]">
                ▲ MÁS RECIENTE: <strong className="text-blue-900">{eventos[0]._horaFormatted || ''}</strong> &nbsp;|&nbsp; 
                ▼ PRIMERO DEL DÍA: <strong className="text-emerald-900">{eventos[eventos.length - 1]._horaFormatted || ''}</strong>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

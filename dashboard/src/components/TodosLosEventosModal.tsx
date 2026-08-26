import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Evento {
  id: number
  fecha_hora: string
  cuenta: string
  evento: string
  nombre_abonado: string
  zona: string
  usuario: string
}

interface Props {
  onClose: () => void
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

/**
 * Validador de Cuentas Reales de Abonados.
 * Elimina 100% registros basura de metadatos o filas donde la "cuenta" sea un timestamp (ej: 6:10:25).
 */
function isRealAccount(cuentaRaw?: string, eventoRaw?: string): boolean {
  if (!cuentaRaw) return false
  const c = cuentaRaw.trim().toUpperCase()
  if (!c || c.length < 3 || c.length > 6) return false
  if (c.includes(':') || c.includes('-') || c.includes('/') || c.includes(' ')) return false
  if (SYSTEM_ACCOUNTS.has(c) || c.startsWith('__')) return false
  
  // Si la cuenta contiene formato de hora HH:MM:SS -> Descartar
  if (/\d+:\d+:\d+/.test(c)) return false

  // Una cuenta válida de Scorpion es alfanumérica de 3 a 6 caracteres (ej: C7B3, 0535, C7A1, C7BF)
  if (!/^[A-Z0-9]{3,6}$/.test(c)) return false

  return true
}

interface ParsedChileDate {
  dateChileIso: string // "YYYY-MM-DD"
  horaFormatted: string // "HH:mm:ss"
  timestamp: number
}

/**
 * Convierte cualquier marca de tiempo de Supabase ("DD-MM-YYYY", "YYYY-MM-DD", o ISO UTC) a la fecha y hora local de Chile.
 */
function getChileLocalDateAndFormattedTime(raw?: string): ParsedChileDate {
  if (!raw) return { dateChileIso: '', horaFormatted: '00:00:00', timestamp: 0 }
  const s = raw.trim()

  // 1. Si viene en formato "DD-MM-YYYY HH:mm:ss" o "DD/MM/YYYY HH:mm:ss"
  const matchDDMM = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/)
  if (matchDDMM) {
    const [, dia, mes, anio, hh = '00', mm = '00', ss = '00'] = matchDDMM
    return {
      dateChileIso: `${anio}-${mes}-${dia}`,
      horaFormatted: `${hh}:${mm}:${ss}`,
      timestamp: new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hh), Number(mm), Number(ss)).getTime()
    }
  }

  // 2. Si viene en formato "YYYY-MM-DD HH:mm:ss" sin T
  const matchYYYYMM = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
  if (matchYYYYMM) {
    const [, anio, mes, dia, hh, mm, ss] = matchYYYYMM
    return {
      dateChileIso: `${anio}-${mes}-${dia}`,
      horaFormatted: `${hh}:${mm}:${ss}`,
      timestamp: new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hh), Number(mm), Number(ss)).getTime()
    }
  }

  // 3. Si viene como ISO "2026-08-25T20:52:17.000Z"
  try {
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const formatterDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const formatterTime = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      const dateChileIso = formatterDate.format(d)
      const partsTime = formatterTime.formatToParts(d)
      const hh = (partsTime.find(p => p.type === 'hour')?.value || '00').padStart(2, '0')
      const mm = (partsTime.find(p => p.type === 'minute')?.value || '00').padStart(2, '0')
      const ss = (partsTime.find(p => p.type === 'second')?.value || '00').padStart(2, '0')
      return {
        dateChileIso,
        horaFormatted: `${hh}:${mm}:${ss}`,
        timestamp: d.getTime()
      }
    }
  } catch {}

  return { dateChileIso: s.slice(0, 10), horaFormatted: '00:00:00', timestamp: 0 }
}

function formatTrama(cuenta: string, eventoText: string, zona: string, usuario: string) {
  const upperEv = (eventoText || '').toUpperCase()
  // Intentar extraer código de Contact ID (ej. E130, R401)
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

  // 1. Aperturas / Cierres -> Fondo blanco o celeste aleatorio
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
  
  return null // Alternado por defecto
}

export default function TodosLosEventosModal({ onClose }: Props) {
  // Inicializar con la fecha local de Chile en formato YYYY-MM-DD
  const getChileLocalDate = () => {
    const d = new Date()
    const tzOffset = -4 * 60 // UTC-4 para Chile estándar
    const localTime = d.getTime() + (d.getTimezoneOffset() + tzOffset) * 60000
    const localDate = new Date(localTime)
    const anio = localDate.getFullYear()
    const mes = (localDate.getMonth() + 1).toString().padStart(2, '0')
    const dia = localDate.getDate().toString().padStart(2, '0')
    return `${anio}-${mes}-${dia}`
  }

  const [fecha, setFecha] = useState(getChileLocalDate())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('Seleccione una fecha y presione VER.')

  const cargarEventos = async () => {
    if (!fecha) {
      alert('Por favor seleccione una fecha')
      return
    }

    setCargando(true)
    setMensaje('Buscando eventos en base de datos...')
    setEventos([])

    try {
      // Definir ventana de marcas de tiempo en formato ISO nativo sin ILIKE en SQL
      const targetDate = new Date(`${fecha}T12:00:00Z`)
      const prevDayIso = new Date(targetDate.getTime() - 36 * 3600 * 1000).toISOString()
      const nextDayIso = new Date(targetDate.getTime() + 36 * 3600 * 1000).toISOString()

      // 1. Consultar Supabase filtrando cuentas técnicas/cámaras directamente en SQL con marcas de tiempo ISO nativas
      let { data, error } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .not('cuenta', 'in', '(CLIENTES,CODIGOS,ZONAS,__SINCRONIZADOR__,CONFIG_OPERADORES,CLIENTES_MAESTROS_CRM,EMPRESAS_CONGLOMERADO,COTIZACIONES_DOLIBARR,ORDENES_TRABAJO,HORARIOS,ENTREGAS_TURNO,CAMARAS,CONFIGURACION,CONFIGURACIONES,NOVEDADES)')
        .not('cuenta', 'like', 'CAMARAS_DAHUA_%')
        .not('cuenta', 'like', 'DAHUA_%')
        .not('cuenta', 'like', 'SNAPSHOT_%')
        .not('cuenta', 'like', 'CONFIG_%')
        .not('cuenta', 'like', '__%')
        .gte('fecha_hora', prevDayIso)
        .lte('fecha_hora', nextDayIso)
        .order('id', { ascending: true })
        .limit(5000)

      // Fallback: si no retornó por ventana de tiempo ISO (ej. registros en texto libre), traer últimas 3000 filas de abonados
      if ((!data || data.length === 0) && !error) {
        const { data: fallbackData } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .not('cuenta', 'in', '(CLIENTES,CODIGOS,ZONAS,__SINCRONIZADOR__,CONFIG_OPERADORES,ORDENES_TRABAJO,HORARIOS,ENTREGAS_TURNO,CAMARAS,NOVEDADES)')
          .not('cuenta', 'like', 'CAMARAS_DAHUA_%')
          .not('cuenta', 'like', 'DAHUA_%')
          .not('cuenta', 'like', 'SNAPSHOT_%')
          .not('cuenta', 'like', 'CONFIG_%')
          .not('cuenta', 'like', '__%')
          .order('id', { ascending: false })
          .limit(3000)
        data = fallbackData || []
      }

      if (error) throw error

      // 2. Filtrar abonados reales, vincular a la fecha solicitada y ordenar cronológicamente ascendente (00:00:00 -> 23:59:59)
      const eventosProcesados = (data || [])
        .filter(e => isRealAccount(e.cuenta, e.evento))
        .map(e => {
          const parsed = getChileLocalDateAndFormattedTime(e.fecha_hora)
          return {
            ...e,
            _dateChileIso: parsed.dateChileIso,
            _horaFormatted: parsed.horaFormatted,
            _timestamp: parsed.timestamp
          }
        })
        .filter(e => e._dateChileIso === fecha)
        .sort((a, b) => a._timestamp - b._timestamp)

      setEventos(eventosProcesados)
      if (eventosProcesados.length > 0) {
        setMensaje(`¡${eventosProcesados.length} eventos de abonados cargados para el ${fecha}!`)
      } else {
        setMensaje(`No hay eventos de abonados registrados para el ${fecha}.`)
      }
    } catch (err: any) {
      setMensaje('❌ Error de consulta: ' + err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-full max-w-3xl md:max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-black select-none">
        
        {/* Title bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-xs tracking-wide">Scorpion - Eventos Ingresados por Día</div>
          <button 
            onClick={onClose} 
            className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] cursor-pointer"
          >
            X
          </button>
        </div>

        {/* Interior Container */}
        <div className="p-2 flex-1 flex flex-col overflow-hidden bg-[#c0c0c0]">
          
          {/* Main Title Header */}
          <div className="text-center my-1">
            <h1 className="text-lg md:text-xl font-black text-[#000080] tracking-wider uppercase">
              EVENTOS RECIBIDOS {fecha}
            </h1>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white min-h-[150px] h-[220px] md:h-[300px]">
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
                  <th className="p-1 border-r border-b border-gray-400 w-44 font-mono text-center">TRAMA</th>
                  <th className="p-1 border-r border-b border-gray-400">OBSERVACION</th>
                  <th className="p-1 border-b border-gray-400 w-12 text-center">COM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {eventos.map((e, index) => {
                  const customStyle = getRowStyle(e.evento)
                  const rowBg = customStyle ? customStyle.bg : (index % 2 === 0 ? '#ffffff' : '#f5f5f5')
                  const rowFg = customStyle ? customStyle.text : '#000000'
                  
                  // Formatear parámetros
                  const par = (e.zona && e.zona !== 'None' ? '01' : '---')
                  const zn = (e.zona && e.zona !== 'None' ? e.zona.padStart(2, '0') : '---')
                  const usr = (e.usuario && e.usuario !== 'None' ? e.usuario.padStart(3, '0') : '---')
                  const horaDisplay = (e as any)._horaFormatted || getChileLocalDateAndFormattedTime(e.fecha_hora).horaFormatted
                  
                  return (
                    <tr 
                      key={e.id} 
                      className="hover:opacity-90 border-b border-gray-300"
                      style={{ backgroundColor: rowBg, color: rowFg }}
                    >
                      <td className="p-1 border-r border-gray-300 text-center font-mono">{horaDisplay}</td>
                      <td className="p-1 border-r border-gray-300 text-center font-mono">{e.cuenta}</td>
                      <td className="p-1 border-r border-gray-300 max-w-[200px] truncate uppercase">{e.nombre_abonado || '******** RECEPTOR ********'}</td>
                      <td className="p-1 border-r border-gray-300 uppercase">{e.evento}</td>
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
                    <td colSpan={10} className="p-8 text-center text-gray-500 italic bg-gray-50">
                      No hay eventos cargados. Seleccione una fecha y presione VER.
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
                onClick={cargarEventos}
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
          <div className="mt-1 bg-[#d4d0c8] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-0.5 text-[10px] text-gray-600 font-bold tracking-wide shrink-0">
            {mensaje} {eventos.length > 0 && `(${eventos.length} registros)`}
          </div>

        </div>
      </div>
    </div>
  )
}

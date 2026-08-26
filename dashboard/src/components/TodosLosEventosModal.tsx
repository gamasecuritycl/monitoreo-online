import React, { useState, useEffect } from 'react'
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

function isSystemAccount(cuentaRaw?: string): boolean {
  if (!cuentaRaw) return true
  const c = cuentaRaw.toUpperCase().trim()
  if (SYSTEM_ACCOUNTS.has(c)) return true
  if (c.length > 7 || c.startsWith('__')) return true
  return false
}

interface ParsedFechaHora {
  dateIsoStr: string
  horaStr: string
  timestamp: number
}

function parseFechaHora(rawStr?: string): ParsedFechaHora {
  if (!rawStr) return { dateIsoStr: '', horaStr: '00:00:00', timestamp: 0 }
  const s = rawStr.trim()

  // 1. Formato "DD-MM-YYYY HH:mm:ss" (ej: "25-08-2026 20:38:06" o "25/08/2026 20:38:06")
  const matchDDMM = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/)
  if (matchDDMM) {
    const [, dia, mes, anio, hh = '00', mm = '00', ss = '00'] = matchDDMM
    const dateIsoStr = `${anio}-${mes}-${dia}`
    const horaStr = `${hh}:${mm}:${ss}`
    const dObj = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hh), Number(mm), Number(ss))
    return { dateIsoStr, horaStr, timestamp: dObj.getTime() }
  }

  // 2. Formato "YYYY-MM-DD HH:mm:ss" o "2026-08-25T20:38:06"
  const matchYYYYMM = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[T\s]+(\d{2}):(\d{2}):(\d{2}))?/)
  if (matchYYYYMM) {
    const [, anio, mes, dia, hh = '00', mm = '00', ss = '00'] = matchYYYYMM
    const dateIsoStr = `${anio}-${mes}-${dia}`
    const horaStr = `${hh}:${mm}:${ss}`
    const dObj = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hh), Number(mm), Number(ss))
    return { dateIsoStr, horaStr, timestamp: dObj.getTime() }
  }

  // 3. Fallback con objeto Date nativo
  try {
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const anio = d.getFullYear()
      const mes = (d.getMonth() + 1).toString().padStart(2, '0')
      const dia = d.getDate().toString().padStart(2, '0')
      const hh = d.getHours().toString().padStart(2, '0')
      const mm = d.getMinutes().toString().padStart(2, '0')
      const ss = d.getSeconds().toString().padStart(2, '0')
      return {
        dateIsoStr: `${anio}-${mes}-${dia}`,
        horaStr: `${hh}:${mm}:${ss}`,
        timestamp: d.getTime()
      }
    }
  } catch {}

  return { dateIsoStr: s.slice(0, 10), horaStr: '00:00:00', timestamp: 0 }
}

function formatHora(isoString: string): string {
  return parseFechaHora(isoString).horaStr
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
      const [anio, mes, dia] = fecha.split('-')
      const dateIso = `${anio}-${mes}-${dia}`     // "2026-08-25"
      const dateChile = `${dia}-${mes}-${anio}`   // "25-08-2026"

      // 1. Intentar consulta por patrones de fecha en Supabase
      const { data, error } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .or(`fecha_hora.ilike.%${dateIso}%,fecha_hora.ilike.%${dateChile}%`)
        .order('id', { ascending: false })
        .limit(2000)

      if (error) throw error

      let rawRecords = data || []

      // 2. Si no retornó datos por patrón de fecha, usar fallback trayendo las 2000 filas más recientes
      if (rawRecords.length === 0) {
        const { data: fallbackData } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .order('id', { ascending: false })
          .limit(2000)
        rawRecords = fallbackData || []
      }

      // 3. Parsear, filtrar cuentas de sistema y asociar eventos pertenecientes a la fecha elegida
      const eventosProcesados = rawRecords
        .filter(e => !isSystemAccount(e.cuenta))
        .map(e => {
          const parsed = parseFechaHora(e.fecha_hora)
          return {
            ...e,
            _dateIsoStr: parsed.dateIsoStr,
            _horaFormatted: parsed.horaStr,
            _timestamp: parsed.timestamp
          }
        })
        .filter(e => e._dateIsoStr === fecha)
        .sort((a, b) => a._timestamp - b._timestamp) // ORDEN ASCENDENTE POR HORARIO (00:00:00 -> 23:59:59)

      setEventos(eventosProcesados)
      if (eventosProcesados.length > 0) {
        setMensaje(`¡${eventosProcesados.length} eventos encontrados para el ${fecha}!`)
      } else {
        setMensaje(`No hay eventos registrados para el ${fecha}.`)
      }
    } catch (err: any) {
      setMensaje('❌ Error de consulta: ' + err.message)
    } finally {
      setCargando(false)
    }
  }

  // NO cargar automáticamente - esperar a que el usuario presione VER
  // useEffect(() => { cargarEventos() }, [])

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
                  
                  return (
                    <tr 
                      key={e.id} 
                      className="hover:opacity-90 border-b border-gray-300"
                      style={{ backgroundColor: rowBg, color: rowFg }}
                    >
                      <td className="p-1 border-r border-gray-300 text-center font-mono">{(e as any)._horaFormatted || formatHora(e.fecha_hora)}</td>
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

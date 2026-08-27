'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { esAbonadoInactivo } from '@/lib/inactivos_filter'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesGeneralFallback = clientesDataRaw as Record<string, Record<string, string>>

export interface DiaHorario {
  dia: string
  label: string
  habilitado: boolean
  apertura: string
  cierre: string
  toleranciaMin: number
}

export interface ConfigHorarioAbonado {
  cuenta: string
  nombre: string
  dias: DiaHorario[]
  notificarNoCierre: boolean
  telefonoWhatsApp?: string
  alertaAperturaInhabitual: boolean
  actualizadoEl?: string
}

export const DIAS_SEMANA_DEFAULT: DiaHorario[] = [
  { dia: 'lunes', label: 'Lunes', habilitado: true, apertura: '08:30', cierre: '19:00', toleranciaMin: 30 },
  { dia: 'martes', label: 'Martes', habilitado: true, apertura: '08:30', cierre: '19:00', toleranciaMin: 30 },
  { dia: 'miercoles', label: 'Miércoles', habilitado: true, apertura: '08:30', cierre: '19:00', toleranciaMin: 30 },
  { dia: 'jueves', label: 'Jueves', habilitado: true, apertura: '08:30', cierre: '19:00', toleranciaMin: 30 },
  { dia: 'viernes', label: 'Viernes', habilitado: true, apertura: '08:30', cierre: '19:00', toleranciaMin: 30 },
  { dia: 'sabado', label: 'Sábado', habilitado: true, apertura: '09:00', cierre: '14:00', toleranciaMin: 30 },
  { dia: 'domingo', label: 'Domingo', habilitado: false, apertura: '00:00', cierre: '00:00', toleranciaMin: 0 },
  { dia: 'festivos', label: 'Festivos', habilitado: false, apertura: '00:00', cierre: '00:00', toleranciaMin: 0 }
]

interface HorariosModalProps {
  onClose: () => void
  cuentaInicial?: string
  clientesMap?: Record<string, Record<string, string>>
}

export default function HorariosModal({
  onClose,
  cuentaInicial,
  clientesMap = clientesGeneralFallback
}: HorariosModalProps) {
  const [cuentaActiva, setCuentaActiva] = useState<string>(
    (cuentaInicial || 'C745').toUpperCase().trim()
  )
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  // Estado del horario actual
  const [dias, setDias] = useState<DiaHorario[]>(DIAS_SEMANA_DEFAULT)
  const [notificarNoCierre, setNotificarNoCierre] = useState(true)
  const [telefonoWhatsApp, setTelefonoWhatsApp] = useState('')
  const [alertaAperturaInhabitual, setAlertaAperturaInhabitual] = useState(true)

  // Lista de abonados para el selector izquierdo
  const listaAbonados = useMemo(() => {
    return Object.values(clientesMap)
      .filter(c => !esAbonadoInactivo(c.cuenta || '', c.nombre || ''))
      .map(c => ({
        cuenta: (c.cuenta || '').toUpperCase().trim(),
        nombre: (c.nombre || '').toUpperCase().trim(),
        ciudad: c.ciudad || c.sector || 'SANTIAGO'
      }))
      .sort((a, b) => a.cuenta.localeCompare(b.cuenta))
  }, [clientesMap])

  const listaFiltrada = useMemo(() => {
    if (!busqueda.trim()) return listaAbonados
    const q = busqueda.toLowerCase().trim()
    return listaAbonados.filter(a => a.cuenta.toLowerCase().includes(q) || a.nombre.toLowerCase().includes(q))
  }, [listaAbonados, busqueda])

  const clienteActual = clientesMap[cuentaActiva] || clientesGeneralFallback[cuentaActiva] || {
    cuenta: cuentaActiva,
    nombre: 'ABONADO'
  }

  // Cargar configuración de horarios para la cuenta activa desde Supabase
  useEffect(() => {
    if (!cuentaActiva) return
    let cancel = false

    const fetchHorarios = async () => {
      setCargando(true)
      setStatusMsg('')
      try {
        // 1. Revisar localStorage local
        const local = localStorage.getItem(`gama_horarios_${cuentaActiva}`)
        if (local) {
          try {
            const parsed = JSON.parse(local)
            if (parsed.dias && Array.isArray(parsed.dias)) {
              if (!cancel) {
                setDias(parsed.dias)
                setNotificarNoCierre(Boolean(parsed.notificarNoCierre))
                setTelefonoWhatsApp(parsed.telefonoWhatsApp || '')
                setAlertaAperturaInhabitual(Boolean(parsed.alertaAperturaInhabitual))
                setCargando(false)
                return
              }
            }
          } catch {}
        }

        // 2. Revisar Supabase
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', `HORARIOS_${cuentaActiva}`)
          .order('id', { ascending: false })
          .limit(1)

        if (data && data.length > 0 && data[0].nombre_abonado) {
          try {
            const parsed: ConfigHorarioAbonado = JSON.parse(data[0].nombre_abonado)
            if (parsed.dias && Array.isArray(parsed.dias)) {
              if (!cancel) {
                setDias(parsed.dias)
                setNotificarNoCierre(Boolean(parsed.notificarNoCierre))
                setTelefonoWhatsApp(parsed.telefonoWhatsApp || '')
                setAlertaAperturaInhabitual(Boolean(parsed.alertaAperturaInhabitual))
                localStorage.setItem(`gama_horarios_${cuentaActiva}`, JSON.stringify(parsed))
                return
              }
            }
          } catch {}
        }

        // 3. Fallback: Teléfono del cliente si existe
        if (!cancel) {
          const telClient = clienteActual.telefono1 || clienteActual.t1 || ''
          setDias(DIAS_SEMANA_DEFAULT)
          setNotificarNoCierre(true)
          setTelefonoWhatsApp(telClient.replace(/[^0-9+]/g, ''))
          setAlertaAperturaInhabitual(true)
        }
      } catch (err: any) {
        console.warn('Error cargando horarios:', err)
      } finally {
        if (!cancel) setCargando(false)
      }
    }

    fetchHorarios()
    return () => { cancel = true }
  }, [cuentaActiva])

  // Aplicar Plantillas Rápidas
  const aplicarPlantilla = (tipo: 'comercio' | 'retail' | 'industrial' | '24_7') => {
    if (tipo === 'comercio') {
      setDias([
        { dia: 'lunes', label: 'Lunes', habilitado: true, apertura: '08:30', cierre: '19:00', toleranciaMin: 30 },
        { dia: 'martes', label: 'Martes', habilitado: true, apertura: '08:30', cierre: '19:00', toleranciaMin: 30 },
        { dia: 'miercoles', label: 'Miércoles', habilitado: true, apertura: '08:30', cierre: '19:00', toleranciaMin: 30 },
        { dia: 'jueves', label: 'Jueves', habilitado: true, apertura: '08:30', cierre: '19:00', toleranciaMin: 30 },
        { dia: 'viernes', label: 'Viernes', habilitado: true, apertura: '08:30', cierre: '19:00', toleranciaMin: 30 },
        { dia: 'sabado', label: 'Sábado', habilitado: true, apertura: '09:00', cierre: '14:00', toleranciaMin: 30 },
        { dia: 'domingo', label: 'Domingo', habilitado: false, apertura: '00:00', cierre: '00:00', toleranciaMin: 0 },
        { dia: 'festivos', label: 'Festivos', habilitado: false, apertura: '00:00', cierre: '00:00', toleranciaMin: 0 }
      ])
      setStatusMsg('✨ Plantilla Comercio / Oficina aplicada')
    } else if (tipo === 'retail') {
      setDias([
        { dia: 'lunes', label: 'Lunes', habilitado: true, apertura: '10:00', cierre: '21:00', toleranciaMin: 30 },
        { dia: 'martes', label: 'Martes', habilitado: true, apertura: '10:00', cierre: '21:00', toleranciaMin: 30 },
        { dia: 'miercoles', label: 'Miércoles', habilitado: true, apertura: '10:00', cierre: '21:00', toleranciaMin: 30 },
        { dia: 'jueves', label: 'Jueves', habilitado: true, apertura: '10:00', cierre: '21:00', toleranciaMin: 30 },
        { dia: 'viernes', label: 'Viernes', habilitado: true, apertura: '10:00', cierre: '21:30', toleranciaMin: 30 },
        { dia: 'sabado', label: 'Sábado', habilitado: true, apertura: '10:00', cierre: '21:30', toleranciaMin: 30 },
        { dia: 'domingo', label: 'Domingo', habilitado: true, apertura: '11:00', cierre: '20:00', toleranciaMin: 30 },
        { dia: 'festivos', label: 'Festivos', habilitado: true, apertura: '11:00', cierre: '20:00', toleranciaMin: 30 }
      ])
      setStatusMsg('✨ Plantilla Retail / Mall aplicada')
    } else if (tipo === 'industrial') {
      setDias([
        { dia: 'lunes', label: 'Lunes', habilitado: true, apertura: '07:30', cierre: '20:00', toleranciaMin: 45 },
        { dia: 'martes', label: 'Martes', habilitado: true, apertura: '07:30', cierre: '20:00', toleranciaMin: 45 },
        { dia: 'miercoles', label: 'Miércoles', habilitado: true, apertura: '07:30', cierre: '20:00', toleranciaMin: 45 },
        { dia: 'jueves', label: 'Jueves', habilitado: true, apertura: '07:30', cierre: '20:00', toleranciaMin: 45 },
        { dia: 'viernes', label: 'Viernes', habilitado: true, apertura: '07:30', cierre: '20:00', toleranciaMin: 45 },
        { dia: 'sabado', label: 'Sábado', habilitado: true, apertura: '08:00', cierre: '13:00', toleranciaMin: 30 },
        { dia: 'domingo', label: 'Domingo', habilitado: false, apertura: '00:00', cierre: '00:00', toleranciaMin: 0 },
        { dia: 'festivos', label: 'Festivos', habilitado: false, apertura: '00:00', cierre: '00:00', toleranciaMin: 0 }
      ])
      setStatusMsg('✨ Plantilla Industrial / Bodega aplicada')
    } else if (tipo === '24_7') {
      setDias(DIAS_SEMANA_DEFAULT.map(d => ({
        ...d,
        habilitado: true,
        apertura: '00:00',
        cierre: '23:59',
        toleranciaMin: 0
      })))
      setStatusMsg('✨ Plantilla Continuo 24/7 aplicada')
    }
  }

  // Guardar en Supabase
  const guardarHorarios = async () => {
    setGuardando(true)
    setStatusMsg('💾 Guardando horarios en base de datos...')
    try {
      const payload: ConfigHorarioAbonado = {
        cuenta: cuentaActiva,
        nombre: clienteActual.nombre || 'ABONADO',
        dias,
        notificarNoCierre,
        telefonoWhatsApp: telefonoWhatsApp.trim(),
        alertaAperturaInhabitual,
        actualizadoEl: new Date().toISOString()
      }

      // 1. Guardar en localStorage
      localStorage.setItem(`gama_horarios_${cuentaActiva}`, JSON.stringify(payload))

      // 2. Guardar en Supabase
      const { error } = await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: `HORARIOS_${cuentaActiva}`,
          nombre_abonado: JSON.stringify(payload),
          evento: 'CONFIG_HORARIOS_ABONADO',
          fecha_hora: new Date().toISOString()
        })

      if (error) throw error

      setStatusMsg('✅ ¡Horarios guardados exitosamente!')
      setTimeout(() => setStatusMsg(''), 4000)
    } catch (err: any) {
      console.error('Error guardando horarios:', err)
      setStatusMsg('❌ Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  // Cambiar campos de un día
  const updateDia = (index: number, campo: keyof DiaHorario, valor: any) => {
    setDias(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [campo]: valor }
      return next
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 font-mono p-2 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Ventana Retro Pixel-Perfect Amplia */}
      <div
        className="w-[98vw] max-w-[1600px] h-[94vh] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1.5 shadow-[4px_4px_16px_rgba(0,0,0,0.8)] focus:outline-none flex flex-col justify-between select-none"
        style={{ fontSize: '13px' }}
      >
        {/* Barra de Título */}
        <div className="bg-[#000080] text-white font-bold px-3 py-1 flex justify-between items-center select-none shrink-0 h-7">
          <div className="flex items-center gap-2">
            <span className="text-sm">⏰</span>
            <span className="text-xs font-bold tracking-wide">Scorpion - Control de Horarios de Apertura y Cierre</span>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-5 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-xs pb-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* CONTENEDOR PRINCIPAL: Selector de Abonados a la izquierda, Editor de Horarios al centro */}
        <div className="flex-1 p-1 flex flex-col md:flex-row gap-2 overflow-hidden min-h-0">
          
          {/* LADO IZQUIERDO: Directorio de Abonados (340px) */}
          <div className="w-full md:w-[340px] bg-[#d4d0c8] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-2 flex flex-col gap-2 shrink-0 overflow-hidden">
            <div className="bg-[#808080] text-white font-bold px-2 py-1 text-xs uppercase border border-t-black border-l-black border-b-white border-r-white flex justify-between items-center">
              <span>DIRECTORIO ABONADOS</span>
              <span className="text-xs font-mono opacity-90">{listaAbonados.length} Total</span>
            </div>

            {/* Input de Búsqueda */}
            <input
              type="text"
              placeholder="Buscar cuenta o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-1.5 text-xs font-bold text-blue-900 focus:outline-none placeholder-gray-500"
            />

            {/* Lista de Abonados scrolleable */}
            <div className="flex-1 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto">
              <table className="w-full border-collapse text-xs text-left">
                <thead className="bg-[#b0b0b0] border-b border-gray-400 sticky top-0 font-bold z-10 text-xs">
                  <tr>
                    <th className="p-1.5 border-r border-gray-400 w-16 text-center">CTA</th>
                    <th className="p-1.5">NOMBRE ABONADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 font-bold">
                  {listaFiltrada.map(a => (
                    <tr
                      key={a.cuenta}
                      onClick={() => setCuentaActiva(a.cuenta)}
                      className={`cursor-pointer transition-colors ${
                        cuentaActiva === a.cuenta
                          ? 'bg-[#000080] text-white'
                          : 'hover:bg-blue-100 text-gray-800'
                      }`}
                    >
                      <td className="p-1.5 border-r border-gray-300 font-mono text-center text-xs">
                        {a.cuenta}
                      </td>
                      <td className="p-1.5 truncate max-w-[210px] text-xs" title={a.nombre}>
                        {a.nombre}
                      </td>
                    </tr>
                  ))}
                  {listaFiltrada.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-gray-400 italic text-xs">No se encontraron abonados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LADO DERECHO: Editor de Horarios y Configuración del Guardián (flex-1) */}
          <div className="flex-1 bg-[#d4d0c8] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-2.5 flex flex-col gap-2.5 overflow-y-auto min-h-0">
            
            {/* Header del Abonado Seleccionado */}
            <div className="bg-[#e6f0fa] border border-blue-400 p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 rounded-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#000080] text-white font-mono font-black px-2.5 py-0.5 text-sm rounded-xs">
                    {cuentaActiva}
                  </span>
                  <span className="font-black text-base text-blue-950 truncate">
                    {clienteActual.nombre || 'ABONADO SELECCIONADO'}
                  </span>
                </div>
                <div className="text-xs text-gray-700 mt-1 font-medium">
                  📍 {clienteActual.direccion || 'Dirección no disponible'} — {clienteActual.ciudad || clienteActual.sector || 'Santiago'}
                </div>
              </div>

              {/* Botones de Plantillas Rápidas */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-bold text-gray-700 uppercase">Plantillas:</span>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('comercio')}
                  className="bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black px-2 py-1 text-xs font-bold hover:bg-[#e8e8e8] cursor-pointer"
                >
                  🏢 Comercio L-V
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('retail')}
                  className="bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black px-2 py-1 text-xs font-bold hover:bg-[#e8e8e8] cursor-pointer"
                >
                  🛍️ Retail L-D
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('industrial')}
                  className="bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black px-2 py-1 text-xs font-bold hover:bg-[#e8e8e8] cursor-pointer"
                >
                  🏭 Industrial
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('24_7')}
                  className="bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black px-2 py-1 text-xs font-bold hover:bg-[#e8e8e8] cursor-pointer"
                >
                  🕒 24/7
                </button>
              </div>
            </div>

            {/* TABLA PRINCIPAL DE DÍAS Y HORAS */}
            <div className="flex-1 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto">
              <table className="w-full border-collapse text-xs md:text-sm text-left">
                <thead className="bg-[#b0b0b0] border-b border-gray-400 font-black sticky top-0 text-xs">
                  <tr>
                    <th className="p-2 border-r border-gray-400 w-32">DÍA</th>
                    <th className="p-2 border-r border-gray-400 w-32 text-center">ESTADO</th>
                    <th className="p-2 border-r border-gray-400 w-40 text-center">HORA APERTURA</th>
                    <th className="p-2 border-r border-gray-400 w-40 text-center">HORA CIERRE</th>
                    <th className="p-2 border-r border-gray-400 w-36 text-center">TOLERANCIA</th>
                    <th className="p-2">RESUMEN OPERATIVO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 font-bold">
                  {dias.map((d, idx) => (
                    <tr key={d.dia} className={`hover:bg-blue-50 ${!d.habilitado ? 'bg-gray-100 text-gray-500' : 'text-gray-900'}`}>
                      {/* Día */}
                      <td className="p-2 border-r border-gray-300 font-black flex items-center gap-2 text-xs md:text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.habilitado ? 'bg-green-600' : 'bg-gray-400'}`} />
                        <span>{d.label}</span>
                      </td>

                      {/* Estado: Abierto / Cerrado */}
                      <td className="p-2 border-r border-gray-300 text-center">
                        <button
                          type="button"
                          onClick={() => updateDia(idx, 'habilitado', !d.habilitado)}
                          className={`px-3 py-1 text-xs font-black rounded-xs cursor-pointer ${
                            d.habilitado
                              ? 'bg-green-700 text-white'
                              : 'bg-gray-400 text-black'
                          }`}
                        >
                          {d.habilitado ? 'ABIERTO' : 'CERRADO'}
                        </button>
                      </td>

                      {/* Hora Apertura */}
                      <td className="p-2 border-r border-gray-300 text-center">
                        <input
                          type="time"
                          disabled={!d.habilitado}
                          value={d.apertura}
                          onChange={(e) => updateDia(idx, 'apertura', e.target.value)}
                          className={`px-2 py-1 border border-gray-400 font-mono text-center text-sm font-black ${
                            d.habilitado ? 'bg-[#ffffd0] text-blue-900' : 'bg-gray-200 text-gray-400'
                          }`}
                        />
                      </td>

                      {/* Hora Cierre */}
                      <td className="p-2 border-r border-gray-300 text-center">
                        <input
                          type="time"
                          disabled={!d.habilitado}
                          value={d.cierre}
                          onChange={(e) => updateDia(idx, 'cierre', e.target.value)}
                          className={`px-2 py-1 border border-gray-400 font-mono text-center text-sm font-black ${
                            d.habilitado ? 'bg-[#ffffd0] text-blue-900' : 'bg-gray-200 text-gray-400'
                          }`}
                        />
                      </td>

                      {/* Tolerancia */}
                      <td className="p-2 border-r border-gray-300 text-center">
                        <select
                          disabled={!d.habilitado}
                          value={d.toleranciaMin}
                          onChange={(e) => updateDia(idx, 'toleranciaMin', Number(e.target.value))}
                          className={`px-2 py-1 border border-gray-400 font-bold text-xs ${
                            d.habilitado ? 'bg-[#ffffd0] text-black' : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <option value={0}>0 min (Exacto)</option>
                          <option value={15}>± 15 min</option>
                          <option value={30}>± 30 min</option>
                          <option value={45}>± 45 min</option>
                          <option value={60}>± 60 min</option>
                        </select>
                      </td>

                      {/* Resumen */}
                      <td className="p-2 text-xs text-gray-700">
                        {d.habilitado ? (
                          <span>
                            Apertura <strong className="text-blue-900 font-mono">{d.apertura}</strong> | Cierre límite <strong className="text-blue-900 font-mono">{d.cierre}</strong> (Tol. {d.toleranciaMin}m)
                          </span>
                        ) : (
                          <span className="italic text-gray-400">Local cerrado todo el día (Cualquier desarme alerta al operador)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECCIÓN CONFIGURACIÓN GUARDIÁN DE NO-CIERRE Y WHATSAPP */}
            <div className="bg-[#e8e4dc] border border-gray-400 p-2.5 space-y-2 rounded-xs text-xs">
              <div className="font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                <span>🛡️</span> CONFIGURACIÓN DEL MOTOR GUARDIÁN Y NOTIFICACIONES
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertaAperturaInhabitual}
                    onChange={(e) => setAlertaAperturaInhabitual(e.target.checked)}
                    className="cursor-pointer w-4 h-4"
                  />
                  <span className="font-bold text-gray-800 text-xs">
                    🚨 Alertar Desarmes / Aperturas fuera de horario (Madrugadas y Domingos)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificarNoCierre}
                    onChange={(e) => setNotificarNoCierre(e.target.checked)}
                    className="cursor-pointer w-4 h-4"
                  />
                  <span className="font-bold text-gray-800 text-xs">
                    ⏰ Alertar No-Cierre si el local sigue abierto tras hora límite
                  </span>
                </label>
              </div>

              {notificarNoCierre && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-gray-300">
                  <span className="font-bold text-emerald-950 text-xs w-48">WhatsApp de Aviso No Cierre:</span>
                  <input
                    type="text"
                    placeholder="Ej: 56912345678"
                    value={telefonoWhatsApp}
                    onChange={(e) => setTelefonoWhatsApp(e.target.value)}
                    className="flex-1 bg-white border border-gray-400 px-2.5 py-1 font-mono text-xs font-bold text-black"
                  />
                  <span className="text-gray-600 text-[11px]">
                    (El bot notificará al dueño si a la hora de cierre el sistema aún no está armado)
                  </span>
                </div>
              )}
            </div>

            {/* FEEDBACK STATUS */}
            {statusMsg && (
              <div className="text-center font-bold text-xs text-blue-900 py-1 animate-pulse">
                {statusMsg}
              </div>
            )}

            {/* BOTONES DE ACCIÓN INFERIOR */}
            <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-400">
              <div className="text-xs text-gray-700">
                Abonado activo: <strong className="font-mono text-blue-900 text-sm">[{cuentaActiva}]</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black px-5 py-1.5 text-xs font-bold text-black hover:bg-[#e8e8e8] cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={guardarHorarios}
                  disabled={guardando}
                  className="bg-[#000080] border border-t-white border-l-white border-b-black border-r-black px-6 py-1.5 text-xs font-black text-white hover:bg-blue-900 active:border-t-black active:border-l-black active:border-b-white active:border-r-white cursor-pointer shadow-md disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : '💾 Guardar Horarios de Cuenta'}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import clientesDataRaw from '@/lib/clientes_general.json'
import { esAbonadoInactivo } from '@/lib/inactivos_filter'

const clientesGeneralFallback = clientesDataRaw as Record<string, Record<string, string>>

interface EventoMonitoreo {
  id: number
  fecha_hora: string
  cuenta: string
  nombre_abonado: string
  evento: string
  zona: string
  usuario: string
}

interface TestStatus {
  cuenta: string
  nombre: string
  horaEsperada: string // "HH:MM"
  ultimoTest: string // "YYYY-MM-DD HH:MM" o "Sin Registro"
  desfaseMinutos: number | null // diferencia en minutos
  estado: 'OK' | 'Desfasado' | 'Incomunicado'
}

interface Props {
  onClose: () => void
  clientesMap?: Record<string, Record<string, string>>
}

export default function ControlTestModal({ onClose, clientesMap = {} }: Props) {
  const [loading, setLoading] = useState(false)
  const [configTest, setConfigTest] = useState<Record<string, string>>({})
  const [estados, setEstados] = useState<TestStatus[]>([])
  
  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'OK' | 'Desfasado' | 'Incomunicado'>('Todos')

  // Edición rápida de horario esperado
  const [editandoCuenta, setEditandoCuenta] = useState<string | null>(null)
  const [inputHora, setInputHora] = useState('03:00')

  // Cargar configuraciones de test y eventos históricos de Supabase
  const calcularEstadosTest = async () => {
    setLoading(true)
    try {
      // 1. Cargar horas esperadas de test ('CONFIG_TEST_ALARMAS')
      let horasMap: Record<string, string> = {}
      const { data: configData } = await supabase
        .from('eventos_monitoreo')
        .select('nombre_abonado')
        .eq('cuenta', 'CONFIG_TEST_ALARMAS')
        .limit(1)

      if (configData && configData.length > 0) {
        horasMap = JSON.parse(configData[0].nombre_abonado || '{}')
        setConfigTest(horasMap)
      }

      // 2. Cargar últimos 500 eventos de tipo test
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .or('evento.ilike.%E602%,evento.ilike.%602%,evento.ilike.%test%,evento.ilike.%autotest%')
        .order('fecha_hora', { ascending: false })
        .limit(500)

      if (eventosError) throw eventosError

      const testEvents = (eventosData || []) as EventoMonitoreo[]

      // 3. Procesar para cada cliente activo
      const targetMap = Object.keys(clientesMap).length > 0 ? clientesMap : clientesGeneralFallback
      const listaEstados = Object.entries(targetMap)
        .filter(([cuenta, c]) => !esAbonadoInactivo(cuenta, (c as any)?.alias_unidad || (c as any)?.nombre || ''))
        .map(([cuenta, c]) => {
        // Filtrar todos los eventos de tipo test para este abonado
        const eventsForClient = testEvents.filter(e => e.cuenta?.toUpperCase().trim() === cuenta.toUpperCase().trim())
        
        if (eventsForClient.length === 0) {
          return null // Excluir si no hay test registrado en los últimos 500
        }

        const ultimoEvento = eventsForClient[0]
        const eventoAnterior = eventsForClient[1]

        let ultimoTest = 'Sin Registro'
        let horaEsperada = '03:00'
        let desfaseMinutos: number | null = null
        let estado: 'OK' | 'Desfasado' | 'Incomunicado' = 'Incomunicado'

        // Formatear fecha del último test
        const fechaTest = new Date(ultimoEvento.fecha_hora)
        const yyyy = fechaTest.getFullYear()
        const mm = String(fechaTest.getMonth() + 1).padStart(2, '0')
        const dd = String(fechaTest.getDate()).padStart(2, '0')
        const hh = String(fechaTest.getHours()).padStart(2, '0')
        const min = String(fechaTest.getMinutes()).padStart(2, '0')
        ultimoTest = `${yyyy}-${mm}-${dd} ${hh}:${min}`

        // Calcular diferencia de horas frente a la actual
        const ahora = new Date()
        const diferenciaHoras = (ahora.getTime() - fechaTest.getTime()) / (1000 * 60 * 60)

        if (diferenciaHoras > 240) {
          return null // Excluir si no ha reportado en los últimos 10 días
        }

        // Obtener la referencia horaria del test anterior (ayer)
        if (eventoAnterior) {
          const fechaAnt = new Date(eventoAnterior.fecha_hora)
          const hhAnt = String(fechaAnt.getHours()).padStart(2, '0')
          const minAnt = String(fechaAnt.getMinutes()).padStart(2, '0')
          horaEsperada = `${hhAnt}:${minAnt}` // Referencia del test del día anterior

          // Calcular desfase en minutos con respecto al test anterior
          const horaTestEnMinutos = fechaTest.getHours() * 60 + fechaTest.getMinutes()
          const horaEsperadaEnMinutos = fechaAnt.getHours() * 60 + fechaAnt.getMinutes()
          
          let diff = horaTestEnMinutos - horaEsperadaEnMinutos
          if (diff > 720) diff -= 1440
          if (diff < -720) diff += 1440
          desfaseMinutos = diff
        } else {
          // Si no hay test anterior, usar la configurada o fallback
          horaEsperada = horasMap[cuenta] || '03:00'
        }

        if (diferenciaHoras > 26) {
          estado = 'Incomunicado'
        } else {
          if (desfaseMinutos !== null && Math.abs(desfaseMinutos) > 60) {
            estado = 'Desfasado'
          } else {
            estado = 'OK'
          }
        }

        return {
          cuenta,
          nombre: c.nombre || 'Abonado Desconocido',
          horaEsperada: `${horaEsperada} ${eventoAnterior ? '(Ref. Ayer)' : '(Fijo)'}`,
          ultimoTest,
          desfaseMinutos,
          estado
        }
      })

      setEstados(listaEstados.filter(Boolean) as TestStatus[])
    } catch (err) {
      console.error('Error al calcular estados de test:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    calcularEstadosTest()
  }, [clientesMap])

  // Guardar nueva configuración de hora esperada
  const guardarHoraEsperada = async (cuenta: string, horaNueva: string) => {
    const updated = {
      ...configTest,
      [cuenta]: horaNueva
    }

    try {
      const { error } = await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'CONFIG_TEST_ALARMAS',
          nombre_abonado: JSON.stringify(updated),
          evento: 'CONFIGURACION',
          fecha_hora: new Date().toISOString()
        })
      if (!error) {
        setConfigTest(updated)
        setEditandoCuenta(null)
        // Recalcular
        calcularEstadosTest()
      } else {
        throw error
      }
    } catch (err: any) {
      alert('Error al guardar configuración: ' + err.message)
    }
  }

  // Notificar al área técnica por WhatsApp
  const notificarTecnico = (status: TestStatus) => {
    const text = `Gama Seguridad - Reporte de Test Diario
Cuenta: ${status.cuenta}
Abonado: ${status.nombre}
Estado: ${status.estado === 'Incomunicado' ? '❌ SIN COMUNICACIÓN (Incomunicado)' : '⚠️ DESFASADO HORARIO'}
Esperado a las: ${status.horaEsperada} hrs
Último reporte: ${status.ultimoTest}
${status.desfaseMinutos !== null ? `Desfase: ${Math.round(status.desfaseMinutos / 60 * 10) / 10} horas.` : ''}
Favor programar visita técnica o revisión de discador.`

    const url = `https://api.whatsapp.com/send?phone=56991016912&text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  // Filtrar
  const filtrados = estados.filter(e => {
    const matchesSearch = e.cuenta.toLowerCase().includes(busqueda.toLowerCase()) || 
                          e.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchesFiltro = filtroEstado === 'Todos' || e.estado === filtroEstado
    return matchesSearch && matchesFiltro
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono text-black">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Title Bar */}
        <div className="bg-[#8B0000] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-xs tracking-wide">Scorpion - Gestor de Control de Test Diario</div>
          <button 
            onClick={onClose} 
            className="bg-[#c0c0c0] text-black font-bold border border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] cursor-pointer text-xs"
          >
            X
          </button>
        </div>

        {/* Filters Row */}
        <div className="p-3 bg-[#d4d0c8] border-b border-gray-400 flex flex-wrap gap-3 items-center justify-between shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold">Abonado/Cuenta:</span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-0.5 text-xs focus:outline-none w-44"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold">Filtrar Estado:</span>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
                className="bg-white border border-gray-400 py-0.5 px-1 focus:outline-none"
              >
                <option value="Todos">Ver Todos</option>
                <option value="OK">🟢 Comunicando (OK)</option>
                <option value="Desfasado">🟡 Desfasados (Fuera de hora)</option>
                <option value="Incomunicado">🔴 Incomunicados (Sin Test)</option>
              </select>
            </div>
          </div>

          <button
            onClick={calcularEstadosTest}
            disabled={loading}
            className="bg-[#d0d0d0] hover:bg-white border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 py-1 font-bold text-[11px] cursor-pointer"
          >
            {loading ? '🔄 CARGANDO...' : '🔄 RECALCULAR TEST'}
          </button>
        </div>

        {/* Main Grid table */}
        <div className="flex-1 overflow-auto bg-white p-2">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#d4d0c8] text-black sticky top-0 border-b-2 border-gray-400 font-bold z-10">
                <th className="p-2 border-r border-gray-400 w-16 text-center">CUENTA</th>
                <th className="p-2 border-r border-gray-400">ABONADO</th>
                <th className="p-2 border-r border-gray-400 w-36 text-center">HORA PROGRAMADA</th>
                <th className="p-2 border-r border-gray-400 w-44 text-center">ÚLTIMO TEST RECIBIDO</th>
                <th className="p-2 border-r border-gray-400 w-24 text-center">DESFASE</th>
                <th className="p-2 border-r border-gray-400 w-32 text-center">ESTADO</th>
                <th className="p-2 text-center w-24">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtrados.map(status => {
                const isEditing = editandoCuenta === status.cuenta

                return (
                  <tr key={status.cuenta} className="hover:bg-slate-50">
                    {/* Cuenta */}
                    <td className="p-2 border-r border-gray-300 text-center font-bold font-mono">{status.cuenta}</td>
                    
                    {/* Abonado */}
                    <td className="p-2 border-r border-gray-300 font-bold uppercase truncate max-w-[180px]">{status.nombre}</td>
                    
                    {/* Hora Programada */}
                    <td className="p-1 border-r border-gray-300 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            value={inputHora}
                            onChange={(e) => setInputHora(e.target.value)}
                            placeholder="03:00"
                            className="bg-white border border-gray-600 w-16 py-0.5 text-center font-bold text-[11px]"
                          />
                          <button
                            onClick={() => guardarHoraEsperada(status.cuenta, inputHora)}
                            className="bg-green-700 text-white px-1 rounded-xs hover:bg-green-600 font-bold text-[10px] cursor-pointer"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-bold">{status.horaEsperada} hrs</span>
                          <button
                            onClick={() => {
                              setEditandoCuenta(status.cuenta)
                              setInputHora(status.horaEsperada)
                            }}
                            className="text-gray-500 hover:text-blue-800 text-[10px] font-bold"
                            title="Editar hora programada"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Último Test Recibido */}
                    <td className="p-2 border-r border-gray-300 text-center font-mono font-bold text-gray-700">{status.ultimoTest}</td>

                    {/* Desfase */}
                    <td className={`p-2 border-r border-gray-300 text-center font-bold font-mono ${
                      status.desfaseMinutos === null ? 'text-gray-400' :
                      Math.abs(status.desfaseMinutos) > 60 ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      {status.desfaseMinutos === null ? '--' : 
                       status.desfaseMinutos === 0 ? 'Sin desfase' :
                       status.desfaseMinutos > 0 ? `+${status.desfaseMinutos} min` : 
                       `${status.desfaseMinutos} min`}
                    </td>

                    {/* Estado */}
                    <td className="p-2 border-r border-gray-300 text-center">
                      <span className={`px-2 py-0.5 rounded-sm font-black text-[9px] border ${
                        status.estado === 'OK' ? 'bg-green-100 text-green-800 border-green-300' :
                        status.estado === 'Desfasado' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        {status.estado === 'OK' ? '🟢 COMUNICANDO' : 
                         status.estado === 'Desfasado' ? '🟡 DESFASADO' : '🔴 INCOMUNICADO'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="p-1 text-center">
                      {status.estado !== 'OK' ? (
                        <button
                          onClick={() => notificarTecnico(status)}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black border border-yellow-600 font-bold px-2 py-0.5 rounded-xs text-[9px] cursor-pointer"
                        >
                          💬 ALERTAR TECNICO
                        </button>
                      ) : (
                        <span className="text-gray-400 italic text-[9px]">Sin alertas</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 italic">No hay cuentas que coincidan con los filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="bg-[#d4d0c8] p-2 border-t border-gray-400 text-[10px] text-gray-600 flex justify-between shrink-0">
          <span>Total Abonados Controlados: {estados.length}</span>
          <span>Incomunicados: {estados.filter(e => e.estado === 'Incomunicado').length} | Desfasados: {estados.filter(e => e.estado === 'Desfasado').length}</span>
        </div>

      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface EntregaTurnoModalProps {
  onClose: () => void
  usuarioActual?: string
}

interface RegistroTurno {
  id?: string | number
  fecha_hora: string
  operador_saliente: string
  operador_entrante: string
  novedades: string
}

export default function EntregaTurnoModal({ onClose, usuarioActual = 'OPERADOR CENTRAL' }: EntregaTurnoModalProps) {
  const [saliente, setSaliente] = useState(usuarioActual)
  const [entrante, setEntrante] = useState('')
  const [novedades, setNovedades] = useState('')
  const [cargando, setCargando] = useState(false)
  const [historial, setHistorial] = useState<RegistroTurno[]>([])

  const cargarHistorial = async () => {
    try {
      const { data } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .eq('cuenta', 'CONFIG_ENTREGA_TURNO')
        .order('id', { ascending: false })
        .limit(20)

      if (data) {
        const parseados: RegistroTurno[] = data.map(item => {
          try {
            const obj = JSON.parse(item.nombre_abonado || '{}')
            return {
              id: item.id,
              fecha_hora: item.fecha_hora,
              operador_saliente: obj.saliente || '---',
              operador_entrante: obj.entrante || '---',
              novedades: obj.novedades || item.evento || ''
            }
          } catch {
            return {
              id: item.id,
              fecha_hora: item.fecha_hora,
              operador_saliente: '---',
              operador_entrante: '---',
              novedades: item.nombre_abonado || ''
            }
          }
        })
        setHistorial(parseados)
      }
    } catch (err) {
      console.warn('Error cargando historial de turnos:', err)
    }
  }

  useEffect(() => {
    cargarHistorial()
  }, [])

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novedades.trim()) {
      alert('Por favor ingrese las observaciones de entrega de turno.')
      return
    }

    setCargando(true)
    try {
      const payload = {
        saliente: saliente.trim() || 'OPERADOR',
        entrante: entrante.trim() || 'TURNO SIGUIENTE',
        novedades: novedades.trim()
      }

      await supabase.from('eventos_monitoreo').insert({
        cuenta: 'CONFIG_ENTREGA_TURNO',
        nombre_abonado: JSON.stringify(payload),
        evento: 'ENTREGA DE TURNO',
        fecha_hora: new Date().toISOString(),
        zona: '000',
        usuario: saliente
      })

      setNovedades('')
      setEntrante('')
      await cargarHistorial()
      alert('✅ Observación de entrega de turno guardada correctamente.')
    } catch (err) {
      console.error('Error guardando turno:', err)
      alert('Error al guardar la entrega de turno.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 rounded shadow-2xl w-full max-w-2xl text-gray-900 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header estilo Windows Scorpion */}
        <div className="bg-[#000080] text-white px-3 py-1.5 flex justify-between items-center font-bold text-sm select-none shrink-0">
          <div className="flex items-center gap-2">
            <span>📝</span>
            <span>GAMA SEGURIDAD — Entrega de Turno y Novedades Operativas</span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#c0c0c0] text-black font-mono font-bold px-2 py-0.5 border border-t-white border-l-white border-b-gray-800 border-r-gray-800 hover:bg-red-600 hover:text-white cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Formulario de registro */}
          <form onSubmit={handleGuardar} className="bg-white p-3 border border-gray-400 rounded shadow-sm space-y-3">
            <div className="font-bold text-blue-900 text-xs border-b pb-1 uppercase tracking-wider">
              ➕ Ingresar Nueva Observación de Entrega
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Operador Saliente:</label>
                <input
                  type="text"
                  value={saliente}
                  onChange={(e) => setSaliente(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-400 p-1 rounded font-bold text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Operador Entrante (Opcional):</label>
                <input
                  type="text"
                  value={entrante}
                  onChange={(e) => setEntrante(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-gray-50 border border-gray-400 p-1 rounded text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Novedades / Observaciones del Turno:</label>
              <textarea
                rows={3}
                value={novedades}
                onChange={(e) => setNovedades(e.target.value)}
                placeholder="Escriba aquí las novedades del turno, clientes pendientes, llamadas realizadas..."
                className="w-full bg-gray-50 border border-gray-400 p-2 rounded text-gray-800 font-sans"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={cargando}
                className="bg-[#000080] hover:bg-blue-900 text-white font-bold px-4 py-1.5 rounded border border-t-blue-400 border-l-blue-400 border-b-blue-950 border-r-blue-950 shadow cursor-pointer text-xs"
              >
                {cargando ? 'Guardando...' : '💾 Registrar Entrega de Turno'}
              </button>
            </div>
          </form>

          {/* Visor de Historial */}
          <div className="bg-white p-3 border border-gray-400 rounded shadow-sm">
            <div className="font-bold text-gray-800 text-xs border-b pb-1 mb-2 uppercase tracking-wider flex justify-between items-center">
              <span>📋 Historial de Entregas Recientes</span>
              <span className="text-[10px] text-gray-500 font-normal">Solo visualización en pantalla</span>
            </div>

            {historial.length === 0 ? (
              <div className="text-center py-4 text-gray-400 italic">No hay entregas de turno registradas aún.</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {historial.map((reg, idx) => (
                  <div key={reg.id || idx} className="bg-gray-50 border border-gray-300 p-2 rounded text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-gray-600 font-mono border-b pb-0.5">
                      <span className="font-bold text-blue-800">
                        🗓️ {new Date(reg.fecha_hora).toLocaleString('es-CL')}
                      </span>
                      <span>
                        Saliente: <strong className="text-gray-900">{reg.operador_saliente}</strong> | Entrante: <strong className="text-gray-900">{reg.operador_entrante}</strong>
                      </span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap font-sans text-[11px]">
                      {reg.novedades}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#d0d0d0] p-2 border-t border-gray-400 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-[#c0c0c0] hover:bg-[#d0d0d0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 px-4 py-1 font-bold text-gray-800 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
}

interface AlertaHistorial {
  id: number
  created_at: string
  mensaje_enviado: string
  tipo_evento: string
  estado: string
}

export default function NotificacionesLlamadasSMSModal({ onClose }: Props) {
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [historial, setHistorial] = useState<AlertaHistorial[]>([])
  const [probando, setProbando] = useState<string | null>(null)

  // 1. Cargar número guardado en Supabase (cuenta '__SYSTEM__')
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('notificaciones_whatsapp')
          .select('telefono')
          .eq('cuenta', '__SYSTEM__')
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 es "no rows found"
          throw error
        }

        if (data?.telefono) {
          setTelefono(data.telefono)
        } else {
          setTelefono('56991016912') // Fallback default
        }
      } catch (err: any) {
        console.error('Error al cargar config de llamadas/sms:', err.message)
      } finally {
        setCargando(false)
      }
    }

    const cargarHistorial = async () => {
      try {
        const { data, error } = await supabase
          .from('conversaciones_whatsapp')
          .select('id, created_at, mensaje_enviado, tipo_evento, estado')
          .eq('cuenta', '__SINCRONIZADOR__')
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (error) throw error
        if (data) setHistorial(data)
      } catch (err: any) {
        console.error('Error al cargar historial de alertas:', err.message)
      }
    }

    cargarConfig()
    cargarHistorial()
  }, [])

  // 2. Guardar número en Supabase
  const handleGuardar = async () => {
    const telLimpio = telefono.replace(/[^0-9]/g, '')
    if (!telLimpio) {
      setMensaje('❌ Ingrese un teléfono válido')
      return
    }

    setGuardando(true)
    setMensaje('')
    try {
      const { error } = await supabase
        .from('notificaciones_whatsapp')
        .upsert({
          cuenta: '__SYSTEM__',
          telefono: telLimpio,
          activo: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'cuenta' })

      if (error) throw error
      setMensaje('✅ Configuración guardada correctamente')
      setTimeout(() => setMensaje(''), 3000)
    } catch (err: any) {
      setMensaje('❌ Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  // 3. Disparar API de prueba (Llamada o SMS)
  const handleProbar = async (tipo: 'call' | 'sms') => {
    const telLimpio = telefono.replace(/[^0-9]/g, '')
    if (!telLimpio) {
      alert('Configure y guarde un teléfono primero')
      return
    }

    setProbando(tipo)
    try {
      const res = await fetch('/api/llamadas-sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: telLimpio, tipo })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(tipo === 'call' 
          ? '📞 Llamada de prueba enviada con éxito. Tu WhatsApp debería sonar.' 
          : '💬 SMS/Texto de prueba enviado con éxito.'
        )
      } else {
        if (data.debug && data.debug.includes('not authorized')) {
          alert('⚠️ NÚMERO NO AUTORIZADO:\n\nEl número +56991016912 no está autorizado en CallMeBot para recibir llamadas de voz.\n\nPara solucionarlo:\n1. Agrega el bot de llamadas a tus contactos en WhatsApp.\n2. Haz clic en el enlace de autorización para activarlo:\nhttps://api2.callmebot.com/txt/auth.php')
        } else {
          alert('❌ Detalle del error:\n\n' + (data.error || data.debug || 'Error desconocido'))
        }
      }
    } catch (err: any) {
      alert('❌ Error de red: ' + err.message)
    } finally {
      setProbando(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full max-w-lg flex flex-col shadow-2xl font-mono text-black select-text">
        {/* Header */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-xs tracking-wide">CONFIGURACIÓN DE LLAMADAS Y SMS (ALERTAS OFFLINE)</div>
          <button onClick={onClose} className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] cursor-pointer">X</button>
        </div>

        <div className="p-4 space-y-4">
          {cargando ? (
            <p className="text-xs italic text-gray-600">Cargando parámetros del sistema...</p>
          ) : (
            <>
              {/* Explicación */}
              <div className="bg-blue-900/10 border border-blue-900/30 p-2.5 text-[11px] text-blue-900 leading-normal">
                📍 Este número recibirá alertas automáticas mediante <strong>Llamadas de Voz</strong> y <strong>SMS</strong> en caso de que la central local Scorpion pierda conexión a internet por más de 5 minutos.
              </div>

              {/* Teléfono Input */}
              <div className="bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 p-3 flex flex-col gap-2">
                <span className="font-bold text-[11px] text-gray-700">MÓVIL DEL ADMINISTRADOR (FORMATO INTERNACIONAL):</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: +56991016912"
                    className="flex-1 bg-white border border-gray-400 font-bold px-2 py-1 text-xs text-black focus:outline-none"
                  />
                  <button
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="bg-[#d0d0d0] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 py-1 font-bold text-xs cursor-pointer active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                  >
                    {guardando ? 'GUARDANDO...' : 'GUARDAR'}
                  </button>
                </div>
                {mensaje && <p className="text-[10px] font-bold mt-1 text-center">{mensaje}</p>}
              </div>

              {/* Botones de Prueba */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleProbar('call')}
                  disabled={probando !== null}
                  className="bg-[#d0d0d0] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-2 font-bold text-xs cursor-pointer text-center text-blue-900 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                >
                  {probando === 'call' ? '📞 LLAMANDO...' : '📞 PROBAR LLAMADA'}
                </button>
                <button
                  onClick={() => handleProbar('sms')}
                  disabled={probando !== null}
                  className="bg-[#d0d0d0] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-2 font-bold text-xs cursor-pointer text-center text-yellow-900 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                >
                  {probando === 'sms' ? '💬 ENVIANDO...' : '💬 PROBAR SMS'}
                </button>
              </div>

              {/* Historial de Alertas */}
              <div className="bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex flex-col">
                <div className="bg-[#000080] text-white text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">
                  HISTORIAL DE ALERTAS OFFLINE ENVIADAS (ÚLTIMAS 10)
                </div>
                <div className="p-1 h-[140px] overflow-y-auto bg-white">
                  <table className="w-full text-left text-[9px] border-collapse">
                    <thead>
                      <tr className="bg-gray-200 border-b border-gray-400 font-bold text-gray-700">
                        <th className="p-1">FECHA/HORA</th>
                        <th className="p-1">EVENTO</th>
                        <th className="p-1">MENSAJE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {historial.map((row) => (
                        <tr key={row.id}>
                          <td className="p-1 font-mono">{new Date(row.created_at).toLocaleString('es-CL')}</td>
                          <td className="p-1 font-bold text-red-700">{row.tipo_evento}</td>
                          <td className="p-1 truncate max-w-[180px]">{row.mensaje_enviado}</td>
                        </tr>
                      ))}
                      {historial.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-gray-400 italic">No hay alertas offline registradas recientemente.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

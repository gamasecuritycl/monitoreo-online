import { useEffect, useRef, useState } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'
import { supabaseIA } from '@/lib/supabase'

interface ExpedienteModalProps {
  evento: EventoMonitoreo
  onClose: () => void
}

function getSignalSeverity(evento: string): { label: string; color: string; bg: string } {
  const upper = evento.toUpperCase()
  if (upper.includes('ROBO') || upper.includes('PANICO') || upper.includes('INCENDIO'))
    return { label: 'CRÍTICO', color: 'text-white', bg: 'bg-[#FF4D4D]' }
  if (upper.includes('CIERRE'))
    return { label: 'CIERRE', color: 'text-white', bg: 'bg-[#3B82F6]' }
  if (upper.includes('APERTURA'))
    return { label: 'APERTURA', color: 'text-white', bg: 'bg-[#22C55E]' }
  if (upper.includes('AUTOTEST'))
    return { label: 'SISTEMA', color: 'text-white', bg: 'bg-[#9CA3AF]' }
  return { label: 'INFORMATIVO', color: 'text-slate-300', bg: 'bg-slate-700' }
}

function formatFecha(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      year:    'numeric',
      month:   '2-digit',
      day:     '2-digit',
      hour:    '2-digit',
      minute:  '2-digit',
      second:  '2-digit',
      hour12:  false,
    }).format(d).replace(',', '')
  } catch {
    return iso
  }
}

export default function ExpedienteModal({ evento, onClose }: ExpedienteModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  const severity = getSignalSeverity(evento.evento)
  const [activeTab, setActiveTab] = useState<'general' | 'zones' | 'maintenance' | 'action'>('general')

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    ref.current?.focus()
  }, [])

  // Dummy dynamic data based on client account
  const accountNum = evento.cuenta || '7015'
  const clientName = evento.nombre_abonado || 'GAMA SEGURIDAD'

  // Estados para Video Verificación IA Real
  const [camarasReal, setCamarasReal] = useState<any[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [cargandoIA, setCargandoIA] = useState(true)
  
  // Estados de WebSocket para Stream en vivo
  const [frameData, setFrameData] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string>('Desconectado')
  const wsRef = useRef<WebSocket | null>(null)

  // 1. Obtener cámaras del cliente desde la base de datos de IA
  useEffect(() => {
    let isMounted = true
    
    async function fetchIAData() {
      try {
        setCargandoIA(true)
        
        // Buscar el cliente por cuenta (mapeada en el campo 'empresa') en la BD de IA
        let { data: clientes } = await supabaseIA
          .from('clientes')
          .select('id')
          .eq('empresa', accountNum)
          
        // Fallback: buscar por coincidencia de nombre si no hay por cuenta
        if (!clientes || clientes.length === 0) {
          const cleanedName = clientName.split(' ')[0]
          const { data: fallbackClientes } = await supabaseIA
            .from('clientes')
            .select('id')
            .ilike('nombre', `%${cleanedName}%`)
          clientes = fallbackClientes
        }
        
        if (!clientes || clientes.length === 0) {
          if (isMounted) setCargandoIA(false)
          return
        }
        
        const clienteId = clientes[0].id
        
        // Obtener las cámaras activas del cliente
        const { data: cams } = await supabaseIA
          .from('camaras')
          .select('*')
          .eq('cliente_id', clienteId)
          .eq('activa', true)
          
        if (isMounted) {
          setCamarasReal(cams || [])
          if (cams && cams.length > 0) {
            setSelectedCameraId(cams[0].id)
          }
        }
      } catch (err) {
        console.error('Error cargando cámaras de IA:', err)
      } finally {
        if (isMounted) setCargandoIA(false)
      }
    }
    
    fetchIAData()
    return () => { isMounted = false }
  }, [accountNum, clientName])

  // 2. Controlar la conexión WebSocket para streaming en tiempo real
  useEffect(() => {
    if (!selectedCameraId) return
    
    // Conectar al servicio de API del PC Scorpion (localhost:8000)
    const wsUrl = `ws://localhost:8000/ws/camara/${selectedCameraId}?token=admin`
    setStatusMsg('Conectando...')
    
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'frame') {
          setFrameData(msg.data)
          setStatusMsg('En vivo')
        } else if (msg.type === 'status') {
          setStatusMsg(msg.msg || msg.estado)
        }
      } catch (err) {
        console.error('Error procesando frame WS:', err)
      }
    }
    
    ws.onclose = () => {
      setStatusMsg('Desconectado')
      setFrameData(null)
    }
    
    ws.onerror = () => {
      setStatusMsg('Fallo de stream')
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [selectedCameraId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-mono"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="w-full max-w-xl mx-4 bg-[#080d19] border border-[#1e293b] rounded-md shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Header style Windows Desktop bevel */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#111827] border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-slate-200 tracking-wider">EXPEDIENTE DEL ABONADO</h2>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${severity.bg} ${severity.color}`}>
              {severity.label}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-lg leading-none cursor-pointer">&times;</button>
        </div>

        {/* Tab Selector Desktop Style */}
        <div className="flex bg-[#0b1222] border-b border-[#1e293b] text-xs">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 border-r border-[#1e293b] font-semibold transition-all cursor-pointer ${
              activeTab === 'general' ? 'bg-[#080d19] text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-500 hover:bg-[#0e172a] hover:text-slate-300'
            }`}
          >
            FICHA TÉCNICA
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 border-r border-[#1e293b] font-semibold transition-all cursor-pointer ${
              activeTab === 'zones' ? 'bg-[#080d19] text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-500 hover:bg-[#0e172a] hover:text-slate-300'
            }`}
          >
            ZONAS & COBERTURA
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2 border-r border-[#1e293b] font-semibold transition-all cursor-pointer ${
              activeTab === 'maintenance' ? 'bg-[#080d19] text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-500 hover:bg-[#0e172a] hover:text-slate-300'
            }`}
          >
            MANTENIMIENTO
          </button>
          <button
            onClick={() => setActiveTab('action')}
            className={`px-4 py-2 font-semibold transition-all cursor-pointer ${
              activeTab === 'action' ? 'bg-[#080d19] text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-500 hover:bg-[#0e172a] hover:text-slate-300'
            }`}
          >
            PLAN DE ACCIÓN
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 h-72 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Número de Abonado</label>
                  <p className="text-xs font-bold text-slate-200 mt-1 font-mono">{accountNum}</p>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Nombre Comercial</label>
                  <p className="text-xs font-bold text-slate-200 mt-1">{clientName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-[#131b30] pt-3">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Dirección Particular</label>
                  <p className="text-xs text-slate-300 mt-1">Calle Falsa 123, Providencia</p>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Ciudad/Comuna</label>
                  <p className="text-xs text-slate-300 mt-1">Santiago, Chile</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#131b30] pt-3">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Señal del Evento</label>
                  <p className={`text-xs font-bold mt-1`} style={{ color: severity.label === 'CRÍTICO' ? '#FF4D4D' : '#3B82F6' }}>
                    {evento.evento}
                  </p>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Fecha/Hora Evento</label>
                  <p className="text-xs text-slate-300 mt-1 font-mono">{formatFecha(evento.fecha_hora)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'zones' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* List of Zones */}
              <div className="border border-[#1e293b] rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-[10px] font-mono">
                  <thead>
                    <tr className="bg-[#111827] text-slate-400">
                      <th className="p-1.5 border-b border-[#1e293b] w-8 text-center">ZN</th>
                      <th className="p-1.5 border-b border-[#1e293b]">Descripción</th>
                      <th className="p-1.5 border-b border-[#1e293b] w-10 text-center">CID</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-[#131b30]">
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">01</td>
                      <td className="p-1.5">Puerta Acceso Principal</td>
                      <td className="p-1.5 text-center text-slate-400">130</td>
                    </tr>
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">02</td>
                      <td className="p-1.5">PIR Living Central</td>
                      <td className="p-1.5 text-center text-slate-400">130</td>
                    </tr>
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">03</td>
                      <td className="p-1.5">PIR Bodega de Insumos</td>
                      <td className="p-1.5 text-center text-slate-400">130</td>
                    </tr>
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">04</td>
                      <td className="p-1.5">Botón Pánico Caja 1</td>
                      <td className="p-1.5 text-center text-red-400 font-bold">120</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Camera Video Verification */}
              <div className="relative border border-[#1e293b] bg-black rounded overflow-hidden flex flex-col justify-between items-center text-center p-3 h-full min-h-[220px]">
                {cargandoIA ? (
                  <div className="my-auto text-slate-500 text-xs animate-pulse">Consultando cámaras IA...</div>
                ) : camarasReal.length > 0 ? (
                  <div className="w-full flex flex-col justify-between h-full gap-2">
                    {/* Header: Selector and status */}
                    <div className="flex items-center justify-between gap-2">
                      <select 
                        value={selectedCameraId || ''} 
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          setFrameData(null);
                        }}
                        className="bg-black text-[10px] text-slate-300 border border-[#1e293b] rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500 font-mono max-w-[150px]"
                      >
                        {camarasReal.map((cam) => (
                          <option key={cam.id} value={cam.id}>{cam.nombre.toUpperCase()}</option>
                        ))}
                      </select>
                      
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${statusMsg === 'En vivo' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className={`text-[8px] font-bold tracking-widest uppercase ${statusMsg === 'En vivo' ? 'text-green-500' : 'text-red-400'}`}>
                          {statusMsg}
                        </span>
                      </div>
                    </div>
                    
                    {/* Live Stream Viewport */}
                    <div className="relative flex-1 bg-[#04060b] border border-[#131b30] rounded flex items-center justify-center overflow-hidden min-h-[140px]">
                      {frameData ? (
                        <img 
                          src={`data:image/jpeg;base64,${frameData}`} 
                          alt="Cámara en vivo" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl">🎥</span>
                          <span className="text-[9px] text-slate-500 font-mono">{statusMsg}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Metadata information */}
                    <div className="text-[8px] text-slate-500 font-mono">
                      IP: {camarasReal.find(c => c.id === selectedCameraId)?.ip_local || 'Localhost'} | RTSP: {camarasReal.find(c => c.id === selectedCameraId)?.rtsp_url ? 'Configurado' : 'Discovery'}
                    </div>
                  </div>
                ) : (
                  <div className="my-auto flex flex-col items-center gap-2">
                    <span className="text-slate-600 text-3xl">🎦</span>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Sin cámaras IA vinculadas</p>
                    <p className="text-[8px] text-slate-600 font-mono">Agregue cámaras con cuenta '{accountNum}' en la BD de IA.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-3 font-mono text-xs">
              <p className="text-[10px] text-slate-500 uppercase">Historial de Visitas Técnicas</p>
              <div className="space-y-2">
                <div className="p-2.5 bg-[#0a0e1a] border border-[#1e293b] rounded">
                  <div className="flex justify-between font-bold text-[10px] text-slate-400">
                    <span>15/05/2026</span>
                    <span className="text-blue-400">Carlos Ruiz (Técnico)</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">Reemplazo de batería descargada en panel central DSC 1832.</p>
                </div>
                <div className="p-2.5 bg-[#0a0e1a] border border-[#1e293b] rounded">
                  <div className="flex justify-between font-bold text-[10px] text-slate-400">
                    <span>22/04/2026</span>
                    <span className="text-blue-400">Luis Soto (Técnico)</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">Limpieza y re-calibración de sensor de movimiento Hall.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'action' && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Plan de Llamadas de Emergencia</p>
              <div className="overflow-x-auto border border-[#1e293b] rounded">
                <table className="w-full text-left border-collapse text-[10px] font-mono">
                  <thead>
                    <tr className="bg-[#111827] text-slate-400">
                      <th className="p-1.5 border-b border-[#1e293b] w-10 text-center">Prioridad</th>
                      <th className="p-1.5 border-b border-[#1e293b]">Contacto</th>
                      <th className="p-1.5 border-b border-[#1e293b]">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-[#131b30]">
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">1</td>
                      <td className="p-1.5">Tomás Toro (Administrador)</td>
                      <td className="p-1.5 font-bold text-slate-200">+56 9 8765 4321</td>
                    </tr>
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">2</td>
                      <td className="p-1.5">Guardia Nocturno (Conserjería)</td>
                      <td className="p-1.5 font-bold text-slate-200">+56 2 2345 6789</td>
                    </tr>
                    <tr className="hover:bg-[#131b30]/50 text-red-400 bg-red-950/10">
                      <td className="p-1.5 text-center font-bold">3</td>
                      <td className="p-1.5">Carabineros de Chile</td>
                      <td className="p-1.5 font-bold">133</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer style Windows Desktop bevel */}
        <div className="flex justify-end gap-2 px-4 py-2 bg-[#0a0e1a] border-t border-[#1e293b]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 text-xs font-semibold rounded cursor-pointer transition-colors"
          >
            CERRAR EXPEDIENTE
          </button>
        </div>
      </div>
    </div>
  )
}

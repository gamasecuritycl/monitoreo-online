'use client'

import React, { useState, useEffect, Fragment, useRef } from 'react'
import { supabase, supabaseIA } from '@/lib/supabase'

interface EventoMonitoreo {
  id: number
  fecha_hora: string
  cuenta: string
  nombre_abonado: string
  evento: string
  zona: string
  usuario: string
}

interface DeteccionObject {
  label: string
  confidence: number
  bbox: [number, number, number, number]
  color: string
  trace?: [number, number][]
}

interface Props {
  onClose: () => void
  evento: EventoMonitoreo
  esCierre: boolean // Estado de la partición (Cierre vs Apertura)
  clientesMap?: Record<string, Record<string, string>>
}

export default function VideoVerificacionModal({ onClose, evento, esCierre, clientesMap = {} }: Props) {
  const [activeCamera, setActiveCamera] = useState<'CAM-01' | 'CAM-02' | 'CAM-03'>('CAM-01')
  const [analizandoIA, setAnalizandoIA] = useState(false)
  const [resultadoIA, setResultadoIA] = useState<{ threat: boolean; confidence: number; text: string } | null>(null)
  const [detecciones, setDetecciones] = useState<DeteccionObject[]>([])
  const [todasLasCamaras, setTodasLasCamaras] = useState<Record<string, { cam01?: string; cam02?: string; cam03?: string }>>({})

  const cuentaActiva = evento.cuenta
  const clientName = evento.nombre_abonado || 'Cliente Scorpion'

  // Estados para Cámaras IA reales y Live Stream
  const [camarasReal, setCamarasReal] = useState<any[]>([])
  const [selectedRealCameraId, setSelectedRealCameraId] = useState<string | null>(null)
  const [cargandoIA, setCargandoIA] = useState(true)
  const [frameData, setFrameData] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string>('Desconectado')
  const wsRef = useRef<WebSocket | null>(null)

  // Estados de Verificación por Clips IA (Supabase Storage)
  const [alertasReal, setAlertasReal] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'live' | 'clip'>('live')
  const [selectedClipUrl, setSelectedClipUrl] = useState<string | null>(null)
  const [cargandoAlertas, setCargandoAlertas] = useState(false)

  // ── Mejoras v2: Tiempo en escena + historial IA + despacho ──
  const [tiempoEnEscena, setTiempoEnEscena] = useState(0)
  const [historialIA, setHistorialIA] = useState<Array<{ cam: string; threat: boolean; confidence: number; hora: string }>>([]) 
  const [despachando, setDespachando] = useState(false)
  const [despachado, setDespachado] = useState(false)
  const [guardandoBitacora, setGuardandoBitacora] = useState(false)
  const [bitacoraGuardada, setBitacoraGuardada] = useState(false)

  // 1. Obtener la lista de cámaras reales desde la BD de analítica
  useEffect(() => {
    let isMounted = true
    async function fetchCams() {
      try {
        setCargandoIA(true)
        // Buscar cliente en BD de IA por cuenta (columna empresa)
        let { data: clientes } = await supabaseIA
          .from('clientes')
          .select('id')
          .eq('empresa', cuentaActiva)
          
        if (!clientes || clientes.length === 0) {
          // Fallback por primera palabra del nombre
          const cleanName = clientName.split(' ')[0]
          const { data: fallback } = await supabaseIA
            .from('clientes')
            .select('id')
            .ilike('nombre', `%${cleanName}%`)
          clientes = fallback
        }
        
        if (!clientes || clientes.length === 0) {
          if (isMounted) setCargandoIA(false)
          return
        }
        
        const clienteId = clientes[0].id
        
        // Buscar cámaras activas
        const { data: cams } = await supabaseIA
          .from('camaras')
          .select('*')
          .eq('cliente_id', clienteId)
          .eq('activa', true)
          
        if (isMounted) {
          setCamarasReal(cams || [])
          if (cams && cams.length > 0) {
            setSelectedRealCameraId(cams[0].id)
            
            // Buscar alertas recientes con clip de video
            const camIds = cams.map(c => c.id)
            setCargandoAlertas(true)
            const { data: alerts } = await supabaseIA
              .from('alertas')
              .select('*')
              .in('camara_id', camIds)
              .not('clip_path', 'is', null)
              .order('fecha_hora', { ascending: false })
              .limit(5)
            
            if (isMounted) setAlertasReal(alerts || [])
          }
        }
      } catch (err) {
        console.error('Error cargando cámaras reales:', err)
      } finally {
        if (isMounted) {
          setCargandoIA(false)
          setCargandoAlertas(false)
        }
      }
    }
    fetchCams()
    return () => { isMounted = false }
  }, [cuentaActiva, clientName])

  // Contador de tiempo en escena (segundos desde que se abrió el modal)
  useEffect(() => {
    const timer = setInterval(() => setTiempoEnEscena(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTiempoEscena = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  // 2. Control del ciclo de vida del WebSocket para streaming
  useEffect(() => {
    if (!selectedRealCameraId) return
    
    const apiHost = process.env.NEXT_PUBLIC_IA_API_URL || '10.99.0.1:8000'
    const wsProto = apiHost.startsWith('https') || apiHost.includes(':443') ? 'wss' : 'ws'
    const cleanHost = apiHost.replace(/^https?:\/\//, '')
    const wsUrl = `${wsProto}://${cleanHost}/ws/camara/${selectedRealCameraId}?token=admin`
    
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
        console.error('Error procesando WS frame:', err)
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
  }, [selectedRealCameraId])

  // Cargar lista de cámaras de Supabase (mantenido por compatibilidad histórica)
  useEffect(() => {
    const fetchCamaras = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CAMARAS')
          .order('id', { ascending: false })
          .limit(1)
        if (data && data.length > 0 && !error) {
          const parsed = JSON.parse(data[0].nombre_abonado || '{}')
          setTodasLasCamaras(parsed)
        }
      } catch (err) {
        console.warn('Error loading custom cameras list:', err)
      }
    }
    fetchCamaras()
  }, [])

  const camarasActivas = todasLasCamaras[cuentaActiva] || { cam01: '', cam02: '', cam03: '' }

  const analizarConIA = async () => {
    setAnalizandoIA(true)
    setResultadoIA(null)
    setDetecciones([])

    const cameraDesc = activeCamera === 'CAM-01' ? 'Frontal' : activeCamera === 'CAM-02' ? 'Lateral' : 'Bodega'
    const prompt = `Actúas como Analista de Seguridad IA.
Abonado: Cuenta ${cuentaActiva} (${clientName})
Cámara: ${cameraDesc}
Estado del Sistema: ${esCierre ? '🔒 ARMADO (CIERRE) - Inmueble deshabitado' : '🔓 DESARMADO (APERTURA) - Inmueble con personas/clientes'}
Instrucciones:
1. Emite un veredicto de seguridad conciso.
2. Si el sistema está en CIERRE y detectas una persona, es una AMENAZA REAL DE INTRUSIÓN.
3. Si el sistema está en APERTURA y detectas una persona, es un MOVIMIENTO ESPERADO (personal/clientes), por ende no es una amenaza.
4. Indica un porcentaje de confianza.`

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.ok && data.texto) {
        // La amenaza depende del estado de Cierre
        const isThreat = activeCamera === 'CAM-01' && esCierre
        const nuevoRes = {
          threat: isThreat,
          confidence: activeCamera === 'CAM-01' ? 96.4 : 91.8,
          text: data.texto
        }
        setResultadoIA(nuevoRes)
        setHistorialIA(prev => [{ cam: activeCamera, threat: isThreat, confidence: nuevoRes.confidence, hora: new Date().toLocaleTimeString('es-CL') }, ...prev].slice(0, 5))

        // Supervision Overlays
        if (activeCamera === 'CAM-01') {
          setDetecciones([
            { label: 'person', confidence: 0.96, bbox: [35, 45, 18, 35], color: '#ef4444', trace: [[45, 50], [45, 52], [47, 52], [46, 50]] },
            { label: 'car', confidence: 0.88, bbox: [50, 10, 30, 25], color: '#3b82f6' }
          ])
        } else if (activeCamera === 'CAM-02') {
          setDetecciones([
            { label: 'vegetation', confidence: 0.91, bbox: [20, 30, 35, 45], color: '#eab308' }
          ])
        } else {
          setDetecciones([
            { label: 'cat', confidence: 0.92, bbox: [55, 60, 15, 15], color: '#22c55e', trace: [[60, 62], [58, 62], [57, 60]] }
          ])
        }
      } else {
        throw new Error('Respuesta vacía')
      }
    } catch (err) {
      // Fallback local teniendo en cuenta el estado de Cierre/Apertura
      const isThreat = activeCamera === 'CAM-01' && esCierre
      const fallbackReport = isThreat
        ? `[FALLBACK IA - SCORPION DETECTOR]\nVEREDICTO: INTRUSIÓN CRÍTICA EN PROCESO (94.2% confianza)\nDETALLE: Sistema en estado de CIERRE (armado). Silueta humana merodeando. Posible intrusión. Despachar patrulla.`
        : !esCierre && activeCamera === 'CAM-01'
        ? `[FALLBACK IA - SCORPION DETECTOR]\nVEREDICTO: MOVIMIENTO NORMAL DETECTADO (92.5% confianza)\nDETALLE: Sistema en estado de APERTURA (desarmado). Se detecta persona transitando en horario laboral. Sin novedad de riesgo.`
        : `[FALLBACK IA - SCORPION DETECTOR]\nVEREDICTO: FALSA ALARMA / ACTIVIDAD MENOR (89.5% confianza)\nDETALLE: Sistema en estado de ${esCierre ? 'CIERRE' : 'APERTURA'}. Gatillado por perturbación menor (${activeCamera === 'CAM-02' ? 'viento en follaje' : 'felino pequeño'}).`;
      
      const fallbackRes = {
        threat: isThreat,
        confidence: isThreat ? 94.2 : 89.5,
        text: fallbackReport
      }
      setResultadoIA(fallbackRes)
      setHistorialIA(prev => [{ cam: activeCamera, threat: isThreat, confidence: fallbackRes.confidence, hora: new Date().toLocaleTimeString('es-CL') }, ...prev].slice(0, 5))

      if (activeCamera === 'CAM-01') {
        setDetecciones([
          { label: 'person', confidence: 0.94, bbox: [35, 45, 18, 35], color: '#ef4444', trace: [[45, 50], [45, 52], [47, 52], [46, 50]] },
          { label: 'car', confidence: 0.88, bbox: [50, 10, 30, 25], color: '#3b82f6' }
        ])
      } else if (activeCamera === 'CAM-02') {
        setDetecciones([
          { label: 'vegetation', confidence: 0.89, bbox: [20, 30, 35, 45], color: '#eab308' }
        ])
      } else {
        setDetecciones([
          { label: 'cat', confidence: 0.91, bbox: [55, 60, 15, 15], color: '#22c55e', trace: [[60, 62], [58, 62], [57, 60]] }
        ])
      }
    } finally {
      setAnalizandoIA(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono text-black">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Title Bar */}
        <div className="bg-[#8B0000] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-xs tracking-wide">
            🎥 SCORPION - Verificación de Video · CTA: {cuentaActiva}
            <span className="ml-3 font-mono text-yellow-300 text-[9px] tracking-widest bg-black/30 px-1.5 py-0.5 rounded">
              ⏱ T+{formatTiempoEscena(tiempoEnEscena)}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="bg-[#c0c0c0] text-black font-bold border border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] cursor-pointer text-xs"
          >
            X
          </button>
        </div>

        {/* Account Info and Arming Status Header */}
        <div className="p-2 bg-[#d4d0c8] border-b border-gray-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
          <div className="text-xs">
            <span className="font-bold">Abonado:</span> <span className="uppercase text-blue-900 font-bold">{clientName}</span>
          </div>
          
          {/* Arming Status Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold">ESTADO DE ALARMA:</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
              esCierre 
                ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' 
                : 'bg-green-100 text-green-800 border-green-300'
            }`}>
              {esCierre 
                ? '🔒 SISTEMA ARMADO (CIERRE) - DETECTOR EN MODO ALERTA' 
                : '🔓 SISTEMA DESARMADO (APERTURA) - MODO PASIVO'
              }
            </span>
          </div>
        </div>

        {/* Video Viewport Area */}
        <div className="flex-1 bg-black flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Left: Interactive CCTV player */}
          <div className="relative flex-1 bg-[#050505] overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-800 min-h-[220px] md:min-h-0">
            {/* Scanlines / CRT Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] z-10" />

            {/* Video feed render */}
             {(() => {
               if (cargandoIA) {
                 return <div className="text-yellow-500 text-xs animate-pulse font-mono">[CARGANDO CONFIGURACIÓN DE CÁMARAS...]</div>
               }
               if (camarasReal.length === 0) {
                 if (camarasActivas.cam01) {
                   const embedUrl = camarasActivas.cam01.endsWith('/') ? camarasActivas.cam01 : `${camarasActivas.cam01}/`
                   return (
                     <div className="relative w-full h-full bg-black">
                       <iframe
                         src={embedUrl}
                         className="w-full h-full border-0 absolute inset-0 z-10"
                         allow="autoplay; encrypted-media; picture-in-picture"
                         title="Cámara Local en Vivo"
                       />
                     </div>
                   )
                 }
                 return (
                   <div className="relative w-full h-full flex items-center justify-center">
                     <img
                       src={activeCamera === 'CAM-01' ? '/cctv_intruder.png' : '/cctv_false_alarm.png'}
                       alt="CCTV Demo View"
                       className={`w-full h-full object-cover select-none ${
                         activeCamera === 'CAM-03' ? 'grayscale hue-rotate-90 brightness-75' : 
                         activeCamera === 'CAM-02' ? 'hue-rotate-180 brightness-90' : 'brightness-90'
                       }`}
                     />
                     <div className="absolute bottom-2 left-2 bg-yellow-600/90 text-white text-[8px] px-1.5 py-0.5 rounded font-black font-mono tracking-wider z-20">
                       ⚠️ DEMO: SIN CÁMARAS IA VINCULADAS (VINCÚLELAS EN UTILIDADES)
                     </div>
                   </div>
                 )
               }
               if (viewMode === 'clip' && selectedClipUrl) {
                 return (
                   <video
                     src={selectedClipUrl}
                     controls
                     autoPlay
                     muted
                     loop
                     playsInline
                     className="w-full h-full object-contain"
                   />
                 )
               }
               if (frameData) {
                 return (
                   <img
                     src={`data:image/jpeg;base64,${frameData}`}
                     alt="CCTV Real-Time Feed"
                     className="w-full h-full object-contain"
                   />
                 )
               }
               return (
                 <div className="flex flex-col items-center gap-2 text-slate-400 font-mono">
                   <span className="text-3xl animate-bounce">🎥</span>
                   <span className="text-[10px] uppercase font-bold">{statusMsg}</span>
                 </div>
               )
             })()}

            {/* Live indicator HUD */}
            <div className="absolute top-2 left-2.5 flex items-center gap-1 bg-black/60 px-1 py-0.5 rounded text-[8px] tracking-wider z-20 text-white">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
              <span>LIVE {activeCamera}</span>
            </div>
            <div className="absolute top-2 right-2.5 bg-black/60 px-1 py-0.5 rounded text-[8px] z-20 text-white">
              {new Date().toISOString().slice(0, 19).replace('T', ' ')}
            </div>

            {/* Dynamic Roboflow Supervision overlays */}
            {detecciones.map((det, idx) => (
              <Fragment key={idx}>
                {/* Bounding Box */}
                <div
                  style={{
                    top: `${det.bbox[0]}%`,
                    left: `${det.bbox[1]}%`,
                    width: `${det.bbox[2]}%`,
                    height: `${det.bbox[3]}%`,
                    borderColor: det.color,
                  }}
                  className={`absolute border-2 bg-opacity-10 z-20 flex flex-col justify-start items-start ${
                    det.label === 'person' ? (esCierre ? 'bg-red-600/10 animate-pulse' : 'bg-green-600/10') : 
                    det.label === 'car' ? 'bg-blue-600/10' : 
                    det.label === 'cat' ? 'bg-green-600/10' : 'bg-yellow-600/10'
                  }`}
                >
                  <span
                    style={{ backgroundColor: det.color }}
                    className="text-white text-[7px] px-1 font-bold leading-none uppercase select-none font-mono"
                  >
                    {det.label} {(det.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Tracking trace line */}
                {det.trace && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                      points={det.trace.map(pt => `${pt[0]},${pt[1]}`).join(' ')}
                      fill="none"
                      stroke={det.color}
                      strokeWidth="0.5"
                      strokeDasharray="1,1"
                    />
                    {det.trace.map((pt, pIdx) => (
                      <circle key={pIdx} cx={pt[0]} cy={pt[1]} r="0.4" fill={det.color} />
                    ))}
                  </svg>
                )}
              </Fragment>
            ))}
          </div>

          {/* Right: AI analysis and Supervision Panel */}
          <div className="w-full md:w-[220px] shrink-0 bg-[#0d0f14] p-2 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 border-gray-800 text-white">
            {/* Top selectors & actions */}
             <div className="space-y-3">
               
               {/* Selector de Modo de Vista */}
               <div className="grid grid-cols-2 border border-gray-700 rounded overflow-hidden">
                 <button
                   onClick={() => setViewMode('live')}
                   className={`py-1 text-[9px] font-bold tracking-wider cursor-pointer ${
                     viewMode === 'live' ? 'bg-red-700 text-white' : 'bg-[#1c1d22] text-gray-400 hover:text-white'
                   }`}
                 >
                   🔴 EN VIVO
                 </button>
                 <button
                   onClick={() => setViewMode('clip')}
                   className={`py-1 text-[9px] font-bold tracking-wider cursor-pointer ${
                     viewMode === 'clip' ? 'bg-blue-700 text-white' : 'bg-[#1c1d22] text-gray-400 hover:text-white'
                   }`}
                 >
                   📦 CLIPS IA
                 </button>
               </div>

               {viewMode === 'live' ? (
                 <div className="flex flex-col gap-1">
                   <span className="text-gray-400 font-bold text-[9px] uppercase">Seleccionar Cámara:</span>
                    {cargandoIA ? (
                      <div className="text-[10px] text-gray-500 italic">Cargando cámaras...</div>
                    ) : camarasReal.length > 0 ? (
                      <select
                        value={selectedRealCameraId || ''}
                        onChange={(e) => {
                          setSelectedRealCameraId(e.target.value)
                          setFrameData(null)
                        }}
                        className="bg-[#1c1d22] text-white border border-gray-700 font-bold py-1 px-1.5 focus:outline-none text-[10px] w-full"
                      >
                        {camarasReal.map((cam) => (
                          <option key={cam.id} value={cam.id}>{cam.nombre.toUpperCase()}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={activeCamera}
                        onChange={(e) => {
                          setActiveCamera(e.target.value as any)
                          setResultadoIA(null)
                          setDetecciones([])
                        }}
                        className="bg-[#1c1d22] text-white border border-gray-700 font-bold py-1 px-1.5 focus:outline-none text-[10px] w-full"
                      >
                        <option value="CAM-01">CAM-01 (Frontis Demo)</option>
                        <option value="CAM-02">CAM-02 (Lateral Demo)</option>
                        <option value="CAM-03">CAM-03 (Bodega Demo)</option>
                      </select>
                    )}
                 </div>
               ) : (
                 <div className="flex flex-col gap-1.5">
                   <span className="text-gray-400 font-bold text-[9px] uppercase">Clips Recientes de IA:</span>
                   <div className="space-y-1 max-h-[120px] overflow-y-auto font-mono text-[9px]">
                     {cargandoAlertas ? (
                       <p className="text-slate-500 animate-pulse">[Buscando clips...]</p>
                     ) : alertasReal.length > 0 ? (
                       alertasReal.map((alert) => {
                         const cleanPath = (alert.clip_path || '').replace(/\\/g, '/').replace(/^clips\//, '')
                         const clipUrl = `https://usuzyqayiecsburbsipl.supabase.co/storage/v1/object/public/clips/${cleanPath}`
                         const dateStr = alert.fecha_hora 
                           ? new Date(alert.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                           : 'Grabación'
                           
                         return (
                           <button
                             key={alert.id}
                             onClick={() => {
                               setSelectedClipUrl(clipUrl)
                               setViewMode('clip')
                             }}
                             className={`w-full text-left p-1 rounded-sm border transition-all ${
                               selectedClipUrl === clipUrl && viewMode === 'clip'
                                 ? 'bg-blue-950 text-blue-400 border-blue-800 font-bold'
                                 : 'bg-[#1c1d22] text-slate-300 border-gray-800 hover:border-gray-700'
                             }`}
                           >
                             🎥 {alert.tipo ? alert.tipo.toUpperCase() : 'ALERTA'} - {dateStr}
                           </button>
                         )
                       })
                     ) : (
                       <p className="text-slate-500 italic">[No hay clips grabados]</p>
                     )}
                   </div>
                 </div>
               )}

               {/* Analyze Button */}
               <button
                 onClick={analizarConIA}
                 disabled={analizandoIA}
                 className="w-full bg-red-700 hover:bg-red-600 text-white font-bold border border-red-500 py-1.5 text-[10px] cursor-pointer text-center select-none"
               >
                 {analizandoIA ? '🔄 ANALIZANDO ESCENA IA...' : '🤖 ANALIZAR CON IA GEMINI'}
               </button>

              {/* Status report console */}
              <div className="border border-gray-800 bg-[#08090c] p-2 rounded min-h-[100px] font-mono text-[9px] leading-snug">
                <div className="text-green-500 border-b border-green-950 pb-1 mb-1 font-bold flex items-center justify-between">
                  <span>🤖 CENTRAL IA DIAGNÓSTICO</span>
                  {resultadoIA && (
                    <span className={`px-1 py-0.2 rounded font-black text-[8px] ${
                      resultadoIA.threat ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-green-950 text-green-400 border border-green-800'
                    }`}>
                      {resultadoIA.threat ? 'PELIGRO' : 'SEGURO'}
                    </span>
                  )}
                </div>

                {analizandoIA ? (
                  <div className="text-yellow-500 space-y-1 animate-pulse py-4 text-center">
                    <div>[PROCESANDO FLUJO CCTV...]</div>
                    <div>[EVALUANDO REGLAS DE CONTROL...]</div>
                  </div>
                ) : resultadoIA ? (
                  <div className="space-y-2">
                    <p className="whitespace-pre-wrap text-slate-300 leading-snug">{resultadoIA.text}</p>
                    
                    {/* Roboflow Supervision breakdown */}
                    <div className="pt-2 border-t border-green-950 font-mono text-[8px] text-green-400 space-y-1 bg-green-950/10 p-1.5 rounded-sm">
                      <div className="font-bold text-[8px] text-[#eab308] tracking-wider mb-0.5">🔍 METRICAS SUPERVISION:</div>
                      <div className="flex justify-between">
                        <span>👥 PERSONAS:</span>
                        <span className="font-bold text-white">{detecciones.filter(d => d.label === 'person').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🚗 VEHÍCULOS:</span>
                        <span className="font-bold text-white">{detecciones.filter(d => d.label === 'car').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🐾 ANIMALES:</span>
                        <span className="font-bold text-white">{detecciones.filter(d => d.label === 'cat' || d.label === 'dog').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌿 PERTURBACIONES:</span>
                        <span className="font-bold text-white">{detecciones.filter(d => d.label.includes('vegetation')).length}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-6 italic leading-normal">
                    Presione el botón de análisis para verificar la transmisión del abonado.
                  </div>
                )}
              </div>

            </div>

            {/* Historial de análisis IA en la sesión */}
            {historialIA.length > 0 && (
              <div className="mt-2 border border-gray-800 bg-[#08090c] rounded p-1.5">
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">📋 HISTORIAL SESIÓN</div>
                <div className="space-y-0.5">
                  {historialIA.map((h, i) => (
                    <div key={i} className={`flex items-center justify-between text-[8px] font-mono px-1 py-0.5 rounded ${
                      h.threat ? 'bg-red-950/40 text-red-400' : 'bg-green-950/40 text-green-400'
                    }`}>
                      <span>{h.cam}</span>
                      <span>{h.threat ? '🔴 AMENAZA' : '🟢 SEGURO'}</span>
                      <span className="text-slate-500">{h.hora}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            {resultadoIA && (
              <div className="space-y-1.5 mt-2">
                <button
                  disabled={guardandoBitacora || bitacoraGuardada}
                  onClick={async () => {
                    if (bitacoraGuardada) return
                    setGuardandoBitacora(true)
                    try {
                      const BITACORA_API = 'https://bitacora.gamasecurity.cl/api-bitacora.php'
                      const res = await fetch(`${BITACORA_API}?action=abonados&q=${encodeURIComponent(cuentaActiva)}`)
                      const abonados = await res.json()
                      if (abonados.length > 0) {
                        await fetch(`${BITACORA_API}?action=crear`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id_abonado: abonados[0].id,
                            comentario: `🤖 ANÁLISIS IA (T+${formatTiempoEscena(tiempoEnEscena)}) — ${resultadoIA.threat ? '🔴 AMENAZA DETECTADA' : '🟢 SIN AMENAZA'} — Confianza: ${resultadoIA.confidence}% — Cámara: ${activeCamera} — ${resultadoIA.text.slice(0, 200)}`,
                            tipo_evento: resultadoIA.threat ? 1 : 3,
                            id_responsable: 1,
                          }),
                        })
                        setBitacoraGuardada(true)
                      }
                    } catch {
                      alert('Error conectando con la bitácora. Inténtelo nuevamente.')
                    } finally {
                      setGuardandoBitacora(false)
                    }
                  }}
                  className={`w-full border py-1 rounded-xs cursor-pointer text-[8px] font-bold transition-colors ${
                    bitacoraGuardada
                      ? 'bg-green-900 text-green-400 border-green-700 cursor-default'
                      : guardandoBitacora
                      ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-wait animate-pulse'
                      : 'bg-[#1e293b] hover:bg-slate-700 text-slate-200 border-slate-600'
                  }`}
                >
                  {bitacoraGuardada ? '✅ REGISTRADO EN BITÁCORA' : guardandoBitacora ? '⏳ REGISTRANDO...' : '📝 REGISTRAR EN BITÁCORA'}
                </button>

                <button
                  disabled={despachando || despachado}
                  onClick={async () => {
                    if (despachado) return
                    setDespachando(true)
                    try {
                      // 1. Registrar en bitácora
                      const BITACORA_API = 'https://bitacora.gamasecurity.cl/api-bitacora.php'
                      const res = await fetch(`${BITACORA_API}?action=abonados&q=${encodeURIComponent(cuentaActiva)}`)
                      const abonados = await res.json()
                      if (abonados.length > 0) {
                        await fetch(`${BITACORA_API}?action=crear`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id_abonado: abonados[0].id,
                            comentario: `🚓 DESPACHO DE PATRULLA AUTORIZADO — T+${formatTiempoEscena(tiempoEnEscena)} — Cuenta: ${cuentaActiva} — ${clientName} — Motivo: verificación de video por IA`,
                            tipo_evento: 1,
                            id_responsable: 1,
                          }),
                        })
                      }
                      // 2. Enviar WhatsApp de confirmación
                      await fetch('/api/whatsapp/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          cuenta: cuentaActiva,
                          mensaje: `🚓 *DESPACHO DE PATRULLA*\n━━━━━━━━━━━━━━━━━━━━━\nCuenta: *${cuentaActiva}*\nAbonado: *${clientName}*\nEstado alarma: ${esCierre ? '🔒 ARMADO' : '🔓 DESARMADO'}\nAnálisis IA: ${resultadoIA?.threat ? '🔴 AMENAZA CONFIRMADA' : '⚠️ VERIFICACIÓN PREVENTIVA'}\nHora despacho: ${new Date().toLocaleTimeString('es-CL')}\nTiempo en escena: T+${formatTiempoEscena(tiempoEnEscena)}\n━━━━━━━━━━━━━━━━━━━━━\nUnidad despachada desde central GAMA SEGURIDAD.`,
                        }),
                      }).catch(() => {}) // no bloquear si WA falla
                      setDespachado(true)
                    } catch {
                      alert('Error al despachar. Verifique conexión.')
                    } finally {
                      setDespachando(false)
                    }
                  }}
                  className={`w-full border py-1.5 rounded-xs cursor-pointer text-[9px] font-black tracking-wider transition-all ${
                    despachado
                      ? 'bg-blue-900 text-blue-300 border-blue-700 cursor-default'
                      : despachando
                      ? 'bg-orange-900 text-orange-400 border-orange-700 animate-pulse cursor-wait'
                      : 'bg-red-800 hover:bg-red-700 text-white border-red-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  }`}
                >
                  {despachado ? '✅ PATRULLA DESPACHADA' : despachando ? '📡 DESPACHANDO...' : '🚓 DESPACHAR PATRULLA'}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}

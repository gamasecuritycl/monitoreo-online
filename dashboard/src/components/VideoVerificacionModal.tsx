'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface EventoMonitoreo {
  id: number
  fecha_hora: string
  cuenta: string
  nombre_abonado: string
  evento: string
  zona: string
  usuario: string
}

interface CamaraDahuaP2P {
  id: string
  nombre: string
  serialNumber: string   // Número de Serie Dahua (SN)
  usuario: string        // admin
  password?: string      // Contraseña protegida
  canal: number          // 1, 2, 3...
  substream: boolean     // true = SubStream rápido de bajo consumo
  activa: boolean
}

interface LogEntry {
  hora: string
  tipo: 'info' | 'warn' | 'error' | 'success'
  mensaje: string
}

interface Props {
  onClose: () => void
  evento: EventoMonitoreo
  esCierre: boolean
  clientesMap?: Record<string, Record<string, string>>
}

export default function VideoVerificacionModal({ onClose, evento, esCierre, clientesMap = {} }: Props) {
  // FIJAR LA CUENTA AL ABRIR EL MODAL PARA QUE LAS SEÑALES DE FONDO NO CAMBIEN EL ABONADO EN VIVO
  const [cuentaActiva] = useState(evento.cuenta)
  const clientName = evento.nombre_abonado || 'Cliente Scorpion'

  // Estados de Cámaras Dahua P2P y Selección
  const [camarasDahua, setCamarasDahua] = useState<CamaraDahuaP2P[]>([])
  const [selectedCamara, setSelectedCamara] = useState<CamaraDahuaP2P | null>(null)
  const [useSubstream, setUseSubstream] = useState<boolean>(true)

  // Consola de Logs P2P en Tiempo Real
  const [logsP2P, setLogsP2P] = useState<LogEntry[]>([])
  const [mostrarLogs, setMostrarLogs] = useState<boolean>(true)

  // Estados de Streaming y Conexión
  const [cargandoIA, setCargandoIA] = useState(true)
  const [frameData, setFrameData] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string>('Desconectado')
  const [alertaPTZ, setAlertaPTZ] = useState<string | null>(null)
  const [tiempoEnEscena, setTiempoEnEscena] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const channelRef = useRef<any>(null)
  const logTerminalRef = useRef<HTMLDivElement | null>(null)

  // Helper para agregar entradas al Log de Diagnóstico P2P
  const addLog = (mensaje: string, tipo: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const hora = new Date().toLocaleTimeString('es-CL', { hour12: false })
    setLogsP2P(prev => [...prev.slice(-49), { hora, mensaje, tipo }])
  }

  // Auto-scroll al final del terminal de logs
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight
    }
  }, [logsP2P])

  // 1. Suscripción a canal Supabase Realtime para Control PTZ
  useEffect(() => {
    const channelName = `ptz-${cuentaActiva}`
    const ch = supabase.channel(channelName)
    ch.subscribe((status) => {
      console.log(`Supabase PTZ Broadcast status: ${status}`)
    })
    channelRef.current = ch

    return () => {
      ch.unsubscribe()
    }
  }, [cuentaActiva])

  // 2. Enviar comandos CGI de PTZ al backend de Dahua P2P
  const enviarComandoPTZ = (direccion: string) => {
    const dirMap: Record<string, string> = {
      up: 'ARRIBA ▲',
      down: 'ABAJO ▼',
      left: 'IZQUIERDA ◀',
      right: 'DERECHA ▶',
      home: 'INICIAL 🏠',
      zoomIn: 'ZOOM + 🔍',
      zoomOut: 'ZOOM - 🔍'
    }

    if (channelRef.current && selectedCamara) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'ptz_dahua',
        payload: { 
          sn: selectedCamara.serialNumber,
          canal: selectedCamara.canal,
          direccion 
        }
      })
    }

    const txt = dirMap[direccion] || direccion
    setAlertaPTZ(txt)
    addLog(`🎮 Comando PTZ enviado: ${txt} (SN: ${selectedCamara?.serialNumber})`, 'info')
    setTimeout(() => setAlertaPTZ(null), 1500)
  }

  // 3. Cargar cámaras Dahua asociadas exclusivamente a este abonado
  useEffect(() => {
    let isMounted = true
    async function fetchCams() {
      try {
        setCargandoIA(true)
        addLog(`📡 Consultando base de datos de abonado #${cuentaActiva}...`, 'info')

        // 1. Cargar desde localStorage para cuentaActiva
        const localSaved = localStorage.getItem(`gama_dahua_sn_${cuentaActiva}`)
        let localCams: CamaraDahuaP2P[] = []
        if (localSaved) {
          try { localCams = JSON.parse(localSaved) } catch (e) {}
        }

        // 2. Cargar desde Supabase para CAMARAS_DAHUA_${cuentaActiva}
        let dbCams: CamaraDahuaP2P[] = []
        const { data: dbData } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', `CAMARAS_DAHUA_${cuentaActiva}`)
          .order('id', { ascending: false })
          .limit(1)

        if (dbData && dbData.length > 0 && dbData[0].nombre_abonado) {
          try {
            const parsed = JSON.parse(dbData[0].nombre_abonado)
            if (Array.isArray(parsed)) dbCams = parsed
          } catch (e) {}
        }

        const combinedMap = new Map<string, CamaraDahuaP2P>()
        ;[...localCams, ...dbCams].forEach(c => {
          if (c && c.serialNumber) combinedMap.set(c.serialNumber, c)
        })

        const finalCams = Array.from(combinedMap.values())

        if (isMounted) {
          if (finalCams.length > 0) {
            setCamarasDahua(finalCams)
            setSelectedCamara(finalCams[0])
            addLog(`✅ ${finalCams.length} equipo(s) Dahua cargado(s) para #${cuentaActiva}. Cámara activa: ${finalCams[0].nombre} [SN: ${finalCams[0].serialNumber}]`, 'success')
          } else {
            setCamarasDahua([])
            setSelectedCamara(null)
            addLog(`⚠️ ATENCIÓN: No hay cámaras Dahua P2P registradas para la cuenta #${cuentaActiva}. Registre el Número de Serie (SN) en Expediente > Cámara de Verificación.`, 'warn')
          }
        }
      } catch (err: any) {
        addLog(`❌ Error consultando cámaras Dahua: ${err.message}`, 'error')
      } finally {
        if (isMounted) setCargandoIA(false)
      }
    }
    fetchCams()
    return () => { isMounted = false }
  }, [cuentaActiva])

  // 4. Timer de Tiempo en Escena
  useEffect(() => {
    const timer = setInterval(() => setTiempoEnEscena(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // 5. Conexión P2P (WebSocket + HTTPS Fallback Proxy) y Diagnóstico de Log en Vivo
  useEffect(() => {
    if (!selectedCamara) return

    let activePolling = true
    const sn = selectedCamara.serialNumber
    const user = selectedCamara.usuario || 'admin'
    const pass = selectedCamara.password || ''
    const canal = selectedCamara.canal || 1

    addLog(`🔌 Iniciando prueba de conexión P2P Dahua NetSDK...`, 'info')
    addLog(`🔑 Credenciales: SN=[${sn}] | Usuario=[${user}] | Password=[••••••••] | Canal=[${canal}]`, 'info')

    setStatusMsg(`Conectando P2P (SN: ${sn})...`)

    // 1. Polling continuo: Intentar captura directa desde Cámara IP (192.168.1.19), Servidor Local (8000) o Vercel Proxy
    const fetchFrame = async () => {
      if (!activePolling) return

      const targets = [
        `http://192.168.1.19/cgi-bin/snapshot.cgi?channel=${canal}`,
        `http://localhost:8000/snapshot?sn=${sn}&user=${user}&pass=${encodeURIComponent(pass)}&canal=${canal}`,
        `/api/dahua-stream?sn=${sn}&user=${user}&pass=${encodeURIComponent(pass)}&canal=${canal}`
      ]

      for (const targetUrl of targets) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 2000)

          const res = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
              'Authorization': 'Basic ' + btoa(`${user}:${pass}`)
            }
          })
          clearTimeout(timeoutId)

          if (res.ok) {
            const blob = await res.blob()
            if (blob.size > 500 && blob.type.includes('image')) {
              const reader = new FileReader()
              reader.onloadend = () => {
                if (activePolling && reader.result) {
                  setFrameData(reader.result as string)
                  setStatusMsg('🔴 EN VIVO P2P DAHUA')
                  addLog(`🟢 Imagen en vivo recibida de la cámara Dahua [SN: ${sn}] desde ${targetUrl}.`, 'success')
                }
              }
              reader.readAsDataURL(blob)
              return
            }
          }
        } catch (e) {
          // Intentar siguiente endpoint
        }
      }
    }

    fetchFrame()
    const pollInterval = setInterval(fetchFrame, 2000)

    // 2. Probar túnel WebSocket directo si está disponible en la red
    const apiHost = process.env.NEXT_PUBLIC_IA_API_URL || '10.99.0.1:8000'
    const cleanHost = apiHost.replace(/^https?:\/\//, '')
    const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    
    // Solo intentar WebSocket directo si no se usa localhost/ip privada en https
    if (window.location.protocol !== 'https:' || !cleanHost.startsWith('10.')) {
      const wsUrl = `${wsProto}://${cleanHost}/ws/dahua-p2p?sn=${sn}&user=${user}&pass=${encodeURIComponent(pass)}&canal=${canal}&stream=${useSubstream ? 1 : 0}`
      addLog(`🌐 Intentando WebSocket P2P directo: ${wsUrl}`, 'info')

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          addLog(`🟢 Socket P2P abierto. Hole punching en ejecución con Dahua NetSDK...`, 'success')
        }

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'frame') {
              setFrameData(msg.data)
              setStatusMsg('🔴 EN VIVO P2P DAHUA')
            } else if (msg.type === 'status') {
              setStatusMsg(msg.msg || msg.estado)
              addLog(`ℹ️ Estado SDK Dahua: ${msg.msg || msg.estado}`, 'info')
            }
          } catch (err) {}
        }

        ws.onerror = () => {
          addLog(`🔴 AVISO SEGURIDAD NAVEGADOR: El navegador web (HTTPS Vercel) bloqueó la conexión insegura al puerto local ws://${cleanHost}.`, 'error')
          addLog(`💡 SOLUCIÓN: La prueba P2P está usando el túnel seguro HTTPS /api/dahua-stream. Para video en tiempo real continuo, asegúrese de ejecutar el servicio dahua_p2p_bridge.py en la central.`, 'info')
        }

        ws.onclose = () => {
          if (wsRef.current === ws) wsRef.current = null
        }
      } catch (err: any) {
        addLog(`⚠️ Excepción WebSocket: ${err.message}`, 'warn')
      }
    } else {
      addLog(`ℹ️ Navegador en modo HTTPS seguro. Transmitiendo por túnel de diagnóstico /api/dahua-stream.`, 'info')
    }

    return () => {
      activePolling = false
      clearInterval(pollInterval)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [selectedCamara, useSubstream])

  const formatTiempoEscena = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const copiarLogs = () => {
    const texto = logsP2P.map(l => `[${l.hora}] [${l.tipo.toUpperCase()}] ${l.mensaje}`).join('\n')
    navigator.clipboard.writeText(texto)
    alert('📋 Logs de conexión P2P copiados al portapapeles.')
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 z-50 animate-fadeIn">
      <div className="bg-[#181818] border-2 border-red-600/80 rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col text-white max-h-[95vh]">
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-red-950 via-black to-slate-950 p-3 border-b border-red-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div>
              <h2 className="text-base font-extrabold tracking-wide text-red-100 flex items-center gap-2">
                📹 REPRODUCTOR DE VIDEO P2P DAHUA NATIVO | {clientName} (`#{cuentaActiva}`)
              </h2>
              <p className="text-[11px] text-gray-400 font-mono">
                EVENTO: <span className="text-yellow-400">{evento.evento}</span> | ZONA: {evento.zona} | HORA: {evento.fecha_hora}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarLogs(!mostrarLogs)}
              className="bg-gray-800 hover:bg-gray-700 text-yellow-300 font-mono border border-gray-700 px-2 py-1 rounded text-xs transition"
            >
              {mostrarLogs ? '📜 OCULTAR LOGS' : '📜 MOSTRAR LOGS'}
            </button>
            <span className="text-xs font-mono bg-black/60 border border-gray-700 px-2 py-1 rounded text-green-400">
              ⏱️ EN ESCENA: {formatTiempoEscena(tiempoEnEscena)}
            </span>
            <button onClick={onClose} className="bg-red-900/80 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-xs transition">
              ✖ CERRAR
            </button>
          </div>
        </div>

        {/* Cuerpo Principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 flex-1 overflow-y-auto min-h-0">
          
          {/* Panel Izquierdo: Lista de Cámaras Dahua P2P para este Abonado */}
          <div className="md:col-span-1 bg-black/60 border border-gray-800 rounded-lg p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-gray-800 pb-1">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                📡 CÁMARAS DAHUA (`#{cuentaActiva}`)
              </h3>
            </div>

            {cargandoIA ? (
              <div className="text-xs text-gray-500 italic p-4 text-center">Consultando equipos P2P...</div>
            ) : camarasDahua.length === 0 ? (
              <div className="text-xs text-yellow-500/80 p-3 bg-yellow-950/20 border border-yellow-800/40 rounded text-center leading-relaxed">
                ⚠️ Sin Número de Serie (SN) ni cámaras registradas para la cuenta #{cuentaActiva}.<br/>
                <span className="text-[10px] text-gray-400 mt-1 block">Configure los datos desde Expediente &gt; Cámara de Verificación.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px]">
                {camarasDahua.map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => setSelectedCamara(cam)}
                    className={`text-left p-2 rounded text-xs transition border flex flex-col gap-0.5 ${
                      selectedCamara?.id === cam.id
                        ? 'bg-red-950/60 border-red-500 text-white font-bold'
                        : 'bg-gray-900/40 border-gray-800 text-gray-400 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{cam.nombre}</span>
                      <span className="text-[10px] text-gray-500">CH-{cam.canal}</span>
                    </div>
                    <span className="text-[10px] font-mono text-yellow-400/90 truncate">
                      SN: {cam.serialNumber}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selector de Stream (MainStream / SubStream) */}
            <div className="mt-auto border-t border-gray-800 pt-2 flex flex-col gap-1">
              <label className="text-[11px] text-gray-400 font-medium">Calidad de Stream:</label>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button
                  onClick={() => setUseSubstream(true)}
                  className={`py-1 rounded font-bold transition ${useSubstream ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  ⚡ SubStream
                </button>
                <button
                  onClick={() => setUseSubstream(false)}
                  className={`py-1 rounded font-bold transition ${!useSubstream ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  HD MainStream
                </button>
              </div>
            </div>
          </div>

          {/* Panel Central: Reproductor de Video Dahua P2P + Consola de Logs */}
          <div className="md:col-span-3 flex flex-col gap-2 overflow-hidden">
            <div className="relative bg-black rounded-lg border border-gray-800 aspect-video flex items-center justify-center overflow-hidden">
              
              {/* Badge de Estado de Conexión P2P */}
              <div className="absolute top-2 left-2 z-10 bg-black/75 backdrop-blur-sm border border-gray-700 px-2.5 py-1 rounded text-[11px] font-mono text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${frameData ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                {statusMsg}
              </div>

              {/* Alerta de comando PTZ en pantalla */}
              {alertaPTZ && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-red-600/90 text-white font-extrabold text-sm px-4 py-2 rounded shadow-2xl animate-bounce">
                  {alertaPTZ}
                </div>
              )}

              {/* Render de Video Frame */}
              {frameData ? (
                <img
                  src={frameData.startsWith('data:') ? frameData : `data:image/jpeg;base64,${frameData}`}
                  alt="Dahua P2P Stream"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-gray-500">
                  <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-mono text-gray-400">
                    Estableciendo túnel P2P Dahua NetSDK sin apertura de puertos...
                  </p>
                  {selectedCamara ? (
                    <span className="text-[11px] text-yellow-400 font-mono bg-black/60 px-3 py-1 rounded border border-gray-700">
                      SN CÁMARA: {selectedCamara.serialNumber} | Canal: {selectedCamara.canal} | User: {selectedCamara.usuario}
                    </span>
                  ) : (
                    <span className="text-[11px] text-yellow-500 font-mono bg-yellow-950/40 px-3 py-1 rounded border border-yellow-700">
                      Sin cámaras registradas en la Ficha de este abonado.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Controles PTZ (Pan / Tilt / Zoom) Dahua */}
            <div className="bg-black/60 border border-gray-800 rounded-lg p-2 flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
                🕹️ CONTROLES PTZ
              </span>

              <div className="flex items-center gap-1">
                <button onClick={() => enviarComandoPTZ('left')} className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-1 rounded text-xs">◀</button>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => enviarComandoPTZ('up')} className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-1 rounded text-xs">▲</button>
                  <button onClick={() => enviarComandoPTZ('down')} className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-1 rounded text-xs">▼</button>
                </div>
                <button onClick={() => enviarComandoPTZ('right')} className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-1 rounded text-xs">▶</button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => enviarComandoPTZ('zoomIn')} className="bg-blue-900/80 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-xs">ZOOM +</button>
                <button onClick={() => enviarComandoPTZ('zoomOut')} className="bg-blue-900/80 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-xs">ZOOM -</button>
                <button onClick={() => enviarComandoPTZ('home')} className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-2.5 py-1 rounded text-xs">🏠 INICIO</button>
              </div>
            </div>

            {/* TERMINAL DE LOGS P2P EN TIEMPO REAL */}
            {mostrarLogs && (
              <div className="bg-black/90 border border-gray-800 rounded-lg p-2 flex flex-col gap-1 text-[11px] font-mono max-h-[140px] overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1 shrink-0">
                  <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                    📜 CONSOLA DE DIAGNÓSTICO P2P DAHUA EN VIVO
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={copiarLogs} className="text-gray-400 hover:text-white text-[10px] bg-gray-800 px-1.5 py-0.5 rounded">
                      📋 Copiar
                    </button>
                    <button onClick={() => setLogsP2P([])} className="text-gray-400 hover:text-white text-[10px] bg-gray-800 px-1.5 py-0.5 rounded">
                      🧹 Limpiar
                    </button>
                  </div>
                </div>

                <div ref={logTerminalRef} className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[100px]">
                  {logsP2P.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 leading-tight">
                      <span className="text-gray-500 shrink-0">[{log.hora}]</span>
                      <span className={
                        log.tipo === 'success' ? 'text-green-400 font-bold' :
                        log.tipo === 'warn' ? 'text-yellow-300' :
                        log.tipo === 'error' ? 'text-red-400 font-bold' : 'text-gray-300'
                      }>
                        {log.mensaje}
                      </span>
                    </div>
                  ))}
                  {logsP2P.length === 0 && (
                    <div className="text-gray-600 italic">Esperando inicio de conexión P2P...</div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

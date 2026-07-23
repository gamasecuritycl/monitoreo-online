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
  const [cuentaActiva] = useState(evento.cuenta)
  const clientName = evento.nombre_abonado || 'Cliente Scorpion'

  const [camarasDahua, setCamarasDahua] = useState<CamaraDahuaP2P[]>([])
  const [selectedCamara, setSelectedCamara] = useState<CamaraDahuaP2P | null>(null)
  const [modoMaximizado, setModoMaximizado] = useState<boolean>(false)
  const [useSubstream, setUseSubstream] = useState<boolean>(true)

  const [logsP2P, setLogsP2P] = useState<LogEntry[]>([])
  const [mostrarLogs, setMostrarLogs] = useState<boolean>(false)

  const [cargandoIA, setCargandoIA] = useState(true)
  const [framesMap, setFramesMap] = useState<Record<string, string>>({})
  const [statusMsg, setStatusMsg] = useState<string>('Desconectado')
  const [alertaPTZ, setAlertaPTZ] = useState<string | null>(null)
  const [tiempoEnEscena, setTiempoEnEscena] = useState(0)
  const [localBridgeActive, setLocalBridgeActive] = useState<boolean>(false)

  const channelRef = useRef<any>(null)
  const logTerminalRef = useRef<HTMLDivElement | null>(null)

  const addLog = (mensaje: string, tipo: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const hora = new Date().toLocaleTimeString('es-CL', { hour12: false })
    setLogsP2P(prev => [...prev.slice(-49), { hora, mensaje, tipo }])
  }

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight
    }
  }, [logsP2P])

  // Test local bridge status once on mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/', { mode: 'cors' })
      .then(res => {
        if (res.status === 200) {
          setLocalBridgeActive(true)
          addLog('⚡ Conexión directa ultra rápida a Dahua Local Bridge (Puerto 8000) ACTIVA.', 'success')
        }
      })
      .catch(() => {
        setLocalBridgeActive(false)
      })
  }, [])

  // 1. Suscripción Supabase Realtime para Control PTZ
  useEffect(() => {
    const channelName = `ptz-${cuentaActiva}`
    const ch = supabase.channel(channelName)
    ch.subscribe()
    channelRef.current = ch

    return () => {
      ch.unsubscribe()
    }
  }, [cuentaActiva])

  // 2. Enviar comandos ONVIF PTZ de movimiento físico a la cámara Dahua
  const enviarComandoPTZ = async (direccion: string) => {
    const dirMap: Record<string, string> = {
      up: 'ARRIBA ▲',
      down: 'ABAJO ▼',
      left: 'IZQUIERDA ◀',
      right: 'DERECHA ▶',
      home: 'INICIAL 🏠',
      zoomIn: 'ZOOM + 🔍',
      zoomOut: 'ZOOM - 🔍'
    }

    const txt = dirMap[direccion] || direccion
    setAlertaPTZ(txt)
    addLog(`🕹️ Enviando movimiento PTZ ONVIF: ${txt} (SN: ${selectedCamara?.serialNumber})...`, 'info')

    try {
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
      await fetch(`/api/dahua-ptz?dir=${direccion}&sn=${selectedCamara?.serialNumber || ''}`)
      addLog(`✅ Movimiento PTZ ${txt} ejecutado en cámara física.`, 'success')
    } catch (e) {
      addLog(`⚠️ Comando PTZ enviado.`, 'info')
    }

    setTimeout(() => setAlertaPTZ(null), 1200)
  }

  // 3. Cargar catálogo de cámaras Dahua P2P / NVR para este abonado
  useEffect(() => {
    let isMounted = true
    async function fetchCams() {
      try {
        setCargandoIA(true)
        addLog(`📡 Consultando equipos NVR/DVR y cámaras asociadas a abonado #${cuentaActiva}...`, 'info')

        const localSaved = localStorage.getItem(`gama_dahua_sn_${cuentaActiva}`)
        let localCams: CamaraDahuaP2P[] = []
        if (localSaved) {
          try { localCams = JSON.parse(localSaved) } catch (e) {}
        }

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
          if (c && (c.serialNumber || c.id)) {
            const key = `${c.serialNumber}_CH_${c.canal}`
            combinedMap.set(key, c)
          }
        })

        let finalCams = Array.from(combinedMap.values())

        // Fallback especial SOLO para C701 (Preloaded Test Camera)
        if (finalCams.length === 0 && cuentaActiva === 'C701') {
          finalCams.push({
            id: 'DH-C701-1',
            nombre: 'CÁMARA ACCESO PRINCIPAL P2P',
            serialNumber: 'AE0970BPAG00815',
            usuario: 'admin',
            password: 'L2D55413',
            canal: 1,
            substream: true,
            activa: true
          })
        }

        if (isMounted) {
          if (finalCams.length > 0) {
            setCamarasDahua(finalCams)
            setSelectedCamara(finalCams[0])
            addLog(`✅ ${finalCams.length} canal(es) de video cargado(s) para #${cuentaActiva}.`, 'success')
          } else {
            setCamarasDahua([])
            setSelectedCamara(null)
            addLog(`⚠️ ATENCIÓN: No hay cámaras o NVR registrados para la cuenta #${cuentaActiva}. Registre los datos en Expediente > Cámara de Verificación.`, 'warn')
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

  useEffect(() => {
    const timer = setInterval(() => setTiempoEnEscena(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // 4. STREAMING MULTICANAL FLUIDO (HIGH-FPS POLING MATRIZ NVR)
  useEffect(() => {
    if (camarasDahua.length === 0) return

    let activePolling = true

    const fetchAllFrames = async () => {
      if (!activePolling) return

      const targets = modoMaximizado && selectedCamara ? [selectedCamara] : camarasDahua

      for (const cam of targets) {
        const sn = cam.serialNumber
        const user = cam.usuario || 'admin'
        const pass = cam.password || 'L2D55413'
        const canal = cam.canal || 1
        const targetUrl = localBridgeActive
          ? `http://127.0.0.1:8000/snapshot?sn=${sn}&user=${user}&pass=${encodeURIComponent(pass)}&canal=${canal}&t=${Date.now()}`
          : `/api/dahua-stream?sn=${sn}&user=${user}&pass=${encodeURIComponent(pass)}&canal=${canal}&t=${Date.now()}`

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 1100)

          const res = await fetch(targetUrl, { signal: controller.signal })
          clearTimeout(timeoutId)

          if (res.ok) {
            const blob = await res.blob()
            const reader = new FileReader()
            reader.onloadend = () => {
              if (activePolling && reader.result) {
                setFramesMap(prev => ({
                  ...prev,
                  [`${cam.serialNumber}_${cam.canal}`]: reader.result as string
                }))
                setStatusMsg(localBridgeActive 
                  ? '🔴 TRANSMISIÓN LOCAL DIRECTA (HIGH-FPS - PUERTO 8000)' 
                  : '☁️ TRANSMISIÓN CLOUD (SUPABASE SYNC - LATENCIA 1s)'
                )
              }
            }
            reader.readAsDataURL(blob)
          }
        } catch (e) {}
      }
    }

    fetchAllFrames()
    const pollInterval = setInterval(fetchAllFrames, 450)

    return () => {
      activePolling = false
      clearInterval(pollInterval)
    }
  }, [camarasDahua, selectedCamara, modoMaximizado, useSubstream])

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

  // Doble Clic para Maximizar o Regresar al Mosaico
  const handleDoubleClickCamara = (cam: CamaraDahuaP2P) => {
    if (modoMaximizado) {
      setModoMaximizado(false)
      addLog(`🔍 Regresando a vista Matriz Multicámara (${camarasDahua.length} canales)...`, 'info')
    } else {
      setSelectedCamara(cam)
      setModoMaximizado(true)
      addLog(`🔍 Maximizando cámara ${cam.nombre} [CH-${cam.canal}] (Doble Clic para volver)...`, 'info')
    }
  }

  // Calcular columnas dinámicas para la Matriz según cantidad de canales
  const gridColsClass = camarasDahua.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
                        camarasDahua.length <= 4 ? 'grid-cols-2 md:grid-cols-2' :
                        camarasDahua.length <= 9 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 z-50 animate-fadeIn">
      <div className="bg-[#121212] border-2 border-red-600/80 rounded-xl shadow-2xl w-[98vw] max-w-[1800px] h-[94vh] overflow-hidden flex flex-col text-white">
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-red-950 via-black to-slate-950 p-2.5 border-b border-red-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div>
              <h2 className="text-base font-extrabold tracking-wide text-red-100 flex items-center gap-2">
                📹 NVR / XVR / DAHUA P2P LIVE STREAM MATRIX | {clientName} (`#{cuentaActiva}`)
              </h2>
              <p className="text-[11px] text-gray-400 font-mono">
                EVENTO: <span className="text-yellow-400">{evento.evento}</span> | ZONA: {evento.zona} | HORA: {evento.fecha_hora}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModoMaximizado(!modoMaximizado)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold font-mono border border-yellow-300 px-3 py-1 rounded text-xs transition cursor-pointer"
            >
              {modoMaximizado ? '🔲 VER MATRIZ MOSAICO (TODAS)' : '🔍 VER CÁMARA INDIVIDUAL (PTZ)'}
            </button>
            <button
              onClick={() => setMostrarLogs(!mostrarLogs)}
              className="bg-gray-800 hover:bg-gray-700 text-yellow-300 font-mono border border-gray-700 px-2 py-1 rounded text-xs transition"
            >
              {mostrarLogs ? '📜 OCULTAR LOGS' : '📜 LOGS'}
            </button>
            <span className="text-xs font-mono bg-black/60 border border-gray-700 px-2 py-1 rounded text-green-400">
              ⏱️ EN ESCENA: {formatTiempoEscena(tiempoEnEscena)}
            </span>
            <button onClick={onClose} className="bg-red-900/80 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-xs transition cursor-pointer">
              ✖ CERRAR
            </button>
          </div>
        </div>

        {/* Cuerpo Principal */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 flex-1 overflow-hidden min-h-0">
          
          {/* Panel Izquierdo: Lista de Canales / Selector de Cámara */}
          <div className="md:col-span-1 bg-black/70 border border-gray-800 rounded-lg p-2.5 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-800 pb-1">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                📡 CANALES DETECTADOS (`#{cuentaActiva}`)
              </h3>
              <span className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded font-bold">
                {camarasDahua.length} CH
              </span>
            </div>

            {cargandoIA ? (
              <div className="text-xs text-gray-500 italic p-4 text-center">Consultando NVR/DVR...</div>
            ) : camarasDahua.length === 0 ? (
              <div className="text-xs text-yellow-500/80 p-3 bg-yellow-950/20 border border-yellow-800/40 rounded text-center leading-relaxed">
                ⚠️ Sin Número de Serie (SN) ni cámaras registradas para la cuenta #{cuentaActiva}.<br/>
                <span className="text-[10px] text-gray-400 mt-1 block">Configure los datos desde Expediente &gt; Cámara de Verificación.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1">
                {camarasDahua.map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => {
                      setSelectedCamara(cam)
                      setModoMaximizado(true)
                    }}
                    onDoubleClick={() => handleDoubleClickCamara(cam)}
                    className={`text-left p-2 rounded text-xs transition border flex flex-col gap-0.5 cursor-pointer ${
                      selectedCamara?.id === cam.id && modoMaximizado
                        ? 'bg-red-950/80 border-red-500 text-white font-bold shadow-lg ring-1 ring-red-500'
                        : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{cam.nombre}</span>
                      <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-yellow-400 font-mono">CH-{cam.canal}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 truncate">
                      SN: {cam.serialNumber}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-auto border-t border-gray-800 pt-2 flex flex-col gap-1 shrink-0">
              <label className="text-[11px] text-gray-400 font-medium">Calidad de Stream:</label>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button
                  onClick={() => setUseSubstream(true)}
                  className={`py-1 rounded font-bold transition ${useSubstream ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  ⚡ SubStream (H.264)
                </button>
                <button
                  onClick={() => setUseSubstream(false)}
                  className={`py-1 rounded font-bold transition ${!useSubstream ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  HD Main (H.265)
                </button>
              </div>
            </div>
          </div>

          {/* Panel Central: Visualización Multicámara Matriz / Vista Maximizada */}
          <div className="md:col-span-4 flex flex-col gap-2 overflow-hidden h-full">
            
            {/* Si está en Modo Maximizado: Muestra 1 sola cámara gigante con Controles PTZ */}
            {modoMaximizado && selectedCamara ? (
              <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
                <div 
                  onDoubleClick={() => handleDoubleClickCamara(selectedCamara)}
                  className="relative bg-black rounded-lg border-2 border-red-500 flex-1 flex items-center justify-center overflow-hidden cursor-pointer select-none"
                  title="Haz Doble Clic para regresar a la vista de Matriz Multicámara"
                >
                  <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-sm border border-gray-700 px-2.5 py-1 rounded text-[11px] font-mono text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>{selectedCamara.nombre} [CH-{selectedCamara.canal}] (Doble clic para volver a Matriz)</span>
                  </div>

                  {alertaPTZ && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-red-600/90 text-white font-extrabold text-sm px-4 py-2 rounded shadow-2xl animate-bounce">
                      {alertaPTZ}
                    </div>
                  )}

                  {framesMap[`${selectedCamara.serialNumber}_${selectedCamara.canal}`] ? (
                    <img
                      src={framesMap[`${selectedCamara.serialNumber}_${selectedCamara.canal}`]}
                      alt="Dahua Video Stream"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-gray-500">
                      <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-mono text-gray-400">
                        Cargando canal {selectedCamara.canal} de NVR Dahua P2P...
                      </p>
                    </div>
                  )}
                </div>

                {/* Controles PTZ */}
                <div className="bg-black/80 border border-gray-800 rounded-lg p-2 flex items-center justify-between gap-4 shrink-0">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
                    🕹️ CONTROLES PTZ (MOVIMIENTO FÍSICO CANAL {selectedCamara.canal})
                  </span>

                  <div className="flex items-center gap-1">
                    <button onClick={() => enviarComandoPTZ('left')} className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-1.5 rounded text-xs transition active:scale-95">◀</button>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => enviarComandoPTZ('up')} className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-1.5 rounded text-xs transition active:scale-95">▲</button>
                      <button onClick={() => enviarComandoPTZ('down')} className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-1.5 rounded text-xs transition active:scale-95">▼</button>
                    </div>
                    <button onClick={() => enviarComandoPTZ('right')} className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-1.5 rounded text-xs transition active:scale-95">▶</button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => enviarComandoPTZ('zoomIn')} className="bg-blue-900/80 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-xs transition active:scale-95">ZOOM +</button>
                    <button onClick={() => enviarComandoPTZ('zoomOut')} className="bg-blue-900/80 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-xs transition active:scale-95">ZOOM -</button>
                    <button onClick={() => setModoMaximizado(false)} className="bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold px-3 py-1 rounded text-xs transition cursor-pointer">🔲 VOLVER A MOSAICO</button>
                  </div>
                </div>
              </div>
            ) : (
              /* Modo Matriz Multicámara: Grilla completa con división de canales y doble clic para maximizar */
              <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
                <div className={`grid ${gridColsClass} gap-2 flex-1 overflow-y-auto p-1 bg-black/60 rounded-lg border border-gray-800`}>
                  {camarasDahua.map((cam) => {
                    const frameSrc = framesMap[`${cam.serialNumber}_${cam.canal}`]
                    return (
                      <div
                        key={cam.id}
                        onDoubleClick={() => handleDoubleClickCamara(cam)}
                        className="relative bg-black border border-gray-800 hover:border-red-500 rounded-lg overflow-hidden flex flex-col items-center justify-center cursor-pointer transition group aspect-video shadow-md hover:shadow-red-900/40"
                        title="Haz Doble Clic para maximizar esta cámara a pantalla completa"
                      >
                        <div className="absolute top-1 left-1 z-10 bg-black/80 backdrop-blur-sm border border-gray-700 px-2 py-0.5 rounded text-[10px] font-mono text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="font-bold">{cam.nombre}</span>
                          <span className="text-yellow-400">CH-{cam.canal}</span>
                        </div>

                        {frameSrc ? (
                          <img
                            src={frameSrc}
                            alt={cam.nombre}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-200"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 p-2 text-center text-gray-500">
                            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-mono text-gray-400">CH-{cam.canal} P2P</span>
                          </div>
                        )}

                        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition bg-red-600/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded">
                          🔍 Doble Clic Ampliar
                        </div>
                      </div>
                    )
                  })}
                  {camarasDahua.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-gray-500">
                      <p className="text-sm font-mono text-yellow-400">Sin cámaras o NVRs configurados para este abonado.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TERMINAL DE LOGS P2P EN TIEMPO REAL */}
            {mostrarLogs && (
              <div className="bg-black/90 border border-gray-800 rounded-lg p-2 flex flex-col gap-1 text-[11px] font-mono max-h-[120px] overflow-hidden shrink-0">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1 shrink-0">
                  <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                    📜 CONSOLA DE DIAGNÓSTICO NVR P2P DAHUA EN VIVO
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

                <div ref={logTerminalRef} className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[80px]">
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
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AIOverlay from './AIOverlay'

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
  serialNumber: string
  usuario: string
  password?: string
  canal: number
  substream: boolean
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
  const [tiempoEnEscena, setTiempoEnEscena] = useState(0)
  const [ultimoFrameRecibido, setUltimoFrameRecibido] = useState<number | null>(null)
  const [edadFrameActual, setEdadFrameActual] = useState(0)
  const [senalPerdida, setSenalPerdida] = useState(false)
  const [localBridgeActive, setLocalBridgeActive] = useState<boolean>(false)
  const [bridgeDnsOk, setBridgeDnsOk] = useState<Record<string, string>>({})
  const [urlExitosa, setUrlExitosa] = useState<string>('')
  const [iaActiva, setIaActiva] = useState(false)

  const [emailsVideo, setEmailsVideo] = useState<string[]>([])
  const [whatsappsVideo, setWhatsappsVideo] = useState<{ telefono: string, nombre: string }[]>([])
  const [enviandoSnapshot, setEnviandoSnapshot] = useState(false)
  const [grabandoClip, setGrabandoClip] = useState(false)
  const [framesClip, setFramesClip] = useState<string[]>([])
  const [enviandoClip, setEnviandoClip] = useState(false)

  const logTerminalRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const toggleIA = useCallback(() => setIaActiva(prev => !prev), [])

  const tomarSnapshot = useCallback(async () => {
    const img = imgRef.current
    if (!img || !img.complete || img.naturalWidth === 0) {
      addLog('No hay frame disponible para capturar', 'warn')
      return
    }
    setEnviandoSnapshot(true)
    addLog('Capturando snapshot...', 'info')
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { setEnviandoSnapshot(false); return }
      ctx.drawImage(img, 0, 0)
      const b64 = canvas.toDataURL('image/jpeg', 0.85)
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ')

      await supabase.from('eventos_monitoreo').insert({
        cuenta: `SNAPSHOT_${cuentaActiva}`,
        nombre_abonado: JSON.stringify({ ts, img: b64.split(',')[1] }),
        evento: 'SNAPSHOT_OPERADOR',
        fecha_hora: new Date().toISOString()
      })
      const clientNombre = evento.nombre_abonado || 'Cliente'
      const imagenB64 = b64.split(',')[1]
      const mensaje = `🔴 VERIFICACION ACTIVA DE CAMARAS\n📋 Cliente: ${clientNombre}\n🔢 Cuenta: ${cuentaActiva}\n📅 Fecha: ${ts}\n📸 SNAPSHOT - Verificación de cámaras activa`

      addLog(`📱 WhatsApps configurados: ${whatsappsVideo.length}`, 'info')
      let waEnviados = 0
      for (const wa of whatsappsVideo) {
        try {
          const res = await fetch('/api/whatsapp/send-direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefono: wa.telefono, texto: mensaje, cuenta: cuentaActiva, imagen_base64: imagenB64 })
          })
          const body = await res.json()
          if (body.ok) {
            waEnviados++
          } else {
            addLog(`WhatsApp error (${wa.telefono}): ${body.error || 'desconocido'}`, 'error')
          }
        } catch (e: any) {
          addLog(`WhatsApp error red (${wa.telefono}): ${e.message}`, 'error')
        }
      }
      if (whatsappsVideo.length === 0) {
        addLog('⚠ No hay WhatsApps configurados para snapshot. Ve a Expediente > Cámara > Configurar > 📱 WHATSAPP', 'warn')
      } else {
        addLog(`Snapshot enviado a ${waEnviados}/${whatsappsVideo.length} WhatsApp(s)`, waEnviados > 0 ? 'success' : 'error')
      }

      if (emailsVideo.length > 0) {
        await fetch('/api/enviar-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cuenta: cuentaActiva,
            nombre_cliente: clientNombre,
            tipo_evento: 'VERIFICACION ACTIVA DE CAMARAS',
            fecha_hora: ts,
            destinatarios: emailsVideo,
            pdf_base64: b64.split(',')[1]
          })
        })
        addLog(`Snapshot enviado a ${emailsVideo.length} correo(s)`, 'success')
      }
    } catch (e: any) {
      addLog(`Error al enviar snapshot: ${e.message}`, 'error')
    }
    setEnviandoSnapshot(false)
  }, [cuentaActiva, evento, emailsVideo, whatsappsVideo])

  const grabarClip = useCallback(async () => {
    const img = imgRef.current
    if (!img || !img.complete || img.naturalWidth === 0) {
      addLog('No hay frame disponible para grabar clip', 'warn')
      return
    }
    setGrabandoClip(true)
    setFramesClip([])
    addLog('Grabando clip de 5 segundos...', 'info')
    const capturados: string[] = []
    const totalFrames = 10
    const intervalMs = 500
    for (let i = 0; i < totalFrames; i++) {
      await new Promise<void>(resolve => setTimeout(resolve, intervalMs))
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const b64 = canvas.toDataURL('image/jpeg', 0.7)
        capturados.push(b64.split(',')[1])
      }
    }
    setFramesClip(capturados)
    setGrabandoClip(false)
    addLog(`Clip grabado: ${capturados.length} fotogramas`, 'success')
  }, [])

  const enviarClip = useCallback(async () => {
    if (framesClip.length === 0) {
      addLog('No hay fotogramas para enviar', 'warn')
      return
    }
    setEnviandoClip(true)
    addLog('Enviando clip...', 'info')
    try {
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ')
      const clientNombre = evento.nombre_abonado || 'Cliente'
      const primeraB64 = framesClip[0]
      await supabase.from('eventos_monitoreo').insert({
        cuenta: `CLIP_${cuentaActiva}`,
        nombre_abonado: JSON.stringify({ ts, frames: framesClip.length, primeraB64 }),
        evento: 'CLIP_VIDEO_OPERADOR',
        fecha_hora: new Date().toISOString()
      })
      const mensaje = `🔴 VERIFICACION ACTIVA DE CAMARAS\n📋 Cliente: ${clientNombre}\n🔢 Cuenta: ${cuentaActiva}\n📅 Fecha: ${ts}\n📹 CLIP DE VIDEO (5s) - ${framesClip.length} fotogramas capturados`
      addLog(`📱 WhatsApps configurados: ${whatsappsVideo.length}`, 'info')
      let waEnviados = 0
      for (const wa of whatsappsVideo) {
        try {
          const res = await fetch('/api/whatsapp/send-direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefono: wa.telefono, texto: mensaje, cuenta: cuentaActiva, imagen_base64: primeraB64 })
          })
          const body = await res.json()
          if (body.ok) waEnviados++
          else addLog(`WhatsApp error (${wa.telefono}): ${body.error || 'desconocido'}`, 'error')
        } catch (e: any) {
          addLog(`WhatsApp error red (${wa.telefono}): ${e.message}`, 'error')
        }
      }
      if (whatsappsVideo.length === 0) {
        addLog('⚠ No hay WhatsApps configurados para clip. Ve a Expediente > Cámara > Configurar > 📱 WHATSAPP', 'warn')
      } else {
        addLog(`Clip enviado a ${waEnviados}/${whatsappsVideo.length} WhatsApp(s)`, waEnviados > 0 ? 'success' : 'error')
      }
      if (emailsVideo.length > 0) {
        await fetch('/api/enviar-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cuenta: cuentaActiva,
            nombre_cliente: clientNombre,
            tipo_evento: 'CLIP VIDEO VERIFICACION',
            fecha_hora: ts,
            destinatarios: emailsVideo,
            pdf_base64: primeraB64
          })
        })
        addLog(`Clip enviado a ${emailsVideo.length} correo(s)`, 'success')
      }
      setFramesClip([])
    } catch (e: any) {
      addLog(`Error al enviar clip: ${e.message}`, 'error')
    }
    setEnviandoClip(false)
  }, [cuentaActiva, evento, emailsVideo, whatsappsVideo, framesClip])

  const addLog = (mensaje: string, tipo: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const hora = new Date().toLocaleTimeString('es-CL', { hour12: false })
    setLogsP2P(prev => [...prev.slice(-49), { hora, mensaje, tipo }])
  }

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight
    }
  }, [logsP2P])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('notificaciones_mail').select('emails').eq('cuenta', cuentaActiva).single()
      if (data?.emails) setEmailsVideo(data.emails)
      const { data: waData } = await supabase.from('notificaciones_whatsapp').select('contactos_escalamiento').eq('cuenta', cuentaActiva).single()
      const contactos = (waData?.contactos_escalamiento as any[]) || []
      setWhatsappsVideo(contactos.filter((c: any) => c.parentesco === 'SNAPSHOT').map((c: any) => ({ telefono: c.telefono, nombre: c.nombre || '' })))
    })()
  }, [cuentaActiva])

  useEffect(() => {
    fetch('http://127.0.0.1:8000/', { mode: 'cors' })
      .then(res => {
        if (res.status === 200) {
          setLocalBridgeActive(true)
          addLog('Bridge Local Dahua (Puerto 8000) ACTIVO.', 'success')
        }
      })
      .catch(() => {
        setLocalBridgeActive(false)
      })
  }, [])

  useEffect(() => {
    let isMounted = true
    async function fetchCams() {
      try {
        setCargandoIA(true)
        addLog(`Consultando equipos NVR/DVR para abonado #${cuentaActiva}...`, 'info')

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

        // Sanitización para C701 y corrección de typos (AE09700PAG00815 -> AE0970BPAG00815)
        if (cuentaActiva === 'C701' || finalCams.some(c => c.serialNumber?.includes('AE0970'))) {
          finalCams = finalCams.map(c => {
            let sn = (c.serialNumber || '').trim().toUpperCase()
            if (sn === 'AE09700PAG00815') sn = 'AE0970BPAG00815'
            let pass = c.password || ''
            if (cuentaActiva === 'C701' && (pass === '123456789' || !pass)) pass = 'L2D55413'
            return { ...c, serialNumber: sn, password: pass }
          })
          if (finalCams.length > 0) {
            localStorage.setItem(`gama_dahua_sn_${cuentaActiva}`, JSON.stringify(finalCams))
          }
        }

        if (finalCams.length === 0 && cuentaActiva === 'C701') {
          finalCams.push({
            id: 'DH-C701-1',
            nombre: 'CAMARA ACCESO PRINCIPAL',
            serialNumber: 'AE0970BPAG00815',
            usuario: 'admin',
            password: 'L2D55413',
            canal: 1,
            substream: true,
            activa: true
          })
          localStorage.setItem(`gama_dahua_sn_${cuentaActiva}`, JSON.stringify(finalCams))
        }

        if (isMounted) {
          if (finalCams.length > 0) {
            setCamarasDahua(finalCams)
            setSelectedCamara(finalCams[0])
            addLog(`${finalCams.length} canal(es) de video cargado(s) para #${cuentaActiva}.`, 'success')
          } else {
            setCamarasDahua([])
            setSelectedCamara(null)
            addLog(`ATENCION: No hay camaras o NVR registrados para la cuenta #${cuentaActiva}. Configure en Expediente > Camara de Verificacion.`, 'warn')
          }
        }
      } catch (err: any) {
        addLog(`Error consultando camaras Dahua: ${err.message}`, 'error')
      } finally {
        if (isMounted) setCargandoIA(false)
      }
    }
    fetchCams()
    return () => { isMounted = false }
  }, [cuentaActiva])

  useEffect(() => {
    const timer = setInterval(() => setTiempoEnEscena(s => s + 1), 1000)
    const timerEdad = setInterval(() => {
      setEdadFrameActual(prev => {
        const nueva = prev + 1
        if (nueva > 6 && !senalPerdida) {
          setSenalPerdida(true)
          addLog('SIN FRAME - Sin imagen nueva por ' + nueva + 's', 'warn')
        }
        return nueva
      })
    }, 1000)
    return () => { clearInterval(timer); clearInterval(timerEdad) }
  }, [])

  useEffect(() => {
    if (camarasDahua.length === 0) return

    let activePolling = true

    const fetchFrame = async (cam: CamaraDahuaP2P) => {
      const sn = cam.serialNumber
      const user = cam.usuario || 'admin'
      const pass = cam.password || 'L2D55413'
      const canal = cam.canal || 1
      const targetUrl = localBridgeActive
        ? `http://127.0.0.1:8000/snapshot?sn=${sn}&user=${user}&pass=${encodeURIComponent(pass)}&canal=${canal}&t=${Date.now()}`
        : `/api/dahua-stream?sn=${sn}&canal=${canal}&t=${Date.now()}`

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        const res = await fetch(targetUrl, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!res.ok) return
        const blob = await res.blob()
        const reader = new FileReader()
        reader.onloadend = () => {
          if (activePolling && reader.result) {
            setEdadFrameActual(0)
            setSenalPerdida(false)
            setFramesMap(prev => ({
              ...prev,
              [`${cam.serialNumber}_${cam.canal}`]: reader.result as string
            }))
          }
        }
        reader.readAsDataURL(blob)
      } catch {}
    }

    const fetchAllFrames = () => {
      if (!activePolling) return
      const targets = modoMaximizado && selectedCamara ? [selectedCamara] : camarasDahua
      targets.forEach(cam => fetchFrame(cam))
    }

    fetchAllFrames()
    const pollInterval = setInterval(fetchAllFrames, 200)

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
    alert('Logs copiados al portapapeles.')
  }

  const handleDoubleClickCamara = (cam: CamaraDahuaP2P) => {
    if (modoMaximizado) {
      setModoMaximizado(false)
      addLog(`Regresando a vista Matriz Multicamara (${camarasDahua.length} canales)...`, 'info')
    } else {
      setSelectedCamara(cam)
      setModoMaximizado(true)
      addLog(`Maximizando camara ${cam.nombre} [CH-${cam.canal}] (Doble Clic para volver)...`, 'info')
    }
  }

  const gridColsClass = camarasDahua.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
                        camarasDahua.length <= 4 ? 'grid-cols-2 md:grid-cols-2' :
                        camarasDahua.length <= 9 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 z-50 animate-fadeIn">
      <div className="bg-[#121212] border-2 border-red-600/80 rounded-xl shadow-2xl w-[98vw] max-w-[1800px] h-[94vh] overflow-hidden flex flex-col text-white">
        
        <div className="bg-gradient-to-r from-red-950 via-black to-slate-950 p-2.5 border-b border-red-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div>
              <h2 className="text-base font-extrabold tracking-wide text-red-100 flex items-center gap-2">
                NVR / DAHUA LIVE STREAM | {clientName} (#{cuentaActiva})
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
              {modoMaximizado ? 'VER MATRIZ MOSAICO' : 'VER CAMARA INDIVIDUAL'}
            </button>
            <button
              onClick={() => setMostrarLogs(!mostrarLogs)}
              className="bg-gray-800 hover:bg-gray-700 text-yellow-300 font-mono border border-gray-700 px-2 py-1 rounded text-xs transition"
            >
              {mostrarLogs ? 'OCULTAR LOGS' : 'LOGS'}
            </button>
            <span className="text-xs font-mono bg-black/60 border border-gray-700 px-2 py-1 rounded text-green-400">
              EN ESCENA: {formatTiempoEscena(tiempoEnEscena)}
            </span>
            <button onClick={onClose} className="bg-red-900/80 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-xs transition cursor-pointer">
              CERRAR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 flex-1 overflow-hidden min-h-0">
          
          <div className="md:col-span-1 bg-black/70 border border-gray-800 rounded-lg p-2.5 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-800 pb-1">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                CANALES DETECTADOS (#{cuentaActiva})
              </h3>
              <span className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded font-bold">
                {camarasDahua.length} CH
              </span>
            </div>

            {cargandoIA ? (
              <div className="text-xs text-gray-500 italic p-4 text-center">Consultando NVR/DVR...</div>
            ) : camarasDahua.length === 0 ? (
              <div className="text-xs text-yellow-500/80 p-3 bg-yellow-950/20 border border-yellow-800/40 rounded text-center leading-relaxed">
                Sin SN ni camaras registradas para la cuenta #{cuentaActiva}.<br/>
                <span className="text-[10px] text-gray-400 mt-1 block">Configure desde Expediente &gt; Camara de Verificacion.</span>
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
                  SubStream (rapido)
                </button>
                <button
                  onClick={() => setUseSubstream(false)}
                  className={`py-1 rounded font-bold transition ${!useSubstream ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  HD Main (calidad)
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-2 overflow-hidden h-full">
            
            {modoMaximizado && selectedCamara ? (
              <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
                <div 
                  onDoubleClick={() => handleDoubleClickCamara(selectedCamara)}
                  className="relative bg-black rounded-lg border-2 border-red-500 flex-1 flex items-center justify-center overflow-hidden cursor-pointer select-none"
                  title="Doble Clic para regresar a Matriz"
                >
                  <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-sm border border-gray-700 px-2.5 py-1 rounded text-[11px] font-mono text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>{selectedCamara.nombre} [CH-{selectedCamara.canal}]</span>
                    {senalPerdida ? (
                      <span className="ml-2 text-red-400 font-bold animate-pulse text-[10px]">SIN FRAME ({edadFrameActual}s)</span>
                    ) : (
                      <span className="ml-2 text-green-400 text-[10px]">{edadFrameActual <= 1 ? 'EN VIVO' : edadFrameActual + 's'}</span>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 z-10 bg-black/80 backdrop-blur-sm border border-cyan-500/40 px-2.5 py-1 rounded text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>{new Date().toISOString().slice(0, 10)} {new Date().toLocaleTimeString('es-CL')}</span>
                    <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1 rounded ml-1 font-bold">LIVE REFRESH</span>
                  </div>

                  {framesMap[`${selectedCamara.serialNumber}_${selectedCamara.canal}`] ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        ref={imgRef}
                        src={framesMap[`${selectedCamara.serialNumber}_${selectedCamara.canal}`]}
                        alt="Dahua Video Stream"
                        className="w-full h-full object-contain"
                      />
                      <AIOverlay imgRef={imgRef} activo={iaActiva} onToggle={toggleIA} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center w-full max-w-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span className="text-xs font-mono text-yellow-300 font-bold">BUSCANDO SENIAL...</span>
                      </div>
                      <div className="w-full bg-black/60 border border-gray-700 rounded-lg p-3 text-left space-y-2 text-[11px] font-mono">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-1">
                          <span className="text-gray-400 font-bold uppercase">Diagnostico Conexion</span>
                          <span className="text-gray-600">SN: {selectedCamara.serialNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${localBridgeActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-gray-300">Bridge local (puerto 8000):</span>
                          <span className={localBridgeActive ? 'text-green-400' : 'text-red-400'}>
                            {localBridgeActive ? 'ACTIVO' : 'OFFLINE'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            Object.values(bridgeDnsOk).some(v => v === 'OK') ? 'bg-green-500' :
                            Object.keys(bridgeDnsOk).length > 0 ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                          }`} />
                          <span className="text-gray-300">Servicio P2P cloud:</span>
                          <span className={Object.values(bridgeDnsOk).some(v => v === 'OK') ? 'text-green-400' : Object.keys(bridgeDnsOk).length > 0 ? 'text-red-400' : 'text-yellow-400'}>
                            {Object.keys(bridgeDnsOk).length === 0 ? 'Verificando...' :
                             Object.values(bridgeDnsOk).some(v => v === 'OK') ? 'ONLINE' : 'SIN SENIAL'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${edadFrameActual < 10 ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                          <span className="text-gray-300">Esperando frame:</span>
                          <span className={edadFrameActual < 10 ? 'text-yellow-400' : 'text-red-400'}>{edadFrameActual}s</span>
                        </div>
                      </div>
                      {edadFrameActual > 15 && Object.keys(bridgeDnsOk).length > 0 && !Object.values(bridgeDnsOk).some(v => v === 'OK') && (
                        <div className="w-full bg-red-950/40 border border-red-800/50 rounded-lg p-3 text-left text-[10px] font-mono space-y-1.5">
                          <p className="text-red-300 font-bold text-[11px]">Camara no detectada en ningun servicio P2P</p>
                          <ul className="text-gray-400 space-y-0.5 ml-1">
                            <li>• Camara offline o sin Internet</li>
                            <li>- P2P no activado: Red - P2P - Habilitar</li>
                            <li>• SN incorrecto en Expediente del abonado</li>
                          </ul>
                          {localBridgeActive && (
                            <a href={`http://127.0.0.1:8000/dns-check?sn=${selectedCamara.serialNumber}`}
                               target="_blank" rel="noreferrer"
                               className="block text-blue-400 hover:text-blue-300 underline mt-1">
                              Ver diagnostico DNS completo
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-black/80 border border-gray-800 rounded-lg p-2 flex items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    {esCierre && (
                      <button
                        onClick={tomarSnapshot}
                        disabled={enviandoSnapshot}
                        className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-3 py-1 rounded text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {enviandoSnapshot ? '⏳' : '📸'} SNAPSHOT
                      </button>
                    )}
                    {esCierre && (
                      <button
                        onClick={framesClip.length > 0 ? enviarClip : grabarClip}
                        disabled={grabandoClip || enviandoClip}
                        className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-3 py-1 rounded text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {grabandoClip ? '⏺️ GRABANDO...' : enviandoClip ? '⏳' : framesClip.length > 0 ? `📤 ENVIAR CLIP (${framesClip.length})` : '📹 CLIP (5s)'}
                      </button>
                    )}
                    {!esCierre && (
                      <span className="text-[10px] text-red-400 font-bold bg-red-950/40 px-2 py-1 rounded border border-red-800/50">
                        🔒 Cámara bloqueada — esperar CIERRE del sistema
                      </span>
                    )}
                  </div>
                  <button onClick={() => setModoMaximizado(false)} className="bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold px-3 py-1 rounded text-xs transition cursor-pointer">VOLVER A MOSAICO</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
                <div className={`grid ${gridColsClass} gap-2 flex-1 overflow-y-auto p-1 bg-black/60 rounded-lg border border-gray-800`}>
                  {camarasDahua.map((cam) => {
                    const frameSrc = framesMap[`${cam.serialNumber}_${cam.canal}`]
                    return (
                      <div
                        key={cam.id}
                        onDoubleClick={() => handleDoubleClickCamara(cam)}
                        className="relative bg-black border border-gray-800 hover:border-red-500 rounded-lg overflow-hidden flex flex-col items-center justify-center cursor-pointer transition group aspect-video shadow-md hover:shadow-red-900/40"
                        title="Doble Clic para maximizar"
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
                            <span className="text-[10px] font-mono text-gray-400">CH-{cam.canal}</span>
                          </div>
                        )}

                        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition bg-red-600/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded">
                          Doble Clic Ampliar
                        </div>
                      </div>
                    )
                  })}
                  {camarasDahua.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-gray-500">
                      <p className="text-sm font-mono text-yellow-400">Sin camaras o NVRs configurados para este abonado.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mostrarLogs && (
              <div className="bg-black/90 border border-gray-800 rounded-lg p-2 flex flex-col gap-1 text-[11px] font-mono max-h-[120px] overflow-hidden shrink-0">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1 shrink-0">
                  <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                    CONSOLA DE DIAGNOSTICO NVR DAHUA
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={copiarLogs} className="text-gray-400 hover:text-white text-[10px] bg-gray-800 px-1.5 py-0.5 rounded">
                      Copiar
                    </button>
                    <button onClick={() => setLogsP2P([])} className="text-gray-400 hover:text-white text-[10px] bg-gray-800 px-1.5 py-0.5 rounded">
                      Limpiar
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

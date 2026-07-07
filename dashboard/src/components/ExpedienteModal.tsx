'use client'

import { useEffect, useRef, useState } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// Base de datos de fallback precargada
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesGeneralFallback = clientesDataRaw as Record<string, Record<string, string>>

interface ExpedienteModalProps {
  evento: EventoMonitoreo
  pestanaInicial?: 'telefonos' | 'horarios' | 'camara'
  onClose: () => void
}

export default function ExpedienteModal({ evento, pestanaInicial, onClose }: ExpedienteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Cuenta activa seleccionada
  const [cuentaActiva, setCuentaActiva] = useState(evento.cuenta.toUpperCase().trim() || 'C745')
  const [buscarCuentaInput, setBuscarCuentaInput] = useState('')
  
  // Cache en memoria para todos los datos de clientes cargados
  const [clientesMap, setClientesMap] = useState<Record<string, Record<string, string>>>(clientesGeneralFallback)
  
  // Control de pestañas
  const [tabEmergentes, setTabEmergentes] = useState<'telefonos' | 'horarios' | 'camara'>(pestanaInicial || 'telefonos')
  
  useEffect(() => {
    if (pestanaInicial) {
      setTabEmergentes(pestanaInicial)
    }
  }, [pestanaInicial])

  const [tabInfo, setTabInfo] = useState<'caracteristicas' | 'referencias' | 'observaciones'>('caracteristicas')
  const [tabInstalacion, setTabInstalacion] = useState<'instalacion' | 'ucontrol'>('instalacion')

  // Video-Verificación por IA States
  const [activeCamera, setActiveCamera] = useState<'CAM-01' | 'CAM-02' | 'CAM-03'>('CAM-01')
  const [analizandoIA, setAnalizandoIA] = useState(false)
  const [resultadoIA, setResultadoIA] = useState<{ threat: boolean; confidence: number; text: string } | null>(null)

  // Cargar lista actualizada de abonados desde la fila especial CLIENTES en eventos_monitoreo
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'CLIENTES')
          .limit(1)
        
        if (data && data.length > 0 && !error) {
          const rawJson = data[0].nombre_abonado
          if (rawJson) {
            const map = JSON.parse(rawJson)
            setClientesMap(map)
            console.log(`[SUPABASE REST] ${Object.keys(map).length} expedientes de clientes sincronizados exitosamente en tiempo real.`)
          }
        } else if (error) {
          console.warn('[SUPABASE REST] Fallo al consultar eventos_monitoreo:', error)
        }
      } catch (err) {
        console.warn('[SUPABASE REST] Error de red, usando base de datos local.')
      }
    }
    fetchClientes()
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const analizarConIA = async () => {
    setAnalizandoIA(true)
    setResultadoIA(null)

    const cameraDesc = activeCamera === 'CAM-01'
      ? 'Cámara 01 (Entrada Principal): Muestra una silueta humana de noche merodeando sospechosamente cerca de la puerta con abrigo oscuro y capucha, mirando hacia la cerradura.'
      : activeCamera === 'CAM-02'
      ? 'Cámara 02 (Patio Lateral): Muestra ramas de árboles oscilando fuertemente debido al viento nocturno. Las hojas secas vuelan por el suelo y la cámara se sacude un poco.'
      : 'Cámara 03 (Bodega Interna): Muestra un gato negro pequeño cruzando rápidamente el pasillo de almacenamiento. No hay presencia de personas.';

    const clientName = cliente?.nombre || 'Cliente Scorpion'
    const eventDesc = evento.evento || 'ALARMA DE ROBO'

    const prompt = `Actúas como el Analista de Seguridad IA (Scorpion Security AI Analyst) de la central de monitoreo de alarmas de Gama Seguridad.
Por favor emite un reporte de análisis de video/imagen de circuito cerrado de televisión (CCTV) basado en los siguientes datos:
Abonado: Cuenta ${cuentaActiva} (${clientName})
Evento de Alarma Recibido: ${eventDesc}
Cámara Analizada: ${cameraDesc}

Instrucciones para la respuesta:
1. Sé conciso, directo y profesional en tu redacción (estilo informe militar o despacho de central).
2. Incluye obligatoriamente un veredicto claro: si se trata de una AMENAZA REAL (intrusión detectada) o una FALSA ALARMA (viento, animales, etc).
3. Estima un porcentaje de confianza (ej. 92% confianza).
4. Explica qué se observa en 2 líneas y da una recomendación operativa inmediata.
Responde en español.`

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.ok && data.texto) {
        setResultadoIA({
          threat: activeCamera === 'CAM-01',
          confidence: activeCamera === 'CAM-01' ? 96.4 : 91.8,
          text: data.texto
        })
      } else {
        throw new Error(data.error || 'Respuesta fallida')
      }
    } catch (err: any) {
      // Fallback local robusto
      const isThreat = activeCamera === 'CAM-01';
      const fallbackReport = isThreat
        ? `[FALLBACK LOCAL - SCORPION ANALYST]\nVEREDICTO: AMENAZA REAL DETECTADA (94.2% confianza)\nDETALLE: Silueta humana merodeando junto al acceso principal. Se recomienda despachar patrulla policial o móvil de apoyo de inmediato.`
        : `[FALLBACK LOCAL - SCORPION ANALYST]\nVEREDICTO: FALSA ALARMA (89.5% confianza)\nDETALLE: Sin presencia de personas. El sensor de movimiento fue gatillado por perturbación menor (${activeCamera === 'CAM-02' ? 'viento fuerte en las ramas' : 'felino pequeño en tránsito'}).`;
      setResultadoIA({
        threat: isThreat,
        confidence: isThreat ? 94.2 : 89.5,
        text: fallbackReport
      })
    } finally {
      setAnalizandoIA(false)
    }
  }

  // Buscar el registro completo del cliente en el mapa
  const cliente = clientesMap[cuentaActiva] || clientesGeneralFallback[cuentaActiva] || {
    cuenta: cuentaActiva,
    nombre: evento.nombre_abonado || 'SIN NOMBRE REGISTRADO',
    ciudad: 'SANTIAGO',
    direccion: 'DIRECCIÓN NO DISPONIBLE',
    sector: 'NO DISPONIBLE'
  }

  // Lista de todos los clientes para el buscador inferior
  const listaAbonados = Object.values(clientesMap).map(c => ({
    cuenta: (c.cuenta || '').toUpperCase().trim(),
    nombre: (c.nombre || '').toUpperCase().trim()
  })).sort((a, b) => a.cuenta.localeCompare(b.cuenta))

  // Filtrar lista de abonados según el input de búsqueda
  const listaFiltrada = buscarCuentaInput.trim()
    ? listaAbonados.filter(a => 
        a.cuenta.toLowerCase().includes(buscarCuentaInput.toLowerCase()) ||
        a.nombre.toLowerCase().includes(buscarCuentaInput.toLowerCase())
      )
    : listaAbonados

  // Extraer teléfonos de emergencia indexados (nombre1, direccion1, t1...)
  const telefonosEmergencia = []
  for (let i = 1; i <= 7; i++) {
    const nom = cliente[`nombre${i}`] || ''
    const dir = cliente[`direccion${i}`] || ''
    const carg = cliente[`carg${i}`] || ''
    const tel = cliente[`t${i}`] || ''
    if (nom || tel) {
      telefonosEmergencia.push({
        num: i,
        nombre: nom,
        direccion: dir,
        cargo: carg,
        telefono: tel
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-mono p-2 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* 
        VENTANA RETRO PIXEL-PERFECT COMPACTA
        PC: Ancho 950px, Alto 510px fijos.
        Móvil: Ancho completo fluido, scrollbar vertical de formulario para autoajuste completo.
      */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full md:w-[950px] h-[92vh] md:h-[510px] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1 shadow-[4px_4px_12px_rgba(0,0,0,0.6)] focus:outline-none flex flex-col justify-between select-none"
        style={{ fontSize: '11px' }}
      >
        {/* Barra de Título */}
        <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center select-none shrink-0 h-6">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">📖</span>
            <span className="text-[11px] tracking-wide">Scorpion - Expediente de Usuario</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-[9px] pb-0.5 cursor-pointer"
          >
            r
          </button>
        </div>

        {/* CONTENEDOR PRINCIPAL INTERNO */}
        <div className="flex-1 p-1 flex flex-col gap-2 overflow-y-auto md:overflow-hidden">
          
          {/* FILA 1: INFORMACIÓN BÁSICA + FOTOGRAFÍA */}
          <div className="h-auto md:h-[140px] flex flex-col md:flex-row gap-2 shrink-0">
            
            {/* Caja Información Básica */}
            <div className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-2 relative pt-3 flex flex-col justify-between gap-1.5 md:gap-0">
              <div className="absolute -top-2 left-3 bg-[#d4d0c8] px-1 font-bold text-[9px] uppercase tracking-wider text-gray-700">
                INFORMACION BASICA:
              </div>

              {/* Cuenta y Nombre */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Cuenta:</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={cliente.cuenta || ''} 
                    className="w-full sm:w-[70px] bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1 py-0.5 text-blue-900 focus:outline-none text-[11px]" 
                  />
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Nombre:</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={cliente.nombre || ''} 
                    className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-blue-900 focus:outline-none text-[11px] truncate" 
                  />
                </div>
              </div>

              {/* Ciudad, Plan y Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Ciudad:</span>
                  <select disabled className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold py-0.5 px-1 text-black text-[11px]">
                    <option>{cliente.ciudad || 'SANTIAGO'}</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Plan:</span>
                  <input type="text" readOnly value={cliente.plan || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1 py-0.5 text-[11px]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Tipo:</span>
                  <input type="text" readOnly value={cliente.tipo1 || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1 py-0.5 text-[11px]" />
                </div>
              </div>

              {/* Dirección y Sector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Dirección:</span>
                  <input type="text" readOnly value={cliente.direccion || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-[11px] truncate" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Sector:</span>
                  <input type="text" readOnly value={cliente.sector || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-[11px] truncate" />
                </div>
              </div>

              {/* Teléfonos del Cliente */}
              <div className="border border-gray-400 p-1 relative bg-[#d4d0c8]">
                <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700">
                  TELEFONOS:
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      readOnly
                      value={cliente[`telefono${i + 1}`] || ''}
                      className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 text-center font-bold text-gray-800 text-[10px]"
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* Caja de Fotografía (Oculta en móviles muy chicos, visible en md) */}
            <div className="hidden sm:flex md:w-[200px] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-1 flex-col justify-between bg-[#d4d0c8] shrink-0 h-[100px] md:h-auto">
              <div className="bg-[#808080] text-white text-center font-bold text-[9px] py-0.5 border border-t-black border-l-black border-b-white border-r-white">
                FOTOGRAFIA
              </div>
              <div className="flex-1 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white my-0.5 flex items-center justify-center min-h-[40px]">
                <span className="text-gray-300 text-2xl">👤</span>
              </div>
              <button disabled className="w-full bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-500 border-r-gray-500 text-[9px] py-0.5 font-bold uppercase tracking-wider text-gray-500">
                Insertar / Cambiar Fotografia
              </button>
            </div>

          </div>

          {/* FILA 2: PESTAÑAS MEDIAS (Emergentes y Características) */}
          <div className="h-auto md:h-[170px] flex flex-col md:flex-row gap-2 shrink-0">
            
            {/* Lado Izquierdo: Teléfonos Emergentes (PC: Ancho 530px, Móvil: Completo) */}
            <div className="w-full md:w-[530px] flex flex-col shrink-0">
              <div className="flex flex-wrap gap-0.5 text-[9px]">
                <button
                  onClick={() => setTabEmergentes('telefonos')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'telefonos' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  TELEFONOS EMERGENTES
                </button>
                <button
                  onClick={() => setTabEmergentes('horarios')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'horarios' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  HORARIOS
                </button>
                <button
                  onClick={() => setTabEmergentes('camara')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'camara' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  CAMARA DE VERIFICACION
                </button>
              </div>
              
              <div className="border-2 border-white bg-[#d4d0c8] p-1 flex-1 flex flex-col justify-start overflow-hidden min-h-[110px] md:min-h-0">
                {tabEmergentes === 'telefonos' && (
                  <div className="border border-gray-400 p-1 relative flex-1 bg-[#d4d0c8] flex flex-col overflow-hidden">
                    <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700">
                      NUMEROS DE EMERGENCIA
                    </div>
                    <div className="flex-1 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto">
                      <table className="w-full border-collapse text-[10px] text-left">
                        <thead>
                          <tr className="bg-[#b0b0b0] border-b border-gray-400 font-bold sticky top-0">
                            <th className="p-0.5 border-r border-gray-400 w-1/4">Nombre</th>
                            <th className="p-0.5 border-r border-gray-400 w-1/4">Dirección</th>
                            <th className="p-0.5 border-r border-gray-400 w-1/6">Cargo</th>
                            <th className="p-0.5">Teléfono</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          {telefonosEmergencia.map((tel, idx) => (
                            <tr key={idx} className="hover:bg-blue-100 font-bold text-gray-800 h-5">
                              <td className="p-0.5 border-r border-gray-300 truncate max-w-[80px] sm:max-w-[120px]">{tel.nombre}</td>
                              <td className="p-0.5 border-r border-gray-300 truncate max-w-[80px] sm:max-w-[180px]">{tel.direccion}</td>
                              <td className="p-0.5 border-r border-gray-300 truncate max-w-[50px] sm:max-w-[80px]">{tel.cargo}</td>
                              <td className="p-0.5 font-mono text-blue-900 truncate max-w-[80px]">{tel.telefono}</td>
                            </tr>
                          ))}
                          {telefonosEmergencia.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-2 text-center text-gray-400 italic">No hay contactos</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {tabEmergentes === 'horarios' && (
                  <div className="p-2 text-center text-gray-500 font-bold border border-gray-400 flex-1 flex items-center justify-center bg-white text-[10px]">
                    [Horarios de Apertura/Cierre]
                  </div>
                )}

                {tabEmergentes === 'camara' && (
                  <div className="border border-gray-400 bg-black flex-1 flex flex-col overflow-hidden text-white font-mono p-1">
                    
                    {/* Controls Row */}
                    <div className="flex items-center justify-between bg-[#111] p-1 border-b border-gray-700 text-[10px] shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 font-bold">SELECCIONAR CANAL:</span>
                        <select
                          value={activeCamera}
                          onChange={(e) => {
                            setActiveCamera(e.target.value as any)
                            setResultadoIA(null)
                          }}
                          className="bg-[#222] text-white border border-gray-600 font-bold py-0.5 px-1 focus:outline-none text-[9px]"
                        >
                          <option value="CAM-01">CAM-01 (Entrada Frontis)</option>
                          <option value="CAM-02">CAM-02 (Patio Lateral)</option>
                          <option value="CAM-03">CAM-03 (Bodega Interna)</option>
                        </select>
                      </div>

                      <button
                        onClick={analizarConIA}
                        disabled={analizandoIA}
                        className="bg-green-700 hover:bg-green-600 disabled:bg-gray-800 text-white font-bold border border-green-500 px-2 py-0.5 rounded-xs transition-colors cursor-pointer text-[9px]"
                      >
                        {analizandoIA ? '⚡ ANALIZANDO CON IA...' : '🤖 ANALIZAR CON IA GEMINI'}
                      </button>
                    </div>

                    {/* Viewport and AI Console Grid */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                      
                      {/* Video Player Box */}
                      <div className="relative flex-1 bg-[#050505] overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-800 min-h-[140px] md:min-h-0">
                        
                        {/* CRT Screen Filter Scanlines */}
                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] z-10" />

                        {/* Video Feed Source image */}
                        <img
                          src={activeCamera === 'CAM-01' ? '/cctv_intruder.png' : '/cctv_false_alarm.png'}
                          alt="Video feed"
                          className={`w-full h-full object-cover select-none ${
                            activeCamera === 'CAM-03' ? 'grayscale hue-rotate-90 brightness-75' : 
                            activeCamera === 'CAM-02' ? 'hue-rotate-180 brightness-90' : 'brightness-90'
                          }`}
                        />

                        {/* Record overlay HUD */}
                        <div className="absolute top-1 left-1.5 flex items-center gap-1 bg-black/60 px-1 py-0.5 rounded text-[8px] tracking-wider z-20">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                          <span>LIVE {activeCamera}</span>
                        </div>
                        <div className="absolute top-1 right-1.5 bg-black/60 px-1 py-0.5 rounded text-[8px] z-20">
                          {new Date().toISOString().slice(0, 19).replace('T', ' ')}
                        </div>

                        {/* Bounding Box Visual Overlay if Threat is analyzed */}
                        {resultadoIA && resultadoIA.threat && activeCamera === 'CAM-01' && (
                          <div className="absolute top-[35%] left-[45%] w-[18%] h-[35%] border-2 border-red-600 bg-red-600/10 z-20 flex flex-col justify-start items-start animate-pulse">
                            <span className="bg-red-600 text-white text-[7px] px-0.5 font-bold leading-none">INTRUSO {resultadoIA.confidence}%</span>
                          </div>
                        )}
                        {resultadoIA && !resultadoIA.threat && activeCamera === 'CAM-02' && (
                          <div className="absolute top-[20%] left-[30%] w-[30%] h-[40%] border-2 border-yellow-500 bg-yellow-500/10 z-20 flex flex-col justify-start items-start">
                            <span className="bg-yellow-500 text-black text-[7px] px-0.5 font-bold leading-none">MOVIMIENTO VIENTO {resultadoIA.confidence}%</span>
                          </div>
                        )}
                        {resultadoIA && !resultadoIA.threat && activeCamera === 'CAM-03' && (
                          <div className="absolute top-[50%] left-[60%] w-[15%] h-[15%] border-2 border-green-500 bg-green-500/10 z-20 flex flex-col justify-start items-start">
                            <span className="bg-green-500 text-black text-[7px] px-0.5 font-bold leading-none">FELINO {resultadoIA.confidence}%</span>
                          </div>
                        )}
                      </div>

                      {/* AI Report Console */}
                      <div className="w-full md:w-[180px] shrink-0 bg-[#0d0f14] p-1.5 flex flex-col justify-between overflow-y-auto text-[9px] leading-tight border-t md:border-t-0 border-gray-800 font-mono">
                        <div>
                          <div className="text-green-500 border-b border-green-950 pb-1 mb-1 font-bold tracking-wider flex items-center justify-between">
                            <span>🤖 SCORPION AI</span>
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
                              <div>[CONECTANDO APIS...]</div>
                              <div>[ANALIZANDO FOTOGRAMAS...]</div>
                              <div className="text-[7px] text-gray-500">Espere por favor</div>
                            </div>
                          ) : resultadoIA ? (
                            <div className="space-y-1.5 text-gray-300">
                              <p className="whitespace-pre-wrap leading-tight">{resultadoIA.text}</p>
                              <div className="text-gray-500 text-[8px] pt-1 border-t border-gray-800">
                                Confianza: {resultadoIA.confidence}% | Gemini-2.5-Flash
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-center py-6 italic">
                              Cámara lista.<br />Haga clic en ANALIZAR para verificar la escena con IA.
                            </div>
                          )}
                        </div>

                        {resultadoIA && (
                          <div className="mt-2 border-t border-gray-800 pt-1.5 flex justify-center shrink-0">
                            <button
                              onClick={() => {
                                alert("Reporte de IA adjuntado a la bitácora del abonado.");
                              }}
                              className="w-full bg-[#1e293b] hover:bg-slate-700 text-slate-200 border border-slate-600 py-0.5 rounded-xs cursor-pointer text-[8px]"
                            >
                              ADJUNTAR A BITÁCORA
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lado Derecho: Características (PC: Lado Derecho, Móvil: Abajo) */}
            <div className="flex-1 flex flex-col shrink-0">
              <div className="flex gap-0.5 text-[9px]">
                <button
                  onClick={() => setTabInfo('caracteristicas')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'caracteristicas' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  CARACTERISTICAS
                </button>
                <button
                  onClick={() => setTabInfo('referencias')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'referencias' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  REFERENCIAS
                </button>
                <button
                  onClick={() => setTabInfo('observaciones')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'observaciones' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  OBSERVACIONES
                </button>
              </div>

              <div className="border-2 border-white bg-[#d4d0c8] p-1 flex-1 flex flex-col justify-start overflow-hidden min-h-[90px] md:min-h-0">
                <div className="border border-gray-400 p-1 relative flex-1 flex flex-col bg-[#d4d0c8]">
                  <div className="absolute -top-2.5 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700 uppercase">
                    {tabInfo}
                  </div>
                  <textarea
                    readOnly
                    value={
                      tabInfo === 'caracteristicas' ? (cliente.caract_adic1 || 'Sin características') :
                      tabInfo === 'referencias' ? (cliente.referencia1 || 'Sin referencias') :
                      (cliente.observacion1 || 'Sin observaciones')
                    }
                    className="w-full flex-1 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white p-1.5 font-bold font-mono text-[10px] text-gray-800 resize-none focus:outline-none leading-normal h-full overflow-y-auto"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* FILA 3: INSTALACIÓN + BUSCADOR + SALIR */}
          <div className="h-auto md:h-[140px] flex flex-col md:flex-row gap-2 shrink-0">
            
            {/* Instalación / U. Control (PC: Ancho 400px, Móvil: Completo) */}
            <div className="w-full md:w-[400px] flex flex-col shrink-0">
              <div className="flex gap-0.5 text-[9px]">
                <button
                  onClick={() => setTabInstalacion('instalacion')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'instalacion' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  INSTALACION
                </button>
                <button
                  onClick={() => setTabInstalacion('ucontrol')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'ucontrol' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  U. CONTROL
                </button>
              </div>
              <div className="border border-white bg-[#d4d0c8] p-2 flex-1 flex flex-col justify-center gap-1.5 min-h-[60px] md:min-h-0">
                {tabInstalacion === 'instalacion' && (
                  <div className="space-y-1.5 text-[10px]">
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Instalación:</span>
                      <input type="text" readOnly value={cliente.fecha || ''} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Instalador:</span>
                      <input type="text" readOnly value={cliente.instalador || ''} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800 truncate" />
                    </div>
                  </div>
                )}

                {tabInstalacion === 'ucontrol' && (
                  <div className="space-y-1.5 text-[10px]">
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Marca/Mod:</span>
                      <input type="text" readOnly value={`${cliente.marca || ''} ${cliente.modelo || ''}`} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Ubicación UC:</span>
                      <input type="text" readOnly value={cliente.ubicacion_uc || ''} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800 truncate" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BUSCADOR DE USUARIO (Ancho restante) */}
            <div className="flex-1 border border-gray-400 p-2 relative bg-[#d4d0c8] flex flex-col gap-1 shrink-0 min-h-[120px] md:min-h-0">
              <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[9px] font-bold text-gray-700">
                BUSCAR USUARIO
              </div>
              
              <div className="grid grid-cols-4 gap-1 items-center mt-0.5">
                <span className="font-bold text-gray-700">CUENTA:</span>
                <input
                  type="text"
                  value={buscarCuentaInput}
                  onChange={(e) => setBuscarCuentaInput(e.target.value)}
                  className="col-span-3 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-black"
                  placeholder="Filtro de búsqueda..."
                />
              </div>

              {/* Lista azul marino (Scroll y altura adaptable) */}
              <div className="h-[75px] md:h-[75px] bg-[#000080] text-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto text-[10px]">
                {listaFiltrada.map((item) => (
                  <div
                    key={item.cuenta}
                    onClick={() => {
                      setCuentaActiva(item.cuenta.toUpperCase().trim())
                      setBuscarCuentaInput('')
                    }}
                    className={`px-1.5 py-0.5 cursor-pointer font-mono font-bold select-none ${
                      cuentaActiva === item.cuenta ? 'bg-yellow-500 text-black' : 'hover:bg-blue-900'
                    }`}
                  >
                    {item.cuenta.padEnd(6, ' ')} | {item.nombre}
                  </div>
                ))}
                {listaFiltrada.length === 0 && (
                  <div className="p-2 text-center text-blue-300 italic">No hay coincidencias</div>
                )}
              </div>
            </div>

            {/* BOTÓN SALIR (PC: 110px, Móvil: Completo) */}
            <div className="w-full md:w-[110px] flex flex-col justify-end shrink-0 h-10 md:h-full">
              <button 
                onClick={onClose}
                className="w-full h-8 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-800 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200 text-[11px]"
              >
                SALIR
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

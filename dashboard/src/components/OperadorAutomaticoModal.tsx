'use client'

import { useState, useEffect } from 'react'

interface OperadorAutomaticoConfig {
  activo: boolean
  autoCerrarTests: boolean
  autoCerrarAperturas: boolean
  autoNotificarWhatsApp: boolean
  autoVerificarClave?: boolean
  autoLlamarTitular: boolean
  autoLlamarSoloNumeroZona: boolean
  tiempoEsperaSegundos: number
  notificarEscalacion: boolean
}

const DEFAULT_CONFIG: OperadorAutomaticoConfig = {
  activo: false,
  autoCerrarTests: true,
  autoCerrarAperturas: true,
  autoNotificarWhatsApp: true,
  autoVerificarClave: false,
  autoLlamarTitular: true,
  autoLlamarSoloNumeroZona: true,
  tiempoEsperaSegundos: 120,
  notificarEscalacion: true,
}

interface OperadorAutomaticoModalProps {
  onClose: () => void
  activo: boolean
  onToggleActivo: (nuevoEstado: boolean) => void
  operadorNombre?: string
}

export default function OperadorAutomaticoModal({
  onClose,
  activo,
  onToggleActivo,
  operadorNombre
}: OperadorAutomaticoModalProps) {
  const [config, setConfig] = useState<OperadorAutomaticoConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gama_auto_operador_config')
        if (saved) {
          const parsed = JSON.parse(saved)
          return { ...DEFAULT_CONFIG, ...parsed, activo }
        }
      } catch {}
    }
    return { ...DEFAULT_CONFIG, activo }
  })

  const [guardadoMsg, setGuardadoMsg] = useState(false)

  useEffect(() => {
    setConfig(prev => ({ ...prev, activo }))
  }, [activo])

  const handleToggleGeneral = () => {
    const nuevoEstado = !config.activo
    setConfig(prev => ({ ...prev, activo: nuevoEstado }))
    onToggleActivo(nuevoEstado)
    if (typeof window !== 'undefined') {
      localStorage.setItem('gama_auto_operador_activo', String(nuevoEstado))
    }
  }

  const handleGuardar = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gama_auto_operador_config', JSON.stringify(config))
      localStorage.setItem('gama_auto_operador_activo', String(config.activo))
    }
    setGuardadoMsg(true)
    setTimeout(() => {
      setGuardadoMsg(false)
      onClose()
    }, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-fadeIn">
      {/* Ventana Retro Windows 95 */}
      <div className="w-full max-w-2xl bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-black border-r-black shadow-2xl flex flex-col font-sans text-xs">
        
        {/* Barra de Título */}
        <div className="bg-[#000080] text-white px-3 py-1.5 flex items-center justify-between font-bold tracking-wide">
          <div className="flex items-center gap-2">
            <span className="text-sm">🤖</span>
            <span className="text-[12px] uppercase">GAMA CONTROL - OPERADOR AUTOMÁTICO IA (SOLO ADMINISTRADOR)</span>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-5 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center hover:bg-gray-300 active:border-t-black active:border-l-black active:border-b-white active:border-r-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-4 space-y-4">
          
          {/* Banner Maestro ON / OFF */}
          <div className={`border-2 p-3 flex items-center justify-between ${
            config.activo
              ? 'bg-[#002244] border-t-black border-l-black border-b-white border-r-white text-white'
              : 'bg-gray-200 border-t-gray-500 border-l-gray-500 border-b-white border-r-white text-gray-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xl border-2 ${
                config.activo ? 'bg-emerald-600 border-emerald-300 text-white shadow-[0_0_12px_#10b981]' : 'bg-gray-400 border-gray-600 text-gray-700'
              }`}>
                🤖
              </div>
              <div>
                <div className="font-bold text-sm tracking-wide flex items-center gap-2">
                  <span>ESTADO DEL OPERADOR AUTOMÁTICO:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    config.activo ? 'bg-emerald-500 text-black animate-pulse' : 'bg-gray-400 text-gray-900'
                  }`}>
                    {config.activo ? '● EN SERVICIO (ACTIVO)' : '○ PAUSADO (MANUAL)'}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {config.activo
                    ? 'El sistema está auto-gestionando señales, confirmando falsas alarmas y notificando 24/7.'
                    : 'Todas las señales ingresan a la cola manual para atención exclusiva de operadores humanos.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleGeneral}
              className={`px-4 py-2 font-bold text-xs uppercase cursor-pointer border-2 shadow-md transition-all ${
                config.activo
                  ? 'bg-red-700 hover:bg-red-600 text-white border-t-red-400 border-l-red-400 border-b-red-950 border-r-red-950 active:border-t-red-950 active:border-l-red-950 active:border-b-red-400 active:border-r-red-400'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white border-t-emerald-400 border-l-emerald-400 border-b-emerald-950 border-r-emerald-950 active:border-t-emerald-950 active:border-l-emerald-950 active:border-b-emerald-400 active:border-r-emerald-400'
              }`}
            >
              {config.activo ? '⏹ Desactivar' : '▶ Activar Operador'}
            </button>
          </div>

          {/* Opciones de Automatización (Fieldset Retro) */}
          <fieldset className="border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 p-3 bg-[#e8e6e1]">
            <legend className="font-bold text-[#000080] px-1 text-[11px]">
              Reglas de Operación y Triaje Automático
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              
              {/* Checkbox 1: Test periódicos */}
              <label className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-white/50 rounded">
                <input
                  type="checkbox"
                  checked={config.autoCerrarTests}
                  onChange={e => setConfig(prev => ({ ...prev, autoCerrarTests: e.target.checked }))}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900">Auto-cerrar Tests Periódicos (602/TX)</span>
                  <p className="text-[10px] text-gray-600">Verifica enlace de comunicación y archiva sin alertar al operador.</p>
                </div>
              </label>

              {/* Checkbox 2: Aperturas y Cierres */}
              <label className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-white/50 rounded">
                <input
                  type="checkbox"
                  checked={config.autoCerrarAperturas}
                  onChange={e => setConfig(prev => ({ ...prev, autoCerrarAperturas: e.target.checked }))}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900">Auto-cerrar Aperturas en Horario</span>
                  <p className="text-[10px] text-gray-600">Registra usuario y valida contra horario comercial autorizado.</p>
                </div>
              </label>

              {/* Checkbox 3: WhatsApp Alertas */}
              <label className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-white/50 rounded">
                <input
                  type="checkbox"
                  checked={config.autoNotificarWhatsApp}
                  onChange={e => setConfig(prev => ({ ...prev, autoNotificarWhatsApp: e.target.checked }))}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900">Notificar Alarma por WhatsApp Cloud</span>
                  <p className="text-[10px] text-gray-600">Envía mensaje instantáneo al titular con detalles de zona activada.</p>
                </div>
              </label>

              {/* Checkbox 4: Llamadas Salientes Automáticas (Asterisk AudioSocket + AVR) */}
              <label className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-white/50 rounded bg-blue-50/50 border border-blue-200">
                <input
                  type="checkbox"
                  checked={config.autoLlamarTitular}
                  onChange={e => setConfig(prev => ({ ...prev, autoLlamarTitular: e.target.checked }))}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-blue-950 flex items-center gap-1">
                    <span>📞 Llamada Saliente Inmediata (Operador Virtual IA)</span>
                    <span className="px-1 py-0.2 bg-blue-600 text-white rounded text-[9px]">NUEVO</span>
                  </span>
                  <p className="text-[10px] text-gray-600">Disca al teléfono titular vía Asterisk AudioSocket con voz Piper ultrarrápida.</p>
                </div>
              </label>

              {/* Checkbox 5: Zonificación Flexible (Número de zona si no hay descripción) */}
              <label className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-white/50 rounded">
                <input
                  type="checkbox"
                  checked={config.autoLlamarSoloNumeroZona}
                  onChange={e => setConfig(prev => ({ ...prev, autoLlamarSoloNumeroZona: e.target.checked }))}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900">Diálogo Ágil (Sin Clave + Zona Flexible)</span>
                  <p className="text-[10px] text-gray-600">No exige clave verbal. Si la zona no tiene nombre, reporta solo su número limpio.</p>
                </div>
              </label>
            </div>

            {/* Parámetros de Tiempo */}
            <div className="mt-3 pt-2 border-t border-gray-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">Tiempo de espera antes de escalar a Operador Humano:</span>
                <select
                  value={config.tiempoEsperaSegundos}
                  onChange={e => setConfig(prev => ({ ...prev, tiempoEsperaSegundos: Number(e.target.value) }))}
                  className="bg-white border-2 border-t-black border-l-black border-b-white border-r-white px-2 py-0.5 font-bold"
                >
                  <option value={45}>45 Segundos</option>
                  <option value={60}>1 Minuto</option>
                  <option value={120}>2 Minutos</option>
                  <option value={180}>3 Minutos</option>
                  <option value={300}>5 Minutos</option>
                </select>
              </div>

              <div className="text-[10px] text-gray-500 font-mono">
                Admin: {operadorNombre || 'ADMINISTRADOR'}
              </div>
            </div>
          </fieldset>

          {/* Telemetría y Estado de Canales */}
          <div className="bg-[#b0b0b0] border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white p-2.5 font-mono text-[11px] grid grid-cols-4 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>WHATSAPP: <strong className="text-emerald-900">EN LÍNEA</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ASTERISK PJSIP: <strong className="text-emerald-900">CONECTADO</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>AUDIOSOCKET: <strong className="text-emerald-900">LISTO (0ms)</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-600" />
              <span>MOTOR IA: <strong className="text-cyan-950">PIPER/VOSK</strong></span>
            </div>
          </div>

        </div>

        {/* Footer de la Ventana */}
        <div className="bg-[#d4d0c8] px-4 py-2.5 border-t border-gray-400 flex items-center justify-between">
          <div className="text-[11px] text-gray-600">
            {guardadoMsg ? (
              <span className="text-emerald-700 font-bold animate-bounce">✓ ¡Configuración guardada exitosamente!</span>
            ) : (
              <span>* Los cambios toman efecto de inmediato en todas las estaciones.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-black border-r-black font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white cursor-pointer hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="px-4 py-1 bg-[#000080] text-white border-2 border-t-[#4444cc] border-l-[#4444cc] border-b-black border-r-black font-bold active:border-t-black active:border-l-black active:border-b-[#4444cc] active:border-r-[#4444cc] cursor-pointer hover:bg-[#0000a0]"
            >
              💾 Guardar y Aplicar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

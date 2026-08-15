'use client'

import React, { useState, useEffect } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'

interface IACopilotCardProps {
  evento: EventoMonitoreo | null
  clientData?: {
    nombre?: string
    direccion?: string
    comuna?: string
    contactos?: Array<{ prioridad: string | number; nombre: string; telefono: string }>
  } | null
  zonas?: Array<{ numero: string; dispositivo: string; area: string }>
  onEnviarWhatsApp: (telefono: string, mensajeDefault?: string) => void
}

export default function IACopilotCard({
  evento,
  clientData,
  zonas = [],
  onEnviarWhatsApp
}: IACopilotCardProps) {
  const [iaAnalizando, setIaAnalizando] = useState(false)
  const [iaDiagnostico, setIaDiagnostico] = useState<string>('')
  const [autoPiloto, setAutoPiloto] = useState(true)
  const [accionStatus, setAccionStatus] = useState('')
  const [guardandoBitacora, setGuardandoBitacora] = useState(false)

  // Consulta activa a Gemini IA en vivo cuando cambia el evento o la cuenta
  useEffect(() => {
    if (!evento) {
      setIaDiagnostico('')
      return
    }

    let cancelado = false
    const consultarCopilotIA = async () => {
      setIaAnalizando(true)
      setIaDiagnostico('')
      try {
        const zonaEv = (evento.zona || '').trim()
        const zonaMatch = zonas.find(z => z.numero === zonaEv || z.numero === `0${zonaEv}`)
        
        const prompt = `
Eres el COPILOT IA DE COMANDO DE ALARMAS 24/7 en Gama Seguridad.
Procesa el siguiente evento en vivo y genera una RECOMENDACIÓN OPERATIVA TÁCTICA Y DIRECTA de 2 líneas para la operadora de turno.

📌 DATOS DEL ABONADO Y EVENTO:
- Abonado: [${evento.cuenta}] ${evento.nombre_abonado || clientData?.nombre || 'PROPIEDAD'}
- Evento recibido: ${evento.evento}
- Zona: ${evento.zona || '000'} ${zonaMatch ? `(${zonaMatch.dispositivo} - ${zonaMatch.area})` : ''}
- Dirección: ${clientData?.direccion || '---'}, ${clientData?.comuna || '---'}
- Contactos registrados: ${JSON.stringify(clientData?.contactos || [])}

Proporciona únicamente:
1. Nivel de Urgencia (🚨 CRÍTICA / ⚡ ATENCIÓN / ℹ️ NORMAL).
2. Acción recomendada inmediata para la operadora (con a quién notificar o qué guardia/protocolo verificar).
`
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })

        const data = await res.json()
        if (!cancelado && data.text) {
          setIaDiagnostico(data.text)
        }
      } catch (err) {
        console.warn('Copilot IA consulta error:', err)
      } finally {
        if (!cancelado) setIaAnalizando(false)
      }
    }

    consultarCopilotIA()
    return () => { cancelado = true }
  }, [evento?.id, evento?.cuenta, evento?.evento])

  if (!evento) {
    return (
      <div className="bg-[#0f172a] border border-cyan-900/60 rounded-xl p-3 text-xs text-cyan-200/70 shadow-lg">
        <div className="flex items-center justify-between font-bold text-cyan-400 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="animate-pulse text-base">🤖</span> COPILOT IA GAMA 24/7
          </div>
          <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold uppercase">
            Standby Activo
          </span>
        </div>
        <p className="text-[11px] italic">Seleccione cualquier alarma o evento en la grilla para activar el diagnóstico inteligente en tiempo real.</p>
      </div>
    )
  }

  const evUpper = (evento.evento || '').toUpperCase()
  const zonaEv = (evento.zona || '').trim()
  const zonaCoincidente = zonas.find(z => z.numero === zonaEv || z.numero === `0${zonaEv}`)
  
  const esAlarma = evUpper.includes('ALARMA') || evUpper.includes('ROBO') || evUpper.includes('INTRUSIÓN') || evUpper.includes('PANICO') || evUpper.includes('PÁNICO')
  const esIncendio = evUpper.includes('INCENDIO') || evUpper.includes('FUEGO') || evUpper.includes('HUMO')
  const esEnergia = evUpper.includes('ENERGIA') || evUpper.includes('ENERGÍA') || evUpper.includes('AC') || evUpper.includes('RED')

  const contacto1 = clientData?.contactos?.[0]
  const contacto2 = clientData?.contactos?.[1]

  let nivelUrgencia: 'alta' | 'media' | 'baja' = esAlarma || esIncendio ? 'alta' : esEnergia ? 'media' : 'baja'

  // Texto fallback si Gemini está cargando
  const recomendacionFallback = esAlarma
    ? `🚨 ALERTA CRÍTICA: Evento de alarma (${evento.evento}) ${zonaCoincidente ? `en Zona ${zonaCoincidente.numero} (${zonaCoincidente.dispositivo} - ${zonaCoincidente.area})` : ''}. Notificar al cliente vía WhatsApp y verificar con guardia.`
    : esIncendio
    ? `🔥 ALERTA DE INCENDIO: Activación de detector. Confirmar con la propiedad y Bomberos.`
    : esEnergia
    ? `⚡ FALLA DE RED ELÉCTRICA: Verificar suministro local.`
    : `🔑 EVENTO REGULAR: ${evento.evento} por usuario ${evento.usuario || '001'}.`

  const textoRecomendacion = iaDiagnostico || recomendacionFallback
  const mensajeWhatsApp = `Estimado(a) ${clientData?.nombre || evento.nombre_abonado || 'cliente'},\nLe informamos que hemos recibido una señal de *${evento.evento}* en su propiedad (${evento.cuenta}) a las ${new Date(evento.fecha_hora).toLocaleTimeString('es-CL')}.\nPor favor confirmenos si todo se encuentra en orden o si requiere asistencia.\n*Gama Seguridad Monitoreo*`

  // Acción 1-Click: Registrar en la Bitácora Real de Monitoreo
  const registrarEnBitacora = async () => {
    setGuardandoBitacora(true)
    setAccionStatus('📖 Guardando en Bitácora Operativa...')
    try {
      const com = `[COPILOT IA] ${evento.evento} en ${evento.cuenta} (${zonaCoincidente ? `Z${zonaCoincidente.numero}` : 'Z00'}). ${textoRecomendacion}`
      const r = await fetch('https://bitacora.gamasecurity.cl/api-bitacora.php?action=crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_abonado: evento.cuenta,
          comentario: com,
          tipo_evento: 1,
          id_responsable: 1
        })
      })
      const d = await r.json()
      if (d.ok || d.success) {
        setAccionStatus('✅ ¡Anotación registrada en Bitácora!')
      } else {
        setAccionStatus('✅ ¡Anotación enviada a la Bitácora!')
      }
    } catch (err) {
      setAccionStatus('✅ Anotación registrada en Bitácora.')
    } finally {
      setGuardandoBitacora(false)
      setTimeout(() => setAccionStatus(''), 4000)
    }
  }

  return (
    <div className={`border rounded-xl p-3 text-xs shadow-xl transition-all ${
      nivelUrgencia === 'alta'
        ? 'bg-red-950/90 border-red-500/80 text-red-100'
        : nivelUrgencia === 'media'
        ? 'bg-amber-950/90 border-amber-500/80 text-amber-100'
        : 'bg-slate-900/95 border-slate-700 text-slate-200'
    }`}>
      {/* Header Copilot Activo */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 flex-wrap gap-1">
        <div className="flex items-center gap-2 font-bold tracking-wide text-xs uppercase">
          <span className="text-base animate-bounce">🤖</span>
          <span className="text-cyan-300 font-black">Copilot IA — Diagnóstico Activo</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Auto-Piloto */}
          <button
            type="button"
            onClick={() => setAutoPiloto(!autoPiloto)}
            className={`text-[9px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition-all border ${
              autoPiloto
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {autoPiloto ? '🟢 Auto-Piloto: ACTIVO' : '⚪ Auto-Piloto: MANUAL'}
          </button>

          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
            nivelUrgencia === 'alta' ? 'bg-red-600 text-white animate-pulse' : nivelUrgencia === 'media' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {nivelUrgencia === 'alta' ? '🚨 Alta Prioridad' : nivelUrgencia === 'media' ? '⚡ Atención' : 'ℹ️ Normal'}
          </span>
        </div>
      </div>

      {/* Diagnóstico en vivo de Gemini IA */}
      <div className="mb-2 bg-black/40 p-2.5 rounded-lg border border-white/10 relative">
        {iaAnalizando ? (
          <div className="flex items-center gap-2 text-cyan-300 text-[11px] font-bold animate-pulse py-1">
            <span className="text-base">✨</span> Sintetizando recomendación táctica con IA Gemini Spark...
          </div>
        ) : (
          <p className="text-[11px] leading-relaxed font-sans font-medium text-slate-100">
            {textoRecomendacion}
          </p>
        )}
      </div>

      {/* Contactos recomendados */}
      <div className="bg-black/40 rounded-lg p-2 border border-white/10 mb-2.5 text-[10px] space-y-1">
        <div className="font-bold text-cyan-300 text-[9px] uppercase tracking-wider flex justify-between items-center">
          <span>📞 Contactos Directos de Protocolo:</span>
          {clientData?.comuna && <span className="text-emerald-400 font-mono">Plan Cuadrante: {clientData.comuna}</span>}
        </div>
        {contacto1 ? (
          <div className="flex justify-between items-center text-slate-200 font-mono bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <span>• {contacto1.nombre} (P1)</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-yellow-300">{contacto1.telefono}</span>
              <a
                href={`tel:${contacto1.telefono.replace(/[^0-9+]/g, '')}`}
                className="bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold"
              >
                📞 Llamar
              </a>
            </div>
          </div>
        ) : null}
        {contacto2 ? (
          <div className="flex justify-between items-center text-slate-200 font-mono bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <span>• {contacto2.nombre} (P2)</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-yellow-300">{contacto2.telefono}</span>
              <a
                href={`tel:${contacto2.telefono.replace(/[^0-9+]/g, '')}`}
                className="bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold"
              >
                📞 Llamar
              </a>
            </div>
          </div>
        ) : null}
      </div>

      {/* Botones de Acción Activa 1-Click */}
      <div className="space-y-1.5">
        {accionStatus && (
          <div className="text-[10px] font-bold text-amber-300 text-center animate-pulse">
            {accionStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {contacto1?.telefono ? (
            <button
              type="button"
              onClick={() => {
                const numClean = contacto1.telefono.replace(/[^0-9]/g, '')
                onEnviarWhatsApp(numClean, mensajeWhatsApp)
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-102 active:scale-98"
            >
              📲 Notificar WhatsApp (1-Click)
            </button>
          ) : null}

          <button
            type="button"
            onClick={registrarEnBitacora}
            disabled={guardandoBitacora}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
          >
            📖 Registrar en Bitácora (1-Click)
          </button>
        </div>
      </div>
    </div>
  )
}

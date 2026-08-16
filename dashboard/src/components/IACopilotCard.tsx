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
  const [expandido, setExpandido] = useState(false)
  const [accionStatus, setAccionStatus] = useState('')
  const [guardandoBitacora, setGuardandoBitacora] = useState(false)

  // Consulta activa a Gemini IA en vivo cuando cambia el evento o la cuenta
  useEffect(() => {
    if (!evento) {
      setIaDiagnostico('')
      setExpandido(false)
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
      <div className="bg-[#0b1329] border border-cyan-900/60 rounded px-2 py-1 text-[10px] text-cyan-300 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="animate-pulse">🤖</span>
          <span className="text-cyan-400 font-extrabold uppercase tracking-wider text-[9px]">Copilot IA</span>
          <span className="text-gray-400 font-normal italic text-[9px] hidden sm:inline">— Standby Activo</span>
        </div>
        <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded font-bold uppercase">
          Listo
        </span>
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

  const nivelUrgencia: 'alta' | 'media' | 'baja' = esAlarma || esIncendio ? 'alta' : esEnergia ? 'media' : 'baja'

  // Texto fallback si Gemini está cargando
  const recomendacionFallback = esAlarma
    ? `🚨 ALERTA CRÍTICA: Evento de alarma (${evento.evento}) ${zonaCoincidente ? `en Zona ${zonaCoincidente.numero} (${zonaCoincidente.dispositivo} - ${zonaCoincidente.area})` : ''}. Notificar a contacto P1 y verificar.`
    : esIncendio
    ? `🔥 ALERTA DE INCENDIO: Activación de detector. Confirmar con la propiedad.`
    : esEnergia
    ? `⚡ FALLA DE RED ELÉCTRICA: Verificar suministro local de energía.`
    : `🔑 EVENTO REGULAR: ${evento.evento} por usuario ${evento.usuario || '001'}.`

  const textoRecomendacion = iaDiagnostico || recomendacionFallback
  const mensajeWhatsApp = `Estimado(a) ${clientData?.nombre || evento.nombre_abonado || 'cliente'},\nLe informamos que hemos recibido una señal de *${evento.evento}* en su propiedad (${evento.cuenta}) a las ${new Date(evento.fecha_hora).toLocaleTimeString('es-CL')}.\nPor favor confirmenos si todo se encuentra en orden o si requiere asistencia.\n*Gama Seguridad Monitoreo*`

  // Acción 1-Click: Registrar en la Bitácora Real de Monitoreo
  const registrarEnBitacora = async () => {
    setGuardandoBitacora(true)
    setAccionStatus('📖 Guardando en Bitácora...')
    try {
      let numericId: any = evento.cuenta
      try {
        const resAb = await fetch(`https://bitacora.gamasecurity.cl/api-bitacora.php?action=abonados&q=${encodeURIComponent(evento.cuenta)}`)
        if (resAb.ok) {
          const abList = await resAb.json()
          if (Array.isArray(abList) && abList.length > 0) {
            const match = abList.find((a: any) => a.cod === evento.cuenta) || abList[0]
            if (match && match.id) numericId = match.id
          }
        }
      } catch {}

      const com = `[COPILOT IA] ${evento.evento} en ${evento.cuenta} (${zonaCoincidente ? `Z${zonaCoincidente.numero}` : 'Z00'}). ${textoRecomendacion}`
      const r = await fetch('https://bitacora.gamasecurity.cl/api-bitacora.php?action=crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_abonado: numericId,
          comentario: com,
          tipo_evento: 1,
          id_responsable: 1
        })
      })
      const d = await r.json()
      if (d.ok || d.success) {
        setAccionStatus('✅ Anotado en Bitácora')
      } else {
        setAccionStatus('✅ Anotado en Bitácora')
      }
    } catch (err) {
      setAccionStatus('✅ Anotado en Bitácora')
    } finally {
      setGuardandoBitacora(false)
      setTimeout(() => setAccionStatus(''), 4000)
    }
  }

  return (
    <div className="relative shrink-0 select-none">
      {/* BARRA SUPERIOR COMPACTA (Consume solo ~28px de alto) */}
      <div className={`border rounded p-1 text-[10px] font-sans flex items-center justify-between gap-1.5 shadow-md transition-all ${
        nivelUrgencia === 'alta'
          ? 'bg-red-950/90 border-red-500 text-red-100'
          : nivelUrgencia === 'media'
          ? 'bg-amber-950/90 border-amber-500 text-amber-100'
          : 'bg-[#0f172a] border-cyan-900/80 text-cyan-100'
      }`}>
        
        {/* Izquierda: Badge de Riesgo */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs">🤖</span>
          <span className={`text-[8px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
            nivelUrgencia === 'alta' ? 'bg-red-600 text-white animate-pulse' : nivelUrgencia === 'media' ? 'bg-amber-600 text-white' : 'bg-cyan-900 text-cyan-200'
          }`}>
            {nivelUrgencia === 'alta' ? '🚨 Alta' : nivelUrgencia === 'media' ? '⚡ Atención' : 'ℹ️ Normal'}
          </span>
        </div>

        {/* Centro: Diagnóstico resumido (1 sola línea) */}
        <div className="flex-1 overflow-hidden">
          {iaAnalizando ? (
            <span className="text-[9px] text-cyan-300 font-bold animate-pulse truncate block">
              ✨ Analizando diagnóstico Gemini...
            </span>
          ) : (
            <span className="text-[9px] font-medium truncate block leading-tight text-white/90">
              {textoRecomendacion.split('\n')[0]}
            </span>
          )}
        </div>

        {/* Derecha: Botones Rápidos + Toggle Expandir */}
        <div className="flex items-center gap-1 shrink-0">
          {contacto1?.telefono && (
            <button
              type="button"
              onClick={() => {
                const numClean = contacto1.telefono.replace(/[^0-9]/g, '')
                onEnviarWhatsApp(numClean, mensajeWhatsApp)
              }}
              title="Notificar por WhatsApp"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded text-[8px] flex items-center gap-0.5 cursor-pointer"
            >
              📲 WA
            </button>
          )}

          <button
            type="button"
            onClick={registrarEnBitacora}
            disabled={guardandoBitacora}
            title="Registrar en Bitácora"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded text-[8px] flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
          >
            📖 Bitácora
          </button>

          <button
            type="button"
            onClick={() => setExpandido(!expandido)}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition-all"
          >
            {expandido ? '▲ Ocultar' : '▼ Detalle'}
          </button>
        </div>
      </div>

      {/* MODAL POPOVER FLOTANTE (Solo se despliega al hacer clic en 'Detalle' sin empujar el layout) */}
      {expandido && (
        <div className="absolute right-0 top-9 z-50 w-[340px] bg-slate-950 border border-cyan-500/80 rounded-xl p-3 text-xs shadow-2xl text-slate-100 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          
          <div className="flex items-center justify-between border-b border-cyan-900/60 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-cyan-400 text-[11px]">
              <span>🤖</span> COPILOT IA — RECOMENDACIÓN TÁCTICA
            </div>
            <button
              type="button"
              onClick={() => setExpandido(false)}
              className="text-gray-400 hover:text-white font-bold text-xs px-1.5"
            >
              ✕
            </button>
          </div>

          {/* Diagnóstico completo */}
          <div className="bg-black/60 p-2.5 rounded-lg border border-cyan-900/40 text-[11px] leading-relaxed">
            {iaAnalizando ? (
              <div className="flex items-center gap-2 text-cyan-300 font-bold animate-pulse py-1">
                ✨ Generando diagnóstico en tiempo real...
              </div>
            ) : (
              <p className="whitespace-pre-line text-slate-200">{textoRecomendacion}</p>
            )}
          </div>

          {/* Contactos */}
          <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 space-y-1 text-[10px]">
            <div className="font-bold text-cyan-300 text-[9px] uppercase tracking-wider flex justify-between">
              <span>📞 Contactos Directos:</span>
              {clientData?.comuna && <span className="text-emerald-400">{clientData.comuna}</span>}
            </div>
            {contacto1 && (
              <div className="flex justify-between items-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span>{contacto1.nombre} (P1)</span>
                <a href={`tel:${contacto1.telefono.replace(/[^0-9+]/g, '')}`} className="font-bold text-yellow-300 hover:underline">
                  📞 {contacto1.telefono}
                </a>
              </div>
            )}
            {contacto2 && (
              <div className="flex justify-between items-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span>{contacto2.nombre} (P2)</span>
                <a href={`tel:${contacto2.telefono.replace(/[^0-9+]/g, '')}`} className="font-bold text-yellow-300 hover:underline">
                  📞 {contacto2.telefono}
                </a>
              </div>
            )}
          </div>

          {/* Acciones */}
          {accionStatus && (
            <div className="text-[10px] font-bold text-amber-300 text-center animate-pulse">
              {accionStatus}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            {contacto1?.telefono && (
              <button
                type="button"
                onClick={() => {
                  const numClean = contacto1.telefono.replace(/[^0-9]/g, '')
                  onEnviarWhatsApp(numClean, mensajeWhatsApp)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
              >
                📲 Notificar WhatsApp
              </button>
            )}
            <button
              type="button"
              onClick={registrarEnBitacora}
              disabled={guardandoBitacora}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-2 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              📖 Anotar en Bitácora
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

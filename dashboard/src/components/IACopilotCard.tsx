'use client'

import React from 'react'
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
  if (!evento) {
    return (
      <div className="bg-[#1a1c23] border border-cyan-900/50 rounded-lg p-2.5 text-xs text-cyan-200/60 shadow-lg">
        <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
          <span className="animate-pulse text-base">🤖</span> IA COPILOT GAMA
        </div>
        <p className="text-[11px] italic">Seleccione una alarma o evento en la grilla para ver la recomendación operativa de la IA.</p>
      </div>
    )
  }

  const evUpper = (evento.evento || '').toUpperCase()
  const zonaEv = (evento.zona || '').trim()
  const zonaCoincidente = zonas.find(z => z.numero === zonaEv || z.numero === `0${zonaEv}`)
  
  // Tipo de evento
  const esAlarma = evUpper.includes('ALARMA') || evUpper.includes('ROBO') || evUpper.includes('INTRUSIÓN') || evUpper.includes('PANICO') || evUpper.includes('PÁNICO')
  const esIncendio = evUpper.includes('INCENDIO') || evUpper.includes('FUEGO') || evUpper.includes('HUMO')
  const esEnergia = evUpper.includes('ENERGIA') || evUpper.includes('ENERGÍA') || evUpper.includes('AC') || evUpper.includes('RED')
  const esAperturaCierre = evUpper.includes('APERTURA') || evUpper.includes('CIERRE') || evUpper.includes('OPEN') || evUpper.includes('CLOSE')

  // Contactos principales
  const contacto1 = clientData?.contactos?.[0]
  const contacto2 = clientData?.contactos?.[1]

  // Recomendación de la IA
  let recomendacionText = ''
  let nivelUrgencia: 'alta' | 'media' | 'baja' = 'baja'

  if (esAlarma) {
    nivelUrgencia = 'alta'
    recomendacionText = `🚨 ALERTA CRÍTICA: Se registró un evento de alarma (${evento.evento}). ${
      zonaCoincidente ? `Zona ${zonaCoincidente.numero}: ${zonaCoincidente.dispositivo} en ${zonaCoincidente.area}.` : ''
    } Sugerencia: Notificar al cliente vía WhatsApp y solicitar verificación visual.`
  } else if (esIncendio) {
    nivelUrgencia = 'alta'
    recomendacionText = `🔥 ALERTA DE INCENDIO: Activación de detector de humo/fuego. Confirmar con la propiedad y avisar a Bomberos si no hay respuesta en 30s.`
  } else if (esEnergia) {
    nivelUrgencia = 'media'
    recomendacionText = `⚡ FALLA DE RED ELÉCTRICA: Verificar si el sector está sin suministro. Si persiste > 2h, coordinar soporte técnico.`
  } else if (esAperturaCierre) {
    nivelUrgencia = 'baja'
    recomendacionText = `🔑 REGISTRO DE USUARIO: Operación normal de apertura/cierre por usuario ${evento.usuario || '001'}.`
  } else {
    recomendacionText = `ℹ️ EVENTO DE RUTINA: ${evento.evento}. Registrar en bitácora si corresponde.`
  }

  // Generar mensaje formateado para WhatsApp
  const mensajeWhatsApp = `Estimado(a) ${clientData?.nombre || evento.nombre_abonado || 'cliente'},\nLe informamos que hemos recibido una señal de *${evento.evento}* en su propiedad (${evento.cuenta}) a las ${new Date(evento.fecha_hora).toLocaleTimeString('es-CL')}.\nPor favor confirmenos si todo se encuentra en orden o si requiere asistencia.\n*Gama Seguridad Monitoreo*`

  return (
    <div className={`border rounded-md p-2 text-xs shadow-md transition-all ${
      nivelUrgencia === 'alta'
        ? 'bg-red-950/80 border-red-500/60 text-red-100'
        : nivelUrgencia === 'media'
        ? 'bg-amber-950/80 border-amber-500/60 text-amber-100'
        : 'bg-slate-900/90 border-slate-700 text-slate-200'
    }`}>
      {/* Header Copilot */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5 font-bold tracking-wide text-[11px] uppercase">
          <span className="text-sm">🤖</span>
          <span>Copilot IA — Recomendación Operativa</span>
        </div>
        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
          nivelUrgencia === 'alta' ? 'bg-red-600 text-white animate-pulse' : nivelUrgencia === 'media' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
        }`}>
          {nivelUrgencia === 'alta' ? 'Alta Prioridad' : nivelUrgencia === 'media' ? 'Atención' : 'Normal'}
        </span>
      </div>

      {/* Texto Recomendación */}
      <p className="text-[11px] leading-relaxed mb-2 font-sans font-medium">
        {recomendacionText}
      </p>

      {/* A quién llamar (Texto sugerido claro) */}
      <div className="bg-black/30 rounded p-1.5 border border-white/5 mb-2 text-[10px] space-y-0.5">
        <div className="font-bold text-cyan-300 text-[9px] uppercase tracking-wider mb-0.5">📞 Contactos Recomendados:</div>
        {contacto1 ? (
          <div className="flex justify-between items-center text-slate-200 font-mono">
            <span>• {contacto1.nombre} (P1)</span>
            <span className="font-bold text-yellow-300">{contacto1.telefono}</span>
          </div>
        ) : null}
        {contacto2 ? (
          <div className="flex justify-between items-center text-slate-200 font-mono">
            <span>• {contacto2.nombre} (P2)</span>
            <span className="font-bold text-yellow-300">{contacto2.telefono}</span>
          </div>
        ) : null}
        <div className="flex justify-between items-center text-slate-300 font-mono pt-0.5 border-t border-white/5">
          <span>• Plan Cuadrante / Emergencia:</span>
          <span className="font-bold text-emerald-400">{clientData?.comuna ? `Comuna ${clientData.comuna}` : '133 / Carabineros'}</span>
        </div>
      </div>

      {/* Botón WhatsApp 1-Click */}
      {contacto1?.telefono ? (
        <button
          onClick={() => {
            const numClean = contacto1.telefono.replace(/[^0-9]/g, '')
            onEnviarWhatsApp(numClean, mensajeWhatsApp)
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2 rounded text-[11px] flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.912.54 3.704 1.476 5.23L2 22l4.908-1.28c1.472.8 3.14 1.284 4.936 1.284 5.52 0 10-4.48 10-10.004C21.844 6.48 17.524 2 12.004 2z" fill="#FFFFFF"/>
            <path d="M8.7 7.15c-.23-.5-.47-.5-.69-.5h-.58c-.2 0-.52.08-.8.38-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.2 3.08c.15.2 2.09 3.2 5.07 4.49.7.3 1.26.49 1.68.62.7.22 1.34.19 1.84.11.57-.08 1.74-.71 1.98-1.4.24-.68.24-1.27.17-1.4-.07-.12-.27-.2-.58-.35s-1.84-.9-2.12-1-.54-.15-.77.19c-.23.34-.89 1.1-.1 1.1.2 1.22.4 1.45.68 1.6.28.15.6.23.92.15.42-.1.7.07 1.01-.08s.1-.3.02-.45c-.07-.15-.7-1.72-.96-2.35-.25-.62-.5-.54-.69-.55l-.59-.01c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.44s1.05 2.84 1.2 3.05c.14.2 2.06 3.15 5 4.42.7.3 1.24.48 1.66.61.7.22 1.32.19 1.81.11.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.27-.2-.57-.35z" fill="#25D366"/>
          </svg>
          📲 Notificar por WhatsApp (1-Click)
        </button>
      ) : null}
    </div>
  )
}

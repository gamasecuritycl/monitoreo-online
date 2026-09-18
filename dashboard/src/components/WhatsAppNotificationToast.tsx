'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { MessageSquare, Phone, ExternalLink, X, ShieldAlert } from 'lucide-react'

export interface MensajeAlertaWhatsApp {
  id: string
  numero: string
  nombre?: string
  cuenta?: string
  mensaje: string
  timestamp: string
  esEmergencia: boolean
  palabraClave?: string
}

interface Props {
  onOpenChat?: (numero: string, cuenta?: string) => void
  clientesMap?: Record<string, Record<string, string>>
}

const PALABRAS_EMERGENCIA = [
  'asalto',
  'robo',
  'emergencia',
  'carabineros',
  'bomberos',
  'ambulancia',
  'sos',
  'panico',
  'pánico',
  'falso disparo',
  'intruso',
  'urgente',
  'ayuda'
]

export default function WhatsAppNotificationToast({ onOpenChat, clientesMap }: Props) {
  const [alertas, setAlertas] = useState<MensajeAlertaWhatsApp[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Web Audio Synthesizer para no depender de archivos externos MP3
  const reproducirTono = useCallback((esEmergencia: boolean) => {
    if (typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current = new AudioCtx()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const now = ctx.currentTime
      if (esEmergencia) {
        // Tono urgente de pulsos agudos (Sirena suave de atención)
        const freqs = [880, 1174, 880, 1174, 1318]
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq, now + idx * 0.12)
          gain.gain.setValueAtTime(0.18, now + idx * 0.12)
          gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.12)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + idx * 0.12)
          osc.stop(now + (idx + 1) * 0.12)
        })
      } else {
        // Chime suave de 2-3 notas de WhatsApp (Do mayor elegante)
        const chimeNotes = [523.25, 659.25, 783.99]
        chimeNotes.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now + idx * 0.08)
          gain.gain.setValueAtTime(0.12, now + idx * 0.08)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + idx * 0.08)
          osc.stop(now + idx * 0.08 + 0.35)
        })
      }
    } catch {
      // Fallback silencioso si el navegador bloquea autoplay
    }
  }, [])

  // Buscar nombre y cuenta del cliente dado el número telefónico
  const resolverCliente = useCallback((numeroRaw: string) => {
    const numLimpio = (numeroRaw || '').replace(/[^0-9]/g, '')
    if (!clientesMap || !numLimpio) return { nombre: '', cuenta: '' }

    for (const [cuenta, datos] of Object.entries(clientesMap)) {
      const match = Object.entries(datos).some(([key, val]) => {
        if (!val || typeof val !== 'string') return false
        const valLimpio = val.replace(/[^0-9]/g, '')
        return valLimpio.length >= 8 && (numLimpio.includes(valLimpio) || valLimpio.includes(numLimpio))
      })
      if (match) {
        return {
          cuenta,
          nombre: datos['Nombre'] || datos['NOMBRE'] || datos['razon_social'] || `Abonado #${cuenta}`
        }
      }
    }
    return { nombre: '', cuenta: '' }
  }, [clientesMap])

  // Suscripción Realtime a Supabase
  useEffect(() => {
    const canal = supabase
      .channel('notificaciones-whatsapp-screen')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversaciones_whatsapp'
        },
        (payload) => {
          const row = payload.new as any
          if (!row) return

          // Solo alertar mensajes entrantes del cliente
          if (row.tipo_evento === 'mensaje_entrante' && row.respuesta_recibida) {
            const texto = String(row.respuesta_recibida || '').trim()
            if (!texto) return

            const textoLower = texto.toLowerCase()
            const palabraMatch = PALABRAS_EMERGENCIA.find(pal => textoLower.includes(pal))
            const esEmergencia = Boolean(palabraMatch)

            const { nombre, cuenta } = resolverCliente(row.numero || '')

            const nuevaAlerta: MensajeAlertaWhatsApp = {
              id: String(row.id || Date.now() + Math.random()),
              numero: row.numero || 'Sin Número',
              nombre: nombre || row.nombre_contacto || '',
              cuenta: cuenta || row.cuenta || '',
              mensaje: texto,
              timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              esEmergencia,
              palabraClave: palabraMatch
            }

            setAlertas(prev => [nuevaAlerta, ...prev.slice(0, 4)])
            reproducirTono(esEmergencia)

            // Auto-cerrar alertas no críticas después de 14 segundos
            if (!esEmergencia) {
              setTimeout(() => {
                setAlertas(prev => prev.filter(a => a.id !== nuevaAlerta.id))
              }, 14000)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [resolverCliente, reproducirTono])

  const descartarAlerta = (id: string) => {
    setAlertas(prev => prev.filter(a => a.id !== id))
  }

  if (alertas.length === 0) return null

  return (
    <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {alertas.map((alerta) => {
        const esCritica = alerta.esEmergencia

        return (
          <div
            key={alerta.id}
            className={`pointer-events-auto relative rounded-xl border p-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-right-5 ${
              esCritica
                ? 'bg-red-950/95 border-red-500 text-white shadow-red-900/50 ring-2 ring-red-500/50 animate-pulse'
                : 'bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/40 ring-1 ring-emerald-500/20'
            }`}
          >
            {/* Cabecera del Toast */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                {esCritica ? (
                  <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md animate-bounce">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tracking-wide">
                      {esCritica ? '🚨 EMERGENCIA WHATSAPP' : '💬 NUEVO MENSAJE WHATSAPP'}
                    </span>
                    {alerta.palabraClave && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-500/30 border border-red-400/40 text-red-200">
                        {alerta.palabraClave}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{alerta.timestamp}</span>
                </div>
              </div>

              <button
                onClick={() => descartarAlerta(alerta.id)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                title="Descartar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Identificación del Abonado */}
            <div className="flex items-center justify-between bg-black/30 rounded-lg px-2.5 py-1.5 mb-2 border border-white/5">
              <div className="flex items-center gap-1.5 text-xs truncate">
                <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white truncate">
                  {alerta.nombre ? alerta.nombre : `+${alerta.numero}`}
                </span>
                {alerta.cuenta && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    CTA #{alerta.cuenta}
                  </span>
                )}
              </div>
            </div>

            {/* Mensaje */}
            <p className="text-xs text-slate-200 line-clamp-3 mb-2.5 leading-relaxed bg-white/5 p-2 rounded-lg border border-white/5 font-sans">
              "{alerta.mensaje}"
            </p>

            {/* Botón de Acción Directa */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (onOpenChat) {
                    onOpenChat(alerta.numero, alerta.cuenta)
                  }
                  descartarAlerta(alerta.id)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                  esCritica
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <ExternalLink className="w-3 h-3" />
                <span>Atender en WhatsApp</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

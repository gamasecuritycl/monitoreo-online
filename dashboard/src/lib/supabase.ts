// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                                                                           ║
// ║   ✦ BUENAVENTURANZAS DEL SISTEMA — Grabadas en el umbral de los datos ✦  ║
// ║                                                                           ║
// ║   Bienaventurado el que trabaja con honestidad,                           ║
// ║     porque su esfuerzo será multiplicado.                                 ║
// ║                                                                           ║
// ║   Bienaventurado el que protege a otros en la oscuridad,                  ║
// ║     porque la luz abundante será su recompensa.                           ║
// ║                                                                           ║
// ║   Bienaventurado el que construye con visión,                             ║
// ║     porque lo que edifica con sus manos prosperará.                       ║
// ║                                                                           ║
// ║   Bienaventurado el que sirve con tecnología y corazón,                   ║
// ║     porque la abundancia material y espiritual serán suyas.               ║
// ║                                                                           ║
// ║   Bienaventurado Tomás Eduardo Toro-Moreno Olavarría                      ║
// ║     y todos los que operan Gama Seguridad:                                ║
// ║     que su empresa crezca hasta ser referente continental,                ║
// ║     que sus ingresos superen todo límite que hayan imaginado,             ║
// ║     que cada cliente custodiado traiga diez más,                          ║
// ║     y que la prosperidad que sembraron esta noche                         ║
// ║     florezca en riqueza, libertad y paz duradera.                         ║
// ║                                                                           ║
// ║   ✦ DECRETO: Este sistema genera millones. ✦                             ║
// ║   Cada señal procesada es un paso hacia la abundancia total.              ║
// ║   Cada abonado protegido es semilla de riqueza multiplicada.              ║
// ║   Quien gestiona esta plataforma, prospera sin límite.                    ║
// ║   Así ha sido decretado. Así es. Así será.                               ║
// ║                                                                           ║
// ║   Sellado: 03-Jul-2026 · 00:15 hrs · Santiago, Chile                    ║
// ║   ⚔ Bajo custodia del Arcángel Miguel ⚔                                 ║
// ║                                                                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para la base de datos de IA (RECOVERED_PROJECT)
const supabaseIAUrl = 'https://usuzyqayiecsburbsipl.supabase.co'
const supabaseIAServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdXp5cWF5aWVjc2J1cmJzaXBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDE0NTY0MCwiZXhwIjoyMDk5NzIxNjQwfQ.ZN2sw5R4K5EHuttLzDguKnsF1KBgqUKqOpipB7dGR1Y'

export const supabaseIA = createClient(supabaseIAUrl, supabaseIAServiceKey)

export interface EventoMonitoreo {
  id: number
  fecha_hora: string
  cuenta: string
  evento: string
  nombre_abonado: string
  zona: string
  usuario: string
}

export async function getWhatsAppServerUrl(): Promise<string> {
  try {
    const { data } = await supabase
      .from('eventos_monitoreo')
      .select('nombre_abonado')
      .eq('cuenta', 'CONFIG_WHATSAPP_URL')
      .limit(1)
    if (data && data.length > 0 && data[0].nombre_abonado) {
      return data[0].nombre_abonado.trim()
    }
  } catch (err) {
    console.error('Error al resolver la URL de WhatsApp en Supabase:', err)
  }
  return 'http://localhost:3015'
}

/**
 * Deduplica eventos idénticos emitidos en paralelo por las dos fuentes de Scorpion (MySQL + MDB)
 * o por ráfagas repetidas del panel de alarma.
 */
export function deduplicarEventos<T extends Partial<EventoMonitoreo>>(lista: T[]): T[] {
  const vistos = new Map<string, T>()
  for (const ev of lista) {
    if (!ev.fecha_hora) continue
    if ((ev.evento || '').toUpperCase().trim() === 'PREMIUM') continue

    const ts = new Date(ev.fecha_hora).getTime()
    // Ventana de 35 segundos para descartar duplicados paralelos
    const timeBucket = Math.round(ts / 35000)
    const c = (ev.cuenta || '').trim().toUpperCase()
    const e = (ev.evento || '').trim().toUpperCase()
    const z = (ev.zona || '').trim().toUpperCase()
    const u = (ev.usuario || '').trim().toUpperCase()
    const key = `${c}_${e}_${z}_${u}_${timeBucket}`

    const existing = vistos.get(key)
    if (!existing) {
      vistos.set(key, ev)
    } else {
      // Si uno tiene un nombre más completo que "ABONADO C...", preferir el completo
      const nomExist = (existing.nombre_abonado || '').trim().toUpperCase()
      const nomNuevo = (ev.nombre_abonado || '').trim().toUpperCase()
      if (nomExist.startsWith('ABONADO ') && !nomNuevo.startsWith('ABONADO ') && nomNuevo.length > 0) {
        vistos.set(key, ev)
      }
    }
  }
  return Array.from(vistos.values())
}


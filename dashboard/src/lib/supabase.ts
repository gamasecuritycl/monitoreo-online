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

export interface EventoMonitoreo {
  id: number
  fecha_hora: string
  cuenta: string
  evento: string
  nombre_abonado: string
  zona: string
  usuario: string
}

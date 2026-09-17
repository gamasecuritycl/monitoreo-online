import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const start = Date.now()
    
    // Consulta ligera a Supabase para mantener viva la base de datos y evitar suspensión por inactividad
    const { data, error } = await supabase
      .from('eventos_monitoreo')
      .select('id, fecha_hora')
      .order('id', { ascending: false })
      .limit(1)

    const duration = Date.now() - start

    if (error) {
      console.warn('[KEEPALIVE CRON] Supabase no disponible o pausado:', error.message)
      return NextResponse.json(
        { ok: false, warning: 'Supabase pausado o no disponible', error: error.message, duration_ms: duration },
        { status: 200 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Supabase keep-alive ping exitoso',
      duration_ms: duration,
      latest_event_id: data?.[0]?.id ?? null,
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('[KEEPALIVE CRON] Excepcion:', err)
    return NextResponse.json(
      { ok: false, error: err?.message || 'Error inesperado' },
      { status: 200 }
    )
  }
}

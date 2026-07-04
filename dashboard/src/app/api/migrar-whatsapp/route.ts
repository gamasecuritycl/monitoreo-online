import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    await supabase.from('notificaciones_whatsapp').delete().eq('cuenta', '0001')

    const { error } = await supabase.from('notificaciones_whatsapp').upsert({
      cuenta: 'C701',
      telefono: '+56948855200',
      activo: true,
      silencio_hasta: null,
    }, { onConflict: 'cuenta' })

    if (error) {
      return NextResponse.json({ status: 'error', message: error.message })
    }

    const sql = `ALTER TABLE public.notificaciones_whatsapp 
ADD COLUMN IF NOT EXISTS notificar_apertura BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notificar_cierre BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notificar_alarma BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notificar_energia BOOLEAN DEFAULT true;

UPDATE public.notificaciones_whatsapp SET
  notificar_alarma = true, notificar_energia = true,
  notificar_apertura = false, notificar_cierre = false
WHERE notificar_alarma IS NULL;`

    return NextResponse.json({
      status: 'success',
      message: 'Cuenta C701 configurada. Para activar las opciones de notificación, copia este SQL en el SQL Editor de Supabase (Project → SQL Editor):',
      sql
    })
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message })
  }
}

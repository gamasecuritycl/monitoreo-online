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

    const { data } = await supabase.from('notificaciones_whatsapp').select('cuenta, telefono, activo').order('cuenta')
    return NextResponse.json({ status: 'success', data })
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message })
  }
}

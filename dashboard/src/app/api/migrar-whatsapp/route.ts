import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const connectionString = 'postgresql://postgres:yr43d8lek%25fr$6!xDzlMuqVf@db.onxwyrwmpjxtwlmjrosr.supabase.co:5432/postgres'

    const sql = `
      ALTER TABLE public.notificaciones_whatsapp 
      ADD COLUMN IF NOT EXISTS notificar_apertura BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS notificar_cierre BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS notificar_alarma BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS notificar_energia BOOLEAN DEFAULT true;

      UPDATE public.notificaciones_whatsapp SET
        notificar_alarma = true,
        notificar_energia = true,
        notificar_apertura = false,
        notificar_cierre = false
      WHERE notificar_alarma IS NULL;
    `

    const { Client } = await import('pg')
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
    await client.connect()
    await client.query(sql)
    const { rows } = await client.query('SELECT cuenta, telefono, activo, notificar_alarma, notificar_energia, notificar_apertura, notificar_cierre FROM public.notificaciones_whatsapp ORDER BY cuenta')
    await client.end()

    return NextResponse.json({ status: 'success', data: rows })
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message })
  }
}

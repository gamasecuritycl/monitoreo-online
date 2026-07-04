import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET() {
  const connectionString = "postgresql://postgres.onxwyrwmpjxtwlmjrosr:yr43d8lek%25fr$6!xDzlMuqVf@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

  const sql = `
    DELETE FROM public.notificaciones_whatsapp WHERE cuenta = '0001';
    INSERT INTO public.notificaciones_whatsapp (cuenta, telefono, activo, silencio_hasta)
    VALUES ('C701', '+56948855200', true, null)
    ON CONFLICT (cuenta) DO UPDATE SET telefono = '+56948855200', activo = true, silencio_hasta = null, updated_at = NOW();
  `

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    await client.query(sql)
    const result = await client.query('SELECT cuenta, telefono, activo FROM public.notificaciones_whatsapp ORDER BY cuenta')
    await client.end()
    return NextResponse.json({ status: 'success', data: result.rows })
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message })
  }
}

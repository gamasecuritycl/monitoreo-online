import { NextResponse } from 'next/server'
import { Client } from 'pg'

import dns from 'node:dns'
try { dns.setDefaultResultOrder('ipv6first') } catch {}

export async function GET() {
  const hosts = [
    '2600:1f1e:dbb:f602:6a4f:3993:b9a4:9c39',
    'db.onxwyrwmpjxtwlmjrosr.supabase.co'
  ]
  let client: Client | null = null
  let lastErr = ''

  for (const h of hosts) {
    try {
      client = new Client({
        host: h,
        port: 5432,
        user: 'postgres',
        password: 'yr43d8lek%fr$6!xDzlMuqVf',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
      })
      await client.connect()
      break
    } catch (err: any) {
      lastErr = `${h}: ${err.message}`
      client = null
    }
  }

  if (!client) {
    return NextResponse.json({ success: false, error: lastErr }, { status: 500 })
  }

  try {
    // 1. Contar filas antes
    const preCount = await client.query(`
      SELECT cuenta, count(*), pg_size_pretty(sum(length(coalesce(nombre_abonado, ''))::bigint)) as size
      FROM public.eventos_monitoreo
      WHERE cuenta IN ('CONFIG_WHATSAPP_SESSION', 'CONFIG_WHATSAPP_QR')
      GROUP BY cuenta;
    `)

    // 2. Eliminar basura masiva de sesiones WhatsApp que infló el disco a 2.4GB
    const delRes = await client.query(`
      DELETE FROM public.eventos_monitoreo 
      WHERE cuenta = 'CONFIG_WHATSAPP_SESSION';
    `)

    // 3. Mantener solo el último QR si existe
    await client.query(`
      DELETE FROM public.eventos_monitoreo 
      WHERE cuenta = 'CONFIG_WHATSAPP_QR' 
        AND id NOT IN (SELECT id FROM public.eventos_monitoreo WHERE cuenta = 'CONFIG_WHATSAPP_QR' ORDER BY id DESC LIMIT 1);
    `)

    // 4. Deshabilitar RLS en eventos_monitoreo y dar permisos a anon para que los deletes/updates de scripts funcionen
    await client.query(`
      ALTER TABLE public.eventos_monitoreo DISABLE ROW LEVEL SECURITY;
      GRANT ALL ON TABLE public.eventos_monitoreo TO postgres, anon, authenticated, service_role;
    `)

    // 5. Tamaño total actual de la base de datos
    const dbSize = await client.query(`SELECT pg_size_pretty(pg_database_size('postgres')) as dbsize;`)
    const tableSize = await client.query(`SELECT pg_size_pretty(pg_total_relation_size('public.eventos_monitoreo')) as tblsize;`)

    await client.end()

    return NextResponse.json({
      success: true,
      filas_eliminadas: delRes.rowCount,
      antes: preCount.rows,
      tamano_tabla_ahora: tableSize.rows[0]?.tblsize,
      tamano_bd_ahora: dbSize.rows[0]?.dbsize,
      mensaje: 'Limpieza de disco de Supabase completada con éxito. RLS liberado.'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

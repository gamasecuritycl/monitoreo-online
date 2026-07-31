import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const pool = new Pool({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.onxwyrwmpjxtwlmjrosr',
  password: 'yr43d8lek%fr$6!xDzlMuqVf',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 6000,
  connectionTimeoutMillis: 8000,
})

const CUENTAS_INTERNAS = [
  'CLIENTES', 'CODIGOS', 'ZONAS', '__SINCRONIZADOR__',
  'CONFIG_OPERADORES', 'CLIENTES_MAESTROS_CRM',
  'EMPRESAS_CONGLOMERADO', 'COTIZACIONES_DOLIBARR', 'ORDENES_TRABAJO'
]

function esCuentaInterna(cuenta: string): boolean {
  const c = (cuenta || '').toUpperCase().trim()
  if (c.startsWith('CAMARAS_DAHUA_') || c.startsWith('DAHUA_FRAME_') || c.startsWith('DAHUA_STREAM_REQ_') || c.startsWith('SNAPSHOT_') || c.startsWith('CLIP_')) return true
  return CUENTAS_INTERNAS.includes(c)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '200')
  const tipo = searchParams.get('tipo') || 'eventos'

  try {
    const client = await pool.connect()
    try {
      if (tipo === 'operadores') {
        const { rows } = await client.query(
          `SELECT nombre_abonado FROM eventos_monitoreo WHERE cuenta = 'CONFIG_OPERADORES' ORDER BY id DESC LIMIT 1`
        )
        if (rows.length > 0 && rows[0].nombre_abonado) {
          return NextResponse.json({ data: [{ nombre_abonado: rows[0].nombre_abonado }] })
        }
        return NextResponse.json({ data: [] })
      }

      if (tipo === 'clientes') {
        const { rows } = await client.query(
          `SELECT nombre_abonado FROM eventos_monitoreo WHERE cuenta = 'CLIENTES' ORDER BY id DESC LIMIT 1`
        )
        if (rows.length > 0 && rows[0].nombre_abonado) {
          const parsed = JSON.parse(rows[0].nombre_abonado)
          return NextResponse.json({ data: [{ nombre_abonado: rows[0].nombre_abonado }] })
        }
        return NextResponse.json({ data: [] })
      }

      if (tipo === 'codigos') {
        const { rows } = await client.query(
          `SELECT nombre_abonado FROM eventos_monitoreo WHERE cuenta = 'CODIGOS' ORDER BY id DESC LIMIT 1`
        )
        if (rows.length > 0 && rows[0].nombre_abonado) {
          return NextResponse.json({ data: [{ nombre_abonado: rows[0].nombre_abonado }] })
        }
        return NextResponse.json({ data: [] })
      }

      if (tipo === 'zonas') {
        const { rows } = await client.query(
          `SELECT nombre_abonado FROM eventos_monitoreo WHERE cuenta = 'ZONAS' ORDER BY id DESC LIMIT 1`
        )
        if (rows.length > 0 && rows[0].nombre_abonado) {
          return NextResponse.json({ data: [{ nombre_abonado: rows[0].nombre_abonado }] })
        }
        return NextResponse.json({ data: [] })
      }

      const { rows } = await client.query(
        `SELECT * FROM eventos_monitoreo
         WHERE cuenta NOT IN (${CUENTAS_INTERNAS.map((_, i) => '$' + (i + 1)).join(',')})
           AND cuenta NOT LIKE 'CAMARAS_DAHUA_%'
           AND cuenta NOT LIKE 'DAHUA_FRAME_%'
           AND cuenta NOT LIKE 'DAHUA_STREAM_REQ_%'
           AND cuenta NOT LIKE 'SNAPSHOT_%'
           AND cuenta NOT LIKE 'CLIP_%'
         ORDER BY id DESC
         LIMIT $${CUENTAS_INTERNAS.length + 1}`,
        [...CUENTAS_INTERNAS, limit]
      )
      const filtered = rows.filter((r: any) => !esCuentaInterna(r.cuenta))
      const ordered = filtered.reverse()
      return NextResponse.json({ data: ordered })
    } finally {
      client.release()
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message, data: [] }, { status: 500 })
  }
}

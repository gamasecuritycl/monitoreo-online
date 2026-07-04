const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.onxwyrwmpjxtwlmjrosr',
  password: 'yr43d8lek%fr$6!xDzlMuqVf',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect()
    await client.query(`
      ALTER TABLE public.notificaciones_whatsapp 
      ADD COLUMN IF NOT EXISTS notificar_apertura BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS notificar_cierre BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS notificar_alarma BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS notificar_energia BOOLEAN DEFAULT true;

      UPDATE public.notificaciones_whatsapp SET
        notificar_alarma = true, notificar_energia = true,
        notificar_apertura = false, notificar_cierre = false
      WHERE notificar_alarma IS NULL;
    `)
    console.log('Columnas agregadas OK')

    const r = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'notificaciones_whatsapp' ORDER BY ordinal_position"
    )
    console.log('Columnas:', r.rows.map(c => c.column_name).join(', '))
    await client.end()
  } catch (err) {
    console.error('Error:', err.message)
    try { await client.end() } catch {}
  }
}
run()

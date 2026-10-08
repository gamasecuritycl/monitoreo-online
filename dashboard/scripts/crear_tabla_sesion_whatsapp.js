const { Client } = require('pg');

async function main() {
  const connectionString = "postgresql://postgres.onxwyrwmpjxtwlmjrosr:yr43d8lek%25fr$6!xDzlMuqVf@aws-0-sa-east-1.pooler.supabase.com:6543/postgres";
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Conectado a PostgreSQL Supabase');

    const sql = `
      CREATE TABLE IF NOT EXISTS public.whatsapp_cloud_sessions (
          session_id VARCHAR(100) PRIMARY KEY,
          files JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE public.whatsapp_cloud_sessions ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Permitir todo en whatsapp_cloud_sessions" ON public.whatsapp_cloud_sessions;
      CREATE POLICY "Permitir todo en whatsapp_cloud_sessions" ON public.whatsapp_cloud_sessions
        FOR ALL USING (true) WITH CHECK (true);
    `;

    await client.query(sql);
    console.log('✅ Tabla public.whatsapp_cloud_sessions creada y configurada con RLS abierto exitosamente.');
  } catch (err) {
    console.error('Error creando tabla:', err);
  } finally {
    await client.end();
  }
}

main();

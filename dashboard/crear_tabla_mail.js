const { Client } = require('pg');

const connectionString = "postgresql://postgres:yr43d8lek%25fr$6!xDzlMuqVf@db.onxwyrwmpjxtwlmjrosr.supabase.co:5432/postgres";

const sql_create_table = `
CREATE TABLE IF NOT EXISTS public.notificaciones_mail (
    cuenta VARCHAR(50) PRIMARY KEY,
    emails TEXT[] DEFAULT '{}'
);

-- Habilitar Row Level Security y permitir todo temporalmente
ALTER TABLE public.notificaciones_mail ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en notificaciones_mail" ON public.notificaciones_mail;
CREATE POLICY "Permitir todo en notificaciones_mail" ON public.notificaciones_mail
  FOR ALL
  USING (true)
  WITH CHECK (true);
`;

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Conectado a la base de datos.");
    await client.query(sql_create_table);
    console.log("Tabla 'notificaciones_mail' creada exitosamente.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

main();

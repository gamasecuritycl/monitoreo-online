const { Client } = require('pg')

const connectionString = "postgresql://postgres.onxwyrwmpjxtwlmjrosr:yr43d8lek%25fr$6!xDzlMuqVf@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('Conectando a Supabase PostgreSQL...')
    await client.connect()
    console.log('✅ Conexión exitosa.')

    // 1. Ver consultas activas que puedan estar saturando el CPU
    console.log('\n--- 1. CONSULTAS ACTIVAS ---')
    const resAct = await client.query(`
      SELECT pid, usename, client_addr, state, now() - query_start AS duration, query 
      FROM pg_stat_activity 
      WHERE state != 'idle' AND pid != pg_backend_pid()
      ORDER BY duration DESC LIMIT 10;
    `)
    console.log(JSON.stringify(resAct.rows, null, 2))

    // 2. Ver tamaños de tablas
    console.log('\n--- 2. TAMAÑO DE TABLAS ---')
    const resSize = await client.query(`
      SELECT 
        table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS total_size,
        (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as cols
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
    `)
    console.log(JSON.stringify(resSize.rows, null, 2))

    // 3. Ver índices existentes
    console.log('\n--- 3. ÍNDICES EXISTENTES ---')
    const resIdx = await client.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `)
    console.log(JSON.stringify(resIdx.rows, null, 2))

    // 4. Conteo de filas en tablas críticas
    console.log('\n--- 4. CONTEO DE FILAS ---')
    const resCount = await client.query(`
      SELECT 
        (SELECT count(*) FROM public.eventos_monitoreo) as total_eventos,
        (SELECT count(*) FROM public.conversaciones_whatsapp) as total_whatsapp
    `)
    console.log(JSON.stringify(resCount.rows, null, 2))

    await client.end()
  } catch (err) {
    console.error('❌ Error conectando:', err.message)
  }
}

run()

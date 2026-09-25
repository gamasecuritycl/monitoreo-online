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
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');
    
    const res = await client.query(`
      SELECT 
        table_name,
        pg_size_pretty(pg_total_relation_size('"' || table_schema || '"."' || table_name || '"')) AS total_size,
        pg_total_relation_size('"' || table_schema || '"."' || table_name || '"') AS raw_size
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY raw_size DESC;
    `);
    console.table(res.rows);

    const res2 = await client.query(`
      SELECT cuenta, count(*), pg_size_pretty(sum(length(nombre_abonado)::bigint)) as payload_size
      FROM eventos_monitoreo
      WHERE cuenta LIKE 'CONFIG_%'
      GROUP BY cuenta;
    `);
    console.table(res2.rows);

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();

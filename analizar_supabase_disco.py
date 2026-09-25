import psycopg2

raw_pwd = 'yr43d8lek%fr$6!xDzlMuqVf'
print('Testing password with length:', len(raw_pwd))

try:
    conn = psycopg2.connect(
        host='db.onxwyrwmpjxtwlmjrosr.supabase.co',
        port=5432,
        user='postgres',
        password=raw_pwd,
        dbname='postgres'
    )
    print('SUCCESSFULLY CONNECTED TO SUPABASE POSTGRES!')
    cur = conn.cursor()
    
    # 1. Check exact size of table eventos_monitoreo
    cur.execute("SELECT pg_size_pretty(pg_total_relation_size('public.eventos_monitoreo'));")
    print('Total size of eventos_monitoreo:', cur.fetchone()[0])
    
    # 2. Check size by cuenta
    cur.execute("""
        SELECT cuenta, count(*), pg_size_pretty(sum(length(coalesce(nombre_abonado, ''))::bigint)) as payload_size, sum(length(coalesce(nombre_abonado, ''))::bigint) as raw_bytes
        FROM public.eventos_monitoreo
        GROUP BY cuenta
        ORDER BY raw_bytes DESC
        LIMIT 10;
    """)
    print('\n=== TOP 10 CUENTAS BY PAYLOAD SIZE ===')
    for row in cur.fetchall():
        print(f"{row[0]:<30} count: {str(row[1]):<8} size: {row[2]}")
        
    # 3. Total database size
    cur.execute("SELECT pg_size_pretty(pg_database_size('postgres'));")
    print('\nTOTAL DATABASE SIZE:', cur.fetchone()[0])
    
    conn.close()
except Exception as e:
    print('Error:', e)

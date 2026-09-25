import psycopg2

regions = [
    'aws-0-sa-east-1',
    'aws-0-us-east-1',
    'aws-0-us-west-1',
    'aws-0-us-east-2',
    'aws-0-eu-central-1',
    'aws-0-eu-west-1',
    'aws-0-ap-southeast-1'
]
pwd = 'yr43d8lek%fr$6!xDzlMuqVf'

for r in regions:
    host = f'{r}.pooler.supabase.com'
    user = 'postgres.onxwyrwmpjxtwlmjrosr'
    try:
        print(f'Testing {host}...')
        conn = psycopg2.connect(
            host=host, port=6543, user=user, password=pwd, dbname='postgres', connect_timeout=3
        )
        print(f'>>> CONNECTED TO {host}!')
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        print('Query OK!')
        conn.close()
        break
    except Exception as e:
        msg = str(e).split('\n')[0]
        print(f'Failed {host}: {msg}')

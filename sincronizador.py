import time, pyodbc, shutil, os
from supabase import create_client

URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"
supabase = create_client(URL, KEY)

CARPETA_EVENTOS = r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS'
ruta_copia = r'E:\MONITOREO ONLINE\EVENTOS_TEMP.MDB'
password = 'Administ'

def get_ultimo_mdb():
    archivos = [f for f in os.listdir(CARPETA_EVENTOS) if f.upper().endswith('.MDB')]
    if not archivos: return None
    archivos.sort(reverse=True)
    return os.path.join(CARPETA_EVENTOS, archivos[0])

def sincronizar():
    print("--- Verificando nuevos eventos ---")
    ruta_original = get_ultimo_mdb()
    if not ruta_original:
        print("No hay archivos .MDB")
        return

    print(f"Archivo: {os.path.basename(ruta_original)}")
    try:
        if os.path.exists(ruta_copia): os.remove(ruta_copia)
        shutil.copy2(ruta_original, ruta_copia)

        conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ruta_copia};PWD={password};ReadOnly=1;'
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM EVENTOS ORDER BY HORA DESC")
        rows = cursor.fetchall()
        conn.close()

        nuevos = 0
        for row in rows:
            dia = str(row[0])
            hora = str(row[1])
            partes = dia.split('-')
            if len(partes) == 3:
                fecha_hora = f'{partes[2]}-{partes[1]}-{partes[0]}T{hora}'
            else:
                fecha_hora = hora

            data = {
                "fecha_hora": fecha_hora,
                "cuenta": str(row[2]),
                "nombre_abonado": str(row[3]),
                "evento": str(row[4]),
                "zona": str(row[6]),
                "usuario": str(row[7])
            }
            try:
                supabase.table("eventos_monitoreo").insert(data).execute()
                nuevos += 1
            except Exception:
                pass

        print(f"  Nuevos: {nuevos} eventos")

    except Exception as e:
        print(f"  ERROR: {e}")

    if os.path.exists(ruta_copia): os.remove(ruta_copia)
    print("--- Esperando 30 segundos ---")

while True:
    sincronizar()
    time.sleep(30)

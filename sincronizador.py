import time
import pyodbc
import shutil
import os
from supabase import create_client

URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"
supabase = create_client(URL, KEY)

CARPETA_EVENTOS = r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS'
ruta_copia = r'E:\MONITOREO ONLINE\EVENTOS_TEMP.MDB'
password = 'Administ'

def get_ultimo_mdb():
    archivos = [f for f in os.listdir(CARPETA_EVENTOS) if f.upper().endswith('.MDB')]
    if not archivos:
        return None
    archivos.sort(key=lambda f: os.path.getmtime(os.path.join(CARPETA_EVENTOS, f)), reverse=True)
    return os.path.join(CARPETA_EVENTOS, archivos[0])

def sincronizar():
    print("--- Verificando nuevos eventos en Scorpion ---")
    ruta_original = get_ultimo_mdb()
    if not ruta_original:
        print("No se encontraron archivos .MDB en EVENTOS")
        return

    print(f"Archivo: {os.path.basename(ruta_original)}")
    try:
        if os.path.exists(ruta_copia):
            os.remove(ruta_copia)
        shutil.copy2(ruta_original, ruta_copia)

        conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ruta_copia};PWD={password};ReadOnly=1;'
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM EVENTOS ORDER BY HORA DESC")
        registros = cursor.fetchall()
        conn.close()

        nuevos = 0
        for row in registros:
            evento_data = {
                "fecha_hora": str(row.HORA),
                "cuenta": str(row.CUENTA),
                "nombre_abonado": str(row.NOMBRE),
                "evento": str(row.EVENTO),
                "zona": str(row.ZONA),
                "usuario": str(row.USUARIO)
            }
            try:
                supabase.table("eventos_monitoreo").insert(evento_data).execute()
                nuevos += 1
                print(f"  + {row.CUENTA} - {row.EVENTO}")
            except Exception:
                pass

        print(f"Sincronizados: {nuevos} nuevos eventos")

    except Exception as e:
        print(f"ERROR: {e}")

    if os.path.exists(ruta_copia):
        os.remove(ruta_copia)

    print("--- Ciclo finalizado. Esperando 30 segundos ---")

while True:
    sincronizar()
    time.sleep(30)

import time
import pyodbc
import shutil
import os
from supabase import create_client

# Configuración
URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"
supabase = create_client(URL, KEY)

# Rutas
ruta_original = r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS\EVENTOS.MDB'
ruta_copia = r'E:\MONITOREO ONLINE\EVENTOS_TEMP.MDB'
password = 'Administ'

def sincronizar():
    print("--- Verificando nuevos eventos en Scorpion ---")
    try:
        # 1. Copia de seguridad en caliente (no bloquea Scorpion)
        if os.path.exists(ruta_copia):
            os.remove(ruta_copia)
        shutil.copy2(ruta_original, ruta_copia)
        
        # 2. Conexión a la copia (Modo Solo Lectura para evitar errores de bloqueo)
        # Se añade "ReadOnly=1" para mayor seguridad ante el bloqueo del driver
        conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ruta_copia};PWD={password};ReadOnly=1;'
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # 3. Leer los últimos 10 eventos
        cursor.execute("SELECT TOP 10 * FROM EVENTOS ORDER BY HORA DESC") 
        registros = cursor.fetchall()
        
        for row in registros:
            evento_data = {
                "fecha_hora": str(row.HORA),
                "cuenta": str(row.CUENTA),
                "nombre_abonado": str(row.NOMBRE),
                "evento": str(row.EVENTO),
                "zona": str(row.ZONA),
                "usuario": str(row.USUARIO)
            }
            # 4. Insertar en Supabase
            try:
                supabase.table("eventos_monitoreo").insert(evento_data).execute()
                print(f"Sincronizado: {row.CUENTA} - {row.EVENTO}")
            except Exception:
                # Si falla es porque el registro ya existe (duplicado), lo ignoramos
                pass
            
        conn.close()
        
    except Exception as e:
        print(f"ERROR: {e}")
    
    # 5. Limpieza del archivo temporal
    if os.path.exists(ruta_copia):
        os.remove(ruta_copia)
        
    print("--- Ciclo finalizado. Esperando 30 segundos ---")

# Bucle principal
while True:
    sincronizar()
    time.sleep(30)
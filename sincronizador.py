import pyodbc
from supabase import create_client, Client
import time

# --- CONFIGURACIÓN ---
SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ruta_db = r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS\2026-06-30.MDB'
password = 'Administ'
tabla = 'EVENTOS'

def sincronizar():
    print("Verificando nuevos eventos...")
    try:
        conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ruta_db};PWD={password};'
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Consultamos los últimos 5 para probar
        cursor.execute(f"SELECT TOP 5 * FROM {tabla} ORDER BY HORA DESC")
        registros = cursor.fetchall()
        
        if not registros:
            print("No se encontraron registros en la base de datos local.")
        else:
            print(f"Se encontraron {len(registros)} registros. Intentando enviar...")
            for row in registros:
                # Usamos los nombres exactos de las columnas que vimos antes
                data = {
                    "cuenta": str(row.CUENTA),
                    "evento": str(row.EVENTO),
                    "nombre_abonado": str(row.NOMBRE),
                    "zona": str(row.ZONA),
                    "usuario": str(row.USUARIO)
                }
                
                try:
                    response = supabase.table("eventos_monitoreo").insert(data).execute()
                    print(f"¡ÉXITO! Sincronizado: {row.CUENTA} - {row.EVENTO}")
                except Exception as e:
                    print(f"Error al enviar a Supabase: {e}")
            
        conn.close()
    except Exception as e:
        print(f"Error de conexión con la base local: {e}")

if __name__ == "__main__":
    print("=== INICIANDO SINCRO NIZADOR DE GAMA ===")
    while True:
        sincronizar()
        time.sleep(10) # Reduje el tiempo a 10s para probar rápido
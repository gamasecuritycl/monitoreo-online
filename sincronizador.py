import time
import pyodbc
from supabase import create_client

# Configuración
url = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"
supabase = create_client(url, key)

# Ajusta esta ruta a la exacta de tu PC DE TOMAS
ruta_db = r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS\EVENTOS.MDB' 
password = 'Administ'

def sincronizar():
    print("--- Verificando nuevos eventos en Scorpion ---")
    try:
        # Conexión a la base de datos local
        conn = pyodbc.connect(f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ruta_db};PWD={password};')
        cursor = conn.cursor()
        
        # Leemos los últimos 10 eventos ordenados por fecha
        cursor.execute("SELECT TOP 10 * FROM EVENTOS ORDER BY HORA DESC") 
        registros = cursor.fetchall()
        
        for row in registros:
            # Preparamos los datos según la estructura que definimos
            # Asegúrate de que los nombres de los campos (row.CUENTA, etc) 
            # coincidan exactamente con las columnas de tu archivo MDB
            evento_data = {
                "fecha_hora": str(row.HORA),
                "cuenta": str(row.CUENTA),
                "nombre_abonado": str(row.NOMBRE),
                "evento": str(row.EVENTO),
                "zona": str(row.ZONA),
                "usuario": str(row.USUARIO)
            }
            
            # Intentamos insertar en Supabase
            # Si el script falla aquí, es posible que el nombre de la tabla no sea "eventos_monitoreo"
            supabase.table("eventos_monitoreo").insert(evento_data).execute()
            print(f"Sincronizado: {row.CUENTA} - {row.EVENTO}")
            
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")
    
    print("--- Ciclo finalizado. Esperando 30 segundos... ---")

# Bucle para mantener el script activo
while True:
    sincronizar()
    time.sleep(30)
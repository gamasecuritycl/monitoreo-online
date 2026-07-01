import pyodbc
import os

# --- CONFIGURACIÓN ---
ruta_db = r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS\2026-06-30.MDB'
password = 'Administ'
tabla = 'EVENTOS'

def obtener_alarmas():
    print(f"--- Leyendo registros de la tabla: {tabla} ---")
    
    try:
        conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ruta_db};PWD={password};'
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Leemos los últimos 10 eventos
        cursor.execute(f"SELECT TOP 10 * FROM {tabla} ORDER BY HORA DESC")
        
        columnas = [column[0] for column in cursor.description]
        print(f"Columnas detectadas: {columnas}")
        print("-" * 50)
        
        for row in cursor.fetchall():
            print(row)
            
        conn.close()
        print("-" * 50)
        print("Lectura finalizada con éxito.")
        
    except Exception as e:
        print(f"Error al leer la tabla: {e}")

    input("\nPresiona ENTER para salir...")

if __name__ == "__main__":
    obtener_alarmas()
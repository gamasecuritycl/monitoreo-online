import pyodbc
import os

# --- CONFIGURACIÓN ---
# Asegúrate de que esta ruta sea exactamente la ruta real de tu pendrive
ruta_db = r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS\2026-06-30.MDB'
password = 'Administ'

def listar_tablas():
    print("--- Iniciando validación con contraseña ---")
    
    if not os.path.exists(ruta_db):
        print(f"Error: No encuentro el archivo en: {ruta_db}")
        input("Presiona ENTER para salir...")
        return

    try:
        # La cadena de conexión ahora incluye el parámetro PWD (password)
        conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ruta_db};PWD={password};'
        
        print("Intentando conectar...")
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        print("Conexión exitosa. Buscando tablas...")
        print("-" * 30)
        
        tablas_encontradas = False
        for table_info in cursor.tables(tableType='TABLE'):
            print(f"Tabla encontrada: {table_info.table_name}")
            tablas_encontradas = True
            
        if not tablas_encontradas:
            print("No se encontraron tablas (o el acceso está restringido).")
            
        print("-" * 30)
        conn.close()
        print("Validación finalizada.")
        
    except Exception as e:
        print(f"Error al intentar leer: {e}")
        print("Tip: Verifica si la contraseña es exactamente 'Administ' o si el driver requiere permisos adicionales.")

    input("\nPresiona ENTER para cerrar esta ventana...")

if __name__ == "__main__":
    listar_tablas()
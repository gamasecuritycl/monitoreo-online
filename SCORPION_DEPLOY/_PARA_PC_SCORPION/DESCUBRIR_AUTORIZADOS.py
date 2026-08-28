"""
GAMA SECURITY - DETECTOR AUTOMÁTICO DE BASE DE DATOS DE PERSONAS AUTORIZADAS
=============================================================================
Escanea C:\\SCORPION y busca qué archivo .MDB y tabla contiene las Personas Autorizadas
(buscando por ejemplo la cuenta 0462 o el nombre ROMINA PALMA).
"""

import os
import sys
import time

CANDIDATAS_RUTAS = [
    r"C:\SCORPION\BASES DE DATOS",
    r"C:\SCORPION\BASE DE DATOS",
    r"C:\SCORPION",
]

PASSWORDS = ["SCORPION7", "Administ", "scorpion", "1234", ""]

def buscar_en_mdb(ruta_mdb):
    nombre_archivo = os.path.basename(ruta_mdb)
    print(f"\n[+] Analizando: {ruta_mdb}")
    
    # 1. Probar ADODB
    try:
        import win32com.client
        for pwd in PASSWORDS:
            try:
                conn = win32com.client.Dispatch('ADODB.Connection')
                conn_str = f"Provider=Microsoft.ACE.OLEDB.12.0;Data Source={ruta_mdb};Jet OLEDB:Database Password={pwd};Mode=Share Deny None;"
                try:
                    conn.Open(conn_str)
                except Exception:
                    conn_str = f"Provider=Microsoft.Jet.OLEDB.4.0;Data Source={ruta_mdb};Jet OLEDB:Database Password={pwd};Mode=Share Deny None;"
                    conn.Open(conn_str)
                
                # Listar tablas
                rs_tables = conn.OpenSchema(20) # adSchemaTables
                tablas = []
                while not rs_tables.EOF:
                    t_type = str(rs_tables.Fields('TABLE_TYPE').Value).upper()
                    t_name = str(rs_tables.Fields('TABLE_NAME').Value)
                    if t_type == 'TABLE' and not t_name.startswith('MSys') and not t_name.startswith('~'):
                        tablas.append(t_name)
                    rs_tables.MoveNext()
                rs_tables.Close()
                
                print(f"   Password: '{pwd}' | Tablas ({len(tablas)}): {', '.join(tablas)}")
                
                for t in tablas:
                    try:
                        rs = win32com.client.Dispatch('ADODB.Recordset')
                        rs.Open(f"SELECT * FROM [{t}]", conn)
                        cols = [rs.Fields(i).Name for i in range(rs.Fields.Count)]
                        
                        # Buscar si tiene registros de Romina Palma o cuenta 0462
                        encontrado = False
                        filas_muestra = []
                        count = 0
                        while not rs.EOF and count < 100:
                            row_txt = " ".join([str(rs.Fields(i).Value or "") for i in range(rs.Fields.Count)]).upper()
                            if "ROMINA" in row_txt or "PALMA" in row_txt or "0462" in row_txt or "ANDREA" in row_txt or "BOUSSAC" in row_txt:
                                encontrado = True
                                fila_dict = {rs.Fields(i).Name: rs.Fields(i).Value for i in range(rs.Fields.Count)}
                                filas_muestra.append(fila_dict)
                            count += 1
                            rs.MoveNext()
                        rs.Close()
                        
                        if encontrado:
                            print("\n" + "=" * 70)
                            print(f"🎯 ¡ENCONTRADA BASE DE DATOS DE PERSONAS AUTORIZADAS!")
                            print(f"📁 Archivo: {ruta_mdb}")
                            print(f"🔑 Password: {pwd}")
                            print(f"📊 Tabla: [{t}]")
                            print(f"📋 Columnas: {cols}")
                            print(f"👤 Registros de muestra encontrados:")
                            for f in filas_muestra:
                                print(f"   -> {f}")
                            print("=" * 70 + "\n")
                            return True
                    except Exception as ex_t:
                        pass
                
                conn.Close()
                break # Password correcto encontrado
            except Exception:
                continue
    except Exception as e:
        print(f"   Error general al inspeccionar: {e}")
        
    return False

def main():
    print("=" * 70)
    print("  GAMA SECURITY - BUSCADOR DE BASE DE DATOS DE PERSONAS AUTORIZADAS")
    print("=" * 70)
    
    archivos_mdb = []
    for raiz in CANDIDATAS_RUTAS:
        if os.path.exists(raiz):
            for root, dirs, files in os.walk(raiz):
                for f in files:
                    if f.upper().endswith(".MDB") and not f.startswith("_") and not f.startswith("~"):
                        full_p = os.path.join(root, f)
                        if full_p not in archivos_mdb:
                            archivos_mdb.append(full_p)
                            
    print(f"Total de archivos .MDB encontrados en PC Scorpion: {len(archivos_mdb)}")
    
    encontrados = 0
    for mdb in archivos_mdb:
        if buscar_en_mdb(mdb):
            encontrados += 1
            
    print("\n" + "=" * 70)
    if encontrados > 0:
        print(f"✅ Búsqueda finalizada: Se localizó la base de datos con éxito.")
    else:
        print("ℹ️ No se encontró el registro 'ROMINA PALMA' en los MDB analizados.")
        print("Revisa si hay otra carpeta o subdirectorio con bases de datos.")
    print("=" * 70)
    input("\nPresiona ENTER para salir...")

if __name__ == "__main__":
    main()

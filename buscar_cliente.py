import pyodbc
from sincronizador import PASSWORDS_PROBAR_MDB

for pwd in PASSWORDS_PROBAR_MDB:
    try:
        conn = pyodbc.connect(f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ=C:\\SCORPION\\BASE DE DATOS\\GENERAL.mdb;PWD={pwd};ReadOnly=1;')
        cursor = conn.cursor()
        cursor.execute("SELECT CUENTA, NOMBRE, SECTOR, CIUDAD, TELEFONO1, OBSERVACION1, COMENTARIO FROM USUARIOS WHERE NOMBRE LIKE '%TALITA%' OR NOMBRE LIKE '%AQUARIUS%' OR NOMBRE LIKE '%ILLAPEL%' OR CUENTA LIKE '%7CC%';")
        rows = cursor.fetchall()
        print('Found in GENERAL.mdb:', len(rows))
        for r in rows:
            print(f'CUENTA: {r[0]} | NOMBRE: {r[1]} | SECTOR: {r[2]} | CIUDAD: {r[3]} | OBS: {r[5]}')
        conn.close()
        break
    except Exception as e:
        pass

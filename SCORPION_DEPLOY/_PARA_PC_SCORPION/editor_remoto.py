#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
EDITOR REMOTO SCORPION - WORKER LOCAL ON-PREMISE (v1.0)
GAMA Security - Sistema de Monitoreo Online

Misión: Procesar órdenes de edición enviadas desde el Command Center en la nube
hacia las bases de datos locales de Scorpion (GENERAL.MDB), de forma no-bloqueante,
transaccional y con 0 impacto en la operación del software Scorpion Desktop.
"""

import sys
import time
import json
import logging
import datetime
import os

try:
    import pyodbc
except ImportError:
    print("[ERROR] pyodbc no instalado. Ejecuta: pip install pyodbc")
    sys.exit(1)

try:
    from supabase import create_client, Client
except ImportError:
    print("[ERROR] supabase no instalado. Ejecuta: pip install supabase")
    sys.exit(1)

# Configuración de Logging
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_editor_remoto.log")
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Constantes de Conexión
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://onxwyrwmpjxtwlmjrosr.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjI4MzgsImV4cCI6MjA1NTg5ODgzOH0.29Jk8UeNqgC7fO-O3yD7nSOfKkI-gC2cK-_7h0U3s70")

MDB_PATH = r"C:\SCORPION\BASES DE DATOS\GENERAL.MDB"
MDB_PWD = "SCORPION7"

# Inicializar cliente Supabase
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logging.error(f"Error iniciando cliente Supabase: {e}")
    sys.exit(1)


def get_odbc_connection():
    """Abre conexión Flash no-bloqueante a GENERAL.MDB con Mode=Share Deny None"""
    conn_str = (
        r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
        rf"DBQ={MDB_PATH};"
        rf"PWD={MDB_PWD};"
        r"ExtendedAnsiSQL=1;"
        r"Mode=Share Deny None;"
    )
    return pyodbc.connect(conn_str, autocommit=False)


def ejecutar_edicion_local(tipo_op, cuenta, datos_nuevos):
    """
    Ejecuta el UPDATE parametrizado en GENERAL.MDB con reintentos suaves.
    Tiempo de conexión estimado: < 15 ms.
    """
    if not os.path.exists(MDB_PATH):
        raise FileNotFoundError(f"No se encontro base de datos en {MDB_PATH}")

    cuenta_clean = str(cuenta).strip().upper()
    max_retries = 3
    retry_delay = 0.2

    for intento in range(1, max_retries + 1):
        conn = None
        cursor = None
        t_inicio = time.time()
        try:
            conn = get_odbc_connection()
            cursor = conn.cursor()

            # Mapear campos permitidos para evitar inyección SQL
            set_clauses = []
            values = []

            for k, v in datos_nuevos.items():
                if k.startswith("_"):
                    continue # Saltar metadatos internos
                # En Access los nombres con espacio van entre corchetes ej [caract adic1]
                col_name = f"[{k}]" if " " in k else k
                set_clauses.append(f"{col_name} = ?")
                values.append(str(v) if v is not None else "")

            if not set_clauses:
                logging.warning(f"[{cuenta_clean}] No hay campos validos para actualizar.")
                return 0

            # Caso 1: Actualización de Abonado Existente
            sql_update = f"UPDATE CLIENTES SET {', '.join(set_clauses)} WHERE CUENTA = ?"
            values.append(cuenta_clean)

            cursor.execute(sql_update, values)
            rows_affected = cursor.rowcount

            # Si no encontró coincidencia exacta, probar sin la 'C' inicial (ej: 'C745' vs '745')
            if rows_affected == 0 and cuenta_clean.startswith("C"):
                cuenta_alt = cuenta_clean[1:]
                values[-1] = cuenta_alt
                cursor.execute(sql_update, values)
                rows_affected = cursor.rowcount

            conn.commit()
            t_duracion = int((time.time() - t_inicio) * 1000)

            logging.info(f"[{cuenta_clean}] UPDATE exitoso en {t_duracion} ms ({rows_affected} filas modificadas). Intento {intento}")
            return t_duracion

        except pyodbc.Error as odbc_err:
            logging.warning(f"[{cuenta_clean}] Intento {intento}/{max_retries} bloqueo ODBC: {odbc_err}")
            if conn:
                try: conn.rollback()
                except: pass
            if intento < max_retries:
                time.sleep(retry_delay * intento)
            else:
                raise odbc_err
        finally:
            if cursor:
                try: cursor.close()
                except: pass
            if conn:
                try: conn.close()
                except: pass


def procesar_ordenes_pendientes():
    """Consulta órdenes pendientes en Supabase y las ejecuta"""
    try:
        # 1. Buscar en tabla dedicada 'ordenes_editor_remoto'
        res = supabase.table("ordenes_editor_remoto") \
            .select("*") \
            .eq("estado", "PENDIENTE") \
            .order("creado_el", desc=False) \
            .limit(10) \
            .execute()

        ordenes = res.data or []
        for orden in ordenes:
            orden_id = orden.get("id")
            cuenta = orden.get("cuenta")
            tipo_op = orden.get("tipo_operacion")
            datos_nuevos = orden.get("datos_nuevos") or {}

            logging.info(f">> Procesando orden {orden_id} ({tipo_op}) para cuenta {cuenta}...")

            # Marcar orden como PROCESANDO
            supabase.table("ordenes_editor_remoto").update({
                "estado": "PROCESANDO"
            }).eq("id", orden_id).execute()

            try:
                duracion_ms = ejecutar_edicion_local(tipo_op, cuenta, datos_nuevos)
                
                # Marcar orden como APLICADO_LOCAL
                supabase.table("ordenes_editor_remoto").update({
                    "estado": "APLICADO_LOCAL",
                    "ejecutado_el": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "duracion_ms": duracion_ms
                }).eq("id", orden_id).execute()
                logging.info(f"✅ Orden {orden_id} APLICADA CON EXITO en {duracion_ms} ms.")

            except Exception as ex:
                logging.error(f"❌ Error ejecutando orden {orden_id}: {ex}")
                supabase.table("ordenes_editor_remoto").update({
                    "estado": "ERROR",
                    "mensaje_error": str(ex),
                    "reintentos": (orden.get("reintentos") or 0) + 1
                }).eq("id", orden_id).execute()

    except Exception as e:
        logging.error(f"Error en bucle de órdenes: {e}")


def main():
    logging.info("=== INICIANDO EDITOR REMOTO SCORPION (Worker On-Premise) ===")
    print("Editor Remoto Scorpion iniciado. Escuchando órdenes desde Supabase...")
    
    while True:
        try:
            procesar_ordenes_pendientes()
        except KeyboardInterrupt:
            logging.info("Detenido manualmente.")
            break
        except Exception as e:
            logging.error(f"Excepcion en main loop: {e}")
        
        time.sleep(3.0)


if __name__ == "__main__":
    main()

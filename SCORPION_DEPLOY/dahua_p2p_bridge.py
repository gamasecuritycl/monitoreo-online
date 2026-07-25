"""
===============================================================================
 GAMA SEGURIDAD - DAHUA NVR / DVR / XVR MULTI-CHANNEL ENGINE (CONCURRENT ENGINE)
 ===============================================================================
 Arquitectura: Concurrente y BAJO DEMANDA (On-Demand).
 Proposito: Evita bloqueos y saturacion de conexiones P2P en camaras y NVRs.
 REGLAS DE LIFECYCLE DE TRANSMISION:
  - SOLO inicia la captura de un canal cuando hay una peticion activa local o en la nube.
  - Detiene la captura automaticamente despues de 30 segundos de inactividad (sin peticiones).
  - Actualiza en-sitio (update) una UNICA fila por camara en Supabase (cuenta = DAHUA_FRAME_{SN}_CH_{canal}).
  - Los frames incluyen timestamp ISO para que el dashboard pueda verificar frescura.
 FIXES v2:
  - Deteccion de arquitectura Python 32/64-bit para SDK DLL.
  - Dominios P2P Lechange/Imou agregados (camaras Dahua modernas).
  - IP local leida desde configuracion de la camara en Supabase.
  - Heartbeat keep-alive thread cada 30s para mantener sesion P2P.
  - Endpoint /status con diagnostico de DNS y SDK.
===============================================================================
"""

import os
import sys
import time
import base64
import json
import socket
import logging
import threading
import requests
from requests.auth import HTTPDigestAuth
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from datetime import datetime, timezone

SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_dahua_bridge.log")
logging.basicConfig(
    filename=LOG_PATH,
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('dahua_bridge')
console = logging.StreamHandler()
console.setLevel(logging.INFO)
console.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S'))
logger.addHandler(console)

# ==============================================================================
#  DETECCION DE ARQUITECTURA PYTHON (32 vs 64-bit)
# ==============================================================================
PYTHON_ARCH = 64 if sys.maxsize > 2**32 else 32
logger.info(f"[SDK] Arquitectura Python detectada: {PYTHON_ARCH}-bit")

# Dominios P2P de Dahua / Lechange / Imou a probar por SN
# Orden: nuevos dominios modernos primero (Lechange/Imou), luego los clasicos
P2P_DOMAINS = [
    # Lechange (camaras Dahua modernas post-2019)
    ("http",  "{sn}.lechange.com",       "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.lechange.com",       "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.lechange.cn",        "/cgi-bin/snapshot.cgi"),
    # Imou (marca consumer de Dahua)
    ("http",  "{sn}.imoulife.com",       "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.imoulife.com",       "/cgi-bin/snapshot.cgi"),
    # Easy4ip (NVRs/DVRs clasicos Dahua)
    ("http",  "{sn}.easy4ipcloud.com",   "/onvifsnapshot/media_service/snapshot"),
    ("https", "{sn}.easy4ipcloud.com",   "/onvifsnapshot/media_service/snapshot"),
    ("http",  "{sn}.easy4ipcloud.com",   "/cgi-bin/snapshot.cgi"),
    # Dahua P2P clasico
    ("http",  "{sn}.dahuap2p.com",       "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.dahuap2p.com",       "/cgi-bin/snapshot.cgi"),
    # Otros clouds P2P
    ("http",  "{sn}.myp2pcloud.com",     "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.myp2pcloud.com",     "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.mypeoplecloud.com",  "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.ipcver.com",         "/cgi-bin/snapshot.cgi"),
]

# Cache global de DNS (para /status y diagnostico)
_dns_cache: dict = {}  # sn -> {domain: "OK"|"FAIL"}

def check_p2p_dns(sn: str) -> dict:
    """Verifica qué dominios P2P resuelven DNS para un SN dado. Cachea resultado."""
    if sn in _dns_cache:
        return _dns_cache[sn]
    results = {}
    unique_hosts = set()
    for scheme, host_tpl, path in P2P_DOMAINS:
        host = host_tpl.format(sn=sn)
        unique_hosts.add(host)
    for host in unique_hosts:
        try:
            socket.gethostbyname(host)
            results[host] = "OK"
            logger.info(f"[DNS] {host} => RESUELVE OK")
        except socket.gaierror:
            results[host] = "FAIL"
            logger.warning(f"[DNS] {host} => NO RESUELVE")
    _dns_cache[sn] = results
    return results


def build_endpoints(sn: str, canal: int, local_ip: str = None, stream_type: str = "sub") -> list:
    """Construye lista de URLs a probar para una camara, en orden de prioridad."""
    endpoints = []

    # Si hay IP local configurada, primero intentar acceso directo (mas rapido)
    if local_ip and local_ip.strip():
        ip = local_ip.strip()
        # CGI snapshot directo con canal (substream type: 0=main, 1=sub)
        stream_code = 1 if stream_type == "sub" else 0
        endpoints += [
            f"http://{ip}/cgi-bin/snapshot.cgi?channel={canal}&subtype={stream_code}",
            f"http://{ip}/cgi-bin/snapshot.cgi?channel={canal}",
            f"https://{ip}/cgi-bin/snapshot.cgi?channel={canal}",
        ]

    # Endpoints P2P cloud (todos los dominios conocidos)
    for scheme, host_tpl, path in P2P_DOMAINS:
        host = host_tpl.format(sn=sn)
        # Agregar parametros segun el tipo de path
        if "snapshot" in path and "onvif" not in path:
            url = f"{scheme}://{host}{path}?channel={canal}"
        elif "onvif" in path:
            url = f"{scheme}://{host}{path}?channel={canal}"
        else:
            url = f"{scheme}://{host}{path}?channel={canal}"
        endpoints.append(url)

    # IPs locales de fallback (solo si no hay IP configurada)
    if not local_ip:
        for ip_fallback in ["192.168.1.19", "192.168.1.2", "192.168.1.18",
                            "192.168.0.19", "192.168.1.100", "192.168.0.100"]:
            endpoints.append(f"http://{ip_fallback}/cgi-bin/snapshot.cgi?channel={canal}")

    return endpoints


# ==============================================================================
#  DAHUA NETSDK P2P TUNNEL - CAPTURA NATIVA VIA DLL (ctypes)
# ==============================================================================

import ctypes
import ctypes.util
from ctypes import c_char_p, c_int, c_void_p, c_ubyte, c_long, c_bool, byref, create_string_buffer, POINTER, Structure, CFUNCTYPE

class SDK_P2PEngine:
    """Motor P2P nativo usando dhnetsdk.dll.
    Solo funciona si Python y la DLL son de la misma arquitectura (ambos 64-bit o ambos 32-bit)."""

    DLL_PATH    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dhnetsdk.dll")
    DLL_PATH_64 = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dhnetsdk_x64.dll")

    def __init__(self):
        self.dll = None
        self.login_handle = None
        self.initialized = False
        self._arch_error = False
        self._load_dll()

    def _load_dll(self):
        # Determinar cual DLL cargar segun arquitectura
        dll_path = None
        if PYTHON_ARCH == 64 and os.path.exists(self.DLL_PATH_64):
            dll_path = self.DLL_PATH_64
            logger.info(f"[SDK] Usando DLL 64-bit: {dll_path}")
        elif PYTHON_ARCH == 32 and os.path.exists(self.DLL_PATH):
            dll_path = self.DLL_PATH
            logger.info(f"[SDK] Usando DLL 32-bit: {dll_path}")
        elif os.path.exists(self.DLL_PATH):
            # Intentar cargar la DLL disponible, puede fallar si hay mismatch de arq.
            dll_path = self.DLL_PATH
            logger.warning(f"[SDK] Python es {PYTHON_ARCH}-bit pero solo hay dhnetsdk.dll (posible 32-bit). Intentando igual...")
        else:
            logger.warning(f"[SDK] No se encontro ninguna DLL Dahua SDK en {os.path.dirname(self.DLL_PATH)}")
            return

        try:
            self.dll = ctypes.WinDLL(dll_path)
            logger.info(f"[SDK] DLL cargada correctamente ({os.path.getsize(dll_path):,} bytes)")

            # Definir prototipos de funciones SDK
            self.dll.CLIENT_Init.argtypes = [c_void_p, c_void_p, c_void_p]
            self.dll.CLIENT_Init.restype = c_bool

            self.dll.CLIENT_SetConnectTime.argtypes = [c_int]
            self.dll.CLIENT_SetConnectTime.restype = None

            self.dll.CLIENT_LoginByIP.argtypes = [c_char_p, c_int, c_char_p, c_char_p, c_int, c_void_p, c_void_p]
            self.dll.CLIENT_LoginByIP.restype = c_long

            self.dll.CLIENT_Logout.argtypes = [c_long]
            self.dll.CLIENT_Logout.restype = c_bool

            self.dll.CLIENT_Cleanup.argtypes = []
            self.dll.CLIENT_Cleanup.restype = None

            result = self.dll.CLIENT_Init(None, None, None)
            if result:
                self.initialized = True
                self.dll.CLIENT_SetConnectTime(3000)  # 3s timeout
                logger.info("[SDK] SDK Dahua inicializado exitosamente")
            else:
                logger.error("[SDK] Fallo CLIENT_Init")
        except OSError as e:
            if "193" in str(e) or "Win32" in str(e):
                self._arch_error = True
                logger.error(
                    f"[SDK] ERROR DE ARQUITECTURA: La DLL '{os.path.basename(dll_path)}' es de "
                    f"{'32-bit' if PYTHON_ARCH == 64 else '64-bit'} pero Python es {PYTHON_ARCH}-bit. "
                    f"Necesitas la version {'64-bit (dhnetsdk_x64.dll)' if PYTHON_ARCH == 64 else '32-bit (dhnetsdk.dll)'} del SDK Dahua."
                )
            else:
                logger.error(f"[SDK] Error cargando DLL: {e}")
        except Exception as e:
            logger.error(f"[SDK] Error inesperado cargando DLL: {e}")

    def login_p2p(self, sn, user="admin", password="", port=37777):
        """Conecta a camara via P2P usando numero de serie."""
        if not self.initialized:
            return False
        try:
            sn_bytes   = sn.encode('utf-8')
            user_bytes = user.encode('utf-8')
            pass_bytes = password.encode('utf-8')
            device_info = create_string_buffer(1024)
            error = c_int(0)
            logger.info(f"[SDK] Conectando P2P a SN: {sn} (puerto {port})...")
            handle = self.dll.CLIENT_LoginByIP(sn_bytes, port, user_bytes, pass_bytes, 0, device_info, byref(error))
            if handle != 0:
                self.login_handle = handle
                logger.info(f"[SDK] P2P Login OK! SN: {sn}, Handle: {handle}")
                return True
            else:
                logger.warning(f"[SDK] P2P Login FALLIDO SN: {sn}, error={error.value}")
                return False
        except Exception as e:
            logger.error(f"[SDK] Error en login P2P: {e}")
            return False

    def capture_snapshot(self, channel=1):
        """Captura un frame via tunnel P2P."""
        if not self.login_handle:
            return None
        try:
            img_buf = create_string_buffer(2 * 1024 * 1024)
            img_len = c_int(0)
            if hasattr(self.dll, 'CLIENT_SnapPicture'):
                self.dll.CLIENT_SnapPicture.argtypes = [c_long, c_int, c_void_p, POINTER(c_int), c_int]
                self.dll.CLIENT_SnapPicture.restype  = c_bool
                result = self.dll.CLIENT_SnapPicture(self.login_handle, channel - 1, img_buf, byref(img_len), 2000)
                if result and img_len.value > 100:
                    return bytes(img_buf[:img_len.value])
            if hasattr(self.dll, 'CLIENT_SnapPictureEx'):
                logger.info(f"[SDK] Intentando SnapPictureEx CH-{channel}...")
            logger.warning("[SDK] No se pudo capturar snapshot via SDK")
            return None
        except Exception as e:
            logger.error(f"[SDK] Error capturando snapshot: {e}")
            return None

    def logout(self):
        if self.login_handle:
            try:
                self.dll.CLIENT_Logout(self.login_handle)
                logger.info("[SDK] Logout P2P exitoso")
            except Exception:
                pass
            self.login_handle = None

    def cleanup(self):
        self.logout()
        if self.initialized:
            try:
                self.dll.CLIENT_Cleanup()
                logger.info("[SDK] SDK cleanup completado")
            except Exception:
                pass
            self.initialized = False

    @property
    def status_str(self):
        if self._arch_error:
            return f"ERROR_ARCH_MISMATCH (Python={PYTHON_ARCH}bit, DLL es otra arq.)"
        if self.initialized:
            return "OK"
        return "NO_DISPONIBLE"


_sdk_engine = None

def get_sdk_engine():
    global _sdk_engine
    if _sdk_engine is None:
        _sdk_engine = SDK_P2PEngine()
    return _sdk_engine


# ==============================================================================
#  HEARTBEAT / KEEP-ALIVE THREAD
# ==============================================================================

class HeartbeatThread(threading.Thread):
    """Envia keep-alive periodico a todos los workers activos para mantener
    la sesion P2P viva (Dahua cierra el tunel tras ~45s de inactividad)."""

    INTERVAL = 30  # segundos entre heartbeats

    def __init__(self, engine):
        super().__init__(daemon=True)
        self.engine = engine
        self.running = True

    def run(self):
        logger.info("[HEARTBEAT] Hilo keep-alive iniciado (intervalo: 30s)")
        while self.running and self.engine.running:
            time.sleep(self.INTERVAL)
            if not self.engine.running:
                break
            active_keys = [k for k, w in self.engine.workers.items() if w.is_alive()]
            if active_keys:
                logger.info(f"[HEARTBEAT] Enviando keep-alive a {len(active_keys)} worker(s): {active_keys}")
                # Tocar last_request_times para que los workers no se detengan por inactividad
                for key in active_keys:
                    # Solo refrescar si hay peticion activa (no despertar workers dormidos)
                    last = self.engine.last_request_times.get(key, 0)
                    if time.time() - last < 60:  # solo si hubo peticion en el ultimo minuto
                        self.engine.last_request_times[key] = time.time()
                        logger.info(f"[HEARTBEAT] Keep-alive enviado a {key}")


# ==============================================================================
#  CAMERA WORKER
# ==============================================================================

class CameraWorker(threading.Thread):
    """Worker que captura frames de una camara/NVR Dahua especifico."""

    def __init__(self, engine, sn, user, pas, canal, local_ip=None, stream_type="sub"):
        super().__init__(daemon=True)
        self.engine      = engine
        self.sn          = sn
        self.user        = user
        self.pas         = pas
        self.canal       = canal
        self.local_ip    = local_ip    # IP local de la camara (puede ser None)
        self.stream_type = stream_type # "sub" o "main"
        self.running     = True
        self.last_upload_time = 0
        self.backoff     = 0.3

    def run(self):
        key  = f"{self.sn}_{self.canal}"
        auth = HTTPDigestAuth(self.user, self.pas)
        logger.info(f"[WORKER] Iniciado para {self.sn} CH-{self.canal} (stream={self.stream_type}, local_ip={self.local_ip})")

        sdk_engine   = get_sdk_engine()
        sdk_logged_in = False

        # Verificar DNS P2P al inicio (una sola vez, para el log)
        check_p2p_dns(self.sn)

        # Construir lista de endpoints con prioridad
        endpoints = build_endpoints(self.sn, self.canal, self.local_ip, self.stream_type)
        logger.info(f"[WORKER] {len(endpoints)} endpoints a probar para {key}")

        consecutive_failures = 0

        while self.running and self.engine.running:
            last_req = self.engine.last_request_times.get(key, 0)
            if time.time() - last_req > 30.0:
                logger.info(f"[WORKER] Deteniendo {key} por inactividad (30s)")
                break

            frame_fetched = False
            for url in endpoints:
                if not self.running or not self.engine.running:
                    break
                try:
                    resp = requests.get(url, auth=auth, timeout=1.5)
                    if resp.status_code == 200 and len(resp.content) > 1000:
                        image_bytes = resp.content
                        self.engine.latest_frames[key] = image_bytes
                        consecutive_failures = 0
                        self.backoff = 0.3

                        now_t = time.time()
                        if now_t - self.last_upload_time > 1.2:
                            self.last_upload_time = now_t
                            ts = datetime.now(timezone.utc).isoformat()
                            t = threading.Thread(
                                target=self.engine.upload_to_supabase_with_ts,
                                args=(self.sn, self.canal, image_bytes, ts),
                                daemon=True,
                            )
                            t.start()

                        # Reordenar endpoints: mover la URL exitosa al frente para la proxima iteracion
                        if endpoints.index(url) > 0:
                            endpoints.remove(url)
                            endpoints.insert(0, url)
                            logger.info(f"[WORKER] URL exitosa movida al frente: {url}")

                        frame_fetched = True
                        break
                except Exception as e:
                    consecutive_failures += 1
                    if consecutive_failures <= 3 or consecutive_failures % 10 == 0:
                        logger.warning(f"[WORKER] Error en {url}: {e} (fallo #{consecutive_failures})")

            if not frame_fetched:
                # SDK P2P nativo como respaldo cada 10 fallos
                if consecutive_failures > 5 and consecutive_failures % 10 == 0 and sdk_engine.initialized:
                    if not sdk_logged_in:
                        logger.info(f"[WORKER] Intentando conexion SDK P2P para {self.sn}...")
                        if sdk_engine.login_p2p(self.sn, self.user, self.pas):
                            sdk_logged_in = True
                        else:
                            logger.warning(f"[WORKER] SDK P2P no disponible para {self.sn}")
                    if sdk_logged_in:
                        logger.info(f"[WORKER] Capturando via SDK P2P {self.sn} CH-{self.canal}...")
                        img_data = sdk_engine.capture_snapshot(self.canal)
                        if img_data and len(img_data) > 1000:
                            self.engine.latest_frames[key] = img_data
                            consecutive_failures = 0
                            self.backoff = 0.3
                            ts = datetime.now(timezone.utc).isoformat()
                            t = threading.Thread(target=self.engine.upload_to_supabase_with_ts,
                                                 args=(self.sn, self.canal, img_data, ts), daemon=True)
                            t.start()
                            logger.info(f"[WORKER] SDK P2P OK! {len(img_data)} bytes - {self.sn} CH-{self.canal}")
                            frame_fetched = True

                if not frame_fetched:
                    self.backoff = min(1.0 + (consecutive_failures * 0.5), 30.0)
                    if consecutive_failures >= 3 and consecutive_failures % 5 == 0:
                        logger.warning(f"[WORKER] {consecutive_failures} fallos consecutivos {key}, backoff={self.backoff:.1f}s")

            time.sleep(0.3 if frame_fetched else self.backoff)

        if sdk_logged_in:
            sdk_engine.logout()
        self.engine.workers.pop(key, None)
        logger.info(f"[WORKER] Finalizado {self.sn} CH-{self.canal}")


# ==============================================================================
#  MULTI-DEVICE ENGINE
# ==============================================================================

class DahuaMultiDeviceEngine:
    """Motor multicanal que administra workers bajo demanda."""

    def __init__(self):
        self.latest_frames      = {}
        self.row_ids            = {}
        self.workers            = {}
        self.last_request_times = {}
        self.registered_devices = []
        self.running            = True
        self.local_ip           = None  # IP global de fallback (sobreescrita por IP de camara)
        self.start_time         = time.time()

    def fetch_all_registered_devices(self):
        devices = []
        try:
            get_url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=like.CAMARAS_DAHUA_%25&select=nombre_abonado,cuenta"
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            r = requests.get(get_url, headers=headers, timeout=5)
            if r.status_code == 200:
                rows = r.json()
                for row in rows:
                    raw_json = row.get("nombre_abonado", "")
                    if raw_json:
                        try:
                            cams = json.loads(raw_json)
                            if isinstance(cams, list):
                                for c in cams:
                                    if isinstance(c, dict) and c.get("serialNumber") and c.get("activa", True):
                                        devices.append({
                                            "sn":       c["serialNumber"].strip().upper(),
                                            "user":     c.get("usuario", "admin").strip(),
                                            "pass":     c.get("password", "").strip(),
                                            "canal":    int(c.get("canal", 1)),
                                            "local_ip": c.get("ip", c.get("localIp", c.get("ipLocal", ""))).strip() if c.get("ip") or c.get("localIp") or c.get("ipLocal") else "",
                                        })
                        except Exception as e:
                            logger.warning(f"[DEVICES] Error parseando JSON: {e}")
        except Exception as e:
            logger.error(f"[DEVICES] Error consultando Supabase: {e}")
        return devices

    def fetch_active_cloud_requests(self):
        active_keys = []
        try:
            get_url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=like.DAHUA_STREAM_REQ_%25&select=cuenta,fecha_hora"
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            r = requests.get(get_url, headers=headers, timeout=3)
            if r.status_code == 200:
                rows = r.json()
                now_utc = datetime.now(timezone.utc)
                for row in rows:
                    cuenta  = row.get("cuenta", "")
                    fh_str  = row.get("fecha_hora", "")
                    if cuenta and fh_str:
                        try:
                            fh_clean = fh_str.replace("Z", "+00:00")
                            fh       = datetime.fromisoformat(fh_clean)
                            diff_sec = (now_utc - fh).total_seconds()
                            if diff_sec <= 15:
                                parts = cuenta.split("_")
                                if len(parts) >= 5:
                                    sn    = parts[3]
                                    canal = int(parts[5])
                                    active_keys.append((sn, canal))
                        except Exception:
                            pass
        except Exception as e:
            logger.error(f"[CLOUD-REQ] Error: {e}")
        return active_keys

    def upload_to_supabase_with_ts(self, sn, canal, image_bytes, timestamp):
        try:
            base64_str = base64.b64encode(image_bytes).decode("utf-8")
            payload    = json.dumps({"ts": timestamp, "img": base64_str})
            cuenta_key = f"DAHUA_FRAME_{sn}_CH_{canal}"

            row_id = self.row_ids.get(cuenta_key)
            if not row_id:
                try:
                    r_sel = supabase.table("eventos_monitoreo").select("id").eq("cuenta", cuenta_key).order("id", desc=True).limit(1).execute()
                    if r_sel.data:
                        row_id = r_sel.data[0]["id"]
                        self.row_ids[cuenta_key] = row_id
                except Exception:
                    pass

            if row_id:
                supabase.table("eventos_monitoreo").update({"nombre_abonado": payload, "fecha_hora": timestamp}).eq("id", row_id).execute()
            else:
                r_ins = supabase.table("eventos_monitoreo").insert({
                    "cuenta":         cuenta_key,
                    "nombre_abonado": payload,
                    "evento":         "FRAME_SYNC",
                    "fecha_hora":     timestamp,
                }).execute()
                if r_ins.data:
                    self.row_ids[cuenta_key] = r_ins.data[0]["id"]

            logger.info(f"[UPLOAD] Frame OK {sn} CH-{canal} ({len(image_bytes)} bytes)")
        except Exception as e:
            logger.error(f"[UPLOAD] Error {sn} CH-{canal}: {e}")

    def upload_to_supabase(self, sn, canal, image_bytes):
        ts = datetime.now(timezone.utc).isoformat()
        self.upload_to_supabase_with_ts(sn, canal, image_bytes, ts)

    def _start_worker_for_device(self, sn, canal, user, pas, local_ip="", stream_type="sub"):
        """Inicia un worker si no existe o no esta activo."""
        key = f"{sn}_{canal}"
        if key not in self.workers or not self.workers[key].is_alive():
            worker = CameraWorker(self, sn, user, pas, canal, local_ip=local_ip or None, stream_type=stream_type)
            self.workers[key] = worker
            worker.start()
            logger.info(f"[MANAGER] Worker iniciado para {key} (ip={local_ip or 'auto'}, stream={stream_type})")
        return self.workers[key]

    def manager_loop(self):
        logger.info("[MANAGER] Loop de control iniciado")
        last_dev_check = 0
        while self.running:
            try:
                if time.time() - last_dev_check > 30.0:
                    self.registered_devices = self.fetch_all_registered_devices()
                    logger.info(f"[MANAGER] {len(self.registered_devices)} dispositivo(s) cargado(s)")
                    last_dev_check = time.time()

                active_cloud = self.fetch_active_cloud_requests()
                for sn, canal in active_cloud:
                    key = f"{sn}_{canal}"
                    self.last_request_times[key] = time.time()

                for dev in self.registered_devices:
                    sn    = dev["sn"]
                    canal = dev["canal"]
                    key   = f"{sn}_{canal}"
                    if time.time() - self.last_request_times.get(key, 0) <= 30.0:
                        self._start_worker_for_device(sn, canal, dev["user"], dev["pass"], dev.get("local_ip", ""))

            except Exception as e:
                logger.error(f"[MANAGER] Error: {e}", exc_info=True)
            time.sleep(3.0)


# ==============================================================================
#  SUPABASE CLIENT + ENGINE GLOBAL
# ==============================================================================
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
engine   = DahuaMultiDeviceEngine()


# ==============================================================================
#  HTTP SERVER HANDLER
# ==============================================================================

class DahuaBridgeRequestHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        # ------------------------------------------------------------------
        # GET /status  — Diagnóstico completo del bridge
        # ------------------------------------------------------------------
        if parsed.path == "/status":
            sdk = get_sdk_engine()
            status_info = {
                "version":            "2.0",
                "python_arch":        f"{PYTHON_ARCH}-bit",
                "sdk_status":         sdk.status_str,
                "sdk_arch_error":     sdk._arch_error,
                "workers":            len(engine.workers),
                "workers_active":     [k for k, v in engine.workers.items() if v.is_alive()],
                "registered_devices": len(engine.registered_devices),
                "devices": [{"sn": d["sn"], "canal": d["canal"], "local_ip": d.get("local_ip", "")}
                            for d in engine.registered_devices],
                "last_requests":      {k: datetime.fromtimestamp(v).isoformat() if v else None
                                       for k, v in engine.last_request_times.items()},
                "running":            engine.running,
                "frames_in_memory":   len(engine.latest_frames),
                "frame_keys":         list(engine.latest_frames.keys()),
                "uptime_seconds":     round(time.time() - engine.start_time, 1),
                "p2p_dns_cache":      _dns_cache,
                "p2p_domains_tested": [f"{h}" for _, h, _ in P2P_DOMAINS[:4]],
            }
            payload = json.dumps(status_info, indent=2)
            self.send_response(200)
            self.send_header("Content-Type",  "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(payload.encode("utf-8"))
            return

        # ------------------------------------------------------------------
        # GET /dns-check?sn=XXXX  — Diagnóstico DNS P2P para un SN
        # ------------------------------------------------------------------
        if parsed.path == "/dns-check":
            sn = params.get("sn", [""])[0].strip().upper()
            if sn:
                _dns_cache.pop(sn, None)  # Forzar re-check
            results = check_p2p_dns(sn) if sn else {"error": "falta parametro sn"}
            payload = json.dumps({"sn": sn, "dns_results": results}, indent=2)
            self.send_response(200)
            self.send_header("Content-Type",  "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(payload.encode("utf-8"))
            return

        # ------------------------------------------------------------------
        # GET /snapshot?sn=XXXX&canal=1&user=admin&pass=XXX&stream=sub
        # ------------------------------------------------------------------
        if parsed.path in ["/snapshot", "/api/snapshot"]:
            sn          = params.get("sn",     [""])[0].strip().upper()
            canal_str   = params.get("canal",  ["1"])[0]
            stream_type = params.get("stream", ["sub"])[0]  # "sub" o "main"
            local_ip    = params.get("ip",     [""])[0].strip()

            try:
                canal_int = int(canal_str)
            except ValueError:
                canal_int = 1

            key = f"{sn}_{canal_int}"
            engine.last_request_times[key] = time.time()

            # Guardar IP local si viene en el request (override)
            if local_ip:
                engine.local_ip = local_ip

            # Buscar datos del dispositivo en la lista registrada
            dev_data = next((d for d in engine.registered_devices
                             if d["sn"] == sn and d["canal"] == canal_int), None)

            if not dev_data:
                dev_data = {
                    "sn":       sn,
                    "user":     params.get("user", ["admin"])[0].strip(),
                    "pass":     params.get("pass", [""])[0].strip(),
                    "canal":    canal_int,
                    "local_ip": local_ip,
                }

            # Iniciar o reusar worker
            if key not in engine.workers or not engine.workers[key].is_alive():
                logger.info(f"[HANDLER] Iniciando worker inmediato para {key}")
                engine._start_worker_for_device(
                    dev_data["sn"], dev_data["canal"],
                    dev_data["user"], dev_data["pass"],
                    local_ip or dev_data.get("local_ip", ""),
                    stream_type
                )

            # Esperar hasta 1.5s por el primer frame
            frame = None
            for _ in range(15):
                frame = engine.latest_frames.get(key)
                if frame:
                    break
                time.sleep(0.1)

            if frame:
                self.send_response(200)
                self.send_header("Content-Type",              "image/jpeg")
                self.send_header("Cache-Control",             "no-cache, no-store, must-revalidate")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("X-Dahua-Status",            "FRAME_OK")
                self.end_headers()
                self.wfile.write(frame)
            else:
                # SVG animado de "conectando"
                svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#020408"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <rect x="8" y="8" width="624" height="344" fill="none" stroke="#eab308" stroke-width="1.5" rx="6" stroke-dasharray="4"/>
  <circle cx="320" cy="110" r="24" fill="none" stroke="#eab308" stroke-width="2.5">
    <animateTransform attributeName="transform" type="rotate" from="0 320 110" to="360 320 110" dur="1s" repeatCount="indefinite"/>
  </circle>
  <circle cx="320" cy="110" r="8" fill="#eab308" opacity="0.4"/>
  <text x="320" y="165" fill="#fef08a" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">CONECTANDO CON CAMARA P2P...</text>
  <text x="320" y="185" fill="#94a3b8" font-family="monospace" font-size="11" text-anchor="middle">SN: {sn} | CH-{canal_int} | stream={stream_type}</text>
  <text x="320" y="210" fill="#64748b" font-family="monospace" font-size="10" text-anchor="middle">Probando dominios: lechange.com / easy4ipcloud.com / imoulife.com</text>
  <text x="320" y="228" fill="#475569" font-family="monospace" font-size="10" text-anchor="middle">Ver diagnostico en: http://127.0.0.1:8000/dns-check?sn={sn}</text>
  <text x="320" y="260" fill="#334155" font-family="monospace" font-size="10" text-anchor="middle">Python {PYTHON_ARCH}-bit | SDK: {get_sdk_engine().status_str[:30]}</text>
</svg>'''
                self.send_response(200)
                self.send_header("Content-Type",              "image/svg+xml")
                self.send_header("Cache-Control",             "no-cache, no-store, must-revalidate")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("X-Dahua-Status",            "CONNECTING")
                self.end_headers()
                self.wfile.write(svg.encode("utf-8"))
            return

        # ------------------------------------------------------------------
        # Raiz / — Info
        # ------------------------------------------------------------------
        self.send_response(200)
        self.send_header("Content-Type",              "text/html; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(
            f"<h1>GAMA SEGURIDAD - DAHUA ON-DEMAND ENGINE v2.0 ACTIVO</h1>"
            f"<p>Python {PYTHON_ARCH}-bit | SDK: {get_sdk_engine().status_str}</p>"
            f"<p><a href='/status'>/status</a> | <a href='/dns-check?sn=AE0970BPAG00815'>/dns-check?sn=AE0970BPAG00815</a></p>"
            .encode("utf-8")
        )

    def log_message(self, format, *args):
        return  # Silenciar logs HTTP del servidor


# ==============================================================================
#  INICIO DEL SERVIDOR
# ==============================================================================

def start_server(port=8000):
    # Inicializar SDK (deteccion de arquitectura)
    sdk = get_sdk_engine()

    # Iniciar hilo de heartbeat keep-alive
    hb = HeartbeatThread(engine)
    hb.start()

    # Iniciar loop de manager
    t = threading.Thread(target=engine.manager_loop, daemon=True)
    t.start()

    server_address = ("", port)
    httpd = HTTPServer(server_address, DahuaBridgeRequestHandler)

    logger.info("=" * 70)
    logger.info(f" DAHUA CONCURRENT ON-DEMAND ENGINE v2.0 - PUERTO {port}")
    logger.info(f" Python: {PYTHON_ARCH}-bit | SDK: {sdk.status_str}")
    logger.info(f" Dominios P2P: lechange.com, easy4ipcloud.com, imoulife.com, dahuap2p.com")
    logger.info(f" Heartbeat keep-alive: cada {HeartbeatThread.INTERVAL}s")
    logger.info(f" Log: {LOG_PATH}")
    logger.info("=" * 70)
    print(f"\n[OK] Dahua Bridge v2.0 activo en puerto {port}")
    print(f"[OK] Python {PYTHON_ARCH}-bit | SDK: {sdk.status_str}")
    print(f"[OK] Diagnostico: http://127.0.0.1:{port}/status")
    print(f"[OK] DNS Check:   http://127.0.0.1:{port}/dns-check?sn=AE0970BPAG00815\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        engine.running = False
        logger.info("Deteniendo servidor Dahua P2P...")
        httpd.server_close()
        print("\n[INFO] Servidor Dahua P2P detenido.")


if __name__ == "__main__":
    start_server(8000)

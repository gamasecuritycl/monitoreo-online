"""
  🔒 LOCKED — NO MODIFICAR
  Bridge universal para cámaras Dahua (HTTP snapshot + SDK local TCP).
  Carga dispositivos desde Supabase o _camaras_local.json automáticamente.
  Para agregar una cámara: editar _camaras_local.json (ver _camaras.ejemplo.json).
===============================================================================
 GAMA SEGURIDAD - DAHUA NVR / DVR / XVR / IPC MULTI-CHANNEL ENGINE (v2.2)
===============================================================================
 Arquitectura: Concurrente, BAJO DEMANDA (On-Demand), P2P-FIRST (HTTPS/TCP).
 Propósito: Stream universal para cualquier dispositivo Dahua (IPC, XVR, DVR, NVR).
 Reglas:
  - SOLO inicia captura cuando hay petición activa (local o cloud).
  - Detiene captura a los 30s de inactividad.
  - Actualiza UNA sola fila por cámara en Supabase (cuenta = DAHUA_FRAME_{SN}_CH_{canal}).
  - Frames incluyen timestamp ISO para verificación de frescura en dashboard.
  - Keep-Alive REAL cada 30s (HTTP OPTIONS + SDK) para evitar corte de sesión P2P.
  - Dominios P2P modernos primero (Lechange/Imou HTTPS) -> TCP/TLS nativo.
  - SDK Nativo (dhnetsdk.dll) como fallback real si HTTP falla.
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
import ctypes
import requests
from requests.auth import HTTPDigestAuth
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from datetime import datetime, timezone

# -----------------------------------------------------------------------------
# CONFIGURACIÓN GLOBAL
# -----------------------------------------------------------------------------
SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"
VERCEL_API_URL = "https://controltestmonitoreo.vercel.app/api/dahua-receive-frame"
BRIDGE_SECRET = "gama_dahua_2024_secret"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_PATH = os.path.join(SCRIPT_DIR, "_dahua_bridge.log")

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

# -----------------------------------------------------------------------------
# ARQUITECTURA PYTHON (32 vs 64 bit) -> DLL SDK
# -----------------------------------------------------------------------------
PYTHON_ARCH = 64 if sys.maxsize > 2**32 else 32
logger.info(f"[SDK] Arquitectura Python detectada: {PYTHON_ARCH}-bit")

# -----------------------------------------------------------------------------
# DOMINIOS P2P DAHUA (ORDEN: MODERNOS PRIMERO, HTTPS FORZADO -> TCP/TLS)
# -----------------------------------------------------------------------------
# Formato: (esquema, plantilla_host, path_snapshot)
# Lechange / Imou (Cámaras/IPC modernas, post-2019) -> HTTPS nativo (TCP)
# Easy4IP (NVRs/DVRs/XVRs clásicos) -> HTTPS en endpoint ONVIF
P2P_DOMAINS = [
    # --- Modernos (Lechange / Imou) ---
    ("https", "{sn}.lechange.com",       "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.lechange.cn",        "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.imoulife.com",       "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.imou.com",           "/cgi-bin/snapshot.cgi"),
    # --- Clásicos (Easy4IP) ---
    ("https", "{sn}.easy4ipcloud.com",   "/onvifsnapshot/media_service/snapshot"),
    ("https", "{sn}.easy4ipcloud.com",   "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.easy4ipcloud.com",   "/onvifsnapshot/media_service/snapshot"),
    ("http",  "{sn}.easy4ipcloud.com",   "/cgi-bin/snapshot.cgi"),
    # --- Dahua P2P Genéricos ---
    ("https", "{sn}.dahuap2p.com",       "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.dahuap2p.com",       "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.myp2pcloud.com",     "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.myp2pcloud.com",     "/cgi-bin/snapshot.cgi"),
    # --- Alternativos (del backup original que sí funcionaba) ---
    ("https", "{sn}.mypeoplecloud.com",  "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.mypeoplecloud.com",  "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.ipcver.com",         "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.ipcver.com",         "/cgi-bin/snapshot.cgi"),
]

# Cache DNS global
_DNS_CACHE = {}
_LAN_DISCOVERED_IPS = []  # IPs locales de dispositivos Dahua descubiertos

def scan_lan_dahua(timeout=0.2):
    """Escanea la LAN local buscando dispositivos Dahua (puertos 80, 37777, 554) con threads."""
    global _LAN_DISCOVERED_IPS
    ips = []
    lock = threading.Lock()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        subnet = ".".join(local_ip.split(".")[:3]) + "."
        logger.info(f"[LAN] Escaneando {subnet}0/24 (threaded)...")

        def _check(ip):
            for port in (80, 37777, 554):
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(timeout)
                    result = sock.connect_ex((ip, port))
                    sock.close()
                    if result == 0:
                        with lock:
                            ips.append(ip)
                        logger.info(f"[LAN] Encontrado: {ip}:{port}")
                        return
                except:
                    pass

        threads = []
        for i in range(1, 255):
            t = threading.Thread(target=_check, args=(f"{subnet}{i}",), daemon=True)
            t.start()
            threads.append(t)
        for t in threads:
            t.join(timeout=2.0)

        _LAN_DISCOVERED_IPS = list(set(ips))
        logger.info(f"[LAN] Escaneo completo: {len(_LAN_DISCOVERED_IPS)} dispositivo(s): {_LAN_DISCOVERED_IPS}")
    except Exception as e:
        logger.warning(f"[LAN] Error en escaneo: {e}")
    return _LAN_DISCOVERED_IPS

# -----------------------------------------------------------------------------
# UTILIDADES DNS / ENDPOINTS
# -----------------------------------------------------------------------------
def check_p2p_dns(sn: str) -> dict:
    """Resuelve DNS de todos los dominios P2P para un SN. Cachea resultado."""
    if sn in _DNS_CACHE:
        return _DNS_CACHE[sn]
    results = {}
    unique_hosts = set()
    for _, host_tpl, _ in P2P_DOMAINS:
        unique_hosts.add(host_tpl.format(sn=sn))
    for host in unique_hosts:
        try:
            socket.gethostbyname(host)
            results[host] = "OK"
            logger.info(f"[DNS] {host} => RESUELVE OK")
        except socket.gaierror:
            results[host] = "FAIL"
            logger.warning(f"[DNS] {host} => NO RESUELVE")
    _DNS_CACHE[sn] = results
    return results

def build_endpoints(sn: str, canal: int, local_ip: str = None, stream_type: str = "sub") -> list:
    """
    Construye lista de URLs a probar en ORDEN DE PRIORIDAD:
    1. IP Local (ONVIF + CGI) - Máxima velocidad, LAN only.
    2. Dominios P2P HTTPS (TCP/TLS).
    """
    urls = []
    stream_code = 1 if stream_type == "sub" else 0  # 1=Substream, 0=Mainstream
    tried_ips = set()

    # 1. IP LOCAL configurada (Prioridad absoluta)
    if local_ip and local_ip.strip():
        ip = local_ip.strip()
        tried_ips.add(ip)
        urls.append(f"http://{ip}/onvifsnapshot/media_service/snapshot?channel={canal}&subtype={stream_code}")
        urls.append(f"http://{ip}/cgi-bin/snapshot.cgi?channel={canal}&subtype={stream_code}")
        urls.append(f"http://{ip}/cgi-bin/snapshot.cgi?channel={canal}")

    # 2. IPs descubiertas en LAN (auto-scan)
    for ip in _LAN_DISCOVERED_IPS:
        if ip in tried_ips:
            continue
        tried_ips.add(ip)
        urls.append(f"http://{ip}/onvifsnapshot/media_service/snapshot?channel={canal}&subtype={stream_code}")
        urls.append(f"http://{ip}/cgi-bin/snapshot.cgi?channel={canal}&subtype={stream_code}")

    # 3. P2P CLOUD
    for scheme, host_tpl, path in P2P_DOMAINS:
        host = host_tpl.format(sn=sn)
        if "onvifsnapshot" in path:
            url = f"{scheme}://{host}{path}?channel={canal}"
        else:
            url = f"{scheme}://{host}{path}?channel={canal}&subtype={stream_code}"
        urls.append(url)

    return urls

# -----------------------------------------------------------------------------
# SDK NATIVO DAHUA (ctypes) - P2P NATIVO
# -----------------------------------------------------------------------------
# Modos de login P2P (EM_LOGIN_SPAC_CAP_TYPE)
LOGIN_MODE_TCP  = 0
LOGIN_MODE_P2P  = 19

class NET_DEVICEINFO_Ex(ctypes.Structure):
    _fields_ = [
        ("nDeviceType", ctypes.c_int),
        ("nDeviceSubType", ctypes.c_int),
        ("nChanNum", ctypes.c_int),
        ("nIPChanNum", ctypes.c_int),
        ("nAnalogChanNum", ctypes.c_int),
        ("nStartChan", ctypes.c_int),
        ("nAudioChanNum", ctypes.c_int),
        ("szDevType", ctypes.c_char * 32),
        ("szSerialNo", ctypes.c_char * 48),
        ("szDevMac", ctypes.c_char * 48),
        ("szDeviceIP", ctypes.c_char * 128),
        ("nPort", ctypes.c_int),
        ("nRtspPort", ctypes.c_int),
        ("nRtmpPort", ctypes.c_int),
        ("nHttpsPort", ctypes.c_int),
        ("bReserved", ctypes.c_byte * 512),
    ]

class SDK_P2PEngine:
    """Wrapper ctypes para dhnetsdk.dll / dhnetsdk_x64.dll (P2P nativo)"""
    DLL_NAME_32 = "dhnetsdk.dll"
    DLL_NAME_64 = "dhnetsdk_x64.dll"

    def __init__(self):
        self.dll = None
        self.login_id = 0
        self.initialized = False
        self._arch_error = False
        self._last_err = 0
        self._load_dll()

    def _load_dll(self):
        dll_file = self.DLL_NAME_64 if PYTHON_ARCH == 64 else self.DLL_NAME_32
        dll_path = os.path.join(SCRIPT_DIR, dll_file)

        if not os.path.exists(dll_path):
            logger.warning(f"[SDK] DLL no encontrada: {dll_path}. SDK deshabilitado.")
            return

        try:
            self.dll = ctypes.WinDLL(dll_path)
            logger.info(f"[SDK] DLL cargada: {dll_file} ({os.path.getsize(dll_path):,} bytes)")

            # CLIENT_Init
            self.dll.CLIENT_Init.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p]
            self.dll.CLIENT_Init.restype = ctypes.c_bool

            # CLIENT_SetConnectTime
            self.dll.CLIENT_SetConnectTime.argtypes = [ctypes.c_int]
            self.dll.CLIENT_SetConnectTime.restype = None

            # CLIENT_LoginEx2 — login con modo P2P
            self.dll.CLIENT_LoginEx2.argtypes = [
                ctypes.c_char_p,     # pchDVRIP (IP o SN)
                ctypes.c_ushort,     # wDVRPort
                ctypes.c_char_p,     # pchUserName
                ctypes.c_char_p,     # pchPassword
                ctypes.c_int,        # nSpecCap (EM_LOGIN_SPAC_CAP_TYPE)
                ctypes.c_void_p,     # pCapParam
                ctypes.POINTER(NET_DEVICEINFO_Ex),  # lpDeviceInfo
                ctypes.POINTER(ctypes.c_int),       # error
                ctypes.c_int,        # nWaitTime
            ]
            self.dll.CLIENT_LoginEx2.restype = ctypes.c_longlong

            # CLIENT_Logout
            self.dll.CLIENT_Logout.argtypes = [ctypes.c_longlong]
            self.dll.CLIENT_Logout.restype = ctypes.c_bool

            # CLIENT_Cleanup
            self.dll.CLIENT_Cleanup.argtypes = []
            self.dll.CLIENT_Cleanup.restype = None

            # CLIENT_SnapPicture
            self.dll.CLIENT_SnapPicture.argtypes = [
                ctypes.c_longlong, ctypes.c_int, ctypes.c_void_p,
                ctypes.POINTER(ctypes.c_int), ctypes.c_int
            ]
            self.dll.CLIENT_SnapPicture.restype = ctypes.c_bool

            if self.dll.CLIENT_Init(None, None, None):
                self.initialized = True
                self.dll.CLIENT_SetConnectTime(5000)  # 5s timeout
                logger.info("[SDK] Inicializado correctamente (P2P disponible)")
            else:
                logger.error("[SDK] CLIENT_Init falló")
        except OSError as e:
            if "193" in str(e) or "Win32" in str(e):
                self._arch_error = True
                logger.error(f"[SDK] ERROR ARQUITECTURA: Python {PYTHON_ARCH}bit vs DLL distinta. Necesitas {self.DLL_NAME_64 if PYTHON_ARCH==64 else self.DLL_NAME_32} correcta.")
            else:
                logger.error(f"[SDK] Error cargando DLL: {e}")
        except Exception as e:
            logger.error(f"[SDK] Error inesperado: {e}")

    def login_p2p(self, sn: str, user: str, pwd: str, port: int = 37777) -> bool:
        if not self.initialized:
            return False
        try:
            sn_b = sn.encode('utf-8')
            user_b = user.encode('utf-8')
            pwd_b = pwd.encode('utf-8')
            dev_info = NET_DEVICEINFO_Ex()
            err = ctypes.c_int(0)

            logger.info(f"[SDK] Login P2P SN: {sn} puerto={port} modo=P2P({LOGIN_MODE_P2P})...")

            # LoginEx2 con modo P2P — el SDK resuelve el SN internamente
            handle = self.dll.CLIENT_LoginEx2(
                sn_b, ctypes.c_ushort(port),
                user_b, pwd_b,
                LOGIN_MODE_P2P,   # nSpecCap = 19 (P2P)
                None,             # pCapParam
                ctypes.byref(dev_info),
                ctypes.byref(err),
                8000              # nWaitTime = 8s
            )

            if handle != 0:
                self.login_id = handle
                logger.info(f"[SDK] Login P2P OK Handle={handle} Tipo={dev_info.szDevType.decode()} Canales={dev_info.nChanNum}")
                return True
            else:
                # Mapeo errores comunes
                err_map = {1:"usr/pwd", 2:"no existe", 3:"timeout", 4:"re-login",
                           5:"bloqueado", 6:"blacklist", 7:"recursos", 8:"sub conexion",
                           9:"conexion ppal", 10:"max conexiones", 11:"solo 3gen",
                           12:"U盾", 13:"IP sin permiso", 18:"no inicializado"}
                err_msg = err_map.get(err.value, f"codigo {err.value}")
                logger.warning(f"[SDK] Login P2P fallido SN: {sn} Error: {err_msg}")
                return False
        except Exception as e:
            logger.error(f"[SDK] Excepción login: {e}")
            return False

    def login_local(self, ip: str, user: str, pwd: str, port: int = 37777) -> bool:
        """Login TCP directo a IP local (modo 0, sin P2P)"""
        if not self.initialized:
            return False
        self._last_err = 0
        try:
            ip_b = ip.encode('utf-8')
            user_b = user.encode('utf-8')
            pwd_b = pwd.encode('utf-8')
            dev_info = NET_DEVICEINFO_Ex()
            err = ctypes.c_int(0)
            logger.info(f"[SDK] Login LOCAL TCP {ip}:{port} (modo TCP)...")
            handle = self.dll.CLIENT_LoginEx2(
                ip_b, ctypes.c_ushort(port),
                user_b, pwd_b,
                LOGIN_MODE_TCP,
                None,
                ctypes.byref(dev_info),
                ctypes.byref(err),
                5000
            )
            if handle != 0:
                self.login_id = handle
                logger.info(f"[SDK] Login LOCAL TCP OK Handle={handle} ({ip}) Canales={dev_info.nChanNum}")
                return True
            else:
                self._last_err = err.value
                err_map = {1:"usr/pwd", 2:"no existe", 3:"timeout", 4:"re-login",
                           5:"bloqueado", 6:"blacklist", 7:"recursos", 8:"sub conexion",
                           9:"conexion ppal", 10:"max conexiones", 11:"solo 3gen",
                           12:"U盾", 13:"IP sin permiso", 18:"no inicializado"}
                err_msg = err_map.get(self._last_err, f"codigo {self._last_err}")
                logger.warning(f"[SDK] Login LOCAL TCP fallido {ip} Error: {err_msg}")
                return False
        except Exception as e:
            logger.error(f"[SDK] Excepción login local: {e}")
            return False

    def is_local_logged_in(self) -> bool:
        return self.login_id != 0

    def snap_picture(self, channel: int) -> bytes:
        if not self.login_id:
            return None
        try:
            buf = ctypes.create_string_buffer(2 * 1024 * 1024)
            length = ctypes.c_int(0)
            ok = self.dll.CLIENT_SnapPicture(self.login_id, channel - 1, buf, ctypes.byref(length), 5000)
            if ok and length.value > 100:
                logger.info(f"[SDK] Snap OK CH-{channel} ({length.value} bytes)")
                return bytes(buf[:length.value])
            logger.warning(f"[SDK] Snap fallido CH-{channel} ok={ok} len={length.value}")
            return None
        except Exception as e:
            logger.error(f"[SDK] Error snapshot: {e}")
            return None

    def cleanup(self):
        if self.login_id:
            try: self.dll.CLIENT_Logout(self.login_id)
            except: pass
            self.login_id = 0
        if self.initialized:
            try: self.dll.CLIENT_Cleanup()
            except: pass
            self.initialized = False

    @property
    def status(self):
        if self._arch_error: return "ARCH_MISMATCH"
        if self.initialized: return "OK"
        return "UNAVAILABLE"

# -----------------------------------------------------------------------------
# HEARTBEAT / KEEP-ALIVE REAL (HTTP OPTIONS + SDK)
# -----------------------------------------------------------------------------
class HeartbeatThread(threading.Thread):
    """
    Envía HTTP OPTIONS cada 30s a relays P2P para mantener sesión viva.
    """
    INTERVAL = 30  # segundos

    def __init__(self, engine):
        super().__init__(daemon=True)
        self.engine = engine
        self.running = True
        self._session = None

    def _get_session(self):
        if self._session is None:
            import requests as _r
            self._session = _r.Session()
            self._session.headers.update({
                "Connection": "keep-alive",
                "User-Agent": "GamaDahua/2.2 (P2P+NATIVO)"
            })
        return self._session

    def _tcp_ping(self, sn, user, pwd):
        """HTTP OPTIONS ligero a relays P2P modernos."""
        targets = [
            f"https://{sn}.lechange.com/",
            f"https://{sn}.lechange.cn/",
            f"https://{sn}.imoulife.com/",
            f"https://{sn}.easy4ipcloud.com/",
        ]
        auth = HTTPDigestAuth(user, pwd) if user and pwd else None
        sess = self._get_session()
        for url in targets:
            try:
                r = sess.options(url, auth=auth, timeout=2.0)
                # 200, 401, 403, 404, 405 = servidor respondió (TCP OK)
                if r.status_code in (200, 401, 403, 404, 405):
                    logger.info(f"[HEARTBEAT] TCP OK {url} -> {r.status_code}")
                    return True
            except Exception:
                continue
        return False

    def run(self):
        logger.info(f"[HEARTBEAT] Iniciado (cada {self.INTERVAL}s)")
        while self.running and self.engine.running:
            time.sleep(self.INTERVAL)
            if not self.engine.running:
                break

            active_keys = [k for k, w in self.engine.workers.items() if w.is_alive()]
            if not active_keys:
                continue

            logger.info(f"[HEARTBEAT] Keep-alive a {len(active_keys)} worker(s): {active_keys}")
            for key in active_keys:
                # Solo si hubo petición reciente (< 45s)
                if time.time() - self.engine.last_request_times.get(key, 0) > 45:
                    continue

                dev = self.engine._device_by_key.get(key, {})
                sn = dev.get("sn")
                user = dev.get("user", "admin")
                pwd = dev.get("pass", "")
                if not sn:
                    continue

                # HTTP OPTIONS (TCP)
                ok = self._tcp_ping(sn, user, pwd)
                if ok:
                    logger.info(f"[HEARTBEAT] HTTP Keep-alive OK {key}")
                else:
                    logger.warning(f"[HEARTBEAT] HTTP Keep-alive FALLÓ {key}")

# -----------------------------------------------------------------------------
# WORKER CÁMARA INDIVIDUAL
# -----------------------------------------------------------------------------
class CameraWorker(threading.Thread):
    def __init__(self, engine, sn, user, pwd, canal, local_ip=None, stream_type="sub"):
        super().__init__(daemon=True)
        self.engine = engine
        self.sn = sn.upper().strip()
        self.user = user.strip() if user else "admin"
        self.pwd = pwd.strip() if pwd else ""
        self.canal = int(canal)
        self.local_ip = local_ip.strip() if local_ip else None
        self.stream_type = stream_type
        self.running = True
        self.last_upload = 0
        self.backoff = 0.3
        self.consecutive_fails = 0
        self._sdk_logged_in = False
        self._sdk_blocked_until = 0  # timestamp hasta cuando no intentar SDK por bloqueo

    def run(self):
        key = f"{self.sn}_{self.canal}"
        auth = HTTPDigestAuth(self.user, self.pwd) if self.user and self.pwd else None
        endpoints = build_endpoints(self.sn, self.canal, self.local_ip, self.stream_type)
        logger.info(f"[WORKER] Iniciado {key} (stream={self.stream_type}, ip_local={self.local_ip or 'auto'}, {len(endpoints)} endpoints)")

        sdk_engine = self.engine.sdk_engine
        dns_checked = False

        # Si tiene IP local, solo usar endpoints locales (sin P2P cloud)
        local_mode = bool(self.local_ip)
        local_endpoints = [u for u in endpoints if self.local_ip and self.local_ip in u] if local_mode else endpoints

        while self.running and self.engine.running:
            # 1. DNS Check (solo si NO tiene IP local)
            if not dns_checked and not local_mode:
                check_p2p_dns(self.sn)
                dns_checked = True

            frame_ok = False
            active_endpoints = local_endpoints if local_mode else endpoints

            # 3. Loop endpoints HTTP
            for url in active_endpoints:
                if not self.running or not self.engine.running:
                    break
                try:
                    resp = requests.get(url, auth=auth, timeout=1.5, stream=True)
                    if resp.status_code == 200 and len(resp.content) > 1000:
                        img_bytes = resp.content
                        self.engine.latest_frames[key] = img_bytes
                        self.consecutive_fails = 0
                        self.backoff = 0.3
                        frame_ok = True
                        if active_endpoints.index(url) > 0:
                            active_endpoints.remove(url)
                            active_endpoints.insert(0, url)
                            logger.info(f"[WORKER] URL promovida a #1: {url[:80]}...")
                        now = time.time()
                        if now - self.last_upload > 0.8:
                            self.last_upload = now
                            ts = datetime.now(timezone.utc).isoformat()
                            threading.Thread(
                                target=self.engine.upload_to_supabase_with_ts,
                                args=(self.sn, self.canal, img_bytes, ts),
                                daemon=True
                            ).start()
                            threading.Thread(
                                target=self.engine.upload_to_vercel_api,
                                args=(self.sn, self.canal, img_bytes, ts),
                                daemon=True
                            ).start()
                        break
                except Exception as e:
                    self.consecutive_fails += 1
                    if self.consecutive_fails <= 3 or self.consecutive_fails % 10 == 0:
                        logger.warning(f"[WORKER] Error {url[:60]}...: {e} (fallo #{self.consecutive_fails})")

            # 4. SDK fallback (local TCP si tiene IP, P2P cloud si no)
            if not frame_ok and sdk_engine.initialized:
                if not self._sdk_logged_in:
                    # Si SDK está bloqueado, esperar 5 min antes de reintentar
                    if time.time() < self._sdk_blocked_until:
                        pass  # saltar SDK
                    elif local_mode and self.local_ip:
                        # Login TCP directo a la IP local (no necesita UDP 8800)
                        logger.info(f"[WORKER] Intentando SDK LOCAL TCP {self.local_ip}...")
                        if sdk_engine.login_local(self.local_ip, self.user, self.pwd):
                            self._sdk_logged_in = True
                            self.consecutive_fails = 0
                            logger.info(f"[WORKER] SDK LOCAL TCP OK {self.local_ip}")
                        else:
                            # Si error es "bloqueado", esperar 5 min
                            if sdk_engine._last_err == 5:
                                self._sdk_blocked_until = time.time() + 300
                                logger.warning(f"[WORKER] SDK bloqueado, esperando 5min hasta {datetime.fromtimestamp(self._sdk_blocked_until).strftime('%H:%M:%S')}")
                            logger.warning(f"[WORKER] SDK LOCAL TCP fallido {self.local_ip}")
                    else:
                        # Login P2P cloud (requiere UDP 8800)
                        logger.info(f"[WORKER] Intentando login SDK P2P para {self.sn}...")
                        if sdk_engine.login_p2p(self.sn, self.user, self.pwd):
                            self._sdk_logged_in = True
                            self.consecutive_fails = 0
                        else:
                            logger.warning(f"[WORKER] SDK Login P2P fallido {self.sn}")
                if self._sdk_logged_in:
                    logger.info(f"[WORKER] Capturando via SDK {self.sn} CH-{self.canal}...")
                    img = sdk_engine.snap_picture(self.canal)
                    if img and len(img) > 1000:
                        self.engine.latest_frames[key] = img
                        self.consecutive_fails = 0
                        self.backoff = 0.3
                        frame_ok = True
                        ts = datetime.now(timezone.utc).isoformat()
                        threading.Thread(
                            target=self.engine.upload_to_supabase_with_ts,
                            args=(self.sn, self.canal, img, ts),
                            daemon=True
                        ).start()
                        threading.Thread(
                            target=self.engine.upload_to_vercel_api,
                            args=(self.sn, self.canal, img, ts),
                            daemon=True
                        ).start()
                        logger.info(f"[WORKER] SDK SNAPSHOT OK {len(img)} bytes {key}")

            # 5. Backoff adaptativo (máx 10s si modo local, 30s si P2P)
            if not frame_ok:
                max_backoff = 10.0 if local_mode else 30.0
                self.backoff = min(1.0 + (self.consecutive_fails * 0.5), max_backoff)
                if self.consecutive_fails >= 3 and self.consecutive_fails % 5 == 0:
                    logger.warning(f"[WORKER] {self.consecutive_fails} fallos {key}, backoff={self.backoff:.1f}s")
                    # Si lleva +100 fallos, entrar en cooldown largo (cada 60s)
                    if self.consecutive_fails > 100:
                        logger.info(f"[WORKER] Cooldown largo {key} - verificando cada 60s")
                        time.sleep(60)

            time.sleep(0.3 if frame_ok else self.backoff)

        # Cleanup
        if self._sdk_logged_in and sdk_engine.login_id:
            sdk_engine.logout()
        self.engine.workers.pop(key, None)
        logger.info(f"[WORKER] Finalizado {key}")

# -----------------------------------------------------------------------------
# MOTOR MULTI-DISPOSITIVO (GESTOR CENTRAL)
# -----------------------------------------------------------------------------
class DahuaMultiDeviceEngine:
    def __init__(self):
        self.latest_frames = {}          # key -> bytes (JPG)
        self.row_ids = {}                # cuenta_supabase -> row_id (cache upsert)
        self.workers = {}                # key -> CameraWorker
        self.last_request_times = {}     # key -> timestamp
        self.registered_devices = []     # lista dicts desde Supabase
        self.running = True
        self._device_by_key = {}         # key -> dict config completo
        self.start_time = time.time()
        self.sdk_engine = SDK_P2PEngine()

    def _load_local_devices(self):
        """Carga dispositivos desde archivo JSON local (fallback cuando Supabase no responde)"""
        devices = []
        try:
            local_path = os.path.join(SCRIPT_DIR, "_camaras_local.json")
            if os.path.exists(local_path):
                with open(local_path, "r") as f:
                    raw = json.load(f)
                if isinstance(raw, list):
                    for c in raw:
                        if isinstance(c, dict) and c.get("sn") and c.get("activa", True):
                            devices.append({
                                "sn": c["sn"].strip().upper(),
                                "user": c.get("user", c.get("usuario", "admin")).strip(),
                                "pass": c.get("pass", c.get("password", "")).strip(),
                                "canal": int(c.get("canal", 1)),
                                "local_ip": c.get("local_ip", c.get("ip", "")).strip() if c.get("local_ip") or c.get("ip") else "",
                                "stream_type": c.get("stream_type", "sub"),
                            })
                logger.info(f"[LOCAL] Dispositivos cargados desde archivo: {len(devices)}")
        except Exception as e:
            logger.error(f"[LOCAL] Error cargando archivo local: {e}")
        return devices

    def fetch_all_registered_devices(self):
        """Lee tabla eventos_monitoreo + archivo local"""
        devices = []
        # 1. Supabase (cloud)
        try:
            url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=like.CAMARAS_DAHUA_%25&select=nombre_abonado,cuenta"
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200:
                for row in r.json():
                    raw = row.get("nombre_abonado", "")
                    if raw:
                        try:
                            cams = json.loads(raw)
                            if isinstance(cams, list):
                                for c in cams:
                                    if isinstance(c, dict) and c.get("serialNumber") and c.get("activa", True):
                                        sn = c["serialNumber"].strip().upper()
                                        if sn == "AE09700PAG00815":
                                            sn = "AE0970BPAG00815"
                                        pwd = c.get("password", "").strip()
                                        if sn == "AE0970BPAG00815" and (pwd == "123456789" or not pwd):
                                            pwd = "L2D55413"
                                        devices.append({
                                            "sn": sn,
                                            "user": c.get("usuario", "admin").strip(),
                                            "pass": pwd,
                                            "canal": int(c.get("canal", 1)),
                                            "local_ip": c.get("local_ip", c.get("ip", c.get("ipLocal", ""))).strip() if c.get("local_ip") or c.get("ip") or c.get("ipLocal") else "",
                                            "stream_type": "sub" if c.get("substream", True) else "main",
                                        })
                        except Exception as e:
                            logger.warning(f"[DEVICES] Error parse JSON: {e}")
        except Exception as e:
            logger.error(f"[DEVICES] Error consultando Supabase: {e}")

        # 2. Archivo local (debe sobrescribir datos de cloud si la clave local tiene credenciales explícitas)
        local_devs = self._load_local_devices()
        dev_dict = {(d["sn"], d["canal"]): d for d in devices}
        for ld in local_devs:
            sn = ld.get("sn", "").strip().upper()
            if sn == "AE09700PAG00815":
                sn = "AE0970BPAG00815"
                ld["sn"] = sn
            key = (sn, ld.get("canal", 1))
            dev_dict[key] = ld
        return list(dev_dict.values())

    def fetch_active_cloud_requests(self):
        """Lee peticiones activas DAHUA_STREAM_REQ_* (últimos 15s)"""
        active = []
        try:
            url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=like.DAHUA_STREAM_REQ_%25&select=cuenta,fecha_hora"
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            r = requests.get(url, headers=headers, timeout=3)
            if r.status_code == 200:
                now = datetime.now(timezone.utc)
                for row in r.json():
                    cuenta = row.get("cuenta", "")
                    fh = row.get("fecha_hora", "")
                    if not cuenta or not fh:
                        continue
                    try:
                        dt = datetime.fromisoformat(fh.replace("Z", "+00:00"))
                        if (now - dt).total_seconds() <= 15:
                            parts = cuenta.split("_")
                            if len(parts) >= 6:
                                sn = parts[3]
                                canal = int(parts[5])
                                active.append((sn, canal))
                    except Exception:
                        pass
        except Exception as e:
            logger.error(f"[CLOUD-REQ] Error: {e}")
        return active

    def upload_to_supabase_with_ts(self, sn, canal, img_bytes, timestamp):
        """Sube frame Base64 + TS a cuenta DAHUA_FRAME_{SN}_CH_{CANAL}"""
        try:
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            payload = json.dumps({"ts": timestamp, "img": b64})
            cuenta = f"DAHUA_FRAME_{sn}_CH_{canal}"

            row_id = self.row_ids.get(cuenta)
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

            if row_id:
                r = requests.patch(
                    f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?id=eq.{row_id}",
                    headers={**headers, "Prefer": "return=minimal"},
                    json={"nombre_abonado": payload, "fecha_hora": timestamp},
                    timeout=3
                )
            else:
                r = requests.post(
                    f"{SUPABASE_URL}/rest/v1/eventos_monitoreo",
                    headers={**headers, "Prefer": "return=representation"},
                    json={"cuenta": cuenta, "nombre_abonado": payload, "evento": "FRAME_SYNC", "fecha_hora": timestamp},
                    timeout=3
                )
                if r.status_code in (200, 201) and r.json():
                    self.row_ids[cuenta] = r.json()[0]["id"]

            logger.info(f"[UPLOAD] Frame OK {sn} CH-{canal} ({len(img_bytes)} bytes)")
        except Exception as e:
            logger.error(f"[UPLOAD] Error {sn} CH-{canal}: {e}")

    def upload_to_vercel_api(self, sn, canal, img_bytes, timestamp):
        """Sube frame a Vercel API (caché en memoria, sin rate limits)"""
        try:
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            r = requests.post(
                VERCEL_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "x-bridge-secret": BRIDGE_SECRET
                },
                json={"sn": sn, "canal": canal, "img": b64, "ts": timestamp},
                timeout=5
            )
            if r.status_code == 200:
                logger.info(f"[VERCEL] Frame OK {sn} CH-{canal} ({len(img_bytes)} bytes)")
            else:
                logger.warning(f"[VERCEL] HTTP {r.status_code} {sn} CH-{canal}: {r.text[:100]}")
        except Exception as e:
            logger.error(f"[VERCEL] Error {sn} CH-{canal}: {e}")

    def _start_worker_for(self, sn, canal, user, pwd, local_ip, stream_type):
        key = f"{sn}_{canal}"
        if key not in self.workers or not self.workers[key].is_alive():
            w = CameraWorker(self, sn, user, pwd, canal, local_ip, stream_type)
            self.workers[key] = w
            w.start()
            logger.info(f"[MANAGER] Worker iniciado {key} (ip={local_ip or 'auto'})")
        return self.workers[key]

    def manager_loop(self):
        logger.info("[MANAGER] Loop control iniciado (MODO CONTINUO)")
        last_dev_refresh = 0
        while self.running:
            try:
                # 1. Refrescar dispositivos registrados cada 60s
                if time.time() - last_dev_refresh > 60.0:
                    self.registered_devices = self.fetch_all_registered_devices()
                    self._device_by_key = {}
                    for d in self.registered_devices:
                        k = f'{d["sn"]}_{d["canal"]}'
                        self._device_by_key[k] = d
                    logger.info(f"[MANAGER] Dispositivos cargados: {list(self._device_by_key.keys())}")
                    last_dev_refresh = time.time()

                # 2. Iniciar workers para TODOS los dispositivos (captura continua)
                for d in self.registered_devices:
                    key = f'{d["sn"]}_{d["canal"]}'
                    self._start_worker_for(d["sn"], d["canal"], d["user"], d["pass"], d.get("local_ip", ""), d.get("stream_type", "sub"))

            except Exception as e:
                logger.error(f"[MANAGER] Error loop: {e}", exc_info=True)
            time.sleep(5.0)

# -----------------------------------------------------------------------------
# CLIENTE SUPABASE GLOBAL + MOTOR GLOBAL
# -----------------------------------------------------------------------------
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
engine = DahuaMultiDeviceEngine()

# Escanear LAN para descubrir dispositivos Dahua (se ejecuta en thread separado)
threading.Thread(target=scan_lan_dahua, daemon=True, name="lan-scanner").start()

# -----------------------------------------------------------------------------
# HTTP HANDLER (PUERTO 8000)
# -----------------------------------------------------------------------------
class DahuaBridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        logger.info(f"[HTTP] {self.address_string()} - {fmt % args}")

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        # --------------------------------------------------------------
        # GET /status  -> Diagnóstico completo
        # --------------------------------------------------------------
        if parsed.path == "/status":
            sdk = engine.sdk_engine
            status = {
                "version": "2.2",
                "python_arch": f"{PYTHON_ARCH}-bit",
                "sdk_status": sdk.status,
                "sdk_arch_error": sdk._arch_error,
                "workers_total": len(engine.workers),
                "workers_active": [k for k, v in engine.workers.items() if v.is_alive()],
                "registered_devices": len(engine.registered_devices),
                "devices": [{"sn": d["sn"], "canal": d["canal"], "local_ip": d.get("local_ip", "")} for d in engine.registered_devices],
                "last_requests": {k: datetime.fromtimestamp(v).isoformat() if v else None for k, v in engine.last_request_times.items()},
                "running": engine.running,
                "frames_in_memory": len(engine.latest_frames),
                "frame_keys": list(engine.latest_frames.keys()),
                "uptime_seconds": round(time.time() - engine.start_time, 1),
                "p2p_dns_cache": _DNS_CACHE,
            }
            self._send_json(200, status)
            return

        # --------------------------------------------------------------
        # GET /dns-check?sn=XXXX  -> Forzar refresh DNS
        # --------------------------------------------------------------
        if parsed.path == "/dns-check":
            sn = params.get("sn", [""])[0].strip().upper()
            if not sn:
                self._send_json(400, {"error": "falta parametro sn"})
                return
            _DNS_CACHE.pop(sn, None)
            res = check_p2p_dns(sn)
            self._send_json(200, {"sn": sn, "dns_results": res})
            return

        # --------------------------------------------------------------
        # GET /snapshot?sn=XXXX&canal=1&user=admin&pass=XXX&stream=sub
        # Endpoint principal para Dashboard (/api/dahua-stream proxy)
        # --------------------------------------------------------------
        if parsed.path == "/snapshot":
            sn = params.get("sn", [""])[0].strip().upper()
            canal = int(params.get("canal", ["1"])[0])
            user = params.get("user", ["admin"])[0]
            pwd = params.get("pass", [""])[0]
            stream = params.get("stream", ["sub"])[0]

            if not sn:
                self._send_svg("SIN SN", 400)
                return

            key = f"{sn}_{canal}"
            engine.last_request_times[key] = time.time()

            # Asegurar worker vivo
            dev = engine._device_by_key.get(key)
            if dev:
                engine._start_worker_for(sn, canal, dev["user"], dev["pass"], dev.get("local_ip", ""), dev.get("stream_type", "sub"))
            else:
                # Fallback: IP local desde LAN scan si existe
                local_ip = params.get("local_ip", [""])[0].strip() or next((ip for ip in _LAN_DISCOVERED_IPS if sn.lower() in ip.lower()), "")
                engine._start_worker_for(sn, canal, user, pwd, local_ip, stream)

            # Esperar frame (max 12s para dar tiempo a conexión P2P nativa)
            deadline = time.time() + 12.0
            frame = None
            while time.time() < deadline:
                frame = engine.latest_frames.get(key)
                if frame:
                    break
                time.sleep(0.1)

            if frame:
                self.send_response(200)
                self.send_header("Content-Type", "image/jpeg")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.send_header("X-Dahua-Source", "LOCAL_BRIDGE_LIVE")
                self._cors()
                self.end_headers()
                self.wfile.write(frame)
            else:
                self._send_svg(f"ESPERANDO FRAME {sn} CH-{canal}", 200, "waiting")
            return

        # --------------------------------------------------------------
        # 404
        # --------------------------------------------------------------
        self.send_response(404)
        self.end_headers()
        self.wfile.write(b"Not Found")

    def _send_json(self, code, data):
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self._cors()
        self.end_headers()
        self.wfile.write(payload)

    def _send_svg(self, msg, code=200, kind="waiting"):
        color = "#f59e0b" if kind == "waiting" else "#ef4444"
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect fill="#0a0f1a" width="640" height="360"/>
  <text x="320" y="160" fill="{color}" font-family="monospace" font-size="18" text-anchor="middle">{msg}</text>
  <text x="320" y="190" fill="#666" font-family="monospace" font-size="12" text-anchor="middle">Bridge v2.2 - Puerto 8000</text>
</svg>"""
        self.send_response(code)
        self.send_header("Content-Type", "image/svg+xml")
        self.send_header("Cache-Control", "no-cache")
        self._cors()
        self.end_headers()
        self.wfile.write(svg.encode("utf-8"))

# -----------------------------------------------------------------------------
# MAIN ENTRY POINT
# -----------------------------------------------------------------------------
def run_server():
    server = HTTPServer(("0.0.0.0", 8000), DahuaBridgeHandler)
    logger.info("=" * 70)
    logger.info("  GAMA DAHUA BRIDGE v2.2 - PUERTO 8000")
    logger.info("  P2P NATIVO (SDK LoginEx2) + HTTP P2P FALLBACK")
    logger.info("  Endpoints: /snapshot /status /dns-check")
    logger.info("=" * 70)

    # Heartbeat thread
    hb = HeartbeatThread(engine)
    hb.start()

    # Manager thread
    mgr = threading.Thread(target=engine.manager_loop, daemon=True)
    mgr.start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Apagando servidor...")
    finally:
        engine.running = False
        hb.running = False
        for w in engine.workers.values():
            w.running = False
        engine.sdk_engine.cleanup()
        server.server_close()

if __name__ == "__main__":
    run_server()
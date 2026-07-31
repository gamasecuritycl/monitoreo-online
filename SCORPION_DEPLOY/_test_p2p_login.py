import ctypes, sys, time

dll_path = r'C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\SCORPION_DEPLOY\dhnetsdk_x64.dll'
dll = ctypes.WinDLL(dll_path)

dll.CLIENT_Init.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p]
dll.CLIENT_Init.restype = ctypes.c_bool
dll.CLIENT_SetConnectTime.argtypes = [ctypes.c_int]
dll.CLIENT_SetConnectTime.restype = None

if not dll.CLIENT_Init(None, None, None):
    print("Init failed")
    sys.exit(1)
dll.CLIENT_SetConnectTime(10000)
print("[OK] SDK initialized")

sn = "AE0970BPAG00815"
user = "admin"
pwd = "L2D55413"

class DEVINFO(ctypes.Structure):
    _fields_ = [
        ("nDeviceType", ctypes.c_int), ("nDeviceSubType", ctypes.c_int),
        ("nChanNum", ctypes.c_int), ("nIPChanNum", ctypes.c_int),
        ("nAnalogChanNum", ctypes.c_int), ("nStartChan", ctypes.c_int),
        ("nAudioChanNum", ctypes.c_int), ("szDevType", ctypes.c_char*32),
        ("szSerialNo", ctypes.c_char*48), ("szDevMac", ctypes.c_char*48),
        ("szDeviceIP", ctypes.c_char*128), ("nPort", ctypes.c_int),
        ("nRtspPort", ctypes.c_int), ("nRtmpPort", ctypes.c_int),
        ("nHttpsPort", ctypes.c_int), ("bReserved", ctypes.c_byte*512),
    ]

dll.CLIENT_LoginEx2.restype = ctypes.c_longlong
dll.CLIENT_LoginEx2.argtypes = [
    ctypes.c_char_p, ctypes.c_ushort, ctypes.c_char_p,
    ctypes.c_char_p, ctypes.c_int, ctypes.c_void_p,
    ctypes.POINTER(DEVINFO), ctypes.POINTER(ctypes.c_int), ctypes.c_int,
]

err_map = {
    1: "usr/pwd", 2: "no existe", 3: "timeout", 4: "re-login",
    5: "bloqueado", 6: "blacklist", 7: "recursos", 8: "sub conexion",
    9: "conexion ppal", 10: "max conexiones", 11: "solo 3gen",
    12: "U盾", 13: "IP sin permiso", 18: "no inicializado",
}

# Approach 1: P2P mode on various ports
print("\n=== Approach 1: LoginEx2 P2P mode (19) ===")
for port in [37777, 35000, 34567]:
    dev = DEVINFO()
    err = ctypes.c_int(0)
    h = dll.CLIENT_LoginEx2(
        sn.encode(), ctypes.c_ushort(port),
        user.encode(), pwd.encode(),
        19, None, ctypes.byref(dev), ctypes.byref(err), 10000,
    )
    msg = err_map.get(err.value, str(err.value))
    if h != 0:
        print(f"  [OK] P2P port {port} => handle={h}")
        dll.CLIENT_Logout.argtypes = [ctypes.c_longlong]
        dll.CLIENT_Logout.restype = ctypes.c_bool
        dll.CLIENT_Logout(h)
        break
    else:
        print(f"  [--] P2P port {port} => error {err.value} ({msg})")

# Approach 2: InitEx with custom params first
print("\n=== Approach 2: InitEx + LoginEx2 P2P ===")
dll.CLIENT_InitEx.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p]
dll.CLIENT_InitEx.restype = ctypes.c_int
dll.CLIENT_Cleanup()
time.sleep(0.5)

class InitParam(ctypes.Structure):
    _fields_ = [("nThreadNum", ctypes.c_int), ("bReserved", ctypes.c_ubyte*1024)]

ip = InitParam()
ip.nThreadNum = 10
rc = dll.CLIENT_InitEx(None, None, ctypes.byref(ip))
if rc == 1:
    print("[OK] InitEx OK")
    dll.CLIENT_SetConnectTime(10000)

    dev = DEVINFO()
    err = ctypes.c_int(0)
    h = dll.CLIENT_LoginEx2(
        sn.encode(), ctypes.c_ushort(37777),
        user.encode(), pwd.encode(),
        19, None, ctypes.byref(dev), ctypes.byref(err), 10000,
    )
    msg = err_map.get(err.value, str(err.value))
    if h != 0:
        print(f"  [OK] P2P login handle={h}")
        dll.CLIENT_Logout(h)
    else:
        print(f"  [--] InitEx+P2P => error {err.value} ({msg})")
else:
    print(f"[--] InitEx failed: {rc}")

# Approach 3: HighLevelSecurity login
print("\n=== Approach 3: LoginWithHighLevelSecurity P2P ===")
dll.CLIENT_Cleanup()
time.sleep(0.5)
dll.CLIENT_Init(None, None, None)
dll.CLIENT_SetConnectTime(10000)

class NET_IN_LOGIN_HIGH(ctypes.Structure):
    _fields_ = [
        ("dwSize", ctypes.c_uint),
        ("szIP", ctypes.c_char*64),
        ("nPort", ctypes.c_int),
        ("szUserName", ctypes.c_char*64),
        ("szPassword", ctypes.c_char*64),
        ("emSpecCap", ctypes.c_int),
        ("byReserved", ctypes.c_ubyte*4),
        ("pCapParam", ctypes.c_void_p),
    ]

class NET_OUT_LOGIN_HIGH(ctypes.Structure):
    _fields_ = [
        ("dwSize", ctypes.c_uint),
        ("nChannelNum", ctypes.c_int),
        ("szDeviceType", ctypes.c_char*128),
        ("byReserved", ctypes.c_ubyte*332),
    ]

dll.CLIENT_LoginWithHighLevelSecurity.restype = ctypes.c_longlong
dll.CLIENT_LoginWithHighLevelSecurity.argtypes = [
    ctypes.POINTER(NET_IN_LOGIN_HIGH),
    ctypes.POINTER(NET_OUT_LOGIN_HIGH),
]

for port in [37777, 35000, 34567]:
    inp = NET_IN_LOGIN_HIGH()
    inp.dwSize = ctypes.sizeof(NET_IN_LOGIN_HIGH)
    inp.szIP = sn.encode()
    inp.nPort = port
    inp.szUserName = user.encode()
    inp.szPassword = pwd.encode()
    inp.emSpecCap = 19  # P2P
    inp.pCapParam = None

    out = NET_OUT_LOGIN_HIGH()
    out.dwSize = ctypes.sizeof(NET_OUT_LOGIN_HIGH)

    h = dll.CLIENT_LoginWithHighLevelSecurity(ctypes.byref(inp), ctypes.byref(out))
    if h != 0:
        print(f"  [OK] HighSec P2P port {port} => handle={h}")
        dll.CLIENT_Logout.argtypes = [ctypes.c_longlong]
        dll.CLIENT_Logout(h)
        break
    else:
        err_code = dll.CLIENT_GetLastError() & 0x7fffffff
        print(f"  [--] HighSec P2P port {port} => error {err_code}")

# Approach 4: Cloud mode (16) instead of P2P
print("\n=== Approach 4: LoginEx2 CLOUD mode (16) ===")
dev = DEVINFO()
err = ctypes.c_int(0)
h = dll.CLIENT_LoginEx2(
    sn.encode(), ctypes.c_ushort(37777),
    user.encode(), pwd.encode(),
    16, None, ctypes.byref(dev), ctypes.byref(err), 10000,
)
msg = err_map.get(err.value, str(err.value))
if h != 0:
    print(f"  [OK] CLOUD mode handle={h}")
    dll.CLIENT_Logout(h)
else:
    print(f"  [--] CLOUD mode => error {err.value} ({msg})")

dll.CLIENT_Cleanup()
print("\nDone")

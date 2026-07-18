const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec, execSync } = require('child_process');
const os = require('os');
const net = require('net');

// 1. Configuración de directorios y Supabase
const INSTALL_DIR = 'C:\\GAMA_CAMARA';
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = 'https://onxwyrwmpjxtwlmjrosr.supabase.co';
let supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+)/);
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) supabaseAnonKey = keyMatch[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('====================================================');
console.log('     GAMA SEGURIDAD - AUTODEPLOY DE CÁMARA DESATENDIDO');
console.log('====================================================\n');

// Validar que se ejecute en Windows
if (process.platform !== 'win32') {
  console.error('Este script solo es compatible con sistemas Windows.');
  process.exit(1);
}

rl.question('🔑 Ingrese Cuenta del Abonado (ej. C7C9): ', async (cuentaRaw) => {
  const cuenta = cuentaRaw.trim().toUpperCase();
  if (!cuenta) {
    console.error('ERROR: La cuenta no puede estar vacía.');
    rl.close();
    process.exit(1);
  }

  console.log('\n🔍 Paso 1: Buscando cámaras Dahua en la red local...');
  const cameraIp = await buscarCamaraLocal();

  if (!cameraIp) {
    console.error('\n❌ ERROR: No se detectó ninguna cámara Dahua en la red local.');
    console.log('Asegúrese de estar en la misma red Wi-Fi de la cámara.');
    rl.close();
    process.exit(1);
  }

  console.log(`\n✅ Cámara encontrada en IP: ${cameraIp}`);

  console.log('\n📦 Paso 2: Instalando y configurando MediaMTX (H.264)...');
  instalarMediaMTX(cameraIp);

  console.log('\n🌐 Paso 3: Configurando e iniciando Túnel Cloudflare en background...');
  iniciarTunnelCloudflare(cuenta);
});

// Función para escanear la red local de forma asíncrona rápida
function buscarCamaraLocal() {
  return new Promise((resolve) => {
    const interfaces = os.networkInterfaces();
    const subnets = [];
    
    for (const name in interfaces) {
      if (name.toLowerCase().includes('wireguard') || name.toLowerCase().includes('docker') || name.toLowerCase().includes('virtual')) {
        continue;
      }
      for (const face of interfaces[name]) {
        if (face.family === 'IPv4' && !face.internal) {
          const parts = face.address.split('.');
          const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
          if (!subnets.includes(subnet)) {
            subnets.push(subnet);
          }
        }
      }
    }

    if (subnets.length === 0) {
      resolve(null);
      return;
    }

    const ports = [37777, 554];
    const timeout = 600;
    const promises = [];
    let foundIp = null;

    subnets.forEach(subnet => {
      for (let i = 1; i <= 254; i++) {
        const ip = `${subnet}.${i}`;
        ports.forEach(port => {
          promises.push(new Promise((res) => {
            const socket = new net.Socket();
            socket.setTimeout(timeout);
            socket.on('connect', () => {
              foundIp = ip;
              socket.destroy();
              res();
            });
            socket.on('timeout', () => { socket.destroy(); res(); });
            socket.on('error', () => { socket.destroy(); res(); });
            socket.connect(port, ip);
          }));
        });
      }
    });

    Promise.all(promises).then(() => {
      resolve(foundIp);
    });
  });
}

function instalarMediaMTX(cameraIp) {
  if (!fs.existsSync(INSTALL_DIR)) {
    fs.mkdirSync(INSTALL_DIR, { recursive: true });
  }

  const version = 'v1.9.3';
  const exePath = path.join(INSTALL_DIR, 'mediamtx.exe');
  
  if (fs.existsSync(exePath)) {
    console.log('   MediaMTX ya está instalado localmente.');
  } else {
    console.log('   Descargando archivos binarios...');
    const zipUrl = `https://github.com/bluenviron/mediamtx/releases/download/${version}/mediamtx_${version}_windows_amd64.zip`;
    const zipPath = path.join(INSTALL_DIR, 'mediamtx.zip');
    
    execSync(`powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${zipUrl}' -OutFile '${zipPath}' -UseBasicParsing"`);
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${INSTALL_DIR}' -Force"`);
    fs.unlinkSync(zipPath);
    console.log('   Descarga completa.');
  }

  const configContent = 
`logLevel: warn
rtspAddress: :8554
rtmpAddress: :1935
hlsAddress: :8888
webrtcAddress: :8889

paths:
  camgama:
    source: "rtsp://admin:L2D55413@${cameraIp}:554/cam/realmonitor?channel=1&subtype=1"
    sourceOnDemand: no
    record: no
`;

  fs.writeFileSync(path.join(INSTALL_DIR, 'mediamtx.yml'), configContent);
  console.log('   Configuración de MediaMTX generada con éxito.');
}

function iniciarTunnelCloudflare(cuenta) {
  const exePath = path.join(INSTALL_DIR, 'cloudflared.exe');
  const logPath = path.join(INSTALL_DIR, 'tunnel.log');

  if (!fs.existsSync(exePath)) {
    console.log('   Descargando Cloudflare Tunnel...');
    const cfUrl = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
    execSync(`powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${cfUrl}' -OutFile '${exePath}' -UseBasicParsing"`);
    console.log('   Cloudflare Tunnel descargado.');
  }

  if (fs.existsSync(logPath)) {
    try { fs.unlinkSync(logPath); } catch {}
  }

  console.log('   Iniciando procesos de transmisión en segundo plano...');

  // 1. Limpieza de tareas programadas obsoletas para no dejar basura
  try {
    execSync('schtasks /delete /tn "GamaMediaMTX" /f', { stdio: 'ignore' });
    execSync('schtasks /delete /tn "GamaTunnel" /f', { stdio: 'ignore' });
  } catch {}

  // 2. Generar el script VBScript invisible definitivo para evitar errores de permisos UAC
  const vbsContent = 
`Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c C:\\GAMA_CAMARA\\mediamtx.exe C:\\GAMA_CAMARA\\mediamtx.yml", 0, false
WshShell.Run "cmd.exe /c C:\\GAMA_CAMARA\\cloudflared.exe tunnel --url http://127.0.0.1:8889 --logfile C:\\GAMA_CAMARA\\tunnel.log", 0, false
`;
  
  const vbsPath = path.join(INSTALL_DIR, 'iniciar.vbs');
  fs.writeFileSync(vbsPath, vbsContent);

  // 3. Copiar a la carpeta de Inicio de Windows (Startup) para que corra automático sin UAC ni ventanas
  const startupDir = path.join(process.env.APPDATA, 'Microsoft\\Windows\\Start Menu\\Programs\\Startup');
  const startupVbsPath = path.join(startupDir, 'GamaCamara.vbs');
  fs.writeFileSync(startupVbsPath, vbsContent);
  console.log('   Acceso directo invisible agregado al Inicio de Windows.');

  // 4. Ejecutar el VBScript inmediatamente para iniciar la transmisión ahora mismo de forma invisible
  exec(`wscript.exe "${vbsPath}"`);

  console.log('   Procesos en ejecución en background. Obteniendo la URL pública del túnel...');

  // 5. Monitorear el archivo tunnel.log en busca de la URL generada por Cloudflare
  let checkAttempts = 0;
  const maxAttempts = 30;
  
  const checkLogInterval = setInterval(async () => {
    checkAttempts++;
    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf8');
      const urlMatch = logContent.match(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/i);
      
      if (urlMatch) {
        clearInterval(checkLogInterval);
        const cloudflareUrl = urlMatch[0];
        console.log(`\n🔗 URL pública de Cloudflare detectada: ${cloudflareUrl}`);
        
        await guardarCamaraEnSupabase(cuenta, `${cloudflareUrl}/camgama`);
      }
    }
    
    if (checkAttempts >= maxAttempts) {
      clearInterval(checkLogInterval);
      console.error('\n❌ ERROR: Timeout esperando la URL del túnel. Revise el archivo C:\\GAMA_CAMARA\\tunnel.log');
      rl.close();
      process.exit(1);
    }
  }, 1000);
}

async function guardarCamaraEnSupabase(cuenta, url) {
  try {
    const { data, error: fetchErr } = await supabase
      .from('eventos_monitoreo')
      .select('nombre_abonado')
      .eq('cuenta', 'CAMARAS')
      .limit(1);

    if (fetchErr) throw fetchErr;

    let todasLasCamaras = {};
    if (data && data.length > 0) {
      todasLasCamaras = JSON.parse(data[0].nombre_abonado || '{}');
    }

    todasLasCamaras[cuenta] = {
      cam01: url,
      cam02: '',
      cam03: ''
    };

    const { error: upsertErr } = await supabase
      .from('eventos_monitoreo')
      .upsert({
        cuenta: 'CAMARAS',
        nombre_abonado: JSON.stringify(todasLasCamaras),
        evento: 'CONFIGURACION',
        fecha_hora: new Date().toISOString()
      });

    if (upsertErr) throw upsertErr;

    console.log('\n====================================================');
    console.log('        🚀 DESPLIEGUE COMPLETO Y EXITOSO');
    console.log('====================================================');
    console.log(` El abonado ${cuenta} ya tiene su cámara en línea.`);
    console.log(` URL de Transmisión: ${url}`);
    console.log(' Todos los procesos están corriendo en segundo plano.');
    console.log(' Se iniciarán solos si el PC del cliente se reinicia.');
    console.log('====================================================\n');

  } catch (err) {
    console.error('\n❌ ERROR al guardar en Supabase:', err.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

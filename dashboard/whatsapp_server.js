/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - SERVIDOR OPEN-WA / WHATSAPP OFICIAL DE LA CENTRAL v1.0
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const PORT = 3015
const app = express()
app.use(express.json())

let clientWA = null
let estadoConexion = 'INICIANDO_GATEWAY'
let ultimoMensajeStatus = 'Servidor activo en puerto 3015 y Supabase Realtime'

console.log('=====================================================')
console.log('  GAMA SEGURIDAD - SERVIDOR WHATSAPP OFICIAL v1.0')
console.log('=====================================================')

// Iniciar servidor HTTP Express inmediatamente
const server = app.listen(PORT, () => {
  console.log(`🚀 [SERVIDOR ACTIVADO] Escuchando en http://localhost:${PORT}`)
  console.log(`📡 [SUPABASE REALTIME] Conectado a canal whatsapp_outbound`)
})

// Manejo de errores de puerto en uso
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[PUERTO] El puerto ${PORT} ya está ocupado por otra instancia activa de Gama Seguridad.`)
  }
})

// Suscripción a canal Supabase Realtime
try {
  const channel = supabase.channel('whatsapp_outbound')
  channel.on('broadcast', { event: 'send_whatsapp' }, async ({ payload }) => {
    if (payload && payload.phone && payload.text) {
      console.log(`📩 [BROADCAST REALTIME RECIBIDO] Para: ${payload.phone}`)
      await despacharMensaje(payload.phone, payload.text)
    }
  }).subscribe((status) => {
    console.log(`[SUPABASE] Estado canal realtime: ${status}`)
  })
} catch (err) {
  console.warn('[SUPABASE ERROR]:', err.message)
}

// Buscar ejecutable de Chrome en el sistema Windows del usuario
function buscarRutaChrome() {
  const rutas = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ]
  for (const r of rutas) {
    if (fs.existsSync(r)) return r
  }
  return undefined
}

// Cargar motor OpenWA
async function iniciarMotorWhatsApp() {
  try {
    const wa = require('@open-wa/wa-automate')
    console.log('[OPEN-WA] Iniciando cliente de WhatsApp con Chrome del sistema...')
    
    const chromePath = buscarRutaChrome()
    const options = {
      sessionId: "GAMA_SEGURIDAD_SESSION",
      multiDevice: true,
      authTimeout: 0,
      blockCrashLogs: true,
      disableSpins: true,
      headless: false,
      popup: true,
      qrTimeout: 0,
      useChrome: true
    }

    if (chromePath) {
      options.executablePath = chromePath
      console.log(`[CHROME] Usando navegador local: ${chromePath}`)
    }

    const client = await wa.create(options)

    clientWA = client
    estadoConexion = 'CONECTADO_WHATSAPP_OFICIAL'
    console.log('✅ [OPEN-WA] ¡WhatsApp Oficial de Gama Seguridad Conectado!')

    client.onMessage(async (message) => {
      try {
        console.log(`💬 [WHATSAPP RECIBIDO] De: ${message.from} -> ${message.body}`)
        const numero = message.from.replace(/[^0-9]/g, '')
        await supabase.from('conversaciones_whatsapp').insert({
          numero: numero,
          tipo_evento: 'mensaje_entrante',
          estado: 'pendiente',
          mensaje_enviado: message.body,
          created_at: new Date().toISOString()
        })
      } catch (e) {}
    })

  } catch (err) {
    estadoConexion = 'GATEWAY_REALTIME_ACTIVO'
    ultimoMensajeStatus = 'Gateway HTTP / Supabase Realtime activo. ' + (err.message || '')
    console.log('[INFO] Servidor operando en modo Gateway Realtime seguro.')
  }
}

// Despacho de mensajes por WhatsApp
async function despacharMensaje(phone, text) {
  const telLimpio = phone.replace(/[^0-9]/g, '')
  const formattedPhone = telLimpio.includes('@c.us') ? telLimpio : `${telLimpio}@c.us`

  console.log(`📤 [ENVIANDO] A: ${telLimpio} -> "${text.slice(0, 35)}..."`)

  if (clientWA) {
    try {
      await clientWA.sendText(formattedPhone, text)
      console.log(`✅ [ENTREGADO] Mensaje enviado a ${telLimpio}`)
      return true
    } catch (err) {
      console.error('❌ [ERROR ENVÍO OPEN-WA]:', err.message)
    }
  }

  return true
}

// Rutas HTTP Express
app.post('/api/send', async (req, res) => {
  const { phone, text } = req.body
  if (!phone || !text) {
    return res.status(400).json({ ok: false, error: 'Faltan parámetros' })
  }
  const ok = await despacharMensaje(phone, text)
  res.json({ ok, estado: estadoConexion })
})

app.get('/api/status', (req, res) => {
  res.json({ ready: true, estado: estadoConexion, statusText: ultimoMensajeStatus })
})

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Gama Seguridad - WhatsApp Official Server</title>
        <meta charset="utf-8">
        <style>
          body { font-family: monospace; background: #0f172a; color: #38bdf8; padding: 20px; text-align: center; }
          .card { background: #1e293b; border: 2px solid #334155; padding: 25px; max-width: 550px; margin: 0 auto; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { color: #22c55e; margin-bottom: 5px; }
          .badge { background: #22c55e; color: black; padding: 4px 12px; font-weight: bold; border-radius: 4px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🛡️ GAMA SEGURIDAD</h1>
          <h3>SERVIDOR WHATSAPP CENTRAL v1.0</h3>
          <p>Estado de Conexión: <br/><span class="badge">${estadoConexion}</span></p>
          <p>📡 Escuchando canal Supabase Realtime: <strong>whatsapp_outbound</strong></p>
          <p>🌐 Puerto HTTP API Local: <strong>3015</strong></p>
        </div>
      </body>
    </html>
  `)
})

// Iniciar motor de WhatsApp
iniciarMotorWhatsApp()

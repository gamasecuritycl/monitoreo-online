/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - SERVIDOR WHATSAPP OFICIAL DE LA CENTRAL v2.0
 * ═══════════════════════════════════════════════════════════════════════════
 *  Servidor de alta disponibilidad usando whatsapp-web.js y Supabase Realtime.
 */

const express = require('express')
const { createClient } = require('@supabase/supabase-js')
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcodeTerminal = require('qrcode-terminal')
const QRCode = require('qrcode')
const fs = require('fs')

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const PORT = 3015
const app = express()
app.use(express.json())

let clientWA = null
let estadoConexion = 'ESPERANDO_ESCANEO_QR'
let qrDataURL = null

console.log('=====================================================')
console.log('  GAMA SEGURIDAD - SERVIDOR WHATSAPP OFICIAL v2.0')
console.log('=====================================================')

// Iniciar servidor HTTP Express inmediatamente
const server = app.listen(PORT, () => {
  console.log(`🚀 [SERVIDOR ACTIVADO] Escuchando en http://localhost:${PORT}`)
  console.log(`📡 [SUPABASE REALTIME] Conectado a canal whatsapp_outbound`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[PUERTO] El puerto ${PORT} ya está ocupado por otra instancia.`)
  }
})

// Suscripción a canal Supabase Realtime
try {
  const channel = supabase.channel('whatsapp_outbound')
  channel.on('broadcast', { event: 'send_whatsapp' }, async ({ payload }) => {
    if (payload && payload.phone && payload.text) {
      console.log(`📩 [BROADCAST RECIBIDO] Para: ${payload.phone}`)
      await despacharMensaje(payload.phone, payload.text)
    }
  }).subscribe((status) => {
    console.log(`[SUPABASE] Estado canal realtime: ${status}`)
  })
} catch (err) {
  console.warn('[SUPABASE ERROR]:', err.message)
}

// Buscar ejecutable de Chrome/Edge local
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

// Iniciar whatsapp-web.js
function iniciarWhatsAppWeb() {
  const chromePath = buscarRutaChrome()
  console.log(`[WHATSAPP WEB] Iniciando motor de mensajería...`)
  if (chromePath) {
    console.log(`[CHROME] Usando navegador: ${chromePath}`)
  }

  const clientOptions = {
    authStrategy: new LocalAuth({ dataPath: './.gama_whatsapp_session' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
  }

  if (chromePath) {
    clientOptions.puppeteer.executablePath = chromePath
  }

  const client = new Client(clientOptions)

  // Evento QR Code
  client.on('qr', (qr) => {
    estadoConexion = 'ESPERANDO_ESCANEO_QR'
    console.log('\n=====================================================')
    console.log(' 📲 ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP CORPORATIVO')
    console.log('=====================================================\n')
    qrcodeTerminal.generate(qr, { small: true })
    console.log('\nO abre http://localhost:3015 en tu navegador para ver el QR en pantalla grande.\n')

    QRCode.toDataURL(qr, (err, url) => {
      if (!err) qrDataURL = url
    })
  })

  // Evento Autenticado & Listo
  client.on('ready', () => {
    clientWA = client
    estadoConexion = 'CONECTADO_WHATSAPP_OFICIAL'
    qrDataURL = null
    console.log('✅ [WHATSAPP-WEB] ¡Sesión de WhatsApp Oficial Gama Seguridad lista y conectada!')
  })

  // Evento Mensaje Entrante
  client.on('message', async (msg) => {
    try {
      console.log(`💬 [MENSAJE RECIBIDO] De: ${msg.from} -> ${msg.body}`)
      const numero = msg.from.replace(/[^0-9]/g, '')
      await supabase.from('conversaciones_whatsapp').insert({
        numero: numero,
        tipo_evento: 'mensaje_entrante',
        estado: 'pendiente',
        mensaje_enviado: msg.body,
        created_at: new Date().toISOString()
      })
    } catch (e) {}
  })

  client.on('disconnected', (reason) => {
    console.warn('[WHATSAPP-WEB] Cliente desconectado:', reason)
    clientWA = null
    estadoConexion = 'DESCONECTADO'
  })

  client.initialize()
}

function normalizarNumeroWhatsApp(phone) {
  if (!phone) return ''
  let digits = phone.toString().replace(/[^0-9]/g, '')
  if (digits.length === 9 && digits.startsWith('9')) {
    digits = '56' + digits
  } else if (digits.length === 8) {
    digits = '569' + digits
  }
  return digits.endsWith('@c.us') ? digits : `${digits}@c.us`
}

// Despacho de Mensajes
async function despacharMensaje(phone, text) {
  const formattedPhone = normalizarNumeroWhatsApp(phone)
  const telLimpio = formattedPhone.replace('@c.us', '')

  console.log(`📤 [ENVIANDO WHATSAPP OFICIAL] A: ${formattedPhone} -> "${text.slice(0, 35)}..."`)

  if (clientWA) {
    try {
      await clientWA.sendMessage(formattedPhone, text)
      console.log(`✅ [ENTREGADO EN LÍNEA VIA WHATSAPP-WEB] Mensaje enviado con éxito a ${formattedPhone}`)
      return true
    } catch (err) {
      console.error('❌ [ERROR ENVÍO WHATSAPP-WEB]:', err.message)
    }
  } else {
    console.warn('⚠️ [CLIENTE NO CONECTADO] WhatsApp Web aún no ha iniciado sesión.')
  }

  return true
}

// Rutas API Express
app.post('/api/send', async (req, res) => {
  const { phone, text } = req.body
  if (!phone || !text) {
    return res.status(400).json({ ok: false, error: 'Faltan parámetros' })
  }
  const ok = await despacharMensaje(phone, text)
  res.json({ ok, estado: estadoConexion })
})

app.get('/api/status', (req, res) => {
  res.json({ ready: !!clientWA, estado: estadoConexion, hasQR: !!qrDataURL })
})

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Gama Seguridad - WhatsApp Central</title>
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="5">
        <style>
          body { font-family: sans-serif; background: #0f172a; color: #38bdf8; padding: 20px; text-align: center; }
          .card { background: #1e293b; border: 2px solid #334155; padding: 25px; max-width: 550px; margin: 0 auto; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { color: #22c55e; margin-bottom: 5px; font-size: 24px; }
          .badge { background: #22c55e; color: black; padding: 6px 14px; font-weight: bold; border-radius: 6px; display: inline-block; margin: 10px 0; font-size: 14px; }
          .badge-wait { background: #f59e0b; color: black; }
          .qr-img { background: white; padding: 12px; border-radius: 8px; margin: 15px auto; display: block; max-width: 250px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🛡️ GAMA SEGURIDAD</h1>
          <h3>SERVIDOR DE WHATSAPP CENTRAL v2.0</h3>
          
          <p>Estado de Conexión:<br/>
            <span class="badge ${estadoConexion.includes('ESPERANDO') ? 'badge-wait' : ''}">
              ${estadoConexion}
            </span>
          </p>

          ${qrDataURL ? `
            <div style="margin-top: 15px;">
              <p style="color: #fef08a; font-weight: bold;">📲 ESCANEA EL CÓDIGO QR CON TU WHATSAPP CORPORATIVO:</p>
              <img src="${qrDataURL}" class="qr-img" alt="QR WhatsApp" />
            </div>
          ` : ''}

          ${estadoConexion === 'CONECTADO_WHATSAPP_OFICIAL' ? `
            <div style="margin-top: 15px; color: #4ade80; font-weight: bold;">
              ✅ Dispositivo Vinculado Exitosamente. Mensajes activos sin publicidad.
            </div>
          ` : ''}

          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
            📡 Canal Supabase Realtime: <strong>whatsapp_outbound</strong> | Puerto HTTP: <strong>3015</strong>
          </p>
        </div>
      </body>
    </html>
  `)
})

iniciarWhatsAppWeb()

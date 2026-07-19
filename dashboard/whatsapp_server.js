/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - SERVIDOR OPEN-WA / WHATSAPP OFICIAL DE LA CENTRAL v1.0
 * ═══════════════════════════════════════════════════════════════════════════
 *  Servidor desatendido que conecta la sesión oficial de WhatsApp de Gama Seguridad
 *  con el Command Center en tiempo real a través de Supabase Broadcast.
 */

const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const PORT = 3015
const app = express()
app.use(express.json())

let clientWA = null
let estadoConexion = 'INICIANDO'

console.log('=====================================================')
console.log('  GAMA SEGURIDAD - SERVIDOR WHATSAPP OFICIAL v1.0')
console.log('=====================================================')

// Cargar motor OpenWA si está instalado
async function iniciarInstanciaOpenWA() {
  try {
    const wa = require('@open-wa/wa-automate')
    console.log('[OPEN-WA] Iniciando cliente de WhatsApp...')
    
    wa.create({
      sessionId: "GAMA_SEGURIDAD_SESSION",
      multiDevice: true,
      authTimeout: 60,
      blockCrashLogs: true,
      disableSpins: true,
      headless: true,
      logConsole: false,
      popup: false,
      qrTimeout: 0,
    }).then(client => {
      clientWA = client
      estadoConexion = 'CONECTADO'
      console.log('✅ [OPEN-WA] Sesión de WhatsApp Oficial de Gama Seguridad conectada exitosamente!')
      escucharMensajesEntrantes(client)
    }).catch(err => {
      console.warn('[OPEN-WA WARNING]:', err.message || err)
      iniciarFallbackGateway()
    })
  } catch (e) {
    console.log('[OPEN-WA] Servidor listo en modo Gateway HTTP & Supabase Realtime.')
    iniciarFallbackGateway()
  }
}

function iniciarFallbackGateway() {
  estadoConexion = 'MODO_GATEWAY_REALTIME'
  console.log('[GATEWAY] Servidor activo escuchando en puerto 3015 y sala Supabase Realtime.')
}

function escucharMensajesEntrantes(client) {
  if (!client) return
  client.onMessage(async (message) => {
    try {
      console.log(`[WHATSAPP ENTRANTE] De: ${message.from} - ${message.body}`)
      const numero = message.from.replace(/[^0-9]/g, '')
      await supabase.from('conversaciones_whatsapp').insert({
        numero: numero,
        tipo_evento: 'mensaje_entrante',
        estado: 'pendiente',
        mensaje_enviado: message.body,
        created_at: new Date().toISOString()
      })
    } catch (err) {
      console.warn('[WHATSAPP REGISTRO ERROR]:', err)
    }
  })
}

// Enviar mensaje por WhatsApp
async function despacharMensaje(phone, text) {
  const telLimpio = phone.replace(/[^0-9]/g, '')
  const formattedPhone = telLimpio.includes('@c.us') ? telLimpio : `${telLimpio}@c.us`

  console.log(`[ENVIANDO WHATSAPP OFICIAL] A: ${telLimpio} -> "${text.slice(0, 40)}..."`)

  if (clientWA) {
    try {
      await clientWA.sendText(formattedPhone, text)
      console.log(`✅ [ENTREGADO OPEN-WA] Mensaje enviado a ${telLimpio}`)
      return true
    } catch (err) {
      console.error('❌ [ERROR OPEN-WA]:', err)
    }
  }

  return false
}

// Suscripción Realtime a las órdenes de envío del Dashboard en Vercel
const channel = supabase.channel('whatsapp_outbound')
channel.on('broadcast', { event: 'send_whatsapp' }, async ({ payload }) => {
  if (payload && payload.phone && payload.text) {
    console.log('[BROADCAST DESDE VERCEL RECIBIDO]:', payload.phone)
    await despacharMensaje(payload.phone, payload.text)
  }
}).subscribe((status) => {
  console.log(`[SUPABASE REALTIME] Estado de suscripción: ${status}`)
})

// Ruta HTTP API Local
app.post('/api/send', async (req, res) => {
  const { phone, text } = req.body
  if (!phone || !text) {
    return res.status(400).json({ ok: false, error: 'Faltan parámetros' })
  }
  const ok = await despacharMensaje(phone, text)
  res.json({ ok, estado: estadoConexion })
})

app.get('/api/status', (req, res) => {
  res.json({ ready: !!clientWA, estado: estadoConexion })
})

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Gama Seguridad - WhatsApp Oficial Server</title>
        <meta charset="utf-8">
        <style>
          body { font-family: monospace; background: #0f172a; color: #38bdf8; padding: 20px; text-align: center; }
          .card { background: #1e293b; border: 2px solid #334155; padding: 20px; max-width: 500px; margin: 0 auto; border-radius: 8px; }
          h1 { color: #22c55e; }
          .badge { background: #22c55e; color: black; padding: 4px 10px; font-weight: bold; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🛡️ GAMA SEGURIDAD</h1>
          <h2>SERVIDOR WHATSAPP OFICIAL</h2>
          <p>Estado de Conexión: <span class="badge">${estadoConexion}</span></p>
          <p>Escuchando canal Supabase Realtime <strong>whatsapp_outbound</strong></p>
          <p>Puerto HTTP API Local: <strong>3015</strong></p>
        </div>
      </body>
    </html>
  `)
})

iniciarInstanciaOpenWA()

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`)
})

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - BOT DE WHATSAPP VENTAS EN LA NUBE (24/7)
 *  - Compatible con Render.com, Koyeb, Railway, VPS
 *  - Motor: Baileys 7.x
 *  - Inteligencia Artificial: Google Gemini
 *  - Human Handoff (Derivación automática a asesor humano)
 * ═══════════════════════════════════════════════════════════════════════
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const QRCode = require('qrcode')

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  isJidBroadcast,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { createClient } = require('@supabase/supabase-js')

// ──────────────────────────────────────────────
//  CONFIGURACIÓN
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000
const SESSION_DIR = process.env.SESSION_DIR || path.join(__dirname, '.session-cloud')
const OWNER_PHONE = process.env.OWNER_PHONE || '56991016912' // Teléfono donde llegan alertas de derivación
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true })
}

// ──────────────────────────────────────────────
//  SISTEMA DE HUMAN HANDOFF & IA
// ──────────────────────────────────────────────
const humanTakeover = new Map() // telefono -> timestamp de derivación
const processedMessages = new Map()
const DEDUP_TTL = 300_000

let genAI = null
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  } catch (e) {
    console.error('Error inicializando Gemini:', e.message)
  }
}

const SYSTEM_PROMPT = `
Eres el Asistente Virtual Comercial de GAMA SEGURIDAD SpA (Chile).
Tu objetivo es atender amablemente a los prospectos que llegan de anuncios de Facebook e Instagram, resolver sus dudas y conseguir sus datos para agendar una cotización o instalación.

INFORMACIÓN CLAVE DE GAMA SEGURIDAD:
- Monitoreo 24/7 profesional desde 0,9 UF + IVA mensuales (~$35.000 CLP).
- Los equipos son 100% PROPIOS del cliente. NO cobramos arriendos eternos ni comodato (gran ventaja frente a Verisure, que cobra $65.000 a $80.000/mes y los equipos nunca son del cliente).
- Si el cliente ya tiene una alarma instalada (marca DSC, Honeywell o ADT), ofrecemos MIGRACIÓN A COSTO $0 en hardware (reprogramamos su panel existente hacia nuestra central).
- Kits de alarmas inalámbricos nuevos para casa desde $199.900 con instalación.
- Cobertura técnica propia en las 52 comunas de la Región Metropolitana y 38 de la Región de Valparaíso.
- También instalamos cámaras de seguridad 4K con IA y cercos eléctricos certificados SEC.

PAUTAS DE RESPUESTA:
- Responde siempre de forma cordial, profesional y chilena sin modismos exagerados.
- Máximo 2 o 3 párrafos cortos (los mensajes de WhatsApp deben ser fáciles de leer en el celular).
- Pregunta siempre: 1) ¿En qué comuna se encuentra tu propiedad? y 2) ¿Buscas seguridad para casa o negocio?
- Si el usuario dice que quiere hablar con una persona humana, o si pide que lo llamen, indícale amablemente que lo transfieres de inmediato con un asesor humano.
`

async function generarRespuestaIA(textoUsuario, nombreCliente) {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const prompt = `${SYSTEM_PROMPT}\n\nCliente (${nombreCliente || 'Prospecto'}): "${textoUsuario}"\n\nRespuesta:`
      const result = await model.generateContent(prompt)
      const text = result?.response?.text()
      if (text) return text.trim()
    } catch (err) {
      console.error('[IA] Error en Gemini:', err.message)
    }
  }

  // Fallback inteligente si no hay API key de Gemini
  const t = textoUsuario.toLowerCase()
  if (t.includes('precio') || t.includes('cuanto') || t.includes('costo') || t.includes('plan')) {
    return `¡Hola ${nombreCliente || ''}! En Gama Seguridad nuestro plan de monitoreo 24/7 cuesta desde 0,9 UF + IVA (~$35.000 CLP al mes). A diferencia de otras empresas, los equipos son 100% tuyos sin arriendos eternos.\n\n¿En qué comuna se encuentra tu propiedad y buscas alarma para casa o negocio?`
  }
  if (t.includes('verisure') || t.includes('adt')) {
    return `¡Hola ${nombreCliente || ''}! En Gama Seguridad no amarramos a nadie con contratos de arriendo abusivo: los equipos son de tu propiedad. Si ya tienes alarma instalada (como ADT o DSC), la reprogramamos a costo $0 en sensores y solo pagas 0,9 UF + IVA al mes.\n\n¿En qué comuna te ubicas para coordinar la evaluación técnica?`
  }
  return `¡Hola ${nombreCliente || ''}! Gracias por contactar a GAMA Seguridad Chile. Protegemos hogares y empresas con monitoreo 24/7 desde 0,9 UF + IVA y equipos 100% propios sin comodato.\n\nPara ayudarte con una cotización exacta, ¿en qué comuna se ubica tu propiedad y es para casa o empresa?`
}

function esPeticionDeHumano(texto) {
  const t = String(texto || '').toLowerCase()
  const palabrasClave = [
    'humano', 'persona', 'alguien', 'asesor', 'ejecutivo', 'vendedor',
    'llamar', 'llamen', 'llamame', 'llámenme', 'fono', 'telefono', 'teléfono',
    'hablar con alguien', 'comunicar con alguien', 'atencion humana'
  ]
  return palabrasClave.some(p => t.includes(p))
}

// ──────────────────────────────────────────────
//  ESTADO Y SOCKET BAILEYS
// ──────────────────────────────────────────────
let sock = null
let qrActual = null
let qrImageBase64 = null
let estadoConexion = 'desconectado'
let numeroConectado = null
let usuarioConectado = null

function log(msg, nivel = 'INFO') {
  const ts = new Date().toLocaleTimeString('es-CL', { hour12: false })
  console.log(`[${ts}] [CLOUD-BOT-${nivel}] ${msg}`)
}

async function conectar() {
  estadoConexion = 'conectando'
  log(`Iniciando Baileys en la nube (Puerto ${PORT})...`)

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }))

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('GAMA Cloud Bot'),
      syncFullHistory: false,
      markOnlineOnConnect: true,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        qrActual = qr
        qrImageBase64 = await QRCode.toDataURL(qr, { width: 320, margin: 2 })
        estadoConexion = 'esperando_qr'
        log('Nuevo Código QR de la nube generado. Abre la página para escanear.')
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut
        log(`Conexión cerrada. Código: ${statusCode}. Reconectar: ${shouldReconnect}`, 'WARN')
        estadoConexion = 'desconectado'
        qrActual = null
        qrImageBase64 = null

        if (statusCode === DisconnectReason.loggedOut) {
          try {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true })
            fs.mkdirSync(SESSION_DIR, { recursive: true })
          } catch {}
          setTimeout(conectar, 3000)
        } else if (shouldReconnect) {
          setTimeout(conectar, 5000)
        }
      } else if (connection === 'open') {
        estadoConexion = 'conectado'
        qrActual = null
        qrImageBase64 = null
        const rawUser = sock.user?.id || ''
        numeroConectado = rawUser.split(':')[0].split('@')[0]
        usuarioConectado = sock.user?.name || 'GAMA Bot Cloud'
        log(`✅ WHATSAPP CLOUD CONECTADO: +${numeroConectado} (${usuarioConectado})`)
      }
    })

    // ── PROCESAMIENTO DE MENSAJES ENTRANTES ──
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key || !msg.key.remoteJid) continue
        if (msg.key.fromMe) {
          // Si tú respondes desde tu celular, marcamos como takeover para que el bot no se meta
          const dest = msg.key.remoteJid.replace(/[^0-9]/g, '')
          humanTakeover.set(dest, Date.now())
          continue
        }
        if (isJidBroadcast(msg.key.remoteJid) || msg.key.remoteJid.endsWith('@g.us')) continue

        if (msg.key.id) {
          if (processedMessages.has(msg.key.id)) continue
          processedMessages.set(msg.key.id, Date.now())
        }

        const body = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption || ''

        if (!body) continue

        const remoteJid = msg.key.remoteJid
        const numero = remoteJid.replace(/[^0-9]/g, '')
        const nombre = msg.pushName || 'Prospecto'

        log(`📩 Mensaje de +${numero} (${nombre}): "${body.slice(0, 50)}"`)

        // 1. Guardar en Supabase para el CRM
        try {
          await supabase.from('leads_sales_gama').upsert({
            session_id: `wa-${numero}`,
            nombre,
            telefono: numero,
            estado: 'en_conversacion',
            origen: 'meta_ads_whatsapp',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'session_id' })
        } catch {}

        // 2. Verificar si está en modo Humano activo (últimos 30 minutos)
        const lastTakeover = humanTakeover.get(numero)
        if (lastTakeover && (Date.now() - lastTakeover < 30 * 60 * 1000)) {
          log(`⏸️ Chat con +${numero} está en modo Humano. Bot silenciado.`)
          continue
        }

        // 3. Evaluar Human Handoff (¿Pide hablar con alguien?)
        if (esPeticionDeHumano(body)) {
          log(`🚨 HUMAN HANDOFF ACTIVADO para +${numero} (${nombre})`)
          humanTakeover.set(numero, Date.now())

          // A) Responder al cliente
          const respuestaTraspaso = `¡Comprendido ${nombre}! Te estoy transfiriendo de inmediato con nuestro asesor comercial de turno para que te asista de forma personalizada por este mismo medio o llamada.`
          await sock.sendMessage(remoteJid, { text: respuestaTraspaso })

          // B) Alertar al dueño en su teléfono personal
          if (OWNER_PHONE && sock) {
            const alertaOwner = `🚨 *[LEAD CALIENTE GAMA]*\n\nEl cliente *${nombre}* (+${numero}) solicita hablar con un asesor.\n\n*Mensaje:* "${body}"\n\n👉 *Chatear con el cliente:* https://wa.me/${numero}`
            await sock.sendMessage(`${OWNER_PHONE}@s.whatsapp.net`, { text: alertaOwner }).catch(() => {})
          }
          continue
        }

        // 4. Si no pide humano: El Bot IA responde solo
        try {
          const respuestaBot = await generarRespuestaIA(body, nombre)
          // Simular tiempo de lectura humano (2 segundos)
          await new Promise(r => setTimeout(r, 2000))
          await sock.sendMessage(remoteJid, { text: respuestaBot })
          log(`🤖 Bot respondió a +${numero}`)
        } catch (err) {
          log(`Error respondiendo al cliente: ${err.message}`, 'ERROR')
        }
      }
    })

  } catch (err) {
    log(`Error en conexión: ${err.message}`, 'ERROR')
    setTimeout(conectar, 10000)
  }
}

// ──────────────────────────────────────────────
//  EXPRESS INTERFACE
// ──────────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json())

app.get('/status', (req, res) => {
  res.json({
    ok: true,
    estado: estadoConexion,
    numero: numeroConectado,
    usuario: usuarioConectado,
  })
})

app.get('/', (req, res) => {
  const isConectado = estadoConexion === 'conectado'
  const isEsperando = estadoConexion === 'esperando_qr'

  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GAMA WhatsApp Cloud Bot</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #050d1a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #0f1c30; border: 1px solid #1e3a5f; border-radius: 24px; padding: 36px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
    h1 { color: #38bdf8; font-size: 24px; font-weight: 800; margin-bottom: 6px; }
    h2 { color: #94a3b8; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 8px 22px; border-radius: 999px; font-weight: 800; font-size: 13px; text-transform: uppercase; margin-bottom: 24px; }
    .badge-ok { background: #10b981; color: #022c22; }
    .badge-wait { background: #f59e0b; color: #451a03; }
    .qr-box { background: white; padding: 16px; border-radius: 16px; display: inline-block; margin: 16px 0; }
    .qr-box img { display: block; max-width: 260px; height: auto; }
    .phone-info { font-size: 18px; font-weight: 700; color: #10b981; margin: 16px 0; }
    .note { font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🛡️ GAMA SEGURIDAD</h1>
    <h2>WhatsApp Bot 24/7 en la Nube (Human Handoff)</h2>

    ${isConectado ? `
      <div class="badge badge-ok">✅ Conectado y Activo 24/7</div>
      <div class="phone-info">📱 +${numeroConectado} (${usuarioConectado})</div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
        El bot está respondiendo en la nube 24/7 con Inteligencia Artificial.<br>
        Si un cliente pide hablar con una persona, te notificará a tu celular y pausará el bot automáticamente.
      </p>
    ` : isEsperando ? `
      <div class="badge badge-wait">⏳ Esperando Escaneo</div>
      <p style="color: #cbd5e1; font-size: 13px; margin-bottom: 12px;">
        Abre WhatsApp Business en tu teléfono nuevo:<br>
        <strong>Ajustes > Dispositivos vinculados > Vincular un dispositivo</strong>
      </p>
      <div class="qr-box">
        <img src="${qrImageBase64}" alt="Código QR WhatsApp" />
      </div>
    ` : `
      <div class="badge badge-wait">Iniciando Servidor...</div>
      <p style="color: #94a3b8; font-size: 13px;">Conectando socket seguro...</p>
    `}

    <div class="note">
      ☁️ Corriendo en la nube 24/7 sin depender de tu computador personal.<br>
      Costo por mensaje: $0 pesos.
    </div>
  </div>
</body>
</html>
  `)
})

app.listen(PORT, () => {
  log(`🚀 Servidor en la nube escuchando en puerto ${PORT}`)
  conectar()
})

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - SERVIDOR WHATSAPP v4.0
 *  Motor: @whiskeysockets/baileys 7.x (WebSocket puro, LID nativo)
 *  Puerto: 3015
 * ═══════════════════════════════════════════════════════════════════════
 *  v4.0 — Reescritura completa:
 *  ✅ Baileys 7.x con soporte nativo LID (fix E2E definitivo)
 *  ✅ getMessage callback (descifrado de reintentos)
 *  ✅ Graceful shutdown (SIGINT/SIGTERM → guardar sesión → salir)
 *  ✅ Backoff exponencial real en reconexión
 *  ✅ Deduplicación de mensajes + retry en envíos
 *  ✅ Sin memory leaks (intervalos limpiados en reconexión)
 *  ✅ Supabase Realtime sin polling innecesario
 *  ✅ Bot IA (menú + Gemini)
 * ═══════════════════════════════════════════════════════════════════════
 */

const express = require('express')
const cors    = require('cors')
const path    = require('path')
const fs      = require('fs')
const { randomBytes } = require('crypto')
const QRCode  = require('qrcode')

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  isJidBroadcast,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys')

const pino    = require('pino')
const { createClient } = require('@supabase/supabase-js')

// ──────────────────────────────────────────────
//  CONFIG
// ──────────────────────────────────────────────
const PORT         = 3015
const SESSION_DIR  = path.join(__dirname, '.baileys-session')
const MAX_QUEUE    = 500
const HEARTBEAT_MS = 30_000
const MAX_RETRIES  = 3
const RETRY_DELAY  = 2000   // ms base para backoff
const PHONE_PAIR   = '56948855190'
const DEDUP_TTL    = 300_000  // 5 min ventana de dedup
const MSG_STORE_MAX = 1000   // mensajes en store para getMessage

const SUPABASE_URL  = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase     = createClient(SUPABASE_URL, SUPABASE_KEY)

// ──────────────────────────────────────────────
//  DEDUPLICACIÓN
// ──────────────────────────────────────────────
const processedMessages = new Map()

function isDuplicate(msgId) {
  if (!msgId) return false
  const now = Date.now()
  // Limpiar mensajes viejos periódicamente
  if (processedMessages.size > 5000) {
    for (const [id, ts] of processedMessages) {
      if (now - ts > DEDUP_TTL) processedMessages.delete(id)
    }
  }
  if (processedMessages.has(msgId)) return true
  processedMessages.set(msgId, now)
  return false
}

// ──────────────────────────────────────────────
//  MESSAGE STORE (para getMessage callback)
//  Fix E2E: Baileys 7.x REQUIERE este callback
//  para descifrar reintentos de mensajes
// ──────────────────────────────────────────────
const msgStore = new Map()

function storeMessage(msg) {
  if (!msg?.key?.id || !msg?.message) return
  msgStore.set(msg.key.id, msg.message)
  // Limitar tamaño del store
  if (msgStore.size > MSG_STORE_MAX) {
    const oldest = msgStore.keys().next().value
    msgStore.delete(oldest)
  }
}

async function getMessage(key) {
  const stored = msgStore.get(key.id)
  if (stored) return stored
  return { conversation: '' }
}

// ──────────────────────────────────────────────
//  ESTADO GLOBAL
// ──────────────────────────────────────────────
let sock            = null
let isReady         = false
let currentQR       = null
let currentQRImage  = null
let retryCount      = 0
let heartbeatTimer  = null
let reconnectTimer  = null
let groupSyncTimer  = null   // <-- Se limpia en reconexión (fix memory leak)
let messageQueue    = []
let startTime       = Date.now()
let userName        = null
let pairingRequested = false
let currentPairingCode = null
let isShuttingDown  = false

// ──────────────────────────────────────────────
//  EXPRESS
// ──────────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json())

// ──────────────────────────────────────────────
//  LOGGER
// ──────────────────────────────────────────────
function log(msg, nivel = 'INFO') {
  const ts = new Date().toLocaleTimeString('es-CL', { hour12: false })
  const prefijo = nivel === 'ERROR' ? '❌' : nivel === 'WARN' ? '⚠️ ' : nivel === 'DEBUG' ? '🔍' : '  '
  console.log(`[${ts}] ${prefijo} ${msg}`)
}

// ──────────────────────────────────────────────
//  RECONEXIÓN FORZADA
// ──────────────────────────────────────────────
async function reconectarForzado() {
  if (isShuttingDown) return
  log('🔄 WATCHDOG: Forzando reconexión...', 'WARN')
  limpiarTimers()
  try { if (sock) { sock.end(undefined); sock = null } } catch {}
  isReady = false
  reconnectTimer = setTimeout(conectar, 3_000)
}

// ──────────────────────────────────────────────
//  LIMPIEZA DE TIMERS (fix memory leak)
// ──────────────────────────────────────────────
function limpiarTimers() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
  if (groupSyncTimer) { clearInterval(groupSyncTimer); groupSyncTimer = null }
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
}

// ──────────────────────────────────────────────
//  SUBIR MEDIA A SUPABASE STORAGE
// ──────────────────────────────────────────────
async function subirMediaASupabase(base64, prefix) {
  const token = process.env.SUPABASE_SERVICE_KEY || SUPABASE_KEY
  const ts = Date.now()
  const rand = randomBytes(4).toString('hex')
  const ext = prefix === 'video' ? 'mp4' : 'jpg'
  const fileName = `${prefix || 'media'}_${ts}_${rand}.${ext}`
  try {
    const buffer = Buffer.from(base64, 'base64')
    const contentType = prefix === 'video' ? 'video/mp4' : 'image/jpeg'
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/snapshots/${fileName}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': contentType },
      body: buffer
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return `${SUPABASE_URL}/storage/v1/object/public/snapshots/${fileName}`
  } catch (err) {
    log(`Error subiendo media: ${err.message}`, 'WARN')
    return null
  }
}

// ──────────────────────────────────────────────
//  HEARTBEAT / WATCHDOG
// ──────────────────────────────────────────────
let watchdogFailures = 0

function iniciarHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  watchdogFailures = 0
  heartbeatTimer = setInterval(async () => {
    if (!sock || !isReady) return

    if (messageQueue.length > 20) {
      log(`🚨 Cola saturada (${messageQueue.length}). Reconectando...`, 'ERROR')
      return reconectarForzado()
    }

    // Verificar estado del WebSocket
    try {
      const wsState = sock.ws?.readyState
      if (wsState !== undefined && wsState !== 1) { // 1 = OPEN
        watchdogFailures++
        log(`⚠️ WebSocket state=${wsState} (${watchdogFailures}/3)`, 'WARN')
        if (watchdogFailures >= 3) return reconectarForzado()
        return
      }
    } catch {}

    try {
      const state = await Promise.race([
        sock.query({ tag: 'iq', attrs: { to: '@s.whatsapp.net', type: 'get', xmlns: 'w:p' }, content: [] }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15_000))
      ]).catch(() => null)

      if (!state) {
        watchdogFailures++
        log(`⚠️ Chequeo fallido (${watchdogFailures}/4)`, 'WARN')
        if (watchdogFailures >= 4) return reconectarForzado()
      } else {
        watchdogFailures = 0
      }
    } catch {
      watchdogFailures++
      if (watchdogFailures >= 4) return reconectarForzado()
    }
  }, HEARTBEAT_MS)
}

// ──────────────────────────────────────────────
//  PERSISTENCIA DE SESIÓN EN SUPABASE
// ──────────────────────────────────────────────
async function loadSessionFromSupabase() {
  try {
    // PRIORIDAD ABSOLUTA: si hay sesión local, usarla SIEMPRE
    if (fs.existsSync(SESSION_DIR)) {
      const files = fs.readdirSync(SESSION_DIR).filter(f => f.endsWith('.json'))
      if (files.length > 0) {
        log(`✅ Sesión local encontrada (${files.length} archivos) — usando sesión local`)
        return
      }
    }
    // Si no hay sesión local, intentar restaurar de Supabase
    const { data, error } = await supabase
      .from('eventos_monitoreo')
      .select('nombre_abonado')
      .eq('cuenta', 'CONFIG_WHATSAPP_SESSION')
      .limit(1)
    if (error || !data || data.length === 0) {
      log('Sin sesión guardada — se necesita vincular el teléfono')
      return
    }
    const sessionData = JSON.parse(data[0].nombre_abonado || '{}')
    if (Object.keys(sessionData).length === 0) return
    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })
    Object.entries(sessionData).forEach(([fileName, content]) => {
      fs.writeFileSync(path.join(SESSION_DIR, fileName), JSON.stringify(content))
    })
    log(`✅ Sesión restaurada de Supabase (${Object.keys(sessionData).length} archivos)`)
  } catch (err) {
    log(`Error cargando sesión: ${err.message}`, 'WARN')
  }
}

async function guardarConfigSupabase(cuenta, nombre_abonado, evento) {
  try {
    await supabase.from('eventos_monitoreo').delete().eq('cuenta', cuenta)
    await supabase.from('eventos_monitoreo').insert({
      cuenta, nombre_abonado, evento,
      fecha_hora: new Date().toISOString()
    })
  } catch (e) {
    log(`Error guardando config ${cuenta}: ${e.message}`, 'WARN')
  }
}

async function saveSessionToSupabase() {
  try {
    if (!fs.existsSync(SESSION_DIR)) return
    const files = fs.readdirSync(SESSION_DIR)
    const sessionData = {}
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          sessionData[file] = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, file), 'utf-8'))
        } catch {}
      }
    })
    if (Object.keys(sessionData).length === 0) return
    await guardarConfigSupabase('CONFIG_WHATSAPP_SESSION', JSON.stringify(sessionData), 'CONFIG_SESSION')
    log(`💾 Sesión sincronizada a Supabase (${Object.keys(sessionData).length} archivos)`)
  } catch (err) {
    log(`Error sincronizando sesión: ${err.message}`, 'WARN')
  }
}

// ──────────────────────────────────────────────
//  SINCRONIZAR ESTADO Y QR A SUPABASE
// ──────────────────────────────────────────────
async function sincronizarEstadoASupabase() {
  try {
    const estadoObj = {
      ready: isReady,
      estado: isReady ? 'CONECTADO' : (currentQR ? 'ESPERANDO_QR' : 'CONECTANDO'),
      usuario: userName, hasQR: !!currentQR, cola: messageQueue.length,
      uptime: Math.round((Date.now() - startTime) / 1000), reintentos: retryCount,
      pairingCode: currentPairingCode, version: '4.0',
    }
    await guardarConfigSupabase('CONFIG_WHATSAPP_STATE', JSON.stringify(estadoObj), 'CONFIG_STATE')

    const qrObj = {
      status: isReady ? 'connected' : (currentQR ? 'waiting_qr' : 'connecting'),
      qr: currentQR, qrImage: currentQRImage, usuario: userName
    }
    await guardarConfigSupabase('CONFIG_WHATSAPP_QR', JSON.stringify(qrObj), 'CONFIG_QR')
  } catch (err) {
    log(`Error sincronizando estado: ${err.message}`, 'WARN')
  }
}

// ──────────────────────────────────────────────
//  NORMALIZAR JID
// ──────────────────────────────────────────────
function normalizarJID(raw) {
  if (!raw) return ''
  const str = String(raw).trim()
  if (str.endsWith('@g.us') || str.endsWith('@s.whatsapp.net')) return str
  // LID: intentar resolver via jidNormalizedUser de Baileys 7.x
  if (str.endsWith('@lid')) {
    try { return jidNormalizedUser(str) } catch {}
    return str
  }
  if (str.includes('-') || str.startsWith('120') || str.includes('@g')) {
    return str.replace('@s.whatsapp.net', '') + '@g.us'
  }
  let digits = str.replace(/[^0-9]/g, '')
  if (digits.length === 9 && digits.startsWith('9')) digits = '56' + digits
  else if (digits.length === 8) digits = '569' + digits
  return `${digits}@s.whatsapp.net`
}

function obtenerNumeroDesdeJID(jid) {
  if (!jid) return ''
  // Baileys 7.x: jidNormalizedUser resuelve LID automáticamente
  try {
    const normalized = jidNormalizedUser(jid)
    return normalized.replace('@s.whatsapp.net', '')
  } catch {}
  return jid.replace('@s.whatsapp.net', '').replace('@lid', '')
}

// ──────────────────────────────────────────────
//  SINCRONIZAR GRUPOS A SUPABASE
// ──────────────────────────────────────────────
async function sincronizarGruposASupabase() {
  if (!sock || !isReady) return
  try {
    const groups = await sock.groupFetchAllParticipating()
    const groupList = Object.values(groups).map(g => ({
      id: g.id, subject: g.subject || 'Grupo WhatsApp',
      participantsCount: g.participants?.length || 0,
    }))
    log(`👥 ${groupList.length} grupo(s) detectados`)
    await guardarConfigSupabase('CONFIG_WHATSAPP_GROUPS', JSON.stringify(groupList), 'CONFIG_GROUPS')
  } catch (err) {
    log(`Error obteniendo grupos: ${err.message}`, 'WARN')
  }
}

// ──────────────────────────────────────────────
//  CONEXIÓN PRINCIPAL (Baileys 7.x)
// ──────────────────────────────────────────────
async function conectar() {
  if (isShuttingDown) return
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  limpiarTimers()

  try {
    await loadSessionFromSupabase()

    log(`🔌 Conectando Baileys 7.x (intento ${retryCount + 1})...`)
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

    // Baileys 7.x: intentar obtener versión, fallback a hardcoded
    let version
    try {
      const vInfo = await Promise.race([
        fetchLatestBaileysVersion(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))
      ])
      version = vInfo.version
      log(`📡 Versión WA: ${version.join('.')}`)
    } catch {
      version = [2, 3000, 1015901307]
      log(`📡 Versión WA fallback: ${version.join('.')}`, 'WARN')
    }

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      mobile: false,
      browser: ['GAMA Seguridad', 'Chrome', '12.0'],
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
      keepAliveIntervalMs: 25_000,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      // FIX E2E: getMessage callback OBLIGATORIO en Baileys 7.x
      // Sin esto, los reintentos de mensajes fallan y aparece "Esperando el mensaje"
      getMessage,
    })

    sock.ev.on('creds.update', async () => {
      await saveCreds()
      await saveSessionToSupabase()
    })

    // Auto-solicitar pairing code si no hay registro previo
    if (!state.creds.registered) {
      setTimeout(async () => {
        if (!isReady && sock && !currentPairingCode) {
          try {
            pairingRequested = true
            const code = await sock.requestPairingCode(PHONE_PAIR)
            currentPairingCode = code
            log(`🔑 PAIRING CODE AUTO GENERADO: ${code}`)
            await sincronizarEstadoASupabase()
          } catch (e) {
            log(`Auto pairing inicial: ${e.message}`, 'WARN')
            pairingRequested = false
          }
        }
      }, 3000)
    }

    // ── HISTORIAL (solo almacenar para getMessage) ──
    sock.ev.on('messaging-history.set', async ({ messages }) => {
      if (!messages || messages.length === 0) return
      log(`📜 Historial: ${messages.length} mensajes`)
      for (const msg of messages) {
        storeMessage(msg)  // Almacenar para getMessage callback
        if (isJidBroadcast(msg.key.remoteJid || '')) continue
        const body = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption
          || msg.message?.videoMessage?.caption || ''
        if (!body) continue
        if (msg.key.id && isDuplicate(msg.key.id)) continue

        const jid = msg.key.remoteJid || ''
        const numero = obtenerNumeroDesdeJID(jid)
        const fechaMsg = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000).toISOString() : new Date().toISOString()
        try {
          await supabase.from('conversaciones_whatsapp').insert({
            numero, tipo_evento: msg.key.fromMe ? 'mensaje_enviado' : 'mensaje_entrante',
            estado: 'enviado', respuesta_recibida: msg.key.fromMe ? null : body,
            mensaje_enviado: msg.key.fromMe ? body : null, created_at: fechaMsg,
          })
        } catch {}
      }
    })

    // ── CONEXIÓN ──
    sock.ev.on('connection.update', async update => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        currentQR = qr; isReady = false; userName = null
        log('📲 QR generado — solicitando pairing code automáticamente...')
        try {
          currentQRImage = await QRCode.toDataURL(qr, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        } catch {}

        // Auto-solicitar pairing code
        if (!pairingRequested && sock) {
          pairingRequested = true
          setTimeout(async () => {
            try {
              const code = await sock.requestPairingCode(PHONE_PAIR)
              currentPairingCode = code
              log(`🔑 PAIRING CODE para +${PHONE_PAIR}: ${code}`)
              log('   En WhatsApp: Configuración → Dispositivos vinculados → Vincular con número de teléfono')
              await sincronizarEstadoASupabase()
            } catch (e) {
              log(`Auto pairing code error: ${e.message}`, 'WARN')
            }
          }, 2000)
        }
        await sincronizarEstadoASupabase()
      }

      if (connection === 'open') {
        isReady = true; currentQR = null; currentQRImage = null
        retryCount = 0; pairingRequested = false; currentPairingCode = null
        userName = sock.user?.name || sock.user?.id?.split(':')[0] || 'desconocido'
        log(`✅ CONECTADO! Usuario: ${userName} — Servidor listo para enviar mensajes`)
        await saveSessionToSupabase()
        iniciarHeartbeat()
        await sincronizarEstadoASupabase()
        // Sincronizar grupos: UN solo intervalo que se limpia en reconexión
        setTimeout(sincronizarGruposASupabase, 2_000)
        if (groupSyncTimer) clearInterval(groupSyncTimer)
        groupSyncTimer = setInterval(sincronizarGruposASupabase, 60_000)
        setTimeout(despacharCola, 1_000)
      }

      if (connection === 'close') {
        isReady = false
        limpiarTimers()
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const reason = lastDisconnect?.error?.message || 'desconocido'
        log(`🔌 Desconectado. Código: ${statusCode}, Razón: ${reason}`, 'WARN')
        await sincronizarEstadoASupabase()

        if (isShuttingDown) return

        // 401 loggedOut / badSession: NO borrar sesión, reconectar
        if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.badSession) {
          log('🔴 Sesión cerrada por WhatsApp. NO borramos sesión — reconectando...', 'WARN')
          retryCount = 0
          reconnectTimer = setTimeout(conectar, 5_000)
          return
        }

        // 515 restartRequired: reconectar inmediatamente
        if (statusCode === 515) {
          log('🔄 Restart requerido por WhatsApp — reconectando inmediatamente...')
          retryCount = 0
          reconnectTimer = setTimeout(conectar, 1_000)
          return
        }

        // Backoff exponencial real
        retryCount++
        const delay = Math.min(5_000 * Math.pow(2, retryCount - 1), 120_000)
        log(`⏳ Reintentando en ${Math.round(delay / 1000)}s (intento ${retryCount})...`)
        reconnectTimer = setTimeout(conectar, delay)
      }
    })

    // ── MENSAJES (con dedup + getMessage store) ──
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      for (const msg of messages) {
        if (!msg.key || !msg.key.remoteJid) continue
        if (isJidBroadcast(msg.key.remoteJid)) continue

        // Almacenar SIEMPRE para getMessage callback (fix E2E)
        storeMessage(msg)

        // DEDUPLICACIÓN
        if (msg.key.id && isDuplicate(msg.key.id)) {
          log(`⏭️ Duplicado ignorado: ${msg.key.id}`, 'DEBUG')
          continue
        }

        const body = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption
          || msg.message?.videoMessage?.caption || ''

        if (!body) continue

        const rawJid = msg.key.remoteJid
        const isGroup = rawJid.endsWith('@g.us') || rawJid.includes('-')
        const numero = isGroup ? rawJid : obtenerNumeroDesdeJID(rawJid)
        const nombre = msg.pushName || (isGroup ? 'Grupo WhatsApp' : '')

        log(`💬 [${isGroup ? 'GRUPO' : 'CHAT'}] ${msg.key.fromMe ? 'Yo' : nombre}: "${body.slice(0, 50)}"`)

        try {
          await supabase.from('conversaciones_whatsapp').insert({
            numero, tipo_evento: msg.key.fromMe ? 'mensaje_enviado' : 'mensaje_entrante',
            estado: 'enviado', respuesta_recibida: msg.key.fromMe ? null : body,
            mensaje_enviado: msg.key.fromMe ? body : null,
            created_at: msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000).toISOString() : new Date().toISOString(),
          })
        } catch (err) {
          log(`Error guardando mensaje: ${err.message}`, 'WARN')
        }

        // BOT AUTO-RESPONDER
        if (!msg.key.fromMe && body && !isGroup) {
          try {
            let autoRespEnabled = true
            let promptText = ''
            const { data: configRow } = await supabase
              .from('eventos_monitoreo').select('nombre_abonado')
              .eq('cuenta', 'CONFIG_WHATSAPP_AI_PROMPT').single()
            if (configRow?.nombre_abonado) {
              const config = JSON.parse(configRow.nombre_abonado)
              if (config.autoResponder === false) autoRespEnabled = false
              if (config.prompt) promptText = config.prompt
            }
            if (autoRespEnabled) {
              responderConIA(sock, rawJid, numero, body, promptText, nombre)
            }
          } catch (e) {
            responderConIA(sock, rawJid, numero, body, '', nombre)
          }
        }
      }
    })

    // ── RECEIPTS (confirmación de entrega) ──
    sock.ev.on('messages.update', async updates => {
      for (const update of updates) {
        if (update.update?.status) {
          const statusMap = { 1: 'pending', 2: 'sent', 3: 'delivered', 4: 'read' }
          const status = statusMap[update.update.status] || 'unknown'
          log(`📩 Receipt: ${update.key?.id?.slice(0, 20)} → ${status}`, 'DEBUG')
        }
      }
    })

  } catch (err) {
    log(`❌ Error conexión: ${err.message}`, 'ERROR')
    retryCount++
    const delay = Math.min(10_000 * retryCount, 120_000)
    reconnectTimer = setTimeout(conectar, delay)
  }
}

// ──────────────────────────────────────────────
//  COLA CON RETRY
// ──────────────────────────────────────────────
async function despacharCola() {
  if (!isReady || !sock || messageQueue.length === 0) return
  log(`📬 Despachando cola: ${messageQueue.length} mensaje(s)`)
  const pendientes = [...messageQueue]
  messageQueue = []
  for (const item of pendientes) {
    try {
      const jid = normalizarJID(item.phone)
      await sock.sendMessage(jid, { text: item.text })
      log(`✅ Cola → ${item.phone}`)
      item.resolve({ ok: true, fuente: 'cola' })
    } catch (err) {
      if ((item.retries || 0) < MAX_RETRIES) {
        item.retries = (item.retries || 0) + 1
        log(`⚠️ Cola → error a ${item.phone}, reintento ${item.retries}/${MAX_RETRIES}`, 'WARN')
        messageQueue.push(item)
      } else {
        log(`❌ Cola → descartado ${item.phone} tras ${MAX_RETRIES} intentos`, 'ERROR')
        item.reject(err)
      }
    }
    await new Promise(r => setTimeout(r, 600))
  }
}

// ──────────────────────────────────────────────
//  ENVÍO CON RETRY
// ──────────────────────────────────────────────
async function enviarMensaje(phone, text, retryNum = 0) {
  let payload
  let storageUrl = null
  try {
    const parsed = JSON.parse(text)
    if (parsed.i) {
      storageUrl = await subirMediaASupabase(parsed.i, 'imagen')
      if (storageUrl) {
        const res = await fetch(storageUrl)
        const buffer = Buffer.from(await res.arrayBuffer())
        payload = { image: buffer, caption: parsed.t || '' }
      } else {
        payload = { image: Buffer.from(parsed.i, 'base64'), caption: parsed.t || '' }
      }
    } else if (parsed.u) {
      const res = await fetch(parsed.u)
      const buffer = Buffer.from(await res.arrayBuffer())
      payload = { image: buffer, caption: parsed.t || '' }
    } else if (parsed.v) {
      payload = { video: Buffer.from(parsed.v, 'base64'), caption: parsed.t || '' }
    } else {
      payload = { text: parsed.t || text }
    }
  } catch {
    payload = { text }
  }

  if (isReady && sock) {
    try {
      const jid = normalizarJID(phone)
      await sock.sendMessage(jid, payload)
      log(`✅ Enviado a ${phone}: "${(payload.caption || payload.text || '').slice(0, 40)}..."`)
      if (storageUrl) {
        const phoneClean = jid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '')
        supabase.from('conversaciones_whatsapp').update({ storage_url: storageUrl }).eq('numero', phoneClean).is('storage_url', null).catch(() => {})
      }
      return { ok: true, fuente: 'directo' }
    } catch (err) {
      if (retryNum < MAX_RETRIES) {
        const delay = RETRY_DELAY * (retryNum + 1)
        log(`⚠️ Error enviando a ${phone}, reintento ${retryNum + 1}/${MAX_RETRIES} en ${delay}ms`, 'WARN')
        await new Promise(r => setTimeout(r, delay))
        return enviarMensaje(phone, text, retryNum + 1)
      }
      log(`❌ Error definitivo a ${phone}: ${err.message}`, 'ERROR')
      throw err
    }
  } else {
    if (messageQueue.length >= MAX_QUEUE) {
      log('⚠️ Cola llena. Descartando más antiguo.', 'WARN')
      messageQueue.shift()?.reject(new Error('Cola llena'))
    }
    log(`📥 No conectado. Encolando para ${phone}`)
    return new Promise((resolve, reject) => {
      messageQueue.push({ phone, text, resolve, reject, ts: Date.now(), retries: 0 })
    })
  }
}

// ──────────────────────────────────────────────
//  SUPABASE REALTIME (sin polling innecesario)
// ──────────────────────────────────────────────
function suscribirSupabaseRealtime() {
  try {
    // Canal 1: Broadcast para envíos directos
    supabase.channel('whatsapp_outbound')
      .on('broadcast', { event: 'send_whatsapp' }, async ({ payload }) => {
        if (payload?.phone && payload?.text) {
          log(`📡 Broadcast → ${payload.phone}`)
          try { await enviarMensaje(payload.phone, payload.text) }
          catch (err) { log(`Error broadcast: ${err.message}`, 'ERROR') }
        }
      })
      .subscribe(status => log(`Supabase Realtime (outbound): ${status}`))

    // Canal 2: Comandos remotos
    supabase.channel('whatsapp_commands')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'eventos_monitoreo', filter: 'cuenta=eq.CONFIG_WHATSAPP_COMMAND'
      }, async payload => {
        const cmd = payload.new?.nombre_abonado || ''
        log(`📡 Comando: "${cmd}"`)
        if (cmd.startsWith('PAIR:')) {
          const phone = cmd.replace('PAIR:', '').replace(/[^0-9]/g, '') || PHONE_PAIR
          log(`🔑 Comando remoto PAIR recibido para +${phone}`)
          try {
            if (sock && !isReady) {
              pairingRequested = true
              const code = await sock.requestPairingCode(phone)
              currentPairingCode = code
              log(`🔑 PAIRING CODE GENERADO DE FORMA REMOTA: ${code}`)
              await sincronizarEstadoASupabase()
            } else if (currentPairingCode) {
              log(`🔑 Pairing Code ya existente: ${currentPairingCode}`)
              await sincronizarEstadoASupabase()
            }
          } catch (e) {
            log(`Error en comando PAIR: ${e.message}`, 'WARN')
            pairingRequested = false
          }
        }
        if (cmd === 'LOGOUT' || cmd === 'RESET_SESSION') {
          log('🧹 Comando remoto: Limpiando sesión y reconectando...', 'WARN')
          try { if (sock) await sock.logout().catch(() => {}) } catch {}
          try {
            if (fs.existsSync(SESSION_DIR)) {
              fs.rmSync(SESSION_DIR, { recursive: true, force: true })
            }
          } catch {}
          retryCount = 0; pairingRequested = false; currentPairingCode = null; isReady = false; currentQR = null
          reconnectTimer = setTimeout(conectar, 2000)
          await sincronizarEstadoASupabase()
        }
      })
      .subscribe(status => log(`Supabase Realtime (commands): ${status}`))

    // Canal 3: Mensajes pendientes (reemplaza polling de 3s)
    supabase.channel('whatsapp_pending_dispatches')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'conversaciones_whatsapp', filter: 'estado=eq.pendiente'
      }, async payload => {
        const row = payload.new
        if (!row?.numero || !row?.mensaje_enviado) return
        log(`📡 Pendiente: +${row.numero} (ID: ${row.id})`)
        try {
          await enviarMensaje(row.numero, row.mensaje_enviado)
          await supabase.from('conversaciones_whatsapp').update({ estado: 'enviado' }).eq('id', row.id)
        } catch (err) {
          await supabase.from('conversaciones_whatsapp').update({ estado: 'error' }).eq('id', row.id)
        }
      })
      .subscribe(status => log(`Supabase Realtime (pending): ${status}`))

  } catch (err) {
    log(`Supabase Realtime error: ${err.message}`, 'WARN')
  }
}

// ══════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════

app.get('/api/status', (req, res) => {
  res.json({
    ready: isReady,
    estado: isReady ? 'CONECTADO' : (currentQR ? 'ESPERANDO_QR' : 'CONECTANDO'),
    usuario: userName, hasQR: !!currentQR, cola: messageQueue.length,
    uptime: Math.round((Date.now() - startTime) / 1000), reintentos: retryCount,
    version: '4.0', dedupSize: processedMessages.size,
    msgStoreSize: msgStore.size,
  })
})

app.get('/api/qr', (req, res) => {
  if (isReady) return res.json({ status: 'connected', qr: null, qrImage: null, usuario: userName })
  if (!currentQR) return res.json({ status: 'connecting', qr: null, qrImage: null })
  res.json({ status: 'waiting_qr', qr: currentQR, qrImage: currentQRImage })
})

app.get('/api/qr-image', async (req, res) => {
  if (isReady || !currentQR) return res.status(204).end()
  try {
    const png = await QRCode.toBuffer(currentQR, { width: 300, margin: 2 })
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-cache')
    res.send(png)
  } catch { res.status(500).json({ error: 'QR no disponible' }) }
})

app.post('/api/pair', async (req, res) => {
  const phone = (req.body?.phone || PHONE_PAIR).replace(/[^0-9]/g, '')
  if (!phone) return res.status(400).json({ ok: false, error: 'Falta teléfono' })
  if (isReady) return res.json({ ok: false, error: 'Ya conectado' })
  if (!sock) return res.status(503).json({ ok: false, error: 'Socket no listo' })
  try {
    if (currentPairingCode) {
      return res.json({ ok: true, code: currentPairingCode, phone })
    }
    pairingRequested = true
    const code = await sock.requestPairingCode(phone)
    currentPairingCode = code
    log(`🔑 Pairing Code generado a solicitud: ${code}`)
    await sincronizarEstadoASupabase()
    return res.json({ ok: true, code, phone })
  } catch (err) {
    pairingRequested = false
    log(`Error solicitando pairing code: ${err.message}`, 'WARN')
    return res.status(500).json({ ok: false, error: err.message })
  }
})

app.post('/api/reset-session', async (req, res) => {
  log('🧹 Reiniciando sesión por solicitud...', 'WARN')
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true })
    }
    await supabase.from('eventos_monitoreo').delete().eq('cuenta', 'CONFIG_WHATSAPP_SESSION')
  } catch {}
  currentQR = null; currentQRImage = null; isReady = false; userName = null; currentPairingCode = null; pairingRequested = false
  if (sock) { try { sock.end(undefined) } catch {} }
  setTimeout(conectar, 2000)
  res.json({ ok: true, mensaje: 'Sesión borrada limpiamente. Generando nuevo código...' })
})

app.post('/api/send', async (req, res) => {
  const { phone, text } = req.body
  if (!phone || !text) return res.status(400).json({ ok: false, error: 'Faltan phone y text' })
  try {
    const result = await enviarMensaje(phone, text)
    res.json({ ok: true, ...result, estado: isReady ? 'CONECTADO' : 'ENCOLADO' })
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message })
  }
})

app.get('/api/messages', async (req, res) => {
  try {
    const { data } = await supabase.from('conversaciones_whatsapp').select('*').order('created_at', { ascending: false }).limit(100)
    res.json({ messages: data || [] })
  } catch { res.json({ messages: [] }) }
})

app.post('/api/logout', async (req, res) => {
  try { if (sock) await sock.logout().catch(() => {}) } catch {}
  retryCount = 0; pairingRequested = false
  reconnectTimer = setTimeout(conectar, 2_000)
  res.json({ ok: true, mensaje: 'Sesión cerrada — reconectando' })
})

// Panel Web
app.get('/', (req, res) => {
  const estado = isReady ? 'CONECTADO' : currentQR ? 'ESPERANDO QR' : 'CONECTANDO...'
  const color  = isReady ? '#22c55e' : currentQR ? '#f59e0b' : '#64748b'
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta http-equiv="refresh" content="8">
  <title>GAMA WhatsApp v4.0</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0f172a;color:#e2e8f0;font-family:'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;max-width:480px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5)}
    h1{color:#22c55e;font-size:22px;margin-bottom:4px}
    h2{color:#94a3b8;font-size:14px;margin-bottom:24px;font-weight:400}
    .badge{display:inline-block;padding:8px 20px;border-radius:999px;font-weight:700;font-size:13px;color:#000;background:${color};margin-bottom:20px}
    .info{font-size:12px;color:#64748b;margin-top:20px;line-height:1.8}
    .feat{font-size:11px;color:#475569;margin-top:12px;line-height:1.6}
  </style>
</head>
<body>
  <div class="card">
    <h1>🛡️ GAMA SEGURIDAD</h1>
    <h2>WhatsApp v4.0 — Puerto ${PORT}</h2>
    <div class="badge">${estado}</div>
    ${userName ? `<div style="color:#38bdf8;font-weight:700;font-size:16px;margin:12px 0">👤 ${userName}</div>` : ''}
    ${isReady ? `<div style="color:#4ade80;margin:12px 0;font-size:14px">✅ Baileys 7.x + LID nativo + getMessage</div>` : ''}
    ${currentPairingCode ? `<div style="color:#fbbf24;margin:12px 0;font-size:18px;font-weight:700">🔑 Pairing: ${currentPairingCode}</div>` : ''}
    <div class="info">
      ⏱ Uptime: ${Math.round((Date.now() - startTime) / 60000)} min |
      🔄 Reintentos: ${retryCount} |
      📬 Cola: ${messageQueue.length} |
      🛡️ Dedup: ${processedMessages.size} |
      💾 MsgStore: ${msgStore.size}
    </div>
    <div class="feat">
      Baileys 7.x · LID nativo · getMessage · Graceful shutdown · Backoff exp.
    </div>
  </div>
</body>
</html>`)
})

// ══════════════════════════════════════════════
//  BOT IA (Gemini)
// ══════════════════════════════════════════════
const userAuthSessions = {}
const inactivityTimers = {}

function reiniciarTemporizadorInactividad(sock, jid, numero) {
  if (inactivityTimers[numero]) clearTimeout(inactivityTimers[numero])
  inactivityTimers[numero] = setTimeout(async () => {
    try {
      const msjCierre = `Estimado cliente, por inactividad de 5 minutos daremos por finalizada esta atención.\n\nGama Seguridad 24/7.`
      await sock.sendMessage(jid, { text: msjCierre })
      await supabase.from('conversaciones_whatsapp').insert({
        numero, tipo_evento: 'mensaje_enviado', estado: 'enviado',
        mensaje_enviado: msjCierre, cuenta: userAuthSessions[numero]?.cuenta || 'BOT_TIMEOUT',
        created_at: new Date().toISOString()
      })
      delete userAuthSessions[numero]; delete inactivityTimers[numero]
    } catch {}
  }, 5 * 60 * 1000)
}

async function responderConIA(sock, jid, numero, bodyCliente, promptMaestro, nombreCliente) {
  try {
    if (jid.includes('@g.us')) return

    const textClean = bodyCliente.trim().toLowerCase()
    let cuentaActiva = ''
    const numLimpio = numero.replace(/[^0-9]/g, '')

    reiniciarTemporizadorInactividad(sock, jid, numero)

    const { data: clienteMatch } = await supabase
      .from('eventos_monitoreo').select('cuenta, nombre_abonado')
      .ilike('nombre_abonado', `%${numLimpio}%`).limit(1)
    if (clienteMatch?.length > 0) cuentaActiva = clienteMatch[0].cuenta
    else if (userAuthSessions[numero]?.cuenta) cuentaActiva = userAuthSessions[numero].cuenta

    let respuestaDirecta = ''
    const authSession = userAuthSessions[numero]

    if (['no','gracias','muchas gracias'].includes(textClean) || textClean.includes('chao') || textClean.includes('adios') || textClean.includes('adiós')) {
      respuestaDirecta = `Muchas gracias por comunicarse con Gama Seguridad 24/7. ¡Que tenga un excelente día!`
      delete userAuthSessions[numero]; delete inactivityTimers[numero]
    }
    else if (['hola','buenas','menu','menú','inicio','ayuda','cancelar'].includes(textClean) || textClean.includes('mas dudas') || textClean.includes('otra duda')) {
      delete userAuthSessions[numero]
      respuestaDirecta = `🛡️ Hola, te comunicas con el Asistente Virtual de Gama Seguridad 24/7 🚨\n\n1️⃣ Consulta de mi alarma y bitácora\n2️⃣ Soporte técnico y guía de teclado DSC\n3️⃣ Consultas comerciales\n4️⃣ Hablar con un operador o especialista en vivo`
    }
    else if (textClean === '4' || textClean.includes('humano') || textClean.includes('operador')) {
      delete userAuthSessions[numero]
      respuestaDirecta = `Atención directa con especialista en vivo\n\nPresiona: https://wa.me/56991016912`
      try {
        await supabase.from('conversaciones_whatsapp').insert({
          numero, tipo_evento: 'solicitud_humana', estado: 'requiere_atencion_humana',
          respuesta_recibida: '⚠️ CLIENTE SOLICITA ATENCIÓN HUMANA', cuenta: cuentaActiva || 'ESPECIALISTA',
          created_at: new Date().toISOString()
        })
      } catch {}
    }
    else if (authSession?.state === 'AWAITING_CONFIRMATION') {
      if (textClean === 'si' || textClean === 'sí') {
        userAuthSessions[numero] = { state: 'VERIFIED', cuenta: authSession.cuenta }
        cuentaActiva = authSession.cuenta
        respuestaDirecta = `Verificación exitosa. Cuenta [${cuentaActiva}] autenticada.\n\n1️⃣ Consulta bitácora\n2️⃣ Soporte técnico\n3️⃣ Comercial\n4️⃣ Operador en vivo`
      } else {
        delete userAuthSessions[numero]
        respuestaDirecta = `Verificación cancelada. Responde 4 para un operador.`
      }
    }
    else if (authSession?.state === 'AWAITING_RUT') {
      const cleanRut = (str) => { if (!str) return ''; const c = str.trim().toUpperCase().replace(/[^0-9K]/g, ''); return c.length < 2 ? c : `${c.slice(0,-1)}-${c.slice(-1)}` }
      const rutIngresado = cleanRut(bodyCliente)
      let unidades = []
      try {
        const { data: rc } = await supabase.from('clientes_monitoreo').select('cuenta, nombre, direccion').or(`rut.ilike.%${rutIngresado}%`).limit(10)
        if (rc?.length > 0) rc.forEach(r => unidades.push({ cuenta: r.cuenta, nombre: r.nombre, alias: `${r.nombre} ${r.direccion||''}`.trim() }))
      } catch {}
      if (unidades.length === 1) {
        userAuthSessions[numero] = { state: 'AWAITING_CONFIRMATION', cuenta: unidades[0].cuenta }
        respuestaDirecta = `RUT: ${rutIngresado}\nPropiedad: ${unidades[0].alias} (${unidades[0].cuenta})\n\n¿Es correcto? Responde "sí".`
      } else if (unidades.length > 1) {
        userAuthSessions[numero] = { state: 'AWAITING_UNIT_SELECTION', unidades }
        respuestaDirecta = `RUT ${rutIngresado}:\n${unidades.map((u,i)=>`${i+1}️⃣ ${u.cuenta} - ${u.alias}`).join('\n')}\n\nResponde el número:`
      } else {
        delete userAuthSessions[numero]
        respuestaDirecta = `No encontramos unidades para RUT "${rutIngresado}". Responde 4 para un operador.`
      }
    }
    else if (textClean === '1' || textClean.includes('bitacora') || textClean.includes('alarma')) {
      if (cuentaActiva) {
        let eventosTxt = ''
        try {
          const f3d = new Date(Date.now() - 3*24*60*60*1000).toISOString()
          const { data: ev } = await supabase.from('eventos_monitoreo').select('evento, fecha_hora, zona').eq('cuenta', cuentaActiva).gte('fecha_hora', f3d).order('fecha_hora', {ascending:false}).limit(10)
          if (ev?.length > 0) eventosTxt = ev.map(e => { const f = e.fecha_hora ? new Date(e.fecha_hora).toLocaleString('es-CL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''; return `• ${f} - ${e.evento||'Señal'} ${e.zona?`(Z${e.zona})`:''}`  }).join('\n')
        } catch {}
        respuestaDirecta = `Bitácora - Cuenta: ${cuentaActiva}\n\nÚltimos eventos:\n${eventosTxt || '• Sin eventos recientes'}\n\n¿Otra opción? Responde 1-4 o "menú".`
      } else {
        userAuthSessions[numero] = { state: 'AWAITING_RUT' }
        respuestaDirecta = `Ingresa el RUT del titular (ej: 12123123-6):`
      }
    }
    else if (textClean === '3') {
      respuestaDirecta = `Consultas comerciales - módulo en desarrollo.\nResponde 4 o https://wa.me/56991016912`
    }
    else if (textClean === '2') {
      respuestaDirecta = `Soporte técnico DSC:\n\n2a. Teclado pita / luz amarilla\n2b. No puedo armar / luz verde apagada\n2c. Anular sensor dañado (*1)\n2d. Programar hora (*6)`
    }
    else if (textClean === '2a') {
      respuestaDirecta = `Diagnóstico *2:\nPresiona [*][2] en el teclado.\n1=Batería, 2=Energía CA, 3=Tel/Internet, 4=Central, 5=Zona, 7=Memoria, 8=Reloj`
    }
    else if (textClean === '2b') {
      respuestaDirecta = `Zona abierta: recorre la propiedad y cierra puertas/ventanas. La luz verde se encenderá al todo cerrar.`
    }
    else if (textClean === '2c') {
      respuestaDirecta = `Anular zona: Presiona [*][1] [nº zona 2 dígitos] [#]\nEjemplo zona 3: *1 03 #`
    }
    else if (textClean === '2d') {
      respuestaDirecta = `Programar hora: [*][6] [clave 4 dígitos] [1] [HHMM MMDDAA]\nEjemplo: *6 1234 1 1304 05 28 26`
    }

    if (respuestaDirecta) {
      await sock.sendMessage(jid, { text: respuestaDirecta })
      log(`🤖 MENU → ${nombreCliente}`)
      await supabase.from('conversaciones_whatsapp').insert({
        numero, tipo_evento: 'mensaje_enviado', estado: 'enviado',
        mensaje_enviado: respuestaDirecta, cuenta: cuentaActiva || 'BOT_MENU',
        created_at: new Date().toISOString()
      })
      return
    }

    // Gemini IA
    const GEMINI_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_KEY) return

    let resumenEventos = 'Sin eventos recientes.'
    if (cuentaActiva) {
      try {
        const f3d = new Date(Date.now() - 3*24*60*60*1000).toISOString()
        const { data: ev } = await supabase.from('eventos_monitoreo').select('evento, fecha_hora, zona').eq('cuenta', cuentaActiva).gte('fecha_hora', f3d).order('fecha_hora', {ascending:false}).limit(30)
        if (ev?.length > 0) resumenEventos = ev.map(e => { const f = e.fecha_hora ? new Date(e.fecha_hora).toLocaleString('es-CL') : ''; return `[${f}] ${e.evento||'Sin desc.'} Zona:${e.zona||'N/A'}` }).join('\n')
      } catch {}
    }

    const fullPrompt = `${promptMaestro || 'Eres el Asistente Virtual de Gama Seguridad 24/7.'}\n\nCLIENTE: ${nombreCliente||'Cliente'} | CUENTA: ${cuentaActiva||'No identificada'}\n\nBITÁCORA 3 DÍAS:\n${resumenEventos}\n\nMENSAJE: "${bodyCliente}"\n\nResponde directamente para WhatsApp.`

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
    })
    const resData = await res.json()
    const respuestaIA = resData?.candidates?.[0]?.content?.parts?.[0]?.text
    if (respuestaIA?.trim()) {
      const textoFinal = respuestaIA.trim()
      await sock.sendMessage(jid, { text: textoFinal })
      log(`🤖 IA → ${nombreCliente}: "${textoFinal.slice(0,60)}..."`)
      await supabase.from('conversaciones_whatsapp').insert({
        numero, tipo_evento: 'mensaje_enviado', estado: 'enviado',
        mensaje_enviado: textoFinal, cuenta: cuentaActiva || 'BOT_IA',
        created_at: new Date().toISOString()
      })
    }
  } catch (err) {
    log(`Error bot IA: ${err.message}`, 'WARN')
  }
}

// ──────────────────────────────────────────────
//  GRACEFUL SHUTDOWN
// ──────────────────────────────────────────────
async function gracefulShutdown(signal) {
  if (isShuttingDown) return
  isShuttingDown = true
  log(`\n🛑 ${signal} recibido — cerrando servidor limpiamente...`)

  limpiarTimers()

  // Guardar sesión antes de salir
  try {
    await saveSessionToSupabase()
    log('💾 Sesión guardada')
  } catch (err) {
    log(`Error guardando sesión en shutdown: ${err.message}`, 'WARN')
  }

  // Cerrar socket limpiamente
  try {
    if (sock) {
      sock.end(undefined)
      log('🔌 Socket cerrado')
    }
  } catch {}

  // Cerrar servidor HTTP
  try {
    server.close()
  } catch {}

  log('👋 Servidor finalizado')
  process.exit(0)
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('uncaughtException', (err) => {
  log(`💥 Uncaught Exception: ${err.message}`, 'ERROR')
  log(err.stack, 'ERROR')
  // No crashear — intentar continuar
})
process.on('unhandledRejection', (reason) => {
  log(`💥 Unhandled Rejection: ${reason}`, 'ERROR')
})

// ──────────────────────────────────────────────
//  INICIO
// ──────────────────────────────────────────────
const server = app.listen(PORT, () => {
  log('═══════════════════════════════════════════')
  log('  GAMA SEGURIDAD - WhatsApp v4.0')
  log('  Baileys 7.x · LID nativo · getMessage')
  log(`  Puerto: ${PORT} | Sesión: .baileys-session/`)
  log('═══════════════════════════════════════════')
  suscribirSupabaseRealtime()
  conectar()
})

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    log(`⚠️ Puerto ${PORT} ya en uso. Otro proceso ya corre.`, 'WARN')
    process.exit(0)
  } else {
    log(`❌ Error servidor: ${err.message}`, 'ERROR')
  }
})

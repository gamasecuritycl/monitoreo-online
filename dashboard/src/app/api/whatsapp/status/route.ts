import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const SESSION_DIR = '/tmp/baileys-session'
let sock: any = null
let isReady = false
let currentQR: string | null = null
let currentQRImage: string | null = null

// Descargar credenciales desde Supabase
async function loadSession() {
  try {
    const { data } = await supabase
      .from('eventos_monitoreo')
      .select('nombre_abonado')
      .eq('cuenta', 'CONFIG_WHATSAPP_SESSION')
      .limit(1)
    
    if (data && data.length > 0 && data[0].nombre_abonado) {
      const sessionData = JSON.parse(data[0].nombre_abonado)
      if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })
      Object.entries(sessionData).forEach(([file, content]) => {
        fs.writeFileSync(path.join(SESSION_DIR, file), JSON.stringify(content))
      })
    }
  } catch {}
}

// Subir credenciales a Supabase
async function saveSession() {
  try {
    if (!fs.existsSync(SESSION_DIR)) return
    const files = fs.readdirSync(SESSION_DIR)
    const sessionData: any = {}
    files.forEach(file => {
      if (file.endsWith('.json')) {
        sessionData[file] = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, file), 'utf-8'))
      }
    })
    if (Object.keys(sessionData).length > 0) {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'CONFIG_WHATSAPP_SESSION',
        nombre_abonado: JSON.stringify(sessionData),
        evento: 'CONFIG_SESSION',
        fecha_hora: new Date().toISOString()
      }, { onConflict: 'cuenta' })
    }
  } catch {}
}

// Inicializar Socket en segundo plano
async function initBaileys() {
  if (sock) return
  await loadSession()
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [6, 7, 18] }))

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    connectTimeoutMs: 15000,
  })

  sock.ev.on('creds.update', async () => {
    await saveCreds()
    await saveSession()
  })

  sock.ev.on('connection.update', async (update: any) => {
    const { connection, qr } = update
    if (qr) {
      currentQR = qr
      currentQRImage = await QRCode.toDataURL(qr, { width: 300, margin: 2 })
      
      // Subir QR a Supabase
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'CONFIG_WHATSAPP_QR',
        nombre_abonado: JSON.stringify({ status: 'waiting_qr', qrImage: currentQRImage, ready: false }),
        evento: 'CONFIG_QR',
        fecha_hora: new Date().toISOString()
      }, { onConflict: 'cuenta' })
    }

    if (connection === 'open') {
      isReady = true
      currentQR = null
      currentQRImage = null
      
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'CONFIG_WHATSAPP_STATE',
        nombre_abonado: JSON.stringify({ ready: true, estado: 'CONECTADO', usuario: sock.user?.name || 'desconocido' }),
        evento: 'CONFIG_STATE',
        fecha_hora: new Date().toISOString()
      }, { onConflict: 'cuenta' })
    }
  })
}

export async function GET() {
  try {
    if (!sock) {
      initBaileys() // Arrancar en segundo plano
    }
    
    // Obtener estado actual
    const { data } = await supabase
      .from('eventos_monitoreo')
      .select('cuenta, nombre_abonado')
      .in('cuenta', ['CONFIG_WHATSAPP_STATE', 'CONFIG_WHATSAPP_QR'])

    const statusRow = data?.find(r => r.cuenta === 'CONFIG_WHATSAPP_STATE')
    const qrRow = data?.find(r => r.cuenta === 'CONFIG_WHATSAPP_QR')

    const statusData = statusRow?.nombre_abonado ? JSON.parse(statusRow.nombre_abonado) : { ready: false, estado: 'CONECTANDO' }
    const qrData = qrRow?.nombre_abonado ? JSON.parse(qrRow.nombre_abonado) : { status: 'connecting', qrImage: null }

    return NextResponse.json({
      ...statusData,
      qrImage: qrData.qrImage,
      hasQR: !!qrData.qrImage
    })
  } catch {
    return NextResponse.json({ ready: false, estado: 'SERVIDOR_APAGADO', hasQR: false })
  }
}

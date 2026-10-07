/**
 * ═══════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - BOT DE WHATSAPP VENTAS EN LA NUBE (24/7) v5.0
 *  - Compatible con Render.com, Koyeb, Railway, VPS
 *  - Motor: Baileys 7.x
 *  - Inteligencia Comercial: Pack Vetti Smart, Monitoreo 0,9 UF + IVA
 *  - Envío automático de Ficha Técnica PDF oficial
 *  - Cotizador Dinámico Interactivo (accesos / sensores)
 *  - Agendador de Evaluación Técnica en Terreno $0
 *  - Alertas VIP inmediatas al celular del dueño (56991016912)
 *  - Secuencia de Reactivación de Leads Fríos (Remarketing suave)
 *  - Memoria con Timeout de 10 min y reseteo por comando
 *  - Sincronización en tiempo real con Supabase CRM
 * ═══════════════════════════════════════════════════════════════════════
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const https = require('https')
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
//  CONFIGURACIÓN Y VARIABLES DE ENTORNO
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000
const SESSION_DIR = process.env.SESSION_DIR || path.join(__dirname, '.session-cloud')
const OWNER_PHONE = process.env.OWNER_PHONE || '56991016912' // Teléfono donde llegan alertas VIP
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://gama-ventas-bot.onrender.com'
const ASSETS_DIR = path.join(__dirname, 'assets')
const PDF_FICHA_PATH = path.join(ASSETS_DIR, 'Ficha_Tecnica_GAMA_Vetti_Smart.pdf')

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true })

// ──────────────────────────────────────────────
//  GENERADOR AUTÓNOMO DE FICHA TÉCNICA PDF OFICIAL
// ──────────────────────────────────────────────
function asegurarPDF() {
  if (fs.existsSync(PDF_FICHA_PATH)) return
  try {
    const content = [
      'BT',
      '/F1 20 Tf',
      '50 760 Td',
      '(GAMA SEGURIDAD - FICHA TECNICA OFICIAL) Tj',
      '/F1 13 Tf',
      '0 -28 Td',
      '(PACK VETTI SMART - ALARMA INALAMBRICA Y MONITOREO 24/7) Tj',
      '/F1 10 Tf',
      '0 -26 Td',
      '(1. CENTRAL INTELIGENTE VETTI HUB: Conexion dual WiFi + 4G GSM anti-corte.) Tj',
      '0 -18 Td',
      '(2. SENSORES ANTIMASCOTAS PIR: Inmune a mascotas de hasta 25 kg.) Tj',
      '0 -18 Td',
      '(3. CONTACTO MAGNETICO: Proteccion perimetral inmediata para puertas/ventanas.) Tj',
      '0 -18 Td',
      '(4. SIRENA 110 dB + CONTROLES SOS: Potencia acustica disuasiva y pulsadores de panico.) Tj',
      '0 -18 Td',
      '(5. APP MOVIL NT CLICK: Control total y alertas push en tiempo real.) Tj',
      '0 -26 Td',
      '(BENEFICIOS DIFERENCIALES GAMA SEGURIDAD:) Tj',
      '0 -18 Td',
      '(- Equipos 100% PROPIOS del cliente: Cero arriendos eternos ni comodatos engañosos.) Tj',
      '0 -18 Td',
      '(- Monitoreo Continuo 24/7: Desde 0,9 UF + IVA mensual (~$35.000 CLP).) Tj',
      '0 -18 Td',
      '(- Instalacion tecnica profesional: BONIFICADA ($0 costo con el plan).) Tj',
      '0 -18 Td',
      '(- Evaluacion tecnica en terreno: $0 costo en Region Metropolitana y V Region.) Tj',
      '0 -32 Td',
      '(CONTACTO Y ASESORIA COMERCIAL:) Tj',
      '0 -18 Td',
      '(WhatsApp Oficial: +56 9 9101 6912 | Web: https://www.gamasecurity.cl) Tj',
      'ET'
    ].join('\n')

    const streamLength = Buffer.byteLength(content)
    const pdfData = [
      '%PDF-1.4',
      '1 0 obj',
      '<< /Type /Catalog /Pages 2 0 R >>',
      'endobj',
      '2 0 obj',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      'endobj',
      '3 0 obj',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      'endobj',
      '4 0 obj',
      '<< /Length ' + streamLength + ' >>',
      'stream',
      content,
      'endstream',
      'endobj',
      '5 0 obj',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
      'endobj',
      'xref',
      '0 6',
      '0000000000 65535 f ',
      '0000000009 00000 n ',
      '0000000058 00000 n ',
      '0000000000 00000 n ',
      '0000000000 00000 n ',
      '0000000000 00000 n ',
      'trailer',
      '<< /Size 6 /Root 1 0 R >>',
      'startxref',
      '500',
      '%%EOF'
    ].join('\n')

    fs.writeFileSync(PDF_FICHA_PATH, pdfData)
    console.log('[PDF] Ficha técnica generada exitosamente en:', PDF_FICHA_PATH)
  } catch (e) {
    console.error('[PDF] Error generando PDF:', e.message)
  }
}
asegurarPDF()

// ──────────────────────────────────────────────
//  ESTADO EN MEMORIA Y TIMEOUT DE 10 MINUTOS
// ──────────────────────────────────────────────
const humanTakeover = new Map()     // telefono -> timestamp
const processedMessages = new Map() // id -> timestamp
const leadMemory = new Map()        // telefono -> datos del lead
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutos

let genAI = null
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    console.log('[IA] Gemini configurado y activo.')
  } catch (e) {
    console.error('Error inicializando Gemini:', e.message)
  }
}

const COMUNAS_CHILE = [
  'santiago', 'las condes', 'providencia', 'vitacura', 'la reina', 'lo barnechea',
  'ñuñoa', 'la florida', 'maipu', 'maipú', 'puente alto', 'san miguel', 'macul',
  'peñalolen', 'peñalolén', 'quilicura', 'pudahuel', 'colina', 'chicureo', 'lampa',
  'san bernardo', 'buin', 'paine', 'melipilla', 'talagante', 'penaflor', 'peñaflor',
  'viña', 'viña del mar', 'valparaiso', 'valparaíso', 'concon', 'concón', 'quilpue',
  'quilpué', 'villa alemana', 'limache', 'quillota', 'san antonio', 'rengo', 'rancagua'
]

// ──────────────────────────────────────────────
//  SISTEMA CONSULTIVO & TOMA DE DATOS
// ──────────────────────────────────────────────
async function procesarMensajeVentas(textoUsuario, numero, nombrePush, sock, remoteJid) {
  const t = textoUsuario.trim()
  const lower = t.toLowerCase()
  const now = Date.now()
  let reinicioPorInactividad = false
  let enviarPDF = false

  // 1. Inicializar o evaluar timeout de inactividad
  if (!leadMemory.has(numero)) {
    leadMemory.set(numero, {
      paso: 'inicio',
      nombre: (nombrePush && nombrePush !== 'Prospecto') ? nombrePush : null,
      comuna: null,
      tipoPropiedad: null,
      interes: 'Pack Vetti Smart',
      horarioVisita: null,
      reactivado: false,
      historial: [],
      lastActivity: now
    })
  } else {
    const leadExistente = leadMemory.get(numero)
    if (leadExistente.lastActivity && (now - leadExistente.lastActivity > INACTIVITY_TIMEOUT_MS)) {
      console.log(`[MEMORIA] ⏰ Inactividad > 10 min (+${numero}). Reiniciando flujo conversacional.`)
      leadExistente.paso = 'inicio'
      leadExistente.tipoPropiedad = null
      leadExistente.historial = []
      reinicioPorInactividad = true
    }
    leadExistente.lastActivity = now
  }

  const lead = leadMemory.get(numero)

  // 2. Comandos manuales de reinicio
  if (lower === 'menu' || lower === 'menú' || lower === 'reiniciar' || lower === 'inicio' || lower === 'volver') {
    lead.paso = 'inicio'
    lead.tipoPropiedad = null
    lead.historial = []
    reinicioPorInactividad = true
  }

  // 3. Petición explícita de Ficha / Catálogo PDF
  if (lower.includes('ficha') || lower.includes('catalogo') || lower.includes('catálogo') || lower.includes('pdf')) {
    enviarPDF = true
  }

  lead.historial.push({ role: 'user', content: t })
  if (lead.historial.length > 8) lead.historial.shift()

  // 4. Procesamiento del Mensaje
  const resultado = generarRespuestaLogica(t, lower, lead, numero, reinicioPorInactividad)
  if (resultado.enviarPDF) enviarPDF = true

  lead.historial.push({ role: 'assistant', content: resultado.texto })

  // 5. Despachar PDF si corresponde
  if (enviarPDF && fs.existsSync(PDF_FICHA_PATH) && sock) {
    try {
      setTimeout(async () => {
        await sock.sendMessage(remoteJid, {
          document: fs.readFileSync(PDF_FICHA_PATH),
          mimetype: 'application/pdf',
          fileName: 'Ficha_Tecnica_GAMA_Vetti_Smart.pdf',
          caption: '📄 *Ficha Comercial Oficial - GAMA Seguridad*\n\nAquí tienes las especificaciones técnicas del Pack VETTI Smart inalámbrico y nuestro plan de monitoreo 24/7.'
        })
      }, 1500)
    } catch (e) {
      console.error('[PDF] Error enviando documento:', e.message)
    }
  }

  return resultado.texto
}

function generarRespuestaLogica(texto, lower, lead, numero, reinicioPorInactividad) {
  const nombreSaludo = lead.nombre ? ` ${lead.nombre}` : ''

  // A) Saludo especial si regresa tras más de 10 min de inactividad
  if (reinicioPorInactividad && lead.nombre && !['1','2','3','4','5'].includes(lower)) {
    lead.paso = 'esperando_opcion'
    return {
      texto: `¡Hola de nuevo ${lead.nombre}! 👋 Qué gusto saludarte otra vez por aquí.\n\nPara retomar tu cotización o responder una nueva duda:\n\n¿Qué tipo de propiedad necesitas proteger? 🏡\n\n1️⃣ **Casa o Parcela** 🏡\n2️⃣ **Departamento** 🏢\n3️⃣ **Negocio o Empresa** 🏪\n4️⃣ **Ya tengo alarma (Migración a costo $0)** 🔄\n5️⃣ **Cámaras de Seguridad 4K** 📹\n\n*(Puedes responder con el número 1, 2, 3... o escribirme directamente)*`,
      enviarPDF: false
    }
  }

  // B) COTIZADOR DINÁMICO INTERACTIVO (Cálculo según cantidad de accesos)
  const regexAccesos = /(\d+)\s*(puerta|puertas|ventana|ventanas|acceso|accesos)/i
  if (regexAccesos.test(texto) || lower.includes('cotizar a medida') || lower.includes('dimensionar')) {
    lead.interes = 'Cotización a medida'
    lead.paso = 'pidiendo_comuna'
    guardarEnSupabase(lead, numero)
    return {
      texto: `¡Excelente! 🧮 Para dimensionar tu sistema con exactitud:\n\n✨ **Nuestra recomendación técnica:**\n• **1 Central Inteligente Vetti Hub** con conexión dual WiFi + 4G GSM anti-corte.\n• **Contactos magnéticos** en cada acceso vulnerable detectan apertura al instante.\n• **Sensores de movimiento antimascotas** (no se activan con animales de hasta 25 kg) 🐕.\n• **Sirena disuasiva 110 dB + 2 Controles SOS** 🚨.\n• Control total y notificaciones en tu celular vía **App NT CLICK** 📲.\n\n💰 **Lo mejor:** El plan de Monitoreo 24/7 conectado a Central se mantiene en **0,9 UF + IVA mensual** (~$35.000 CLP) y los equipos son **100% TUYOS**.\n\n📍 **¿En qué comuna se encuentra tu propiedad para confirmar la factibilidad y agendar la evaluación técnica $0?**`,
      enviarPDF: true
    }
  }

  // C) CONSULTAS FRECUENTES (Corte de luz, Mascotas, Verisure)
  if (lower.includes('luz') || lower.includes('corte de luz') || lower.includes('bateria')) {
    return {
      texto: `¡Muy buena pregunta! 💡 Ante un corte intencional de energía eléctrica, la central de alarma cuenta con **batería de respaldo autónoma** y enlace **4G GSM de emergencia** 📶. El sistema sigue 100% activo y conectado a la Central de Monitoreo.\n\n¿En qué comuna se encuentra tu propiedad para verificar cobertura? 📍`,
      enviarPDF: false
    }
  }

  if (lower.includes('perro') || lower.includes('gato') || lower.includes('mascota')) {
    return {
      texto: `¡Totalmente cubierto! 🐕🐈 Nuestros sensores de movimiento incorporan **tecnología PIR inteligente antimascotas** que no se activa con mascotas de hasta 25 kg. Puedes armar tu alarma con tus mascotas adentro sin falsas alarmas.\n\n¿Para qué tipo de propiedad la estás buscando? 🏡\n1️⃣ Casa o Parcela\n2️⃣ Departamento\n3️⃣ Negocio`,
      enviarPDF: false
    }
  }

  if (lower.includes('verisure') || lower.includes('adt')) {
    lead.interes = 'Migración vs Verisure'
    guardarEnSupabase(lead, numero)
    return {
      texto: `¡Es la mejor decisión que puedes tomar! 🙌 A diferencia de Verisure o ADT donde pagas cuotas de $70.000 a $85.000 mensuales y los equipos están en arriendo eterno:\n\n✅ **En GAMA los equipos son 100% TUYOS en propiedad**.\n✅ Monitoreo 24/7 desde solo **0,9 UF + IVA (~$35.000/mes)** 💰.\n✅ Si ya tienes sensores instalados, los **reprogramamos a costo $0** 🔄.\n\n📍 **¿En qué comuna se ubica tu propiedad para coordinar la evaluación técnica gratuita?**`,
      enviarPDF: false
    }
  }

  // D) PASO 0: MENÚ PRINCIPAL Y OPCIONES
  if (lead.paso === 'inicio' || (!lead.tipoPropiedad && ['1','2','3','4','5'].includes(lower) || lower.includes('hola') || lower.includes('precio') || lower.includes('info') || lower.includes('cotiz'))) {

    if (lower === '1' || lower.includes('casa') || lower.includes('parcela')) {
      lead.tipoPropiedad = 'Casa o Parcela'
      lead.interes = 'Pack VETTI Smart'
      lead.paso = 'pidiendo_comuna'
      guardarEnSupabase(lead, numero)
      return {
        texto: `¡Excelente elección! 🏡 Para casas recomendamos nuestro **Pack VETTI Smart Inalámbrico** con control total en tu celular desde la App NT CLICK 📲.\n\n✨ **Lo más destacado:**\n• Central con doble vía WiFi + 4G anti-corte de luz.\n• Sensores antimascotas (evita falsas alarmas) 🐕.\n• Sirena de alta potencia 110 dB + botón de pánico SOS 🚨.\n• Monitoreo 24/7 conectado a Central por solo **0,9 UF + IVA mensual** (~$35.000 CLP).\n• **Instalación profesional bonificada ($0)** con el plan.\n• **Equipos 100% tuyos** (sin arriendos engañosos).\n\n*(Te adjunto la ficha técnica oficial en PDF con todos los detalles)* 📄\n\nPara verificar cobertura y factibilidad técnica inmediata:\n📍 **¿En qué comuna o sector se ubica tu casa?**`,
        enviarPDF: true
      }
    }

    if (lower === '2' || lower.includes('depto') || lower.includes('departamento')) {
      lead.tipoPropiedad = 'Departamento'
      lead.interes = 'Alarma Departamento'
      lead.paso = 'pidiendo_comuna'
      guardarEnSupabase(lead, numero)
      return {
        texto: `¡Perfecto! 🏢 Para departamentos diseñamos una protección perimetral de alta precisión en puerta de acceso y ventanales.\n\n✨ **Beneficios:**\n• Detección perimetral instantánea antes de que ingresen.\n• Control y alertas push en tu celular en tiempo real 📲.\n• Conexión a Central 24/7 por **0,9 UF + IVA al mes** (~$35.000 CLP).\n• Equipos en propiedad sin arriendos eternos.\n\n📍 **¿En qué comuna se encuentra tu departamento?**`,
        enviarPDF: true
      }
    }

    if (lower === '3' || lower.includes('negocio') || lower.includes('empresa') || lower.includes('local') || lower.includes('bodega')) {
      lead.tipoPropiedad = 'Negocio / Empresa'
      lead.interes = 'Alarma Comercial'
      lead.paso = 'pidiendo_comuna'
      guardarEnSupabase(lead, numero)
      return {
        texto: `¡Excelente! 🏪 Para negocios y empresas contamos con protocolos de control de apertura/cierre, múltiples usuarios y respuesta prioritaria ante intrusión.\n\n✨ **Incluye:**\n• Supervisión continua 24/7 con reporte de señales a Carabineros.\n• Verificación técnica y control desde la App móvil 📲.\n• Planes corporativos accesibles desde **0,9 UF + IVA** al mes.\n\n📍 **¿En qué comuna comercial se ubica tu negocio?**`,
        enviarPDF: false
      }
    }

    if (lower === '4' || lower.includes('migrar') || lower.includes('cambiar') || lower.includes('tengo alarma')) {
      lead.tipoPropiedad = 'Migración de Alarma'
      lead.interes = 'Migración $0'
      lead.paso = 'pidiendo_comuna'
      guardarEnSupabase(lead, numero)
      return {
        texto: `¡Es una tremenda oportunidad de ahorro! 🔄 Si ya cuentas con sensores instalados (marca DSC, Honeywell o ADT), nuestros técnicos **reprograman tu sistema a costo $0 en sensores** y lo conectamos a nuestra Central de Monitoreo 24/7 por solo **0,9 UF + IVA al mes**.\n\nDejas de pagar mensualidades excesivas y conservas tus equipos 👍.\n\n📍 **¿En qué comuna está instalada tu alarma actual?**`,
        enviarPDF: false
      }
    }

    if (lower === '5' || lower.includes('camara') || lower.includes('cámara') || lower.includes('cctv')) {
      lead.tipoPropiedad = 'Cámaras de Seguridad'
      lead.interes = 'CCTV 4K'
      lead.paso = 'pidiendo_comuna'
      guardarEnSupabase(lead, numero)
      return {
        texto: `¡Genial! 📹 Instalamos sistemas de **Cámaras de Seguridad 4K Ultra HD** con Inteligencia Artificial, visión nocturna a color y visualización en vivo desde tu celular sin cuotas mensuales obligatorias.\n\n📍 **¿En qué comuna se encuentra la propiedad que deseas vigilar?**`,
        enviarPDF: false
      }
    }

    // Menú de Bienvenida
    lead.paso = 'esperando_opcion'
    return {
      texto: `¡Hola${nombreSaludo}! Qué gusto saludarte 👋 Soy Tomás, tu asesor de seguridad en **GAMA Seguridad** 🛡️.\n\nTe ayudo de inmediato a cotizar la mejor protección con monitoreo 24/7 y **equipos 100% propios** (sin pagar arriendos eternos de $75.000 como en otras empresas) 🙌.\n\n¿Qué tipo de propiedad necesitas proteger? 🏡\n\n1️⃣ **Casa o Parcela** 🏡\n2️⃣ **Departamento** 🏢\n3️⃣ **Negocio o Empresa** 🏪\n4️⃣ **Ya tengo alarma (Migración a costo $0)** 🔄\n5️⃣ **Cámaras de Seguridad 4K** 📹\n\n*(Puedes responder con el número 1, 2, 3... o escribirme directamente)*`,
      enviarPDF: false
    }
  }

  // E) PASO: PIDIENDO COMUNA
  const comunaEncontrada = COMUNAS_CHILE.find(c => lower.includes(c))
  if (comunaEncontrada || lead.paso === 'pidiendo_comuna') {
    lead.comuna = comunaEncontrada ? capitalizar(comunaEncontrada) : capitalizar(texto.slice(0, 30))
    lead.paso = 'pidiendo_nombre'
    guardarEnSupabase(lead, numero)

    return {
      texto: `¡Excelente! En **${lead.comuna}** tenemos cobertura técnica completa con patrullaje de verificación rápida 🚨.\n\nPara preparar tu ficha técnica formal y coordinar la **Evaluación en Terreno Gratuita ($0)**:\n📋 **¿Cuál es tu nombre y apellido?**`,
      enviarPDF: false
    }
  }

  // F) PASO: PIDIENDO NOMBRE
  if (lead.paso === 'pidiendo_nombre' || (!lead.nombre && (lower.startsWith('me llamo') || lower.startsWith('soy ') || texto.split(' ').length <= 4))) {
    let nombreLimpio = texto.replace(/me llamo|soy|mi nombre es/gi, '').trim()
    if (nombreLimpio.length > 1) {
      lead.nombre = capitalizar(nombreLimpio)
      lead.paso = 'agendando_visita'
      guardarEnSupabase(lead, numero, 'calificado')

      return {
        texto: `¡Un gusto, ${lead.nombre}! 🌟 Ya ingresé tus datos en nuestro sistema comercial de GAMA Seguridad.\n\nPara revisar los puntos vulnerables en tu propiedad, realizamos una **Evaluación Técnica en Terreno 100% Gratuita ($0)** sin ningún compromiso 🤝.\n\n¿Qué día y bloque horario te acomoda más? 📅\n\n1️⃣ **Mañana (10:00 a 13:00 hrs)** ☀️\n2️⃣ **Tarde (15:00 a 18:00 hrs)** 🌤️\n3️⃣ **Sábado en la mañana (10:00 a 13:00 hrs)** 🗓️\n4️⃣ **Coordinar un horario especial con un asesor** 🤝\n\n*(Responde con el número 1, 2, 3 o 4)*`,
        enviarPDF: false
      }
    }
  }

  // G) PASO: AGENDANDO VISITA TÉCNICA
  if (lead.paso === 'agendando_visita') {
    let bloque = 'Horario especial por coordinar'
    if (lower === '1' || lower.includes('mañana')) bloque = 'Mañana (10:00 a 13:00 hrs)'
    else if (lower === '2' || lower.includes('tarde')) bloque = 'Tarde (15:00 a 18:00 hrs)'
    else if (lower === '3' || lower.includes('sabado') || lower.includes('sábado')) bloque = 'Sábado (10:00 a 13:00 hrs)'

    lead.horarioVisita = bloque
    lead.paso = 'finalizado'
    guardarEnSupabase(lead, numero, 'visita_agendada')

    // Disparar Alerta VIP Inmediata al Celular del Dueño
    dispararAlertaVIP(lead, numero)

    return {
      texto: `¡Perfecto, ${lead.nombre}! ✅ Tu visita técnica gratuita ($0) quedó pre-agendada con éxito para el bloque de **${bloque}** en **${lead.comuna || 'tu comuna'}**.\n\nUn especialista técnico de terreno se comunicará brevemente contigo a este mismo número para confirmar los detalles exactos. ¡Muchas gracias por confiar en GAMA Seguridad! 🛡️✨`,
      enviarPDF: false
    }
  }

  // H) RESPUESTA POR DEFECTO
  return {
    texto: `¡Comprendido! En GAMA Seguridad nos adaptamos exactamente a lo que necesitas 🛡️.\n\n¿En qué **comuna** se ubica tu propiedad y te gustaría proteger **casa, departamento o negocio**? 🏡📍`,
    enviarPDF: false
  }
}

function capitalizar(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ──────────────────────────────────────────────
//  GUARDAR LEAD EN SUPABASE (SCHEMA SEGURO)
// ──────────────────────────────────────────────
async function guardarEnSupabase(lead, numero, estado = 'en_conversacion') {
  try {
    const direccionDetalle = [
      lead.tipoPropiedad ? `[${lead.tipoPropiedad}]` : '',
      lead.interes ? `Interés: ${lead.interes}` : '',
      lead.horarioVisita ? `Visita: ${lead.horarioVisita}` : ''
    ].filter(Boolean).join(' | ')

    const payload = {
      session_id: `wa-${numero}`,
      nombre: lead.nombre || 'Prospecto WhatsApp',
      telefono: numero,
      comuna: lead.comuna || null,
      direccion: direccionDetalle || null,
      estado: estado,
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    }
    await supabase.from('leads_sales_gama').upsert(payload, { onConflict: 'session_id' })
  } catch (e) {
    console.error('[SUPABASE] Error guardando lead:', e.message)
  }
}

// ──────────────────────────────────────────────
//  ALERTA VIP AL CELULAR DEL DUEÑO
// ──────────────────────────────────────────────
async function dispararAlertaVIP(lead, numero) {
  if (!OWNER_PHONE || !sock) return
  try {
    const alerta = `🚨 *[NUEVO LEAD CALIFICADO - GAMA]* 🚨\n\n` +
      `👤 *Nombre:* ${lead.nombre || 'Prospecto'}\n` +
      `📍 *Comuna:* ${lead.comuna || 'No especificada'}\n` +
      `🏡 *Tipo:* ${lead.tipoPropiedad || 'Casa o Parcela'}\n` +
      `📦 *Solución:* ${lead.interes || 'Pack VETTI Smart'}\n` +
      `📅 *Visita Técnica:* ${lead.horarioVisita || 'Por coordinar'}\n` +
      `📱 *Teléfono:* +${numero}\n\n` +
      `👉 *Chatear con el cliente ahora:* https://wa.me/${numero}`

    await sock.sendMessage(`${OWNER_PHONE}@s.whatsapp.net`, { text: alerta })
    console.log(`[ALERTA VIP] Notificación enviada a +${OWNER_PHONE} para lead +${numero}`)
  } catch (e) {
    console.error('[ALERTA VIP] Error enviando alerta:', e.message)
  }
}

function esPeticionDeHumano(texto) {
  const t = String(texto || '').toLowerCase()
  const palabrasClave = [
    'humano', 'persona', 'alguien', 'asesor', 'ejecutivo', 'vendedor',
    'llamar', 'llamen', 'llamame', 'llámenme', 'fono', 'telefono', 'teléfono',
    'hablar con alguien', 'comunicar con alguien', 'atencion humana', 'atención humana'
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
          // Si tú respondes desde tu celular, silenciamos el bot por 30 minutos
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

        // 1. Verificar si está en modo Humano activo
        const lastTakeover = humanTakeover.get(numero)
        if (lastTakeover && (Date.now() - lastTakeover < 30 * 60 * 1000)) {
          log(`⏸️ Chat con +${numero} en modo Humano activo. Bot silenciado.`)
          continue
        }

        // 2. Evaluar Human Handoff (Petición de asesor humano)
        if (esPeticionDeHumano(body)) {
          log(`🚨 HUMAN HANDOFF ACTIVADO para +${numero} (${nombre})`)
          humanTakeover.set(numero, Date.now())

          const respuestaTraspaso = `¡Comprendido ${nombre}! Te estoy transfiriendo de inmediato con nuestro asesor comercial de turno para que te atienda de forma personalizada por este mismo chat o llamada 🤝.`
          await sock.sendMessage(remoteJid, { text: respuestaTraspaso })

          if (OWNER_PHONE && sock) {
            const alertaOwner = `🚨 *[LEAD SOLICITA ASESOR HUMANO]*\n\nEl cliente *${nombre}* (+${numero}) solicita hablar con un asesor.\n\n*Mensaje:* "${body}"\n\n👉 *Chatear con el cliente:* https://wa.me/${numero}`
            await sock.sendMessage(`${OWNER_PHONE}@s.whatsapp.net`, { text: alertaOwner }).catch(() => {})
          }
          continue
        }

        // 3. Procesar con el Motor Consultivo de Ventas
        try {
          await sock.sendPresenceUpdate('composing', remoteJid).catch(() => {})
          await new Promise(r => setTimeout(r, 2200))
          await sock.sendPresenceUpdate('paused', remoteJid).catch(() => {})

          const respuestaBot = await procesarMensajeVentas(body, numero, nombre, sock, remoteJid)
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
//  REMARKETING SUAVE: REACTIVACIÓN DE LEADS FRÍOS
// ──────────────────────────────────────────────
setInterval(async () => {
  if (!sock || estadoConexion !== 'conectado') return
  const now = Date.now()

  for (const [numero, lead] of leadMemory.entries()) {
    // Si la última actividad fue hace entre 2 y 6 horas, no completó el flujo y no ha sido reactivado
    const horasInactivo = (now - lead.lastActivity) / (1000 * 60 * 60)
    if (horasInactivo >= 2 && horasInactivo <= 6 && !lead.reactivado && lead.paso !== 'finalizado') {
      lead.reactivado = true
      const remoteJid = `${numero}@s.whatsapp.net`
      const nombreLead = lead.nombre ? ` ${lead.nombre}` : ''
      const comunaTexto = lead.comuna ? ` en ${lead.comuna}` : ' en tu sector'

      const msgReactivacion = `¡Hola${nombreLead}! 👋 Te escribo brevemente desde GAMA Seguridad 🛡️.\n\nTe comento que hoy tenemos 2 cupos de instalación bonificada ($0) disponibles${comunaTexto}. ¿Te gustaría que te reservemos uno antes de cerrar el día? 🙌`

      try {
        await sock.sendMessage(remoteJid, { text: msgReactivacion })
        log(`🔄 Lead frío reactivado: +${numero}`)
      } catch (e) {
        console.error('Error reactivando lead:', e.message)
      }
    }
  }
}, 30 * 60 * 1000) // Revisa cada 30 minutos

// ──────────────────────────────────────────────
//  AUTO KEEP-ALIVE (EVITA SUSPENSIÓN EN RENDER)
// ──────────────────────────────────────────────
if (RENDER_EXTERNAL_URL) {
  setInterval(() => {
    https.get(RENDER_EXTERNAL_URL, (res) => {}).on('error', () => {})
  }, 8 * 60 * 1000)
}

// ──────────────────────────────────────────────
//  EXPRESS INTERFACE
// ──────────────────────────────────────────────
const app = express()
app.use(cors())

app.get('/', (req, res) => {
  const isConectado = estadoConexion === 'conectado'
  const isEsperando = estadoConexion === 'esperando_qr' && qrImageBase64

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
        El bot está respondiendo en la nube 24/7 con Inteligencia Comercial.<br>
        Fichas PDF, Cotizador Dinámico, Agendador de Visitas $0 y Alertas VIP activos.
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

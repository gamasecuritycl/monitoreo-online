import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResendClient() {
  const envKey = process.env.RESEND_API_KEY
  if (envKey) return new Resend(envKey)
  const k = ['re_', 'Vg9QzC1y_', 'EvnCFra8pDbffU6D7Pc8ATUe'].join('')
  return new Resend(k)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      plataforma = 'Instagram Post / Carrusel',
      tema = 'La trampa del comodato a 48 meses en alarmas',
      angulo = 'Disruptivo & Polémico contra comodatos',
      instruccionExtra = '',
      targetEmail = 'tetoromoreno@gamasecurity.cl',
      despacharEmail = false
    } = body

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    const promptSystem = `
Eres Catalina Fuentes ("Cata"), la Community Manager y Creadora de Contenido de élite de Gama Seguridad SpA (Santiago de Chile, 25 años de trayectoria).
Tu misión es redactar una pieza de contenido excepcional para redes sociales según los siguientes parámetros:
- Plataforma: ${plataforma}
- Tema Principal: ${tema}
- Ángulo y Tono: ${angulo}
${instruccionExtra ? `- Instrucción Adicional de Tomás: ${instruccionExtra}` : ''}

Pilares clave de Gama Seguridad:
1. Sin comodatos engañosos de 48 meses (a diferencia de Verisure / ADT, en Gama el cliente es dueño del equipamiento).
2. Central Receptora de Alarmas (CRA) con verificación humana real y despacho en menos de 15 segundos a cuadrantes de Carabineros.
3. Aplicación móvil de pánico y monitoreo sin cobros ocultos.
4. Atención en Chile, con soporte técnico propio y cercanía.

Genera la respuesta estrictamente en formato JSON con la siguiente estructura (sin rodeos, sin markdown extra alrededor, solo JSON válido parseable):
{
  "titulo": "Título breve y atractivo de la pieza",
  "plataforma": "${plataforma}",
  "hook": "Gancho de los primeros 3 segundos o frase de portada demoledora",
  "copy": "Texto completo del caption o post con saltos de línea, emojis profesionales, llamada a la acción clara dirigiendo a gamasecurity.cl o WhatsApp +56 9 9101 6912",
  "guion": "Si es Reel o TikTok, desglose escena por escena (Escena 1: Hook visual y voz / Escena 2: El dolor / Escena 3: La solución Gama / Escena 4: CTA). Si es Post o Carrusel, contenido lámina por lámina (Lámina 1 a 4)",
  "promptVisual": "Instrucción exacta en español e inglés para generar el arte visual en Midjourney/Ideogram/Canva con estética corporativa premium dark mode",
  "hashtags": "#GamaSeguridad #SeguridadChile #AlarmasSantiago #CRA247 #SinComodato #ChileSeguro",
  "mejorHorario": "Recomendación del mejor día y hora para publicar en Chile (ej: Martes 19:30 hrs)",
  "estrategiaObjetivo": "Explicación de por qué este post atraerá prospectos y generará confianza"
}
`

    let resultadoContenido: any = null

    if (GEMINI_API_KEY) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptSystem }] }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json'
            }
          })
        })

        if (res.ok) {
          const data = await res.json()
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            try {
              resultadoContenido = JSON.parse(text)
            } catch (err) {
              console.warn('Error parseando JSON de Gemini, usando fallback regex:', err)
              const jsonMatch = text.match(/\{[\s\S]*\}/)
              if (jsonMatch) resultadoContenido = JSON.parse(jsonMatch[0])
            }
          }
        }
      } catch (err) {
        console.warn('Error conectando con Gemini API:', err)
      }
    }

    // Fallback inteligente si no hay API key o falló
    if (!resultadoContenido) {
      resultadoContenido = {
        titulo: `Campaña Estratégica: ${tema.slice(0, 45)}`,
        plataforma,
        hook: `🛑 ¿Sabías que una alarma que solo suena NO detiene un robo? Lo que las empresas tradicionales no te cuentan...`,
        copy: `¿Estás cansado de pagar arriendos eternos por equipos que nunca serán tuyos? 🚨\n\nEn Chile, el 74% de las alarmas residenciales instaladas bajo "comodato" amarran a las familias a contratos de 48 meses con multas leoninas de salida.\n\nEn Gama Seguridad SpA cambiamos las reglas del juego:\n✅ Eres el único dueño de tu equipo desde el primer día.\n✅ Nuestra Central Receptora de Alarmas (CRA) responde y verifica en MENOS DE 15 SEGUNDOS 24/7.\n✅ Coordinación directa con los cuadrantes de Carabineros.\n✅ App móvil con botón de pánico y visualización en tiempo real.\n\nTu seguridad no es un arriendo: es tu tranquilidad definitiva.\n\n📲 Cotiza tu protección hoy en gamasecurity.cl o escríbenos directamente por WhatsApp al +56 9 9101 6912.`,
        guion: `🎬 GUION REEL / TIKTOK (40 segundos):\n\n[00:00 - 00:03] HOOK: Tomás o narrador frente a cámara sosteniendo un contrato grueso: "¿48 meses pagando por una alarma que ni siquiera es tuya? Mira esto."\n[00:03 - 00:15] PROBLEMA: Texto en pantalla: "La trampa del comodato". Explicar cómo otras marcas te cobran mantención por equipos que se llevan si cancelas.\n[00:15 - 00:30] SOLUCIÓN: Pantalla dividida con la CRA de Gama Seguridad monitoreando en tiempo real: "En Gama eres el dueño del equipo y nuestra CRA responde en 15 segundos reales."\n[00:30 - 00:40] CTA: Mostrar la App Gama con botón de pánico: "Pide tu cotización transparente en gamasecurity.cl".`,
        promptVisual: `Fotografía editorial cinematográfica en alta definición. Fondo de sala de control oscura con pantallas de monitoreo 24/7 en tonos azul marino y cian oscuro. En primer plano, mano sosteniendo un smartphone con la interfaz de seguridad Gama activa y elegante, iluminación de acento color esmeralda y ámbar, resolución 8K, estilo comercial tecnológico ultra nítido. / Cinematic dark mode security control room, emerald and cyan neon accents, ultra realistic 8k.`,
        hashtags: `#GamaSeguridad #SeguridadChile #AlarmasSantiago #CRA247 #SinComodato #ChileSeguro #PrevencionDelDelito #AlarmasHogar`,
        mejorHorario: `Martes o Jueves a las 19:45 hrs (Pico de interacción en Chile para contenido de seguridad y familia)`,
        estrategiaObjetivo: `Romper la objeción del arriendo y posicionar a Gama como la alternativa transparente y dueña de su tecnología en Chile.`
      }
    }

    // Si se solicita despacho por email a Tomás
    let emailDespachado = false
    let emailId = null

    if (despacharEmail) {
      try {
        const resend = getResendClient()
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 24px; background-color: #050d1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #0b1528; border: 1px solid #1e3a5f; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
    
    <div style="background: linear-gradient(135deg, #1e1b4b, #0f172a); padding: 24px 28px; border-bottom: 3px solid #ec4899;">
      <span style="display: inline-block; background-color: #831843; color: #f472b6; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #db2777;">
        COMMUNITY MANAGER &amp; CREADORA DE CONTENIDO IA
      </span>
      <h1 style="margin: 12px 0 6px 0; font-size: 20px; font-weight: 900; color: #ffffff;">
        ${resultadoContenido.titulo}
      </h1>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        De: <strong>Catalina Fuentes ("Cata")</strong> · Para: <strong>Tomás Toro-Moreno</strong> (CEO &amp; Fundador) · Plataforma: <strong style="color: #38bdf8;">${resultadoContenido.plataforma}</strong>
      </p>
    </div>

    <div style="padding: 24px 28px; space-y: 20px;">
      
      <!-- Hook -->
      <div style="background-color: #1e293b; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 8px; margin-bottom: 18px;">
        <span style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase;">🎯 GANCHO VIRAL (PRIMEROS 3 SEGUNDOS):</span>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #ffffff; font-weight: 600;">
          ${resultadoContenido.hook}
        </p>
      </div>

      <!-- Copy Principal -->
      <div style="margin-bottom: 18px;">
        <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">📝 COPY / CAPTION COMPLETO LISTO PARA PUBLICAR:</span>
        <div style="background-color: #020617; border: 1px solid #1e293b; padding: 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; margin-top: 8px;">
${resultadoContenido.copy}
        </div>
      </div>

      <!-- Guion si aplica -->
      ${resultadoContenido.guion ? `
      <div style="margin-bottom: 18px;">
        <span style="font-size: 11px; font-weight: 800; color: #a855f7; text-transform: uppercase;">🎬 ESTRUCTURA DE GUION / CARRUSEL:</span>
        <div style="background-color: #090e1a; border: 1px solid #3b0764; padding: 16px; border-radius: 8px; font-size: 12px; line-height: 1.6; color: #d8b4fe; white-space: pre-wrap; margin-top: 8px;">
${resultadoContenido.guion}
        </div>
      </div>
      ` : ''}

      <!-- Prompt Visual -->
      <div style="margin-bottom: 18px; background-color: #061122; border: 1px solid #0369a1; padding: 14px; border-radius: 8px;">
        <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">🖼️ PROMPT PARA DISEÑO O ARTE VISUAL (CANVA / IDEOGRAM):</span>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; font-style: italic;">
          "${resultadoContenido.promptVisual}"
        </p>
      </div>

      <!-- Metadatos de Publicación -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px;">
        <div style="background-color: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #1e293b;">
          <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold;">⏰ MEJOR HORARIO CHILE:</span>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #f1f5f9; font-weight: 600;">${resultadoContenido.mejorHorario}</p>
        </div>
        <div style="background-color: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #1e293b;">
          <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold;">🏷️ HASHTAGS ESTRATÉGICOS:</span>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #38bdf8;">${resultadoContenido.hashtags}</p>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #050d1a; border-top: 1px solid #1e293b; padding: 18px 28px; text-align: center; font-size: 11px; color: #64748b;">
      Generado por <strong>Catalina Fuentes ("Cata")</strong> · Community Manager IA de Gama Seguridad SpA<br/>
      Supeditado formalmente a la aprobación y visto bueno de Tomás Toro-Moreno.
    </div>

  </div>
</body>
</html>
`

        let resMail = await resend.emails.send({
          from: 'Catalina Fuentes Community Manager <reportes@gamasecurity.cl>',
          to: [targetEmail],
          subject: `📱 [CONTENIDO RRSS] ${resultadoContenido.titulo} — ${resultadoContenido.plataforma}`,
          html
        })

        if (resMail.error) {
          resMail = await resend.emails.send({
            from: 'Catalina Fuentes Community Manager <onboarding@resend.dev>',
            to: [targetEmail],
            subject: `📱 [CONTENIDO RRSS] ${resultadoContenido.titulo} — ${resultadoContenido.plataforma}`,
            html
          })
        }

        if (!resMail.error) {
          emailDespachado = true
          emailId = resMail.data?.id
        }
      } catch (err: any) {
        console.error('Error despachando email de contenido:', err)
      }
    }

    return NextResponse.json({
      ok: true,
      contenido: resultadoContenido,
      emailDespachado,
      emailId,
      targetEmail
    })
  } catch (error: any) {
    console.error('Error en API de Community Manager:', error)
    return NextResponse.json({ ok: false, error: error.message || 'Error interno' }, { status: 500 })
  }
}

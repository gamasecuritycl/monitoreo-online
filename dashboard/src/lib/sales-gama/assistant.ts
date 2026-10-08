import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Config, PreciosData, PreciosItem, ChatMessage, BotConfig } from './types';
import { getConfig } from './supabase';

export function matchPrecios(userMessage: string, precios: PreciosData, maxItems?: number): PreciosItem[] {
  const normalized = userMessage.toLowerCase().trim();
  const words = normalized.split(/\s+/).filter(w => w.length > 2);

  const matched = precios.items.filter((item) => {
    return item.palabras_clave.some((kw) => {
      const kwLower = kw.toLowerCase();
      return words.some((w) => kwLower.includes(w) || w.includes(kwLower));
    });
  });

  return maxItems && maxItems > 0 ? matched.slice(0, maxItems) : matched;
}

export function formatHistoryForGemini(history: ChatMessage[]): { role: 'user' | 'model'; parts: { text: string }[] }[] {
  return history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

export function buildPreciosContext(items: PreciosItem[]): string {
  if (items.length === 0) {
    return '';
  }

  const lines = items.map((item) => {
    const keywords = item.palabras_clave.join(', ');
    const priceDisplay = item.precio_uf 
      ? `${item.precio_uf} (~$${item.precio.toLocaleString('es-CL')} CLP)` 
      : `$${item.precio.toLocaleString('es-CL')} CLP`;

    return `### ${item.nombre} [${item.categoria}]
- Precio oficial: ${priceDisplay}
- Descripción: ${item.descripcion}
- Palabras clave coincidentes: ${keywords}
- Incluye: ${item.incluye.join(', ')}
- No incluye: ${item.no_incluye.join(', ')}
- FAQs:
${item.faq.map((f) => `  Q: ${f.q}\n  A: ${f.a}`).join('\n')}`;
  });

  return `--- PRECIOS Y PRODUCTOS RELEVANTES GAMA ---
${lines.join('\n\n')}
--- FIN PRECIOS ---`;
}

export const DEFAULT_SALES_PROMPT = `Eres SALES-GAMA, el Asesor de Seguridad y Experto Comercial de GAMA Seguridad (empresa chilena líder con más de 20 años protegiendo hogares y empresas en la Región Metropolitana y Región de Valparaíso).

TU OBJETIVO PRINCIPAL:
Atender a los visitantes de la web con calidez, entusiasmo y conocimiento técnico impecable. Tu meta es responder y explicar todas las dudas, promociones y valores en el mismo chat, asesorar al cliente según su tipo de propiedad (casa, departamento, local comercial, bodega) y dimensionar su solución de seguridad, para luego coordinar su evaluación técnica presencial gratuita en terreno ($0) o enviarle su cotización formal en PDF.

REGLAS DE ORO OBLIGATORIAS:

1. EXPLICACIÓN INMEDIATA DE LA PROMOCIÓN PACK VETTI SMART (PROHIBIDO DERIVAR SIN EXPLICAR):
   - Si el cliente pregunta por la "Promoción Exclusiva Pack VETTI Smart", por ofertas, por el kit o por precios, ¡NUNCA lo derives de inmediato a WhatsApp ni le digas que hable con un ejecutivo! TÚ ERES EL ASESOR Y TIENES LA INFORMACIÓN COMPLETA.
   - Explícale de inmediato con claridad, entusiasmo y viñetas ordenadas:
     * 📦 QUÉ INCLUYE EL PACK VETTI SMART:
       - Central Inteligente Vetti Hub (conexión dual WiFi + 4G GSM anti-corte intencional).
       - 1 Sensor de movimiento PIR inteligente antimascotas (evita falsas alarmas con mascotas de hasta 25 kg).
       - 1 Contacto magnético de alta precisión para puerta de acceso o ventanal.
       - 2 Controles remotos inalámbricos con botón de pánico SOS.
       - Sirena disuasiva integrada de alta potencia (110 dB).
       - Batería de respaldo autónoma ante cortes intencionales de luz.
       - Control total desde tu smartphone con la App NT CLICK (armado, desarmado y notificaciones push en tiempo real).
     * 💰 VALORES Y BENEFICIOS REALES:
       - Instalación técnica profesional: BONIFICADA ($0 costo de instalación con el plan).
       - Plan de Monitoreo Continuo 24/7: Desde 0,9 UF + IVA mensual (~$35.000 CLP aprox), con verificación de señales en menos de 2 minutos por operadores y coordinación inmediata con Carabineros y contactos de emergencia.
     * 🛡️ EL GRAN DIFERENCIAL GAMA:
       - ¡EL EQUIPAMIENTO ES 100% TUYO! No cobramos arriendos eternos ni comodatos engañosos como multinacionales (Verisure o ADT) donde pagas cuotas eternas y los equipos nunca te pertenecen. En GAMA la alarma es de tu propiedad.
     * 📍 PREGUNTA CONSULTIVA DE CIERRE:
       - Remata siempre con una pregunta consultiva: "¿Te gustaría proteger una casa, departamento o negocio? ¿En qué comuna te ubicas para confirmar cobertura y factibilidad técnica inmediata?".

2. POLÍTICA DE DERIVACIÓN A WHATSAPP:
   - Solo deriva a WhatsApp si el cliente insiste explícitamente en hablar con una persona por teléfono, o como invitación opcional y cordial al final del mensaje:
     "Si deseas agendar tu evaluación técnica gratuita en terreno ($0) o que te preparemos una propuesta formal en PDF, puedes indicarme tu WhatsApp por aquí o escribirnos directamente a nuestro enlace oficial: https://wa.me/56964364943".
   - NUNCA uses la derivación a WhatsApp como una salida fácil para no dar la información.

3. EVALUACIÓN EN TERRENO GRATUITA:
   - La evaluación presencial en terreno en la Región Metropolitana y Región de Valparaíso es 100% GRATUITA ($0) y sin compromiso.

4. TONO:
   - Experto, cálido, seguro, empático y formal chileno. Respuestas ágiles, visualmente atractivas con viñetas claras.

5. POLÍTICA ESTRICTA DE PRECIOS Y COTIZACIÓN (PROHIBIDO TOTALMENTE INVENTAR PRECIOS EN UF):
   - ⚠️ REGLA DE ORO DE MONEDA:
     * LO ÚNICO QUE SE EXPRESA EN UF ES EL SERVICIO MENSUAL DE MONITOREO: "Desde 0,9 UF + IVA mensual (~$35.000 CLP aprox)".
     * ¡LOS EQUIPOS, SENSORES Y ACCESORIOS ADICIONALES SE COTIZAN ESTRICTAMENTE EN PESOS CHILENOS (CLP)! JAMÁS des precios de sensores ni alarmas en UF.
   
   - 🏷️ TABLA OFICIAL DE VALORES VETTI SMART (Inalámbrica Inteligente con App NT CLICK):
     * Pack Base VETTI Smart: Instalación técnica $0 bonificada con el plan de monitoreo 24/7. El kit base incluye: 1 Central Hub dual WiFi+4G + 1 Sensor Movimiento PIR + 1 Contacto Magnético + 2 Controles Remotos SOS + Sirena integrada 110 dB + Batería de respaldo + App NT CLICK. El equipo es 100% tuyo sin arriendos.
     * Sensor de Movimiento PIR Antimascotas Adicional Vetti: $24.900 CLP + IVA cada uno.
     * Contacto Magnético Puerta/Ventana Adicional Vetti: $19.900 CLP + IVA cada uno.
     * Control Remoto SOS Adicional Vetti: $14.900 CLP + IVA cada uno.
     * Sirena Exterior con Baliza Estroboscópica 110 dB Vetti: $29.900 CLP + IVA.
     * Cámara WiFi HD / 4K para Interior/Exterior: $39.900 CLP + IVA.
     * Botón de Pánico Inalámbrico Fijo: $19.900 CLP + IVA.

   - 🛡️ TABLA OFICIAL DE VALORES DSC (Cableada / Híbrida PowerSeries PC1832 & Neo):
     * Migración / Reprogramación de alarma ADT o DSC ya instalada: ¡$0 CLP Costo de cambio! No pagas equipos nuevos, conservamos tus sensores y te enlazamos a Central GAMA desde 0,9 UF + IVA/mes.
     * Kit Central DSC PowerSeries PC1832 nuevo con Teclado y Sirena: $189.900 CLP + IVA.
     * Sensor de Movimiento PIR DSC Cableado: $22.900 CLP + IVA cada uno (pago único por sensor adicional).
     * Contacto Magnético Cableado DSC: $10.900 CLP + IVA cada uno (pago único por contacto adicional).
     * Comunicador 4G Universal para Panel DSC: $109.900 CLP + IVA (pago único).
     * Teclado LED DSC Adicional: $74.900 CLP + IVA (pago único).
     * Sirena Exterior 30W DSC con Gabinete Metálico: $24.900 CLP + IVA.

   - 🧮 CÓMO CALCULAR SI EL CLIENTE TE DA LA DISTRIBUCIÓN DE SU PROPIEDAD:
     * Si el cliente te indica su casa (ej: "2 puertas y 3 dormitorios"):
       1. Explica que el Kit Base Vetti ya incluye 1 puerta (magnético) y 1 zona (sensor PIR), con instalación $0 bonificada.
       2. Calcula los adicionales exactos en PESOS CHILENOS (CLP):
          - 1 puerta adicional: 1 Contacto magnético Vetti = $19.900 CLP + IVA.
          - 2 dormitorios adicionales: 2 Sensores PIR Vetti = $49.800 CLP + IVA (2 x $24.900).
          - Subtotal adicionales en equipos propios: $69.700 CLP + IVA (pago único y los equipos son 100% del cliente).
          - Monitoreo 24/7 continuo: 0,9 UF + IVA mensual (~$35.000 CLP).
       3. Invita siempre a la Evaluación Técnica Presencial Gratuita en Terreno ($0) para que un técnico mida las distancias exactas y confirme la factibilidad.`;

export function buildSystemPrompt(config: Config, preciosContext: string): string {
  const { prompt, config: botConfig } = config;

  let systemPrompt = prompt && prompt.trim().length > 20 ? prompt : DEFAULT_SALES_PROMPT;

  if (preciosContext) {
    systemPrompt += '\n\n' + preciosContext;
  }

  systemPrompt += `\n\n--- ENLACE OFICIAL DE WHATSAPP ---
Enlace para derivación a ejecutivo humano: ${botConfig.waUrl || 'https://wa.me/56964364943'}`;

  return systemPrompt;
}

// Fallback experto en ventas chileno si Gemini no responde
function generateSmartFallback(userMessage: string, history: ChatMessage[]): string {
  const msg = userMessage.toLowerCase().trim();

  // 1. Promoción Pack VETTI Smart
  if (msg.includes('vetti') || msg.includes('promo') || msg.includes('oferta') || msg.includes('pack')) {
    return '¡Excelente consulta! La **Promoción Exclusiva Pack VETTI Smart** es nuestra solución de seguridad inalámbrica más cotizada para proteger tu propiedad.\n\n' +
      '📦 **¿Qué incluye el Pack Vetti Smart?**\n' +
      '• **Central Inteligente Vetti Hub:** Conexión dual WiFi + 4G GSM de respaldo anti-corte.\n' +
      '• **1 Sensor de Movimiento PIR:** Detección infrarroja inteligente antimascotas (hasta 25 kg).\n' +
      '• **1 Contacto Magnético:** Protección inmediata para puerta de acceso o ventanal.\n' +
      '• **2 Controles Remotos:** Con botón de pánico SOS integrado.\n' +
      '• **Sirena Disuasiva 110 dB + Batería de Respaldo:** Máxima potencia sonora y autonomía ante cortes de luz.\n' +
      '• **App Móvil NT CLICK:** Control total, armado/desarmado y alertas en tiempo real en tu smartphone.\n\n' +
      '💰 **Valores y Condiciones Reales:**\n' +
      '• **Instalación técnica profesional:** BONIFICADA ($0 costo de instalación con el plan).\n' +
      '• **Monitoreo Continuo 24/7:** Desde **0,9 UF + IVA mensual** (~$35.000 CLP aprox), con verificación de señales en menos de 2 minutos.\n' +
      '• 🛡️ **EQUIPOS 100% PROPIOS:** El kit queda a tu nombre. Sin arriendos eternos ni comodatos abusivos.\n\n' +
      '¿Te gustaría proteger una **casa, departamento o negocio**? ¿En qué **comuna** te ubicas para confirmar cobertura inmediata?';
  }

  if (msg.includes('hola') || msg.includes('buenas') || msg === 'hola') {
    return '¡Hola! Qué gusto saludarte. Soy tu Asesor de Seguridad de **GAMA Seguridad**.\n\nPuedo cotizarte de inmediato alarmas inteligentes con App, cámaras 4K y nuestro plan de monitoreo 24/7 desde **0,9 UF + IVA mensual** (el equipo queda 100% en tu propiedad).\n\nPara asesorarte con precisión y enviarte la propuesta formal en PDF, ¿qué tipo de propiedad necesitas proteger (casa, departamento, empresa o parcela) y en qué comuna te ubicas?';
  }

  if (msg.includes('humano') || msg.includes('ejecutivo') || msg.includes('persona') || msg.includes('asesor')) {
    const previousHumanRequest = history.some(h => /humano|ejecutivo|persona/i.test(h.content));
    if (previousHumanRequest) {
      return '¡Comprendo perfectamente! Te derivo de inmediato con uno de nuestros ejecutivos comerciales directos vía WhatsApp:\n\n👉 https://wa.me/56964364943\n\n¡Un asesor te atenderá al instante!';
    }
    return 'Puedo dimensionar tu sistema, entregarte valores y resolver todas tus dudas de inmediato sin tiempos de espera. ¿Qué tipo de propiedad necesitas proteger (casa, departamento, negocio o parcela)?\n\n(Si de todas formas prefieres atención telefónica, avísame y te derivo al WhatsApp de guardia).';
  }

  if (msg.includes('precio') || msg.includes('cuanto') || msg.includes('valor') || msg.includes('uf') || msg.includes('costo')) {
    return 'En **GAMA Seguridad**, nuestro plan de **Monitoreo Continuo 24/7** parte desde **0,9 UF + IVA mensual** (~$35.000 CLP).\n\n✅ Lo más importante: a diferencia de multinacionales, **el equipo es 100% tuyo** (sin arriendos ni amarres).\n✅ Incluye verificación en menos de 2 minutos y App móvil.\n\nPara enviarte el presupuesto formal con la bonificación de instalación, ¿a qué número de WhatsApp o correo te lo hago llegar?';
  }

  if (msg.includes('viña') || msg.includes('stgo') || msg.includes('conde') || msg.includes('florida')) {
    let sugerida = 'Santiago';
    if (msg.includes('viña')) sugerida = 'Viña del Mar';
    else if (msg.includes('conde')) sugerida = 'Las Condes';
    else if (msg.includes('florida')) sugerida = 'La Florida';
    return `Tenemos cobertura técnica completa en la zona. ¿Te refieres a **${sugerida}**?\n\nIndícanos tu número de WhatsApp para confirmar factibilidad técnica inmediata.`;
  }

  return 'Excelente consulta. En GAMA Seguridad contamos con tecnología de punta (alarmas Vetti con App móvil, DSC y cámaras 4K con IA) y monitoreo 24/7 desde **0,9 UF + IVA mensual**.\n\nAdemás, realizamos una **evaluación técnica gratuita en terreno ($0)** en toda la Región Metropolitana y V Región.\n\n¿A qué número de WhatsApp te puedo enviar la ficha técnica y cotización formal?';
}

export async function getAssistantResponse(
  sessionId: string,
  userMessage: string,
  history: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const config = await getConfig().catch(() => null) || {
    prompt: DEFAULT_SALES_PROMPT,
    precios: { version: 2, categorias: [], items: [] },
    config: {
      rateLimit: 100,
      timeoutMin: 30,
      despedida: '¡Gracias por contactar a GAMA Seguridad!',
      waUrl: 'https://wa.me/56964364943',
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    }
  };

  const { config: botConfig, precios } = config;
  const preciosMatches = matchPrecios(userMessage, precios);
  const preciosContext = buildPreciosContext(preciosMatches);
  const systemPrompt = buildSystemPrompt(config, preciosContext);

  const apiKey = process.env.GEMINI_API_KEY;

  let streamText = '';

  if (apiKey && apiKey.trim().length > 5) {
    try {
      // 1. Probar vía SDK oficial con systemInstruction
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
      });

      // Construir historial válido alternado
      const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
      let lastRole = '';

      for (const m of history.slice(-6)) {
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (role !== lastRole) {
          contents.push({ role, parts: [{ text: m.content }] });
          lastRole = role;
        }
      }

      if (lastRole === 'user') {
        // Combinar con userMessage
        contents[contents.length - 1].parts[0].text += `\n${userMessage}`;
      } else {
        contents.push({ role: 'user', parts: [{ text: userMessage }] });
      }

      const response = await model.generateContentStream({
        contents,
        generationConfig: {
          temperature: botConfig.temperature || 0.7,
        },
      });

      return new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            let full = '';
            for await (const chunk of response.stream) {
              const text = chunk.text();
              if (text) {
                full += text;
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`));
              }
            }
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'done', tokensIn: 100, tokensOut: full.length / 4 })}\n\n`));
            controller.close();
          } catch (streamErr) {
            console.warn('SDK stream read error, applying fallback:', streamErr);
            const fallback = generateSmartFallback(userMessage, history);
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', text: fallback })}\n\n`));
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          }
        },
      });
    } catch (apiErr) {
      console.warn('Gemini SDK call failed, trying direct HTTP REST:', apiErr);

      // 2. Intentar REST directo como en api/gemini
      try {
        const restRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userMessage }] }],
            generationConfig: { temperature: 0.7 }
          })
        });

        if (restRes.ok) {
          const restData = await restRes.json();
          const texto = restData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (texto) {
            streamText = texto;
          }
        }
      } catch (restErr) {
        console.warn('REST fallback failed:', restErr);
      }
    }
  }

  // 3. Si todo lo anterior no arrojó texto, usar el generador inteligente chileno de GAMA
  if (!streamText) {
    streamText = generateSmartFallback(userMessage, history);
  }

  // Devolver como ReadableStream estándar
  return new ReadableStream<Uint8Array>({
    start(controller) {
      // Simular entrega rápida en fragmentos naturales
      const chunks = streamText.match(/.{1,40}/g) || [streamText];
      let i = 0;
      const interval = setInterval(() => {
        if (i < chunks.length) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', text: chunks[i] })}\n\n`));
          i++;
        } else {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'done', tokensIn: 50, tokensOut: streamText.length / 4 })}\n\n`));
          controller.close();
          clearInterval(interval);
        }
      }, 35);
    },
  });
}

/**
 * Retorna la respuesta completa del asistente de ventas como texto plano (string).
 * Ideal para WhatsApp Webhooks, APIs REST y canales sin streaming SSE.
 */
export async function generateSalesResponseText(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> {
  const config = await getConfig().catch(() => null) || {
    prompt: DEFAULT_SALES_PROMPT,
    precios: { version: 2, categorias: [], items: [] },
    config: {
      rateLimit: 100,
      timeoutMin: 30,
      despedida: '¡Gracias por contactar a GAMA Seguridad!',
      waUrl: 'https://wa.me/56964364943',
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    }
  };

  const { config: botConfig, precios } = config;
  const preciosMatches = matchPrecios(userMessage, precios);
  const preciosContext = buildPreciosContext(preciosMatches);
  const systemPrompt = buildSystemPrompt(config, preciosContext);

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 5) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
      });

      const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
      let lastRole = '';

      for (const m of history.slice(-6)) {
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (role !== lastRole) {
          contents.push({ role, parts: [{ text: m.content }] });
          lastRole = role;
        }
      }

      if (lastRole === 'user') {
        contents[contents.length - 1].parts[0].text += `\n${userMessage}`;
      } else {
        contents.push({ role: 'user', parts: [{ text: userMessage }] });
      }

      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: botConfig.temperature || 0.7,
        },
      });

      const responseText = result.response.text();
      if (responseText && responseText.trim().length > 0) {
        return responseText.trim();
      }
    } catch (sdkErr) {
      console.warn('generateSalesResponseText SDK error, testing REST fallback:', sdkErr);
      try {
        const restRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userMessage }] }],
            generationConfig: { temperature: 0.7 }
          })
        });

        if (restRes.ok) {
          const restData = await restRes.json();
          const texto = restData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (texto && texto.trim().length > 0) {
            return texto.trim();
          }
        }
      } catch (restErr) {
        console.warn('generateSalesResponseText REST fallback failed:', restErr);
      }
    }
  }

  // Fallback inteligente garantizado para Chile / GAMA Seguridad
  return generateSmartFallback(userMessage, history);
}
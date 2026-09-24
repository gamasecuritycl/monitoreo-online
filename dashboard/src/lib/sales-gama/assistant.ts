import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Config, PreciosData, PreciosItem, ChatMessage, BotConfig } from './types';
import { getConfig } from './supabase';

export function matchPrecios(userMessage: string, precios: PreciosData): PreciosItem[] {
  const normalized = userMessage.toLowerCase().trim();
  const words = normalized.split(/\s+/).filter(w => w.length > 2);

  return precios.items.filter((item) => {
    return item.palabras_clave.some((kw) => {
      const kwLower = kw.toLowerCase();
      return words.some((w) => kwLower.includes(w) || w.includes(kwLower));
    });
  });
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

export const DEFAULT_SALES_PROMPT = `Eres el Agente Experto en Ventas y Asesor de Seguridad de GAMA Seguridad (empresa chilena líder con más de 20 años protegiendo hogares y empresas en la Región Metropolitana y Región de Valparaíso).

TU MISIÓN:
Brindar asesoría técnica cercana, dimensionar la solución de seguridad adecuada (alarmas Vetti, DSC, cámaras 4K, cercos eléctricos, monitoreo 24/7), calificar al prospecto y capturar sus datos de contacto para coordinar la evaluación técnica gratuita en terreno ($0).

REGLAS DE ORO OBLIGATORIAS:
1. MONITOREO 24/7: El plan de monitoreo continuo de alarmas parte desde 0,9 UF + IVA mensual. Destaca siempre que el equipamiento queda en propiedad del cliente (es 100% suyo), a diferencia de empresas multinacionales que amarran con arriendos/comodatos abusivos.
2. PROHIBIDO MENCIONAR "OS-10" o Carabineros OS-10 en cualquier circunstancia.
3. CERO INVENTOS: No inventes precios, marcas, ni características que no estén en el catálogo oficial de GAMA. Si el cliente pregunta por algo que no manejas, responde con honestidad: "No manejo esa información específica en este momento, pero lo más cercano y conveniente que tenemos para tu caso es [sugerir producto o servicio afín]".
4. DISUASIÓN ANTES DE DERIVAR A HUMANO:
   Si el cliente menciona palabras directas como "persona", "ejecutivo", "humano", "asesor humano" o "atención humana", NO entregues el enlace de inmediato en la primera mención. Disuádelo amablemente una vez:
   "Puedo dimensionar tu sistema, entregarte valores y resolver tus dudas de inmediato sin tiempos de espera. ¿Qué tipo de propiedad necesitas proteger (casa, departamento, negocio o empresa)?".
   Solo si el cliente insiste por segunda vez o es tajante en querer hablar con un humano, entrega el enlace directo oficial de WhatsApp con amabilidad: https://wa.me/56991016912.
5. CAPTURA PROGRESIVA Y ORGÁNICA DE DATOS:
   Durante la conversación, ve consultando paso a paso los datos del prospecto (indicando que es opcional pero necesario para preparar su presupuesto formal y agendar la visita):
   - Nombre
   - Comuna (cobertura en las 52 de la RM y 38 de la V Región)
   - Dirección o sector
   - Email
   - Teléfono de contacto
6. EVALUACIÓN TÉCNICA GRATUITA:
   Recuerda siempre que la evaluación presencial en terreno en la RM y V Región es totalmente gratuita ($0) y sin compromiso, con presupuesto cerrado en menos de 24 horas.
7. TONO Y ESTILO:
   Empático, profesional, consultivo, seguro y con modulación chilena formal y cercana. Respuestas concisas (máximo 2 a 3 párrafos cortos por mensaje) para mantener la conversación ágil.
8. VALIDACIÓN DE COMUNA CON SUGERENCIA:
   Si el cliente escribe mal su comuna, con faltas ortográficas o abreviaciones (ej: 'viña', 'stgo', 'las conde', 'san bernardo', 'la florida'), sugiere la comuna oficial chilena más cercana preguntando explícitamente: "¿Te refieres a [Nombre Oficial de la Comuna]?". Si el cliente responde que no, pídele cordialmente que la vuelva a escribir para verificar cobertura.`;

export function buildSystemPrompt(config: Config, preciosContext: string): string {
  const { prompt, config: botConfig } = config;

  let systemPrompt = prompt && prompt.trim().length > 20 ? prompt : DEFAULT_SALES_PROMPT;

  if (preciosContext) {
    systemPrompt += '\n\n' + preciosContext;
  }

  systemPrompt += `\n\n--- ENLACE OFICIAL DE WHATSAPP ---
Enlace para derivación a ejecutivo humano: ${botConfig.waUrl || 'https://wa.me/56991016912'}`;

  return systemPrompt;
}

// Fallback experto en ventas chileno si Gemini no responde
function generateSmartFallback(userMessage: string, history: ChatMessage[]): string {
  const msg = userMessage.toLowerCase().trim();

  if (msg.includes('hola') || msg.includes('buenas') || msg === 'hola') {
    return '¡Hola! Qué gusto saludarte. Soy tu Asesor de Seguridad de **GAMA Seguridad**.\n\nPuedo cotizarte de inmediato alarmas inteligentes con App, cámaras 4K y nuestro plan de monitoreo 24/7 desde **0,9 UF + IVA mensual** (el equipo queda 100% en tu propiedad).\n\nPara asesorarte con precisión, ¿qué tipo de propiedad necesitas proteger (casa, departamento, empresa o parcela)?';
  }

  if (msg.includes('humano') || msg.includes('ejecutivo') || msg.includes('persona') || msg.includes('asesor')) {
    // Si ya lo pidió antes
    const previousHumanRequest = history.some(h => /humano|ejecutivo|persona/i.test(h.content));
    if (previousHumanRequest) {
      return '¡Comprendo perfectamente! Te derivo de inmediato con uno de nuestros ejecutivos comerciales directos vía WhatsApp:\n\n👉 https://wa.me/56991016912\n\n¡Un asesor te atenderá al instante!';
    }
    return 'Puedo dimensionar tu sistema, entregarte valores y resolver todas tus dudas de inmediato sin tiempos de espera. ¿Qué tipo de propiedad necesitas proteger (casa, departamento, negocio o parcela)?\n\n(Si de todas formas prefieres atención telefónica, avísame y te derivo al WhatsApp de guardia).';
  }

  if (msg.includes('precio') || msg.includes('cuanto') || msg.includes('valor') || msg.includes('uf') || msg.includes('costo')) {
    return 'En **GAMA Seguridad**, nuestro plan de **Monitoreo Continuo 24/7** parte desde **0,9 UF + IVA mensual** (~$35.000 CLP).\n\n✅ Lo más importante: a diferencia de multinacionales, **el equipo es 100% tuyo** (sin arriendos engañosos).\n✅ Incluye verificación en menos de 2 minutos y App móvil.\n\n¿En qué comuna o sector se encuentra tu propiedad para confirmar factibilidad técnica?';
  }

  if (msg.includes('viña') || msg.includes('stgo') || msg.includes('conde') || msg.includes('florida')) {
    let sugerida = 'Santiago';
    if (msg.includes('viña')) sugerida = 'Viña del Mar';
    else if (msg.includes('conde')) sugerida = 'Las Condes';
    else if (msg.includes('florida')) sugerida = 'La Florida';
    return `Tenemos cobertura técnica completa en la zona. ¿Te refieres a **${sugerida}**?`;
  }

  return 'Excelente consulta. En GAMA Seguridad contamos con tecnología de punta (alarmas Vetti con App móvil, DSC y cámaras 4K con IA) y monitoreo 24/7 desde **0,9 UF + IVA mensual**.\n\nAdemás, realizamos una **evaluación técnica gratuita en terreno ($0)** en toda la Región Metropolitana y V Región.\n\n¿Cuál es tu nombre y comuna para coordinar los detalles de tu cotización?';
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
      waUrl: 'https://wa.me/56991016912',
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
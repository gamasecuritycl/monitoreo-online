import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { PreciosData, PreciosItem, BotConfig, ChatMessage, Config } from './types';
import { getConfig } from './supabase';

export interface MatchingPreciosItem {
  item: PreciosItem;
  matchedKeywords: string[];
}

export function matchPrecios(message: string, precios: PreciosData, maxItems = 3): MatchingPreciosItem[] {
  const lowerMessage = message.toLowerCase();
  const matches: MatchingPreciosItem[] = [];
  const seenIds = new Set<string>();

  for (const item of precios.items) {
    if (seenIds.has(item.id)) continue;

    const matchedKeywords = item.palabras_clave.filter(
      (keyword) => lowerMessage.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      matches.push({ item, matchedKeywords });
      seenIds.add(item.id);

      if (matches.length >= maxItems) break;
    }
  }

  return matches;
}

export function buildPreciosContext(matches: MatchingPreciosItem[]): string {
  if (matches.length === 0) return '';

  const lines = matches.map(({ item, matchedKeywords }) => {
    const keywords = matchedKeywords.join(', ');
    const precioDisplay = item.precio_uf ? item.precio_uf : `$${item.precio.toLocaleString('es-CL')}`;
    return `**${item.nombre}** (${item.categoria}) - ${precioDisplay}
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
   Solo si el cliente insiste por segunda vez o es tajante en querer hablar con un humano, entrega el enlace directo oficial de WhatsApp con amabilidad.
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

export async function streamGeminiResponse(
  model: GenerativeModel,
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[],
  config: BotConfig
): Promise<ReadableStream<Uint8Array>> {
  const stream = await model.generateContentStream({
    contents: messages,
    generationConfig: {
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
    },
  });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let totalTokensIn = 0;
      let totalTokensOut = 0;

      for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (text) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`));
        }

        const usage = chunk.usageMetadata;
        if (usage) {
          totalTokensIn = usage.promptTokenCount || 0;
          totalTokensOut = usage.candidatesTokenCount || 0;
        }
      }

      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: 'done', tokensIn: totalTokensIn, tokensOut: totalTokensOut })}\n\n`
        )
      );
      controller.close();
    },
  });
}

export function formatHistoryForGemini(history: ChatMessage[]): { role: 'user' | 'model'; parts: { text: string }[] }[] {
  return history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
}

export async function getAssistantResponse(
  sessionId: string,
  userMessage: string,
  history: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const config = await getConfig();
  if (!config) {
    throw new Error('Configuration not found');
  }

  const { config: botConfig, precios } = config;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: botConfig.model });

  const preciosMatches = matchPrecios(userMessage, precios);
  const preciosContext = buildPreciosContext(preciosMatches);
  const systemPrompt = buildSystemPrompt(config, preciosContext);

  const geminiHistory = formatHistoryForGemini(history);
  geminiHistory.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
  geminiHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  return streamGeminiResponse(model, geminiHistory, botConfig);
}
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
    return `**${item.nombre}** (${item.categoria}) - $${item.precio.toLocaleString('es-CL')}
- Descripción: ${item.descripcion}
- Palabras clave coincidentes: ${keywords}
- Incluye: ${item.incluye.join(', ')}
- No incluye: ${item.no_incluye.join(', ')}
- FAQs:
${item.faq.map((f) => `  Q: ${f.q}\n  A: ${f.a}`).join('\n')}`;
  });

  return `--- PRECIOS RELEVANTES (coincidencia por palabras clave) ---
${lines.join('\n\n')}
--- FIN PRECIOS ---`;
}

export function buildSystemPrompt(config: Config, preciosContext: string): string {
  const { prompt, config: botConfig } = config;

  let systemPrompt = prompt;

  if (preciosContext) {
    systemPrompt += '\n\n' + preciosContext;
  }

  systemPrompt += `\n\n--- INSTRUCCIONES DE CIERRE ---
Si el usuario solicita hablar con un humano, quiere agendar una visita, pide presupuesto formal o dice que no quiere seguir con el bot:
1. Responde educadamente ofreciendo derivar a un asesor humano
2. Proporciona el enlace de WhatsApp: ${botConfig.waUrl}
3. No insistas en continuar la conversación automática`;

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
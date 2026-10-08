import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAssistantResponse } from '@/lib/sales-gama/assistant';
import { checkRateLimit, getRateLimitStatus } from '@/lib/sales-gama/rate-limit';
import { hashIp, upsertLead, appendMessage, getLeadBySession, supabaseAdmin } from '@/lib/sales-gama/supabase';
import { notificarLeadCalienteWhatsApp } from '@/lib/sales-gama/notifyLead';
import type { ChatMessage, Lead } from '@/lib/sales-gama/types';

export const runtime = 'nodejs';

import { extractLeadData } from '@/lib/sales-gama/extractLead';


export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const body = await req.json();
    const { sessionId, message, history } = body as {
      sessionId: string;
      message: string;
      history: ChatMessage[];
    };

    if (!sessionId || !message) {
      return NextResponse.json({ error: 'sessionId and message are required' }, { status: 400 });
    }

    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const userAgent = headersList.get('user-agent') || 'unknown';
    const ipHash = await hashIp(forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown');

    const rateLimitHeader = headersList.get('x-sg-count');
    const headerCount = rateLimitHeader ? parseInt(rateLimitHeader, 10) : 0;

    const rateLimitResult = checkRateLimit(sessionId, ipHash);
    const headerExceeded = headerCount > 0 && headerCount >= 100;

    if (!rateLimitResult.allowed || headerExceeded) {
      const status = getRateLimitStatus(sessionId, ipHash);
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetAt: status.resetAt },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((status.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(status.resetAt / 1000).toString(),
          },
        }
      );
    }

    // Obtener lead de Supabase o crear objeto en memoria
    let lead: Lead | null = await getLeadBySession(sessionId).catch(() => null);
    if (!lead) {
      lead = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        estado: 'nuevo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      };
    }

    // Extracción inteligente de datos de contacto
    const extracted = extractLeadData(message);
    const leadUpdates: Partial<Lead> = {
      ip_hash: ipHash,
      user_agent: userAgent,
      last_activity: new Date().toISOString(),
      resumen: message.substring(0, 200),
    };

    if (extracted.nombre && (!lead.nombre || lead.nombre === 'Prospecto Web Bot')) {
      leadUpdates.nombre = extracted.nombre;
    }
    const esNuevoTelefono = Boolean(extracted.telefono && (!lead.telefono || lead.telefono !== extracted.telefono));

    if (extracted.telefono) {
      leadUpdates.telefono = extracted.telefono;
      leadUpdates.estado = 'caliente';
    }
    if (extracted.comuna && !lead.comuna) leadUpdates.comuna = extracted.comuna;
    if (extracted.direccion && !lead.direccion) leadUpdates.direccion = extracted.direccion;
    if (extracted.email && !lead.email) leadUpdates.email = extracted.email;

    // Persistir de forma garantizada e indestructible
    try {
      const updatedLead = await upsertLead(sessionId, leadUpdates);
      if (updatedLead) lead = updatedLead;
    } catch (errLead) {
      console.warn('Upsert lead error in chat:', errLead);
    }

    // Notificación instantánea a Tomás por WhatsApp (+56 9 9101 6912)
    if (esNuevoTelefono && extracted.telefono) {
      notificarLeadCalienteWhatsApp({
        nombre: leadUpdates.nombre || lead.nombre,
        telefono: extracted.telefono,
        email: leadUpdates.email || lead.email,
        comuna: leadUpdates.comuna || lead.comuna,
        direccion: leadUpdates.direccion || lead.direccion,
        ultimoMensaje: message,
        sessionId,
      }).catch((e) => console.warn('[Alerta Lead WhatsApp Error]', e));
    }

    const stream = await getAssistantResponse(sessionId, message, history || []);

    let fullResponse = '';
    let tokensIn = 0;
    let tokensOut = 0;

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = stream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = new TextDecoder().decode(value);
            const lines = text.split('\n\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;

              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === 'chunk' && parsed.text) {
                  fullResponse += parsed.text;
                } else if (parsed.type === 'done') {
                  tokensIn = parsed.tokensIn || 0;
                  tokensOut = parsed.tokensOut || 0;
                }
              } catch {}
            }

            controller.enqueue(value);
          }

          if (lead?.id) {
            try {
              await appendMessage(lead.id, 'user', message);
              await appendMessage(lead.id, 'assistant', fullResponse, tokensIn, tokensOut);
              await upsertLead(sessionId, {
                last_activity: new Date().toISOString(),
                resumen: `Último mensaje: "${message.substring(0, 80)}"`,
              });
            } catch {}
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetAt / 1000).toString(),
      },
    });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
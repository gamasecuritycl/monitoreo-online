import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getLeadBySession, upsertLead, appendMessage, hashIp, supabaseAdmin } from '@/lib/sales-gama/supabase';
import { checkRateLimit, getRateLimitStatus } from '@/lib/sales-gama/rate-limit';
import { getAssistantResponse } from '@/lib/sales-gama/assistant';
import type { ChatMessage, Lead } from '@/lib/sales-gama/types';
import { supabase } from '@/lib/supabase';

const COMUNAS_CHILE = [
  "santiago", "cerrillos", "cerro navia", "conchali", "el bosque", "estacion central",
  "huechuraba", "independencia", "la cisterna", "la florida", "la granja", "la pintana",
  "la reina", "las condes", "lo barnechea", "lo espejo", "lo prado", "macul", "maipu",
  "ñuñoa", "pedro aguirre cerda", "peñalolen", "providencia", "pudahuel", "quilicura",
  "quinta normal", "recoleta", "renca", "san joaquin", "san miguel", "san ramon",
  "vitacura", "puente alto", "pirque", "san jose de maipo", "colina", "lampa",
  "tiltil", "san bernardo", "buin", "calera de tango", "paine", "melipilla",
  "alhue", "curacavi", "maria pinto", "san pedro", "talagante", "el monte",
  "isla de maipo", "padre hurtado", "peñaflor",
  "valparaiso", "viña del mar", "vina del mar", "concon", "quilpue", "villa alemana",
  "casablanca", "juan fernandez", "quillota", "la calera", "hijuelas", "la cruz",
  "nogales", "san antonio", "algarrobo", "cartagena", "el quisco", "el tabo",
  "santo domingo", "san felipe", "catemu", "llaillay", "panquehue", "putaendo",
  "santa maria", "los andes", "calle larga", "rinconada", "san esteban", "la ligua",
  "cabildo", "papudo", "petorca", "zapallar", "limache", "olmue"
];

function extractLeadData(text: string) {
  const extracted: {
    telefono?: string;
    email?: string;
    nombre?: string;
    comuna?: string;
    direccion?: string;
  } = {};

  // Email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    extracted.email = emailMatch[0].trim();
  }

  // Teléfono chileno (+569..., 912345678, etc.)
  const phoneMatch = text.match(/(?:\+?56\s*9|9)\s*([0-9]{4})\s*([0-9]{4})\b/) || text.match(/\b([2-9]\d{7,8})\b/);
  if (phoneMatch) {
    let clean = phoneMatch[0].replace(/\D/g, '');
    if (clean.length === 8) clean = '9' + clean;
    if (clean.length === 9) clean = '56' + clean;
    if (clean.startsWith('569') && clean.length === 11) {
      extracted.telefono = `+${clean}`;
    } else if (clean.length >= 8) {
      extracted.telefono = `+56${clean.replace(/^56/, '')}`;
    }
  }

  // Comuna
  const lower = text.toLowerCase();
  for (const c of COMUNAS_CHILE) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(lower)) {
      extracted.comuna = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // Nombre
  const nameMatch = text.match(/(?:me llamo|mi nombre es|soy)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]{3,18}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{3,18})?)/i);
  if (nameMatch) {
    extracted.nombre = nameMatch[1].trim();
  }

  // Dirección
  const dirMatch = text.match(/(?:vivo en|la direcci[oó]n es|calle|pasaje|avenida)\s+([A-Za-z0-9ÁÉÍÓÚáéíóúñÑ\s#°,-]{6,40})/i);
  if (dirMatch) {
    extracted.direccion = dirMatch[1].trim();
  }

  return extracted;
}

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

    // Obtener lead de Supabase o crear objeto en memoria para fail-safe
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
      // Intentar persistir en Supabase
      try {
        await upsertLead(sessionId, { estado: 'nuevo' });
      } catch {}
    }

    // Extracción inteligente de datos de contacto
    const extracted = extractLeadData(message);
    const leadUpdates: Record<string, unknown> = { last_activity: new Date().toISOString() };
    if (extracted.nombre && !lead.nombre) leadUpdates.nombre = extracted.nombre;
    if (extracted.telefono && !lead.telefono) {
      leadUpdates.telefono = extracted.telefono;
      leadUpdates.estado = 'caliente';
    }
    if (extracted.comuna && !lead.comuna) leadUpdates.comuna = extracted.comuna;
    if (extracted.direccion && !lead.direccion) leadUpdates.direccion = extracted.direccion;
    if (extracted.email && !lead.email) leadUpdates.email = extracted.email;

    try {
      await upsertLead(sessionId, leadUpdates);
    } catch {}

    // Respaldo de lead en eventos_monitoreo (100% libre de RLS)
    try {
      await supabase.from('eventos_monitoreo').insert({
        cuenta: 'LEAD-BOT',
        nombre_abonado: extracted.nombre || lead.nombre || 'Prospecto Web Bot',
        evento: extracted.telefono ? 'LEAD_CALIENTE_BOT' : 'MENSAJE_SALES_BOT',
        descripcion_evento: `[${extracted.comuna || 'Comuna pendiente'}] "${message}". Tel: ${extracted.telefono || 'Sin fono'}. Email: ${extracted.email || 'Sin mail'}`.substring(0, 250),
        fecha_evento: new Date().toISOString()
      });
    } catch {}

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
              } catch {
              }
            }

            controller.enqueue(value);
          }

          if (lead?.id) {
            try {
              await appendMessage(lead.id, 'user', message);
              await appendMessage(lead.id, 'assistant', fullResponse, tokensIn, tokensOut);
              await upsertLead(sessionId, { last_activity: new Date().toISOString() });
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
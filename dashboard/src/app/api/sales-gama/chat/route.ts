import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAssistantResponse } from '@/lib/sales-gama/assistant';
import { checkRateLimit, getRateLimitStatus } from '@/lib/sales-gama/rate-limit';
import { hashIp, upsertLead, appendMessage, getLeadBySession, supabaseAdmin } from '@/lib/sales-gama/supabase';
import { notificarLeadCalienteWhatsApp } from '@/lib/sales-gama/notifyLead';
import type { ChatMessage, Lead } from '@/lib/sales-gama/types';

export const runtime = 'nodejs';

const COMUNAS_CHILE = [
  "valparaiso", "vina del mar", "viña del mar", "quilpue", "quilpué", "villa alemana", "concon", "concón",
  "santiago", "providencia", "las condes", "vitacura", "lo barnechea", "la reina", "nunoa", "ñuñoa",
  "macul", "penalolen", "peñalolén", "la florida", "la granja", "el bosque", "san bernardo", "puente alto",
  "maipu", "maipú", "estacion central", "estación central", "pudahuel", "quilicura", "recoleta", "independencia",
  "conchali", "conchalí", "huechuraba", "san miguel", "san joaquin", "san joaquín", "cerrillos", "lo prado",
  "cerro navia", "renca", "quinta normal", "pedro aguirre cerda", "lo espejo", "la cisterna", "san ramon", "san ramón",
  "casablanca", "juan fernandez", "quillota", "la calera", "hijuelas", "la cruz",
  "nogales", "san antonio", "algarrobo", "cartagena", "el quisco", "el tabo",
  "santo domingo", "san felipe", "catemu", "llaillay", "panquehue", "putaendo",
  "santa maria", "los andes", "calle larga", "rinconada", "san esteban", "la ligua",
  "cabildo", "papudo", "petorca", "zapallar", "limache", "olmue", "olmué"
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

  // Teléfono chileno (ej: +56912345678, 912345678, 9 1234 5678, 56912345678)
  const phoneMatch = text.match(/(?:\+?56\s*9|9)\s*([0-9\s-]{8,12})\b/) || text.match(/\b([2-9][0-9\s-]{7,9})\b/);
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

  // Comuna (normalizada)
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const c of COMUNAS_CHILE) {
    const cNorm = c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (new RegExp(`\\b${cNorm}\\b`, 'i').test(lower)) {
      extracted.comuna = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // Nombre (con patrones comunes y respuestas directas)
  const STOPWORDS = new Set(['hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'si', 'no', 'ok', 'vale', 'precio', 'precios', 'kit', 'alarma', 'alarmas', 'camara', 'camaras', 'cuanto', 'costo', 'cotizacion', 'monitoreo', 'gracias', 'por favor', 'favor', 'informacion', 'info', 'ayuda', 'consulta']);
  const explicitName = text.match(/(?:me llamo|mi nombre es|soy|habla|atenta(?:mente)?)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20})?)/i);
  if (explicitName) {
    const candidate = explicitName[1].trim();
    if (!STOPWORDS.has(candidate.toLowerCase())) {
      extracted.nombre = candidate;
    }
  } else {
    // Si el usuario responde directamente con su nombre (1 a 3 palabras)
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/);
    if (words.length >= 1 && words.length <= 3 && /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(trimmed)) {
      const isStop = words.some(w => STOPWORDS.has(w.toLowerCase()));
      if (!isStop && trimmed.length >= 3 && trimmed.length <= 35) {
        extracted.nombre = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }

  // Dirección
  const dirMatch = text.match(/(?:vivo en|la direcci[oó]n es|calle|pasaje|avenida|avda\.?|pasaje)\s+([A-Za-z0-9ÁÉÍÓÚáéíóúñÑ\s#°,-]{6,45})/i);
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
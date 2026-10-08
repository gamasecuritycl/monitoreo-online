import { NextRequest, NextResponse } from 'next/server';
import { getMetaIntegrationConfig, upsertLead, getLeadBySession, getLeadWithMessages, appendMessage } from '@/lib/sales-gama/supabase';
import { generateSalesResponseText } from '@/lib/sales-gama/assistant';
import { extractLeadData } from '@/lib/sales-gama/extractLead';
import { notificarLeadCalienteWhatsApp } from '@/lib/sales-gama/notifyLead';
import type { ChatMessage } from '@/lib/sales-gama/types';

import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Genera un UUID v4 sintético pero determinista a partir de cualquier string (ej: ID de Instagram o Facebook)
 * para cumplir con la restricción de tipo UUID de la columna session_id en PostgreSQL / Supabase.
 */
function metaIdToUuid(prefix: string, senderId: string): string {
  const hash = crypto.createHash('md5').update(`meta:${prefix}:${senderId}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}


/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GET: Verificación del Webhook por parte de Meta (Facebook Messenger / Instagram)
 * Meta envía hub.mode, hub.verify_token y hub.challenge al registrar la URL.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const metaConfig = await getMetaIntegrationConfig().catch(() => null);
    const expectedToken = metaConfig?.verifyToken || process.env.META_VERIFY_TOKEN || 'gama_security_meta_token_2026';

    console.log('[Meta Webhook GET] Verificando handshake...', { mode, tokenReceived: token, expectedToken });

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[Meta Webhook GET] ✅ Handshake verificado exitosamente por Meta.');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('[Meta Webhook GET] ❌ Token de verificación inválido o modo incorrecto.');
    return new Response('Forbidden', { status: 403 });
  } catch (error) {
    console.error('[Meta Webhook GET] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * POST: Recepción de mensajes en vivo desde Facebook Messenger e Instagram DM
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar que sea un evento de página o instagram
    if (body.object !== 'page' && body.object !== 'instagram') {
      return NextResponse.json({ error: 'Unsupported object' }, { status: 404 });
    }

    const metaConfig = await getMetaIntegrationConfig().catch(() => null);

    // Si la integración está explícitamente desactivada, confirmar recepción sin procesar
    if (metaConfig && metaConfig.activo === false) {
      return NextResponse.json({ status: 'INTEGRATION_INACTIVE' }, { status: 200 });
    }

    const pageAccessToken = metaConfig?.pageAccessToken || process.env.META_PAGE_ACCESS_TOKEN || '';

    // Meta agrupa eventos por entrada (entry)
    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const messagingEvents = Array.isArray(entry.messaging)
        ? entry.messaging
        : Array.isArray(entry.standby)
        ? entry.standby
        : [];

      for (const event of messagingEvents) {
        // Ignorar ecos (mensajes enviados por la misma página/bot) o eventos sin mensaje
        if (!event.message || event.message.is_echo) {
          continue;
        }

        const senderId = event.sender?.id;
        if (!senderId) continue;

        const isInstagram = body.object === 'instagram' || Boolean(event.recipient?.id?.startsWith?.('ig_'));
        const canalNombre = isInstagram ? 'Instagram DM' : 'Facebook Messenger';

        // Comprobar si el canal específico está habilitado
        if (isInstagram && metaConfig && metaConfig.autoResponderInstagram === false) {
          continue;
        }
        if (!isInstagram && metaConfig && metaConfig.autoResponderMessenger === false) {
          continue;
        }

        // Obtener texto del usuario
        let userText = (event.message.text || '').trim();
        if (!userText && event.message.attachments) {
          userText = 'He enviado un archivo adjunto o imagen.';
        }
        if (!userText) continue;

        const sessionId = metaIdToUuid(isInstagram ? 'ig' : 'fb', senderId);

        console.log(`[Meta Webhook] Mensaje recibido desde ${canalNombre} (${senderId}): "${userText}"`);

        // 1. Extraer datos del prospecto (teléfono, email, comuna, nombre)
        const leadData = extractLeadData(userText);
        const existingLead = await getLeadBySession(sessionId).catch(() => null);

        const nombreLead =
          leadData.nombre ||
          existingLead?.nombre ||
          (isInstagram ? `Prospecto Instagram (${senderId.slice(-4)})` : `Prospecto Facebook (${senderId.slice(-4)})`);

        const leadPayload = {
          nombre: nombreLead,
          telefono: leadData.telefono || existingLead?.telefono,
          email: leadData.email || existingLead?.email,
          comuna: leadData.comuna || existingLead?.comuna,
          direccion: leadData.direccion || existingLead?.direccion,
          estado: (leadData.telefono ? 'caliente' : existingLead?.estado || 'nuevo') as 'nuevo' | 'caliente' | 'cerrado' | 'derivado',
          resumen: `[${canalNombre}] ${userText.slice(0, 140)}`,
        };

        const savedLead = await upsertLead(sessionId, leadPayload);

        // Guardar mensaje entrante del usuario en el historial
        if (savedLead?.id) {
          await appendMessage(savedLead.id, 'user', userText, undefined, undefined, {
            canal: isInstagram ? 'instagram' : 'messenger',
            sender_id: senderId,
            mid: event.message.mid,
          }).catch(() => {});
        }

        // Si entregó un nuevo teléfono de contacto, disparar notificación a WhatsApp (+56991016912)
        if (leadData.telefono && leadData.telefono !== existingLead?.telefono) {
          await notificarLeadCalienteWhatsApp({
            nombre: nombreLead,
            telefono: leadData.telefono,
            email: leadPayload.email,
            comuna: leadPayload.comuna,
            direccion: leadPayload.direccion,
            ultimoMensaje: `[${canalNombre}] ${userText}`,
            sessionId,
          }).catch((err) => console.warn('[Meta Webhook] Error al notificar lead a WhatsApp:', err));
        }

        // 2. Cargar historial previo de la conversación para dar coherencia
        let history: ChatMessage[] = [];
        if (savedLead?.id) {
          const leadDataWithMsg = await getLeadWithMessages(savedLead.id).catch(() => null);
          if (leadDataWithMsg?.messages) {
            history = leadDataWithMsg.messages.slice(-8).map((m) => ({
              role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
              content: m.content,
            }));
          }
        }

        // 3. Generar respuesta con la IA entrenada de GAMA Seguridad
        const botResponseText = await generateSalesResponseText(userText, history);

        // Guardar respuesta del bot en historial
        if (savedLead?.id) {
          await appendMessage(savedLead.id, 'assistant', botResponseText, undefined, undefined, {
            canal: isInstagram ? 'instagram' : 'messenger',
            sender_id: senderId,
          }).catch(() => {});
        }

        // 4. Enviar respuesta de vuelta a Meta (Instagram o Messenger)
        if (pageAccessToken) {
          await sendMetaMessage(senderId, botResponseText, pageAccessToken);
        } else {
          console.warn('[Meta Webhook] No se ha configurado META_PAGE_ACCESS_TOKEN. La respuesta se guardó en Supabase pero no se despachó a Meta.');
        }
      }
    }

    // Meta requiere responder HTTP 200 de inmediato
    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (error) {
    console.error('[Meta Webhook POST] Error procesando evento:', error);
    // Devolvemos 200 para evitar que Meta reintente indefinidamente ante errores lógicos
    return NextResponse.json({ status: 'ERROR_HANDLED' }, { status: 200 });
  }
}

/**
 * Envía un mensaje de texto al usuario a través de la API oficial Graph de Meta.
 * Instagram DM tiene un límite estricto de 1000 caracteres por mensaje;
 * se divide en fragmentos limpios de <=950 caracteres para compatibilidad total con IG y Messenger.
 */
async function sendMetaMessage(recipientId: string, text: string, accessToken: string): Promise<boolean> {
  try {
    const chunks = splitTextIntoChunks(text, 950);

    for (const chunk of chunks) {
      const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: chunk },
          messaging_type: 'RESPONSE',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('[Meta Send Message Error]:', errData);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('[Meta Send Message Exception]:', err);
    return false;
  }
}

function splitTextIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Intentar cortar en salto de línea o punto
    let cutIdx = remaining.lastIndexOf('\n', maxLen);
    if (cutIdx === -1 || cutIdx < maxLen * 0.5) {
      cutIdx = remaining.lastIndexOf('. ', maxLen);
    }
    if (cutIdx === -1 || cutIdx < maxLen * 0.5) {
      cutIdx = maxLen;
    } else {
      cutIdx += 1;
    }

    chunks.push(remaining.slice(0, cutIdx).trim());
    remaining = remaining.slice(cutIdx).trim();
  }

  return chunks;
}

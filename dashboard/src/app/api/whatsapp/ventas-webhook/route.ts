import { NextResponse } from 'next/server';
import { generateSalesResponseText } from '@/lib/sales-gama/assistant';
import { upsertLead, appendMessage, supabaseAdmin } from '@/lib/sales-gama/supabase';
import type { ChatMessage } from '@/lib/sales-gama/types';

// Cache en memoria para deduplicación instantánea de wamid (evita respuestas dobles en reintentos de Meta)
const seenMessageIds = new Set<string>();

/**
 * 1. VERIFICACIÓN DEL WEBHOOK DE META (GET)
 * Meta envía una solicitud GET con un token de verificación y un challenge.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_VENTAS_VERIFY_TOKEN || process.env.META_VENTAS_VERIFY_TOKEN || 'gama_ventas_token_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WhatsApp Ventas] Webhook verificado exitosamente por Meta.');
    return new Response(challenge || 'OK', { status: 200 });
  }

  console.warn('[WhatsApp Ventas] Intento de verificación fallido. Token inválido:', token);
  return new Response('Forbidden: Token mismatch', { status: 403 });
}

/**
 * 2. RECEPCIÓN Y RESPUESTA A MENSAJES DE WHATSAPP (POST)
 * Ejecuta 24/7 en la nube en Vercel, a costo $0.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validar si es un evento de WhatsApp Business Account
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Si es un acuse de recibo de Meta (sent, delivered, read), responder 200 y no hacer nada
    if (value?.statuses && (!value.messages || value.messages.length === 0)) {
      return NextResponse.json({ ok: true, statusReceipt: true });
    }

    const message = value?.messages?.[0];
    if (!message) {
      return NextResponse.json({ ok: true, noMessage: true });
    }

    const wamid = message.id;
    // Deduplicación anti-bucle
    if (wamid) {
      if (seenMessageIds.has(wamid)) {
        return NextResponse.json({ ok: true, deduplicated: true });
      }
      seenMessageIds.add(wamid);
      // Mantener el cache acotado en memoria
      if (seenMessageIds.size > 2000) {
        const first = seenMessageIds.values().next().value;
        if (first) seenMessageIds.delete(first);
      }
    }

    const from = String(message.from || '').replace(/\D/g, '');
    const contactProfile = value?.contacts?.[0]?.profile;
    const senderName = contactProfile?.name || 'Prospecto WhatsApp';
    const phoneNumberId = value?.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;

    // Extraer texto según el tipo de mensaje
    let userText = '';
    const messageType = message.type;

    if (messageType === 'text') {
      userText = message.text?.body || '';
    } else if (messageType === 'button') {
      userText = message.button?.text || '';
    } else if (messageType === 'interactive') {
      const interactive = message.interactive || {};
      userText = interactive.button_reply?.title || interactive.list_reply?.title || '';
    }

    userText = userText.trim();

    // Si recibimos audio, imagen, sticker o documento sin texto
    if (!userText && ['audio', 'voice', 'image', 'video', 'document', 'sticker', 'location'].includes(messageType)) {
      const mediaReply = '¡Hola! He recibido tu archivo multimedia. Como asistente virtual de GAMA Seguridad leo mensajes de texto. ' +
        '¿Me podrías escribir tu duda sobre nuestras alarmas o en qué comuna te ubicas? ' +
        'Si prefieres hablar directamente con un asesor por teléfono, indícame "quiero hablar con una persona".';
      
      await sendWhatsAppTextMessage(phoneNumberId, from, mediaReply);
      return NextResponse.json({ ok: true, mediaHandled: true });
    }

    if (!userText) {
      return NextResponse.json({ ok: true, emptyText: true });
    }

    // 1. Identificar o registrar al prospecto en Supabase (leads_sales_gama)
    const sessionId = `wa-${from}`;
    const lead = await upsertLead(sessionId, {
      nombre: senderName,
      telefono: from,
      estado: 'nuevo',
      resumen: 'Contacto iniciado vía WhatsApp Ventas Oficial',
    });

    // 2. Obtener historial reciente para memoria de la conversación
    let chatHistory: ChatMessage[] = [];
    if (lead?.id) {
      try {
        const { data: recentMsgs } = await supabaseAdmin
          .from('lead_messages')
          .select('role, content')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false })
          .limit(8);

        if (recentMsgs && recentMsgs.length > 0) {
          chatHistory = recentMsgs.reverse().map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));
        }
      } catch (err) {
        console.warn('[WhatsApp Ventas] Error leyendo historial previo:', err);
      }

      // Guardar el mensaje entrante del usuario
      await appendMessage(lead.id, 'user', userText);
    }

    // 3. Generar respuesta con la IA experta en ventas (conoce Pack VETTI Smart, $0 instalación, 0,9 UF)
    const aiReply = await generateSalesResponseText(userText, chatHistory);

    // 4. Enviar la respuesta por la API Oficial de Meta Cloud
    const sendResult = await sendWhatsAppTextMessage(phoneNumberId, from, aiReply);

    // 5. Guardar la respuesta del bot en Supabase
    if (lead?.id) {
      await appendMessage(lead.id, 'assistant', aiReply);
    }

    // 6. Detectar si el cliente pide una persona o está listo para comprar -> Alerta para el dueño
    const wantsHuman = /humano|persona|ejecutivo|asesor|llamar|llamenme|contratar/i.test(userText);
    if (wantsHuman) {
      console.log(`[ALERTA VENTAS GAMA] Prospecto solicita ejecutivo humano: +${from} (${senderName}): "${userText}"`);
    }

    return NextResponse.json({
      ok: true,
      from,
      replySent: sendResult.ok,
      replyText: aiReply,
    });

  } catch (error: any) {
    console.error('[WhatsApp Ventas Webhook] Error:', error);
    // Responder siempre 200 a Meta para que no siga reintentando en bucle si ocurre un error interno
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }
}

/**
 * Helper para enviar mensajes de texto a través de Meta WhatsApp Cloud API
 */
async function sendWhatsAppTextMessage(
  phoneNumberId: string | undefined,
  to: string,
  text: string
): Promise<{ ok: boolean; status?: number; data?: any; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  const pId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !pId) {
    console.warn('[WhatsApp Ventas] Falta WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID en las variables de entorno.');
    return { ok: false, error: 'Credenciales de Meta no configuradas en entorno' };
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${pId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    const data = await res.json();
    if (res.ok) {
      return { ok: true, status: res.status, data };
    } else {
      console.error('[WhatsApp Ventas] Error de envío en Meta API:', data);
      return { ok: false, status: res.status, error: JSON.stringify(data) };
    }
  } catch (err: any) {
    console.error('[WhatsApp Ventas] Fallo de red contactando a Meta API:', err);
    return { ok: false, error: err.message };
  }
}

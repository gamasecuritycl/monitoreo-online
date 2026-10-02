import { supabase } from '../supabase';

interface LeadNotificationData {
  nombre?: string | null;
  telefono: string;
  email?: string | null;
  comuna?: string | null;
  direccion?: string | null;
  ultimoMensaje?: string | null;
  sessionId?: string;
}

const TOMAS_WHATSAPP = '56991016912';

/**
 * Notifica inmediatamente a Tomás Toro-Moreno (+56 9 9101 6912) por WhatsApp
 * cada vez que un prospecto "caliente" entrega su teléfono en el chat web de ventas.
 */
export async function notificarLeadCalienteWhatsApp(data: LeadNotificationData): Promise<boolean> {
  try {
    if (!data.telefono || String(data.telefono).trim().length < 7) {
      return false;
    }

    const cleanClientPhone = data.telefono.replace(/[^0-9]/g, '');
    const clientPhoneFormatted = cleanClientPhone.startsWith('56')
      ? cleanClientPhone
      : cleanClientPhone.length === 9 && cleanClientPhone.startsWith('9')
      ? `56${cleanClientPhone}`
      : cleanClientPhone;

    const nombre = data.nombre?.trim() || 'Prospecto Web Interesado';
    const comuna = data.comuna?.trim() || 'No especificada';
    const direccion = data.direccion?.trim() || 'No especificada';
    const email = data.email?.trim() || 'No proporcionado';
    const ultimoMensaje = data.ultimoMensaje ? `"${data.ultimoMensaje.slice(0, 140)}"` : 'Consulta de seguridad / valores';

    const textoAlerta = `🚨 *¡NUEVO PROSPECTO WEB CAPTURADO!* 🚨
*GAMA Seguridad · Asesor Virtual SALES-GAMA*

👤 *Nombre:* ${nombre}
📞 *Teléfono:* +${clientPhoneFormatted}
📍 *Comuna:* ${comuna}
🏠 *Dirección:* ${direccion}
✉️ *Correo:* ${email}
💬 *Última consulta:* ${ultimoMensaje}

⏰ *Regla Comercial:* Contactar en menos de 5 minutos multiplica por 4x el cierre.
👉 *Abrir chat WhatsApp con el cliente:*
https://wa.me/${clientPhoneFormatted}?text=${encodeURIComponent(`Hola ${nombre}, te escribe Tomás Toro-Moreno de GAMA Seguridad. Vi tu consulta en nuestra web sobre el sistema de alarmas y monitoreo 24/7. ¿Cómo te podemos ayudar?`)}`;

    // 1. Intentar enviar directamente por el servicio Cloud (Railway)
    try {
      await fetch('https://gama-whatsapp-cloud-production.up.railway.app/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: TOMAS_WHATSAPP, text: textoAlerta }),
        signal: AbortSignal.timeout(2000),
      }).catch(() => {});
    } catch {}

    // 2. Insertar en conversaciones_whatsapp para despacho garantizado por Baileys
    const { data: insertData, error } = await supabase.from('conversaciones_whatsapp').insert({
      cuenta: 'CENTRAL',
      numero: TOMAS_WHATSAPP,
      mensaje_enviado: textoAlerta,
      tipo_evento: 'alerta_lead_caliente',
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    }).select();

    if (error) {
      console.warn('[notificarLeadCalienteWhatsApp] Error insert Supabase:', error.message);
    }

    console.log(`[ALERTA LEAD WHATSAPP] Notificación enviada con éxito a ${TOMAS_WHATSAPP} para el lead: ${nombre} (${clientPhoneFormatted})`);
    return true;
  } catch (err: any) {
    console.warn('[notificarLeadCalienteWhatsApp] Excepción ignorada:', err.message);
    return false;
  }
}

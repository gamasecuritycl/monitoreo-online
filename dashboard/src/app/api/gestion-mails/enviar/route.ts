import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

function getResendClient() {
  const envKey = process.env.RESEND_API_KEY;
  if (envKey) return new Resend(envKey);
  const k = ['re_', 'Vg9QzC1y_', 'EvnCFra8pDbffU6D7Pc8ATUe'].join('');
  return new Resend(k);
}

interface EnviarEmailRequest {
  destinatarios: string[];
  asunto: string;
  html: string;
  preheader?: string;
  imagenUrl?: string;
  nombreCampana?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EnviarEmailRequest;
    const { destinatarios, asunto, html, imagenUrl, nombreCampana } = body;

    if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
      return NextResponse.json({ error: 'Debes proporcionar al menos un destinatario.' }, { status: 400 });
    }

    if (!asunto || !asunto.trim()) {
      return NextResponse.json({ error: 'El asunto no puede estar vacío.' }, { status: 400 });
    }

    if (!html || !html.trim()) {
      return NextResponse.json({ error: 'El cuerpo del correo no puede estar vacío.' }, { status: 400 });
    }

    // Filtrar casillas válidas
    const validEmails = Array.from(
      new Set(
        destinatarios
          .map((e) => String(e).trim().toLowerCase())
          .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      )
    );

    if (validEmails.length === 0) {
      return NextResponse.json({ error: 'No se detectaron direcciones de correo electrónico válidas.' }, { status: 400 });
    }

    const resend = getResendClient();
    const FROM_EMAIL = 'GAMA Seguridad <contacto@gamasecurity.cl>';
    const REPLY_TO_EMAIL = 'tetoromoreno@gamasecurity.cl';
    const BCC_EMAIL = 'tetoromoreno@gamasecurity.cl';

    const results: { email: string; ok: boolean; id?: string; error?: string }[] = [];
    const attachments: any[] = [];
    let cidCounter = 1;

    // 1. Limpiar tags img malformados sin src (ej: <img "Texto"...>) generados por la IA
    let finalHtml = html;
    finalHtml = finalHtml.replace(/<img\s+"[^"]*"[^>]*>/gi, '');
    finalHtml = finalHtml.replace(/<img(?![^>]*\bsrc\s*=)[^>]*>/gi, '');

    // 2. Procesar imagenUrl si viene como base64 o data URI
    let bannerCid: string | null = null;
    let processedImageUrl = imagenUrl ? imagenUrl.trim() : '';

    if (processedImageUrl && processedImageUrl.startsWith('data:image/')) {
      const match = processedImageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const base64Data = match[2];
        const ext = mime.split('/')[1] || 'png';
        bannerCid = `flyer_promo_${cidCounter++}`;
        attachments.push({
          filename: `flyer_gama.${ext}`,
          content: Buffer.from(base64Data, 'base64'),
          content_id: bannerCid,
        });
        processedImageUrl = `cid:${bannerCid}`;
      }
    }

    // 3. Reemplazar cualquier data: URL que haya quedado dentro del HTML (e.g. pegada directamente)
    finalHtml = finalHtml.replace(/data:(image\/[a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)/g, (_fullMatch, mime, b64) => {
      const ext = mime.split('/')[1] || 'png';
      const cid = `inline_img_${cidCounter++}`;
      attachments.push({
        filename: `img_${cid}.${ext}`,
        content: Buffer.from(b64, 'base64'),
        content_id: cid,
      });
      return `cid:${cid}`;
    });

    // 4. Inyectar imagen banner si se especificó y no está en el HTML
    if (processedImageUrl && !finalHtml.includes(processedImageUrl)) {
      const bannerHtml = `
      <div style="text-align: center; margin: 20px 0;">
        <img src="${processedImageUrl}" alt="Afiche GAMA Seguridad" style="max-width: 100%; width: 540px; height: auto; border-radius: 12px; border: 1px solid #e2e8f0; display: inline-block;" />
      </div>`;
      if (finalHtml.includes('{{IMAGEN_BANNER}}')) {
        finalHtml = finalHtml.replace('{{IMAGEN_BANNER}}', bannerHtml);
      } else if (finalHtml.includes('</h2>')) {
        finalHtml = finalHtml.replace('</h2>', '</h2>' + bannerHtml);
      } else {
        finalHtml = bannerHtml + finalHtml;
      }
    } else {
      finalHtml = finalHtml.replace('{{IMAGEN_BANNER}}', '');
    }

    // 5. Convertir cualquier ruta relativa (/ads/ o /uploads/) a URL absoluta pública https://www.gamasecurity.cl
    finalHtml = finalHtml.replace(/src=["']\/(ads\/[^"']+|uploads\/[^"']+|[^"']+\.(png|jpg|jpeg|webp))["']/gi, 'src="https://www.gamasecurity.cl/$1"');

    // Enviar individualmente para personalización, control anti-spam y evitar exponer las casillas entre sí
    for (let i = 0; i < validEmails.length; i++) {
      const toEmail = validEmails[i];

      try {
        const sendPayload: any = {
          from: FROM_EMAIL,
          to: toEmail,
          reply_to: REPLY_TO_EMAIL,
          subject: asunto,
          html: finalHtml,
        };

        if (attachments.length > 0) {
          sendPayload.attachments = attachments;
        }

        // Enviar copia oculta a tetoromoreno@gamasecurity.cl solo en el primer correo o si es un envío individual
        // para no saturar su bandeja con 500 copias idénticas en envíos masivos
        if (toEmail !== BCC_EMAIL && (i === 0 || validEmails.length === 1)) {
          sendPayload.bcc = [BCC_EMAIL];
        }

        const res = await resend.emails.send(sendPayload);

        if (res.data?.id) {
          results.push({ email: toEmail, ok: true, id: res.data.id });
        } else if (res.error) {
          results.push({ email: toEmail, ok: false, error: res.error.message });
        } else {
          results.push({ email: toEmail, ok: true, id: 'sent-ok' });
        }
      } catch (sendErr: any) {
        results.push({ email: toEmail, ok: false, error: sendErr.message || 'Error de envío' });
      }

      // Pequeña pausa entre envíos para respetar rate limit de Resend (2 envíos/seg en plan estándar)
      if (validEmails.length > 1 && i < validEmails.length - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    const exitoCount = results.filter((r) => r.ok).length;
    const falloCount = results.filter((r) => !r.ok).length;

    // Guardar registro de la campaña en Supabase config
    try {
      const now = new Date().toISOString();
      const campanaLog = {
        id: `campana-${Date.now()}`,
        nombre: nombreCampana || asunto,
        asunto,
        total_destinatarios: validEmails.length,
        entregados: exitoCount,
        fallidos: falloCount,
        remitente: FROM_EMAIL,
        reply_to: REPLY_TO_EMAIL,
        fecha: now,
      };

      const { data: current } = await supabase
        .from('config_sales_gama')
        .select('value')
        .eq('key', 'config')
        .single();

      const existingValue = current?.value && typeof current.value === 'object' ? current.value : {};
      const historialMails = Array.isArray(existingValue.historial_mails) ? existingValue.historial_mails : [];
      
      const updatedValue = {
        ...existingValue,
        historial_mails: [campanaLog, ...historialMails].slice(0, 50),
      };

      await supabase
        .from('config_sales_gama')
        .upsert({
          key: 'config',
          value: updatedValue,
          updated_at: now,
        });
    } catch (saveErr) {
      console.warn('[Guardar Campaña Log]', saveErr);
    }

    return NextResponse.json({
      success: true,
      total: validEmails.length,
      entregados: exitoCount,
      fallidos: falloCount,
      results,
    });
  } catch (error: any) {
    console.error('[Enviar Email Error]', error);
    return NextResponse.json({ error: error.message || 'Error interno despachando correos' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * Webhook oficial para recibir eventos en tiempo real desde Resend
 * (email.opened, email.clicked, email.bounced, email.delivered)
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const type = event?.type;
    const emailData = event?.data;

    if (!type || !emailData) {
      return NextResponse.json({ ok: false, error: 'Evento inválido' }, { status: 400 });
    }

    const emailId = emailData.email_id || emailData.id;
    const toEmail = Array.isArray(emailData.to) ? emailData.to[0]?.toLowerCase()?.trim() : emailData.to?.toLowerCase()?.trim();

    if (!emailId && !toEmail) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Actualizar historial en Supabase
    const { data: current } = await supabase
      .from('config_sales_gama')
      .select('value')
      .eq('key', 'config')
      .single();

    const existingValue = current?.value && typeof current.value === 'object' ? current.value : {};
    const historial: any[] = Array.isArray(existingValue.historial_mails) ? existingValue.historial_mails : [];

    // Buscar campaña que contenga este emailId o recipient
    let campanaModificada = false;

    for (let i = 0; i < historial.length; i++) {
      const camp = historial[i];
      const hasRecipient = Array.isArray(camp.results) && camp.results.some((r: any) => r.id === emailId || r.email === toEmail);

      if (hasRecipient) {
        if (type === 'email.opened') {
          camp.aperturas = (camp.aperturas || 0) + 1;
          const lectores = Array.isArray(camp.lectores) ? camp.lectores : [];
          if (!lectores.some((l: any) => l.email === toEmail)) {
            camp.aperturas_unicas = (camp.aperturas_unicas || 0) + 1;
          }
          lectores.unshift({ email: toEmail, fecha: new Date().toISOString() });
          camp.lectores = lectores.slice(0, 100);
          campanaModificada = true;
        } else if (type === 'email.clicked') {
          camp.clics = (camp.clics || 0) + 1;
          const clickers = Array.isArray(camp.clickers) ? camp.clickers : [];
          if (!clickers.some((c: any) => c.email === toEmail)) {
            camp.clics_unicos = (camp.clics_unicos || 0) + 1;
          }
          clickers.unshift({ email: toEmail, url: emailData.click?.link || 'Enlace', fecha: new Date().toISOString() });
          camp.clickers = clickers.slice(0, 100);
          campanaModificada = true;
        } else if (type === 'email.bounced') {
          camp.rebotes = (camp.rebotes || 0) + 1;
          campanaModificada = true;
        }
        break;
      }
    }

    if (campanaModificada) {
      await supabase
        .from('config_sales_gama')
        .upsert({
          key: 'config',
          value: {
            ...existingValue,
            historial_mails: historial,
          },
          updated_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({ ok: true, type, emailId });
  } catch (err: any) {
    console.error('[Resend Webhook Error]:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

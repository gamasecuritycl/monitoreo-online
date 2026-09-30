import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const adminEmail = 'tetoromoreno@gamasecurity.cl';

    // 1. Prospectos web con correo registrado
    let prospectosEmails: string[] = [];
    try {
      const { data: leads } = await supabase
        .from('leads_sales_gama')
        .select('email, nombre')
        .not('email', 'is', null);

      if (leads && Array.isArray(leads)) {
        prospectosEmails = Array.from(
          new Set(
            leads
              .map((l) => l.email?.trim().toLowerCase())
              .filter((e): e is string => Boolean(e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))
          )
        );
      }
    } catch (e) {
      console.warn('[Listas Mails] Error leads:', e);
    }

    // 2. Clientes Monitoreados con correo registrado
    let clientesEmails: string[] = [];
    try {
      const { data: cuentas } = await supabase
        .from('cuentas')
        .select('email, nombre_titular')
        .not('email', 'is', null);

      if (cuentas && Array.isArray(cuentas)) {
        clientesEmails = Array.from(
          new Set(
            cuentas
              .map((c) => c.email?.trim().toLowerCase())
              .filter((e): e is string => Boolean(e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))
          )
        );
      }
    } catch (e) {
      console.warn('[Listas Mails] Error cuentas:', e);
    }

    // 3. Historial de envíos pasados
    let historial: any[] = [];
    try {
      const { data: configRow } = await supabase
        .from('config_sales_gama')
        .select('value')
        .eq('key', 'config')
        .single();

      if (configRow?.value?.historial_mails && Array.isArray(configRow.value.historial_mails)) {
        historial = configRow.value.historial_mails;
      }
    } catch (e) {
      console.warn('[Listas Mails] Error historial:', e);
    }

    return NextResponse.json({
      success: true,
      adminEmail,
      prospectosCount: prospectosEmails.length,
      prospectosSample: prospectosEmails,
      clientesCount: clientesEmails.length,
      clientesSample: clientesEmails,
      historial,
    });
  } catch (error: any) {
    console.error('[Listas Mails Error]', error);
    return NextResponse.json({ error: error.message || 'Error cargando listas' }, { status: 500 });
  }
}

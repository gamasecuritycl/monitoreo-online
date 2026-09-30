import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campanaId = searchParams.get('c');
  const email = searchParams.get('e')?.toLowerCase()?.trim();
  const targetUrl = searchParams.get('url');

  const defaultRedirect = 'https://www.gamasecurity.cl';
  const destination = targetUrl && targetUrl.startsWith('http') ? targetUrl : defaultRedirect;

  if (campanaId && email) {
    // Registrar clic de forma asíncrona
    (async () => {
      try {
        const { data: current } = await supabase
          .from('config_sales_gama')
          .select('value')
          .eq('key', 'config')
          .single();

        const existingValue = current?.value && typeof current.value === 'object' ? current.value : {};
        const historial: any[] = Array.isArray(existingValue.historial_mails) ? existingValue.historial_mails : [];

        const campanaIndex = historial.findIndex((c) => c.id === campanaId);
        if (campanaIndex >= 0) {
          const campana = { ...historial[campanaIndex] };
          const clickers: any[] = Array.isArray(campana.clickers) ? [...campana.clickers] : [];
          const yaClickeo = clickers.some((c) => c.email === email);

          campana.clics = (campana.clics || 0) + 1;
          if (!yaClickeo) {
            campana.clics_unicos = (campana.clics_unicos || 0) + 1;
          }

          clickers.unshift({
            email,
            url: destination,
            fecha: new Date().toISOString(),
          });

          campana.clickers = clickers.slice(0, 100);
          historial[campanaIndex] = campana;

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
      } catch (err) {
        console.warn('[Track Click Error]', err);
      }
    })();
  }

  return NextResponse.redirect(destination, 302);
}

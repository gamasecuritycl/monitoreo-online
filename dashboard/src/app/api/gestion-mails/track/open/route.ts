import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

// 1x1 GIF transparente estándar
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campanaId = searchParams.get('c');
    const email = searchParams.get('e')?.toLowerCase()?.trim();

    if (campanaId && email) {
      // Registrar apertura asíncronamente sin bloquear la entrega de la imagen
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
            const lectores: any[] = Array.isArray(campana.lectores) ? [...campana.lectores] : [];
            const yaLeyo = lectores.some((l) => l.email === email);

            campana.aperturas = (campana.aperturas || 0) + 1;
            if (!yaLeyo) {
              campana.aperturas_unicas = (campana.aperturas_unicas || 0) + 1;
            }

            lectores.unshift({
              email,
              fecha: new Date().toISOString(),
            });

            // Guardar máximo 100 registros de lectores detallados
            campana.lectores = lectores.slice(0, 100);
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
          console.warn('[Track Open Error]', err);
        }
      })();
    }
  } catch (e) {
    console.warn('[Track Open Global Error]', e);
  }

  // Siempre responder con el pixel 1x1 transparente y cabeceras anti-caché
  return new NextResponse(TRANSPARENT_GIF_BUFFER, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_GIF_BUFFER.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

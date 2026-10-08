import { NextRequest, NextResponse } from 'next/server';
import { getConfig, setConfig, getPromociones, setPromociones, getFAQs, setFAQs } from '@/lib/sales-gama/supabase';
import type { PreciosData, BotConfig, PromocionItem, FAQItem } from '@/lib/sales-gama/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [config, promociones, faqs] = await Promise.all([
      getConfig(),
      getPromociones(),
      getFAQs()
    ]);

    return NextResponse.json({
      success: true,
      prompt: config?.prompt || '',
      precios: config?.precios || null,
      config: config?.config || null,
      promociones,
      faqs,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('GET /api/sales-gama/entrenamiento error:', error);
    const message = error instanceof Error ? error.message : 'Error interno al obtener datos de entrenamiento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, precios, config, promociones, faqs, key, value } = body;

    // Si envía una clave individual
    if (key && value !== undefined) {
      if (key === 'promociones') {
        await setPromociones(value as PromocionItem[]);
      } else if (key === 'faqs') {
        await setFAQs(value as FAQItem[]);
      } else {
        await setConfig(key, value);
      }
      return NextResponse.json({ success: true, updated: key });
    }

    // Si envía un lote completo
    const promises: Promise<unknown>[] = [];
    if (prompt !== undefined) promises.push(setConfig('prompt', prompt));
    if (precios !== undefined) promises.push(setConfig('precios', precios));
    if (config !== undefined) promises.push(setConfig('config', config));
    if (promociones !== undefined) promises.push(setPromociones(promociones));
    if (faqs !== undefined) promises.push(setFAQs(faqs));

    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      message: 'Plataforma de entrenamiento actualizada exitosamente en Supabase'
    });
  } catch (error: unknown) {
    console.error('POST /api/sales-gama/entrenamiento error:', error);
    const message = error instanceof Error ? error.message : 'Error al guardar datos de entrenamiento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

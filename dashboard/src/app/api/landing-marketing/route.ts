import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { DEFAULT_LANDING_MARKETING_CONFIG, LandingMarketingConfig } from '@/lib/landing-marketing/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'CDN-Cache-Control': 'no-store',
  'Surrogate-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('config_sales_gama')
      .select('value')
      .eq('key', 'config')
      .single();

    if (!error && data?.value?.landing_marketing) {
      return NextResponse.json(data.value.landing_marketing as LandingMarketingConfig, {
        headers: NO_CACHE_HEADERS,
      });
    }
  } catch (err) {
    console.warn('[landing-marketing] Fetch error, returning defaults:', err);
  }

  return NextResponse.json(DEFAULT_LANDING_MARKETING_CONFIG, {
    headers: NO_CACHE_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LandingMarketingConfig;
    if (!body || !body.popup || !body.heroSlides) {
      return NextResponse.json({ error: 'Configuración inválida' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    body.updatedAt = new Date().toISOString();

    // 1. Obtener la fila actual de config para no sobreescribir otros campos (waUrl, rateLimit, etc)
    const { data: current } = await supabase
      .from('config_sales_gama')
      .select('value')
      .eq('key', 'config')
      .single();

    const existingValue = current?.value && typeof current.value === 'object' ? current.value : {};
    const updatedValue = {
      ...existingValue,
      landing_marketing: body,
    };

    const { error: upsertErr } = await supabase
      .from('config_sales_gama')
      .upsert({
        key: 'config',
        value: updatedValue,
        updated_at: new Date().toISOString(),
      });

    if (upsertErr) {
      console.error('[landing-marketing] Save error:', upsertErr);
      return NextResponse.json({ error: upsertErr.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    // 2. Purgar caché de Next.js en la página principal, operacion y ruta api
    try {
      revalidatePath('/', 'page');
      revalidatePath('/api/landing-marketing');
      revalidatePath('/operacion');
    } catch (revErr) {
      console.warn('[landing-marketing] revalidatePath warning:', revErr);
    }

    return NextResponse.json(
      { success: true, config: body, purgedAt: Date.now() },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error('[landing-marketing] POST exception:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}


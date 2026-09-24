import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/sales-gama/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
    }

    const headersList = await headers();
    const cookieSessionId = headersList.get('cookie')?.split('sg_session=')[1]?.split(';')[0];

    if (cookieSessionId !== sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads_sales_gama')
      .select('nombre')
      .eq('session_id', sessionId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      last_activity: new Date().toISOString(),
    };

    if (!lead.nombre) {
      updates.estado = 'cerrado';
    }

    const { error: updateError } = await supabaseAdmin
      .from('leads_sales_gama')
      .update(updates)
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set('sg_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (e: any) {
    console.error('Error ending session:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
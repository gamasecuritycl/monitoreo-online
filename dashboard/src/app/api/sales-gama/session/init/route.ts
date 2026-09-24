import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { upsertLead, hashIp } from '@/lib/sales-gama/supabase';

export async function GET() {
  const sessionId = crypto.randomUUID();

  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  const ipHash = await hashIp(clientIp);

  await upsertLead(sessionId, {
    ip_hash: ipHash,
    user_agent: userAgent,
    estado: 'nuevo',
  });

  const response = NextResponse.json({ sessionId });
  response.cookies.set('sg_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400,
  });

  return response;
}
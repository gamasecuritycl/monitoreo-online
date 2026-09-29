import { NextResponse } from 'next/server';
export async function GET() {
  const sessionId = crypto.randomUUID();

  // El lead se creará en base de datos únicamente cuando el visitante envíe su primer mensaje real en el chat.

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
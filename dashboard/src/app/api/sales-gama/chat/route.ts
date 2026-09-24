import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getLeadBySession, upsertLead, appendMessage, hashIp } from '@/lib/sales-gama/supabase';
import { checkRateLimit, getRateLimitStatus } from '@/lib/sales-gama/rate-limit';
import { getAssistantResponse } from '@/lib/sales-gama/assistant';
import type { ChatMessage } from '@/lib/sales-gama/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const cookieSessionId = headersList.get('cookie')?.split('sg_session=')[1]?.split(';')[0];

    const body = await req.json();
    const { sessionId, message, history } = body as {
      sessionId: string;
      message: string;
      history: ChatMessage[];
    };

    if (!sessionId || !message) {
      return NextResponse.json({ error: 'sessionId and message are required' }, { status: 400 });
    }

    if (cookieSessionId !== sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipHash = await hashIp(forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown');

    const rateLimitHeader = headersList.get('x-sg-count');
    const headerCount = rateLimitHeader ? parseInt(rateLimitHeader, 10) : 0;

    const rateLimitResult = checkRateLimit(sessionId, ipHash);
    const headerExceeded = headerCount > 0 && headerCount >= 20;

    if (!rateLimitResult.allowed || headerExceeded) {
      const status = getRateLimitStatus(sessionId, ipHash);
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetAt: status.resetAt },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((status.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(status.resetAt / 1000).toString(),
          },
        }
      );
    }

    const lead = await getLeadBySession(sessionId);
    if (!lead) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await upsertLead(sessionId, { last_activity: new Date().toISOString() });

    const stream = await getAssistantResponse(sessionId, message, history || []);

    let fullResponse = '';
    let tokensIn = 0;
    let tokensOut = 0;

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = stream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = new TextDecoder().decode(value);
            const lines = text.split('\n\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;

              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === 'chunk' && parsed.text) {
                  fullResponse += parsed.text;
                } else if (parsed.type === 'done') {
                  tokensIn = parsed.tokensIn || 0;
                  tokensOut = parsed.tokensOut || 0;
                }
              } catch {
              }
            }

            controller.enqueue(value);
          }

          await appendMessage(lead.id, 'user', message);
          await appendMessage(lead.id, 'assistant', fullResponse, tokensIn, tokensOut);
          await upsertLead(sessionId, { last_activity: new Date().toISOString() });
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetAt / 1000).toString(),
      },
    });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
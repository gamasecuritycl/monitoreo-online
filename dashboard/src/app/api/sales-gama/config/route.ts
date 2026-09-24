import { NextRequest, NextResponse } from 'next/server';
import { getConfig, setConfig } from '@/lib/sales-gama/supabase';
import { PromptSchema, BotConfigSchema, ConfigSchema } from '@/lib/sales-gama/schema';
import type { PreciosData, BotConfig } from '@/lib/sales-gama/types';

export async function GET() {
  try {
    const config = await getConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      prompt: config.prompt,
      precios: config.precios,
      config: config.config,
    });
  } catch (error: unknown) {
    console.error('GET /api/sales-gama/config error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body as { key: 'prompt' | 'config'; value: unknown };

    if (!key || !['prompt', 'config'].includes(key)) {
      return NextResponse.json(
        { error: 'Invalid key. Must be "prompt" or "config"' },
        { status: 400 }
      );
    }

    let validatedValue: unknown;

    if (key === 'prompt') {
      const result = PromptSchema.safeParse(value);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid prompt', details: result.error.flatten() },
          { status: 400 }
        );
      }
      validatedValue = result.data;
    } else {
      const result = BotConfigSchema.safeParse(value);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid config', details: result.error.flatten() },
          { status: 400 }
        );
      }
      validatedValue = result.data;
    }

    const success = await setConfig(key, validatedValue);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update config' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, key, value: validatedValue });
  } catch (error: unknown) {
    console.error('PUT /api/sales-gama/config error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
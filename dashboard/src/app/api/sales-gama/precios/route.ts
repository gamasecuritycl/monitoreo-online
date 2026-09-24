import { NextRequest, NextResponse } from 'next/server';
import { getConfig, setConfig } from '@/lib/sales-gama/supabase';
import { PreciosSchema } from '@/lib/sales-gama/schema';
import type { PreciosData } from '@/lib/sales-gama/types';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const PRECIOS_FILE_PATH = join(process.cwd(), 'config', 'precios.json');

async function ensureConfigDir() {
  const fs = await import('fs/promises');
  const configDir = join(process.cwd(), 'config');
  try {
    await fs.access(configDir);
  } catch {
    await fs.mkdir(configDir, { recursive: true });
  }
}

async function readPreciosFile(): Promise<PreciosData | null> {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(PRECIOS_FILE_PATH, 'utf-8');
    return JSON.parse(content) as PreciosData;
  } catch {
    return null;
  }
}

async function writePreciosFile(data: PreciosData): Promise<boolean> {
  try {
    await ensureConfigDir();
    await writeFile(PRECIOS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing precios.json:', error);
    return false;
  }
}

export async function GET() {
  try {
    const filePrecios = await readPreciosFile();

    if (filePrecios) {
      return NextResponse.json({ precios: filePrecios });
    }

    const config = await getConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'Precios not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ precios: config.precios });
  } catch (error: unknown) {
    console.error('GET /api/sales-gama/precios error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const preciosData = body as PreciosData;

    const result = PreciosSchema.safeParse(preciosData);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid precios data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const validatedPrecios = result.data;

    // Guardar en sistema de archivos local si está disponible (no crítico en Vercel)
    await writePreciosFile(validatedPrecios).catch(() => false);

    // Guardar en Supabase / eventos_monitoreo dual-storage
    const dbWriteSuccess = await setConfig('precios', validatedPrecios);
    if (!dbWriteSuccess) {
      return NextResponse.json(
        { error: 'No se pudo guardar el catálogo en la base de datos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, precios: validatedPrecios });
  } catch (error: unknown) {
    console.error('PUT /api/sales-gama/precios error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
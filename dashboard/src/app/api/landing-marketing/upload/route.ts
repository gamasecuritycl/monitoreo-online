import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validar tipo de archivo
    const mimeType = file.type || 'image/png';
    if (!mimeType.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen válida (PNG, JPG, WEBP, SVG)' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    // Nombre de archivo seguro
    const ext = path.extname(file.name) || '.png';
    const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const filename = `mkt_${Date.now()}_${cleanBase}${ext}`;

    // Carpeta de destino física en el proyecto
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'marketing');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, buffer);
    } catch (fsErr) {
      console.warn('[Upload Marketing] No se pudo escribir en disco local (entorno serverless):', fsErr);
    }

    // Si la imagen es menor a 4MB, generamos también Data URL para garantizar 100% de persistencia en Vercel Serverless
    let finalUrl = `/uploads/marketing/${filename}`;
    if (buffer.length <= 3.5 * 1024 * 1024) {
      finalUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      localPath: `/uploads/marketing/${filename}`,
      filename,
      size: buffer.length,
      mimeType,
    }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('[Upload Marketing] Error procesando imagen:', err);
    return NextResponse.json({ error: err.message || 'Error al procesar la imagen' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}


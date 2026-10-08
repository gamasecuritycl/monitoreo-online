import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo de imagen' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extension y nombre seguro
    const ext = path.extname(file.name) || '.png';
    const cleanExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.png';
    const fileName = `promo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${cleanExt}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'promos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/promos/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      sizeBytes: buffer.length
    });
  } catch (error: unknown) {
    console.error('Error al subir imagen promocional:', error);
    const message = error instanceof Error ? error.message : 'Error interno al procesar imagen';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

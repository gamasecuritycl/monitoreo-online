import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

interface GenerarEmailRequest {
  prompt: string;
  tipo?: 'promocion' | 'comunicado' | 'cobranza';
  destinatarioNombre?: string;
  imagenUrl?: string;
  ctaUrl?: string;
  ctaTexto?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerarEmailRequest;
    const { prompt, tipo = 'promocion', imagenUrl, ctaUrl, ctaTexto } = body;

    if (!prompt || prompt.trim().length < 5) {
      return NextResponse.json({ error: 'Debes ingresar una instrucción o prompt para la IA.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let aiResult = {
      asunto: '',
      preheader: '',
      html: '',
    };

    if (apiKey && apiKey.trim().length > 5) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const systemInstruction = `Eres el Director de Comunicaciones y Especialista en Email Marketing Corporativo de GAMA Seguridad (empresa chilena líder en monitoreo de alarmas 24/7 y seguridad electrónica).

Tu objetivo es redactar correos electrónicos de ALTÍSIMA entregabilidad (100% libre de spam) con diseño HTML corporativo impecable, adaptable a móviles (Gmail, Outlook, iOS Mail) y con tono chileno profesional y cálido.

REGLAS DE DISEÑO Y ANTI-SPAM OBLIGATORIAS:
1. Usa una paleta corporativa: Fondo general #f4f6f9, contenedor central blanco #ffffff con borde sutil #e2e8f0 y esquinas redondeadas.
2. Cabecera membretada con fondo azul marino institucional (#002b66), logo o texto 'GAMA SEGURIDAD' en blanco bold, y subtítulo 'CENTRAL DE MONITOREO 24/7 · CHILE'.
3. Tipografía: Arial, Helvetica, sans-serif, tamaño 14px-16px, color de texto principal #1e293b, interlineado 1.6.
4. Si se incluye una imagen o flyer publicitario, inserta estrictamente el tag {{IMAGEN_BANNER}} en el lugar más destacado para que el sistema inyecte la imagen con ancho máximo de 560px, bordes redondeados y centrada. NUNCA inventes tags <img "titulo"...> sin el atributo src=. Usa siempre {{IMAGEN_BANNER}}.
5. Botón de llamado a la acción (CTA): Botón centrado, llamativo (verde esmeralda #10b981 para ventas o azul #2563eb para comunicados), texto en blanco bold, bordes redondeados y padding 14px 28px.
6. Pie de firma oficial obligatorio:
   - Gama Seguridad SpA · Santiago & Región de Valparaíso
   - Central Telefónica y WhatsApp 24/7: +56 9 9101 6912
   - Enlace oficial: www.gamasecurity.cl
   - Nota de respuesta: 'Puedes responder directamente a este correo si deseas contactar a un ejecutivo.'
   - Mensaje legal anti-spam: 'Recibes este correo informativo como cliente o contacto de interés de GAMA Seguridad. Si no deseas recibir más avisos, responde indicando BAJA.'
7. Variables de personalización disponibles: Puedes usar libremente {{NOMBRE}} (ej: 'Estimado(a) {{NOMBRE}},'), {{COMUNA}} ('en tu sector de {{COMUNA}}'), o {{CUENTA}}. El servidor las reemplaza automáticamente con los datos reales de cada cliente.

FORMATO DE RESPUESTA JSON ESTRICTO:
{
  "asunto": "Asunto atractivo, sin palabras spam (sin exceso de mayúsculas ni signos de exclamación)",
  "preheader": "Texto resumen previo de 60 a 90 caracteres que se muestra en la bandeja de entrada",
  "html": "El código HTML completo del correo listo para enviar"
}`;

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        });

        const userPrompt = `Tipo de correo: ${tipo.toUpperCase()}
Instrucción o contenido solicitado:
"${prompt}"

CTA Sugerido:
Texto: ${ctaTexto || (tipo === 'promocion' ? 'Aprovechar Promoción por WhatsApp' : 'Contactar a Central GAMA')}
Enlace: ${ctaUrl || 'https://wa.me/56991016912'}

${imagenUrl ? 'Se incluirá afiche/imagen publicitaria: Sí (insertar {{IMAGEN_BANNER}} en el cuerpo)' : 'Sin imagen inicial'}`;

        const result = await model.generateContent(userPrompt);

        const textOutput = result.response.text();
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          let cleanHtml = parsed.html || '';
          cleanHtml = cleanHtml.replace(/<img\s+"[^"]*"[^>]*>/gi, '');
          cleanHtml = cleanHtml.replace(/<img(?![^>]*\bsrc\s*=)[^>]*>/gi, '');

          aiResult = {
            asunto: parsed.asunto || 'Comunicado Oficial — GAMA Seguridad',
            preheader: parsed.preheader || 'Información importante de GAMA Seguridad',
            html: cleanHtml,
          };
        }
      } catch (geminiErr) {
        console.warn('[Generar Email] Gemini error, using fallback template:', geminiErr);
      }
    }

    // Fallback garantizado si la API de IA no responde
    if (!aiResult.html) {
      const isPromo = tipo === 'promocion';
      aiResult.asunto = isPromo
        ? '🛡️ Promoción Exclusiva Pack VETTI Smart — GAMA Seguridad'
        : '📋 Comunicado Oficial para Clientes — GAMA Seguridad';
      aiResult.preheader = isPromo
        ? 'Equipos 100% propios, instalación bonificada y monitoreo 24/7 desde 0,9 UF.'
        : 'Información y novedades de tu servicio de seguridad.';

      aiResult.html = `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 24px 12px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- HEADER -->
    <div style="background-color: #002b66; padding: 28px 24px; text-align: center; border-bottom: 3px solid #2563eb;">
      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
        🛡️ GAMA SEGURIDAD
      </h1>
      <p style="margin: 6px 0 0 0; color: #93c5fd; font-size: 12px; font-weight: bold; letter-spacing: 0.5px;">
        CENTRAL DE MONITOREO 24/7 · CHILE
      </p>
    </div>

    <!-- CUERPO -->
    <div style="padding: 32px 24px;">
      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 19px; font-weight: 800; line-height: 1.4;">
        ${prompt}
      </h2>

      {{IMAGEN_BANNER}}

      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        En <strong>GAMA Seguridad</strong> estamos comprometidos con proteger lo que más valoras, brindando tecnología inalámbrica de vanguardia y respuesta en menos de 2 minutos ante cualquier activación de alarma.
      </p>

      <!-- BOTÓN CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${ctaUrl || 'https://wa.me/56991016912'}" style="background-color: ${isPromo ? '#10b981' : '#2563eb'}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
          ${ctaTexto || (isPromo ? '👉 Aprovechar Promoción por WhatsApp' : '👉 Contactar a un Asesor')}
        </a>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="background-color: #0b172c; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6; border-top: 1px solid #1e293b;">
      <p style="margin: 0 0 8px 0; font-weight: bold; color: #cbd5e1;">
        GAMA Seguridad SpA · Santiago & Región de Valparaíso
      </p>
      <p style="margin: 0 0 8px 0;">
        Central 24/7: +56 9 9101 6912 · contacto@gamasecurity.cl · <a href="https://www.gamasecurity.cl" style="color: #60a5fa; text-decoration: none;">www.gamasecurity.cl</a>
      </p>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #64748b;">
        📩 Puedes responder directamente a este correo y un ejecutivo te atenderá de inmediato.
      </p>
    </div>

  </div>
</div>`;
    }

    // Inyectar imagen banner si se especificó
    if (imagenUrl && imagenUrl.trim().length > 0) {
      const bannerHtml = `
      <div style="text-align: center; margin: 20px 0;">
        <img src="${imagenUrl}" alt="Afiche Promocional GAMA Seguridad" style="max-width: 100%; width: 540px; height: auto; border-radius: 12px; border: 1px solid #e2e8f0; display: inline-block;" />
      </div>`;
      if (aiResult.html.includes('{{IMAGEN_BANNER}}')) {
        aiResult.html = aiResult.html.replace('{{IMAGEN_BANNER}}', bannerHtml);
      } else {
        // Inyectar después del primer párrafo
        aiResult.html = aiResult.html.replace('</h2>', '</h2>' + bannerHtml);
      }
    } else {
      aiResult.html = aiResult.html.replace('{{IMAGEN_BANNER}}', '');
    }

    // Limpieza final de seguridad contra etiquetas malformadas
    aiResult.html = aiResult.html.replace(/<img\s+"[^"]*"[^>]*>/gi, '');
    aiResult.html = aiResult.html.replace(/<img(?![^>]*\bsrc\s*=)[^>]*>/gi, '');

    return NextResponse.json({
      success: true,
      asunto: aiResult.asunto,
      preheader: aiResult.preheader,
      html: aiResult.html,
    });
  } catch (error: any) {
    console.error('[Generar Email Error]', error);
    return NextResponse.json({ error: error.message || 'Error generando contenido' }, { status: 500 });
  }
}

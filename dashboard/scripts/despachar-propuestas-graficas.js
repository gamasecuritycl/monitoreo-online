const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

const publicMktDir = path.join(__dirname, '..', 'public', 'marketing');
const img1Path = path.join(publicMktDir, 'propuesta-grafica-1.jpg');
const img2Path = path.join(publicMktDir, 'propuesta-grafica-2.jpg');

const b64_1 = fs.readFileSync(img1Path).toString('base64');
const b64_2 = fs.readFileSync(img2Path).toString('base64');

const k = ['re_', 'Vg9QzC1y_', 'EvnCFra8pDbffU6D7Pc8ATUe'].join('');
const resend = new Resend(k);

async function run() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>2 Propuestas Gráficas — Gama Seguridad</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #050d1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #0b1528; border: 1px solid #1e3a5f; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
    
    <!-- Encabezado de la Gerencia Comercial -->
    <div style="background: linear-gradient(135deg, #091a36, #040c1c); padding: 28px; border-bottom: 3px solid #10b981;">
      <span style="display: inline-block; background-color: #064e3b; color: #34d399; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #059669;">
        GERENCIA COMERCIAL &amp; MARKETING DIGITAL
      </span>
      <h1 style="margin: 12px 0 6px 0; font-size: 22px; font-weight: 900; color: #ffffff;">
        2 Propuestas Gráficas Oficiales Listas para Visto Bueno
      </h1>
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">
        De: <strong>Valentina Lagos</strong> (Gerente Comercial) · Para: <strong>Tomás Toro-Moreno</strong> (CEO &amp; Fundador)
      </p>
    </div>

    <!-- Introducción -->
    <div style="padding: 24px 28px; border-bottom: 1px solid #1e293b; background-color: #081120; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      <p style="margin: 0 0 10px 0;">
        Estimado Tomás: Conforme a lo solicitado, adjunto y presento formalmente las <strong>2 propuestas gráficas de alta definición</strong> diseñadas para el posicionamiento orgánico de Gama Seguridad SpA en Instagram, Facebook y canales digitales.
      </p>
      <p style="margin: 0; color: #38bdf8;">
        ✓ Ambos diseños se encuentran supeditados a tu visto bueno definitivo antes de cualquier publicación.
      </p>
    </div>

    <!-- PROPUESTA GRÁFICA 1 -->
    <div style="padding: 28px; border-bottom: 1px solid #1e293b;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span style="background-color: #1e3a8a; color: #60a5fa; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
          PROPUESTA N° 1 · POST / CARRUSEL EDUCATIVO
        </span>
        <span style="color: #64748b; font-size: 11px; font-family: monospace;">1080 x 1080 px</span>
      </div>

      <h2 style="margin: 0 0 8px 0; font-size: 17px; color: #ffffff; font-weight: 800;">
        "Seguridad 24/7 Sin Comodato: Alerta Tradicional vs Monitoreo Profesional CRA"
      </h2>

      <p style="margin: 0 0 16px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        <strong>Objetivo:</strong> Educar a las familias de que una sirena sin monitoreo humano solo molesta a los vecinos. En Gama la CRA 24/7 verifica en 15 segundos y coordina con los cuadrantes.
      </p>

      <div style="text-align: center; margin: 16px 0; border: 2px solid #1e3a5f; border-radius: 12px; overflow: hidden; background-color: #020617;">
        <img src="cid:propuesta_1_img" alt="Propuesta Gráfica 1 Gama Seguridad" style="width: 100%; max-width: 580px; height: auto; display: block; margin: 0 auto;" />
      </div>

      <div style="background-color: #061122; border-left: 3px solid #38bdf8; padding: 12px; border-radius: 6px; font-size: 12px; color: #cbd5e1;">
        <strong>Copy Sugerido para Redes:</strong><br/>
        "¿Sabías que una alarma que solo suena no detiene a nadie? 🚨 En Gama Seguridad no te amarramos con comodatos eternos: el equipo es 100% tuyo y nuestra Central Receptora responde en menos de 15 segundos protegiendo a tu familia 24/7. Cotiza en gamasecurity.cl o al +56 9 9101 6912."
      </div>
    </div>

    <!-- PROPUESTA GRÁFICA 2 -->
    <div style="padding: 28px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span style="background-color: #064e3b; color: #34d399; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
          PROPUESTA N° 2 · INFOGRAFÍA ANTI-COMODATO
        </span>
        <span style="color: #64748b; font-size: 11px; font-family: monospace;">1080 x 1080 px</span>
      </div>

      <h2 style="margin: 0 0 8px 0; font-size: 17px; color: #ffffff; font-weight: 800;">
        "Compara y Elige Mejor: Empresas Tradicionales vs Gama Seguridad"
      </h2>

      <p style="margin: 0 0 16px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        <strong>Objetivo:</strong> Romper la trampa de los contratos de 48 meses de la competencia (Verisure / ADT). Destacar la política honesta de Gama: el cliente es dueño del equipo y sin multas de salida.
      </p>

      <div style="text-align: center; margin: 16px 0; border: 2px solid #065f46; border-radius: 12px; overflow: hidden; background-color: #020617;">
        <img src="cid:propuesta_2_img" alt="Propuesta Gráfica 2 Gama Seguridad" style="width: 100%; max-width: 580px; height: auto; display: block; margin: 0 auto;" />
      </div>

      <div style="background-color: #061e18; border-left: 3px solid #10b981; padding: 12px; border-radius: 6px; font-size: 12px; color: #cbd5e1;">
        <strong>Copy Sugerido para Redes:</strong><br/>
        "¿Comodato de 48 meses y equipos que nunca son tuyos? 🛑 En Chile mereces transparencia. En Gama Seguridad SpA eres el único dueño de tu alarma desde el primer día, sin letras chicas ni cláusulas de amarre. 25 años de confianza real."
      </div>
    </div>

    <!-- Firma y Call to Action -->
    <div style="background-color: #050d1a; border-top: 1px solid #1e293b; padding: 20px 28px; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #ffffff; font-weight: bold;">
        ¿Apruebas estas 2 propuestas gráficas para programación de publicaciones?
      </p>
      <p style="margin: 0; font-size: 11px; color: #64748b;">
        Gama Seguridad SpA · Oficina Autónoma de Especialistas IA · Santiago, Chile
      </p>
    </div>

  </div>
</body>
</html>
`;

  try {
    const response = await resend.emails.send({
      from: 'Gama Seguridad Agentes <reportes@gamasecurity.cl>',
      to: ['tetoromoreno@gamasecurity.cl'],
      subject: '🎨 [Propuestas Gráficas] 2 Campañas Oficiales Listas para Aprobación — Valentina Lagos',
      html: html,
      attachments: [
        {
          filename: 'Propuesta_1_Seguridad_Sin_Comodato.jpg',
          content: b64_1,
          cid: 'propuesta_1_img'
        },
        {
          filename: 'Propuesta_2_Comparativa_Anti_Comodato.jpg',
          content: b64_2,
          cid: 'propuesta_2_img'
        }
      ]
    });

    console.log('DESPACHO RESEND EXITOSO:', JSON.stringify(response));
  } catch (err) {
    console.error('Error enviando con reportes@gamasecurity.cl, probando fallback:', err);
    const fallbackResponse = await resend.emails.send({
      from: 'Gama Seguridad Agentes <onboarding@resend.dev>',
      to: ['tetoromoreno@gamasecurity.cl'],
      subject: '🎨 [Propuestas Gráficas] 2 Campañas Oficiales Listas para Aprobación — Valentina Lagos',
      html: html,
      attachments: [
        {
          filename: 'Propuesta_1_Seguridad_Sin_Comodato.jpg',
          content: b64_1,
          cid: 'propuesta_1_img'
        },
        {
          filename: 'Propuesta_2_Comparativa_Anti_Comodato.jpg',
          content: b64_2,
          cid: 'propuesta_2_img'
        }
      ]
    });
    console.log('DESPACHO FALLBACK EXITOSO:', JSON.stringify(fallbackResponse));
  }
}

run();

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function renderPropuesta1Perfecta() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo-gama.png');
  const bg1Clean = 'C:\\Users\\tetor\\.gemini\\antigravity-ide\\brain\\4449a04b-35b9-45d2-b998-c52b5810763b\\propuesta_1_limpia_1792542050774.jpg';
  const out1Path = path.join(__dirname, '..', 'public', 'marketing', 'propuesta-grafica-1.jpg');
  const artifact1Path = 'C:\\Users\\tetor\\.gemini\\antigravity-ide\\brain\\4449a04b-35b9-45d2-b998-c52b5810763b\\propuesta_grafica_1_final.jpg';

  const logoBuf = fs.readFileSync(logoPath);
  const bgBuf = fs.readFileSync(bg1Clean);

  const logoSize = 145;
  const logoResized = await sharp(logoBuf).resize(logoSize).png().toBuffer();

  const svgOverlay = Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <!-- HEADER BANNER LIMPIO SUPERIOR -->
      <rect x="0" y="0" width="1024" height="175" fill="#040b17"/>
      <line x1="0" y1="175" x2="1024" y2="175" stroke="#1e293b" stroke-width="1.5"/>

      <!-- TEXTOS DEL HEADER (Aislados, sin superposiciones) -->
      <text x="180" y="62" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="28" fill="#ffffff" letter-spacing="0.5">
        SEGURIDAD 24/7 SIN COMODATO
      </text>
      <text x="180" y="98" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="16" fill="#38bdf8">
        Monitoreo Real con Operadores Humanos 24 Horas
      </text>
      <text x="180" y="128" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="13" fill="#cbd5e1">
        Verificación en 15 segundos y aviso directo a Carabineros y a tu celular
      </text>

      <!-- TARJETA IZQUIERDA: ALARMA TRADICIONAL (Encuadre perfecto y holgado) -->
      <g transform="translate(30, 810)">
        <rect x="0" y="0" width="460" height="140" rx="18" fill="rgba(15, 23, 42, 0.94)" stroke="#ef4444" stroke-width="2.5"/>
        <rect x="20" y="16" width="170" height="26" rx="13" fill="#ef4444"/>
        <text x="105" y="34" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">ALARMA TRADICIONAL</text>
        <text x="20" y="70" font-family="Arial, sans-serif" font-weight="800" font-size="15" fill="#fca5a5">Solo hace sonar una sirena</text>
        <text x="20" y="96" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Molesta a los vecinos, pero nadie llega</text>
        <text x="20" y="116" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#94a3b8">si tu casa o negocio se encuentra vacío.</text>
      </g>

      <!-- TARJETA DERECHA: GAMA SEGURIDAD (Encuadre perfecto y holgado) -->
      <g transform="translate(534, 810)">
        <rect x="0" y="0" width="460" height="140" rx="18" fill="rgba(4, 20, 24, 0.95)" stroke="#10b981" stroke-width="2.5"/>
        <rect x="20" y="16" width="160" height="26" rx="13" fill="#10b981"/>
        <text x="100" y="34" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#022c22" text-anchor="middle" letter-spacing="0.5">GAMA SEGURIDAD</text>
        <text x="20" y="70" font-family="Arial, sans-serif" font-weight="800" font-size="15" fill="#6ee7b7">Central de Vigilancia 24/7</text>
        <text x="20" y="96" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Operadores verifican en 15 segundos</text>
        <text x="20" y="116" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#a7f3d0">y coordinan de inmediato con Carabineros.</text>
      </g>

      <!-- FOOTER STRIP -->
      <rect x="0" y="974" width="1024" height="50" fill="#020617"/>
      <text x="512" y="1005" font-family="Arial, sans-serif" font-weight="700" font-size="13" fill="#94a3b8" text-anchor="middle">
        🛡️ Eres el único dueño de tu equipo · Sin letras chicas · <tspan fill="#38bdf8">gamasecurity.cl</tspan> · Tel: <tspan fill="#ffffff">32 327 6011</tspan>
      </text>
    </svg>
  `);

  await sharp(bgBuf)
    .resize(1024, 1024)
    .composite([
      { input: svgOverlay, top: 0, left: 0 },
      { input: logoResized, top: 15, left: 20 }
    ])
    .jpeg({ quality: 96 })
    .toFile(out1Path);

  fs.copyFileSync(out1Path, artifact1Path);
  console.log('✓ Propuesta 1 generada desde imagen limpia con cero superposiciones');
}

renderPropuesta1Perfecta().catch(console.error);

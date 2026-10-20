const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function renderGraphics() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo-gama.png');
  const bg1Path = 'C:\\Users\\tetor\\.gemini\\antigravity-ide\\brain\\4449a04b-35b9-45d2-b998-c52b5810763b\\propuesta_1_nueva_1792537131994.jpg';
  const bg2Path = 'C:\\Users\\tetor\\.gemini\\antigravity-ide\\brain\\4449a04b-35b9-45d2-b998-c52b5810763b\\propuesta_2_nueva_1792537168083.jpg';

  const out1Path = path.join(__dirname, '..', 'public', 'marketing', 'propuesta-grafica-1.jpg');
  const out2Path = path.join(__dirname, '..', 'public', 'marketing', 'propuesta-grafica-2.jpg');

  const logoBuf = fs.readFileSync(logoPath);
  const bg1Buf = fs.readFileSync(bg1Path);
  const bg2Buf = fs.readFileSync(bg2Path);

  // ═══════════════════════════════════════════════════════════════════════
  // PROPUESTA 1: ALERTA TRADICIONAL VS MONITOREO REAL 24/7
  // ═══════════════════════════════════════════════════════════════════════
  // El logo se aísla en su octágono nativo (PNG transparente, sin cajas cuadradas)
  const logo1Size = 170;
  const logo1Resized = await sharp(logoBuf).resize(logo1Size).png().toBuffer();

  const svgOverlay1 = Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <!-- HEADER TEXT (En la franja azul superior limpia) -->
      <text x="210" y="75" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#ffffff" letter-spacing="0.5">SEGURIDAD 24/7 SIN COMODATO</text>
      <text x="210" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="16" fill="#38bdf8">Monitoreo Real con Operadores Humanos 24 Horas</text>
      <text x="210" y="142" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="13" fill="#cbd5e1">Verificación en 15 segundos y aviso directo a Carabineros y a tu celular</text>

      <!-- TARJETA LADO IZQUIERDO (Alarma Tradicional) -->
      <g transform="translate(30, 830)">
        <rect x="0" y="0" width="450" height="110" rx="16" fill="rgba(15, 23, 42, 0.88)" stroke="#ef4444" stroke-width="2"/>
        <rect x="18" y="16" width="180" height="26" rx="13" fill="#ef4444"/>
        <text x="32" y="34" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="11" fill="#ffffff" letter-spacing="0.5">ALARMA TRADICIONAL</text>
        <text x="18" y="68" font-family="-apple-system, Roboto, sans-serif" font-weight="800" font-size="15" fill="#fca5a5">Solo hace sonar una sirena</text>
        <text x="18" y="92" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Molesta a los vecinos, pero nadie llega si no estás en casa.</text>
      </g>

      <!-- TARJETA LADO DERECHO (Gama Seguridad) -->
      <g transform="translate(544, 830)">
        <rect x="0" y="0" width="450" height="110" rx="16" fill="rgba(5, 20, 30, 0.90)" stroke="#10b981" stroke-width="2"/>
        <rect x="18" y="16" width="160" height="26" rx="13" fill="#10b981"/>
        <text x="32" y="34" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="11" fill="#042f2e" letter-spacing="0.5">GAMA SEGURIDAD</text>
        <text x="18" y="68" font-family="-apple-system, Roboto, sans-serif" font-weight="800" font-size="15" fill="#6ee7b7">Central de Vigilancia 24/7</text>
        <text x="18" y="92" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Operadores reales que responden en 15 segundos protegiendo tu vida.</text>
      </g>

      <!-- FOOTER STRIP -->
      <rect x="0" y="974" width="1024" height="50" fill="#020617"/>
      <text x="512" y="1005" font-family="-apple-system, Roboto, sans-serif" font-weight="700" font-size="13" fill="#94a3b8" text-anchor="middle">
        🛡️ Eres el único dueño de tu equipo · Sin letras chicas · <tspan fill="#38bdf8">gamasecurity.cl</tspan> · Tel: <tspan fill="#ffffff">32 327 6011</tspan>
      </text>
    </svg>
  `);

  const final1 = await sharp(bg1Buf)
    .composite([
      // Logo oficial aislado puro en su octágono (top-left)
      { input: logo1Resized, top: 22, left: 24 },
      // Capa de textos y tarjetas limpias
      { input: svgOverlay1, top: 0, left: 0 }
    ])
    .jpeg({ quality: 96 })
    .toBuffer();

  // ═══════════════════════════════════════════════════════════════════════
  // PROPUESTA 2: INFOGRAFÍA COMPARATIVA ANTI-COMODATO (SIN "CRA")
  // ═══════════════════════════════════════════════════════════════════════
  const logo2Size = 160;
  const logo2Resized = await sharp(logoBuf).resize(logo2Size).png().toBuffer();

  const svgOverlay2 = Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <!-- HEADER PRINCIPAL -->
      <text x="210" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#ffffff">COMPARA ANTES DE CONTRATAR</text>
      <text x="210" y="104" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="16" fill="#10b981">La verdad sobre las alarmas en Chile: ¿Arriendo o Propiedad?</text>
      <text x="210" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="13" fill="#cbd5e1">25 años de confianza protegiendo hogares y empresas sin cláusulas de amarre</text>

      <!-- CONTENIDO COLUMNA IZQUIERDA: EMPRESAS TRADICIONALES (En el panel rojo) -->
      <g transform="translate(95, 270)">
        <!-- Header Pill -->
        <rect x="0" y="0" width="370" height="42" rx="21" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="185" y="27" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">EMPRESAS TRADICIONALES</text>

        <!-- Punto 1 -->
        <g transform="translate(10, 80)">
          <text x="0" y="0" font-size="20">❌</text>
          <text x="35" y="-2" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="16" fill="#fca5a5">Contratos de 48 meses</text>
          <text x="35" y="22" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Quedas amarrado a pagar 4 años obligatorios.</text>
        </g>

        <!-- Punto 2 -->
        <g transform="translate(10, 165)">
          <text x="0" y="0" font-size="20">❌</text>
          <text x="35" y="-2" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="16" fill="#fca5a5">Equipos en "comodato"</text>
          <text x="35" y="22" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Nunca eres dueño; si cancelas, se llevan todo.</text>
        </g>

        <!-- Punto 3 -->
        <g transform="translate(10, 250)">
          <text x="0" y="0" font-size="20">❌</text>
          <text x="35" y="-2" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="16" fill="#fca5a5">Multas de salida millonarias</text>
          <text x="35" y="22" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Letras chicas que te cobran si quieres terminar el servicio.</text>
        </g>

        <!-- Punto 4 -->
        <g transform="translate(10, 335)">
          <text x="0" y="0" font-size="20">❌</text>
          <text x="35" y="-2" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="16" fill="#fca5a5">Precios que suben sin aviso</text>
          <text x="35" y="22" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Reajustes constantes en UF que inflan la cuenta mensual.</text>
        </g>

        <!-- Punto 5 -->
        <g transform="translate(10, 420)">
          <text x="0" y="0" font-size="20">❌</text>
          <text x="35" y="-2" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="16" fill="#fca5a5">Soporte distante y automatizado</text>
          <text x="35" y="22" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Call centers internacionales que no conocen tu barrio.</text>
        </g>
      </g>

      <!-- CONTENIDO COLUMNA DERECHA: GAMA SEGURIDAD (En el panel verde) -->
      <g transform="translate(560, 270)">
        <!-- Header Pill -->
        <rect x="0" y="0" width="370" height="42" rx="21" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
        <text x="185" y="27" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" letter-spacing="1">GAMA SEGURIDAD</text>

        <!-- Punto 1 -->
        <g transform="translate(10, 80)">
          <text x="0" y="0" font-size="20">✅</text>
          <text x="35" y="-2" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="16" fill="#6ee7b7">El equipo es 100% tuyo</text>
          <text x="35" y="22" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Desde el primer día eres el único dueño de tu alarma.</text>
        </g>

        <!-- Punto 2 -->
        <g transform="translate(10, 165)">
          <text x="0" y="0" font-size="20">✅</text>
          <text x="35" y="-2" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="16" fill="#6ee7b7">Sin letras chicas ni amarres</text>
          <text x="35" y="22" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Te quedas por el buen servicio, no por un contrato forzado.</text>
        </g>

        <!-- Punto 3 -->
        <g transform="translate(10, 250)">
          <text x="0" y="0" font-size="20">✅</text>
          <text x="35" y="-2" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="16" fill="#6ee7b7">Monitoreo 24/7 con personas reales</text>
          <text x="35" y="22" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Operadores profesionales vigilando tu casa día y noche.</text>
        </g>

        <!-- Punto 4 -->
        <g transform="translate(10, 335)">
          <text x="0" y="0" font-size="20">✅</text>
          <text x="35" y="-2" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="16" fill="#6ee7b7">Respuesta en 15 segundos</text>
          <text x="35" y="22" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Aviso instantáneo a Carabineros y a tu teléfono móvil.</text>
        </g>

        <!-- Punto 5 -->
        <g transform="translate(10, 420)">
          <text x="0" y="0" font-size="20">✅</text>
          <text x="35" y="-2" font-family="-apple-system, Roboto, sans-serif" font-weight="900" font-size="16" fill="#6ee7b7">App móvil con botón de pánico</text>
          <text x="35" y="22" font-family="-apple-system, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Protección para ti y tu familia ante portonazos o emergencias.</text>
        </g>
      </g>

      <!-- FOOTER STRIP -->
      <rect x="0" y="964" width="1024" height="60" fill="#020617"/>
      <text x="512" y="1000" font-family="-apple-system, Roboto, sans-serif" font-weight="700" font-size="13" fill="#94a3b8" text-anchor="middle">
        Chile Merece Seguridad Transparente · Cotiza en <tspan fill="#34d399">gamasecurity.cl</tspan> o al WhatsApp <tspan fill="#ffffff">+56 9 9101 6912</tspan>
      </text>
    </svg>
  `);

  const final2 = await sharp(bg2Buf)
    .composite([
      // Logo oficial aislado puro en su octágono (top-left)
      { input: logo2Resized, top: 18, left: 24 },
      // Capa de textos y columnas limpias
      { input: svgOverlay2, top: 0, left: 0 }
    ])
    .jpeg({ quality: 96 })
    .toBuffer();

  fs.writeFileSync(out1Path, final1);
  fs.writeFileSync(out2Path, final2);

  // Sincronizar en la carpeta brain
  fs.writeFileSync(bg1Path, final1);
  fs.writeFileSync(bg2Path, final2);

  console.log('SUCCESS: Brand new pristine proposals generated without CRA and with isolated octagon logo!');
}

renderGraphics().catch(console.error);

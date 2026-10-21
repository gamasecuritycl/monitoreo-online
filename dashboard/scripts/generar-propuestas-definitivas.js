const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function renderGraphicsDefinitivas() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo-gama.png');
  const bg1Path = 'C:\\Users\\tetor\\.gemini\\antigravity-ide\\brain\\4449a04b-35b9-45d2-b998-c52b5810763b\\propuesta_1_nueva_1792537131994.jpg';

  const out1Path = path.join(__dirname, '..', 'public', 'marketing', 'propuesta-grafica-1.jpg');
  const out2Path = path.join(__dirname, '..', 'public', 'marketing', 'propuesta-grafica-2.jpg');

  const artifact1Path = 'C:\\Users\\tetor\\.gemini\\antigravity-ide\\brain\\4449a04b-35b9-45d2-b998-c52b5810763b\\propuesta_grafica_1_final.jpg';
  const artifact2Path = 'C:\\Users\\tetor\\.gemini\\antigravity-ide\\brain\\4449a04b-35b9-45d2-b998-c52b5810763b\\propuesta_grafica_2_final.jpg';

  const logoBuf = fs.readFileSync(logoPath);
  const bg1Buf = fs.readFileSync(bg1Path);

  // ═══════════════════════════════════════════════════════════════════════
  // PROPUESTA 1: ALERTA TRADICIONAL VS MONITOREO REAL 24/7
  // Con cajas amplias y texto en dos líneas para holgura de 100px+
  // ═══════════════════════════════════════════════════════════════════════
  const logo1Size = 150;
  const logo1Resized = await sharp(logoBuf).resize(logo1Size).png().toBuffer();

  const svgOverlay1 = Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <!-- HEADER PRINCIPAL -->
      <text x="190" y="65" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="28" fill="#ffffff" letter-spacing="0.5">SEGURIDAD 24/7 SIN COMODATO</text>
      <text x="190" y="100" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="16" fill="#38bdf8">Monitoreo Real con Operadores Humanos 24 Horas</text>
      <text x="190" y="128" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="13" fill="#cbd5e1">Verificación en 15 segundos y aviso directo a Carabineros y a tu celular</text>

      <!-- TARJETA IZQUIERDA: ALARMA TRADICIONAL (Ancho: 470, Alto: 125) -->
      <g transform="translate(26, 825)">
        <rect x="0" y="0" width="470" height="125" rx="16" fill="rgba(15, 23, 42, 0.92)" stroke="#ef4444" stroke-width="2.5"/>
        <!-- Pill superior -->
        <rect x="18" y="14" width="180" height="26" rx="13" fill="#ef4444"/>
        <text x="108" y="32" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">ALARMA TRADICIONAL</text>
        <!-- Título -->
        <text x="18" y="64" font-family="Arial, sans-serif" font-weight="800" font-size="15" fill="#fca5a5">Solo hace sonar una sirena</text>
        <!-- Descripción corta en 2 líneas, holgura de más de 120px a la derecha -->
        <text x="18" y="88" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Molesta a los vecinos, pero nadie llega</text>
        <text x="18" y="106" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#94a3b8">si tu casa o negocio se encuentra vacío.</text>
      </g>

      <!-- TARJETA DERECHA: GAMA SEGURIDAD (Ancho: 470, Alto: 125) -->
      <g transform="translate(528, 825)">
        <rect x="0" y="0" width="470" height="125" rx="16" fill="rgba(4, 20, 24, 0.94)" stroke="#10b981" stroke-width="2.5"/>
        <!-- Pill superior -->
        <rect x="18" y="14" width="165" height="26" rx="13" fill="#10b981"/>
        <text x="100" y="32" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#022c22" text-anchor="middle" letter-spacing="0.5">GAMA SEGURIDAD</text>
        <!-- Título -->
        <text x="18" y="64" font-family="Arial, sans-serif" font-weight="800" font-size="15" fill="#6ee7b7">Central de Vigilancia 24/7</text>
        <!-- Descripción en 2 líneas, sin tocar el borde jamás -->
        <text x="18" y="88" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Operadores verifican en 15 segundos</text>
        <text x="18" y="106" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#a7f3d0">y coordinan de inmediato con Carabineros.</text>
      </g>

      <!-- FOOTER STRIP -->
      <rect x="0" y="974" width="1024" height="50" fill="#020617"/>
      <text x="512" y="1005" font-family="Arial, sans-serif" font-weight="700" font-size="13" fill="#94a3b8" text-anchor="middle">
        🛡️ Eres el único dueño de tu equipo · Sin letras chicas · <tspan fill="#38bdf8">gamasecurity.cl</tspan> · Tel: <tspan fill="#ffffff">32 327 6011</tspan>
      </text>
    </svg>
  `);

  await sharp(bg1Buf)
    .composite([
      { input: logo1Resized, top: 18, left: 22 },
      { input: svgOverlay1, top: 0, left: 0 }
    ])
    .jpeg({ quality: 96 })
    .toFile(out1Path);

  fs.copyFileSync(out1Path, artifact1Path);
  console.log('✓ Propuesta 1 generada con holgura total');

  // ═══════════════════════════════════════════════════════════════════════
  // PROPUESTA 2: INFOGRAFÍA ANTI-COMODATO 100% ENCUADRADA
  // Cada texto tiene 2 líneas cortas con margen derecho de más de 100px
  // ═══════════════════════════════════════════════════════════════════════
  const logo2Size = 135;
  const logo2Resized = await sharp(logoBuf).resize(logo2Size).png().toBuffer();

  const svgOverlay2 = Buffer.from(`
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Fondo general -->
      <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#040b17"/>
        <stop offset="50%" stop-color="#061226"/>
        <stop offset="100%" stop-color="#02060f"/>
      </linearGradient>

      <!-- Gradiente Card Tradicionales -->
      <linearGradient id="cardRedGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#190a0f"/>
        <stop offset="100%" stop-color="#0d0407"/>
      </linearGradient>

      <!-- Gradiente Card Gama -->
      <linearGradient id="cardGreenGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#041a18"/>
        <stop offset="100%" stop-color="#020e0d"/>
      </linearGradient>

      <!-- Sombra Roja -->
      <filter id="shadowRed" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#ef4444" flood-opacity="0.25"/>
      </filter>

      <!-- Sombra Verde -->
      <filter id="shadowGreen" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#10b981" flood-opacity="0.30"/>
      </filter>
    </defs>

    <!-- FONDO BASE -->
    <rect width="1080" height="1080" fill="url(#bgGrad2)"/>

    <!-- LÍNEA SEPARADORA SUPERIOR -->
    <line x1="0" y1="185" x2="1080" y2="185" stroke="#1e293b" stroke-width="1.5"/>

    <!-- ==================== HEADER ==================== -->
    <g transform="translate(180, 42)">
      <text x="0" y="36" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="34" fill="#ffffff" letter-spacing="0.5">
        COMPARA ANTES DE CONTRATAR
      </text>
      <text x="0" y="70" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="18" fill="#38bdf8">
        La verdad sobre las alarmas en Chile: ¿Arriendo o Propiedad?
      </text>
      <text x="0" y="100" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="13" fill="#94a3b8">
        25 años de confianza protegiendo hogares y empresas sin cláusulas de amarre
      </text>
    </g>

    <!-- ==================== COLUMNA 1: TRADICIONALES ==================== -->
    <!-- Caja roja: X: 45, Y: 210, W: 470, H: 785 -->
    <g filter="url(#shadowRed)">
      <rect x="45" y="210" width="470" height="785" rx="20" fill="url(#cardRedGrad2)" stroke="#dc2626" stroke-width="2.5"/>
    </g>

    <g transform="translate(45, 210)">
      <!-- Pill de título -->
      <rect x="35" y="22" width="400" height="50" rx="25" fill="#450a0a" stroke="#ef4444" stroke-width="1.5"/>
      <text x="235" y="47" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#fecaca" text-anchor="middle" letter-spacing="1">
        EMPRESAS TRADICIONALES
      </text>
      <text x="235" y="62" font-family="Arial, sans-serif" font-weight="700" font-size="10" fill="#f87171" text-anchor="middle" letter-spacing="0.5">
        (MODELO DE ARRIENDO CON AMARRE)
      </text>

      <line x1="35" y1="88" x2="435" y2="88" stroke="#7f1d1d" stroke-width="1"/>

      <!-- Item 1: 48 Meses -->
      <g transform="translate(35, 115)">
        <circle cx="16" cy="14" r="14" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">✕</text>
        <text x="44" y="12" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#fca5a5">Contratos de 48 meses</text>
        <text x="44" y="32" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#cbd5e1">Quedas amarrado 4 años obligatorios.</text>
        <text x="44" y="48" font-family="Arial, sans-serif" font-weight="500" font-size="11" fill="#94a3b8">Más de $2.000.000 sin ser dueño de nada.</text>
      </g>

      <!-- Item 2: Comodato -->
      <g transform="translate(35, 245)">
        <circle cx="16" cy="14" r="14" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">✕</text>
        <text x="44" y="12" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#fca5a5">Equipos en "comodato"</text>
        <text x="44" y="32" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#cbd5e1">Nunca eres dueño de tu sistema.</text>
        <text x="44" y="48" font-family="Arial, sans-serif" font-weight="500" font-size="11" fill="#94a3b8">Si cancelas, se llevan todo el equipo.</text>
      </g>

      <!-- Item 3: Multas -->
      <g transform="translate(35, 375)">
        <circle cx="16" cy="14" r="14" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">✕</text>
        <text x="44" y="12" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#fca5a5">Multas de salida millonarias</text>
        <text x="44" y="32" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#cbd5e1">Letras chicas por término anticipado.</text>
        <text x="44" y="48" font-family="Arial, sans-serif" font-weight="500" font-size="11" fill="#94a3b8">Dificultad extrema para dar de baja.</text>
      </g>

      <!-- Item 4: Alzas de precio -->
      <g transform="translate(35, 505)">
        <circle cx="16" cy="14" r="14" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">✕</text>
        <text x="44" y="12" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#fca5a5">Precios que suben sin aviso</text>
        <text x="44" y="32" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#cbd5e1">Reajustes constantes que inflan la cuenta.</text>
        <text x="44" y="48" font-family="Arial, sans-serif" font-weight="500" font-size="11" fill="#94a3b8">Cobros en UF con sorpresas mensuales.</text>
      </g>

      <!-- Item 5: Call center distante -->
      <g transform="translate(35, 635)">
        <circle cx="16" cy="14" r="14" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">✕</text>
        <text x="44" y="12" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#fca5a5">Soporte automatizado</text>
        <text x="44" y="32" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#cbd5e1">Call centers que no conocen tu zona.</text>
        <text x="44" y="48" font-family="Arial, sans-serif" font-weight="500" font-size="11" fill="#94a3b8">Demoras de horas para una respuesta.</text>
      </g>
    </g>

    <!-- ==================== COLUMNA 2: GAMA SEGURIDAD ==================== -->
    <!-- Caja verde: X: 565, Y: 210, W: 470, H: 785 -->
    <g filter="url(#shadowGreen)">
      <rect x="565" y="210" width="470" height="785" rx="20" fill="url(#cardGreenGrad2)" stroke="#10b981" stroke-width="2.5"/>
    </g>

    <g transform="translate(565, 210)">
      <!-- Pill de título -->
      <rect x="35" y="22" width="400" height="50" rx="25" fill="#064e3b" stroke="#34d399" stroke-width="2"/>
      <text x="235" y="47" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        GAMA SEGURIDAD
      </text>
      <text x="235" y="62" font-family="Arial, sans-serif" font-weight="700" font-size="10" fill="#34d399" text-anchor="middle" letter-spacing="0.5">
        (EQUIPO 100% TUYO + MONITOREO REAL)
      </text>

      <line x1="35" y1="88" x2="435" y2="88" stroke="#065f46" stroke-width="1"/>

      <!-- Item 1: 100% Tuyo -->
      <g transform="translate(35, 115)">
        <circle cx="16" cy="14" r="14" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#34d399" text-anchor="middle">✓</text>
        <text x="44" y="12" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#a7f3d0">El equipo es 100% tuyo</text>
        <text x="44" y="32" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Eres el único dueño desde el día 1.</text>
        <text x="44" y="48" font-family="Arial, sans-serif" font-weight="500" font-size="11" fill="#6ee7b7">Equipos abiertos: DSC, Crow, Paradox, Vetti.</text>
      </g>

      <!-- Item 2: Sin amarres -->
      <g transform="translate(35, 245)">
        <circle cx="16" cy="14" r="14" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#34d399" text-anchor="middle">✓</text>
        <text x="44" y="12" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#a7f3d0">Sin letras chicas ni amarres</text>
        <text x="44" y="32" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Te quedas por el buen servicio.</text>
        <text x="44" y="48" font-family="Arial, sans-serif" font-weight="500" font-size="11" fill="#6ee7b7">Puedes cancelar cuando quieras sin multas.</text>
      </g>

      <!-- Item 3: Monitoreo con personas -->
      <g transform="translate(35, 375)">
        <circle cx="16" cy="14" r="14" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#34d399" text-anchor="middle">✓</text>
        <text x="44" y="12" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#a7f3d0">Monitoreo con personas reales</text>
        <text x="44" y="32" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Operadores profesionales las 24 horas.</text>
        <text x="44" y="48" font-family="Arial, sans-serif" font-weight="500" font-size="11" fill="#6ee7b7">Verificación inmediata con video y audio.</text>
      </g>

      <!-- Item 4: Respuesta en 15s -->
      <g transform="translate(35, 505)">
        <circle cx="16" cy="14" r="14" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#34d399" text-anchor="middle">✓</text>
        <text x="44" y="12" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#a7f3d0">Respuesta en 15 segundos</text>
        <text x="44" y="32" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Aviso instantáneo a Carabineros.</text>
        <text x="44" y="48" font-family="Arial, sans-serif" font-weight="500" font-size="11" fill="#6ee7b7">Notificación inmediata a tu teléfono celular.</text>
      </g>

      <!-- Item 5: App móvil y pánico -->
      <g transform="translate(35, 635)">
        <circle cx="16" cy="14" r="14" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#34d399" text-anchor="middle">✓</text>
        <text x="44" y="12" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#a7f3d0">App móvil con botón de pánico</text>
        <text x="44" y="32" font-family="Arial, sans-serif" font-weight="500" font-size="12" fill="#e2e8f0">Protección para toda tu familia.</text>
        <text x="44" y="48" font-family="Arial, sans-serif" font-weight="500" font-size="11" fill="#6ee7b7">Control ante portonazos y emergencias.</text>
      </g>
    </g>

    <!-- ==================== FOOTER ==================== -->
    <g transform="translate(540, 1045)">
      <text x="0" y="0" font-family="Arial, sans-serif" font-weight="600" font-size="13" fill="#94a3b8" text-anchor="middle">
        🛡️ Chile Merece Seguridad Transparente · Cotiza en <tspan fill="#38bdf8" font-weight="700">gamasecurity.cl</tspan> · Tel: <tspan fill="#ffffff" font-weight="700">32 327 6011</tspan> · WhatsApp: <tspan fill="#34d399" font-weight="700">+56 9 9101 6912</tspan>
      </text>
    </g>
  </svg>
  `);

  await sharp(svgOverlay2)
    .composite([
      { input: logo2Resized, top: 32, left: 32 }
    ])
    .jpeg({ quality: 96 })
    .toFile(out2Path);

  fs.copyFileSync(out2Path, artifact2Path);
  console.log('✓ Propuesta 2 generada con encuadre perfecto y márgenes amplios');
}

renderGraphicsDefinitivas().catch(console.error);

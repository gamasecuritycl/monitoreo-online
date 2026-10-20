const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function buildPropuesta2() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo-gama.png');
  const outputPath = path.join(__dirname, '..', 'public', 'marketing', 'propuesta-grafica-2.jpg');
  const artifactPath = 'C:\\Users\\tetor\\.gemini\\antigravity-ide\\brain\\4449a04b-35b9-45d2-b998-c52b5810763b\\propuesta_grafica_2_final.jpg';

  // Redimensionar logo oficial manteniendo su transparencia
  const logoBuffer = await sharp(logoPath)
    .resize(130, 130, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // SVG con diseño 100% geométrico y matemáticamente encuadrado
  const svgOverlay = Buffer.from(`
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Fondo general -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#040b17"/>
        <stop offset="40%" stop-color="#061226"/>
        <stop offset="100%" stop-color="#02060f"/>
      </linearGradient>

      <!-- Gradiente Card Tradicionales -->
      <linearGradient id="cardRedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#180a0e"/>
        <stop offset="100%" stop-color="#0b0507"/>
      </linearGradient>

      <!-- Gradiente Card Gama -->
      <linearGradient id="cardGreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#041a18"/>
        <stop offset="100%" stop-color="#020d0c"/>
      </linearGradient>

      <!-- Filtro Glow para Gama -->
      <filter id="glowGreen" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#10b981" flood-opacity="0.35"/>
      </filter>

      <!-- Filtro Glow para Tradicionales -->
      <filter id="glowRed" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ef4444" flood-opacity="0.25"/>
      </filter>
    </defs>

    <!-- FONDO BASE -->
    <rect width="1080" height="1080" fill="url(#bgGrad)"/>

    <!-- LÍNEAS TÉCNICAS SUTILES DE FONDO (Cyber Grid) -->
    <line x1="0" y1="185" x2="1080" y2="185" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="540" y1="210" x2="540" y2="1010" stroke="#0f172a" stroke-width="1" stroke-dasharray="6,6"/>

    <!-- ==================== HEADER OFICIAL ==================== -->
    <g transform="translate(185, 45)">
      <text x="0" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" fill="#ffffff" letter-spacing="0.5">
        COMPARA ANTES DE CONTRATAR
      </text>
      <text x="0" y="72" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="18" fill="#38bdf8">
        La verdad sobre las alarmas en Chile: ¿Arriendo o Propiedad?
      </text>
      <text x="0" y="102" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="14" fill="#94a3b8">
        25 años protegiendo hogares y empresas con transparencia y sin comodatos abusivos
      </text>
    </g>

    <!-- ==================== COLUMNA 1: EMPRESAS TRADICIONALES ==================== -->
    <!-- Caja contenedora exterior (X: 45, Y: 210, W: 470, H: 790) -->
    <g filter="url(#glowRed)">
      <rect x="45" y="210" width="470" height="790" rx="20" fill="url(#cardRedGrad)" stroke="#dc2626" stroke-width="2"/>
    </g>

    <!-- Cabecera de la Tarjeta Tradicional -->
    <g transform="translate(45, 210)">
      <!-- Pill superior -->
      <rect x="35" y="24" width="400" height="46" rx="23" fill="#450a0a" stroke="#ef4444" stroke-width="1.5"/>
      <text x="235" y="53" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="15" fill="#fecaca" text-anchor="middle" letter-spacing="1">
        EMPRESAS TRADICIONALES
      </text>
      <text x="235" y="92" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="11" fill="#f87171" text-anchor="middle" letter-spacing="0.5">
        (MODELO DE ARRIENDO CON CLÁUSULAS DE AMARRE)
      </text>
      
      <!-- Separador interno -->
      <line x1="35" y1="110" x2="435" y2="110" stroke="#7f1d1d" stroke-width="1"/>

      <!-- Fila 1: Contrato 48 Meses -->
      <g transform="translate(35, 140)">
        <circle cx="16" cy="12" r="14" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="16" y="18" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">✕</text>
        <text x="42" y="10" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="800" font-size="16" fill="#fca5a5">Contratos de 48 meses</text>
        <text x="42" y="32" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="500" font-size="13" fill="#cbd5e1">Quedas amarrado a pagar 4 años obligatorios.</text>
        <text x="42" y="50" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="400" font-size="11" fill="#94a3b8">Más de $2.000.000 gastados sin ser dueño de nada.</text>
      </g>

      <!-- Fila 2: Equipos en Comodato -->
      <g transform="translate(35, 270)">
        <circle cx="16" cy="12" r="14" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="16" y="18" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">✕</text>
        <text x="42" y="10" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="800" font-size="16" fill="#fca5a5">Equipos en "comodato"</text>
        <text x="42" y="32" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="500" font-size="13" fill="#cbd5e1">Nunca eres dueño de tu sistema de seguridad.</text>
        <text x="42" y="50" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="400" font-size="11" fill="#94a3b8">Si cancelas el servicio, te retiran y desconectan todo.</text>
      </g>

      <!-- Fila 3: Multas de salida -->
      <g transform="translate(35, 400)">
        <circle cx="16" cy="12" r="14" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="16" y="18" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">✕</text>
        <text x="42" y="10" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="800" font-size="16" fill="#fca5a5">Multas de salida millonarias</text>
        <text x="42" y="32" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="500" font-size="13" fill="#cbd5e1">Letras chicas con cobros por término anticipado.</text>
        <text x="42" y="50" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="400" font-size="11" fill="#94a3b8">Dificultad extrema para dar de baja el contrato.</text>
      </g>

      <!-- Fila 4: Precios con alzas continuas -->
      <g transform="translate(35, 530)">
        <circle cx="16" cy="12" r="14" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="16" y="18" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">✕</text>
        <text x="42" y="10" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="800" font-size="16" fill="#fca5a5">Precios que suben sin aviso</text>
        <text x="42" y="32" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="500" font-size="13" fill="#cbd5e1">Cobros en UF con reajustes periódicos imprevistos.</text>
        <text x="42" y="50" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="400" font-size="11" fill="#94a3b8">Comienzas pagando una tarifa y termina siendo el doble.</text>
      </g>

      <!-- Fila 5: Call center distante -->
      <g transform="translate(35, 660)">
        <circle cx="16" cy="12" r="14" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="16" y="18" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">✕</text>
        <text x="42" y="10" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="800" font-size="16" fill="#fca5a5">Soporte distante y automatizado</text>
        <text x="42" y="32" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="500" font-size="13" fill="#cbd5e1">Call centers con grabaciones que no conocen tu zona.</text>
        <text x="42" y="50" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="400" font-size="11" fill="#94a3b8">Demoras de horas para responder solicitudes técnicas.</text>
      </g>
    </g>


    <!-- ==================== COLUMNA 2: GAMA SEGURIDAD ==================== -->
    <!-- Caja contenedora exterior (X: 565, Y: 210, W: 470, H: 790) -->
    <g filter="url(#glowGreen)">
      <rect x="565" y="210" width="470" height="790" rx="20" fill="url(#cardGreenGrad)" stroke="#10b981" stroke-width="2.5"/>
    </g>

    <!-- Cabecera de la Tarjeta Gama -->
    <g transform="translate(565, 210)">
      <!-- Pill superior -->
      <rect x="35" y="24" width="400" height="46" rx="23" fill="#064e3b" stroke="#34d399" stroke-width="2"/>
      <text x="235" y="53" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        GAMA SEGURIDAD
      </text>
      <text x="235" y="92" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="11" fill="#34d399" text-anchor="middle" letter-spacing="0.5">
        (EQUIPO 100% TUYO + MONITOREO REAL 24/7)
      </text>

      <!-- Separador interno -->
      <line x1="35" y1="110" x2="435" y2="110" stroke="#065f46" stroke-width="1"/>

      <!-- Fila 1: Equipo 100% tuyo -->
      <g transform="translate(35, 140)">
        <circle cx="16" cy="12" r="14" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
        <text x="16" y="18" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="15" fill="#34d399" text-anchor="middle">✓</text>
        <text x="42" y="10" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="800" font-size="16" fill="#a7f3d0">El equipo es 100% tuyo</text>
        <text x="42" y="32" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Eres el único dueño de tu alarma desde el primer día.</text>
        <text x="42" y="50" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="400" font-size="11" fill="#6ee7b7">Equipos abiertos y estándar: DSC, Crow, Paradox, Vetti.</text>
      </g>

      <!-- Fila 2: Sin amarres -->
      <g transform="translate(35, 270)">
        <circle cx="16" cy="12" r="14" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
        <text x="16" y="18" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="15" fill="#34d399" text-anchor="middle">✓</text>
        <text x="42" y="10" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="800" font-size="16" fill="#a7f3d0">Sin letras chicas ni amarres</text>
        <text x="42" y="32" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Te quedas por el buen servicio, no por obligación.</text>
        <text x="42" y="50" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="400" font-size="11" fill="#6ee7b7">Puedes cancelar cuando quieras con cero multas.</text>
      </g>

      <!-- Fila 3: Monitoreo con personas reales -->
      <g transform="translate(35, 400)">
        <circle cx="16" cy="12" r="14" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
        <text x="16" y="18" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="15" fill="#34d399" text-anchor="middle">✓</text>
        <text x="42" y="10" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="800" font-size="16" fill="#a7f3d0">Monitoreo 24/7 con personas reales</text>
        <text x="42" y="32" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Operadores profesionales cuidando tu propiedad.</text>
        <text x="42" y="50" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="400" font-size="11" fill="#6ee7b7">Verificación inmediata con video y audio en tiempo real.</text>
      </g>

      <!-- Fila 4: Respuesta en 15s -->
      <g transform="translate(35, 530)">
        <circle cx="16" cy="12" r="14" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
        <text x="16" y="18" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="15" fill="#34d399" text-anchor="middle">✓</text>
        <text x="42" y="10" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="800" font-size="16" fill="#a7f3d0">Respuesta en 15 segundos</text>
        <text x="42" y="32" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Aviso instantáneo a Carabineros y a tu teléfono móvil.</text>
        <text x="42" y="50" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="400" font-size="11" fill="#6ee7b7">Protocolo Alpha de seguridad sin dilaciones.</text>
      </g>

      <!-- Fila 5: App móvil y pánico -->
      <g transform="translate(35, 660)">
        <circle cx="16" cy="12" r="14" fill="#064e3b" stroke="#34d399" stroke-width="1.5"/>
        <text x="16" y="18" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="15" fill="#34d399" text-anchor="middle">✓</text>
        <text x="42" y="10" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="800" font-size="16" fill="#a7f3d0">App móvil con botón de pánico</text>
        <text x="42" y="32" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="500" font-size="13" fill="#e2e8f0">Protección para ti y tu familia ante portonazos.</text>
        <text x="42" y="50" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="400" font-size="11" fill="#6ee7b7">Control total desde tu smartphone estés donde estés.</text>
      </g>
    </g>

    <!-- ==================== FOOTER ==================== -->
    <g transform="translate(540, 1045)">
      <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="13" fill="#94a3b8" text-anchor="middle">
        🛡️ Chile Merece Seguridad Transparente · Cotiza en <tspan fill="#38bdf8" font-weight="700">gamasecurity.cl</tspan> · Tel: <tspan fill="#ffffff" font-weight="700">32 327 6011</tspan> · WhatsApp: <tspan fill="#34d399" font-weight="700">+56 9 9101 6912</tspan>
      </text>
    </g>
  </svg>
  `);

  // Componer imagen final
  await sharp(svgOverlay)
    .composite([
      {
        input: logoBuffer,
        top: 35,
        left: 35
      }
    ])
    .jpeg({ quality: 96 })
    .toFile(outputPath);

  fs.copyFileSync(outputPath, artifactPath);
  console.log('PROPUESTA 2 GENERADA CON ÉXITO Y PERFECTAMENTE ENCUADRADA');
}

buildPropuesta2().catch(console.error);

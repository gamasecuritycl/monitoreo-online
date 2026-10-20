const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processGraphics() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo-gama.png');
  const clean1Path = 'C:\\Users\\tetor\\.gemini\\antigravity-ide\\brain\\4449a04b-35b9-45d2-b998-c52b5810763b\\propuesta_grafica_1_1792530898024.jpg';
  const clean2Path = 'C:\\Users\\tetor\\.gemini\\antigravity-ide\\brain\\4449a04b-35b9-45d2-b998-c52b5810763b\\propuesta_grafica_2_1792530923423.jpg';

  const out1Path = path.join(__dirname, '..', 'public', 'marketing', 'propuesta-grafica-1.jpg');
  const out2Path = path.join(__dirname, '..', 'public', 'marketing', 'propuesta-grafica-2.jpg');

  const logoBuf = fs.readFileSync(logoPath);
  const img1Buf = fs.readFileSync(clean1Path);
  const img2Buf = fs.readFileSync(clean2Path);

  // --- BADGE 1: PROPUESTA 1 (Top-Left) ---
  const logo1Width = 180;
  const resizedLogo1 = await sharp(logoBuf).resize(logo1Width).png().toBuffer();
  
  const box1W = logo1Width + 20;
  const box1H = logo1Width + 20;
  const bg1Svg = Buffer.from(`
    <svg width="${box1W}" height="${box1H}">
      <rect x="0" y="0" width="${box1W}" height="${box1H}" rx="22" fill="#030917" stroke="#0ea5e9" stroke-width="2.5"/>
    </svg>
  `);
  const badge1 = await sharp(bg1Svg)
    .composite([{ input: resizedLogo1, top: 10, left: 10 }])
    .png()
    .toBuffer();

  const final1 = await sharp(img1Buf)
    .composite([{ input: badge1, top: 32, left: 32 }])
    .jpeg({ quality: 96 })
    .toBuffer();

  // --- BADGE 2: PROPUESTA 2 (Bottom-Right, cubre exactamente la pestaña blanca falsa) ---
  const box2W = 394;
  const box2H = 194;
  const logo2Width = 165;
  const resizedLogo2 = await sharp(logoBuf).resize(logo2Width).png().toBuffer();

  const bg2Svg = Buffer.from(`
    <svg width="${box2W}" height="${box2H}">
      <rect x="0" y="0" width="${box2W}" height="${box2H}" rx="24" fill="#030816" stroke="#10b981" stroke-width="2.5"/>
      <text x="190" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#ffffff">GAMA SEGURIDAD</text>
      <text x="190" y="92" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="13" fill="#34d399" letter-spacing="1">PROTEGIDO 24/7</text>
      <text x="190" y="118" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="#94a3b8">Central CRA en Chile</text>
      <text x="190" y="146" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="13" fill="#38bdf8">gamasecurity.cl</text>
    </svg>
  `);

  const badge2 = await sharp(bg2Svg)
    .composite([{ input: resizedLogo2, top: 14, left: 14 }])
    .png()
    .toBuffer();

  const final2 = await sharp(img2Buf)
    .composite([{ input: badge2, top: 830, left: 630 }])
    .jpeg({ quality: 96 })
    .toBuffer();

  fs.writeFileSync(out1Path, final1);
  fs.writeFileSync(out2Path, final2);

  console.log('SUCCESS: Pixel-perfect branded graphics ready!');
}

processGraphics().catch(console.error);

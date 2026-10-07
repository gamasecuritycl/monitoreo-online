const { jsPDF } = require('jspdf')
const fs = require('fs')
const path = require('path')

const ASSETS_DIR = path.join(__dirname, '..', '..', 'whatsapp-ventas-cloud', 'assets')
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true })

// ═══════════════════════════════════════════════════════════════════════
// 1. FICHA TÉCNICA OFICIAL: PACK VETTI SMART & MONITOREO 24/7
// ═══════════════════════════════════════════════════════════════════════
function generarPDFAlarmas() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // 1. Header Banner Azul Marino / Electric Blue
  doc.setFillColor(15, 23, 42) // #0f172a slate-900
  doc.rect(0, 0, 210, 32, 'F')
  doc.setFillColor(2, 132, 199) // #0284c7 sky-600
  doc.rect(0, 30, 210, 2, 'F')

  // Título y Marca
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('GAMA SEGURIDAD CHILE', 14, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('CENTRAL DE MONITOREO 24/7  •  SEGURIDAD ELECTRÓNICA PROFESIONAL', 14, 19)
  doc.text('R.U.T.: 76.319.399-3  •  VALPARAÍSO / VIÑA DEL MAR / RM  •  WWW.GAMASECURITY.CL', 14, 25)

  // Badge Derecha Header
  doc.setFillColor(30, 41, 59)
  doc.roundedRect(138, 6, 58, 18, 2, 2, 'F')
  doc.setTextColor(56, 189, 248)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('FICHA TÉCNICA OFICIAL', 142, 12)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text('PACK VETTI SMART 4G', 142, 18)

  // 2. Subtítulo Destacado
  let y = 40
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('SISTEMA DE ALARMA INTELIGENTE INALÁMBRICO & MONITOREO 24/7', 14, y)

  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text('Protección perimetral e interior de alta gama. Equipos 100% de propiedad del cliente (sin comodato engañoso ni arriendos eternos).', 14, y)

  // 3. Tarjetas Bento de Beneficios Clave
  y += 8
  const boxes = [
    { title: 'EQUIPOS PROPIOS', sub: '100% tuyos para siempre. Sin arriendos de $75.000.', bg: [238, 242, 255], border: [99, 102, 241] },
    { title: 'MONITOREO 24/7', sub: 'Desde 0,9 UF + IVA/mes. Central humana y Carabineros.', bg: [240, 253, 244], border: [34, 197, 94] },
    { title: 'DOBLE VÍA SEGURA', sub: 'WiFi + Chip 4G GSM anti-corte de energía y sabotaje.', bg: [254, 243, 199], border: [245, 158, 11] },
    { title: 'INSTALACIÓN $0', sub: 'Mano de obra bonificada con el plan de monitoreo.', bg: [241, 245, 249], border: [148, 163, 184] }
  ]

  boxes.forEach((b, i) => {
    const bx = 14 + (i * 47)
    doc.setFillColor(b.bg[0], b.bg[1], b.bg[2])
    doc.setDrawColor(b.border[0], b.border[1], b.border[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(bx, y, 44, 18, 1.5, 1.5, 'FD')

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(b.title, bx + 3, y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(71, 85, 105)
    doc.text(doc.splitTextToSize(b.sub, 38), bx + 3, y + 10.5)
  })

  // 4. Sección de Componentes del Kit
  y += 26
  doc.setFillColor(241, 245, 249)
  doc.rect(14, y, 182, 6, 'F')
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('1. COMPONENTES Y ESPECIFICACIONES TÉCNICAS DEL SISTEMA', 16, y + 4.2)

  y += 9
  const items = [
    { num: '01', nombre: 'Central Inteligente Vetti Hub Pro', desc: 'Panel principal táctil con conexión simultánea WiFi + 4G GSM. Batería de respaldo litio autónoma ante cortes de luz de hasta 12 horas. Compatible con hasta 100 zonas inalámbricas.' },
    { num: '02', nombre: 'Sensores Infrarrojos PIR Antimascotas', desc: 'Lente óptica con microprocesador digital inteligente. Inmune al movimiento de mascotas de hasta 25 kg (perros y gatos). Rango de detección de 12 metros y ángulo de 110°.' },
    { num: '03', nombre: 'Contactos Magnéticos para Accesos', desc: 'Protección perimetral de ultra respuesta para puertas principales y ventanales. Detecta apertura instantánea y transmite alerta cifrada anti-interferencia a la central.' },
    { num: '04', nombre: 'Sirena Interior / Exterior de Alta Potencia (110 dB)', desc: 'Potencia acústica disuasiva inmediata que ahuyenta a intrusos y alerta a la comunidad vecinal. Sistema antisabotaje con aviso de corte.' },
    { num: '05', nombre: 'Controles Remotos SOS Multifunción', desc: 'Pulsadores ergonómicos para armado total, armado noche en casa, desarmado y botón de pánico médico o asalto con respuesta inmediata.' },
    { num: '06', nombre: 'Aplicación Móvil NT CLICK (iOS / Android)', desc: 'Control total de la alarma en la palma de tu mano: armado/desarmado remoto, registro histórico de eventos en vivo y notificaciones push ilimitadas.' }
  ]

  items.forEach((it) => {
    doc.setFillColor(2, 132, 199)
    doc.rect(14, y, 7, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(it.num, 15, y + 4.8)

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text(it.nombre, 24, y + 4.2)

    y += 6
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.2)
    const lineas = doc.splitTextToSize(it.desc, 172)
    doc.text(lineas, 24, y)
    y += (lineas.length * 3.5) + 3
  })

  // 5. Comparativa Diferencial vs Grandes Empresas
  y = Math.max(y + 2, 196)
  doc.setFillColor(241, 245, 249)
  doc.rect(14, y, 182, 6, 'F')
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('2. COMPARATIVA TRANSPARENTE: GAMA SEGURIDAD VS MULTINACIONALES', 16, y + 4.2)

  y += 8
  // Tabla comparativa
  doc.setFillColor(248, 250, 252)
  doc.rect(14, y, 182, 28, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.rect(14, y, 182, 28, 'D')

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(51, 65, 85)
  doc.text('CONCEPTO', 16, y + 4.5)
  doc.text('OTRAS EMPRESAS (VERISURE / ADT)', 70, y + 4.5)
  doc.setTextColor(2, 132, 199)
  doc.text('GAMA SEGURIDAD CHILE', 140, y + 4.5)

  doc.line(14, y + 6, 196, y + 6)

  const rows = [
    { c: 'Propiedad Equipos', oth: 'Comodato (Arriendo eterno, nunca son tuyos)', gama: '100% Tuyos en propiedad legal' },
    { c: 'Costo Mensual', oth: '$65.000 a $85.000 CLP / mes con subidas', gama: 'Desde 0,9 UF + IVA (~$35.000 CLP / mes)' },
    { c: 'Evaluación Técnica', oth: 'Comercial invasiva / Vendedores a comisión', gama: '$0 Gratuita en terreno por técnicos certificados' },
    { c: 'Alarmas Existentes', oth: 'Te obligan a arrancar y comprar todo de nuevo', gama: 'Reprogramación a costo $0 en sensores' }
  ]

  let ry = y + 10.5
  doc.setFont('helvetica', 'normal')
  rows.forEach((r) => {
    doc.setTextColor(71, 85, 105)
    doc.text(r.c, 16, ry)
    doc.setTextColor(220, 38, 38)
    doc.text(r.oth, 70, ry)
    doc.setTextColor(16, 185, 129)
    doc.setFont('helvetica', 'bold')
    doc.text(r.gama, 140, ry)
    doc.setFont('helvetica', 'normal')
    ry += 5.2
  })

  // 6. Footer Informativo y Contacto
  y = 258
  doc.setFillColor(15, 23, 42)
  doc.rect(0, y, 210, 39, 'F')

  doc.setTextColor(56, 189, 248)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('AGENDA TU EVALUACIÓN TÉCNICA EN TERRENO SIN COSTO ($0)', 14, y + 7)

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Un especialista de GAMA visitará tu propiedad, revisará los accesos vulnerables y dimensionará el sistema exacto.', 14, y + 13)

  doc.setTextColor(148, 163, 184)
  doc.setFontSize(7.5)
  doc.text('📱 WhatsApp Comercial: +56 9 9101 6912  |  📞 Central Telefónica: +56 32 327 6011', 14, y + 20)
  doc.text('📍 Casa Matriz: Av. Valparaíso 1183, Viña del Mar  |  🌐 Sitio Web Oficial: https://www.gamasecurity.cl', 14, y + 25)

  doc.setTextColor(56, 189, 248)
  doc.text('Cobertura Integral: Santiago (RM completa)  •  Viña del Mar  •  Valparaíso  •  Quilpué  •  Villa Alemana  •  Limache  •  Quillota', 14, y + 30)

  const filePath = path.join(ASSETS_DIR, 'Ficha_Tecnica_GAMA_Vetti_Smart.pdf')
  fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')))
  console.log('✅ PDF Alarmas generado exitosamente en:', filePath)
}

// ═══════════════════════════════════════════════════════════════════════
// 2. FICHA TÉCNICA OFICIAL: CÁMARAS DE SEGURIDAD 4K CON IA
// ═══════════════════════════════════════════════════════════════════════
function generarPDFCamaras() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // 1. Header Banner Azul Oscuro / Esmeralda
  doc.setFillColor(15, 23, 42) // #0f172a
  doc.rect(0, 0, 210, 32, 'F')
  doc.setFillColor(16, 185, 129) // #10b981 emerald-500
  doc.rect(0, 30, 210, 2, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('GAMA SEGURIDAD CHILE', 14, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('CIRCUITO CERRADO DE TELEVISIÓN (CCTV)  •  INTELIGENCIA ARTIFICIAL 4K', 14, 19)
  doc.text('R.U.T.: 76.319.399-3  •  VALPARAÍSO / VIÑA DEL MAR / RM  •  WWW.GAMASECURITY.CL', 14, 25)

  // Badge Derecha Header
  doc.setFillColor(30, 41, 59)
  doc.roundedRect(138, 6, 58, 18, 2, 2, 'F')
  doc.setTextColor(52, 211, 153)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('FICHA TÉCNICA OFICIAL', 142, 12)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text('CÁMARAS 4K ULTRA HD', 142, 18)

  // 2. Subtítulo Destacado
  let y = 40
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('SISTEMAS PROFESIONALES DE VIDEOVIGILANCIA 4K CON INTELIGENCIA ARTIFICIAL', 14, y)

  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text('Visualización en vivo 24/7 y grabaciones en tu smartphone sin pagar mensualidades obligatorias ni arriendos.', 14, y)

  // 3. Tarjetas Bento de Beneficios Clave
  y += 8
  const boxes = [
    { title: 'RESOLUCIÓN 4K', sub: '8 Megapíxeles Ultra HD. Identificación nítida de rostros y patentes.', bg: [236, 253, 245], border: [16, 185, 129] },
    { title: 'IA ACUSENSE', sub: 'Filtra humanos y vehículos. Cero falsas alarmas por viento o lluvia.', bg: [240, 249, 255], border: [2, 132, 199] },
    { title: 'VISIÓN COLOR 24/7', sub: 'Tecnología ColorVu. Imagen a todo color en plena oscuridad total.', bg: [254, 243, 199], border: [245, 158, 11] },
    { title: 'SIN MENSUALIDAD', sub: 'Visualización y alertas en celular a costo $0 permanente.', bg: [241, 245, 249], border: [148, 163, 184] }
  ]

  boxes.forEach((b, i) => {
    const bx = 14 + (i * 47)
    doc.setFillColor(b.bg[0], b.bg[1], b.bg[2])
    doc.setDrawColor(b.border[0], b.border[1], b.border[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(bx, y, 44, 18, 1.5, 1.5, 'FD')

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(b.title, bx + 3, y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(71, 85, 105)
    doc.text(doc.splitTextToSize(b.sub, 38), bx + 3, y + 10.5)
  })

  // 4. Componentes y Especificaciones
  y += 26
  doc.setFillColor(241, 245, 249)
  doc.rect(14, y, 182, 6, 'F')
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('1. CARACTERÍSTICAS TÉCNICAS DEL EQUIPAMIENTO CCTV', 16, y + 4.2)

  y += 9
  const items = [
    { num: '01', nombre: 'Cámaras Tipo Turret / Bullet 4K (8 MP) Exterior e Interior', desc: 'Chasis metálico reforzado con certificación IP67 resistente al agua, intemperie y polvo. Lente gran angular de 2.8 mm para cobertura panorámica de 108° sin puntos ciegos.' },
    { num: '02', nombre: 'Inteligencia Artificial AcuSense y Detección Perimetral', desc: 'Clasificación precisa de objetivos en tiempo real: distingue personas y vehículos de animales, ramas o lluvia. Envío de alertas push instantáneas al móvil ante cruce de línea.' },
    { num: '03', nombre: 'Visión Nocturna ColorVu a Todo Color 24 Horas', desc: 'Apertura de diafragma F1.0 y sensor ultrasensible que captura imágenes a todo color incluso en la oscuridad más profunda, sin el molesto efecto infrarrojo blanco y negro.' },
    { num: '04', nombre: 'Grabador NVR Profesional 4K con Disco Duro de Seguridad', desc: 'Grabador de red IP con compresión avanzada H.265+ que optimiza el almacenamiento. Incluye disco duro Western Digital Purple especial para grabación continua ininterrumpida.' },
    { num: '05', nombre: 'App Móvil Hik-Connect / GAMA Vision en Smartphone', desc: 'Monitoreo en vivo simultáneo de todas las cámaras, reproducción histórica de grabaciones por fecha y hora, audio bidireccional y exportación directa de videos a WhatsApp.' },
    { num: '06', nombre: 'Opción de Integración a Central de Monitoreo 24/7 GAMA', desc: 'Opcionalmente conectable a nuestra Central para televigilancia remota de rondas virtuales programadas y verificación visual inmediata ante disparos de alarma.' }
  ]

  items.forEach((it) => {
    doc.setFillColor(16, 185, 129)
    doc.rect(14, y, 7, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(it.num, 15, y + 4.8)

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text(it.nombre, 24, y + 4.2)

    y += 6
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.2)
    const lineas = doc.splitTextToSize(it.desc, 172)
    doc.text(lineas, 24, y)
    y += (lineas.length * 3.5) + 3
  })

  // 5. Casos de Uso Recomendados
  y = Math.max(y + 2, 196)
  doc.setFillColor(241, 245, 249)
  doc.rect(14, y, 182, 6, 'F')
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('2. APLICACIONES Y KITS A MEDIDA SEGÚN TU PROPIEDAD', 16, y + 4.2)

  y += 8
  doc.setFillColor(248, 250, 252)
  doc.rect(14, y, 182, 28, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.rect(14, y, 182, 28, 'D')

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(51, 65, 85)
  doc.text('TIPO DE PROPIEDAD', 16, y + 4.5)
  doc.text('CONFIGURACIÓN RECOMENDADA', 65, y + 4.5)
  doc.setTextColor(16, 185, 129)
  doc.text('VENTAJA PRINCIPAL GAMA', 135, y + 4.5)

  doc.line(14, y + 6, 196, y + 6)

  const rows = [
    { c: 'Casa o Parcela', oth: 'Kit 4 a 8 Cámaras 4K perimetrales con visión nocturna', gama: 'Control total de accesos y patios sin cuotas mensuales' },
    { c: 'Negocio / Local', oth: 'Cámaras 4K sobre caja, vitrinas y bodegas con audio', gama: 'Grabación de respaldo anti-robo y control de personal' },
    { c: 'Comunidades / Condominio', oth: 'LPR lectura de patentes en portón + domos PTZ 360°', gama: 'Evidencia judicial en alta definición 4K certificada' },
    { c: 'Bodegas / Empresas', oth: 'Cámaras térmicas e IP con cobertura de amplios predios', gama: 'Integrable a sirena disuasiva y Central de Monitoreo' }
  ]

  let ry = y + 10.5
  doc.setFont('helvetica', 'normal')
  rows.forEach((r) => {
    doc.setTextColor(71, 85, 105)
    doc.text(r.c, 16, ry)
    doc.setTextColor(15, 23, 42)
    doc.text(r.oth, 65, ry)
    doc.setTextColor(16, 185, 129)
    doc.setFont('helvetica', 'bold')
    doc.text(r.gama, 135, ry)
    doc.setFont('helvetica', 'normal')
    ry += 5.2
  })

  // 6. Footer Informativo y Contacto
  y = 258
  doc.setFillColor(15, 23, 42)
  doc.rect(0, y, 210, 39, 'F')

  doc.setTextColor(52, 211, 153)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('SOLICITA TU EVALUACIÓN TÉCNICA EN TERRENO SIN COSTO ($0)', 14, y + 7)

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Nuestros técnicos revisan los ángulos de visión de tu propiedad y te entregan una propuesta formal dimensionada a la medida.', 14, y + 13)

  doc.setTextColor(148, 163, 184)
  doc.setFontSize(7.5)
  doc.text('📱 WhatsApp Comercial: +56 9 9101 6912  |  📞 Central Telefónica: +56 32 327 6011', 14, y + 20)
  doc.text('📍 Casa Matriz: Av. Valparaíso 1183, Viña del Mar  |  🌐 Sitio Web Oficial: https://www.gamasecurity.cl', 14, y + 25)

  doc.setTextColor(52, 211, 153)
  doc.text('Instalación en 24 a 48 hrs  •  Garantía Oficial 12 Meses  •  Técnicos Certificados en Santiago y Región de Valparaíso', 14, y + 30)

  const filePath = path.join(ASSETS_DIR, 'Ficha_Tecnica_GAMA_Camaras_4K.pdf')
  fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')))
  console.log('✅ PDF Cámaras generado exitosamente en:', filePath)
}

generarPDFAlarmas()
generarPDFCamaras()

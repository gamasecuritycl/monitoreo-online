// Test unitario de simulación del motor conversacional de WhatsApp Ventas
const path = require('path')

// Simulamos el módulo extrayendo funciones
const COMUNAS_CHILE = [
  'santiago', 'las condes', 'providencia', 'vitacura', 'la reina', 'lo barnechea',
  'ñuñoa', 'nunoa', 'la florida', 'maipu', 'maipú', 'puente alto', 'san miguel', 'macul',
  'peñalolen', 'peñalolén', 'penalolen', 'quilicura', 'pudahuel', 'colina', 'chicureo', 'lampa',
  'san bernardo', 'buin', 'paine', 'melipilla', 'talagante', 'penaflor', 'peñaflor', 'padre hurtado',
  'el monte', 'isla de maipo', 'curacavi', 'curacaví', 'maria pinto', 'maría pinto', 'san pedro',
  'alhue', 'alhué', 'pirque', 'san jose de maipo', 'san josé de maipo', 'cerrillos', 'cerro navia',
  'conchali', 'conchalí', 'el bosque', 'estacion central', 'estación central', 'huechuraba',
  'independencia', 'la cisterna', 'la granja', 'la pintana', 'lo espejo', 'lo prado', 'pedro aguirre cerda',
  'quinta normal', 'recoleta', 'renca', 'san joaquin', 'san joaquín', 'san ramon', 'san ramón',
  'til til', 'tiltil', 'batuco', 'valle grande', 'chamisero',
  'viña', 'viña del mar', 'vina del mar', 'valparaiso', 'valparaíso', 'concon', 'concón',
  'quilpue', 'quilpué', 'villa alemana', 'limache', 'quillota', 'san antonio', 'la calera',
  'la cruz', 'nogales', 'hijuelas', 'la ligua', 'cabildo', 'zapallar', 'papudo', 'petorca',
  'casablanca', 'cartagena', 'el tabo', 'el quisco', 'algarrobo', 'santo domingo',
  'san felipe', 'los andes', 'catemu', 'llaillay', 'llay llay', 'panquehue', 'putaendo', 'santa maria',
  'santa maría', 'calle larga', 'rinconada', 'san esteban', 'olmue', 'olmué',
  'rancagua', 'machali', 'machalí', 'graneros', 'rengo', 'san vicente', 'san fernando', 'requinoa', 'requínoa'
]

function capitalizar(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function extraerComunaValida(texto) {
  if (!texto) return null
  const lower = texto.toLowerCase().trim()

  const descartes = [
    'cuentame', 'cuéntame', 'servicio', 'precio', 'costo', 'valor', 'cuanto', 'cuánto',
    'hola', 'gracias', 'buenas', 'informacion', 'información', 'detalle', 'detalles',
    'alarma', 'alarmas', 'camara', 'cámara', 'camaras', 'cámaras', 'cctv', 'empresa',
    'casa', 'parcela', 'departamento', 'depto', 'local', 'negocio', 'asesor', 'ejecutivo',
    'visita', 'horario', 'mañana', 'tarde', 'sabado', 'sábado', 'luz', 'mascota', 'perro', 'gato',
    'verisure', 'adt', 'prosegur', 'comodato', 'quiero', 'necesito', 'sobre', 'sobre el', 'bueno'
  ]

  for (const c of COMUNAS_CHILE) {
    const regex = new RegExp(`(^|\\b|en\\s+|comuna\\s+de\\s+)${c}(\\b|$)`, 'i')
    if (regex.test(lower)) {
      return capitalizar(c)
    }
  }

  const m = texto.match(/(?:vivo en|en la comuna de|comuna de)\s+([a-záéíóúñ\s]{3,25})/i)
  if (m && m[1]) {
    const candidata = m[1].trim().toLowerCase()
    if (!descartes.some(d => candidata.includes(d))) {
      return capitalizar(candidata)
    }
  }

  return null
}

console.log('--- TEST EXTRAER COMUNA ---')
console.log('1. "Cuéntame sobre el servicio" ->', extraerComunaValida('Cuéntame sobre el servicio')) // Debe ser null
console.log('2. "Limache" ->', extraerComunaValida('Limache')) // Debe ser Limache
console.log('3. "En Las Condes" ->', extraerComunaValida('En Las Condes')) // Debe ser Las Condes
console.log('4. "cuanto vale el servicio" ->', extraerComunaValida('cuanto vale el servicio')) // Debe ser null
console.log('5. "vivo en Quilpué" ->', extraerComunaValida('vivo en Quilpué')) // Debe ser Quilpué

if (extraerComunaValida('Cuéntame sobre el servicio') === null && extraerComunaValida('Limache') === 'Limache') {
  console.log('✅ TEST PASADO: "Cuéntame sobre el servicio" ya NO es tomado como comuna.')
} else {
  console.error('❌ ERROR EN DETECCIÓN DE COMUNA')
  process.exit(1)
}

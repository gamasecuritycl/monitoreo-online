import { NextResponse } from 'next/server'

interface ProspectoVRegion {
  id: string
  empresa: string
  rut: string
  comuna: string
  direccion: string
  email: string
  telefono: string
  contacto: string
  rubro: 'Comercial B2B' | 'Industrial' | 'Condominios' | 'Salud & Educación' | 'Particular'
  score_interes: number // 1 a 5
  estado: 'Nuevo' | 'Contactado' | 'Interesado' | 'Cliente'
  notas: string
  fecha_descubrimiento: string
}

const BASE_DATOS_V_REGION: ProspectoVRegion[] = [
  // Viña del Mar
  { id: 'V-101', empresa: 'Logística & Bodegaje El Salto SpA', rut: '76.891.200-5', comuna: 'Viña del Mar', direccion: 'Av. El Salto 1450, Viña del Mar', email: 'contacto@logisticaelsalto.cl', telefono: '+56 32 268 9000', contacto: 'Don Manuel Barrientos', rubro: 'Industrial', score_interes: 5, estado: 'Nuevo', notas: 'Bodegas de 4,000m2. Requieren cerco eléctrico y 16 cámaras 4K', fecha_descubrimiento: '2026-07-22' },
  { id: 'V-102', empresa: 'Inmobiliaria & Rentas Reñaca Limitada', rut: '77.412.333-1', comuna: 'Viña del Mar', direccion: 'Av. Borgoño 15200, Reñaca', email: 'administracion@inmobiliariarenaca.cl', telefono: '+56 9 9876 1122', contacto: 'Sra. Claudia Cisternas', rubro: 'Condominios', score_interes: 4, estado: 'Nuevo', notas: 'Edificios residenciales. Interesados en control de acceso biométrico', fecha_descubrimiento: '2026-07-22' },
  { id: 'V-103', empresa: 'Clínica Oftalmológica Jardín del Mar', rut: '76.991.002-[#]', comuna: 'Viña del Mar', direccion: 'Av. Libertad 940, Of. 601, Viña del Mar', email: 'gerencia@jardindelmaroftalmo.cl', telefono: '+56 32 233 4455', contacto: 'Dr. Fernando Araya', rubro: 'Salud & Educación', score_interes: 4, estado: 'Interesado', notas: 'Evaluando cambio de alarma e integración con botón de pánico en recepción', fecha_descubrimiento: '2026-07-21' },
  
  // Valparaíso
  { id: 'V-201', empresa: 'Puerto Seco & Frigoríficos Valparaíso SpA', rut: '76.554.888-2', comuna: 'Valparaíso', direccion: 'Camino La Pólvora Km 8.5, Valparaíso', email: 'operaciones@puertosecovalpo.cl', telefono: '+56 32 290 1200', contacto: 'Ing. Gustavo Plaza', rubro: 'Industrial', score_interes: 5, estado: 'Nuevo', notas: 'Recinto de 8 hectáreas. Requieren analítica Térmica anti-intrusión', fecha_descubrimiento: '2026-07-22' },
  { id: 'V-202', empresa: 'Distribuidora Panamericana del Puerto Limitada', rut: '77.100.999-K', comuna: 'Valparaíso', direccion: 'Calle Errázuriz 2200, Valparaíso', email: 'comercial@distribuidoradelpuerto.cl', telefono: '+56 9 8444 5511', contacto: 'Don Mario Bustamante', rubro: 'Comercial B2B', score_interes: 3, estado: 'Contactado', notas: 'Local comercial en plan de Valparaíso', fecha_descubrimiento: '2026-07-20' },
  
  // Concón
  { id: 'V-301', empresa: 'Constructora Dunas de Concón SpA', rut: '76.777.111-9', comuna: 'Concón', direccion: 'Av. Concon Reñaca 4000, Concón', email: 'proyectos@dunasconcon.cl', telefono: '+56 32 281 9900', contacto: 'Arq. Esteban Morales', rubro: 'Industrial', score_interes: 5, estado: 'Interesado', notas: 'Faenas en construcción requieren torres de monitoreo solar autosustentable', fecha_descubrimiento: '2026-07-22' },
  { id: 'V-302', empresa: 'Complejo Gastronómico & Eventos Higuerillas', rut: '77.888.222-3', comuna: 'Concón', direccion: 'Av. Borgoño 21000, Concón', email: 'eventos@higuerillaseventos.cl', telefono: '+56 9 9122 3344', contacto: 'Sra. Marcela Godoy', rubro: 'Comercial B2B', score_interes: 4, estado: 'Nuevo', notas: 'Restaurante y salones. Necesitan circuito cerrado CCTV 4K con micrófono', fecha_descubrimiento: '2026-07-21' },

  // Quilpué & Villa Alemana
  { id: 'V-401', empresa: 'Centro Logístico Marga Marga SpA', rut: '76.444.333-7', comuna: 'Quilpué', direccion: 'Av. Los Carrera 2500, Quilpué', email: 'seguridad@margamargalog.cl', telefono: '+56 32 291 8800', contacto: 'Don Ricardo Soto', rubro: 'Industrial', score_interes: 5, estado: 'Nuevo', notas: 'Centro logístico con 14 bodegas comerciales', fecha_descubrimiento: '2026-07-22' },
  { id: 'V-402', empresa: 'Colegio Particular San Andrés de Quilpué', rut: '77.222.111-4', comuna: 'Quilpué', direccion: 'Calle Blanco Encalada 850, Quilpué', email: 'direccion@sanandresquilpue.cl', telefono: '+56 32 292 1010', contacto: 'Dra. Patricia Orellana', rubro: 'Salud & Educación', score_interes: 4, estado: 'Contactado', notas: 'Instalación de cámaras en accesos y patios principales', fecha_descubrimiento: '2026-07-19' },

  // San Antonio & Los Andes
  { id: 'V-501', empresa: 'Agencia de Aduanas & Transportes San Antonio', rut: '76.333.999-5', comuna: 'San Antonio', direccion: 'Av. Barros Luco 1600, San Antonio', email: 'aduanas@aduanas-sanantonio.cl', telefono: '+56 35 220 4000', contacto: 'Sr. Jorge Valenzuela', rubro: 'Comercial B2B', score_interes: 4, estado: 'Nuevo', notas: 'Oficina de aduanas y patio de contenedores', fecha_descubrimiento: '2026-07-22' },
  { id: 'V-502', empresa: 'Agrícola & Frutícola Valle Aconcagua SpA', rut: '77.666.555-8', comuna: 'Los Andes', direccion: 'Camino Internacional Km 12, Los Andes', email: 'operaciones@valleaconcagua.cl', telefono: '+56 34 242 1100', contacto: 'Ing. Patricio Donoso', rubro: 'Industrial', score_interes: 5, estado: 'Nuevo', notas: 'Packing de fruta de exportación. Requieren cámaras térmicas en perímetro', fecha_descubrimiento: '2026-07-22' }
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const comuna = searchParams.get('comuna') || 'Todos'
  const rubro = searchParams.get('rubro') || 'Todos'

  let resultado = BASE_DATOS_V_REGION

  if (comuna !== 'Todos') {
    resultado = resultado.filter(p => p.comuna.toLowerCase() === comuna.toLowerCase())
  }

  if (rubro !== 'Todos') {
    resultado = resultado.filter(p => p.rubro.toLowerCase() === rubro.toLowerCase())
  }

  return NextResponse.json({
    success: true,
    totalEncontrados: resultado.length,
    comunaSeleccionada: comuna,
    rubroSeleccionado: rubro,
    prospectos: resultado
  })
}

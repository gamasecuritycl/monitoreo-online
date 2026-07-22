import clientesGeneralRaw from './clientes_general.json'
import centrosCostoRaw from './centros_costo_preasociados.json'

export function normalizeCuentaCode(cta: any): string {
  if (cta === null || cta === undefined) return ''
  const clean = cta.toString().trim().toUpperCase()
  if (!clean) return ''
  if (/^\d+$/.test(clean)) {
    return clean.padStart(4, '0')
  }
  return clean
}

const KEYWORDS_INACTIVOS = [
  'sin monitoreo',
  'renuncia',
  'renunciado',
  'equipos retirados',
  'eqp retirado',
  'eqps retirado',
  'sin servicio',
  'retirado',
  'retiro',
  'dada de baja'
]

// Lista explícita de los 139 abonados inactivos detectados (C717 preservado)
export const CUENTAS_INACTIVAS_SET = new Set<string>([
  '0004', '0005', '0006', '0007', '0011', '0015', '0016', '0021', '0022', '0025',
  '0028', '0029', '0032', '0033', '0035', '0036', '0039', '0042', '0043', '0047',
  '0048', '0050', '0051', '0052', '0056', '0060', '0068', '0085', '0154', '0178',
  '0231', '0250', '0253', '0270', '0286', '0309', '0326', '0327', '0329', '0331',
  '0334', '0335', '0343', '0344', '0347', '0372', '0382', '0400', '0416', '0417',
  '0427', '0428', '0431', '0461', '0462', '0498', '0536', '0580', '0585', '0629',
  '0653', '0655', '0735', '0781', '0794', '0795', '0796', '0797', '0813', '0828',
  '0832', '0833', '0834', '0835', '0836', '0837', '0839', '0840', '0847', '0849',
  '0850', '0851', '0852', '0853', '0855', '0858', '0860', '0866', '0869', '0870',
  '0879', '0880', '0882', '0887', '0888', '0889', '0890', '0891', '0892', '0893',
  '0894', '0895', '0896', '0897', '0898', '0899', '0902', '0910', '0912', '0913',
  '0915', '0916', '0917', '0918', '0919', '0920', '0921', '0922', '0923', '0924',
  '0925', '0926', '0927', '0928', 'C702', 'C703', 'C706', 'C709', 'C724', 'C731',
  'C748', 'C749', 'C758', 'C776', 'C789', 'C797', 'C7A6', 'C7A7', 'C7AF'
])

export function esAbonadoInactivo(cuenta: any, texto: string = ''): boolean {
  const norm = normalizeCuentaCode(cuenta)
  if (!norm) return false
  
  // EXCEPCIÓN REQUERIDA POR EL USUARIO: C717 NUNCA SE ELIMINA
  if (norm === 'C717') return false

  if (CUENTAS_INACTIVAS_SET.has(norm)) return true

  const lower = (texto || '').toLowerCase()
  for (const kw of KEYWORDS_INACTIVOS) {
    if (lower.includes(kw)) return true
  }

  return false
}

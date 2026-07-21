// Utilitario de normalización y validación de RUT Chileno en formato 12123123-6

/**
 * Normaliza cualquier RUT ingresado al formato estándar estricto: 12123123-6
 * Remueve puntos, espacios y asegura guión antes del dígito verificador.
 */
export function cleanRut(rutInput: string): string {
  if (!rutInput) return ''
  
  // Limpiar caracteres no alfanuméricos excepto k/K
  const clean = rutInput.trim().toUpperCase().replace(/[^0-9K]/g, '')
  if (clean.length < 2) return clean

  const dv = clean.slice(-1)
  const cuerpo = clean.slice(0, -1)
  
  return `${cuerpo}-${dv}`
}

/**
 * Formatea el RUT para despliegue visual sin puntos y con guión: 12123123-6
 */
export function formatRutChile(rutInput: string): string {
  return cleanRut(rutInput)
}

/**
 * Valida si el dígito verificador del RUT Chileno es correcto
 */
export function validarRutChile(rutInput: string): boolean {
  const rutLimpio = cleanRut(rutInput)
  if (!rutLimpio.includes('-')) return false

  const [cuerpo, dv] = rutLimpio.split('-')
  if (!cuerpo || !dv || cuerpo.length < 7) return false

  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const dverEsperado = 11 - (suma % 11)
  let dvCalc = ''
  if (dverEsperado === 11) dvCalc = '0'
  else if (dverEsperado === 10) dvCalc = 'K'
  else dvCalc = dverEsperado.toString()

  return dv.toUpperCase() === dvCalc
}

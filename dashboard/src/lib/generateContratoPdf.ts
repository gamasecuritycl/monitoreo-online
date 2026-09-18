import { jsPDF } from 'jspdf'

export interface ContratoData {
  codigo_contrato: string
  fecha_ciudad?: string
  fecha_completa?: string
  empresa_emisora: {
    razon_social: string
    rut: string
    representante: string
    rut_representante: string
    direccion: string
    email_contacto?: string
  }
  cliente: {
    nombre_razon_social: string
    rut: string
    representante_legal?: string
    rut_representante?: string
    direccion_legal: string
    ciudad_legal: string
    telefono?: string
    email?: string
  }
  propiedad: {
    cuenta: string
    alias?: string
    direccion_sucursal: string
    ciudad_sucursal: string
  }
  servicio: {
    tarifa_monto: number
    tarifa_texto?: string
    moneda: 'UF' | 'CLP'
    plazo_inicial_meses: number
    renovacion_meses: number
    dias_aviso_termino: number
    email_actualizacion_contactos?: string
  }
  firma_base64?: string
  fecha_firma?: string
  ip_firma?: string
}

export function generarContratoPdfBase64(contrato: ContratoData): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const emp = contrato.empresa_emisora || {
    razon_social: 'INVERSIONES GAMA SpA',
    rut: '78.297.009-7',
    representante: 'TOMÁS TORO-MORENO OLAVARRÍA',
    rut_representante: '16.182.547-6',
    direccion: 'Av. Valparaíso 351, Villa Alemana',
    email_contacto: 'contacto@gamasecurity.cl'
  }

  const cli = contrato.cliente
  const prop = contrato.propiedad
  const serv = contrato.servicio

  const margenIzq = 18
  const anchoTexto = 174
  let y = 16

  // ── HEADER FORMAL ──
  doc.setFillColor(0, 31, 63)
  doc.rect(0, 0, 210, 16, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.text(emp.razon_social.toUpperCase(), margenIzq, 10.5)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`R.U.T. ${emp.rut} — PLATAFORMA ERP DE MONITOREO 24/7`, 120, 10.5)

  y = 26
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('CONTRATO DE PRESTACIÓN DE SERVICIOS DE MONITOREO DE ALARMAS', 105, y, { align: 'center' })

  y += 7
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 41, 59)

  const fechaTexto = contrato.fecha_completa || new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
  const comparecencia = `En ${contrato.fecha_ciudad || 'Viña del Mar'}, a ${fechaTexto}, comparecen:
Por una parte, ${emp.razon_social.toUpperCase()} (en adelante "GAMA" o "La Empresa"), R.U.T. N° ${emp.rut}, representada por don ${emp.representante.toUpperCase()}, cédula de identidad N° ${emp.rut_representante}, ambos domiciliados para estos efectos en ${emp.direccion}; y
Por la otra parte, ${cli.nombre_razon_social.toUpperCase()} (en adelante "El Cliente" o "El Suscriptor"), R.U.T. N° ${cli.rut}${cli.representante_legal ? `, representada por don ${cli.representante_legal.toUpperCase()}, cédula de identidad N° ${cli.rut_representante || 'S/RUT'}` : ''}, ambos domiciliados legalmente en ${cli.direccion_legal}, comuna de ${cli.ciudad_legal};
Quienes han convenido suscribir el presente Contrato de Prestación de Servicios de Monitoreo, el cual se regirá por las siguientes cláusulas:`

  const lineasComp = doc.splitTextToSize(comparecencia, anchoTexto)
  doc.text(lineasComp, margenIzq, y)
  y += lineasComp.length * 3.8 + 2

  // ── CLÁUSULAS OFICIALES EXACTAS GAMA ──
  const clausulas = [
    {
      titulo: 'PRIMERO: ANTECEDENTES Y EQUIPAMIENTO',
      cuerpo: 'GAMA es una empresa dedicada a soluciones de seguridad electrónica. El Cliente declara ser dueño y propietario de los equipos de sistema de alarma instalados en su domicilio (en adelante "El Sistema"), habiéndolos adquirido previamente a la empresa relacionada "Gama Seguridad SpA" o a quien corresponda, contando con el respaldo tributario respectivo. Las partes dejan expresa constancia de que no existe régimen de comodato ni arriendo de equipos. Los equipos son de dominio absoluto del Cliente, por lo que GAMA no tiene derechos de retiro sobre los mismos al término del contrato, salvo la desconexión lógica del servicio de monitoreo.'
    },
    {
      titulo: 'SEGUNDO: OBJETO DEL SERVICIO',
      cuerpo: 'Por el presente instrumento, El Cliente contrata a GAMA para que esta efectúe el servicio de Monitoreo de Alarmas. Este servicio consiste en la recepción de señales emitidas por el Sistema instalado en el inmueble del Cliente, a través de vía telefónica, internet o GPRS, hacia la Central de Monitoreo de GAMA. Ante la recepción de una señal de alarma, GAMA procederá según el protocolo establecido en la cláusula Quinta.'
    },
    {
      titulo: 'TERCERO: LUGAR DE PRESTACIÓN DEL SERVICIO',
      cuerpo: `El servicio se prestará exclusivamente en la sucursal del Cliente ubicada en: ${prop.direccion_sucursal.toUpperCase()}, ${prop.ciudad_sucursal.toUpperCase()} (Cuenta de Monitoreo N° ${prop.cuenta}).`
    },
    {
      titulo: 'CUARTO: GARANTÍA Y MANTENCIÓN DE EQUIPOS',
      cuerpo: '1. Garantía: GAMA reconoce una garantía de 12 meses sobre la instalación y el funcionamiento de los equipos, contados desde la fecha de instalación o habilitación del servicio.\n2. Post-Garantía: Transcurridos los 12 meses, cualquier falla, reparación, cambio de baterías, sensores, cables u otros componentes será de costo exclusivo del Cliente, previa cotización y aceptación.\n3. Responsabilidad del Cliente: Es deber del Cliente mantener el sistema energizado y operativo. GAMA no se responsabiliza por fallas derivadas de cortes de suministro eléctrico, internet, telefonía, manipulación de terceros no autorizados, o casos fortuitos.'
    },
    {
      titulo: 'QUINTO: PROTOCOLO DE ACCIÓN Y LIMITACIÓN DEL SERVICIO',
      cuerpo: 'Las partes acuerdan que la obligación de GAMA es de medios y no de resultados. El protocolo ante una señal de alarma será exclusivamente:\n1. Intentar contactar telefónicamente a los números registrados por El Cliente para verificar la emergencia.\n2. De confirmarse la emergencia o no obtener respuesta, comunicar la situación a las unidades de emergencia correspondientes (Carabineros, Bomberos o Ambulancia, según corresponda a la señal recibida).\nLimitaciones expresas:\n• GAMA no enviará móviles de verificación ni personal de seguridad física al recinto (acudas).\n• GAMA no garantiza un tiempo mínimo ni máximo de respuesta, el cual depende de las redes de telecomunicaciones y la disponibilidad de las autoridades públicas.\n• GAMA no se hace responsable por la no concurrencia, demora o negligencia de Carabineros, Bomberos u otros servicios de emergencia.'
    },
    {
      titulo: 'SEXTO: PRECIO Y FORMA DE PAGO',
      cuerpo: `La tarifa mensual por el servicio de monitoreo será de ${serv.moneda === 'UF' ? `${serv.tarifa_monto} UF (${serv.tarifa_texto || 'Cero coma nueve Unidades de Fomento'})` : `$${serv.tarifa_monto.toLocaleString('es-CL')} CLP`} más IVA. El pago se realizará de forma mensual según los medios de pago habilitados por GAMA. En caso de mora o retardo simple en el pago de una o más mensualidades, GAMA queda facultada para suspender temporalmente el servicio de monitoreo hasta la regularización de la deuda, sin perjuicio de las acciones de cobro correspondientes.`
    },
    {
      titulo: 'SÉPTIMO: VIGENCIA, RENOVACIÓN Y TÉRMINO',
      cuerpo: `1. Plazo Inicial: El presente contrato tendrá una vigencia inicial de ${serv.plazo_inicial_meses || 36} meses a contar de esta fecha.\n2. Renovación Automática: Al vencimiento del plazo inicial, el contrato se renovará automática y sucesivamente por períodos de ${serv.renovacion_meses || 12} meses, salvo que una de las partes manifieste su voluntad de no renovarlo.\n3. Término Anticipado: El Cliente podrá poner término al presente contrato en cualquier momento (incluso durante la vigencia inicial), sin multas ni cláusulas de amarre, debiendo únicamente dar aviso por escrito a GAMA con una anticipación mínima de ${serv.dias_aviso_termino || 30} días corridos.\n4. Desconexión: Al término del contrato, el Cliente deberá permitir o facilitar la desconexión de la programación del panel de alarma para cesar la comunicación con la Central de GAMA.`
    },
    {
      titulo: 'OCTAVO: EXCLUSIÓN DE RESPONSABILIDAD',
      cuerpo: 'El sistema de alarma es una herramienta disuasiva y de detección, pero no impide físicamente la intrusión ni garantiza la inviolabilidad del inmueble. El Cliente libera a GAMA de toda responsabilidad civil, penal o contractual por robos, hurtos, daños a la propiedad, lesiones a personas o cualquier perjuicio que sufra el Cliente o terceros en el inmueble monitoreado, entendiendo que la labor de GAMA se limita a la gestión remota de las señales recibidas. GAMA no cuenta con seguros comprometidos a favor del Cliente por siniestros ocurridos en la propiedad.'
    },
    {
      titulo: 'NOVENO: CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS',
      cuerpo: `GAMA se obliga a proteger los datos personales y de seguridad del Cliente (códigos, teléfonos, horarios, rutinas) conforme a la Ley N° 19.628 sobre Protección de la Vida Privada. Estos datos serán utilizados exclusivamente para la prestación del servicio de monitoreo y solo serán revelados a las autoridades competentes en caso de emergencia o requerimiento judicial. Es responsabilidad exclusiva del Cliente mantener actualizada su lista de contactos de emergencia informando al correo: ${serv.email_actualizacion_contactos || 'ecarrasco@gamasecurity.cl'}.`
    },
    {
      titulo: 'DÉCIMO: DOMICILIO Y JURISDICCIÓN',
      cuerpo: 'Para todos los efectos legales derivados del presente contrato, las partes fijan su domicilio en la ciudad de Viña del Mar y se someten a la competencia de sus Tribunales de Justicia.'
    },
    {
      titulo: 'UNDÉCIMO: EJEMPLARES',
      cuerpo: 'El presente contrato se firma en dos ejemplares de idéntico tenor y fecha, quedando uno en poder de cada parte.'
    }
  ]

  clausulas.forEach((clau) => {
    // Manejo de salto de página inteligente
    const lineasTitulo = doc.splitTextToSize(clau.titulo, anchoTexto)
    const lineasCuerpo = doc.splitTextToSize(clau.cuerpo, anchoTexto)
    const espacioNecesario = (lineasTitulo.length + lineasCuerpo.length) * 3.6 + 6

    if (y + espacioNecesario > 275) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(0, 31, 63)
    doc.text(lineasTitulo, margenIzq, y)
    y += lineasTitulo.length * 3.6 + 0.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.2)
    doc.setTextColor(51, 65, 85)
    doc.text(lineasCuerpo, margenIzq, y)
    y += lineasCuerpo.length * 3.6 + 2.5
  })

  // ── SECCIÓN DE FIRMAS ──
  if (y + 42 > 275) {
    doc.addPage()
    y = 24
  } else {
    y += 6
  }

  const yFirma = y
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(margenIzq, yFirma, 82, 38, 2, 2, 'FD')
  doc.roundedRect(margenIzq + 92, yFirma, 82, 38, 2, 2, 'FD')

  // Firma Proveedor GAMA
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(0, 31, 63)
  doc.text('p.p. ' + emp.razon_social.toUpperCase(), margenIzq + 41, yFirma + 6, { align: 'center' })
  doc.setFontSize(7)
  doc.text(`RUT: ${emp.rut}`, margenIzq + 41, yFirma + 10, { align: 'center' })
  
  doc.setDrawColor(148, 163, 184)
  doc.line(margenIzq + 10, yFirma + 25, margenIzq + 72, yFirma + 25)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(71, 85, 105)
  doc.text(emp.representante, margenIzq + 41, yFirma + 29, { align: 'center' })
  doc.text(`C.I. ${emp.rut_representante}`, margenIzq + 41, yFirma + 33, { align: 'center' })

  // Firma Cliente / Suscriptor
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(0, 31, 63)
  doc.text('p.p. ' + cli.nombre_razon_social.toUpperCase(), margenIzq + 133, yFirma + 6, { align: 'center', maxWidth: 78 })
  doc.setFontSize(7)
  doc.text(`RUT: ${cli.rut}`, margenIzq + 133, yFirma + 10, { align: 'center' })

  if (contrato.firma_base64) {
    try {
      doc.addImage(contrato.firma_base64, 'PNG', margenIzq + 102, yFirma + 11, 62, 13)
    } catch {}
  }

  doc.setDrawColor(148, 163, 184)
  doc.line(margenIzq + 102, yFirma + 25, margenIzq + 164, yFirma + 25)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(71, 85, 105)
  doc.text(cli.representante_legal || cli.nombre_razon_social, margenIzq + 133, yFirma + 29, { align: 'center', maxWidth: 76 })
  
  if (contrato.fecha_firma) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 102, 204)
    doc.text(`Firma Electrónica Simple · ${contrato.fecha_firma}`, margenIzq + 133, yFirma + 33, { align: 'center' })
  } else {
    doc.text(`C.I. ${cli.rut_representante || cli.rut}`, margenIzq + 133, yFirma + 33, { align: 'center' })
  }

  // Footer en todas las páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFillColor(241, 245, 249)
    doc.rect(0, 288, 210, 9, 'F')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text(`Contrato de Monitoreo Oficial N° ${contrato.codigo_contrato} · Cuenta #${prop.cuenta} · ${emp.razon_social} · Página ${i} de ${totalPages}`, 105, 293, { align: 'center' })
  }

  return doc.output('datauristring').split(',')[1]
}

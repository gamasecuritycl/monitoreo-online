import { jsPDF } from 'jspdf'

export function generarCotizacionPdfBase64(cot: any, emp: any): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Header / Emisor Banner
  doc.setFillColor(0, 91, 234) // #005bea
  doc.rect(0, 0, 210, 24, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(String(emp.razon_social || 'Gama Seguridad SpA').toUpperCase(), 14, 11)
  
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`R.U.T. ${emp.rut || '76.319.399-3'} — ${emp.giro || 'Servicios Integrales de Seguridad Electronica & Monitoreo'}`, 14, 17)
  doc.text(`Direccion: ${emp.direccion || 'Av. Valparaiso 1183'} | Fono: ${emp.telefono || '+56323276011'}`, 14, 21)

  // Folio Box Right Header
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(138, 4, 58, 16, 2, 2, 'F')
  doc.setDrawColor(0, 91, 234)
  doc.setLineWidth(0.5)
  doc.roundedRect(138, 4, 58, 16, 2, 2, 'D')

  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('COTIZACION / PRESUPUESTO', 140, 9)
  doc.setTextColor(0, 91, 234)
  doc.setFontSize(11)
  doc.text(String(cot.codigo_cotizacion || 'PR2607-0000'), 140, 15)

  // Datos Receptor / Cliente
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('1. RECEPTOR DE LA PROPUESTA COMERCIAL:', 14, 32)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Cliente / Razon Social: ${cot.nombre_cliente || 'CLIENTE'}`, 14, 38)
  doc.text(`R.U.T.: ${cot.rut_cliente || 'S/RUT'}`, 14, 43)
  doc.text(`Atencion A: ${cot.contacto_persona || cot.nombre_cliente || 'Adquisiciones'}`, 14, 48)
  doc.text(`Direccion Entrega: ${cot.direccion || 'Direccion Principal'}`, 14, 53)
  doc.text(`Ciudad / Comuna: ${cot.ciudad_cliente || 'Santiago'}, Chile`, 14, 58)

  doc.text(`Fecha Emision: ${cot.fecha || new Date().toLocaleDateString('es-CL')}`, 125, 38)
  doc.text(`Validez Oferta: ${cot.validez_dias || 15} Dias Habiles`, 125, 43)
  doc.text(`Forma de Pago: ${cot.forma_pago || '50% Anticipo / 50% Al Finalizar'}`, 125, 48)
  doc.text(`Vendedor: ${cot.vendedor || 'Ejecutivo Comercial Gama'}`, 125, 53)

  // Line Separator
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(14, 63, 196, 63)

  // Items Table Header
  let y = 69
  doc.setFillColor(241, 245, 249)
  doc.rect(14, y, 182, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(51, 65, 85)
  doc.text('#', 16, y + 4.8)
  doc.text('DESCRIPCION DE EQUIPOS / SERVICIOS TECNICOS', 25, y + 4.8)
  doc.text('CANT.', 132, y + 4.8, { align: 'center' })
  doc.text('P. UNIT (NETO)', 162, y + 4.8, { align: 'right' })
  doc.text('SUBTOTAL NETO', 194, y + 4.8, { align: 'right' })

  y += 9
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(8)

  const items = cot.items || []
  items.forEach((it: any, idx: number) => {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    const sub = Math.round((it.cantidad || 1) * (it.precio_neto_unitario || 0))
    doc.text(String(idx + 1), 16, y)
    doc.text(String(it.descripcion || '').slice(0, 60), 25, y)
    doc.text(String(it.cantidad || 1), 132, y, { align: 'center' })
    doc.text(`$${Math.round(it.precio_neto_unitario || 0).toLocaleString('es-CL')}`, 162, y, { align: 'right' })
    doc.text(`$${sub.toLocaleString('es-CL')}`, 194, y, { align: 'right' })
    y += 6
  })

  // Totals section
  y = Math.max(y + 6, 150)
  doc.setDrawColor(226, 232, 240)
  doc.line(14, y, 196, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('Neto Afecto:', 130, y)
  doc.text(`$${Math.round(cot.neto_con_descuento || 0).toLocaleString('es-CL')} ${cot.moneda_cotizacion || 'CLP'}`, 194, y, { align: 'right' })

  y += 5
  doc.text('IVA 19% (Ley 825 Chile):', 130, y)
  doc.text(`$${Math.round(cot.monto_iva || 0).toLocaleString('es-CL')} ${cot.moneda_cotizacion || 'CLP'}`, 194, y, { align: 'right' })

  y += 6
  doc.setFillColor(0, 91, 234)
  doc.rect(125, y - 4.5, 71, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9.5)
  doc.text('TOTAL GENERAL:', 129, y + 1)
  doc.text(`$${Math.round(cot.monto_total_iva_incluido || 0).toLocaleString('es-CL')} ${cot.moneda_cotizacion || 'CLP'}`, 194, y + 1, { align: 'right' })

  // Transfer Info Footer Box
  y += 15
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS PARA TRANSFERENCIA BANCARIA & CONDICIONES:', 14, y)

  y += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(`Banco: ${emp.banco_nombre || 'Banco de Chile'} (${emp.banco_tipo_cuenta || 'Cuenta Corriente'}) | N° Cuenta: ${emp.banco_numero_cuenta || '00-123-45678-9'}`, 14, y)
  y += 4
  doc.text(`Titular: ${emp.razon_social || ''} | RUT: ${emp.rut || ''} | Email Cobranza: ${emp.email_cobranza || 'cobranza@gamasecurity.cl'}`, 14, y)
  y += 4
  doc.text(`• Garantia legal de equipos: 12 meses contra defectos de fabricacion. Precios netos afectos al 19% IVA.`, 14, y)

  // Signatures
  y += 18
  doc.setDrawColor(148, 163, 184)
  doc.line(30, y, 80, y)
  doc.line(130, y, 180, y)
  y += 4
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Ejecutivo Comercial Gama Seguridad', 55, y, { align: 'center' })
  doc.text('Firma / Timbre de Aceptación Cliente', 155, y, { align: 'center' })

  // Return base64 string without data:application/pdf;base64, prefix
  const dataUri = doc.output('datauristring')
  return dataUri.split(',')[1]
}

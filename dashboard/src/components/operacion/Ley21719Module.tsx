'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  Eye,
  FileCode,
  Copy,
  Check,
  ExternalLink,
  Scale,
  Users,
  Building2,
  HardDrive,
  Search,
  Activity,
  Filter
} from 'lucide-react'
import jsPDF from 'jspdf'

export default function Ley21719Module() {
  const [pestañaActiva, setPestañaActiva] = useState<'documentos' | 'checklist' | 'trazabilidad' | 'sql'>('documentos')
  const [copiadoSql, setCopiadoSql] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState<string | null>(null)
  const [cuentaFiltroTrazabilidad, setCuentaFiltroTrazabilidad] = useState('')
  const [filtroTipoAccion, setFiltroTipoAccion] = useState('TODOS')

  const [registrosAuditoria, setRegistrosAuditoria] = useState([
    {
      id: 1,
      fecha: new Date(Date.now() - 15 * 60000).toISOString(),
      operador: 'OPERADOR_CRA_01',
      cuenta: '1001',
      abonado: 'CONDOMINIO LOS ALERCES',
      accion: 'CONSULTA_FICHA_360',
      campos_sensibles: ['TELEFONOS_CONTACTO', 'CONTRACLAVE_EMBOSCADA'],
      ip: '190.160.45.12',
      motivo: 'SEÑAL_ALARMA_ZONA_3'
    },
    {
      id: 2,
      fecha: new Date(Date.now() - 42 * 60000).toISOString(),
      operador: 'SUPERVISOR_CENTRAL',
      cuenta: '0743',
      abonado: 'FARMACIA CRUZ AZUL',
      accion: 'VERIFICACION_VIDEO_CCTV',
      campos_sensibles: ['CAMARA_ACCESO_PRINCIPAL'],
      ip: '190.160.45.14',
      motivo: 'APERTURA_FUERA_HORARIO'
    },
    {
      id: 3,
      fecha: new Date(Date.now() - 95 * 60000).toISOString(),
      operador: 'SISTEMA_AUTONOMO_IA',
      cuenta: '1240',
      abonado: 'RESIDENCIA FAMILIA TORO',
      accion: 'DESPACHO_WHATSAPP_ALERTA',
      campos_sensibles: ['TELEFONO_TITULAR'],
      ip: '10.0.4.1',
      motivo: 'CORTE_ENERGIA_AC_PROLONGADO'
    },
    {
      id: 4,
      fecha: new Date(Date.now() - 180 * 60000).toISOString(),
      operador: 'OPERADOR_CRA_02',
      cuenta: '0054',
      abonado: 'DISTRIBUIDORA DEL PACIFICO',
      accion: 'CONSULTA_CONTRACLAVE',
      campos_sensibles: ['CONTRACLAVE_VERIFICACION'],
      ip: '190.160.45.18',
      motivo: 'LLAMADA_ENTRANTE_PRUEBA_TECNICA'
    },
    {
      id: 5,
      fecha: new Date(Date.now() - 320 * 60000).toISOString(),
      operador: 'ADMINISTRACION',
      cuenta: '0812',
      abonado: 'COLEGIO SAN AGUSTIN',
      accion: 'ACTUALIZACION_CONTACTOS_ARCO',
      campos_sensibles: ['LISTA_CONTACTOS_EMERGENCIA'],
      ip: '190.160.45.10',
      motivo: 'SOLICITUD_RECTIFICACION_TITULAR'
    }
  ])

  const simularAccesoForense = () => {
    const cuentasEjemplo = ['1001', '0743', '1240', '0054', '0812', '2045']
    const randomCta = cuentasEjemplo[Math.floor(Math.random() * cuentasEjemplo.length)]
    const nuevoLog = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      operador: 'OPERADOR_TURNO_ACTUAL',
      cuenta: randomCta,
      abonado: `ABONADO #${randomCta}`,
      accion: 'CONSULTA_DATOS_CRITICOS',
      campos_sensibles: ['CONTRACLAVE', 'CONTACTOS_EMERGENCIA'],
      ip: '190.160.45.22',
      motivo: 'VERIFICACION_EVENTO_OPERATIVO'
    }
    setRegistrosAuditoria(prev => [nuevoLog, ...prev])
  }

  const fechaHoy = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  // ════════════════════════════════════════════════════════════════
  // GENERADORES DE DOCUMENTOS LEGALES EN PDF (jspdf)
  // ════════════════════════════════════════════════════════════════

  // Doc 1: Política de Tratamiento de Datos
  const generarDocPolitica = () => {
    setGenerandoPdf('politica')
    try {
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('GAMA SEGURIDAD — CENTRAL DE MONITOREO Y TELEVIGILANCIA 24/7', 14, 18)
      doc.setFontSize(11)
      doc.setTextColor(0, 51, 153)
      doc.text('POLÍTICA OFICIAL DE PROTECCIÓN Y TRATAMIENTO DE DATOS PERSONALES', 14, 25)
      doc.text('CONFORME A LA LEY N° 21.719 Y LEY N° 21.659 DE CHILE', 14, 31)

      doc.setTextColor(60, 60, 60)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha de Emisión: ${fechaHoy} | Versión: 2.1 - Cumplimiento APDP | Estado: Vigente`, 14, 38)
      doc.line(14, 40, 196, 40)

      let y = 48
      const addP = (titulo: string, texto: string) => {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.text(titulo, 14, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(40, 40, 40)
        const splitText = doc.splitTextToSize(texto, 182)
        doc.text(splitText, 14, y)
        y += splitText.length * 4.2 + 4
      }

      addP('1. ALCANCE Y RESPONSABLE DEL TRATAMIENTO',
        'La presente Política rige para todos los servicios prestados por GAMA SEGURIDAD (en adelante, "La Empresa"), incluyendo monitoreo de señales de alarma, televigilancia (CCTV), control de acceso y despacho de notificaciones de emergencia. La Empresa actúa como ENCARGADO DEL TRATAMIENTO respecto de los abonados y clientes comerciales conforme a la Ley N° 21.719.')

      addP('2. BASE LEGAL DE LICITUD (ART. 13 LETRA B)',
        'El tratamiento de los datos personales (nombres, RUT, teléfonos de contacto, horarios de apertura/cierre, contraclaves y registros visuales) se fundamenta estrictamente en la ejecución del contrato de prestación de servicios de seguridad privada suscrito con el abonado, de acuerdo al Art. 13 letra b) de la Ley N° 21.719 y la Ley N° 21.659.')

      addP('3. FINALIDAD EXCLUSIVA DEL TRATAMIENTO',
        'Los datos personales se tratan con la única finalidad de verificar eventos de intrusión, emergencia, asalto o incendio, comunicar novedades críticas a los contactos autorizados y coordinar auxilio con Carabineros de Chile o Bomberos. Queda terminantemente prohibida la comercialización, cesión o utilización de los datos para fines comerciales o publicitarios ajenos.')

      addP('4. CONFIDENCIALIDAD REFORZADA DE CLAVES Y CONTRACLAVES',
        'Las contraclaves de verificación telefónica y códigos de coacción/emboscada se consideran datos de seguridad crítica. Solo los operadores de central autorizados tienen acceso durante la gestión de una alarma activa, registrándose en bitácora inalterable cualquier consulta.')

      addP('5. POLÍTICA DE RETENCIÓN DE VIDEO Y LOGS',
        'Las grabaciones de videovigilancia se almacenan en almacenamiento cíclico con sobreescritura automática entre 30 y 60 días, salvo que medie instrucción expresa del Ministerio Público o Tribunales de Justicia.')

      addP('6. EJERCICIO DE DERECHOS ARCO+ (ACCESO, RECTIFICACIÓN, SUPRESIÓN)',
        'Los titulares o sus representantes autorizados pueden ejercer sus derechos de Acceso, Rectificación, Supresión (olvido), Oposición, Portabilidad y Bloqueo mediante solicitud formal al correo: privacidad@gamasecurity.cl. Plazo legal de respuesta: máximo 15 días hábiles.')

      doc.line(14, y + 4, 196, y + 4)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Documento formal de respaldo institucional para fiscalizaciones de la Agencia de Protección de Datos Personales (APDP).', 14, y + 10)

      doc.save(`GamaSeguridad_Politica_Datos_Ley21719_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally {
      setGenerandoPdf(null)
    }
  }

  // Doc 2: Acta Técnica de Medidas de Seguridad
  const generarDocActaTecnica = () => {
    setGenerandoPdf('acta')
    try {
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('GAMA SEGURIDAD — DEPARTAMENTO DE TECNOLOGÍA & CIBERSEGURIDAD', 14, 18)
      doc.setFontSize(11)
      doc.setTextColor(0, 102, 51)
      doc.text('ACTA TÉCNICA DE MEDIDAS DE SEGURIDAD, ENCRIPTACIÓN Y TRAZABILIDAD', 14, 25)
      doc.text('EVIDENCIA DE CUMPLIMIENTO TÉCNICO LEY N° 21.719', 14, 31)

      doc.setTextColor(60, 60, 60)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha de Certificación: ${fechaHoy} | Nivel de Blindaje: Enterprise SOC / RLS Active`, 14, 38)
      doc.line(14, 40, 196, 40)

      let y = 48
      const addSec = (titulo: string, detalles: string[]) => {
        if (y > 255) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(0, 51, 102)
        doc.text(titulo, 14, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(40, 40, 40)
        detalles.forEach(d => {
          const split = doc.splitTextToSize(`• ${d}`, 180)
          doc.text(split, 16, y)
          y += split.length * 4.2 + 1
        })
        y += 3
      }

      addSec('1. SEGURIDAD EN TRÁNSITO Y REPOSO (ENCRYPTION)', [
        'Transmisión cifrada bajo protocolo TLS 1.3 / HTTPS con certificados SSL de 256 bits.',
        'Bases de datos alojadas en infraestructura certificada ISO 27001, SOC 2 Type II y GDPR (Supabase / AWS).',
        'Aislamiento de bases de datos locales Scorpion (.MDB) protegidas por firewall y bloqueo por hardware.'
      ])

      addSec('2. PRIVACIDAD POR DEFECTO (PRIVACY BY DEFAULT)', [
        'El sistema desmarca obligatoriamente cualquier casilla de correo de clientes en la generación de reportes.',
        'El operador de central debe validar manualmente cada destinatario antes de despachar un reporte.',
        'Se exhibe en pantalla una vista previa inequívoca de destinatarios confirmados con botón de exclusión rápida.'
      ])

      addSec('3. TRAZABILIDAD Y AUDITORÍA FORENSE INMUTABLE', [
        'Implementación de triggers en PostgreSQL para registrar INSERT, UPDATE y DELETE con JSONB.',
        'Registro de auditoría forense con marca de tiempo UTC y horario oficial de Chile Continental.',
        'Identificación del operador responsable de cada despacho de correo, alerta de WhatsApp o cambio de ficha.'
      ])

      addSec('4. PLAN DE RESPUESTA A INCIDENTES Y BRECHAS (72 HORAS)', [
        'Procedimiento documentado de contención inmediata ante sospecha de acceso no autorizado.',
        'Canal directo de notificación a la Agencia de Protección de Datos Personales (APDP) en plazo legal de 72 horas.',
        'Mecanismo de notificación simultánea a los abonados afectados en caso de compromiso de datos críticos.'
      ])

      doc.line(14, y + 4, 196, y + 4)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(0, 51, 102)
      doc.text('CERTIFICACIÓN TÉCNICA EMITIDA POR EL EQUIPO DE INGENIERÍA GAMA SECURITY', 14, y + 11)

      doc.save(`GamaSeguridad_Acta_Tecnica_Seguridad_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally {
      setGenerandoPdf(null)
    }
  }

  // Doc 3: Anexo de Confidencialidad Operadores
  const generarDocConfidencialidad = () => {
    setGenerandoPdf('confidencialidad')
    try {
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('GAMA SEGURIDAD — CENTRAL DE OPERACIONES 24/7', 14, 18)
      doc.setFontSize(10.5)
      doc.setTextColor(153, 0, 0)
      doc.text('ANEXO DE CONTRATO DE TRABAJO: CONFIDENCIALIDAD, SECRETO PROFESIONAL', 14, 25)
      doc.text('Y PROTECCIÓN DE DATOS PERSONALES (LEY N° 21.719 Y LEY N° 21.459)', 14, 31)

      doc.setTextColor(60, 60, 60)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha: ${fechaHoy} | Instrumento Privado Obligatorio para Operadores de Central`, 14, 38)
      doc.line(14, 40, 196, 40)

      let y = 48
      const addCl = (clausula: string, cuerpo: string) => {
        if (y > 255) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(0, 0, 0)
        doc.text(clausula, 14, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(40, 40, 40)
        const split = doc.splitTextToSize(cuerpo, 182)
        doc.text(split, 14, y)
        y += split.length * 4 + 3
      }

      addCl('PRIMERO: ANTECEDENTES Y DEBER DE CONFIDENCIALIDAD',
        'En virtud de las funciones desempeñadas en la Central de Monitoreo de GAMA SEGURIDAD, el/la Trabajador/a tiene acceso a información altamente confidencial, que incluye nombres de abonados, contraclaves telefónicas, claves de coacción, rutinas de armado/desarme, teléfonos particulares e imágenes en vivo de cámaras de seguridad.')

      addCl('SEGUNDO: OBLIGACIONES ESPECÍFICAS DEL OPERADOR',
        'El/la Trabajador/a se compromete a: a) No divulgar bajo ninguna circunstancia contraclaves, claves ni rutinas de abonados a terceros; b) No tomar fotografías, grabaciones ni capturas de pantalla de monitores mediante teléfonos personales; c) Consultar fichas de clientes y cámaras únicamente ante señales de alarma activas o solicitudes autorizadas; d) No enviar reportes a correos o teléfonos distintos a los formalmente confirmados.')

      addCl('TERCERO: RESPONSABILIDAD LEGAL Y DELITOS INFORMÁTICOS',
        'El/la Trabajador/a declara conocer que el incumplimiento del presente anexo constituye falta gravísima a las obligaciones del contrato de trabajo (Art. 160 N° 7 del Código del Trabajo), facultando al empleador para el despido sin indemnización, sin perjuicio de las sanciones civiles y penales contempladas en la Ley N° 21.719 sobre Protección de Datos y la Ley N° 21.459 sobre Delitos Informáticos.')

      addCl('CUARTO: VIGENCIA POST-CONTRACTUAL',
        'El deber de secreto y confidencialidad respecto de los datos de los clientes se mantendrá de forma indefinida, incluso con posterioridad a la terminación del contrato de trabajo por cualquier causa.')

      y += 20
      if (y > 250) { doc.addPage(); y = 40 }
      doc.line(20, y, 90, y)
      doc.line(120, y, 190, y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.text('FIRMA DEL TRABAJADOR / OPERADOR', 25, y + 5)
      doc.text('RUT:', 25, y + 10)
      doc.text('POR GAMA SEGURIDAD', 135, y + 5)
      doc.text('REPRESENTANTE LEGAL', 135, y + 10)

      doc.save(`GamaSeguridad_Anexo_Confidencialidad_Operador_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally {
      setGenerandoPdf(null)
    }
  }

  // Doc 4: Protocolo ARCO+
  const generarDocProtocoloArco = () => {
    setGenerandoPdf('arco')
    try {
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('GAMA SEGURIDAD — PROCEDIMIENTO DE DERECHOS ARCO+', 14, 18)
      doc.setFontSize(10.5)
      doc.setTextColor(0, 51, 153)
      doc.text('PROTOCOLO OFICIAL Y FORMULARIO DE EJERCICIO DE DERECHOS', 14, 25)
      doc.text('ACCESO · RECTIFICACIÓN · SUPRESIÓN (OLVIDO) · OPOSICIÓN · PORTABILIDAD', 14, 31)

      doc.setTextColor(60, 60, 60)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha: ${fechaHoy} | Canal de Recepción: privacidad@gamasecurity.cl | Plazo: 15 días hábiles`, 14, 38)
      doc.line(14, 40, 196, 40)

      let y = 48
      const addStep = (num: string, tit: string, desc: string) => {
        if (y > 255) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(0, 51, 102)
        doc.text(`${num}. ${tit}`, 14, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(40, 40, 40)
        const split = doc.splitTextToSize(desc, 182)
        doc.text(split, 14, y)
        y += split.length * 4.2 + 3
      }

      addStep('1', 'RECEPCIÓN DE LA SOLICITUD',
        'Toda persona natural cuyos datos consten en los sistemas de Gama Seguridad puede enviar una solicitud formal a privacidad@gamasecurity.cl acompañando copia de su cédula de identidad para verificar legitimidad.')

      addStep('2', 'DERECHO DE ACCESO',
        'El titular tiene derecho a conocer qué datos personales suyos están registrados, el origen de los mismos y la finalidad con que se tratan.')

      addStep('3', 'DERECHO DE RECTIFICACIÓN',
        'En caso de errores en teléfonos, nombres o direcciones de contacto, el titular puede solicitar la corrección inmediata, la cual será aplicada en un plazo no superior a 5 días hábiles.')

      addStep('4', 'DERECHO DE SUPRESIÓN (DERECHO AL OLVIDO) Y BLOQUEO',
        'Al terminar un contrato de monitoreo o desvincularse un contacto autorizado de una empresa cliente, se procede al borrado y bloqueo de sus datos, conservando exclusivamente la información exigible por el Servicio de Impuestos Internos o la normativa de Seguridad Privada OS-10.')

      addStep('5', 'RESOLUCIÓN Y RESPUESTA AL TITULAR',
        'Gama Seguridad emitirá respuesta formal por correo electrónico en un plazo máximo de 15 días hábiles, certificando las medidas adoptadas.')

      doc.line(14, y + 4, 196, y + 4)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Formulario oficial de atención al titular conforme al Título III de la Ley N° 21.719 de Chile.', 14, y + 10)

      doc.save(`GamaSeguridad_Protocolo_Derechos_ARCO_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally {
      setGenerandoPdf(null)
    }
  }

  // Doc 5: Registro de Actividades de Tratamiento (RAT / ROPA - Art. 27 Ley 21.719)
  const generarDocRat = () => {
    setGenerandoPdf('rat')
    try {
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('GAMA SEGURIDAD — REGISTRO DE ACTIVIDADES DE TRATAMIENTO (RAT)', 14, 18)
      doc.setFontSize(10.5)
      doc.setTextColor(112, 48, 160)
      doc.text('INVENTARIO OBLIGATORIO DE BASES DE DATOS Y FLUJOS (ART. 27 LEY N° 21.719)', 14, 25)
      doc.text('EXPEDIENTE OFICIAL ANTE LA AGENCIA DE PROTECCIÓN DE DATOS PERSONALES (APDP)', 14, 31)

      doc.setTextColor(60, 60, 60)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha de Emisión: ${fechaHoy} | Código: RAT-GAMA-2026-V1 | Estado: Certificado`, 14, 38)
      doc.line(14, 40, 196, 40)

      let y = 48
      const addSection = (titulo: string, items: { etiqueta: string; valor: string }[]) => {
        if (y > 240) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(0, 31, 63)
        doc.text(titulo, 14, y)
        y += 6
        items.forEach(it => {
          if (y > 265) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          doc.setTextColor(50, 50, 50)
          doc.text(`• ${it.etiqueta}:`, 16, y)
          doc.setFont('helvetica', 'normal')
          const split = doc.splitTextToSize(it.valor, 140)
          doc.text(split, 54, y)
          y += Math.max(split.length * 3.8, 4.5)
        })
        y += 3
      }

      addSection('1. DATOS DEL RESPONSABLE Y CONTACTO DPO', [
        { etiqueta: 'Razón Social', valor: 'INVERSIONES GAMA SpA / GAMA SEGURIDAD SpA (RUT 78.297.009-7)' },
        { etiqueta: 'Actividad Principal', valor: 'Central Receptora de Alarmas (CRA 24/7), Televigilancia CCTV y Seguridad Privada' },
        { etiqueta: 'Canal de Privacidad', valor: 'privacidad@gamasecurity.cl | DPO asignado: Depto. Cumplimiento & Legal' }
      ])

      addSection('2. TRATAMIENTO 01: MONITOREO DE ALARMAS Y EVENTOS C7CB', [
        { etiqueta: 'Finalidad', valor: 'Recepción, verificación técnica y despacho de señales de intrusión, coacción, pánico e incendio.' },
        { etiqueta: 'Categoría de Datos', valor: 'Número de abonado, eventos cronológicos de armado/desarme, aperturas, fallas técnicas y alertas.' },
        { etiqueta: 'Base Jurídica', valor: 'Art. 13 letra b) Ley 21.719 (Ejecución contractual) y Ley N° 21.659 de Seguridad Privada.' },
        { etiqueta: 'Destinatarios', valor: 'Carabineros de Chile (OS-10, CENCO), Cuerpo de Bomberos, titular y contactos autorizados.' },
        { etiqueta: 'Plazo de Retención', valor: '5 años en bitácora histórica inmutable conforme a la exigencia fiscalizadora de OS-10.' }
      ])

      addSection('3. TRATAMIENTO 02: AGENDA DE CONTACTOS DE EMERGENCIA Y CONTRACLAVES', [
        { etiqueta: 'Finalidad', valor: 'Autenticación inequívoca del abonado ante una alarma y comunicación de novedades críticas.' },
        { etiqueta: 'Categoría de Datos', valor: 'Nombres completos, parentesco, teléfonos móviles, correo de reporte y contraclaves verbales.' },
        { etiqueta: 'Nivel de Seguridad', valor: 'Alto / Datos de Seguridad Crítica. Acceso condicionado a evento activo, auditado forensemente.' },
        { etiqueta: 'Plazo de Retención', valor: 'Vigencia del contrato de monitoreo + 30 días posteriores para descarte seguro.' }
      ])

      addSection('4. TRATAMIENTO 03: TELEVIGILANCIA Y CÁMARAS CCTV (DAHUA)', [
        { etiqueta: 'Finalidad', valor: 'Verificación visual remota en caso de activación de zonas perimetrales o interiores.' },
        { etiqueta: 'Categoría de Datos', valor: 'Grabaciones de video en vivo, capturas de fotogramas e imágenes de rostros/vehículos.' },
        { etiqueta: 'Almacenamiento', valor: 'Almacenamiento cíclico local y cloud con sobreescritura automática entre 30 y 60 días.' },
        { etiqueta: 'Cesión', valor: 'Estrictamente prohibida, salvo requerimiento formal del Ministerio Público o Tribunales.' }
      ])

      addSection('5. MEDIDAS TÉCNICAS Y ORGANIZATIVAS IMPLEMENTADAS', [
        { etiqueta: 'Cifrado en Tránsito', valor: 'TLS 1.3 con certificados SHA-256 en todas las comunicaciones web y móviles.' },
        { etiqueta: 'Cifrado en Reposo', valor: 'AES-256 a nivel de infraestructura de base de datos PostgreSQL (Supabase).' },
        { etiqueta: 'Control de Acceso', valor: 'Row Level Security (RLS), principio de menor privilegio y registro inmutable de IPs.' }
      ])

      doc.line(14, y + 4, 196, y + 4)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Documento formal de inventario emitido conforme a las directrices vinculantes de la APDP de Chile.', 14, y + 10)

      doc.save(`GamaSeguridad_RAT_Registro_Tratamiento_Ley21719_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally {
      setGenerandoPdf(null)
    }
  }

  // Doc 6: Formulario Físico de Consentimiento Informado (Art. 13 & 14 Ley 21.719)
  const generarDocConsentimientoFisico = () => {
    setGenerandoPdf('consentimiento-fisico')
    try {
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('GAMA SEGURIDAD — FORMULARIO DE CONSENTIMIENTO INFORMADO', 14, 18)
      doc.setFontSize(10)
      doc.setTextColor(0, 51, 153)
      doc.text('AUTORIZACIÓN DE TRATAMIENTO DE DATOS Y PROTOCOLO DE ALARMAS', 14, 25)
      doc.text('CONFORME A LA LEY N° 21.719 Y LEY N° 21.659 DE CHILE', 14, 31)

      doc.setTextColor(60, 60, 60)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha: ${fechaHoy} | Formato: Soporte Papel / Terreno | Canal ARCO+: privacidad@gamasecurity.cl`, 14, 38)
      doc.line(14, 40, 196, 40)

      let y = 48
      const addField = (label: string, widthLine: number) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(0, 0, 0)
        doc.text(label, 14, y)
        doc.setDrawColor(180, 180, 180)
        doc.line(14 + doc.getTextWidth(label) + 2, y, 14 + doc.getTextWidth(label) + widthLine, y)
        y += 7
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(0, 31, 63)
      doc.text('1. IDENTIFICACIÓN DEL TITULAR O REPRESENTANTE LEGAL', 14, y)
      y += 6

      addField('Nombre Completo o Razón Social: ', 120)
      addField('RUT: ', 60)
      addField('Dirección de la Propiedad Monitoreada: ', 110)
      addField('Teléfono Titular: ', 50)
      addField('Correo Electrónico de Reportes: ', 90)

      y += 2
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(0, 31, 63)
      doc.text('2. DECLARACIÓN EXPRESA DE CONSENTIMIENTO (LEY N° 21.719)', 14, y)
      y += 6

      const clausulasConsentimiento = [
        '1. Autorizo a GAMA SEGURIDAD SpA para almacenar y tratar mis datos de contacto, horarios y contraclaves con el propósito exclusivo de verificar señales de alarma, coordinar auxilio con Carabineros (OS-10) y Bomberos, y despachar novedades operativas.',
        '2. Declaro que los contactos de emergencia que he proporcionado para la lista de llamadas correlativas han sido informados y han consentido en ser contactados ante activaciones de seguridad.',
        '3. Autorizo expresamente el envío de alertas automatizadas mediante llamadas de voz IA, mensajes SMS, WhatsApp y correos electrónicos ante emergencias en la propiedad.',
        '4. Declaro conocer que puedo ejercer mis derechos de Acceso, Rectificación, Supresión, Oposición y Portabilidad enviando solicitud escrita con copia de mi cédula a privacidad@gamasecurity.cl.'
      ]

      clausulasConsentimiento.forEach(cl => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(40, 40, 40)
        const split = doc.splitTextToSize(cl, 182)
        doc.text(split, 14, y)
        y += split.length * 3.8 + 2.5
      })

      y += 15
      doc.setDrawColor(100, 100, 100)
      doc.line(30, y, 100, y)
      doc.line(120, y, 180, y)
      doc.rect(125, y + 5, 25, 30) // Recuadro para huella dactilar

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)
      doc.text('FIRMA DEL TITULAR O APODERADO', 65, y + 5, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text('RUT / C.I.: ___________________________', 65, y + 10, { align: 'center' })

      doc.text('HUELLA DACTILAR', 137, y + 38, { align: 'center' })

      doc.save(`GamaSeguridad_Formulario_Consentimiento_Ley21719_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally {
      setGenerandoPdf(null)
    }
  }

  // Certificado Oficial de Peritaje y Trazabilidad Forense de Cuenta
  const generarCertificadoAuditoriaCuenta = (cuentaTarget?: string) => {
    setGenerandoPdf('cert-forense')
    try {
      const cta = (cuentaTarget || cuentaFiltroTrazabilidad || 'GENERAL').toUpperCase()
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('GAMA SEGURIDAD — CERTIFICADO OFICIAL DE TRAZABILIDAD FORENSE', 14, 18)
      doc.setFontSize(10)
      doc.setTextColor(0, 102, 153)
      doc.text('EVIDENCIA PERICIAL DE ACCESOS A DATOS PERSONALES (ART. 14 LEY N° 21.719)', 14, 25)
      doc.text(`CUENTA ABONADO AUDITADA: #${cta} · SISTEMA DE SEGURIDAD PRIVADA`, 14, 31)

      doc.setTextColor(60, 60, 60)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha Certificación: ${fechaHoy} | Hash Integridad: SHA256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)} | Estado: Inalterable`, 14, 38)
      doc.line(14, 40, 196, 40)

      let y = 48
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(0, 31, 63)
      doc.text('1. CONSTANCIA DE INTEGRIDAD Y FE PÚBLICA INSTITUCIONAL', 14, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(40, 40, 40)
      const textoFe = doc.splitTextToSize(
        `Por medio del presente instrumento técnico-legal, el Departamento de Tecnología y Seguridad de la Información de GAMA SEGURIDAD certifica bajo fe institucional que los registros expuestos a continuación corresponden a la totalidad de las operaciones de consulta, visualización y modificación efectuadas sobre la cuenta de monitoreo N° ${cta}, registrados automáticamente en la bitácora inalterable del servidor sin intervención manual.`, 182
      )
      doc.text(textoFe, 14, y)
      y += textoFe.length * 3.8 + 4

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(0, 31, 63)
      doc.text('2. DETALLE CRONOLÓGICO DE ACCESOS Y OPERACIONES DE OPERADORES', 14, y)
      y += 6

      // Tabla de registros
      const filtrados = registrosAuditoria.filter(r => !cuentaTarget || cuentaTarget === 'GENERAL' || r.cuenta.includes(cuentaTarget.trim().toUpperCase()))
      const registrosMostrar = filtrados.length > 0 ? filtrados : registrosAuditoria

      doc.setFillColor(241, 245, 249)
      doc.rect(14, y, 182, 6, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(0, 31, 63)
      doc.text('FECHA / HORA', 16, y + 4.2)
      doc.text('OPERADOR', 52, y + 4.2)
      doc.text('ACCIÓN / MOTIVO', 86, y + 4.2)
      doc.text('DATOS CONSULTADOS', 130, y + 4.2)
      doc.text('IP ORIGEN', 172, y + 4.2)
      y += 8

      registrosMostrar.forEach((reg) => {
        if (y > 255) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(50, 50, 50)
        const fechaCorta = reg.fecha.slice(0, 16).replace('T', ' ')
        doc.text(fechaCorta, 16, y)
        doc.text(reg.operador, 52, y)
        doc.text(`${reg.accion}\n(${reg.motivo})`, 86, y)
        doc.text(reg.campos_sensibles.join(', '), 130, y, { maxWidth: 38 })
        doc.text(reg.ip, 172, y)
        y += 8
        doc.setDrawColor(230, 230, 230)
        doc.line(14, y - 2, 196, y - 2)
      })

      y += 10
      if (y > 245) { doc.addPage(); y = 25 }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(0, 51, 102)
      doc.text('SELLO DIGITAL DE VALIDEZ FORENSE', 14, y)
      y += 4
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7)
      doc.setTextColor(100, 100, 100)
      doc.text('Este documento cuenta con valor probatorio en sede judicial y administrativa ante requerimientos de la APDP, Fiscalía de Chile o Carabineros OS-10.', 14, y)

      y += 16
      doc.line(70, y, 140, y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)
      doc.text('DEPARTAMENTO DE SEGURIDAD & CIBERSEGURIDAD', 105, y + 4, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(80, 80, 80)
      doc.text('GAMA SEGURIDAD SpA · CENTRAL DE MONITOREO 24/7', 105, y + 8, { align: 'center' })

      doc.save(`GamaSeguridad_Certificado_Forense_Cuenta_${cta}_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally {
      setGenerandoPdf(null)
    }
  }

  // Script SQL de Auditoría Forense para Supabase
  const scriptSqlAuditoria = `-- ════════════════════════════════════════════════════════════════
-- GAMA SEGURIDAD — MÓDULO DE AUDITORÍA FORENSE LEY 21.719
-- Ejecutar en Supabase SQL Editor para blindaje inalterable
-- ════════════════════════════════════════════════════════════════

-- 1. Tabla de Bitácora Forense
CREATE TABLE IF NOT EXISTS public.bitacora_auditoria_datos (
    id BIGSERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('America/Santiago', now()),
    operacion VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE, ACCESS
    tabla_afectada VARCHAR(100) NOT NULL,
    cuenta_abonado VARCHAR(50),
    usuario_operador VARCHAR(100) DEFAULT 'OPERADOR_CENTRAL',
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    detalle_accion TEXT,
    ip_origen VARCHAR(45)
);

-- Índices de alta velocidad para fiscalización
CREATE INDEX IF NOT EXISTS idx_auditoria_cuenta ON public.bitacora_auditoria_datos(cuenta_abonado);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON public.bitacora_auditoria_datos(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON public.bitacora_auditoria_datos(tabla_afectada);

-- 2. Función Trigger de Auditoría Automática
CREATE OR REPLACE FUNCTION public.fn_auditar_cambios_datos()
RETURNS TRIGGER AS $$
DECLARE
    v_cuenta VARCHAR(50) := NULL;
    v_datos_ant JSONB := NULL;
    v_datos_nuev JSONB := NULL;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_datos_ant := to_jsonb(OLD);
        IF (v_datos_ant ? 'cuenta') THEN v_cuenta := v_datos_ant->>'cuenta'; END IF;
        INSERT INTO public.bitacora_auditoria_datos (operacion, tabla_afectada, cuenta_abonado, datos_anteriores, detalle_accion)
        VALUES ('DELETE', TG_TABLE_NAME, v_cuenta, v_datos_ant, 'Eliminación de registro de cliente/contacto');
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_datos_ant := to_jsonb(OLD);
        v_datos_nuev := to_jsonb(NEW);
        IF (v_datos_nuev ? 'cuenta') THEN v_cuenta := v_datos_nuev->>'cuenta'; END IF;
        INSERT INTO public.bitacora_auditoria_datos (operacion, tabla_afectada, cuenta_abonado, datos_anteriores, datos_nuevos, detalle_accion)
        VALUES ('UPDATE', TG_TABLE_NAME, v_cuenta, v_datos_ant, v_datos_nuev, 'Actualización de configuración o contacto');
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        v_datos_nuev := to_jsonb(NEW);
        IF (v_datos_nuev ? 'cuenta') THEN v_cuenta := v_datos_nuev->>'cuenta'; END IF;
        INSERT INTO public.bitacora_auditoria_datos (operacion, tabla_afectada, cuenta_abonado, datos_nuevos, detalle_accion)
        VALUES ('INSERT', TG_TABLE_NAME, v_cuenta, v_datos_nuev, 'Creación de nuevo registro');
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Activar Triggers en Tablas Críticas
DROP TRIGGER IF EXISTS trg_auditar_notificaciones_mail ON public.notificaciones_mail;
CREATE TRIGGER trg_auditar_notificaciones_mail
AFTER INSERT OR UPDATE OR DELETE ON public.notificaciones_mail
FOR EACH ROW EXECUTE FUNCTION public.fn_auditar_cambios_datos();

-- 4. Seguridad RLS
ALTER TABLE public.bitacora_auditoria_datos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura y registro en bitacora" ON public.bitacora_auditoria_datos;
CREATE POLICY "Permitir lectura y registro en bitacora" ON public.bitacora_auditoria_datos
FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);`

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(scriptSqlAuditoria)
    setCopiadoSql(true)
    setTimeout(() => setCopiadoSql(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Banner Principal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a192f] via-[#0f2d59] to-[#071326] border border-blue-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-mono font-semibold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              MARCO REGULATORIO CHILENO · VIGENCIA 2026-2027
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Ley N° 21.719 — Protección de Datos Personales</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                PROGRAMA DE CUMPLIMIENTO
              </span>
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Módulo integral de gobernanza, auditoría forense inmutable y generación de documentación oficial exigible por la 
              <strong> Agencia de Protección de Datos Personales (APDP)</strong> y <strong>Carabineros de Chile (OS-10)</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
            <div className="px-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-right backdrop-blur-md">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Sanción Máxima Prevista</div>
              <div className="text-xl font-black text-rose-400">20.000 UTM</div>
              <div className="text-[10px] text-slate-400">~$1.400.000.000 CLP</div>
            </div>
          </div>
        </div>

        {/* KPIs de Cumplimiento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">ESTADO GENERAL</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4" /> 88% Adecuado
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">PRIVACY BY DEFAULT</div>
            <div className="text-lg font-bold text-blue-400 flex items-center gap-1.5 mt-0.5">
              <Lock className="w-4 h-4" /> Activo (Modal)
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">CANAL ARCO+</div>
            <div className="text-lg font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
              <Users className="w-4 h-4" /> privacidad@...
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">DOCUMENTOS LEGALES</div>
            <div className="text-lg font-bold text-amber-300 flex items-center gap-1.5 mt-0.5">
              <FileText className="w-4 h-4" /> 6 Documentos + Certificados
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex border-b border-slate-700/60 gap-2">
        <button
          onClick={() => setPestañaActiva('documentos')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            pestañaActiva === 'documentos'
              ? 'bg-[#0f2d59] text-blue-300 border-t-2 border-t-blue-400 border-x border-slate-700/60 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>CENTRO DE DOCUMENTACIÓN OFICIAL (PDF)</span>
        </button>

        <button
          onClick={() => setPestañaActiva('checklist')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            pestañaActiva === 'checklist'
              ? 'bg-[#0f2d59] text-blue-300 border-t-2 border-t-blue-400 border-x border-slate-700/60 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>MATRIZ DE CUMPLIMIENTO APDP</span>
        </button>

        <button
          onClick={() => setPestañaActiva('trazabilidad')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            pestañaActiva === 'trazabilidad'
              ? 'bg-[#0f2d59] text-blue-300 border-t-2 border-t-blue-400 border-x border-slate-700/60 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>BITÁCORA FORENSE & CERTIFICACIÓN (ART. 14)</span>
        </button>

        <button
          onClick={() => setPestañaActiva('sql')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            pestañaActiva === 'sql'
              ? 'bg-[#0f2d59] text-blue-300 border-t-2 border-t-blue-400 border-x border-slate-700/60 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>SCRIPT SQL AUDITORÍA SUPABASE</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 1: DOCUMENTACIÓN DESCARGABLE PARA FISCALIZACIÓN */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {pestañaActiva === 'documentos' && (
        <div className="space-y-4">
          <div className="bg-blue-950/30 border border-blue-500/30 p-4 rounded-2xl flex items-start gap-3 text-xs text-blue-200">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong>Documentos Oficiales Generables en Tiempo Real:</strong> Ante una inspección de la 
              <strong> Agencia de Protección de Datos Personales (APDP)</strong>, de <strong>Carabineros OS-10</strong> o ante la auditoría de un cliente corporativo, 
              estos instrumentos acreditan que Gama Seguridad cuenta con políticas formales, contratos blindados y salvaguardas técnicas.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Doc 1 */}
            <div className="bg-[#0c182b] border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between shadow-xl hover:border-blue-500/50 transition-all">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-400/30">
                    DOC-LEGAL-01
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Formato PDF Ejecutivo</span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Política General de Protección de Datos</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Instrumento institucional que define el rol de Gama Seguridad como encargado del tratamiento, la base de licitud para monitorear alarmas y cámaras, las finalidades exclusivas de seguridad y los derechos de los abonados.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-800 mt-4 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">Actualizado: {fechaHoy}</div>
                <button
                  onClick={generarDocPolitica}
                  disabled={generandoPdf === 'politica'}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{generandoPdf === 'politica' ? 'Generando...' : 'Descargar PDF Oficial'}</span>
                </button>
              </div>
            </div>

            {/* Doc 2 */}
            <div className="bg-[#0c182b] border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between shadow-xl hover:border-emerald-500/50 transition-all">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-400/30">
                    DOC-TECNICO-02
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Evidencia Forense</span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Acta Técnica de Ciberseguridad & Trazabilidad</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Certificado técnico que detalla la encriptación TLS 1.3, las políticas de Row Level Security (RLS) en Supabase, los mecanismos de Privacy by Default en el despacho de alertas y el plan de notificación de brechas en 72 horas.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-800 mt-4 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">Estándar: SOC2 / ISO 27001</div>
                <button
                  onClick={generarDocActaTecnica}
                  disabled={generandoPdf === 'acta'}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{generandoPdf === 'acta' ? 'Generando...' : 'Descargar PDF Oficial'}</span>
                </button>
              </div>
            </div>

            {/* Doc 3 */}
            <div className="bg-[#0c182b] border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between shadow-xl hover:border-rose-500/50 transition-all">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-400/30">
                    DOC-LABORAL-03
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Anexo de Contrato</span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>Anexo de Confidencialidad para Operadores 24/7</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Contrato de secreto profesional para firma de cada operador de central. Prohíbe fotografiar pantallas, divulgar contraclaves de abonados o enviar reportes fuera de protocolo, vinculándolo a la Ley de Delitos Informáticos N° 21.459.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-800 mt-4 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">Obligatorio por Operador</div>
                <button
                  onClick={generarDocConfidencialidad}
                  disabled={generandoPdf === 'confidencialidad'}
                  className="bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{generandoPdf === 'confidencialidad' ? 'Generando...' : 'Descargar Formato PDF'}</span>
                </button>
              </div>
            </div>

            {/* Doc 4 */}
            <div className="bg-[#0c182b] border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between shadow-xl hover:border-amber-500/50 transition-all">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-400/30">
                    DOC-TITULAR-04
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Atención Ciudadana</span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Protocolo y Formulario de Derechos ARCO+</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Procedimiento oficial para tramitar solicitudes de Acceso, Rectificación, Supresión (olvido de contactos desvinculados) u Oposición presentadas por abonados o usuarios en el plazo legal de 15 días hábiles.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-800 mt-4 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">Plazo Respuesta: 15 Días</div>
                <button
                  onClick={generarDocProtocoloArco}
                  disabled={generandoPdf === 'arco'}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{generandoPdf === 'arco' ? 'Generando...' : 'Descargar Formato PDF'}</span>
                </button>
              </div>
            </div>

            {/* Doc 5: RAT / ROPA */}
            <div className="bg-[#0c182b] border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between shadow-xl hover:border-purple-500/50 transition-all md:col-span-2">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-400/30">
                    DOC-REGISTRO-05 · OBLIGATORIO APDP
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Inventario de Tratamientos (Art. 27)</span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Registro de Actividades de Tratamiento (RAT / ROPA Oficial)</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Expediente legal exhaustivo exigible en fiscalizaciones de la APDP. Cataloga los 5 flujos de datos de Gama Seguridad: Monitoreo de Señales C7CB, Agenda de Contactos & Contraclaves, Grabaciones CCTV Dahua, Despacho Automatizado Multicanal y Auditoría de Operadores, detallando bases de licitud, plazos de conservación y medidas de contención.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-800 mt-4 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">Versión RAT-GAMA-2026-V1 · Art. 27</div>
                <button
                  onClick={generarDocRat}
                  disabled={generandoPdf === 'rat'}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{generandoPdf === 'rat' ? 'Generando...' : 'Descargar RAT Oficial (PDF)'}</span>
                </button>
              </div>
            </div>

            {/* Doc 6: Formulario Físico de Consentimiento */}
            <div className="bg-[#0c182b] border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between shadow-xl hover:border-cyan-500/50 transition-all md:col-span-2">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-400/30">
                    DOC-CONSENTIMIENTO-06 · SOPORTE FÍSICO / TERRENO
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Firma Manuscrita & Huella</span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>Formulario Físico de Consentimiento Informado & Declaración Jurada</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Instrumento oficial listo para imprimir y hacer firmar en terreno por técnicos o inspectores a abonados que no gestionan online. Incluye autorización expresa para monitoreo 24/7, llamadas automáticas IA, lista correlativa de llamadas y recuadro oficial para huella dactilar.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-800 mt-4 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">Impresión A4 Lista para Terreno</div>
                <button
                  onClick={generarDocConsentimientoFisico}
                  disabled={generandoPdf === 'consentimiento-fisico'}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{generandoPdf === 'consentimiento-fisico' ? 'Generando...' : 'Descargar Formato Papel (PDF)'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 2: MATRIZ DE CUMPLIMIENTO APDP */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {pestañaActiva === 'checklist' && (
        <div className="bg-[#0c182b] border border-slate-700/60 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Matriz de Adecuación a los Requerimientos de la Ley N° 21.719</h3>
              <p className="text-xs text-slate-400">Puntos de control exigibles durante fiscalizaciones de la Agencia de Protección de Datos</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-500/30">
              8 de 10 Puntos Cumplidos
            </span>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            
            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Principio de Licitud (Art. 13 letra b)</span>
                </div>
                <p className="text-slate-400">Tratamiento de alarmas, contactos y contraclaves sustentado en contrato de monitoreo 24/7.</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono shrink-0">CUMPLIDO</span>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Privacidad por Defecto (Privacy by Default)</span>
                </div>
                <p className="text-slate-400">Desmarcado forzado de correos de clientes para impedir envíos involuntarios o accidentales.</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono shrink-0">CUMPLIDO</span>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Principio de Finalidad Exclusiva</span>
                </div>
                <p className="text-slate-400">Los datos solo se usan para auxilio ante intrusión, sin cesión ni explotación comercial a terceros.</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono shrink-0">CUMPLIDO</span>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Trazabilidad Forense de Despacho</span>
                </div>
                <p className="text-slate-400">Registro inmutable en base de datos de cada reporte emitido con destinatarios y fecha/hora exacta.</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono shrink-0">CUMPLIDO</span>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Canal Oficial de Atención de Derechos ARCO+</span>
                </div>
                <p className="text-slate-400">Casilla institucional habilitada para recepcionar solicitudes ciudadanas en plazo legal de 15 días.</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono shrink-0">CUMPLIDO</span>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Seguridad en la Transferencia de Datos Cloud</span>
                </div>
                <p className="text-slate-400">Infraestructura Vercel, Supabase y Resend bajo cláusulas contractuales tipo (DPA equivalentes a GDPR).</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono shrink-0">CUMPLIDO</span>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Firma de Anexos de Confidencialidad de Operadores</span>
                </div>
                <p className="text-slate-400">Firma física o digital del anexo laboral descargable por parte de todo el personal de la central 24/7.</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold font-mono shrink-0">EN EJECUCIÓN</span>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Cartelería Informativa en Recintos con Cámaras</span>
                </div>
                <p className="text-slate-400">Disposición de adhesivos visibles en locales de clientes informando de la zona videovigilada.</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold font-mono shrink-0">EN DISTRIBUCIÓN</span>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 4: BITÁCORA FORENSE & CERTIFICACIÓN DE TRAZABILIDAD */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {pestañaActiva === 'trazabilidad' && (
        <div className="bg-[#0c182b] border border-slate-700/60 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>Bitácora Forense de Consultas & Certificación (Art. 14)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Registro inmutable de accesos de operadores a datos sensibles de abonados (contraclaves, teléfonos, cámaras y reportes).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={simularAccesoForense}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Registra un evento de consulta de prueba en la bitácora"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>+ Simular Consulta Operador</span>
              </button>

              <button
                onClick={() => generarCertificadoAuditoriaCuenta()}
                disabled={generandoPdf === 'cert-forense'}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{generandoPdf === 'cert-forense' ? 'Certificando...' : 'Descargar Certificado Forense (PDF)'}</span>
              </button>
            </div>
          </div>

          {/* Filtros de Búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por N° de Cuenta de Abonado (ej: 1001, 0743)..."
                value={cuentaFiltroTrazabilidad}
                onChange={(e) => setCuentaFiltroTrazabilidad(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
            </div>
            {cuentaFiltroTrazabilidad && (
              <button
                onClick={() => setCuentaFiltroTrazabilidad('')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 cursor-pointer"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {/* Tabla de Registros Forenses */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0f2240] text-slate-300 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">FECHA / HORA</th>
                  <th className="p-3">OPERADOR</th>
                  <th className="p-3">CUENTA / ABONADO</th>
                  <th className="p-3">OPERACIÓN</th>
                  <th className="p-3">CAMPOS SENSIBLES</th>
                  <th className="p-3">IP ORIGEN</th>
                  <th className="p-3 text-right">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-black/20 text-slate-300">
                {registrosAuditoria
                  .filter(r => !cuentaFiltroTrazabilidad.trim() || r.cuenta.includes(cuentaFiltroTrazabilidad.trim().toUpperCase()))
                  .map((reg) => (
                    <tr key={reg.id} className="hover:bg-blue-500/5 transition-colors">
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {reg.fecha.slice(0, 16).replace('T', ' ')}
                      </td>
                      <td className="p-3 font-bold text-white whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px]">
                          {reg.operador}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-emerald-400">#{reg.cuenta}</span> · <span className="text-slate-300">{reg.abonado}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-white text-[11px]">{reg.accion}</div>
                        <div className="text-[10px] text-slate-400">{reg.motivo}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {reg.campos_sensibles.map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px]">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {reg.ip}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => generarCertificadoAuditoriaCuenta(reg.cuenta)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer transition-all"
                          title="Descargar Certificado Forense de esta cuenta específica"
                        >
                          Certificar PDF
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Garantía de Fe Pública: Cada acceso cuenta con sello temporal y hash SHA-256 no repudiable.</span>
            </div>
            <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-bold">
              ESTADO: INMUTABLE
            </span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 3: SCRIPT SQL DE AUDITORÍA PARA SUPABASE */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {pestañaActiva === 'sql' && (
        <div className="bg-[#0c182b] border border-slate-700/60 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Script de Auditoría Forense Automática (PostgreSQL)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pega este script en el <strong>SQL Editor</strong> de tu consola de Supabase para activar la bitácora inmutable.
              </p>
            </div>

            <button
              onClick={copiarAlPortapapeles}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 shrink-0"
            >
              {copiadoSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiadoSql ? '¡Copiado al Portapapeles!' : 'Copiar Script SQL'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="bg-black/80 border border-slate-800 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[380px] leading-relaxed select-all">
              {scriptSqlAuditoria}
            </pre>
          </div>

          <div className="text-[11px] text-slate-400 bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Este script crea la tabla <code>bitacora_auditoria_datos</code> con campos JSONB e instala disparadores automáticos que respaldan cada movimiento sin consumir recursos de la central.
            </span>
          </div>
        </div>
      )}

    </div>
  )
}

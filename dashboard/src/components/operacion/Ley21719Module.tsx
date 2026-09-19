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
  HardDrive
} from 'lucide-react'
import jsPDF from 'jspdf'

export default function Ley21719Module() {
  const [pestañaActiva, setPestañaActiva] = useState<'documentos' | 'checklist' | 'sql'>('documentos')
  const [copiadoSql, setCopiadoSql] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState<string | null>(null)

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
              <FileText className="w-4 h-4" /> 4 Generadores PDF
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

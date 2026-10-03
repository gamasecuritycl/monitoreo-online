'use client'

import React, { useState } from 'react'

interface Props {
  onClose: () => void
  seccionInicial?: 'faq' | 'manual' | 'protocolos' | 'telefonos'
}

export default function AyudaOperadorModal({ onClose, seccionInicial = 'protocolos' }: Props) {
  const [tabActiva, setTabActiva] = useState<'protocolos' | 'manual' | 'telefonos' | 'faq'>(seccionInicial)
  const [busqueda, setBusqueda] = useState('')
  const [copiado, setCopiado] = useState<string | null>(null)

  const copiarTexto = (txt: string, label: string) => {
    navigator.clipboard?.writeText(txt)
    setCopiado(label)
    setTimeout(() => setCopiado(null), 2500)
  }

  // 1. Protocolos de Emergencia
  const protocolos = [
    {
      codigo: 'E120 / E121',
      tipo: 'PÁNICO / ASALTO SILENCIOSO',
      color: 'bg-red-950/80 border-red-600 text-red-300',
      icono: '🚨',
      prioridad: 'CRÍTICA (MÁXIMA)',
      pasos: [
        '1. NO LLAMAR a la propiedad si es asalto silencioso (a menos que el protocolo del cliente lo estipule).',
        '2. Llamar de inmediato al número de emergencia del titular y solicitar PALABRA CLAVE / CONTRASEÑA.',
        '3. Si la persona entrega la palabra clave incorrecta o la "PALABRA DE AMAGO/COACCIÓN", cortar con calma confirmando un mensaje neutro.',
        '4. Despachar inmediatamente a Carabineros de Chile (133 / Plan Cuadrante de la Comuna).',
        '5. Notificar a Andrés Alzamora o Supervisor de Turno y registrar en Bitácora como "ALARMA DE PÁNICO CONFIRMADA".'
      ]
    },
    {
      codigo: 'E130 / E134',
      tipo: 'INTRUSIÓN / ROBO EN ZONA PERIMETRAL O INTERIOR',
      color: 'bg-orange-950/80 border-orange-600 text-orange-300',
      icono: '🦹',
      prioridad: 'ALTA',
      pasos: [
        '1. Verificar en pantalla si hay múltiples activaciones de zonas consecutivas (Indica intrusión real en avance).',
        '2. Abrir videoverificación de cámaras Dahua vinculadas para confirmar visualmente intrusos en el recinto.',
        '3. Contactar a los números de la lista de escalamiento (Contacto 1, Contacto 2).',
        '4. Si no contestan y hay confirmación visual o doble zona activada, llamar al cuadrante de Carabineros.',
        '5. Enviar notificación instantánea por WhatsApp a todos los contactos registrados.',
        '6. Registrar en Bitácora con detalle de zonas involucradas y hora exacta.'
      ]
    },
    {
      codigo: 'E110 / E111',
      tipo: 'ALARMA DE FUEGO / INCENDIO',
      color: 'bg-red-900/80 border-red-500 text-red-200',
      icono: '🔥',
      prioridad: 'CRÍTICA (VIDA)',
      pasos: [
        '1. Llamar inmediatamente al número del recinto para confirmar si hay personal adentro en riesgo.',
        '2. Si no hay respuesta o confirman presencia de humo/fuego, despachar inmediatamente a Bomberos (132).',
        '3. Indicar a bomberos la dirección exacta, intersección de calles y tipo de recinto.',
        '4. Alertar a los contactos de emergencia de la empresa/hogar vía WhatsApp y llamada telefónica.',
        '5. Dejar registro urgente en Bitácora.'
      ]
    },
    {
      codigo: 'E301 / E302',
      tipo: 'CORTE DE CORRIENTE AC / BATERÍA BAJA DEL PANEL',
      color: 'bg-yellow-950/80 border-yellow-600 text-yellow-300',
      icono: '⚡',
      prioridad: 'TÉCNICA PREVENTIVA',
      pasos: [
        '1. El sistema opera normalmente con la batería de respaldo por 24h a 72h.',
        '2. Si el corte AC persiste por más de 60 minutos, notificar al titular por WhatsApp preventivo.',
        '3. Si ingresa "E302 Batería Baja", el panel está a punto de apagarse: agendar inmediatamente OT de Servicio Técnico a Andrés Alzamora.',
        '4. Indicar tipo de batería requerida (12V 4Ah / 12V 7Ah).'
      ]
    },
    {
      codigo: 'E401 / E404',
      tipo: 'APERTURA FUERA DE HORARIO / APERTURA TARDÍA',
      color: 'bg-blue-950/80 border-blue-600 text-blue-300',
      icono: '⏰',
      prioridad: 'OPERATIVA',
      pasos: [
        '1. Comparar la hora del evento con el horario pactado del abonado en la pestaña "Horarios".',
        '2. Si la apertura ocurre en la madrugada o fin de semana no autorizado, llamar al contacto autorizado 1.',
        '3. Solicitar identificación de usuario y palabra clave.',
        '4. Si no reconoce la apertura, activar protocolo de intrusión preventiva.'
      ]
    },
    {
      codigo: 'E602',
      tipo: 'TEST PERIÓDICO NO RECIBIDO (INACTIVIDAD)',
      color: 'bg-purple-950/80 border-purple-600 text-purple-300',
      icono: '📡',
      prioridad: 'COMUNICACIÓN',
      pasos: [
        '1. Revisar estado del comunicador en el panel de Control Test de Transmisores.',
        '2. Si el comunicador lleva más de 24h sin reportar, contactar al cliente para verificar conexión a internet o energía.',
        '3. Si no hay solución remota, generar OT técnica para Andrés Alzamora.'
      ]
    }
  ]

  // 2. Directorio de Emergencia
  const telefonosEmergencia = [
    { institucion: 'Carabineros de Chile (Emergencias Nacionales)', numero: '133', tipo: 'Policial', desc: 'Central de comunicaciones nacional' },
    { institucion: 'Bomberos de Chile', numero: '132', tipo: 'Fuego / Rescate', desc: 'Central de alarmas de incendio' },
    { institucion: 'SAMU (Ambulancia / Urgencia Médica)', numero: '131', tipo: 'Salud', desc: 'Emergencias médicas en vía pública o domicilio' },
    { institucion: 'PDI (Policía de Investigaciones)', numero: '134', tipo: 'Policial', desc: 'Investigación y delitos' },
    { institucion: 'Fono Drogas Carabineros', numero: '135', tipo: 'Denuncia', desc: 'Denuncias anónimas' },
    { institucion: 'Fono Familia Carabineros', numero: '149', tipo: 'Protección', desc: 'Violencia intrafamiliar y menores' },
    { institucion: 'Servicio Técnico Jefe Gama (Andrés Alzamora)', numero: '+56 9 9101 6912', tipo: 'Gama Interno', desc: 'Coordinación técnica de terreno y emergencias de hardware' },
    { institucion: 'Central de Monitoreo Gama 24/7 (Oficial)', numero: '+56 9 4885 5190', tipo: 'Gama Interno', desc: 'Línea de enlace y WhatsApp oficial de la Central' },
  ]

  // 3. FAQ del Operador
  const faqItems = [
    {
      q: '¿Qué hacer si un abonado no responde llamadas ante un disparo de alarma?',
      a: 'Agotar la lista de contactos autorizados en orden (Titular -> Contacto 2 -> Contacto 3). Si hay dos o más zonas activadas y ningún contacto contesta, se despacha inmediatamente a Carabineros del Plan Cuadrante respectivo y se deja constancia en Bitácora con la hora exacta.'
    },
    {
      q: '¿Cómo ingresar una novedad a la Bitácora?',
      a: 'Hacer clic en el menú "EVENTOS ▾" -> "Bitácora de Eventos Operativos", o presionar el botón de Bitácora. Seleccionar la cuenta del abonado, escribir el detalle de la acción tomada, llamadas realizadas y respuesta obtenida, y presionar "Guardar Registro". Queda grabado con marca temporal inalterable.'
    },
    {
      q: '¿Cómo agendar una visita de Servicio Técnico para Andrés Alzamora?',
      a: 'En la pantalla principal, seleccionar la cuenta y hacer clic en el botón azul "🛠️ Agendar Servicio Técnico OT (#cuenta)" o ir a "UTILIDADES ▾" -> "Órdenes de Servicio Técnico". Por defecto está asignado a Andrés Alzamora (con opción a especificar otro técnico). Al guardar, se graba en Bitácora como SOLICITUD SERVICIO TECNICO y se notifica al abonado.'
    },
    {
      q: '¿Cómo verificar si el servidor de WhatsApp está funcionando correctamente?',
      a: 'En la barra superior observar el sello "🛡️ WHATSAPP LISTO & SELLADO (v4.1)" y el botón en el menú con sello. Si abres el modal de WhatsApp, en la pestaña "Servidor" debe mostrar el estado en verde "✅ CONECTADO" con canal único blindado sin duplicados.'
    },
    {
      q: '¿Qué significan las cuentas especiales que inician con C7XX?',
      a: 'Son abonados de alta prioridad vinculados a contratos y transmisiones IP de la región. Todos sus eventos están respaldados y sincronizados de forma íntegra sin omisiones.'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 font-sans select-none">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#111827] text-white border-2 border-[#374151] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera estilo Scorpion */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1f2937] border-b-2 border-[#374151] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-400 flex items-center justify-center text-lg">
              📖
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>CENTRO DE AYUDA Y MANUALES OPERATIVOS 24/7</span>
                <span className="text-[10px] bg-blue-600/40 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-mono">SCORPION v4.1</span>
              </h1>
              <p className="text-[11px] text-gray-400">Protocolos estándar de seguridad, números de emergencia en Chile y manual de operador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded bg-gray-700 hover:bg-red-600 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Barra de pestañas */}
        <div className="flex border-b border-[#374151] bg-[#1a2234] px-2 shrink-0 overflow-x-auto scrollbar-thin">
          {[
            { id: 'protocolos', label: '🚨 Protocolos de Emergencia', desc: 'Qué hacer ante alarmas' },
            { id: 'telefonos',   label: '📞 Directorio Chile & Interno', desc: 'Carabineros, Bomberos y Soporte' },
            { id: 'faq',         label: '❓ Preguntas Frecuentes', desc: 'Respuestas rápidas para operadores' },
            { id: 'manual',      label: '📘 Manual de la Consola', desc: 'Guía de uso de módulos' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                tabActiva === tab.id
                  ? 'border-blue-500 text-blue-400 bg-gray-800/80 shadow-xs'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Barra de búsqueda interna */}
        <div className="p-3 bg-[#111827] border-b border-gray-800 flex items-center gap-2 shrink-0">
          <span className="text-gray-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Buscar por palabra clave (ej. pánico, carabineros, bitácora, servicio técnico)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 bg-black/60 border border-gray-700 rounded px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5 bg-gray-800 rounded cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Contenedor con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: PROTOCOLOS */}
          {tabActiva === 'protocolos' && (
            <div className="space-y-4">
              <div className="bg-blue-950/40 border border-blue-700/40 rounded-lg p-3 text-xs text-blue-200">
                💡 <strong>Protocolo Estándar Gama Seguridad:</strong> Toda llamada realizada a un cliente debe verificar obligatoriamente la <u>Palabra Clave</u> registrada en su Expediente antes de desactivar cualquier procedimiento.
              </div>

              {protocolos
                .filter(p => !busqueda.trim() || p.tipo.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo.toLowerCase().includes(busqueda.toLowerCase()) || p.pasos.some(step => step.toLowerCase().includes(busqueda.toLowerCase())))
                .map((prot, idx) => (
                  <div key={idx} className={`border rounded-lg p-4 ${prot.color} transition-all`}>
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{prot.icono}</span>
                        <div>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/50 border border-white/20 mr-2">
                            {prot.codigo}
                          </span>
                          <span className="font-bold text-sm tracking-wide text-white">{prot.tipo}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/20">
                        {prot.prioridad}
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      {prot.pasos.map((paso, pIdx) => (
                        <div key={pIdx} className="text-xs text-gray-200 leading-relaxed pl-2 border-l-2 border-white/30">
                          {paso}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 2: DIRECTORIO TELEFÓNICO CHILE */}
          {tabActiva === 'telefonos' && (
            <div className="space-y-3">
              <div className="text-xs text-gray-300 mb-2">
                Haz clic en el número para copiarlo rápidamente al portapapeles o marcar.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {telefonosEmergencia
                  .filter(t => !busqueda.trim() || t.institucion.toLowerCase().includes(busqueda.toLowerCase()) || t.numero.includes(busqueda) || t.desc.toLowerCase().includes(busqueda.toLowerCase()))
                  .map((tel, idx) => (
                    <div key={idx} className="bg-gray-800/80 border border-gray-700 rounded-lg p-3.5 flex flex-col justify-between hover:border-blue-500 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                            {tel.tipo}
                          </span>
                          {copiado === tel.numero && (
                            <span className="text-[10px] text-green-400 font-bold animate-pulse">✓ ¡Copiado!</span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-white">{tel.institucion}</h3>
                        <p className="text-xs text-gray-400 mt-1">{tel.desc}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-700/60 flex items-center justify-between">
                        <span className="font-mono text-base font-black text-emerald-400 tracking-wider">
                          {tel.numero}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => copiarTexto(tel.numero, tel.numero)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2.5 py-1 rounded cursor-pointer transition-colors"
                          >
                            Copiar
                          </button>
                          <a
                            href={`tel:${tel.numero.replace(/[^0-9+]/g, '')}`}
                            className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-1 rounded cursor-pointer transition-colors"
                          >
                            Llamar
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: PREGUNTAS FRECUENTES (FAQ) */}
          {tabActiva === 'faq' && (
            <div className="space-y-3">
              {faqItems
                .filter(f => !busqueda.trim() || f.q.toLowerCase().includes(busqueda.toLowerCase()) || f.a.toLowerCase().includes(busqueda.toLowerCase()))
                .map((faq, idx) => (
                  <div key={idx} className="bg-gray-800/80 border border-gray-700 rounded-lg p-3.5">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
                      <span className="text-blue-400">❓</span>
                      <span>{faq.q}</span>
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed bg-black/40 p-2.5 rounded border border-gray-700/50">
                      {faq.a}
                    </p>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 4: MANUAL DE OPERADOR */}
          {tabActiva === 'manual' && (
            <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
              <div className="bg-gray-800/90 border border-gray-700 rounded-lg p-4">
                <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                  <span>🎨</span>
                  <span>1. Código de Colores de Señales en Vivo</span>
                </h2>
                <ul className="space-y-2 mt-2">
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-red-600 shrink-0"></span>
                    <span><strong>Rojo Intenso:</strong> Alarmas de Robo, Pánico o Incendio (Prioridad 1 inmediata).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-amber-500 shrink-0"></span>
                    <span><strong>Amarillo / Ámbar:</strong> Problemas técnicos, Corte de Energía AC o Batería Baja.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500 shrink-0"></span>
                    <span><strong>Verde:</strong> Armados y Desarmados (Aperturas y Cierres normales).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-cyan-400 shrink-0"></span>
                    <span><strong>Celeste / Azul:</strong> Auto-Test y señales de supervisión periódica de transmisor.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800/90 border border-gray-700 rounded-lg p-4">
                <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                  <span>🛠️</span>
                  <span>2. Protocolo de Servicio Técnico con Andrés Alzamora</span>
                </h2>
                <p>
                  Cuando un cliente reporte una avería en un detector, batería agotada o falla de sirena, presionar el botón 
                  <strong> "🛠️ Agendar Servicio Técnico OT"</strong> en el panel derecho. El técnico por defecto es 
                  <strong> Andrés Alzamora</strong> (Técnico Oficial). Al guardar, automáticamente:
                </p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Se genera la Orden Técnica en el sistema central.</li>
                  <li>Se registra en la Bitácora oficial bajo la categoría <code>SOLICITUD SERVICIO TECNICO</code>.</li>
                  <li>Se despacha el mensaje al WhatsApp del abonado confirmando la gestión.</li>
                </ol>
              </div>

              <div className="bg-gray-800/90 border border-gray-700 rounded-lg p-4">
                <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                  <span>📱</span>
                  <span>3. Mensajería WhatsApp 24/7 Libre de Duplicados</span>
                </h2>
                <p>
                  El motor de mensajería opera con Baileys v4.1 y cuenta con deduplicador atómico. Si necesitas enviar un mensaje manual, presionar el botón WhatsApp en el panel inferior, seleccionar la plantilla correspondiente (Intrusión, Corte AC, Cierre, etc.) o escribir el texto deseado. Todos los envíos quedan archivados en el historial de conversaciones.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Pie de modal */}
        <div className="px-4 py-2.5 bg-[#1f2937] border-t border-[#374151] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-400">Gama Seguridad 24/7 · Central de Monitoreo Santiago de Chile</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs cursor-pointer transition-colors shadow"
          >
            Entendido / Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}

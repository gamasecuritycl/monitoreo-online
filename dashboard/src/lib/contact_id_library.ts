// ════════════════════════════════════════════════════════════════
//  LIBRERÍA CONTACT ID / SIA - GAMA COMMAND CENTER
//  Protocolo ADEMCO Contact ID (CID) - Estándar de Alarmas
//  Formato: E/R + XXX  (E=Evento, R=Restauración, XXX=código)
// ════════════════════════════════════════════════════════════════

export interface CidInfo {
  descripcion: string
  categoria: string
  color: string // Igual que CODIGOS.MDB: ROJO, AMARILLO, VERDE, BLANCO, GRIS, VIOLETA
}

// Mapa completo Contact ID → descripción en español + color
const CONTACT_ID_MAP: Record<string, CidInfo> = {
  // ── 100-109: EMERGENCIA MÉDICA ──────────────────────────────────
  '100': { descripcion: 'ALARMA MÉDICA', categoria: 'MEDICA', color: 'ROJO' },
  '101': { descripcion: 'EMERGENCIA PERSONAL', categoria: 'MEDICA', color: 'ROJO' },
  '102': { descripcion: 'FALLA AL REPORTAR', categoria: 'MEDICA', color: 'ROJO' },

  // ── 110-119: FUEGO / INCENDIO ───────────────────────────────────
  '110': { descripcion: 'ALARMA DE FUEGO', categoria: 'FUEGO', color: 'ROJO' },
  '111': { descripcion: 'DETECTOR DE HUMO', categoria: 'FUEGO', color: 'ROJO' },
  '112': { descripcion: 'DETECTOR DE COMBUSTION', categoria: 'FUEGO', color: 'ROJO' },
  '113': { descripcion: 'FLUJO DE AGUA (SPRINKLER)', categoria: 'FUEGO', color: 'ROJO' },
  '114': { descripcion: 'DETECTOR DE CALOR', categoria: 'FUEGO', color: 'ROJO' },
  '115': { descripcion: 'PULSADOR MANUAL DE FUEGO', categoria: 'FUEGO', color: 'ROJO' },
  '116': { descripcion: 'DETECTOR DE DUCTO', categoria: 'FUEGO', color: 'ROJO' },
  '117': { descripcion: 'DETECTOR DE LLAMA', categoria: 'FUEGO', color: 'ROJO' },
  '118': { descripcion: 'PREALARMA DE FUEGO', categoria: 'FUEGO', color: 'ROJO' },
  '119': { descripcion: 'VERIFICADOR DE FUEGO', categoria: 'FUEGO', color: 'ROJO' },

  // ── 120-129: PÁNICO ─────────────────────────────────────────────
  '120': { descripcion: 'ALARMA DE PANICO', categoria: 'PANICO', color: 'ROJO' },
  '121': { descripcion: 'PANICO BAJO COACCION', categoria: 'PANICO', color: 'ROJO' },
  '122': { descripcion: 'PANICO SILENCIOSO', categoria: 'PANICO', color: 'ROJO' },
  '123': { descripcion: 'PANICO AUDIBLE', categoria: 'PANICO', color: 'ROJO' },
  '124': { descripcion: 'PANICO - ACCESO FORZADO', categoria: 'PANICO', color: 'ROJO' },
  '125': { descripcion: 'PANICO - SALIDA FORZADA', categoria: 'PANICO', color: 'ROJO' },

  // ── 130-139: ROBO / INTRUSIÓN ───────────────────────────────────
  '130': { descripcion: 'ALARMA DE ROBO', categoria: 'ROBO', color: 'ROJO' },
  '131': { descripcion: 'ALARMA PERIMETRAL', categoria: 'ROBO', color: 'ROJO' },
  '132': { descripcion: 'ALARMA INTERIOR', categoria: 'ROBO', color: 'ROJO' },
  '133': { descripcion: 'ALARMA 24 HORAS', categoria: 'ROBO', color: 'ROJO' },
  '134': { descripcion: 'ALARMA ENTRADA/SALIDA', categoria: 'ROBO', color: 'ROJO' },
  '135': { descripcion: 'ALARMA DIA/NOCHE', categoria: 'ROBO', color: 'ROJO' },
  '136': { descripcion: 'ALARMA EXTERIOR', categoria: 'ROBO', color: 'ROJO' },
  '137': { descripcion: 'TAMPER / SABOTAJE', categoria: 'SABOTAJE', color: 'ROJO' },
  '138': { descripcion: 'PRE-ALARMA DE ROBO', categoria: 'ROBO', color: 'ROJO' },
  '139': { descripcion: 'VERIFICADOR DE INTRUSION', categoria: 'ROBO', color: 'ROJO' },

  // ── 140-162: ALARMA GENERAL ─────────────────────────────────────
  '140': { descripcion: 'ALARMA GENERAL', categoria: 'ALARMA', color: 'ROJO' },
  '141': { descripcion: 'LAZO DE SONDEO ABIERTO', categoria: 'FALLA', color: 'AMARILLO' },
  '142': { descripcion: 'CORTO EN LAZO DE SONDEO', categoria: 'FALLA', color: 'AMARILLO' },
  '143': { descripcion: 'FALLA MODULO EXPANSION', categoria: 'FALLA', color: 'AMARILLO' },
  '144': { descripcion: 'TAMPER EN SENSOR', categoria: 'SABOTAJE', color: 'ROJO' },
  '145': { descripcion: 'TAMPER MODULO EXPANSION', categoria: 'SABOTAJE', color: 'ROJO' },
  '146': { descripcion: 'ROBO SILENCIOSO', categoria: 'ROBO', color: 'ROJO' },
  '147': { descripcion: 'FALLA SUPERVISION SENSOR', categoria: 'FALLA', color: 'AMARILLO' },
  '150': { descripcion: 'ALARMA 24H NO-ROBO', categoria: 'ALARMA', color: 'ROJO' },
  '151': { descripcion: 'GAS DETECTADO', categoria: 'GAS', color: 'ROJO' },
  '152': { descripcion: 'FALLA REFRIGERACION', categoria: 'FALLA', color: 'AMARILLO' },
  '153': { descripcion: 'PERDIDA DE CALOR', categoria: 'FALLA', color: 'AMARILLO' },
  '154': { descripcion: 'FUGA DE AGUA', categoria: 'AGUA', color: 'ROJO' },
  '155': { descripcion: 'RUPTURA DE LAMINA', categoria: 'ROBO', color: 'ROJO' },
  '156': { descripcion: 'ALARMA DE DIA', categoria: 'ALARMA', color: 'ROJO' },
  '157': { descripcion: 'NIVEL BAJO GAS ENVASADO', categoria: 'FALLA', color: 'AMARILLO' },
  '158': { descripcion: 'TEMPERATURA ALTA', categoria: 'TEMPERATURA', color: 'ROJO' },
  '159': { descripcion: 'TEMPERATURA BAJA', categoria: 'TEMPERATURA', color: 'AMARILLO' },
  '160': { descripcion: 'PERDIDA DE FLUJO DE AIRE', categoria: 'FALLA', color: 'AMARILLO' },
  '161': { descripcion: 'MONOXIDO DE CARBONO (CO)', categoria: 'GAS', color: 'ROJO' },
  '162': { descripcion: 'NIVEL DE ESTANQUE', categoria: 'AGUA', color: 'AMARILLO' },

  // ── 200-206: SUPERVISIÓN ────────────────────────────────────────
  '200': { descripcion: 'SUPERVISION DE FUEGO', categoria: 'SUPERVISION', color: 'AMARILLO' },
  '201': { descripcion: 'PRESION DE AGUA BAJA', categoria: 'SUPERVISION', color: 'AMARILLO' },
  '202': { descripcion: 'NIVEL BAJO CO2', categoria: 'SUPERVISION', color: 'AMARILLO' },
  '203': { descripcion: 'SENSOR VALVULA COMPUERTA', categoria: 'SUPERVISION', color: 'AMARILLO' },
  '204': { descripcion: 'NIVEL DE AGUA BAJO', categoria: 'SUPERVISION', color: 'AMARILLO' },
  '205': { descripcion: 'BOMBA ACTIVADA', categoria: 'SUPERVISION', color: 'AMARILLO' },
  '206': { descripcion: 'FALLA DE BOMBA', categoria: 'SUPERVISION', color: 'AMARILLO' },

  // ── 300-399: PROBLEMAS DE SISTEMA ───────────────────────────────
  '300': { descripcion: 'FALLA DEL SISTEMA', categoria: 'FALLA', color: 'AMARILLO' },
  '301': { descripcion: 'FALLA DE CORRIENTE ALTERNA (AC)', categoria: 'FALLA AC', color: 'VERDE' },
  '302': { descripcion: 'BATERIA BAJA DEL SISTEMA', categoria: 'BATERIA', color: 'AMARILLO' },
  '303': { descripcion: 'ERROR CHECKSUM RAM', categoria: 'FALLA', color: 'AMARILLO' },
  '304': { descripcion: 'ERROR CHECKSUM ROM', categoria: 'FALLA', color: 'AMARILLO' },
  '305': { descripcion: 'RESET DEL SISTEMA', categoria: 'SISTEMA', color: 'GRIS' },
  '306': { descripcion: 'PROGRAMACION DEL PANEL CAMBIADA', categoria: 'SISTEMA', color: 'GRIS' },
  '307': { descripcion: 'FALLA AUTOTEST', categoria: 'FALLA', color: 'AMARILLO' },
  '308': { descripcion: 'APAGADO DEL SISTEMA', categoria: 'SISTEMA', color: 'AMARILLO' },
  '309': { descripcion: 'FALLA TEST DE BATERIA', categoria: 'BATERIA', color: 'AMARILLO' },
  '310': { descripcion: 'FALLA A TIERRA', categoria: 'FALLA', color: 'AMARILLO' },
  '311': { descripcion: 'BATERIA AUSENTE O AGOTADA', categoria: 'BATERIA', color: 'AMARILLO' },
  '312': { descripcion: 'SOBRECORRIENTE FUENTE DE PODER', categoria: 'FALLA', color: 'AMARILLO' },
  '313': { descripcion: 'RESET POR TECNICO', categoria: 'SISTEMA', color: 'GRIS' },
  '314': { descripcion: 'FALLA FUENTE PODER PRINCIPAL', categoria: 'FALLA', color: 'AMARILLO' },
  '315': { descripcion: 'TAMPER DEL SISTEMA', categoria: 'SABOTAJE', color: 'ROJO' },
  '316': { descripcion: 'FALLA DC MODULO EXPANSION', categoria: 'FALLA', color: 'AMARILLO' },
  '317': { descripcion: 'BATERIA BAJA MODULO EXPANSION', categoria: 'BATERIA', color: 'AMARILLO' },
  '318': { descripcion: 'RESET MODULO EXPANSION', categoria: 'SISTEMA', color: 'GRIS' },
  '319': { descripcion: 'TAMPER MODULO EXPANSION', categoria: 'SABOTAJE', color: 'ROJO' },
  '320': { descripcion: 'FALLA AC MODULO EXPANSION', categoria: 'FALLA', color: 'AMARILLO' },
  '321': { descripcion: 'AUTOTEST MODULO EXPANSION FALLO', categoria: 'FALLA', color: 'AMARILLO' },
  '322': { descripcion: 'INTERFERENCIA EN RECEPTOR RF', categoria: 'FALLA', color: 'AMARILLO' },
  '333': { descripcion: 'FALLA MODULO EXPANSION', categoria: 'FALLA', color: 'AMARILLO' },
  '344': { descripcion: 'INTERFERENCIA RF (JAMMING)', categoria: 'SABOTAJE', color: 'ROJO' },
  '351': { descripcion: 'FALLA LINEA TELEFONICA 1', categoria: 'COMUNICACION', color: 'AMARILLO' },
  '352': { descripcion: 'FALLA LINEA TELEFONICA 2', categoria: 'COMUNICACION', color: 'AMARILLO' },
  '353': { descripcion: 'FALLA TRANSMISOR RADIO', categoria: 'COMUNICACION', color: 'AMARILLO' },
  '354': { descripcion: 'FALLA EN COMUNICACION', categoria: 'COMUNICACION', color: 'AMARILLO' },
  '355': { descripcion: 'PERDIDA SUPERVISION DE RADIO', categoria: 'COMUNICACION', color: 'AMARILLO' },
  '356': { descripcion: 'PERDIDA DE SONDEO CENTRAL', categoria: 'COMUNICACION', color: 'AMARILLO' },
  '370': { descripcion: 'LAZO DE PROTECCION ABIERTO', categoria: 'FALLA', color: 'AMARILLO' },
  '371': { descripcion: 'CORTO EN LAZO DE PROTECCION', categoria: 'FALLA', color: 'AMARILLO' },
  '372': { descripcion: 'FALLA EN ZONA DE FUEGO', categoria: 'FUEGO', color: 'AMARILLO' },
  '373': { descripcion: 'ERROR DE SALIDA (AMA)', categoria: 'FALLA', color: 'AMARILLO' },
  '374': { descripcion: 'FALLA ZONA DE PANICO', categoria: 'PANICO', color: 'AMARILLO' },
  '380': { descripcion: 'FALLA DE SENSOR', categoria: 'FALLA', color: 'AMARILLO' },
  '381': { descripcion: 'PERDIDA SUPERVISION RF SENSOR', categoria: 'FALLA', color: 'AMARILLO' },
  '382': { descripcion: 'PERDIDA SUPERVISION RPM', categoria: 'FALLA', color: 'AMARILLO' },
  '383': { descripcion: 'TAMPER EN SENSOR', categoria: 'SABOTAJE', color: 'ROJO' },
  '384': { descripcion: 'BATERIA BAJA EN SENSOR RF', categoria: 'BATERIA', color: 'AMARILLO' },
  '385': { descripcion: 'DETECTOR HUMO ALTA SENSIBILIDAD', categoria: 'FUEGO', color: 'AMARILLO' },
  '386': { descripcion: 'DETECTOR HUMO BAJA SENSIBILIDAD', categoria: 'FUEGO', color: 'AMARILLO' },
  '387': { descripcion: 'DETECTOR ALTA SENSIBILIDAD', categoria: 'FALLA', color: 'AMARILLO' },
  '388': { descripcion: 'DETECTOR BAJA SENSIBILIDAD', categoria: 'FALLA', color: 'AMARILLO' },
  '389': { descripcion: 'FALLA AUTOTEST SENSOR', categoria: 'FALLA', color: 'AMARILLO' },
  '390': { descripcion: 'FALLA SUPERVISION SENSOR', categoria: 'FALLA', color: 'AMARILLO' },
  '395': { descripcion: 'RELE DE HOLDUP', categoria: 'FALLA', color: 'AMARILLO' },
  '396': { descripcion: 'CANCELACION DE ALARMA', categoria: 'SISTEMA', color: 'GRIS' },
  '397': { descripcion: 'RESET DETECTOR DE HUMO', categoria: 'FUEGO', color: 'GRIS' },
  '398': { descripcion: 'FALLA SENSOR CO', categoria: 'FALLA', color: 'AMARILLO' },

  // ── 400-466: APERTURA / CIERRE ──────────────────────────────────
  '400': { descripcion: 'APERTURA / CIERRE', categoria: 'APERTURA', color: 'BLANCO' },
  '401': { descripcion: 'APERTURA/CIERRE POR USUARIO', categoria: 'APERTURA', color: 'BLANCO' },
  '402': { descripcion: 'APERTURA/CIERRE DE GRUPO', categoria: 'APERTURA', color: 'BLANCO' },
  '403': { descripcion: 'APERTURA/CIERRE AUTOMATICO', categoria: 'APERTURA', color: 'BLANCO' },
  '404': { descripcion: 'TARDE PARA APERTURA/CIERRE', categoria: 'APERTURA', color: 'AMARILLO' },
  '405': { descripcion: 'APERTURA/CIERRE DIFERIDO', categoria: 'APERTURA', color: 'BLANCO' },
  '406': { descripcion: 'CANCELACION', categoria: 'SISTEMA', color: 'GRIS' },
  '407': { descripcion: 'ARME/DESARME REMOTO', categoria: 'APERTURA', color: 'BLANCO' },
  '408': { descripcion: 'ARME RAPIDO', categoria: 'APERTURA', color: 'BLANCO' },
  '409': { descripcion: 'APERTURA/CIERRE LLAVE', categoria: 'APERTURA', color: 'BLANCO' },
  '411': { descripcion: 'SOLICITUD DE CALLBACK', categoria: 'SISTEMA', color: 'GRIS' },
  '412': { descripcion: 'DESCARGA EXITOSA', categoria: 'SISTEMA', color: 'GRIS' },
  '413': { descripcion: 'ACCESO NO AUTORIZADO', categoria: 'ACCESO', color: 'ROJO' },
  '414': { descripcion: 'COMANDO APAGADO RECIBIDO', categoria: 'SISTEMA', color: 'GRIS' },
  '421': { descripcion: 'ACCESO DENEGADO', categoria: 'ACCESO', color: 'ROJO' },
  '422': { descripcion: 'REPORTE ACCESO POR USUARIO', categoria: 'ACCESO', color: 'BLANCO' },
  '423': { descripcion: 'ACCESO FORZADO', categoria: 'ACCESO', color: 'ROJO' },
  '424': { descripcion: 'SALIDA DENEGADA', categoria: 'ACCESO', color: 'ROJO' },
  '425': { descripcion: 'SALIDA AUTORIZADA', categoria: 'ACCESO', color: 'BLANCO' },
  '426': { descripcion: 'PUERTA ABIERTA POR TIEMPO', categoria: 'ACCESO', color: 'AMARILLO' },
  '441': { descripcion: 'ARMADO EN MODO STAY', categoria: 'APERTURA', color: 'BLANCO' },
  '442': { descripcion: 'ARMADO STAY CON LLAVE', categoria: 'APERTURA', color: 'BLANCO' },
  '450': { descripcion: 'APERTURA/CIERRE ESPECIAL', categoria: 'APERTURA', color: 'BLANCO' },
  '451': { descripcion: 'APERTURA/CIERRE ANTICIPADO', categoria: 'APERTURA', color: 'BLANCO' },
  '452': { descripcion: 'APERTURA/CIERRE TARDIO', categoria: 'APERTURA', color: 'AMARILLO' },
  '453': { descripcion: 'FALLA AL ABRIR', categoria: 'APERTURA', color: 'AMARILLO' },
  '454': { descripcion: 'FALLA AL CERRAR', categoria: 'APERTURA', color: 'AMARILLO' },
  '455': { descripcion: 'FALLA ARME AUTOMATICO', categoria: 'APERTURA', color: 'AMARILLO' },
  '456': { descripcion: 'ARMADO PARCIAL', categoria: 'APERTURA', color: 'BLANCO' },
  '457': { descripcion: 'ERROR DE SALIDA POR USUARIO', categoria: 'APERTURA', color: 'AMARILLO' },
  '459': { descripcion: 'CIERRE RECIENTE', categoria: 'APERTURA', color: 'BLANCO' },
  '461': { descripcion: 'CODIGO ERRONEO INGRESADO', categoria: 'ACCESO', color: 'AMARILLO' },
  '462': { descripcion: 'CODIGO CORRECTO INGRESADO', categoria: 'ACCESO', color: 'BLANCO' },
  '463': { descripcion: 'RE-ARMADO DESPUES DE ALARMA', categoria: 'APERTURA', color: 'BLANCO' },
  '466': { descripcion: 'SERVICIO ACTIVADO/DESACTIVADO', categoria: 'SISTEMA', color: 'GRIS' },

  // ── 500-533: BYPASS / INHABILITACION ────────────────────────────
  '500': { descripcion: 'CONTROL DE ACCESO', categoria: 'ACCESO', color: 'BLANCO' },
  '511': { descripcion: 'PUNTO INHABILITADO (BYPASS)', categoria: 'BYPASS', color: 'VIOLETA' },
  '512': { descripcion: 'ZONA INALAMBRICA INHIBIDA', categoria: 'BYPASS', color: 'VIOLETA' },
  '520': { descripcion: 'FALLA AC SECUNDARIA / BYPASS', categoria: 'BYPASS', color: 'VIOLETA' },
  '521': { descripcion: 'SALTO DE PC EN CURSO', categoria: 'BYPASS', color: 'VIOLETA' },
  '522': { descripcion: 'ZONA INHABILITADA', categoria: 'BYPASS', color: 'VIOLETA' },
  '523': { descripcion: 'BYPASS DE FUEGO', categoria: 'BYPASS', color: 'VIOLETA' },
  '524': { descripcion: 'ZONA 24H INHABILITADA', categoria: 'BYPASS', color: 'VIOLETA' },
  '525': { descripcion: 'BYPASS DE ROBO', categoria: 'BYPASS', color: 'VIOLETA' },
  '526': { descripcion: 'BYPASS DE GRUPO', categoria: 'BYPASS', color: 'VIOLETA' },
  '527': { descripcion: 'BYPASS SWINGER', categoria: 'BYPASS', color: 'VIOLETA' },
  '528': { descripcion: 'SUPRESION ANTICIPADA', categoria: 'BYPASS', color: 'VIOLETA' },
  '529': { descripcion: 'CAMBIO NIVEL DE AMENAZA', categoria: 'BYPASS', color: 'VIOLETA' },
  '530': { descripcion: 'FALLA COBERTURA ELEM. INALAM.', categoria: 'TECNICA', color: 'LILA_PASTEL' },
  '531': { descripcion: 'ADVERTENCIA LIMITE BYPASS', categoria: 'BYPASS', color: 'VIOLETA' },
  '532': { descripcion: 'ADVERTENCIA LIMITE BYPASS GRUPO', categoria: 'BYPASS', color: 'VIOLETA' },
  '533': { descripcion: 'FALLA AC SECUNDARIA', categoria: 'BYPASS', color: 'VIOLETA' },

  // ── 540-575: PRUEBAS / REPORTES ─────────────────────────────────
  '540': { descripcion: 'REPORTE DE PRUEBA', categoria: 'AUTOTEST', color: 'GRIS' },
  '541': { descripcion: 'PRUEBA MANUAL', categoria: 'AUTOTEST', color: 'GRIS' },
  '542': { descripcion: 'PRUEBA PERIODICA', categoria: 'AUTOTEST', color: 'GRIS' },
  '543': { descripcion: 'TRANSMISION RF PERIODICA', categoria: 'AUTOTEST', color: 'GRIS' },
  '544': { descripcion: 'PRUEBA DE FUEGO', categoria: 'AUTOTEST', color: 'GRIS' },
  '545': { descripcion: 'REPORTE DE ESTADO', categoria: 'SISTEMA', color: 'GRIS' },
  '546': { descripcion: 'ESCUCHA ACTIVA', categoria: 'SISTEMA', color: 'GRIS' },
  '547': { descripcion: 'MODO TEST ZONA A ZONA', categoria: 'AUTOTEST', color: 'GRIS' },
  '548': { descripcion: 'PRUEBA CON FALLA PENDIENTE', categoria: 'AUTOTEST', color: 'AMARILLO' },
  '560': { descripcion: 'REGISTRO DE EVENTOS', categoria: 'SISTEMA', color: 'GRIS' },
  '570': { descripcion: 'CAMBIO DE HORARIO', categoria: 'SISTEMA', color: 'GRIS' },
  '573': { descripcion: 'SUPERVISION ADULTO MAYOR', categoria: 'MEDICA', color: 'ROJO' },
  '574': { descripcion: 'SUPERVISION LATCHKEY', categoria: 'SISTEMA', color: 'GRIS' },
  '575': { descripcion: 'PRUEBA HOLDUP', categoria: 'AUTOTEST', color: 'GRIS' },

  // ── 600-621: AUTOMATIONS / MISC ──────────────────────────────────
  '601': { descripcion: 'PRUEBA ACTIVACION MANUAL', categoria: 'AUTOTEST', color: 'GRIS' },
  '602': { descripcion: 'TRANSMISION PERIODICA', categoria: 'AUTOTEST', color: 'GRIS' },
  '603': { descripcion: 'TRANSMISION RF', categoria: 'AUTOTEST', color: 'GRIS' },
  '604': { descripcion: 'PRUEBA DE FUEGO', categoria: 'AUTOTEST', color: 'GRIS' },
  '605': { descripcion: 'REPORTE DE ESTADO DEL SISTEMA', categoria: 'SISTEMA', color: 'GRIS' },
  '606': { descripcion: 'ESCUCHA EN LINEA', categoria: 'SISTEMA', color: 'GRIS' },
  '607': { descripcion: 'WALK TEST', categoria: 'AUTOTEST', color: 'GRIS' },
  '609': { descripcion: 'TRANSMISION DE VIDEO', categoria: 'SISTEMA', color: 'GRIS' },
  '610': { descripcion: 'SOLICITUD EN LINEA', categoria: 'SISTEMA', color: 'GRIS' },
  '614': { descripcion: 'SOLICITUD DE SERVICIO', categoria: 'SISTEMA', color: 'GRIS' },
  '615': { descripcion: 'REGISTRO DE EVENTOS BORRADO', categoria: 'SISTEMA', color: 'GRIS' },
  '616': { descripcion: 'REGISTRO 90% LLENO', categoria: 'SISTEMA', color: 'AMARILLO' },
  '617': { descripcion: 'RESET FECHA/HORA', categoria: 'SISTEMA', color: 'GRIS' },
  '618': { descripcion: 'FECHA/HORA IMPRECISA', categoria: 'SISTEMA', color: 'AMARILLO' },
  '619': { descripcion: 'ENTRADA A MODO PROGRAMACION', categoria: 'SISTEMA', color: 'GRIS' },
  '620': { descripcion: 'SALIDA MODO PROGRAMACION', categoria: 'SISTEMA', color: 'GRIS' },
  '621': { descripcion: 'PRUEBA EXCEPTION', categoria: 'AUTOTEST', color: 'GRIS' },

  // ── SIA STANDARD CODES (DC-03 / DC-05) ───────────────────────────
  // Holdup / Asalto (Atraco / Coacción)
  'HA': { descripcion: 'ALARMA DE ASALTO', categoria: 'ASALTO', color: 'ROJO' },
  'HH': { descripcion: 'RESTABLECIMIENTO ASALTO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'HR': { descripcion: 'RESTABLECIMIENTO ASALTO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'HJ': { descripcion: 'FALLA ZONA DE ASALTO', categoria: 'FALLA', color: 'AMARILLO' },
  'HK': { descripcion: 'RESTABLEC. FALLA ASALTO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'HT': { descripcion: 'ASALTO SILENCIOSO', categoria: 'ASALTO', color: 'ROJO' },
  'HP': { descripcion: 'ALARMA DE ASALTO VERIFICADA', categoria: 'ASALTO', color: 'ROJO' },

  // Médico / Auxilio
  'MA': { descripcion: 'EMERGENCIA MEDICA', categoria: 'MEDICA', color: 'ROJO' },
  'MH': { descripcion: 'RESTABLECIMIENTO MEDICO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'MR': { descripcion: 'RESTABLECIMIENTO MEDICO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'MJ': { descripcion: 'FALLA ZONA MEDICA', categoria: 'FALLA', color: 'AMARILLO' },
  'MK': { descripcion: 'RESTABLEC. FALLA MEDICA', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'MB': { descripcion: 'ANULACION ZONA MEDICA', categoria: 'BYPASS', color: 'VIOLETA' },
  'QA': { descripcion: 'EMERGENCIA AUXILIO', categoria: 'MEDICA', color: 'ROJO' },
  'QH': { descripcion: 'RESTABLECIMIENTO AUXILIO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'QR': { descripcion: 'RESTABLECIMIENTO AUXILIO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },

  // Robo / Intrusión
  'BA': { descripcion: 'ALARMA DE ROBO', categoria: 'ROBO', color: 'ROJO' },
  'BH': { descripcion: 'RESTABLECIMIENTO ROBO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'BR': { descripcion: 'RESTABLECIMIENTO ROBO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'BC': { descripcion: 'CANCELACION DE ALARMA', categoria: 'SISTEMA', color: 'GRIS' },
  'BV': { descripcion: 'ROBO VERIFICADO', categoria: 'ROBO', color: 'ROJO' },
  'BB': { descripcion: 'ANULACION DE ZONA (BYPASS)', categoria: 'BYPASS', color: 'VIOLETA' },
  'BU': { descripcion: 'DESANULACION DE ZONA', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'BJ': { descripcion: 'FALLA ZONA DE ROBO', categoria: 'FALLA', color: 'AMARILLO' },
  'BK': { descripcion: 'RESTABLEC. FALLA ROBO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'BM': { descripcion: 'SUPERVISION ROBO', categoria: 'SUPERVISION', color: 'AMARILLO' },
  'BT': { descripcion: 'ALARMA ROBO RETARDADA', categoria: 'ROBO', color: 'ROJO' },
  'BZ': { descripcion: 'ALARMA ROBO PERIMETRAL', categoria: 'ROBO', color: 'ROJO' },

  // Pánico
  'PA': { descripcion: 'ALARMA DE PANICO', categoria: 'PANICO', color: 'ROJO' },
  'PH': { descripcion: 'RESTABLECIMIENTO PANICO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'PR': { descripcion: 'RESTABLECIMIENTO PANICO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'PJ': { descripcion: 'FALLA ZONA DE PANICO', categoria: 'FALLA', color: 'AMARILLO' },
  'PK': { descripcion: 'RESTABLEC. FALLA PANICO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'PB': { descripcion: 'BYPASS ZONA PANICO', categoria: 'BYPASS', color: 'VIOLETA' },

  // Fuego / Humo
  'FA': { descripcion: 'ALARMA DE FUEGO', categoria: 'FUEGO', color: 'ROJO' },
  'FH': { descripcion: 'RESTABLECIMIENTO FUEGO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'FR': { descripcion: 'RESTABLECIMIENTO FUEGO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'FS': { descripcion: 'FLUJO DE AGUA (SPRINKLER)', categoria: 'FUEGO', color: 'ROJO' },
  'FJ': { descripcion: 'FALLA ZONA DE FUEGO', categoria: 'FALLA', color: 'AMARILLO' },
  'FK': { descripcion: 'RESTABLEC. FALLA FUEGO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'FB': { descripcion: 'BYPASS DE FUEGO', categoria: 'BYPASS', color: 'VIOLETA' },
  'FU': { descripcion: 'DESANULACION BYPASS FUEGO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'KA': { descripcion: 'ALARMA SENSOR DE CALOR', categoria: 'FUEGO', color: 'ROJO' },
  'KH': { descripcion: 'RESTABLECIMIENTO CALOR', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'SA': { descripcion: 'ALARMA SENSOR DE HUMO', categoria: 'FUEGO', color: 'ROJO' },
  'SH': { descripcion: 'RESTABLECIMIENTO HUMO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },

  // Tamper / Sabotaje
  'TA': { descripcion: 'TAMPER / SABOTAJE', categoria: 'SABOTAJE', color: 'ROJO' },
  'TH': { descripcion: 'RESTABLECIMIENTO TAMPER', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'TR': { descripcion: 'RESTABLECIMIENTO TAMPER', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'TB': { descripcion: 'BYPASS DE TAMPER', categoria: 'BYPASS', color: 'VIOLETA' },
  'TU': { descripcion: 'DESANULACION TAMPER', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'TJ': { descripcion: 'FALLA ZONA TAMPER', categoria: 'FALLA', color: 'AMARILLO' },
  'TK': { descripcion: 'RESTABLEC. FALLA TAMPER', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },

  // Gas / Agua / Condiciones Técnicas
  'GA': { descripcion: 'ALARMA DE GAS', categoria: 'GAS', color: 'ROJO' },
  'GH': { descripcion: 'RESTABLECIMIENTO GAS', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'GR': { descripcion: 'RESTABLECIMIENTO GAS', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'WA': { descripcion: 'ALARMA DE INUNDACION', categoria: 'AGUA', color: 'ROJO' },
  'WH': { descripcion: 'RESTABLECIMIENTO AGUA', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'WR': { descripcion: 'RESTABLECIMIENTO AGUA', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'ZA': { descripcion: 'ALARMA CONGELAMIENTO', categoria: 'TEMPERATURA', color: 'AMARILLO' },
  'ZH': { descripcion: 'RESTABLEC. CONGELAMIENTO', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },

  // Falla Eléctrica / Batería
  'AT': { descripcion: 'FALLA DE CORRIENTE ALTERNA (AC)', categoria: 'FALLA AC', color: 'VERDE' },
  'AR': { descripcion: 'RESTABLEC. CORRIENTE AC', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'AH': { descripcion: 'RESTABLEC. CORRIENTE AC', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'YT': { descripcion: 'BATERIA BAJA DEL SISTEMA', categoria: 'BATERIA', color: 'AMARILLO' },
  'YR': { descripcion: 'RESTABLECIMIENTO BATERIA', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'YH': { descripcion: 'RESTABLECIMIENTO BATERIA', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'LB': { descripcion: 'BATERIA BAJA', categoria: 'BATERIA', color: 'AMARILLO' },
  'LR': { descripcion: 'RESTABLECIMIENTO BATERIA', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'XT': { descripcion: 'BATERIA TRANSMISOR BAJA', categoria: 'BATERIA', color: 'AMARILLO' },
  'XR': { descripcion: 'RESTABLEC. BATERIA TRANSMISOR', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'YP': { descripcion: 'FALLA FUENTE DE PODER', categoria: 'FALLA', color: 'AMARILLO' },
  'YQ': { descripcion: 'RESTABLEC. FUENTE DE PODER', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },

  // Cierres / Aperturas (Armado / Desarmado)
  'CL': { descripcion: 'CIERRE', categoria: 'APERTURA', color: 'BLANCO' },
  'CP': { descripcion: 'CIERRE PROGRAMADO', categoria: 'APERTURA', color: 'BLANCO' },
  'CA': { descripcion: 'CIERRE AUTOMATICO', categoria: 'APERTURA', color: 'BLANCO' },
  'CG': { descripcion: 'CIERRE DE GRUPO', categoria: 'APERTURA', color: 'BLANCO' },
  'CR': { descripcion: 'CIERRE RECIENTE', categoria: 'APERTURA', color: 'BLANCO' },
  'CF': { descripcion: 'CIERRE FORZADO', categoria: 'APERTURA', color: 'BLANCO' },
  'CD': { descripcion: 'FALLA AL CERRAR', categoria: 'FALLA', color: 'AMARILLO' },
  'NF': { descripcion: 'ARMADO FORZADO', categoria: 'APERTURA', color: 'BLANCO' },
  'NL': { descripcion: 'NO CIERRA EN HORARIO', categoria: 'FALLA', color: 'AMARILLO' },

  'OP': { descripcion: 'APERTURA', categoria: 'APERTURA', color: 'CELESTE' },
  'OA': { descripcion: 'APERTURA AUTOMATICA', categoria: 'APERTURA', color: 'CELESTE' },
  'OG': { descripcion: 'APERTURA DE GRUPO', categoria: 'APERTURA', color: 'CELESTE' },
  'OR': { descripcion: 'DESARME TRAS ALARMA', categoria: 'APERTURA', color: 'CELESTE' },
  'OQ': { descripcion: 'APERTURA FUERA DE HORARIO', categoria: 'APERTURA', color: 'CELESTE' },
  'OD': { descripcion: 'NO ABRE EN HORARIO', categoria: 'FALLA', color: 'AMARILLO' },
  'OT': { descripcion: 'NO ABRE EN HORARIO', categoria: 'FALLA', color: 'AMARILLO' },

  // Control de Acceso
  'DG': { descripcion: 'ACCESO CONCEDIDO', categoria: 'ACCESO', color: 'BLANCO' },
  'DD': { descripcion: 'ACCESO DENEGADO', categoria: 'ACCESO', color: 'AMARILLO' },
  'DK': { descripcion: 'ACCESO BLOQUEADO', categoria: 'ACCESO', color: 'AMARILLO' },

  // Comunicaciones / Transmisiones
  'YX': { descripcion: 'FALLA DE COMUNICACION', categoria: 'COMUNICACION', color: 'AMARILLO' },
  'YK': { descripcion: 'RESTABLECIMIENTO COMUNICACION', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'YC': { descripcion: 'FALLA COMUNICADOR', categoria: 'COMUNICACION', color: 'AMARILLO' },
  'YS': { descripcion: 'RESTABLECIMIENTO LINEA COM.', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'LT': { descripcion: 'FALLA LINEA TELEFONICA', categoria: 'COMUNICACION', color: 'AMARILLO' },
  'XQ': { descripcion: 'INTERFERENCIA RF (JAMMING)', categoria: 'SABOTAJE', color: 'ROJO' },
  'XH': { descripcion: 'RESTABLECIMIENTO INTERF. RF', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },

  // Pruebas y Reportes Periódicos
  'RP': { descripcion: 'TRANSMISION PERIODICA', categoria: 'AUTOTEST', color: 'GRIS' },
  'TX': { descripcion: 'REPORTE DE TEST', categoria: 'AUTOTEST', color: 'GRIS' },
  'RX': { descripcion: 'PRUEBA PERIODICA SISTEMA', categoria: 'AUTOTEST', color: 'GRIS' },
  'RY': { descripcion: 'PRUEBA CON CONDICION ANORMAL', categoria: 'AUTOTEST', color: 'AMARILLO' },
  'TS': { descripcion: 'TEST DEL SISTEMA', categoria: 'AUTOTEST', color: 'GRIS' },
  'TE': { descripcion: 'FIN DE MODO TEST', categoria: 'AUTOTEST', color: 'GRIS' },
  'TW': { descripcion: 'WALK TEST', categoria: 'AUTOTEST', color: 'GRIS' },

  // Módulos de Expansión
  'ET': { descripcion: 'FALLA MODULO EXPANSION', categoria: 'FALLA', color: 'AMARILLO' },
  'ER': { descripcion: 'RESTABLECIMIENTO MODULO EXP.', categoria: 'RESTABLECIMIENTO', color: 'AMARILLO' },
  'EM': { descripcion: 'FALLA MEMORIA DE SISTEMA', categoria: 'FALLA', color: 'AMARILLO' },
}

/**
 * Parsea un código de evento Contact ID / SIA y retorna su descripción y color.
 * Formatos soportados:
 *   - "E122"  → Contact ID Pánico Silencioso / Asalto
 *   - "HA"    → SIA Holdup / Asalto
 *   - "HA01"  → SIA Holdup con zona 01
 *   - "BH"    → SIA Burglary Restoral / Restablecimiento de Robo
 *   - "MA"    → SIA Medical Alarm / Emergencia Médica
 *   - "MH"    → SIA Medical Restoral / Restablecimiento Médico
 *   - "CL"    → SIA Closing / Cierre
 *   - "OP"    → SIA Opening / Apertura
 *   - "RP"    → SIA Periodic Report / Autotest
 * 
 * @param eventoStr El string del evento crudo (ej: "HA", "BH", "MA", "MH", "E530", "R301")
 * @returns La info del código si se encuentra, o null si no se reconoce
 */
export function lookupContactId(eventoStr: string): CidInfo | null {
  if (!eventoStr) return null
  
  // Limpiar caracteres envolventes comunes (/HA, *HA*, [HA], " HA ")
  const clean = eventoStr.toUpperCase().trim().replace(/^[/\\*\[\]]+/, '').replace(/[/\\*\[\]]+$/, '').trim()
  if (!clean) return null
  
  // 1. Formato Contact ID: E/R seguido de 3 o 4 dígitos
  const matchCID = clean.match(/^([ER])(\d{3})(\d?)$/)
  if (matchCID) {
    const tipo = matchCID[1]   // E o R
    const codigo = matchCID[2] // 3 dígitos
    const info = CONTACT_ID_MAP[codigo]
    if (info) {
      if (tipo === 'R') {
        // Restauración → siempre amarillo con prefijo RESTABLEC.
        return {
          descripcion: `RESTABLEC. ${info.descripcion}`,
          categoria: 'RESTABLECIMIENTO',
          color: 'AMARILLO'
        }
      }
      return info
    }
    // Código CID no encontrado: informar con categoría genérica
    return {
      descripcion: `SEÑAL CID ${codigo} (${tipo === 'E' ? 'EVENTO' : 'RESTAB.'})`,
      categoria: 'DESCONOCIDO',
      color: 'COMPROBAR'
    }
  }
  
  // 2. Formato SIA de 2 letras (HA, BH, MA, MH, BA, FA, PA, CL, OP, etc.)
  // Permite 2 letras solas ("HA", "BH") o con zona/usuario adjunto ("HA01", "HA 01", "HA/01", "HA-01")
  const matchSIA = clean.match(/^([A-Z]{2})(?:[\s/_-]?(\d+))?$/)
  if (matchSIA) {
    const codeSia = matchSIA[1]
    const info = CONTACT_ID_MAP[codeSia]
    if (info) return info
  }

  // 3. Solo número de 3 dígitos (sin prefijo E/R)
  const matchNumero = clean.match(/^(\d{3})$/)
  if (matchNumero) {
    const info = CONTACT_ID_MAP[matchNumero[1]]
    if (info) return info
  }
  
  return null
}

/**
 * Retorna true si el string parece un código Contact ID o SIA.
 * Útil para decidir si consultar la librería.
 */
export function esCodigoCID(eventoStr: string): boolean {
  if (!eventoStr) return false
  const clean = eventoStr.toUpperCase().trim().replace(/^[/\\*\[\]]+/, '').replace(/[/\\*\[\]]+$/, '').trim()
  // E/R + 3-4 dígitos
  if (/^[ER]\d{3,4}$/.test(clean)) return true
  // Solo 3 dígitos
  if (/^\d{3}$/.test(clean)) return true
  // 2 letras mayúsculas SIA (con o sin número de zona/usuario)
  if (/^[A-Z]{2}(?:[\s/_-]?\d+)?$/.test(clean) && clean.length <= 6) return true
  return false
}

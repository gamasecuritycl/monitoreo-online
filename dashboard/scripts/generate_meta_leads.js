const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const LEADS = [
  // =========================================================================
  // V REGIÓN: VIÑA DEL MAR (EL SALTO, REÑACA, REÑACA ALTO, MIRAFLORES, CENTRO)
  // =========================================================================
  {
    zona_meta_ads: 'V Región - Viña del Mar (El Salto)',
    empresa: 'Logística & Bodegaje El Salto SpA',
    contacto: 'Don Manuel Barrientos (Jefe Operaciones)',
    email: 'contacto@logisticaelsalto.cl',
    telefono: '+56 32 268 9000',
    comuna: 'Viña del Mar',
    direccion: 'Av. El Salto 1450, Barrio Industrial El Salto',
    rubro: 'Industrial & Bodegaje',
    solucion_gama: 'Cerco eléctrico perimetral + 16 cámaras 4K con analítica IA y enlace a CRA 24/7',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (El Salto)',
    empresa: 'Indemin Servicios Industriales',
    contacto: 'Encargado de Seguridad & Infraestructura',
    email: 'contacto@indemin.cl',
    telefono: '+56 32 299 0877',
    comuna: 'Viña del Mar',
    direccion: 'Calle Limache 3405, Of. 115, Sector El Salto',
    rubro: 'Industrial & Maestranza',
    solucion_gama: 'Monitoreo 24/7 de talleres mecánicos y patios de acopio con video-verificación inmediata',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (El Salto)',
    empresa: 'PMG Seguridad Industrial',
    contacto: 'Administrador de Local & Bodega',
    email: 'ventasweb@pmgseguridad.cl',
    telefono: '+56 9 4499 7548',
    comuna: 'Viña del Mar',
    direccion: 'Calle Limache 3363, Local 2, El Salto',
    rubro: 'Comercial & Distribución',
    solucion_gama: 'Monitoreo anti-intrusión, control de acceso peatonal y botón de pánico en caja',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (El Salto)',
    empresa: 'Comercial El Salto Materiales',
    contacto: 'Gerente Comercial',
    email: 'ventascomelsalto@gmail.com',
    telefono: '+56 9 5882 0745',
    comuna: 'Viña del Mar',
    direccion: 'Calle Limache 3421, Of. 609 (Edificio Reitz II)',
    rubro: 'Ferretería & Construcción',
    solucion_gama: 'CCTV perimetral para patios exteriores de carga y botón de pánico conectado a Gama',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (El Salto)',
    empresa: 'Distrito V21 Centro Empresarial',
    contacto: 'Administrador de Edificio y Operaciones',
    email: 'equipo@v21.cl',
    telefono: '+56 32 213 9000',
    comuna: 'Viña del Mar',
    direccion: 'Calle Limache 3405, Edificio Reitz I, piso 14',
    rubro: 'Corporativo & Oficinas',
    solucion_gama: 'Control de acceso vehicular con lectura de patentes (LPR) y torniquetes biométricos',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (El Salto)',
    empresa: 'Automotora & Maestranza El Salto SpA',
    contacto: 'Gerente de Patio y Operaciones',
    email: 'operaciones@automotoraelsalto.cl',
    telefono: '+56 32 284 1500',
    comuna: 'Viña del Mar',
    direccion: 'Calle Limache 2800, El Salto',
    rubro: 'Automotriz & Talleres',
    solucion_gama: 'Monitoreo térmico nocturno para parque automotriz descubierto con aviso por voz disuasiva',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (14 Norte / Mall)',
    empresa: 'Mall Marina Arauco Viña del Mar',
    contacto: 'Gerente de Operaciones y Seguridad',
    email: 'administracion@marinavina.cl',
    telefono: '+56 32 238 2000',
    comuna: 'Viña del Mar',
    direccion: 'Av. 14 Norte 821, Viña del Mar',
    rubro: 'Retail & Centros Comerciales',
    solucion_gama: 'Circuito CCTV 4K con conteo de aforo, botones de pánico en locales y guardias OS-10',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (13 Norte / Centro)',
    empresa: 'Clínica Ciudad del Mar',
    contacto: 'Encargado de Seguridad y Mantención',
    email: 'contacto@ccdm.cl',
    telefono: '+56 32 249 9000',
    comuna: 'Viña del Mar',
    direccion: 'Calle 13 Norte 635, Viña del Mar',
    rubro: 'Salud & Clínicas Privadas',
    solucion_gama: 'Control de acceso a pabellones, farmacia clínica de urgencia y pulsadores silenciosos CRA',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (Limache / Hospital)',
    empresa: 'Hospital Clínico Viña del Mar',
    contacto: 'Jefe de Servicios Generales',
    email: 'recepcion@hospitalclinico.cl',
    telefono: '+56 32 232 3800',
    comuna: 'Viña del Mar',
    direccion: 'Calle Limache 1741, Viña del Mar',
    rubro: 'Salud & Servicios Médicos',
    solucion_gama: 'Control vehicular para ambulancias, televigilancia perimetral y guardias OS-10',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (Libertad / Centro)',
    empresa: 'Clínica Oftalmológica Jardín del Mar',
    contacto: 'Dr. Fernando Araya (Director Médico)',
    email: 'gerencia@jardindelmaroftalmo.cl',
    telefono: '+56 32 233 4455',
    comuna: 'Viña del Mar',
    direccion: 'Av. Libertad 940, Of. 601, Viña del Mar',
    rubro: 'Salud & Clínicas',
    solucion_gama: 'Alarma silenciosa médica, pulsadores de asalto en recepción y CCTV interno de pasillos',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (Libertad)',
    empresa: 'Automotora Portillo Viña del Mar',
    contacto: 'Gerente de Sucursal',
    email: 'contacto@portillo.cl',
    telefono: '+56 32 250 8000',
    comuna: 'Viña del Mar',
    direccion: 'Av. Libertad 1250, Viña del Mar',
    rubro: 'Automotriz & Concesionarias',
    solucion_gama: 'Cámaras perimetrales con IA anti-merodeo para showroom de vehículos y CRA 24/7',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (Miraflores)',
    empresa: 'Centro Médico y Dental Miraflores',
    contacto: 'Jefe Administrativo',
    email: 'administracion@cmmiraflores.cl',
    telefono: '+56 32 267 4300',
    comuna: 'Viña del Mar',
    direccion: 'Av. Eduardo Frei 2120, Miraflores',
    rubro: 'Salud & Clínicas',
    solucion_gama: 'Monitoreo 24/7 de farmacia clínica interna, sensores de movimiento y apertura de accesos',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (Reñaca)',
    empresa: 'Inmobiliaria & Rentas Reñaca Limitada',
    contacto: 'Claudia Cisternas (Administradora)',
    email: 'administracion@inmobiliariarenaca.cl',
    telefono: '+56 9 9876 1122',
    comuna: 'Viña del Mar',
    direccion: 'Av. Borgoño 15200, Reñaca',
    rubro: 'Condominios & Rentas',
    solucion_gama: 'Conserjería virtual remota Gama, control biométrico de acceso y CCTV perimetral costero',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (Reñaca)',
    empresa: 'Strip Center Reñaca (Inmobiliaria Del Mar)',
    contacto: 'Administrador de Strip Center',
    email: 'gbarrios@idelmar.cl',
    telefono: '+56 32 268 3300',
    comuna: 'Viña del Mar',
    direccion: 'Av. Vicuña Mackenna 1050, Reñaca',
    rubro: 'Centros Comerciales & Locales',
    solucion_gama: 'Monitoreo perimetral nocturno de estacionamientos, pulsadores de pánico y televigilancia',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (Reñaca)',
    empresa: 'Strip Center Golondrinas Reñaca',
    contacto: 'Administrador Comercial (OM Propiedades)',
    email: 'info@ompropiedades.cl',
    telefono: '+56 9 7455 4077',
    comuna: 'Viña del Mar',
    direccion: 'Teresa Hamel 190, Reñaca',
    rubro: 'Centros Comerciales & Strip Centers',
    solucion_gama: 'Conserjería remota, control vehicular inteligente y televigilancia de accesos 24/7',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (Reñaca)',
    empresa: 'Paseo Dunas Centro Comercial',
    contacto: 'Administrador de Comunidad',
    email: 'contacto@paseodunas.cl',
    telefono: '+56 32 283 5500',
    comuna: 'Viña del Mar',
    direccion: 'Gastón Hamel 527, Reñaca',
    rubro: 'Comercial & Gastronomía',
    solucion_gama: 'Circuito cerrado 4K, barreras de acceso con cobro/lectura de patente y botón de pánico',
    prioridad: 'Media'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (Reñaca Alto)',
    empresa: 'Condominio Bosques de Reñaca',
    contacto: 'Presidente Comité de Administración',
    email: 'comite@bosquesderenaca.cl',
    telefono: '+56 9 8734 5612',
    comuna: 'Viña del Mar',
    direccion: 'Av. Central 450, Reñaca Alto',
    rubro: 'Condominios Residenciales',
    solucion_gama: 'Barreras vehiculares automáticas con apertura por TAG/App + CCTV perimetral anti-saltos',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Viña del Mar (Reñaca Alto)',
    empresa: 'Condominio Cumbres de Reñaca (Beltec)',
    contacto: 'Administrador de Proyecto Inmobiliario',
    email: 'cumbresderenaca@beltec.cl',
    telefono: '+56 9 9346 9700',
    comuna: 'Viña del Mar',
    direccion: 'Las Maravillas esq. Estero Maitenlague, Reñaca Alto',
    rubro: 'Condominios & Edificios',
    solucion_gama: 'Control de acceso vehicular con lectura de patentes LPR y circuito cerrado en accesos',
    prioridad: 'Alta - Inmediata'
  },

  // =========================================================================
  // V REGIÓN: VALPARAÍSO (PLACILLA, CURAUMA, PUERTO SECO, LA PÓLVORA, PUERTO)
  // =========================================================================
  {
    zona_meta_ads: 'V Región - Valparaíso (Puerto)',
    empresa: 'Empresa Portuaria Valparaíso (EPV)',
    contacto: 'Jefe de Seguridad Patrimonial',
    email: 'contacto@puertovalparaiso.cl',
    telefono: '+56 32 244 8800',
    comuna: 'Valparaíso',
    direccion: 'Av. Errázuriz 25, Valparaíso',
    rubro: 'Puerto & Logística Marítima',
    solucion_gama: 'Integración de cámaras térmicas perimetrales en frente de atraque y monitoreo de accesos',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Puerto)',
    empresa: 'Terminal Pacífico Sur Valparaíso (TPS)',
    contacto: 'Subgerente de Seguridad y HSE',
    email: 'contacto@tps.cl',
    telefono: '+56 32 226 8000',
    comuna: 'Valparaíso',
    direccion: 'Antonio Varas 2, Valparaíso',
    rubro: 'Operador Portuario & Terminal Contenedores',
    solucion_gama: 'Analítica de video para grúas pórtico, control biométrico estricto y televigilancia 24/7',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Puerto)',
    empresa: 'Agunsa Valparaíso (Agencias Universales)',
    contacto: 'Encargado de Seguridad y Flota',
    email: 'contacto@agunsa.com',
    telefono: '+56 32 220 3000',
    comuna: 'Valparaíso',
    direccion: 'Av. Errázuriz 755, Valparaíso',
    rubro: 'Logística y Agenciamiento Marítimo',
    solucion_gama: 'Monitoreo de patios de camiones, control de choferes y enlace directo a CRA 24/7',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Puerto)',
    empresa: 'Ultramar Agencia Marítima Valparaíso',
    contacto: 'Jefe de Infraestructura y Seguridad',
    email: 'contacto@ultramar.cl',
    telefono: '+56 32 220 3100',
    comuna: 'Valparaíso',
    direccion: 'Av. Errázuriz 401, Valparaíso',
    rubro: 'Agenciamiento & Transporte Marítimo',
    solucion_gama: 'Control de acceso biométrico en salas de servidores y circuito cerrado HD en oficinas',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Placilla)',
    empresa: 'Siderval S.A. (Fundición y Maestranza)',
    contacto: 'Subgerente de Operaciones y Seguridad',
    email: 'info@siderval.cl',
    telefono: '+56 32 381 7000',
    comuna: 'Valparaíso',
    direccion: 'Décima Avenida Parcela 474, Parque Industrial Placilla',
    rubro: 'Industrial Pesada',
    solucion_gama: 'Cámaras térmicas perimetrales de largo alcance en patios y control de acceso con guardias OS-10',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Placilla / Curauma)',
    empresa: 'Azúcar Panor (Planta Procesadora)',
    contacto: 'Jefe de Planta & Mantenimiento',
    email: 'contacto@panor.cl',
    telefono: '+56 32 331 3180',
    comuna: 'Valparaíso',
    direccion: 'Calle Cerro El Altar 3580, Curauma / Placilla',
    rubro: 'Alimentos & Agroindustria',
    solucion_gama: 'Monitoreo perimetral 24/7 y control de acceso vehicular a básculas y tolvas de despacho',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Placilla)',
    empresa: 'Industrial Park Valparaíso SpA',
    contacto: 'Loreto Guerrero (Administración)',
    email: 'lguerrero@industrialpark.cl',
    telefono: '+56 9 9342 6644',
    comuna: 'Valparaíso',
    direccion: 'Ruta F-730 Km 0.6, Parque Industrial Placilla',
    rubro: 'Parque Industrial & Bodegaje',
    solucion_gama: 'Central de televigilancia unificada para condominios de bodegas + Guardias OS-10',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Curauma)',
    empresa: 'Primepark Curauma Centro Empresarial',
    contacto: 'Administrador de Condominio Industrial',
    email: 'curauma@primepark.cl',
    telefono: '+56 9 9966 2274',
    comuna: 'Valparaíso',
    direccion: 'Av. Tupungato s/n, Parque Industrial Curauma',
    rubro: 'Parques Logísticos & Condominios de Bodegas',
    solucion_gama: 'Televigilancia perimetral compartida para 30 bodegas + Servicio de Guardias OS-10 en caseta',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Placilla)',
    empresa: 'Bodegas GPF Placilla',
    contacto: 'Ana María Sánchez (Operaciones y Arriendos)',
    email: 'contacto@bodegasgpf.cl',
    telefono: '+56 9 6587 3135',
    comuna: 'Valparaíso',
    direccion: 'Av. Bernardo O’Higgins 194, Placilla',
    rubro: 'Bodegaje Estándar & Frigoríficos',
    solucion_gama: 'Detección perimetral con cámaras térmicas y control de acceso vehicular para camiones',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Placilla Oriente)',
    empresa: 'AMC Bodegaje Placilla',
    contacto: 'Jefe de Planta y Seguridad',
    email: 'contacto@amcbodegaje.cl',
    telefono: '+56 32 229 4500',
    comuna: 'Valparaíso',
    direccion: 'Sector Industrial Placilla Oriente',
    rubro: 'Minibodegas & Bodegaje Comercial',
    solucion_gama: 'Cerco eléctrico perimetral monitoreado y CCTV con audio disuasivo de advertencia',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Nueva Placilla)',
    empresa: 'Bodegas Kochifas Placilla',
    contacto: 'Administrador de Bodegas',
    email: 'operaciones@kochifas.cl',
    telefono: '+56 9 6307 7073',
    comuna: 'Valparaíso',
    direccion: 'Sector Nueva Placilla, Valparaíso',
    rubro: 'Almacenaje Industrial & Patios',
    solucion_gama: 'Monitoreo 24/7 conectado a CRA Gama y control de acceso vehicular automatizado',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Placilla Oriente)',
    empresa: 'Hanseatic Global Terminals Placilla',
    contacto: 'Supervisor de Seguridad Portuaria',
    email: 'comercial.inlandservices@hgt.com',
    telefono: '+56 32 229 8800',
    comuna: 'Valparaíso',
    direccion: 'Tercera Avenida 520, Placilla Oriente',
    rubro: 'Logística Portuaria & Seca',
    solucion_gama: 'Reconocimiento automático de matrículas (LPR) para camiones y circuito cerrado 4K anti-robo',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (La Pólvora)',
    empresa: 'Puerto Seco & Frigoríficos Valparaíso SpA',
    contacto: 'Ing. Gustavo Plaza (Gerente Operaciones)',
    email: 'operaciones@puertosecovalpo.cl',
    telefono: '+56 32 290 1200',
    comuna: 'Valparaíso',
    direccion: 'Camino La Pólvora Km 8.5',
    rubro: 'Logística & Frigoríficos',
    solucion_gama: 'Analítica de video anti-intrusión en 8 hectáreas con detección perimetral térmica',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Plan de Valparaíso)',
    empresa: 'Distribuidora Panamericana del Puerto Limitada',
    contacto: 'Don Mario Bustamante (Administrador)',
    email: 'comercial@distribuidoradelpuerto.cl',
    telefono: '+56 9 8444 5511',
    comuna: 'Valparaíso',
    direccion: 'Calle Errázuriz 2200, Valparaíso',
    rubro: 'Comercial Mayorista',
    solucion_gama: 'Sistema anti-hurto para sala de ventas, botones de pánico conectados a CRA y cámaras HD',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Placilla)',
    empresa: 'Calicon Chile Maestranza',
    contacto: 'Jefe de Maestranza y Patio',
    email: 'contacto@calicon.cl',
    telefono: '+56 32 229 1592',
    comuna: 'Valparaíso',
    direccion: 'Parcela 416, Parque Industrial Placilla',
    rubro: 'Metalmecánica & Calderería',
    solucion_gama: 'Alarmas sísmicas y de corte perimetral para resguardo de maquinaria y acopio metálico',
    prioridad: 'Media'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Placilla)',
    empresa: 'Placimec Soluciones Industriales',
    contacto: 'Gerencia General',
    email: 'gerencia@placimec.cl',
    telefono: '+56 32 229 3126',
    comuna: 'Valparaíso',
    direccion: 'Primera Norte 12, Placilla',
    rubro: 'Taller & Mecanizado Industrial',
    solucion_gama: 'CCTV con audio bidireccional disuasivo para activación de sirena ante intrusiones',
    prioridad: 'Media'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (La Pólvora)',
    empresa: 'Logística Multimodal La Pólvora',
    contacto: 'Jefe de Patio Contenedores',
    email: 'contacto@lapolvoralog.cl',
    telefono: '+56 32 245 6700',
    comuna: 'Valparaíso',
    direccion: 'Camino La Pólvora Acceso Sur',
    rubro: 'Logística & Transporte Pesado',
    solucion_gama: 'Torres de vigilancia solar autónomas y rondas de supervisión de guardias OS-10',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Valparaíso (Placilla)',
    empresa: 'Reciclados Industriales S.A.',
    contacto: 'Gerente de Faena',
    email: 'contacto@recicladosindustriales.cl',
    telefono: '+56 32 312 9040',
    comuna: 'Valparaíso',
    direccion: 'Calle Décima 1126, Placilla',
    rubro: 'Reciclaje & Patio Abierto',
    solucion_gama: 'Detección perimetral temprana anti-robos nocturnos de metales y cerco eléctrico',
    prioridad: 'Alta - Inmediata'
  },

  // =========================================================================
  // V REGIÓN: CONCÓN (PARQUE INDUSTRIAL, BOSQUES DE MONTEMAR, BORDE COSTERO)
  // =========================================================================
  {
    zona_meta_ads: 'V Región - Concón (Parque Industrial)',
    empresa: 'Termocon Paneles Térmicos',
    contacto: 'Encargado de Producción & Seguridad',
    email: 'contacto@termocon.cl',
    telefono: '+56 32 281 7640',
    comuna: 'Concón',
    direccion: 'Avda. El Parque Lote 17, Barrio Industrial Concón',
    rubro: 'Manufactura de Vidrios & Paneles',
    solucion_gama: 'Monitoreo 24/7 en línea de producción y patios exteriores con analítica perimetral',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Concón (Parque Industrial)',
    empresa: 'Proingesa Ingeniería y Servicios',
    contacto: 'Jefe Administrativo',
    email: 'contacto@proingesa.cl',
    telefono: '+56 32 314 0790',
    comuna: 'Concón',
    direccion: 'Avenida El Parque Nº 450, Barrio Industrial Concón',
    rubro: 'Servicios de Ingeniería',
    solucion_gama: 'Control de acceso dactilar/RFID y sistema de alarma de grado comercial con CRA Gama',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Concón (Parque Industrial)',
    empresa: 'Inecons Constructora e Inmobiliaria',
    contacto: 'Director de Proyectos',
    email: 'contacto@inecons.cl',
    telefono: '+56 32 281 7595',
    comuna: 'Concón',
    direccion: 'Avenida El Parque Parcela 3-A Lote 19, Concón',
    rubro: 'Construcción & Obras Civiles',
    solucion_gama: 'Torres solares móviles de monitoreo con IA para obras en construcción',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Concón (Camino Internacional)',
    empresa: 'Sociedad Chile Maderas SpA',
    contacto: 'Administrador de Barraca y Patio',
    email: 'ventas@sociedad-madereradechile.cl',
    telefono: '+56 9 4476 7556',
    comuna: 'Concón',
    direccion: 'Camino Internacional 11825, Parque Industrial Concón',
    rubro: 'Materiales & Maderas',
    solucion_gama: 'Sensores de haz infrarrojo perimetral y sistema de detección temprana de incendios/intrusión',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Concón (Camino Internacional)',
    empresa: 'Metso Planta Concón',
    contacto: 'Gerente de Seguridad & HSE',
    email: 'info.chile@metso.com',
    telefono: '+56 32 227 0000',
    comuna: 'Concón',
    direccion: 'Camino Internacional s/n, Concón',
    rubro: 'Minería & Equipamiento Pesado',
    solucion_gama: 'Servicio de Guardias OS-10 híbridos con control biométrico estricto de contratistas',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Concón (Camino Internacional)',
    empresa: 'Maestranza & Calderería Concón SpA',
    contacto: 'Jefe de Taller y Producción',
    email: 'operaciones@maestranzaconcon.cl',
    telefono: '+56 32 281 4420',
    comuna: 'Concón',
    direccion: 'Camino Internacional 10500, Concón',
    rubro: 'Metalúrgica & Maestranza',
    solucion_gama: 'Sensores perimetrales y cámaras disuasivas en patios de almacenamiento',
    prioridad: 'Media'
  },
  {
    zona_meta_ads: 'V Región - Concón (Costa)',
    empresa: 'Constructora Dunas de Concón SpA',
    contacto: 'Arq. Esteban Morales (Jefe de Obras)',
    email: 'proyectos@dunasconcon.cl',
    telefono: '+56 32 281 9900',
    comuna: 'Concón',
    direccion: 'Av. Concón-Reñaca 4000, Concón',
    rubro: 'Edificación en Altura',
    solucion_gama: 'Cámaras domo PTZ 360° para vigilancia nocturna de maquinaria, grúas y acopios de obra',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Concón (Borde Costero)',
    empresa: 'Strip Center Cariló Concón',
    contacto: 'Sra. Scarlett Aguilera (Gerencia Operaciones)',
    email: 'saguilera@idelagua.cl',
    telefono: '+56 32 268 3300',
    comuna: 'Concón',
    direccion: 'Av. Concón Reñaca 115, Concón',
    rubro: 'Centros Comerciales & Retail',
    solucion_gama: 'Alarma vecinal comercial, CCTV en estacionamientos y botón de pánico en locales',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Concón (Bosques de Montemar)',
    empresa: 'Concón Administración de Comunidades',
    contacto: 'Administrador General de Comunidades',
    email: 'info@conconadministracion.cl',
    telefono: '+56 9 5411 2502',
    comuna: 'Concón',
    direccion: 'Calle Blanca Estela 60, Of. 86, Bosques de Montemar',
    rubro: 'Administración de Edificios & Condominios',
    solucion_gama: 'Conserjería virtual inteligente, control de accesos vehiculares por TAG y barreras automáticas',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Concón (Bosques de Montemar)',
    empresa: 'Strip Center Bosques de Montemar',
    contacto: 'Administrador de Recinto',
    email: 'administracion@montemarcomercial.cl',
    telefono: '+56 9 6587 8558',
    comuna: 'Concón',
    direccion: 'Av. Edmundo Eluchans 2600, Concón',
    rubro: 'Centros Comerciales & Strip Centers',
    solucion_gama: 'Monitoreo nocturno 24/7 y botón de pánico en locales de gastronomía y farmacia',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Concón (Higuerillas)',
    empresa: 'Complejo Gastronómico Higuerillas',
    contacto: 'Sra. Marcela Godoy (Administradora)',
    email: 'eventos@higuerillaseventos.cl',
    telefono: '+56 9 9122 3344',
    comuna: 'Concón',
    direccion: 'Av. Borgoño 21000, Borde Costero Higuerillas',
    rubro: 'Comercial & Gastronomía',
    solucion_gama: 'CCTV 4K discreto en comedores, control de inventario de bodegas y botón de pánico en cajas',
    prioridad: 'Media'
  },
  {
    zona_meta_ads: 'V Región - Concón (Manantiales)',
    empresa: 'Centro Médico Concón Costa',
    contacto: 'Coordinador Administrativo',
    email: 'administracion@conconmed.cl',
    telefono: '+56 32 281 5566',
    comuna: 'Concón',
    direccion: 'Av. Manantiales 820, Concón',
    rubro: 'Salud & Centros Médicos',
    solucion_gama: 'Control de acceso restringido a salas clínicas y monitoreo nocturno anti-ingreso',
    prioridad: 'Estratégica'
  },

  // =========================================================================
  // V REGIÓN: QUILPUÉ & VILLA ALEMANA (EL BELLOTO INDUSTRIAL, MARGA MARGA, TRONCAL SUR)
  // =========================================================================
  {
    zona_meta_ads: 'V Región - Quilpué (El Belloto Industrial)',
    empresa: 'AUEL Servicios Industriales',
    contacto: 'Jefe de Planta y Seguridad',
    email: 'contacto@auel.cl',
    telefono: '+56 32 294 2244',
    comuna: 'Quilpué',
    direccion: 'El Esfuerzo 440, Barrio Industrial El Belloto',
    rubro: 'Maestranza & Fabricación Industrial',
    solucion_gama: 'Detección perimetral de intrusión en talleres de mecanizado y cerco eléctrico inteligente',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Quilpué (El Belloto Industrial)',
    empresa: 'MIES Maestranzas y Servicios',
    contacto: 'Encargado de Prevención y Seguridad',
    email: 'contacto@mies.cl',
    telefono: '+56 32 294 2244',
    comuna: 'Quilpué',
    direccion: 'Av. Freire 1320, Barrio Industrial El Belloto',
    rubro: 'Servicios Mineros e Industriales',
    solucion_gama: 'Circuito cerrado 4K en patios de maquinaria pesada y alarmas conectadas a CRA 24/7',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Quilpué (El Belloto Norte)',
    empresa: 'Solfeo Ltda. Transporte de Residuos',
    contacto: 'Jefe de Operaciones y Flota',
    email: 'comercial@solfeo.cl',
    telefono: '+56 9 8330 3524',
    comuna: 'Quilpué',
    direccion: 'Calle Tres 895, Barrio Industrial Belloto Norte',
    rubro: 'Transporte Industrial & Logística Ambiental',
    solucion_gama: 'Monitoreo perimetral nocturno de flota de camiones y control de acceso vehicular',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Quilpué (El Belloto Norte)',
    empresa: 'Maestranza Nahuel Industrial',
    contacto: 'Gerente de Taller',
    email: 'contacto@maestranzanahuel.cl',
    telefono: '+56 32 294 7484',
    comuna: 'Quilpué',
    direccion: 'Av. del Trabajador 701, Barrio Industrial Belloto Norte',
    rubro: 'Minería & Fabricación de Estructuras',
    solucion_gama: 'Cámaras térmicas para protección perimetral de acopio de aceros y materias primas',
    prioridad: 'Media'
  },
  {
    zona_meta_ads: 'V Región - Quilpué (El Belloto Industrial)',
    empresa: 'Megacentro El Belloto',
    contacto: 'Administrador de Centro Logístico',
    email: 'contacto@megacentro.cl',
    telefono: '+56 2 2712 8510',
    comuna: 'Quilpué',
    direccion: 'Av. Freire 1388, El Belloto',
    rubro: 'Centros Logísticos & Bodegaje',
    solucion_gama: 'Rondas de guardias OS-10 híbridos y control vehicular por TAG en portón principal',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Quilpué (El Belloto Industrial)',
    empresa: 'Importaciones Reus Quilpué',
    contacto: 'Administrador de Sucursal',
    email: 'ventas@importacionesreus.cl',
    telefono: '+56 9 3911 6144',
    comuna: 'Quilpué',
    direccion: 'Av. Freire 1388, Módulo 4, El Belloto',
    rubro: 'Distribución Mayorista de Insumos',
    solucion_gama: 'Sistema anti-hurto interno y botón de pánico en recepción y bodega',
    prioridad: 'Media'
  },
  {
    zona_meta_ads: 'V Región - Quilpué (El Belloto Industrial)',
    empresa: 'Condominio Industrial Belloto Norte',
    contacto: 'Administrador de Condominio Industrial',
    email: 'contacto@bellotonorte.cl',
    telefono: '+56 9 7654 3210',
    comuna: 'Quilpué',
    direccion: 'Av. Santa Margarita 340, El Belloto',
    rubro: 'Galpones & Pymes Industriales',
    solucion_gama: 'Seguridad perimetral compartida para 22 galpones con televigilancia y respuesta armada',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Quilpué (Marga Marga)',
    empresa: 'Centro Logístico Marga Marga SpA',
    contacto: 'Don Ricardo Soto (Jefe de Recinto)',
    email: 'seguridad@margamargalog.cl',
    telefono: '+56 32 291 8800',
    comuna: 'Quilpué',
    direccion: 'Av. Los Carrera 2500, Quilpué',
    rubro: 'Parques Logísticos & Bodegas',
    solucion_gama: 'Circuito perimetral de 24 cámaras 4K con IA, barreras automáticas vehiculares y CRA 24/7',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Quilpué (Centro)',
    empresa: 'Colegio Particular San Andrés de Quilpué',
    contacto: 'Dra. Patricia Orellana (Directora)',
    email: 'direccion@sanandresquilpue.cl',
    telefono: '+56 32 292 1010',
    comuna: 'Quilpué',
    direccion: 'Calle Blanco Encalada 850, Quilpué',
    rubro: 'Educación & Colegios',
    solucion_gama: 'Circuito de televigilancia en patios y accesos con control de entrada de apoderados',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Quilpué (Freire)',
    empresa: 'Clínica Veterinaria & Urgencias Marga Marga',
    contacto: 'Dra. Romina Morales (Directora Médica)',
    email: 'contacto@veterinariamargamarga.cl',
    telefono: '+56 32 291 3322',
    comuna: 'Quilpué',
    direccion: 'Calle Freire 1120, Quilpué',
    rubro: 'Salud Veterinaria & Urgencias',
    solucion_gama: 'Botón de pánico silencioso 24/7 para turnos de noche y cámaras disuasivas en salas de espera',
    prioridad: 'Media'
  },
  {
    zona_meta_ads: 'V Región - Villa Alemana (Troncal Sur)',
    empresa: 'Distribuidora Troncal Sur Alimentos',
    contacto: 'Gerente de Operaciones y Flota',
    email: 'ventas@troncalsuralimentos.cl',
    telefono: '+56 32 295 4400',
    comuna: 'Villa Alemana',
    direccion: 'Calle Troncos Viejos 1980, Villa Alemana',
    rubro: 'Distribución Mayorista',
    solucion_gama: 'Monitoreo 24/7 para andenes de carga y descarga de camiones y cerco eléctrico',
    prioridad: 'Alta - Inmediata'
  },

  // =========================================================================
  // V REGIÓN: QUILLOTA, LA CALERA & LIMACHE
  // =========================================================================
  {
    zona_meta_ads: 'V Región - Quillota (Hijuelas / Ruta 5)',
    empresa: 'Propal (Agrocomercial Quillota S.A.)',
    contacto: 'Subgerente de Seguridad de Planta',
    email: 'contacto@propal.cl',
    telefono: '+56 33 227 1500',
    comuna: 'Quillota',
    direccion: 'Panamericana Norte Km 107, Hijuelas / Quillota',
    rubro: 'Agroindustria & Packing de Frutas',
    solucion_gama: 'Cámaras térmicas en perímetro de frío, control biométrico de cosecheros y enlace CRA 24/7',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Quillota (Hijuelas)',
    empresa: 'AgroValenz Packing de Exportación',
    contacto: 'Encargado de Planta & Frío',
    email: 'info@agrovalenz.cl',
    telefono: '+56 33 227 2686',
    comuna: 'Quillota',
    direccion: 'Calle Manuel Rodríguez 2885, Hijuelas',
    rubro: 'Packing Agroindustrial & Cítricos',
    solucion_gama: 'CCTV en cámaras frigoríficas y registro automático LPR para camiones de despacho',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Quillota (Centro)',
    empresa: 'Natural Green Comercializadora',
    contacto: 'Gerente de Operaciones',
    email: 'contacto@naturalgreen.com',
    telefono: '+56 9 6663 7698',
    comuna: 'Quillota',
    direccion: 'Av. Alberdi 761, Quillota',
    rubro: 'Agroindustria & Selección de Frutas',
    solucion_gama: 'Alarma conectada a CRA Gama y monitoreo de andenes de carga',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Quillota (Parque Industrial)',
    empresa: 'Agro Puelma Insumos Agrícolas',
    contacto: 'Jefe de Sucursal y Bodega',
    email: 'ventasquillota@agropuelma.cl',
    telefono: '+56 33 231 1638',
    comuna: 'Quillota',
    direccion: 'Hermann Niemeyer 586, Parque Industrial Quillota',
    rubro: 'Distribución Agrícola & Fertilizantes',
    solucion_gama: 'Sensores perimetrales anti-robo de agroquímicos de alto valor y botón de asalto',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Quillota (Ruta 60-CH)',
    empresa: 'Packing Exportaciones Quillota Verde',
    contacto: 'Gerente de Producción y Mantenimiento',
    email: 'administracion@quillotaverde.cl',
    telefono: '+56 33 226 5500',
    comuna: 'Quillota',
    direccion: 'Ruta 60-CH Km 18, Quillota',
    rubro: 'Agroindustria & Frío',
    solucion_gama: 'CCTV en cámaras frigoríficas y registro automático de patentes para camiones frigoríficos',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - La Calera (Industrial)',
    empresa: 'Frigorífico La Calera Ltda. (FRIGOCAL)',
    contacto: 'Administrador de Planta',
    email: 'contacto@frigocal.cl',
    telefono: '+56 33 222 1798',
    comuna: 'La Calera',
    direccion: 'Av. La Feria 110, La Calera',
    rubro: 'Faenadora & Frigoríficos',
    solucion_gama: 'Monitoreo 24/7 con IA en andenes de carga y cámaras térmicas anti-intrusión',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - La Calera (Centro Distribución)',
    empresa: 'Cencocal S.A. Distribuidora Central',
    contacto: 'Jefe de Logística y Seguridad',
    email: 'contacto@cencocal.com',
    telefono: '+56 33 222 4100',
    comuna: 'La Calera',
    direccion: 'Calle Huici 353, La Calera',
    rubro: 'Alimentos & Gran Distribución',
    solucion_gama: 'Control de acceso de camiones, barreras automáticas y guardias de seguridad OS-10',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Limache (Industrial)',
    empresa: 'Industrial de Limache Ltda. (INDELI)',
    contacto: 'Gerente de Maestranza',
    email: 'contacto@indeli.cl',
    telefono: '+56 33 234 6200',
    comuna: 'Limache',
    direccion: 'Ruta CH-60, Fundo La Fama, Lote C3, Limache',
    rubro: 'Maestranza & Montajes Industriales',
    solucion_gama: 'Cerco eléctrico perimetral y CCTV en patios exteriores de ensamblaje de estructuras',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Limache (Barrio Industrial)',
    empresa: 'Grupo M.E.S. Framax Limache',
    contacto: 'Administrador de Planta',
    email: 'contacto@grupomes.cl',
    telefono: '+56 9 7648 1366',
    comuna: 'Limache',
    direccion: 'Parcela 23, Fundo La Gloria, Barrio Industrial Limache',
    rubro: 'Industrial & Envases',
    solucion_gama: 'Televigilancia 24/7 en galpones de acopio de materias primas y detección de incendios',
    prioridad: 'Media'
  },

  // =========================================================================
  // V REGIÓN: CASABLANCA (PARQUE INDUSTRIAL, RUTA 68 & VIÑAS)
  // =========================================================================
  {
    zona_meta_ads: 'V Región - Casablanca (Parque Industrial)',
    empresa: 'Terra Logística Casablanca',
    contacto: 'Jefe de Centro de Distribución',
    email: 'contacto@terralogistica.cl',
    telefono: '+56 32 274 1500',
    comuna: 'Casablanca',
    direccion: 'Vía Industrial 3 N°112, Parque Industrial Casablanca',
    rubro: 'Logística & Centros de Bodegas',
    solucion_gama: 'Cámaras térmicas de largo alcance en perímetro y control vehicular LPR en portería',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Casablanca (Parque Industrial)',
    empresa: 'Rayssa Chile Sucursal Casablanca',
    contacto: 'Administrador de Base',
    email: 'contacto@rayssa.cl',
    telefono: '+56 9 8296 1801',
    comuna: 'Casablanca',
    direccion: 'Parque Industrial Casablanca, Lote A15',
    rubro: 'Servicios Industriales & Maquinaria',
    solucion_gama: 'Alarmas anti-intrusión conectadas a central receptora Gama y cámaras HD nocturnas',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Casablanca (Terrenos Industriales)',
    empresa: 'Parque Industrial Las Lomas Casablanca',
    contacto: 'Gerente de Proyecto Inmobiliario',
    email: 'gerencia@parquelaslomas.cl',
    telefono: '+56 9 5657 7911',
    comuna: 'Casablanca',
    direccion: 'Camino a Lo Ovalle, Ruta F-850 N°1002, Casablanca',
    rubro: 'Condominios Industriales & Loteos',
    solucion_gama: 'Seguridad integral de accesos con barreras automáticas, televigilancia y guardias OS-10',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Casablanca (Parque Industrial)',
    empresa: 'Centro de Reciclaje Revalora',
    contacto: 'Claudia Olivares (Jefa de Planta)',
    email: 'colivares@revalora.org',
    telefono: '+56 9 9847 5052',
    comuna: 'Casablanca',
    direccion: 'Fundo El Refugio, Lote A-28, Parque Industrial Casablanca',
    rubro: 'Reciclaje & Economía Circular',
    solucion_gama: 'Detección perimetral temprana y supervisión de acopios al aire libre con IA',
    prioridad: 'Media'
  },
  {
    zona_meta_ads: 'V Región - Casablanca (Ruta 68)',
    empresa: 'Viña Mar de Casablanca',
    contacto: 'Jefe de Seguridad de Bodega & Turismo',
    email: 'visitas@vinamar.cl',
    telefono: '+56 32 275 4130',
    comuna: 'Casablanca',
    direccion: 'Ruta 68 Km 72, Casablanca',
    rubro: 'Vitivinícola & Turismo',
    solucion_gama: 'Monitoreo discreto en bodegas de barricas, tienda y áreas de visitas turísticas',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Casablanca (Ruta 68)',
    empresa: 'Viña Indómita Casablanca',
    contacto: 'Encargado de Seguridad y Recinto',
    email: 'reservas@indomita.cl',
    telefono: '+56 32 215 3902',
    comuna: 'Casablanca',
    direccion: 'Ruta 68 Km 64, Casablanca',
    rubro: 'Vitivinícola & Bodegas de Exportación',
    solucion_gama: 'Circuito perimetral con IA en miradores, accesos vehiculares y salas de barricas',
    prioridad: 'Alta - Inmediata'
  },

  // =========================================================================
  // V REGIÓN: SAN ANTONIO & LLOLLEO (PUERTO, AGUAS BUENAS, NUEVO ACCESO)
  // =========================================================================
  {
    zona_meta_ads: 'V Región - San Antonio (Puerto)',
    empresa: 'Agencia de Aduanas San Antonio Ltda.',
    contacto: 'Sr. Jorge Valenzuela (Agente de Aduanas)',
    email: 'aduanas@aduanas-sanantonio.cl',
    telefono: '+56 35 220 4000',
    comuna: 'San Antonio',
    direccion: 'Av. Barros Luco 1600, San Antonio',
    rubro: 'Comercio Exterior & Aduanas',
    solucion_gama: 'Cámaras de alta resolución con respaldo extendido NVR y control biométrico en cajas de seguridad',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - San Antonio (Centro)',
    empresa: 'All Logística Ltda. San Antonio',
    contacto: 'Gerente de Operaciones',
    email: 'contacto@alllogistica.cl',
    telefono: '+56 35 221 0850',
    comuna: 'San Antonio',
    direccion: 'Av. Blanco Encalada 840, Of. 301, San Antonio',
    rubro: 'Logística Portuaria & Agenciamiento',
    solucion_gama: 'Monitoreo 24/7 de patios de camiones y trazabilidad de contenedores en tránsito',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - San Antonio (Nuevo Acceso Puerto)',
    empresa: 'Terminal San Antonio D&C (División Logística)',
    contacto: 'Supervisor de Seguridad Portuaria',
    email: 'ventas@logistica.cl',
    telefono: '+56 35 228 1100',
    comuna: 'San Antonio',
    direccion: 'Ruta G-94, Nuevo Acceso al Puerto 3559, Plataforma 3',
    rubro: 'Logística & Depósito de Contenedores',
    solucion_gama: 'Cámaras térmicas perimetrales contra asaltos y control biométrico de choferes',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - San Antonio (Aguas Buenas)',
    empresa: 'SL Transporte San Antonio',
    contacto: 'Jefe de Flota y Taller',
    email: 'contacto@sltransporte.cl',
    telefono: '+56 9 4008 8368',
    comuna: 'San Antonio',
    direccion: 'Calle Eucaliptus 597, Sector Aguas Buenas, San Antonio',
    rubro: 'Transporte de Carga Pesada',
    solucion_gama: 'Alarma perimetral en patios de estacionamiento nocturno de tractocamiones',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - San Antonio (Angamos)',
    empresa: 'MercoExpress S.A. San Antonio',
    contacto: 'Gerente de Operaciones Terrestres',
    email: 'aorchard@mercoexpress.cl',
    telefono: '+56 35 220 8000',
    comuna: 'San Antonio',
    direccion: 'Avenida Angamos 1947, San Antonio',
    rubro: 'Transporte & Logística Portuaria',
    solucion_gama: 'Circuito cerrado 4K con respaldo extendido y botón de alerta temprana CRA',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - San Antonio (Acceso Puerto)',
    empresa: 'Depósito de Contenedores Costa Central',
    contacto: 'Jefe de Patio y Logística',
    email: 'operaciones@costacentraldepot.cl',
    telefono: '+56 35 228 9010',
    comuna: 'San Antonio',
    direccion: 'Ruta Nuevo Acceso al Puerto Km 3.2, San Antonio',
    rubro: 'Logística Portuaria & Contenedores',
    solucion_gama: 'Monitoreo térmico anti-asaltos en patios abiertos y rondas nocturnas con Guardias OS-10',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - San Antonio (Comercial)',
    empresa: 'Centro Comercial San Antonio Puerto',
    contacto: 'Administrador Comercial',
    email: 'administracion@ccpuertosanantonio.cl',
    telefono: '+56 35 221 8899',
    comuna: 'San Antonio',
    direccion: 'Av. Centenario 280, San Antonio',
    rubro: 'Retail & Galerías Comerciales',
    solucion_gama: 'Monitoreo de pasillos comunes, botón de alarma vecinal comercial y apoyo de guardias OS-10',
    prioridad: 'Media'
  },

  // =========================================================================
  // V REGIÓN: LOS ANDES & SAN FELIPE (PTLA PUERTO TERRESTRE, EL SAUCE, ACONCAGUA)
  // =========================================================================
  {
    zona_meta_ads: 'V Región - Los Andes (Puerto Terrestre PTLA)',
    empresa: 'Puerto Terrestre Los Andes (PTLA Concesionaria)',
    contacto: 'Francisco Lere Escobar (Jefe Control Acceso)',
    email: 'flere@ptla.cl',
    telefono: '+56 9 7749 0317',
    comuna: 'Los Andes',
    direccion: 'Carretera Los Libertadores Nº 415, Los Andes',
    rubro: 'Recinto Concesionado & Aduanas Internacionales',
    solucion_gama: 'Control de acceso vehicular LPR para camiones internacionales, torniquetes y televigilancia unificada',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'V Región - Los Andes (Puerto Terrestre PTLA)',
    empresa: 'PTLA Área Operacional y Andenes',
    contacto: 'Rodrigo Garay Vargas (Jefe de Andenes)',
    email: 'rgaray@ptla.cl',
    telefono: '+56 9 7749 0308',
    comuna: 'Los Andes',
    direccion: 'Carretera Los Libertadores Nº 415, Los Andes',
    rubro: 'Logística y Despacho Aduanero',
    solucion_gama: 'Detección analítica de merodeo en andenes de carga y cámaras 4K con zoom óptico',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Los Andes (Puerto Terrestre PTLA)',
    empresa: 'PTLA Recinto Depósito Aduanero (RDA)',
    contacto: 'Emilia Rojas Santis (Encargada RDA)',
    email: 'erojas@ptla.cl',
    telefono: '+56 9 7749 0312',
    comuna: 'Los Andes',
    direccion: 'Carretera Los Libertadores Nº 415, Los Andes',
    rubro: 'Almacén Aduanero de Carga de Alto Valor',
    solucion_gama: 'Control de acceso restringido biométrico y CCTV de alta seguridad con respaldo 90 días',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Los Andes (Puerto Terrestre PTLA)',
    empresa: 'PTLA Prevención de Riesgos y Seguridad',
    contacto: 'Carlos Felipe Lobos Rojas (Prevención de Riesgos)',
    email: 'clobos@ptla.cl',
    telefono: '+56 9 4265 0442',
    comuna: 'Los Andes',
    direccion: 'Carretera Los Libertadores Nº 415, Los Andes',
    rubro: 'Seguridad Patrimonial & HSE',
    solucion_gama: 'Rondas de supervisión con Guardias OS-10 y enlaces prioritarios de emergencia',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'V Región - Los Andes (Aconcagua)',
    empresa: 'Agrícola & Frutícola Valle Aconcagua SpA',
    contacto: 'Ing. Patricio Donoso (Gerente Operaciones)',
    email: 'operaciones@valleaconcagua.cl',
    telefono: '+56 34 242 1100',
    comuna: 'Los Andes',
    direccion: 'Camino Internacional Km 12, Los Andes',
    rubro: 'Agroindustria & Packing de Frutas',
    solucion_gama: 'Cámaras térmicas en cerco perimetral de 2 km, sensores de movimiento y control de cosecheros',
    prioridad: 'Alta - Inmediata'
  },

  // =========================================================================
  // REGIÓN METROPOLITANA: PUDAHUEL (ENEA CIUDAD AEROPUERTO & CENTROS LOGÍSTICOS)
  // (CONSERVADOS TAL COMO PIDIÓ EL USUARIO)
  // =========================================================================
  {
    zona_meta_ads: 'RM - Pudahuel (ENEA Ciudad Aeropuerto)',
    empresa: 'Bodenor Flexcenter ENEA',
    contacto: 'Subgerente de Seguridad Patrimonial',
    email: 'contacto@bodenorflexcenter.cl',
    telefono: '+56 2 2601 0601',
    comuna: 'Pudahuel',
    direccion: 'Av. Américo Vespucio 0100, ENEA',
    rubro: 'Centros Logísticos de Bodegas',
    solucion_gama: 'Guardias de seguridad OS-10 híbridos + Control LPR de accesos de camiones y monitoreo 24/7',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Pudahuel (ENEA Ciudad Aeropuerto)',
    empresa: 'Blue Express Hub Central ENEA',
    contacto: 'Supervisor de Seguridad Patrimonial',
    email: 'operaciones@blue.cl',
    telefono: '+56 2 2840 7000',
    comuna: 'Pudahuel',
    direccion: 'Av. Los Maitenes Poniente 1300, ENEA',
    rubro: 'Couriers & Encomiendas',
    solucion_gama: 'CCTV analítico con detección de merodeo en andenes de carga y control biométrico de choferes',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Pudahuel (ENEA Ciudad Aeropuerto)',
    empresa: 'DHL Global Forwarding Chile',
    contacto: 'Gerente de Seguridad de Carga',
    email: 'contacto.chile@dhl.com',
    telefono: '+56 2 2694 5000',
    comuna: 'Pudahuel',
    direccion: 'Av. El Retiro 1255, ENEA',
    rubro: 'Transporte Aéreo & Carga Internacional',
    solucion_gama: 'Integración de control de acceso restringido, torniquetes ópticos y CCTV con respaldo 60 días',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'RM - Pudahuel (ENEA Ciudad Aeropuerto)',
    empresa: 'Chilexpress Centro de Distribución Aeropuerto',
    contacto: 'Jefe de Seguridad e Infraestructura',
    email: 'seguridad@chilexpress.cl',
    telefono: '+56 2 2570 0000',
    comuna: 'Pudahuel',
    direccion: 'Av. Los Maitenes 1100, ENEA',
    rubro: 'Logística & Paquetería',
    solucion_gama: 'Monitoreo de alta definición con IA para prevención de mermas y auditoría de paquetes',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Pudahuel (ENEA Ciudad Aeropuerto)',
    empresa: 'Starken Centro Clasificación Poniente',
    contacto: 'Jefe de Operaciones Santiago Poniente',
    email: 'atencion@starken.cl',
    telefono: '+56 2 2362 2000',
    comuna: 'Pudahuel',
    direccion: 'Av. Américo Vespucio 1385, ENEA',
    rubro: 'Courier & Carga Terrestre',
    solucion_gama: 'Detección perimetral con cámaras térmicas, botones de pánico en andén y CRA 24/7 Gama',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Pudahuel (Aeropuerto)',
    empresa: 'Megacentro Aeropuerto',
    contacto: 'Administrador de Complejo',
    email: 'contacto@megacentro.cl',
    telefono: '+56 2 2828 0000',
    comuna: 'Pudahuel',
    direccion: 'Av. Boulevard Aeropuerto Sur 9640, Pudahuel',
    rubro: 'Bodegas & Minibodegas',
    solucion_gama: 'Control vehicular automatizado por TAG, televigilancia permanente y rondas de supervisores',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Pudahuel (Aeropuerto)',
    empresa: 'Courtyard by Marriott Santiago Airport',
    contacto: 'Gerente de Operaciones y Seguridad',
    email: 'recepcion@courtyardairport.cl',
    telefono: '+56 2 2488 4000',
    comuna: 'Pudahuel',
    direccion: 'Av. Américo Vespucio 1320, Pudahuel',
    rubro: 'Hotelería Corporativa',
    solucion_gama: 'Monitoreo de estacionamientos abiertos, áreas comunes y botón de alerta silenciosa en recepción',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'RM - Pudahuel (Las Esteras)',
    empresa: 'Corrupac Embalajes Industriales',
    contacto: 'Jefe de Mantenimiento y Prevención',
    email: 'contacto@corrupac.cl',
    telefono: '+56 2 2484 2100',
    comuna: 'Pudahuel',
    direccion: 'Calle Las Esteras Norte 2500, Pudahuel',
    rubro: 'Manufactura de Papeles & Embalajes',
    solucion_gama: 'Sistema anti-intrusión perimetral, detección de conatos térmicos y control de contratistas',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Pudahuel (ENEA Ciudad Aeropuerto)',
    empresa: 'Bosch Rexroth Chile',
    contacto: 'Facility Manager & Infraestructura',
    email: 'contacto@boschrexroth.cl',
    telefono: '+56 2 2786 8000',
    comuna: 'Pudahuel',
    direccion: 'Av. Boulevard Aeropuerto Sur 9650, ENEA',
    rubro: 'Ingeniería & Automatización',
    solucion_gama: 'Alarma conectada a central Gama con verificación visual remota y guardias de control',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Pudahuel (ENEA Ciudad Aeropuerto)',
    empresa: 'Empack Soluciones de Envasado',
    contacto: 'Jefe de Bodega Central',
    email: 'info@empack.cl',
    telefono: '+56 2 2690 9900',
    comuna: 'Pudahuel',
    direccion: 'Av. Américo Vespucio 1221, ENEA',
    rubro: 'Packaging & Maquinaria',
    solucion_gama: 'Control de acceso por credencial de proximidad en almacén de insumos de alto valor',
    prioridad: 'Media'
  },

  // =========================================================================
  // REGIÓN METROPOLITANA: QUILICURA, HUECHURABA, SAN BERNARDO, MAIPÚ & LAMPA
  // (CONSERVADOS TAL COMO PIDIÓ EL USUARIO)
  // =========================================================================
  {
    zona_meta_ads: 'RM - Quilicura (Parque Industrial San Ignacio)',
    empresa: 'Parque Industrial San Ignacio Quilicura',
    contacto: 'Administrador General de Recinto',
    email: 'administracion@parquesanignacio.cl',
    telefono: '+56 2 2738 8800',
    comuna: 'Quilicura',
    direccion: 'Av. San Ignacio 500, Quilicura',
    rubro: 'Parques Industriales',
    solucion_gama: 'Cerco eléctrico de 8 líneas, cámaras térmicas y servicio de Guardias OS-10 en caseta',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Quilicura (Frei Montalva)',
    empresa: 'Centro de Distribución Logística Quilicura SpA',
    contacto: 'Jefe de Prevención de Pérdidas',
    email: 'seguridad@logisticaquilicura.cl',
    telefono: '+56 2 2480 3300',
    comuna: 'Quilicura',
    direccion: 'Av. Eduardo Frei Montalva 9600, Quilicura',
    rubro: 'Bodegaje & Gran Distribución',
    solucion_gama: 'Cámaras LPR de alta velocidad para lectura de matrículas y control de barreras pesadas',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Huechuraba (Ciudad Empresarial)',
    empresa: 'Ciudad Empresarial Hub Corporativo',
    contacto: 'Administrador de Edificios Corporativos',
    email: 'administracion@ciudadempresarial.cl',
    telefono: '+56 2 2750 9000',
    comuna: 'Huechuraba',
    direccion: 'Av. del Parque 4160, Huechuraba',
    rubro: 'Corporativo & Oficinas B2B',
    solucion_gama: 'Control de acceso con reconocimiento facial, torniquetes y circuito cerrado 4K en halls',
    prioridad: 'Estratégica'
  },
  {
    zona_meta_ads: 'RM - San Bernardo (Nos / Panamericana)',
    empresa: 'Parque Logístico San Bernardo - Nos',
    contacto: 'Jefe de Seguridad de Planta',
    email: 'operaciones@parquesanbernardo.cl',
    telefono: '+56 2 2858 7700',
    comuna: 'San Bernardo',
    direccion: 'Panamericana Sur Km 23, San Bernardo',
    rubro: 'Logística & Agroindustria',
    solucion_gama: 'Detección perimetral temprana y supervisión de accesos de carga pesada con guardias',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Maipú (Camino a Melipilla)',
    empresa: 'Parque Industrial Maipú - Camino Melipilla',
    contacto: 'Administrador de Recinto Industrial',
    email: 'contacto@parquemaipu.cl',
    telefono: '+56 2 2531 4400',
    comuna: 'Maipú',
    direccion: 'Camino a Melipilla 10800, Maipú',
    rubro: 'Industrial Liviano & Talleres',
    solucion_gama: 'Alarma inteligente con verificación de video y patrullaje virtual en horarios nocturnos',
    prioridad: 'Alta - Inmediata'
  },
  {
    zona_meta_ads: 'RM - Lampa (Valle Grande)',
    empresa: 'Parque Logístico Lampa - Valle Grande',
    contacto: 'Director de Seguridad Patrimonial',
    email: 'gerencia@vallegrandelog.cl',
    telefono: '+56 2 2738 1200',
    comuna: 'Lampa',
    direccion: 'Av. La Montaña 1200, Valle Grande, Lampa',
    rubro: 'Centros de Distribución & Logística',
    solucion_gama: 'Cerco perimetral electrificado monitoreado 24/7 y cámaras térmicas anti-robo de carga',
    prioridad: 'Alta - Inmediata'
  }
];

function buildExcel() {
  const desktopDir = 'C:\\Users\\tetor\\Desktop';
  const excelPath = path.join(desktopDir, 'Leads_Gama_Seguridad_MetaAds.xlsx');
  const csvPath = path.join(desktopDir, 'Leads_Gama_Seguridad_MetaAds.csv');

  console.log(`Generando prospectos para Gama Seguridad... Total: ${LEADS.length}`);

  // 1. Sheet: Leads
  const sheet1Data = LEADS.map((lead, index) => ({
    'N°': index + 1,
    'Zona Meta Ads': lead.zona_meta_ads,
    'Empresa / Razón Social': lead.empresa,
    'Contacto / Cargo': lead.contacto,
    'Email de Contacto': lead.email,
    'Teléfono': lead.telefono,
    'Comuna': lead.comuna,
    'Dirección': lead.direccion,
    'Rubro / Segmento': lead.rubro,
    'Solución Gama Seguridad Recomendada': lead.solucion_gama,
    'Prioridad Comercial': lead.prioridad
  }));

  const wsLeads = xlsx.utils.json_to_sheet(sheet1Data);

  // Column widths
  wsLeads['!cols'] = [
    { wch: 5 },   // N°
    { wch: 42 },  // Zona Meta Ads
    { wch: 44 },  // Empresa
    { wch: 38 },  // Contacto
    { wch: 34 },  // Email
    { wch: 18 },  // Teléfono
    { wch: 18 },  // Comuna
    { wch: 48 },  // Dirección
    { wch: 34 },  // Rubro
    { wch: 78 },  // Solución Gama
    { wch: 20 }   // Prioridad
  ];

  // 2. Sheet: Resumen por Zona
  const zonaCounts = {};
  LEADS.forEach(l => {
    zonaCounts[l.zona_meta_ads] = (zonaCounts[l.zona_meta_ads] || 0) + 1;
  });

  const sheet2Data = Object.entries(zonaCounts).map(([zona, count]) => ({
    'Zona Meta Ads': zona,
    'Cantidad de Prospectos': count,
    'Foco de Seguridad Principal': zona.includes('El Salto') || zona.includes('Placilla') || zona.includes('Curauma') || zona.includes('Belloto') || zona.includes('ENEA') || zona.includes('Quilicura') || zona.includes('PTLA')
      ? 'Monitoreo CCTV 24/7 con IA + Cámaras Térmicas + Guardias OS-10 + Control LPR'
      : zona.includes('Reñaca') || zona.includes('Bosques de Montemar') || zona.includes('Higuerillas') || zona.includes('Cariló')
      ? 'Conserjería Remota Virtual + Control de Acceso Biométrico + Barreras Automáticas'
      : zona.includes('Quillota') || zona.includes('La Calera') || zona.includes('Casablanca') || zona.includes('Los Andes')
      ? 'Protección Perimetral Agroindustrial + Cámaras Frigoríficas + Detección de Cruce de Línea'
      : 'CCTV 4K + Detección Perimetral Anti-Intrusión + Central CRA 24/7'
  }));

  const wsResumen = xlsx.utils.json_to_sheet(sheet2Data);
  wsResumen['!cols'] = [
    { wch: 48 },
    { wch: 24 },
    { wch: 75 }
  ];

  // 3. Sheet: Argumentario y Servicios Gama
  const sheet3Data = [
    {
      'Servicio Gama': 'Monitoreo de Alarmas 24/7 (CRA)',
      'Ventaja Competitiva': 'Respuesta inmediata verificada con audio/video en tiempo real, enlace directo a Carabineros y Plan Cuadrante en la V Región.',
      'Target Ideal': 'Empresas, Galpones, Centros Médicos, Locales Comerciales, Strip Centers.'
    },
    {
      'Servicio Gama': 'Cámaras Térmicas y Analítica con IA',
      'Ventaja Competitiva': 'Detección precisa de intrusos a más de 100m en oscuridad total, niebla o lluvia, eliminando falsas alarmas.',
      'Target Ideal': 'Patios logísticos, Bodegas El Salto, Placilla, Curauma, PTLA Los Andes, Casablanca.'
    },
    {
      'Servicio Gama': 'Guardias de Seguridad OS-10',
      'Ventaja Competitiva': 'Personal certificado con credencial al día, control de acceso estricto y rondas georreferenciadas con supervisión en terreno.',
      'Target Ideal': 'Parques Industriales, Condominios Corporativos, Faenas de Construcción y Puertos.'
    },
    {
      'Servicio Gama': 'Control de Acceso Vehicular (LPR) y Peatonal',
      'Ventaja Competitiva': 'Lectura automática de placas de camiones, torniquetes biométricos y trazabilidad completa de contratistas y visitantes.',
      'Target Ideal': 'Centros de distribución, condominios residenciales en Reñaca/Concón y terminales portuarios.'
    },
    {
      'Servicio Gama': 'Conserjería Virtual & Totem Remoto',
      'Ventaja Competitiva': 'Ahorro de hasta un 60% en costos de conserjería física tradicional con atención interactiva y registro audiovisual 24/7.',
      'Target Ideal': 'Edificios y condominios en Reñaca, Viña del Mar, Concón y Bosques de Montemar.'
    }
  ];

  const wsServicios = xlsx.utils.json_to_sheet(sheet3Data);
  wsServicios['!cols'] = [
    { wch: 35 },
    { wch: 68 },
    { wch: 50 }
  ];

  // Create workbook
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, wsLeads, 'Prospectos Meta Ads');
  xlsx.utils.book_append_sheet(wb, wsResumen, 'Resumen por Zona');
  xlsx.utils.book_append_sheet(wb, wsServicios, 'Servicios Gama');

  // Write Excel
  xlsx.writeFile(wb, excelPath);
  console.log(`[OK] Archivo Excel creado exitosamente en: ${excelPath}`);

  // Write CSV with UTF-8 BOM
  const csvHeaders = ['N°', 'Zona Meta Ads', 'Empresa', 'Contacto', 'Email', 'Telefono', 'Comuna', 'Direccion', 'Rubro', 'Solucion Gama', 'Prioridad'];
  const csvRows = LEADS.map((l, i) => [
    i + 1,
    `"${l.zona_meta_ads.replace(/"/g, '""')}"`,
    `"${l.empresa.replace(/"/g, '""')}"`,
    `"${l.contacto.replace(/"/g, '""')}"`,
    `"${l.email.replace(/"/g, '""')}"`,
    `"${l.telefono.replace(/"/g, '""')}"`,
    `"${l.comuna.replace(/"/g, '""')}"`,
    `"${l.direccion.replace(/"/g, '""')}"`,
    `"${l.rubro.replace(/"/g, '""')}"`,
    `"${l.solucion_gama.replace(/"/g, '""')}"`,
    `"${l.prioridad.replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [csvHeaders.join(';')].concat(csvRows.map(r => r.join(';'))).join('\r\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`[OK] Archivo CSV creado exitosamente en: ${csvPath}`);
}

buildExcel();

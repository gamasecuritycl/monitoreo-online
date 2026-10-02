const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const logoPath = path.join(__dirname, '..', 'public', 'logo-gama.png');
let logoBase64 = '';
if (fs.existsSync(logoPath)) {
  logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
}

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Presentación Corporativa - Gama Seguridad</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600;700&display=swap');

    @page {
      size: letter portrait;
      margin: 10mm 14mm 10mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-size: 12px;
      line-height: 1.5;
    }

    .page {
      width: 100%;
      height: 254mm;
      max-height: 254mm;
      overflow: hidden;
      position: relative;
      page-break-inside: avoid;
      break-after: page;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 0;
    }

    .page:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    .header-logo {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-logo img {
      height: 48px;
      object-fit: contain;
    }

    .header-title-box h1 {
      font-family: 'Montserrat', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.3px;
      text-transform: uppercase;
    }

    .header-title-box p {
      margin: 2px 0 0 0;
      font-size: 11px;
      font-weight: 600;
      color: #0284c7;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .header-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }

    .header-meta strong {
      color: #0f172a;
    }

    /* FOOTER */
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
    }

    .footer a {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }

    /* SALUDO Y PRESENTACION */
    .destinatario {
      background: #f8fafc;
      border-left: 4px solid #0284c7;
      padding: 12px 16px;
      margin-bottom: 18px;
      border-radius: 0 6px 6px 0;
    }

    .destinatario h3 {
      margin: 0 0 2px 0;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      color: #0f172a;
      font-weight: 700;
    }

    .destinatario p {
      margin: 0;
      font-size: 12px;
      color: #475569;
    }

    p.lead-text {
      font-size: 13.5px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 14px;
      text-align: justify;
    }

    /* SECCIONES Y TITULOS */
    h2.section-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
      margin-top: 20px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-transform: uppercase;
    }

    h2.section-title span.badge-num {
      background: #0284c7;
      color: #ffffff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
    }

    /* GRIDS DE SERVICIOS */
    .services-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 10px;
    }

    .service-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0284c7;
      padding: 10px 14px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .service-card h4 {
      margin: 0 0 4px 0;
      font-family: 'Montserrat', sans-serif;
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .service-card p {
      margin: 0;
      font-size: 11.5px;
      color: #475569;
      line-height: 1.45;
    }

    /* BADGES DE CALIDAD */
    .values-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 16px 0;
    }

    .value-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 8px;
      text-align: center;
    }

    .value-box strong {
      display: block;
      font-family: 'Montserrat', sans-serif;
      font-size: 11.5px;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .value-box span {
      font-size: 10px;
      color: #64748b;
      line-height: 1.25;
      display: block;
    }

    /* TABLA CLIENTES */
    .table-container {
      width: 100%;
      margin-top: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    table.clients-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
    }

    table.clients-table thead th {
      background: #0f172a;
      color: #ffffff;
      font-family: 'Montserrat', sans-serif;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 12px;
      border-bottom: 2px solid #0284c7;
    }

    table.clients-table tbody td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.4;
    }

    table.clients-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    table.clients-table tbody td strong.client-name {
      display: block;
      color: #0f172a;
      font-family: 'Montserrat', sans-serif;
      font-size: 11.5px;
      font-weight: 700;
    }

    table.clients-table tbody td span.client-category {
      display: inline-block;
      font-size: 9.5px;
      background: #e0f2fe;
      color: #0369a1;
      padding: 1px 6px;
      border-radius: 3px;
      font-weight: 600;
      margin-top: 2px;
      text-transform: uppercase;
    }

    /* FICHA ANTECEDENTES */
    .info-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 18px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      row-gap: 12px;
      column-gap: 20px;
      font-size: 12px;
    }

    .info-item strong {
      display: block;
      color: #64748b;
      font-size: 10.5px;
      text-transform: uppercase;
      margin-bottom: 2px;
      font-weight: 600;
    }

    .info-item span {
      color: #0f172a;
      font-weight: 600;
      font-size: 12.5px;
    }

    /* FIRMA */
    .signature-section {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .signature-box {
      border-top: 1.5px solid #0f172a;
      padding-top: 8px;
      width: 260px;
      text-align: center;
    }

    .signature-box h4 {
      font-family: 'Montserrat', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      text-transform: uppercase;
    }

    .signature-box p {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #475569;
      font-weight: 500;
    }

    .seal-box {
      border: 1.5px dashed #0284c7;
      padding: 10px 16px;
      border-radius: 6px;
      text-align: center;
      background: #f0f9ff;
    }

    .seal-box p {
      margin: 0;
      font-family: 'Montserrat', sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: #0369a1;
      text-transform: uppercase;
    }

    .seal-box span {
      font-size: 10px;
      color: #0284c7;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1 ================= -->
  <div class="page">
    <div>
      <div class="header">
        <div class="header-logo">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Gama Seguridad">` : ''}
          <div class="header-title-box">
            <h1>GAMA SEGURIDAD</h1>
            <p>Inversiones Gama SpA · Seguridad Integral & Monitoreo 24/7</p>
          </div>
        </div>
        <div class="header-meta">
          <strong>PRESENTACIÓN CORPORATIVA</strong><br>
          Valparaíso, Octubre 2026<br>
          RUT: 78.297.009-7
        </div>
      </div>

      <div class="destinatario">
        <h3>Señores</h3>
        <p><strong>Instituciones Públicas, Municipalidades, Comunidades y Empresas del Sector Privado</strong><br>
        Presente</p>
      </div>

      <p class="lead-text">
        Junto con saludar cordialmente, por medio de la presente tenemos el agrado de presentar a <strong>INVERSIONES GAMA SpA (GAMA SEGURIDAD)</strong>, empresa chilena especializada en seguridad electrónica integral, televigilancia de alta definición con Inteligencia Artificial, instalación y mantención de sistemas perimetrales y corrientes débiles, y operación ininterrumpida de nuestra <strong>Central Receptora de Alarmas (CRA 24/7)</strong>.
      </p>

      <p class="lead-text">
        Nuestra organización nace con el propósito de resolver de manera efectiva, confiable y tecnológicamente avanzada las demandas de protección de comunidades residenciales, universidades, establecimientos educacionales, fundaciones de desarrollo social, plantas industriales e instituciones gubernamentales a lo largo de la <strong>Región de Valparaíso y la zona central del país</strong>.
      </p>

      <p class="lead-text">
        Bajo el liderazgo de su Director, <strong>Tomás Toro-Moreno O.</strong>, y un equipo de ingenieros y especialistas con más de 12 años de trayectoria técnica y operativa en el rubro, en Gama Seguridad diseñamos proyectos a la medida de cada instalación, priorizando la máxima continuidad operativa, el tiempo de respuesta inmediato ante emergencias y el cumplimiento riguroso de la normativa nacional.
      </p>

      <h2 class="section-title"><span class="badge-num">1</span> Pilares de Nuestra Propuesta de Valor</h2>

      <div class="values-row">
        <div class="value-box">
          <strong>Central CRA 24/7/365</strong>
          <span>Respuesta humana verificada en &lt; 2 minutos con enlace a Carabineros</span>
        </div>
        <div class="value-box">
          <strong>Equipos en Propiedad</strong>
          <span>Sin contratos forzosos de arriendo. El hardware es 100% del cliente</span>
        </div>
        <div class="value-box">
          <strong>Certificación OS-10 & SEC</strong>
          <span>Técnicos calificados y cercos bajo estricta normativa de seguridad</span>
        </div>
        <div class="value-box">
          <strong>Soporte Local Express</strong>
          <span>Móviles y personal técnico con base permanente en la V Región</span>
        </div>
      </div>

      <h2 class="section-title"><span class="badge-num">2</span> Modalidades de Servicio Operativo</h2>
      <p class="lead-text" style="margin-bottom: 0;">
        Además de proyectos de implementación desde cero, ofrecemos contratos de <strong>Mantención Preventiva y Correctiva</strong>, auditorías de vulnerabilidad técnica, modernización de sistemas análogos a tecnología IP de alta resolución y planes integrales de contingencia para recintos de alta criticidad.
      </p>
    </div>

    <div class="footer">
      <span>Inversiones Gama SpA · RUT: 78.297.009-7 · Av. Valparaíso 351 LC, Villa Alemana</span>
      <span>Página 1 de 5 · <a href="https://www.gamasecurity.cl">www.gamasecurity.cl</a></span>
    </div>
  </div>

  <!-- ================= PAGE 2 ================= -->
  <div class="page">
    <div>
      <div class="header">
        <div class="header-logo">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Gama Seguridad">` : ''}
          <div class="header-title-box">
            <h1>GAMA SEGURIDAD</h1>
            <p>Capacidades Técnicas y Cartera de Servicios Especializados</p>
          </div>
        </div>
        <div class="header-meta">
          <strong>DIVISIÓN SEGURIDAD ELECTRÓNICA</strong><br>
          Fono: +56 9 9101 6912<br>
          contacto@gamasecurity.cl
        </div>
      </div>

      <h2 class="section-title" style="margin-top: 0;"><span class="badge-num">3</span> Catálogo Integral de Soluciones de Seguridad</h2>

      <div class="services-grid">
        <div class="service-card">
          <h4>🚨 Central Receptora de Alarmas (CRA 24/7)</h4>
          <p>Monitoreo ininterrumpido los 365 días del año con video-verificación en tiempo real. Enlace prioritario con Carabineros de Chile (Plan Cuadrante), Bomberos y SAMU. Control total vía App Móvil.</p>
        </div>

        <div class="service-card">
          <h4>📹 Circuitos Cerrados de TV (CCTV) con IA</h4>
          <p>Cámaras IP 4K, térmicas de largo alcance y domos PTZ 360°. Analítica con Inteligencia Artificial: detección de merodeo, cruce de línea, reconocimiento de matrículas vehiculares (LPR) y conteo de aforo.</p>
        </div>

        <div class="service-card">
          <h4>⚡ Cercos Eléctricos Perimetrales (Norma SEC)</h4>
          <p>Instalación y mantención de cercos de 6 a 12 hebras con energizadores microprocesados, baterías de respaldo y zonificación. Máxima disuasión física y corte perimetral certificado.</p>
        </div>

        <div class="service-card">
          <h4>🚪 Control de Acceso Peatonal y Vehicular</h4>
          <p>Torniquetes bidireccionales, barreras vehiculares de alto tráfico, lectores biométricos (reconocimiento facial y dactilar), tarjetas de proximidad RFID y apertura automatizada por TAG.</p>
        </div>

        <div class="service-card">
          <h4>🏢 Conserjería Virtual Remota & Videoportería</h4>
          <p>Solución tecnológica para comunidades y condominios que reduce hasta en un 60% el gasto común en conserjería tradicional, manteniendo registro audiovisual y control interactivo 24/7.</p>
        </div>

        <div class="service-card">
          <h4>🛡️ Guardias de Seguridad Privada (OS-10)</h4>
          <p>Personal certificado por Carabineros de Chile para control de casetas, faenas y recintos corporativos. Rondas de supervisión georreferenciadas y apoyo conjunto con televigilancia.</p>
        </div>

        <div class="service-card">
          <h4>🔥 Detección Temprana y Combate de Incendio</h4>
          <p>Centrales de incendio convencionales y direccionables bajo normativa NFPA. Sensores de humo fotoeléctricos, sensores térmicos, pulsadores manuales de emergencia y sirenas estroboscópicas.</p>
        </div>

        <div class="service-card">
          <h4>🌐 Fibra Óptica, Redes y Corrientes Débiles</h4>
          <p>Tendido y fusionado de fibra óptica monomodo/multimodo para enlaces de larga distancia, cableado estructurado categoría 6A/7, ordenamiento de racks y enlaces inalámbricos punto a punto.</p>
        </div>
      </div>

      <h2 class="section-title"><span class="badge-num">4</span> Compromiso con la Continuidad Operativa</h2>
      <p class="lead-text">
        Entendemos que la seguridad no admite interrupciones. Por ello, nuestras instalaciones incorporan <strong>sistemas de respaldo energético autónomo (UPS y baterías de gel de larga vida útil)</strong> y canales de transmisión redundante multivia (Wi-Fi, Ethernet, Red Celular 4G y DTMF), garantizando que las alertas se transmitan instantáneamente incluso ante cortes de luz intencionados o caídas de internet.
      </p>

      <div class="destinatario" style="margin-top: 14px; margin-bottom: 0;">
        <h3 style="font-size: 13px;">Cumplimiento Legal y Proveedor Mercado Público</h3>
        <p style="font-size: 11.5px;">Inversiones Gama SpA se encuentra plenamente habilitada en el portal <strong>Mercado Público / ChileCompra</strong>, cumpliendo con todos los estándares laborales, tributarios y de acreditación técnica exigidos por el Estado de Chile.</p>
      </div>
    </div>

    <div class="footer">
      <span>Inversiones Gama SpA · RUT: 78.297.009-7 · Av. Valparaíso 351 LC, Villa Alemana</span>
      <span>Página 2 de 5 · <a href="https://www.gamasecurity.cl">www.gamasecurity.cl</a></span>
    </div>
  </div>

  <!-- ================= PAGE 3 ================= -->
  <div class="page">
    <div>
      <div class="header">
        <div class="header-logo">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Gama Seguridad">` : ''}
          <div class="header-title-box">
            <h1>GAMA SEGURIDAD</h1>
            <p>Experiencia Comprobada en Instituciones y Empresas (Parte I)</p>
          </div>
        </div>
        <div class="header-meta">
          <strong>PORTAFOLIO DE CLIENTES</strong><br>
          Valparaíso · Viña del Mar · Quilpué<br>
          RUT: 78.297.009-7
        </div>
      </div>

      <h2 class="section-title" style="margin-top: 0;"><span class="badge-num">5</span> Nómina de Clientes y Proyectos Emblemáticos</h2>
      <p class="lead-text" style="margin-bottom: 12px;">
        La confianza depositada por las siguientes entidades avala nuestra capacidad técnica, rigurosidad profesional y excelencia en la ejecución de contratos de alta exigencia:
      </p>

      <div class="table-container">
        <table class="clients-table">
          <thead>
            <tr>
              <th style="width: 32%;">Institución / Empresa</th>
              <th style="width: 20%;">Segmento</th>
              <th style="width: 48%;">Servicios y Soluciones Implementadas por Gama</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong class="client-name">Pontificia Universidad Católica de Valparaíso (PUCV)</strong>
                <span class="client-category">Educación Superior</span>
              </td>
              <td>Valparaíso / Viña del Mar</td>
              <td>Monitoreo centralizado 24/7 de sistemas de alarma de intrusión y televigilancia CCTV en diversas sedes universitarias, centros de extensión y laboratorios docentes.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Fundación Integra (V Región)</strong>
                <span class="client-category">Educación Inicial</span>
              </td>
              <td>Región de Valparaíso</td>
              <td>Protección perimetral integral, sistemas de alarma anti-intrusión y mantenimiento continuo en salas cuna y jardines infantiles de la región, resguardando la primera infancia.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Colegio Árabe de Viña del Mar</strong>
                <span class="client-category">Establecimiento Educacional</span>
              </td>
              <td>Viña del Mar</td>
              <td>Circuito cerrado de televisión (CCTV) en accesos y patios, control de ingreso escolar y pulsadores de pánico conectados directamente a nuestra Central de Monitoreo.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Colegio Montessori de Viña del Mar</strong>
                <span class="client-category">Establecimiento Educacional</span>
              </td>
              <td>Viña del Mar</td>
              <td>Sistema de detección perimetral de intrusión fuera de horario de clases, televigilancia interna y control de acceso peatonal para comunidad educativa.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Colegio Sagrada Familia de Valparaíso</strong>
                <span class="client-category">Establecimiento Educacional</span>
              </td>
              <td>Valparaíso</td>
              <td>Instalación y monitoreo de sistemas de alarma de intrusión con verificación remota, cámaras de alta resolución en zonas comunes y protocolos de emergencia escolar.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Fundación Talita Kum</strong>
                <span class="client-category">Fundación Social</span>
              </td>
              <td>La Florida, Placeres, Quilicura</td>
              <td>Seguridad electrónica integral, monitoreo 24/7 y servicio técnico preventivo en centros de atención residencial y hogares de acogida para menores de edad.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Fundación Coanil</strong>
                <span class="client-category">Inclusión & Social</span>
              </td>
              <td>Zona Central</td>
              <td>Sistemas de seguridad electrónica adaptados y monitoreo 24/7 en centros residenciales y ocupacionales para personas en situación de discapacidad intelectual.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Corporación Prodere</strong>
                <span class="client-category">Corporación de Apoyo</span>
              </td>
              <td>Región de Valparaíso</td>
              <td>Monitoreo de alarmas, televigilancia perimetral y verificación de aperturas y cierres en dependencias de reinserción y programas de apoyo comunitario.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Corporación Prodel</strong>
                <span class="client-category">Desarrollo Local</span>
              </td>
              <td>Región de Valparaíso</td>
              <td>Protección electrónica, alarmas silenciosas y circuito de cámaras en sedes de intervención comunitaria y centros de administración especializada.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      <span>Inversiones Gama SpA · RUT: 78.297.009-7 · Av. Valparaíso 351 LC, Villa Alemana</span>
      <span>Página 3 de 5 · <a href="https://www.gamasecurity.cl">www.gamasecurity.cl</a></span>
    </div>
  </div>

  <!-- ================= PAGE 4 ================= -->
  <div class="page">
    <div>
      <div class="header">
        <div class="header-logo">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Gama Seguridad">` : ''}
          <div class="header-title-box">
            <h1>GAMA SEGURIDAD</h1>
            <p>Experiencia Comprobada en Instituciones y Empresas (Parte II)</p>
          </div>
        </div>
        <div class="header-meta">
          <strong>PORTAFOLIO DE CLIENTES</strong><br>
          Industria · Salud · Comercio<br>
          RUT: 78.297.009-7
        </div>
      </div>

      <h2 class="section-title" style="margin-top: 0;"><span class="badge-num">6</span> Clientes Corporativos, Industriales y Comerciales</h2>

      <div class="table-container">
        <table class="clients-table">
          <thead>
            <tr>
              <th style="width: 32%;">Institución / Empresa</th>
              <th style="width: 20%;">Segmento</th>
              <th style="width: 48%;">Servicios y Soluciones Implementadas por Gama</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong class="client-name">Corporación de Asistencia Judicial (CAJVAL)</strong>
                <span class="client-category">Institución Pública</span>
              </td>
              <td>Región de Valparaíso</td>
              <td>Instalación de sistemas de seguridad electrónica, alarmas con pulsadores de asalto en centros de atención jurídica ciudadana y mediación vecinal.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">MT Ingeniería</strong>
                <span class="client-category">Ingeniería & Construcción</span>
              </td>
              <td>Industrial</td>
              <td>Seguridad perimetral, control de accesos de personal técnico y monitoreo 24/7 de talleres, oficinas y bodegas de equipamiento de ingeniería.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Inmobiliaria Queltehue S.A.</strong>
                <span class="client-category">Desarrollo Inmobiliario</span>
              </td>
              <td>Condominios & Edificación</td>
              <td>Implementación de cercos eléctricos perimetrales, portones automáticos de alto tráfico y CCTV centralizado en proyectos habitacionales y condominios.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Biotecnos S.A.</strong>
                <span class="client-category">Biotecnología & Laboratorios</span>
              </td>
              <td>I+D & Farmacéutica</td>
              <td>Control de acceso biométrico restringido en laboratorios de biotecnología aplicada, monitoreo 24/7 de áreas críticas y circuito de cámaras de ultra alta definición.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Inmobiliaria Torquemada S.A.</strong>
                <span class="client-category">Parques Industriales</span>
              </td>
              <td>Concón / Torquemada</td>
              <td>Televigilancia perimetral, cerco eléctrico inteligente y resguardo de condominios industriales y loteos empresariales en el sector de Concón.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Centro Regional CREAS</strong>
                <span class="client-category">Investigación & Alimentos</span>
              </td>
              <td>Centro Científico I+D</td>
              <td>Monitoreo de laboratorios y plantas piloto de desarrollo alimentario saludable, alarmas perimetrales y control de accesos a dependencias científicas.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Copec Marga Marga Quilpué</strong>
                <span class="client-category">Estación de Servicio</span>
              </td>
              <td>Quilpué</td>
              <td>CCTV 4K de alta velocidad en pistas de combustible, tienda de conveniencia Pronto y pulsadores de asalto de acción inmediata conectados a CRA.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Óptica Bellamar</strong>
                <span class="client-category">Comercial & Retail</span>
              </td>
              <td>Salud Visual</td>
              <td>Alarma comercial anti-robo con sensores de rotura de cristal, pulsadores de asalto en sala de ventas y videoverificación humana remota.</td>
            </tr>
            <tr>
              <td>
                <strong class="client-name">Iglesia Cristiana Pentecostal de Valparaíso</strong>
                <span class="client-category">Entidad Religiosa & Social</span>
              </td>
              <td>Valparaíso</td>
              <td>Monitoreo de alarmas, resguardo perimetral de templo central y dependencias comunitarias, garantizando la seguridad de feligreses y bienes eclesiásticos.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="destinatario" style="margin-top: 14px; margin-bottom: 0;">
        <p style="font-size: 11px; text-align: center;">
          <em>* Contamos adicionalmente con más de 300 clientes activos en comunidades de edificios, parcelaciones, colegios públicos y empresas privadas en toda la zona central.</em>
        </p>
      </div>
    </div>

    <div class="footer">
      <span>Inversiones Gama SpA · RUT: 78.297.009-7 · Av. Valparaíso 351 LC, Villa Alemana</span>
      <span>Página 4 de 5 · <a href="https://www.gamasecurity.cl">www.gamasecurity.cl</a></span>
    </div>
  </div>

  <!-- ================= PAGE 5 ================= -->
  <div class="page">
    <div>
      <div class="header">
        <div class="header-logo">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Gama Seguridad">` : ''}
          <div class="header-title-box">
            <h1>GAMA SEGURIDAD</h1>
            <p>Ficha de Antecedentes Comerciales y Formalización</p>
          </div>
        </div>
        <div class="header-meta">
          <strong>ANTECEDENTES COMERCIALES</strong><br>
          RUT: 78.297.009-7<br>
          Valparaíso, Chile
        </div>
      </div>

      <h2 class="section-title" style="margin-top: 0;"><span class="badge-num">7</span> Ficha de Identificación Comercial</h2>

      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <strong>Razón Social Oficial:</strong>
            <span>INVERSIONES GAMA SpA</span>
          </div>

          <div class="info-item">
            <strong>Nombre de Fantasía:</strong>
            <span>GAMA SEGURIDAD</span>
          </div>

          <div class="info-item">
            <strong>RUT Tributario:</strong>
            <span>78.297.009-7</span>
          </div>

          <div class="info-item">
            <strong>Giro Comercial Principal:</strong>
            <span>Servicios de Seguridad Integral, Monitoreo de Alarmas y Corrientes Débiles</span>
          </div>

          <div class="info-item">
            <strong>Dirección Comercial:</strong>
            <span>Av. Valparaíso 351 LC, Villa Alemana, Región de Valparaíso</span>
          </div>

          <div class="info-item">
            <strong>Teléfono Directo:</strong>
            <span>+56 9 9101 6912</span>
          </div>

          <div class="info-item">
            <strong>Correo Electrónico de Contacto:</strong>
            <span>contacto@gamasecurity.cl</span>
          </div>

          <div class="info-item">
            <strong>Sitio Web Oficial:</strong>
            <span>www.gamasecurity.cl / www.gamaseguridad.cl</span>
          </div>
        </div>
      </div>

      <h2 class="section-title"><span class="badge-num">8</span> Certificaciones y Estándares de Servicio</h2>

      <div class="values-row" style="margin-top: 10px; margin-bottom: 20px;">
        <div class="value-box">
          <strong>Acreditación OS-10</strong>
          <span>Empresa y protocolos en regla ante Carabineros de Chile</span>
        </div>
        <div class="value-box">
          <strong>Normativa SEC</strong>
          <span>Instalaciones eléctricas y cercos conforme a SEC</span>
        </div>
        <div class="value-box">
          <strong>Mercado Público</strong>
          <span>Proveedor oficial habilitado en compras y licitaciones del Estado</span>
        </div>
        <div class="value-box">
          <strong>Soporte Local V Región</strong>
          <span>Móviles técnicos y patrullaje de verificación presencial</span>
        </div>
      </div>

      <p class="lead-text">
        Con todo lo anteriormente expuesto, esperamos poner nuestras capacidades humanas, operativas y tecnológicas a disposición de su prestigiosa organización. Quedamos a su entera disposición para coordinar una reunión de trabajo o efectuar un levantamiento técnico en terreno sin costo.
      </p>

      <p style="margin-bottom: 30px; font-size: 13px;">Se despide muy atentamente,</p>

      <div class="signature-section">
        <div class="signature-box">
          <h4>Tomás Toro-Moreno O.</h4>
          <p><strong>DIRECTOR GENERAL</strong><br>
          Inversiones Gama SpA / Gama Seguridad<br>
          Fono: +56 9 9101 6912<br>
          contacto@gamasecurity.cl</p>
        </div>

        <div class="seal-box">
          <p>Gama Seguridad</p>
          <span>Central CRA 24/7 · Región de Valparaíso</span><br>
          <span style="font-weight: 600; color: #0f172a;">RUT: 78.297.009-7</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Inversiones Gama SpA · RUT: 78.297.009-7 · Av. Valparaíso 351 LC, Villa Alemana</span>
      <span>Página 5 de 5 · <a href="https://www.gamasecurity.cl">www.gamasecurity.cl</a></span>
    </div>
  </div>

</body>
</html>
`;

function generatePresentation() {
  const desktopDir = 'C:\\Users\\tetor\\Desktop';
  const htmlPath = path.join(desktopDir, 'Carta_Presentacion_Gama_Seguridad.html');
  const pdfPath = path.join(desktopDir, 'Carta_Presentacion_Gama_Seguridad_Instituciones_y_Empresas.pdf');

  console.log('1. Guardando archivo HTML de alta fidelidad...');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`[OK] HTML guardado en: ${htmlPath}`);

  console.log('2. Convirtiendo a PDF corporativo vectorial mediante Edge...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  try {
    execFileSync(edgePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`,
      htmlPath
    ]);

    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      console.log(`[OK] PDF generado exitosamente en: ${pdfPath} (${stats.size} bytes)`);
    } else {
      console.error('[ERROR] El archivo PDF no fue encontrado tras la ejecución.');
    }
  } catch (err) {
    console.error('[ERROR] Error al generar el PDF:', err);
  }
}

generatePresentation();

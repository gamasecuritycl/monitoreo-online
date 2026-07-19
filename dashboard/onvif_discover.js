const dgram = require('dgram');

// Payload estándar XML para descubrimiento ONVIF (WS-Discovery)
const wsDiscoveryMsg = 
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<Envelope xmlns:tds="http://www.onvif.org/ver10/device/wsdl" xmlns="http://www.w3.org/2003/05/soap-envelope">' +
    '<Header>' +
      '<MessageID xmlns="http://schemas.xmlsoap.org/ws/2004/08/addressing">uuid:9bc8fb03-2415-46aa-acda-c7c908f51a80</MessageID>' +
      '<To xmlns="http://schemas.xmlsoap.org/ws/2004/08/addressing">urn:schemas-xmlsoap-org:ws:2004:08:discovery</To>' +
      '<Action xmlns="http://schemas.xmlsoap.org/ws/2004/08/addressing">http://schemas.xmlsoap.org/ws/2004/08/discovery/Probe</Action>' +
    '</Header>' +
    '<Body>' +
      '<Probe xmlns="http://schemas.xmlsoap.org/ws/2004/08/discovery">' +
        '<Types>tds:Device</Types>' +
      '</Probe>' +
    '</Body>' +
  '</Envelope>';

const server = dgram.createSocket('udp4');
const devices = new Map();

server.on('error', (err) => {
  console.error(`Error en el socket UDP: ${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  const response = msg.toString();
  
  // Buscar URLs o IPs de cámaras en la respuesta SOAP de respuesta
  const ipMatch = response.match(/http:\/\/(\d+\.\d+\.\d+\.\d+)(:\d+)?/i);
  let ip = rinfo.address;
  if (ipMatch) {
    ip = ipMatch[1];
  }
  
  // Buscar el nombre del fabricante o modelo en la respuesta
  let hardware = 'Cámara IP / ONVIF Genérica';
  if (response.toLowerCase().includes('dahua')) {
    hardware = 'Dahua (Cámara / NVR)';
  } else if (response.toLowerCase().includes('hikvision')) {
    hardware = 'Hikvision (Cámara / NVR)';
  }
  
  if (!devices.has(ip)) {
    devices.set(ip, { ip, hardware, port: rinfo.port });
    console.log(`✨ DISPOSITIVO DETECTADO:`);
    console.log(`   📍 IP: ${ip}`);
    console.log(`   🛠  Fabricante/Info: ${hardware}`);
    console.log(`   📦 Puerto origen UDP: ${rinfo.port}`);
    console.log(`-----------------------------------------------`);
  }
});

server.bind(0, () => {
  server.setBroadcast(true);
  console.log('==================================================');
  console.log('  GAMA SEGURIDAD - ONVIF WS-DISCOVERY NUCLEAR');
  console.log('  Escaneando red local via Broadcast UDP (Puerto 3702)...');
  console.log('==================================================\n');
  
  // Enviar el paquete a la dirección de broadcast global
  const buf = Buffer.from(wsDiscoveryMsg);
  
  server.send(buf, 0, buf.length, 3702, '255.255.255.255', (err) => {
    if (err) console.error('Error al enviar a 255.255.255.255:', err);
  });
  
  // Enviar también a la dirección de broadcast del segmento 192.168.1.x
  server.send(buf, 0, buf.length, 3702, '192.168.1.255', (err) => {
    if (err) console.error('Error al enviar a 192.168.1.255:', err);
  });
  
  // Intentar una segunda ráfaga de broadcast en 1 segundo
  setTimeout(() => {
    server.send(buf, 0, buf.length, 3702, '255.255.255.255');
  }, 1000);

  // Apagar el servidor tras 5 segundos de escucha
  setTimeout(() => {
    console.log('\nEscaneo por Broadcast ONVIF finalizado.');
    if (devices.size === 0) {
      console.log('❌ No respondió ninguna cámara al broadcast UDP de ONVIF.');
    } else {
      console.log(`✅ Escaneo exitoso. Encontrado(s) ${devices.size} dispositivo(s).`);
    }
    server.close();
  }, 5000);
});

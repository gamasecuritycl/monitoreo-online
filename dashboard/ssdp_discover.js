const dgram = require('dgram');

const ssdpQuery = 
  'M-SEARCH * HTTP/1.1\r\n' +
  'HOST: 239.255.255.250:1900\r\n' +
  'MAN: "ssdp:discover"\r\n' +
  'MX: 3\r\n' +
  'ST: ssdp:all\r\n\r\n';

const client = dgram.createSocket('udp4');
const devices = new Map();

client.on('message', (msg, rinfo) => {
  const response = msg.toString();
  
  // Buscar ubicación del XML de descripción (suele contener la IP)
  const locMatch = response.match(/LOCATION:\s*(http:\/\/\d+\.\d+\.\d+\.\d+:[^\r\n]+)/i);
  let ip = rinfo.address;
  let detail = 'Dispositivo UPnP/SSDP';
  
  if (locMatch) {
    const url = locMatch[1];
    ip = url.match(/http:\/\/(\d+\.\d+\.\d+\.\d+)/)[1];
    detail = url;
  }
  
  // Filtrar si el mensaje contiene pistas de cámaras
  const isCamera = response.toLowerCase().includes('camera') || 
                   response.toLowerCase().includes('dahua') || 
                   response.toLowerCase().includes('hikvision') || 
                   response.toLowerCase().includes('nvr') ||
                   response.toLowerCase().includes('ipc');

  if (!devices.has(ip)) {
    devices.set(ip, { ip, detail, isCamera });
    console.log(`📡 DISPOSITIVO UPnP DETECTADO:`);
    console.log(`   📍 IP: ${ip}`);
    console.log(`   🔗 Location: ${detail}`);
    console.log(`   🛡️  Es probable cámara: ${isCamera ? 'SÍ' : 'NO'}`);
    console.log(`-----------------------------------------------`);
  }
});

client.bind(0, () => {
  client.setBroadcast(true);
  console.log('==================================================');
  console.log('  GAMA SEGURIDAD - ESCANER SSDP / UPnP');
  console.log('  Buscando dispositivos multimedia locales...');
  console.log('==================================================\n');
  
  const message = Buffer.from(ssdpQuery);
  
  // Enviar a la dirección multicast SSDP estándar
  client.send(message, 0, message.length, 1900, '239.255.255.250', (err) => {
    if (err) console.error('Error al enviar multicast:', err);
  });
  
  // Enviar también como broadcast plano
  client.send(message, 0, message.length, 1900, '255.255.255.255', (err) => {
    if (err) console.error('Error al enviar broadcast:', err);
  });

  setTimeout(() => {
    console.log('\nBúsqueda UPnP finalizada.');
    client.close();
  }, 4000);
});

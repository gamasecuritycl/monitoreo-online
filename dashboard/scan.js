const net = require('net');

const subnet = '192.168.1';
const ports = [554, 80, 37777];
const timeout = 1000; // 1 segundo para dar tiempo a la wifi/red
const activeHosts = [];

console.log(`Buscando dispositivos Dahua en el segmento ${subnet}.x...`);

const promises = [];

for (let i = 1; i <= 254; i++) {
  const ip = `${subnet}.${i}`;
  
  ports.forEach(port => {
    promises.push(new Promise((resolve) => {
      const socket = new net.Socket();
      
      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        let service = 'HTTP';
        if (port === 554) service = 'RTSP (Cámara/Vídeo)';
        if (port === 37777) service = 'Dahua Servicio';
        
        activeHosts.push({ ip, port, service });
        socket.destroy();
        resolve();
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve();
      });
      
      socket.on('error', () => {
        socket.destroy();
        resolve();
      });
      
      socket.connect(port, ip);
    }));
  });
}

Promise.all(promises).then(() => {
  console.log('\n--- ESCANEO FINALIZADO ---');
  if (activeHosts.length === 0) {
    console.log('No se encontró ningún dispositivo en los puertos RTSP (554), HTTP (80) o Dahua (37777).');
  } else {
    console.log('Dispositivos encontrados:\n');
    activeHosts.forEach(host => {
      console.log(`📍 IP: ${host.ip.padEnd(15)} | Puerto: ${host.port.toString().padEnd(5)} | Servicio: ${host.service}`);
    });
  }
});

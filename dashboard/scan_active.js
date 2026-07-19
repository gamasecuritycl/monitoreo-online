const net = require('net');

const targets = [
  '192.168.1.2',
  '192.168.1.3',
  '192.168.1.5',
  '192.168.1.8',
  '192.168.1.17',
  '192.168.1.21',
  '192.168.1.38'
];

const ports = [80, 554, 37777, 8000, 8899, 8080, 81];
const timeout = 1000;

console.log('Iniciando escaneo enfocado en las IPs dinámicas detectadas en la tabla ARP...\n');

const promises = [];

targets.forEach(ip => {
  ports.forEach(port => {
    promises.push(new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        console.log(`✅ PUERTO ABIERTO -> IP: ${ip.padEnd(15)} | Puerto: ${port.toString().padEnd(5)}`);
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
});

Promise.all(promises).then(() => {
  console.log('\nEscaneo enfocado finalizado.');
});

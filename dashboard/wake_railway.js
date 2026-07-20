const fetch = require('node-fetch');

async function trigger() {
  console.log('🔄 Despertando e iniciando sincronizacion del Servidor de WhatsApp en Railway...');
  try {
    const res = await fetch('https://gama-whatsapp-production.up.railway.app/api/status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    console.log('✅ Respuesta del servidor de Railway:', data);
  } catch (err) {
    console.log('❌ Error al conectar con Railway (Posiblemente iniciando...):', err.message);
  }
}

trigger();

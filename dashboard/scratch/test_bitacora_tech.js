async function testTech() {
  const endpoints = [
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&desde=2020-01-01%2000:00&hasta=2099-12-31%2023:59',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=tipos_evento',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=abonados',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=usuarios',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=ordenes',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=tickets',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=tecnicos'
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep);
      const data = await res.json();
      console.log(`\n=== Endpoint: ${ep} ===`);
      console.log('Is array:', Array.isArray(data), 'Count:', Array.isArray(data) ? data.length : typeof data);
      if (Array.isArray(data) && data.length > 0) {
        console.log('First 2 items:', JSON.stringify(data.slice(0, 2), null, 2));
      } else if (typeof data === 'object') {
        console.log('Object keys:', Object.keys(data));
      }
    } catch (e) {
      console.error(`Error on ${ep}:`, e.message);
    }
  }
}

testTech();

async function test() {
  const endpoints = [
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&q=C78E',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&abonado_cod=C78E',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&desde=2020-01-01&hasta=2099-12-31',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&desde=2025-01-01%2000:00&hasta=2027-12-31%2023:59',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&q=TALITA',
    'https://bitacora.gamasecurity.cl/api-bitacora.php?action=abonados&q=C78E',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep);
      const data = await res.json();
      console.log(`\n--- Endpoint: ${ep} ---`);
      console.log('Result count:', Array.isArray(data) ? data.length : typeof data);
      if (Array.isArray(data) && data.length > 0) {
        console.log('Sample item:', JSON.stringify(data[0], null, 2));
      }
    } catch (e) {
      console.error(`Error fetching ${ep}:`, e.message);
    }
  }
}

test();

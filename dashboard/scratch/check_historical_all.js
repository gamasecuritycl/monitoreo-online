async function check() {
  try {
    const res = await fetch('https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&desde=2020-01-01%2000:00&hasta=2099-12-31%2023:59');
    const data = await res.json();
    console.log('Total historical records:', data.length);
    
    // Find all subscriber codes in historical data
    const accounts = Array.from(new Set(data.map(d => (d.abonado_cod || '').toUpperCase().trim()))).filter(Boolean);
    console.log('Unique subscriber codes in historical bitacora:', accounts.sort());

    const c78eEvents = data.filter(d => 
      (d.abonado_cod || '').toUpperCase().includes('C78E') || 
      (d.abonado_nombre || '').toUpperCase().includes('TALITA') ||
      (d.comentario || '').toUpperCase().includes('TALITA')
    );
    console.log('Events for C78E / TALITA:', c78eEvents.length);
    if (c78eEvents.length > 0) {
      console.log(JSON.stringify(c78eEvents.slice(0, 5), null, 2));
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

check();

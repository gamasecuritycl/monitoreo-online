async function check() {
  try {
    const res = await fetch('https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&desde=2020-01-01%2000:00&hasta=2099-12-31%2023:59');
    const data = await res.json();
    
    const c7beEvents = data.filter(d => 
      (d.abonado_cod || '').toUpperCase().trim() === 'C7BE' ||
      (d.abonado_nombre || '').toUpperCase().includes('YAFEH') ||
      (d.abonado_nombre || '').toUpperCase().includes('CHAÑARAL')
    );
    
    console.log('Events for C7BE:', c7beEvents.length);
    console.log(JSON.stringify(c7beEvents, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

check();

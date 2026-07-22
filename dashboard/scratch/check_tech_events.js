async function checkTechEvents() {
  try {
    const res = await fetch('https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&desde=2020-01-01%2000:00&hasta=2099-12-31%2023:59');
    const data = await res.json();

    const eventTypes = {};
    data.forEach(item => {
      const tipo = item.tipo_nombre || 'DESCONOCIDO';
      eventTypes[tipo] = (eventTypes[tipo] || 0) + 1;
    });

    console.log('Event types in Command Center Bitacora:', eventTypes);

    // Look for technical service / failure events
    const techKeywords = ['SERVICIO', 'TECNIC', 'FALLA', 'REVISION', 'BATERIA', 'CORTE', 'REPARAC', 'PANEL', 'CAMARA', 'ZONA'];
    const techEvents = data.filter(item => {
      const text = `${item.tipo_nombre} ${item.comentario}`.toUpperCase();
      return techKeywords.some(kw => text.includes(kw));
    });

    console.log('\nTotal Technical/Support events found:', techEvents.length);
    console.log('\nSample 5 Technical Events:');
    console.log(JSON.stringify(techEvents.slice(0, 5), null, 2));

  } catch (e) {
    console.error(e);
  }
}

checkTechEvents();

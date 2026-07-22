async function run() {
  try {
    const res = await fetch('https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos');
    const data = await res.json();
    console.log('Total bitacora events returned:', data.length);
    console.log('Sample bitacora entries:', JSON.stringify(data.slice(0, 5), null, 2));
  } catch (e) {
    console.error('Error fetching bitacora:', e);
  }
}

run();

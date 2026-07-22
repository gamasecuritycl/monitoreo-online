async function run() {
  try {
    const resAll = await fetch('https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos');
    const dataAll = await resAll.json();
    console.log('Total events in API:', dataAll.length);
    console.log('Available abonado_cod values:', Array.from(new Set(dataAll.map(d => d.abonado_cod))));

    // Test query for C78E or C701
    const testAccounts = ['C78E', 'C701', 'C7A0', 'C725'];
    for (const acc of testAccounts) {
      const filtered = dataAll.filter(d => (d.abonado_cod || '').toUpperCase().trim() === acc);
      console.log(`Account ${acc} matches count: ${filtered.length}`);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

run();

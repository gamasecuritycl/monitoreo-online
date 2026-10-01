const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const ticket = '6A32B914-EAEC-4BC2-ACAB-5F8D9B91D664';

async function fetchWithRetry(url, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.Codigo === 10500) {
        // Peticiones simultaneas detectadas por ChileCompra, esperar y reintentar
        const delay = attempt * 1500;
        console.log(`   [429/10500 ChileCompra] Esperando ${delay}ms para reintentar...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return data;
    } catch (e) {
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

async function syncAllActive() {
  console.log('Fetching bulk active tenders from ChileCompra...');
  const res = await fetch('https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=activas&ticket=' + ticket);
  const data = await res.json();
  if (!data.Listado) {
    console.error('Error fetching listado:', data);
    return;
  }
  console.log('Total licitaciones activas hoy:', data.Listado.length);

  const keywords = ['SEGURIDAD', 'VIGILANCIA', 'TELEVIGILANCIA', 'CCTV', 'CAMARAS', 'CÁMARAS', 'ALARMA', 'MONITOREO', 'GUARDIAS', 'OS-10', 'OS10', 'CONTROL DE ACCESO', 'PERIMETRAL', 'SERENAZGO', 'PATRULLAJE', 'DETECCION DE INCENDIO', 'DETECCIÓN'];
  
  const deSeguridad = data.Listado.filter(l => {
    const nom = (l.Nombre || '').toUpperCase();
    return keywords.some(k => nom.includes(k));
  });

  console.log('Licitaciones de seguridad identificadas:', deSeguridad.length);

  const { data: cachedRows } = await supabase.from('eventos_monitoreo').select('evento').eq('cuenta', 'CACHE_LICITACION');
  const yaCacheadas = new Set((cachedRows || []).map(r => r.evento ? r.evento.trim().toUpperCase() : ''));

  console.log('Ya cacheadas en Supabase:', yaCacheadas.size);

  const pendientes = deSeguridad.filter(l => !yaCacheadas.has(l.CodigoExterno ? l.CodigoExterno.trim().toUpperCase() : ''));
  console.log('Pendientes por enriquecer:', pendientes.length);

  for (let i = 0; i < pendientes.length; i++) {
    const lic = pendientes[i];
    const cod = lic.CodigoExterno;
    try {
      console.log(`[${i + 1}/${pendientes.length}] Enriqueciendo ${cod} - ${lic.Nombre?.slice(0, 40)}...`);
      const detData = await fetchWithRetry(`https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${cod}&ticket=${ticket}`);
      const item = detData && detData.Listado && detData.Listado[0];
      if (item) {
        const info = {
          Organismo: item.Comprador && item.Comprador.NombreOrganismo ? item.Comprador.NombreOrganismo : 'Organismo Público',
          Region: item.Comprador && item.Comprador.RegionUnidad ? item.Comprador.RegionUnidad.trim() : 'Chile',
          Comuna: item.Comprador && item.Comprador.ComunaUnidad ? item.Comprador.ComunaUnidad.trim() : '',
          DireccionUnidad: item.Comprador && item.Comprador.DireccionUnidad ? item.Comprador.DireccionUnidad.trim() : '',
          Contacto: item.Comprador && item.Comprador.NombreUsuario ? item.Comprador.NombreUsuario.trim() : '',
          MontoEstimado: item.MontoEstimado || 0,
          FechaCierre: item.Fechas && item.Fechas.FechaCierre ? item.Fechas.FechaCierre : null,
          Descripcion: item.Descripcion ? item.Descripcion.slice(0, 500) : ''
        };

        const { error: insErr } = await supabase.from('eventos_monitoreo').insert({
          cuenta: 'CACHE_LICITACION',
          evento: cod,
          nombre_abonado: JSON.stringify(info),
          fecha_hora: new Date().toISOString()
        });

        if (insErr) console.warn('Error insertando en Supabase:', insErr);
        else console.log(`   OK -> ${info.Organismo} | ${info.Region} | $${info.MontoEstimado}`);
      } else {
        console.warn(`   No se encontró detalle para ${cod}:`, detData ? (detData.Mensaje || detData) : 'null');
      }
    } catch (err) {
      console.error(`   Error en ${cod}:`, err.message);
    }
    // 1200ms delay to keep ChileCompra API happy
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log('¡Sincronización completa!');
}

syncAllActive();

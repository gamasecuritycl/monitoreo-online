const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://onxwyrwmpjxtwlmjrosr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase
    .from('eventos_monitoreo')
    .select('id, cuenta, nombre_abonado, fecha_hora')
    .eq('cuenta', 'CAMARAS')
    .order('id', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`--- TOTAL FILAS DE CAMARAS ENCONTRADAS: ${data.length} ---`);
  data.forEach((row, i) => {
    console.log(`[#${i + 1}] ID: ${row.id} | Fecha: ${row.fecha_hora}`);
    console.log(`      Contenido: ${row.nombre_abonado}`);
  });
}

check();

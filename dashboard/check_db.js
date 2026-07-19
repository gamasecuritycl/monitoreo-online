const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://onxwyrwmpjxtwlmjrosr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase
    .from('eventos_monitoreo')
    .select('nombre_abonado')
    .eq('cuenta', 'CAMARAS')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('--- CONFIGURACION DE CAMARAS EN DB ---');
    console.log(data[0].nombre_abonado);
  } else {
    console.log('No se encontró configuración de cámaras.');
  }
}

check();

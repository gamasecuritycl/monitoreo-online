const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 1. Cargar configuración de Supabase desde .env.local
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = 'https://onxwyrwmpjxtwlmjrosr.supabase.co';
let supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+)/);
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) supabaseAnonKey = keyMatch[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('====================================================');
  console.log('      GAMA SEGURIDAD - VINCULACIÓN DE CÁMARAS IP');
  console.log('====================================================\n');

rl.question('🔑 Ingrese Cuenta del Abonado (ej. C7C9): ', (cuentaRaw) => {
  const cuenta = cuentaRaw.trim().toUpperCase();
  if (!cuenta) {
    console.error('ERROR: La cuenta no puede estar vacía.');
    rl.close();
    process.exit(1);
  }

  rl.question('🔗 Ingrese URL de Cloudflare (ej. https://xxx.trycloudflare.com): ', async (urlRaw) => {
    let url = urlRaw.trim();
    if (!url) {
      console.error('ERROR: La URL no puede estar vacía.');
      rl.close();
      process.exit(1);
    }

    // Formatear URL para asegurar que tenga el sub-stream de MediaMTX
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Quitar barras finales
    url = url.replace(/\/+$/, '');
    
    // Añadir la ruta de la cámara si no la tiene
    if (!url.endsWith('/camgama')) {
      url = url + '/camgama';
    }

    console.log(`\n⏳ Conectando con Supabase para asociar ${cuenta} → ${url}...`);

    try {
      // 1. Obtener registro de cámaras actual
      const { data, error: fetchErr } = await supabase
        .from('eventos_monitoreo')
        .select('nombre_abonado')
        .eq('cuenta', 'CAMARAS')
        .order('id', { ascending: false })
        .limit(1);

      if (fetchErr) throw fetchErr;

      let todasLasCamaras = {};
      if (data && data.length > 0) {
        todasLasCamaras = JSON.parse(data[0].nombre_abonado || '{}');
      }

      // 2. Modificar/Agregar la cámara
      todasLasCamaras[cuenta] = {
        cam01: url,
        cam02: '',
        cam03: ''
      };

      // 3. Guardar en Supabase
      const { error: upsertErr } = await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'CAMARAS',
          nombre_abonado: JSON.stringify(todasLasCamaras),
          evento: 'CONFIGURACION',
          fecha_hora: new Date().toISOString()
        });

      if (upsertErr) throw upsertErr;

      console.log('\n====================================================');
      console.log('         ✅ VINCULACIÓN EXITOSA');
      console.log('====================================================');
      console.log(` El abonado ${cuenta} ahora está asociado a:`);
      console.log(` 📹 ${url}`);
      console.log(' Ya puede abrir la video-verificación en el Dashboard.');
      console.log('====================================================\n');

    } catch (err) {
      console.error('\n❌ ERROR al guardar en Supabase:', err.message);
    } finally {
      rl.close();
    }
  });
});

const events = [
  { hora: '02:27:24', evento: 'HORA/FECHA ERRONEOS', zona: 'U/C', usuario: '' },
  { hora: '03:00:51', evento: 'HORA/FECHA ERRONEOS', zona: 'U/C', usuario: '' },
  { hora: '03:28:59', evento: 'AUTOTEST', zona: 'U/C', usuario: '' },
  { hora: '08:17:15', evento: 'ENTRADA DE PROGRAMACION', zona: 'TEC', usuario: '' },
  { hora: '08:17:18', evento: 'APERTURA', zona: '', usuario: '301' },
  { hora: '08:27:12', evento: 'SALIDA DE PROGRAMACION', zona: 'TEC', usuario: '' },
  { hora: '10:47:52', evento: 'CIERRE', zona: '', usuario: '001' },
  { hora: '11:09:49', evento: 'ENTRADA DE PROGRAMACION', zona: 'TEC', usuario: '' },
  { hora: '11:10:07', evento: 'ALARMA DE ROBO', zona: '002', usuario: '' },
  { hora: '11:10:11', evento: 'ALARMA DE ROBO', zona: '004', usuario: '' },
  { hora: '11:10:12', evento: 'ALARMA DE ROBO', zona: '005', usuario: '' },
  { hora: '11:10:13', evento: 'RESTABLECIMIENTO', zona: '004', usuario: '' },
  { hora: '11:10:14', evento: 'RESTABLECIMIENTO', zona: '005', usuario: '' },
  { hora: '11:10:20', evento: 'ALARMA DE ROBO', zona: '004', usuario: '' },
  { hora: '11:10:21', evento: 'RESTABLECIMIENTO', zona: '004', usuario: '' },
  { hora: '11:10:24', evento: 'ALARMA DE ROBO', zona: '006', usuario: '' },
  { hora: '11:10:25', evento: 'ALARMA DE ROBO', zona: '007', usuario: '' },
  { hora: '11:10:26', evento: 'RESTABLECIMIENTO', zona: '006', usuario: '' },
  { hora: '11:10:27', evento: 'RESTABLECIMIENTO', zona: '007', usuario: '' },
  { hora: '11:10:31', evento: 'ALARMA DE ROBO', zona: '009', usuario: '' },
  { hora: '11:10:32', evento: 'RESTABLECIMIENTO', zona: '009', usuario: '' },
  { hora: '11:10:33', evento: 'ALARMA DE ROBO', zona: '010', usuario: '' },
  { hora: '11:10:34', evento: 'RESTABLECIMIENTO', zona: '010', usuario: '' },
  { hora: '11:10:51', evento: 'ALARMA DE ROBO', zona: '010', usuario: '' },
  { hora: '11:10:53', evento: 'RESTABLECIMIENTO', zona: '010', usuario: '' },
  { hora: '11:11:18', evento: 'ALARMA DE ROBO', zona: '010', usuario: '' },
  { hora: '11:11:19', evento: 'RESTABLECIMIENTO', zona: '010', usuario: '' },
  { hora: '11:11:29', evento: 'ALARMA DE ROBO', zona: '010', usuario: '' },
  { hora: '11:11:30', evento: 'RESTABLECIMIENTO', zona: '010', usuario: '' },
  { hora: '11:11:41', evento: 'ALARMA DE ROBO', zona: '010', usuario: '' },
  { hora: '11:11:42', evento: 'RESTABLECIMIENTO', zona: '010', usuario: '' },
  { hora: '11:11:48', evento: 'ALARMA DE ROBO', zona: '010', usuario: '' },
  { hora: '11:11:49', evento: 'RESTABLECIMIENTO', zona: '010', usuario: '' },
  { hora: '11:12:03', evento: 'ALARMA DE ROBO', zona: '010', usuario: '' },
  { hora: '11:12:04', evento: 'RESTABLECIMIENTO', zona: '010', usuario: '' },
  { hora: '11:12:21', evento: 'ALARMA DE ROBO', zona: '010', usuario: '' },
  { hora: '11:12:22', evento: 'RESTABLECIMIENTO', zona: '010', usuario: '' },
  { hora: '11:12:32', evento: 'ALARMA DE ROBO', zona: '009', usuario: '' },
  { hora: '11:12:33', evento: 'RESTABLECIMIENTO', zona: '009', usuario: '' },
  { hora: '11:12:37', evento: 'APERTURA', zona: '', usuario: '301' },
  { hora: '11:12:42', evento: 'FALLA CORTE DE SIRENA', zona: 'U/C', usuario: '' },
  { hora: '11:22:16', evento: 'SALIDA DE PROGRAMACION', zona: 'TEC', usuario: '' }
];

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs';

async function run() {
  const nombre_abonado = 'TALITA KUM AQUARIUS ILLAPEL';
  const dia = '2026-09-25';
  
  const batch = events.map(e => {
    // Formatear ISO con huso Chile (-03:00)
    const fecha_hora = `${dia}T${e.hora}-03:00`;
    return {
      fecha_hora,
      cuenta: 'C7CC',
      nombre_abonado,
      evento: e.evento,
      zona: e.zona || null,
      usuario: e.usuario || null
    };
  });

  console.log(`Subiendo ${batch.length} eventos reales de hoy para C7CC a Supabase...`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/eventos_monitoreo`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(batch)
  });

  if (res.ok) {
    const inserted = await res.json();
    console.log(`✅ ¡${inserted.length} eventos insertados con éxito en Supabase!`);
  } else {
    console.error('Error insertando eventos:', res.status, await res.text());
  }
}

run();

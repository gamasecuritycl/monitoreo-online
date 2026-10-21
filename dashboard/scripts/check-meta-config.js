const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjg1NTE0NCwiZXhwIjoyMDk4NDMxMTQ0fQ.mCg5_fItAU1LxAfvN2ZhETB6NfxO1U_ODZ1QwUICA1Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('config_sales_gama')
    .select('*')
    .eq('key', 'config')
    .single();

  console.log('Error:', error);
  if (data) {
    const val = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    console.log('val.meta_integration:', val?.meta_integration);
  }

  const { data: d2 } = await supabase
    .from('config_sales_gama')
    .select('*')
    .eq('key', 'meta_integration')
    .single();

  if (d2) {
    console.log('direct meta_integration:', d2.value);
  }
}

check();

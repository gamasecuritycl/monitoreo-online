-- Migración SALES-GAMA Bot
-- Tablas: leads_sales_gama, lead_messages, config_sales_gama
-- Índices y RLS habilitado

-- 1. Tabla leads_sales_gama
CREATE TABLE IF NOT EXISTS leads_sales_gama (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE,
  nombre TEXT,
  email TEXT,
  direccion TEXT,
  comuna TEXT,
  telefono TEXT,
  estado TEXT NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'caliente', 'cerrado', 'derivado')),
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla lead_messages
CREATE TABLE IF NOT EXISTS lead_messages (
  id BIGSERIAL PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads_sales_gama(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla config_sales_gama
CREATE TABLE IF NOT EXISTS config_sales_gama (
  key TEXT PRIMARY KEY CHECK (key IN ('prompt', 'precios', 'config')),
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para leads_sales_gama
CREATE INDEX IF NOT EXISTS idx_leads_sales_gama_session_id ON leads_sales_gama(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_sales_gama_estado ON leads_sales_gama(estado);
CREATE INDEX IF NOT EXISTS idx_leads_sales_gama_comuna ON leads_sales_gama(comuna);
CREATE INDEX IF NOT EXISTS idx_leads_sales_gama_last_activity ON leads_sales_gama(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_leads_sales_gama_ip_hash ON leads_sales_gama(ip_hash);

-- Índices para lead_messages
CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_id ON lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_created_at ON lead_messages(created_at ASC);

-- Índice para config_sales_gama (PK ya indexa key)

-- RLS: Habilitar Row Level Security
ALTER TABLE leads_sales_gama ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_sales_gama ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "service_role_full_access_leads" ON leads_sales_gama;
CREATE POLICY "service_role_full_access_leads" ON leads_sales_gama
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_full_access_messages" ON lead_messages;
CREATE POLICY "service_role_full_access_messages" ON lead_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_full_access_config" ON config_sales_gama;
CREATE POLICY "service_role_full_access_config" ON config_sales_gama
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger para actualizar updated_at en leads_sales_gama
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF TG_TABLE_NAME = 'leads_sales_gama' THEN
    NEW.last_activity = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_sales_gama_updated_at ON leads_sales_gama;
CREATE TRIGGER update_leads_sales_gama_updated_at
  BEFORE UPDATE ON leads_sales_gama
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en config_sales_gama
DROP TRIGGER IF EXISTS update_config_sales_gama_updated_at ON config_sales_gama;
CREATE TRIGGER update_config_sales_gama_updated_at
  BEFORE UPDATE ON config_sales_gama
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales de configuración
DELETE FROM config_sales_gama;
INSERT INTO config_sales_gama (key, value) VALUES
  ('prompt', '"Eres un asistente de ventas de GAMA Seguridad, empresa chilena líder en alarmas y monitoreo 24/7. Tu objetivo es calificar leads, responder dudas técnicas/comerciales y derivar a WhatsApp para cierre. Sé profesional, empático y conciso. No inventes precios; usa solo la lista de precios proporcionada. Si no sabes algo, deriva a WhatsApp."'::jsonb),
  ('precios', '{"version": 1, "categorias": ["Alarmas Hogar", "Alarmas Negocio", "Monitoreo", "Cámaras", "Accesorios"], "items": []}'::jsonb),
  ('config', '{"prompt": "Eres un asistente de ventas de GAMA Seguridad, empresa chilena líder en alarmas y monitoreo 24/7. Tu objetivo es calificar leads, responder dudas técnicas/comerciales y derivar a WhatsApp para cierre. Sé profesional, empático y conciso. No inventes precios; usa solo la lista de precios proporcionada. Si no sabes algo, deriva a WhatsApp.", "precios": {"version": 1, "categorias": ["Alarmas Hogar", "Alarmas Negocio", "Monitoreo", "Cámaras", "Accesorios"], "items": []}, "rateLimit": 20, "timeoutMin": 30, "despedida": "¡Gracias por contactar a GAMA Seguridad! Te esperamos.", "waUrl": "https://wa.me/56912345678", "model": "gemini-1.5-flash", "temperature": 0.7, "topP": 0.9, "topK": 40}'::jsonb);
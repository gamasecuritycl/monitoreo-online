const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://onxwyrwmpjxtwlmjrosr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs';

const s = createClient(supabaseUrl, supabaseKey);

const newPrompt = `Eres SALES-GAMA, el Asesor de Seguridad y Experto Comercial de GAMA Seguridad (empresa chilena líder con más de 20 años protegiendo hogares y empresas en la Región Metropolitana y Región de Valparaíso).

TU OBJETIVO PRINCIPAL:
Atender a los visitantes de la web con calidez, entusiasmo y conocimiento técnico impecable. Tu meta es responder y explicar todas las dudas, promociones y valores en el mismo chat, asesorar al cliente según su tipo de propiedad (casa, departamento, local comercial, bodega) y dimensionar su solución de seguridad, para luego coordinar su evaluación técnica presencial gratuita en terreno ($0) o enviarle su cotización formal en PDF.

REGLAS DE ORO OBLIGATORIAS:

1. EXPLICACIÓN INMEDIATA DE LA PROMOCIÓN PACK VETTI SMART (PROHIBIDO DERIVAR SIN EXPLICAR):
   - Si el cliente pregunta por la "Promoción Exclusiva Pack VETTI Smart", por ofertas, por el kit o por precios, ¡NUNCA lo derives de inmediato a WhatsApp ni le digas que hable con un ejecutivo! TÚ ERES EL ASESOR Y TIENES LA INFORMACIÓN COMPLETA.
   - Explícale de inmediato con claridad, entusiasmo y viñetas ordenadas:
     * 📦 QUÉ INCLUYE EL PACK VETTI SMART:
       - Central Inteligente Vetti Hub (conexión dual WiFi + 4G GSM anti-corte intencional).
       - 1 Sensor de movimiento PIR inteligente antimascotas (evita falsas alarmas con mascotas de hasta 25 kg).
       - 1 Contacto magnético de alta precisión para puerta de acceso o ventanal.
       - 2 Controles remotos inalámbricos con botón de pánico SOS.
       - Sirena disuasiva integrada de alta potencia (110 dB).
       - Batería de respaldo autónoma ante cortes intencionales de luz.
       - Control total desde tu smartphone con la App NT CLICK (armado, desarmado y notificaciones push en tiempo real).
     * 💰 VALORES Y BENEFICIOS REALES:
       - Instalación técnica profesional: BONIFICADA ($0 costo de instalación con el plan).
       - Plan de Monitoreo Continuo 24/7: Desde 0,9 UF + IVA mensual (~$35.000 CLP aprox), con verificación de señales en menos de 2 minutos por operadores y coordinación inmediata con Carabineros y contactos de emergencia.
     * 🛡️ EL GRAN DIFERENCIAL GAMA:
       - ¡EL EQUIPAMIENTO ES 100% TUYO! No cobramos arriendos eternos ni comodatos engañosos como multinacionales (Verisure o ADT) donde pagas cuotas eternas y los equipos nunca te pertenecen. En GAMA la alarma es de tu propiedad.
     * 📍 PREGUNTA CONSULTIVA DE CIERRE:
       - Remata siempre con una pregunta consultiva: "¿Te gustaría proteger una casa, departamento o negocio? ¿En qué comuna te ubicas para confirmar cobertura y factibilidad técnica inmediata?".

2. POLÍTICA DE DERIVACIÓN A WHATSAPP:
   - Solo deriva a WhatsApp si el cliente insiste explícitamente en hablar con una persona por teléfono, o como invitación opcional y cordial al final del mensaje:
     "Si deseas agendar tu evaluación técnica gratuita en terreno ($0) o que te preparemos una propuesta formal en PDF, puedes indicarme tu WhatsApp por aquí o escribirnos directamente a nuestro enlace oficial: https://wa.me/56991016912".
   - NUNCA uses la derivación a WhatsApp como una salida fácil para no dar la información.

3. EVALUACIÓN EN TERRENO GRATUITA:
   - La evaluación presencial en terreno en la Región Metropolitana y Región de Valparaíso es 100% GRATUITA ($0) y sin compromiso.

4. TONO:
   - Experto, cálido, seguro, empático y formal chileno. Respuestas ágiles, visualmente atractivas con viñetas claras.`;

const newPrecios = {
  version: 2,
  categorias: [
    "Promociones Exclusivas",
    "Alarmas Inteligentes",
    "Monitoreo 24/7",
    "CCTV y Cámaras IA",
    "Cercos Eléctricos"
  ],
  items: [
    {
      id: "pack-vetti-smart-promo",
      nombre: "Promoción Exclusiva Pack VETTI Smart",
      descripcion: "Sistema de alarma inalámbrica de alta tecnología con App NT CLICK y monitoreo 24/7. Equipos propios sin arriendo.",
      precio: 0,
      precio_uf: "Instalación $0 bonificada / Monitoreo desde 0,9 UF + IVA mensual",
      categoria: "Promociones Exclusivas",
      palabras_clave: ["vetti", "pack", "promocion", "promo", "oferta", "smart", "nt click", "alarma", "kit", "casa", "departamento", "negocio", "valores", "detalles"],
      incluye: [
        "Central Inteligente Vetti (WiFi + 4G GSM anti-corte)",
        "1 Sensor de movimiento PIR antimascotas",
        "1 Contacto magnético de puerta/ventana",
        "2 Controles remotos con botón de pánico SOS",
        "Sirena disuasiva 110 dB",
        "Batería de respaldo",
        "App NT CLICK en tu smartphone",
        "Instalación $0 bonificada",
        "Monitoreo 24/7 desde 0,9 UF + IVA mensual",
        "Equipos 100% de tu propiedad (sin comodato)"
      ],
      no_incluye: ["Arriendos de equipos engañosos"],
      faq: [
        { q: "¿Qué incluye la promoción?", a: "Incluye todo el kit Vetti Smart con central WiFi/4G, sensores, controles, sirena, App NT CLICK e instalación $0 bonificada con el servicio de monitoreo 24/7 desde 0,9 UF/mes." },
        { q: "¿Los equipos son míos?", a: "Sí, el equipamiento queda 100% en tu propiedad, sin arriendos eternos." },
        { q: "¿Cuánto cuesta el monitoreo?", a: "Desde 0,9 UF + IVA mensual (~$35.000 CLP aprox)." }
      ]
    },
    {
      id: "monitoreo-continuo-247",
      nombre: "Plan Monitoreo de Alarmas 24/7",
      descripcion: "Monitoreo ininterrumpido 24 horas al día, 365 días al año desde nuestra central operativa con verificación humana en menos de 2 minutos.",
      precio: 34990,
      precio_uf: "0,9 UF + IVA mensual",
      categoria: "Monitoreo 24/7",
      palabras_clave: ["monitoreo", "central", "24/7", "plan", "mensual", "cuota", "valor"],
      incluye: ["Verificación en menos de 2 min", "App móvil con alertas push", "Aviso inmediato a contactos", "Coordinación con Carabineros y guardias"],
      no_incluye: [],
      faq: [{ q: "¿Cuál es el valor mensual?", a: "Desde 0,9 UF + IVA mensual (~$35.000 CLP)." }]
    },
    {
      id: "camaras-ia-4k",
      nombre: "Cámaras de Seguridad 4K con IA",
      descripcion: "CCTV de alta resolución con visión nocturna a todo color las 24 horas y analíticas de inteligencia artificial.",
      precio: 79900,
      categoria: "CCTV y Cámaras IA",
      palabras_clave: ["camaras", "camara", "cctv", "4k", "ia", "colorvu", "darkfighter"],
      incluye: ["Cámara IP 4K visión nocturna color", "Detección inteligente de personas y vehículos", "App móvil en vivo"],
      no_incluye: [],
      faq: [{ q: "¿Puedo ver las cámaras en mi celular?", a: "Sí, en vivo y revisar grabaciones en alta definición." }]
    },
    {
      id: "cerco-electrico-sec",
      nombre: "Cerco Eléctrico Certificado SEC",
      descripcion: "Seguridad perimetral de alta potencia 12.000V certificada por la SEC para condominios, casas y empresas.",
      precio: 18500,
      categoria: "Cercos Eléctricos",
      palabras_clave: ["cerco", "electrico", "sec", "perimetral", "pandereta", "muro"],
      incluye: ["6 líneas de alambre de alta resistencia", "Energizador 12.000V con batería de respaldo", "Certificación legal SEC"],
      no_incluye: [],
      faq: [{ q: "¿Es legal el cerco eléctrico?", a: "100% legal bajo normativa SEC chilena." }]
    }
  ]
};

async function main() {
  console.log('Actualizando config_sales_gama en Supabase...');
  const [r1, r2] = await Promise.all([
    s.from('config_sales_gama').upsert({ key: 'prompt', value: newPrompt }),
    s.from('config_sales_gama').upsert({ key: 'precios', value: newPrecios })
  ]);

  if (r1.error) console.error('Error al actualizar prompt:', r1.error);
  else console.log('✅ Prompt actualizado con éxito en Supabase.');

  if (r2.error) console.error('Error al actualizar precios:', r2.error);
  else console.log('✅ Precios y catálogo de promociones actualizado con éxito en Supabase.');
}

main().catch(console.error);

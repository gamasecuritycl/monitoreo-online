export interface HeroSlide {
  id: string;
  activo: boolean;
  orden: number;
  badge: string;
  titulo: string;
  tituloHighlight: string;
  bajada: string;
  imagenUrl: string;
  btnPrimarioTexto: string;
  btnPrimarioTipo: 'whatsapp' | 'chatbot' | 'link';
  btnPrimarioUrl?: string;
  btnSecundarioTexto: string;
  btnSecundarioTipo: 'whatsapp' | 'chatbot' | 'link';
  btnSecundarioUrl?: string;
}

export interface PromoPopupConfig {
  activo: boolean;
  titulo: string;
  subtitulo: string;
  imagenUrl: string;
  delaySeconds: number;
  badge: string;
  btnWhatsappTexto: string;
  btnWhatsappMensaje: string;
  btnBotTexto: string;
}

export interface ChatbotSettings {
  calloutActivo: boolean;
  calloutTexto: string;
  calloutDelaySeconds: number;
  chipsIniciales: string[];
}

export interface LandingMarketingConfig {
  popup: PromoPopupConfig;
  heroSlides: HeroSlide[];
  chatbot: ChatbotSettings;
  updatedAt?: string;
}

export const DEFAULT_LANDING_MARKETING_CONFIG: LandingMarketingConfig = {
  popup: {
    activo: true,
    titulo: '🔥 Promoción Exclusiva Pack VETTI Smart',
    subtitulo: 'Monitoreo continuo 24/7. El equipamiento queda 100% en tu propiedad, sin arriendos abusivos y con instalación bonificada ($0).',
    imagenUrl: '/ads/vetti_ad_oficial_master.png',
    delaySeconds: 3,
    badge: 'OFERTA LIMITADA',
    btnWhatsappTexto: 'Aprovechar Promo por WhatsApp',
    btnWhatsappMensaje: 'Hola GAMA Seguridad, vi la promoción en la web del Pack VETTI Smart con monitoreo 24/7 y quiero aprovecharla para mi propiedad.',
    btnBotTexto: 'Preguntar al Asesor Virtual',
  },
  heroSlides: [
    {
      id: 'slide-1',
      activo: true,
      orden: 1,
      badge: 'PROTECCIÓN RESIDENCIAL & EMPRESAS · EQUIPOS 100% PROPIOS',
      titulo: 'Alarmas para Casa y Empresas en Chile.',
      tituloHighlight: 'Monitoreo 24/7 desde 0,9 UF + IVA sin comodato.',
      bajada: 'Protege tu hogar o negocio con sistemas de alarma de grado profesional. Sin arriendos engañosos: la tecnología es tuya desde el primer día. Migramos tu panel existente (ADT, DSC, Honeywell) a costo $0 en equipos o instalamos kits nuevos al costo con verificación humana las 24 horas.',
      imagenUrl: '/ads/vetti_ad_oficial_master.png',
      btnPrimarioTexto: 'Calcular Cotización Online',
      btnPrimarioTipo: 'link',
      btnPrimarioUrl: '/cotizar',
      btnSecundarioTexto: 'Cotizar por WhatsApp',
      btnSecundarioTipo: 'whatsapp',
    },
    {
      id: 'slide-2',
      activo: true,
      orden: 2,
      badge: 'CENTRAL OPERATIVA REDUNDANTE',
      titulo: 'Monitoreo 24/7 de Alarmas en Todo Chile.',
      tituloHighlight: 'Respaldo humano activo segundo a segundo.',
      bajada: 'Más de 20 años de trayectoria cuidando lo que más valoras. Verificación visual en menos de 2 minutos, patrullaje coordinado y aviso directo a tu smartphone.',
      imagenUrl: '/ads/vetti_ad_2.png',
      btnPrimarioTexto: 'Ver Planes de Monitoreo',
      btnPrimarioTipo: 'link',
      btnPrimarioUrl: '#servicios',
      btnSecundarioTexto: 'Preguntar por Cobertura',
      btnSecundarioTipo: 'chatbot',
    },
    {
      id: 'slide-3',
      activo: true,
      orden: 3,
      badge: 'TECNOLOGÍA 4K & SEGURIDAD PERIMETRAL',
      titulo: 'Cámaras con IA y Cercos Eléctricos SEC.',
      tituloHighlight: 'Disuasión perimetral de máxima potencia.',
      bajada: 'Detección inteligente de intrusos antes de que ingresen. Sistemas certificados por la SEC para condominios, empresas, bodegas y residencias en RM y V Región.',
      imagenUrl: '/ads/vetti_ad_7.png',
      btnPrimarioTexto: 'Solicitar Evaluación en Terreno $0',
      btnPrimarioTipo: 'whatsapp',
      btnPrimarioUrl: 'https://wa.me/56991016912?text=Hola,%20deseo%20coordinar%20una%20evaluaci%C3%B3n%20t%C3%A9cnica%20gratuita%20en%20terreno.',
      btnSecundarioTexto: 'Preguntar al Asesor Bot',
      btnSecundarioTipo: 'chatbot',
    },
  ],
  chatbot: {
    calloutActivo: true,
    calloutTexto: '👋 ¿Dudas con precios o cobertura? Pregúntame al instante.',
    calloutDelaySeconds: 4,
    chipsIniciales: [
      '📦 ¿Qué incluye el Pack Vetti?',
      '💰 Valores de Monitoreo 24/7',
      '📍 ¿Tienen cobertura en mi comuna?',
      '🛡️ ¿El equipo queda a mi nombre?',
    ],
  },
};

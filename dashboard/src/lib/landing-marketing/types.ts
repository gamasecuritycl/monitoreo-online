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
      badge: 'OFERTA MES · EQUIPOS 100% PROPIOS',
      titulo: 'Pack Alarma Vetti Smart + Monitoreo 24/7.',
      tituloHighlight: 'Instalación $0 y respuesta < 2 min.',
      bajada: 'Protege tu hogar o empresa con tecnología inalámbrica de grado profesional. Sin arriendos engañosos: el kit queda a tu nombre y lo controlas desde la App NT CLICK.',
      imagenUrl: '/ads/vetti_ad_oficial_master.png',
      btnPrimarioTexto: 'Cotizar Pack Vetti en 1 Clic',
      btnPrimarioTipo: 'whatsapp',
      btnPrimarioUrl: 'https://wa.me/56991016912?text=Hola%20GAMA%20Seguridad,%20quiero%20cotizar%20el%20Pack%20VETTI%20Smart%20con%20instalaci%C3%B3n%20$0.',
      btnSecundarioTexto: 'Consultar con Asesor Virtual',
      btnSecundarioTipo: 'chatbot',
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

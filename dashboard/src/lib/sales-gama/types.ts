export interface Lead {
  id: string;
  session_id: string;
  nombre?: string;
  email?: string;
  direccion?: string;
  comuna?: string;
  telefono?: string;
  estado: 'nuevo' | 'caliente' | 'cerrado' | 'derivado';
  ip_hash?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
  last_activity: string;
}

export interface LeadMessage {
  id: number;
  lead_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_in?: number;
  tokens_out?: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Config {
  prompt: string;
  precios: PreciosData;
  config: BotConfig;
}

export interface PreciosData {
  version: number;
  categorias: string[];
  items: PreciosItem[];
}

export interface PreciosItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  palabras_clave: string[];
  incluye: string[];
  no_incluye: string[];
  faq: { q: string; a: string }[];
}

export interface BotConfig {
  rateLimit: number;
  timeoutMin: number;
  despedida: string;
  waUrl: string;
  model: string;
  temperature: number;
  topP: number;
  topK: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  history: ChatMessage[];
}

export interface ChatChunk {
  type: 'chunk' | 'done' | 'error';
  text?: string;
  tokensIn?: number;
  tokensOut?: number;
  error?: string;
}

export interface SessionInitResponse {
  sessionId: string;
}

export interface LeadFilters {
  estado?: Lead['estado'];
  comuna?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface ListLeadsResponse {
  items: Lead[];
  nextCursor?: string;
  total: number;
}
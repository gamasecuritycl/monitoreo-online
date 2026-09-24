import { z } from 'zod';
import type { PreciosData } from './types';

export const PromptSchema = z.string().min(50, 'El prompt debe tener al menos 50 caracteres').max(8000, 'El prompt no puede exceder 8000 caracteres');

const PreciosItemSchema = z.object({
  id: z.string().min(1, 'ID es requerido'),
  nombre: z.string().min(1, 'Nombre es requerido'),
  descripcion: z.string().min(1, 'Descripción es requerida'),
  precio: z.number().min(0, 'El precio debe ser igual o mayor a 0'),
  precio_uf: z.string().optional(),
  categoria: z.string().min(1, 'Categoría es requerida'),
  palabras_clave: z.array(z.string()).min(1, 'Debe tener al menos una palabra clave'),
  incluye: z.array(z.string()).min(1, 'Debe incluir al menos un elemento'),
  no_incluye: z.array(z.string()),
  faq: z.array(z.object({
    q: z.string().min(1, 'Pregunta es requerida'),
    a: z.string().min(1, 'Respuesta es requerida'),
  })),
});

export const PreciosSchema: z.ZodType<PreciosData> = z.object({
  version: z.number().int().positive('Versión debe ser un entero positivo'),
  categorias: z.array(z.string()).min(1, 'Debe haber al menos una categoría'),
  items: z.array(PreciosItemSchema).min(1, 'Debe haber al menos un item'),
}).refine(
  (data) => {
    const ids = new Set(data.items.map(item => item.id));
    return ids.size === data.items.length;
  },
  { message: 'Todos los IDs de items deben ser únicos', path: ['items'] }
).refine(
  (data) => {
    return data.items.every(item => data.categorias.includes(item.categoria));
  },
  { message: 'Cada item debe tener una categoría que exista en categorias', path: ['items'] }
);

export const BotConfigSchema = z.object({
  rateLimit: z.number().int().min(1, 'Rate limit mínimo es 1').max(100, 'Rate limit máximo es 100'),
  timeoutMin: z.number().int().min(1, 'Timeout mínimo es 1 minuto').max(60, 'Timeout máximo es 60 minutos'),
  despedida: z.string().min(1, 'Mensaje de despedida es requerido'),
  waUrl: z.string().url('URL de WhatsApp debe ser una URL válida'),
  model: z.enum(['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro']).describe('Modelo no válido'),
  temperature: z.number().min(0, 'Temperatura mínima es 0').max(1, 'Temperatura máxima es 1'),
  topP: z.number().min(0, 'Top-p mínimo es 0').max(1, 'Top-p máximo es 1'),
  topK: z.number().int().min(1, 'Top-k mínimo es 1').max(100, 'Top-k máximo es 100'),
});

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Contenido es requerido'),
});

export const ChatRequestSchema = z.object({
  sessionId: z.string().uuid('Session ID debe ser un UUID válido'),
  message: z.string().min(1, 'Mensaje es requerido').max(4000, 'Mensaje no puede exceder 4000 caracteres'),
  history: z.array(ChatMessageSchema).max(100, 'Historial no puede exceder 100 mensajes'),
});

export const ConfigSchema = z.object({
  prompt: PromptSchema,
  precios: PreciosSchema,
  config: BotConfigSchema,
});

export type PromptInput = z.infer<typeof PromptSchema>;
export type PreciosInput = z.infer<typeof PreciosSchema>;
export type BotConfigInput = z.infer<typeof BotConfigSchema>;
export type ChatRequestInput = z.infer<typeof ChatRequestSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type ConfigInput = z.infer<typeof ConfigSchema>;
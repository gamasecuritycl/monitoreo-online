import { describe, it, expect } from 'vitest';
import {
  PromptSchema,
  PreciosSchema,
  BotConfigSchema,
  ChatRequestSchema,
  ConfigSchema,
} from '../schema.js';

const validPreciosItem = {
  id: 'item-1',
  nombre: 'Alarma Básica',
  descripcion: 'Sistema de alarma básico para hogar',
  precio: 199900,
  categoria: 'Alarmas Hogar',
  palabras_clave: ['alarma', 'hogar', 'basica'],
  incluye: ['Panel de control', '2 sensores', 'Instalación'],
  no_incluye: ['Monitoreo mensual', 'Cámaras'],
  faq: [{ q: '¿Incluye instalación?', a: 'Sí, instalación básica incluida' }],
};

const validPreciosData = {
  version: 1,
  categorias: ['Alarmas Hogar', 'Alarmas Negocio', 'Monitoreo'],
  items: [validPreciosItem],
};

const validBotConfig = {
  rateLimit: 20,
  timeoutMin: 30,
  despedida: '¡Gracias por contactar a GAMA Seguridad!',
  waUrl: 'https://wa.me/56912345678',
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
};

const validConfig = {
  prompt: 'Eres un asistente de ventas de GAMA Seguridad, empresa chilena líder en alarmas y monitoreo 24/7. Tu objetivo es calificar leads, responder dudas técnicas/comerciales y derivar a WhatsApp para cierre.',
  precios: validPreciosData,
  config: validBotConfig,
};

describe('PromptSchema', () => {
  it('valida prompt válido', () => {
    const result = PromptSchema.safeParse(validConfig.prompt);
    expect(result.success).toBe(true);
  });

  it('rechaza prompt muy corto', () => {
    const result = PromptSchema.safeParse('Corto');
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('50'))).toBe(true);
  });

  it('rechaza prompt muy largo', () => {
    const longPrompt = 'x'.repeat(8001);
    const result = PromptSchema.safeParse(longPrompt);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('8000'))).toBe(true);
  });
});

describe('PreciosSchema', () => {
  it('valida estructura completa válida', () => {
    const result = PreciosSchema.safeParse(validPreciosData);
    expect(result.success).toBe(true);
  });

  it('rechaza precio negativo', () => {
    const badData = { ...validPreciosData, items: [{ ...validPreciosItem, precio: -100 }] };
    const result = PreciosSchema.safeParse(badData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('mayor a 0'))).toBe(true);
  });

  it('rechaza categoría inexistente', () => {
    const badData = { ...validPreciosData, items: [{ ...validPreciosItem, categoria: 'Inexistente' }] };
    const result = PreciosSchema.safeParse(badData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('categoría'))).toBe(true);
  });

  it('rechaza IDs duplicados', () => {
    const badData = {
      ...validPreciosData,
      items: [validPreciosItem, { ...validPreciosItem, id: 'item-1', nombre: 'Otro' }],
    };
    const result = PreciosSchema.safeParse(badData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('únicos'))).toBe(true);
  });

  it('rechaza arrays vacíos en item', () => {
    const badData = {
      ...validPreciosData,
      items: [{ ...validPreciosItem, palabras_clave: [] }],
    };
    const result = PreciosSchema.safeParse(badData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('palabra clave'))).toBe(true);
  });
});

describe('BotConfigSchema', () => {
  it('valida config válida', () => {
    const result = BotConfigSchema.safeParse(validBotConfig);
    expect(result.success).toBe(true);
  });

  it('rechaza rateLimit fuera de rango', () => {
    const result = BotConfigSchema.safeParse({ ...validBotConfig, rateLimit: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('mínimo es 1'))).toBe(true);
    const result2 = BotConfigSchema.safeParse({ ...validBotConfig, rateLimit: 101 });
    expect(result2.success).toBe(false);
    expect(result2.error?.issues.some(i => i.message.includes('máximo es 100'))).toBe(true);
  });

  it('rechaza timeoutMin fuera de rango', () => {
    const result = BotConfigSchema.safeParse({ ...validBotConfig, timeoutMin: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('mínimo es 1'))).toBe(true);
    const result2 = BotConfigSchema.safeParse({ ...validBotConfig, timeoutMin: 61 });
    expect(result2.success).toBe(false);
    expect(result2.error?.issues.some(i => i.message.includes('máximo es 60'))).toBe(true);
  });

  it('rechaza waUrl inválida', () => {
    const result = BotConfigSchema.safeParse({ ...validBotConfig, waUrl: 'no-es-url' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('URL válida'))).toBe(true);
  });

  it('rechaza modelo inválido', () => {
    const result = BotConfigSchema.safeParse({ ...validBotConfig, model: 'gpt-4' });
    expect(result.success).toBe(false);
  });

  it('rechaza temperature fuera de rango', () => {
    const result = BotConfigSchema.safeParse({ ...validBotConfig, temperature: -0.1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('mínima es 0'))).toBe(true);
    const result2 = BotConfigSchema.safeParse({ ...validBotConfig, temperature: 1.1 });
    expect(result2.success).toBe(false);
    expect(result2.error?.issues.some(i => i.message.includes('máxima es 1'))).toBe(true);
  });

  it('rechaza topP fuera de rango', () => {
    const result = BotConfigSchema.safeParse({ ...validBotConfig, topP: -0.1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('mínimo es 0'))).toBe(true);
    const result2 = BotConfigSchema.safeParse({ ...validBotConfig, topP: 1.1 });
    expect(result2.success).toBe(false);
    expect(result2.error?.issues.some(i => i.message.includes('máximo es 1'))).toBe(true);
  });

  it('rechaza topK fuera de rango', () => {
    const result = BotConfigSchema.safeParse({ ...validBotConfig, topK: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('mínimo es 1'))).toBe(true);
    const result2 = BotConfigSchema.safeParse({ ...validBotConfig, topK: 101 });
    expect(result2.success).toBe(false);
    expect(result2.error?.issues.some(i => i.message.includes('máximo es 100'))).toBe(true);
  });
});

describe('ChatRequestSchema', () => {
  it('valida request válido', () => {
    const validRequest = {
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      message: 'Hola, quiero cotizar una alarma',
      history: [
        { role: 'user' as const, content: 'Hola' },
        { role: 'assistant' as const, content: '¡Hola! ¿En qué puedo ayudarte?' },
      ],
    };
    const result = ChatRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('rechaza sessionId inválido', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: 'no-es-uuid',
      message: 'Hola',
      history: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('UUID'))).toBe(true);
  });

  it('rechaza mensaje muy largo', () => {
    const result = ChatRequestSchema.safeParse({
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      message: 'x'.repeat(4001),
      history: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('4000'))).toBe(true);
  });

  it('rechaza historial muy largo', () => {
    const history = Array.from({ length: 21 }, (_, i) => ({
      role: 'user' as const,
      content: `Mensaje ${i}`,
    }));
    const result = ChatRequestSchema.safeParse({
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      message: 'Hola',
      history,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.message.includes('20'))).toBe(true);
  });
});

describe('ConfigSchema', () => {
  it('valida config completa', () => {
    const result = ConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });
});
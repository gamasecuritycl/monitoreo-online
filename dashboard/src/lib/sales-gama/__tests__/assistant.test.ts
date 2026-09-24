import { describe, it, expect } from 'vitest';
import { matchPrecios, buildPreciosContext, formatHistoryForGemini } from '../assistant';
import type { PreciosData, PreciosItem, ChatMessage } from '../types';

const mockPrecios: PreciosData = {
  version: 1,
  categorias: ['Alarmas', 'Cámaras'],
  items: [
    {
      id: 'alarma-basica',
      nombre: 'Alarma Básica',
      descripcion: 'Sistema de alarma básico para hogar',
      precio: 150000,
      categoria: 'Alarmas',
      palabras_clave: ['alarma', 'basica', 'hogar', 'intrusion'],
      incluye: ['Panel', 'Sensor', 'Sirena'],
      no_incluye: ['Instalación', 'Monitoreo'],
      faq: [{ q: '¿Incluye instalación?', a: 'No, se cotiza por separado' }],
    },
    {
      id: 'camara-exterior',
      nombre: 'Cámara Exterior IP',
      descripcion: 'Cámara resistente a la intemperie',
      precio: 89000,
      categoria: 'Cámaras',
      palabras_clave: ['camara', 'exterior', 'ip', 'vandalica'],
      incluye: ['Cámara', 'Soporte', 'Fuente'],
      no_incluye: ['Grabador', 'Disco duro'],
      faq: [{ q: '¿Visión nocturna?', a: 'Sí, hasta 30m' }],
    },
    {
      id: 'kit-completo',
      nombre: 'Kit Completo Seguridad',
      descripcion: 'Alarma + 4 cámaras + monitoreo',
      precio: 590000,
      categoria: 'Alarmas',
      palabras_clave: ['kit', 'completo', 'seguridad', 'monitoreo'],
      incluye: ['Panel', '4 Cámaras', 'Grabador', 'Monitoreo 1 año'],
      no_incluye: ['Instalación', 'Cableado extra'],
      faq: [{ q: '¿Contrato de permanencia?', a: '12 meses' }],
    },
  ],
};

describe('assistant', () => {
  describe('matchPrecios', () => {
    it('should match items by keyword substring', () => {
      const matches = matchPrecios('Quiero una alarma basica para mi hogar', mockPrecios);
      expect(matches.length).toBe(1);
      expect(matches[0].item.id).toBe('alarma-basica');
      expect(matches[0].matchedKeywords).toContain('alarma');
      expect(matches[0].matchedKeywords).toContain('hogar');
    });

    it('should match multiple items', () => {
      const matches = matchPrecios('Necesito alarma y camara exterior', mockPrecios);
      expect(matches.length).toBe(2);
      const ids = matches.map((m) => m.item.id).sort();
      expect(ids).toEqual(['alarma-basica', 'camara-exterior']);
    });

    it('should respect maxItems limit', () => {
      const matches = matchPrecios('alarma camara kit completo seguridad', mockPrecios, 2);
      expect(matches.length).toBe(2);
    });

    it('should return empty array for no matches', () => {
      const matches = matchPrecios('Hola, ¿cómo están?', mockPrecios);
      expect(matches.length).toBe(0);
    });

    it('should be case insensitive', () => {
      const matches = matchPrecios('ALARMA BASICA HOGAR', mockPrecios);
      expect(matches.length).toBe(1);
      expect(matches[0].item.id).toBe('alarma-basica');
    });

    it('should not duplicate items', () => {
      const matches = matchPrecios('alarma alarma alarma hogar', mockPrecios);
      expect(matches.length).toBe(1);
    });
  });

  describe('buildPreciosContext', () => {
    it('should return empty string for no matches', () => {
      const context = buildPreciosContext([]);
      expect(context).toBe('');
    });

    it('should format matches correctly', () => {
      const matches = matchPrecios('alarma basica', mockPrecios);
      const context = buildPreciosContext(matches);
      expect(context).toContain('PRECIOS RELEVANTES');
      expect(context).toContain('Alarma Básica');
      expect(context).toContain('$150.000');
      expect(context).toContain('Panel');
      expect(context).toContain('Sensor');
      expect(context).toContain('Sirena');
      expect(context).toContain('FAQs');
    });
  });

  describe('formatHistoryForGemini', () => {
    it('should convert user/assistant to user/model roles', () => {
      const history: ChatMessage[] = [
        { role: 'user', content: 'Hola' },
        { role: 'assistant', content: '¡Hola! ¿En qué puedo ayudarte?' },
        { role: 'user', content: 'Quiero una alarma' },
      ];

      const formatted = formatHistoryForGemini(history);
      expect(formatted).toHaveLength(3);
      expect(formatted[0].role).toBe('user');
      expect(formatted[1].role).toBe('model');
      expect(formatted[2].role).toBe('user');
      expect(formatted[0].parts[0].text).toBe('Hola');
      expect(formatted[1].parts[0].text).toBe('¡Hola! ¿En qué puedo ayudarte?');
    });

    it('should handle empty history', () => {
      const formatted = formatHistoryForGemini([]);
      expect(formatted).toEqual([]);
    });

    it('should handle system messages as user', () => {
      const history: ChatMessage[] = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User message' },
      ];

      const formatted = formatHistoryForGemini(history);
      expect(formatted[0].role).toBe('user');
      expect(formatted[0].parts[0].text).toBe('System prompt');
    });
  });
});
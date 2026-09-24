import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, getRateLimitStatus, resetRateLimit } from '../rate-limit.js';

describe('rate-limit', () => {
  beforeEach(() => {
    resetRateLimit('test-session', 'test-ip');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('permite primera request', () => {
    const result = checkRateLimit('session-1', 'ip-hash-1', 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('permite requests dentro del límite', () => {
    resetRateLimit('session-2', 'ip-hash-2');
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit('session-2', 'ip-hash-2', 5);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('bloquea cuando excede el límite', () => {
    resetRateLimit('session-3', 'ip-hash-3');
    for (let i = 0; i < 5; i++) {
      checkRateLimit('session-3', 'ip-hash-3', 5);
    }
    const result = checkRateLimit('session-3', 'ip-hash-3', 5);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('reinicia contador en nueva ventana', () => {
    resetRateLimit('session-4', 'ip-hash-4');
    for (let i = 0; i < 5; i++) {
      checkRateLimit('session-4', 'ip-hash-4', 5);
    }
    let result = checkRateLimit('session-4', 'ip-hash-4', 5);
    expect(result.allowed).toBe(false);

    vi.advanceTimersByTime(61000);
    result = checkRateLimit('session-4', 'ip-hash-4', 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('getRateLimitStatus - retorna estado sin incrementar', () => {
    resetRateLimit('session-5', 'ip-hash-5');
    checkRateLimit('session-5', 'ip-hash-5', 5);
    checkRateLimit('session-5', 'ip-hash-5', 5);

    const status = getRateLimitStatus('session-5', 'ip-hash-5', 5);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(3);
  });

  it('getRateLimitStatus - retorna estado fresco para nueva sesión', () => {
    const status = getRateLimitStatus('nueva-session', 'nueva-ip', 5);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(5);
  });

  it('resetRateLimit - limpia contador de sesión', () => {
    resetRateLimit('session-6', 'ip-hash-6');
    for (let i = 0; i < 3; i++) {
      checkRateLimit('session-6', 'ip-hash-6', 5);
    }
    resetRateLimit('session-6', 'ip-hash-6');

    const status = getRateLimitStatus('session-6', 'ip-hash-6', 5);
    expect(status.remaining).toBe(5);
  });

  it('checkRateLimit - sesiones independientes', () => {
    resetRateLimit('session-a', 'ip-1');
    resetRateLimit('session-b', 'ip-1');

    for (let i = 0; i < 5; i++) {
      checkRateLimit('session-a', 'ip-1', 5);
    }

    const resultB = checkRateLimit('session-b', 'ip-1', 5);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(4);
  });

  it('checkRateLimit - IPs independientes para misma sesión', () => {
    resetRateLimit('session-7', 'ip-a');
    resetRateLimit('session-7', 'ip-b');

    for (let i = 0; i < 5; i++) {
      checkRateLimit('session-7', 'ip-a', 5);
    }

    const resultB = checkRateLimit('session-7', 'ip-b', 5);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(4);
  });
});
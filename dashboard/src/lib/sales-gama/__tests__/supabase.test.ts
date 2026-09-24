import { describe, it, expect } from 'vitest';

describe('supabase helpers', () => {
  it('hashIp - genera hash SHA-256 consistente', async () => {
    const { hashIp } = await import('../supabase.js');
    const hash1 = await hashIp('192.168.1.1');
    const hash2 = await hashIp('192.168.1.1');
    const hash3 = await hashIp('192.168.1.2');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64);
    expect(/^[a-f0-9]+$/.test(hash1)).toBe(true);
  });
});
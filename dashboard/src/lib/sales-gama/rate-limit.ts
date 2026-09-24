export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const WINDOW_MS = 60 * 1000;
const DEFAULT_LIMIT = 20;

const memoryStore = new Map<string, { count: number; windowStart: number }>();

function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now - value.windowStart >= WINDOW_MS) {
      memoryStore.delete(key);
    }
  }
}

setInterval(cleanupMemoryStore, WINDOW_MS);

export function checkRateLimit(
  sessionId: string,
  ipHash: string,
  limit: number = DEFAULT_LIMIT
): RateLimitResult {
  const key = `${sessionId}:${ipHash}`;
  const now = Date.now();
  const windowStart = now - (now % WINDOW_MS);
  const resetAt = windowStart + WINDOW_MS;

  const existing = memoryStore.get(key);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    memoryStore.set(key, { count: 1, windowStart });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);

  return {
    allowed: existing.count <= limit,
    remaining,
    resetAt,
  };
}

export function getRateLimitStatus(sessionId: string, ipHash: string, limit: number = DEFAULT_LIMIT): RateLimitResult {
  const key = `${sessionId}:${ipHash}`;
  const now = Date.now();
  const windowStart = now - (now % WINDOW_MS);
  const resetAt = windowStart + WINDOW_MS;

  const existing = memoryStore.get(key);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    return { allowed: true, remaining: limit, resetAt };
  }

  const remaining = Math.max(0, limit - existing.count);
  return {
    allowed: existing.count < limit,
    remaining,
    resetAt,
  };
}

export function resetRateLimit(sessionId: string, ipHash: string): void {
  const key = `${sessionId}:${ipHash}`;
  memoryStore.delete(key);
}
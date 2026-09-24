"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatChunk, BotConfig } from "@/lib/sales-gama/types";

const SESSION_STORAGE_KEY = "sg_session";
const HISTORY_KEY = "sg_history";
const LAST_ACTIVITY_KEY = "sg_lastActivity";
const COUNT_KEY = "sg_count";

interface UseSalesGamaOptions {
  onChunk?: (text: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (error: string) => void;
  onSessionEnd?: () => void;
}

export function useSalesGama(options: UseSalesGamaOptions = {}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitResetAt, setRateLimitResetAt] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimitCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session on mount
  useEffect(() => {
    initSession();
    return () => {
      clearTimeout(inactivityTimerRef.current!);
      clearInterval(rateLimitCheckIntervalRef.current!);
      abortControllerRef.current?.abort();
    };
  }, []);

  const initSession = useCallback(async () => {
    // Try to restore from sessionStorage
    const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const storedHistory = sessionStorage.getItem("sg_history");
    const storedCount = parseInt(sessionStorage.getItem(COUNT_KEY) || "0", 10);
    const storedLastActivity = parseInt(sessionStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);

    if (storedSessionId && storedHistory) {
      try {
        const history = JSON.parse(storedHistory) as ChatMessage[];
        const now = Date.now();
        const lastActivity = storedLastActivity || now;
        const inactiveMs = now - lastActivity;

        // Check if session expired (5 min default, will be overridden by config)
        if (inactiveMs < 5 * 60 * 1000) {
          setSessionId(storedSessionId);
          setHistory(history);
          setCount(storedCount);
          setLastActivity(lastActivity);
          console.log("[useSalesGama] Restored session:", storedSessionId);
        } else {
          // Session expired - clean up and start fresh
          await endSession(storedSessionId);
        }
      } catch {
        // Corrupted storage - start fresh
        clearStorage();
      }
    }

    // Always fetch config
    await fetchConfig();

    // If no valid session, create new one
    if (!sessionId) {
      await createSession();
    }

    // Start inactivity checker
    startInactivityChecker();
    startRateLimitChecker();
  }, []);

  const createSession = useCallback(async () => {
    try {
      const res = await fetch("/api/sales-gama/session/init", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to create session");
      const { sessionId: newSessionId } = await res.json();
      setSessionId(newSessionId);
      sessionStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
      sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      sessionStorage.setItem(COUNT_KEY, "0");
      sessionStorage.setItem("sg_history", JSON.stringify([]));
      console.log("[useSalesGama] Created session:", newSessionId);
    } catch (error) {
      console.error("[useSalesGama] createSession error:", error);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/sales-gama/config", { credentials: "include" });
      if (res.ok) {
        const { config: fetchedConfig } = await res.json();
        setConfig(fetchedConfig);
      }
    } catch (error) {
      console.error("[useSalesGama] fetchConfig error:", error);
    }
  }, []);

  // Inactivity timeout (default 5 min, overridden by config)
  const startInactivityChecker = useCallback(() => {
    clearTimeout(inactivityTimerRef.current!);
    const timeoutMs = (config?.timeoutMin ?? 5) * 60 * 1000;

    inactivityTimerRef.current = setTimeout(() => {
      const lastActivity = parseInt(sessionStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);
      if (Date.now() - lastActivity >= timeoutMs) {
        handleInactivityTimeout();
      } else {
        startInactivityChecker(); // Re-check
      }
    }, Math.min(timeoutMs, 60000)); // Check at least every minute
  }, [config]);

  const startRateLimitChecker = useCallback(() => {
    if (rateLimitCheckIntervalRef.current) return;

    rateLimitCheckIntervalRef.current = setInterval(() => {
      const resetAt = rateLimitResetAt;
      if (resetAt && Date.now() >= resetAt) {
        setRateLimited(false);
        setRateLimitResetAt(null);
        const count = parseInt(sessionStorage.getItem(COUNT_KEY) || "0", 10);
        if (count > 0) {
          sessionStorage.setItem(COUNT_KEY, "0");
        }
      }
    }, 5000);
  }, [rateLimitResetAt]);

  const handleInactivityTimeout = useCallback(async () => {
    if (!sessionId) return;
    await endSession(sessionId);
    // Show farewell message
    const farewell = config?.despedida || "Parece que te ausentaste. ¡Estaré aquí cuando vuelvas! 👋";
    addMessage({ role: "assistant", content: farewell });
    options.onSessionEnd?.();
  }, [sessionId, config, options]);

  // State for messages (internal)
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [count, setCount] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const addMessage = useCallback((message: ChatMessage) => {
    setHistory((prev) => {
      const next = [...prev, message];
      sessionStorage.setItem("sg_history", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    sessionStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
  }, []);

  const send = useCallback(async (message: string) => {
    if (!sessionId || isStreaming || rateLimited) return;

    // Local rate limit check
    const currentCount = parseInt(sessionStorage.getItem(COUNT_KEY) || "0", 10);
    const limit = config?.rateLimit ?? 30;
    if (currentCount >= limit) {
      setRateLimited(true);
      setRateLimitResetAt(Date.now() + 5 * 60 * 1000);
      options.onError?.("Límite de mensajes alcanzado. Intenta en 5 minutos.");
      return;
    }

    // Add user message
    const userMsg: ChatMessage = { role: "user", content: message };
    addMessage(userMsg);
    updateLastActivity();
    const newCount = currentCount + 1;
    sessionStorage.setItem(COUNT_KEY, newCount.toString());

    // Prepare request
    const historyForApi = history.slice(-10).map((m) => ({ role: m.role, content: m.content }));
    abortControllerRef.current = new AbortController();

    try {
      setIsStreaming(true);
      setIsLoading(true);

      const res = await fetch("/api/sales-gama/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sg-count": newCount.toString(),
        },
        body: JSON.stringify({ sessionId, message, history: historyForApi }),
        credentials: "include",
        signal: abortControllerRef.current.signal,
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "300", 10);
        setRateLimited(true);
        setRateLimitResetAt(Date.now() + retryAfter * 1000);
        options.onError?.(`Límite alcanzado. Intenta en ${Math.ceil(retryAfter / 60)} min.`);
        setIsStreaming(false);
        setIsLoading(false);
        return;
      }

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "chunk" && data.text) {
              fullText += data.text;
              options.onChunk?.(data.text);
            } else if (data.type === "done") {
              options.onDone?.(fullText);
              // Assistant message will be added by parent via onDone
            } else if (data.type === "error") {
              options.onError?.(data.error);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("[useSalesGama] send error:", error);
      options.onError?.("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, [sessionId, history, config, options]);

  const endSession = useCallback(async (sid: string) => {
    try {
      await fetch("/api/sales-gama/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
        credentials: "include",
      });
    } catch {
      // Ignore
    }
    clearStorage();
    setSessionId(null);
    setHistory([]);
    setCount(0);
  }, []);

  const clearStorage = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem("sg_history");
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem(COUNT_KEY);
  }, []);

  // Expose history setter for external sync (e.g., onDone callback)
  const setHistoryState = useCallback((newHistory: ChatMessage[]) => {
    setHistory(newHistory);
    sessionStorage.setItem("sg_history", JSON.stringify(newHistory));
  }, []);

  return {
    sessionId,
    config,
    history,
    count,
    isLoading,
    isStreaming,
    rateLimited,
    send,
    endSession,
    addMessage,
    setHistory: setHistoryState,
    updateLastActivity,
  };
}

// Helper to clear all SG storage
export function clearSalesGamaStorage() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem("sg_history");
    sessionStorage.removeItem("sg_lastActivity");
    sessionStorage.removeItem("sg_count");
  }
}
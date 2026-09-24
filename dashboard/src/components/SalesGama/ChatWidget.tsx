"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SalesGamaAvatar } from "@/components/SalesGamaAvatar";
import { useSalesGama } from "@/hooks/useSalesGama";
import type { ChatMessage } from "@/lib/sales-gama/types";

const WA_URL = "https://wa.me/56991016912";

function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function ChatMessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "system") {
    return (
      <div className="sg-message system">
        <div className="sg-message-content">
          <span className="sg-system-badge">Sistema</span>
          <p className="sg-message-text">{msg.content}</p>
        </div>
      </div>
    );
  }
  if (msg.role === "assistant") {
    return (
      <div className="sg-message assistant">
        <SalesGamaAvatar state="talking" size={32} />
        <div className="sg-message-content">
          <p className="sg-message-text">{msg.content}</p>
          <time className="sg-message-time">{formatTime()}</time>
        </div>
      </div>
    );
  }
  return (
    <div className="sg-message user">
      <div className="sg-message-content">
        <p className="sg-message-text">{msg.content}</p>
        <time className="sg-message-time">{formatTime()}</time>
      </div>
    </div>
  );
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  const {
    history,
    isLoading,
    isStreaming,
    rateLimited,
    send,
    endSession,
    config,
    sessionId,
  } = useSalesGama({
    onChunk: () => {},
    onDone: () => {},
    onError: () => {},
    onSessionEnd: () => setIsOpen(false),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'button, textarea, a, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      document.addEventListener("keydown", handleTab);
      document.addEventListener("keydown", handleEscape);
      setTimeout(() => textareaRef.current?.focus(), 100);
      return () => {
        document.removeEventListener("keydown", handleTab);
        document.removeEventListener("keydown", handleEscape);
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    send(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      const text = e.currentTarget.value.trim();
      if (text) {
        send(text);
        setInputValue("");
      }
    }
  };

  const handleHumanHandoff = () => {
    const summary = history
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "user" ? "Cliente" : "Bot"}: ${m.content}`)
      .join("\n");
    const text = encodeURIComponent(
      `Hola SALES-GAMA, quiero hablar con un humano.\n\nResumen:\n${summary}`
    );
    window.open(`${WA_URL}?text=${text}`, "_blank");
    endSession(sessionId || "");
  };

  const waUrl = config?.waUrl || WA_URL;

  if (!isOpen) {
    return (
      <button
        className="sg-widget-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir chat SALES-GAMA"
      >
        <SalesGamaAvatar state="idle" size={56} />
        <span className="sg-tooltip">¿Necesitas ayuda?</span>
      </button>
    );
  }

  return (
    <>
      <div className="sg-widget-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />
      <div
        ref={panelRef}
        className="sg-widget-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Chat SALES-GAMA"
      >
        <header className="sg-widget-header">
          <div className="sg-header-left">
            <SalesGamaAvatar state="idle" size={40} />
            <div>
              <h2 className="sg-title">SALES-GAMA</h2>
              <span className="sg-subtitle">Asesor de ventas IA</span>
            </div>
          </div>
          <button className="sg-close-btn" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="sg-widget-messages" role="log" aria-live="polite">
          {history.map((msg, idx) => (
            <ChatMessageBubble key={`${msg.role}-${idx}`} msg={msg} />
          ))}
          {(isStreaming || isLoading) && (
            <div className="sg-message assistant">
              <SalesGamaAvatar state="thinking" size={32} />
              <div className="sg-message-content">
                <span className="sg-typing-dots"><span></span><span></span><span></span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {rateLimited && (
          <div className="sg-rate-limited" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Límite de mensajes alcanzado. Intenta en unos minutos.
          </div>
        )}

        <button className="sg-human-btn" onClick={handleHumanHandoff} disabled={isLoading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Hablar con humano
        </button>

        <form onSubmit={handleSubmit} className="sg-input-form">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              if (e.data) { send(e.data); setInputValue(""); }
            }}
            placeholder="Escribe tu mensaje... (Enter enviar, Shift+Enter salto)"
            rows={1}
            disabled={isLoading || rateLimited}
            aria-label="Tu mensaje"
          />
          <button type="submit" className="sg-send-btn" disabled={!inputValue.trim() || isLoading || rateLimited} aria-label="Enviar mensaje">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>

        <div className="sg-footer">
          <span>Powered by SALES-GAMA</span>
          <span>Msj: {history.filter(m => m.role === 'user').length}/{(config?.rateLimit ?? 30)}</span>
        </div>
      </div>

      <style>{`
        .sg-widget-trigger { position: fixed; bottom: 24px; right: 24px; width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #003366, #0055aa); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(0,51,102,0.3); z-index: 9998; }
        .sg-tooltip { position: absolute; right: 80px; bottom: 50%; transform: translateY(50%); background: #1e3a5f; color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 13px; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
        .sg-widget-trigger:hover .sg-tooltip { opacity: 1; }
        .sg-widget-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9998; }
        .sg-widget-panel { position: fixed; bottom: 24px; right: 24px; width: 380px; max-width: calc(100vw - 48px); height: 600px; max-height: calc(100vh - 48px); background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden; z-index: 9999; }
        @media (max-width: 480px) { .sg-widget-panel { bottom: 0; right: 0; width: 100vw; height: 100vh; border-radius: 0; } }
        .sg-widget-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #e8eef5; background: linear-gradient(135deg, #f8faff, #fff); }
        .sg-header-left { display: flex; align-items: center; gap: 12px; }
        .sg-title { margin: 0; font-size: 16px; font-weight: 700; color: #1e3a5f; }
        .sg-subtitle { font-size: 12px; color: #6b7c93; }
        .sg-close-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; color: #6b7c93; cursor: pointer; }
        .sg-close-btn:hover { background: #f0f4f8; color: #1e3a5f; }
        .sg-widget-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .sg-message { display: flex; gap: 8px; max-width: 85%; }
        .sg-message.user { align-self: flex-end; flex-direction: row-reverse; }
        .sg-message.assistant { align-self: flex-start; }
        .sg-message.system { align-self: center; max-width: 100%; }
        .sg-message-content { padding: 10px 14px; border-radius: 18px; background: #f0f4f8; }
        .sg-message.user .sg-message-content { background: linear-gradient(135deg, #003366, #0055aa); color: #fff; border-bottom-right-radius: 4px; }
        .sg-message.assistant .sg-message-content { border-bottom-left-radius: 4px; }
        .sg-message.system .sg-message-content { background: #fff8e1; color: #856404; border-radius: 8px; font-size: 13px; text-align: center; }
        .sg-message-text { margin: 0; line-height: 1.5; font-size: 14px; white-space: pre-wrap; }
        .sg-message-time { font-size: 10px; opacity: 0.6; text-align: right; }
        .sg-message.user .sg-message-time { color: rgba(255,255,255,0.7); }
        .sg-system-badge { font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .sg-typing-dots { display: flex; gap: 3px; padding: 8px; }
        .sg-typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: #0055aa; animation: sg-bounce 1.4s ease-in-out infinite both; }
        .sg-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .sg-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes sg-bounce { 0%,80%,100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
        .sg-rate-limited { display: flex; align-items: center; gap: 8px; padding: 8px 16px; color: #dc2626; background: #fef2f2; font-size: 12px; }
        .sg-human-btn { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0 16px 12px; padding: 12px; border-radius: 10px; border: 1px solid #0055aa; background: #fff; color: #0055aa; font-weight: 600; cursor: pointer; }
        .sg-human-btn:hover:not(:disabled) { background: #0055aa; color: #fff; }
        .sg-human-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sg-input-form { display: flex; align-items: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid #e8eef5; }
        .sg-input-form textarea { flex: 1; min-height: 44px; max-height: 120px; padding: 10px 14px; border: 1px solid #d0dbe8; border-radius: 10px; font-family: inherit; font-size: 14px; resize: none; outline: none; }
        .sg-input-form textarea:focus { border-color: #0055aa; box-shadow: 0 0 0 3px rgba(0,85,170,0.15); }
        .sg-input-form textarea:disabled { background: #f8faff; color: #999; }
        .sg-send-btn { width: 44px; height: 44px; border-radius: 50%; border: none; background: linear-gradient(135deg, #003366, #0055aa); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sg-send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,51,102,0.4); }
        .sg-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sg-footer { display: flex; justify-content: space-between; padding: 8px 16px; font-size: 11px; color: #999; border-top: 1px solid #e8eef5; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </>
  );
}

export default ChatWidget;

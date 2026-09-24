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
    </>
  );
}

export default ChatWidget;

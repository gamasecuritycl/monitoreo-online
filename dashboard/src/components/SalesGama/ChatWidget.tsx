"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SalesGamaAvatar } from "@/components/SalesGamaAvatar";
import { useSalesGama } from "@/hooks/useSalesGama";
import type { ChatMessage } from "@/lib/sales-gama/types";

const WA_URL = "https://wa.me/56991016912";

function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function ChatMessageBubble({
  msg,
  onQuickReply,
}: {
  msg: ChatMessage;
  onQuickReply?: (text: string) => void;
}) {
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

  // Detectar si el bot está sugiriendo una comuna
  const isAssistant = msg.role === "assistant";
  const comunaMatch = isAssistant
    ? msg.content.match(/(?:¿Te refieres a|¿Estás en|¿Es en)(?:\s+la comuna de)?\s+\*?\*?([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+?)\*?\*?\?/i)
    : null;
  const suggestedComuna = comunaMatch ? comunaMatch[1].trim() : null;

  if (isAssistant) {
    return (
      <div className="sg-message assistant">
        <SalesGamaAvatar state="talking" size={32} />
        <div className="sg-message-content">
          <p className="sg-message-text" dangerouslySetInnerHTML={{ __html: formatMessageText(msg.content) }} />
          
          {suggestedComuna && onQuickReply && (
            <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-[#1e3a5f]/60">
              <button
                type="button"
                onClick={() => onQuickReply(`Sí, exactamente, estoy en ${suggestedComuna}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25d366]/20 border border-[#25d366]/60 text-green-300 rounded-lg text-xs font-semibold hover:bg-[#25d366]/30 transition-colors shadow-sm active:scale-95"
              >
                <span>✅</span> Sí, en {suggestedComuna}
              </button>
              <button
                type="button"
                onClick={() => onQuickReply("No, no es esa. Mi comuna es:")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 border border-rose-500/60 text-rose-300 rounded-lg text-xs font-semibold hover:bg-rose-500/30 transition-colors shadow-sm active:scale-95"
              >
                <span>❌</span> No, escribiré otra
              </button>
            </div>
          )}

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

function formatMessageText(text: string): string {
  // Convertir enlaces y formato simple a HTML seguro
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");

  // Convertir enlaces wa.me a links clickeables
  formatted = formatted.replace(
    /(https:\/\/wa\.me\/[0-9]+[^\s<]*)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#25d366;font-weight:bold;text-decoration:underline;">$1 →</a>'
  );

  return formatted;
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
    addMessage,
  } = useSalesGama({
    onChunk: () => {},
    onDone: (fullText) => addMessage({ role: "assistant", content: fullText }),
    onError: () => {},
    onSessionEnd: () => setIsOpen(false),
  });

  const isGenerating = isStreaming || isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isGenerating]);

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
    if (!text || isGenerating || rateLimited) return;
    setInputValue("");
    send(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      const text = e.currentTarget.value.trim();
      if (text && !isGenerating && !rateLimited) {
        send(text);
        setInputValue("");
      }
    }
  };

  const handleQuickReply = useCallback(
    (replyText: string) => {
      if (!isGenerating && !rateLimited) {
        send(replyText);
      }
    },
    [send, isGenerating, rateLimited]
  );

  if (!isOpen) {
    return (
      <button
        className="sg-widget-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir asesor de ventas GAMA"
      >
        <SalesGamaAvatar state="idle" size={56} />
        <span className="sg-tooltip">Asesor de Ventas GAMA</span>
      </button>
    );
  }

  return (
    <>
      <div className="sg-widget-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />
      <div
        ref={panelRef}
        className="sg-widget-panel flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Asesor de Ventas GAMA"
      >
        {/* Cabecera del Chat */}
        <header className="sg-widget-header flex items-center justify-between pb-2 border-b border-[#1e3a5f]/60">
          <div className="sg-header-left flex items-center gap-3">
            <SalesGamaAvatar state={isGenerating ? "thinking" : "idle"} size={38} />
            <div>
              <h2 className="sg-title text-sm font-bold text-white tracking-wide">
                ASESOR GAMA 24/7
              </h2>
              <span className="sg-subtitle text-[11px] text-[#2997ff] flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Ventas & Monitoreo en Vivo
              </span>
            </div>
          </div>
          <button className="sg-close-btn" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* ── Androide 3D en Escritorio simulando escribir en teclado ── */}
        <div className="px-3 pt-2 pb-1 bg-[#050d1a] border-b border-[#102a43]">
          <SalesGamaAvatar
            variant="desk"
            state={isGenerating ? "thinking" : "idle"}
          />
        </div>

        {/* Listado de mensajes */}
        <div className="sg-widget-messages flex-1 overflow-y-auto" role="log" aria-live="polite">
          {history.length === 0 && (
            <div className="p-4 rounded-xl bg-[#091528] border border-[#1b3558] text-xs text-slate-300 space-y-2 mb-3">
              <p className="font-semibold text-white">¡Hola! Soy tu Asesor Experto de GAMA Seguridad.</p>
              <p>
                Puedo entregarte presupuestos exactos de alarmas inteligentes Vetti, sistemas DSC, cámaras 4K y nuestro plan de monitoreo 24/7 desde <strong>0,9 UF + IVA mensual</strong>.
              </p>
              <p className="text-slate-400">¿Qué tipo de propiedad necesitas proteger (casa, departamento, empresa o parcela)?</p>
            </div>
          )}

          {history.map((msg, idx) => (
            <ChatMessageBubble
              key={`${msg.role}-${idx}`}
              msg={msg}
              onQuickReply={handleQuickReply}
            />
          ))}

          {isGenerating && (
            <div className="sg-message assistant">
              <SalesGamaAvatar state="thinking" size={32} />
              <div className="sg-message-content">
                <div className="flex items-center gap-2 text-xs text-[#2997ff]">
                  <span className="sg-typing-dots">
                    <span></span><span></span><span></span>
                  </span>
                  <span>Escribiendo respuesta técnica...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {rateLimited && (
          <div className="sg-rate-limited text-xs p-2 text-amber-300 bg-amber-950/40 border border-amber-500/40 rounded-lg mx-3 mb-2 flex items-center gap-2" role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Límite temporal de consultas alcanzado. Intenta nuevamente en unos minutos.
          </div>
        )}

        {/* Formulario de entrada */}
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
            placeholder="Escribe tu consulta... (Enter para enviar)"
            rows={1}
            disabled={isGenerating || rateLimited}
            aria-label="Tu mensaje"
          />
          <button
            type="submit"
            className="sg-send-btn"
            disabled={!inputValue.trim() || isGenerating || rateLimited}
            aria-label="Enviar mensaje"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}

export default ChatWidget;
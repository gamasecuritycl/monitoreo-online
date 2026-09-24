"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSalesGama } from "@/hooks/useSalesGama";
import { ChatWidget } from "@/components/SalesGama/ChatWidget";
import type { PreciosData } from "@/lib/sales-gama/types";

type Tab = "prompt" | "precios" | "leads" | "config";

export function SalesGamaModal() {
  const [activeTab, setActiveTab] = useState<Tab>("prompt");
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [precios, setPrecios] = useState<PreciosData>({ version: 1, categorias: [], items: [] });
  const [leads, setLeads] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { history, config: hookConfig } = useSalesGama({});

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "prompt", label: "Prompt Sistema", icon: "✏️" },
    { id: "precios", label: "Precios/Artículos", icon: "📦" },
    { id: "leads", label: "Leads/Historial", icon: "📋" },
    { id: "config", label: "Config", icon: "⚙️" },
  ];

  const notify = useCallback((type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const savePrompt = useCallback(async () => {
    try {
      const res = await fetch("/api/sales-gama/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "prompt", value: prompt }),
        credentials: "include",
      });
      if (res.ok) { notify("success", "Prompt guardado"); }
      else { notify("error", "Error al guardar"); }
    } catch { notify("error", "Error de conexión"); }
  }, [prompt, notify]);

  const savePrecios = useCallback(async () => {
    try {
      const res = await fetch("/api/sales-gama/precios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(precios),
        credentials: "include",
      });
      if (res.ok) { notify("success", "Precios guardados"); }
      else { notify("error", "Error al guardar precios"); }
    } catch { notify("error", "Error de conexión"); }
  }, [precios, notify]);

  const restoreDefaults = useCallback(() => {
    setPrecios({ version: 1, categorias: [], items: [] });
    notify("success", "Precios restaurados a default");
  }, [notify]);

  return (
    <>
      <button className="sg-modal-trigger" onClick={() => setIsOpen(true)} aria-label="Abrir SALES-GAMA">
        <span>SALES-GAMA</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div className="sg-modal-backdrop" onClick={() => setIsOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="sg-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <header className="sg-modal-header">
                <h2>SALES-GAMA</h2>
                <button onClick={() => setIsOpen(false)} aria-label="Cerrar">✕</button>
              </header>

              {/* Tabs */}
              <nav className="sg-modal-tabs" role="tablist">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={activeTab === t.id}
                    className={`sg-tab ${activeTab === t.id ? "active" : ""}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </nav>

              {/* Notification */}
              {notification && (
                <div className={`sg-notification ${notification.type}`} role="alert">
                  {notification.message}
                </div>
              )}

              {/* Content */}
              <div className="sg-modal-content" role="tabpanel">
                <AnimatePresence mode="wait">
                  {activeTab === "prompt" && (
                    <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <label htmlFor="prompt-textarea">System Prompt</label>
                      <textarea
                        id="prompt-textarea"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={12}
                        placeholder="Escribe el prompt del sistema..."
                      />
                      <div className="sg-tab-actions">
                        <span>{(prompt.length / 8000 * 100).toFixed(0)}%</span>
                        <button onClick={savePrompt}>Guardar</button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "precios" && (
                    <motion.div key="precios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <label htmlFor="precios-editor">Precios (JSON)</label>
                      <textarea
                        id="precios-editor"
                        value={JSON.stringify(precios, null, 2)}
                        onChange={(e) => {
                          try { setPrecios(JSON.parse(e.target.value)); } catch {}
                        }}
                        rows={12}
                        placeholder='{"categorias": [...], "items": [...]}'
                      />
                      <div className="sg-tab-actions">
                        <button onClick={savePrecios}>Guardar</button>
                        <button onClick={restoreDefaults}>Restaurar</button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "leads" && (
                    <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="sg-leads-list">
                        {leads.length === 0 ? (
                          <p>No hay leads aún.</p>
                        ) : (
                          leads.map((lead) => (
                            <div key={lead.id} className="sg-lead-card">
                              <strong>{lead.nombre}</strong> — {lead.email}
                              <br />
                              <span>{lead.comuna}</span> — {lead.telefono}
                              <br />
                              <span className="sg-lead-status">{lead.estado}</span>
                              <br />
                              <small>{new Date(lead.created_at).toLocaleString("es-CL")}</small>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "config" && (
                    <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <label>Rate Limit (msg/sesión)</label>
                      <input type="number" defaultValue={hookConfig?.rateLimit ?? 30} min={1} max={100} />
                      <label>Timeout inactividad (min)</label>
                      <input type="number" defaultValue={hookConfig?.timeoutMin ?? 5} min={1} max={60} />
                      <label>Mensaje despedida</label>
                      <textarea defaultValue={hookConfig?.despedida || ""} rows={2} />
                      <label>URL WhatsApp</label>
                      <input type="url" defaultValue={hookConfig?.waUrl || "https://wa.me/56991016912"} />
                      <div className="sg-tab-actions">
                        <button onClick={() => notify("success", "Config guardada")}>Guardar</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat preview */}
              <div className="sg-modal-preview">
                <h3>Vista previa chat</h3>
                <ChatWidget />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .sg-modal-trigger { padding: 10px 20px; border-radius: 8px; background: #003366; color: #fff; border: none; cursor: pointer; font-weight: 600; }
        .sg-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10000; }
        .sg-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 900px; height: 90vh; background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); z-index: 10001; display: flex; flex-direction: column; overflow: hidden; }
        .sg-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e8eef5; }
        .sg-modal-header h2 { margin: 0; color: #1e3a5f; }
        .sg-modal-header button { background: transparent; border: none; font-size: 18px; cursor: pointer; }
        .sg-modal-tabs { display: flex; gap: 4px; padding: 8px 16px; border-bottom: 1px solid #e8eef5; }
        .sg-tab { padding: 8px 16px; border: none; background: transparent; cursor: pointer; border-radius: 8px; font-size: 14px; }
        .sg-tab.active { background: #003366; color: #fff; }
        .sg-modal-content { flex: 1; overflow-y: auto; padding: 16px; }
        .sg-notification { padding: 8px 16px; margin: 8px 16px; border-radius: 8px; font-size: 14px; }
        .sg-notification.success { background: #dcfce7; color: #166534; }
        .sg-notification.error { background: #fef2f2; color: #dc2626; }
        .sg-tab-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
        .sg-tab-actions button { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; }
        .sg-tab-actions button:first-child { background: #003366; color: #fff; }
        textarea { width: 100%; border: 1px solid #d0dbe8; border-radius: 8px; padding: 10px; font-family: monospace; font-size: 13px; resize: vertical; }
        input[type="number"], input[type="url"] { width: 100%; padding: 8px; border: 1px solid #d0dbe8; border-radius: 8px; }
        label { display: block; font-size: 13px; font-weight: 600; color: #1e3a5f; margin-top: 12px; }
        .sg-leads-list { display: flex; flex-direction: column; gap: 8px; }
        .sg-lead-card { padding: 12px; border: 1px solid #d0dbe8; border-radius: 8px; font-size: 14px; }
        .sg-lead-status { font-weight: 600; }
        .sg-modal-preview { height: 300px; border-top: 1px solid #e8eef5; overflow-y: auto; padding: 16px; }
        .sg-modal-preview h3 { margin: 0 0 12px; font-size: 16px; color: #1e3a5f; }
      `}</style>
    </>
  );
}

export default SalesGamaModal;
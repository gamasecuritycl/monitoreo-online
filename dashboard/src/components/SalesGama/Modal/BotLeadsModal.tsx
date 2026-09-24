"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { Lead, LeadMessage } from "@/lib/sales-gama/types";

interface BotLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BotLeadsModal({ isOpen, onClose }: BotLeadsModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<LeadMessage[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales-gama/leads?limit=100");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.items || []);
      } else {
        notify("error", "Error al cargar leads");
      }
    } catch {
      notify("error", "Error de conexión con la base de datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
    }
  }, [isOpen, fetchLeads]);

  // Cargar chat completo de un lead
  const handleOpenChat = async (lead: Lead) => {
    setSelectedLead(lead);
    setSelectedLeadId(lead.id);
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/sales-gama/leads/${lead.id}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      } else {
        notify("error", "Error al obtener la transcripción del chat");
      }
    } catch {
      notify("error", "Error de red al cargar el chat");
    } finally {
      setLoadingChat(false);
    }
  };

  // Cambiar estado del lead
  const handleChangeStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/sales-gama/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, estado: newStatus as any } : l))
        );
        if (selectedLead?.id === leadId) {
          setSelectedLead((prev) => (prev ? { ...prev, estado: newStatus as any } : null));
        }
        notify("success", `Estado actualizado a "${newStatus}"`);
      } else {
        notify("error", "No se pudo actualizar el estado");
      }
    } catch {
      notify("error", "Error al cambiar estado");
    }
  };

  // Filtrado de leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchEstado = filterEstado === "todos" || lead.estado === filterEstado;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (lead.nombre && lead.nombre.toLowerCase().includes(term)) ||
        (lead.telefono && lead.telefono.toLowerCase().includes(term)) ||
        (lead.email && lead.email.toLowerCase().includes(term)) ||
        (lead.comuna && lead.comuna.toLowerCase().includes(term)) ||
        (lead.direccion && lead.direccion.toLowerCase().includes(term)) ||
        (lead.resumen && lead.resumen.toLowerCase().includes(term));

      return matchEstado && matchSearch;
    });
  }, [leads, filterEstado, searchTerm]);

  // Contadores KPI
  const stats = useMemo(() => {
    const total = leads.length;
    const calientes = leads.filter((l) => l.estado === "caliente" || Boolean(l.telefono)).length;
    const nuevos = leads.filter((l) => l.estado === "nuevo").length;
    const derivados = leads.filter((l) => l.estado === "derivado").length;
    const cerrados = leads.filter((l) => l.estado === "cerrado").length;
    return { total, calientes, nuevos, derivados, cerrados };
  }, [leads]);

  // Exportar a CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      notify("error", "No hay leads para exportar");
      return;
    }
    const headers = ["Fecha", "Nombre", "Teléfono", "Email", "Comuna", "Dirección", "Estado", "Resumen"];
    const rows = leads.map((l) => [
      new Date(l.created_at).toLocaleString("es-CL"),
      `"${(l.nombre || "Anónimo").replace(/"/g, '""')}"`,
      `"${(l.telefono || "").replace(/"/g, '""')}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${(l.comuna || "").replace(/"/g, '""')}"`,
      `"${(l.direccion || "").replace(/"/g, '""')}"`,
      l.estado,
      `"${(l.resumen || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_sales_gama_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("success", "Archivo CSV generado y descargado");
  };

  const copyChat = () => {
    if (!chatMessages.length) return;
    const transcript = chatMessages
      .map((m) => `[${new Date(m.created_at).toLocaleTimeString()}] ${m.role === "user" ? "CLIENTE" : "SALES-GAMA"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(transcript);
    notify("success", "Transcripción copiada al portapapeles");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0b1528] border border-blue-900/50 rounded-2xl shadow-2xl shadow-blue-950/60 overflow-hidden text-slate-100">
        
        {/* Notificación Flotante */}
        {notification && (
          <div
            className={`absolute top-4 right-16 z-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg transition-all animate-bounce ${
              notification.type === "success"
                ? "bg-emerald-600/90 text-white border border-emerald-400"
                : "bg-rose-600/90 text-white border border-rose-400"
            }`}
          >
            {notification.text}
          </div>
        )}

        {/* Header Modal */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-blue-900/40 bg-gradient-to-r from-[#0b1528] via-[#0d1d3a] to-[#0b1528]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Leads - Bot</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  SALES-GAMA AI
                </span>
                {stats.calientes > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    🔥 {stats.calientes} Calientes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Información y prospectos capturados automáticamente en tiempo real por el agente de ventas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Cerrar modal"
          >
            ✕
          </button>
        </header>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 px-6 py-3 bg-[#08101f] border-b border-blue-900/30">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Total Prospectos</div>
            <div className="text-xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40">
            <div className="text-xs text-amber-300 font-medium flex items-center gap-1">
              <span>🔥</span> Calientes (con fono)
            </div>
            <div className="text-xl font-bold text-amber-400">{stats.calientes}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/40">
            <div className="text-xs text-blue-300 font-medium">🟢 Nuevos</div>
            <div className="text-xl font-bold text-blue-400">{stats.nuevos}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40">
            <div className="text-xs text-purple-300 font-medium">🔄 Derivados</div>
            <div className="text-xl font-bold text-purple-400">{stats.derivados}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
            <div className="text-xs text-emerald-300 font-medium">🏁 Cerrados</div>
            <div className="text-xl font-bold text-emerald-400">{stats.cerrados}</div>
          </div>
        </div>

        {/* Toolbar de Filtros y Búsqueda */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[#0d182e] border-b border-blue-900/30">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, comuna, correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-3.5 py-1.5 rounded-lg bg-[#070d18] border border-blue-900/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-slate-400 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#070d18] p-0.5 rounded-lg border border-blue-900/60 text-xs">
              {(["todos", "caliente", "nuevo", "derivado", "cerrado"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterEstado(st)}
                  className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                    filterEstado === st
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st === "caliente" ? "🔥 Caliente" : st}
                </button>
              ))}
            </div>

            <button
              onClick={fetchLeads}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              🔄 {loading ? "Cargando..." : "Refrescar"}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 flex items-center gap-1.5 transition-colors"
            >
              📥 Exportar CSV
            </button>
          </div>
        </div>

        {/* Tabla Principal */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span>Cargando prospectos de la base de datos...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-16 bg-[#070e1b]/40 rounded-xl border border-dashed border-blue-900/40">
              <span className="text-4xl">📭</span>
              <h3 className="text-base font-semibold text-slate-200 mt-2">No se encontraron prospectos</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {searchTerm || filterEstado !== "todos"
                  ? "Prueba cambiando los filtros de búsqueda."
                  : "Cuando los usuarios conversen con SALES-GAMA en el sitio web, sus datos aparecerán aquí automáticamente."}
              </p>
            </div>
          ) : (
            <div className="border border-blue-900/40 rounded-xl overflow-hidden bg-[#070e1b]/80 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0b172c] border-b border-blue-900/50 text-slate-300 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Prospecto</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Ubicación</th>
                    <th className="py-3 px-4">Resumen / Interés</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-950/60">
                  {filteredLeads.map((lead) => {
                    const isHot = lead.estado === "caliente" || Boolean(lead.telefono);
                    const phoneClean = lead.telefono ? lead.telefono.replace(/\D/g, "") : "";
                    const waNumber = phoneClean.startsWith("56")
                      ? phoneClean
                      : phoneClean.length === 9
                      ? `56${phoneClean}`
                      : phoneClean;

                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-blue-900/20 transition-colors ${
                          isHot ? "bg-amber-950/10" : ""
                        }`}
                      >
                        {/* Fecha */}
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Nombre */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {lead.nombre || "Anónimo / En proceso"}
                            {isHot && (
                              <span className="inline-block text-xs" title="Lead Caliente con teléfono">
                                🔥
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ID: {lead.id.slice(0, 8)}...
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="py-3 px-4">
                          {lead.telefono ? (
                            <a
                              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                                `Hola ${lead.nombre || ""}, te contactamos de GAMA Seguridad respecto a tu cotización.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                            >
                              <span>📱</span> {lead.telefono}
                            </a>
                          ) : (
                            <span className="text-slate-500 italic">Sin teléfono</span>
                          )}
                          {lead.email && (
                            <div className="text-slate-400 truncate max-w-[180px]" title={lead.email}>
                              ✉️ {lead.email}
                            </div>
                          )}
                        </td>

                        {/* Ubicación */}
                        <td className="py-3 px-4">
                          {lead.comuna ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-900/40 text-blue-300 border border-blue-800/50">
                              📍 {lead.comuna}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">No indicada</span>
                          )}
                          {lead.direccion && (
                            <div className="text-slate-400 text-[11px] mt-0.5 truncate max-w-[160px]" title={lead.direccion}>
                              {lead.direccion}
                            </div>
                          )}
                        </td>

                        {/* Resumen */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-300 line-clamp-2 text-[11px]">
                            {lead.resumen || "Conversación general de consulta."}
                          </p>
                        </td>

                        {/* Estado Selector */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            value={lead.estado}
                            onChange={(e) => handleChangeStatus(lead.id, e.target.value)}
                            className={`px-2 py-1 rounded-md text-xs font-semibold border cursor-pointer focus:outline-none ${
                              lead.estado === "caliente"
                                ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                                : lead.estado === "nuevo"
                                ? "bg-blue-950/80 text-blue-300 border-blue-700/60"
                                : lead.estado === "derivado"
                                ? "bg-purple-950/80 text-purple-300 border-purple-700/60"
                                : "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                            }`}
                          >
                            <option value="nuevo">🟢 Nuevo</option>
                            <option value="caliente">🔥 Caliente</option>
                            <option value="derivado">🔄 Derivado</option>
                            <option value="cerrado">🏁 Cerrado</option>
                          </select>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {lead.telefono && (
                              <a
                                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                                  `Hola ${lead.nombre || ""}, te contactamos de GAMA Seguridad.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow transition-colors"
                                title="Abrir WhatsApp Web"
                              >
                                <span>💬</span> WA
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenChat(lead)}
                              className="px-2 py-1 rounded bg-blue-600/80 hover:bg-blue-500 text-white text-[11px] font-medium flex items-center gap-1 shadow transition-colors"
                              title="Ver transcripción completa"
                            >
                              <span>👁️</span> Chat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between px-6 py-3 border-t border-blue-900/40 bg-[#08101f] text-xs text-slate-400">
          <span>Mostrando {filteredLeads.length} de {leads.length} prospectos capturados</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </footer>

        {/* SUBMODAL: Transcripción del Chat */}
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#081122] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
              {/* Header Submodal */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-900/50 bg-[#0b172e]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Chat con {selectedLead.nombre || "Prospecto"}
                    </h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{selectedLead.telefono || "Sin fono"}</span>
                      {selectedLead.comuna && <span>• 📍 {selectedLead.comuna}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyChat}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                  >
                    📋 Copiar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLead(null);
                      setChatMessages([]);
                    }}
                    className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Mensajes Chat */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#050b16]">
                {loadingChat ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-xs">Cargando transcripción de mensajes...</span>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No se encontraron mensajes registrados para esta sesión.
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                      >
                        <div className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1">
                          <span>{isUser ? "👤 Cliente" : "🤖 SALES-GAMA"}</span>
                          <span>•</span>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                            isUser
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-[#0e1f3d] text-slate-100 border border-blue-900/50 rounded-bl-none shadow-md"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Submodal */}
              <div className="px-5 py-3 border-t border-blue-900/40 bg-[#0b172e] flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Total {chatMessages.length} mensajes en este hilo
                </span>
                <button
                  onClick={() => {
                    setSelectedLead(null);
                    setChatMessages([]);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

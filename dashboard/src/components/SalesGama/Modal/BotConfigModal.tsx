"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { PreciosData, PreciosItem, BotConfig } from "@/lib/sales-gama/types";
import { DEFAULT_SALES_PROMPT } from "@/lib/sales-gama/assistant";
import { SalesGamaAvatar } from "@/components/SalesGamaAvatar";

interface BotConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BotConfigModal({ isOpen, onClose }: BotConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"prompt" | "crud">("prompt");
  const [prompt, setPrompt] = useState("");
  const [botConfig, setBotConfig] = useState<BotConfig>({
    rateLimit: 100,
    timeoutMin: 30,
    despedida: "¡Gracias por contactar a GAMA Seguridad! Te esperamos.",
    waUrl: "https://wa.me/56991016912",
    model: "gemini-1.5-flash",
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
  });
  const [precios, setPrecios] = useState<PreciosData>({
    version: 2,
    categorias: ["Monitoreo 24/7", "Alarmas Inteligentes", "Alarmas Cableadas", "Cámaras CCTV", "Cercos Eléctricos", "Promociones"],
    items: [],
  });

  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<PreciosItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  // Cargar configuración existente
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resConfig, resPrecios] = await Promise.all([
        fetch("/api/sales-gama/config"),
        fetch("/api/sales-gama/precios"),
      ]);

      if (resConfig.ok) {
        const data = await resConfig.json();
        if (data.prompt) setPrompt(data.prompt);
        else setPrompt(DEFAULT_SALES_PROMPT);
        if (data.config) setBotConfig(data.config);
      } else {
        setPrompt(DEFAULT_SALES_PROMPT);
      }

      if (resPrecios.ok) {
        const dataP = await resPrecios.json();
        if (dataP.precios) setPrecios(dataP.precios);
      }
    } catch {
      notify("error", "Error al conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Guardar Prompt y Parámetros
  const handleSavePromptAndConfig = async () => {
    setLoading(true);
    try {
      const res1 = await fetch("/api/sales-gama/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "prompt", value: prompt }),
      });
      const res2 = await fetch("/api/sales-gama/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "config", value: botConfig }),
      });

      if (res1.ok && res2.ok) {
        notify("success", "¡Prompt y parámetros del Sales-Bot guardados exitosamente!");
      } else {
        notify("error", "Error al guardar configuración en Supabase.");
      }
    } catch {
      notify("error", "Error de red al guardar.");
    } finally {
      setLoading(false);
    }
  };

  // Guardar catálogo completo de precios
  const savePreciosCatalog = async (updated: PreciosData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales-gama/precios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setPrecios(updated);
        notify("success", "Catálogo de productos y promociones actualizado.");
        setEditingItem(null);
        setIsCreatingNew(false);
      } else {
        const err = await res.json();
        notify("error", err.error || "Error al validar el catálogo.");
      }
    } catch {
      notify("error", "Error de conexión al guardar productos.");
    } finally {
      setLoading(false);
    }
  };

  // Guardar o Actualizar un producto específico (CRUD)
  const handleSaveItem = (itemToSave: PreciosItem) => {
    const existingIndex = precios.items.findIndex((i) => i.id === itemToSave.id);
    let newItems = [...precios.items];

    if (existingIndex >= 0) {
      newItems[existingIndex] = itemToSave;
    } else {
      newItems.push(itemToSave);
    }

    // Asegurar categoría
    let newCats = [...precios.categorias];
    if (!newCats.includes(itemToSave.categoria)) {
      newCats.push(itemToSave.categoria);
    }

    const updatedData: PreciosData = {
      ...precios,
      categorias: newCats,
      items: newItems,
    };

    savePreciosCatalog(updatedData);
  };

  // Eliminar un producto
  const handleDeleteItem = (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto o promoción del catálogo del bot?")) return;
    const newItems = precios.items.filter((i) => i.id !== id);
    savePreciosCatalog({ ...precios, items: newItems });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#071322] border border-[#1b3558] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Cabecera Modal */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#1b3558] bg-[#050e1a]">
          <div className="flex items-center gap-3">
            <SalesGamaAvatar state="idle" size={38} />
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Configuración Sales-Bot GAMA
              </h2>
              <p className="text-xs text-slate-400">
                Control de Inteligencia Artificial, System Prompt y Catálogo de Ventas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </header>

        {/* Pestañas de navegación */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#1b3558] bg-[#06111f]">
          <button
            onClick={() => { setActiveTab("prompt"); setEditingItem(null); setIsCreatingNew(false); }}
            className={`px-5 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "prompt"
                ? "bg-[#0c1f38] text-[#2997ff] border-t-2 border-x border-[#1b3558] border-t-[#2997ff]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🤖</span> Prompt & Parámetros IA
          </button>
          <button
            onClick={() => { setActiveTab("crud"); setEditingItem(null); setIsCreatingNew(false); }}
            className={`px-5 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "crud"
                ? "bg-[#0c1f38] text-[#2997ff] border-t-2 border-x border-[#1b3558] border-t-[#2997ff]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📦</span> CRUD Productos & Promociones ({precios.items.length})
          </button>
        </div>

        {/* Notificaciones */}
        {notification && (
          <div
            className={`mx-6 mt-3 px-4 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
              notification.type === "success"
                ? "bg-green-950/80 border border-green-500/50 text-green-300"
                : "bg-red-950/80 border border-red-500/50 text-red-300"
            }`}
          >
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Contenido de Pestañas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#071322]">
          
          {/* ── PESTAÑA 1: PROMPT & PARÁMETROS ── */}
          {activeTab === "prompt" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Sección Prompt */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    System Prompt Maestro (Instrucciones de Venta)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("¿Deseas restaurar las instrucciones maestras oficiales de GAMA (0,9 UF + IVA mensual, disuasión antes de humano y captura de datos)?")) {
                        setPrompt(DEFAULT_SALES_PROMPT);
                      }
                    }}
                    className="text-xs text-[#2997ff] hover:underline"
                  >
                    Restaurar Prompt Oficial GAMA
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={14}
                  className="w-full p-4 rounded-xl bg-[#0a1b33] border border-[#1e3a5f] text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#2997ff] transition-all"
                  placeholder="Instrucciones para el agente de ventas..."
                />
                <p className="text-[11px] text-slate-400">
                  {prompt.length} / 8000 caracteres. El prompt define las directivas de cierre, 0,9 UF + IVA, disuasión antes de humano y captura de datos.
                </p>
              </div>

              {/* Sección Parámetros */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#09172a] border border-[#1b3558]">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Modelo Gemini</label>
                  <select
                    value={botConfig.model}
                    onChange={(e) => setBotConfig({ ...botConfig, model: e.target.value })}
                    className="w-full p-2 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white"
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra Rápido)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Última Gen)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Razonamiento Complejo)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Temperatura: {botConfig.temperature}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={botConfig.temperature}
                    onChange={(e) => setBotConfig({ ...botConfig, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-[#2997ff]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Preciso (0)</span>
                    <span>Creativo (1)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">WhatsApp Derivación</label>
                  <input
                    type="url"
                    value={botConfig.waUrl}
                    onChange={(e) => setBotConfig({ ...botConfig, waUrl: e.target.value })}
                    className="w-full p-2 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white"
                    placeholder="https://wa.me/56991016912"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Rate Limit (Msg/hora)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={botConfig.rateLimit}
                    onChange={(e) => setBotConfig({ ...botConfig, rateLimit: parseInt(e.target.value, 10) || 100 })}
                    className="w-full p-2 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white"
                  />
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSavePromptAndConfig}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[#0066cc] hover:bg-[#2997ff] text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2"
                >
                  {loading ? "Guardando..." : "Guardar Prompt y Parámetros"}
                </button>
              </div>
            </div>
          )}

          {/* ── PESTAÑA 2: CRUD PRODUCTOS & PROMOCIONES ── */}
          {activeTab === "crud" && (
            <div className="space-y-6">
              
              {/* Formulario de Creación / Edición */}
              {(isCreatingNew || editingItem) ? (
                <ItemEditorForm
                  initialItem={editingItem}
                  categorias={precios.categorias}
                  onSave={handleSaveItem}
                  onCancel={() => { setIsCreatingNew(false); setEditingItem(null); }}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">Catálogo de Productos y Promociones</h3>
                      <p className="text-xs text-slate-400">
                        Estos productos alimentan automáticamente las respuestas del bot cuando el cliente consulta precios o sistemas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(true)}
                      className="px-4 py-2 rounded-xl bg-[#25d366] hover:bg-green-500 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <span>＋</span> Nuevo Producto / Promoción
                    </button>
                  </div>

                  {/* Listado en tarjetas */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {precios.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 rounded-xl bg-[#0a1a2e] border border-[#1b3558] flex flex-col justify-between hover:border-[#2997ff]/60 transition-all space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#142e50] text-[#2997ff] border border-[#1e3a5f]">
                              {item.categoria}
                            </span>
                            <span className="text-xs font-bold text-green-400 font-mono">
                              {item.precio_uf || `$${item.precio.toLocaleString("es-CL")}`}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white leading-tight">{item.nombre}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{item.descripcion}</p>

                          <div className="pt-2 text-[11px] text-slate-400">
                            <strong>Palabras clave:</strong> {item.palabras_clave.slice(0, 4).join(", ")}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#162e4e] flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="px-3 py-1.5 rounded-lg bg-[#142e50] hover:bg-[#1f4270] text-xs text-slate-200 transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-xs text-red-300 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Subcomponente Formulario para Crear / Editar Producto
function ItemEditorForm({
  initialItem,
  categorias,
  onSave,
  onCancel,
}: {
  initialItem: PreciosItem | null;
  categorias: string[];
  onSave: (item: PreciosItem) => void;
  onCancel: () => void;
}) {
  const [id, setId] = useState(initialItem?.id || "");
  const [nombre, setNombre] = useState(initialItem?.nombre || "");
  const [categoria, setCategoria] = useState(initialItem?.categoria || categorias[0] || "Alarmas Inteligentes");
  const [nuevaCat, setNuevaCat] = useState("");
  const [precio, setPrecio] = useState<number>(initialItem?.precio ?? 199900);
  const [precioUf, setPrecioUf] = useState(initialItem?.precio_uf || "");
  const [descripcion, setDescripcion] = useState(initialItem?.descripcion || "");
  const [incluye, setIncluye] = useState(initialItem?.incluye?.join("\n") || "");
  const [noIncluye, setNoIncluye] = useState(initialItem?.no_incluye?.join("\n") || "");
  const [palabrasClave, setPalabrasClave] = useState(initialItem?.palabras_clave?.join(", ") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return alert("El nombre es requerido");

    const cleanId = id.trim() || nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const catFinal = nuevaCat.trim() || categoria;

    const item: PreciosItem = {
      id: cleanId,
      nombre: nombre.trim(),
      categoria: catFinal,
      precio: Number(precio) || 0,
      precio_uf: precioUf.trim() || undefined,
      descripcion: descripcion.trim(),
      incluye: incluye.split("\n").map((s) => s.trim()).filter(Boolean),
      no_incluye: noIncluye.split("\n").map((s) => s.trim()).filter(Boolean),
      palabras_clave: palabrasClave.split(",").map((s) => s.trim()).filter(Boolean),
      faq: initialItem?.faq || [{ q: "¿Incluye garantía?", a: "Sí, 12 meses de garantía oficial GAMA." }],
    };

    onSave(item);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-[#09172a] border border-[#1e3a5f] space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-[#162e4e]">
        <h4 className="text-sm font-bold text-white">
          {initialItem ? `Editar Producto: ${initialItem.nombre}` : "Nuevo Producto o Promoción"}
        </h4>
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 hover:text-white">✕ Cancelar</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-1">Nombre Comercial</label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white"
            placeholder="ej: Kit Alarma Vetti Smart 2026"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-1">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white mb-1"
          >
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            value={nuevaCat}
            onChange={(e) => setNuevaCat(e.target.value)}
            placeholder="O escribe nueva categoría..."
            className="w-full p-1.5 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-[11px] text-slate-300"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-1">Precio Referencial CLP</label>
          <input
            type="number"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(Number(e.target.value))}
            className="w-full p-2.5 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white"
            placeholder="ej: 199900 (0 para gratis)"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-1">Precio en UF o Texto Comercial</label>
          <input
            type="text"
            value={precioUf}
            onChange={(e) => setPrecioUf(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white"
            placeholder="ej: 0,9 UF + IVA mensual o Desde $199.900"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-300 font-semibold block mb-1">Descripción para el Bot</label>
        <textarea
          rows={3}
          required
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2.5 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white"
          placeholder="Explicación clara del producto que el bot comunicará al cliente..."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-1">Qué Incluye (1 por línea)</label>
          <textarea
            rows={4}
            value={incluye}
            onChange={(e) => setIncluye(e.target.value)}
            className="w-full p-2 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white"
            placeholder="Sensores magnéticos&#10;Sirena disuasiva&#10;App NT CLICK"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-1">Qué NO Incluye (1 por línea)</label>
          <textarea
            rows={4}
            value={noIncluye}
            onChange={(e) => setNoIncluye(e.target.value)}
            className="w-full p-2 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white"
            placeholder="Monitoreo mensual&#10;Cámaras"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-300 font-semibold block mb-1">Palabras Clave (separadas por coma)</label>
        <input
          type="text"
          value={palabrasClave}
          onChange={(e) => setPalabrasClave(e.target.value)}
          className="w-full p-2.5 rounded-lg bg-[#0c1f38] border border-[#1e3a5f] text-xs text-white"
          placeholder="vetti, alarma casa, inalambrica, sensores, departamento"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#162e4e]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 rounded-xl bg-[#0066cc] hover:bg-[#2997ff] text-white text-xs font-bold shadow-md"
        >
          Guardar en Catálogo
        </button>
      </div>
    </form>
  );
}

export default BotConfigModal;

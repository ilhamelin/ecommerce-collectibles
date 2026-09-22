"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Save,
  RotateCcw,
  ExternalLink,
  Eye,
  CheckCircle,
  AlertCircle,
  Layers,
  Image as ImageIcon,
  Link2,
  Layout,
  Trash2,
  Database,
} from "lucide-react";
import {
  DEFAULT_SIDE_BANNERS,
  SideBannersConfig,
  SideBannerItem,
} from "@/lib/constants/sideBannersDefaults";
import { getAdminHeaders } from "@/lib/auth/security";

export default function AdminSideBannersPage() {
  const [config, setConfig] = useState<SideBannersConfig>(DEFAULT_SIDE_BANNERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        // Direct cache-busting fetch from public API
        const res = await fetch(`/api/side-banners?t=${Date.now()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (json.success && json.data?.config) {
          setConfig(json.data.config);
        } else {
          setConfig(DEFAULT_SIDE_BANNERS);
        }
      } catch (err) {
        console.error("Error al cargar banners laterales:", err);
        setConfig(DEFAULT_SIDE_BANNERS);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const updateBanner = (
    side: "leftBanner" | "rightBanner",
    field: keyof SideBannerItem,
    value: string | boolean
  ) => {
    setConfig((prev) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [field]: value,
      },
    }));
    setHasChanges(true);
    setFeedback(null);
  };

  const handleClearImage = (side: "leftBanner" | "rightBanner") => {
    updateBanner(side, "imageUrl", "");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const res = await fetch("/api/admin/side-banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(),
        },
        body: JSON.stringify({ config }),
      });

      const json = await res.json();
      if (json.success) {
        const persisted = json.data?.persistedInFirestore;
        setFeedback({
          type: "success",
          message: persisted
            ? "¡Imágenes guardadas exitosamente en la base de datos Firestore!"
            : "¡Imágenes guardadas exitosamente en memoria local de la tienda!",
        });
        setHasChanges(false);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("side_banners_updated", { detail: config })
          );
        }
      } else {
        setFeedback({
          type: "error",
          message: json.error || "No se pudieron guardar las imágenes en la base de datos.",
        });
      }
    } catch (err) {
      console.error("Error al guardar banners:", err);
      setFeedback({
        type: "error",
        message: "Error de conexión al conectar con la base de datos.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "¿Deseas limpiar y restablecer las imágenes de los banners laterales?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/admin/side-banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(),
        },
        body: JSON.stringify({ action: "RESET" }),
      });

      const json = await res.json();
      if (json.success && json.data?.config) {
        setConfig(json.data.config);
        setFeedback({
          type: "success",
          message: "Configuración restablecida y guardada en base de datos.",
        });
        setHasChanges(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("side_banners_updated", { detail: json.data.config })
          );
        }
      }
    } catch (err) {
      console.error("Error al restablecer:", err);
      setFeedback({
        type: "error",
        message: "Error de red al restablecer la configuración.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF6B35] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              Personalización Visual
            </span>
            <span className="text-xs font-bold text-slate-500">
              Gestión en Base de Datos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight mt-1 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-[#FF6B35]" />
            Imágenes de Banners Laterales
          </h1>
          <p className="text-sm text-[#666666] mt-1 max-w-2xl">
            Sube o cambia las imágenes estáticas reales que flanquean la tienda en todas las vistas de productos y categorías. Los cambios se guardan directamente en Firestore.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleReset}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-xs font-bold transition shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Tienda</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </Link>

          <button
            onClick={handleSave}
            disabled={saving || loading || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85D25] text-white text-xs font-black transition shadow-md shadow-orange-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Guardando en BD..." : "Guardar en Base de Datos"}</span>
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{feedback.message}</span>
        </div>
      )}

      {/* Master Toggle Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1F3A5F] to-[#142337] flex items-center justify-center text-white shadow-md">
            <Layout className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1A1A1A]">
              Mostrar Banners Laterales en la Tienda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Se muestran en la portada y en todas las vistas de categorías y catálogo en pantallas &ge; 1420px, deteniéndose automáticamente al llegar al footer.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => {
              setConfig((prev) => ({ ...prev, enabled: e.target.checked }));
              setHasChanges(true);
            }}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#FF6B35]"></div>
          <span className="ml-3 text-xs font-black text-slate-700">
            {config.enabled ? "ACTIVADOS" : "DESACTIVADOS"}
          </span>
        </label>
      </div>

      {/* Main Grid: Left and Right Image Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT BANNER IMAGE */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B35] flex items-center justify-center font-black text-xs">
                IZQ
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1A1A1A]">
                  Imagen Lateral Izquierda
                </h3>
                <span className="text-[11px] text-slate-500">
                  Flanco izquierdo visible en la tienda
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.leftBanner.enabled}
                onChange={(e) =>
                  updateBanner("leftBanner", "enabled", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#FF6B35] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#FF6B35]" />
                  URL de la Imagen
                </label>
                {config.leftBanner.imageUrl && (
                  <button
                    type="button"
                    onClick={() => handleClearImage("leftBanner")}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Quitar imagen</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={config.leftBanner.imageUrl}
                onChange={(e) =>
                  updateBanner("leftBanner", "imageUrl", e.target.value)
                }
                placeholder="Pega aquí la URL directa de la imagen (ej: https://...)"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            {/* Visual Preview */}
            <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
              {config.leftBanner.imageUrl ? (
                <img
                  src={config.leftBanner.imageUrl}
                  alt="Vista previa izquierda"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-slate-300">Sin imagen configurada</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ingresa una URL de imagen arriba para activarla
                  </p>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                Lado Izquierdo
              </div>
            </div>

            {/* Target Link */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#FF6B35]" />
                Enlace al hacer clic en la imagen
              </label>
              <input
                type="text"
                value={config.leftBanner.targetUrl}
                onChange={(e) =>
                  updateBanner("leftBanner", "targetUrl", e.target.value)
                }
                placeholder="/catalog?category=VIDEO_GAME"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* RIGHT BANNER IMAGE */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                DER
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1A1A1A]">
                  Imagen Lateral Derecha
                </h3>
                <span className="text-[11px] text-slate-500">
                  Flanco derecho visible (con Asistente IA superpuesto)
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.rightBanner.enabled}
                onChange={(e) =>
                  updateBanner("rightBanner", "enabled", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#FF6B35] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#FF6B35]" />
                  URL de la Imagen
                </label>
                {config.rightBanner.imageUrl && (
                  <button
                    type="button"
                    onClick={() => handleClearImage("rightBanner")}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Quitar imagen</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={config.rightBanner.imageUrl}
                onChange={(e) =>
                  updateBanner("rightBanner", "imageUrl", e.target.value)
                }
                placeholder="Pega aquí la URL directa de la imagen (ej: https://...)"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            {/* Visual Preview */}
            <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
              {config.rightBanner.imageUrl ? (
                <img
                  src={config.rightBanner.imageUrl}
                  alt="Vista previa derecha"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-slate-300">Sin imagen configurada</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ingresa una URL de imagen arriba para activarla
                  </p>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                Lado Derecho
              </div>

              {/* Indicator of AI superimposition */}
              <div className="absolute bottom-2 right-2 bg-gradient-to-r from-[#0F1D30] to-[#1E293B] text-white px-2.5 py-1 rounded-full border border-[#FF6B35]/70 text-[9px] font-bold flex items-center gap-1 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Asistente IA</span>
              </div>
            </div>

            {/* Target Link */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#FF6B35]" />
                Enlace al hacer clic en la imagen
              </label>
              <input
                type="text"
                value={config.rightBanner.targetUrl}
                onChange={(e) =>
                  updateBanner("rightBanner", "targetUrl", e.target.value)
                }
                placeholder="/catalog?category=COLLECTIBLE"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

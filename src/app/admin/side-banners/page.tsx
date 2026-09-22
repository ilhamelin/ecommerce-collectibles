"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Eye,
  CheckCircle,
  AlertCircle,
  Layers,
  ArrowRight,
  X,
  Palette,
  Layout,
  Gamepad2,
  Trophy,
} from "lucide-react";
import {
  DEFAULT_SIDE_BANNERS,
  SideBannersConfig,
  SideBannerItem,
  POPULAR_SIDE_PRESETS,
} from "@/lib/constants/sideBannersDefaults";
import { getAdminHeaders } from "@/lib/auth/security";

const ACCENT_COLORS = [
  { name: "Ámbar Dorado", hex: "#EAB308" },
  { name: "Naranja Omni", hex: "#FF6B35" },
  { name: "Cyan Neón", hex: "#06B6D4" },
  { name: "Rosa Cyberpunk", hex: "#EC4899" },
  { name: "Esmeralda", hex: "#10B981" },
  { name: "Púrpura Royale", hex: "#8B5CF6" },
  { name: "Rojo Carmesí", hex: "#EF4444" },
];

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
        const res = await fetch("/api/admin/side-banners");
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

  const applyPreset = (
    side: "leftBanner" | "rightBanner",
    preset: (typeof POPULAR_SIDE_PRESETS)[0]
  ) => {
    setConfig((prev) => ({
      ...prev,
      [side]: {
        ...prev[side],
        title: preset.title,
        subtitle: preset.subtitle,
        badge: preset.badge,
        imageUrl: preset.imageUrl,
        targetUrl: preset.targetUrl,
        ctaText: preset.ctaText,
        accentColor: preset.accentColor,
      },
    }));
    setHasChanges(true);
    setFeedback(null);
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
        setFeedback({
          type: "success",
          message: "¡Banners laterales guardados exitosamente en la tienda!",
        });
        setHasChanges(false);

        // Notificar en tiempo real a otras ventanas
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("side_banners_updated", { detail: config })
          );
        }
      } else {
        setFeedback({
          type: "error",
          message: json.error || "No se pudieron guardar los banners.",
        });
      }
    } catch (err) {
      console.error("Error al guardar banners:", err);
      setFeedback({
        type: "error",
        message: "Error de conexión al guardar los banners.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "¿Deseas restablecer los banners laterales a los valores originales predeterminados?"
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
          message: "Banners restablecidos a los valores predeterminados.",
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
              Skins & Anuncios Flanqueantes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight mt-1 flex items-center gap-2">
            <Layers className="w-7 h-7 text-[#FF6B35]" />
            Banners Laterales de Portada
          </h1>
          <p className="text-sm text-[#666666] mt-1">
            Configura los banners verticales promocionales ubicados en los laterales de la tienda estilo sitios oficiales de videojuegos.
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
            <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
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

      {/* Master Toggle Bar */}
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
              Aparecen de forma fija en resoluciones de escritorio amplias (&ge; 1420px), adaptándose al layout sin estorbar el contenido central.
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

      {/* Main Grid: Left Banner Editor, Right Banner Editor & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT BANNER EDITOR */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B35] flex items-center justify-center font-black text-xs">
                IZQ
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1A1A1A]">
                  Banner Lateral Izquierdo
                </h3>
                <span className="text-[11px] text-slate-500">
                  Ubicado en el margen izquierdo del catálogo
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

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
              Plantillas Rápidas Populares
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SIDE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset("leftBanner", preset)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-orange-50 hover:border-orange-300 text-[11px] font-bold text-slate-700 transition"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Título Principal
              </label>
              <input
                type="text"
                value={config.leftBanner.title}
                onChange={(e) =>
                  updateBanner("leftBanner", "title", e.target.value)
                }
                placeholder="Ej: ELDEN RING"
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Subtítulo / Edición
              </label>
              <input
                type="text"
                value={config.leftBanner.subtitle}
                onChange={(e) =>
                  updateBanner("leftBanner", "subtitle", e.target.value)
                }
                placeholder="Ej: Shadow of the Erdtree • Edición Física"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Etiqueta / Badge
                </label>
                <input
                  type="text"
                  value={config.leftBanner.badge}
                  onChange={(e) =>
                    updateBanner("leftBanner", "badge", e.target.value)
                  }
                  placeholder="Ej: EXPANSIÓN DEL AÑO"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Texto del Botón CTA
                </label>
                <input
                  type="text"
                  value={config.leftBanner.ctaText}
                  onChange={(e) =>
                    updateBanner("leftBanner", "ctaText", e.target.value)
                  }
                  placeholder="Ej: Ver Videojuegos"
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Enlace de Destino (URL)
              </label>
              <input
                type="text"
                value={config.leftBanner.targetUrl}
                onChange={(e) =>
                  updateBanner("leftBanner", "targetUrl", e.target.value)
                }
                placeholder="/catalog?category=VIDEO_GAME"
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                URL de Imagen de Fondo
              </label>
              <input
                type="text"
                value={config.leftBanner.imageUrl}
                onChange={(e) =>
                  updateBanner("leftBanner", "imageUrl", e.target.value)
                }
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Color de Acento
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.leftBanner.accentColor || "#EAB308"}
                  onChange={(e) =>
                    updateBanner("leftBanner", "accentColor", e.target.value)
                  }
                  className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300 p-0.5"
                />
                <div className="flex flex-wrap gap-1.5">
                  {ACCENT_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() =>
                        updateBanner("leftBanner", "accentColor", col.hex)
                      }
                      className="w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BANNER EDITOR */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                DER
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1A1A1A]">
                  Banner Lateral Derecho
                </h3>
                <span className="text-[11px] text-slate-500">
                  Ubicado en el margen derecho (con Asistente IA superpuesto)
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

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
              Plantillas Rápidas Populares
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SIDE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset("rightBanner", preset)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 text-[11px] font-bold text-slate-700 transition"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Título Principal
              </label>
              <input
                type="text"
                value={config.rightBanner.title}
                onChange={(e) =>
                  updateBanner("rightBanner", "title", e.target.value)
                }
                placeholder="Ej: POKÉMON TCG"
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Subtítulo / Edición
              </label>
              <input
                type="text"
                value={config.rightBanner.subtitle}
                onChange={(e) =>
                  updateBanner("rightBanner", "subtitle", e.target.value)
                }
                placeholder="Ej: Cápsulas PSA 10 & Colección Sellada"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Etiqueta / Badge
                </label>
                <input
                  type="text"
                  value={config.rightBanner.badge}
                  onChange={(e) =>
                    updateBanner("rightBanner", "badge", e.target.value)
                  }
                  placeholder="Ej: GRADUACIÓN MINT"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Texto del Botón CTA
                </label>
                <input
                  type="text"
                  value={config.rightBanner.ctaText}
                  onChange={(e) =>
                    updateBanner("rightBanner", "ctaText", e.target.value)
                  }
                  placeholder="Ej: Ver Cartas PSA"
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Enlace de Destino (URL)
              </label>
              <input
                type="text"
                value={config.rightBanner.targetUrl}
                onChange={(e) =>
                  updateBanner("rightBanner", "targetUrl", e.target.value)
                }
                placeholder="/catalog?category=COLLECTIBLE"
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                URL de Imagen de Fondo
              </label>
              <input
                type="text"
                value={config.rightBanner.imageUrl}
                onChange={(e) =>
                  updateBanner("rightBanner", "imageUrl", e.target.value)
                }
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Color de Acento
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.rightBanner.accentColor || "#FF6B35"}
                  onChange={(e) =>
                    updateBanner("rightBanner", "accentColor", e.target.value)
                  }
                  className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300 p-0.5"
                />
                <div className="flex flex-wrap gap-1.5">
                  {ACCENT_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() =>
                        updateBanner("rightBanner", "accentColor", col.hex)
                      }
                      className="w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE PREVIEW SIMULATION CARD */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#FF6B35]" />
            <h3 className="text-sm font-black text-[#1A1A1A]">
              Vista Previa en Tiempo Real de la Disposición de la Tienda
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Simulación de pantalla de escritorio (&ge; 1420px)
          </span>
        </div>

        {/* Visual Stage Container */}
        <div className="relative w-full bg-[#F3F4F6] rounded-2xl border border-slate-200 p-4 sm:p-8 flex items-center justify-between gap-4 overflow-hidden min-h-[460px]">
          {/* Left Banner Mock */}
          <div
            className={`w-36 h-[380px] rounded-2xl overflow-hidden shadow-xl border border-white/20 relative flex flex-col justify-between p-3 transition-all ${
              config.leftBanner.enabled && config.enabled
                ? "opacity-100 scale-100"
                : "opacity-30 grayscale"
            }`}
            style={{
              backgroundColor: "#0B131E",
              boxShadow: `0 8px 24px -6px ${config.leftBanner.accentColor}50`,
            }}
          >
            {config.leftBanner.imageUrl && (
              <img
                src={config.leftBanner.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90 pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start">
              <span
                className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: config.leftBanner.accentColor }}
              >
                {config.leftBanner.badge || "DESTACADO"}
              </span>
              <span className="w-4 h-4 rounded-full bg-black/60 text-white/70 flex items-center justify-center text-[9px]">
                ✕
              </span>
            </div>

            <div className="relative z-10 text-white">
              <h4 className="text-xs font-black leading-tight">
                {config.leftBanner.title}
              </h4>
              <p className="text-[9px] text-slate-300 line-clamp-2 mt-0.5">
                {config.leftBanner.subtitle}
              </p>

              <div
                className="w-full py-1.5 mt-2 rounded-lg text-[9px] font-black text-center text-white flex items-center justify-center gap-1"
                style={{ backgroundColor: config.leftBanner.accentColor }}
              >
                <span>{config.leftBanner.ctaText}</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>

          {/* Central Mock Store Content */}
          <div className="flex-1 max-w-xl bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FF6B35] text-white flex items-center justify-center text-[10px] font-black">
                  OC
                </div>
                <span className="text-xs font-black text-slate-800">
                  OMNICOLLECTOR CHILE
                </span>
              </div>
              <div className="flex gap-2">
                <div className="w-12 h-3 bg-slate-200 rounded-full" />
                <div className="w-16 h-3 bg-slate-200 rounded-full" />
              </div>
            </div>

            {/* Slider Mock */}
            <div className="h-44 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-800/40">
                  SHOWCASE VITRINA
                </span>
                <h4 className="text-sm font-black">
                  Catálogo Oficial de Coleccionables
                </h4>
                <p className="text-[10px] text-slate-300">
                  Preventas con depósito 20% y piezas graduadas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-orange-400">
                  $ 69.900 CLP
                </span>
                <div className="px-2.5 py-1 bg-[#FF6B35] text-white text-[9px] font-bold rounded-lg">
                  Comprar
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="h-10 bg-slate-100 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
          </div>

          {/* Right Banner Mock with Superimposed Sommelier IA Widget */}
          <div className="relative">
            <div
              className={`w-36 h-[380px] rounded-2xl overflow-hidden shadow-xl border border-white/20 relative flex flex-col justify-between p-3 transition-all ${
                config.rightBanner.enabled && config.enabled
                  ? "opacity-100 scale-100"
                  : "opacity-30 grayscale"
              }`}
              style={{
                backgroundColor: "#0B131E",
                boxShadow: `0 8px 24px -6px ${config.rightBanner.accentColor}50`,
              }}
            >
              {config.rightBanner.imageUrl && (
                <img
                  src={config.rightBanner.imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90 pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start">
                <span
                  className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: config.rightBanner.accentColor }}
                >
                  {config.rightBanner.badge || "GRADUACIÓN MINT"}
                </span>
                <span className="w-4 h-4 rounded-full bg-black/60 text-white/70 flex items-center justify-center text-[9px]">
                  ✕
                </span>
              </div>

              <div className="relative z-10 text-white pb-6">
                <h4 className="text-xs font-black leading-tight">
                  {config.rightBanner.title}
                </h4>
                <p className="text-[9px] text-slate-300 line-clamp-2 mt-0.5">
                  {config.rightBanner.subtitle}
                </p>

                <div
                  className="w-full py-1.5 mt-2 rounded-lg text-[9px] font-black text-center text-white flex items-center justify-center gap-1"
                  style={{ backgroundColor: config.rightBanner.accentColor }}
                >
                  <span>{config.rightBanner.ctaText}</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            {/* SUPERIMPOSED SOMMELIER IA BUTTON AS SHOWN IN USER SKETCH */}
            <div className="absolute -bottom-2 -right-2 z-20 flex items-center gap-1.5 bg-gradient-to-r from-[#0F1D30] to-[#1E293B] text-white px-2.5 py-1.5 rounded-full shadow-lg border border-[#FF6B35]/70">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold">Sommelier IA</span>
              <span className="bg-[#FF6B35] text-white text-[7px] font-black px-1 rounded-full uppercase">
                En vivo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

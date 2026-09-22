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
  ArrowRight,
  Image as ImageIcon,
  Link2,
  Sparkles,
  Layout,
  UploadCloud,
  Check,
} from "lucide-react";
import {
  DEFAULT_SIDE_BANNERS,
  SideBannersConfig,
  SideBannerItem,
  POPULAR_SIDE_PRESETS,
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
        imageUrl: preset.imageUrl,
        targetUrl: preset.targetUrl,
        altText: preset.altText,
        title: preset.title,
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
          message: "¡Imágenes de banners laterales guardadas exitosamente en la tienda!",
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
          message: json.error || "No se pudieron guardar las imágenes.",
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
        "¿Deseas restablecer las imágenes de los banners laterales a los valores originales?"
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
          message: "Imágenes restablecidas a los valores predeterminados.",
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
              Imágenes Laterales Flanqueantes (Skins de Videojuegos)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight mt-1 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-[#FF6B35]" />
            Imágenes de Banners Laterales
          </h1>
          <p className="text-sm text-[#666666] mt-1 max-w-2xl">
            Configura las imágenes estáticas verticales que cubren los márgenes laterales visibles de la tienda estilo webs de videojuegos y productos geeks.
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
              Cubre todo el largo de la pantalla y el ancho visible de los costados en resoluciones &ge; 1420px sin tapar el contenido central.
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
                  Cubre el costado izquierdo de la tienda
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

          {/* Image Preview & URL Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#FF6B35]" />
                URL de la Imagen (Póster Estático)
              </label>
              <input
                type="text"
                value={config.leftBanner.imageUrl}
                onChange={(e) =>
                  updateBanner("leftBanner", "imageUrl", e.target.value)
                }
                placeholder="https://images.unsplash.com/photo-... o URL de imagen"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            {/* Visual Thumbnail */}
            <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
              {config.leftBanner.imageUrl ? (
                <img
                  src={config.leftBanner.imageUrl}
                  alt="Vista previa izquierda"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1" />
                  <span className="text-xs">Sin imagen configurada</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                Costado Izquierdo
              </div>
            </div>

            {/* Quick Game Artwork Presets */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Pósters de Videojuegos Populares (Clic para aplicar):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SIDE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset("leftBanner", preset)}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-orange-50 hover:border-orange-300 text-[10px] font-bold text-slate-700 transition flex items-center gap-1"
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Destination Link */}
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
                  Cubre el costado derecho (con Asistente IA superpuesto)
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

          {/* Image Preview & URL Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#FF6B35]" />
                URL de la Imagen (Póster Estático)
              </label>
              <input
                type="text"
                value={config.rightBanner.imageUrl}
                onChange={(e) =>
                  updateBanner("rightBanner", "imageUrl", e.target.value)
                }
                placeholder="https://images.unsplash.com/photo-... o URL de imagen"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            {/* Visual Thumbnail */}
            <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
              {config.rightBanner.imageUrl ? (
                <img
                  src={config.rightBanner.imageUrl}
                  alt="Vista previa derecha"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1" />
                  <span className="text-xs">Sin imagen configurada</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                Costado Derecho
              </div>

              {/* Indicator of AI superimposition */}
              <div className="absolute bottom-2 right-2 bg-gradient-to-r from-[#0F1D30] to-[#1E293B] text-white px-2 py-1 rounded-full border border-[#FF6B35]/60 text-[9px] font-bold flex items-center gap-1 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Asistente IA aquí</span>
              </div>
            </div>

            {/* Quick Game Artwork Presets */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Pósters de Videojuegos Populares (Clic para aplicar):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SIDE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset("rightBanner", preset)}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 text-[10px] font-bold text-slate-700 transition flex items-center gap-1"
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Destination Link */}
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

      {/* LIVE STOREFRONT SIMULATION PREVIEW */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#FF6B35]" />
            <h3 className="text-sm font-black text-[#1A1A1A]">
              Vista Previa de la Tienda con Imágenes Estáticas y Asistente IA Superpuesto
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Simulación de pantalla de escritorio (&ge; 1420px)
          </span>
        </div>

        {/* Browser Mock Stage */}
        <div className="relative w-full bg-[#E5E7EB] rounded-2xl border border-slate-300 p-3 sm:p-6 flex items-stretch justify-between gap-3 sm:gap-4 overflow-hidden min-h-[460px]">
          {/* Left Static Skin Poster */}
          <div
            className={`w-32 sm:w-40 rounded-2xl overflow-hidden shadow-xl border border-slate-300 relative transition-all ${
              config.leftBanner.enabled && config.enabled
                ? "opacity-100"
                : "opacity-25 grayscale"
            }`}
          >
            {config.leftBanner.imageUrl ? (
              <img
                src={config.leftBanner.imageUrl}
                alt="Banner izquierdo"
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full bg-slate-800" />
            )}
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/60 text-white/80 flex items-center justify-center text-[10px]">
              ✕
            </div>
          </div>

          {/* Center Storefront Content */}
          <div className="flex-1 max-w-xl bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#FF6B35] text-white flex items-center justify-center text-[9px] font-black">
                  OC
                </div>
                <span className="text-[11px] font-black text-slate-800">
                  OMNICOLLECTOR STOREFRONT
                </span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-10 h-2 bg-slate-200 rounded-full" />
                <div className="w-14 h-2 bg-slate-200 rounded-full" />
              </div>
            </div>

            {/* Slider Mock */}
            <div className="h-40 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-3.5 text-white flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-800/40">
                  VITRINA SHOWCASE
                </span>
                <h4 className="text-xs font-black mt-1">
                  Videojuegos, Figuras & Coleccionables
                </h4>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-orange-400">
                  $ 69.900 CLP
                </span>
                <div className="px-2.5 py-1 bg-[#FF6B35] text-white text-[8px] font-bold rounded-lg">
                  Ver Catálogo
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-8 bg-slate-100 rounded-lg" />
            </div>
          </div>

          {/* Right Static Skin Poster with Superimposed Sommelier IA */}
          <div className="relative w-32 sm:w-40">
            <div
              className={`w-full h-full rounded-2xl overflow-hidden shadow-xl border border-slate-300 relative transition-all ${
                config.rightBanner.enabled && config.enabled
                  ? "opacity-100"
                  : "opacity-25 grayscale"
              }`}
            >
              {config.rightBanner.imageUrl ? (
                <img
                  src={config.rightBanner.imageUrl}
                  alt="Banner derecho"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-slate-800" />
              )}
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/60 text-white/80 flex items-center justify-center text-[10px]">
                ✕
              </div>
            </div>

            {/* SOMMELIER IA FLOATING BUTTON SUPERIMPOSED ON BOTTOM-RIGHT */}
            <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-gradient-to-r from-[#0F1D30] to-[#1E293B] text-white px-2.5 py-1.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-[#FF6B35]">
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

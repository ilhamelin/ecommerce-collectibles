"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  Shield,
  Trophy,
  Gamepad2,
  Crown,
  Zap,
  Star,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Store,
  Palette,
  Type,
  Layout,
  Layers,
} from "lucide-react";
import {
  DEFAULT_BRANDING_DATA,
  LOGO_GRADIENT_OPTIONS,
  LOGO_ICON_OPTIONS,
  StoreBrandingData,
} from "@/lib/constants/brandingDefaults";
import { getAdminHeaders } from "@/lib/auth/security";

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  Sparkles,
  Flame,
  Shield,
  Trophy,
  Gamepad2,
  Crown,
  Zap,
  Star,
};

export default function AdminBrandingPage() {
  const [branding, setBranding] = useState<StoreBrandingData>(DEFAULT_BRANDING_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    async function fetchBranding() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/branding");
        const json = await res.json();
        if (json.success && json.data?.branding) {
          setBranding(json.data.branding);
        } else {
          setBranding(DEFAULT_BRANDING_DATA);
        }
      } catch (err) {
        console.error("Error loading branding:", err);
        setBranding(DEFAULT_BRANDING_DATA);
      } finally {
        setLoading(false);
      }
    }
    fetchBranding();
  }, []);

  const updateField = (field: keyof StoreBrandingData, value: any) => {
    setBranding((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
    setFeedback(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const res = await fetch("/api/admin/branding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(),
        },
        body: JSON.stringify({ branding }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: "success",
          message: "¡Logotipo e identidad de marca guardados exitosamente! La cabecera de la tienda ya está actualizada.",
        });
        setHasChanges(false);
      } else {
        setFeedback({
          type: "error",
          message: json.error || "No se pudo guardar la configuración de marca.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Error de conexión con el servidor.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("¿Seguro que deseas restablecer el logotipo, título y subtítulo a los valores oficiales por defecto?")) {
      setBranding(DEFAULT_BRANDING_DATA);
      setHasChanges(true);
      setFeedback(null);
    }
  };

  const CurrentIcon = ICON_COMPONENTS[branding.logoIcon] || Sparkles;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F3A5F]/10 text-[#1F3A5F] text-xs font-bold mb-2">
            <Palette className="w-3.5 h-3.5 text-[#FF6B35]" />
            Personalización Visual • Identidad Corporativa
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1F3A5F] tracking-tight">
            Editor del Logotipo & Identidad
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Modifica la imagen o icono del logotipo, el título principal y el subtítulo que se muestran en la cabecera oficial de la tienda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#E5E5E5] text-xs font-bold text-[#1F3A5F] transition shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-[#FF6B35]" />
            Ver Tienda en Vivo
          </Link>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#E5E5E5] text-xs font-bold text-[#666666] hover:text-[#1A1A1A] transition shadow-xs"
            title="Restablecer valores a los por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md ${
              hasChanges
                ? "bg-[#FF6B35] hover:bg-[#e85d2a] text-white cursor-pointer active:scale-95"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-medium animate-in fade-in duration-300 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{feedback.message}</div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Main Grid: Form Controls (7 cols) + Live Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Editor Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Logotipo (Icono vs Imagen) */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF6B35]" />
                1. Icono o Imagen del Logotipo
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1F3A5F]/10 text-[#1F3A5F]">
                Cabecera & Navbar
              </span>
            </div>

            {/* Mode selector: Icon vs Custom Image */}
            <div className="grid grid-cols-2 gap-2 bg-[#F7F7F5] p-1.5 rounded-2xl border border-[#E5E5E5]">
              <button
                type="button"
                onClick={() => updateField("logoMode", "icon")}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                  branding.logoMode === "icon"
                    ? "bg-white text-[#1F3A5F] shadow-sm border border-[#E5E5E5]"
                    : "text-[#666666] hover:text-[#1A1A1A]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
                Icono Vectorial + Gradiente
              </button>

              <button
                type="button"
                onClick={() => updateField("logoMode", "image")}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                  branding.logoMode === "image"
                    ? "bg-white text-[#1F3A5F] shadow-sm border border-[#E5E5E5]"
                    : "text-[#666666] hover:text-[#1A1A1A]"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#FF6B35]" />
                Imagen Propia (URL / PNG)
              </button>
            </div>

            {/* Mode: Image URL */}
            {branding.logoMode === "image" && (
              <div className="space-y-3 p-4 rounded-2xl bg-[#F7F9FC] border border-[#CBD5E1]">
                <label className="text-xs font-bold text-[#1A1A1A] flex items-center justify-between">
                  <span>URL Directa de la Imagen del Logotipo</span>
                  <span className="text-[10px] text-[#64748B] font-mono">PNG transparente recomendado</span>
                </label>
                <input
                  type="url"
                  value={branding.logoImageUrl || ""}
                  onChange={(e) => updateField("logoImageUrl", e.target.value)}
                  placeholder="https://ejemplo.com/mi-logo.png"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] transition"
                />
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Pega cualquier enlace directo a tu logotipo (Cloudinary, Imgur, Firebase Storage, tu hosting o Unsplash).
                </p>
              </div>
            )}

            {/* Mode: Vector Icon + Gradient */}
            {branding.logoMode === "icon" && (
              <div className="space-y-5">
                {/* Select Icon */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1A1A1A] block">
                    Selecciona el Icono Símbolo
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LOGO_ICON_OPTIONS.map((item) => {
                      const IconComponent = ICON_COMPONENTS[item.id] || Sparkles;
                      const isSelected = branding.logoIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateField("logoIcon", item.id)}
                          className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                            isSelected
                              ? "bg-[#1F3A5F] border-[#FF6B35] text-white shadow-sm ring-2 ring-[#FF6B35]"
                              : "bg-[#FAFAFA] border-[#E5E5E5] text-[#333333] hover:bg-gray-100 hover:border-[#1F3A5F]/30"
                          }`}
                        >
                          <IconComponent className={`w-5 h-5 ${isSelected ? "text-[#FF6B35]" : "text-[#1F3A5F]"}`} />
                          <span className="text-[11px] font-bold">{item.label.split("/")[0].trim()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Select Background Gradient */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1A1A1A] block">
                    Estilo de Gradiente de Fondo
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LOGO_GRADIENT_OPTIONS.map((grad) => {
                      const isSelected = branding.logoBgGradient === grad.id;
                      return (
                        <button
                          key={grad.id}
                          type="button"
                          onClick={() => updateField("logoBgGradient", grad.id)}
                          className={`p-2.5 rounded-xl border flex items-center gap-3 transition text-left ${
                            isSelected
                              ? "border-[#FF6B35] bg-orange-50/50 ring-2 ring-[#FF6B35]"
                              : "border-[#E5E5E5] bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg ${grad.preview} shrink-0 shadow-xs`} />
                          <span className="text-xs font-bold text-[#1A1A1A]">{grad.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Titulo y Subtitulo */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2">
                <Type className="w-4 h-4 text-[#FF6B35]" />
                2. Título Principal & Subtítulo
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1F3A5F]/10 text-[#1F3A5F]">
                Tipografía & Marca
              </span>
            </div>

            {/* Split Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1A1A]">
                  Título Parte 1 (Color Azul Oscuro)
                </label>
                <input
                  type="text"
                  value={branding.titlePrefix}
                  onChange={(e) => updateField("titlePrefix", e.target.value)}
                  placeholder="ej: OMNI"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#FAFAFA] text-xs font-black text-[#1F3A5F] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition uppercase tracking-tight"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1A1A]">
                  Título Parte 2 (Color Naranja Destacado)
                </label>
                <input
                  type="text"
                  value={branding.titleHighlight}
                  onChange={(e) => updateField("titleHighlight", e.target.value)}
                  placeholder="ej: COLLECTOR"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#FAFAFA] text-xs font-black text-[#FF6B35] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition uppercase tracking-tight"
                />
              </div>
            </div>

            {/* Subtitle / Slogan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A] flex items-center justify-between">
                <span>Subtítulo / Eslogan Inferior</span>
                <span className="text-[10px] text-[#666666]">Texto en mayúsculas espaciado</span>
              </label>
              <input
                type="text"
                value={branding.subtitle}
                onChange={(e) => updateField("subtitle", e.target.value)}
                placeholder="ej: CHILE • NICHO COLECCIONISTA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#FAFAFA] text-xs font-medium text-[#444444] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition uppercase tracking-wider"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#1F3A5F] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#FF6B35]" />
              Vista Previa en Tiempo Real
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              ✓ Sincronizado
            </span>
          </div>

          {/* Preview 1: Store Header (White Navbar) */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-lg space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B] block">
              Cabecera de la Tienda (Fondo Claro)
            </span>

            <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                {branding.logoMode === "image" && branding.logoImageUrl ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={branding.logoImageUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=100&auto=format&fit=crop&q=80";
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${branding.logoBgGradient} flex items-center justify-center shadow-md shrink-0`}
                  >
                    <CurrentIcon className="w-5 h-5 text-white" />
                  </div>
                )}

                <div>
                  <div className="text-xl font-black tracking-tight text-[#1F3A5F] leading-tight">
                    {branding.titlePrefix || "OMNI"}
                    <span className="text-[#FF6B35] ml-0.5">{branding.titleHighlight || "COLLECTOR"}</span>
                  </div>
                  <span className="block text-[10px] uppercase tracking-widest text-[#666666] font-medium leading-none mt-1">
                    {branding.subtitle || "CHILE • NICHO COLECCIONISTA"}
                  </span>
                </div>
              </div>

              {/* Simulated navigation elements */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-semibold">Inicio</span>
                <span className="text-[10px] text-gray-400 font-semibold">Catálogo</span>
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px] text-gray-500 font-bold">
                  🛒
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B]">
              Así se verá en la parte superior izquierda de cada página para todos los clientes que visiten la tienda.
            </p>
          </div>

          {/* Preview 2: Dark Theme Representation */}
          <div className="bg-[#1F3A5F] rounded-3xl p-6 border border-[#152842] shadow-lg text-white space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/70 block">
              Pie de Página & Fondos Oscuros
            </span>

            <div className="flex items-center gap-3">
              {branding.logoMode === "image" && branding.logoImageUrl ? (
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={branding.logoImageUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${branding.logoBgGradient} flex items-center justify-center shadow shrink-0`}
                >
                  <CurrentIcon className="w-4 h-4 text-white" />
                </div>
              )}

              <div>
                <div className="text-base font-black tracking-tight text-white leading-tight">
                  {branding.titlePrefix || "OMNI"}
                  <span className="text-[#FF6B35] ml-0.5">{branding.titleHighlight || "COLLECTOR"}</span>
                </div>
                <span className="block text-[9px] uppercase tracking-widest text-white/70 font-medium leading-none mt-0.5">
                  {branding.subtitle || "CHILE • NICHO COLECCIONISTA"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

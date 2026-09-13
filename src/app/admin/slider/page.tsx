"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  Tag,
  Type,
  Link2,
  DollarSign,
  ListChecks,
  ArrowRight,
  Clock,
  Gamepad2,
  Trophy,
  Layers,
  ChevronRight,
} from "lucide-react";
import { DEFAULT_PROMO_SLIDES, PromoSlideData } from "@/lib/constants/sliderDefaults";
import { getAdminHeaders } from "@/lib/auth/security";

export default function AdminSliderPage() {
  const [slides, setSlides] = useState<PromoSlideData[]>(DEFAULT_PROMO_SLIDES);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Fetch current slider settings from API
  useEffect(() => {
    async function fetchSliderSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/slider");
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.slides) && json.data.slides.length > 0) {
          setSlides(json.data.slides);
        } else {
          setSlides(DEFAULT_PROMO_SLIDES);
        }
      } catch (err) {
        console.error("Error loading slider settings:", err);
        setSlides(DEFAULT_PROMO_SLIDES);
      } finally {
        setLoading(false);
      }
    }
    fetchSliderSettings();
  }, []);

  const activeSlide = slides[activeSlideIndex] || slides[0];

  const updateActiveSlide = (field: keyof PromoSlideData, value: any) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[activeSlideIndex] = {
        ...updated[activeSlideIndex],
        [field]: value,
      };
      return updated;
    });
    setHasChanges(true);
    setFeedback(null);
  };

  const updateHighlight = (index: number, value: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      const newHighlights = [...(updated[activeSlideIndex].highlights || [])];
      newHighlights[index] = value;
      updated[activeSlideIndex] = {
        ...updated[activeSlideIndex],
        highlights: newHighlights,
      };
      return updated;
    });
    setHasChanges(true);
  };

  const addHighlight = () => {
    setSlides((prev) => {
      const updated = [...prev];
      const newHighlights = [...(updated[activeSlideIndex].highlights || []), "Nuevo punto destacado"];
      updated[activeSlideIndex] = {
        ...updated[activeSlideIndex],
        highlights: newHighlights,
      };
      return updated;
    });
    setHasChanges(true);
  };

  const removeHighlight = (index: number) => {
    setSlides((prev) => {
      const updated = [...prev];
      const newHighlights = updated[activeSlideIndex].highlights.filter((_, i) => i !== index);
      updated[activeSlideIndex] = {
        ...updated[activeSlideIndex],
        highlights: newHighlights,
      };
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const res = await fetch("/api/admin/slider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(),
        },
        body: JSON.stringify({ slides }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: "success",
          message: "¡Cambios guardados con éxito! El slider del inicio ya está actualizado.",
        });
        setHasChanges(false);
      } else {
        setFeedback({
          type: "error",
          message: json.error || "No se pudieron guardar los cambios en el servidor.",
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      setFeedback({
        type: "error",
        message: "Ocurrió un error de red al intentar guardar los cambios.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("¿Seguro que deseas restablecer todos los slides a sus valores iniciales por defecto?")) {
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      const res = await fetch("/api/admin/slider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(),
        },
        body: JSON.stringify({ action: "RESET" }),
      });

      const json = await res.json();
      if (json.success) {
        setSlides(DEFAULT_PROMO_SLIDES);
        setActiveSlideIndex(0);
        setHasChanges(false);
        setFeedback({
          type: "success",
          message: "El slider se ha restablecido a los valores por defecto.",
        });
      }
    } catch (err) {
      console.error("Reset error:", err);
      setFeedback({
        type: "error",
        message: "No se pudo restablecer el slider.",
      });
    } finally {
      setSaving(false);
    }
  };

  const addNewSlide = () => {
    const newSlide: PromoSlideData = {
      id: `slide-custom-${Date.now()}`,
      tag: "NUEVA PROMOCIÓN • OFERTA ESPECIAL",
      tagIcon: "Sparkles",
      title: "Título de la Promoción:",
      titleHighlight: "Texto Destacado Naranja",
      description: "Descripción detallada de la oferta especial o colección exclusiva para tus clientes en Chile.",
      primaryCtaText: "Ver Oferta",
      primaryCtaHref: "/catalog",
      secondaryCtaText: "Explorar Catálogo",
      secondaryCtaHref: "/catalog",
      productBadge: "Producto Destacado Especial",
      productPrice: "$ 49.990 CLP",
      image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop&q=80",
      highlights: [
        "Despacho rápido a todo Chile",
        "Medios de pago nacionales en cuotas",
        "Garantía oficial y empaque reforzado",
      ],
      gradient: "from-[#FF6B35]/20 via-[#1F3A5F]/20 to-[#1F3A5F]",
    };

    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
    setHasChanges(true);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) {
      alert("Debe existir al menos un slide en el carrusel.");
      return;
    }
    if (!window.confirm("¿Eliminar este slide del carrusel?")) return;

    setSlides((prev) => prev.filter((_, i) => i !== index));
    setActiveSlideIndex(Math.max(0, index - 1));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#004E72] border-t-[#FF6B35] rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-[#555555]">Cargando configuración del slider...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#FF6B35] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Personalización Visual • Portada de la Tienda
          </div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
            Editor del Slider de Inicio
          </h1>
          <p className="text-sm text-[#555555]">
            Modifica textos, llamados a la acción, viñetas de confianza e imágenes en vivo que se muestran en el carrusel principal.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5E5E5] hover:border-[#1F3A5F] text-[#1A1A1A] text-xs font-bold transition shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-[#1F3A5F]" />
            Ver Inicio en Vivo
            <ExternalLink className="w-3 h-3 text-[#666666]" />
          </Link>

          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#ff5421] text-white text-xs font-black transition shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 border shadow-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-red-50 border-red-300 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="text-xs font-bold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline hover:opacity-75"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Slide Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E5E5E5]">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveSlideIndex(idx)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 border ${
              activeSlideIndex === idx
                ? "bg-[#1F3A5F] text-white border-[#1F3A5F] shadow-sm"
                : "bg-white text-[#555555] border-[#E5E5E5] hover:border-[#1F3A5F] hover:text-[#1A1A1A]"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">
              0{idx + 1}
            </span>
            <span className="truncate max-w-[150px]">
              {slide.title || `Slide ${idx + 1}`}
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={addNewSlide}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#F7F7F5] border border-dashed border-[#CCCCCC] text-[#555555] hover:border-[#FF6B35] hover:text-[#FF6B35] transition shrink-0"
          title="Agregar nuevo slide al carrusel"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Slide</span>
        </button>
      </div>

      {/* Main Two-Column Layout: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Editable Form Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
              <div>
                <h2 className="text-base font-black text-[#1A1A1A]">
                  Editar Slide #{activeSlideIndex + 1}
                </h2>
                <span className="text-xs text-[#666666] font-mono">ID: {activeSlide.id}</span>
              </div>
              {slides.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlide(activeSlideIndex)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold transition border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar este Slide
                </button>
              )}
            </div>

            {/* Field: Tag Superior */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#FF6B35]" />
                Etiqueta / Tag Superior
              </label>
              <input
                type="text"
                value={activeSlide.tag || ""}
                onChange={(e) => updateActiveSlide("tag", e.target.value)}
                placeholder="ej: RESERVAS ABIERTAS • IMPORTACIÓN JAPÓN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-medium text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition"
              />
            </div>

            {/* Field: Título Base */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#1F3A5F]" />
                Título Principal
              </label>
              <input
                type="text"
                value={activeSlide.title || ""}
                onChange={(e) => updateActiveSlide("title", e.target.value)}
                placeholder="ej: Figuras Japonesas de Escala:"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-bold text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition"
              />
            </div>

            {/* Field: Título Destacado (Highlight Naranja) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#FF6B35] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
                Texto Destacado (Color Naranja)
              </label>
              <input
                type="text"
                value={activeSlide.titleHighlight || ""}
                onChange={(e) => updateActiveSlide("titleHighlight", e.target.value)}
                placeholder="ej: Reserva con Solo 20% de Pie"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#FF6B35]/30 bg-[#FF6B35]/5 text-xs font-bold text-[#FF6B35] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition"
              />
            </div>

            {/* Field: Descripción */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">
                Descripción Completa
              </label>
              <textarea
                rows={3}
                value={activeSlide.description || ""}
                onChange={(e) => updateActiveSlide("description", e.target.value)}
                placeholder="Escribe una descripción persuasiva y detallada de la promoción..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs text-[#333333] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition leading-relaxed resize-none"
              />
            </div>

            {/* Field: Imagen URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#1F3A5F]" />
                URL de la Imagen Principal del Banner
              </label>
              <input
                type="url"
                value={activeSlide.image || ""}
                onChange={(e) => updateActiveSlide("image", e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition"
              />
              <p className="text-[11px] text-[#737373]">
                Puedes pegar cualquier URL directa de imagen (Unsplash, Cloudinary, Imgur o Firebase Storage).
              </p>
            </div>

            {/* Sub-grid: Botones de Acción */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F0F0F0]">
              <div className="space-y-2">
                <span className="text-xs font-black text-[#FF6B35] block">
                  Botón Principal (CTA Naranja)
                </span>
                <input
                  type="text"
                  value={activeSlide.primaryCtaText || ""}
                  onChange={(e) => updateActiveSlide("primaryCtaText", e.target.value)}
                  placeholder="Texto del botón"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-xs font-semibold"
                />
                <input
                  type="text"
                  value={activeSlide.primaryCtaHref || ""}
                  onChange={(e) => updateActiveSlide("primaryCtaHref", e.target.value)}
                  placeholder="Enlace (ej: /catalog?category=FIGURE)"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-xs font-mono"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black text-[#1F3A5F] block">
                  Botón Secundario (CTA Oscuro)
                </span>
                <input
                  type="text"
                  value={activeSlide.secondaryCtaText || ""}
                  onChange={(e) => updateActiveSlide("secondaryCtaText", e.target.value)}
                  placeholder="Texto del botón"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-xs font-semibold"
                />
                <input
                  type="text"
                  value={activeSlide.secondaryCtaHref || ""}
                  onChange={(e) => updateActiveSlide("secondaryCtaHref", e.target.value)}
                  placeholder="Enlace (ej: /catalog)"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-xs font-mono"
                />
              </div>
            </div>

            {/* Sub-grid: Badge de Producto y Precio en la Card Flotante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F0F0F0]">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1A1A]">
                  Nombre de Producto en la Card Flotante
                </label>
                <input
                  type="text"
                  value={activeSlide.productBadge || ""}
                  onChange={(e) => updateActiveSlide("productBadge", e.target.value)}
                  placeholder="ej: Makima 1/7 Scale PVC • Good Smile"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1A1A]">
                  Precio o Condición en la Card
                </label>
                <input
                  type="text"
                  value={activeSlide.productPrice || ""}
                  onChange={(e) => updateActiveSlide("productPrice", e.target.value)}
                  placeholder="ej: Pie Inicial: $ 49.998 CLP"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-xs font-semibold"
                />
              </div>
            </div>

            {/* Field: Viñetas de Confianza / Highlights */}
            <div className="space-y-2 pt-2 border-t border-[#F0F0F0]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                  Viñetas de Beneficios / Puntos Clave
                </label>
                <button
                  type="button"
                  onClick={addHighlight}
                  className="text-xs text-[#FF6B35] hover:underline font-bold"
                >
                  + Agregar Viñeta
                </button>
              </div>

              <div className="space-y-2">
                {(activeSlide.highlights || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#888888] w-4">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateHighlight(idx, e.target.value)}
                      placeholder="Beneficio destacado..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                    />
                    <button
                      type="button"
                      onClick={() => removeHighlight(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Quitar viñeta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#1F3A5F] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#FF6B35]" />
              Vista Previa en Tiempo Real
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1F3A5F] text-white font-mono">
              Slide {activeSlideIndex + 1} de {slides.length}
            </span>
          </div>

          {/* Render Preview Card matching Home Slider exact aesthetics */}
          <div className="bg-[#F7F7F5] rounded-3xl p-6 border border-[#E5E5E5] shadow-lg relative overflow-hidden space-y-5">
            {/* Top Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1F3A5F] text-[10px] font-bold border border-[#E5E5E5] shadow-xs">
              <Sparkles className="w-3 h-3 text-[#FF6B35]" />
              <span>{activeSlide.tag || "ETIQUETA PROMOCIONAL"}</span>
            </div>

            {/* Titles */}
            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#1A1A1A] leading-tight">
                {activeSlide.title || "Título del Slide"}
              </h3>
              <div className="text-xl font-black text-[#FF6B35] leading-tight">
                {activeSlide.titleHighlight || "Texto Destacado Naranja"}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-[#555555] line-clamp-3 leading-relaxed">
              {activeSlide.description || "Descripción de la oferta visible en la página principal..."}
            </p>

            {/* Bullets */}
            <div className="space-y-1.5">
              {(activeSlide.highlights || []).slice(0, 3).map((hl, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#333333]">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="line-clamp-1">{hl}</span>
                </div>
              ))}
            </div>

            {/* Visual Media Card */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-[#E5E5E5] shadow-sm">
              <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                <img
                  src={activeSlide.image || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80"}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#FF6B35] text-white text-[10px] font-bold shadow">
                  CHILE
                </div>
              </div>

              <div className="p-3.5 bg-white flex items-center justify-between gap-2 border-t border-[#E5E5E5]">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1A1A1A] truncate">
                    {activeSlide.productBadge || "Producto Destacado"}
                  </div>
                  <div className="text-xs font-black text-[#FF6B35]">
                    {activeSlide.productPrice || "$ 49.990 CLP"}
                  </div>
                </div>
                <span className="text-[10px] text-[#FF6B35] font-bold shrink-0 flex items-center gap-0.5">
                  Ver detalle &rarr;
                </span>
              </div>
            </div>

            {/* Buttons Preview */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 py-2 px-3 rounded-xl bg-[#FF6B35] text-white text-xs font-bold text-center shadow-xs truncate">
                {activeSlide.primaryCtaText || "Ver Preventas"} &rarr;
              </div>
              <div className="flex-1 py-2 px-3 rounded-xl bg-[#1F3A5F] text-white text-xs font-bold text-center shadow-xs truncate">
                {activeSlide.secondaryCtaText || "Explorar"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

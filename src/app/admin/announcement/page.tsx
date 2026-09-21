"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone,
  Truck,
  CreditCard,
  Sparkles,
  Phone,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Sliders,
  Palette,
  Layers,
  MessageCircle,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
} from "lucide-react";
import {
  DEFAULT_ANNOUNCEMENT_DATA,
  StoreAnnouncementData,
} from "@/lib/constants/announcementDefaults";
import { getAdminHeaders } from "@/lib/auth/security";

export default function AdminAnnouncementPage() {
  const [announcement, setAnnouncement] = useState<StoreAnnouncementData>(DEFAULT_ANNOUNCEMENT_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/announcement");
        const json = await res.json();
        if (json.success && json.data?.announcement) {
          setAnnouncement(json.data.announcement);
        } else {
          setAnnouncement(DEFAULT_ANNOUNCEMENT_DATA);
        }
      } catch (err) {
        console.error("Error loading announcement settings:", err);
        setAnnouncement(DEFAULT_ANNOUNCEMENT_DATA);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncement();
  }, []);

  const updateField = <K extends keyof StoreAnnouncementData>(
    field: K,
    value: StoreAnnouncementData[K]
  ) => {
    setAnnouncement((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-update whatsapp link if phone is updated
      if (field === "whatsappPhone" && typeof value === "string") {
        const cleanNumber = value.replace(/\D/g, "");
        if (cleanNumber) {
          updated.whatsappLink = `https://wa.me/${cleanNumber}?text=Hola%2C%20tengo%20una%20consulta%20sobre%20un%20producto%20de%20la%20tienda`;
        }
      }
      return updated;
    });
    setHasChanges(true);
    setFeedback(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(),
        },
        body: JSON.stringify({ announcement }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: "success",
          message: "¡Barra superior de anuncios actualizada y sincronizada en toda la tienda!",
        });
        setHasChanges(false);
        // Dispatch local event so header can react instantly without refresh if on same window
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("store_announcement_updated", { detail: announcement }));
        }
      } else {
        throw new Error(json.error || "No se pudo guardar la configuración");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("¿Deseas restablecer la barra superior a los textos y colores originales de fábrica?")) {
      setAnnouncement(DEFAULT_ANNOUNCEMENT_DATA);
      setHasChanges(true);
      setFeedback(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#666666] font-medium">Cargando configuración de la barra de anuncios...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#FF6B35] uppercase tracking-wider">
            <Megaphone className="w-4 h-4" />
            Personalización Visual • Barra Superior de Anuncios
          </div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
            Barra Superior de Avisos & WhatsApp
          </h1>
          <p className="text-sm text-[#555555]">
            Personaliza los textos informativos de envíos, cuotas, sellos de autenticidad y el número de WhatsApp que ven todos los compradores en la cabecera.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/catalog"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F7F7F5] text-[#1A1A1A] text-xs font-semibold border border-[#E5E5E5] transition shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-[#FF6B35]" /> Ver Tienda en Vivo
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#333333] text-xs font-semibold transition"
            title="Restablecer a textos originales"
          >
            <RotateCcw className="w-4 h-4" /> Valores por Defecto
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#ff5421] text-white text-xs font-bold transition shadow-md disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium animate-in fade-in-50 ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-200"
              : "bg-red-950/80 border border-red-500/50 text-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Live Preview Card */}
      <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/60 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF6E42]">
            <Eye className="w-4 h-4" />
            Vista Previa en Vivo (Cabecera Superior del Sitio)
          </div>
          <span className="text-[11px] text-[#9bb5c2] font-mono">Actualización instantánea</span>
        </div>

        {/* The rendered bar preview */}
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-inner">
          {announcement.enabled ? (
            <div
              style={{
                backgroundColor: announcement.backgroundColor,
                color: announcement.textColor,
              }}
              className="px-4 py-2 text-xs transition-colors duration-200"
            >
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px]">
                {/* Left messages */}
                <div className="flex items-center gap-3 flex-wrap">
                  {announcement.shippingEnabled && (
                    <span className="flex items-center gap-1.5 font-bold" style={{ color: announcement.accentColor }}>
                      <Truck className="w-3.5 h-3.5" />
                      <span>{announcement.shippingText}</span>
                      {announcement.shippingHighlight && (
                        <span className="opacity-95">{announcement.shippingHighlight}</span>
                      )}
                    </span>
                  )}

                  {announcement.shippingEnabled && (announcement.paymentEnabled || announcement.guaranteeEnabled) && (
                    <span className="opacity-30">|</span>
                  )}

                  {announcement.paymentEnabled && (
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" style={{ color: announcement.accentColor }} />
                      <span>{announcement.paymentText}</span>
                      <strong style={{ color: announcement.accentColor }}>{announcement.paymentHighlight}</strong>
                    </span>
                  )}

                  {announcement.paymentEnabled && announcement.guaranteeEnabled && (
                    <span className="opacity-30">|</span>
                  )}

                  {announcement.guaranteeEnabled && (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{announcement.guaranteeText}</span>
                    </span>
                  )}
                </div>

                {/* Right: WhatsApp + Auth Preview */}
                <div className="flex items-center gap-2.5">
                  {announcement.whatsappEnabled && (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {announcement.whatsappPulse && (
                        <span className="w-2 h-2 rounded-full bg-[#2E9E5B] animate-pulse" />
                      )}
                      <span>{announcement.whatsappLabel}</span>
                      <strong className="font-mono" style={{ color: announcement.accentColor }}>
                        {announcement.whatsappPhone}
                      </strong>
                    </span>
                  )}

                  <span className="opacity-30">|</span>
                  <span className="opacity-80">Mi cuenta</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-800 text-center text-gray-400 text-xs italic">
              [Barra superior deshabilitada actualmente]
            </div>
          )}
        </div>
      </div>

      {/* Configuration Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Master Toggle & Envíos */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-6">
          {/* Master Switch */}
          <div className="flex items-center justify-between pb-4 border-b border-[#F0F0F0]">
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#FF6B35]" />
                Estado de la Barra Superior
              </h3>
              <p className="text-xs text-[#666666]">
                Activa o desactiva la visualización de la barra completa en la tienda
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateField("enabled", !announcement.enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                announcement.enabled ? "bg-[#2E9E5B]" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  announcement.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Section 1: Envíos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#FF6B35]" />
                1. Información de Envíos & Despacho
              </h4>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#666666]">
                <input
                  type="checkbox"
                  checked={announcement.shippingEnabled}
                  onChange={(e) => updateField("shippingEnabled", e.target.checked)}
                  className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <span>Mostrar</span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#333333] block mb-1">
                  Texto Principal de Envíos
                </label>
                <input
                  type="text"
                  value={announcement.shippingText}
                  onChange={(e) => updateField("shippingText", e.target.value)}
                  placeholder="Ej: Envíos a todo Chile"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#FF6B35] focus:bg-white text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#333333] block mb-1">
                  Empresas / Couriers Destacados (Paréntesis)
                </label>
                <input
                  type="text"
                  value={announcement.shippingHighlight}
                  onChange={(e) => updateField("shippingHighlight", e.target.value)}
                  placeholder="Ej: (Starken / Chilexpress)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#FF6B35] focus:bg-white text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#333333] block mb-1">
                  Enlace al hacer clic (Opcional)
                </label>
                <input
                  type="text"
                  value={announcement.shippingLink}
                  onChange={(e) => updateField("shippingLink", e.target.value)}
                  placeholder="Ej: /tracking"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#FF6B35] focus:bg-white text-[#1A1A1A]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Cuotas & Pagos */}
          <div className="space-y-4 pt-4 border-t border-[#F0F0F0]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#FF6B35]" />
                2. Cuotas & Pasarelas de Pago
              </h4>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#666666]">
                <input
                  type="checkbox"
                  checked={announcement.paymentEnabled}
                  onChange={(e) => updateField("paymentEnabled", e.target.checked)}
                  className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <span>Mostrar</span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#333333] block mb-1">
                  Texto de Promoción
                </label>
                <input
                  type="text"
                  value={announcement.paymentText}
                  onChange={(e) => updateField("paymentText", e.target.value)}
                  placeholder="Ej: Hasta 12 cuotas sin interés con"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#FF6B35] focus:bg-white text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#333333] block mb-1">
                  Medios Destacados (Negrita)
                </label>
                <input
                  type="text"
                  value={announcement.paymentHighlight}
                  onChange={(e) => updateField("paymentHighlight", e.target.value)}
                  placeholder="Ej: Webpay & Mercado Pago"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#FF6B35] focus:bg-white text-[#1A1A1A]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Garantía, WhatsApp & Estilos */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-6">
          {/* Section 3: Originalidad / Garantía */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                3. Sello de Originalidad & Garantía
              </h4>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#666666]">
                <input
                  type="checkbox"
                  checked={announcement.guaranteeEnabled}
                  onChange={(e) => updateField("guaranteeEnabled", e.target.checked)}
                  className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <span>Mostrar</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-medium text-[#333333] block mb-1">
                Texto del Sello de Calidad
              </label>
              <input
                type="text"
                value={announcement.guaranteeText}
                onChange={(e) => updateField("guaranteeText", e.target.value)}
                placeholder="Ej: Figuras 100% Originales & Licenciadas"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#FF6B35] focus:bg-white text-[#1A1A1A]"
              />
            </div>
          </div>

          {/* Section 4: WhatsApp */}
          <div className="space-y-4 pt-4 border-t border-[#F0F0F0]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#2E9E5B]" />
                4. WhatsApp de Atención al Cliente
              </h4>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#666666]">
                <input
                  type="checkbox"
                  checked={announcement.whatsappEnabled}
                  onChange={(e) => updateField("whatsappEnabled", e.target.checked)}
                  className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <span>Mostrar</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#333333] block mb-1">
                  Etiqueta del Canal
                </label>
                <input
                  type="text"
                  value={announcement.whatsappLabel}
                  onChange={(e) => updateField("whatsappLabel", e.target.value)}
                  placeholder="Ej: WhatsApp Atención:"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#FF6B35] focus:bg-white text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#333333] block mb-1">
                  Número Telefónico Visible
                </label>
                <input
                  type="text"
                  value={announcement.whatsappPhone}
                  onChange={(e) => updateField("whatsappPhone", e.target.value)}
                  placeholder="Ej: +56 9 5824 3917"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:outline-none focus:border-[#FF6B35] focus:bg-white text-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#333333]">
                <input
                  type="checkbox"
                  checked={announcement.whatsappPulse}
                  onChange={(e) => updateField("whatsappPulse", e.target.checked)}
                  className="rounded border-gray-300 text-[#2E9E5B] focus:ring-[#2E9E5B]"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2E9E5B] animate-pulse inline-block" />
                  Mostrar indicador verde de atención activa / en línea
                </span>
              </label>
            </div>
          </div>

          {/* Section 5: Colores de la Barra */}
          <div className="space-y-4 pt-4 border-t border-[#F0F0F0]">
            <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#FF6B35]" />
              5. Personalización de Colores
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-[#666666] block mb-1">
                  Fondo Barra
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={announcement.backgroundColor}
                    onChange={(e) => updateField("backgroundColor", e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={announcement.backgroundColor}
                    onChange={(e) => updateField("backgroundColor", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#666666] block mb-1">
                  Color Texto
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={announcement.textColor}
                    onChange={(e) => updateField("textColor", e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={announcement.textColor}
                    onChange={(e) => updateField("textColor", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#666666] block mb-1">
                  Acento / Naranja
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={announcement.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={announcement.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

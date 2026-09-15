"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MessageCircle,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Package,
} from "lucide-react";

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    subject: "PREORDER_INQUIRY" as const,
    message: "",
    b_fax_field: "", // Honeypot
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        setFormData({
          name: "",
          email: "",
          phone: "",
          orderNumber: "",
          subject: "PREORDER_INQUIRY",
          message: "",
          b_fax_field: "",
        });
      } else {
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ general: [data.message || "Error al enviar el formulario."] });
        }
      }
    } catch (err) {
      setErrors({ general: ["No pudimos conectar con el servidor. Intenta de nuevo más tarde."] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase font-black tracking-widest text-[#FF6B35]">
          Atención al Coleccionista
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A]">
          Centro de Contacto & Soporte Oficial
        </h1>
        <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
          ¿Dudas con la llegada de tu preventa japonesa, tu número de seguimiento Starken o una garantía SERNAC? Te respondemos con rapidez y trato personalizado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E5] shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Envíanos un mensaje directo</h2>

          {successMsg ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-[#2E9E5B]/40 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#2E9E5B] mx-auto" />
              <h3 className="text-base font-bold text-[#1A1A1A]">¡Mensaje enviado con éxito!</h3>
              <p className="text-xs text-[#666666]">{successMsg}</p>
              <button
                type="button"
                onClick={() => setSuccessMsg(null)}
                className="mt-2 text-xs font-bold text-[#FF6B35] hover:underline"
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.general[0]}</span>
                </div>
              )}

              {/* Anti-Bot Honeypot Field (Hidden for real users) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="b_fax_field">No completar este campo</label>
                <input
                  type="text"
                  id="b_fax_field"
                  name="b_fax_field"
                  value={formData.b_fax_field}
                  onChange={(e) => setFormData({ ...formData, b_fax_field: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rodrigo Valenzuela"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition"
                  />
                  {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name[0]}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.cl"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition"
                  />
                  {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">N° de Orden (Si aplica)</label>
                  <input
                    type="text"
                    placeholder="Ej. ORD-2026-881923"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Motivo de tu Consulta *</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition"
                >
                  <option value="PREORDER_INQUIRY">Consulta sobre Preventa Japonesa (Arribos & Depósitos)</option>
                  <option value="TRACKING_STATUS">Estado de Despacho & Seguimiento con Courier</option>
                  <option value="SERNAC_WARRANTY">Garantía Legal 6 Meses o Derecho a Retracto</option>
                  <option value="WHOLESALE">Venta Mayorista o Pedidos Especiales</option>
                  <option value="OTHER">Otro motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Mensaje Detallado *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Cuéntanos en qué podemos ayudarte..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition"
                />
                {errors.message && <p className="text-[11px] text-red-600 mt-1">{errors.message[0]}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md hover:shadow-[#FF6B35]/25 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Enviando mensaje...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Consulta a OmniCollector</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Info Boxes (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* WhatsApp Direct Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#2E9E5B]/15 to-[#2E9E5B]/5 border border-[#2E9E5B]/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2E9E5B] text-white flex items-center justify-center shadow-md">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A1A] text-sm">WhatsApp Soporte Inmediato</h3>
                <p className="text-xs text-[#2E9E5B] font-semibold">Respuesta promedio: &lt; 15 minutos</p>
              </div>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed">
              ¿Prefieres resolver tu duda en tiempo real? Escríbenos directamente a nuestro canal verificado de WhatsApp.
            </p>
            <a
              href="https://wa.me/56958243917?text=Hola%20OmniCollector,%20tengo%20una%20consulta%20sobre%20la%20tienda"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#2E9E5B] hover:bg-[#25854C] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Abrir Chat de WhatsApp (+56 9 5824 3917)</span>
            </a>
          </div>

          {/* Quick FAQ links */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4 shadow-xs">
            <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#FF6B35]" />
              Preguntas Frecuentes Rápidas
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="p-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5]">
                <strong className="block text-[#1A1A1A]">¿Cómo funcionan las preventas del 20%?</strong>
                <span className="text-[#666666] mt-0.5 block">
                  Pagas el 20% al reservar y el 80% restante cuando la figura llega a nuestra bodega en Santiago.
                </span>
              </li>
              <li className="p-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5]">
                <strong className="block text-[#1A1A1A]">¿Qué incluye el empaque Collector-Grade?</strong>
                <span className="text-[#666666] mt-0.5 block">
                  Caja de triple cartón corrugado, plástico burbuja de alta densidad y esquineros protectores rígidos.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

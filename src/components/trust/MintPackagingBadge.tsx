"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  X,
  CheckCircle2,
  Lock,
  Boxes,
} from "lucide-react";

export function MintPackagingBadge() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button / Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full inline-flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-[#092634] border border-emerald-500/40 text-left hover:border-emerald-400 transition group shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-[#F9F9F9] tracking-tight">
                Garantía de Caja Mint 10/10 & Empaque Blindado
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                COLECCIONISTA
              </span>
            </div>
            <p className="text-[10px] text-[#9bb5c2]">
              4 capas de protección anti-impacto. Cero esquinas abolladas.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-emerald-400 group-hover:underline shrink-0">
          Ver Protocolo &rarr;
        </span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#092634] border border-[#004E72]/60 text-white shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#F9F9F9]">
                    Protocolo de Empaque Blindado OmniCollector
                  </h3>
                  <span className="text-[11px] text-[#9bb5c2] font-mono">
                    Diseñado por y para coleccionistas exigentes en Chile
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#9bb5c2] hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Intro paragraph */}
            <p className="text-xs text-[#9bb5c2] leading-relaxed">
              Sabemos que para un coleccionista la caja es el 50% del valor del producto. Nunca enviamos figuras o cartas en sobres plásticos. Cada despacho cumple con un protocolo estricto de 4 capas:
            </p>

            {/* 4 Steps */}
            <div className="space-y-2.5 text-xs">
              {/* Layer 1 */}
              <div className="p-3 rounded-xl bg-[#05161f] border border-[#004E72]/40 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-bold text-[#F9F9F9] block">
                    Esquineros Rígidos Anti-Deformación
                  </span>
                  <p className="text-[11px] text-[#9bb5c2] mt-0.5">
                    Refuerzo angular de cartón prensado en las 8 esquinas para neutralizar golpes frontales y caídas.
                  </p>
                </div>
              </div>

              {/* Layer 2 */}
              <div className="p-3 rounded-xl bg-[#05161f] border border-[#004E72]/40 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-bold text-[#F9F9F9] block">
                    Plástico Burbuja de Triple Capa (Heavy Duty)
                  </span>
                  <p className="text-[11px] text-[#9bb5c2] mt-0.5">
                    Mínimo 3 vueltas completas de burbuja gruesa hermética que amortiguan vibraciones de transporte terrestre.
                  </p>
                </div>
              </div>

              {/* Layer 3 */}
              <div className="p-3 rounded-xl bg-[#05161f] border border-[#004E72]/40 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-bold text-[#F9F9F9] block">
                    Caja Máster de Cartón Doble Corrugado
                  </span>
                  <p className="text-[11px] text-[#9bb5c2] mt-0.5">
                    Estructura externa de alta densidad que soporta hasta 25 kg de estiba en centros de distribución de Starken/Chilexpress.
                  </p>
                </div>
              </div>

              {/* Layer 4 */}
              <div className="p-3 rounded-xl bg-[#05161f] border border-[#004E72]/40 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <span className="font-bold text-[#F9F9F9] block">
                    Cinta de Seguridad Inviolable con Sello Térmico
                  </span>
                  <p className="text-[11px] text-[#9bb5c2] mt-0.5">
                    Evidencia instantánea en caso de cualquier intento de apertura en tránsito.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Guarantee Banner */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-400">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Si la caja te llega abollada, te la reemplazamos de inmediato.
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-emerald-500 text-[#092634] font-black text-xs hover:bg-emerald-400 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

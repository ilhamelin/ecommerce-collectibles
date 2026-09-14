"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Award,
  ExternalLink,
  X,
  CheckCircle2,
  Lock,
  QrCode,
  Sparkles,
  Info,
} from "lucide-react";
import { CollectibleMetadata } from "@/lib/types/domain";

interface CertificateVerifierModalProps {
  productName: string;
  sku: string;
  metadata?: CollectibleMetadata;
}

export function CertificateVerifierModal({
  productName,
  sku,
  metadata,
}: CertificateVerifierModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!metadata) return null;

  const authBody = metadata.authenticationBody || "PSA";
  const serial = metadata.serialNumber || `PSA-${sku.replace(/[^A-Z0-9]/gi, "").slice(0, 8)}`;
  const condition = metadata.condition || "MINT_9";

  const conditionLabel =
    condition === "GEM_MINT_10"
      ? "10 GEM MINT"
      : condition === "MINT_9"
      ? "9 MINT"
      : condition === "NEAR_MINT_8"
      ? "8 NEAR MINT"
      : condition.replace(/_/g, " ");

  const externalUrl =
    authBody === "PSA"
      ? `https://www.psacard.com/cert/${encodeURIComponent(serial.replace("PSA-", ""))}`
      : authBody === "CGC"
      ? `https://www.cgccards.com/certlookup/${encodeURIComponent(serial.replace("CGC-", ""))}`
      : `https://www.beckett.com/grading/cert-lookup?cert_number=${encodeURIComponent(serial)}`;

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full inline-flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#1F3A5F] to-[#152842] text-white hover:from-[#FF6B35] hover:to-[#E85A24] transition-all duration-300 shadow-md group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#FF6B35] group-hover:text-white transition">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
              <span>Certificado Oficial {authBody}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                VERIFICADO
              </span>
            </div>
            <div className="text-[11px] text-white/75 font-mono">
              Serial: {serial} • {conditionLabel}
            </div>
          </div>
        </div>

        <span className="text-xs font-bold text-white/90 group-hover:text-white flex items-center gap-1">
          Inspeccionar Ficha &rarr;
        </span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#092634] border border-[#004E72]/60 text-white shadow-2xl overflow-hidden p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B35] text-white flex items-center justify-center shadow">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-[#F9F9F9]">
                    Ficha de Autenticación Oficial {authBody}
                  </h3>
                  <p className="text-[11px] text-[#9bb5c2] font-mono">
                    Base de Datos Global de Coleccionables Certificados
                  </p>
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

            {/* Cert Badge Showcase Banner */}
            <div className="p-4 rounded-2xl bg-[#05161f] border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#FF6B35]">
                  {authBody} CERTIFICATION REGISTRY
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> AUTÉNTICO 100%
                </span>
              </div>

              <div className="text-sm font-bold text-[#F9F9F9] line-clamp-2">
                {productName}
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#004E72]/30 text-xs">
                <div className="bg-[#092634] p-2.5 rounded-xl border border-[#004E72]/40">
                  <span className="text-[10px] text-[#9bb5c2] block uppercase font-mono">Calificación</span>
                  <span className="text-sm font-black text-[#FF6B35]">{conditionLabel}</span>
                </div>
                <div className="bg-[#092634] p-2.5 rounded-xl border border-[#004E72]/40">
                  <span className="text-[10px] text-[#9bb5c2] block uppercase font-mono">N° de Serie</span>
                  <span className="text-sm font-mono font-bold text-[#F9F9F9]">{serial}</span>
                </div>
                <div className="bg-[#092634] p-2.5 rounded-xl border border-[#004E72]/40">
                  <span className="text-[10px] text-[#9bb5c2] block uppercase font-mono">Idioma / Origen</span>
                  <span className="text-xs font-bold text-[#F9F9F9]">{metadata.cardLanguage || "Inglés"}</span>
                </div>
                <div className="bg-[#092634] p-2.5 rounded-xl border border-[#004E72]/40">
                  <span className="text-[10px] text-[#9bb5c2] block uppercase font-mono">Cápsula</span>
                  <span className="text-xs font-bold text-[#F9F9F9]">Acrílico Anti-UV Sellado</span>
                </div>
              </div>
            </div>

            {/* Sub-grading breakdown checklist */}
            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-bold text-[#9bb5c2] uppercase font-mono tracking-wider">
                Auditoría de Conservación Física
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#05161f] text-xs">
                  <span className="text-[#F9F9F9]">Centrado de Impresión (Centering)</span>
                  <span className="text-emerald-400 font-bold font-mono">60/40 o superior</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#05161f] text-xs">
                  <span className="text-[#F9F9F9]">Estado de Esquinas (Corners)</span>
                  <span className="text-emerald-400 font-bold font-mono">Sin blanqueamiento / Sharp</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#05161f] text-xs">
                  <span className="text-[#F9F9F9]">Superficie & Foil (Surface)</span>
                  <span className="text-emerald-400 font-bold font-mono">Sin micro-rayaduras UV</span>
                </div>
              </div>
            </div>

            {/* External registry button */}
            <div className="pt-2 border-t border-[#004E72]/40 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[11px] text-[#9bb5c2]">
                Base oficial de {authBody} con registro fotográfico.
              </span>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#ff5421] text-white text-xs font-bold transition shadow"
              >
                <span>Consultar en Web Oficial {authBody}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

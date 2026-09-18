"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Plane,
  Building2,
  BadgeCheck,
  X,
  FileCheck2,
} from "lucide-react";
import type { DigitalAuthenticityPassport } from "@/lib/types/domain";

interface DigitalPassportCardProps {
  passport: DigitalAuthenticityPassport;
  productName: string;
  sku: string;
}

export function DigitalPassportCard({
  passport,
  productName,
  sku,
}: DigitalPassportCardProps) {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCopyHash = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(passport.verificationHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortHash = `${passport.verificationHash.slice(0, 12)}...${passport.verificationHash.slice(-8)}`;

  return (
    <>
      {/* Passport Preview Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A0F1D] border border-emerald-500/30 p-5 text-white shadow-xl">
        {/* Holographic accent glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 rounded-full bg-[#FF6B35]/10 blur-3xl pointer-events-none" />

        <div className="relative space-y-4">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                    Pasaporte Digital de Autenticidad
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    <BadgeCheck className="w-3 h-3" /> 100% ANTI-BOOTLEG
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-400">
                  {passport.passportId}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition border border-white/10"
              title="Verificar Trazabilidad Completa"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>

          {/* Product and Origin Attributes */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-black/30 p-3 rounded-xl border border-white/5">
            <div>
              <span className="text-[10px] uppercase font-mono text-gray-400 block">
                Licencia / Fabricante
              </span>
              <span className="font-semibold text-gray-100 truncate block">
                {passport.manufacturerOrPublisher}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-gray-400 block">
                Procedencia
              </span>
              <span className="font-semibold text-gray-100 truncate block">
                {passport.originCountry}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-gray-400 block">
                Lote de Inspección
              </span>
              <span className="font-mono text-emerald-300 font-bold block">
                {passport.batchSerialNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-gray-400 block">
                Blindaje Físico
              </span>
              <span className="font-semibold text-gray-200 block">
                Mint 10/10 Sellado
              </span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Fingerprint */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">
                  Firma Criptográfica SHA-256
                </span>
                <span className="font-mono text-[11px] text-gray-300 block truncate">
                  {shortHash}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyHash}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold transition border border-emerald-500/30 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
            >
              Ver Cadena de Custodia (4 Hitos) &rarr;
            </button>

            <Link
              href={passport.tamperProofQrUrl}
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-300 hover:text-white transition px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10"
            >
              <span>Verificar en Registro</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Full Modal for Chain of Custody & Traceability */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#091E2A] border border-emerald-500/40 text-white shadow-2xl overflow-hidden p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-[#F9F9F9]">
                    Pasaporte Digital de Autenticidad & Trazabilidad
                  </h3>
                  <p className="text-xs text-[#9bb5c2] font-mono">
                    Identificador de Ledger: {passport.passportId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#9bb5c2] hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary */}
            <div className="p-4 rounded-2xl bg-[#05141D] border border-emerald-500/30 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider block">
                  Pieza Registrada en OmniCollector
                </span>
                <span className="text-sm font-bold text-white block">
                  {productName}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  SKU: {sku} • Lote: {passport.batchSerialNumber}
                </span>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/40">
                  <Check className="w-3.5 h-3.5" /> 100% Auténtico Oficial
                </span>
              </div>
            </div>

            {/* Provenance Milestones Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[#9bb5c2]">
                Cadena de Custodia & Hitos de Inspección (Audit Trail)
              </h4>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-[#004E72]/50">
                {passport.provenanceMilestones.map((milestone) => (
                  <div
                    key={milestone.stepNumber}
                    className="relative flex items-start gap-4 pl-1"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center shrink-0 z-10 shadow">
                      {milestone.stepNumber}
                    </div>

                    <div className="flex-1 bg-[#05161f] p-4 rounded-2xl border border-[#004E72]/40 space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-sm font-bold text-white">
                          {milestone.title}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {milestone.timestamp.split("T")[0]}
                        </span>
                      </div>

                      <div className="text-xs text-gray-300 leading-relaxed">
                        {milestone.description}
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[11px] text-[#9bb5c2] border-t border-[#004E72]/30 flex-wrap gap-2">
                        <span>
                          <strong>Responsable:</strong> {milestone.actor} ({milestone.location})
                        </span>
                        <span className="font-mono text-[10px] text-gray-400">
                          Proof: {milestone.verificationProofHash.slice(0, 10)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Hash & Verification Footer */}
            <div className="p-4 rounded-2xl bg-[#05141D] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-gray-300">
                  Hash Criptográfico de Integridad (SHA-256)
                </span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  {copied ? "¡Copiado!" : "Copiar Hash Completo"}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-black/60 font-mono text-xs text-gray-300 break-all select-all">
                {passport.verificationHash}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
              <span className="text-xs text-gray-400">
                Garantía inalterable avalada por OmniCollector Chile.
              </span>
              <Link
                href={passport.tamperProofQrUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs shadow-lg transition"
              >
                <span>Abrir Auditoría Pública de Ledger</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

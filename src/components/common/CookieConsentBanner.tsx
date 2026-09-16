"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("omni_cookie_consent");
      if (!consent) {
        // Small delay so it transitions smoothly after initial render
        const timer = setTimeout(() => setShowBanner(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(
        "omni_cookie_consent",
        JSON.stringify({ accepted: true, analytics: true, timestamp: new Date().toISOString() })
      );
    } catch {}
    setShowBanner(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem(
        "omni_cookie_consent",
        JSON.stringify({ accepted: true, analytics: false, timestamp: new Date().toISOString() })
      );
    } catch {}
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="region"
      aria-label="Consentimiento de cookies"
      className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-[#E5E5E5] shadow-2xl space-y-4 animate-fade-in text-xs"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-2xl bg-[#1F3A5F]/10 text-[#1F3A5F] shrink-0 mt-0.5">
          <Cookie className="w-5 h-5 text-[#FF6B35]" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5">
            <span>Aviso de Cookies & Privacidad</span>
            <ShieldCheck className="w-4 h-4 text-[#2E9E5B]" />
          </h3>
          <p className="text-[#4B5563] leading-relaxed">
            Utilizamos cookies técnicas para mantener tu carrito de compras y sesiones seguras, y cookies analíticas para mejorar tu experiencia coleccionista. Puedes aceptar todas o conservar solo las necesarias según la Ley N° 21.719.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-[#E5E5E5]">
        <button
          type="button"
          onClick={handleAcceptAll}
          className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold text-xs transition active:scale-95 text-center cursor-pointer shadow-sm"
        >
          Aceptar Todas
        </button>

        <button
          type="button"
          onClick={handleEssentialOnly}
          className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-[#F7F7F5] hover:bg-[#EAEAE6] text-[#1A1A1A] font-semibold text-xs border border-[#E5E5E5] transition active:scale-95 text-center cursor-pointer"
        >
          Solo Esenciales
        </button>

        <Link
          href="/privacy"
          className="text-[11px] text-[#4B5563] hover:text-[#1A1A1A] hover:underline whitespace-nowrap px-1 py-1"
        >
          Más información
        </Link>
      </div>
    </div>
  );
}

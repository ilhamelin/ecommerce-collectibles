"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global App Error]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E5] text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-black tracking-widest text-rose-600">
            Error Inesperado del Sistema
          </span>
          <h1 className="text-2xl font-black text-[#1A1A1A]">
            Ocurrió un inconveniente al cargar esta sección
          </h1>
          <p className="text-xs text-[#666666] leading-relaxed">
            Nuestro equipo de sistemas ha registrado el evento. Puedes reintentar la operación o volver a la tienda.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-[#666666] bg-[#F7F7F5] py-1 px-2 rounded-lg inline-block">
              Código de diagnóstico: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>

          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-[#F7F7F5] hover:bg-[#EAEAE6] text-[#1A1A1A] border border-[#E5E5E5] text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

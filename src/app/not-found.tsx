import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Ghost, Home, Sparkles } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-[#1F3A5F]/10 border-2 border-[#1F3A5F]/20 text-[#1F3A5F] flex items-center justify-center mx-auto shadow-inner animate-float">
          <Ghost className="w-12 h-12 text-[#FF6B35]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-black tracking-widest text-[#FF6B35]">
            Error 404 • Pieza no encontrada
          </span>
          <h1 className="text-3xl font-black text-[#1A1A1A]">
            ¡Parece que esta figura se agotó o cambió de vitrina!
          </h1>
          <p className="text-xs text-[#666666] leading-relaxed">
            La página o artículo que buscas no existe o fue reubicada en nuestro almacén central. Explora nuestro catálogo o vuelve a la portada.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Ir al Inicio</span>
          </Link>

          <Link
            href="/catalog"
            className="px-6 py-3 rounded-2xl bg-[#FF6B35] hover:bg-[#E85A24] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-[#FF6B35]/25"
          >
            <Compass className="w-4 h-4" />
            <span>Explorar Catálogo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Clock, Award, Sparkles, Cpu, Truck, CreditCard, MessageCircle, Send, Mail } from "lucide-react";

export function StoreFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="mt-20">
      {/* Trust & Guarantee Strip */}
      <div className="bg-[#F7F7F5] border-t border-b border-[#E5E5E5] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#1F3A5F]/10 text-[#1F3A5F]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#1A1A1A] text-sm">Embalaje Blindado Collector-Grade</h4>
              <p className="text-[#666666] text-xs mt-1 leading-relaxed">
                Caja exterior de triple corrugado, plástico burbuja de alta densidad y esquineros rígidos.
                Tus figuras y cajas de colección llegan en condición Mint garantizada a todo Chile.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#1F3A5F]/10 text-[#1F3A5F]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#1A1A1A] text-sm">Reserva con solo 20% de Pie</h4>
              <p className="text-[#666666] text-xs mt-1 leading-relaxed">
                Asegura preventas japonesas pagando solo el 20% inicial en pesos chilenos. El saldo restante se cobra
                cuando la carga arriba a nuestra bodega local.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#1F3A5F]/10 text-[#1F3A5F]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#1A1A1A] text-sm">Webpay Plus & Cuotas Sin Interés</h4>
              <p className="text-[#666666] text-xs mt-1 leading-relaxed">
                Paga de forma 100% segura con tus tarjetas bancarias chilenas (Débito / Crédito) en hasta 3, 6 o 12
                cuotas sin interés.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Block (Deep Navy Brand #1F3A5F) */}
      <div className="bg-[#1F3A5F] text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-black text-base mb-3">
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
              OMNICOLLECTOR CHILE
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Tienda especializada en coleccionismo de alta fidelidad. Importación directa de figuras de Japón, videojuegos
              físicos y cartas TCG certificadas con inventario real y cero sobreventas.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Categorías Principales</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/catalog?category=VIDEO_GAME" className="hover:text-[#FF6B35] transition">
                  Videojuegos PS5, Switch & Xbox
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=FIGURE" className="hover:text-[#FF6B35] transition">
                  Figuras Escala 1/7 & Nendoroid
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=COLLECTIBLE" className="hover:text-[#FF6B35] transition">
                  Cartas TCG Certificadas PSA 9/10
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=BUNDLE" className="hover:text-[#FF6B35] transition">
                  Bundles Compuestos Exclusivos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Logística & Despacho</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-300">Despachos a todo Chile vía Starken & Chilexpress</span>
              </li>
              <li>
                <span className="text-slate-300">Seguimiento en línea con número de orden</span>
              </li>
              <li>
                <span className="text-slate-300">Notificación automática por Email y WhatsApp</span>
              </li>
              <li>
                <span className="text-slate-300">Empaque blindado con esquineros protectores</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Legal & Normativas</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-[#FF6B35] transition flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]"></span>
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#FF6B35] transition flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E9E5B]"></span>
                  Política de Privacidad (Ley 21.719)
                </Link>
              </li>
              <li>
                <span className="text-slate-400">Garantía Legal de 6 Meses (SERNAC)</span>
              </li>
              <li>
                <span className="text-slate-400">Derecho a Retracto (10 días)</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
              Atención & Soporte al Cliente
            </h4>
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">WhatsApp Oficial:</strong> +56 9 5824 3917
              </p>
              <p>
                <strong className="text-white">Email:</strong> contacto@omnicollector.cl
              </p>
              <p>
                <strong className="text-white">Horario:</strong> Lunes a Viernes 09:00 a 19:00 hrs
              </p>
              <div className="pt-2">
                <Link
                  href="/contacto"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold text-xs transition shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Formulario de Contacto</span>
                </Link>
              </div>

              {/* Botones Redes Sociales Oficiales */}
              <div className="pt-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Comunidad & Redes</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://wa.me/56958243917"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp OmniCollector"
                    className="p-2 rounded-xl bg-[#152842] hover:bg-[#2E9E5B] text-white transition-all duration-150 border border-[#2D5180] flex items-center justify-center hover:scale-105"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram OmniCollector"
                    className="p-2 rounded-xl bg-[#152842] hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] text-white transition-all duration-150 border border-[#2D5180] flex items-center justify-center hover:scale-105"
                  >
                    <span className="text-xs font-black">IG</span>
                  </a>
                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok OmniCollector"
                    className="p-2 rounded-xl bg-[#152842] hover:bg-black text-white transition-all duration-150 border border-[#2D5180] flex items-center justify-center hover:scale-105"
                  >
                    <span className="text-xs font-black">TK</span>
                  </a>
                  <a
                    href="https://discord.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Discord OmniCollector"
                    className="p-2 rounded-xl bg-[#152842] hover:bg-[#5865F2] text-white transition-all duration-150 border border-[#2D5180] flex items-center justify-center hover:scale-105"
                  >
                    <span className="text-xs font-black">DC</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Regulatory Compliance Badges Bar */}
        <div className="border-t border-white/10 py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#152842] border border-[#2D5180] text-white font-medium">
                <span className="text-emerald-400">🔒</span> Certificado SSL/TLS 256-bit
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#152842] border border-[#2D5180] text-white font-medium">
                <span className="text-blue-400">💳</span> PCI-DSS Compliant (Sin almacenamiento de tarjetas)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#152842] border border-[#2D5180] text-white font-medium">
                <span className="text-amber-400">⚖️</span> Ley N° 21.719 (Protección de Datos Chile)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#152842] border border-[#2D5180] text-white font-medium">
                <span className="text-purple-400">🛡️</span> SERNAC (Garantía Legal 6 Meses)
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Pagos procesados de forma segura con Mercado Pago & Webpay Plus
            </div>
          </div>
        </div>

        {/* Payment & Logistics Badges Bar */}
        <div className="border-t border-white/10 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © 2026 OmniCollector SpA (Chile). Especialistas en Figuras, Videojuegos y Coleccionismo. Todos los precios en CLP.
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded bg-[#152842] border border-[#2D5180] text-white">WEBPAY PLUS</span>
            <span className="px-2 py-0.5 rounded bg-[#152842] border border-[#2D5180] text-white">REDCOMPRA</span>
            <span className="px-2 py-0.5 rounded bg-[#152842] border border-[#2D5180] text-white">VISA / MASTERCARD</span>
            <span className="px-2 py-0.5 rounded bg-[#152842] border border-[#2D5180] text-[#FF6B35] font-semibold">STARKEN</span>
            <span className="px-2 py-0.5 rounded bg-[#152842] border border-[#2D5180] text-[#FF6B35] font-semibold">CHILEXPRESS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Clock,
  Gamepad2,
  Trophy,
  Layers,
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Tag,
  Package,
} from "lucide-react";

interface PromoSlide {
  id: string;
  tag: string;
  tagIcon: React.ElementType;
  title: string;
  titleHighlight: string;
  description: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  productBadge: string;
  productPrice?: string;
  image: string;
  highlights: string[];
  gradient: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: "slide-preorders",
    tag: "RESERVAS ABIERTAS • IMPORTACIÓN JAPÓN",
    tagIcon: Clock,
    title: "Figuras Japonesas de Escala:",
    titleHighlight: "Reserva con Solo 20% de Pie",
    description:
      "Asegura figuras oficiales de Good Smile Company, Kotobukiya y Alter en pesos chilenos. Congela tu cupo sin recargos sorpresa y cancela el saldo cuando el lote llegue a Santiago.",
    primaryCtaText: "Ver Preventas de Figuras",
    primaryCtaHref: "/catalog?category=FIGURE",
    secondaryCtaText: "Explorar Catálogo",
    secondaryCtaHref: "/catalog",
    productBadge: "Makima 1/7 Scale PVC • Good Smile",
    productPrice: "Pie Inicial: $ 49.998 CLP",
    image:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Pie inicial del 20% en CLP",
      "Precio final congelado contra el dólar",
      "Embalaje blindado anti-golpes",
    ],
    gradient: "from-[#FF6B35]/20 via-[#1F3A5F]/20 to-[#1F3A5F]",
  },
  {
    id: "slide-games",
    tag: "STOCK INMEDIATO • DESPACHO 24H",
    tagIcon: Gamepad2,
    title: "Videojuegos Físicos & Ediciones Deluxe:",
    titleHighlight: "Elden Ring & Estrenos",
    description:
      "Ediciones físicas completas con voucher de expansión y carátula intacta para PS5, Nintendo Switch y Xbox. Stock real garantizado y envíos express a todo Chile.",
    primaryCtaText: "Ver Videojuegos",
    primaryCtaHref: "/catalog?category=VIDEO_GAME",
    secondaryCtaText: "Ver Catálogo en CLP",
    secondaryCtaHref: "/catalog",
    productBadge: "Elden Ring: Shadow of the Erdtree (PS5)",
    productPrice: "$ 79.990 CLP al contado",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Despacho rápido vía Starken y Chilexpress",
      "Hasta 12 cuotas con Webpay Plus",
      "Discos sellados de fábrica con garantía",
    ],
    gradient: "from-[#1F3A5F]/30 via-[#1F3A5F] to-[#1F3A5F]",
  },
  {
    id: "slide-tcg",
    tag: "GRADUACIÓN OFICIAL • PIEZAS ÚNICAS",
    tagIcon: Trophy,
    title: "Cartas TCG & Joyas de Colección:",
    titleHighlight: "Certificación PSA 9 & 10",
    description:
      "Tarjetas históricas de Pokémon selladas con protección anti-UV, holograma de seguridad y número de serie oficial verificable en PSA. Despacho blindado y asegurado a todo Chile.",
    primaryCtaText: "Ver Rarezas TCG",
    primaryCtaHref: "/catalog?category=COLLECTIBLE",
    secondaryCtaText: "Ver Certificados",
    secondaryCtaHref: "/catalog?category=COLLECTIBLE",
    productBadge: "Charizard 1st Edition Base Set • PSA 9 Mint",
    productPrice: "$ 4.890.000 CLP",
    image:
      "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Cápsula hermética UV oficial PSA",
      "Envío express asegurado por Starken / Chilexpress",
      "Autenticidad verificable con código QR",
    ],
    gradient: "from-amber-600/20 via-[#1F3A5F]/20 to-[#1F3A5F]",
  },
  {
    id: "slide-bundles",
    tag: "PACK EXCLUSIVO • AHORRO DIRECTO",
    tagIcon: Layers,
    title: "Bundles Compuestos Exclusivos:",
    titleHighlight: "Juegos, Pines & Artbooks",
    description:
      "Lleva el paquete definitivo de colección con descuento unificado. Descuento automático directo respecto a la compra individual de cada artículo del lote.",
    primaryCtaText: "Ver Bundles Compuestos",
    primaryCtaHref: "/catalog?category=BUNDLE",
    secondaryCtaText: "Explorar Todo",
    secondaryCtaHref: "/catalog",
    productBadge: "Elden Lord Ultimate Collector Bundle",
    productPrice: "$ 124.990 CLP (Ahorro de $ 24.980 CLP)",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Ahorro de hasta $ 25.000 CLP por pack",
      "Todos los productos 100% nuevos y sellados",
      "Caja protectora doble reforzada",
    ],
    gradient: "from-[#FF6B35]/15 via-[#1F3A5F]/30 to-[#1F3A5F]",
  },
];

export function PromotionalSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  }, []);

  // Automatic timer: advances every 6 seconds if not paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const currentSlide = PROMO_SLIDES[currentIndex];
  const TagIcon = currentSlide.tagIcon;

  return (
    <section
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Carrusel Promocional de la Tienda"
    >
      {/* Main Slider Card Container */}
      <div className="relative rounded-3xl bg-white border border-[#E5E5E5] shadow-xl overflow-hidden min-h-[460px] sm:min-h-[480px] lg:min-h-[500px] flex flex-col justify-between">
        {/* Decorative Background Subtle Tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7F7F5] via-white to-[#F7F7F5] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FF6B35]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#1F3A5F]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Content Grid: Text Info (Left) + Hero Product Image (Right) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 sm:p-10 lg:p-12 items-center flex-1">
          {/* Left Column: Copy, Tag, Value Prop and CTAs */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Tag Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1F3A5F]/10 border border-[#1F3A5F]/20 text-[#1F3A5F] text-xs font-bold shadow-sm">
              <TagIcon className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span className="tracking-wider uppercase text-[11px] font-mono">{currentSlide.tag}</span>
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#1A1A1A] tracking-tight leading-tight">
                {currentSlide.title}{" "}
                <span className="text-[#FF6B35] block sm:inline">{currentSlide.titleHighlight}</span>
              </h2>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#666666] max-w-xl leading-relaxed">
              {currentSlide.description}
            </p>

            {/* Trust Highlights Checklist */}
            <div className="flex flex-wrap gap-2 pt-1">
              {currentSlide.highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A] bg-[#F7F7F5] px-2.5 py-1 rounded-lg border border-[#E5E5E5] font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9E5B] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Call To Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={currentSlide.primaryCtaHref}
                className="px-6 py-3 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-[#FF6B35]/25 flex items-center gap-2 group"
              >
                <span>{currentSlide.primaryCtaText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={currentSlide.secondaryCtaHref}
                className="px-5 py-3 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white font-semibold text-xs sm:text-sm transition border border-[#1F3A5F] flex items-center gap-2 shadow-sm"
              >
                <span>{currentSlide.secondaryCtaText}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Featured Product Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden bg-white border border-[#E5E5E5] shadow-xl group">
              {/* Product Cover Image */}
              <div className="relative w-full h-56 sm:h-64 lg:h-72 overflow-hidden bg-[#F7F7F5]">
                <img
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                {/* Top Overlay Badge */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#1A1A1A] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#E5E5E5] shadow-sm">
                    PROMO DESTACADA
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FF6B35] text-white flex items-center gap-1 shadow">
                    <Sparkles className="w-3 h-3" /> CHILE
                  </span>
                </div>
              </div>

              {/* Bottom Card Summary */}
              <div className="p-4 bg-white border-t border-[#E5E5E5] space-y-1.5 text-left">
                <div className="text-xs font-bold text-[#1A1A1A] truncate">
                  {currentSlide.productBadge}
                </div>
                {currentSlide.productPrice && (
                  <div className="text-sm font-mono font-black text-[#FF6B35]">
                    {currentSlide.productPrice}
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-[#666666] pt-1">
                  <span>Envíos asegurados</span>
                  <Link
                    href={currentSlide.primaryCtaHref}
                    className="text-[#FF6B35] hover:underline font-semibold flex items-center gap-0.5"
                  >
                    Ver detalle &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls & Pagination Bar */}
        <div className="relative z-10 px-6 sm:px-10 pb-5 pt-3 border-t border-[#E5E5E5] flex flex-wrap items-center justify-between gap-4 bg-[#F7F7F5]">
          {/* Slide Indicator Dots with Progress */}
          <div className="flex items-center gap-2">
            {PROMO_SLIDES.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-300 rounded-full h-2.5 ${
                    isActive
                      ? "w-8 bg-[#FF6B35] shadow-sm shadow-[#FF6B35]/30"
                      : "w-2.5 bg-[#E5E5E5] hover:bg-[#1F3A5F]/40"
                  }`}
                  aria-label={`Ir a la promoción ${idx + 1}`}
                />
              );
            })}
            <span className="text-[11px] text-[#666666] font-mono ml-2">
              0{currentIndex + 1} / 0{PROMO_SLIDES.length}
            </span>
          </div>

          {/* Quick Slider Arrow Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              aria-label="Promoción anterior"
              className="p-2 rounded-xl bg-white hover:bg-[#F7F7F5] text-[#1F3A5F] border border-[#E5E5E5] transition shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Siguiente promoción"
              className="p-2 rounded-xl bg-white hover:bg-[#F7F7F5] text-[#1F3A5F] border border-[#E5E5E5] transition shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Integrated Trust & Benefits Micro-strip Below Slider */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#FF6B35] shrink-0 border border-[#E5E5E5]">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-xs font-bold text-[#1A1A1A] block truncate">Reserva 20% Pie</span>
            <span className="text-[10px] text-[#666666] block truncate">Congela precio en CLP</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#FF6B35] shrink-0 border border-[#E5E5E5]">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-xs font-bold text-[#1A1A1A] block truncate">Hasta 12 Cuotas</span>
            <span className="text-[10px] text-[#666666] block truncate">Webpay Plus & MP</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#FF6B35] shrink-0 border border-[#E5E5E5]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-xs font-bold text-[#1A1A1A] block truncate">Embalaje Mint</span>
            <span className="text-[10px] text-[#666666] block truncate">Triple corrugado</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#FF6B35] shrink-0 border border-[#E5E5E5]">
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-xs font-bold text-[#1A1A1A] block truncate">Envíos a Todo Chile</span>
            <span className="text-[10px] text-[#666666] block truncate">Starken & Chilexpress</span>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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

import {
  DEFAULT_PROMO_SLIDES,
  PromoSlideData,
  SlideImageFit,
  SlideImagePosition,
  SlideImageBg,
} from "@/lib/constants/sliderDefaults";

const ICON_MAP: Record<string, React.ElementType> = {
  Clock,
  Gamepad2,
  Trophy,
  Layers,
  Sparkles,
  Tag,
  ShieldCheck,
  CreditCard,
  Truck,
  Package,
};

/**
 * Maps background style option to Tailwind classes
 */
function getShowcaseBgClass(bg?: SlideImageBg): string {
  switch (bg) {
    case "dark-studio":
      return "bg-gradient-to-b from-[#0F172A] via-[#0B1120] to-[#020617] border border-slate-800 shadow-inner";
    case "light-clean":
      return "bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] border border-slate-200 shadow-inner";
    case "transparent":
      return "bg-transparent border border-slate-200/40";
    case "ambient-radial":
    default:
      return "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-[#1E293B]/70 to-[#0B1120] border border-slate-700/40 shadow-inner";
  }
}

/**
 * Maps image fit mode to Tailwind classes
 */
function getImageFitClass(fit?: SlideImageFit): string {
  switch (fit) {
    case "cover":
      return "w-full h-full object-cover";
    case "showcase":
      return "w-full h-full object-contain p-3 sm:p-4 drop-shadow-[0_20px_25px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500 ease-out";
    case "contain":
    default:
      return "w-full h-full object-contain p-3 sm:p-4 drop-shadow-md group-hover:scale-102 transition-transform duration-500 ease-out";
  }
}

/**
 * Maps image focal point position to Tailwind classes
 */
function getImagePositionClass(pos?: SlideImagePosition): string {
  switch (pos) {
    case "top":
      return "object-top";
    case "bottom":
      return "object-bottom";
    case "center":
    default:
      return "object-center";
  }
}

export function PromotionalSlider() {
  const [slides, setSlides] = useState<PromoSlideData[]>(DEFAULT_PROMO_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Fetch dynamic slides from admin configuration
  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/slider")
      .then((res) => res.json())
      .then((json) => {
        if (
          isMounted &&
          json.success &&
          Array.isArray(json.data?.slides) &&
          json.data.slides.length > 0
        ) {
          setSlides(json.data.slides);
        }
      })
      .catch((err) => console.warn("Could not fetch custom slides:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  const totalSlides = slides.length || 1;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Autoplay: advances every 6 seconds unless user hovers
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, totalSlides]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX.current - touchEndX;
    if (deltaX > 50) {
      nextSlide();
    } else if (deltaX < -50) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  const currentSlide = slides[currentIndex] || slides[0] || DEFAULT_PROMO_SLIDES[0];
  const prevSlideIndex = (currentIndex - 1 + totalSlides) % totalSlides;
  const nextSlideIndex = (currentIndex + 1) % totalSlides;
  const prevSlideData = slides[prevSlideIndex];
  const nextSlideData = slides[nextSlideIndex];

  const TagIcon = (currentSlide.tagIcon && ICON_MAP[currentSlide.tagIcon]) || Sparkles;

  return (
    <section
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Vitrina Showcase Destacada OmniCollector"
      role="region"
      aria-roledescription="carousel"
    >
      {/* 3D Showcase Stage Container */}
      <div className="relative w-full overflow-hidden rounded-3xl py-2">
        {/* Ambient atmospheric backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/5 via-transparent to-[#0F172A]/5 rounded-3xl pointer-events-none" />

        {/* Multi-Slide Showcase Track with 3D Depth */}
        <div className="relative min-h-[500px] sm:min-h-[520px] lg:min-h-[540px] flex items-center justify-center">
          {/* ========================================================= */}
          {/* PREVIOUS SLIDE (Left 3D Peek - Click to navigate)        */}
          {/* ========================================================= */}
          {totalSlides > 1 && (
            <div
              onClick={prevSlide}
              className="hidden lg:block absolute left-0 w-[420px] h-[480px] -translate-x-[48%] scale-[0.88] opacity-35 hover:opacity-75 transition-all duration-700 ease-out z-0 cursor-pointer pointer-events-auto filter blur-[0.6px] hover:blur-none"
              title={`Ver anterior: ${prevSlideData.title}`}
              aria-hidden="true"
            >
              <div className="w-full h-full rounded-3xl bg-white/90 border border-slate-300 shadow-xl p-6 flex flex-col justify-between overflow-hidden">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    {prevSlideData.tag}
                  </span>
                  <h3 className="text-xl font-black text-slate-800 line-clamp-2">
                    {prevSlideData.title}
                  </h3>
                </div>
                <div className="relative h-44 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={prevSlideData.image}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1F3A5F]">
                  <span className="truncate">{prevSlideData.productBadge}</span>
                  <ChevronLeft className="w-5 h-5 text-[#FF6B35] animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MAIN ACTIVE SPOTLIGHT SLIDE (Center Spotlight)            */}
          {/* ========================================================= */}
          <div className="relative z-20 w-full max-w-5xl rounded-3xl bg-white border border-[#E5E5E5] shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-500">
            {/* Ambient Accent Glows */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAF9] via-white to-[#F5F5F4] pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-[420px] h-[420px] bg-[#FF6B35]/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-[#1F3A5F]/8 rounded-full blur-3xl pointer-events-none" />

            {/* Content Grid: Left Column Copy + Right Column Showcase Product */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 sm:p-10 lg:p-12 items-center flex-1">
              {/* Left Column: Copy, Tag, Value Prop and CTAs */}
              <div className="lg:col-span-7 space-y-5 text-left">
                {/* Tag Pill with Refined Metallic Border */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1F3A5F]/10 border border-[#1F3A5F]/20 text-[#1F3A5F] text-xs font-bold shadow-xs">
                  <TagIcon className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span className="tracking-wider uppercase text-[11px] font-mono">
                    {currentSlide.tag}
                  </span>
                </div>

                {/* Headline with Energetic Highlight */}
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#1A1A1A] tracking-tight leading-[1.12]">
                    {currentSlide.title}{" "}
                    <span className="text-[#FF6B35] block sm:inline">
                      {currentSlide.titleHighlight}
                    </span>
                  </h2>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#555555] max-w-xl leading-relaxed font-medium">
                  {currentSlide.description}
                </p>

                {/* Trust Highlights Checklist */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentSlide.highlights.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A] bg-[#F7F7F5] px-2.5 py-1 rounded-lg border border-[#E5E5E5] font-medium shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9E5B] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Call To Action Buttons with Dynamic Micro-Interactions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href={currentSlide.primaryCtaHref}
                    className="px-6 py-3 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-[#FF6B35]/25 hover:shadow-xl hover:shadow-[#FF6B35]/35 flex items-center gap-2 group active:scale-95"
                  >
                    <span>{currentSlide.primaryCtaText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </Link>

                  <Link
                    href={currentSlide.secondaryCtaHref}
                    className="px-5 py-3 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white font-semibold text-xs sm:text-sm transition-all border border-[#1F3A5F] flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    <span>{currentSlide.secondaryCtaText}</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: 3D Showcase Product Stage & Floating Pedestal */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden bg-white border border-[#E5E5E5] shadow-xl group">
                  {/* Spotlight Background Area with Customizable Framing */}
                  <div
                    className={`relative w-full h-64 sm:h-72 lg:h-80 overflow-hidden flex items-center justify-center transition-colors duration-500 ${getShowcaseBgClass(
                      currentSlide.imageBg
                    )}`}
                  >
                    {/* Radial Center Light Halo */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)] pointer-events-none" />

                    {/* Top Overlay Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                      <span className="text-[10px] font-mono font-bold text-[#1A1A1A] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#E5E5E5] shadow-sm">
                        VITRINA OFICIAL
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FF6B35] text-white flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3" /> CHILE
                      </span>
                    </div>

                    {/* Configured Product Image (Scale, Fit, Position) */}
                    <div
                      className="relative w-full h-full flex items-center justify-center overflow-hidden"
                      style={{
                        transform: `scale(${(currentSlide.imageScale || 95) / 100})`,
                      }}
                    >
                      <img
                        src={currentSlide.image}
                        alt={currentSlide.title}
                        className={`${getImageFitClass(
                          currentSlide.imageFit
                        )} ${getImagePositionClass(currentSlide.imagePosition)}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>

                    {/* Pedestal Bottom Reflection Sheen */}
                    <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>

                  {/* Bottom Card Summary & Quick Direct Navigation */}
                  <div className="p-4 bg-white border-t border-[#E5E5E5] space-y-1.5 text-left">
                    <div className="text-xs font-bold text-[#1A1A1A] truncate" title={currentSlide.productBadge}>
                      {currentSlide.productBadge}
                    </div>
                    {currentSlide.productPrice && (
                      <div className="text-sm font-mono font-black text-[#FF6B35]">
                        {currentSlide.productPrice}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-[#666666] pt-1">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Garantía oficial
                      </span>
                      <Link
                        href={currentSlide.primaryCtaHref}
                        className="text-[#FF6B35] hover:text-[#E85A24] font-bold flex items-center gap-0.5 group/btn transition"
                      >
                        <span>Ver coleccionable</span>
                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Showcase Navigation Bar & Progressive Bullets */}
            <div className="relative z-10 px-6 sm:px-10 pb-5 pt-3.5 border-t border-[#E5E5E5] flex flex-wrap items-center justify-between gap-4 bg-[#F7F7F5]">
              {/* Slide Indicator Dots with Progressive Length */}
              <div className="flex items-center gap-2">
                {slides.map((slide, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={slide.id}
                      onClick={() => goToSlide(idx)}
                      className={`transition-all duration-300 rounded-full h-2.5 ${
                        isActive
                          ? "w-8 bg-[#FF6B35] shadow-sm shadow-[#FF6B35]/30"
                          : "w-2.5 bg-[#CBD5E1] hover:bg-[#1F3A5F]/40"
                      }`}
                      aria-label={`Ir a la promoción ${idx + 1}`}
                      aria-current={isActive ? "true" : undefined}
                    />
                  );
                })}
                <span className="text-[11px] text-[#666666] font-mono font-bold ml-2">
                  0{currentIndex + 1} / 0{slides.length}
                </span>
              </div>

              {/* Quick Slider Arrow Navigation with Backdrop Blur */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  aria-label="Promoción anterior"
                  className="p-2.5 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#1F3A5F] border border-[#CBD5E1] transition shadow-xs active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Siguiente promoción"
                  className="p-2.5 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#1F3A5F] border border-[#CBD5E1] transition shadow-xs active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* NEXT SLIDE (Right 3D Peek - Click to navigate)           */}
          {/* ========================================================= */}
          {totalSlides > 1 && (
            <div
              onClick={nextSlide}
              className="hidden lg:block absolute right-0 w-[420px] h-[480px] translate-x-[48%] scale-[0.88] opacity-35 hover:opacity-75 transition-all duration-700 ease-out z-0 cursor-pointer pointer-events-auto filter blur-[0.6px] hover:blur-none"
              title={`Ver siguiente: ${nextSlideData.title}`}
              aria-hidden="true"
            >
              <div className="w-full h-full rounded-3xl bg-white/90 border border-slate-300 shadow-xl p-6 flex flex-col justify-between overflow-hidden">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    {nextSlideData.tag}
                  </span>
                  <h3 className="text-xl font-black text-slate-800 line-clamp-2">
                    {nextSlideData.title}
                  </h3>
                </div>
                <div className="relative h-44 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={nextSlideData.image}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1F3A5F]">
                  <span className="truncate">{nextSlideData.productBadge}</span>
                  <ChevronRight className="w-5 h-5 text-[#FF6B35] animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integrated Trust & Benefits Micro-strip Below Slider */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] flex items-center gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#FF6B35] shrink-0 border border-[#E5E5E5]">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-xs font-bold text-[#1A1A1A] block truncate">Reserva 20% Pie</span>
            <span className="text-[10px] text-[#666666] block truncate">Congela precio en CLP</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] flex items-center gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#FF6B35] shrink-0 border border-[#E5E5E5]">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-xs font-bold text-[#1A1A1A] block truncate">Hasta 6 Cuotas</span>
            <span className="text-[10px] text-[#666666] block truncate">Sin interés con MP</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] flex items-center gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#FF6B35] shrink-0 border border-[#E5E5E5]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-xs font-bold text-[#1A1A1A] block truncate">Embalaje Mint</span>
            <span className="text-[10px] text-[#666666] block truncate">Triple corrugado</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] flex items-center gap-3 shadow-xs">
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

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
 * Calculates cyclic shortest-distance offset between slide index and current index.
 * Enables continuous loop transitions without jumps.
 */
function getCyclicOffset(idx: number, currentIndex: number, total: number): number {
  if (total <= 1) return 0;
  let diff = idx - currentIndex;
  while (diff > total / 2) diff -= total;
  while (diff < -total / 2) diff += total;
  return diff;
}

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

  return (
    <section
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Vitrina Showcase Destacada OmniCollector"
      role="region"
      aria-roledescription="carousel"
    >
      {/* 3D Showcase Stage with LOCKED FIXED HEIGHT to completely prevent layout jumps */}
      <div className="relative w-full overflow-hidden rounded-3xl py-1">
        {/* Ambient atmospheric backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/5 via-transparent to-[#0F172A]/5 rounded-3xl pointer-events-none" />

        {/* Multi-Slide Stage with Fixed Rigid Dimensions */}
        <div className="relative w-full h-[640px] sm:h-[600px] lg:h-[520px] flex items-center justify-center overflow-hidden">
          {slides.map((slide, idx) => {
            const offset = getCyclicOffset(idx, currentIndex, totalSlides);
            const isCenter = offset === 0;
            const isLeftPeek = offset === -1;
            const isRightPeek = offset === 1;
            const TagIcon = (slide.tagIcon && ICON_MAP[slide.tagIcon]) || Sparkles;

            // Compute 3D Showcase translation styles based on cyclic offset
            let transformClass = "";
            let opacityStyle = 0;
            let zIndexStyle = 0;
            let pointerEventsStyle: "auto" | "none" = "none";
            let cursorStyle = "default";
            let filterStyle = "none";

            if (isCenter) {
              transformClass = "translate-x-0 scale-100";
              opacityStyle = 1;
              zIndexStyle = 20;
              pointerEventsStyle = "auto";
            } else if (isLeftPeek) {
              transformClass = "-translate-x-[92%] scale-[0.88]";
              opacityStyle = 0.35;
              zIndexStyle = 10;
              pointerEventsStyle = "auto";
              cursorStyle = "pointer";
              filterStyle = "blur(0.5px)";
            } else if (isRightPeek) {
              transformClass = "translate-x-[92%] scale-[0.88]";
              opacityStyle = 0.35;
              zIndexStyle = 10;
              pointerEventsStyle = "auto";
              cursorStyle = "pointer";
              filterStyle = "blur(0.5px)";
            } else {
              transformClass = offset > 0 ? "translate-x-[160%] scale-[0.8]" : "-translate-x-[160%] scale-[0.8]";
              opacityStyle = 0;
              zIndexStyle = 0;
            }

            return (
              <div
                key={slide.id}
                onClick={() => {
                  if (isLeftPeek || isRightPeek) {
                    goToSlide(idx);
                  }
                }}
                className={`absolute inset-0 w-full max-w-5xl mx-auto rounded-3xl bg-white border border-[#E5E5E5] shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${transformClass}`}
                style={{
                  opacity: opacityStyle,
                  zIndex: zIndexStyle,
                  pointerEvents: pointerEventsStyle,
                  cursor: cursorStyle,
                  filter: filterStyle,
                }}
                aria-hidden={!isCenter}
              >
                {/* Ambient Accent Glows */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAF9] via-white to-[#F5F5F4] pointer-events-none" />
                <div className="absolute -top-32 -right-32 w-[380px] h-[380px] bg-[#FF6B35]/8 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-[380px] h-[380px] bg-[#1F3A5F]/8 rounded-full blur-3xl pointer-events-none" />

                {/* Content Grid: Left Column Copy + Right Column Showcase Product */}
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 p-5 sm:p-7 lg:p-10 items-center flex-1 min-h-0 overflow-hidden">
                  {/* Left Column: Fixed layout heights to guarantee ZERO height jumps */}
                  <div className="lg:col-span-7 flex flex-col justify-between h-full py-1 text-left min-h-0">
                    {/* 1. Tag Pill (Fixed Height: 28px) */}
                    <div className="h-7 flex items-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F3A5F]/10 border border-[#1F3A5F]/20 text-[#1F3A5F] text-xs font-bold shadow-xs">
                        <TagIcon className="w-3.5 h-3.5 text-[#FF6B35]" />
                        <span className="tracking-wider uppercase text-[10px] sm:text-[11px] font-mono truncate">
                          {slide.tag}
                        </span>
                      </div>
                    </div>

                    {/* 2. Headline with Strict Height Budget (Fixed Height: 80px on desktop) */}
                    <div className="h-16 sm:h-20 lg:h-24 flex items-center">
                      <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#1A1A1A] tracking-tight leading-[1.15] line-clamp-2">
                        {slide.title}{" "}
                        <span className="text-[#FF6B35] inline">
                          {slide.titleHighlight}
                        </span>
                      </h2>
                    </div>

                    {/* 3. Description with Strict Clamp (Fixed Height: 44px) */}
                    <div className="h-10 sm:h-11 flex items-center overflow-hidden">
                      <p className="text-xs sm:text-sm text-[#555555] line-clamp-2 leading-relaxed font-medium">
                        {slide.description}
                      </p>
                    </div>

                    {/* 4. Trust Highlights Checklist (Fixed Height: 36px) */}
                    <div className="h-9 sm:h-10 flex flex-wrap gap-2 items-center overflow-hidden">
                      {(slide.highlights || []).slice(0, 3).map((item, hIdx) => (
                        <div
                          key={hIdx}
                          className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#1A1A1A] bg-[#F7F7F5] px-2.5 py-1 rounded-lg border border-[#E5E5E5] font-medium shadow-xs truncate max-w-xs"
                        >
                          <CheckCircle2 className="w-3 h-3 text-[#2E9E5B] shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* 5. Call To Action Buttons (Fixed Height: 48px) */}
                    <div className="h-12 flex items-center gap-3 pt-1">
                      <Link
                        href={slide.primaryCtaHref}
                        className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-md shadow-[#FF6B35]/25 hover:shadow-lg hover:shadow-[#FF6B35]/35 flex items-center gap-2 group active:scale-95"
                      >
                        <span>{slide.primaryCtaText}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <Link
                        href={slide.secondaryCtaHref}
                        className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white font-semibold text-xs sm:text-sm transition-all border border-[#1F3A5F] flex items-center gap-2 shadow-xs active:scale-95"
                      >
                        <span>{slide.secondaryCtaText}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: 3D Showcase Product Stage & Floating Pedestal */}
                  <div className="lg:col-span-5 flex justify-center items-center h-full min-h-0">
                    <div className="relative w-full max-w-xs sm:max-w-sm h-[320px] sm:h-[350px] lg:h-[360px] rounded-2xl overflow-hidden bg-white border border-[#E5E5E5] shadow-lg flex flex-col justify-between group">
                      {/* Spotlight Background Area with Customizable Framing */}
                      <div
                        className={`relative w-full h-[250px] sm:h-[270px] lg:h-[285px] overflow-hidden flex items-center justify-center transition-colors duration-500 flex-shrink-0 ${getShowcaseBgClass(
                          slide.imageBg
                        )}`}
                      >
                        {/* Radial Center Light Halo */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)] pointer-events-none" />

                        {/* Top Overlay Badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#1A1A1A] bg-white/95 backdrop-blur-md px-2 py-0.5 rounded border border-[#E5E5E5] shadow-xs">
                            VITRINA OFICIAL
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B35] text-white flex items-center gap-1 shadow-xs">
                            <Sparkles className="w-2.5 h-2.5" /> CHILE
                          </span>
                        </div>

                        {/* Configured Product Image (Scale, Fit, Position) */}
                        <div
                          className="relative w-full h-full flex items-center justify-center overflow-hidden"
                          style={{
                            transform: `scale(${(slide.imageScale || 95) / 100})`,
                          }}
                        >
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className={`${getImageFitClass(
                              slide.imageFit
                            )} ${getImagePositionClass(slide.imagePosition)}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80";
                            }}
                          />
                        </div>

                        {/* Pedestal Bottom Reflection Sheen */}
                        <div className="absolute bottom-0 inset-x-0 h-5 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>

                      {/* Bottom Card Summary & Quick Direct Navigation */}
                      <div className="h-[70px] sm:h-[75px] p-3 bg-white border-t border-[#E5E5E5] flex flex-col justify-between text-left flex-shrink-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-bold text-[#1A1A1A] truncate" title={slide.productBadge}>
                            {slide.productBadge}
                          </div>
                          {slide.productPrice && (
                            <div className="text-xs sm:text-sm font-mono font-black text-[#FF6B35] shrink-0">
                              {slide.productPrice}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#666666]">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Garantía oficial
                          </span>
                          <Link
                            href={slide.primaryCtaHref}
                            className="text-[#FF6B35] hover:text-[#E85A24] font-bold flex items-center gap-0.5 transition"
                          >
                            <span>Ver detalle</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Showcase Navigation Bar & Progressive Bullets */}
                <div className="relative z-10 h-13 sm:h-14 px-5 sm:px-8 border-t border-[#E5E5E5] flex items-center justify-between gap-4 bg-[#F7F7F5] flex-shrink-0">
                  {/* Slide Indicator Dots with Progressive Length */}
                  <div className="flex items-center gap-2">
                    {slides.map((_, dotIdx) => {
                      const isActive = dotIdx === currentIndex;
                      return (
                        <button
                          key={dotIdx}
                          onClick={() => goToSlide(dotIdx)}
                          className={`transition-all duration-300 rounded-full h-2 ${
                            isActive
                              ? "w-7 sm:w-8 bg-[#FF6B35] shadow-xs shadow-[#FF6B35]/30"
                              : "w-2 bg-[#CBD5E1] hover:bg-[#1F3A5F]/40"
                          }`}
                          aria-label={`Ir a la promoción ${dotIdx + 1}`}
                          aria-current={isActive ? "true" : undefined}
                        />
                      );
                    })}
                    <span className="text-[10px] sm:text-[11px] text-[#666666] font-mono font-bold ml-2">
                      0{currentIndex + 1} / 0{slides.length}
                    </span>
                  </div>

                  {/* Quick Slider Arrow Navigation with Backdrop Blur */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevSlide}
                      aria-label="Promoción anterior"
                      className="p-2 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#1F3A5F] border border-[#CBD5E1] transition shadow-xs active:scale-95"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextSlide}
                      aria-label="Siguiente promoción"
                      className="p-2 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#1F3A5F] border border-[#CBD5E1] transition shadow-xs active:scale-95"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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

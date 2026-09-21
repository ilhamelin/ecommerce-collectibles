"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Grid,
  Layers,
  Sparkles,
} from "lucide-react";

interface ProductContentGalleryProps {
  images: string[];
  productName: string;
  sku?: string;
}

export function ProductContentGallery({
  images,
  productName,
  sku,
}: ProductContentGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);

  const total = images.length;
  const currentImage = images[selectedIndex] || images[0];

  // Check scroll bounds for thumbnails
  const updateScrollBounds = useCallback(() => {
    const el = thumbnailsContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollBounds();
    window.addEventListener("resize", updateScrollBounds);
    return () => window.removeEventListener("resize", updateScrollBounds);
  }, [updateScrollBounds, images.length]);

  // Smoothly scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbnailRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
    updateScrollBounds();
  }, [selectedIndex, updateScrollBounds]);

  // Next / Previous helpers
  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  // Scroll thumbnails manually with arrows
  const scrollThumbnails = (direction: "left" | "right") => {
    const el = thumbnailsContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -280 : 280;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(updateScrollBounds, 300);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGridModalOpen) {
        if (e.key === "Escape") setIsGridModalOpen(false);
        return;
      }
      if (isLightboxOpen) {
        if (e.key === "Escape") setIsLightboxOpen(false);
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "ArrowRight") handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, isGridModalOpen, handlePrev, handleNext]);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
      {/* Header bar with controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] tracking-tight">
              Galería de Capturas de Contenido & Detalles
            </h3>
          </div>
          <p className="text-xs text-[#666666] mt-0.5">
            Explora todas las tomas en alta definición. Usa las flechas o selecciona miniaturas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Pill Counter */}
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-[#F7F7F5] border border-[#E5E5E5] text-[#1F3A5F]">
            {selectedIndex + 1} / {total}
          </span>

          {/* Grid View Modal Button (great for 10+ images) */}
          {total > 1 && (
            <button
              type="button"
              onClick={() => setIsGridModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F7F5] hover:bg-[#FF6B35] hover:text-white border border-[#E5E5E5] text-xs font-semibold text-[#1A1A1A] transition shadow-xs cursor-pointer"
              title="Ver todas las fotos en mosaico"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver todas</span> ({total})
            </button>
          )}

          {/* Lightbox / Zoom Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#F7F7F5] hover:bg-[#1F3A5F] hover:text-white border border-[#E5E5E5] text-xs font-semibold text-[#1A1A1A] transition shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Pantalla completa"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zoom</span>
          </button>
        </div>
      </div>

      {/* Main Active Viewer (Uncropped, Responsive Aspect Ratio) */}
      <div
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[580px] rounded-2xl overflow-hidden bg-[#0A0F17] border-2 border-[#E5E5E5] shadow-xl group flex items-center justify-center select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ambient Blurred Backdrop */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={currentImage}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover blur-2xl opacity-40 scale-110"
          />
          <div className="absolute inset-0 bg-[#0A0F17]/50" />
        </div>

        {/* Main High-Res Image - 100% visible, zero cropping */}
        <img
          src={currentImage}
          alt={`Captura ${selectedIndex + 1} de ${productName}`}
          className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Previous / Next Arrows on Main Viewer */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#FF6B35] text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
              aria-label="Captura anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#FF6B35] text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
              aria-label="Siguiente captura"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Caption Pill */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-xs font-mono text-white pointer-events-none shadow-md truncate">
          Captura #{selectedIndex + 1} • {productName}
        </div>

        {/* Quick Zoom Trigger overlay button on hover */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-black/60 hover:bg-[#FF6B35] text-white backdrop-blur-md border border-white/20 transition opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
          title="Ampliar a pantalla completa"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Accessible Thumbnail Carousel Strip */}
      {total > 1 && (
        <div className="relative pt-1">
          {/* Left Scroll Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollThumbnails("left")}
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/95 hover:bg-[#FF6B35] text-[#1A1A1A] hover:text-white border border-[#E5E5E5] shadow-md flex items-center justify-center transition cursor-pointer"
              aria-label="Desplazar miniaturas hacia la izquierda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Right Scroll Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollThumbnails("right")}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/95 hover:bg-[#FF6B35] text-[#1A1A1A] hover:text-white border border-[#E5E5E5] shadow-md flex items-center justify-center transition cursor-pointer"
              aria-label="Desplazar miniaturas hacia la derecha"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Scrollable Thumbnails Container */}
          <div
            ref={thumbnailsContainerRef}
            onScroll={updateScrollBounds}
            className="flex items-center gap-2.5 overflow-x-auto py-2 px-1 scroll-smooth no-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {images.map((img: string, idx: number) => {
              const isActive = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  ref={isActive ? activeThumbnailRef : undefined}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative w-20 sm:w-24 h-14 sm:h-16 rounded-xl overflow-hidden transition-all duration-200 shrink-0 bg-[#F7F7F5] cursor-pointer group ${
                    isActive
                      ? "border-2 border-[#FF6B35] ring-2 ring-[#FF6B35]/40 scale-105 shadow-md z-10"
                      : "border border-[#E5E5E5] opacity-70 hover:opacity-100 hover:border-[#FF6B35]"
                  }`}
                  aria-label={`Ver captura ${idx + 1} de ${total}`}
                >
                  <img
                    src={img}
                    alt={`Miniatura ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    loading="lazy"
                  />
                  <span
                    className={`absolute bottom-1 right-1 text-[9px] font-mono px-1 rounded font-bold ${
                      isActive
                        ? "bg-[#FF6B35] text-white"
                        : "bg-black/60 text-white opacity-80"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
        >
          {/* Top Bar in Lightbox */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 z-20">
            <div className="space-y-0.5">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-lg">
                {productName}
              </h4>
              <p className="text-xs text-white/60 font-mono">
                Captura {selectedIndex + 1} de {total} {sku ? `• SKU: ${sku}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGridModalOpen(true)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-[#FF6B35] text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-white/15"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">Mosaico</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition cursor-pointer border border-white/15"
                aria-label="Cerrar vista completa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Centered Image with Large Prev/Next */}
          <div className="relative flex-1 flex items-center justify-center p-2 my-2 overflow-hidden">
            <img
              src={currentImage}
              alt={`Captura ${selectedIndex + 1}`}
              className="max-h-full max-w-full w-auto h-auto object-contain select-none"
            />

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 z-30 p-3 rounded-full bg-black/70 hover:bg-[#FF6B35] text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-xl"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 z-30 p-3 rounded-full bg-black/70 hover:bg-[#FF6B35] text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-xl"
                  aria-label="Foto siguiente"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails in Lightbox */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto pt-3 border-t border-white/10 max-w-4xl mx-auto w-full z-20">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative w-14 sm:w-16 h-10 sm:h-12 rounded-lg overflow-hidden shrink-0 transition cursor-pointer ${
                    selectedIndex === idx
                      ? "border-2 border-[#FF6B35] scale-105 opacity-100"
                      : "border border-white/20 opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid Modal: Displays all 20+ images in an organized mosaic */}
      {isGridModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="bg-[#092634] border border-[#004E72]/60 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#004E72]/50">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-[#FF6E42]" />
                <div>
                  <h4 className="text-base font-bold text-[#F9F9F9]">
                    Mosaico Completo ({total} fotos)
                  </h4>
                  <p className="text-xs text-[#9bb5c2]">
                    Haz clic en cualquier imagen para verla en tamaño completo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGridModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500 transition cursor-pointer"
                aria-label="Cerrar mosaico"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Responsive Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {images.map((img: string, idx: number) => {
                const isActive = selectedIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedIndex(idx);
                      setIsGridModalOpen(false);
                    }}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition group text-left cursor-pointer ${
                      isActive
                        ? "border-[#FF6E42] ring-2 ring-[#FF6E42]/50 scale-[1.02]"
                        : "border-[#004E72]/40 hover:border-[#FF6E42]/70 opacity-90 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                      <span className="text-xs font-bold text-white">
                        Ver Foto #{idx + 1}
                      </span>
                    </div>
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white font-bold">
                      #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

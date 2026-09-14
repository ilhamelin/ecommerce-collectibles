"use client";

import React, { useState, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Crosshair, Check, Sparkles } from "lucide-react";

interface InspectionZoomProps {
  imageUrl: string;
  alt: string;
  className?: string;
  isCollectible?: boolean;
}

export function InspectionZoom({
  imageUrl,
  alt,
  className = "",
  isCollectible = false,
}: InspectionZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZoomActive, setIsZoomActive] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(2.5);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showReticle, setShowReticle] = useState<boolean>(true);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomActive || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Constrain within bounds (0% to 100%)
      const xPercent = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
      const yPercent = Math.max(0, Math.min(100, (clientY / rect.height) * 100));

      setLensPos({ x: xPercent, y: yPercent });
    },
    [isZoomActive]
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Control Strip */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <button
          type="button"
          onClick={() => setIsZoomActive((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shadow-xs border ${
            isZoomActive
              ? "bg-[#FF6B35] text-white border-[#FF6B35]"
              : "bg-white text-[#1A1A1A] border-[#E5E5E5] hover:border-[#FF6B35]"
          }`}
        >
          {isZoomActive ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5 text-[#FF6B35]" />}
          <span>{isZoomActive ? "Desactivar Lupa" : "Lupa de Inspección HD"}</span>
        </button>

        {isZoomActive && (
          <div className="flex items-center gap-2">
            {/* Zoom multiplier selector */}
            <div className="inline-flex rounded-lg border border-[#E5E5E5] bg-white p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setZoomLevel(2.5)}
                className={`px-2 py-0.5 rounded-md transition ${
                  zoomLevel === 2.5 ? "bg-[#1F3A5F] text-white" : "text-[#666666] hover:text-[#1A1A1A]"
                }`}
              >
                2.5x
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(3.5)}
                className={`px-2 py-0.5 rounded-md transition ${
                  zoomLevel === 3.5 ? "bg-[#1F3A5F] text-white" : "text-[#666666] hover:text-[#1A1A1A]"
                }`}
              >
                3.5x
              </button>
            </div>

            {/* Reticle grid toggle */}
            <button
              type="button"
              onClick={() => setShowReticle((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition ${
                showReticle
                  ? "bg-[#1F3A5F]/10 border-[#1F3A5F]/30 text-[#1F3A5F]"
                  : "bg-white border-[#E5E5E5] text-[#888888]"
              }`}
              title="Alternar retícula de centrado para coleccionistas"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Image Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center select-none ${
          isZoomActive ? "cursor-crosshair" : ""
        }`}
      >
        {/* Base Product Image */}
        <img
          src={imageUrl}
          alt={alt}
          className={`w-full h-full object-contain p-2 transition-transform duration-300 ${
            !isZoomActive ? "hover:scale-105" : ""
          }`}
        />

        {/* Inspection Zoom Overlay Lens */}
        {isZoomActive && isHovered && (
          <div
            aria-hidden="true"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
              backgroundSize: `${zoomLevel * 100}%`,
              backgroundRepeat: "no-repeat",
            }}
            className="pointer-events-none absolute inset-0 z-20 rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.15)] bg-white"
          >
            {/* Collector Reticle / Grading Crosshair */}
            {showReticle && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                <div className="w-full h-[1px] bg-red-600"></div>
                <div className="h-full w-[1px] bg-red-600 absolute"></div>
                <div className="w-24 h-24 rounded-full border border-red-600 absolute"></div>
              </div>
            )}

            {/* Float badge indicator in lens */}
            <div className="absolute bottom-3 left-3 bg-[#1A1A1A]/85 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded-md border border-white/20 flex items-center gap-1.5 shadow">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Inspección {zoomLevel}x</span>
              <span className="text-white/60">• Centrado & Esquinas</span>
            </div>
          </div>
        )}

        {/* Tip pill when zoom is active but user is not hovering */}
        {isZoomActive && !isHovered && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-[#1A1A1A] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#E5E5E5] shadow flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="w-3 h-3 text-[#FF6B35]" />
            Mueve el cursor sobre la cápsula para examinar detalles
          </div>
        )}
      </div>
    </div>
  );
}

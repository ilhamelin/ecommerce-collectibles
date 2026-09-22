"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import {
  DEFAULT_SIDE_BANNERS,
  SideBannersConfig,
  SideBannerItem,
} from "@/lib/constants/sideBannersDefaults";

interface BannerCardProps {
  banner: SideBannerItem;
  position: "left" | "right";
  onDismiss: () => void;
}

function BannerCard({ banner, position, onDismiss }: BannerCardProps) {
  const isLeft = position === "left";

  return (
    <aside
      aria-label={`Banner promocional lateral ${isLeft ? "izquierdo" : "derecho"}: ${banner.title}`}
      className={`fixed top-24 ${
        isLeft ? "left-2 2xl:left-5" : "right-2 2xl:right-5"
      } z-30 hidden min-[1420px]:flex flex-col w-36 2xl:w-44 h-[560px] 2xl:h-[620px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-[#0B131E] group select-none transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]`}
      style={{
        boxShadow: `0 10px 30px -10px ${banner.accentColor || "#FF6B35"}40`,
      }}
    >
      {/* Background Graphic with Zoom Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {banner.imageUrl ? (
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#142337] to-[#0A1118]" />
        )}

        {/* Ambient Dark Gradient Overlays for readable text */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/30 to-black/90 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-20 group-hover:opacity-35 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${banner.accentColor || "#FF6B35"}, transparent 70%)`,
          }}
        />
      </div>

      {/* Top Bar with Badge & Dismiss Button */}
      <div className="relative z-10 p-3 flex items-start justify-between gap-1">
        <span
          className="text-[9px] 2xl:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-md text-white line-clamp-1"
          style={{
            backgroundColor: `${banner.accentColor || "#FF6B35"}30`,
            borderColor: `${banner.accentColor || "#FF6B35"}70`,
            color: "#FFFFFF",
          }}
        >
          {banner.badge || "DESTACADO"}
        </span>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          aria-label={`Ocultar banner de ${banner.title}`}
          title="Ocultar anuncio temporalmente"
          className="w-5 h-5 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white flex items-center justify-center backdrop-blur-md transition-transform active:scale-90"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Clickable Full Area */}
      <Link
        href={banner.targetUrl || "/catalog"}
        className="relative z-10 flex-1 flex flex-col justify-between p-3.5 2xl:p-4 text-white text-decoration-none"
      >
        {/* Top Text content */}
        <div>
          <h3 className="text-sm 2xl:text-base font-black tracking-tight leading-snug drop-shadow-md text-white group-hover:text-white transition">
            {banner.title}
          </h3>
          {banner.subtitle && (
            <p className="text-[10px] 2xl:text-[11px] text-slate-300 font-medium line-clamp-2 mt-1 drop-shadow-sm leading-tight">
              {banner.subtitle}
            </p>
          )}
        </div>

        {/* Bottom CTA Button */}
        <div className="mt-auto pt-2">
          <div
            className="w-full py-2 px-2.5 rounded-xl font-black text-[10px] 2xl:text-[11px] flex items-center justify-center gap-1.5 transition-all duration-300 shadow-lg text-center"
            style={{
              backgroundColor: banner.accentColor || "#FF6B35",
              color: "#FFFFFF",
            }}
          >
            <span className="truncate">{banner.ctaText || "Ver Ahora"}</span>
            <ArrowRight className="w-3 h-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>

          <p className="text-[8px] text-slate-400/80 text-center uppercase tracking-widest mt-1.5 font-bold">
            OmniCollector Skin
          </p>
        </div>
      </Link>
    </aside>
  );
}

export function SidePromotionalBanners() {
  const [config, setConfig] = useState<SideBannersConfig>(DEFAULT_SIDE_BANNERS);
  const [isDismissedLeft, setIsDismissedLeft] = useState(false);
  const [isDismissedRight, setIsDismissedRight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initial fetch from API
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/side-banners");
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.config) {
            setConfig(data.data.config);
          }
        }
      } catch (err) {
        console.warn("[SidePromotionalBanners] Error loading settings:", err);
      }
    }

    loadSettings();

    // Listen for live updates dispatched by the admin panel
    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<SideBannersConfig>;
      if (customEvent?.detail) {
        setConfig(customEvent.detail);
      }
    };

    window.addEventListener("side_banners_updated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("side_banners_updated", handleSettingsUpdated);
    };
  }, []);

  if (!mounted || !config.enabled) {
    return null;
  }

  return (
    <>
      {/* Left Promotional Banner */}
      {config.leftBanner?.enabled && !isDismissedLeft && (
        <BannerCard
          banner={config.leftBanner}
          position="left"
          onDismiss={() => setIsDismissedLeft(true)}
        />
      )}

      {/* Right Promotional Banner (The Sommelier AI button floats over the bottom of this banner) */}
      {config.rightBanner?.enabled && !isDismissedRight && (
        <BannerCard
          banner={config.rightBanner}
          position="right"
          onDismiss={() => setIsDismissedRight(true)}
        />
      )}
    </>
  );
}

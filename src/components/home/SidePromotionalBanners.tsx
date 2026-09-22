"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  DEFAULT_SIDE_BANNERS,
  SideBannersConfig,
  SideBannerItem,
} from "@/lib/constants/sideBannersDefaults";

interface StaticBannerProps {
  banner: SideBannerItem;
  position: "left" | "right";
  onDismiss: () => void;
}

function StaticBannerCard({ banner, position, onDismiss }: StaticBannerProps) {
  const isLeft = position === "left";

  if (!banner.imageUrl) return null;

  return (
    <aside
      aria-label={`Banner estático lateral ${isLeft ? "izquierdo" : "derecho"}`}
      className={`fixed top-[92px] bottom-3 ${
        isLeft ? "left-2 2xl:left-3.5" : "right-2 2xl:right-3.5"
      } z-30 hidden min-[1420px]:flex flex-col w-[calc((100vw-1280px)/2-18px)] max-w-[280px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-[#0B131E] group select-none transition-all duration-300`}
    >
      {/* Clickable Static Poster Link covering full area */}
      <Link
        href={banner.targetUrl || "/catalog"}
        className="relative w-full h-full block overflow-hidden group cursor-pointer"
        title={banner.altText || "Ver promoción"}
      >
        <img
          src={banner.imageUrl}
          alt={banner.altText || (isLeft ? "Banner promocional lateral izquierdo" : "Banner promocional lateral derecho")}
          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />

        {/* Subtle hover sheen overlay */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 pointer-events-none" />
      </Link>

      {/* Floating minimal dismiss button at top corner */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Cerrar banner"
        title="Ocultar imagen durante esta sesión"
        className="absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition shadow-md active:scale-90"
      >
        <X className="w-3.5 h-3.5" />
      </button>
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
        console.warn("[SidePromotionalBanners] Error al cargar configuración:", err);
      }
    }

    loadSettings();

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
      {/* Banner estático izquierdo */}
      {config.leftBanner?.enabled && !isDismissedLeft && (
        <StaticBannerCard
          banner={config.leftBanner}
          position="left"
          onDismiss={() => setIsDismissedLeft(true)}
        />
      )}

      {/* Banner estático derecho (El Asistente IA Sommelier se superpone en la esquina inferior derecha) */}
      {config.rightBanner?.enabled && !isDismissedRight && (
        <StaticBannerCard
          banner={config.rightBanner}
          position="right"
          onDismiss={() => setIsDismissedRight(true)}
        />
      )}
    </>
  );
}

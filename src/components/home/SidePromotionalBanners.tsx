"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  DEFAULT_SIDE_BANNERS,
  SideBannersConfig,
  SideBannerItem,
} from "@/lib/constants/sideBannersDefaults";

interface StaticBannerProps {
  banner: SideBannerItem;
  position: "left" | "right";
  bottomOffset: number;
  onDismiss: () => void;
}

function StaticBannerCard({
  banner,
  position,
  bottomOffset,
  onDismiss,
}: StaticBannerProps) {
  const isLeft = position === "left";

  if (!banner.imageUrl || !banner.imageUrl.trim()) {
    return null;
  }

  return (
    <aside
      aria-label={`Banner estático lateral ${isLeft ? "izquierdo" : "derecho"}`}
      className={`fixed top-[112px] ${
        isLeft ? "left-2 2xl:left-4" : "right-2 2xl:right-4"
      } !mt-0 !mb-0 m-0 z-30 hidden min-[1420px]:flex flex-col w-[calc((100vw-1280px)/2-24px)] max-w-[280px] rounded-2xl 2xl:rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 bg-[#0B131E] group select-none transition-all duration-150`}
      style={{
        bottom: `${Math.max(16, bottomOffset + 16)}px`,
      }}
    >
      {/* Clickable Static Poster Link covering 100% of the banner */}
      <Link
        href={banner.targetUrl || "/catalog"}
        className="relative w-full h-full block overflow-hidden group cursor-pointer"
        title={banner.altText || "Ver promoción"}
      >
        <img
          src={banner.imageUrl}
          alt={banner.altText || (isLeft ? "Banner lateral izquierdo" : "Banner lateral derecho")}
          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
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
  const pathname = usePathname();
  const [config, setConfig] = useState<SideBannersConfig>(DEFAULT_SIDE_BANNERS);
  const [isDismissedLeft, setIsDismissedLeft] = useState(false);
  const [isDismissedRight, setIsDismissedRight] = useState(false);
  const [footerOverlap, setFooterOverlap] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    async function loadSettings() {
      try {
        const res = await fetch("/api/side-banners", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.config) {
            setConfig(json.data.config);
          }
        }
      } catch (err) {
        console.warn("[SidePromotionalBanners] Error cargando configuración:", err);
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

  // Detect footer collision when scrolling to bottom and stop banners right above the footer
  useEffect(() => {
    let ticking = false;

    const checkFooterCollision = () => {
      const footer =
        document.getElementById("store-main-footer") ||
        document.querySelector("footer");

      if (!footer) {
        setFooterOverlap(0);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // If the top edge of the footer entered the viewport
      if (footerRect.top < windowHeight) {
        const overlap = Math.max(0, windowHeight - footerRect.top);
        setFooterOverlap(overlap);
      } else {
        setFooterOverlap(0);
      }
      ticking = false;
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkFooterCollision);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    checkFooterCollision();

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [pathname]);

  // Hide on admin and checkout panels
  if (!mounted || !config.enabled || pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) {
    return null;
  }

  const showLeft = config.leftBanner?.enabled && !isDismissedLeft && Boolean(config.leftBanner?.imageUrl?.trim());
  const showRight = config.rightBanner?.enabled && !isDismissedRight && Boolean(config.rightBanner?.imageUrl?.trim());

  if (!showLeft && !showRight) {
    return null;
  }

  return (
    <>
      {/* Banner estático lateral izquierdo */}
      {showLeft && (
        <StaticBannerCard
          banner={config.leftBanner}
          position="left"
          bottomOffset={footerOverlap}
          onDismiss={() => setIsDismissedLeft(true)}
        />
      )}

      {/* Banner estático lateral derecho (El Asistente IA Sommelier se superpone en la esquina inferior derecha) */}
      {showRight && (
        <StaticBannerCard
          banner={config.rightBanner}
          position="right"
          bottomOffset={footerOverlap}
          onDismiss={() => setIsDismissedRight(true)}
        />
      )}
    </>
  );
}

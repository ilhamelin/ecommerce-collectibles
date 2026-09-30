"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Sparkles,
  Gamepad2,
  Trophy,
  Layers,
  Truck,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Filter,
  User,
  Heart,
  Cpu,
  Headphones,
  Shirt,
  BookOpen,
  Gift,
  Disc3,
  Flame,
  Shield,
  Crown,
  Tv,
  Zap,
  Star,
  Compass,
  ArrowRight,
  Boxes,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { DEFAULT_BRANDING_DATA, StoreBrandingData } from "@/lib/constants/brandingDefaults";
import { DEFAULT_ANNOUNCEMENT_DATA, StoreAnnouncementData } from "@/lib/constants/announcementDefaults";
import { getProductCategoryInfo } from "@/lib/utils/category";
import { catalogClient } from "@/lib/services/catalogClient";
import { categoryClient } from "@/lib/services/categoryClient";
import { getCategoryIconComponent } from "@/lib/constants/categoryIcons";
import type { CustomCategoryEntity } from "@/lib/types/domain";
import { formatCLP } from "@/lib/utils/currency";

let cachedBranding: StoreBrandingData | null = null;
let cachedAnnouncement: StoreAnnouncementData | null = null;

function StoreNavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams?.get("category") || null;

  const { openCart, getTotals } = useCartStore();
  const { currentUser, isAuthenticated, isAdmin, logout, guestWishlist } = useAuthStore();
  const totals = getTotals();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Dynamic custom categories and deleted native exclusions
  const [customCategories, setCustomCategories] = useState<CustomCategoryEntity[]>([]);
  const [deletedNativeCategories, setDeletedNativeCategories] = useState<string[]>([]);

  const wishlistCount = mounted
    ? currentUser
      ? currentUser.wishlist?.length || 0
      : guestWishlist?.length || 0
    : 0;

  const [branding, setBranding] = useState<StoreBrandingData>(DEFAULT_BRANDING_DATA);
  const [announcement, setAnnouncement] = useState<StoreAnnouncementData>(
    cachedAnnouncement || DEFAULT_ANNOUNCEMENT_DATA
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    VIDEO_GAME: 10,
    FIGURE: 7,
    COLLECTIBLE: 3,
    BUNDLE: 0,
    CONSOLE: 3,
    HARDWARE: 1,
    GAMING_ACCESSORY: 3,
    APPAREL: 0,
    BOOK: 1,
    MERCH: 0,
    AUDIO: 0,
    OTHER: 0,
    ALL: 28,
  });

  // Auto-close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname, searchParams]);

  // Click-outside and Escape key listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Sync custom categories & deleted native categories from categoryClient
  useEffect(() => {
    let active = true;
    const syncCategories = () => {
      Promise.all([
        categoryClient.getDeletedNativeCategories(),
        categoryClient.getCategories(),
      ]).then(([deleted, custom]) => {
        if (!active) return;
        if (Array.isArray(deleted)) setDeletedNativeCategories(deleted);
        if (Array.isArray(custom)) setCustomCategories(custom);
      });
    };

    syncCategories();
    const unsubscribe = categoryClient.subscribe(syncCategories);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Fetch dynamic product counts per category with in-flight deduplication & micro-cache
  useEffect(() => {
    let isCancelled = false;

    const updateCounts = (prods: any[]) => {
      if (isCancelled || !Array.isArray(prods)) return;
      const counts: Record<string, number> = {
        VIDEO_GAME: 0,
        FIGURE: 0,
        COLLECTIBLE: 0,
        BUNDLE: 0,
        CONSOLE: 0,
        HARDWARE: 0,
        GAMING_ACCESSORY: 0,
        APPAREL: 0,
        BOOK: 0,
        MERCH: 0,
        AUDIO: 0,
        OTHER: 0,
        ALL: prods.length,
      };
      for (const p of prods) {
        const catKey = getProductCategoryInfo(p).key;
        if (counts[catKey] !== undefined) {
          counts[catKey]++;
        } else {
          counts.OTHER++;
        }

        if (p.customCategoryLabel) {
          counts[p.customCategoryLabel] = (counts[p.customCategoryLabel] || 0) + 1;
        }
        if (p.customSpecifications?.categoryType) {
          counts[p.customSpecifications.categoryType] = (counts[p.customSpecifications.categoryType] || 0) + 1;
        }
      }
      setCategoryCounts(counts);
    };

    catalogClient.getCatalog()
      .then(updateCounts)
      .catch(() => {});

    const unsub = catalogClient.subscribe(updateCounts);

    return () => {
      isCancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    setMounted(true);

    // Reuse in-memory branding if already retrieved
    if (cachedBranding) {
      setBranding(cachedBranding);
    } else {
      // Fetch live branding settings once
      fetch("/api/admin/branding")
        .then((res) => {
          if (!res.ok) throw new Error("Branding fetch failed");
          return res.json();
        })
        .then((data) => {
          const brand = data?.data?.branding || data?.branding;
          if (brand) {
            cachedBranding = brand;
            setBranding(brand);
          }
        })
        .catch(() => {});
    }

    // Reuse in-memory announcement if already retrieved
    if (cachedAnnouncement) {
      setAnnouncement(cachedAnnouncement);
    } else {
      // Fetch live announcement settings once
      fetch("/api/announcement")
        .then((res) => {
          if (!res.ok) throw new Error("Announcement fetch failed");
          return res.json();
        })
        .then((json) => {
          if (json?.data) {
            cachedAnnouncement = json.data;
            setAnnouncement(json.data);
          }
        })
        .catch(() => {});
    }

    // Listen for realtime visual changes saved in admin panel
    const handleAnnouncementUpdated = (e: Event) => {
      const detail = (e as CustomEvent<StoreAnnouncementData>).detail;
      if (detail) {
        cachedAnnouncement = detail;
        setAnnouncement(detail);
      }
    };
    window.addEventListener("store_announcement_updated", handleAnnouncementUpdated);

    return () => {
      window.removeEventListener("store_announcement_updated", handleAnnouncementUpdated);
    };
  }, []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/catalog", label: "Catálogo" },
    { href: "/catalog?category=VIDEO_GAME", label: "Videojuegos", icon: Gamepad2, categoryKey: "VIDEO_GAME" },
    { href: "/catalog?category=FIGURE", label: "Figuras", icon: Sparkles, categoryKey: "FIGURE" },
    { href: "/catalog?category=COLLECTIBLE", label: "TCG & Rarezas", icon: Trophy, categoryKey: "COLLECTIBLE" },
    { href: "/catalog?category=BUNDLE", label: "Bundles", icon: Layers, categoryKey: "BUNDLE" },
    { href: "/catalog?category=CONSOLE", label: "Consolas", icon: Tv, categoryKey: "CONSOLE" },
    { href: "/catalog?category=HARDWARE", label: "Hardware", icon: Cpu, categoryKey: "HARDWARE" },
    { href: "/catalog?category=GAMING_ACCESSORY", label: "Accesorios", icon: Headphones, categoryKey: "GAMING_ACCESSORY" },
  ].filter((item) => !item.categoryKey || !deletedNativeCategories.includes(item.categoryKey));

  const quickNavCategories = [
    { href: "/catalog?category=VIDEO_GAME", label: "Videojuegos", categoryKey: "VIDEO_GAME" },
    { href: "/catalog?category=FIGURE", label: "Figuras", categoryKey: "FIGURE" },
    { href: "/catalog?category=COLLECTIBLE", label: "TCG & Rarezas", categoryKey: "COLLECTIBLE" },
    { href: "/catalog?category=BUNDLE", label: "Bundles", categoryKey: "BUNDLE" },
    { href: "/catalog?category=CONSOLE", label: "Consolas", categoryKey: "CONSOLE" },
    { href: "/catalog?category=HARDWARE", label: "Hardware", categoryKey: "HARDWARE" },
    { href: "/catalog?category=GAMING_ACCESSORY", label: "Accesorios", categoryKey: "GAMING_ACCESSORY" },
  ].filter((item) => !deletedNativeCategories.includes(item.categoryKey));

  const coreCategories = [
    {
      key: "VIDEO_GAME",
      href: "/catalog?category=VIDEO_GAME",
      label: "Videojuegos",
      desc: "Juegos PS5, Switch, Retro y Ed. Especiales",
      icon: Gamepad2,
      gradient: "from-blue-600 to-indigo-600",
      count: categoryCounts.VIDEO_GAME,
    },
    {
      key: "FIGURE",
      href: "/catalog?category=FIGURE",
      label: "Figuras de Escala",
      desc: "Escalas 1/7, 1/4, Resinas y Nendoroid",
      icon: Sparkles,
      gradient: "from-purple-600 to-pink-600",
      count: categoryCounts.FIGURE,
    },
    {
      key: "COLLECTIBLE",
      href: "/catalog?category=COLLECTIBLE",
      label: "TCG & Rarezas PSA",
      desc: "Pokémon, One Piece y Cartas Graduadas",
      icon: Trophy,
      gradient: "from-amber-500 to-[#FF6B35]",
      count: categoryCounts.COLLECTIBLE,
    },
    {
      key: "BUNDLE",
      href: "/catalog?category=BUNDLE",
      label: "Bundles & Packs",
      desc: "Sets combinados con ahorro garantizado",
      icon: Layers,
      gradient: "from-emerald-500 to-teal-600",
      count: categoryCounts.BUNDLE,
    },
  ].filter((item) => !deletedNativeCategories.includes(item.key));

  const nativeSpecialized = [
    { key: "CONSOLE", href: "/catalog?category=CONSOLE", label: "Consolas", icon: Tv, count: categoryCounts.CONSOLE },
    { key: "HARDWARE", href: "/catalog?category=HARDWARE", label: "Hardware & PC", icon: Cpu, count: categoryCounts.HARDWARE },
    { key: "GAMING_ACCESSORY", href: "/catalog?category=GAMING_ACCESSORY", label: "Accesorios Gaming", icon: Headphones, count: categoryCounts.GAMING_ACCESSORY },
    { key: "APPAREL", href: "/catalog?category=APPAREL", label: "Ropa & Estilo", icon: Shirt, count: categoryCounts.APPAREL },
    { key: "BOOK", href: "/catalog?category=BOOK", label: "Manga & Artbooks", icon: BookOpen, count: categoryCounts.BOOK },
    { key: "MERCH", href: "/catalog?category=MERCH", label: "Merchandising", icon: Gift, count: categoryCounts.MERCH },
    { key: "AUDIO", href: "/catalog?category=AUDIO", label: "Audio & OST", icon: Disc3, count: categoryCounts.AUDIO },
  ].filter((item) => !deletedNativeCategories.includes(item.key));

  const customSpecialized = customCategories.map((c) => ({
    key: c.id,
    href: `/catalog?category=${encodeURIComponent(c.id)}`,
    label: c.name,
    icon: getCategoryIconComponent(c.iconName),
    count: categoryCounts[c.id] || categoryCounts[c.name] || 0,
  }));

  const specializedCategories = [
    ...nativeSpecialized,
    ...customSpecialized,
    { key: "OTHER", href: "/catalog?category=OTHER", label: "Otras Categorías", icon: Boxes, count: categoryCounts.OTHER },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 border-b border-[#E5E5E5] shadow-sm">
      {/* Top Friendly Announcement Bar */}
      {announcement.enabled && (
        <div
          style={{
            backgroundColor: announcement.backgroundColor || "#1F3A5F",
            color: announcement.textColor || "#F9F9F9",
          }}
          className="border-b border-black/20 px-4 py-1.5 text-xs transition-colors duration-200"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-[11px] flex-wrap">
              {announcement.shippingEnabled && (
                <Link
                  href={announcement.shippingLink || "/tracking"}
                  className="flex items-center gap-1.5 font-bold transition hover:brightness-110"
                  style={{ color: announcement.accentColor || "#FF6B35" }}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{announcement.shippingText}</span>
                  {announcement.shippingHighlight && (
                    <span className="opacity-95 font-semibold"> {announcement.shippingHighlight}</span>
                  )}
                </Link>
              )}

              {announcement.shippingEnabled && (announcement.paymentEnabled || announcement.guaranteeEnabled) && (
                <span className="hidden md:inline text-white/30">|</span>
              )}

              {announcement.paymentEnabled && (
                <span className="hidden md:flex items-center gap-1 opacity-90">
                  <CreditCard className="w-3 h-3" style={{ color: announcement.accentColor || "#FF6B35" }} />
                  <span>{announcement.paymentText}</span>
                  <strong style={{ color: announcement.accentColor || "#FF6B35" }}>
                    {" "}{announcement.paymentHighlight}
                  </strong>
                </span>
              )}

              {announcement.paymentEnabled && announcement.guaranteeEnabled && (
                <span className="hidden lg:inline text-white/30">|</span>
              )}

              {announcement.guaranteeEnabled && (
                <span className="hidden lg:flex items-center gap-1 opacity-90">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{announcement.guaranteeText}</span>
                </span>
              )}
            </div>

            {/* Right Side: WhatsApp + Regístrate | Mi cuenta */}
            <div className="flex items-center gap-2.5 text-[11px]">
              {announcement.whatsappEnabled && (
                <a
                  href={
                    announcement.whatsappLink ||
                    `https://wa.me/${announcement.whatsappPhone.replace(/\D/g, "")}?text=Hola%2C%20tengo%20una%20consulta%20sobre%20un%20producto`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 opacity-90 font-medium hover:opacity-100 hover:brightness-125 transition"
                  title="Contactar atención por WhatsApp"
                >
                  {announcement.whatsappPulse && (
                    <span className="w-2 h-2 rounded-full bg-[#2E9E5B] animate-pulse" />
                  )}
                  <span>{announcement.whatsappLabel}</span>
                  <strong className="font-mono" style={{ color: announcement.accentColor || "#FF6B35" }}>
                    {announcement.whatsappPhone}
                  </strong>
                </a>
              )}

            {mounted && isAuthenticated && currentUser ? (
              <>
                <span className="text-white/30">|</span>
                {isAdmin ? (
                  <Link
                    href="/admin/products"
                    className="flex items-center gap-1 text-[#FF6B35] hover:text-white transition font-bold px-1.5 py-0.5 rounded bg-white/10"
                    title="Panel de Administración"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Admin Tienda</span>
                  </Link>
                ) : (
                  <Link
                    href="/account"
                    className="flex items-center gap-1 text-white hover:text-[#FF6B35] transition font-bold"
                  >
                    <User className="w-3 h-3 text-[#FF6B35]" />
                    <span>Hola, {currentUser.fullName.split(" ")[0]}</span>
                  </Link>
                )}
                <span className="text-white/30">|</span>
                <Link
                  href="/account"
                  className="text-white/80 hover:text-white transition font-medium"
                >
                  Mi cuenta
                </Link>
                <span className="text-white/30">|</span>
                <button
                  onClick={logout}
                  className="text-white/70 hover:text-red-300 transition"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <span className="text-white/30">|</span>
                <Link
                  href="/auth/login?mode=register"
                  className="text-white/80 hover:text-[#FF6B35] transition font-medium"
                >
                  Regístrate
                </Link>
                <span className="text-white/30">|</span>
                <Link
                  href="/auth/login"
                  className="text-white hover:text-[#FF6B35] transition font-medium"
                >
                  Mi cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            {branding.logoMode === "image" && branding.logoImageUrl ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-md flex items-center justify-center bg-white group-hover:scale-105 transition">
                <img
                  src={branding.logoImageUrl}
                  alt={`${branding.titlePrefix} ${branding.titleHighlight}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                  branding.logoBgGradient || "from-[#FF6B35] to-[#1F3A5F]"
                } flex items-center justify-center shadow-md shadow-[#1F3A5F]/20 group-hover:scale-105 transition`}
              >
                {branding.logoIcon === "AI_GENERATED" && branding.customSvgIcon ? (
                  <div
                    className="w-5 h-5 text-white flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5"
                    dangerouslySetInnerHTML={{ __html: branding.customSvgIcon }}
                  />
                ) : branding.logoIcon === "Flame" ? (
                  <Flame className="w-5 h-5 text-white" />
                ) : branding.logoIcon === "Gamepad2" ? (
                  <Gamepad2 className="w-5 h-5 text-white" />
                ) : branding.logoIcon === "Trophy" ? (
                  <Trophy className="w-5 h-5 text-white" />
                ) : branding.logoIcon === "Shield" ? (
                  <Shield className="w-5 h-5 text-white" />
                ) : branding.logoIcon === "Crown" ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : branding.logoIcon === "Zap" ? (
                  <Zap className="w-5 h-5 text-white" />
                ) : branding.logoIcon === "Star" ? (
                  <Star className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
            )}
            <div>
              <span className="text-xl font-black tracking-tight text-[#1F3A5F]">
                {branding.titlePrefix || "OMNI"}
                <span className="text-[#FF6B35]">{branding.titleHighlight || "COLLECTOR"}</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-[#666666] font-medium">
                {branding.subtitle || "Chile • Nicho Coleccionista"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {/* Inicio Direct Link */}
            <Link
              href="/"
              className={`px-2 xl:px-3 py-1.5 rounded-xl text-[11px] xl:text-xs font-semibold transition whitespace-nowrap ${
                pathname === "/"
                  ? "bg-[#1F3A5F] text-white shadow-sm font-bold"
                  : "text-[#1A1A1A] hover:text-[#FF6B35] hover:bg-[#F7F7F5]"
              }`}
            >
              Inicio
            </Link>

            {/* Catálogo Dropdown Trigger & Luxury Mega-Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-[11px] xl:text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  pathname === "/catalog" || isDropdownOpen
                    ? "bg-[#1F3A5F] text-white shadow-sm font-bold ring-2 ring-[#FF6B35]/25"
                    : "text-[#1A1A1A] hover:text-[#FF6B35] hover:bg-[#F7F7F5]"
                }`}
                title="Explorar todas las categorías del catálogo"
              >
                <Compass className={`w-3.5 h-3.5 ${pathname === "/catalog" || isDropdownOpen ? "text-[#FF6B35]" : "text-[#1F3A5F]"}`} />
                <span>Catálogo</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180 text-[#FF6B35]" : "text-slate-400 group-hover:text-[#FF6B35]"
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  style={{ backgroundColor: "#0B1528" }}
                  className="absolute left-0 mt-2.5 w-[680px] xl:w-[720px] max-w-[calc(100vw-2rem)] rounded-2xl bg-[#0B1528] border border-slate-700 shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden z-[100] text-white animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 ring-1 ring-white/10"
                >
                  {/* Top Gradient Glow Accent */}
                  <div className="h-[2px] w-full bg-gradient-to-r from-[#FF6B35] via-amber-400 to-[#1F3A5F]" />

                  {/* Header Bar: Catálogo Hero */}
                  <div
                    style={{ backgroundColor: "#15253F" }}
                    className="p-4 bg-[#15253F] border-b border-slate-700/80 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/20 border border-[#FF6B35]/40 flex items-center justify-center text-[#FF6B35] shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-white">
                            Explorar Catálogo Completo
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B35]/25 text-[#FF6B35] border border-[#FF6B35]/40 font-mono">
                            {categoryCounts.ALL} Productos
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-1">
                          Coleccionables certificados, preventas oficiales y hardware con precio congelado en CLP.
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/catalog"
                      onClick={() => setIsDropdownOpen(false)}
                      className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85A24] text-white text-xs font-extrabold shadow-md shadow-[#FF6B35]/25 hover:brightness-110 active:scale-95 transition group"
                    >
                      <span>Ver Todo</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {/* Main 2-Column Mega-Menu Body (Solid 100% Opaque) */}
                  <div
                    style={{ backgroundColor: "#0B1528" }}
                    className="p-4 bg-[#0B1528] grid grid-cols-1 md:grid-cols-12 gap-4"
                  >
                    {/* Left Column: Categorías Principales (7 cols) */}
                    <div className="md:col-span-7 space-y-2">
                      <div className="flex items-center justify-between px-1 pb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35] flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" />
                          Bóveda Principal
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Líneas destacadas</span>
                      </div>

                      <div className="space-y-1.5">
                        {coreCategories.map((item) => {
                          const isItemActive = pathname === "/catalog" && currentCategory?.toUpperCase() === item.key;
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.key}
                              href={item.href}
                              onClick={() => setIsDropdownOpen(false)}
                              style={{ backgroundColor: isItemActive ? "#182B47" : "#111F36" }}
                              className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150 ${
                                isItemActive
                                  ? "bg-[#182B47] border-[#FF6B35] shadow-md shadow-[#FF6B35]/20 ring-1 ring-[#FF6B35]/40"
                                  : "bg-[#111F36] hover:bg-[#172844] border-slate-700/70 hover:border-[#FF6B35]/60 shadow-sm"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0`}
                                >
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <span className={`block text-xs font-bold transition-colors ${
                                    isItemActive ? "text-[#FF6B35]" : "text-white group-hover:text-[#FF6B35]"
                                  }`}>
                                    {item.label}
                                  </span>
                                  <span className="block text-[10px] text-slate-400 line-clamp-1 group-hover:text-slate-300">
                                    {item.desc}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pl-2 shrink-0">
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                                  isItemActive
                                    ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                                    : "bg-[#0B1528] text-slate-300 border-slate-700 group-hover:border-[#FF6B35]/50 group-hover:text-white"
                                }`}>
                                  {item.count}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#FF6B35] group-hover:translate-x-0.5 transition" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Especialidades & Ecosistema (5 cols) */}
                    <div className="md:col-span-5 space-y-2 border-t md:border-t-0 md:border-l border-slate-700/80 md:pl-4 pt-3 md:pt-0">
                      <div className="flex items-center justify-between px-1 pb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" />
                          Especialidades & Hardware
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        {specializedCategories.map((item) => {
                          const isItemActive = pathname === "/catalog" && currentCategory?.toUpperCase() === item.key;
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.key}
                              href={item.href}
                              onClick={() => setIsDropdownOpen(false)}
                              style={{ backgroundColor: isItemActive ? "#153047" : "#111F36" }}
                              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition ${
                                isItemActive
                                  ? "bg-[#153047] border-cyan-400 text-white font-bold shadow-sm"
                                  : "bg-[#111F36] hover:bg-[#172844] border-slate-700/70 hover:border-cyan-400/50 text-slate-200 hover:text-white"
                              }`}
                            >
                              <span className="flex items-center gap-2 text-xs">
                                <IconComponent className={`w-3.5 h-3.5 transition-colors ${
                                  isItemActive ? "text-cyan-400" : "text-cyan-400/90 group-hover:text-cyan-300"
                                }`} />
                                <span className="truncate">{item.label}</span>
                              </span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                isItemActive
                                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold"
                                  : "bg-[#0B1528] text-slate-400 border-slate-700 group-hover:text-slate-200"
                              }`}>
                                ({item.count})
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Luxury Footer Strip */}
                  <div
                    style={{ backgroundColor: "#080E1C" }}
                    className="px-4 py-2.5 bg-[#080E1C] border-t border-slate-700/80 flex items-center justify-between gap-3 text-[10px] text-slate-400"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3 text-[#FF6B35]" />
                        <span>Envíos Asegurados a todo Chile</span>
                      </span>
                      <span className="hidden sm:inline text-slate-600">•</span>
                      <span className="hidden sm:flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span>100% Originales & Sellados</span>
                      </span>
                    </div>

                    <Link
                      href="/catalog?sort=newest"
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-[#FF6B35] hover:underline font-bold flex items-center gap-1 group shrink-0"
                    >
                      <span>Novedades recientes</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Category Direct Pills */}
            {quickNavCategories.map((link) => {
              const isActive = pathname === "/catalog" && currentCategory?.toUpperCase() === link.categoryKey;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2 xl:px-3 py-1.5 rounded-xl text-[11px] xl:text-xs font-semibold transition whitespace-nowrap ${
                    isActive
                      ? "bg-[#1F3A5F] text-white shadow-sm font-bold"
                      : "text-[#1A1A1A] hover:text-[#FF6B35] hover:bg-[#F7F7F5]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Wishlist, Cart & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Wishlist Quick Action */}
            <Link
              href="/account?tab=wishlist"
              className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#F7F7F5] hover:bg-white border border-[#E5E5E5] text-[#1F3A5F] transition flex items-center justify-center group shadow-sm shrink-0 active:scale-95"
              title="Mis Favoritos"
              aria-label="Ver Mis Favoritos"
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 ${
                  wishlistCount > 0 ? "fill-[#FF6B35] text-[#FF6B35]" : "text-[#1F3A5F]"
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#FF6B35] text-white font-mono text-[9px] font-black flex items-center justify-center shadow">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] border border-[#1F3A5F] text-white transition flex items-center gap-2 sm:gap-2.5 shadow-md shadow-[#1F3A5F]/20 group shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
              aria-label="Ver Carrito de Compras"
            >
              <div className="relative p-1.5 rounded-lg bg-[#FF6B35] text-white group-hover:scale-105 transition shrink-0 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {mounted && totals.totalItemCount > 0 && (
                  <span className="sm:hidden absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white font-mono text-[9px] font-black flex items-center justify-center shadow">
                    {totals.totalItemCount}
                  </span>
                )}
              </div>

              <div className="text-left leading-none hidden sm:flex sm:flex-col justify-center shrink-0">
                <span className="text-[10px] text-white/70 font-medium whitespace-nowrap block">
                  Total Carrito:
                </span>
                <span className="font-extrabold text-xs text-white font-mono whitespace-nowrap mt-0.5 block">
                  {mounted ? formatCLP(totals.totalDueToday) : "$ 0 CLP"}
                </span>
              </div>

              {mounted && totals.totalItemCount > 0 && (
                <span className="hidden sm:flex min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF6B35] text-white font-mono text-[11px] font-black items-center justify-center shadow shrink-0">
                  {totals.totalItemCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-[#1A1A1A] hover:bg-white transition"
              aria-label="Menú Móvil"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E5E5] bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const isActive = link.categoryKey
              ? pathname === "/catalog" && currentCategory?.toUpperCase() === link.categoryKey
              : link.href === "/catalog"
              ? pathname === "/catalog" && (!currentCategory || currentCategory.toUpperCase() === "ALL")
              : pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-[#1F3A5F] text-white font-bold"
                    : "text-[#1A1A1A] hover:text-[#FF6B35] hover:bg-[#F7F7F5]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-[#E5E5E5] space-y-1">
            <Link
              href="/account?tab=wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-[#1A1A1A] hover:bg-[#F7F7F5] font-medium"
            >
              <div className="flex items-center gap-2">
                <Heart className={`w-4 h-4 ${wishlistCount > 0 ? "fill-[#FF6B35] text-[#FF6B35]" : "text-[#FF6B35]"}`} />
                <span>Mis Favoritos</span>
              </div>
              {wishlistCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF6B35] text-white font-bold text-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>
          </div>
          <div className="pt-2 border-t border-[#E5E5E5] space-y-2">
            {mounted && isAuthenticated && currentUser ? (
              <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#FF6B35]" />
                    {currentUser.fullName}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#FF6B35] text-white">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-1.5 rounded-lg bg-[#1F3A5F] text-white text-xs font-bold text-center"
                  >
                    Mi Cuenta
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-[#D64545] border border-red-200 text-xs font-semibold"
                  >
                    Salir
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 rounded-xl bg-[#1F3A5F] text-white text-xs font-bold text-center"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/login?mode=register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 rounded-xl bg-[#FF6B35] hover:bg-[#e85822] text-white text-xs font-black text-center transition shadow-sm"
                >
                  Registrarse
                </Link>
              </div>
            )}

            <a
              href="https://wa.me/56958243917"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-[#2E9E5B] bg-[#2E9E5B]/10 border border-[#2E9E5B]/30 font-semibold"
            >
              <span>💬 WhatsApp (+56 9 5824 3917)</span>
              <span className="text-[10px] bg-[#2E9E5B] text-white px-1.5 py-0.5 rounded font-bold">ONLINE</span>
            </a>

            {isAdmin && (
              <Link
                href="/admin/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-[#FF6B35] hover:text-[#E85A24] bg-[#F7F7F5] border border-[#FF6B35]/40 font-bold"
              >
                <Sparkles className="w-4 h-4" />
                Panel de Administración Tienda
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export function StoreNavbar() {
  return (
    <Suspense
      fallback={
        <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 border-b border-[#E5E5E5] shadow-sm min-h-[4rem]" />
      }
    >
      <StoreNavbarContent />
    </Suspense>
  );
}



"use client";

import React, { useState, useEffect } from "react";
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
  User,
  Heart,
  Cpu,
  Headphones,
  Flame,
  Shield,
  Crown,
  Zap,
  Star,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { formatCLP } from "@/lib/utils/currency";
import { DEFAULT_BRANDING_DATA, StoreBrandingData } from "@/lib/constants/brandingDefaults";

function StoreNavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams?.get("category");

  const { openCart, getTotals } = useCartStore();
  const { currentUser, isAuthenticated, isAdmin, logout, guestWishlist } = useAuthStore();
  const totals = getTotals();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const wishlistCount = mounted
    ? currentUser
      ? currentUser.wishlist?.length || 0
      : guestWishlist?.length || 0
    : 0;

  const [branding, setBranding] = useState<StoreBrandingData>(DEFAULT_BRANDING_DATA);

  useEffect(() => {
    setMounted(true);
    // Fetch live branding settings
    fetch("/api/admin/branding")
      .then((res) => {
        if (!res.ok) throw new Error("Branding fetch failed");
        return res.json();
      })
      .then((data) => {
        const brand = data?.data?.branding || data?.branding;
        if (brand) {
          setBranding(brand);
        }
      })
      .catch(() => {
        // Fallback to default
      });
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
    { href: "/catalog?category=CONSOLE", label: "Consolas", icon: Cpu, categoryKey: "CONSOLE" },
    { href: "/catalog?category=GAMING_ACCESSORY", label: "Accesorios", icon: Headphones, categoryKey: "GAMING_ACCESSORY" },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 border-b border-[#E5E5E5] shadow-sm">
      {/* Top Friendly Announcement Bar */}
      <div className="bg-[#1F3A5F] border-b border-[#152842] px-4 py-1.5 text-xs text-white/90">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-[#FF6B35] font-bold">
              <Truck className="w-3.5 h-3.5" /> Envíos a todo Chile (Starken / Chilexpress)
            </span>
            <span className="hidden md:inline text-white/30">|</span>
            <span className="hidden md:flex items-center gap-1 text-white/90">
              <CreditCard className="w-3 h-3 text-[#FF6B35]" /> Hasta 12 cuotas sin interés con Webpay & Mercado Pago
            </span>
            <span className="hidden lg:inline text-white/30">|</span>
            <span className="hidden lg:flex items-center gap-1 text-white/90">
              <Sparkles className="w-3 h-3 text-amber-300" /> Figuras 100% Originales & Licenciadas
            </span>
          </div>

          {/* Right Side: WhatsApp + Regístrate | Mi cuenta */}
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-white/90 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#2E9E5B] animate-pulse" />
              WhatsApp Atención: <strong className="text-[#FF6B35] font-mono">+56 9 8765 4321</strong>
            </span>

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

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
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
                {branding.logoIcon === "Flame" ? (
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
          <div className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = link.categoryKey
                ? pathname === "/catalog" && currentCategory === link.categoryKey
                : link.href === "/catalog"
                ? pathname === "/catalog" && !currentCategory
                : pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 xl:px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
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
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Wishlist Quick Action */}
            <Link
              href="/account?tab=wishlist"
              className="relative p-2.5 rounded-xl bg-[#F7F7F5] hover:bg-white border border-[#E5E5E5] text-[#1F3A5F] transition flex items-center justify-center group shadow-sm"
              title="Mis Favoritos"
              aria-label="Ver Mis Favoritos"
            >
              <Heart
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  wishlistCount > 0 ? "fill-[#FF6B35] text-[#FF6B35]" : "text-[#1F3A5F]"
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF6B35] text-white font-mono text-[10px] font-black flex items-center justify-center shadow">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={openCart}
              className="relative px-3.5 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] border border-[#1F3A5F] text-white transition flex items-center gap-2.5 shadow-md shadow-[#1F3A5F]/15 group"
              aria-label="Ver Carrito de Compras"
            >
              <div className="p-1 rounded-lg bg-[#FF6B35] text-white group-hover:scale-105 transition">
                <ShoppingBag className="w-4 h-4" />
              </div>

              <div className="text-left leading-tight hidden sm:block">
                <span className="text-[10px] text-white/70 block">A pagar hoy:</span>
                <span className="font-bold text-xs text-white font-mono">
                  {mounted ? formatCLP(totals.totalDueToday) : "$ 0 CLP"}
                </span>
              </div>

              {mounted && totals.totalItemCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF6B35] text-white font-mono text-[11px] font-extrabold flex items-center justify-center shadow">
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm text-[#1A1A1A] hover:text-[#FF6B35] hover:bg-[#F7F7F5] font-medium"
            >
              {link.label}
            </Link>
          ))}
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
              href="https://wa.me/56987654321"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-[#2E9E5B] bg-[#2E9E5B]/10 border border-[#2E9E5B]/30 font-semibold"
            >
              <span>💬 WhatsApp (+56 9 8765 4321)</span>
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
    <React.Suspense
      fallback={
        <nav className="sticky top-0 z-40 w-full bg-white border-b border-[#E5E5E5] h-24" />
      }
    >
      <StoreNavbarContent />
    </React.Suspense>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openCart, getTotals } = useCartStore();
  const { currentUser, guestWishlist } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide in checkout, tracking, and admin pages to prevent distractions
  if (
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/order-confirmation")
  ) {
    return null;
  }

  const totals = getTotals();
  const cartCount = mounted ? totals.totalItemCount : 0;
  const wishlistCount = mounted
    ? currentUser
      ? currentUser.wishlist?.length || 0
      : guestWishlist?.length || 0
    : 0;

  const navItems = [
    {
      label: "Inicio",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Catálogo",
      href: "/catalog",
      icon: Compass,
      isActive: pathname?.startsWith("/catalog") || pathname?.startsWith("/product"),
    },
    {
      label: "Favoritos",
      href: "/account?tab=wishlist",
      icon: Heart,
      isActive: pathname === "/account" && typeof window !== "undefined" && window.location.search.includes("wishlist"),
      badge: wishlistCount,
    },
    {
      label: "Mi Cuenta",
      href: "/account",
      icon: User,
      isActive: pathname === "/account" && (typeof window === "undefined" || !window.location.search.includes("wishlist")),
    },
  ];

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E5E5] px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-5 items-center">
        {/* First 2 items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors active:scale-95 ${
                item.isActive ? "text-[#FF6B35] font-bold" : "text-[#666666] hover:text-[#1A1A1A]"
              }`}
            >
              <Icon className={`w-5 h-5 ${item.isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Center item: Cart button with micro-interaction */}
        <button
          type="button"
          onClick={openCart}
          aria-label="Abrir carrito de compras"
          className="flex flex-col items-center justify-center py-1 rounded-xl text-[#1A1A1A] hover:text-[#FF6B35] transition-colors relative active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#FF6B35] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Carrito</span>
        </button>

        {/* Last 2 items */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors relative active:scale-95 ${
                item.isActive ? "text-[#FF6B35] font-bold" : "text-[#666666] hover:text-[#1A1A1A]"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${item.isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#1F3A5F] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

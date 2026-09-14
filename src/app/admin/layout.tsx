"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  PlusCircle,
  ShoppingBag,
  Store,
  Sparkles,
  ArrowUpRight,
  Sliders,
  LayoutDashboard,
  Users,
  ChevronDown,
  Palette,
  Image as ImageIcon,
  Radio,
  TrendingUp,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isVisualMenuOpen, setIsVisualMenuOpen] = useState(false);
  const visualMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (visualMenuRef.current && !visualMenuRef.current.contains(e.target as Node)) {
        setIsVisualMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    {
      href: "/admin",
      label: "Métricas & KPI",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      href: "/admin/products",
      label: "Catálogo & Inventario",
      icon: Package,
      active: pathname === "/admin/products",
    },
    {
      href: "/admin/predictive-stock",
      label: "Rotación & Stock IA",
      icon: TrendingUp,
      active: pathname === "/admin/predictive-stock",
    },
    {
      href: "/admin/radar",
      label: "Radar Japón IA",
      icon: Radio,
      active: pathname === "/admin/radar",
    },
    {
      href: "/admin/products/new",
      label: "Agregar Producto",
      icon: PlusCircle,
      active: pathname === "/admin/products/new",
    },
    {
      href: "/admin/orders",
      label: "Gestión de Pedidos",
      icon: ShoppingBag,
      active: pathname === "/admin/orders",
    },
  ];

  const isVisualActive = pathname.startsWith("/admin/slider") || pathname.startsWith("/admin/branding");

  const otherNavItems = [
    {
      href: "/admin/users",
      label: "Usuarios & Clientes",
      icon: Users,
      active: pathname === "/admin/users",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1A1A1A]">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-50 border-b border-[#152842] bg-[#1F3A5F] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Section identifier */}
            <div className="flex items-center gap-3">
              <Link href="/admin/products" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-[#FF6B35] text-white flex items-center justify-center shadow group-hover:scale-105 transition">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-base font-black tracking-tight text-white">
                    OMNI<span className="text-[#FF6B35]">ADMIN</span>
                  </span>
                  <span className="block text-[10px] text-white/70 font-mono leading-none">
                    Centro de Control
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Modules Tabs */}
            <nav className="flex items-center gap-1.5 sm:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition ${
                      item.active
                        ? "bg-[#FF6B35] text-white shadow-sm"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}

              {/* Dropdown Menu: Slider & Portada / Logotipo */}
              <div className="relative" ref={visualMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsVisualMenuOpen(!isVisualMenuOpen)}
                  onMouseEnter={() => setIsVisualMenuOpen(true)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isVisualActive
                      ? "bg-[#FF6B35] text-white shadow-sm"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  aria-expanded={isVisualMenuOpen}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden md:inline">Slider Portada</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isVisualMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isVisualMenuOpen && (
                  <div
                    onMouseLeave={() => setIsVisualMenuOpen(false)}
                    className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-white text-[#1A1A1A] border border-[#E5E5E5] shadow-xl p-2 space-y-1 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-1.5 border-b border-[#F0F0F0]">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
                        Personalización Visual
                      </span>
                    </div>

                    <Link
                      href="/admin/slider"
                      onClick={() => setIsVisualMenuOpen(false)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl transition ${
                        pathname === "/admin/slider"
                          ? "bg-orange-50 text-[#1F3A5F]"
                          : "hover:bg-gray-50 text-[#333333]"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#FF6B35]/10 text-[#FF6B35] shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black block leading-tight text-[#1F3A5F]">
                          Slider de Portada
                        </span>
                        <span className="text-[10px] text-[#666666] leading-tight block mt-0.5">
                          Carrusel, promociones y productos de la base de datos
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/admin/branding"
                      onClick={() => setIsVisualMenuOpen(false)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl transition ${
                        pathname === "/admin/branding"
                          ? "bg-orange-50 text-[#1F3A5F]"
                          : "hover:bg-gray-50 text-[#333333]"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#1F3A5F]/10 text-[#1F3A5F] shrink-0 mt-0.5">
                        <Palette className="w-4 h-4 text-[#FF6B35]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black block leading-tight text-[#1F3A5F]">
                          Logotipo & Identidad
                        </span>
                        <span className="text-[10px] text-[#666666] leading-tight block mt-0.5">
                          Modificar imagen/icono, título y subtítulo
                        </span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {otherNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition ${
                      item.active
                        ? "bg-[#FF6B35] text-white shadow-sm"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Storefront Link (Connected with Sales Site) */}
            <div className="flex items-center gap-2">
              <Link
                href="/catalog"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition group shadow-sm"
              >
                <Store className="w-3.5 h-3.5 text-[#FF6B35] group-hover:scale-110 transition" />
                <span className="hidden sm:inline">Ver Tienda en Vivo</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/70" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content Body */}
      <div>{children}</div>
    </div>
  );
}

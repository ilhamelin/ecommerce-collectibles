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
  const [isMetricsMenuOpen, setIsMetricsMenuOpen] = useState(false);
  const metricsMenuRef = useRef<HTMLDivElement>(null);
  const [isInventoryMenuOpen, setIsInventoryMenuOpen] = useState(false);
  const inventoryMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (visualMenuRef.current && !visualMenuRef.current.contains(e.target as Node)) {
        setIsVisualMenuOpen(false);
      }
      if (metricsMenuRef.current && !metricsMenuRef.current.contains(e.target as Node)) {
        setIsMetricsMenuOpen(false);
      }
      if (inventoryMenuRef.current && !inventoryMenuRef.current.contains(e.target as Node)) {
        setIsInventoryMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMetricsActive = pathname === "/admin" || pathname.startsWith("/admin/predictive-stock");
  const isInventoryActive = pathname.startsWith("/admin/products") || pathname.startsWith("/admin/orders");
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
              {/* Dropdown Menu: Métricas & KPI / Rotación & Análisis Predictivo */}
              <div className="relative" ref={metricsMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMetricsMenuOpen(!isMetricsMenuOpen)}
                  onMouseEnter={() => setIsMetricsMenuOpen(true)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isMetricsActive
                      ? "bg-[#FF6B35] text-white shadow-sm"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  aria-expanded={isMetricsMenuOpen}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden md:inline">Métricas & KPI</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMetricsMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isMetricsMenuOpen && (
                  <div
                    onMouseLeave={() => setIsMetricsMenuOpen(false)}
                    className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-white text-[#1A1A1A] border border-[#E5E5E5] shadow-xl p-2 space-y-1 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-1.5 border-b border-[#F0F0F0]">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
                        Métricas & Analítica
                      </span>
                    </div>

                    <Link
                      href="/admin"
                      onClick={() => setIsMetricsMenuOpen(false)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl transition ${
                        pathname === "/admin"
                          ? "bg-orange-50 text-[#1F3A5F]"
                          : "hover:bg-gray-50 text-[#333333]"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#1F3A5F]/10 text-[#1F3A5F] shrink-0 mt-0.5">
                        <LayoutDashboard className="w-4 h-4 text-[#FF6B35]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black block leading-tight text-[#1F3A5F]">
                          Métricas & KPI (General)
                        </span>
                        <span className="text-[10px] text-[#666666] leading-tight block mt-0.5">
                          Ventas, órdenes, ingresos y rendimiento general
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/admin/predictive-stock"
                      onClick={() => setIsMetricsMenuOpen(false)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl transition ${
                        pathname === "/admin/predictive-stock"
                          ? "bg-orange-50 text-[#1F3A5F]"
                          : "hover:bg-gray-50 text-[#333333]"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#FF6B35]/10 text-[#FF6B35] shrink-0 mt-0.5">
                        <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black block leading-tight text-[#1F3A5F]">
                            Rotación & Análisis Predictivo de Stock
                          </span>
                          <span className="text-[9px] font-bold bg-orange-100 text-[#FF6B35] px-1.5 py-0.2 rounded-full shrink-0">
                            IA
                          </span>
                        </div>
                        <span className="text-[10px] text-[#666666] leading-tight block mt-0.5">
                          Burn rate, runway, demanda reprimida y reorden sugerido
                        </span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Dropdown Menu: Inventario & Catálogo */}
              <div className="relative" ref={inventoryMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsInventoryMenuOpen(!isInventoryMenuOpen)}
                  onMouseEnter={() => setIsInventoryMenuOpen(true)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isInventoryActive
                      ? "bg-[#FF6B35] text-white shadow-sm"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  aria-expanded={isInventoryMenuOpen}
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden md:inline">Inventario & Productos</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isInventoryMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isInventoryMenuOpen && (
                  <div
                    onMouseLeave={() => setIsInventoryMenuOpen(false)}
                    className="absolute left-0 mt-1.5 w-80 rounded-2xl bg-white text-[#1A1A1A] border border-[#E5E5E5] shadow-xl p-2 space-y-1 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-1.5 border-b border-[#F0F0F0]">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
                        Inventario & Catálogo
                      </span>
                    </div>

                    <Link
                      href="/admin/products"
                      onClick={() => setIsInventoryMenuOpen(false)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl transition ${
                        pathname === "/admin/products"
                          ? "bg-orange-50 text-[#1F3A5F]"
                          : "hover:bg-gray-50 text-[#333333]"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#1F3A5F]/10 text-[#1F3A5F] shrink-0 mt-0.5">
                        <Package className="w-4 h-4 text-[#FF6B35]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black block leading-tight text-[#1F3A5F]">
                          Inventario & Gestión de Productos
                        </span>
                        <span className="text-[10px] text-[#666666] leading-tight block mt-0.5">
                          Ver catálogo completo, existencias, precios y edición
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/admin/products/new"
                      onClick={() => setIsInventoryMenuOpen(false)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl transition ${
                        pathname === "/admin/products/new"
                          ? "bg-orange-50 text-[#1F3A5F]"
                          : "hover:bg-gray-50 text-[#333333]"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#FF6B35]/10 text-[#FF6B35] shrink-0 mt-0.5">
                        <PlusCircle className="w-4 h-4 text-[#FF6B35]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black block leading-tight text-[#1F3A5F]">
                          Crear Nuevo Producto en Catálogo
                        </span>
                        <span className="text-[10px] text-[#666666] leading-tight block mt-0.5">
                          Publicar nuevo producto con autocompletado y fichas técnicas
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/admin/orders"
                      onClick={() => setIsInventoryMenuOpen(false)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl transition ${
                        pathname === "/admin/orders"
                          ? "bg-orange-50 text-[#1F3A5F]"
                          : "hover:bg-gray-50 text-[#333333]"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#1F3A5F]/10 text-[#1F3A5F] shrink-0 mt-0.5">
                        <ShoppingBag className="w-4 h-4 text-[#FF6B35]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black block leading-tight text-[#1F3A5F]">
                          Gestión Centralizada de Órdenes
                        </span>
                        <span className="text-[10px] text-[#666666] leading-tight block mt-0.5">
                          Seguimiento de compras, despachos, estados y reservas
                        </span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Radar Japón IA */}
              <Link
                href="/admin/radar"
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition ${
                  pathname === "/admin/radar"
                    ? "bg-[#FF6B35] text-white shadow-sm"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Radio className="w-4 h-4" />
                <span className="hidden md:inline">Radar Japón IA</span>
              </Link>

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

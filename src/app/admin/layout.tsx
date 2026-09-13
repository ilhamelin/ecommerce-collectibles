"use client";

import React from "react";
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
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
    {
      href: "/admin/slider",
      label: "Slider Portada",
      icon: Sparkles,
      active: pathname === "/admin/slider",
    },
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

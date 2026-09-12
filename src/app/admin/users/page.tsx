"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Eye,
  MousePointerClick,
  TrendingUp,
  Search,
  ShieldCheck,
  Smartphone,
  Calendar,
  ShoppingBag,
  Flame,
  Tag,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  Sparkles,
  BarChart3,
  Layers,
} from "lucide-react";
import { useAuthStore, UserAccount } from "@/lib/store/authStore";

interface ProductClickStat {
  sku: string;
  name: string;
  category: string;
  price: number;
  clicks: number;
  views: number;
  lastInteractionAt: number;
}

interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export default function AdminUsersAnalyticsPage() {
  const { currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"USERS" | "ATTRACTION">("USERS");

  // Analytics data
  const [summary, setSummary] = useState({
    totalPageViews: 1420,
    uniqueVisitorsCount: 596,
    totalProductClicks: 685,
    activeTodayViews: 320,
  });
  const [topProducts, setTopProducts] = useState<ProductClickStat[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersRes = await fetch("/api/users", {
        headers: {
          "x-admin-secret": "omni-super-secret-key-2026",
        },
      });
      const usersJson = await usersRes.json();
      if (usersJson.success && usersJson.data?.users) {
        setUsers(usersJson.data.users);
      }

      // 2. Fetch Orders to cross-reference total spent
      const ordersRes = await fetch("/api/orders");
      const ordersJson = await ordersRes.json();
      if (ordersJson.success && ordersJson.data?.orders) {
        setOrders(ordersJson.data.orders);
      }

      // 3. Fetch Analytics
      const analyticsRes = await fetch("/api/analytics");
      const analyticsJson = await analyticsRes.json();
      if (analyticsJson.success && analyticsJson.data) {
        setSummary(analyticsJson.data.summary);
        setTopProducts(analyticsJson.data.topClickedProducts || []);
        setCategories(analyticsJson.data.categoryBreakdown || []);
        setPopularTags(analyticsJson.data.popularTags || []);
      }
    } catch (err) {
      console.error("Error loading admin users analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute spend per user from orders
  const userSpendMap = useMemo(() => {
    const map: Record<string, { totalSpent: number; orderCount: number }> = {};
    for (const ord of orders) {
      const email = ord.customer?.email?.toLowerCase().trim();
      if (!email) continue;
      if (!map[email]) {
        map[email] = { totalSpent: 0, orderCount: 0 };
      }
      map[email].totalSpent += ord.payment?.amountCollected || 0;
      map[email].orderCount += 1;
    }
    return map;
  }, [orders]);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.rut?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Most popular category
  const topCategory = useMemo(() => {
    if (!categories.length) return "Videojuegos";
    const sorted = [...categories].sort((a, b) => b.count - a.count);
    return sorted[0].category === "VIDEO_GAME"
      ? "Videojuegos"
      : sorted[0].category === "FIGURE"
      ? "Figuras"
      : sorted[0].category === "COLLECTIBLE"
      ? "TCG & PSA"
      : "Bundles";
  }, [categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#FF6B35] uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Centro de Control • Audiencia & Comportamiento
          </div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
            Usuarios & Analítica de Interacción
          </h1>
          <p className="text-sm text-[#555555]">
            Monitorea cuentas creadas, métricas de visitas a la web y el feedback de qué productos o detalles atraen más a los clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refrescar datos"
            className="p-2.5 rounded-xl bg-white border border-[#E5E5E5] text-[#555555] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#FF6B35]" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users Card */}
        <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#9bb5c2] text-xs font-semibold">
            <span>Usuarios Registrados</span>
            <Users className="w-4 h-4 text-[#FF6B35]" />
          </div>
          <div className="text-3xl font-black text-[#F9F9F9]">{users.length}</div>
          <p className="text-[11px] text-[#9bb5c2]">
            {users.filter((u) => u.role === "ADMIN").length} Administradores •{" "}
            {users.filter((u) => u.role !== "ADMIN").length} Clientes Activos
          </p>
        </div>

        {/* Total Page Views */}
        <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#9bb5c2] text-xs font-semibold">
            <span>Visitas Totales a la Web</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-[#F9F9F9]">{summary.totalPageViews.toLocaleString("es-CL")}</div>
          <p className="text-[11px] text-emerald-400 font-medium">
            ~{summary.uniqueVisitorsCount} visitantes únicos ({summary.activeTodayViews} hoy)
          </p>
        </div>

        {/* Product Clicks */}
        <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#9bb5c2] text-xs font-semibold">
            <span>Clics en Productos</span>
            <MousePointerClick className="w-4 h-4 text-[#FF6B35]" />
          </div>
          <div className="text-3xl font-black text-[#F9F9F9]">{summary.totalProductClicks.toLocaleString("es-CL")}</div>
          <p className="text-[11px] text-[#9bb5c2]">
            Interacciones directas en catálogo y sugerencias
          </p>
        </div>

        {/* Category Attraction */}
        <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#9bb5c2] text-xs font-semibold">
            <span>Categoría Más Atractiva</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-[#F9F9F9] truncate">{topCategory}</div>
          <p className="text-[11px] text-amber-300 font-medium">
            Mayor volumen de clics e interés registrado
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-2">
        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "USERS"
              ? "bg-[#1F3A5F] text-white shadow-sm"
              : "text-[#555555] hover:bg-[#E5E5E5]/60 hover:text-[#1A1A1A]"
          }`}
        >
          <Users className="w-4 h-4" />
          Directorio de Usuarios ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("ATTRACTION")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "ATTRACTION"
              ? "bg-[#1F3A5F] text-white shadow-sm"
              : "text-[#555555] hover:bg-[#E5E5E5]/60 hover:text-[#1A1A1A]"
          }`}
        >
          <Flame className="w-4 h-4 text-[#FF6B35]" />
          Feedback de Atracción & Productos Más Clickeados
        </button>
      </div>

      {/* TAB 1: USER DIRECTORY */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                placeholder="Buscar usuario por nombre, email o RUT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-[#1A1A1A] placeholder-[#666666]/60 text-xs focus:outline-none focus:border-[#FF6B35] transition shadow-sm"
              />
            </div>
            <span className="text-xs text-[#666666]">
              Mostrando <strong>{filteredUsers.length}</strong> de {users.length} cuentas
            </span>
          </div>

          {/* Users Table */}
          <div className="bg-[#092634] border border-[#004E72]/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#004E72]/60 text-[11px] font-bold text-[#9bb5c2] uppercase tracking-wider bg-[#05161f]">
                    <th className="py-3 px-4">Usuario / Nombre</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">RUT & Contacto</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Compras CLP</th>
                    <th className="py-3 px-4">Pedidos</th>
                    <th className="py-3 px-4">Direcciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#004E72]/30 text-xs text-[#F9F9F9]">
                  {filteredUsers.map((u) => {
                    const cleanEmail = u.email.toLowerCase().trim();
                    const spendInfo = userSpendMap[cleanEmail] || { totalSpent: 0, orderCount: 0 };
                    return (
                      <tr key={u.id || u.email} className="hover:bg-[#004E72]/20 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#1F3A5F] border border-[#004E72] flex items-center justify-center font-bold text-[#FF6B35]">
                              {u.fullName?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                              <span className="font-bold block text-white">{u.fullName || "Sin Nombre"}</span>
                              <span className="text-[10px] text-[#9bb5c2] font-mono">ID: {u.id?.slice(0, 10)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#9bb5c2]">{u.email}</td>
                        <td className="py-3.5 px-4 text-[#9bb5c2]">
                          <div>{u.rut || "Sin RUT"}</div>
                          <div className="text-[10px] text-[#9bb5c2]/70">{u.phone || "Sin Teléfono"}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.role === "ADMIN" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <ShieldCheck className="w-3 h-3" /> ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              CLIENTE
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#FF6B35]">
                          $ {spendInfo.totalSpent.toLocaleString("es-CL")} CLP
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-[#05161f] border border-[#004E72]/50 font-mono text-xs">
                            {spendInfo.orderCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#9bb5c2]">
                          {u.addresses && u.addresses.length > 0 ? (
                            <span className="text-[11px]">{u.addresses.length} guardada(s)</span>
                          ) : (
                            <span className="text-[11px] text-[#9bb5c2]/50">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTRACTION FEEDBACK & PRODUCT CLICKS */}
      {activeTab === "ATTRACTION" && (
        <div className="space-y-6">
          {/* Top 2 Columns: Category Distribution & Popular Search Tags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Attraction */}
            <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <BarChart3 className="w-4 h-4 text-[#FF6B35]" />
                Interés y Clics por Categoría de Producto
              </div>
              <p className="text-xs text-[#9bb5c2]">
                Porcentaje de clics e interacción en base a las preferencias de los usuarios.
              </p>

              <div className="space-y-3 pt-2">
                {categories.map((c) => {
                  const label =
                    c.category === "VIDEO_GAME"
                      ? "Videojuegos"
                      : c.category === "FIGURE"
                      ? "Figuras de Escala"
                      : c.category === "COLLECTIBLE"
                      ? "TCG & Rarezas PSA"
                      : "Bundles Compuestos";
                  return (
                    <div key={c.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>{label}</span>
                        <span className="font-mono text-[#FF6B35]">
                          {c.count} clics ({c.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#05161f] overflow-hidden border border-[#004E72]/40">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF6B35] to-amber-400 rounded-full"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular Search Tags / Details that attract users */}
            <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Tag className="w-4 h-4 text-[#FF6B35]" />
                Detalles & Atributos Más Buscados
              </div>
              <p className="text-xs text-[#9bb5c2]">
                Términos clave y filtros que más activan los visitantes al navegar la tienda.
              </p>

              <div className="flex flex-wrap gap-2.5 pt-2">
                {popularTags.map((t) => (
                  <div
                    key={t.tag}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs"
                  >
                    <span className="font-bold text-white">{t.tag}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#FF6B35]/20 text-[#FF6B35] font-mono text-[10px] font-bold">
                      {t.count} interacciones
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking Table of Top Clicked Products */}
          <div className="bg-[#092634] border border-[#004E72]/50 rounded-2xl overflow-hidden shadow-sm space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#FF6B35]" />
                  Ranking de Productos con Mayor Atracción & Clics
                </h2>
                <p className="text-xs text-[#9bb5c2]">
                  Estos son los artículos que más llaman la atención y generan mayor curiosidad en el catálogo público.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#004E72]/60 text-[11px] font-bold text-[#9bb5c2] uppercase tracking-wider bg-[#05161f]">
                    <th className="py-3 px-4">Ranking</th>
                    <th className="py-3 px-4">SKU / Producto</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Precio CLP</th>
                    <th className="py-3 px-4">Total Clics</th>
                    <th className="py-3 px-4">Vistas Ficha</th>
                    <th className="py-3 px-4">Interés Visual</th>
                    <th className="py-3 px-4">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#004E72]/30 text-xs text-[#F9F9F9]">
                  {topProducts.map((p, idx) => {
                    const maxClicks = topProducts[0]?.clicks || 1;
                    const pct = Math.round((p.clicks / maxClicks) * 100);
                    return (
                      <tr key={p.sku} className="hover:bg-[#004E72]/20 transition">
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span
                            className={`w-6 h-6 rounded-lg inline-flex items-center justify-center ${
                              idx === 0
                                ? "bg-amber-400 text-slate-950 font-black"
                                : idx === 1
                                ? "bg-slate-300 text-slate-950 font-black"
                                : idx === 2
                                ? "bg-amber-700 text-white font-black"
                                : "bg-[#05161f] text-[#9bb5c2]"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{p.name}</span>
                          <span className="text-[10px] text-[#FF6B35] font-mono">{p.sku}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#05161f] border border-[#004E72]/50 text-[#9bb5c2]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          $ {p.price.toLocaleString("es-CL")} CLP
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#FF6B35]">
                          {p.clicks} clics
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#9bb5c2]">
                          {p.views} vistas
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-24 h-2 rounded-full bg-[#05161f] overflow-hidden border border-[#004E72]/40">
                            <div
                              className="h-full bg-[#FF6B35] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/product/${p.sku.toLowerCase()}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] text-[#FF6B35] hover:underline font-bold"
                          >
                            Ver en Tienda <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

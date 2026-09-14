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
  Bell,
  Mail,
  UserCheck,
  UserX,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  PackagePlus,
  PackageSearch,
  Check,
  X,
  PlusCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useAuthStore, UserAccount } from "@/lib/store/authStore";

interface ProductAlertRecord {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productPrice: number;
  productOriginalPrice?: number;
  productImageUrl?: string;
  email: string;
  userId?: string | null;
  userName?: string | null;
  isGuest: boolean;
  alertType: "STOCK_AVAILABLE" | "PRICE_DROP" | "BOTH";
  isOutOfStock: boolean;
  createdAt: string;
  active: boolean;
}

interface ProductRequestRecord {
  id: string;
  title: string;
  franchise?: string;
  category?: string;
  userEmail: string;
  userName: string;
  userId?: string | null;
  isGuest: boolean;
  imageUrl?: string;
  aiSummary?: string;
  confidenceScore?: number;
  userNotes?: string;
  status: "PENDING" | "REVIEWING" | "ADDED" | "DISMISSED";
  createdAt: string;
  active: boolean;
}

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
  const [alerts, setAlerts] = useState<ProductAlertRecord[]>([]);
  const [productRequests, setProductRequests] = useState<ProductRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"USERS" | "ATTRACTION" | "ALERTS" | "REQUESTS">("USERS");
  const [alertFilter, setAlertFilter] = useState<"ALL" | "GUEST" | "REGISTERED" | "OUT_OF_STOCK" | "PRICE_DROP">("ALL");
  const [alertSearchQuery, setAlertSearchQuery] = useState("");
  const [deletingAlertId, setDeletingAlertId] = useState<string | null>(null);

  // Requests Tab Filter & State
  const [requestFilter, setRequestFilter] = useState<"ALL" | "PENDING" | "REVIEWING" | "ADDED">("ALL");
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);

  // Floating Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"SUCCESS" | "INFO">("SUCCESS");

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

      // 4. Fetch Stock & Email Alerts
      const alertsRes = await fetch("/api/admin/alerts");
      const alertsJson = await alertsRes.json();
      if (alertsJson.success && Array.isArray(alertsJson.data?.alerts)) {
        setAlerts(alertsJson.data.alerts);
      }

      // 5. Fetch Visual Search Product Requests
      const requestsRes = await fetch("/api/admin/product-requests");
      const requestsJson = await requestsRes.json();
      if (requestsJson.success && Array.isArray(requestsJson.data?.requests)) {
        setProductRequests(requestsJson.data.requests);
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

  // Alert counts
  const guestCount = useMemo(() => alerts.filter((a) => a.isGuest).length, [alerts]);
  const registeredCount = useMemo(() => alerts.filter((a) => !a.isGuest).length, [alerts]);
  const outOfStockCount = useMemo(() => alerts.filter((a) => a.isOutOfStock).length, [alerts]);
  const priceDropCount = useMemo(() => alerts.filter((a) => !a.isOutOfStock).length, [alerts]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (alertFilter === "GUEST" && !a.isGuest) return false;
      if (alertFilter === "REGISTERED" && a.isGuest) return false;
      if (alertFilter === "OUT_OF_STOCK" && !a.isOutOfStock) return false;
      if (alertFilter === "PRICE_DROP" && a.isOutOfStock) return false;

      if (alertSearchQuery.trim()) {
        const q = alertSearchQuery.toLowerCase().trim();
        const matchEmail = a.email?.toLowerCase().includes(q);
        const matchName = a.userName?.toLowerCase().includes(q);
        const matchProduct = a.productName?.toLowerCase().includes(q);
        const matchSku = a.productSku?.toLowerCase().includes(q);
        return matchEmail || matchName || matchProduct || matchSku;
      }
      return true;
    });
  }, [alerts, alertFilter, alertSearchQuery]);

  // Delete alert handler with floating toast notification
  const handleDeleteAlert = async (id: string) => {
    if (!confirm("¿Estás seguro de cancelar y eliminar esta suscripción de alerta de correo?")) return;
    setDeletingAlertId(id);
    try {
      const res = await fetch(`/api/admin/alerts?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) => prev.filter((item) => item.id !== id));
        setToastMessage("El registro de notificación de stock & ofertas se borró con éxito de la base de datos.");
        setToastType("SUCCESS");
        setTimeout(() => setToastMessage(null), 4500);
      } else {
        alert(data.error || "No se pudo eliminar la alerta");
      }
    } catch (err) {
      console.error("Error al eliminar alerta:", err);
    } finally {
      setDeletingAlertId(null);
    }
  };

  // Product Requests Handlers
  const handleUpdateStatus = async (id: string, newStatus: ProductRequestRecord["status"]) => {
    setUpdatingRequestId(id);
    try {
      const res = await fetch("/api/admin/product-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setProductRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
        setToastMessage(`Estado de solicitud actualizado a: ${newStatus}`);
        setToastType("SUCCESS");
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta solicitud de producto?")) return;
    setDeletingRequestId(id);
    try {
      const res = await fetch(`/api/admin/product-requests?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProductRequests((prev) => prev.filter((r) => r.id !== id));
        setToastMessage("La solicitud de coleccionable se eliminó con éxito.");
        setToastType("SUCCESS");
        setTimeout(() => setToastMessage(null), 4500);
      } else {
        alert(data.error || "No se pudo eliminar la solicitud");
      }
    } catch (err) {
      console.error("Error al eliminar solicitud:", err);
    } finally {
      setDeletingRequestId(null);
    }
  };

  // Filtered Product Requests
  const filteredRequests = useMemo(() => {
    return productRequests.filter((r) => {
      if (requestFilter !== "ALL" && r.status !== requestFilter) return false;
      if (requestSearchQuery.trim()) {
        const q = requestSearchQuery.toLowerCase().trim();
        const matchTitle = r.title?.toLowerCase().includes(q);
        const matchFranchise = r.franchise?.toLowerCase().includes(q);
        const matchEmail = r.userEmail?.toLowerCase().includes(q);
        const matchName = r.userName?.toLowerCase().includes(q);
        const matchNotes = r.userNotes?.toLowerCase().includes(q);
        return matchTitle || matchFranchise || matchEmail || matchName || matchNotes;
      }
      return true;
    });
  }, [productRequests, requestFilter, requestSearchQuery]);

  const pendingRequestsCount = useMemo(
    () => productRequests.filter((r) => r.status === "PENDING").length,
    [productRequests]
  );
  const reviewingRequestsCount = useMemo(
    () => productRequests.filter((r) => r.status === "REVIEWING").length,
    [productRequests]
  );
  const addedRequestsCount = useMemo(
    () => productRequests.filter((r) => r.status === "ADDED").length,
    [productRequests]
  );

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

        {/* Stock & Email Alerts Card */}
        <div
          onClick={() => setActiveTab("ALERTS")}
          className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 shadow-sm space-y-2 cursor-pointer hover:border-[#FF6B35]/70 transition group"
        >
          <div className="flex items-center justify-between text-[#9bb5c2] text-xs font-semibold">
            <span>Alertas de Stock & Correo</span>
            <Bell className="w-4 h-4 text-[#FF6B35] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-[#F9F9F9] flex items-center gap-2">
            {alerts.length}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] uppercase font-mono">
              En Vivo
            </span>
          </div>
          <p className="text-[11px] text-[#9bb5c2]">
            <span className="text-amber-400 font-bold">{guestCount} Invitados</span> •{" "}
            <span className="text-emerald-400 font-bold">{registeredCount} Cuentas</span>
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
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "USERS"
              ? "bg-[#1F3A5F] text-white shadow-sm"
              : "text-[#555555] hover:bg-[#E5E5E5]/60 hover:text-[#1A1A1A]"
          }`}
        >
          <Users className="w-4 h-4" />
          Directorio de Usuarios ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("ALERTS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "ALERTS"
              ? "bg-[#1F3A5F] text-white shadow-sm"
              : "text-[#555555] hover:bg-[#E5E5E5]/60 hover:text-[#1A1A1A]"
          }`}
        >
          <Bell className="w-4 h-4 text-[#FF6B35]" />
          Alertas de Stock & Correos Suscritos ({alerts.length})
        </button>

        <button
          onClick={() => setActiveTab("ATTRACTION")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "ATTRACTION"
              ? "bg-[#1F3A5F] text-white shadow-sm"
              : "text-[#555555] hover:bg-[#E5E5E5]/60 hover:text-[#1A1A1A]"
          }`}
        >
          <Flame className="w-4 h-4 text-[#FF6B35]" />
          Feedback de Atracción & Productos Más Clickeados
        </button>

        <button
          onClick={() => setActiveTab("REQUESTS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "REQUESTS"
              ? "bg-[#1F3A5F] text-white shadow-sm"
              : "text-[#555555] hover:bg-[#E5E5E5]/60 hover:text-[#1A1A1A]"
          }`}
        >
          <PackagePlus className="w-4 h-4 text-[#FF6B35]" />
          Peticiones de Coleccionables (IA Visual) ({productRequests.length})
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold">
              {pendingRequestsCount} nuevos
            </span>
          )}
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
                    <th className="py-3 px-4">Alertas Stock</th>
                    <th className="py-3 px-4">Compras CLP</th>
                    <th className="py-3 px-4">Pedidos</th>
                    <th className="py-3 px-4">Direcciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#004E72]/30 text-xs text-[#F9F9F9]">
                  {filteredUsers.map((u) => {
                    const cleanEmail = u.email.toLowerCase().trim();
                    const spendInfo = userSpendMap[cleanEmail] || { totalSpent: 0, orderCount: 0 };
                    const userAlertCount = alerts.filter((a) => a.email.toLowerCase().trim() === cleanEmail).length;
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
                        <td className="py-3.5 px-4">
                          {userAlertCount > 0 ? (
                            <button
                              onClick={() => {
                                setAlertSearchQuery(u.email);
                                setActiveTab("ALERTS");
                              }}
                              title="Ver alertas de stock suscritas por este usuario"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/40 hover:bg-[#FF6B35] hover:text-white transition shadow-sm"
                            >
                              <Bell className="w-3 h-3" />
                              {userAlertCount} {userAlertCount === 1 ? "alerta" : "alertas"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#9bb5c2]/50">0</span>
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

      {/* TAB 3: STOCK ALERTS & SUBSCRIBED EMAILS (GUESTS & REGISTERED) */}
      {activeTab === "ALERTS" && (
        <div className="space-y-6">
          {/* Header & Description Card */}
          <div className="bg-[#092634] border border-[#004E72]/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#FF6B35]" />
                  Registro de Notificaciones de Stock & Ofertas
                </h2>
                <p className="text-xs text-[#9bb5c2] mt-1 max-w-2xl">
                  Audita a todos los clientes que han solicitado aviso por correo. Se registran tanto <strong>usuarios invitados</strong> (que dejaron su email en la ficha) como <strong>clientes con cuenta</strong> que activaron la campana de aviso.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SMTP Gmail Activo
                </span>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#004E72]/40">
              <span className="text-[11px] font-bold text-[#9bb5c2] uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#FF6B35]" /> Filtrar:
              </span>

              <button
                onClick={() => setAlertFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  alertFilter === "ALL"
                    ? "bg-[#FF6B35] text-white shadow-sm"
                    : "bg-[#05161f] text-[#9bb5c2] hover:text-white border border-[#004E72]/50"
                }`}
              >
                Todas ({alerts.length})
              </button>

              <button
                onClick={() => setAlertFilter("GUEST")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  alertFilter === "GUEST"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "bg-[#05161f] text-[#9bb5c2] hover:text-amber-300 border border-[#004E72]/50"
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                Invitados Web ({guestCount})
              </button>

              <button
                onClick={() => setAlertFilter("REGISTERED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  alertFilter === "REGISTERED"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "bg-[#05161f] text-[#9bb5c2] hover:text-emerald-300 border border-[#004E72]/50"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Cuentas Registradas ({registeredCount})
              </button>

              <button
                onClick={() => setAlertFilter("OUT_OF_STOCK")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  alertFilter === "OUT_OF_STOCK"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-[#05161f] text-[#9bb5c2] hover:text-rose-300 border border-[#004E72]/50"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Sin Stock ({outOfStockCount})
              </button>

              <button
                onClick={() => setAlertFilter("PRICE_DROP")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  alertFilter === "PRICE_DROP"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-[#05161f] text-[#9bb5c2] hover:text-indigo-300 border border-[#004E72]/50"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                Oferta / Descuento ({priceDropCount})
              </button>
            </div>
          </div>

          {/* Search Bar & Result Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                placeholder="Buscar por correo, usuario, producto o SKU..."
                value={alertSearchQuery}
                onChange={(e) => setAlertSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-[#1A1A1A] placeholder-[#666666]/60 text-xs focus:outline-none focus:border-[#FF6B35] transition shadow-sm"
              />
            </div>
            <span className="text-xs text-[#666666]">
              Mostrando <strong>{filteredAlerts.length}</strong> de {alerts.length} alertas suscritas
            </span>
          </div>

          {/* Alerts Table */}
          <div className="bg-[#092634] border border-[#004E72]/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#004E72]/60 text-[11px] font-bold text-[#9bb5c2] uppercase tracking-wider bg-[#05161f]">
                    <th className="py-3.5 px-4">Usuario / Correo</th>
                    <th className="py-3.5 px-4">Tipo de Cuenta</th>
                    <th className="py-3.5 px-4">Producto & SKU</th>
                    <th className="py-3.5 px-4">Motivo de Notificación</th>
                    <th className="py-3.5 px-4">Fecha de Alta</th>
                    <th className="py-3.5 px-4">Canal</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#004E72]/30 text-xs text-[#F9F9F9]">
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#9bb5c2]">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Bell className="w-8 h-8 text-[#004E72]" />
                          <p className="font-semibold text-white">No se encontraron alertas</p>
                          <p className="text-[11px] text-[#9bb5c2]/70">
                            {alertSearchQuery || alertFilter !== "ALL"
                              ? "Prueba cambiando o limpiando los filtros de búsqueda."
                              : "Aún no hay clientes que hayan registrado alertas de stock o precio."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((alt) => {
                      const dateFormatted = new Date(alt.createdAt).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <tr key={alt.id} className="hover:bg-[#004E72]/20 transition">
                          {/* User & Email */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${
                                  alt.isGuest
                                    ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                                    : "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                                }`}
                              >
                                {alt.userName ? alt.userName.charAt(0).toUpperCase() : alt.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-white block">
                                  {alt.userName || (alt.isGuest ? "Invitado Web" : "Usuario Registrado")}
                                </span>
                                <span className="text-[11px] text-[#9bb5c2] font-mono flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-[#FF6B35]" />
                                  {alt.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Account Type Badge */}
                          <td className="py-3.5 px-4">
                            {alt.isGuest ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <UserX className="w-3 h-3" /> INVITADO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <UserCheck className="w-3 h-3" /> REGISTRADO
                              </span>
                            )}
                          </td>

                          {/* Product & Price */}
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-bold text-white block truncate max-w-[220px]" title={alt.productName}>
                                {alt.productName}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-[#FF6B35] font-bold">
                                  {alt.productSku || alt.productId}
                                </span>
                                <span className="text-[10px] text-[#9bb5c2] font-mono">
                                  ${alt.productPrice?.toLocaleString("es-CL")} CLP
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Notification Type */}
                          <td className="py-3.5 px-4">
                            {alt.isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3" /> Falta Stock / Reingreso
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                <Tag className="w-3 h-3" /> Oferta & Descuento
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 font-mono text-[#9bb5c2] text-[11px]">
                            {dateFormatted}
                          </td>

                          {/* Channel */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#9bb5c2]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Gmail Oficial
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/product/${(alt.productSku || alt.productId).toLowerCase()}`}
                                target="_blank"
                                title="Ver ficha de producto en tienda"
                                className="p-1.5 rounded-lg bg-[#05161f] border border-[#004E72]/50 text-[#9bb5c2] hover:text-[#FF6B35] hover:border-[#FF6B35] transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                onClick={() => handleDeleteAlert(alt.id)}
                                disabled={deletingAlertId === alt.id}
                                title="Dar de baja o eliminar esta alerta"
                                className="p-1.5 rounded-lg bg-[#05161f] border border-[#004E72]/50 text-[#9bb5c2] hover:text-rose-400 hover:border-rose-500/50 transition disabled:opacity-50"
                              >
                                <Trash2 className={`w-3.5 h-3.5 ${deletingAlertId === alt.id ? "animate-spin" : ""}`} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCT REQUESTS FROM VISUAL SEARCH (GEMINI VISION) */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                placeholder="Buscar por juego, anime, personaje o email del usuario..."
                value={requestSearchQuery}
                onChange={(e) => setRequestSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-[#1A1A1A] placeholder-[#666666]/60 text-xs focus:outline-none focus:border-[#FF6B35] transition shadow-sm"
              />
            </div>

            {/* Status Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setRequestFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  requestFilter === "ALL"
                    ? "bg-[#1F3A5F] text-white shadow-sm"
                    : "bg-white border border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F5]"
                }`}
              >
                Todas ({productRequests.length})
              </button>

              <button
                onClick={() => setRequestFilter("PENDING")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  requestFilter === "PENDING"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-white border border-[#E5E5E5] text-amber-700 hover:bg-amber-50"
                }`}
              >
                <Clock className="w-3 h-3" />
                Pendientes ({pendingRequestsCount})
              </button>

              <button
                onClick={() => setRequestFilter("REVIEWING")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  requestFilter === "REVIEWING"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-[#E5E5E5] text-blue-700 hover:bg-blue-50"
                }`}
              >
                <Search className="w-3 h-3" />
                En Análisis ({reviewingRequestsCount})
              </button>

              <button
                onClick={() => setRequestFilter("ADDED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  requestFilter === "ADDED"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white border border-[#E5E5E5] text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <Check className="w-3 h-3" />
                Agregados ({addedRequestsCount})
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#092634] border border-[#004E72]/50 rounded-2xl overflow-hidden shadow-sm space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <PackageSearch className="w-5 h-5 text-[#FF6B35]" />
                  Peticiones de Coleccionables & Deseo de Compra (IA Visual)
                </h2>
                <p className="text-xs text-[#9bb5c2]">
                  Coleccionables y videojuegos identificados por clientes mediante fotos/capturas que no estaban en catálogo.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#004E72]/60 text-[11px] font-bold text-[#9bb5c2] uppercase tracking-wider bg-[#05161f]">
                    <th className="py-3 px-4">Foto IA</th>
                    <th className="py-3 px-4">Producto Solicitado (Gemini)</th>
                    <th className="py-3 px-4">Cliente Interesado</th>
                    <th className="py-3 px-4">Deseo / Notas del Cliente</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#004E72]/40 text-xs">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No se encontraron solicitudes con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#0c3143]/60 transition group">
                        {/* Thumbnail */}
                        <td className="py-3.5 px-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-[#004E72]/60 shrink-0 flex items-center justify-center">
                            {req.imageUrl ? (
                              <img src={req.imageUrl} alt={req.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-500" />
                            )}
                          </div>
                        </td>

                        {/* Title & AI */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-extrabold text-white text-[13px] block">
                              {req.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {req.franchise && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FF6B35]/20 text-[#FF6B35] font-bold">
                                  {req.franchise}
                                </span>
                              )}
                              <span className="text-[10px] text-[#9bb5c2] font-mono">
                                Certeza: {Math.round((req.confidenceScore || 0.95) * 100)}%
                              </span>
                            </div>
                            {req.aiSummary && (
                              <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-1">
                                «{req.aiSummary}»
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-white block">
                              {req.userName || "Cliente"}
                            </span>
                            <span className="text-[11px] text-[#9bb5c2] font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#FF6B35]" />
                              {req.userEmail}
                            </span>
                            <span
                              className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                                req.isGuest
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-emerald-500/20 text-emerald-300"
                              }`}
                            >
                              {req.isGuest ? "Invitado" : "Registrado"}
                            </span>
                          </div>
                        </td>

                        {/* User Notes */}
                        <td className="py-3.5 px-4">
                          <div className="max-w-[200px] text-slate-300 text-[11px] leading-relaxed">
                            {req.userNotes || "Desea adquirir este producto si se agrega a la tienda"}
                          </div>
                        </td>

                        {/* Status Select */}
                        <td className="py-3.5 px-4">
                          <select
                            value={req.status}
                            onChange={(e) => handleUpdateStatus(req.id, e.target.value as any)}
                            disabled={updatingRequestId === req.id}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border focus:outline-none cursor-pointer ${
                              req.status === "PENDING"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : req.status === "REVIEWING"
                                ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                                : req.status === "ADDED"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-slate-700 text-slate-300 border-slate-600"
                            }`}
                          >
                            <option value="PENDING" className="bg-[#092634] text-white">Pendiente</option>
                            <option value="REVIEWING" className="bg-[#092634] text-white">En Análisis</option>
                            <option value="ADDED" className="bg-[#092634] text-white">Agregado a Catálogo</option>
                            <option value="DISMISSED" className="bg-[#092634] text-white">Descartado</option>
                          </select>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono text-[#9bb5c2] text-[11px]">
                          {new Date(req.createdAt).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/new?name=${encodeURIComponent(req.title)}&franchise=${encodeURIComponent(
                                req.franchise || ""
                              )}`}
                              title="Crear ficha de producto en catálogo"
                              className="px-2.5 py-1.5 rounded-lg bg-[#05161f] border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-white transition flex items-center gap-1 font-bold text-[11px]"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Crear Producto</span>
                            </Link>

                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              disabled={deletingRequestId === req.id}
                              title="Eliminar solicitud"
                              className="p-1.5 rounded-lg bg-[#05161f] border border-[#004E72]/50 text-[#9bb5c2] hover:text-rose-400 hover:border-rose-500/50 transition disabled:opacity-50"
                            >
                              <Trash2 className={`w-3.5 h-3.5 ${deletingRequestId === req.id ? "animate-spin" : ""}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification (Acción exitosa / Eliminación de Alertas y Solicitudes) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-[#092634] text-white shadow-2xl border border-emerald-500/60 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="text-xs">
            <p className="font-extrabold text-white text-[13px] tracking-tight">Acción Completada</p>
            <p className="text-[11px] text-emerald-200 mt-0.5">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

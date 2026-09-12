"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  Sliders,
  Boxes,
  PlusCircle,
  FileDown,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";
import { getAdminHeaders } from "@/lib/auth/security";
import { ConfirmedOrderEntity, ProductDomainEntity } from "@/lib/types/domain";
import { BASE_PRODUCTS } from "@/lib/constants/catalog";

type PeriodFilter = "ALL" | "MONTH" | "WEEK" | "TODAY";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<ConfirmedOrderEntity[]>([]);
  const [products, setProducts] = useState<ProductDomainEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch orders
      const ordersRes = await fetch("/api/orders", {
        headers: { ...getAdminHeaders() },
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success && Array.isArray(ordersData.data?.orders)) {
        setOrders(ordersData.data.orders);
      }

      // 2. Fetch products
      const productsRes = await fetch("/api/products");
      const productsData = await productsRes.json();
      if (productsData.success && Array.isArray(productsData.data?.products)) {
        setProducts(productsData.data.products);
      } else {
        setProducts(BASE_PRODUCTS as any);
      }
    } catch (err) {
      console.error("Error cargando métricas:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter orders by period
  const filteredOrders = useMemo(() => {
    if (selectedPeriod === "ALL") return orders;

    const now = new Date();
    return orders.filter((ord) => {
      const ordDate = new Date(ord.createdAt || 0);
      if (selectedPeriod === "TODAY") {
        return ordDate.toDateString() === now.toDateString();
      }
      if (selectedPeriod === "WEEK") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return ordDate >= weekAgo;
      }
      if (selectedPeriod === "MONTH") {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return ordDate >= monthAgo;
      }
      return true;
    });
  }, [orders, selectedPeriod]);

  // Financial Metrics
  const totalRevenueCharged = useMemo(() => {
    return filteredOrders
      .filter((o) => (o.status || "").toUpperCase() !== "CANCELLED")
      .reduce((sum, o) => sum + (o.totalChargedNow || 0), 0);
  }, [filteredOrders]);

  const pendingPreOrderBalances = useMemo(() => {
    return filteredOrders
      .filter((o) => (o.status || "").toUpperCase() !== "CANCELLED" && !o.balancePaid)
      .reduce((sum, o) => sum + (o.remainingBalanceLater || 0), 0);
  }, [filteredOrders]);

  const settledPreOrderBalances = useMemo(() => {
    return filteredOrders
      .filter((o) => (o.status || "").toUpperCase() !== "CANCELLED" && o.balancePaid)
      .reduce((sum, o) => {
        // Find sum of balances that were settled
        const preOrderItems = (o.items || []).filter((it) => it.isPreOrder && it.isPartialDeposit);
        const settledSum = preOrderItems.reduce(
          (sub, it) => sub + (it.remainingBalancePerUnit || 0) * it.quantity,
          0
        );
        return sum + settledSum;
      }, 0);
  }, [filteredOrders]);

  const averageTicket = useMemo(() => {
    const validOrders = filteredOrders.filter((o) => (o.status || "").toUpperCase() !== "CANCELLED");
    if (validOrders.length === 0) return 0;
    return totalRevenueCharged / validOrders.length;
  }, [filteredOrders, totalRevenueCharged]);

  // Pipeline Status Counts
  const orderCounts = useMemo(() => {
    const counts = {
      TOTAL: filteredOrders.length,
      CONFIRMED: 0,
      PREPARING: 0,
      DISPATCHED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    filteredOrders.forEach((o) => {
      const st = (o.status || "CONFIRMED").toUpperCase();
      if (st === "CONFIRMED" || st === "PAID") counts.CONFIRMED++;
      else if (st === "PREPARING") counts.PREPARING++;
      else if (st === "DISPATCHED") counts.DISPATCHED++;
      else if (st === "DELIVERED") counts.DELIVERED++;
      else if (st === "CANCELLED") counts.CANCELLED++;
    });

    return counts;
  }, [filteredOrders]);

  // Pre-Orders Analysis
  const preOrderStats = useMemo(() => {
    const ordersWithPreOrder = filteredOrders.filter(
      (o) => (o.items || []).some((it) => it.isPreOrder) && (o.status || "").toUpperCase() !== "CANCELLED"
    );

    const readyInWarehouse = ordersWithPreOrder.filter(
      (o) => o.preOrderWarehouseArrivalNotified && !o.balancePaid
    ).length;

    const inTransit = ordersWithPreOrder.filter(
      (o) => !o.preOrderWarehouseArrivalNotified && !o.balancePaid
    ).length;

    const fullySettled = ordersWithPreOrder.filter((o) => o.balancePaid).length;

    return {
      total: ordersWithPreOrder.length,
      readyInWarehouse,
      inTransit,
      fullySettled,
    };
  }, [filteredOrders]);

  // Critical Inventory (< 3 units available)
  const lowStockProducts = useMemo(() => {
    return products
      .filter((p) => p.stockAvailable !== undefined && p.stockAvailable <= 3)
      .sort((a, b) => a.stockAvailable - b.stockAvailable);
  }, [products]);

  // Export orders to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert("No hay pedidos registrados para exportar.");
      return;
    }

    const headers = [
      "Numero_Pedido",
      "Fecha",
      "Cliente_Nombre",
      "Email",
      "Telefono",
      "RUT",
      "Region",
      "Comuna",
      "Direccion",
      "Metodo_Despacho",
      "Numero_Tracking",
      "Total_Cobrado_CLP",
      "Saldo_Pendiente_CLP",
      "Saldo_Liquidado",
      "Estado",
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber || o.id}"`,
      `"${new Date(o.createdAt).toLocaleDateString("es-CL")}"`,
      `"${o.customer?.fullName || ""}"`,
      `"${o.customer?.email || ""}"`,
      `"${o.customer?.phone || ""}"`,
      `"${o.customer?.rut || ""}"`,
      `"${o.customer?.region || ""}"`,
      `"${o.customer?.comuna || ""}"`,
      `"${o.customer?.address || ""}"`,
      `"${o.shippingMethod?.name || "Starken"}"`,
      `"${o.shippingMethod?.trackingNumber || ""}"`,
      o.totalChargedNow,
      o.remainingBalanceLater || 0,
      o.balancePaid ? "SI" : "NO",
      `"${o.status}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `omnicollector_pedidos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-[#1F3A5F] text-white font-mono text-[10px] uppercase font-bold tracking-wider">
              Control Ejecutivo
            </span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Tiempo Real • CLP
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
            Métricas de Negocio & KPI
          </h1>
          <p className="text-xs text-[#666666]">
            Monitoreo en vivo de ventas, saldos de pre-ventas, cola de despacho e inventario crítico de OmniCollector SpA.
          </p>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-1 flex items-center gap-1 text-xs">
            {[
              { id: "TODAY", label: "Hoy" },
              { id: "WEEK", label: "7 Días" },
              { id: "MONTH", label: "Este Mes" },
              { id: "ALL", label: "Histórico" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as PeriodFilter)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  selectedPeriod === p.id
                    ? "bg-[#FF6B35] text-white shadow-sm"
                    : "text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F7F7F5]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#F7F7F5] text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Actualizar datos en tiempo real"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FF6B35] ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="Exportar archivo CSV compatible con Starken/Chilexpress"
          >
            <FileDown className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue Charged */}
        <div className="p-5 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
              Ventas Recaudadas (CLP)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-[#1A1A1A]">
            {formatCLP(totalRevenueCharged)}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>Acreditado vía Webpay / Mercado Pago</span>
          </div>
        </div>

        {/* Card 2: Pending Pre-Order Balance Liabilities */}
        <div className="p-5 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
              Saldos Pre-Venta por Cobrar
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-[#FF6B35]">
            {formatCLP(pendingPreOrderBalances)}
          </div>
          <div className="text-[11px] text-[#666666] flex items-center justify-between">
            <span>Liquidado: {formatCLP(settledPreOrderBalances)}</span>
            <span className="font-bold text-[#FF6B35] font-mono">
              {preOrderStats.readyInWarehouse} en bodega
            </span>
          </div>
        </div>

        {/* Card 3: Orders Pending Dispatch */}
        <div className="p-5 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
              Pendientes de Despacho
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1F3A5F] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-[#1F3A5F]">
            {orderCounts.CONFIRMED + orderCounts.PREPARING}
          </div>
          <div className="text-[11px] text-[#666666] flex items-center justify-between">
            <span>Listos para empaque</span>
            <Link
              href="/admin/orders"
              className="text-[#009EE3] hover:underline font-bold flex items-center gap-0.5"
            >
              <span>Ver órdenes</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Critical Stock Alert */}
        <div className="p-5 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
              Inventario Crítico (≤ 3 u.)
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-[#D64545] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-[#D64545]">
            {lowStockProducts.length}
          </div>
          <div className="text-[11px] text-[#666666] flex items-center justify-between">
            <span>SKUs por agotarse</span>
            <Link
              href="/admin/products"
              className="text-[#D64545] hover:underline font-bold flex items-center gap-0.5"
            >
              <span>Reponer stock</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Order Pipeline Breakdown & Pre-Orders Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Order Pipeline Progress */}
        <div className="lg:col-span-2 bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
            <div>
              <h3 className="text-base font-black text-[#1A1A1A] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#FF6B35]" />
                Flujo Operativo de Pedidos
              </h3>
              <p className="text-xs text-[#666666]">
                Distribución de {orderCounts.TOTAL} pedidos registrados en el período seleccionado.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#666666] block uppercase tracking-wider">Ticket Promedio</span>
              <span className="font-mono font-bold text-sm text-[#1F3A5F]">
                {formatCLP(averageTicket)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Row 1: Confirmados / Pagados */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#1A1A1A] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />
                  Confirmados / Pagados (Por Empacar)
                </span>
                <span className="font-mono text-[#1F3A5F]">
                  {orderCounts.CONFIRMED} pedidos (
                  {orderCounts.TOTAL > 0
                    ? Math.round((orderCounts.CONFIRMED / orderCounts.TOTAL) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F7F7F5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FF6B35] transition-all duration-500"
                  style={{
                    width: `${orderCounts.TOTAL > 0 ? (orderCounts.CONFIRMED / orderCounts.TOTAL) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Row 2: En Preparación */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#1A1A1A] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  En Preparación de Bodega
                </span>
                <span className="font-mono text-[#1F3A5F]">
                  {orderCounts.PREPARING} pedidos (
                  {orderCounts.TOTAL > 0
                    ? Math.round((orderCounts.PREPARING / orderCounts.TOTAL) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F7F7F5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{
                    width: `${orderCounts.TOTAL > 0 ? (orderCounts.PREPARING / orderCounts.TOTAL) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Row 3: Despachados con Courier */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#1A1A1A] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#009EE3]" />
                  Despachados (En Ruta Starken / Chilexpress)
                </span>
                <span className="font-mono text-[#1F3A5F]">
                  {orderCounts.DISPATCHED} pedidos (
                  {orderCounts.TOTAL > 0
                    ? Math.round((orderCounts.DISPATCHED / orderCounts.TOTAL) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F7F7F5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#009EE3] transition-all duration-500"
                  style={{
                    width: `${orderCounts.TOTAL > 0 ? (orderCounts.DISPATCHED / orderCounts.TOTAL) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Row 4: Entregados con Éxito */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#1A1A1A] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Entregados con Éxito
                </span>
                <span className="font-mono text-[#1F3A5F]">
                  {orderCounts.DELIVERED} pedidos (
                  {orderCounts.TOTAL > 0
                    ? Math.round((orderCounts.DELIVERED / orderCounts.TOTAL) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F7F7F5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${orderCounts.TOTAL > 0 ? (orderCounts.DELIVERED / orderCounts.TOTAL) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Row 5: Cancelados */}
            {orderCounts.CANCELLED > 0 && (
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#D64545] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D64545]" />
                    Cancelados / Reembolsados
                  </span>
                  <span className="font-mono text-[#D64545]">
                    {orderCounts.CANCELLED} pedidos (
                    {orderCounts.TOTAL > 0
                      ? Math.round((orderCounts.CANCELLED / orderCounts.TOTAL) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#F7F7F5] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#D64545] transition-all duration-500"
                    style={{
                      width: `${(orderCounts.CANCELLED / orderCounts.TOTAL) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end">
            <Link
              href="/admin/orders"
              className="px-4 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Abrir Panel de Pedidos Completo</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#FF6B35]" />
            </Link>
          </div>
        </div>

        {/* Right Column (1/3): Pre-Order Engine Status & Quick Actions */}
        <div className="space-y-6">
          {/* Pre-Order Status Card */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="border-b border-[#E5E5E5] pb-3">
              <span className="px-2 py-0.5 rounded-full bg-[#FF6B35] text-white text-[10px] font-black uppercase tracking-wider">
                Motor de Pre-Ventas
              </span>
              <h3 className="text-sm font-black text-[#1A1A1A] mt-1">
                Estado de Pre-Órdenes ({preOrderStats.total})
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <strong className="text-blue-900 block font-bold">En Bodega (Cobro Activo)</strong>
                  <span className="text-[11px] text-blue-700">Listas para liquidación 80%</span>
                </div>
                <span className="font-mono font-black text-base text-blue-900">
                  {preOrderStats.readyInWarehouse}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <strong className="text-amber-900 block font-bold">En Tránsito Internacional</strong>
                  <span className="text-[11px] text-amber-700">Aduana / En camino a Chile</span>
                </div>
                <span className="font-mono font-black text-base text-amber-900">
                  {preOrderStats.inTransit}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <strong className="text-emerald-900 block font-bold">Saldo 100% Liquidado</strong>
                  <span className="text-[11px] text-emerald-700">Totalmente pagadas</span>
                </div>
                <span className="font-mono font-black text-base text-emerald-900">
                  {preOrderStats.fullySettled}
                </span>
              </div>
            </div>

            <Link
              href="/admin/orders"
              className="w-full py-2.5 rounded-xl bg-[#F7F7F5] hover:bg-[#E5E5E5] text-[#1F3A5F] text-xs font-bold transition flex items-center justify-center gap-1.5 border border-[#E5E5E5]"
            >
              <span>Gestionar Arribos en Pedidos</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#FF6B35]" />
            </Link>
          </div>

          {/* Quick Admin Actions Box */}
          <div className="bg-[#1F3A5F] text-white rounded-3xl p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#FF6B35] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Accesos Rápidos
            </h4>
            <div className="space-y-2 text-xs">
              <Link
                href="/admin/products/new"
                className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-between font-semibold"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-[#FF6B35]" />
                  <span>Publicar Nuevo Producto</span>
                </div>
                <ArrowUpRight className="w-3 h-3 text-white/60" />
              </Link>

              <Link
                href="/admin/products"
                className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-between font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#FF6B35]" />
                  <span>Ajustar Stock de Inventario</span>
                </div>
                <ArrowUpRight className="w-3 h-3 text-white/60" />
              </Link>

              <Link
                href="/catalog"
                className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-between font-semibold"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#FF6B35]" />
                  <span>Ver Tienda de Clientes</span>
                </div>
                <ArrowUpRight className="w-3 h-3 text-white/60" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-[#D64545] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1A1A1A]">
                Alertas de Inventario Crítico ({lowStockProducts.length} artículos)
              </h3>
              <p className="text-xs text-[#666666]">
                Productos con 3 o menos unidades disponibles en bodega física que requieren reposición urgente.
              </p>
            </div>
          </div>

          <Link
            href="/admin/products"
            className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] hover:bg-[#E5E5E5] text-[#1F3A5F] text-xs font-bold transition flex items-center gap-1.5 border border-[#E5E5E5]"
          >
            <span>Ver Todo el Catálogo</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#FF6B35]" />
          </Link>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#666666] bg-[#F7F7F5] rounded-2xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-[#1A1A1A]">¡Todos los niveles de inventario están saludables!</p>
            <p>No hay productos con stock menor o igual a 3 unidades.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] text-[#666666] uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Producto</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Precio CLP</th>
                  <th className="py-3 px-4 text-center">Stock Disponible</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {lowStockProducts.slice(0, 6).map((prod) => (
                  <tr key={prod.id} className="hover:bg-red-50/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#E5E5E5]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#666666]">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#1A1A1A]">{prod.name}</div>
                          <div className="text-[10px] text-[#666666] line-clamp-1">
                            {prod.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#666666]">
                      {prod.sku}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-[#1F3A5F]/10 text-[#1F3A5F] font-bold text-[10px]">
                        {prod.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1A1A1A]">
                      {formatCLP(prod.price)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-mono font-black px-2.5 py-1 rounded-full text-xs ${
                          prod.stockAvailable === 0
                            ? "bg-red-100 text-[#D64545]"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {prod.stockAvailable === 0 ? "AGOTADO (0)" : `${prod.stockAvailable} un.`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/products`}
                        className="px-3 py-1.5 rounded-lg bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold text-xs transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <span>Ajustar Stock</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Eye,
  Trash2,
  Edit3,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Layers,
  Sparkles,
  ArrowUpDown,
  User,
  Send,
  X,
  ShieldAlert,
} from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";
import { getAdminHeaders } from "@/lib/auth/security";
import { ConfirmedOrderEntity } from "@/lib/types/domain";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<ConfirmedOrderEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("ALL");

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<ConfirmedOrderEntity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ConfirmedOrderEntity | null>(null);

  // Tracking edit form
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editCourier, setEditCourier] = useState("Starken");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        headers: { ...getAdminHeaders() },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.orders)) {
        setOrders(data.data.orders);
      }
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId || ord.orderNumber === orderId ? data.data : ord))
        );
        if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderNumber === orderId)) {
          setSelectedOrder(data.data);
        }
        showToast(`Estado del pedido actualizado a "${getStatusLabel(newStatus)}"`);
      }
    } catch (err) {
      console.error("Error actualizando estado:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/orders/${selectedOrder.id || selectedOrder.orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify({
          trackingNumber: editTrackingNumber,
          shippingCourier: editCourier,
          adminNotes: editAdminNotes,
          // If tracking is provided, advance to DISPATCHED automatically if it was preparing
          status: selectedOrder.status === "PREPARING" || selectedOrder.status === "CONFIRMED" ? "DISPATCHED" : selectedOrder.status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === selectedOrder.id ? data.data : ord))
        );
        setSelectedOrder(data.data);
        setIsTrackingModalOpen(false);
        showToast("Número de seguimiento y notas guardadas correctamente.");
      }
    } catch (err) {
      console.error("Error guardando tracking:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/orders/${orderToDelete.id || orderToDelete.orderNumber}`, {
        method: "DELETE",
        headers: { ...getAdminHeaders() },
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.filter((ord) => ord.id !== orderToDelete.id && ord.orderNumber !== orderToDelete.orderNumber)
        );
        setIsDeleteModalOpen(false);
        setOrderToDelete(null);
        if (selectedOrder?.id === orderToDelete.id) {
          setIsDetailModalOpen(false);
        }
        showToast("Pedido cancelado y eliminado del sistema.");
      }
    } catch (err) {
      console.error("Error eliminando pedido:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWarehouseArrival = async (order: ConfirmedOrderEntity) => {
    try {
      setIsSaving(true);
      const newValue = !order.preOrderWarehouseArrivalNotified;
      const res = await fetch(`/api/orders/${order.id || order.orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify({ preOrderWarehouseArrivalNotified: newValue }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === order.id ? data.data : ord))
        );
        if (selectedOrder?.id === order.id) {
          setSelectedOrder(data.data);
        }
        showToast(
          newValue
            ? "¡Arribo a bodega registrado! Cobro del 80% restante habilitado para el cliente."
            : "Notificación de arribo a bodega desactivada."
        );
      }
    } catch (err) {
      console.error("Error al actualizar estado de arribo:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // 1. Status filter
      if (selectedStatus !== "ALL") {
        const ordStatus = (ord.status || "CONFIRMED").toUpperCase();
        if (ordStatus !== selectedStatus) return false;
      }

      // 2. Payment method filter
      if (selectedPaymentMethod !== "ALL") {
        const method = (ord.paymentMethod || "").toUpperCase();
        if (!method.includes(selectedPaymentMethod)) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (ord.orderNumber || "").toLowerCase();
        const id = (ord.id || "").toLowerCase();
        const name = (ord.customer?.fullName || "").toLowerCase();
        const email = (ord.customer?.email || "").toLowerCase();
        const rut = (ord.customer?.rut || "").toLowerCase();
        const tracking = (ord.shippingMethod?.trackingNumber || "").toLowerCase();

        return (
          num.includes(q) ||
          id.includes(q) ||
          name.includes(q) ||
          email.includes(q) ||
          rut.includes(q) ||
          tracking.includes(q)
        );
      }

      return true;
    });
  }, [orders, selectedStatus, selectedPaymentMethod, searchQuery]);

  // Statistics calculation
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalCharged = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((acc, o) => acc + (o.totalChargedNow || 0), 0);
    const totalDeferred = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((acc, o) => acc + (o.remainingBalanceLater || 0), 0);
    const pendingShipment = orders.filter(
      (o) => o.status === "CONFIRMED" || o.status === "PREPARING" || o.status === "PAID"
    ).length;
    const dispatched = orders.filter((o) => o.status === "DISPATCHED").length;

    return { totalOrders, totalCharged, totalDeferred, pendingShipment, dispatched };
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#2E9E5B]/10 text-[#2E9E5B] border border-[#2E9E5B]/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> 1. Confirmado
          </span>
        );
      case "PREPARING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#1F3A5F]/10 text-[#1F3A5F] border border-[#1F3A5F]/30">
            <Package className="w-3.5 h-3.5 text-[#FF6B35]" /> 2. En Bodega (Distribuidor)
          </span>
        );
      case "DISPATCHED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#009EE3]/10 text-[#009EE3] border border-[#009EE3]/30">
            <Truck className="w-3.5 h-3.5" /> 3. En Camino (Courier)
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> 4. Entregado
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/30">
            <XCircle className="w-3.5 h-3.5" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5" /> {status || "Pendiente"}
          </span>
        );
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "PAID":
        return "1. Confirmado (Pago Procesado)";
      case "PREPARING":
        return "2. En Bodega (Recibido por Distribuidor)";
      case "DISPATCHED":
        return "3. En Camino (Courier en Tránsito)";
      case "DELIVERED":
        return "4. Entregado en Destino";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F3A5F] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#FF6B35]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />
          <span className="text-xs font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
            <ShoppingBag className="w-4 h-4" />
            <span>Módulo de Pedidos & Ventas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight mt-1">
            Gestión Centralizada de Órdenes
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Monitorea pagos de Mercado Pago, asigna números de seguimiento Starken/Chilexpress y gestiona estados de despacho.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs font-bold text-[#1A1A1A] hover:bg-[#F7F7F5] transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1F3A5F] ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#666666]">Total de Pedidos</span>
            <div className="w-8 h-8 rounded-lg bg-[#1F3A5F]/10 text-[#1F3A5F] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">{metrics.totalOrders}</div>
          <div className="text-[11px] text-[#666666]">Registrados en Cloud Firestore</div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#666666]">Recaudado al Contado</span>
            <div className="w-8 h-8 rounded-lg bg-[#2E9E5B]/10 text-[#2E9E5B] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2E9E5B]">{formatCLP(metrics.totalCharged)}</div>
          <div className="text-[11px] text-[#666666]">Pagos cobrados con éxito (CLP)</div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#666666]">Saldo Preventas Diferido</span>
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#FF6B35]">{formatCLP(metrics.totalDeferred)}</div>
          <div className="text-[11px] text-[#666666]">Por cobrar al arribo de figuras</div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#666666]">Pendientes de Despacho</span>
            <div className="w-8 h-8 rounded-lg bg-[#009EE3]/10 text-[#009EE3] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#009EE3]">{metrics.pendingShipment}</div>
          <div className="text-[11px] text-[#666666]">Requieren empaque o tracking</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por N° Pedido, cliente, email, RUT o código de seguimiento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#666666] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="CONFIRMED">Pagado / Confirmado</option>
              <option value="PREPARING">En Preparación</option>
              <option value="DISPATCHED">Despachado</option>
              <option value="DELIVERED">Entregado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35] focus:bg-white"
            >
              <option value="ALL">Cualquier Método de Pago</option>
              <option value="MERCADO_PAGO">Mercado Pago / Tarjeta</option>
              <option value="WEBPAY">Webpay Plus</option>
              <option value="BANK_TRANSFER">Transferencia Bancaria</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#1F3A5F]/20 border-t-[#FF6B35] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#666666]">Consultando pedidos en tiempo real...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#666666] mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">No se encontraron pedidos</h3>
              <p className="text-xs text-[#666666] mt-1 max-w-sm mx-auto">
                {searchQuery || selectedStatus !== "ALL"
                  ? "No hay pedidos que coincidan con los filtros seleccionados."
                  : "Aún no hay compras registradas en la tienda."}
              </p>
            </div>
            {(searchQuery || selectedStatus !== "ALL" || selectedPaymentMethod !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("ALL");
                  setSelectedPaymentMethod("ALL");
                }}
                className="px-4 py-2 rounded-xl bg-[#1F3A5F] text-white text-xs font-bold hover:bg-[#152842] transition shadow-sm"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-[#E5E5E5] text-[11px] font-bold text-[#666666] uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">N° Pedido & Fecha</th>
                  <th className="py-3.5 px-4">Cliente & Contacto</th>
                  <th className="py-3.5 px-4">Artículos</th>
                  <th className="py-3.5 px-4">Total Cobrado</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Seguimiento / Courier</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-xs">
                {filteredOrders.map((order) => {
                  const isPreOrder = order.items.some((i) => i.isPreOrder);
                  const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
                  const docId = order.id || order.orderNumber;

                  return (
                    <tr key={docId} className="hover:bg-[#F7F7F5]/60 transition-colors">
                      {/* Order number & Date */}
                      <td className="py-4 px-4 sm:px-6 space-y-1">
                        <div className="font-mono font-black text-sm text-[#1F3A5F]">
                          {order.orderNumber || order.id.slice(0, 12)}
                        </div>
                        <div className="text-[11px] text-[#666666] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {isPreOrder && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FF6B35]/10 text-[#FF6B35] px-2 py-0.5 rounded-md border border-[#FF6B35]/20">
                            <Clock className="w-3 h-3" /> Contiene Preventa
                          </span>
                        )}
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#666666]" />
                          <span>{order.customer?.fullName || "Cliente"}</span>
                        </div>
                        <div className="text-[11px] text-[#666666] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#666666]" />
                          <span className="truncate max-w-[160px]">{order.customer?.email}</span>
                        </div>
                        {order.customer?.phone && (
                          <div className="text-[11px] text-[#2E9E5B] flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <a
                              href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline font-semibold"
                            >
                              {order.customer.phone}
                            </a>
                          </div>
                        )}
                        {order.customer?.comuna && (
                          <div className="text-[11px] text-[#666666] flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{order.customer.comuna}, {order.customer.region}</span>
                          </div>
                        )}
                      </td>

                      {/* Items Preview */}
                      <td className="py-4 px-4 space-y-1.5">
                        <div className="text-[11px] font-semibold text-[#1A1A1A]">
                          {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
                        </div>
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-[11px] text-[#666666] truncate max-w-[200px]">
                              • <strong className="text-[#1A1A1A]">{item.quantity}x</strong> {item.name}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <span className="text-[10px] text-[#FF6B35] font-semibold block">
                              +{order.items.length - 2} productos más...
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total & Payment */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="font-mono font-black text-sm text-[#1A1A1A]">
                          {formatCLP(order.totalChargedNow)}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-[#666666]">
                          {order.paymentMethod === "MERCADO_PAGO"
                            ? "Mercado Pago"
                            : order.paymentMethod === "WEBPAY"
                            ? "Webpay Plus"
                            : "Transferencia"}
                        </div>
                        {order.remainingBalanceLater > 0 && !order.balancePaid && (
                          <div className="text-[10px] space-y-0.5">
                            <span className="text-amber-700 font-bold block">
                              Saldo: {formatCLP(order.remainingBalanceLater)}
                            </span>
                            {order.preOrderWarehouseArrivalNotified ? (
                              <span className="inline-block px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">
                                Bodega (Cobro Activo)
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[9px]">
                                Pre-Venta en espera
                              </span>
                            )}
                          </div>
                        )}
                        {order.balancePaid && (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px]">
                            ✓ Saldo 100% Pagado
                          </span>
                        )}
                      </td>

                      {/* Status & Fast Toggle */}
                      <td className="py-4 px-4 space-y-2">
                        <div>{getStatusBadge(order.status)}</div>
                        <select
                          value={order.status || "CONFIRMED"}
                          onChange={(e) => handleUpdateStatus(docId, e.target.value)}
                          disabled={isSaving}
                          className="text-[11px] py-1 px-2 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] text-[#1A1A1A] font-semibold cursor-pointer focus:outline-none focus:border-[#FF6B35]"
                        >
                          <option value="CONFIRMED">1. Confirmado (Pago Procesado)</option>
                          <option value="PREPARING">2. En Bodega (Recibido por Distribuidor)</option>
                          <option value="DISPATCHED">3. En Camino (Courier en Tránsito)</option>
                          <option value="DELIVERED">4. Entregado en Destino</option>
                          <option value="CANCELLED">Cancelado / Reembolsado</option>
                        </select>
                      </td>

                      {/* Courier & Tracking */}
                      <td className="py-4 px-4 space-y-1.5">
                        <div className="text-[11px] font-semibold text-[#1A1A1A]">
                          {order.shippingMethod?.name || "Despacho Express"}
                        </div>
                        {order.shippingMethod?.trackingNumber ? (
                          <div className="inline-flex items-center gap-1 font-mono text-[11px] text-[#009EE3] bg-[#009EE3]/10 px-2 py-0.5 rounded border border-[#009EE3]/20">
                            <span>#{order.shippingMethod.trackingNumber}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#666666] italic block">
                            Sin tracking asignado
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setEditTrackingNumber(order.shippingMethod?.trackingNumber || "");
                            setEditCourier(order.shippingMethod?.name?.includes("Chilexpress") ? "Chilexpress" : "Starken");
                            setEditAdminNotes(order.adminNotes || "");
                            setIsTrackingModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-[#1F3A5F] hover:text-[#FF6B35] flex items-center gap-1 transition"
                        >
                          <Edit3 className="w-3 h-3" /> Asignar Tracking
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailModalOpen(true);
                            }}
                            title="Ver detalle completo de la orden"
                            className="p-2 rounded-xl bg-[#F7F7F5] hover:bg-[#1F3A5F] text-[#1A1A1A] hover:text-white border border-[#E5E5E5] transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setOrderToDelete(order);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Cancelar / Eliminar pedido"
                            className="p-2 rounded-xl bg-red-50 hover:bg-[#D64545] text-[#D64545] hover:text-white border border-red-200 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ORDER FULL DETAILS */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B35]">
                  Ficha Detallada de Orden
                </span>
                <h2 className="text-xl font-black text-[#1A1A1A] font-mono">
                  {selectedOrder.orderNumber || selectedOrder.id}
                </h2>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-xl bg-[#F7F7F5] hover:bg-[#E5E5E5] text-[#1A1A1A] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#666666]">Estado Actual:</span>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#666666]">Cambiar a:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id || selectedOrder.orderNumber, e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-xl bg-white border border-[#E5E5E5] text-[#1A1A1A] font-bold"
                >
                  <option value="CONFIRMED">Confirmado / Pagado</option>
                  <option value="PREPARING">En Preparación</option>
                  <option value="DISPATCHED">Despachado</option>
                  <option value="DELIVERED">Entregado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Customer & Shipping Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
                <h4 className="font-bold text-[#1F3A5F] flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#FF6B35]" /> Datos del Cliente
                </h4>
                <p><strong>Nombre:</strong> {selectedOrder.customer?.fullName}</p>
                <p><strong>Email:</strong> {selectedOrder.customer?.email}</p>
                <p><strong>RUT:</strong> {selectedOrder.customer?.rut || "Sin RUT"}</p>
                <p><strong>Teléfono:</strong> {selectedOrder.customer?.phone}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
                <h4 className="font-bold text-[#1F3A5F] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#FF6B35]" /> Despacho a Domicilio
                </h4>
                <p><strong>Dirección:</strong> {selectedOrder.customer?.address}</p>
                {selectedOrder.customer?.apartment && (
                  <p><strong>Dpto/Casa:</strong> {selectedOrder.customer.apartment}</p>
                )}
                <p><strong>Comuna/Ciudad:</strong> {selectedOrder.customer?.comuna}</p>
                <p><strong>Región:</strong> {selectedOrder.customer?.region}</p>
                <p><strong>Courier:</strong> {selectedOrder.shippingMethod?.name}</p>
                {selectedOrder.shippingMethod?.trackingNumber && (
                  <p><strong>N° Tracking:</strong> <span className="font-mono text-[#009EE3] font-bold">#{selectedOrder.shippingMethod.trackingNumber}</span></p>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <h4 className="font-bold text-[#1A1A1A] text-xs uppercase tracking-wider">
                Productos Comprados ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded-2xl overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4 bg-white text-xs">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-[#E5E5E5]" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#666666]">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-[#1A1A1A]">{item.name}</div>
                        <div className="text-[11px] text-[#666666] font-mono">SKU: {item.sku}</div>
                        {item.isPreOrder && (
                          <span className="text-[10px] text-[#FF6B35] font-semibold">
                            Preventa (Pie {item.isPartialDeposit ? "Parcial" : "Total"})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#1A1A1A]">
                        {item.quantity} x {formatCLP(item.isPartialDeposit ? item.unitDeposit : item.unitPrice)}
                      </div>
                      <div className="text-[11px] text-[#666666]">
                        Total: {formatCLP((item.isPartialDeposit ? item.unitDeposit : item.unitPrice) * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs space-y-2">
              <div className="flex justify-between text-[#666666]">
                <span>Subtotal</span>
                <span className="font-mono">{formatCLP(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-[#2E9E5B]">
                  <span>Descuento cupón ({selectedOrder.couponCode || "PROMO"})</span>
                  <span className="font-mono">-{formatCLP(selectedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#666666]">
                <span>Costo de Envío</span>
                <span className="font-mono">{formatCLP(selectedOrder.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#1A1A1A] pt-2 border-t border-[#E5E5E5]">
                <span>Total Cobrado Hoy</span>
                <span className="font-mono text-[#2E9E5B]">{formatCLP(selectedOrder.totalChargedNow)}</span>
              </div>
              {selectedOrder.remainingBalanceLater > 0 && (
                <div className="flex justify-between text-xs font-bold text-[#FF6B35]">
                  <span>Saldo Pendiente Futuro (Al arribo)</span>
                  <span className="font-mono">{formatCLP(selectedOrder.remainingBalanceLater)}</span>
                </div>
              )}
            </div>

            {/* Pre-Order Balance Management Card */}
            {(selectedOrder.remainingBalanceLater > 0 || selectedOrder.balancePaid) && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#FF6B35] text-white font-black text-[10px]">
                      GESTIÓN DE PRE-VENTA
                    </span>
                    <strong className="text-[#1A1A1A]">
                      {selectedOrder.balancePaid
                        ? "Saldo Completamente Liquidado"
                        : `Saldo Pendiente: ${formatCLP(selectedOrder.remainingBalanceLater)}`}
                    </strong>
                  </div>
                  {selectedOrder.balancePaid ? (
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                      ✓ Pagado Completo
                    </span>
                  ) : selectedOrder.preOrderWarehouseArrivalNotified ? (
                    <span className="text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                      En Bodega (Cobro Habilitado)
                    </span>
                  ) : (
                    <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                      En Tránsito Internacional
                    </span>
                  )}
                </div>

                <p className="text-[#666666] text-[11px]">
                  {selectedOrder.balancePaid
                    ? `El cliente liquidó el 80% restante el ${new Date(selectedOrder.balancePaidAt || "").toLocaleDateString("es-CL")}. Listo para empaque y despacho.`
                    : selectedOrder.preOrderWarehouseArrivalNotified
                    ? "La mercadería ya fue registrada en bodega. El cliente tiene habilitado el botón de pago de saldo en su panel de cuenta."
                    : "Al marcar 'Mercadería en Bodega', se notificará al cliente y se habilitará el botón para que liquide el 80% restante con Webpay/Tarjetas."}
                </p>

                {!selectedOrder.balancePaid && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleToggleWarehouseArrival(selectedOrder)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
                      selectedOrder.preOrderWarehouseArrivalNotified
                        ? "bg-gray-200 text-[#1A1A1A] hover:bg-gray-300"
                        : "bg-[#FF6B35] text-white hover:bg-[#ff5517]"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>
                      {selectedOrder.preOrderWarehouseArrivalNotified
                        ? "Desactivar Notificación de Bodega"
                        : "✓ Marcar Mercadería en Bodega & Habilitar Cobro"}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Admin Notes */}
            {selectedOrder.adminNotes && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold block">Notas internas del Administrador:</span>
                <p>{selectedOrder.adminNotes}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#1F3A5F] text-white text-xs font-bold hover:bg-[#152842] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN TRACKING */}
      {isTrackingModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">Asignar Seguimiento de Envío</h3>
                <p className="text-[11px] text-[#666666] font-mono">Orden #{selectedOrder.orderNumber || selectedOrder.id.slice(0, 10)}</p>
              </div>
              <button
                onClick={() => setIsTrackingModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Empresa de Envíos (Courier)</label>
                <select
                  value={editCourier}
                  onChange={(e) => setEditCourier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35]"
                >
                  <option value="Starken">Starken Express</option>
                  <option value="Chilexpress">Chilexpress Prioritario</option>
                  <option value="Blue Express">Blue Express</option>
                  <option value="Correos de Chile">Correos de Chile</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Número de Seguimiento (Tracking ID)</label>
                <input
                  type="text"
                  placeholder="Ej. STK-982410529"
                  value={editTrackingNumber}
                  onChange={(e) => setEditTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Notas Internas (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Paquete embalado con triple burbuja y esquineros de protección..."
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F7F7F5] text-[#666666] text-xs font-semibold hover:text-[#1A1A1A]"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveTracking}
                className="px-4 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar y Despachar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE / CANCEL ORDER CONFIRMATION */}
      {isDeleteModalOpen && orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#D64545] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-[#1A1A1A]">¿Cancelar y Eliminar Pedido?</h3>
              <p className="text-xs text-[#666666]">
                Estás a punto de cancelar la orden <strong className="font-mono text-[#1A1A1A]">{orderToDelete.orderNumber || orderToDelete.id}</strong> del cliente <strong className="text-[#1A1A1A]">{orderToDelete.customer?.fullName}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#666666] space-y-1">
              <div>• Esta acción eliminará el registro de la orden en Cloud Firestore.</div>
              <div>• Si el pedido tenía stock reservado, quedará liberado para el catálogo.</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-[#F7F7F5] text-[#1A1A1A] text-xs font-bold hover:bg-[#E5E5E5] transition"
              >
                No, mantener orden
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleDeleteOrder}
                className="w-1/2 py-2.5 rounded-xl bg-[#D64545] hover:bg-red-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Eliminando..." : "Sí, Cancelar Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  MapPin,
  CreditCard,
  Package,
  ShieldCheck,
  Sparkles,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  ExternalLink,
  Pencil,
  ArrowRight,
  MessageCircle,
  Layers,
  Printer,
  Heart,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Search,
  ChevronRight,
  Calendar,
  DollarSign,
  FileText,
  BadgeAlert,
  Navigation,
  Lock,
} from "lucide-react";
import { useAuthStore, UserAddress, SavedPaymentMethod } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { BASE_PRODUCTS } from "@/lib/constants/catalog";
import { formatCLP } from "@/lib/utils/currency";
import { ConfirmedOrderEntity } from "@/lib/types/domain";

const CHILEAN_REGIONS = [
  "Región Metropolitana de Santiago",
  "Región de Valparaíso",
  "Región del Biobío",
  "Región de Coquimbo",
  "Región de La Araucanía",
  "Región de Los Lagos",
  "Región de Antofagasta",
];

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const settledParam = searchParams?.get("settled");
  const settledOrderId = searchParams?.get("orderId");

  const {
    currentUser,
    isAuthenticated,
    isAdmin,
    logout,
    updateProfile,
    deleteAccount,
    refreshUserFromFirestore,
    addAddress,
    deleteAddress,
    setDefaultAddress,
    addPaymentMethod,
    deletePaymentMethod,
    toggleWishlist,
  } = useAuthStore();

  const { addItem } = useCartStore();

  const [activeTab, setActiveTab] = useState<"PROFILE" | "ADDRESSES" | "PAYMENTS" | "ORDERS" | "WISHLIST">("ORDERS");
  const [catalogProducts, setCatalogProducts] = useState<any[]>(BASE_PRODUCTS);
  const [addedWishlistId, setAddedWishlistId] = useState<string | null>(null);

  // Live Orders State (Connected directly to database & Firestore)
  const [userOrders, setUserOrders] = useState<ConfirmedOrderEntity[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<"ALL" | "IN_PROGRESS" | "DISPATCHED" | "DELIVERED" | "CANCELLED">("ALL");
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [refreshSuccessMsg, setRefreshSuccessMsg] = useState(false);

  // Auto-switch tab if query param ?tab= or ?settled= is present
  useEffect(() => {
    if (settledParam === "true" || tabParam === "orders") {
      setActiveTab("ORDERS");
    } else if (tabParam === "wishlist") {
      setActiveTab("WISHLIST");
    } else if (tabParam === "profile") {
      setActiveTab("PROFILE");
    }
  }, [tabParam, settledParam]);

  // Load latest products from server to resolve any newly created items
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.products)) {
          setCatalogProducts(data.data.products);
        }
      })
      .catch(() => {});
    // Refresh user profile from Firestore on mount
    refreshUserFromFirestore().catch(() => {});
  }, []);

  // Fetch real-time orders for the active user
  const fetchUserOrders = async () => {
    if (!currentUser?.email) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(currentUser.email.toLowerCase().trim())}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.orders)) {
        // Merge with any orders saved locally in store
        const fetchedOrders: ConfirmedOrderEntity[] = data.data.orders;
        const localOrders: ConfirmedOrderEntity[] = currentUser.orders || [];

        const orderMap = new Map<string, ConfirmedOrderEntity>();
        // First add local orders
        for (const ord of localOrders) {
          const key = ord.id || ord.orderNumber;
          orderMap.set(key, ord);
        }
        // Then overwrite with fetched orders from Firestore (latest status)
        for (const ord of fetchedOrders) {
          const key = ord.id || ord.orderNumber;
          orderMap.set(key, ord);
        }

        const merged = Array.from(orderMap.values());
        merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setUserOrders(merged);
      } else {
        setUserOrders(currentUser.orders || []);
      }
    } catch (err) {
      console.error("Error fetching user orders:", err);
      setUserOrders(currentUser.orders || []);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Trigger fetch when user is available or tab changes to ORDERS
  useEffect(() => {
    if (currentUser?.email) {
      fetchUserOrders();
    }
  }, [currentUser?.email, activeTab]);

  const handleManualRefresh = async () => {
    await fetchUserOrders();
    setRefreshSuccessMsg(true);
    setTimeout(() => setRefreshSuccessMsg(false), 2500);
  };

  // Copy tracking number helper
  const handleCopyTracking = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedTracking(code);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  // Profile Edit State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rut, setRut] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // New Address Modal / Form State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newLabel, setNewLabel] = useState("Casa");
  const [newRegion, setNewRegion] = useState("Región Metropolitana de Santiago");
  const [newComuna, setNewComuna] = useState("Santiago");
  const [newAddress, setNewAddress] = useState("");
  const [newApartment, setNewApartment] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);

  // New Card State
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardBrand, setCardBrand] = useState<"VISA" | "MASTERCARD" | "WEBPAY">("WEBPAY");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/account");
    } else if (currentUser) {
      setFullName(currentUser.fullName || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setRut(currentUser.rut || "");
    }
  }, [isAuthenticated, currentUser, router]);

  if (!currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ fullName, email, phone, rut });
      setProfileMsg("¡Datos actualizados y sincronizados en Cloud Firestore!");
      setTimeout(() => setProfileMsg(null), 4000);
    } catch {
      setProfileMsg("Error al actualizar datos.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const res = await deleteAccount();
      alert(res.message || "Tu cuenta ha sido eliminada permanentemente.");
      router.push("/");
    } catch {
      alert("Hubo un error al eliminar la cuenta de Cloud Firestore.");
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress || !newComuna) return;

    addAddress({
      label: newLabel,
      fullName: currentUser.fullName,
      phone: currentUser.phone,
      region: newRegion,
      comuna: newComuna,
      address: newAddress,
      apartment: newApartment || undefined,
      isDefault: newIsDefault,
    });

    setIsAddingAddress(false);
    setNewAddress("");
    setNewApartment("");
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardHolder) return;

    const last4 = cardNumber.replace(/\s+/g, "").slice(-4) || "4242";
    addPaymentMethod({
      brand: cardBrand,
      last4,
      expiry: cardExpiry || "12/28",
      holderName: cardHolder.toUpperCase(),
      isDefault: currentUser.paymentMethods.length === 0,
    });

    setIsAddingCard(false);
    setCardNumber("");
    setCardHolder("");
    setCardExpiry("");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Filtered orders calculation
  const filteredOrders = userOrders.filter((ord) => {
    const st = (ord.status || "CONFIRMED").toUpperCase();
    if (orderStatusFilter === "IN_PROGRESS") {
      return st === "CONFIRMED" || st === "PAID" || st === "PREPARING" || st === "PENDING";
    }
    if (orderStatusFilter === "DISPATCHED") {
      return st === "DISPATCHED";
    }
    if (orderStatusFilter === "DELIVERED") {
      return st === "DELIVERED";
    }
    if (orderStatusFilter === "CANCELLED") {
      return st === "CANCELLED";
    }
    return true;
  });

  const inProgressCount = userOrders.filter((ord) => {
    const st = (ord.status || "CONFIRMED").toUpperCase();
    return st === "CONFIRMED" || st === "PAID" || st === "PREPARING" || st === "PENDING";
  }).length;

  const dispatchedCount = userOrders.filter((ord) => (ord.status || "").toUpperCase() === "DISPATCHED").length;
  const deliveredCount = userOrders.filter((ord) => (ord.status || "").toUpperCase() === "DELIVERED").length;
  const cancelledCount = userOrders.filter((ord) => (ord.status || "").toUpperCase() === "CANCELLED").length;

  // Render Status Step Indicator
  const getStepProgress = (status: string) => {
    const st = (status || "CONFIRMED").toUpperCase();
    if (st === "CANCELLED") return 0;
    if (st === "DELIVERED") return 4;
    if (st === "DISPATCHED") return 3;
    if (st === "PREPARING") return 2;
    return 1; // CONFIRMED or PAID or PENDING
  };

  const getStatusBadge = (status: string) => {
    const st = (status || "CONFIRMED").toUpperCase();
    switch (st) {
      case "CONFIRMED":
        return {
          label: "Pedido Confirmado",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: CheckCircle2,
        };
      case "PAID":
        return {
          label: "Pago Aprobado",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
        };
      case "PREPARING":
        return {
          label: "En Bodega (Distribuidor)",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: Clock,
        };
      case "DISPATCHED":
        return {
          label: "En Camino (Despachado)",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: Truck,
        };
      case "DELIVERED":
        return {
          label: "Entregado con Éxito",
          bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: CheckCircle2,
        };
      case "CANCELLED":
        return {
          label: "Pedido Cancelado",
          bg: "bg-red-50 text-red-700 border-red-200",
          icon: AlertCircle,
        };
      default:
        return {
          label: st,
          bg: "bg-gray-100 text-gray-700 border-gray-200",
          icon: Clock,
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile Summary (Navy #1F3A5F Theme) */}
      <div className="bg-[#1F3A5F] border border-[#152842] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md relative overflow-hidden text-white">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B35] flex items-center justify-center text-white font-black text-2xl shadow">
            {currentUser.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white">{currentUser.fullName}</h1>
              {isAdmin ? (
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#FF6B35] text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> Administrador
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/20 uppercase tracking-wider">
                  Cliente Registrado
                </span>
              )}
            </div>
            <p className="text-xs text-white/70 mt-1">
              {currentUser.email} {currentUser.phone && `• ${currentUser.phone}`} {currentUser.rut && `• RUT: ${currentUser.rut}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          {isAdmin && (
            <Link
              href="/admin/orders"
              className="px-4 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#ff5517] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Panel de Pedidos Admin</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-400/40 text-white hover:text-red-200 text-xs font-semibold transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Navigation Tabs (3 Cols) */}
        <div className="lg:col-span-3 space-y-1.5 bg-white border border-[#E5E5E5] rounded-2xl p-3 shadow-sm">
          {[
            {
              id: "ORDERS",
              label: "Historial de Pedidos",
              icon: Package,
              count: userOrders.length,
              badgeHighlight: inProgressCount > 0 ? `${inProgressCount} activo(s)` : undefined,
            },
            {
              id: "WISHLIST",
              label: "Mis Favoritos",
              icon: Heart,
              count: currentUser.wishlist?.length ?? 0,
            },
            { id: "PROFILE", label: "Información Personal", icon: User },
            { id: "ADDRESSES", label: "Libreta de Direcciones", icon: MapPin },
            { id: "PAYMENTS", label: "Métodos de Pago", icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-left transition ${
                  isActive
                    ? "bg-[#1F3A5F] text-white shadow-sm"
                    : "text-[#666666] hover:bg-[#F7F7F5] hover:text-[#1A1A1A]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#FF6B35]" : "text-[#666666]"}`} />
                  <span>{tab.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {tab.badgeHighlight && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B35] text-white animate-pulse">
                      {tab.badgeHighlight}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#F7F7F5] text-[#666666] border border-[#E5E5E5]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Contents (9 Cols) */}
        <div className="lg:col-span-9 bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-sm min-h-[460px]">
          {/* TAB 1: HISTORIAL DE PEDIDOS & SEGUIMIENTO (MAIN REQUEST) */}
          {activeTab === "ORDERS" && (
            <div className="space-y-6">
              {/* Header with Title & Refresh */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[#1A1A1A]">Historial de Pedidos & Seguimiento</h2>
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#1F3A5F]/10 text-[#1F3A5F]">
                      {userOrders.length} {userOrders.length === 1 ? "compra" : "compras"}
                    </span>
                  </div>
                  <p className="text-xs text-[#666666] mt-1">
                    Supervisa en tiempo real el estado de tus compras, despachos en bodega, números de seguimiento y boletas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRefresh}
                    disabled={loadingOrders}
                    className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] hover:bg-[#E5E5E5] text-[#1F3A5F] text-xs font-bold transition flex items-center gap-1.5 border border-[#E5E5E5] disabled:opacity-50"
                    title="Consultar la base de datos por cambios de estado"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#FF6B35] ${loadingOrders ? "animate-spin" : ""}`} />
                    <span>{loadingOrders ? "Actualizando..." : "Actualizar Estados"}</span>
                  </button>
                </div>
              </div>

              {refreshSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Historial sincronizado con la base de datos de pedidos de OmniCollector!</span>
                </div>
              )}

              {settledParam === "true" && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-emerald-950 text-xs flex items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-emerald-900">
                        ¡Saldo de Pre-Venta Liquidado Exitosamente!
                      </h4>
                      <p className="text-emerald-800 text-xs mt-0.5">
                        Tu pago fue acreditado. El pedido {settledOrderId ? <strong>#{settledOrderId}</strong> : ""} quedó 100% pagado y nuestro equipo de bodega lo está preparando para despacho asegurado.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Filter Sub-tabs */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { id: "ALL", label: "Todos los Pedidos", count: userOrders.length },
                  { id: "IN_PROGRESS", label: "En Proceso", count: inProgressCount, highlight: inProgressCount > 0 },
                  { id: "DISPATCHED", label: "En Camino / Despachados", count: dispatchedCount },
                  { id: "DELIVERED", label: "Entregados", count: deliveredCount },
                  { id: "CANCELLED", label: "Cancelados", count: cancelledCount },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setOrderStatusFilter(st.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      orderStatusFilter === st.id
                        ? "bg-[#1F3A5F] text-white border-[#1F3A5F] shadow-sm"
                        : "bg-[#F7F7F5] text-[#666666] border-[#E5E5E5] hover:text-[#1A1A1A] hover:bg-[#EFEFEF]"
                    }`}
                  >
                    <span>{st.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        orderStatusFilter === st.id
                          ? "bg-white/20 text-white"
                          : st.highlight
                          ? "bg-[#FF6B35] text-white"
                          : "bg-white text-[#666666] border border-[#E5E5E5]"
                      }`}
                    >
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Orders List */}
              <div className="space-y-5">
                {filteredOrders.map((ord) => {
                  const badge = getStatusBadge(ord.status);
                  const StatusIcon = badge.icon;
                  const step = getStepProgress(ord.status);
                  const isCancelled = (ord.status || "").toUpperCase() === "CANCELLED";
                  const isExpanded = expandedOrderId === ord.id;
                  const trackingCode = ord.shippingMethod?.trackingNumber;

                  return (
                    <div
                      key={ord.id}
                      className="border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white hover:border-[#1F3A5F]/40 transition shadow-sm"
                    >
                      {/* Order Card Header */}
                      <div className="p-4 sm:p-5 bg-[#F7F7F5] border-b border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-black text-[#1F3A5F] bg-white px-2.5 py-0.5 rounded-lg border border-[#E5E5E5] shadow-2xs">
                              {ord.orderNumber}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${badge.bg}`}>
                              <StatusIcon className="w-3 h-3" />
                              {badge.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#666666] flex items-center gap-3">
                            <span>
                              <strong>Fecha:</strong> {new Date(ord.createdAt).toLocaleDateString("es-CL", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Pago:</strong> {ord.paymentMethod === "MERCADO_PAGO" ? "Mercado Pago / Webpay" : ord.paymentMethod}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-4">
                          <div>
                            <span className="text-[10px] text-[#666666] block">Total Pagado:</span>
                            <span className="font-mono font-black text-base text-[#FF6B35]">
                              {formatCLP(ord.totalChargedNow)}
                            </span>
                          </div>

                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                            className="p-2 rounded-xl bg-white hover:bg-gray-100 border border-[#E5E5E5] text-[#1F3A5F] text-xs font-bold transition"
                            title={isExpanded ? "Ocultar detalles" : "Ver detalles completos"}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {/* Order Interactive Tracking Stepper */}
                      {!isCancelled ? (
                        <div className="p-5 border-b border-[#E5E5E5] bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1F3A5F] flex items-center gap-1.5 uppercase tracking-wider">
                              <Truck className="w-3.5 h-3.5 text-[#FF6B35]" />
                              Seguimiento del Envío
                            </span>
                            <span className="text-xs text-[#666666]">
                              {ord.shippingMethod?.name || "Despacho a Domicilio"}
                            </span>
                          </div>

                          {/* 4-Phase Stepper */}
                          <div className="grid grid-cols-4 gap-2 pt-2">
                            {[
                              { label: "1. Confirmado", desc: "Pago procesado", phase: 1 },
                              { label: "2. En Bodega", desc: "Empaque y revisión", phase: 2 },
                              { label: "3. En Camino", desc: "Courier en tránsito", phase: 3 },
                              { label: "4. Entregado", desc: "Recepción conforme", phase: 4 },
                            ].map((s) => {
                              const isPassed = step >= s.phase;
                              const isCurrent = step === s.phase;
                              return (
                                <div key={s.phase} className="space-y-1.5 text-center sm:text-left">
                                  <div className="relative flex items-center">
                                    <div
                                      className={`w-full h-1.5 rounded-full transition ${
                                        isPassed ? "bg-[#1F3A5F]" : "bg-[#E5E5E5]"
                                      } ${isCurrent ? "bg-[#FF6B35]" : ""}`}
                                    />
                                    <div
                                      className={`absolute left-0 sm:left-auto top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                                        isPassed
                                          ? "bg-[#1F3A5F] border-white text-white"
                                          : "bg-white border-[#CCCCCC] text-[#999999]"
                                      } ${isCurrent ? "bg-[#FF6B35] border-white text-white scale-125" : ""}`}
                                    >
                                      {isPassed ? "✓" : s.phase}
                                    </div>
                                  </div>
                                  <div className="pt-1">
                                    <div
                                      className={`text-[11px] font-bold ${
                                        isCurrent
                                          ? "text-[#FF6B35]"
                                          : isPassed
                                          ? "text-[#1F3A5F]"
                                          : "text-[#999999]"
                                      }`}
                                    >
                                      {s.label}
                                    </div>
                                    <div className="hidden sm:block text-[10px] text-[#666666] leading-tight">
                                      {s.desc}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Tracking Number Highlight Box */}
                          {trackingCode && (
                            <div className="mt-3 p-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-[#FF6B35]" />
                                <span className="text-xs text-[#1A1A1A]">
                                  Código de Seguimiento (<strong>{ord.shippingMethod.name}</strong>):
                                </span>
                                <span className="font-mono text-xs font-bold text-[#1F3A5F] bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">
                                  {trackingCode}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyTracking(trackingCode)}
                                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 text-[#1F3A5F] border border-[#E5E5E5] text-[11px] font-bold transition flex items-center gap-1"
                                >
                                  {copiedTracking === trackingCode ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-700">¡Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-[#666666]" />
                                      <span>Copiar N°</span>
                                    </>
                                  )}
                                </button>

                                {step < 2 ? (
                                  <div className="relative group">
                                    <button
                                      disabled
                                      className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400 text-[11px] font-bold flex items-center gap-1 cursor-not-allowed border border-gray-200"
                                    >
                                      <Lock className="w-3 h-3 text-gray-400" />
                                      <span>Mapa (Bloqueado)</span>
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl text-center z-20 pointer-events-none">
                                      Disponible cuando el distribuidor recepcione el bulto en bodega
                                    </div>
                                  </div>
                                ) : step === 4 ? (
                                  <Link
                                    href={`/tracking/${ord.orderNumber || ord.id}`}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                    <span>Ver Entrega</span>
                                  </Link>
                                ) : (
                                  <Link
                                    href={`/tracking/${ord.orderNumber || ord.id}`}
                                    className="px-2.5 py-1 rounded-lg bg-[#009EE3] hover:bg-[#0087c2] text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm animate-pulse"
                                  >
                                    <Navigation className="w-3 h-3 text-white" />
                                    <span>Mapa en Vivo</span>
                                  </Link>
                                )}

                                <a
                                  href={`https://www.google.com/search?q=seguimiento+${encodeURIComponent(trackingCode)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-[#1F3A5F] hover:bg-[#152842] text-white text-[11px] font-bold transition flex items-center gap-1"
                                >
                                  <span>Rastrear</span>
                                  <ExternalLink className="w-3 h-3 text-white/80" />
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Admin Notes from Warehouse */}
                          {ord.adminNotes && (
                            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                              <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Nota de Logística / Bodega: </span>
                                <span>{ord.adminNotes}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-red-50/50 border-b border-red-200 text-xs text-red-700 flex items-center gap-2">
                          <BadgeAlert className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Este pedido fue cancelado y no tiene envíos activos programados.</span>
                        </div>
                      )}

                      {/* Items Preview List */}
                      <div className="p-5 space-y-3">
                        <span className="text-xs font-bold text-[#1A1A1A] block">
                          Productos Comprados ({ord.items.length})
                        </span>

                        <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded-xl overflow-hidden">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="p-3.5 flex items-center justify-between gap-4 bg-white text-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                {it.imageUrl ? (
                                  <img
                                    src={it.imageUrl}
                                    alt={it.name}
                                    className="w-11 h-11 rounded-lg object-cover border border-[#E5E5E5] shrink-0"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#666666] shrink-0">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="font-bold text-[#1A1A1A] truncate">{it.name}</h4>
                                  <div className="text-[11px] text-[#666666] flex items-center gap-2 mt-0.5">
                                    <span className="font-mono">{it.sku}</span>
                                    <span>•</span>
                                    <span>Cant: {it.quantity}</span>
                                    <span>•</span>
                                    <span>Precio: {formatCLP(it.unitPrice)}</span>
                                  </div>
                                  {it.isPreOrder && (
                                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                      Preventa (Pie 20%: {formatCLP(it.unitDeposit)})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-[#1A1A1A]">
                                  {formatCLP((it.unitDeposit || it.unitPrice) * it.quantity)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expandable Order Details (Address, deferred balance, etc.) */}
                      {isExpanded && (
                        <div className="p-5 bg-[#F7F7F5] border-t border-[#E5E5E5] space-y-4 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Delivery Address */}
                            <div className="p-3.5 rounded-xl bg-white border border-[#E5E5E5] space-y-1">
                              <span className="font-bold text-[#1F3A5F] flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" /> Dirección de Envío
                              </span>
                              <p className="text-[#1A1A1A]">{ord.customer?.address}</p>
                              {ord.customer?.apartment && (
                                <p className="text-[#666666]">Dpto/Casa: {ord.customer.apartment}</p>
                              )}
                              <p className="text-[#666666]">
                                {ord.customer?.comuna}, {ord.customer?.region}
                              </p>
                              <p className="text-[#666666]">RUT: {ord.customer?.rut || "No especificado"}</p>
                            </div>

                            {/* Financial Breakdown */}
                            <div className="p-3.5 rounded-xl bg-white border border-[#E5E5E5] space-y-1.5">
                              <span className="font-bold text-[#1F3A5F] flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-[#FF6B35]" /> Resumen de Cobro
                              </span>
                              <div className="flex justify-between text-[#666666]">
                                <span>Subtotal:</span>
                                <span className="font-mono">{formatCLP(ord.subtotal)}</span>
                              </div>
                              {ord.discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                  <span>Descuento aplicado:</span>
                                  <span className="font-mono">-{formatCLP(ord.discountAmount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-[#666666]">
                                <span>Costo de Envío:</span>
                                <span className="font-mono">{ord.shippingCost === 0 ? "Gratis" : formatCLP(ord.shippingCost)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-[#1A1A1A] pt-1 border-t border-[#E5E5E5]">
                                <span>Total Pagado Hoy:</span>
                                <span className="font-mono text-[#FF6B35]">{formatCLP(ord.totalChargedNow)}</span>
                              </div>
                              {ord.remainingBalanceLater > 0 && (
                                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] mt-1">
                                  <strong>Saldo Preventa a Pagar al Arribo:</strong> {formatCLP(ord.remainingBalanceLater)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pre-Order Balance Callout & Pay Button */}
                      {ord.remainingBalanceLater > 0 && !ord.balancePaid && (
                        <div className="p-4 mx-5 my-3 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-[#FF6B35] text-white font-black text-[10px] uppercase tracking-wider">
                                {ord.preOrderWarehouseArrivalNotified ? "¡Llegó a Bodega!" : "Saldo Pre-Venta"}
                              </span>
                              <span className="font-bold text-xs text-[#1A1A1A]">
                                {ord.preOrderWarehouseArrivalNotified
                                  ? "Mercadería lista en Santiago • Cobro habilitado"
                                  : "Pie del 20% pagado • Saldo pendiente"}
                              </span>
                            </div>
                            <p className="text-xs text-[#666666]">
                              {ord.preOrderWarehouseArrivalNotified
                                ? `Tu pre-venta llegó a bodega. Liquida los ${formatCLP(ord.remainingBalanceLater)} restantes para autorizar su empaque y despacho inmediato.`
                                : `Saldo restante de pre-orden: ${formatCLP(ord.remainingBalanceLater)}. Puedes pagarlo ahora con Webpay/Tarjetas para dejar tu pedido 100% saldado.`}
                            </p>
                          </div>

                          <Link
                            href={`/checkout/sandbox-payment?orderId=${encodeURIComponent(ord.id || ord.orderNumber)}&amount=${ord.remainingBalanceLater}&mode=balance_settlement`}
                            className="shrink-0 px-4 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#ff5517] text-white font-black text-xs transition flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-95"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Pagar Saldo {formatCLP(ord.remainingBalanceLater)}</span>
                          </Link>
                        </div>
                      )}

                      {ord.balancePaid && (
                        <div className="p-3 mx-5 my-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs text-emerald-800">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              <strong>Saldo 100% Liquidado</strong>
                              {ord.balancePaidAt ? ` el ${new Date(ord.balancePaidAt).toLocaleDateString("es-CL")}` : ""}. No hay saldos pendientes.
                            </span>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                            PAGADO COMPLETO
                          </span>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="p-4 bg-white border-t border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3">
                        <div className="text-[11px] text-[#666666]">
                          ¿Tienes dudas sobre tu envío? Estamos listos para ayudarte.
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {step < 2 ? (
                            <div className="relative group">
                              <button
                                disabled
                                className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed border border-gray-200"
                              >
                                <Lock className="w-3.5 h-3.5 text-gray-400" />
                                <span>Rastrear en Vivo (En espera de bodega)</span>
                              </button>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-52 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl text-center z-20 pointer-events-none">
                                🔒 El rastreo satelital se activará en cuanto el paquete sea recepcionado en bodega por el distribuidor.
                              </div>
                            </div>
                          ) : step === 4 ? (
                            <Link
                              href={`/tracking/${ord.orderNumber || ord.id}`}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Ver Comprobante de Entrega</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/tracking/${ord.orderNumber || ord.id}`}
                              className="px-3 py-1.5 rounded-xl bg-[#009EE3] hover:bg-[#0087c2] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 animate-pulse"
                            >
                              <Truck className="w-3.5 h-3.5 text-white" />
                              <span>Rastrear en Vivo (Mapa)</span>
                            </Link>
                          )}

                          <a
                            href={`https://wa.me/56987654321?text=Hola%20OmniCollector,%20tengo%20una%20consulta%20sobre%20mi%20pedido%20${ord.orderNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Soporte</span>
                          </a>

                          <Link
                            href={`/order-confirmation/${ord.id}`}
                            className="px-3 py-1.5 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Ver Comprobante</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty State */}
                {filteredOrders.length === 0 && !loadingOrders && (
                  <div className="py-16 text-center rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E5E5] flex items-center justify-center mx-auto text-[#666666]">
                      <Package className="w-7 h-7 text-[#FF6B35]" />
                    </div>
                    <h3 className="text-base font-bold text-[#1A1A1A]">
                      {orderStatusFilter === "ALL"
                        ? "Aún no tienes pedidos registrados con esta cuenta"
                        : "No se encontraron pedidos con este estado"}
                    </h3>
                    <p className="text-xs text-[#666666] max-w-md mx-auto">
                      Explora nuestro catálogo de videojuegos, figuras a escala con reserva del 20% y cartas coleccionables certificadas en Chile.
                    </p>
                    <Link
                      href="/catalog"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#ff5517] text-white font-bold text-xs uppercase tracking-wider transition shadow"
                    >
                      <span>Explorar Catálogo de Productos</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MIS FAVORITOS (WISHLIST) */}
          {activeTab === "WISHLIST" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E5E5] pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[#1A1A1A]">Mis Productos Favoritos</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] font-mono font-bold">
                      {currentUser.wishlist?.length || 0}
                    </span>
                  </div>
                  <p className="text-xs text-[#666666] mt-1">
                    Colección personal guardada con el botón de corazón. Puedes agregarlos directamente a tu carrito de compra.
                  </p>
                </div>

                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B35] hover:underline"
                >
                  <span>Explorar más en el Catálogo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {(() => {
                const wishlistIds = currentUser.wishlist || [];
                const wishlistItems = catalogProducts.filter((p) => wishlistIds.includes(p.id));

                if (wishlistItems.length === 0) {
                  return (
                    <div className="py-16 text-center rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E5E5] flex items-center justify-center mx-auto text-[#FF6B35]">
                        <Heart className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-[#1A1A1A]">No tienes productos en tu lista de favoritos</h3>
                      <p className="text-xs text-[#666666] max-w-md mx-auto">
                        Presiona el corazón en las cards de figuras a escala, videojuegos o cartas certificadas para guardarlas en tu cuenta y seguir su inventario.
                      </p>
                      <Link
                        href="/catalog"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#ff5517] text-white font-bold text-xs uppercase tracking-wider transition shadow"
                      >
                        Ir al Catálogo de Productos <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {wishlistItems.map((item) => {
                      const displayImg =
                        item.imageUrl ||
                        (item.images && item.images.length > 0 ? item.images[0] : null);

                      return (
                        <div
                          key={item.id}
                          className="group relative rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#1F3A5F] transition flex flex-col justify-between overflow-hidden shadow-sm"
                        >
                          <div>
                            <div className="relative h-44 bg-[#F7F7F5] overflow-hidden">
                              {displayImg ? (
                                <img
                                  src={displayImg}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#666666]">
                                  <Package className="w-10 h-10" />
                                </div>
                              )}

                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/90 border border-[#E5E5E5] text-[#1A1A1A] shadow-xs">
                                  {item.sku}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleWishlist(item.id)}
                                title="Quitar de favoritos"
                                className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 hover:bg-red-50 text-[#FF6B35] hover:text-red-600 border border-[#E5E5E5] transition shadow"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {item.isPreOrder && (
                                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1F3A5F] text-white flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#FF6B35]" /> PREVENTA
                                </span>
                              )}
                            </div>

                            <div className="p-4 space-y-2">
                              <Link
                                href={`/product/${item.sku.toLowerCase()}`}
                                className="font-bold text-xs text-[#1A1A1A] hover:text-[#FF6B35] transition line-clamp-2"
                              >
                                {item.name}
                              </Link>

                              <div className="flex items-baseline justify-between pt-1">
                                <div>
                                  <span className="text-[10px] text-[#666666] block">Precio:</span>
                                  <span className="text-base font-black text-[#1A1A1A] font-mono">
                                    {formatCLP(item.price)}
                                  </span>
                                </div>
                                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {item.stockAvailable > 0 ? "Disponible" : "Sin Stock"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 pt-0 space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                addItem({
                                  productId: item.id,
                                  sku: item.sku,
                                  name: item.name,
                                  type: item.type,
                                  quantity: 1,
                                  unitPrice: item.price,
                                  unitCost: item.costPrice || 0,
                                  isPreOrder: Boolean(item.isPreOrder),
                                  isPartialDeposit: Boolean(item.isPreOrder),
                                  depositPercent: item.isPreOrder ? 0.2 : 1.0,
                                  badge: item.type === "BUNDLE" ? "Bundle" : item.isPreOrder ? "Preventa" : "En Stock",
                                  imageUrl: displayImg ?? undefined,
                                });
                                setAddedWishlistId(item.id);
                                setTimeout(() => setAddedWishlistId(null), 1500);
                              }}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow ${
                                addedWishlistId === item.id
                                  ? "bg-emerald-600 text-white"
                                  : "bg-[#FF6B35] hover:bg-[#ff5517] text-white"
                              }`}
                            >
                              {addedWishlistId === item.id ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> ¡Agregado al Carrito!
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" /> Mover al Carrito
                                </>
                              )}
                            </button>

                            <Link
                              href={`/product/${item.sku.toLowerCase()}`}
                              className="w-full py-1.5 rounded-xl bg-[#F7F7F5] hover:bg-[#E5E5E5] text-[#1F3A5F] text-[11px] font-semibold text-center transition block border border-[#E5E5E5]"
                            >
                              Ver Ficha Técnica
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: INFORMACIÓN PERSONAL */}
          {activeTab === "PROFILE" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A]">Información Personal</h2>
                <p className="text-xs text-[#666666] mt-1">
                  Gestiona tus datos de contacto para la facturación y boletas electrónicas en Chile.
                </p>
              </div>

              {profileMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1F3A5F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1F3A5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Teléfono (WhatsApp)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1F3A5F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">RUT Chileno (Para boleta electrónica)</label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="12.345.678-K"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1F3A5F]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 rounded-xl bg-[#FF6B35] hover:bg-[#ff5517] text-white font-bold text-xs uppercase tracking-wider transition shadow disabled:opacity-50"
                >
                  {savingProfile ? "Guardando en Cloud Firestore..." : "Guardar Cambios"}
                </button>
              </form>

              {/* Danger Zone: Delete Account */}
              <div className="pt-8 border-t border-red-200 max-w-xl space-y-4">
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>Zona de Peligro • Eliminar Cuenta</span>
                  </div>
                  <p className="text-xs text-red-600">
                    Si decides eliminar tu cuenta, se borrará tu registro en Cloud Firestore junto con tus preferencias guardadas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar mi Cuenta Definitivamente</span>
                  </button>
                </div>
              </div>

              {/* Confirmation Modal */}
              {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                  <div className="bg-white border border-[#E5E5E5] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3 text-red-600">
                      <div className="p-2 rounded-xl bg-red-50">
                        <Trash2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-[#1A1A1A]">¿Eliminar tu cuenta?</h3>
                        <p className="text-xs text-[#666666]">Acción permanente en Cloud Firestore</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#666666] leading-relaxed">
                      ¿Estás seguro de que deseas eliminar la cuenta de <strong>{currentUser.email}</strong>? Se borrará tu usuario y se cerrará tu sesión.
                    </p>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        disabled={deletingAccount}
                        onClick={() => setShowDeleteModal(false)}
                        className="px-4 py-2 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-bold text-[#666666] hover:text-[#1A1A1A] transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={deletingAccount}
                        onClick={handleConfirmDeleteAccount}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-2"
                      >
                        {deletingAccount ? "Borrando..." : "Sí, Eliminar"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LIBRETA DE DIRECCIONES */}
          {activeTab === "ADDRESSES" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-[#1A1A1A]">Libreta de Direcciones</h2>
                  <p className="text-xs text-[#666666] mt-1">
                    Guarda tus direcciones de entrega en Chile para autocompletar el checkout.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="px-4 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingAddress ? "Cancelar" : "Agregar Dirección"}</span>
                </button>
              </div>

              {isAddingAddress && (
                <form onSubmit={handleAddAddress} className="p-5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Nueva Dirección de Despacho</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Etiqueta</label>
                      <select
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                      >
                        <option value="Casa">Casa</option>
                        <option value="Oficina">Oficina</option>
                        <option value="Departamento">Departamento</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Región</label>
                      <select
                        value={newRegion}
                        onChange={(e) => setNewRegion(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                      >
                        {CHILEAN_REGIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Comuna *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Providencia"
                        value={newComuna}
                        onChange={(e) => setNewComuna(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Calle y Número *</label>
                      <input
                        type="text"
                        required
                        placeholder="Av. Providencia 1234"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Depto / Casa (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Depto 402"
                        value={newApartment}
                        onChange={(e) => setNewApartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDef"
                      checked={newIsDefault}
                      onChange={(e) => setNewIsDefault(e.target.checked)}
                      className="rounded border-[#CCCCCC] text-[#FF6B35]"
                    />
                    <label htmlFor="isDef" className="text-xs text-[#666666] cursor-pointer">
                      Establecer como dirección predeterminada
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#ff5517] text-white font-bold text-xs uppercase tracking-wider transition"
                  >
                    Guardar Dirección
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentUser.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-5 rounded-2xl border space-y-2 transition ${
                      addr.isDefault
                        ? "bg-[#1F3A5F]/5 border-[#1F3A5F] shadow-sm"
                        : "bg-white border-[#E5E5E5]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1A1A1A] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1F3A5F] text-white">
                          Predeterminada
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#1A1A1A] font-semibold">{addr.address} {addr.apartment && `(${addr.apartment})`}</p>
                    <p className="text-xs text-[#666666]">{addr.comuna}, {addr.region}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5] text-xs">
                      {!addr.isDefault && (
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-xs text-[#1F3A5F] hover:underline font-semibold"
                        >
                          Usar como predeterminada
                        </button>
                      )}
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="text-xs text-red-600 hover:text-red-700 ml-auto"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                {currentUser.addresses.length === 0 && !isAddingAddress && (
                  <div className="col-span-2 p-8 text-center rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#666666]">
                    No tienes direcciones registradas. Haz clic en "Agregar Dirección" para registrar tu primera dirección.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MÉTODOS DE PAGO */}
          {activeTab === "PAYMENTS" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-[#1A1A1A]">Métodos de Pago Guardados</h2>
                  <p className="text-xs text-[#666666] mt-1">
                    Tarjetas de crédito o débito registradas de forma segura para compras rápidas en Chile.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingCard(!isAddingCard)}
                  className="px-4 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingCard ? "Cancelar" : "Registrar Tarjeta"}</span>
                </button>
              </div>

              {isAddingCard && (
                <form onSubmit={handleAddCard} className="p-5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-4 shadow-sm max-w-lg">
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Añadir Tarjeta</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Marca</label>
                      <select
                        value={cardBrand}
                        onChange={(e) => setCardBrand(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                      >
                        <option value="WEBPAY">Webpay / Redcompra</option>
                        <option value="VISA">Visa</option>
                        <option value="MASTERCARD">Mastercard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Nombre en Tarjeta</label>
                      <input
                        type="text"
                        required
                        placeholder="Como figura en el plástico"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Número de Tarjeta</label>
                      <input
                        type="text"
                        required
                        placeholder="•••• •••• •••• 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Vencimiento</label>
                      <input
                        type="text"
                        placeholder="11/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#ff5517] text-white font-bold text-xs uppercase tracking-wider transition shadow"
                  >
                    Guardar Tarjeta Segura
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentUser.paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-5 rounded-2xl bg-gradient-to-br from-[#1F3A5F] to-[#152842] text-white space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-6 h-6 text-[#FF6B35]" />
                      <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20">
                        {pm.brand}
                      </span>
                    </div>

                    <div className="font-mono text-base font-bold tracking-widest text-white/90">
                      •••• •••• •••• {pm.last4}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-white/70 pt-2 border-t border-white/20">
                      <span>{pm.holderName}</span>
                      <span>Vence: {pm.expiry}</span>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => deletePaymentMethod(pm.id)}
                        className="text-xs text-red-300 hover:text-white underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                {currentUser.paymentMethods.length === 0 && !isAddingCard && (
                  <div className="col-span-2 p-8 text-center rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#666666]">
                    No tienes tarjetas guardadas. Haz clic en "Registrar Tarjeta" para añadir una.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-[#666666] text-sm">
          Cargando panel de cuenta...
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

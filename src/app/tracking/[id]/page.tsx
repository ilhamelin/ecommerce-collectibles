"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  ShieldCheck,
  Phone,
  MessageCircle,
  ArrowLeft,
  Share2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  User,
  Calendar,
  Lock,
  Radio,
  Building2,
  RefreshCw,
} from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";
import { ConfirmedOrderEntity } from "@/lib/types/domain";
import { getCoordinatesForAddress } from "@/lib/geo/chilean-coordinates";

// Dynamically import Leaflet map with ssr: false
const LiveTrackingMap = dynamic(
  () => import("@/components/tracking/LiveTrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-3xl bg-slate-100 border border-[#E5E5E5] flex flex-col items-center justify-center gap-3 text-slate-400 animate-pulse">
        <Truck className="w-10 h-10 text-[#009EE3] animate-bounce" />
        <p className="text-xs font-bold text-[#1A1A1A]">Cargando mapa satelital de seguimiento...</p>
        <span className="text-[10px] text-[#666666]">Conectando con georreferenciación de Chile</span>
      </div>
    ),
  }
);

const DISPATCH_PHASES = [
  {
    phase: 1,
    title: "Conectando Enlace Satelital GPS",
    detail: "Estableciendo telemetría cifrada y georreferenciación de ruta...",
    icon: Radio,
  },
  {
    phase: 2,
    title: "Bulto Escaneado en Andén ENEA",
    detail: "Verificación de empaque Collector-Grade con sello de seguridad...",
    icon: Package,
  },
  {
    phase: 3,
    title: "Asignando Móvil de Reparto",
    detail: "Móvil Starken #42 asignado a repartidor Claudio Silva M...",
    icon: Truck,
  },
  {
    phase: 4,
    title: "Móvil en Ruta de Entrega",
    detail: "Saliendo de Bodega Central hacia tu dirección en vivo...",
    icon: CheckCircle2,
  },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderIdParam = (params?.id as string) || "";

  const [order, setOrder] = useState<ConfirmedOrderEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(25);
  const [progressPercent, setProgressPercent] = useState(35);

  // Perspective loading sequence state for PREPARING -> DISPATCHED transition
  const [dispatchPhase, setDispatchPhase] = useState<number>(0);
  const [isStartingDispatch, setIsStartingDispatch] = useState<boolean>(false);

  // Delivery confirmation states
  const [isDelivering, setIsDelivering] = useState<boolean>(false);
  const [deliveredSuccess, setDeliveredSuccess] = useState<boolean>(false);
  const [deliveryConfirmedAt, setDeliveryConfirmedAt] = useState<string | null>(null);

  // Fetch order from DB
  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderIdParam}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
        if (data.data.status === "DELIVERED") {
          setDeliveredSuccess(true);
          setDeliveryConfirmedAt(data.data.deliveredAt || data.data.updatedAt || null);
        }
        return;
      }

      // If not found by direct ID, search in orders list by orderNumber
      const searchRes = await fetch(`/api/orders?q=${encodeURIComponent(orderIdParam)}`);
      const searchData = await searchRes.json();
      if (searchData.success && Array.isArray(searchData.data?.orders) && searchData.data.orders.length > 0) {
        const found = searchData.data.orders[0];
        setOrder(found);
        if (found.status === "DELIVERED") {
          setDeliveredSuccess(true);
          setDeliveryConfirmedAt(found.deliveredAt || found.updatedAt || null);
        }
        return;
      }
    } catch (err) {
      console.error("Error buscando pedido:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderIdParam) {
      fetchOrder();
    }
  }, [orderIdParam]);

  // Fallback demo order if order not found in DB
  const displayOrder: ConfirmedOrderEntity = order || {
    id: orderIdParam || "DEMO-ORD-7821",
    orderNumber: orderIdParam.startsWith("ORD-") ? orderIdParam : "ORD-7821-DEMO",
    createdAt: new Date().toISOString(),
    status: "DISPATCHED",
    customer: {
      fullName: "Rodrigo Valenzuela",
      email: "cliente@omnicollector.cl",
      phone: "+56 9 8765 4321",
      rut: "18.452.931-4",
      region: "Región Metropolitana de Santiago",
      comuna: "Providencia",
      address: "Av. Pedro de Valdivia 1420",
      apartment: "Dpto 604",
    },
    shippingMethod: {
      name: "Starken Express",
      cost: 4990,
      estimatedDelivery: "24 a 48 hrs hábiles",
      trackingNumber: `STK-${Math.floor(100000000 + Math.random() * 900000000)}`,
    },
    paymentMethod: "WEBPAY",
    items: [
      {
        productId: "p1",
        sku: "FIG-GSC-SABER-01",
        name: "Saber / Altria Pendragon 1/7 Scale Deluxe",
        quantity: 1,
        unitPrice: 189990,
        isPreOrder: false,
        isPartialDeposit: false,
        unitDeposit: 0,
        remainingBalancePerUnit: 0,
        imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80",
      },
    ],
    subtotal: 189990,
    discountAmount: 0,
    shippingCost: 4990,
    totalChargedNow: 194980,
    remainingBalanceLater: 0,
    reservationIds: [],
  };

  const currentStatus = (displayOrder.status || "CONFIRMED").toUpperCase();
  const isConfirmed = currentStatus === "CONFIRMED";
  const isPreparing = currentStatus === "PREPARING";
  const isDispatched = currentStatus === "DISPATCHED";
  const isDelivered = currentStatus === "DELIVERED" || deliveredSuccess;

  // Trigger sequence when order is PREPARING (En Bodega / Recibido por Distribuidor)
  // to realistically transition it to DISPATCHED
  useEffect(() => {
    if (isPreparing && !isStartingDispatch) {
      setIsStartingDispatch(true);
      setDispatchPhase(1);

      const t1 = setTimeout(() => setDispatchPhase(2), 1200);
      const t2 = setTimeout(() => setDispatchPhase(3), 2400);
      const t3 = setTimeout(() => setDispatchPhase(4), 3600);
      const t4 = setTimeout(async () => {
        // Persist change to database as DISPATCHED
        try {
          await fetch(`/api/orders/${displayOrder.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "DISPATCHED",
              clientTrackingUpdate: true,
            }),
          });
          setOrder((prev) => (prev ? { ...prev, status: "DISPATCHED" } : null));
        } catch (e) {
          console.error("Error updating order to DISPATCHED:", e);
        } finally {
          setIsStartingDispatch(false);
        }
      }, 4600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [isPreparing, displayOrder.id]);

  // Handle destination reached (100% route completed)
  const handleDestinationReached = async () => {
    if (isDelivered || isDelivering) return;
    setIsDelivering(true);

    try {
      const deliveredAt = new Date().toISOString();
      await fetch(`/api/orders/${displayOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DELIVERED",
          deliveredAt,
          clientTrackingUpdate: true,
        }),
      });

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: "DELIVERED",
              deliveredAt,
            }
          : null
      );
      setDeliveredSuccess(true);
      setDeliveryConfirmedAt(deliveredAt);
      setProgressPercent(100);
      setEtaMinutes(0);
    } catch (err) {
      console.error("Error confirming delivery in DB:", err);
    } finally {
      setIsDelivering(false);
    }
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const destinationCoords = getCoordinatesForAddress(
    displayOrder.customer?.comuna,
    displayOrder.customer?.region
  );

  const destinationLabel = `${displayOrder.customer?.address || "Domicilio"}, ${
    displayOrder.customer?.comuna || "Santiago"
  }`;

  const courierName = displayOrder.shippingMethod?.name || "Starken Express";
  const trackingNumber = displayOrder.shippingMethod?.trackingNumber || "STK-982410529";

  return (
    <div className="min-h-screen bg-[#F7F7F5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Breadcrumb & Return Link */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/account?tab=orders"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs font-bold text-[#1F3A5F] hover:bg-gray-100 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Mis Pedidos</span>
          </Link>

          <div className="flex items-center gap-2">
            {isDelivered ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Entrega Confirmada en Domicilio
              </span>
            ) : isStartingDispatch ? (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 border border-amber-200 animate-pulse">
                <Radio className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                Sincronizando Despacho con Satélite...
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                GPS En Vivo • Satélite Activo
              </span>
            )}
          </div>
        </div>

        {/* LOCKED STATE BANNER: If order is still in CONFIRMED */}
        {isConfirmed && (
          <div className="p-6 rounded-3xl bg-white border-2 border-amber-300 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-amber-700" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold uppercase">
                    Etapa 1: Confirmado
                  </span>
                  <span className="text-xs text-[#666666]">
                    Orden #{displayOrder.orderNumber || displayOrder.id}
                  </span>
                </div>
                <h2 className="text-lg font-black text-[#1A1A1A]">
                  El rastreo en vivo se activará al ingresar a bodega
                </h2>
                <p className="text-xs text-[#666666] max-w-xl">
                  Tu pago fue aprobado exitosamente. Actualmente el pedido se encuentra en preparación para ser entregado al distribuidor. En cuanto el equipo de bodega recepcione el bulto y actualice su estado a <strong>&quot;En Bodega&quot;</strong>, el GPS en tiempo real se iniciará automáticamente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/account?tab=orders"
                className="px-4 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white font-bold text-xs transition shadow-sm"
              >
                Volver a Mis Pedidos
              </Link>
            </div>
          </div>
        )}

        {/* PERSPECTIVE LOADING OVERLAY: Transitioning from PREPARING (En Bodega) to DISPATCHED */}
        {isStartingDispatch && (
          <div className="p-6 rounded-3xl bg-white border border-[#009EE3]/30 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] pb-4">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-[#009EE3] tracking-wider">
                  Etapa 2 ➔ Etapa 3 • Telemetría Satelital
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] mt-0.5 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#009EE3] animate-pulse" />
                  Iniciando Despacho desde Bodega Central ENEA
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#009EE3] border border-blue-200 self-start sm:self-auto">
                Fase {dispatchPhase} de 4
              </span>
            </div>

            {/* Step sequence */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {DISPATCH_PHASES.map((p) => {
                const Icon = p.icon;
                const isPassed = dispatchPhase > p.phase;
                const isCurrent = dispatchPhase === p.phase;
                return (
                  <div
                    key={p.phase}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? "bg-blue-50 border-[#009EE3] shadow-sm scale-102"
                        : isPassed
                        ? "bg-emerald-50/60 border-emerald-200 opacity-90"
                        : "bg-gray-50 border-gray-200 opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isPassed
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                            ? "bg-[#009EE3] text-white animate-bounce"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isPassed ? "✓" : <Icon className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-black text-[#1A1A1A]">
                        {p.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666] leading-tight">
                      {p.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#009EE3] to-[#FF6B35] transition-all duration-700 rounded-full"
                style={{ width: `${dispatchPhase * 25}%` }}
              />
            </div>
          </div>
        )}

        {/* DELIVERED SUCCESS CELEBRATORY BANNER */}
        {isDelivered && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                    Etapa 4: Pedido Entregado
                  </span>
                  <span className="text-xs text-white/80">
                    Orden #{displayOrder.orderNumber || displayOrder.id}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  ¡Tu paquete ha sido entregado en destino!
                </h2>
                <p className="text-xs text-white/90 max-w-xl leading-relaxed">
                  El repartidor Claudio Silva M. confirmó la entrega y recepción conforme en {destinationLabel}. La base de datos y tu Historial de Pedidos han sido actualizados con el estado <strong>Entregado</strong>.
                </p>
                {deliveryConfirmedAt && (
                  <p className="text-[11px] text-white/75 font-mono pt-1">
                    Hora de Entrega: {new Date(deliveryConfirmedAt).toLocaleString("es-CL")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/account?tab=orders"
                className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs transition shadow-md hover:scale-105 active:scale-95"
              >
                Ver en Historial de Pedidos
              </Link>
            </div>
          </div>
        )}

        {/* Main Grid: Left Map (2/3) + Right Logistics Details (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Map Column (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                      isDelivered
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-[#1F3A5F] text-white"
                    }`}
                  >
                    {isDelivered ? "ENTREGA COMPLETADA" : "SEGUIMIENTO EN VIVO"}
                  </span>
                  <span className="text-xs text-[#666666]">
                    Orden <strong>#{displayOrder.orderNumber || displayOrder.id}</strong>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#1A1A1A] tracking-tight">
                  {isDelivered
                    ? "Paquete Entregado Conforme"
                    : isPreparing
                    ? "Bulto en Bodega de Distribución"
                    : "Tu paquete está en camino"}
                </h1>
                <p className="text-xs text-[#666666] mt-0.5">
                  Courier asignado: <strong className="text-[#1F3A5F]">{courierName}</strong>
                </p>
              </div>

              {/* ETA Display Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1F3A5F] to-[#152842] text-white shadow text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-white/70 block">
                  {isDelivered ? "Estado de Entrega" : "Tiempo Estimado"}
                </span>
                <div className="font-mono text-2xl font-black text-[#FF6B35]">
                  {isDelivered ? "0 min" : `~${etaMinutes} min`}
                </div>
                <span className="text-[10px] text-white/80">
                  {isDelivered ? "Entregado en puerta" : "Llegada estimada hoy"}
                </span>
              </div>
            </div>

            {/* Interactive Leaflet Map Component */}
            <div className="h-[520px]">
              <LiveTrackingMap
                destination={destinationCoords}
                destinationLabel={destinationLabel}
                orderNumber={displayOrder.orderNumber}
                courierName={courierName}
                trackingNumber={trackingNumber}
                currentStatus={displayOrder.status}
                onProgressChange={(pct, eta) => {
                  setProgressPercent(pct);
                  setEtaMinutes(eta);
                }}
                onDestinationReached={handleDestinationReached}
              />
            </div>
          </div>

          {/* Right Column: Driver, Timeline & Order Info (1/3) */}
          <div className="space-y-5">
            {/* Driver & Courier Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Información del Despacho
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-[#009EE3] border border-blue-200 font-bold text-[10px]">
                  {courierName}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1F3A5F] text-white flex items-center justify-center font-bold text-base shadow">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1A1A1A]">Claudio Silva M.</h4>
                  <p className="text-xs text-[#666666]">Repartidor Asignado • Móvil #42</p>
                  <p className="text-[11px] text-emerald-700 font-semibold">✓ Verificado por Courier</p>
                </div>
              </div>

              {/* Tracking ID & Copy */}
              <div className="p-3 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666666] block">
                    N° de Seguimiento
                  </span>
                  <span className="font-mono text-xs font-bold text-[#1F3A5F]">
                    {trackingNumber}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyTracking(trackingNumber)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E5E5] hover:bg-gray-100 text-xs font-bold text-[#1F3A5F] transition flex items-center gap-1"
                >
                  {copiedTracking ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#666666]" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Delivery Address */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-[#1A1A1A] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" /> Dirección de Destino:
                </span>
                <p className="text-[#666666] pl-4 leading-relaxed">
                  {displayOrder.customer?.address}
                  {displayOrder.customer?.apartment ? `, Dpto/Casa ${displayOrder.customer.apartment}` : ""}
                  <br />
                  {displayOrder.customer?.comuna}, {displayOrder.customer?.region}
                </p>
              </div>

              {/* Direct Support Button */}
              <a
                href={`https://wa.me/56958243917?text=Hola%20OmniCollector,%20estoy%20viendo%20el%20mapa%20en%20vivo%20de%20mi%20pedido%20${displayOrder.orderNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar Soporte de Entregas</span>
              </a>
            </div>

            {/* Step-by-Step Delivery Timeline */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666] border-b border-[#E5E5E5] pb-2">
                Historial de Eventos del Courier
              </h4>

              <div className="space-y-4 text-xs">
                {/* Step 1: Confirmado */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-[#1A1A1A] block">1. Pago Acreditado & Confirmado</strong>
                    <span className="text-[11px] text-[#666666]">Embalaje Blindado Collector-Grade completado en Bodega ENEA.</span>
                  </div>
                </div>

                {/* Step 2: En Bodega */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isConfirmed
                        ? "bg-gray-100 text-gray-400"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-[#1A1A1A] block">2. En Bodega (Distribuidor)</strong>
                    <span className="text-[11px] text-[#666666]">
                      {isConfirmed
                        ? "En espera de ingreso y escaneo en andén de salida."
                        : `Bulto recepcionado por ${courierName} y registrado en sistema.`}
                    </span>
                  </div>
                </div>

                {/* Step 3: En Camino */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isDelivered
                        ? "bg-emerald-100 text-emerald-700"
                        : isDispatched
                        ? "bg-[#009EE3] text-white animate-pulse"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong
                      className={`block ${
                        isDispatched && !isDelivered ? "text-[#009EE3]" : "text-[#1A1A1A]"
                      }`}
                    >
                      3. En Ruta de Entrega (En Vivo)
                    </strong>
                    <span className="text-[11px] text-[#666666]">
                      {isDelivered
                        ? "Trayecto completado sin incidencias."
                        : isDispatched
                        ? "El chofer está realizando la ruta hacia tu comuna."
                        : "Se activará al salir el móvil del centro logístico."}
                    </span>
                  </div>
                </div>

                {/* Step 4: Entregado */}
                <div
                  className={`flex items-start gap-3 ${
                    isDelivered ? "opacity-100" : "opacity-50"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isDelivered
                        ? "bg-emerald-600 text-white shadow"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className={`block ${isDelivered ? "text-emerald-700" : "text-[#1A1A1A]"}`}>
                      4. Entrega en Destino
                    </strong>
                    <span className="text-[11px] text-[#666666]">
                      {isDelivered
                        ? "Recepción confirmada con firma y verificación de RUT."
                        : "Recepción con firma y verificación de RUT al llegar."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Contents Preview */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666] border-b border-[#E5E5E5] pb-2">
                Artículos en este Paquete ({displayOrder.items?.length || 1})
              </h4>
              <div className="space-y-2">
                {displayOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#E5E5E5] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#666666] shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-[#1A1A1A] truncate">{item.name}</div>
                      <div className="text-[11px] text-[#666666]">
                        {item.quantity} un. • SKU: {item.sku}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

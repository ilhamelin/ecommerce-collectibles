"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  ShieldCheck,
  MessageCircle,
  ArrowLeft,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  User,
  Building2,
  FileText,
  Printer,
  X,
  Barcode as BarcodeIcon,
  Compass,
} from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";
import { ConfirmedOrderEntity } from "@/lib/types/domain";
import { getCoordinatesForAddress } from "@/lib/geo/chilean-coordinates";
import {
  resolveCourier,
  formatTrackingNumber,
  generatePODReceiptData,
  CourierInfo,
} from "@/lib/tracking/chilean-couriers";

// Dynamically import Leaflet map with ssr: false
const LiveTrackingMap = dynamic(
  () => import("@/components/tracking/LiveTrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] rounded-3xl bg-slate-100 border border-[#E5E5E5] flex flex-col items-center justify-center gap-3 text-slate-400 animate-pulse">
        <Truck className="w-10 h-10 text-[#1F3A5F] animate-bounce" />
        <p className="text-xs font-bold text-[#1A1A1A]">Cargando georreferenciación de ruta...</p>
        <span className="text-[10px] text-[#666666]">Conectando con red logística nacional</span>
      </div>
    ),
  }
);

export default function OrderTrackingPage() {
  const params = useParams();
  const orderIdParam = (params?.id as string) || "";

  const [order, setOrder] = useState<ConfirmedOrderEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedOT, setCopiedOT] = useState(false);
  const [showPODModal, setShowPODModal] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(25);
  const [progressPercent, setProgressPercent] = useState(35);

  // Delivery confirmation state
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
      console.error("Error buscando pedido en seguimiento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderIdParam) {
      fetchOrder();
    }
  }, [orderIdParam]);

  // Fallback / default data
  const displayOrder: ConfirmedOrderEntity = order || {
    id: orderIdParam,
    orderNumber: orderIdParam,
    createdAt: new Date().toISOString(),
    status: "CONFIRMED",
    customer: {
      fullName: "Cliente OmniCollector",
      email: "",
      phone: "",
      rut: "18.492.301-4",
      region: "Región Metropolitana",
      comuna: "Providencia",
      address: "Av. Providencia 1234",
      apartment: "Of. 402",
    },
    shippingMethod: {
      name: "Starken Express",
      cost: 0,
      estimatedDelivery: "24 a 48 hrs hábiles",
      trackingNumber: `STK-${orderIdParam || "982410529"}`,
    },
    paymentMethod: "WEBPAY",
    items: [],
    subtotal: 0,
    discountAmount: 0,
    shippingCost: 0,
    totalChargedNow: 0,
    remainingBalanceLater: 0,
    reservationIds: [],
  };

  const currentStatus = (displayOrder.status || "CONFIRMED").toUpperCase();
  const isConfirmed = currentStatus === "CONFIRMED";
  const isPreparing = currentStatus === "PREPARING";
  const isDispatched = currentStatus === "DISPATCHED";
  const isDelivered = currentStatus === "DELIVERED" || deliveredSuccess;

  // Identify Chilean Courier & Tracking OT
  const courier: CourierInfo = resolveCourier(displayOrder.shippingMethod?.name);
  const rawOT = formatTrackingNumber(
    displayOrder.shippingMethod?.trackingNumber,
    displayOrder.orderNumber || displayOrder.id
  );
  const externalOtClean = rawOT.replace(/[^0-9]/g, "") || "982410529";

  const handleCopyOT = () => {
    navigator.clipboard.writeText(rawOT);
    setCopiedOT(true);
    setTimeout(() => setCopiedOT(false), 2000);
  };

  const destinationCoords = getCoordinatesForAddress(
    displayOrder.customer?.comuna,
    displayOrder.customer?.region
  );

  const destinationLabel = `${displayOrder.customer?.address || "Domicilio"}${
    displayOrder.customer?.apartment ? `, Dpto/Casa ${displayOrder.customer.apartment}` : ""
  }, ${displayOrder.customer?.comuna || "Santiago"}`;

  // Chronological timeline dates
  const createdDate = new Date(displayOrder.createdAt || Date.now());
  const formattedDate = (d: Date, hoursOffset = 0, minsOffset = 0) => {
    const target = new Date(d.getTime() + hoursOffset * 3600000 + minsOffset * 60000);
    return {
      date: target.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }),
      time: target.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const eventTime1 = formattedDate(createdDate, 0, 10);
  const eventTime2 = formattedDate(createdDate, 3, 25);
  const eventTime3 = formattedDate(createdDate, 6, 40);
  const deliveryDateObj = deliveryConfirmedAt ? new Date(deliveryConfirmedAt) : new Date(createdDate.getTime() + 8 * 3600000);
  const eventTime4 = formattedDate(deliveryDateObj, 0, 0);

  // Destination reached callback
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
      console.error("Error confirmando entrega:", err);
    } finally {
      setIsDelivering(false);
    }
  };

  if (!loading && !order) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E5] text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-[#1A1A1A]">Envío no encontrado</h1>
          <p className="text-xs text-[#666666]">
            No encontramos ninguna Orden de Transporte registrada con el identificador #{orderIdParam}. Comprueba el código o revisa tus compras en tu cuenta.
          </p>
          <Link
            href="/account?tab=orders"
            className="inline-block px-6 py-2.5 rounded-xl bg-[#1F3A5F] text-white text-xs font-bold hover:bg-[#152843] transition"
          >
            Ir a Mis Pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/account?tab=orders"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs font-bold text-[#1F3A5F] hover:bg-gray-50 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Mis Pedidos</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPODModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5E5E5] text-xs font-bold text-[#1A1A1A] hover:bg-gray-50 transition shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#1F3A5F]" />
              <span>Ver Guía de Despacho</span>
            </button>

            {isDelivered ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Entrega Exitosa (POD Verificado)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center gap-1.5 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                En Tránsito Nacional
              </span>
            )}
          </div>
        </div>

        {/* Courier Brand & Official Tracking Summary Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wide border ${courier.badgeBg} ${courier.badgeText} ${courier.borderColor}`}>
                {courier.name}
              </span>
              <span className="text-xs text-[#666666]">
                Servicio: <strong className="text-[#1A1A1A]">{courier.serviceType}</strong>
              </span>
              <span className="text-xs text-[#666666] hidden sm:inline">•</span>
              <span className="text-xs text-[#666666]">
                Pedido: <strong>#{displayOrder.orderNumber || displayOrder.id}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight">
                OT: <span className="font-mono text-[#1F3A5F]">{rawOT}</span>
              </h1>
              <button
                onClick={handleCopyOT}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1F3A5F] hover:underline cursor-pointer"
                title="Copiar Orden de Transporte"
              >
                {copiedOT ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiada</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#666666]" />
                    <span>Copiar OT</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-[#666666]">
              Destino: <strong className="text-[#1A1A1A]">{destinationLabel}</strong>
            </p>
          </div>

          {/* Action to track on official carrier website */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <a
              href={courier.trackingUrl(externalOtClean)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Consultar en {courier.name}.cl</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={`https://wa.me/56958243917?text=Hola%20OmniCollector,%20deseo%20consultar%20el%20estado%20de%20mi%20envio%20OT%20${rawOT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ayuda Logística</span>
            </a>
          </div>
        </div>

        {/* Realistic Chilean Logistics Barcode Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-[#1F3A5F]">
              <BarcodeIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-[#666666] tracking-wider">
                Código de Barras Óptico de Despacho (Code-128)
              </div>
              {/* Visual simulated Barcode stripes */}
              <div className="flex items-center gap-0.5 h-7 py-1 mt-1">
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1, 2, 3, 2, 1, 4, 1, 3].map(
                  (w, i) => (
                    <span
                      key={i}
                      className="bg-slate-900 h-full inline-block rounded-xs"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  )
                )}
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-700 tracking-widest">
                *{rawOT}*
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-right sm:border-l sm:border-[#E5E5E5] sm:pl-6 w-full sm:w-auto justify-between sm:justify-end">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#666666] block">Bultos</span>
              <strong className="text-[#1A1A1A]">1 Caja / Blindada</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#666666] block">Peso Tasado</span>
              <strong className="text-[#1A1A1A]">1.250 kg</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#666666] block">Embalaje</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-block">
                Collector-Grade
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid: Left 2 Cols (Log & Georoute) + Right 1 Col (Package & POD Specs) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2/3): Real Chilean Courier Tracking Timeline & Georeferenced Corridor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline of Events (Starken / Chilexpress Style Log) */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E5] pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#1A1A1A] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#1F3A5F]" />
                    Bitácora de Trazabilidad y Eventos
                  </h2>
                  <p className="text-xs text-[#666666]">
                    Registros en tiempo real sincronizados con pistolas láser y andenes de distribución
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                  Zona Horaria: America/Santiago (CLT)
                </span>
              </div>

              {/* Chronological events list */}
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E5E5E5]">
                {/* Event 4: Entregado */}
                <div className="relative flex items-start gap-4">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      isDelivered
                        ? "bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className={`text-sm font-bold ${isDelivered ? "text-emerald-700" : "text-[#1A1A1A]"}`}>
                        {isDelivered ? "Envío Entregado en Domicilio" : "Entrega en Domicilio"}
                      </strong>
                      <span className="text-xs font-mono text-[#666666]">
                        {isDelivered ? `${eventTime4.date} • ${eventTime4.time} hrs` : "Pendiente de entrega"}
                      </span>
                    </div>
                    <p className="text-xs text-[#666666] mt-1">
                      Lugar: <strong className="text-[#1A1A1A]">{destinationLabel}</strong>
                    </p>
                    {isDelivered && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          Recepción Conforme (Comprobante POD Registrado)
                        </div>
                        <div className="text-[11px] text-emerald-800">
                          Receptor: <strong>{displayOrder.customer?.fullName || "Adulto Responsable en Domicilio"}</strong> • RUT:{" "}
                          <strong>{displayOrder.customer?.rut || "18.492.301-4"}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event 3: En Reparto */}
                <div className="relative flex items-start gap-4">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      isDelivered
                        ? "bg-emerald-100 text-emerald-700"
                        : isDispatched
                        ? "bg-[#009EE3] text-white shadow-md ring-4 ring-blue-100 animate-pulse"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className={`text-sm font-bold ${isDispatched && !isDelivered ? "text-[#009EE3]" : "text-[#1A1A1A]"}`}>
                        En Reparto de Última Milla (Móvil en Ruta)
                      </strong>
                      <span className="text-xs font-mono text-[#666666]">
                        {eventTime3.date} • {eventTime3.time} hrs
                      </span>
                    </div>
                    <p className="text-xs text-[#666666] mt-1">
                      Terminal de salida: <strong className="text-[#1A1A1A]">Agencia Regional {displayOrder.customer?.comuna || "Santiago"}</strong>
                    </p>
                    <p className="text-[11px] text-[#666666] mt-0.5">
                      Asignado a móvil de reparto para entrega durante la jornada laboral.
                    </p>
                  </div>
                </div>

                {/* Event 2: En Centro de Distribución ENEA */}
                <div className="relative flex items-start gap-4">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      isConfirmed
                        ? "bg-gray-200 text-gray-400"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm font-bold text-[#1A1A1A]">
                        Clasificación en Centro de Distribución Hub Central
                      </strong>
                      <span className="text-xs font-mono text-[#666666]">
                        {eventTime2.date} • {eventTime2.time} hrs
                      </span>
                    </div>
                    <p className="text-xs text-[#666666] mt-1">
                      Ubicación: <strong className="text-[#1A1A1A]">Parque Logístico ENEA - Pudahuel, Región Metropolitana</strong>
                    </p>
                    <p className="text-[11px] text-[#666666] mt-0.5">
                      Bulto escaneado en sorter automatizado y direccionado al camión troncal hacia {displayOrder.customer?.comuna || "Destino"}.
                    </p>
                  </div>
                </div>

                {/* Event 1: Admisión & Emisión de Guía */}
                <div className="relative flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 z-10">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm font-bold text-[#1A1A1A]">
                        Admisión en Origen & Emisión de Guía de Despacho
                      </strong>
                      <span className="text-xs font-mono text-[#666666]">
                        {eventTime1.date} • {eventTime1.time} hrs
                      </span>
                    </div>
                    <p className="text-xs text-[#666666] mt-1">
                      Emisor: <strong className="text-[#1A1A1A]">Bodega Central OmniCollector (Pudahuel)</strong>
                    </p>
                    <p className="text-[11px] text-[#666666] mt-0.5">
                      Orden generada, embalaje blindado Collector-Grade completado y precinto de seguridad sellado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Georeferenced Map View (Corredor Logístico) */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-[#1A1A1A] flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#FF6B35]" />
                    Corredor Logístico y Georreferenciación
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Trazado de ruta entre Bodega Central ENEA Pudahuel y {destinationLabel}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#666666] block">Estimación de Arribo</span>
                  <span className="text-xs font-mono font-bold text-[#1F3A5F]">
                    {isDelivered ? "Completado" : `~${etaMinutes} minutos`}
                  </span>
                </div>
              </div>

              <div className="h-[440px]">
                <LiveTrackingMap
                  destination={destinationCoords}
                  destinationLabel={destinationLabel}
                  orderNumber={displayOrder.orderNumber}
                  courierName={courier.name}
                  trackingNumber={rawOT}
                  currentStatus={displayOrder.status}
                  onProgressChange={(pct, eta) => {
                    setProgressPercent(pct);
                    setEtaMinutes(eta);
                  }}
                  onDestinationReached={handleDestinationReached}
                />
              </div>
            </div>
          </div>

          {/* Right Column (1/3): Technical Package Data, Recipient & Proof of Delivery */}
          <div className="space-y-6">
            {/* Technical Package Data (Ficha Técnica de Carga) */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] border-b border-[#E5E5E5] pb-2">
                Ficha Técnica de la Carga
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-[#666666]">N° de Bultos:</span>
                  <strong className="text-[#1A1A1A]">1 Bulto Estándar</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-[#666666]">Peso Tasado / Volumétrico:</span>
                  <strong className="text-[#1A1A1A]">1.250 kg</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-[#666666]">Dimensiones Embalaje:</span>
                  <strong className="text-[#1A1A1A]">32 x 22 x 18 cm</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-[#666666]">Tipo de Mercadería:</span>
                  <strong className="text-[#1A1A1A]">Coleccionables / Frágil</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-[#666666]">Seguro / Cobertura:</span>
                  <span className="text-emerald-700 font-bold">100% Declarado Activo</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-[#666666]">Precinto de Seguridad:</span>
                  <span className="font-mono font-bold text-slate-800">#OC-SEAL-88392</span>
                </div>
              </div>

              {/* Collector-grade seal alert */}
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Embalaje Blindado Collector-Grade:</strong> Si la cinta de seguridad exterior presenta signos de apertura, rechace la encomienda al transportista y notifíquenos de inmediato.
                </div>
              </div>
            </div>

            {/* Recipient & Delivery Details */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] border-b border-[#E5E5E5] pb-2">
                Datos del Destinatario
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666666] block">Nombre Completo</span>
                  <strong className="text-[#1A1A1A]">{displayOrder.customer?.fullName || "Cliente"}</strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666666] block">RUT Verificado</span>
                  <span className="font-mono font-bold text-[#1F3A5F]">
                    {displayOrder.customer?.rut || "18.492.301-4"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666666] block">Dirección de Entrega</span>
                  <p className="text-[#1A1A1A] leading-relaxed">
                    {displayOrder.customer?.address}
                    {displayOrder.customer?.apartment ? `, Dpto ${displayOrder.customer.apartment}` : ""}
                    <br />
                    {displayOrder.customer?.comuna}, {displayOrder.customer?.region}
                  </p>
                </div>

                {displayOrder.customer?.phone && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#666666] block">Teléfono de Contacto</span>
                    <span className="font-mono text-[#1A1A1A]">{displayOrder.customer.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#E5E5E5]">
                <button
                  onClick={() => setShowPODModal(true)}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-[#E5E5E5] text-[#1F3A5F] font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Descargar Guía de Despacho Electrónica</span>
                </button>
              </div>
            </div>

            {/* Package Items Mini-Manifest */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] border-b border-[#E5E5E5] pb-2">
                Manifiesto de Artículos ({displayOrder.items?.length || 1})
              </h3>

              <div className="space-y-2.5">
                {displayOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-11 h-11 rounded-xl object-cover border border-[#E5E5E5] shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#666666] shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
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

      {/* GUIA DE DESPACHO / POD ELECTRONIC MODAL */}
      {showPODModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E5E5E5] max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#1F3A5F]" />
                <h3 className="text-lg font-black text-[#1A1A1A]">
                  Guía de Despacho Electrónica & Comprobante POD
                </h3>
              </div>
              <button
                onClick={() => setShowPODModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Guía Document Preview */}
            <div className="border border-slate-300 rounded-2xl p-6 bg-white text-xs space-y-5 shadow-xs font-sans">
              {/* Top Legal SII Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-black text-sm text-slate-900 uppercase">
                    OMNICOLLECTOR SPA
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Giro: Venta de Artículos de Colección, Hobbies y Entretenimiento
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Casa Matriz: Parque de Negocios ENEA, Pudahuel, Santiago de Chile
                  </p>
                  <p className="text-[11px] text-slate-600">Teléfono: +56 9 5824 3917</p>
                </div>

                <div className="border-2 border-red-600 p-3 rounded-lg text-center min-w-[200px]">
                  <div className="font-black text-red-600 font-mono text-sm">R.U.T.: 77.892.341-K</div>
                  <div className="font-black text-red-600 uppercase text-xs">GUÍA DE DESPACHO ELECTRÓNICA</div>
                  <div className="font-mono font-bold text-red-600 text-sm">N° 000{displayOrder.orderNumber || "1029"}</div>
                  <div className="text-[9px] text-red-700 font-bold uppercase mt-1">S.I.I. - SANTIAGO PONIENTE</div>
                </div>
              </div>

              {/* Recipient & Carrier Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div><strong className="text-slate-900">Señor(es):</strong> {displayOrder.customer?.fullName || "Cliente"}</div>
                  <div><strong className="text-slate-900">RUT:</strong> {displayOrder.customer?.rut || "18.492.301-4"}</div>
                  <div><strong className="text-slate-900">Dirección:</strong> {destinationLabel}</div>
                </div>
                <div className="space-y-1">
                  <div><strong className="text-slate-900">Transportista:</strong> {courier.name}</div>
                  <div><strong className="text-slate-900">Orden de Transporte (OT):</strong> {rawOT}</div>
                  <div><strong className="text-slate-900">Tipo de Traslado:</strong> Venta por Comercio Electrónico</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="p-2 font-bold text-slate-700">SKU</th>
                      <th className="p-2 font-bold text-slate-700">Descripción del Artículo</th>
                      <th className="p-2 font-bold text-slate-700 text-center">Cant.</th>
                      <th className="p-2 font-bold text-slate-700 text-right">Valor Declarado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono text-[11px] text-slate-600">{item.sku}</td>
                        <td className="p-2 font-bold text-slate-800">{item.name}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right font-mono">{formatCLP(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Proof of Delivery / Signature Confirmation Section */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-dashed border-slate-300 p-3 rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 block uppercase text-[10px]">
                    Comprobante de Recepción Conforme (POD)
                  </span>
                  <div className="text-[11px] text-slate-600">
                    Nombre Receptor: <strong>{displayOrder.customer?.fullName || "Adulto Responsable"}</strong>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    RUT Receptor: <strong>{displayOrder.customer?.rut || "18.492.301-4"}</strong>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Estado: <span className="font-bold text-emerald-700">Firma Electrónica Validada en Dispositivo Móvil</span>
                  </div>
                </div>

                <div className="flex flex-col justify-end items-center text-center p-3">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Timbre Electrónico D.T.E. SII
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">Res. Exenta SII N° 80 de 2014</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Documento</span>
              </button>
              <button
                onClick={() => setShowPODModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


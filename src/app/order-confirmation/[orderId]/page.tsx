"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  Clock,
  ShieldCheck,
  Printer,
  ArrowRight,
  ExternalLink,
  Mail,
  MapPin,
  CreditCard,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { ConfirmedOrderEntity } from "@/lib/types/domain";
import { formatCLP } from "@/lib/utils/currency";

function OrderConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;
  const paymentIdParam = searchParams.get("payment_id") || searchParams.get("collection_id");
  const paymentStatusParam = searchParams.get("status") || searchParams.get("collection_status");

  const [order, setOrder] = useState<ConfirmedOrderEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setOrder(json.data);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#1F3A5F]/20 border-t-[#FF6B35] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#666666]">Cargando confirmación de tu compra...</p>
      </div>
    );
  }

  // Fallback demo order if refreshed after memory reset
  const displayOrder: ConfirmedOrderEntity = order || {
    id: orderId,
    orderNumber: `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
    status: "CONFIRMED",
    customer: {
      fullName: "Rodrigo Valenzuela",
      email: "r.valenzuela@gmail.com",
      phone: "+56 9 8765 4321",
      rut: "18.420.915-K",
      region: "Región Metropolitana",
      comuna: "Providencia",
      address: "Av. Providencia 1234",
      apartment: "Depto 501",
    },
    shippingMethod: {
      name: "Starken Express (1 a 2 días hábiles)",
      cost: 0,
      estimatedDelivery: "2 días hábiles",
      trackingNumber: "STK-CHL-88291048",
    },
    paymentMethod: "WEBPAY",
    items: [
      {
        productId: "prod-fig-01",
        sku: "FIG-MAKIMA-17",
        name: "Makima 1/7 Scale PVC Figure (Chainsaw Man)",
        quantity: 1,
        unitPrice: 249990,
        isPreOrder: true,
        isPartialDeposit: true,
        unitDeposit: 49998,
        remainingBalancePerUnit: 199992,
        imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
      },
    ],
    subtotal: 49998,
    discountAmount: 5000,
    couponCode: "COLECCIONISTA5K",
    shippingCost: 0,
    totalChargedNow: 44998,
    remainingBalanceLater: 199992,
    reservationIds: ["res-demo-01"],
  };

  const trackingNumber = displayOrder.shippingMethod.trackingNumber;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* 1. Header de Confirmación */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-[#2E9E5B]/15 border-2 border-[#2E9E5B] text-[#2E9E5B] flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#2E9E5B] uppercase tracking-wider">
            ¡Pago Confirmado & Orden Generada!
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] tracking-tight mt-1">
            ¡Gracias por tu compra, {displayOrder.customer.fullName.split(" ")[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-2 leading-relaxed">
            Tu pedido ha sido procesado con éxito. Hemos reservado tu producto en bodega y te enviamos la boleta electrónica y comprobante a{" "}
            <strong className="text-[#1A1A1A]">{displayOrder.customer.email}</strong>.
          </p>
        </div>

        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm">
          <span className="text-xs text-[#666666]">Número de Orden:</span>
          <span className="font-mono font-black text-[#FF6B35] text-sm">{displayOrder.orderNumber}</span>
        </div>
      </div>

      {/* 2. Stepper de Seguimiento Logístico & Preparación */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E5E5E5] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#1A1A1A]">Estado de Preparación & Logística</h2>
            <p className="text-xs text-[#666666]">
              Transportista: <strong className="text-[#1A1A1A]">{displayOrder.shippingMethod.name}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#F7F7F5] px-3 py-1.5 rounded-xl border border-[#E5E5E5] text-xs">
            <span className="text-[#666666]">N° de Seguimiento:</span>
            <span className="font-mono font-bold text-[#FF6B35]">{trackingNumber}</span>
          </div>
        </div>

        {/* 4 Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-[#2E9E5B]/40 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#2E9E5B]/20 text-[#2E9E5B] flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <h4 className="text-xs font-bold text-[#2E9E5B]">1. Pedido Confirmado</h4>
            <p className="text-[11px] text-[#666666]">Pago verificado y stock descontado del inventario.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#FF6B35]/60 space-y-2 relative shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 text-[#FF6B35] flex items-center justify-center font-bold text-xs animate-pulse">
              <Package className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-[#1A1A1A]">2. Empaque Blindado Mint</h4>
            <p className="text-[11px] text-[#666666]">En preparación: triple cartón corrugado y esquineros protectores.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-2 opacity-75">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5E5] text-[#666666] flex items-center justify-center font-bold text-xs">
              <Truck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-[#1A1A1A]">3. En Camino con Courier</h4>
            <p className="text-[11px] text-[#666666]">Despacho en ruta hacia {displayOrder.customer.comuna}.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-2 opacity-75">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5E5] text-[#666666] flex items-center justify-center font-bold text-xs">
              🏠
            </div>
            <h4 className="text-xs font-bold text-[#1A1A1A]">4. Entregado en Domicilio</h4>
            <p className="text-[11px] text-[#666666]">Recepción en mano en condición impecable garantizada.</p>
          </div>
        </div>
      </div>

      {/* 3. Desglose del Pedido y Datos del Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Items Comprados (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-5 shadow-sm">
          <h3 className="font-bold text-base text-[#1A1A1A] border-b border-[#E5E5E5] pb-3">
            Artículos en esta Orden ({displayOrder.items.length})
          </h3>

          <div className="space-y-4">
            {displayOrder.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-xl border border-[#E5E5E5] shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-[#FF6B35] font-semibold">{item.sku}</span>
                    {item.isPreOrder && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1F3A5F] text-white font-bold">
                        PREVENTA ({Math.round((item.unitDeposit / item.unitPrice) * 100)}%)
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-[#1A1A1A] mt-0.5 line-clamp-1">{item.name}</p>
                  <p className="text-[11px] text-[#666666] mt-0.5">
                    Cantidad: {item.quantity} • Precio unitario: {formatCLP(item.unitPrice)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-[#666666]">Pagado hoy:</div>
                  <div className="font-mono font-black text-[#FF6B35] text-sm">
                    {formatCLP(item.unitDeposit * item.quantity)}
                  </div>
                  {item.isPartialDeposit && (
                    <div className="text-[10px] text-[#666666] font-mono">
                      +{formatCLP(item.remainingBalancePerUnit * item.quantity)} al arribo
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals Table */}
          <div className="pt-4 border-t border-[#E5E5E5] space-y-2 text-xs">
            <div className="flex justify-between text-[#666666]">
              <span>Subtotal artículos:</span>
              <span className="font-mono text-[#1A1A1A] font-semibold">{formatCLP(displayOrder.subtotal)}</span>
            </div>

            {displayOrder.discountAmount > 0 && (
              <div className="flex justify-between text-[#2E9E5B] font-medium">
                <span>Descuento cupón ({displayOrder.couponCode || "PROMO"}):</span>
                <span className="font-mono font-bold">-{formatCLP(displayOrder.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-[#666666]">
              <span>Costo de despacho:</span>
              <span className="font-mono text-[#1A1A1A] font-semibold">
                {displayOrder.shippingCost === 0 ? (
                  <span className="text-[#2E9E5B] font-bold">GRATIS</span>
                ) : (
                  formatCLP(displayOrder.shippingCost)
                )}
              </span>
            </div>

            {displayOrder.remainingBalanceLater > 0 && (
              <div className="flex justify-between text-[#1F3A5F] bg-[#1F3A5F]/5 px-3 py-1.5 rounded-xl border border-[#1F3A5F]/20">
                <span>Saldo diferido (Al arribar a bodega en Santiago):</span>
                <span className="font-mono font-bold text-[#FF6B35]">
                  +{formatCLP(displayOrder.remainingBalanceLater)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-3 border-t border-[#E5E5E5] text-base">
              <span className="font-black text-[#1A1A1A]">Total Pagado Hoy:</span>
              <span className="font-mono font-black text-2xl text-[#2E9E5B]">
                {formatCLP(displayOrder.totalChargedNow)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Datos de Despacho & Atención (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-4 shadow-sm text-xs">
            <h3 className="font-bold text-base text-[#1A1A1A] border-b border-[#E5E5E5] pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6B35]" /> Dirección de Despacho
            </h3>

            <div className="space-y-2 text-[#666666]">
              <p>
                <strong className="text-[#1A1A1A]">Destinatario:</strong> {displayOrder.customer.fullName}
              </p>
              <p>
                <strong className="text-[#1A1A1A]">RUT:</strong> {displayOrder.customer.rut || "No especificado"}
              </p>
              <p>
                <strong className="text-[#1A1A1A]">Dirección:</strong> {displayOrder.customer.address}{" "}
                {displayOrder.customer.apartment && `(${displayOrder.customer.apartment})`}
              </p>
              <p>
                <strong className="text-[#1A1A1A]">Comuna / Región:</strong> {displayOrder.customer.comuna},{" "}
                {displayOrder.customer.region}
              </p>
              <p>
                <strong className="text-[#1A1A1A]">Teléfono de Contacto:</strong> {displayOrder.customer.phone}
              </p>
            </div>

            <div className="pt-3 border-t border-[#E5E5E5]">
              <div className="flex items-center gap-2 text-[#2E9E5B] font-bold">
                <CreditCard className="w-4 h-4" />
                <span>
                  Método de Pago:{" "}
                  {displayOrder.paymentMethod === "MERCADO_PAGO"
                    ? "Mercado Pago (Tarjeta / Redcompra)"
                    : displayOrder.paymentMethod === "FLOW"
                    ? "Flow.cl (Webpay / Tarjetas)"
                    : displayOrder.paymentMethod === "WEBPAY"
                    ? "Webpay Plus Transbank"
                    : "Transferencia Bancaria"}
                </span>
              </div>
              {paymentIdParam && (
                <p className="text-[11px] text-[#666666] mt-1 font-mono">
                  ID Transacción Pasarela: <strong className="text-[#1A1A1A]">{paymentIdParam}</strong>
                </p>
              )}
              <p className="text-[11px] text-[#666666] mt-1">Transacción procesada y boleta electrónica timbrada por el SII.</p>
            </div>
          </div>

          {/* WhatsApp Support Direct Box */}
          <div className="p-5 rounded-3xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-3">
            <div className="flex items-center gap-2 text-[#1A1A1A] font-bold text-sm">
              <MessageCircle className="w-5 h-5 text-[#2E9E5B]" />
              <span>¿Tienes alguna duda sobre tu orden?</span>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed">
              Nuestro equipo de coleccionistas te atiende directamente por WhatsApp de Lunes a Viernes de 09:00 a 19:00 hrs.
            </p>
            <a
              href={`https://wa.me/56987654321?text=Hola%20OmniCollector,%20tengo%20una%20consulta%20sobre%20mi%20orden%20${displayOrder.orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E9E5B] hover:bg-[#25854c] text-white font-bold text-xs transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4" /> Hablar por WhatsApp
            </a>
          </div>

          {/* Live Map Tracking Button */}
          <Link
            href={`/tracking/${displayOrder.orderNumber || displayOrder.id}`}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#009EE3] hover:bg-[#0087c2] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-98"
          >
            <Truck className="w-4 h-4 text-white" />
            <span>Ver Seguimiento en Vivo en Mapa (GPS)</span>
          </Link>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 rounded-xl bg-[#1F3A5F] hover:bg-[#2D5180] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Imprimir Boleta
            </button>

            <Link
              href="/catalog"
              className="flex-1 py-3 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-black text-xs uppercase tracking-wider transition text-center flex items-center justify-center gap-1 shadow-md hover:shadow-[#FF6B35]/25"
            >
              <span>Volver a la Tienda</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#004E72] border-t-[#FF6E42] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#9bb5c2]">Cargando confirmación...</p>
        </div>
      }
    >
      <OrderConfirmationContent />
    </React.Suspense>
  );
}

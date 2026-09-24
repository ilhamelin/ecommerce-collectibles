"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Tag,
  Bookmark,
  BookmarkCheck,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { formatCLP } from "@/lib/utils/currency";
import { toast } from "@/lib/store/toastStore";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    savedForLater,
    appliedCoupon,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    toggleDepositMode,
    moveToWishlist,
    moveToCart,
    removeSavedItem,
    applyCoupon,
    removeCoupon,
    clearCart,
    getTotals,
  } = useCartStore();

  const totals = getTotals();
  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{
    orderNumber: string;
    totalChargedNow: number;
    remainingLater: number;
    expiresAt: string;
  } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // 15-minute reservation countdown timer for unique collector items
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  React.useEffect(() => {
    if (!isOpen || items.length === 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, items.length]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    setCouponFeedback(res);
    if (res.success) {
      setCouponInput("");
      toast.success("¡Cupón Aplicado!", res.message);
    } else {
      toast.error("Cupón no válido", res.message);
    }
  };

  const handleRemoveItem = (id: string, name: string) => {
    removeItem(id);
    toast.info("Producto retirado", `${name} fue eliminado del carro.`);
  };

  const handleMoveToWishlist = (id: string, name: string) => {
    moveToWishlist(id);
    toast.collector("Guardado para más tarde", `${name} se guardó en tu lista.`);
  };

  const handleGoToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  const handleQuickCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);
    setCheckoutError(null);
    setCheckoutResult(null);

    const idempotencyKey = `idem-clp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const cartSessionId = `session-clp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          cartSessionId,
          userId: "user-chile-collector",
          paymentMethod: "WEBPAY",
          idempotencyKey,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            isPartialDeposit: i.isPartialDeposit,
            customDepositPercent: i.isPartialDeposit ? i.depositPercent : undefined,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Error al procesar el checkout");
      }

      setCheckoutResult({
        orderNumber: data.data.orderNumber,
        totalChargedNow: data.data.totalAmountChargedNow,
        remainingLater: data.data.remainingBalanceLater,
        expiresAt: data.data.expiresAt,
      });

      clearCart();
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Error inesperado durante la reserva.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F7F7F5] border-l border-[#E5E5E5] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-[#E5E5E5] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2 text-[#1A1A1A]">
              <div className="p-1.5 rounded-lg bg-[#1F3A5F]/10 text-[#1F3A5F]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold">Carrito de Compras</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F3A5F] text-white font-mono">
                {totals.totalItemCount}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-lg text-[#666666] hover:text-[#1A1A1A] hover:bg-slate-100 transition"
              aria-label="Cerrar Carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Success Message */}
            {checkoutResult && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-[#2E9E5B]/40 text-[#1A1A1A] space-y-3 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-sm text-[#2E9E5B]">
                  <CheckCircle2 className="w-5 h-5" />
                  ¡Reserva Exitosa en Webpay Plus!
                </div>
                <p className="text-xs text-[#1A1A1A]/90 leading-relaxed">
                  ¡Tu orden <strong>{checkoutResult.orderNumber}</strong> ha sido confirmada con éxito! Tu stock está reservado y recibirás el comprobante de compra.
                </p>

                <div className="bg-white p-3 rounded-xl space-y-1.5 text-xs font-mono border border-[#E5E5E5]">
                  <div className="flex justify-between">
                    <span className="text-[#666666]">Total Pagado Hoy:</span>
                    <span className="font-bold text-[#FF6B35]">
                      {formatCLP(checkoutResult.totalChargedNow)}
                    </span>
                  </div>
                  {checkoutResult.remainingLater > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#666666]">Saldo al Arribar a Chile:</span>
                      <span className="font-bold text-[#1A1A1A]">
                        {formatCLP(checkoutResult.remainingLater)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-[#666666] pt-1 border-t border-[#E5E5E5]">
                    <span>Estado del Pedido:</span>
                    <span className="text-[#2E9E5B] font-bold">Confirmado & Asegurado</span>
                  </div>
                </div>

                <button
                  onClick={() => setCheckoutResult(null)}
                  className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#E85A24] text-white text-xs font-bold rounded-xl transition shadow"
                >
                  Continuar Comprando
                </button>
              </div>
            )}

            {/* Error Message */}
            {checkoutError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-[#D64545]/40 text-[#D64545] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#D64545] flex-shrink-0 mt-0.5" />
                <div className="leading-snug">{checkoutError}</div>
              </div>
            )}

            {/* Empty State */}
            {items.length === 0 && !checkoutResult && (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="p-4 rounded-full bg-white border border-[#E5E5E5] text-[#666666] shadow-sm">
                  <ShoppingBag className="w-8 h-8 opacity-50" />
                </div>
                <div className="text-[#1A1A1A] font-semibold text-sm">Tu carrito está vacío</div>
                <p className="text-xs text-[#666666] max-w-xs">
                  Revisa nuestro catálogo con figuras de Japón, videojuegos físicos y bundles con ahorro real.
                </p>
              </div>
            )}

            {/* Live TTL Stock Reservation Countdown Banner */}
            {items.length > 0 && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 flex items-center justify-between text-xs shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B35] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6B35]"></span>
                  </span>
                  <div>
                    <span className="text-[11px] font-black text-[#1A1A1A] block">
                      Stock Reservado en Carro:
                    </span>
                    <span className="text-[10px] text-[#666666]">
                      Cupo bloqueado exclusivamente para ti
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono font-black text-[#FF6B35] bg-white px-2.5 py-1 rounded-lg border border-orange-200 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              </div>
            )}

            {/* Collector Packaging Trust Pill */}
            {items.length > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex items-center justify-between text-[11px] text-emerald-900 shadow-2xs">
                <span className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Empaque Blindado 4 Capas Incluido
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  Caja Mint 10/10
                </span>
              </div>
            )}

            {/* Free Shipping Progress Indicator */}
            {items.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-[#1A1A1A]">
                    <Truck className="w-4 h-4 text-[#FF6B35]" />
                    {totals.subtotal >= 80000 ? (
                      <span className="text-[#2E9E5B] font-extrabold">¡Despacho 100% Bonificado a todo Chile! 🎉</span>
                    ) : (
                      <span>
                        Faltan <strong className="text-[#FF6B35] font-mono">{formatCLP(80000 - totals.subtotal)}</strong> para envío gratis
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[10px] text-[#666666]">
                    Meta: $80.000
                  </span>
                </div>
                <div className="w-full bg-[#E5E5E5] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      totals.subtotal >= 80000 ? "bg-[#2E9E5B]" : "bg-gradient-to-r from-[#FF6B35] to-[#FFA07A]"
                    }`}
                    style={{ width: `${Math.min(100, Math.round((totals.subtotal / 80000) * 100))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Active Items */}
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-[#FF6B35] font-semibold">{item.sku}</span>
                      {item.isPreOrder && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1F3A5F] text-white font-bold">
                          PREVENTA
                        </span>
                      )}
                      {item.type === "BUNDLE" && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1F3A5F] text-white font-bold">
                          PACK
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-[#1A1A1A] text-sm mt-1 line-clamp-1">{item.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveToWishlist(item.id, item.name)}
                      className="text-[#666666] hover:text-[#FF6B35] transition p-1"
                      title="Guardar para después"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id, item.name)}
                      className="text-[#666666] hover:text-[#D64545] transition p-1"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Pre-order Deposit Toggle */}
                {item.isPreOrder && (
                  <div className="p-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#666666] block">Modalidad de reserva:</span>
                      <span className="font-bold text-[#1A1A1A] text-xs">
                        {item.isPartialDeposit ? "Pie 20% en CLP" : "Pago Total 100%"}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleDepositMode(item.id)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-[#1F3A5F] hover:bg-[#FF6B35] text-white font-semibold transition"
                    >
                      Cambiar a {item.isPartialDeposit ? "100%" : "20%"}
                    </button>
                  </div>
                )}

                {/* Price & Quantity Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-[#E5E5E5]">
                  <div className="flex items-center gap-2 bg-[#F7F7F5] px-2 py-1 rounded-xl border border-[#E5E5E5]">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="text-[#666666] hover:text-[#1A1A1A] p-0.5"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-[#1A1A1A] px-1.5 text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="text-[#666666] hover:text-[#1A1A1A] p-0.5"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-[#666666]">Pagas hoy:</div>
                    <div className="font-mono font-black text-[#FF6B35] text-sm">
                      {formatCLP((item.isPartialDeposit ? item.unitDeposit : item.unitPrice) * item.quantity)}
                    </div>
                    {item.isPartialDeposit && (
                      <div className="text-[10px] text-[#666666] font-mono">
                        + {formatCLP(item.remainingBalancePerUnit * item.quantity)} al arribo
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Saved For Later / Wishlist Section */}
            {savedForLater.length > 0 && (
              <div className="pt-4 border-t border-[#E5E5E5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                    <BookmarkCheck className="w-3.5 h-3.5 text-[#FF6B35]" /> Guardados para después ({savedForLater.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {savedForLater.map((sItem) => (
                    <div
                      key={sItem.id}
                      className="p-3 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-between gap-3 text-xs shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#1A1A1A] truncate">{sItem.name}</p>
                        <p className="text-[10px] font-mono text-[#FF6B35]">{formatCLP(sItem.unitPrice)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => moveToCart(sItem.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#1F3A5F] hover:bg-[#FF6B35] text-white text-[11px] font-bold transition"
                        >
                          Mover al carrito
                        </button>
                        <button
                          onClick={() => removeSavedItem(sItem.id)}
                          className="text-[#666666] hover:text-[#D64545] p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cupones de Descuento */}
            {items.length > 0 && (
              <div className="pt-2 border-t border-[#E5E5E5] space-y-2">
                <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#FF6B35]" /> Cupón de Descuento
                </label>

                {appliedCoupon ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-[#2E9E5B]/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#2E9E5B] block">{appliedCoupon.code}</span>
                      <span className="text-[10px] text-[#666666]">{appliedCoupon.description}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-[11px] text-[#D64545] hover:text-red-700 font-bold ml-2 underline"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: COLECCIONISTA5K"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] uppercase placeholder:normal-case placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#FF6B35] text-white font-bold text-xs transition shadow-sm"
                    >
                      Aplicar
                    </button>
                  </form>
                )}

                {couponFeedback && (
                  <p
                    className={`text-[11px] ${
                      couponFeedback.success ? "text-[#2E9E5B]" : "text-[#D64545]"
                    }`}
                  >
                    {couponFeedback.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#E5E5E5] bg-white space-y-4 shadow-sm">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#666666]">
                  <span>Subtotal productos:</span>
                  <span className="font-mono text-[#1A1A1A] font-semibold">{formatCLP(totals.subtotal)}</span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-[#2E9E5B] font-medium">
                    <span>Descuento cupón ({appliedCoupon?.code}):</span>
                    <span className="font-mono font-bold">-{formatCLP(totals.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#666666]">
                  <span>Envío estimado:</span>
                  <span className="font-mono text-[#1A1A1A] font-semibold">
                    {totals.isFreeShipping ? (
                      <span className="text-[#2E9E5B] font-bold">GRATIS</span>
                    ) : (
                      formatCLP(totals.shippingFee)
                    )}
                  </span>
                </div>

                {totals.totalDeferredDueLater > 0 && (
                  <div className="flex justify-between text-[#1F3A5F] font-medium bg-[#1F3A5F]/5 px-2.5 py-1 rounded-lg border border-[#1F3A5F]/20">
                    <span>Saldo diferido (Al arribar a bodega):</span>
                    <span className="font-mono font-bold text-[#FF6B35]">
                      +{formatCLP(totals.totalDeferredDueLater)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-[#E5E5E5] text-sm">
                  <span className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#FF6B35]" />
                    Total a Pagar Hoy:
                  </span>
                  <span className="font-mono font-black text-[#FF6B35] text-xl">
                    {formatCLP(totals.totalDueToday + (totals.isFreeShipping ? 0 : totals.shippingFee))}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#666666] flex items-center gap-1.5 bg-[#F7F7F5] p-2.5 rounded-xl border border-[#E5E5E5]">
                <Clock className="w-3.5 h-3.5 text-[#FF6B35] flex-shrink-0" />
                <span>Tu stock queda reservado durante 15 minutos para que completes tu pago seguro.</span>
              </div>

              <div className="space-y-2">
                {/* Botón Principal: Ir al Checkout guiado */}
                <button
                  onClick={handleGoToCheckout}
                  className="w-full py-3.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B35]/25"
                >
                  <span>Iniciar Compra / Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Botón Secundario: Reserva Rápida Webpay */}
                <button
                  onClick={handleQuickCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#2D5180] text-white font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {isCheckingOut ? (
                    <>Procesando reserva rápida...</>
                  ) : (
                    <>Pagar Rápido con Webpay (1-Click)</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

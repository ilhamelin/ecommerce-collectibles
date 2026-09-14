"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Check,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  Flame,
} from "lucide-react";
import { ProductDomainEntity } from "@/lib/types/domain";
import { useCartStore } from "@/lib/store/cartStore";
import { formatCLP } from "@/lib/utils/currency";

interface BundleItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  type: string;
  platform?: string | null;
  stockAvailable: number;
  isMain?: boolean;
}

interface SmartBundleData {
  name: string;
  pitch: string;
  discountPercent: number;
  originalTotalPrice: number;
  discountAmountClp: number;
  bundleTotalPrice: number;
  items: BundleItem[];
}

interface SmartBundleCardProps {
  currentProduct: ProductDomainEntity;
}

export function SmartBundleCard({ currentProduct }: SmartBundleCardProps) {
  const [bundle, setBundle] = useState<SmartBundleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdded, setIsAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  // Fetch smart bundle from API
  useEffect(() => {
    let isMounted = true;

    async function loadBundle() {
      setLoading(true);
      try {
        const res = await fetch("/api/catalog/smart-bundle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: currentProduct.id,
            sku: currentProduct.sku,
          }),
        });
        const data = await res.json();
        if (isMounted && data.success && data.bundle && data.bundle.items.length > 1) {
          setBundle(data.bundle);
          setSelectedIds(data.bundle.items.map((i: BundleItem) => i.id));
        }
      } catch (err) {
        console.error("Error loading smart bundle:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (currentProduct?.id) {
      loadBundle();
    }

    return () => {
      isMounted = false;
    };
  }, [currentProduct.id, currentProduct.sku]);

  // Toggle item selection
  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        // Keep at least one item selected
        if (prev.length === 1) return prev;
        return prev.filter((itemId) => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Compute live prices based on checked items
  const { subtotal, discount, finalTotal, savings } = useMemo(() => {
    if (!bundle) return { subtotal: 0, discount: 0, finalTotal: 0, savings: 0 };

    const selectedItems = bundle.items.filter((item) => selectedIds.includes(item.id));
    const rawSubtotal = selectedItems.reduce((acc, item) => acc + item.price, 0);

    // Apply bundle discount only if 2 or more items are selected
    const appliesDiscount = selectedItems.length >= 2;
    const discountAmt = appliesDiscount
      ? Math.round(rawSubtotal * (bundle.discountPercent / 100))
      : 0;
    const total = rawSubtotal - discountAmt;

    return {
      subtotal: rawSubtotal,
      discount: discountAmt,
      finalTotal: total,
      savings: discountAmt,
    };
  }, [bundle, selectedIds]);

  // Add all selected bundle items to cart
  const handleAddBundleToCart = () => {
    if (!bundle) return;

    const selectedItems = bundle.items.filter((item) => selectedIds.includes(item.id));
    const appliesDiscount = selectedItems.length >= 2;

    selectedItems.forEach((item) => {
      // Calculate effective unit price with the combo discount proportionally
      const effectiveUnitPrice = appliesDiscount
        ? Math.round(item.price * (1 - bundle.discountPercent / 100))
        : item.price;

      addItem({
        productId: item.id,
        sku: item.sku,
        name: item.name,
        type: item.type as any,
        quantity: 1,
        unitPrice: effectiveUnitPrice,
        unitCost: item.price,
        isPreOrder: false,
        isPartialDeposit: false,
        depositPercent: 0,
        badge: appliesDiscount ? `Combo -${bundle.discountPercent}%` : undefined,
        imageUrl: item.images && item.images[0] ? item.images[0] : undefined,
        metadataSummary: item.platform || undefined,
      });
    });

    setIsAdded(true);
    openCart();
    setTimeout(() => setIsAdded(false), 3000);
  };

  if (loading || !bundle || bundle.items.length < 2) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0F1D30] via-[#16263B] to-[#0D1826] text-white p-6 sm:p-8 shadow-xl border border-slate-750 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-750 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase bg-[#FF6B35] text-white px-2.5 py-0.5 rounded-full shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Bundle Inteligente Sugerido por IA
            </span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
              {bundle.discountPercent}% OFF Combo
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {bundle.name}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            {bundle.pitch}
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Garantía Oficial de Entrega</span>
        </div>
      </div>

      {/* Interactive Products Row */}
      <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
        {bundle.items.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <React.Fragment key={item.id}>
              {/* Product Card Component */}
              <div
                onClick={() => handleToggleItem(item.id)}
                className={`w-full md:flex-1 p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center gap-3.5 relative ${
                  isSelected
                    ? "bg-[#142334] border-[#FF6B35]/80 shadow-[0_4px_20px_rgba(255,107,53,0.15)] ring-1 ring-[#FF6B35]/40"
                    : "bg-[#0B1520] border-slate-800 opacity-60 hover:opacity-90"
                }`}
              >
                {/* Custom Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "bg-[#FF6B35] text-white"
                      : "border-2 border-slate-600 bg-slate-900"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                {/* Product Thumbnail */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/5 border border-slate-700 shrink-0">
                  {item.images && item.images[0] ? (
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      🎮
                    </div>
                  )}
                  {item.isMain && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-center font-bold text-amber-300 py-0.5">
                      Este producto
                    </span>
                  )}
                </div>

                {/* Product Meta */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {item.platform && (
                      <span className="text-[9px] font-black bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-800">
                        {item.platform}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {item.sku}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug" title={item.name}>
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#FF6B35]">
                      {formatCLP(item.price)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.stockAvailable > 0 ? `${item.stockAvailable} disp.` : "Agotado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plus separator icon */}
              {index < bundle.items.length - 1 && (
                <div className="w-8 h-8 rounded-full bg-white/10 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                  <Plus className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Pricing & 1-Click Buy Action Box */}
      <div className="bg-[#0A121A] rounded-xl p-4 sm:p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Price Breakdown */}
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs text-slate-400 line-through">
              {formatCLP(subtotal)}
            </span>
            {savings > 0 && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-800 px-2 py-0.5 rounded-md">
                Ahorras {formatCLP(savings)} ({bundle.discountPercent}% OFF)
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-center sm:justify-start gap-2">
            <span className="text-xs text-slate-400">Total por el combo:</span>
            <span className="text-2xl font-black text-[#FF6B35] font-mono tracking-tight">
              {formatCLP(finalTotal)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {selectedIds.length} {selectedIds.length === 1 ? "artículo seleccionado" : "artículos en el bundle"} • Despacho a todo Chile
          </p>
        </div>

        {/* 1-Click Buy Button */}
        <button
          type="button"
          onClick={handleAddBundleToCart}
          disabled={selectedIds.length === 0}
          className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
            isAdded
              ? "bg-emerald-600 text-white"
              : "bg-gradient-to-r from-[#FF6B35] to-[#E85D25] hover:from-[#E85D25] hover:to-[#D94F1A] text-white hover:scale-[1.02] active:scale-98"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" />
              <span>¡Bundle Agregado al Carrito!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>
                Agregar Bundle al Carrito ({selectedIds.length}{" "}
                {selectedIds.length === 1 ? "producto" : "productos"})
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

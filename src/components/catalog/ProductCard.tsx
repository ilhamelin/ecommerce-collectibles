"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Layers,
  Trophy,
  Gamepad2,
  ShoppingBag,
  ArrowRight,
  Check,
  ShieldCheck,
  Heart,
} from "lucide-react";
import { ProductDomainEntity } from "@/lib/types/domain";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { formatCLP, formatCLPShort } from "@/lib/utils/currency";
import { analytics } from "@/lib/services/AnalyticsTracker";

interface ProductCardProps {
  product: ProductDomainEntity & {
    calculatedAvailableStock?: number;
    aggregateMarginPercent?: number;
    nominalSumOfItems?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { toggleWishlist, isProductWishlisted } = useAuthStore();
  const [justAdded, setJustAdded] = useState(false);
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);

  const trackClick = () => {
    analytics.trackProductClick({
      sku: product.sku,
      name: product.name,
      category: product.type,
      price: product.price,
    });
  };

  const isLiked = isProductWishlisted(product.id);

  const isPreOrder = product.isPreOrder;
  const isBundle = product.type === "BUNDLE";
  const isFigure = product.type === "FIGURE";
  const isCollectible = product.type === "COLLECTIBLE";
  const isGame = product.type === "VIDEO_GAME";

  const slug = product.sku.toLowerCase();

  const availableUnits = isBundle
    ? product.calculatedAvailableStock ?? 0
    : Math.max(0, product.stockAvailable - product.stockReserved);

  // Deposit calculation in CLP
  const depositPercent = product.figureMetadata?.minimumDepositPercent ?? 0.2;
  const depositAmount = Math.round(product.price * depositPercent);
  const remainingBalance = Math.round(product.price - depositAmount);

  // Nominal savings for bundles
  const nominalSavings =
    isBundle && product.nominalSumOfItems
      ? Math.round(product.nominalSumOfItems - product.price)
      : 0;

  const defaultFallbackImage =
    product.type === "FIGURE"
      ? "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80"
      : product.type === "COLLECTIBLE"
      ? "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800&auto=format&fit=crop&q=80"
      : product.type === "CONSOLE"
      ? "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80"
      : product.type === "ACCESSORY"
      ? "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80"
      : product.type === "BUNDLE"
      ? "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80";

  const displayImage =
    product.imageUrl ||
    (product.images && product.images.length > 0 ? product.images[0] : null);

  const finalImage = displayImage || defaultFallbackImage;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const res = toggleWishlist(product.id);
    setWishlistToast(res.message);
    setTimeout(() => setWishlistToast(null), 1800);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    trackClick();

    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      type: product.type,
      quantity: 1,
      unitPrice: product.price,
      unitCost: product.costPrice,
      isPreOrder: Boolean(product.isPreOrder),
      isPartialDeposit: Boolean(product.isPreOrder),
      depositPercent: isPreOrder ? depositPercent : 1.0,
      badge: isBundle ? "Bundle Compuesto" : isPreOrder ? "Preventa" : "En Stock",
      imageUrl: finalImage,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="relative group rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#FF6B35]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl hover:shadow-[#1F3A5F]/10">
      {/* Ephemeral Toast Feedback */}
      {wishlistToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-[#FF6B35] text-white text-[10px] font-black tracking-wide shadow-xl pointer-events-none whitespace-nowrap animate-bounce">
          {wishlistToast}
        </div>
      )}

      <div>
        {/* Product Image Cover (Full Uncropped Display) */}
        <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-white sm:bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-center p-3">
          <img
            src={finalImage}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
          {isCollectible && (
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/15 via-amber-300/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-color-dodge" />
          )}
          
          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
            <span className="text-[10px] font-mono font-bold text-[#1A1A1A] bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#E5E5E5] shadow-xs">
              {product.sku}
            </span>
            {isPreOrder && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1F3A5F] text-white border border-[#1F3A5F] flex items-center gap-1 shadow-sm">
                <Clock className="w-3 h-3 text-[#FF6B35]" /> PREVENTA ({Math.round(depositPercent * 100)}%)
              </span>
            )}
            {isBundle && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1F3A5F] text-white border border-[#1F3A5F] flex items-center gap-1 shadow-sm">
                <Layers className="w-3 h-3 text-[#FF6B35]" /> BUNDLE
              </span>
            )}
            {isCollectible && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF6B35] text-white border border-[#FF6B35] flex items-center gap-1 shadow-sm uppercase tracking-tight">
                <Trophy className="w-3 h-3 shrink-0" />
                {(() => {
                  const meta = product.collectibleMetadata;
                  const auth = meta?.authenticationBody || "PSA";
                  const cond = meta?.condition;
                  const nameUpper = (product.name || "").toUpperCase();
                  const skuUpper = (product.sku || "").toUpperCase();

                  if (cond === "GEM_MINT_10" || nameUpper.includes("PSA 10") || skuUpper.includes("PSA10") || nameUpper.includes("GEM MINT 10")) {
                    return `${auth} 10 GEM MINT`;
                  }
                  if (cond === "MINT_9" || nameUpper.includes("PSA 9") || skuUpper.includes("PSA9") || nameUpper.includes("MINT 9")) {
                    return `${auth} 9 MINT`;
                  }
                  if (cond === "NEAR_MINT_8" || nameUpper.includes("PSA 8") || nameUpper.includes("NM 8")) {
                    return `${auth} 8 NM`;
                  }
                  if (nameUpper.includes("CGC 8.5") || skuUpper.includes("CGC")) {
                    return "CGC 8.5 NM+";
                  }
                  if (nameUpper.includes("BGS 9.5") || skuUpper.includes("BGS")) {
                    return "BGS 9.5 GEM";
                  }
                  if (cond) {
                    return `${auth} ${cond.replace(/_/g, " ")}`;
                  }
                  return `${auth} CERTIFICADO`;
                })()}
              </span>
            )}
            {!isPreOrder && !isBundle && !isCollectible && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1F3A5F] text-white border border-[#1F3A5F] flex items-center gap-1 shadow-sm">
                {product.customCategoryLabel || (isFigure ? (product.figureMetadata?.scale || "FIGURA") : isGame ? (product.gameMetadata?.platform || "VIDEOJUEGO") : "OFICIAL")}
              </span>
            )}
          </div>

          {/* Floating Heart Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={isLiked ? "Quitar de favoritos" : "Guardar en favoritos"}
            title={isLiked ? "Quitar de favoritos" : "Guardar en favoritos"}
            className={`absolute bottom-2.5 right-2.5 z-20 p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-md border ${
              isLiked
                ? "bg-[#FF6B35] border-[#FF6B35] text-white scale-105"
                : "bg-white/90 border-[#E5E5E5] text-[#666666] hover:text-[#FF6B35] hover:border-[#FF6B35] hover:scale-105"
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-200 ${
                isLiked ? "fill-white text-white" : "text-current"
              }`}
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-5 space-y-2.5">
          <Link href={`/product/${slug}`} onClick={trackClick} className="block group-hover:text-[#FF6B35] transition">
            <h3 className="font-bold text-[#1A1A1A] text-base leading-snug line-clamp-2">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Domain Metadata Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {product.gameMetadata && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-[#F7F7F5] text-[#1F3A5F] font-medium border border-[#E5E5E5]">
                {product.gameMetadata.platform} • {product.gameMetadata.edition}
              </span>
            )}
            {product.figureMetadata && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-[#F7F7F5] text-[#1F3A5F] font-medium border border-[#E5E5E5]">
                {product.figureMetadata.scale} • {product.figureMetadata.manufacturer.replace(/_/g, " ")}
              </span>
            )}
            {product.collectibleMetadata && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-[#FF6B35]/10 text-[#FF6B35] font-medium border border-[#FF6B35]/25">
                Cert: {product.collectibleMetadata.authenticationBody || "PSA"} • {(() => {
                  const cond = product.collectibleMetadata.condition;
                  if (cond === "GEM_MINT_10") return "Gem Mint 10";
                  if (cond === "MINT_9") return "Mint 9";
                  if (cond === "NEAR_MINT_8") return "Near Mint 8";
                  return "Auténtico";
                })()}
              </span>
            )}
            {isBundle && nominalSavings > 0 && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-[#2E9E5B]/10 text-[#2E9E5B] font-bold border border-[#2E9E5B]/25">
                Ahorras {formatCLPShort(nominalSavings)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="p-5 pt-0 border-t border-[#E5E5E5] mt-2 space-y-3">
        <div className="flex items-start justify-between gap-2 pt-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#666666] block">
              {isPreOrder ? "Pie inicial hoy" : "Precio al contado"}
            </span>
            <div className="text-lg sm:text-xl font-black text-[#1A1A1A] font-mono whitespace-nowrap tracking-tight">
              {formatCLP(isPreOrder ? depositAmount : product.price)}
            </div>
            {isPreOrder && (
              <div className="text-[10px] text-[#666666] mt-0.5 leading-snug">
                Total: <span className="text-[#1A1A1A] font-semibold">{formatCLP(product.price)}</span>
                <span className="block text-[10px] text-[#737373]">Saldo al arribar: {formatCLP(remainingBalance)}</span>
              </div>
            )}
            {isBundle && product.nominalSumOfItems && (
              <div className="text-[10px] text-[#737373] line-through">
                Normal: {formatCLP(product.nominalSumOfItems)}
              </div>
            )}
          </div>

          <div className="text-right shrink-0 pl-1">
            <span className="text-[10px] text-[#666666] block">Inventario</span>
            <span
              className={`inline-block text-[11px] font-mono font-bold whitespace-nowrap px-2 py-0.5 rounded-md ${
                availableUnits > 0
                  ? "bg-[#F7F7F5] text-[#1F3A5F] border border-[#E5E5E5]"
                  : "bg-red-50 text-[#D64545] border border-red-200"
              }`}
            >
              {availableUnits > 0 ? `${availableUnits} disp.` : "Agotado"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href={`/product/${slug}`}
            onClick={trackClick}
            className="py-2 px-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-semibold text-center transition flex items-center justify-center gap-1 shadow-sm truncate"
          >
            <span>Detalles</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>

          <button
            onClick={handleQuickAdd}
            disabled={availableUnits <= 0}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-md truncate ${
              justAdded
                ? "bg-[#2E9E5B] text-white"
                : availableUnits > 0
                ? "bg-[#FF6B35] hover:bg-[#E85A24] text-white shadow-[#FF6B35]/25"
                : "bg-gray-100 text-gray-400 border border-[#E5E5E5] cursor-not-allowed"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Agregado</span>
              </>
            ) : isPreOrder ? (
              <>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Reservar</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Comprar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

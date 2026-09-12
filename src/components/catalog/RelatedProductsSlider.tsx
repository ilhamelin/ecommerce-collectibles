"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { ProductDomainEntity } from "@/lib/types/domain";
import { ProductCard } from "@/components/catalog/ProductCard";

interface RelatedProductsSliderProps {
  currentProduct: ProductDomainEntity;
  allProducts: ProductDomainEntity[];
}

export function RelatedProductsSlider({ currentProduct, allProducts }: RelatedProductsSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Compute smart related products
  const related = useMemo(() => {
    if (!currentProduct || !allProducts || allProducts.length === 0) return [];

    const others = allProducts.filter(
      (p) => p.id !== currentProduct.id && p.sku !== currentProduct.sku
    );

    const scored = others.map((item) => {
      let score = 0;

      // 1. Same product type (VIDEO_GAME, FIGURE, COLLECTIBLE, BUNDLE)
      if (item.type === currentProduct.type) score += 6;

      // 2. Video game platform match
      if (item.gameMetadata?.platform && currentProduct.gameMetadata?.platform) {
        if (item.gameMetadata.platform === currentProduct.gameMetadata.platform) {
          score += 5;
        }
      }

      // 3. Publisher match
      if (item.gameMetadata?.publisher && currentProduct.gameMetadata?.publisher) {
        if (
          item.gameMetadata.publisher.toLowerCase() ===
          currentProduct.gameMetadata.publisher.toLowerCase()
        ) {
          score += 3;
        }
      }

      // 4. Figure manufacturer / scale match
      if (item.figureMetadata?.manufacturer && currentProduct.figureMetadata?.manufacturer) {
        if (
          item.figureMetadata.manufacturer.toLowerCase() ===
          currentProduct.figureMetadata.manufacturer.toLowerCase()
        ) {
          score += 3;
        }
      }
      if (item.figureMetadata?.scale && currentProduct.figureMetadata?.scale) {
        if (item.figureMetadata.scale === currentProduct.figureMetadata.scale) {
          score += 4;
        }
      }

      // 5. Shared genres
      const currentGenres = currentProduct.genres;
      if (item.genres && currentGenres) {
        const shared = item.genres.filter((g: string) => currentGenres.includes(g));
        score += shared.length * 2.5;
      }

      // 6. Words in title match (franchises like Zelda, Cyberpunk, Chainsaw Man, Pokemon, etc.)
      const currentWords = currentProduct.name
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length >= 4);

      const targetTitle = item.name.toLowerCase();
      for (const word of currentWords) {
        if (targetTitle.includes(word)) {
          score += 4;
        }
      }

      return { item, score };
    });

    // Sort descending by relevance score
    scored.sort((a, b) => b.score - a.score);

    // Take top 8 related products
    return scored.slice(0, 8).map((s) => s.item);
  }, [currentProduct, allProducts]);

  const updateScrollButtons = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    const node = sliderRef.current;
    if (node) {
      node.addEventListener("scroll", updateScrollButtons);
      return () => node.removeEventListener("scroll", updateScrollButtons);
    }
  }, [related]);

  const scroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const scrollAmount = 320;
    sliderRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (related.length === 0) return null;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6B35]/10 text-[#FF6B35] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Coleccionables Recomendados
            </span>
          </div>
          <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight mt-1">
            Productos Relacionados Sugeridos
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            Títulos, figuras y piezas afines seleccionadas para complementar tu pedido.
          </p>
        </div>

        {/* Carousel controls & Catalog link */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Link
            href="/catalog"
            className="text-xs font-semibold text-[#1F3A5F] hover:text-[#FF6B35] transition flex items-center gap-1 mr-2"
          >
            Ver catálogo completo <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Desplazar a la izquierda"
            className="w-9 h-9 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F7F7F5] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[#1A1A1A] transition shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Desplazar a la derecha"
            className="w-9 h-9 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F7F7F5] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[#1A1A1A] transition shadow-xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slider Track */}
      <div
        ref={sliderRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {related.map((item) => (
          <div
            key={item.id}
            className="min-w-[260px] sm:min-w-[280px] max-w-[280px] shrink-0 snap-start"
          >
            <ProductCard product={item as any} />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { ProductDomainEntity } from "@/lib/types/domain";
import { ProductCard } from "@/components/catalog/ProductCard";

interface RelatedProductsSliderProps {
  currentProduct: ProductDomainEntity;
  allProducts?: ProductDomainEntity[];
}

function getProductCategoryKey(p: any): string {
  if (!p) return "OTHER";
  if (p.type === "CONSOLE") return "CONSOLE";
  if (p.type === "HARDWARE") return "HARDWARE";
  if (p.type === "FIGURE") return "FIGURE";
  if (p.type === "VIDEO_GAME") return "VIDEO_GAME";
  if (p.type === "COLLECTIBLE") return "COLLECTIBLE";
  if (p.type === "BUNDLE") return "BUNDLE";

  const specCat = (p.customSpecifications?.categoryType || "").toUpperCase();
  const l = (p.customCategoryLabel || "").toLowerCase();
  const nameLower = (p.name || "").toLowerCase();
  const skuLower = (p.sku || "").toLowerCase();

  const isConsole =
    specCat === "CONSOLE" ||
    l === "consolas" ||
    l === "consola" ||
    skuLower.startsWith("con-") ||
    nameLower.includes("switch") ||
    nameLower.includes("ps5") ||
    nameLower.includes("playstation") ||
    nameLower.includes("xbox") ||
    (l.includes("consola") && !l.includes("accesorio"));

  if (isConsole) return "CONSOLE";
  if (
    specCat === "HARDWARE" ||
    (!isConsole &&
      (l.includes("hardware") ||
        l.includes("componente") ||
        l.includes("tarjeta") ||
        l.includes("procesador") ||
        l.includes("ssd") ||
        l.includes("ram") ||
        l.includes("gpu") ||
        l.includes("placa") ||
        l.includes("fuente") ||
        l.includes("cooler") ||
        l.includes("gabinete") ||
        l.includes("ventilador")))
  )
    return "HARDWARE";
  if (
    specCat === "GAMING_ACCESSORY" ||
    l.includes("accesorio") ||
    l.includes("gaming") ||
    l.includes("mouse") ||
    l.includes("teclado") ||
    l.includes("audifono") ||
    l.includes("headset") ||
    l.includes("mando") ||
    l.includes("control")
  )
    return "GAMING_ACCESSORY";
  if (specCat === "APPAREL" || l.includes("ropa") || l.includes("estilo") || l.includes("poleron") || l.includes("polera"))
    return "APPAREL";
  if (specCat === "BOOK" || l.includes("manga") || l.includes("artbook") || l.includes("libro") || l.includes("comic"))
    return "BOOK";
  if (specCat === "MERCH" || l.includes("merch") || l.includes("decoraci") || l.includes("peluche") || l.includes("taza"))
    return "MERCH";
  if (specCat === "AUDIO" || l.includes("audio") || l.includes("ost") || l.includes("soundtrack") || l.includes("vinilo"))
    return "AUDIO";

  return "OTHER";
}

export function RelatedProductsSlider({ currentProduct, allProducts }: RelatedProductsSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Maintain live products from database
  const [liveProducts, setLiveProducts] = useState<ProductDomainEntity[]>(allProducts || []);

  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      setLiveProducts(allProducts);
    } else {
      // Fetch live catalog from database to guarantee real products
      fetch(`/api/products?fresh=true&t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data?.products)) {
            setLiveProducts(data.data.products);
          }
        })
        .catch((err) => console.error("Could not fetch products for related slider:", err));
    }
  }, [allProducts]);

  // Compute smart related products strictly from real catalog
  const related = useMemo(() => {
    if (!currentProduct || !liveProducts || liveProducts.length === 0) return [];

    const currentId = String(currentProduct.id || "").toLowerCase();
    const currentSku = String(currentProduct.sku || "").toLowerCase();
    const currentName = String(currentProduct.name || "").toLowerCase().trim();

    // Filter out current product
    const others = liveProducts.filter((p) => {
      const pId = String(p.id || "").toLowerCase();
      const pSku = String(p.sku || "").toLowerCase();
      const pName = String(p.name || "").toLowerCase().trim();
      return pId !== currentId && pSku !== currentSku && pName !== currentName;
    });

    if (others.length === 0) return [];

    const currentCatKey = getProductCategoryKey(currentProduct);
    const currentHwType = currentProduct.customSpecifications?.hardware?.hardwareType;
    const currentAccType = currentProduct.customSpecifications?.gamingAccessory?.accessoryType;
    const currentBrand = (
      currentProduct.customSpecifications?.hardware?.brand ||
      currentProduct.customSpecifications?.gamingAccessory?.mouse?.brand ||
      currentProduct.customSpecifications?.gamingAccessory?.keyboard?.brand ||
      currentProduct.figureMetadata?.manufacturer ||
      currentProduct.gameMetadata?.publisher ||
      ""
    ).toLowerCase().trim();

    const currentSocket = (currentProduct.customSpecifications?.hardware?.interfaceOrSocket || "").toLowerCase().trim();

    const stopWords = new Set([
      "para", "con", "de", "el", "la", "los", "las", "un", "una", "unos", "unas",
      "edition", "edicion", "serie", "series", "slim", "pro", "max", "ultra",
    ]);

    const currentWords = currentProduct.name
      .toLowerCase()
      .replace(/[^\w\sáéíóúüñ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));

    const scored = others.map((item) => {
      let score = 0;
      const itemCatKey = getProductCategoryKey(item);

      // 1. Same custom or primary category
      if (currentCatKey && itemCatKey && currentCatKey === itemCatKey) {
        score += 8;
      } else if (item.type === currentProduct.type) {
        score += 6;
      }

      // 2. Hardware sub-type match (GPU with GPU, CPU with CPU, RAM with RAM, etc.)
      const itemHwType = item.customSpecifications?.hardware?.hardwareType;
      if (currentHwType && itemHwType && currentHwType === itemHwType) {
        score += 9;
      }

      // 3. Hardware socket / interface match
      const itemSocket = (item.customSpecifications?.hardware?.interfaceOrSocket || "").toLowerCase().trim();
      if (currentSocket && itemSocket && (currentSocket.includes(itemSocket) || itemSocket.includes(currentSocket))) {
        score += 5;
      }

      // 4. Gaming Accessory sub-type match (Mouse with Mouse, Keyboard with Keyboard, etc.)
      const itemAccType = item.customSpecifications?.gamingAccessory?.accessoryType;
      if (currentAccType && itemAccType && currentAccType === itemAccType) {
        score += 8;
      }

      // 5. Brand / Manufacturer match (MSI, ASUS, Sony, Nintendo, Bandai, Corsair, etc.)
      const itemBrand = (
        item.customSpecifications?.hardware?.brand ||
        item.customSpecifications?.gamingAccessory?.mouse?.brand ||
        item.customSpecifications?.gamingAccessory?.keyboard?.brand ||
        item.figureMetadata?.manufacturer ||
        item.gameMetadata?.publisher ||
        ""
      ).toLowerCase().trim();

      if (currentBrand && itemBrand && (currentBrand.includes(itemBrand) || itemBrand.includes(currentBrand))) {
        score += 6;
      }

      // 6. Video game platform match
      if (item.gameMetadata?.platform && currentProduct.gameMetadata?.platform) {
        if (item.gameMetadata.platform === currentProduct.gameMetadata.platform) {
          score += 5;
        }
      }

      // 7. Figure manufacturer & scale match
      if (item.figureMetadata?.scale && currentProduct.figureMetadata?.scale) {
        if (item.figureMetadata.scale === currentProduct.figureMetadata.scale) {
          score += 4;
        }
      }

      // 8. Shared genres
      const currentGenres = currentProduct.genres;
      if (item.genres && currentGenres) {
        const shared = item.genres.filter((g: string) => currentGenres.includes(g));
        score += shared.length * 2.5;
      }

      // 9. Words in title match (franchises like Zelda, Cyberpunk, Ryzen, GeForce, etc.)
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

    // Take top 10 related products from the actual database
    return scored.slice(0, 10).map((s) => s.item);
  }, [currentProduct, liveProducts]);

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

  const categoryKey = getProductCategoryKey(currentProduct);

  const badgeLabel = useMemo(() => {
    if (categoryKey === "HARDWARE") return "Hardware & Componentes Afines";
    if (categoryKey === "CONSOLE") return "Consolas & Sistemas Sugeridos";
    if (categoryKey === "GAMING_ACCESSORY") return "Periféricos & Accesorios Sugeridos";
    if (categoryKey === "BOOK") return "Manga & Lecturas Recomendadas";
    if (categoryKey === "APPAREL") return "Moda Gamer & Streetwear";
    if (categoryKey === "MERCH") return "Merchandising & Coleccionables";
    if (categoryKey === "AUDIO") return "Audio & Bandas Sonoras";
    if (currentProduct.type === "FIGURE") return "Figuras & Escalas Afines";
    if (currentProduct.type === "VIDEO_GAME") return "Videojuegos Afines Recomendados";
    if (currentProduct.type === "COLLECTIBLE") return "Cartas & Coleccionables Afines";
    return "Productos Relacionados Sugeridos";
  }, [categoryKey, currentProduct.type]);

  const subtitle = useMemo(() => {
    if (categoryKey === "HARDWARE")
      return "Componentes, almacenamiento y hardware compatible de nuestro catálogo para complementar tu setup.";
    if (categoryKey === "CONSOLE")
      return "Consolas, ediciones especiales y complementos seleccionados de nuestro catálogo.";
    if (categoryKey === "GAMING_ACCESSORY")
      return "Periféricos de alta fidelidad y accesorios para optimizar tu estación gamer.";
    if (categoryKey === "BOOK")
      return "Tomos, novelas y libros de arte afines seleccionados de nuestro catálogo.";
    return "Títulos, figuras y piezas afines de nuestro catálogo para complementar tu pedido.";
  }, [categoryKey]);

  if (related.length === 0) return null;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6B35]/10 text-[#FF6B35] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {badgeLabel}
            </span>
          </div>
          <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight mt-1">
            Productos Relacionados Sugeridos
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            {subtitle}
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

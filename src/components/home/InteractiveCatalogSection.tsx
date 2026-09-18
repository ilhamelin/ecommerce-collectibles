"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Trophy,
  Gamepad2,
  Tv,
  Cpu,
  Headphones,
  Flame,
  Package,
  Shirt,
  BookOpen,
  Gift,
  Disc3,
} from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import type { ProductDomainEntity } from "@/lib/types/domain";
import { catalogClient } from "@/lib/services/catalogClient";

// Interactive filter tabs
const TABS = [
  { id: "ALL", label: "🔥 Destacados de Colección", icon: Flame },
  { id: "FIGURE", label: "🎌 Figuras & Preventas", icon: Sparkles },
  { id: "VIDEO_GAME", label: "🎮 Videojuegos Físicos", icon: Gamepad2 },
  { id: "COLLECTIBLE", label: "🃏 TCG & Rarezas PSA", icon: Trophy },
  { id: "BUNDLE", label: "📦 Bundles con Descuento", icon: Layers },
  { id: "CONSOLE", label: "🕹️ Consolas", icon: Tv },
  { id: "HARDWARE", label: "🖥️ Hardware & PC", icon: Cpu },
  { id: "GAMING_ACCESSORY", label: "🎧 Accesorios Gaming", icon: Headphones },
  { id: "APPAREL", label: "👕 Ropa & Estilo", icon: Shirt },
  { id: "BOOK", label: "📖 Manga & Libros", icon: BookOpen },
  { id: "MERCH", label: "🎁 Merchandising", icon: Gift },
  { id: "AUDIO", label: "💿 Audio & OST", icon: Disc3 },
];

export interface InteractiveCatalogSectionProps {
  initialProducts: ProductDomainEntity[];
}

export function InteractiveCatalogSection({ initialProducts }: InteractiveCatalogSectionProps) {
  const [products, setProducts] = useState<ProductDomainEntity[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Refresco silencioso en segundo plano con deduplicación de red
  useEffect(() => {
    let isCancelled = false;
    catalogClient.getCatalog()
      .then((prods) => {
        if (!isCancelled && Array.isArray(prods) && prods.length > 0) {
          setProducts(prods);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, []);

  // Filtrado de productos por tab activo
  const tabFilteredProducts = useMemo(() => {
    if (activeTab === "ALL") {
      return products;
    }
    return products.filter((p) => {
      if (p.type === activeTab) return true;
      if (p.type === "OTHER") {
        const cat = (p.customSpecifications?.categoryType || "").toUpperCase();
        if (cat === activeTab) return true;
        const lbl = (p.customCategoryLabel || "").toLowerCase();
        if (activeTab === "GAMING_ACCESSORY" && (lbl.includes("accesorio") || p.type === "ACCESSORY")) return true;
        if (activeTab === "CONSOLE" && lbl.includes("consola")) return true;
        if (activeTab === "HARDWARE" && lbl.includes("hardware")) return true;
        if (activeTab === "APPAREL" && (lbl.includes("ropa") || lbl.includes("estilo"))) return true;
        if (activeTab === "BOOK" && (lbl.includes("manga") || lbl.includes("artbook"))) return true;
        if (activeTab === "MERCH" && lbl.includes("merch")) return true;
        if (activeTab === "AUDIO" && (lbl.includes("audio") || lbl.includes("ost"))) return true;
      }
      return false;
    });
  }, [products, activeTab]);

  // Secciones especializadas
  const preOrderFigures = useMemo(() => {
    return products.filter((p) => p.type === "FIGURE").slice(0, 4);
  }, [products]);

  const videoGames = useMemo(() => {
    return products.filter((p) => p.type === "VIDEO_GAME").slice(0, 4);
  }, [products]);

  const tcgCollectibles = useMemo(() => {
    return products.filter((p) => p.type === "COLLECTIBLE").slice(0, 4);
  }, [products]);

  const bundles = useMemo(() => {
    return products.filter((p) => p.type === "BUNDLE").slice(0, 3);
  }, [products]);

  const consolesAndAccessories = useMemo(() => {
    return products.filter((p) => p.type === "CONSOLE" || p.type === "HARDWARE" || p.type === "ACCESSORY").slice(0, 4);
  }, [products]);

  return (
    <div className="space-y-16">
      {/* 1. CATÁLOGO EN VIVO & SELECTOR DE TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E5E5] pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[#FF6B35] font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Catálogo en Vivo
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight mt-1">
              Descubre lo Más Buscado en Chile
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Productos 100% licenciados en pesos chilenos con stock en bodega Santiago o preventa garantizada.
            </p>
          </div>

          <Link
            href="/catalog"
            className="text-xs font-bold text-[#FF6B35] hover:text-[#E85A24] flex items-center gap-1 self-start md:self-auto transition shrink-0 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 px-3.5 py-2 rounded-xl border border-[#FF6B35]/30"
          >
            Ver Catálogo Completo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Botones selectores de categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 border flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? "bg-[#1F3A5F] text-white border-[#1F3A5F] shadow-sm shadow-[#1F3A5F]/20 scale-102"
                    : "bg-white text-[#666666] border-[#E5E5E5] hover:border-[#FF6B35]/40 hover:text-[#1A1A1A]"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grilla responsiva de productos - Renderizada de inmediato sin skeletons iniciales */}
        {tabFilteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {tabFilteredProducts.map((prod) => (
              <ProductCard key={prod.id || prod.sku} product={prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-stone-300">
            <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-600">No hay productos disponibles en esta categoría por el momento.</p>
            <p className="text-xs text-stone-400 mt-1">Los productos creados desde el panel de administración aparecerán aquí automáticamente.</p>
          </div>
        )}
      </section>

      {/* 2. PREVENTAS DE FIGURAS JAPONESAS & NENDOROIDS */}
      {preOrderFigures.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5E5E5] pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-[#FF6B35] font-bold text-xs uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Importación Japón • Preventas
              </div>
              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mt-1">
                Figuras de Escala & Nendoroids Oficiales
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Asegura tu cupo con solo el 20% o 30% inicial en CLP. Saldo diferido cuando el lote arribe a Chile.
              </p>
            </div>

            <Link
              href="/catalog?category=FIGURE"
              className="text-xs font-bold text-[#FF6B35] hover:text-[#E85A24] flex items-center gap-1 transition"
            >
              Ver Todas las Figuras <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {preOrderFigures.map((fig) => (
              <ProductCard key={fig.id || fig.sku} product={fig} />
            ))}
          </div>
        </section>
      )}

      {/* 3. VIDEOJUEGOS FÍSICOS SELLADOS */}
      {videoGames.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5E5E5] pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-[#FF6B35] font-bold text-xs uppercase tracking-wider">
                <Gamepad2 className="w-3.5 h-3.5" /> Videojuegos Físicos
              </div>
              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mt-1">
                Ediciones Físicas Selladas para PlayStation, Switch & Xbox
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Juegos originales nuevos de fábrica, ediciones estándar y de coleccionista listas para despacho en 24h.
              </p>
            </div>

            <Link
              href="/catalog?category=VIDEO_GAME"
              className="text-xs font-bold text-[#FF6B35] hover:text-[#E85A24] flex items-center gap-1 transition"
            >
              Ver Todos los Juegos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {videoGames.map((game) => (
              <ProductCard key={game.id || game.sku} product={game} />
            ))}
          </div>
        </section>
      )}

      {/* 4. CARTAS TCG & PSA MINT */}
      {tcgCollectibles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5E5E5] pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-[#FF6B35] font-bold text-xs uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" /> Coleccionismo Certificado
              </div>
              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mt-1">
                Cartas PSA Mint & Sellados de Inversión
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Piezas de colección de alta gama: Pokémon Base Set, Magic The Gathering y rarezas con autenticación garantizada.
              </p>
            </div>

            <Link
              href="/catalog?category=COLLECTIBLE"
              className="text-xs font-bold text-[#FF6B35] hover:text-[#E85A24] flex items-center gap-1 transition"
            >
              Ver Coleccionables <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {tcgCollectibles.map((col) => (
              <ProductCard key={col.id || col.sku} product={col} />
            ))}
          </div>
        </section>
      )}

      {/* 5. BUNDLES & CONSOLAS / HARDWARE */}
      {(bundles.length > 0 || consolesAndAccessories.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5E5E5] pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-[#FF6B35] font-bold text-xs uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" /> Bundles & Hardware
              </div>
              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mt-1">
                Packs con Ahorro, Consolas & Accesorios Pro
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Ahorra hasta $25.000 CLP en paquetes unificados o equipa tu setup con periféricos y consolas originales.
              </p>
            </div>

            <Link
              href="/catalog?category=BUNDLE"
              className="text-xs font-bold text-[#FF6B35] hover:text-[#E85A24] flex items-center gap-1 transition"
            >
              Ver Todos los Bundles <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {bundles.concat(consolesAndAccessories).slice(0, 4).map((item) => (
              <ProductCard key={item.id || item.sku} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

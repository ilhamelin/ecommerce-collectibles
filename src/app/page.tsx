"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  Trophy,
  CreditCard,
  Truck,
  CheckCircle2,
  Star,
  Gamepad2,
  Tv,
  Cpu,
  Headphones,
  Flame,
  Tag,
  Package,
  Check,
  ChevronRight,
  Shirt,
  BookOpen,
  Gift,
  Disc3,
  Puzzle,
} from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { PromotionalSlider } from "@/components/home/PromotionalSlider";
import { BASE_PRODUCTS } from "@/lib/constants/catalog";
import { formatCLP } from "@/lib/utils/currency";

// Quick-nav categories with vibrant icons and badges
const CATEGORIES_NAV = [
  {
    id: "VIDEO_GAME",
    title: "Videojuegos",
    subtitle: "PS5, Switch, Xbox & PC",
    href: "/catalog?category=VIDEO_GAME",
    icon: Gamepad2,
    badge: "Sellados",
    accent: "hover:border-blue-500/50 hover:bg-blue-50/30",
    iconBg: "bg-blue-50 text-blue-600 border-blue-200/60",
  },
  {
    id: "FIGURE",
    title: "Figuras & Anime",
    subtitle: "Escalas 1/7 & Nendoroid",
    href: "/catalog?category=FIGURE",
    icon: Sparkles,
    badge: "Reserva 20%",
    accent: "hover:border-[#FF6B35]/50 hover:bg-orange-50/30",
    iconBg: "bg-orange-50 text-[#FF6B35] border-orange-200/60",
  },
  {
    id: "COLLECTIBLE",
    title: "TCG & Cartas",
    subtitle: "Pokémon & PSA Mint",
    href: "/catalog?category=COLLECTIBLE",
    icon: Trophy,
    badge: "Graduadas",
    accent: "hover:border-amber-500/50 hover:bg-amber-50/30",
    iconBg: "bg-amber-50 text-amber-600 border-amber-200/60",
  },
  {
    id: "BUNDLE",
    title: "Packs & Bundles",
    subtitle: "Juego + Pines + Arte",
    href: "/catalog?category=BUNDLE",
    icon: Layers,
    badge: "Ahorro Pack",
    accent: "hover:border-emerald-500/50 hover:bg-emerald-50/30",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  },
  {
    id: "CONSOLE",
    title: "Consolas",
    subtitle: "Ediciones Especiales & Retro",
    href: "/catalog?category=CONSOLE",
    icon: Tv,
    badge: "Oficiales",
    accent: "hover:border-purple-500/50 hover:bg-purple-50/30",
    iconBg: "bg-purple-50 text-purple-600 border-purple-200/60",
  },
  {
    id: "HARDWARE",
    title: "Hardware & PC",
    subtitle: "SSDs, Tarjetas & Mods",
    href: "/catalog?category=HARDWARE",
    icon: Cpu,
    badge: "Alta Gama",
    accent: "hover:border-cyan-500/50 hover:bg-cyan-50/30",
    iconBg: "bg-cyan-50 text-cyan-600 border-cyan-200/60",
  },
  {
    id: "GAMING_ACCESSORY",
    title: "Accesorios Gaming",
    subtitle: "Mandos, Mouse & Periféricos",
    href: "/catalog?category=GAMING_ACCESSORY",
    icon: Headphones,
    badge: "Gaming Pro",
    accent: "hover:border-rose-500/50 hover:bg-rose-50/30",
    iconBg: "bg-rose-50 text-rose-600 border-rose-200/60",
  },
  {
    id: "APPAREL",
    title: "Ropa & Estilo",
    subtitle: "Polerones, Poleras & Urbano",
    href: "/catalog?category=APPAREL",
    icon: Shirt,
    badge: "Moda Gamer",
    accent: "hover:border-emerald-500/50 hover:bg-emerald-50/30",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  },
  {
    id: "BOOK",
    title: "Manga / Artbooks",
    subtitle: "Tomos, Ilustración & Guías",
    href: "/catalog?category=BOOK",
    icon: BookOpen,
    badge: "Lectura",
    accent: "hover:border-indigo-500/50 hover:bg-indigo-50/30",
    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200/60",
  },
  {
    id: "MERCH",
    title: "Merchandising",
    subtitle: "Peluches, Llaveros & Colección",
    href: "/catalog?category=MERCH",
    icon: Gift,
    badge: "Exclusivos",
    accent: "hover:border-pink-500/50 hover:bg-pink-50/30",
    iconBg: "bg-pink-50 text-pink-600 border-pink-200/60",
  },
  {
    id: "AUDIO",
    title: "Audio / OST",
    subtitle: "Vinilos, CDs & Soundtracks",
    href: "/catalog?category=AUDIO",
    icon: Disc3,
    badge: "Soundtracks",
    accent: "hover:border-violet-500/50 hover:bg-violet-50/30",
    iconBg: "bg-violet-50 text-violet-600 border-violet-200/60",
  },
  {
    id: "OTHER",
    title: "Otras Categorías",
    subtitle: "Ediciones Únicas & Especiales",
    href: "/catalog?category=OTHER",
    icon: Puzzle,
    badge: "Colección",
    accent: "hover:border-teal-500/50 hover:bg-teal-50/30",
    iconBg: "bg-teal-50 text-teal-600 border-teal-200/60",
  },
];

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

export default function StorefrontHomePage() {
  const [products, setProducts] = useState<any[]>(BASE_PRODUCTS);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch updated products from API, falling back safely to rich BASE_PRODUCTS
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.products) && data.data.products.length > 0) {
          // Merge API products with BASE_PRODUCTS to preserve full high-res images and metadata
          const apiProducts = data.data.products;
          const merged = [...apiProducts];
          BASE_PRODUCTS.forEach((bp) => {
            if (!merged.some((p) => p.sku === bp.sku || p.id === bp.id)) {
              merged.push(bp);
            }
          });
          setProducts(merged);
        }
      })
      .catch((err) => console.error("Error cargando productos:", err));
  }, []);

  // Products filtered by selected tab
  const tabFilteredProducts = useMemo(() => {
    if (activeTab === "ALL") {
      // Pick a balanced curated mix from all categories
      const featured: any[] = [];
      const types = [
        "FIGURE",
        "VIDEO_GAME",
        "COLLECTIBLE",
        "BUNDLE",
        "CONSOLE",
        "HARDWARE",
        "GAMING_ACCESSORY",
        "APPAREL",
        "BOOK",
        "MERCH",
        "AUDIO",
      ];
      types.forEach((t) => {
        const found = products.filter((p) => {
          if (p.type === t) return true;
          if (p.type === "OTHER") {
            const cat = (p.customSpecifications?.categoryType || "").toUpperCase();
            if (cat === t) return true;
            const lbl = (p.customCategoryLabel || "").toLowerCase();
            if (t === "GAMING_ACCESSORY" && (lbl.includes("accesorio") || p.type === "ACCESSORY")) return true;
            if (t === "CONSOLE" && lbl.includes("consola")) return true;
            if (t === "HARDWARE" && lbl.includes("hardware")) return true;
            if (t === "APPAREL" && (lbl.includes("ropa") || lbl.includes("estilo"))) return true;
            if (t === "BOOK" && (lbl.includes("manga") || lbl.includes("artbook"))) return true;
            if (t === "MERCH" && lbl.includes("merch")) return true;
            if (t === "AUDIO" && (lbl.includes("audio") || lbl.includes("ost"))) return true;
          }
          return false;
        }).slice(0, 2);
        featured.push(...found);
      });
      return featured.slice(0, 8);
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
    }).slice(0, 8);
  }, [products, activeTab]);

  // Dedicated sections
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
    <div className="space-y-16 pb-20">
      {/* 1. AUTOMATIC PROMOTIONAL SLIDER (Left untouched at top as requested) */}
      <PromotionalSlider />

      {/* 2. VISUAL CATEGORY EXPLORER BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center sm:text-left mb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
            Navegación Rápida
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] tracking-tight mt-0.5">
            Explora por Categoría Oficial
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES_NAV.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.id}
                href={cat.href}
                className={`group relative p-4 rounded-2xl bg-white border border-[#E5E5E5] transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between ${cat.accent}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs transition-transform duration-300 group-hover:scale-110 ${cat.iconBg}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1F3A5F]/5 text-[#1F3A5F] border border-[#1F3A5F]/15">
                      {cat.badge}
                    </span>
                  </div>
                  <h3 className="font-black text-sm text-[#1A1A1A] group-hover:text-[#FF6B35] transition">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-[#666666] line-clamp-1 mt-0.5">
                    {cat.subtitle}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-[#FF6B35] group-hover:translate-x-1 transition-transform">
                  <span>Ver colección</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. INTERACTIVE CATEGORY TABS SHOWCASE */}
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

        {/* Tab Selector Buttons */}
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

        {/* Responsive 4-Column Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {tabFilteredProducts.map((prod) => (
            <ProductCard key={prod.id || prod.sku} product={prod} />
          ))}
        </div>
      </section>

      {/* 4. SECTION: JAPANESE FIGURES & NENDOROIDS (PREVENTAS) */}
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

      {/* 5. DUAL PROMOTIONAL CALLOUT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banner A: Preorder Formula */}
          <div className="relative rounded-3xl overflow-hidden p-7 bg-gradient-to-br from-[#1F3A5F] to-[#152842] text-white border border-[#2D5180] shadow-md flex flex-col justify-between">
            <div className="space-y-2 relative z-10">
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#FF6B35] text-white text-[10px] font-black uppercase tracking-wider">
                Sistema Pre-Orden
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                Congela el Precio en CLP con solo 20% de Pie
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                Evita sobreprecios y la volatilidad del dólar o yen. Te garantizamos la entrega de tus figuras Good Smile y Kotobukiya con boleta legal.
              </p>
            </div>

            <div className="pt-6 relative z-10 flex items-center gap-3">
              <Link
                href="/catalog?category=FIGURE"
                className="px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
              >
                <span>Reservar Ahora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Banner B: Mint Grading Standard */}
          <div className="relative rounded-3xl overflow-hidden p-7 bg-gradient-to-br from-[#2D2A26] to-[#1A1A1A] text-white border border-[#403B35] shadow-md flex flex-col justify-between">
            <div className="space-y-2 relative z-10">
              <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
                Certificación PSA & BGS
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                Cartas TCG & Rarezas Certificadas Mint
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed max-w-md">
                Cada pieza cuenta con cápsula sónica hermética UV y número de serie verificable al instante en los registros oficiales internacionales.
              </p>
            </div>

            <div className="pt-6 relative z-10 flex items-center gap-3">
              <Link
                href="/catalog?category=COLLECTIBLE"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#1A1A1A] text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
              >
                <span>Ver Cartas PSA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: VIDEO GAMES (PHYSICAL EDITIONS) */}
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

      {/* 7. SECTION: TCG & PSA GRADED CARDS */}
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

      {/* 8. SECTION: BUNDLES & CONSOLES / ACCESSORIES */}
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

      {/* 9. THE OMNICOLLECTOR STANDARD (VALUE PROPOSITION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 lg:p-10 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35] bg-[#FF6B35]/10 px-3 py-1 rounded-full border border-[#FF6B35]/20">
              Compromiso OmniCollector
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] mt-3 tracking-tight">
              ¿Por qué confiar en nosotros para tu colección?
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] mt-2">
              Somos coleccionistas apasionados entregando máxima seguridad, autenticidad comprobada y el mejor embalaje de Chile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#F7F7F5] border border-[#E5E5E5] rounded-2xl p-5 hover:border-[#FF6B35]/50 hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#E5E5E5] text-[#1F3A5F] flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <h3 className="text-sm font-black text-[#1A1A1A]">100% Original Licenciado</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Importamos directamente desde Japón y distribuidoras oficiales. Cero réplicas ni bootlegs, con sellos holográficos de fábrica.
              </p>
            </div>

            <div className="bg-[#F7F7F5] border border-[#E5E5E5] rounded-2xl p-5 hover:border-[#FF6B35]/50 hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#E5E5E5] text-[#1F3A5F] flex items-center justify-center font-bold shadow-xs">
                <Clock className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <h3 className="text-sm font-black text-[#1A1A1A]">Precio Congelado en CLP</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Reserva preventas con el 20% o 30% de pie. Tu precio en pesos chilenos queda congelado sin importar las alzas del dólar o yen.
              </p>
            </div>

            <div className="bg-[#F7F7F5] border border-[#E5E5E5] rounded-2xl p-5 hover:border-[#FF6B35]/50 hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#E5E5E5] text-[#1F3A5F] flex items-center justify-center font-bold shadow-xs">
                <Truck className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <h3 className="text-sm font-black text-[#1A1A1A]">Embalaje Blindado Mint</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Triple capa de plástico burbuja, esquineros rígidos anti-golpes y cajas corrugadas gruesas para cuidar la caja original.
              </p>
            </div>

            <div className="bg-[#F7F7F5] border border-[#E5E5E5] rounded-2xl p-5 hover:border-[#FF6B35]/50 hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#E5E5E5] text-[#1F3A5F] flex items-center justify-center font-bold shadow-xs">
                <CreditCard className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <h3 className="text-sm font-black text-[#1A1A1A]">Hasta 6 Cuotas sin Interés</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Paga de forma 100% segura mediante Mercado Pago, tarjetas de crédito bancarias, Redcompra y transferencia directa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. OFFICIAL BRANDS & LICENSES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <p className="text-xs uppercase font-black tracking-widest text-[#666666]">
            Distribuidores Oficiales de las Mejores Marcas del Mundo
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          {[
            { name: "Good Smile Company", tag: "Nendoroid & Pop Up Parade" },
            { name: "Bandai Namco", tag: "SH Figuarts & Ichibankuji" },
            { name: "The Pokémon Company", tag: "TCG Oficial Sellado" },
            { name: "Kotobukiya", tag: "ARTFX & Bishoujo" },
            { name: "Square Enix", tag: "Bring Arts & Masterline" },
            { name: "Nintendo", tag: "Videojuegos & Amiibo" },
            { name: "Alter Japan", tag: "Escalas Premium 1/7" },
            { name: "Capcom", tag: "Monster Hunter & Resident Evil" },
          ].map((brand) => (
            <div
              key={brand.name}
              className="px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] hover:border-[#FF6B35] transition text-center shadow-xs"
            >
              <div className="text-xs font-black text-[#1A1A1A]">{brand.name}</div>
              <div className="text-[10px] text-[#666666]">{brand.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. COLLECTOR CLUB & WELCOME COUPON */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#1F3A5F] via-[#244673] to-[#1F3A5F] border border-[#1F3A5F] shadow-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#FF6B35]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-3 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B35] text-white text-xs font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Beneficio Exclusivo
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Únete al Club de Coleccionistas y obtén $5.000 CLP de Descuento
              </h3>
              <p className="text-xs sm:text-sm text-[#F7F7F5]/90 max-w-xl">
                Aplica este cupón de bienvenida en tu carrito de compras para cualquier figura, videojuego o coleccionable.
              </p>
            </div>

            <div className="w-full lg:w-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-[#152842] border border-[#2D5180] px-4 py-3 rounded-xl flex items-center gap-3 w-full sm:w-auto shadow-inner">
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">
                    Cupón de Bienvenida
                  </span>
                  <span className="text-base font-black text-[#FF6B35] tracking-wider font-mono">
                    COLECCIONISTA5K
                  </span>
                </div>
              </div>
              <Link
                href="/catalog"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-black text-xs uppercase tracking-wider transition text-center shadow-lg hover:shadow-[#FF6B35]/30 flex items-center justify-center gap-2"
              >
                Canjear en Catálogo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 12. VERIFIED CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-1 text-amber-500 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
            ))}
            <span className="text-xs font-bold text-[#1A1A1A] ml-2">4.9 / 5.0 en Google & WhatsApp</span>
          </div>
          <h2 className="text-2xl font-black text-[#1A1A1A]">
            Lo que dicen nuestros clientes en todo Chile
          </h2>
          <p className="text-xs text-[#666666] mt-1">
            Más de 2.400 coleccionistas confían en OmniCollector para sus figuras y preventas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              ))}
            </div>
            <p className="text-xs text-[#666666] leading-relaxed italic">
              &quot;Llegó mi Nendoroid de Zelda impecable a Temuco. El embalaje con triple burbuja y esquineros de cartón es insuperable. Excelente tienda.&quot;
            </p>
            <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">Rodrigo V.</p>
                <p className="text-[10px] text-[#666666]">Temuco, Chile</p>
              </div>
              <span className="text-[10px] font-bold text-[#2E9E5B] bg-[#2E9E5B]/10 border border-[#2E9E5B]/30 px-2 py-0.5 rounded-full">
                Compra Verificada
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              ))}
            </div>
            <p className="text-xs text-[#666666] leading-relaxed italic">
              &quot;La mejor tienda para preventas de Good Smile. Pagué el pie del 20% y cuando llegó a Santiago me avisaron al WhatsApp para pagar el resto. 100% recomendados.&quot;
            </p>
            <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">Camila M.</p>
                <p className="text-[10px] text-[#666666]">Santiago Centro</p>
              </div>
              <span className="text-[10px] font-bold text-[#2E9E5B] bg-[#2E9E5B]/10 border border-[#2E9E5B]/30 px-2 py-0.5 rounded-full">
                Compra Verificada
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              ))}
            </div>
            <p className="text-xs text-[#666666] leading-relaxed italic">
              &quot;Compré la carta de Charizard certificada PSA y llegó en menos de 24 horas por Starken express a Viña. La autenticidad se pudo comprobar en la web de PSA de inmediato.&quot;
            </p>
            <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">Ignacio S.</p>
                <p className="text-[10px] text-[#666666]">Viña del Mar</p>
              </div>
              <span className="text-[10px] font-bold text-[#2E9E5B] bg-[#2E9E5B]/10 border border-[#2E9E5B]/30 px-2 py-0.5 rounded-full">
                Compra Verificada
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

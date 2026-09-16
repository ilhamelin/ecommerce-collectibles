"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Filter,
  Search,
  Gamepad2,
  Sparkles,
  Trophy,
  Layers,
  SlidersHorizontal,
  RotateCcw,
  Check,
  X,
  Clock,
  PackageCheck,
  Tag,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Tv,
  Cpu,
  Headphones,
  Shirt,
  BookOpen,
  Gift,
  Disc3,
  Camera,
} from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { formatCLP } from "@/lib/utils/currency";
import { BASE_PRODUCTS, PRICE_PRESETS } from "@/lib/constants/catalog";
import { ProductDomainEntity } from "@/lib/types/domain";
import { VisualSearchModal } from "@/components/catalog/VisualSearchModal";

const CUSTOM_CATEGORIES_METADATA: Record<string, { label: string; icon: any; bannerBadge: string; bannerTitle: string; bannerDesc: string }> = {
  CONSOLE: {
    label: "Consolas",
    icon: Tv,
    bannerBadge: "Catálogo Consolas de Videojuegos",
    bannerTitle: "Consolas de Videojuegos & Ediciones Limitadas",
    bannerDesc: "Sistemas PlayStation 5, Nintendo Switch, Xbox Series y consolas retro de edición especial con garantía oficial y despacho a todo Chile.",
  },
  HARDWARE: {
    label: "Hardware & Componentes",
    icon: Cpu,
    bannerBadge: "Catálogo Hardware & Componentes",
    bannerTitle: "Hardware, Componentes & Almacenamiento",
    bannerDesc: "Unidades SSD NVMe de alta velocidad, memorias, tarjetas gráficas y componentes de alto rendimiento para gaming y estaciones de trabajo.",
  },
  GAMING_ACCESSORY: {
    label: "Accesorios Gaming",
    icon: Headphones,
    bannerBadge: "Catálogo Accesorios Gaming",
    bannerTitle: "Periféricos & Accesorios Gamer",
    bannerDesc: "Mouse ultraligeros para esports, teclados mecánicos switches hot-swap y audífonos con audio espacial y baja latencia.",
  },
  APPAREL: {
    label: "Ropa & Estilo",
    icon: Shirt,
    bannerBadge: "Catálogo Ropa & Estilo",
    bannerTitle: "Moda, Polerones & Streetwear Gamer",
    bannerDesc: "Indumentaria 100% algodón, hoodies de anime y colecciones exclusivas de videojuegos con licencia oficial.",
  },
  BOOK: {
    label: "Manga & Artbooks",
    icon: BookOpen,
    bannerBadge: "Catálogo Manga & Artbooks",
    bannerTitle: "Manga Importado & Libros de Arte",
    bannerDesc: "Tomos originales en español y japonés, tankōbon, ediciones kanzenban y libros de arte de tus sagas favoritas.",
  },
  MERCH: {
    label: "Merchandising",
    icon: Gift,
    bannerBadge: "Catálogo Merchandising",
    bannerTitle: "Merchandising & Coleccionables",
    bannerDesc: "Peluches oficiales de Pokémon Center, llaveros acrílicos, lámparas LED 3D y piezas de decoración para coleccionistas.",
  },
  AUDIO: {
    label: "Audio / OST",
    icon: Disc3,
    bannerBadge: "Catálogo Audio & OST",
    bannerTitle: "Bandas Sonoras Originales & Vinilos",
    bannerDesc: "OSTs orquestadas en vinilo de 180g, cajas deluxe de colección y discos compactos de videojuegos y anime.",
  },
};

function getProductCustomCategoryKey(p: any): string | null {
  if (p.type === "CONSOLE") return "CONSOLE";
  if (p.type === "HARDWARE") return "HARDWARE";
  if (p.type !== "OTHER") return null;
  const specCat = (p.customSpecifications?.categoryType || "").toUpperCase();
  const l = (p.customCategoryLabel || "").toLowerCase();
  const nameLower = (p.name || "").toLowerCase();
  const skuLower = (p.sku || "").toLowerCase();

  const isConsole = specCat === "CONSOLE" || 
                    l === "consolas" || 
                    l === "consola" || 
                    skuLower.startsWith("con-") || 
                    nameLower.includes("switch") || 
                    nameLower.includes("ps5") || 
                    nameLower.includes("playstation") || 
                    nameLower.includes("xbox") || 
                    (l.includes("consola") && !l.includes("accesorio"));

  if (isConsole) return "CONSOLE";
  if (specCat === "HARDWARE" || (!isConsole && (l.includes("hardware") || l.includes("componente") || l.includes("tarjeta") || l.includes("procesador") || l.includes("ssd") || l.includes("ram") || l.includes("gpu") || l.includes("placa") || l.includes("fuente") || l.includes("cooler") || l.includes("gabinete") || l.includes("ventilador")))) return "HARDWARE";
  if (specCat === "GAMING_ACCESSORY" || l.includes("accesorio") || l.includes("gaming") || l.includes("mouse") || l.includes("teclado") || l.includes("audifono") || l.includes("headset")) return "GAMING_ACCESSORY";
  if (specCat === "APPAREL" || l.includes("ropa") || l.includes("estilo") || l.includes("poleron") || l.includes("polera")) return "APPAREL";
  if (specCat === "BOOK" || l.includes("manga") || l.includes("artbook") || l.includes("libro") || l.includes("comic")) return "BOOK";
  if (specCat === "MERCH" || l.includes("merch") || l.includes("decoraci") || l.includes("peluche") || l.includes("taza")) return "MERCH";
  if (specCat === "AUDIO" || l.includes("audio") || l.includes("ost") || l.includes("soundtrack") || l.includes("vinilo")) return "AUDIO";
  return "OTHER";
}

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "ALL";
  const qParam = searchParams.get("q") || searchParams.get("search") || searchParams.get("tag") || "";
  const platformParam = searchParams.get("platform") || "ALL";

  const [products, setProducts] = useState<ProductDomainEntity[]>(BASE_PRODUCTS as any);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState<string>(qParam);
  const [sortBy, setSortBy] = useState<"FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "PREORDER_FIRST">("FEATURED");

  // Advanced Filters State
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "PREORDER">("ALL");
  const [platformFilter, setPlatformFilter] = useState<string>(platformParam);
  const [scaleFilter, setScaleFilter] = useState<string>("ALL");
  const [conditionFilter, setConditionFilter] = useState<string>("ALL");

  // Specialized Filters for Custom Categories
  const [consoleTypeFilter, setConsoleTypeFilter] = useState<string>("ALL");
  const [hardwareTypeFilter, setHardwareTypeFilter] = useState<string>("ALL");
  const [accessoryTypeFilter, setAccessoryTypeFilter] = useState<string>("ALL");
  const [bookLangFilter, setBookLangFilter] = useState<string>("ALL");
  const [apparelSizeFilter, setApparelSizeFilter] = useState<string>("ALL");
  const [merchTypeFilter, setMerchTypeFilter] = useState<string>("ALL");
  const [audioFormatFilter, setAudioFormatFilter] = useState<string>("ALL");

  // Visual search modal state
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);

  // Pagination State (Up to 21 products per page - 7 rows of 3 products)
  const ITEMS_PER_PAGE = 21;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const catalogGridRef = useRef<HTMLDivElement>(null);

  // Mobile drawer toggle
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Sync category, query and platform state when URL changes
  useEffect(() => {
    setSelectedCategory(categoryParam);
    if (qParam) setSearchQuery(qParam);
    if (platformParam !== "ALL") setPlatformFilter(platformParam);
  }, [categoryParam, qParam, platformParam]);

  // Fetch updated catalog from backend
  useEffect(() => {
    fetch(`/api/products?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.products)) {
          setProducts(data.data.products);
        }
      })
      .catch((err) => console.error("Could not fetch latest products", err));
  }, []);

  const handleCategoryChange = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setCurrentPage(1);
    if (categoryKey === "ALL") {
      router.replace("/catalog", { scroll: false });
    } else {
      router.replace(`/catalog?category=${categoryKey}`, { scroll: false });
    }
  };

  // Dynamic Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: products.length,
      VIDEO_GAME: 0,
      FIGURE: 0,
      COLLECTIBLE: 0,
      BUNDLE: 0,
      CONSOLE: 0,
      HARDWARE: 0,
      GAMING_ACCESSORY: 0,
      APPAREL: 0,
      BOOK: 0,
      MERCH: 0,
      AUDIO: 0,
      OTHER: 0,
    };
    for (const p of products) {
      const pType = (p as any).type;
      if (pType === "VIDEO_GAME") counts.VIDEO_GAME++;
      else if (pType === "FIGURE") counts.FIGURE++;
      else if (pType === "COLLECTIBLE") counts.COLLECTIBLE++;
      else if (pType === "BUNDLE") counts.BUNDLE++;
      else if (pType === "CONSOLE") counts.CONSOLE++;
      else if (pType === "HARDWARE") counts.HARDWARE++;
      else if (pType === "OTHER") {
        const catKey = getProductCustomCategoryKey(p);
        if (catKey && counts[catKey] !== undefined) {
          counts[catKey]++;
        }
        counts.OTHER++;
      }
    }
    return counts;
  }, [products]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "ALL") count++;
    if (minPrice !== "" || maxPrice !== "") count++;
    if (stockFilter !== "ALL") count++;
    if (platformFilter !== "ALL") count++;
    if (scaleFilter !== "ALL") count++;
    if (conditionFilter !== "ALL") count++;
    if (consoleTypeFilter !== "ALL") count++;
    if (hardwareTypeFilter !== "ALL") count++;
    if (accessoryTypeFilter !== "ALL") count++;
    if (bookLangFilter !== "ALL") count++;
    if (apparelSizeFilter !== "ALL") count++;
    if (merchTypeFilter !== "ALL") count++;
    if (audioFormatFilter !== "ALL") count++;
    if (searchQuery.trim() !== "") count++;
    return count;
  }, [
    selectedCategory,
    minPrice,
    maxPrice,
    stockFilter,
    platformFilter,
    scaleFilter,
    conditionFilter,
    consoleTypeFilter,
    hardwareTypeFilter,
    accessoryTypeFilter,
    bookLangFilter,
    apparelSizeFilter,
    merchTypeFilter,
    audioFormatFilter,
    searchQuery,
  ]);

  const resetAllFilters = () => {
    setSelectedCategory("ALL");
    setMinPrice("");
    setMaxPrice("");
    setStockFilter("ALL");
    setPlatformFilter("ALL");
    setScaleFilter("ALL");
    setConditionFilter("ALL");
    setConsoleTypeFilter("ALL");
    setHardwareTypeFilter("ALL");
    setAccessoryTypeFilter("ALL");
    setBookLangFilter("ALL");
    setApparelSizeFilter("ALL");
    setMerchTypeFilter("ALL");
    setAudioFormatFilter("ALL");
    setSearchQuery("");
    setCurrentPage(1);
    router.replace("/catalog", { scroll: false });
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category Filter (Standard and Custom Categories)
      if (selectedCategory !== "ALL") {
        if (selectedCategory === product.type) {
          // Direct type match
        } else if (product.type === "OTHER") {
          const customKey = getProductCustomCategoryKey(product);
          if (selectedCategory === "OTHER") {
            // Match any other category
          } else if (selectedCategory === customKey) {
            // Match specific custom category
          } else {
            return false;
          }
        } else {
          return false;
        }
      }

      // Search Filter: comprehensive match for Name, SKU, Description, Genres, Tags, Custom Specs, Platform, Manufacturer
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const queryTerms = query.split(/\s+/).filter(Boolean);
        const customKey = getProductCustomCategoryKey(product);

        const searchableParts = [
          product.name || "",
          product.sku || "",
          product.description || "",
          ...(product.genres || []),
          product.type || "",
          product.customCategoryLabel || "",
          customKey || "",
          // Custom category keywords
          customKey === "CONSOLE" ? "consola sistemas playstation ps5 xbox switch nintendo almacenamiento sobremesa portatil edicion especial" : "",
          customKey === "HARDWARE" ? "hardware componentes pc almacenamiento ssd nvme m.2 memorias ram ddr5 tarjetas graficas gpu procesadores fuente alimentacion gabinete refrigeracion líquida" : "",
          customKey === "GAMING_ACCESSORY" ? "accesorio gaming periferico mouse raton teclado keyboard audifonos headset auriculares gamer dpi switches mecanico" : "",
          customKey === "APPAREL" ? "ropa estilo poleron polera hoodie streetwear moda textil algodon indumentaria" : "",
          customKey === "BOOK" ? "manga artbook libro comic tomo lectura tankobon editorial novela" : "",
          customKey === "MERCH" ? "merchandising merch peluche llavero lampara taza regalo decoracion oficial" : "",
          customKey === "AUDIO" ? "audio ost banda sonora soundtrack vinilo disco lp compositor musica" : "",
          // Custom technical specifications
          product.customSpecifications?.console?.baseModel || "",
          product.customSpecifications?.console?.capacity || "",
          product.customSpecifications?.console?.format || "",
          product.customSpecifications?.console?.controllersIncluded || "",
          product.customSpecifications?.console?.bundleIncluded || "",
          product.customSpecifications?.console?.ports || "",
          product.customSpecifications?.console?.gameCompatibility || "",
          product.customSpecifications?.console?.featuredHighlights || "",
          product.customSpecifications?.hardware?.componentType || "",
          product.customSpecifications?.hardware?.brand || "",
          product.customSpecifications?.hardware?.model || "",
          product.customSpecifications?.hardware?.interfaceOrSocket || "",
          product.customSpecifications?.hardware?.capacityOrSpeed || "",
          product.customSpecifications?.hardware?.formFactor || "",
          product.customSpecifications?.hardware?.powerConsumptionTdp || "",
          product.customSpecifications?.hardware?.featuredHighlights || "",
          product.customSpecifications?.gamingAccessory?.mouse?.brand || "",
          product.customSpecifications?.gamingAccessory?.mouse?.tracking || "",
          product.customSpecifications?.gamingAccessory?.mouse?.maxDpi || "",
          product.customSpecifications?.gamingAccessory?.mouse?.wiring || "",
          product.customSpecifications?.gamingAccessory?.mouse?.technology || "",
          product.customSpecifications?.gamingAccessory?.keyboard?.brand || "",
          product.customSpecifications?.gamingAccessory?.keyboard?.partNumber || "",
          product.customSpecifications?.gamingAccessory?.keyboard?.type || "",
          product.customSpecifications?.gamingAccessory?.keyboard?.switchType || "",
          product.customSpecifications?.gamingAccessory?.keyboard?.connectionTechnology || "",
          product.customSpecifications?.gamingAccessory?.headset?.type || "",
          product.customSpecifications?.gamingAccessory?.headset?.microphone || "",
          product.customSpecifications?.gamingAccessory?.headset?.frequencyResponse || "",
          product.customSpecifications?.gamingAccessory?.headset?.connectivity || "",
          product.customSpecifications?.gamingAccessory?.headset?.activeNoiseCancelling || "",
          product.customSpecifications?.apparel?.size || "",
          product.customSpecifications?.apparel?.gender || "",
          product.customSpecifications?.apparel?.material || "",
          product.customSpecifications?.apparel?.apparelType || "",
          product.customSpecifications?.apparel?.license || "",
          product.customSpecifications?.book?.publisher || "",
          product.customSpecifications?.book?.language || "",
          product.customSpecifications?.book?.binding || "",
          product.customSpecifications?.book?.isbn || "",
          product.customSpecifications?.merch?.itemType || "",
          product.customSpecifications?.merch?.material || "",
          product.customSpecifications?.merch?.franchise || "",
          product.customSpecifications?.audio?.format || "",
          product.customSpecifications?.audio?.recordLabel || "",
          product.customSpecifications?.audio?.featuredTracks || "",
          // Standard Category keywords
          product.type === "VIDEO_GAME" ? "videojuego juego gaming" : "",
          product.type === "FIGURE" ? "figura estatua anime figure" : "",
          product.type === "COLLECTIBLE" ? "tcg carta coleccionable rareza pokemon" : "",
          product.type === "BUNDLE" ? "bundle pack combo" : "",
          product.gameMetadata?.platform || "",
          ((product.gameMetadata?.platform as string) === "NINTENDO_SWITCH" || (product.name && product.name.toLowerCase().includes("switch"))) ? "switch nintendo nintendo switch" : "",
          ((product.gameMetadata?.platform as string) === "PS5" || (product.name && product.name.toLowerCase().includes("ps5"))) ? "playstation ps5 playstation 5 sony" : "",
          (product.gameMetadata?.platform as string) === "PC" ? "pc steam windows" : "",
          (product.gameMetadata?.platform as string) === "XBOX_SERIES" ? "xbox xbox series microsoft" : "",
          product.gameMetadata?.publisher || "",
          product.gameMetadata?.edition || "",
          product.figureMetadata?.manufacturer || "",
          product.figureMetadata?.scale ? product.figureMetadata.scale.replace("SCALE_", "").replace("_", "/") : "",
          product.figureMetadata?.scale || "",
          product.collectibleMetadata?.category || "",
          product.collectibleMetadata?.authenticationBody || "",
          product.collectibleMetadata?.condition || "",
          product.collectibleMetadata?.cardLanguage || "",
          product.ageRating || "",
          product.isPreOrder ? "preventa reserva preorder pre-order" : "stock inmediato entrega inmediata",
        ].join(" ").toLowerCase();

        // Every query term must match at least one part
        const allTermsMatch = queryTerms.every((term) => searchableParts.includes(term));
        if (!allTermsMatch) return false;
      }

      // Price Range Filter
      const minVal = minPrice !== "" ? Number(minPrice) : null;
      const maxVal = maxPrice !== "" ? Number(maxPrice) : null;
      if (minVal !== null && !isNaN(minVal) && product.price < minVal) {
        return false;
      }
      if (maxVal !== null && !isNaN(maxVal) && product.price > maxVal) {
        return false;
      }

      // Stock / Pre-order Filter
      if (stockFilter === "IN_STOCK") {
        if (product.isPreOrder) return false;
        const available =
          product.type === "BUNDLE"
            ? (product as any).calculatedAvailableStock ?? 0
            : product.stockAvailable - product.stockReserved;
        if (available <= 0) return false;
      } else if (stockFilter === "PREORDER") {
        if (!product.isPreOrder) return false;
      }

      // Platform Filter (for Video Games - robust matching for NINTENDO_SWITCH / SWITCH, PS5, XBOX, PC)
      if (platformFilter !== "ALL") {
        const prodPlatform = (product.gameMetadata?.platform || "").toUpperCase();
        const target = platformFilter.toUpperCase();
        const isSwitch =
          target === "NINTENDO_SWITCH" || target === "SWITCH" || target.includes("SWITCH");
        const isPs5 = target === "PS5" || target.includes("PS5");
        const isXbox = target === "XBOX" || target === "XBOX_SERIES";
        const isPc = target === "PC";

        const matchesMetadata =
          prodPlatform === target ||
          (isSwitch && (prodPlatform === "NINTENDO_SWITCH" || prodPlatform === "SWITCH")) ||
          (isPs5 && (prodPlatform === "PS5" || prodPlatform === "PLAYSTATION_5")) ||
          (isXbox && (prodPlatform === "XBOX_SERIES" || prodPlatform === "XBOX")) ||
          (isPc && prodPlatform === "PC");

        const matchesText =
          (isSwitch && ((product.name && product.name.toUpperCase().includes("SWITCH")) || (product.sku && product.sku.toUpperCase().includes("SWITCH")))) ||
          (isPs5 && ((product.name && product.name.toUpperCase().includes("PS5")) || (product.sku && product.sku.toUpperCase().includes("PS5")))) ||
          (isXbox && ((product.name && product.name.toUpperCase().includes("XBOX")) || (product.sku && product.sku.toUpperCase().includes("XBOX")))) ||
          (isPc && ((product.name && product.name.toUpperCase().includes("PC")) || (product.sku && product.sku.toUpperCase().includes("PC"))));

        if (!matchesMetadata && !matchesText) return false;
      }

      // Scale Filter (for Figures)
      if (scaleFilter !== "ALL") {
        const prodScale = (product.figureMetadata?.scale || "").toUpperCase();
        const target = scaleFilter.toUpperCase();
        const cleanNumber = target.replace("SCALE_", "").replace("_", "/");

        const matches =
          prodScale === target ||
          (cleanNumber && product.name && product.name.toUpperCase().includes(cleanNumber)) ||
          (product.name && product.name.toUpperCase().includes(target));
        if (!matches) return false;
      }

      // Condition Filter (for TCG & Collectibles)
      if (conditionFilter !== "ALL") {
        const condition = product.collectibleMetadata?.condition;
        const auth = product.collectibleMetadata?.authenticationBody;
        if (conditionFilter === "PSA_9") {
          if (condition !== "MINT_9" || auth !== "PSA") return false;
        } else if (conditionFilter === "GEM_10") {
          if (condition !== "GEM_MINT_10") return false;
        } else if (conditionFilter === "UNGRADED") {
          if (auth && auth !== "NONE") return false;
        }
      }

      // Console Filter
      if (consoleTypeFilter !== "ALL") {
        const consoleFmt = (product.customSpecifications?.console?.format || "").toUpperCase();
        const pName = (product.name || "").toUpperCase();
        if (consoleTypeFilter === "DESKTOP" && !consoleFmt.includes("SOBREMESA") && !pName.includes("PS5") && !pName.includes("XBOX")) return false;
        if (consoleTypeFilter === "PORTABLE" && !consoleFmt.includes("PORTÁTIL") && !consoleFmt.includes("PORTATIL") && !pName.includes("SWITCH") && !pName.includes("DECK")) return false;
        if (consoleTypeFilter === "LIMITED" && !consoleFmt.includes("ESPECIAL") && !consoleFmt.includes("LIMITED") && !pName.includes("EDICIÓN")) return false;
      }

      // Hardware Filter
      if (hardwareTypeFilter !== "ALL") {
        const comp = (product.customSpecifications?.hardware?.componentType || "").toUpperCase();
        const pName = (product.name || "").toUpperCase();
        if (hardwareTypeFilter === "STORAGE" && !comp.includes("ALMACENAMIENTO") && !pName.includes("SSD") && !pName.includes("NVME") && !pName.includes("M.2")) return false;
        if (hardwareTypeFilter === "GPU" && !comp.includes("GRÁFICA") && !pName.includes("GPU") && !pName.includes("RTX") && !pName.includes("GEFORCE") && !pName.includes("RADEON")) return false;
        if (hardwareTypeFilter === "CPU_RAM" && !comp.includes("RAM") && !comp.includes("PROCESADOR") && !pName.includes("RAM") && !pName.includes("DDR") && !pName.includes("RYZEN") && !pName.includes("INTEL")) return false;
        if (hardwareTypeFilter === "COOLING" && !comp.includes("REFRIGERACIÓN") && !comp.includes("FUENTE") && !pName.includes("COOLER") && !pName.includes("POWER") && !pName.includes("WATTS")) return false;
      }

      // Accessory Filter
      if (accessoryTypeFilter !== "ALL") {
        const pName = (product.name || "").toUpperCase();
        const acc = product.customSpecifications?.gamingAccessory;
        if (accessoryTypeFilter === "MOUSE" && !acc?.mouse && !pName.includes("MOUSE") && !pName.includes("RATÓN")) return false;
        if (accessoryTypeFilter === "KEYBOARD" && !acc?.keyboard && !pName.includes("TECLADO") && !pName.includes("KEYBOARD")) return false;
        if (accessoryTypeFilter === "HEADSET" && !acc?.headset && !pName.includes("AUDÍFONO") && !pName.includes("HEADSET") && !pName.includes("BLACKSHARK")) return false;
        if (accessoryTypeFilter === "CONTROLLER" && !acc?.controller && !pName.includes("CONTROL") && !pName.includes("JOYSTICK") && !pName.includes("MANDO")) return false;
      }

      // Book / Manga Filter
      if (bookLangFilter !== "ALL") {
        const lang = (product.customSpecifications?.book?.language || "").toUpperCase();
        const pName = (product.name || "").toUpperCase();
        if (bookLangFilter === "ES" && !lang.includes("ESPAÑOL") && !lang.includes("NORMA") && !lang.includes("IVREA")) return false;
        if (bookLangFilter === "JP" && !lang.includes("JAPONÉS") && !lang.includes("JAPONES") && !lang.includes("JAPAN")) return false;
        if (bookLangFilter === "ARTBOOK" && !pName.includes("ARTBOOK") && !pName.includes("ARTE")) return false;
      }

      // Apparel Filter
      if (apparelSizeFilter !== "ALL") {
        const size = (product.customSpecifications?.apparel?.size || "").toUpperCase();
        const pName = (product.name || "").toUpperCase();
        if (apparelSizeFilter === "HOODIE" && !pName.includes("HOODIE") && !pName.includes("POLERÓN")) return false;
        else if (apparelSizeFilter !== "HOODIE" && !size.includes(apparelSizeFilter) && !pName.includes(apparelSizeFilter)) return false;
      }

      // Merch Filter
      if (merchTypeFilter !== "ALL") {
        const itemType = (product.customSpecifications?.merch?.itemType || "").toUpperCase();
        const pName = (product.name || "").toUpperCase();
        if (merchTypeFilter === "PLUSH" && !itemType.includes("PELUCHE") && !pName.includes("PELUCHE")) return false;
        if (merchTypeFilter === "STAND" && !itemType.includes("ACRÍLICO") && !itemType.includes("STAND") && !pName.includes("STAND")) return false;
        if (merchTypeFilter === "KEYCHAIN" && !itemType.includes("LLAVERO") && !pName.includes("LLAVERO")) return false;
      }

      // Audio Filter
      if (audioFormatFilter !== "ALL") {
        const fmt = (product.customSpecifications?.audio?.format || "").toUpperCase();
        const pName = (product.name || "").toUpperCase();
        if (audioFormatFilter === "VINYL" && !fmt.includes("VINILO") && !fmt.includes("LP") && !pName.includes("VINILO")) return false;
        if (audioFormatFilter === "CD" && !fmt.includes("CD") && !pName.includes("CD")) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "PRICE_ASC") return a.price - b.price;
      if (sortBy === "PRICE_DESC") return b.price - a.price;
      if (sortBy === "PREORDER_FIRST") {
        return (b.isPreOrder ? 1 : 0) - (a.isPreOrder ? 1 : 0);
      }
      return 0;
    });
  }, [
    products,
    selectedCategory,
    searchQuery,
    minPrice,
    maxPrice,
    stockFilter,
    platformFilter,
    scaleFilter,
    conditionFilter,
    consoleTypeFilter,
    accessoryTypeFilter,
    bookLangFilter,
    apparelSizeFilter,
    merchTypeFilter,
    audioFormatFilter,
    sortBy,
  ]);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    searchQuery,
    minPrice,
    maxPrice,
    stockFilter,
    platformFilter,
    scaleFilter,
    conditionFilter,
    sortBy,
  ]);

  // Pagination computations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    const targetPage = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(targetPage);
    if (catalogGridRef.current) {
      catalogGridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Filter Sidebar Content (Shared between Desktop and Mobile Drawer)
  const renderSidebarFilters = () => (
    <div className="space-y-6 text-sm">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#FF6B35]" />
          <h2 className="font-bold text-[#1A1A1A] tracking-wide text-sm">
            Filtros Especializados
          </h2>
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={resetAllFilters}
            className="text-[11px] font-semibold text-[#FF6B35] hover:text-[#E85A24] flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* 1. Categorías Principales */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
          Categorías Principales
        </label>
        <div className="space-y-1">
          {[
            { id: "ALL", label: "Todos los Productos", count: categoryCounts.ALL },
            { id: "VIDEO_GAME", label: "Videojuegos", icon: Gamepad2, count: categoryCounts.VIDEO_GAME },
            { id: "FIGURE", label: "Figuras de Escala", icon: Sparkles, count: categoryCounts.FIGURE },
            { id: "COLLECTIBLE", label: "TCG & Rarezas PSA", icon: Trophy, count: categoryCounts.COLLECTIBLE },
            { id: "BUNDLE", label: "Bundles Compuestos", icon: Layers, count: categoryCounts.BUNDLE },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? "bg-[#1F3A5F] text-white font-bold border border-[#1F3A5F] shadow-sm"
                    : "text-[#1A1A1A]/80 hover:bg-[#F7F7F5] hover:text-[#1A1A1A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#FF6B35]" : "text-[#666666]"}`} />}
                  <span>{cat.label}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected
                      ? "bg-[#FF6B35] text-white font-bold"
                      : "bg-[#F7F7F5] text-[#666666] border border-[#E5E5E5]"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 1.5 Nuevas Categorías Especializadas */}
        <div className="pt-2 border-t border-[#E5E5E5]/70 space-y-1">
          <label className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider block px-1">
            Nuevas Categorías Especializadas
          </label>
          {[
            { id: "CONSOLE", label: "Consolas", icon: Tv, count: categoryCounts.CONSOLE },
            { id: "HARDWARE", label: "Hardware & Componentes", icon: Cpu, count: categoryCounts.HARDWARE },
            { id: "GAMING_ACCESSORY", label: "Accesorio Gaming", icon: Headphones, count: categoryCounts.GAMING_ACCESSORY },
            { id: "APPAREL", label: "Ropa & Estilo", icon: Shirt, count: categoryCounts.APPAREL },
            { id: "BOOK", label: "Manga / Artbook", icon: BookOpen, count: categoryCounts.BOOK },
            { id: "MERCH", label: "Merchandising", icon: Gift, count: categoryCounts.MERCH },
            { id: "AUDIO", label: "Audio / OST", icon: Disc3, count: categoryCounts.AUDIO },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? "bg-[#1F3A5F] text-white font-bold border border-[#1F3A5F] shadow-sm"
                    : "text-[#1A1A1A]/80 hover:bg-[#F7F7F5] hover:text-[#1A1A1A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#FF6B35]" : "text-[#666666]"}`} />
                  <span>{cat.label}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected
                      ? "bg-[#FF6B35] text-white font-bold"
                      : "bg-[#F7F7F5] text-[#666666] border border-[#E5E5E5]"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Rango de Precios en Pesos Chilenos (CLP) */}
      <div className="space-y-3 pt-3 border-t border-[#E5E5E5]">
        <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
          Precio en Pesos Chilenos (CLP)
        </label>
        
        {/* Preset quick buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          {PRICE_PRESETS.map((preset, idx) => {
            const isCurrent = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (isCurrent) {
                    setMinPrice("");
                    setMaxPrice("");
                  } else {
                    setMinPrice(preset.min);
                    setMaxPrice(preset.max);
                  }
                }}
                className={`px-2 py-1.5 rounded-lg text-[11px] text-center transition font-medium truncate ${
                  isCurrent
                    ? "bg-[#FF6B35] text-white font-bold shadow"
                    : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] hover:bg-slate-200 border border-[#E5E5E5]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Inputs Min / Max */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#666666] font-mono">$</span>
            <input
              type="number"
              placeholder="Mínimo"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/50 focus:outline-none focus:border-[#FF6B35] font-mono"
            />
          </div>
          <span className="text-[#666666] text-xs">-</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#666666] font-mono">$</span>
            <input
              type="number"
              placeholder="Máximo"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/50 focus:outline-none focus:border-[#FF6B35] font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. Disponibilidad / Modalidad de Compra */}
      <div className="space-y-2.5 pt-3 border-t border-[#E5E5E5]">
        <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
          Disponibilidad & Compra
        </label>
        <div className="space-y-1">
          {[
            { id: "ALL", label: "Todos los Estados", icon: Tag },
            { id: "IN_STOCK", label: "En Stock Inmediato", icon: PackageCheck, desc: "Despacho en 24-48h" },
            { id: "PREORDER", label: "Preventas con Reserva", icon: Clock, desc: "Asegura con 20-30% de pie" },
          ].map((item) => {
            const isSelected = stockFilter === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setStockFilter(item.id as any)}
                className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                  isSelected
                    ? "bg-[#1F3A5F] text-white border border-[#1F3A5F] shadow-sm"
                    : "text-[#1A1A1A]/80 hover:bg-[#F7F7F5] hover:text-[#1A1A1A]"
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-[#FF6B35]" : "text-[#666666]"}`} />
                <div>
                  <div className="text-xs font-semibold">{item.label}</div>
                  {item.desc && (
                    <div className="text-[10px] text-[#666666] leading-tight mt-0.5">
                      {item.desc}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Filtros Específicos según Categoría */}
      {(selectedCategory === "ALL" || selectedCategory === "VIDEO_GAME") && (
        <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
          <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
            Plataforma
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Todas" },
              { id: "PS5", label: "PlayStation 5" },
              { id: "SWITCH", label: "Nintendo Switch" },
              { id: "PC", label: "PC" },
              { id: "XBOX", label: "Xbox Series" },
            ].map((plat) => {
              const isSelected =
                platformFilter === plat.id ||
                (plat.id === "SWITCH" && platformFilter === "NINTENDO_SWITCH") ||
                (plat.id === "XBOX" && platformFilter === "XBOX_SERIES");
              return (
                <button
                  key={plat.id}
                  onClick={() => setPlatformFilter(plat.id === "ALL" ? "ALL" : isSelected ? "ALL" : plat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    isSelected
                      ? "bg-[#FF6B35] text-white font-bold shadow-xs"
                      : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5]"
                  }`}
                >
                  {plat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(selectedCategory === "ALL" || selectedCategory === "FIGURE") && (
        <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
          <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
            Escala & Formato (Figuras)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Todas" },
              { id: "SCALE_1_7", label: "Escala 1/7" },
              { id: "NENDOROID", label: "Nendoroid" },
              { id: "FIGMA", label: "Figma" },
              { id: "SCALE_1_4", label: "Escala 1/4" },
            ].map((scale) => (
              <button
                key={scale.id}
                onClick={() => setScaleFilter(scale.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  scaleFilter === scale.id
                    ? "bg-[#FF6B35] text-white font-bold"
                    : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5]"
                }`}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(selectedCategory === "ALL" || selectedCategory === "COLLECTIBLE") && (
        <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
          <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
            Certificación & Estado
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Todas" },
              { id: "PSA_9", label: "PSA 9 Mint" },
              { id: "GEM_10", label: "Gem Mint 10" },
              { id: "UNGRADED", label: "Memorabilia / Sellado" },
            ].map((cond) => (
              <button
                key={cond.id}
                onClick={() => setConditionFilter(cond.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  conditionFilter === cond.id
                    ? "bg-[#FF6B35] text-white font-bold"
                    : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5]"
                }`}
              >
                {cond.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros Especializados: Consolas */}
      {(selectedCategory === "ALL" || selectedCategory === "CONSOLE") && (
        <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
          <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
            Formato de Consola
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Todas" },
              { id: "DESKTOP", label: "Sobremesa" },
              { id: "PORTABLE", label: "Portátil" },
              { id: "LIMITED", label: "Edición Limitada" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setConsoleTypeFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  consoleTypeFilter === item.id
                    ? "bg-[#FF6B35] text-white font-bold"
                    : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros Especializados: Hardware & Componentes */}
      {(selectedCategory === "ALL" || selectedCategory === "HARDWARE") && (
        <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
          <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
            Tipo de Hardware & Componente
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Todos" },
              { id: "STORAGE", label: "SSD NVMe / M.2" },
              { id: "GPU", label: "Tarjetas Gráficas" },
              { id: "CPU_RAM", label: "CPU & RAM" },
              { id: "COOLING", label: "Cooling / Fuentes" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setHardwareTypeFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  hardwareTypeFilter === item.id
                    ? "bg-[#FF6B35] text-white font-bold"
                    : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros Especializados: Accesorios Gaming */}
      {(selectedCategory === "ALL" || selectedCategory === "GAMING_ACCESSORY") && (
        <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
          <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
            Tipo de Periférico Gamer
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Todos" },
              { id: "MOUSE", label: "Mouse" },
              { id: "KEYBOARD", label: "Teclados" },
              { id: "HEADSET", label: "Audífonos" },
              { id: "CONTROLLER", label: "Mandos" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setAccessoryTypeFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  accessoryTypeFilter === item.id
                    ? "bg-[#FF6B35] text-white font-bold"
                    : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros Especializados: Manga / Artbooks */}
      {(selectedCategory === "ALL" || selectedCategory === "BOOK") && (
        <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
          <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
            Idioma & Formato Manga
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Todos" },
              { id: "ES", label: "Español Neutro" },
              { id: "JP", label: "Japonés Original" },
              { id: "ARTBOOK", label: "Artbooks" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setBookLangFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  bookLangFilter === item.id
                    ? "bg-[#FF6B35] text-white font-bold"
                    : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros Especializados: Ropa & Estilo */}
      {(selectedCategory === "ALL" || selectedCategory === "APPAREL") && (
        <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
          <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
            Talla & Prenda
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Todas" },
              { id: "HOODIE", label: "Hoodies" },
              { id: "M", label: "Talla M" },
              { id: "L", label: "Talla L" },
              { id: "XL", label: "Talla XL" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setApparelSizeFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  apparelSizeFilter === item.id
                    ? "bg-[#FF6B35] text-white font-bold"
                    : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros Especializados: Merchandising */}
      {(selectedCategory === "ALL" || selectedCategory === "MERCH") && (
        <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
          <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
            Tipo de Merchandising
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Todos" },
              { id: "PLUSH", label: "Peluches" },
              { id: "STAND", label: "Acrílicos" },
              { id: "KEYCHAIN", label: "Llaveros" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMerchTypeFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  merchTypeFilter === item.id
                    ? "bg-[#FF6B35] text-white font-bold"
                    : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros Especializados: Audio & OST */}
      {(selectedCategory === "ALL" || selectedCategory === "AUDIO") && (
        <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
          <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
            Formato de Audio
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Todos" },
              { id: "VINYL", label: "Vinilos LP 180g" },
              { id: "CD", label: "CD Original" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setAudioFormatFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  audioFormatFilter === item.id
                    ? "bg-[#FF6B35] text-white font-bold"
                    : "bg-[#F7F7F5] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seller Confidence Micro-card */}
      <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-[#1F3A5F] font-semibold">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#FF6B35]" />
          <span>Garantía Coleccionista</span>
        </div>
        <p className="text-[11px] text-[#666666] leading-relaxed">
          Precios finales en CLP sin cobros sorpresa de aduanas. Reserva asegurada contra alzas del dólar.
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner with Dynamic Category Context */}
      {(() => {
        const customMeta = CUSTOM_CATEGORIES_METADATA[selectedCategory];
        const badge = selectedCategory === "VIDEO_GAME"
          ? "Catálogo Videojuegos"
          : selectedCategory === "FIGURE"
          ? "Catálogo Figuras"
          : selectedCategory === "COLLECTIBLE"
          ? "Catálogo TCG & Rarezas PSA"
          : selectedCategory === "BUNDLE"
          ? "Catálogo Bundles & Packs"
          : customMeta
          ? customMeta.bannerBadge
          : selectedCategory === "OTHER"
          ? "Catálogo Categorías Especiales"
          : "Catálogo General";

        const title = selectedCategory === "VIDEO_GAME"
          ? "Videojuegos & Ediciones Especiales"
          : selectedCategory === "FIGURE"
          ? "Figuras a Escala & Model Kits"
          : selectedCategory === "COLLECTIBLE"
          ? "Cartas Graduadas PSA & Rarezas"
          : selectedCategory === "BUNDLE"
          ? "Bundles Compuestos & Ofertas"
          : customMeta
          ? customMeta.bannerTitle
          : selectedCategory === "OTHER"
          ? "Coleccionables & Hardware Especializado"
          : "Coleccionables, Videojuegos & Ediciones Japonesas";

        const desc = selectedCategory === "VIDEO_GAME"
          ? "Títulos para Nintendo Switch, PS5, Xbox y PC. Preventas aseguradas con entrega el día de estreno en Chile."
          : selectedCategory === "FIGURE"
          ? "Figuras 100% originales importadas de Japón (Good Smile Company, Alter, Kotobukiya y más)."
          : selectedCategory === "COLLECTIBLE"
          ? "Cartas TCG certificadas con cápsula de seguridad y valor garantizado en pesos chilenos."
          : selectedCategory === "BUNDLE"
          ? "Packs seleccionados con descuento exclusivo y reserva sincronizada."
          : customMeta
          ? customMeta.bannerDesc
          : selectedCategory === "OTHER"
          ? "Líneas de consolas, accesorios gamer, indumentaria, tomos de manga y merchandising oficial con garantía."
          : "Explora preventas oficiales con precio congelado en CLP, cartas graduadas PSA de alta gama y figuras licenciadas con despacho asegurado a todo Chile.";

        return (
          <div className="space-y-2 border-b border-[#E5E5E5] pb-6">
            <div className="flex items-center gap-2 text-[#FF6B35] font-semibold text-xs uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4" />
              {badge}
            </div>
            <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-[#666666] max-w-2xl">
              {desc}
            </p>
          </div>
        );
      })()}

      {/* Main Catalog Grid: Left Filter Sidebar + Right Products Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filter Sidebar for Desktop */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 p-5 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm max-h-[calc(100vh-7rem)] overflow-y-auto pr-3">
          {renderSidebarFilters()}
        </aside>

        {/* Right Products Panel */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* Search, Sort and Mobile Filter Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU (ej. FIG-MAKIMA-17), escala o saga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-[#1A1A1A] placeholder-[#666666]/60 text-xs focus:outline-none focus:border-[#FF6B35] transition shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#1A1A1A]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Visual Search Button with Gemini Vision */}
            <button
              type="button"
              onClick={() => setIsVisualSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1F3A5F] to-[#152842] hover:from-[#FF6B35] hover:to-[#E85A24] text-white text-xs font-bold transition shadow-sm group shrink-0"
              title="Buscar por imagen o foto con IA Gemini Vision"
            >
              <Camera className="w-4 h-4 text-[#FF6B35] group-hover:text-white transition" />
              <span className="hidden sm:inline">Buscar por Foto</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/20 text-white font-mono">IA</span>
            </button>

            {/* Mobile Filters Drawer Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#2D5180] border border-[#1F3A5F] text-white text-xs font-semibold transition shadow-sm"
            >
              <Filter className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>Filtros Avanzados</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="sm:w-56 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Ordenar productos"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#FF6B35] cursor-pointer shadow-sm"
              >
                <option value="FEATURED">Destacados del Coleccionista</option>
                <option value="PREORDER_FIRST">Preventas Primero</option>
                <option value="PRICE_ASC">Precio: Menor a Mayor</option>
                <option value="PRICE_DESC">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>

          {/* Active Filters Badges Bar & Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E5E5E5] text-xs shadow-sm">
            <div className="text-[#666666]">
              {totalItems > 0 ? (
                <>
                  Mostrando <span className="text-[#1A1A1A] font-bold">{startIndex + 1} - {endIndex}</span> de{" "}
                  <span className="text-[#1A1A1A] font-bold">{totalItems}</span> productos
                  {totalPages > 1 && (
                    <span className="ml-1.5 text-xs text-[#FF6B35] font-semibold">
                      (Pág. {safePage} de {totalPages})
                    </span>
                  )}
                </>
              ) : (
                <>0 productos encontrados</>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedCategory !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1F3A5F] text-white text-[11px] font-medium border border-[#1F3A5F]">
                    Cat: {CUSTOM_CATEGORIES_METADATA[selectedCategory]?.label || selectedCategory}
                    <button onClick={() => handleCategoryChange("ALL")} className="hover:text-[#FF6B35]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {minPrice !== "" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F7F7F5] text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E5]">
                    Min: {formatCLP(Number(minPrice))}
                    <button onClick={() => setMinPrice("")} className="hover:text-[#FF6B35]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {maxPrice !== "" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F7F7F5] text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E5]">
                    Max: {formatCLP(Number(maxPrice))}
                    <button onClick={() => setMaxPrice("")} className="hover:text-[#FF6B35]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {stockFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F7F7F5] text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E5]">
                    {stockFilter === "IN_STOCK" ? "Stock Inmediato" : "Preventa"}
                    <button onClick={() => setStockFilter("ALL")} className="hover:text-[#FF6B35]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {platformFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F7F7F5] text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E5]">
                    {platformFilter === "NINTENDO_SWITCH" || platformFilter === "SWITCH" ? "Nintendo Switch" : platformFilter === "XBOX_SERIES" || platformFilter === "XBOX" ? "Xbox Series" : platformFilter === "PS5" ? "PlayStation 5" : platformFilter}
                    <button onClick={() => setPlatformFilter("ALL")} className="hover:text-[#FF6B35]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {scaleFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F7F7F5] text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E5]">
                    {scaleFilter}
                    <button onClick={() => setScaleFilter("ALL")} className="hover:text-[#FF6B35]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {conditionFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F7F7F5] text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E5]">
                    {conditionFilter}
                    <button onClick={() => setConditionFilter("ALL")} className="hover:text-[#FF6B35]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F7F7F5] text-[#1A1A1A] text-[11px] font-medium border border-[#E5E5E5]">
                    &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery("")} className="hover:text-[#FF6B35]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={resetAllFilters}
                  className="text-[11px] text-[#FF6B35] hover:underline font-semibold ml-1"
                >
                  Restablecer
                </button>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div ref={catalogGridRef} className="scroll-mt-6">
            {paginatedProducts.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.sku} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E5E5E5]">
                    <div className="text-xs text-[#666666]">
                      Página <span className="font-bold text-[#1A1A1A]">{safePage}</span> de{" "}
                      <span className="font-bold text-[#1A1A1A]">{totalPages}</span> (21 productos por página • 7 filas de 3)
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={safePage <= 1}
                        onClick={() => handlePageChange(safePage - 1)}
                        className="px-3 py-2 rounded-xl text-xs font-bold border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#FF6B35] hover:text-[#FF6B35] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-xs"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </button>

                      {/* Numeric Page Buttons */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                              safePage === pageNum
                                ? "bg-[#1F3A5F] text-white shadow-md shadow-[#1F3A5F]/20"
                                : "bg-white border border-[#E5E5E5] text-[#666666] hover:text-[#1A1A1A] hover:border-slate-400"
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={safePage >= totalPages}
                        onClick={() => handlePageChange(safePage + 1)}
                        className="px-3 py-2 rounded-xl text-xs font-bold border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#FF6B35] hover:text-[#FF6B35] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-xs"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-[#E5E5E5] space-y-3 shadow-sm">
                <Filter className="w-10 h-10 text-[#666666] mx-auto opacity-70" />
                <h3 className="text-[#1A1A1A] font-bold text-base">No se encontraron productos</h3>
                <p className="text-xs text-[#666666] max-w-sm mx-auto">
                  No hay artículos que coincidan con la combinación de filtros aplicada en el catálogo.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="text-xs px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold transition shadow-md shadow-[#FF6B35]/20"
                >
                  Limpiar Todos los Filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Slide-over Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs bg-white border-l border-[#E5E5E5] h-full p-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                <div className="flex items-center gap-2 text-[#1A1A1A] font-bold text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-[#FF6B35]" />
                  Filtros de Catálogo
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-[#666666] hover:text-[#1A1A1A] hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderSidebarFilters()}
            </div>

            <div className="pt-6 border-t border-[#E5E5E5] sticky bottom-0 bg-white pb-2">
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold text-xs shadow-md transition text-center"
              >
                Ver {filteredProducts.length} Productos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Search with Gemini Vision Modal */}
      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
        onApplySearch={(query, category) => {
          setSearchQuery(query);
          if (category) {
            setSelectedCategory(category);
          }
          setCurrentPage(1);
        }}
      />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-[#9bb5c2] text-xs">
          Cargando catálogo especializado en CLP...
        </div>
      }
    >
      <CatalogContent />
    </React.Suspense>
  );
}

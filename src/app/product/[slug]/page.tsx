"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Clock,
  Package,
  ArrowLeft,
  Check,
  Pencil,
  Heart,
  MessageCircle,
  Play,
  HelpCircle,
  Tag,
  CheckCircle2,
  Tv,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { formatCLP, formatCLPShort } from "@/lib/utils/currency";
import { BASE_PRODUCTS } from "@/lib/constants/catalog";
import { RelatedProductsSlider } from "@/components/catalog/RelatedProductsSlider";
import { analytics } from "@/lib/services/AnalyticsTracker";
import { extractYouTubeEmbedUrl } from "@/lib/utils/media";
import { HolographicCard } from "@/components/catalog/HolographicCard";
import { InspectionZoom } from "@/components/product/InspectionZoom";
import { MintPackagingBadge } from "@/components/trust/MintPackagingBadge";
import { ProductAlertSubscription } from "@/components/product/ProductAlertSubscription";

const CATALOG_ITEMS = BASE_PRODUCTS;

function getProductCategoryInfo(product: any) {
  if (!product) {
    return {
      key: "ALL",
      label: "Catálogo",
      href: "/catalog",
      defaultTags: ["Coleccionable", "Oficial"],
      formatLabel: "Producto Oficial",
      brand: "Fabricante Oficial",
      bracketTag: "Producto Oficial",
    };
  }

  const type = product?.type || "OTHER";
  const specCat = (product?.customSpecifications?.categoryType || "").toUpperCase();
  const catLabel = (product?.customCategoryLabel || "").toLowerCase();
  const sku = (product?.sku || "").toLowerCase();
  const name = (product?.name || "").toLowerCase();

  const isConsole =
    type === "CONSOLE" ||
    specCat === "CONSOLE" ||
    catLabel === "consolas" ||
    catLabel === "consola" ||
    sku.startsWith("con-") ||
    name.includes("switch") ||
    name.includes("ps5") ||
    name.includes("playstation") ||
    name.includes("xbox") ||
    (catLabel.includes("consola") && !catLabel.includes("accesorio"));

  if (isConsole) {
    const brand = name.includes("sony") || name.includes("playstation") || name.includes("ps5")
      ? "Sony PlayStation"
      : name.includes("nintendo") || name.includes("switch")
      ? "Nintendo"
      : name.includes("xbox") || name.includes("microsoft")
      ? "Microsoft Xbox"
      : "Fabricante Oficial";

    return {
      key: "CONSOLE",
      label: "Consolas",
      href: "/catalog?category=CONSOLE",
      defaultTags: ["Consolas", "Gaming", "Sistemas"],
      formatLabel: product?.customSpecifications?.console?.format || "Consola Oficial Sellada",
      brand,
      bracketTag: "Consola Oficial",
    };
  }

  const isHardware =
    type === "HARDWARE" ||
    specCat === "HARDWARE" ||
    catLabel.includes("hardware") ||
    catLabel.includes("componente") ||
    catLabel.includes("tarjeta") ||
    catLabel.includes("procesador") ||
    catLabel.includes("ssd") ||
    catLabel.includes("ram") ||
    catLabel.includes("gpu") ||
    catLabel.includes("placa") ||
    catLabel.includes("fuente") ||
    catLabel.includes("cooler") ||
    catLabel.includes("gabinete") ||
    catLabel.includes("ventilador") ||
    sku.startsWith("hw-");

  if (isHardware) {
    const hwType = product?.customSpecifications?.hardware?.hardwareType;
    const hwTypeName =
      hwType === "TARJETA_DE_VIDEO"
        ? "Tarjeta Gráfica"
        : hwType === "PROCESADORES"
        ? "Procesador"
        : hwType === "PLACA_MADRE"
        ? "Placa Madre"
        : hwType === "RAM"
        ? "Memoria RAM"
        : hwType === "SSD"
        ? "Almacenamiento SSD"
        : hwType === "DISCO_DURO"
        ? "Disco Duro"
        : hwType === "FUENTE_DE_PODER"
        ? "Fuente de Poder"
        : hwType === "COOLER_CPU"
        ? "Cooler CPU"
        : hwType === "GABINETE"
        ? "Gabinete"
        : hwType === "VENTILADORES"
        ? "Ventilador"
        : product?.customSpecifications?.hardware?.componentType || "Componente Hardware";

    const brand =
      product?.customSpecifications?.hardware?.brand ||
      product?.customSpecifications?.hardware?.gpu?.manufacturer ||
      product?.customSpecifications?.hardware?.motherboard?.manufacturer ||
      (name.includes("msi")
        ? "MSI"
        : name.includes("asus")
        ? "ASUS"
        : name.includes("gigabyte")
        ? "Gigabyte"
        : name.includes("corsair")
        ? "Corsair"
        : name.includes("kingston")
        ? "Kingston"
        : name.includes("samsung")
        ? "Samsung"
        : name.includes("nvidia")
        ? "NVIDIA"
        : name.includes("amd")
        ? "AMD"
        : "Fabricante Oficial");

    return {
      key: "HARDWARE",
      label: "Hardware",
      href: "/catalog?category=HARDWARE",
      defaultTags: [hwTypeName, brand, "Hardware PC"],
      formatLabel: product?.customSpecifications?.hardware?.componentType || "Componente Hardware Oficial",
      brand,
      bracketTag: hwTypeName,
    };
  }

  const isAccessory =
    specCat === "GAMING_ACCESSORY" ||
    catLabel.includes("accesorio") ||
    catLabel.includes("gaming") ||
    catLabel.includes("periferico") ||
    sku.startsWith("acc-") ||
    name.includes("mouse") ||
    name.includes("teclado") ||
    name.includes("audifono") ||
    name.includes("headset") ||
    name.includes("mando") ||
    name.includes("control");

  if (isAccessory) {
    const accType = product?.customSpecifications?.gamingAccessory?.accessoryType;
    const accTypeName =
      accType === "MOUSE"
        ? "Mouse Gamer"
        : accType === "KEYBOARD"
        ? "Teclado Mecánico"
        : accType === "HEADSET"
        ? "Audífonos Gamer"
        : accType === "CONTROLLER"
        ? "Mando / Control"
        : (name.includes("headset") || name.includes("audifono"))
        ? "Audífonos Gamer"
        : (name.includes("mouse") || name.includes("raton"))
        ? "Mouse Gamer"
        : (name.includes("teclado") || name.includes("keyboard"))
        ? "Teclado Gamer"
        : "Accesorio Gamer";

    const brand =
      product?.customSpecifications?.gamingAccessory?.mouse?.brand ||
      product?.customSpecifications?.gamingAccessory?.keyboard?.brand ||
      product?.customSpecifications?.gamingAccessory?.headset?.brand ||
      product?.customSpecifications?.gamingAccessory?.controller?.brand ||
      (name.includes("razer")
        ? "Razer"
        : name.includes("logitech")
        ? "Logitech G"
        : name.includes("hyperx")
        ? "HyperX"
        : name.includes("corsair")
        ? "Corsair"
        : name.includes("steelseries")
        ? "SteelSeries"
        : name.includes("redragon")
        ? "Redragon"
        : "Fabricante Oficial");

    return {
      key: "GAMING_ACCESSORY",
      label: "Accesorios",
      href: "/catalog?category=GAMING_ACCESSORY",
      defaultTags: [accTypeName, brand, "Periféricos"],
      formatLabel: product?.customCategoryLabel || "Accesorio Gaming Oficial",
      brand,
      bracketTag: accTypeName,
    };
  }

  const isApparel =
    specCat === "APPAREL" ||
    catLabel.includes("ropa") ||
    catLabel.includes("estilo") ||
    catLabel.includes("poleron") ||
    catLabel.includes("polera") ||
    catLabel.includes("hoodie");

  if (isApparel) {
    return {
      key: "APPAREL",
      label: "Ropa & Estilo",
      href: "/catalog?category=APPAREL",
      defaultTags: ["Moda Gamer", "Ropa Urbana", "Streetwear"],
      formatLabel: "Indumentaria Oficial Sellada",
      brand: product?.customSpecifications?.apparel?.brand || "OmniCollector Estilo",
      bracketTag: "Ropa & Estilo",
    };
  }

  const isBook =
    specCat === "BOOK" ||
    catLabel.includes("manga") ||
    catLabel.includes("artbook") ||
    catLabel.includes("libro") ||
    catLabel.includes("comic") ||
    catLabel.includes("tomo");

  if (isBook) {
    return {
      key: "BOOK",
      label: "Manga & Artbooks",
      href: "/catalog?category=BOOK",
      defaultTags: ["Manga", "Artbook", "Lectura"],
      formatLabel: product?.customSpecifications?.book?.binding || "Tomo Manga / Libro Oficial",
      brand: product?.customSpecifications?.book?.publisher || "Editorial Oficial",
      bracketTag: "Manga / Artbook",
    };
  }

  const isMerch =
    specCat === "MERCH" ||
    catLabel.includes("merch") ||
    catLabel.includes("peluche") ||
    catLabel.includes("llavero") ||
    catLabel.includes("taza") ||
    catLabel.includes("decoraci");

  if (isMerch) {
    return {
      key: "MERCH",
      label: "Merchandising",
      href: "/catalog?category=MERCH",
      defaultTags: ["Merchandising", "Coleccionables", "Oficial"],
      formatLabel: "Artículo Coleccionable Oficial",
      brand: product?.customSpecifications?.merch?.brand || "Licencia Oficial",
      bracketTag: "Merchandising",
    };
  }

  const isAudio =
    specCat === "AUDIO" ||
    catLabel.includes("audio") ||
    catLabel.includes("ost") ||
    catLabel.includes("soundtrack") ||
    catLabel.includes("vinilo");

  if (isAudio) {
    return {
      key: "AUDIO",
      label: "Audio / OST",
      href: "/catalog?category=AUDIO",
      defaultTags: ["Audio", "Banda Sonora", "Vinilo / CD"],
      formatLabel: "Álbum / Edición Musical Oficial",
      brand: product?.customSpecifications?.audio?.label || "Sello Musical Oficial",
      bracketTag: "Audio / OST",
    };
  }

  if (type === "VIDEO_GAME") {
    const isPc = product?.gameMetadata?.gameType === "PC" || product?.gameMetadata?.platform === "PC";
    const tagPlatform = isPc ? "PC Gaming" : (product?.gameMetadata?.platform?.replace(/_/g, " ") || "Consola");
    return {
      key: "VIDEO_GAME",
      label: "Videojuegos",
      href: "/catalog?category=VIDEO_GAME",
      defaultTags: isPc ? ["PC Gaming", "Steam", "Videojuegos"] : ["Consola", tagPlatform, "Videojuegos"],
      formatLabel: product?.gameMetadata?.isDigital ? "Digital (Código Oficial)" : "Físico (Disco / Cartucho Sellado)",
      brand: product?.gameMetadata?.developer || product?.gameMetadata?.publisher || "Publisher Oficial",
      bracketTag: isPc ? "Juego PC" : `Juego ${tagPlatform}`,
    };
  }

  if (type === "FIGURE") {
    return {
      key: "FIGURE",
      label: "Figuras",
      href: "/catalog?category=FIGURE",
      defaultTags: ["Colección", "Anime", "Escala"],
      formatLabel: `Figura Coleccionable ${product?.figureMetadata?.scale?.replace("SCALE_", "Escala ") || "1/7"}`,
      brand: product?.figureMetadata?.manufacturer?.replace(/_/g, " ") || "Fabricante Oficial",
      bracketTag: `Figura ${product?.figureMetadata?.scale?.replace("SCALE_", "1/") || "1/7"}`,
    };
  }

  if (type === "COLLECTIBLE") {
    return {
      key: "COLLECTIBLE",
      label: "TCG & Rarezas",
      href: "/catalog?category=COLLECTIBLE",
      defaultTags: ["TCG", "Graduada", "Coleccionable"],
      formatLabel: `Carta Certificada ${product?.collectibleMetadata?.authenticationBody || "PSA"}`,
      brand: product?.collectibleMetadata?.authenticationBody || "Certificación Oficial",
      bracketTag: `Carta ${product?.collectibleMetadata?.authenticationBody || "PSA"}`,
    };
  }

  if (type === "BUNDLE") {
    return {
      key: "BUNDLE",
      label: "Bundles",
      href: "/catalog?category=BUNDLE",
      defaultTags: ["Bundle", "Pack Especial", "Ahorro"],
      formatLabel: "Bundle Especial Compuesto",
      brand: "OmniCollector",
      bracketTag: "Bundle Especial",
    };
  }

  return {
    key: "ALL",
    label: "Catálogo",
    href: "/catalog",
    defaultTags: ["Coleccionable", "Oficial"],
    formatLabel: product?.customCategoryLabel || "Producto Oficial",
    brand: "Fabricante Oficial",
    bracketTag: product?.customCategoryLabel || "Producto Oficial",
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const rawSlug = (params?.slug as string) || "";
  const slug = rawSlug.toLowerCase();

  const staticProduct = CATALOG_ITEMS.find(
    (item) =>
      item.sku.toLowerCase() === slug ||
      item.id === slug ||
      item.sku.toLowerCase().replace(/_/g, "-") === slug
  );

  const [product, setProduct] = useState<any>(staticProduct || null);
  const [loading, setLoading] = useState<boolean>(!staticProduct);
  const [allCatalogProducts, setAllCatalogProducts] = useState<any[]>([]);

  const { addItem } = useCartStore();
  const { toggleWishlist, isProductWishlisted } = useAuthStore();
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [selectedDepositMode, setSelectedDepositMode] = useState<"PARTIAL" | "FULL">("PARTIAL");
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    analytics.trackPageView(`/product/${slug}`, product?.name || slug);
  }, [slug, product?.name]);

  useEffect(() => {
    // 1. Fetch live product data from database so edits and custom fields are reflected immediately
    fetch(`/api/products?sku=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.product) {
          setProduct(data.data.product);
          analytics.trackProductView({
            sku: data.data.product.sku,
            name: data.data.product.name,
            category: data.data.product.type,
            price: data.data.product.price,
          });
        }
      })
      .catch((err) => console.error("Error fetching product by slug:", err))
      .finally(() => setLoading(false));

    // 2. Fetch full catalog from database so the Related Products slider displays real database products
    fetch(`/api/products?fresh=true&t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.products)) {
          setAllCatalogProducts(data.data.products);
          // If specific SKU lookup hasn't set product yet, search inside full catalog
          setProduct((prev: any) => {
            if (prev) return prev;
            const found = data.data.products.find(
              (p: any) =>
                p.sku?.toLowerCase() === slug ||
                p.id?.toLowerCase() === slug ||
                p.sku?.toLowerCase().replace(/_/g, "-") === slug
            );
            return found || null;
          });
        }
      })
      .catch((err) => console.error("Error fetching live catalog for related slider:", err));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#1F3A5F]/20 border-t-[#FF6B35] rounded-full animate-spin mx-auto"></div>
        <p className="text-[#666666] text-sm">Cargando ficha especializada del producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Producto no encontrado</h2>
        <p className="text-[#666666] text-sm">El SKU o producto solicitado no existe en nuestro catálogo.</p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#FF6B35] text-white font-medium text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
        </Link>
      </div>
    );
  }

  const isPreOrder = Boolean(product.isPreOrder);
  const isBundle = product.type === "BUNDLE";
  const isCollectible = product.type === "COLLECTIBLE";
  const isLiked = isProductWishlisted(product.id);

  const productImages: string[] =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
      ? [product.imageUrl]
      : [];

  const defaultDepositPercent = product.figureMetadata?.minimumDepositPercent ?? 0.2;
  const depositAmount = Math.round((product.price || 0) * defaultDepositPercent);
  const remainingBalance = Math.round((product.price || 0) - depositAmount);
  const amountChargedNow = isPreOrder && selectedDepositMode === "PARTIAL" ? depositAmount : product.price;

  // Calculate discount percentage if originalPrice is present
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  // Extract YouTube embed URL
  const embedTrailerUrl = product.trailerUrl ? extractYouTubeEmbedUrl(product.trailerUrl) : null;

  // In-Game / Content Gallery
  const contentGallery: string[] =
    product.contentGallery && product.contentGallery.length > 0
      ? product.contentGallery
      : productImages.length > 1
      ? productImages
      : [];

  // Age Rating badge formatting
  const ageRatingText = product.ageRating || (product.type === "VIDEO_GAME" ? "14+ 14 AÑOS O MÁS" : "14+ TODO PÚBLICO");
  const ratingParts = ageRatingText.split(" ");
  const ratingMain = ratingParts[0] || "14+";
  const ratingSub = ratingParts.slice(1).join(" ") || "AÑOS O MÁS";

  // Category Classification Info
  const categoryInfo = getProductCategoryInfo(product);

  // Clean Genres List (Strictly eliminates erroneous TCG/Graduada tags on non-TCG items)
  let rawList: string[] = [];
  if (Array.isArray(product.genres)) {
    rawList = product.genres;
  } else if (typeof product.genres === "string" && product.genres.trim()) {
    rawList = product.genres.split(",").map((s: string) => s.trim()).filter(Boolean);
  }

  // Filter out erroneous TCG / Graduada tags if this product is NOT a TCG/COLLECTIBLE
  if (categoryInfo.key !== "COLLECTIBLE") {
    rawList = rawList.filter((g: string) => {
      const lower = g.toLowerCase();
      return (
        !lower.includes("tcg") &&
        !lower.includes("graduada") &&
        !lower.includes("gem mint") &&
        !lower.includes("psa") &&
        !lower.includes("bgs") &&
        !lower.includes("cgc")
      );
    });
  }

  const genresList: string[] = rawList.length > 0 ? rawList : categoryInfo.defaultTags;

  // Technical Specifications List
  const technicalSpecs = [
    {
      label: "Formato Producto",
      value: categoryInfo.formatLabel,
    },
    {
      label: "Fabricante / Marca",
      value: categoryInfo.brand,
    },
    // Videojuegos (Consola y PC)
    ...(product.gameMetadata?.title
      ? [{ label: "Título", value: product.gameMetadata.title }]
      : []),
    ...(product.gameMetadata?.developer
      ? [{ label: "Desarrolladora", value: product.gameMetadata.developer }]
      : []),
    ...(product.gameMetadata?.publisher
      ? [{ label: "Distribuidora", value: product.gameMetadata.publisher }]
      : []),
    ...(product.gameMetadata?.releaseYear
      ? [{ label: "Año de Lanzamiento", value: product.gameMetadata.releaseYear }]
      : []),
    ...(product.gameMetadata?.genre
      ? [{ label: "Género", value: product.gameMetadata.genre }]
      : []),
    ...(product.gameMetadata?.gameModes
      ? [{ label: "Modos de Juego", value: product.gameMetadata.gameModes }]
      : []),
    ...(product.gameMetadata?.gameEngine
      ? [{ label: "Motor de Juego", value: product.gameMetadata.gameEngine }]
      : []),
    ...(product.gameMetadata?.supportedPlatforms
      ? [{ label: "Plataformas", value: product.gameMetadata.supportedPlatforms }]
      : []),
    ...(product.gameMetadata?.audioLanguages
      ? [{ label: "Idioma Audio (Voces)", value: product.gameMetadata.audioLanguages }]
      : []),
    ...(product.gameMetadata?.subtitleLanguages
      ? [{ label: "Idioma Subtítulos (Textos)", value: product.gameMetadata.subtitleLanguages }]
      : []),
    ...(product.gameMetadata?.ageRating
      ? [{ label: "Clasificación por Edad", value: product.gameMetadata.ageRating }]
      : []),
    // Consola: Rendimiento y Hardware
    ...(product.gameMetadata?.fileSize
      ? [{ label: "Espacio en Disco", value: product.gameMetadata.fileSize }]
      : []),
    ...(product.gameMetadata?.displayModes || product.gameMetadata?.resolution
      ? [{ label: "Modos de Visualización", value: product.gameMetadata.displayModes || product.gameMetadata.resolution }]
      : []),
    ...(product.gameMetadata?.xboxSeriesSOptimization
      ? [{ label: "Optimización Xbox Series S", value: product.gameMetadata.xboxSeriesSOptimization }]
      : []),
    ...(product.gameMetadata?.hardwareFeatures
      ? [{ label: "Funciones de Hardware", value: product.gameMetadata.hardwareFeatures }]
      : []),
    // PC: Requisitos de Hardware
    ...(product.gameMetadata?.pcOs
      ? [{ label: "Sistema Operativo", value: product.gameMetadata.pcOs }]
      : []),
    ...(product.gameMetadata?.pcProcessor
      ? [{ label: "Procesador (CPU)", value: product.gameMetadata.pcProcessor }]
      : []),
    ...(product.gameMetadata?.pcRam
      ? [{ label: "Memoria RAM", value: product.gameMetadata.pcRam }]
      : []),
    ...(product.gameMetadata?.pcGpu
      ? [{ label: "Tarjeta Gráfica (GPU)", value: product.gameMetadata.pcGpu }]
      : []),
    ...(product.gameMetadata?.pcStorage
      ? [{ label: "Almacenamiento PC", value: product.gameMetadata.pcStorage }]
      : []),
    ...(product.figureMetadata?.material
      ? [{ label: "Materiales", value: product.figureMetadata.material }]
      : []),
    ...(product.figureMetadata?.dimensions
      ? [{ label: "Dimensiones", value: product.figureMetadata.dimensions }]
      : []),
    ...(product.figureMetadata?.sculptor
      ? [{ label: "Escultor / Diseñador", value: product.figureMetadata.sculptor }]
      : []),
    ...(product.figureMetadata?.boxCondition
      ? [{ label: "Estado del Empaque", value: product.figureMetadata.boxCondition }]
      : []),
    ...(product.collectibleMetadata?.condition
      ? [{ label: "Grado de Condición", value: product.collectibleMetadata.condition.replace(/_/g, " ") }]
      : []),
    ...(product.collectibleMetadata?.serialNumber
      ? [{ label: "Número de Serie Certificado", value: product.collectibleMetadata.serialNumber }]
      : []),
    // Consolas / Hardware
    ...(product.customSpecifications?.console?.baseModel
      ? [{ label: "Modelo Base Consola", value: product.customSpecifications.console.baseModel }]
      : []),
    ...(product.customSpecifications?.console?.capacity
      ? [{ label: "Capacidad Almacenamiento", value: product.customSpecifications.console.capacity }]
      : []),
    ...(product.customSpecifications?.console?.format
      ? [{ label: "Formato de Consola", value: product.customSpecifications.console.format }]
      : []),
    ...(product.customSpecifications?.console?.controllersIncluded
      ? [{ label: "Controles Incluidos", value: product.customSpecifications.console.controllersIncluded }]
      : []),
    ...(product.customSpecifications?.console?.bundleIncluded
      ? [{ label: "Bundle / Accesorios", value: product.customSpecifications.console.bundleIncluded }]
      : []),
    ...(product.customSpecifications?.console?.ports
      ? [{ label: "Puertos & Conexiones", value: product.customSpecifications.console.ports }]
      : []),
    ...(product.customSpecifications?.console?.gameCompatibility
      ? [{ label: "Compatibilidad con Juegos", value: product.customSpecifications.console.gameCompatibility }]
      : []),
    ...(product.customSpecifications?.console?.featuredHighlights
      ? [{ label: "Características Destacadas", value: product.customSpecifications.console.featuredHighlights }]
      : []),
    // Hardware & Componentes
    ...(product.customSpecifications?.hardware?.componentType
      ? [{ label: "Tipo de Componente", value: product.customSpecifications.hardware.componentType }]
      : []),
    ...(product.customSpecifications?.hardware?.brand
      ? [{ label: "Marca del Fabricante", value: product.customSpecifications.hardware.brand }]
      : []),
    ...(product.customSpecifications?.hardware?.model
      ? [{ label: "Modelo Exacto", value: product.customSpecifications.hardware.model }]
      : []),
    ...(product.customSpecifications?.hardware?.interfaceOrSocket
      ? [{ label: "Interfaz / Socket", value: product.customSpecifications.hardware.interfaceOrSocket }]
      : []),
    ...(product.customSpecifications?.hardware?.capacityOrSpeed
      ? [{ label: "Capacidad / Velocidad", value: product.customSpecifications.hardware.capacityOrSpeed }]
      : []),
    ...(product.customSpecifications?.hardware?.formFactor
      ? [{ label: "Factor de Forma", value: product.customSpecifications.hardware.formFactor }]
      : []),
    ...(product.customSpecifications?.hardware?.powerConsumptionTdp
      ? [{ label: "Consumo / TDP", value: product.customSpecifications.hardware.powerConsumptionTdp }]
      : []),
    ...(product.customSpecifications?.hardware?.warrantyYears
      ? [{ label: "Garantía Oficial", value: product.customSpecifications.hardware.warrantyYears }]
      : []),
    ...(product.customSpecifications?.hardware?.featuredHighlights
      ? [{ label: "Características Destacadas", value: product.customSpecifications.hardware.featuredHighlights }]
      : []),
    // Tarjeta de Video (GPU)
    ...(product.customSpecifications?.hardware?.gpu?.manufacturer
      ? [{ label: "Fabricante GPU", value: product.customSpecifications.hardware.gpu.manufacturer }]
      : []),
    ...(product.customSpecifications?.hardware?.gpu?.gpu
      ? [{ label: "GPU", value: product.customSpecifications.hardware.gpu.gpu }]
      : []),
    ...(product.customSpecifications?.hardware?.gpu?.memory
      ? [{ label: "Memoria VRAM", value: product.customSpecifications.hardware.gpu.memory }]
      : []),
    ...(product.customSpecifications?.hardware?.gpu?.bus
      ? [{ label: "Bus de Memoria", value: product.customSpecifications.hardware.gpu.bus }]
      : []),
    ...(((product.customSpecifications?.hardware?.gpu as any)?.coreClocks || product.customSpecifications?.hardware?.gpu?.coreFrequencies)
      ? [{ label: "Frecuencias Core", value: (product.customSpecifications?.hardware?.gpu as any)?.coreClocks || product.customSpecifications?.hardware?.gpu?.coreFrequencies }]
      : []),
    ...(((product.customSpecifications?.hardware?.gpu as any)?.memoryClock || product.customSpecifications?.hardware?.gpu?.memoryFrequency)
      ? [{ label: "Frecuencia Memorias", value: (product.customSpecifications?.hardware?.gpu as any)?.memoryClock || product.customSpecifications?.hardware?.gpu?.memoryFrequency }]
      : []),
    ...(((product.customSpecifications?.hardware?.gpu as any)?.coreName || product.customSpecifications?.hardware?.gpu?.core)
      ? [{ label: "Núcleo", value: (product.customSpecifications?.hardware?.gpu as any)?.coreName || product.customSpecifications?.hardware?.gpu?.core }]
      : []),
    ...(product.customSpecifications?.hardware?.gpu?.profile
      ? [{ label: "Perfil", value: product.customSpecifications.hardware.gpu.profile }]
      : []),
    ...(product.customSpecifications?.hardware?.gpu?.cooling
      ? [{ label: "Refrigeración", value: product.customSpecifications.hardware.gpu.cooling }]
      : []),
    ...(product.customSpecifications?.hardware?.gpu?.slots
      ? [{ label: "Slots Ocupados", value: product.customSpecifications.hardware.gpu.slots }]
      : []),
    ...(product.customSpecifications?.hardware?.gpu?.length
      ? [{ label: "Largo de Tarjeta", value: product.customSpecifications.hardware.gpu.length }]
      : []),
    ...(product.customSpecifications?.hardware?.gpu?.lighting
      ? [{ label: "Iluminación", value: product.customSpecifications.hardware.gpu.lighting }]
      : []),
    ...(((product.customSpecifications?.hardware?.gpu as any)?.hasBackplate || product.customSpecifications?.hardware?.gpu?.backplate)
      ? [{ label: "¿Posee Backplate?", value: (product.customSpecifications?.hardware?.gpu as any)?.hasBackplate || product.customSpecifications?.hardware?.gpu?.backplate }]
      : []),
    ...(product.customSpecifications?.hardware?.gpu?.powerConnectors
      ? [{ label: "Conectores de Poder", value: product.customSpecifications.hardware.gpu.powerConnectors }]
      : []),
    ...(product.customSpecifications?.hardware?.gpu?.videoPorts
      ? [{ label: "Puertos de Video", value: product.customSpecifications.hardware.gpu.videoPorts }]
      : []),
    // Procesadores (CPU)
    ...(product.customSpecifications?.hardware?.cpu?.frequency
      ? [{ label: "Frecuencia Base", value: product.customSpecifications.hardware.cpu.frequency }]
      : []),
    ...(product.customSpecifications?.hardware?.cpu?.turboFrequency
      ? [{ label: "Frecuencia Turbo Máx.", value: product.customSpecifications.hardware.cpu.turboFrequency }]
      : []),
    ...(product.customSpecifications?.hardware?.cpu?.coresThreads
      ? [{ label: "Núcleos / Hilos", value: product.customSpecifications.hardware.cpu.coresThreads }]
      : []),
    ...(product.customSpecifications?.hardware?.cpu?.cache
      ? [{ label: "Memoria Caché", value: product.customSpecifications.hardware.cpu.cache }]
      : []),
    ...(product.customSpecifications?.hardware?.cpu?.socket
      ? [{ label: "Socket CPU", value: product.customSpecifications.hardware.cpu.socket }]
      : []),
    ...(((product.customSpecifications?.hardware?.cpu as any)?.coreName || product.customSpecifications?.hardware?.cpu?.core)
      ? [{ label: "Núcleo / Arquitectura", value: (product.customSpecifications?.hardware?.cpu as any)?.coreName || product.customSpecifications?.hardware?.cpu?.core }]
      : []),
    ...(product.customSpecifications?.hardware?.cpu?.manufacturingProcess
      ? [{ label: "Proceso de Manufactura", value: product.customSpecifications.hardware.cpu.manufacturingProcess }]
      : []),
    ...(product.customSpecifications?.hardware?.cpu?.tdp
      ? [{ label: "TDP", value: product.customSpecifications.hardware.cpu.tdp }]
      : []),
    ...(product.customSpecifications?.hardware?.cpu?.cooler
      ? [{ label: "Cooler Incluido", value: product.customSpecifications.hardware.cpu.cooler }]
      : []),
    ...(product.customSpecifications?.hardware?.cpu?.integratedGraphics
      ? [{ label: "Gráficos Integrados", value: product.customSpecifications.hardware.cpu.integratedGraphics }]
      : []),
    // Placa Madre
    ...(product.customSpecifications?.hardware?.motherboard?.manufacturer
      ? [{ label: "Fabricante Placa", value: product.customSpecifications.hardware.motherboard.manufacturer }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.socket
      ? [{ label: "Socket", value: product.customSpecifications.hardware.motherboard.socket }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.chipset
      ? [{ label: "Chipset", value: product.customSpecifications.hardware.motherboard.chipset }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.memorySlots
      ? [{ label: "Slots Memorias", value: product.customSpecifications.hardware.motherboard.memorySlots }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.memoryChannels
      ? [{ label: "Canales Memoria", value: product.customSpecifications.hardware.motherboard.memoryChannels }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.format
      ? [{ label: "Formato Placa", value: product.customSpecifications.hardware.motherboard.format }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.rgbSupport
      ? [{ label: "Soporte RGB", value: product.customSpecifications.hardware.motherboard.rgbSupport }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.videoPorts
      ? [{ label: "Puertos de Video", value: product.customSpecifications.hardware.motherboard.videoPorts }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.powerPorts
      ? [{ label: "Puertos de Energía", value: product.customSpecifications.hardware.motherboard.powerPorts }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.sliSupport
      ? [{ label: "Soporte SLI", value: product.customSpecifications.hardware.motherboard.sliSupport }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.crossfireSupport
      ? [{ label: "Soporte CrossFire", value: product.customSpecifications.hardware.motherboard.crossfireSupport }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.raidSupport
      ? [{ label: "Soporte RAID", value: product.customSpecifications.hardware.motherboard.raidSupport }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.connectors
      ? [{ label: "Conectores", value: product.customSpecifications.hardware.motherboard.connectors }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.ports
      ? [{ label: "Puertos Posteriores", value: product.customSpecifications.hardware.motherboard.ports }]
      : []),
    ...(product.customSpecifications?.hardware?.motherboard?.expansions
      ? [{ label: "Ranuras de Expansión", value: product.customSpecifications.hardware.motherboard.expansions }]
      : []),
    // Memoria RAM
    ...(product.customSpecifications?.hardware?.ram?.capacity
      ? [{ label: "Capacidad RAM", value: product.customSpecifications.hardware.ram.capacity }]
      : []),
    ...(product.customSpecifications?.hardware?.ram?.type
      ? [{ label: "Tipo de Memoria", value: product.customSpecifications.hardware.ram.type }]
      : []),
    ...(product.customSpecifications?.hardware?.ram?.speed
      ? [{ label: "Velocidad RAM", value: product.customSpecifications.hardware.ram.speed }]
      : []),
    ...(product.customSpecifications?.hardware?.ram?.format
      ? [{ label: "Formato RAM", value: product.customSpecifications.hardware.ram.format }]
      : []),
    ...(product.customSpecifications?.hardware?.ram?.voltage
      ? [{ label: "Voltaje", value: product.customSpecifications.hardware.ram.voltage }]
      : []),
    ...(((product.customSpecifications?.hardware?.ram as any)?.latencyClCas || product.customSpecifications?.hardware?.ram?.casLatency)
      ? [{ label: "Latencia CL (CAS)", value: (product.customSpecifications?.hardware?.ram as any)?.latencyClCas || product.customSpecifications?.hardware?.ram?.casLatency }]
      : []),
    ...(((product.customSpecifications?.hardware?.ram as any)?.latencyTrcd || product.customSpecifications?.hardware?.ram?.trcdLatency)
      ? [{ label: "Latencia Trcd", value: (product.customSpecifications?.hardware?.ram as any)?.latencyTrcd || product.customSpecifications?.hardware?.ram?.trcdLatency }]
      : []),
    ...(((product.customSpecifications?.hardware?.ram as any)?.latencyTrp || product.customSpecifications?.hardware?.ram?.trpLatency)
      ? [{ label: "Latencia Trp", value: (product.customSpecifications?.hardware?.ram as any)?.latencyTrp || product.customSpecifications?.hardware?.ram?.trpLatency }]
      : []),
    ...(((product.customSpecifications?.hardware?.ram as any)?.latencyTras || product.customSpecifications?.hardware?.ram?.trasLatency)
      ? [{ label: "Latencia Tras", value: (product.customSpecifications?.hardware?.ram as any)?.latencyTras || product.customSpecifications?.hardware?.ram?.trasLatency }]
      : []),
    ...(product.customSpecifications?.hardware?.ram?.eccSupport
      ? [{ label: "Soporte ECC", value: product.customSpecifications.hardware.ram.eccSupport }]
      : []),
    ...(product.customSpecifications?.hardware?.ram?.fullBufferedSupport
      ? [{ label: "Soporte Full Buffered", value: product.customSpecifications.hardware.ram.fullBufferedSupport }]
      : []),
    // Disco Duro (HDD)
    ...(product.customSpecifications?.hardware?.hdd?.type
      ? [{ label: "Tipo Disco Duro", value: product.customSpecifications.hardware.hdd.type }]
      : []),
    ...(product.customSpecifications?.hardware?.hdd?.line
      ? [{ label: "Línea", value: product.customSpecifications.hardware.hdd.line }]
      : []),
    ...(product.customSpecifications?.hardware?.hdd?.capacity
      ? [{ label: "Capacidad", value: product.customSpecifications.hardware.hdd.capacity }]
      : []),
    ...(product.customSpecifications?.hardware?.hdd?.rpm
      ? [{ label: "RPM", value: product.customSpecifications.hardware.hdd.rpm }]
      : []),
    ...(product.customSpecifications?.hardware?.hdd?.size
      ? [{ label: "Tamaño Disco", value: product.customSpecifications.hardware.hdd.size }]
      : []),
    ...(product.customSpecifications?.hardware?.hdd?.bus
      ? [{ label: "Bus / Interfaz", value: product.customSpecifications.hardware.hdd.bus }]
      : []),
    ...(product.customSpecifications?.hardware?.hdd?.buffer
      ? [{ label: "Búfer", value: product.customSpecifications.hardware.hdd.buffer }]
      : []),
    // SSD
    ...(product.customSpecifications?.hardware?.ssd?.line
      ? [{ label: "Línea SSD", value: product.customSpecifications.hardware.ssd.line }]
      : []),
    ...(product.customSpecifications?.hardware?.ssd?.capacity
      ? [{ label: "Capacidad SSD", value: product.customSpecifications.hardware.ssd.capacity }]
      : []),
    ...(product.customSpecifications?.hardware?.ssd?.format
      ? [{ label: "Formato SSD", value: product.customSpecifications.hardware.ssd.format }]
      : []),
    ...(product.customSpecifications?.hardware?.ssd?.bus
      ? [{ label: "Bus / Interfaz", value: product.customSpecifications.hardware.ssd.bus }]
      : []),
    ...(product.customSpecifications?.hardware?.ssd?.hasDram
      ? [{ label: "¿Posee DRAM?", value: product.customSpecifications.hardware.ssd.hasDram }]
      : []),
    ...(product.customSpecifications?.hardware?.ssd?.nandType
      ? [{ label: "Tipo Memoria NAND", value: product.customSpecifications.hardware.ssd.nandType }]
      : []),
    ...(product.customSpecifications?.hardware?.ssd?.controller
      ? [{ label: "Controladora", value: product.customSpecifications.hardware.ssd.controller }]
      : []),
    ...(product.customSpecifications?.hardware?.ssd?.sequentialRead
      ? [{ label: "Lectura Secuencial", value: product.customSpecifications.hardware.ssd.sequentialRead }]
      : []),
    ...(product.customSpecifications?.hardware?.ssd?.sequentialWrite
      ? [{ label: "Escritura Secuencial", value: product.customSpecifications.hardware.ssd.sequentialWrite }]
      : []),
    // Fuente de Poder
    ...(product.customSpecifications?.hardware?.powerSupply?.power
      ? [{ label: "Potencia", value: product.customSpecifications.hardware.powerSupply.power }]
      : []),
    ...(product.customSpecifications?.hardware?.powerSupply?.certification
      ? [{ label: "Certificación", value: product.customSpecifications.hardware.powerSupply.certification }]
      : []),
    ...(product.customSpecifications?.hardware?.powerSupply?.size
      ? [{ label: "Tamaño", value: product.customSpecifications.hardware.powerSupply.size }]
      : []),
    ...(product.customSpecifications?.hardware?.powerSupply?.activePfc
      ? [{ label: "PFC Activo", value: product.customSpecifications.hardware.powerSupply.activePfc }]
      : []),
    ...(product.customSpecifications?.hardware?.powerSupply?.modular
      ? [{ label: "Modular", value: product.customSpecifications.hardware.powerSupply.modular }]
      : []),
    ...(((product.customSpecifications?.hardware?.powerSupply as any)?.current12v || (product.customSpecifications?.hardware?.powerSupply as any)?.rail12vCurrent)
      ? [{ label: "Corriente Línea 12V", value: (product.customSpecifications?.hardware?.powerSupply as any)?.current12v || (product.customSpecifications?.hardware?.powerSupply as any)?.rail12vCurrent }]
      : []),
    ...(((product.customSpecifications?.hardware?.powerSupply as any)?.current5v || (product.customSpecifications?.hardware?.powerSupply as any)?.rail5vCurrent)
      ? [{ label: "Corriente Línea 5V", value: (product.customSpecifications?.hardware?.powerSupply as any)?.current5v || (product.customSpecifications?.hardware?.powerSupply as any)?.rail5vCurrent }]
      : []),
    ...(((product.customSpecifications?.hardware?.powerSupply as any)?.current3v || (product.customSpecifications?.hardware?.powerSupply as any)?.rail33vCurrent)
      ? [{ label: "Corriente Línea 3.3V", value: (product.customSpecifications?.hardware?.powerSupply as any)?.current3v || (product.customSpecifications?.hardware?.powerSupply as any)?.rail33vCurrent }]
      : []),
    ...(product.customSpecifications?.hardware?.powerSupply?.powerConnectors
      ? [{ label: "Conectores de Energía", value: product.customSpecifications.hardware.powerSupply.powerConnectors }]
      : []),
    // Cooler CPU
    ...(product.customSpecifications?.hardware?.coolerCpu?.brand
      ? [{ label: "Marca Cooler", value: product.customSpecifications.hardware.coolerCpu.brand }]
      : []),
    ...(product.customSpecifications?.hardware?.coolerCpu?.type
      ? [{ label: "Tipo de Cooler", value: product.customSpecifications.hardware.coolerCpu.type }]
      : []),
    ...(product.customSpecifications?.hardware?.coolerCpu?.weight
      ? [{ label: "Peso", value: product.customSpecifications.hardware.coolerCpu.weight }]
      : []),
    ...(product.customSpecifications?.hardware?.coolerCpu?.rpm
      ? [{ label: "RPM", value: product.customSpecifications.hardware.coolerCpu.rpm }]
      : []),
    ...(product.customSpecifications?.hardware?.coolerCpu?.noise
      ? [{ label: "Nivel de Ruido", value: product.customSpecifications.hardware.coolerCpu.noise }]
      : []),
    ...(product.customSpecifications?.hardware?.coolerCpu?.airflow
      ? [{ label: "Flujo de Aire", value: product.customSpecifications.hardware.coolerCpu.airflow }]
      : []),
    ...(product.customSpecifications?.hardware?.coolerCpu?.height
      ? [{ label: "Altura Cooler", value: product.customSpecifications.hardware.coolerCpu.height }]
      : []),
    ...(product.customSpecifications?.hardware?.coolerCpu?.fanSize
      ? [{ label: "Tamaño Ventilador", value: product.customSpecifications.hardware.coolerCpu.fanSize }]
      : []),
    ...(product.customSpecifications?.hardware?.coolerCpu?.hasHeatpipes
      ? [{ label: "¿Heatpipes?", value: product.customSpecifications.hardware.coolerCpu.hasHeatpipes }]
      : []),
    ...(product.customSpecifications?.hardware?.coolerCpu?.compatibleSockets
      ? [{ label: "Sockets Compatibles", value: product.customSpecifications.hardware.coolerCpu.compatibleSockets }]
      : []),
    // Gabinete
    ...(product.customSpecifications?.hardware?.cabinet?.brand
      ? [{ label: "Marca Gabinete", value: product.customSpecifications.hardware.cabinet.brand }]
      : []),
    ...(product.customSpecifications?.hardware?.cabinet?.model
      ? [{ label: "Modelo Gabinete", value: product.customSpecifications.hardware.cabinet.model }]
      : []),
    ...(product.customSpecifications?.hardware?.cabinet?.format
      ? [{ label: "Formato Gabinete", value: product.customSpecifications.hardware.cabinet.format }]
      : []),
    ...(((product.customSpecifications?.hardware?.cabinet as any)?.motherboardSupport)
      ? [{ label: "Soporte Placas Madre", value: (product.customSpecifications?.hardware?.cabinet as any)?.motherboardSupport }]
      : []),
    ...(product.customSpecifications?.hardware?.cabinet?.sidePanel
      ? [{ label: "Panel Lateral", value: product.customSpecifications.hardware.cabinet.sidePanel }]
      : []),
    ...(product.customSpecifications?.hardware?.cabinet?.bays
      ? [{ label: "Bahías", value: product.customSpecifications.hardware.cabinet.bays }]
      : []),
    ...(product.customSpecifications?.hardware?.cabinet?.expansionSlots
      ? [{ label: "Ranuras Expansión", value: product.customSpecifications.hardware.cabinet.expansionSlots }]
      : []),
    ...(((product.customSpecifications?.hardware?.cabinet as any)?.maxGpuLength || (product.customSpecifications?.hardware?.cabinet as any)?.gpuMaxDimensions)
      ? [{ label: "Largo Máx. GPU", value: (product.customSpecifications?.hardware?.cabinet as any)?.maxGpuLength || (product.customSpecifications?.hardware?.cabinet as any)?.gpuMaxDimensions }]
      : []),
    ...(((product.customSpecifications?.hardware?.cabinet as any)?.maxCoolerHeight || (product.customSpecifications?.hardware?.cabinet as any)?.cpuCoolerMaxHeight)
      ? [{ label: "Altura Máx. Cooler", value: (product.customSpecifications?.hardware?.cabinet as any)?.maxCoolerHeight || (product.customSpecifications?.hardware?.cabinet as any)?.cpuCoolerMaxHeight }]
      : []),
    ...(product.customSpecifications?.hardware?.cabinet?.radiatorSupport
      ? [{ label: "Soporte Radiador", value: product.customSpecifications.hardware.cabinet.radiatorSupport }]
      : []),
    ...(product.customSpecifications?.hardware?.cabinet?.frontConnectors
      ? [{ label: "Conectores Frontales", value: product.customSpecifications.hardware.cabinet.frontConnectors }]
      : []),
    // Ventiladores
    ...(product.customSpecifications?.hardware?.fan?.brand
      ? [{ label: "Marca Ventilador", value: product.customSpecifications.hardware.fan.brand }]
      : []),
    ...(product.customSpecifications?.hardware?.fan?.size
      ? [{ label: "Tamaño Ventilador", value: product.customSpecifications.hardware.fan.size }]
      : []),
    ...(product.customSpecifications?.hardware?.fan?.rpm
      ? [{ label: "RPM Ventilador", value: product.customSpecifications.hardware.fan.rpm }]
      : []),
    ...(product.customSpecifications?.hardware?.fan?.airflow
      ? [{ label: "Flujo de Aire", value: product.customSpecifications.hardware.fan.airflow }]
      : []),
    ...(((product.customSpecifications?.hardware?.fan as any)?.noiseLevel || (product.customSpecifications?.hardware?.fan as any)?.noise)
      ? [{ label: "Nivel de Ruido", value: (product.customSpecifications?.hardware?.fan as any)?.noiseLevel || (product.customSpecifications?.hardware?.fan as any)?.noise }]
      : []),
    ...(((product.customSpecifications?.hardware?.fan as any)?.connectorPins || (product.customSpecifications?.hardware?.fan as any)?.connector)
      ? [{ label: "Conector / Pines", value: (product.customSpecifications?.hardware?.fan as any)?.connectorPins || (product.customSpecifications?.hardware?.fan as any)?.connector }]
      : []),
    ...(product.customSpecifications?.hardware?.fan?.lighting
      ? [{ label: "Iluminación", value: product.customSpecifications.hardware.fan.lighting }]
      : []),
    ...(product.customSpecifications?.hardware?.fan?.staticPressure
      ? [{ label: "Presión Estática", value: product.customSpecifications.hardware.fan.staticPressure }]
      : []),
    ...(product.customSpecifications?.hardware?.fan?.bearing
      ? [{ label: "Rodamiento (Bearing)", value: product.customSpecifications.hardware.fan.bearing }]
      : []),
    // Mouse Gaming
    ...(product.customSpecifications?.gamingAccessory?.mouse?.brand
      ? [{ label: "Marca del Mouse", value: product.customSpecifications.gamingAccessory.mouse.brand }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.tracking
      ? [{ label: "Sensor & Tracking", value: product.customSpecifications.gamingAccessory.mouse.tracking }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.buttonCount
      ? [{ label: "Cantidad de Botones", value: String(product.customSpecifications.gamingAccessory.mouse.buttonCount) }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.maxDpi
      ? [{ label: "DPI Máximo", value: String(product.customSpecifications.gamingAccessory.mouse.maxDpi) }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.wiring
      ? [{ label: "Cableado / Conexión", value: product.customSpecifications.gamingAccessory.mouse.wiring }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.weight
      ? [{ label: "Peso", value: product.customSpecifications.gamingAccessory.mouse.weight }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.dimensions
      ? [{ label: "Dimensiones", value: product.customSpecifications.gamingAccessory.mouse.dimensions }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.adjustableDpi
      ? [{ label: "DPI Ajustable", value: product.customSpecifications.gamingAccessory.mouse.adjustableDpi }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.color
      ? [{ label: "Color", value: product.customSpecifications.gamingAccessory.mouse.color }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.pollingRate
      ? [{ label: "Polling Rate", value: product.customSpecifications.gamingAccessory.mouse.pollingRate }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.adjustableWeight
      ? [{ label: "Peso Ajustable", value: product.customSpecifications.gamingAccessory.mouse.adjustableWeight }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.handedness
      ? [{ label: "Lateralidad", value: product.customSpecifications.gamingAccessory.mouse.handedness }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.technology
      ? [{ label: "Tecnología de Switches", value: product.customSpecifications.gamingAccessory.mouse.technology }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.lighting
      ? [{ label: "Iluminación", value: product.customSpecifications.gamingAccessory.mouse.lighting }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.mouse?.powerSource
      ? [{ label: "Alimentación / Batería", value: product.customSpecifications.gamingAccessory.mouse.powerSource }]
      : []),
    // Teclado Gaming
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.brand
      ? [{ label: "Marca del Teclado", value: product.customSpecifications.gamingAccessory.keyboard.brand }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.partNumber
      ? [{ label: "Part Number", value: product.customSpecifications.gamingAccessory.keyboard.partNumber }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.type
      ? [{ label: "Tipo de Teclado", value: product.customSpecifications.gamingAccessory.keyboard.type }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.category
      ? [{ label: "Formato / Tamaño", value: product.customSpecifications.gamingAccessory.keyboard.category }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.backlight
      ? [{ label: "Retroiluminación", value: product.customSpecifications.gamingAccessory.keyboard.backlight }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.switchType
      ? [{ label: "Tipo de Switch", value: product.customSpecifications.gamingAccessory.keyboard.switchType }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.wiring
      ? [{ label: "Cableado", value: product.customSpecifications.gamingAccessory.keyboard.wiring }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.connectionTechnology
      ? [{ label: "Tecnología de Conexión", value: product.customSpecifications.gamingAccessory.keyboard.connectionTechnology }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.macroKeys
      ? [{ label: "Teclas Macro", value: product.customSpecifications.gamingAccessory.keyboard.macroKeys }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.hasWristRest
      ? [{ label: "¿Apoya muñecas?", value: product.customSpecifications.gamingAccessory.keyboard.hasWristRest }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.keyboard?.hasMediaKeys
      ? [{ label: "¿Teclas Multimedia?", value: product.customSpecifications.gamingAccessory.keyboard.hasMediaKeys }]
      : []),
    // Audífonos Gaming
    ...(product.customSpecifications?.gamingAccessory?.headset?.type
      ? [{ label: "Tipo de Audífono", value: product.customSpecifications.gamingAccessory.headset.type }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.headset?.microphone
      ? [{ label: "Micrófono", value: product.customSpecifications.gamingAccessory.headset.microphone }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.headset?.frequencyResponse
      ? [{ label: "Respuesta en Frecuencia", value: product.customSpecifications.gamingAccessory.headset.frequencyResponse }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.headset?.color
      ? [{ label: "Color", value: product.customSpecifications.gamingAccessory.headset.color }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.headset?.lighting
      ? [{ label: "Iluminación", value: product.customSpecifications.gamingAccessory.headset.lighting }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.headset?.connectivity
      ? [{ label: "Conectividad", value: product.customSpecifications.gamingAccessory.headset.connectivity }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.headset?.activeNoiseCancelling
      ? [{ label: "Cancelación de Ruido (ANC)", value: product.customSpecifications.gamingAccessory.headset.activeNoiseCancelling }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.headset?.inLineControls
      ? [{ label: "Controles de Audio", value: product.customSpecifications.gamingAccessory.headset.inLineControls }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.headset?.driverSize
      ? [{ label: "Tamaño Driver", value: product.customSpecifications.gamingAccessory.headset.driverSize }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.headset?.impedance
      ? [{ label: "Impedancia", value: product.customSpecifications.gamingAccessory.headset.impedance }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.headset?.cableLength
      ? [{ label: "Largo del Cable", value: product.customSpecifications.gamingAccessory.headset.cableLength }]
      : []),
    // Control / Joystick Gaming
    ...(product.customSpecifications?.gamingAccessory?.controller?.brand
      ? [{ label: "Marca del Control", value: product.customSpecifications.gamingAccessory.controller.brand }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.platformCompatibility
      ? [{ label: "Compatibilidad Plataforma", value: product.customSpecifications.gamingAccessory.controller.platformCompatibility }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.connectionType
      ? [{ label: "Conexión / Interfaz", value: product.customSpecifications.gamingAccessory.controller.connectionType }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.feedbackHaptic
      ? [{ label: "Respuesta Háptica", value: product.customSpecifications.gamingAccessory.controller.feedbackHaptic }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.weight
      ? [{ label: "Peso", value: product.customSpecifications.gamingAccessory.controller.weight }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.color
      ? [{ label: "Color / Edición", value: product.customSpecifications.gamingAccessory.controller.color }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.layout
      ? [{ label: "Distribución de Botones", value: product.customSpecifications.gamingAccessory.controller.layout }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.batteryLife
      ? [{ label: "Autonomía de Batería", value: product.customSpecifications.gamingAccessory.controller.batteryLife }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.rechargeableBattery
      ? [{ label: "Tipo de Batería", value: product.customSpecifications.gamingAccessory.controller.rechargeableBattery }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.programmableBackPaddles
      ? [{ label: "Botones Traseros / Paddles", value: product.customSpecifications.gamingAccessory.controller.programmableBackPaddles }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.triggerStops
      ? [{ label: "Bloqueo de Gatillos", value: product.customSpecifications.gamingAccessory.controller.triggerStops }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.audioJack
      ? [{ label: "Conector de Audio", value: product.customSpecifications.gamingAccessory.controller.audioJack }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.hallEffectSticks
      ? [{ label: "Joysticks Magnéticos (Hall Effect)", value: product.customSpecifications.gamingAccessory.controller.hallEffectSticks }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.lighting
      ? [{ label: "Iluminación / Barra de Luz", value: product.customSpecifications.gamingAccessory.controller.lighting }]
      : []),
    ...(product.customSpecifications?.gamingAccessory?.controller?.softwareCustomization
      ? [{ label: "Software y Personalización", value: product.customSpecifications.gamingAccessory.controller.softwareCustomization }]
      : []),
    // Ropa & Estilo
    ...(product.customSpecifications?.apparel?.apparelType
      ? [{ label: "Tipo de Prenda", value: product.customSpecifications.apparel.apparelType }]
      : []),
    ...(product.customSpecifications?.apparel?.size
      ? [{ label: "Tallas Disponibles", value: product.customSpecifications.apparel.size }]
      : []),
    ...(product.customSpecifications?.apparel?.gender
      ? [{ label: "Género / Corte", value: product.customSpecifications.apparel.gender }]
      : []),
    ...(product.customSpecifications?.apparel?.material
      ? [{ label: "Material / Composición", value: product.customSpecifications.apparel.material }]
      : []),
    ...(product.customSpecifications?.apparel?.careInstructions
      ? [{ label: "Cuidados de Lavado", value: product.customSpecifications.apparel.careInstructions }]
      : []),
    ...(product.customSpecifications?.apparel?.license
      ? [{ label: "Licencia Oficial", value: product.customSpecifications.apparel.license }]
      : []),
    // Manga / Artbook
    ...(product.customSpecifications?.book?.publisher
      ? [{ label: "Editorial", value: product.customSpecifications.book.publisher }]
      : []),
    ...(product.customSpecifications?.book?.language
      ? [{ label: "Idioma", value: product.customSpecifications.book.language }]
      : []),
    ...(product.customSpecifications?.book?.pages
      ? [{ label: "Número de Páginas", value: String(product.customSpecifications.book.pages) }]
      : []),
    ...(product.customSpecifications?.book?.binding
      ? [{ label: "Encuadernación", value: product.customSpecifications.book.binding }]
      : []),
    ...(product.customSpecifications?.book?.dimensions
      ? [{ label: "Dimensiones", value: product.customSpecifications.book.dimensions }]
      : []),
    ...(product.customSpecifications?.book?.hasColorPages
      ? [{ label: "Páginas a Color", value: product.customSpecifications.book.hasColorPages }]
      : []),
    ...(product.customSpecifications?.book?.isbn
      ? [{ label: "ISBN / Código", value: product.customSpecifications.book.isbn }]
      : []),
    // Merchandising
    ...(product.customSpecifications?.merch?.itemType
      ? [{ label: "Tipo de Artículo", value: product.customSpecifications.merch.itemType }]
      : []),
    ...(product.customSpecifications?.merch?.material
      ? [{ label: "Materiales", value: product.customSpecifications.merch.material }]
      : []),
    ...(product.customSpecifications?.merch?.dimensions
      ? [{ label: "Dimensiones / Capacidad", value: product.customSpecifications.merch.dimensions }]
      : []),
    ...(product.customSpecifications?.merch?.franchise
      ? [{ label: "Franquicia Oficial", value: product.customSpecifications.merch.franchise }]
      : []),
    // Audio / OST
    ...(product.customSpecifications?.audio?.format
      ? [{ label: "Formato Físico", value: product.customSpecifications.audio.format }]
      : []),
    ...(product.customSpecifications?.audio?.discCount
      ? [{ label: "Número de Discos", value: String(product.customSpecifications.audio.discCount) }]
      : []),
    ...(product.customSpecifications?.audio?.recordLabel
      ? [{ label: "Sello Discográfico", value: product.customSpecifications.audio.recordLabel }]
      : []),
    ...(product.customSpecifications?.audio?.includesArtbook
      ? [{ label: "¿Incluye Libreto / Arte?", value: product.customSpecifications.audio.includesArtbook }]
      : []),
    ...(product.customSpecifications?.audio?.featuredTracks
      ? [{ label: "Pistas Destacadas", value: product.customSpecifications.audio.featuredTracks }]
      : []),
  ];

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      type: product.type,
      unitPrice: product.price,
      unitCost: product.costPrice || 0,
      quantity: 1,
      isPreOrder: isPreOrder,
      isPartialDeposit: isPreOrder && selectedDepositMode === "PARTIAL",
      depositPercent: defaultDepositPercent,
      imageUrl: productImages[selectedImageIndex] || product.imageUrl || undefined,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
    setWishlistToast(isLiked ? "Removido de favoritos" : "Guardado en favoritos");
    setTimeout(() => setWishlistToast(null), 1800);
  };

  const whatsappMessage = encodeURIComponent(
    `Hola OmniCollector, tengo una consulta sobre el producto "${product.name}" (SKU: ${product.sku}).`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Breadcrumbs & Admin Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-[#E5E5E5]">
        <nav aria-label="Ruta jerárquica" className="flex items-center gap-2 text-xs text-[#666666] flex-wrap">
          <Link href="/" className="hover:text-[#1A1A1A] transition font-medium">
            Inicio
          </Link>
          <span className="text-gray-300">/</span>
          <Link href={categoryInfo.href} className="hover:text-[#FF6B35] transition font-medium">
            {categoryInfo.label}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#FF6B35] font-semibold truncate max-w-[280px] sm:max-w-[450px]" title={product.name}>
            {product.name}
          </span>
        </nav>
      </div>

      {/* Product SKU Top Pill & H1 Title */}
      <div className="space-y-1.5">
        <div className="inline-block px-2.5 py-0.5 rounded border border-[#E5E5E5] bg-white text-[11px] font-mono text-[#666666] tracking-wider shadow-sm">
          {product.sku}
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
          {product.name}
          {!product.name.includes("[") && (
            <span className="text-[#FF6B35] font-normal ml-2 text-xl sm:text-2xl">
              [{categoryInfo.bracketTag}]
            </span>
          )}
        </h1>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Cover Image, Age Badge, Warranty, WhatsApp, Tags */}
        <div className="lg:col-span-4 space-y-4">
          {/* Main Cover Box with Inspection Zoom and 3D Hologram */}
          <div className="rounded-2xl overflow-hidden bg-white border border-[#E5E5E5] p-3 shadow-sm space-y-3">
            <HolographicCard isCollectible={isCollectible}>
              <InspectionZoom
                imageUrl={productImages[selectedImageIndex] || productImages[0] || product.imageUrl || ""}
                alt={product.name}
                isCollectible={isCollectible}
              />
            </HolographicCard>

            {/* Sub-thumbnails */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                {productImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition shrink-0 bg-[#F7F7F5] ${
                      selectedImageIndex === idx
                        ? "border-[#FF6B35] shadow-md shadow-[#FF6B35]/20 scale-105"
                        : "border-[#E5E5E5] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mint Collector Packaging Seal */}
          <MintPackagingBadge />

          {/* Age Rating Official Badge */}
          <div className="bg-white text-black rounded-lg border-2 border-slate-900 shadow-sm flex items-stretch overflow-hidden">
            <div className="w-24 py-3 bg-white text-black font-black text-2xl sm:text-3xl flex items-center justify-center border-r-2 border-slate-900 tracking-tight">
              {ratingMain}
            </div>
            <div className="flex-1 px-3 py-2 bg-white flex flex-col justify-center leading-tight">
              <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-black">
                {ratingSub}
              </span>
              <span className="text-[10px] text-slate-600 font-semibold uppercase">
                Calificación Oficial
              </span>
            </div>
          </div>

          {/* Guaranteed Availability Badge */}
          <div className="bg-[#1F3A5F] text-white p-3 rounded-lg border border-[#1F3A5F] text-center font-black tracking-wider uppercase text-sm sm:text-base shadow-sm flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF6B35]" />
            <span>DISPONIBILIDAD GARANTIZADA</span>
          </div>

          {/* Questions / WhatsApp Card */}
          <a
            href={`https://wa.me/56958243917?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-lg bg-white border-2 border-[#1F3A5F]/40 hover:border-[#FF6B35] text-center transition group shadow-sm"
          >
            <div className="text-xs font-bold text-[#666666] group-hover:text-[#1A1A1A]">
              ¿Dudas con este producto?
            </div>
            <div className="text-sm font-extrabold text-[#1F3A5F] group-hover:text-[#FF6B35] flex items-center justify-center gap-1.5 mt-0.5">
              <MessageCircle className="w-4 h-4" />
              <span>Consulta Acá</span>
            </div>
          </a>

          {/* Price State Badge */}
          <div className="bg-[#F7F7F5] text-[#1A1A1A] py-3 px-4 rounded-lg border border-[#E5E5E5] shadow-sm text-center">
            <span className="font-black text-sm tracking-widest uppercase block text-[#1A1A1A]">
              {isPreOrder ? "PREVENTA EXCLUSIVA" : "PRECIO NUEVO"}
            </span>
          </div>

          {/* Product ID and Category Pills */}
          <div className="space-y-2 pt-1">
            <div className="text-xs text-[#666666] font-mono">
              Id: <span className="font-bold text-[#1A1A1A]">{product.sku}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {genresList.map((genre, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-md bg-white border border-[#E5E5E5] hover:border-[#FF6B35] text-xs font-semibold text-[#1A1A1A] transition shadow-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Price Banner, CTA, YouTube Trailer, Specs Table */}
        <div className="lg:col-span-8 space-y-6">
          {/* Price & Buy Action Banner */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left Price Block */}
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-2xl sm:text-3xl font-black text-[#FF6B35] font-mono">
                    Precio: {formatCLP(product.price)}
                  </div>
                  {discountPercent && discountPercent > 0 && (
                    <span className="px-2.5 py-1 rounded-md bg-[#D64545] text-white font-black text-xs sm:text-sm tracking-wide shadow">
                      -{discountPercent}%
                    </span>
                  )}
                </div>

                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="text-xs text-[#666666]">
                    Precio Normal:{" "}
                    <span className="line-through text-slate-400 font-mono font-medium">
                      {formatCLP(product.originalPrice)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right CTA Button & Wishlist */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`px-6 sm:px-8 py-3.5 rounded-xl font-black text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg ${
                    justAdded
                      ? "bg-[#2E9E5B] text-white"
                      : "bg-[#FF6B35] hover:bg-[#E85A24] text-white shadow-[#FF6B35]/25"
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" /> ¡Agregado al Carro!
                    </>
                  ) : isPreOrder ? (
                    <>
                      <Clock className="w-4 h-4" /> Reservar ({formatCLP(amountChargedNow)})
                    </>
                  ) : (
                    <>
                      <span>🛒</span> Agregar al carro
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  aria-label="Favoritos"
                  title="Guardar en lista de deseos"
                  className={`p-3.5 rounded-xl border transition flex items-center justify-center ${
                    isLiked
                      ? "bg-[#FF6B35] border-[#FF6B35] text-white"
                      : "bg-white border-[#E5E5E5] text-[#666666] hover:text-[#FF6B35]"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-white" : ""}`} />
                </button>
              </div>
            </div>

            {/* In-Store & Web Availability Check */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2E9E5B] pt-1 border-t border-[#E5E5E5]">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E9E5B]" />
              <span>
                Producto Disponible en Local y Web{" "}
                <span className="text-[#666666] font-normal">
                  (Despacho prioritario a todo Chile • Stock: {product.stockAvailable} un.)
                </span>
              </span>
            </div>

            {/* Pre-order partial deposit selector if applicable */}
            {isPreOrder && (
              <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#666666]">
                  <span>Modalidad de Reserva:</span>
                  <span className="text-[#FF6B35]">Elige el método de pago</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDepositMode("PARTIAL")}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      selectedDepositMode === "PARTIAL"
                        ? "bg-[#1F3A5F] border-[#1F3A5F] text-white"
                        : "bg-white border-[#E5E5E5] text-[#666666]"
                    }`}
                  >
                    <div className="font-bold">Pie {(defaultDepositPercent * 100).toFixed(0)}%</div>
                    <div className="font-mono text-sm text-[#FF6B35] font-bold">
                      {formatCLP(depositAmount)} hoy
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDepositMode("FULL")}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      selectedDepositMode === "FULL"
                        ? "bg-[#1F3A5F] border-[#1F3A5F] text-white"
                        : "bg-white border-[#E5E5E5] text-[#666666]"
                    }`}
                  >
                    <div className="font-bold">Pago 100%</div>
                    <div className="font-mono text-sm text-[#FF6B35] font-bold">
                      {formatCLP(product.price)}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Stock & Price Drop Email Alert Subscription (Guests & Logged-in Users) */}
            <ProductAlertSubscription
              productId={product.id || product.sku}
              productSku={product.sku}
              productName={product.name}
              productPrice={product.price}
              productOriginalPrice={product.originalPrice}
              productImageUrl={productImages[0] || product.imageUrl || undefined}
              isOutOfStock={!isPreOrder && (product.stockAvailable <= 0)}
              isPreOrder={isPreOrder}
            />
          </div>

          {/* Official YouTube Trailer Player */}
          <div className="rounded-2xl overflow-hidden bg-white border border-[#E5E5E5] shadow-sm space-y-2 p-3">
            <div className="flex items-center justify-between px-2 pt-1 pb-2">
              <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#D64545]" />
                Trailer Oficial de Presentación
              </span>
              <span className="text-[10px] font-mono text-[#666666]">YouTube 1080p 60fps</span>
            </div>

            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#E5E5E5] shadow-inner">
              {embedTrailerUrl ? (
                <iframe
                  src={embedTrailerUrl}
                  title={`Trailer oficial de ${product.name}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[#F7F7F5]">
                  <Play className="w-12 h-12 text-[#FF6B35] opacity-70" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#1A1A1A]">
                      Trailer en Sincronización Oficial
                    </p>
                    <p className="text-xs text-[#666666] max-w-sm">
                      Puedes configurar la URL del trailer de YouTube de este producto en el panel de administración.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Specifications Table */}
          <div className="rounded-2xl overflow-hidden bg-white border border-[#E5E5E5] shadow-sm">
            <div className="px-6 py-3.5 bg-[#F7F7F5] border-b border-[#E5E5E5] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]">
                Especificaciones Técnicas & Ficha Oficial
              </h3>
              <span className="text-[10px] font-mono text-[#666666]">Detalles Homologados</span>
            </div>

            <div className="divide-y divide-[#E5E5E5]">
              {technicalSpecs.map((spec, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-1 sm:grid-cols-12 text-xs py-3 px-6 transition hover:bg-slate-50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#F7F7F5]/40"
                  }`}
                >
                  <div className="sm:col-span-4 font-semibold text-[#666666] flex items-center">
                    {spec.label}
                  </div>
                  <div className="sm:col-span-8 font-medium text-[#1A1A1A] mt-1 sm:mt-0">
                    {spec.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Narrative Story & In-Game Screenshot Gallery */}
      <div className="space-y-8 pt-6 border-t border-[#E5E5E5]">
        {/* Narrative Description & Game Lore */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF6B35]" />
            Descripción Técnica, Jugabilidad & Argumento
          </h2>

          <div className="text-sm sm:text-base text-[#666666] leading-relaxed space-y-4 whitespace-pre-line font-light">
            {product.description}
          </div>
        </div>

        {/* In-Game Screenshots / Content Gallery with Interactive Viewer */}
        {contentGallery.length > 0 && (
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] tracking-tight">
                  Galería de Capturas de Contenido & Gameplay
                </h3>
                <p className="text-xs text-[#666666]">
                  Haz clic en las miniaturas inferiores para explorar en alta resolución el entorno y detalles.
                </p>
              </div>
              <span className="text-xs font-mono text-[#FF6B35] font-semibold">
                Captura {selectedGalleryIndex + 1} de {contentGallery.length}
              </span>
            </div>

            {/* Large Active Screenshot Viewer - Uncropped 100% Full View */}
            <div className="relative w-full aspect-[16/9] max-h-[580px] rounded-2xl overflow-hidden bg-[#0A0F17] border-2 border-[#E5E5E5] shadow-xl group flex items-center justify-center select-none">
              {/* Ambient Blurred Backdrop to fill margins with harmonious color */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                  src={contentGallery[selectedGalleryIndex] || contentGallery[0]}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover blur-2xl opacity-35 scale-110"
                />
                <div className="absolute inset-0 bg-[#0A0F17]/50" />
              </div>

              {/* Main Full Screenshot - 100% visible, zero cropping */}
              <img
                src={contentGallery[selectedGalleryIndex] || contentGallery[0]}
                alt={`Captura interactiva ${selectedGalleryIndex + 1}`}
                className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
              />

              {/* Navigation Arrows */}
              {contentGallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGalleryIndex((prev) => (prev > 0 ? prev - 1 : contentGallery.length - 1));
                    }}
                    className="absolute left-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#FF6B35] text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
                    aria-label="Captura anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGalleryIndex((prev) => (prev < contentGallery.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#FF6B35] text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
                    aria-label="Siguiente captura"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Caption & SKU Tag */}
              <div className="absolute bottom-3 left-3 z-20 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-xs font-mono text-white pointer-events-none shadow-md">
                Captura #{selectedGalleryIndex + 1} • {product.name}
              </div>
            </div>

            {/* Thumbnails Navigation Strip */}
            <div className="flex items-center justify-center gap-3 overflow-x-auto py-2">
              {contentGallery.map((img: string, idx: number) => {
                const isActive = selectedGalleryIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedGalleryIndex(idx)}
                    className={`relative w-20 sm:w-28 h-14 sm:h-18 rounded-lg overflow-hidden transition-all duration-200 shrink-0 bg-[#F7F7F5] ${
                      isActive
                        ? "border-2 border-[#FF6B35] ring-2 ring-[#FF6B35]/30 scale-105 shadow-md"
                        : "border border-[#E5E5E5] opacity-70 hover:opacity-100 hover:border-[#FF6B35]"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggested Related Products Slider */}
        <RelatedProductsSlider currentProduct={product} allProducts={allCatalogProducts} />

        {/* Collector Guarantee Footer Banner */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-sm">
          <div className="p-3.5 rounded-xl bg-[#1F3A5F]/10 text-[#1F3A5F] shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1 flex-1 text-xs">
            <h4 className="text-sm font-bold text-[#1A1A1A]">
              Garantía de Coleccionista OmniCollector Chile
            </h4>
            <p className="text-[#666666] leading-relaxed">
              Todos los juegos físicos y figuras se despachan nuevos, sellados de fábrica con protección de embalaje
              grado coleccionista (triple burbuja y esquineros reforzados).
            </p>
          </div>
          <Link
            href="/catalog"
            className="px-5 py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#2D5180] text-white font-bold text-xs transition shrink-0 shadow-sm"
          >
            Explorar Más Productos
          </Link>
        </div>
      </div>
    </div>
  );
}

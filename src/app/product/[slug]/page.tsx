"use client";

import React, { useState, useEffect } from "react";
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
import { RelatedProductsSlider } from "@/components/catalog/RelatedProductsSlider";
import { analytics } from "@/lib/services/AnalyticsTracker";
import { extractYouTubeEmbedUrl } from "@/lib/utils/media";
import { HolographicCard } from "@/components/catalog/HolographicCard";
import { InspectionZoom } from "@/components/product/InspectionZoom";
import { MintPackagingBadge } from "@/components/trust/MintPackagingBadge";
import { ProductAlertSubscription } from "@/components/product/ProductAlertSubscription";
import { getProductCategoryInfo } from "@/lib/utils/category";
import { DigitalPassportCard } from "@/components/trust/DigitalPassportCard";
import { TcgMarketPriceTracker } from "@/components/product/TcgMarketPriceTracker";
import { generateDigitalPassport } from "@/lib/utils/passport";
import { generateTcgMarketPriceGuide } from "@/lib/utils/priceTracker";
import type { ProductDomainEntity } from "@/lib/types/domain";
import { catalogClient } from "@/lib/services/catalogClient";
import { ProductContentGallery } from "@/components/product/ProductContentGallery";

function formatFigureScale(scale?: string): string {
  if (!scale) return "";
  const map: Record<string, string> = {
    SCALE_1_7: "Escala 1/7 (Estándar Coleccionista)",
    SCALE_1_4: "Escala 1/4 (Gran Formato Premium)",
    SCALE_1_6: "Escala 1/6",
    SCALE_1_8: "Escala 1/8",
    SCALE_1_12: "Escala 1/12",
    NON_SCALE: "Sin Escala (Non-Scale / Prize)",
    NENDOROID: "Nendoroid (Chibi Articulado)",
    POP_UP_PARADE: "Pop Up Parade",
    ACTION_FIGURE: "Figura de Acción Articulada",
  };
  return map[scale] || scale.replace(/_/g, " ");
}

function formatFigureManufacturer(mfg?: string): string {
  if (!mfg) return "";
  const map: Record<string, string> = {
    GOOD_SMILE_COMPANY: "Good Smile Company",
    BANDAI_SPIRITS: "Bandai Spirits / Tamashii Nations",
    BANPRESTO: "Banpresto",
    KOTOBUKIYA: "Kotobukiya",
    ALTER: "Alter",
    MEGAHOUSE: "Megahouse",
    MAX_FACTORY: "Max Factory",
    FREEING: "FREEing",
    ANIPLEX: "Aniplex",
    SEGA: "Sega",
    TAITO: "Taito",
    FURYU: "FuRyu",
  };
  return map[mfg] || mfg.replace(/_/g, " ");
}

export default function ProductDetailPage() {
  const params = useParams();
  const rawSlug = (params?.slug as string) || "";
  const slug = rawSlug.toLowerCase();

  const [product, setProduct] = useState<ProductDomainEntity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allCatalogProducts, setAllCatalogProducts] = useState<ProductDomainEntity[]>([]);

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
    let isCancelled = false;
    setLoading(true);

    // Retrieve catalog and target product with in-flight deduplication & micro-cache
    catalogClient.getCatalog()
      .then(async (allProducts) => {
        if (isCancelled) return;
        setAllCatalogProducts(allProducts);

        // Find target product from cache or direct query
        const matched = await catalogClient.getProductByIdentifier(slug);
        if (!isCancelled && matched) {
          setProduct(matched);
          analytics.trackProductView({
            sku: matched.sku,
            name: matched.name,
            category: matched.type,
            price: matched.price,
          });
        }
      })
      .catch((err: unknown) => {
        console.error("Error loading product detail:", err);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
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

  // Digital Authenticity Passport (Anti-Bootleg Guarantee)
  const passport = product.authenticityPassport || generateDigitalPassport(product);

  // Real-Time TCG Market Price Guide Tracker
  const isTcgOrCollectible =
    categoryInfo.key === "COLLECTIBLE" ||
    Boolean(product.collectibleMetadata);
  const marketPriceGuide = isTcgOrCollectible
    ? product.marketPriceGuide || generateTcgMarketPriceGuide(product)
    : null;

  // Clean Genres List (Strictly eliminates erroneous TCG/Graduada tags on non-TCG items)
  let rawList: string[] = [];
  if (Array.isArray(product.genres)) {
    rawList = product.genres;
  } else if (typeof (product.genres as unknown) === "string") {
    const str = product.genres as unknown as string;
    if (str.trim()) {
      rawList = str.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
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
  const isVideoGame = categoryInfo.key === "VIDEO_GAME";
  const isFigure = categoryInfo.key === "FIGURE";
  const isConsoleCat = categoryInfo.key === "CONSOLE";
  const isHardwareCat = categoryInfo.key === "HARDWARE";
  const isAccessoryCat = categoryInfo.key === "GAMING_ACCESSORY";
  const isApparelCat = categoryInfo.key === "APPAREL";
  const isBookCat = categoryInfo.key === "BOOK";
  const isMerchCat = categoryInfo.key === "MERCH";
  const isAudioCat = categoryInfo.key === "AUDIO";

  const hw = product.customSpecifications?.hardware;
  const hwSubtype = hw?.hardwareType;

  const acc = product.customSpecifications?.gamingAccessory;
  const accSubtype = acc?.accessoryType;

  const hasSpecializedHw = Boolean(
    hw && (hw.gpu || hw.cpu || hw.motherboard || hw.ram || hw.hdd || hw.ssd || hw.powerSupply || hw.coolerCpu || hw.cabinet || hw.fan)
  );

  const hasSpecializedAcc = Boolean(
    acc && (acc.mouse || acc.keyboard || acc.headset || acc.controller)
  );

  const technicalSpecs = [
    ...(!hasSpecializedHw && !hasSpecializedAcc
      ? [
          {
            label: "Formato Producto",
            value: categoryInfo.formatLabel,
          },
          {
            label: "Fabricante / Marca",
            value: categoryInfo.brand,
          },
        ]
      : []),
    // Videojuegos (Consola y PC)
    ...(isVideoGame && product.gameMetadata?.title
      ? [{ label: "Título", value: product.gameMetadata.title }]
      : []),
    ...(isVideoGame && product.gameMetadata?.developer
      ? [{ label: "Desarrolladora", value: product.gameMetadata.developer }]
      : []),
    ...(isVideoGame && product.gameMetadata?.publisher
      ? [{ label: "Distribuidora", value: product.gameMetadata.publisher }]
      : []),
    ...(isVideoGame && product.gameMetadata?.releaseYear
      ? [{ label: "Año de Lanzamiento", value: product.gameMetadata.releaseYear }]
      : []),
    ...(isVideoGame && product.gameMetadata?.genre
      ? [{ label: "Género", value: product.gameMetadata.genre }]
      : []),
    ...(isVideoGame && product.gameMetadata?.gameModes
      ? [{ label: "Modos de Juego", value: product.gameMetadata.gameModes }]
      : []),
    ...(isVideoGame && product.gameMetadata?.gameEngine
      ? [{ label: "Motor de Juego", value: product.gameMetadata.gameEngine }]
      : []),
    ...(isVideoGame && product.gameMetadata?.supportedPlatforms
      ? [{ label: "Plataformas", value: product.gameMetadata.supportedPlatforms }]
      : []),
    ...(isVideoGame && product.gameMetadata?.audioLanguages
      ? [{ label: "Idioma Audio (Voces)", value: product.gameMetadata.audioLanguages }]
      : []),
    ...(isVideoGame && product.gameMetadata?.subtitleLanguages
      ? [{ label: "Idioma Subtítulos (Textos)", value: product.gameMetadata.subtitleLanguages }]
      : []),
    ...(isVideoGame && product.gameMetadata?.ageRating
      ? [{ label: "Clasificación por Edad", value: product.gameMetadata.ageRating }]
      : []),
    // Consola: Rendimiento y Hardware
    ...(isVideoGame && product.gameMetadata?.fileSize
      ? [{ label: "Espacio en Disco", value: product.gameMetadata.fileSize }]
      : []),
    ...(isVideoGame && (product.gameMetadata?.displayModes || product.gameMetadata?.resolution)
      ? [{ label: "Modos de Visualización", value: product.gameMetadata.displayModes || product.gameMetadata.resolution }]
      : []),
    ...(isVideoGame && product.gameMetadata?.xboxSeriesSOptimization
      ? [{ label: "Optimización Xbox Series S", value: product.gameMetadata.xboxSeriesSOptimization }]
      : []),
    ...(isVideoGame && product.gameMetadata?.hardwareFeatures
      ? [{ label: "Funciones de Hardware", value: product.gameMetadata.hardwareFeatures }]
      : []),
    // PC: Requisitos de Hardware
    ...(isVideoGame && product.gameMetadata?.pcOs
      ? [{ label: "Sistema Operativo", value: product.gameMetadata.pcOs }]
      : []),
    ...(isVideoGame && product.gameMetadata?.pcProcessor
      ? [{ label: "Procesador (CPU)", value: product.gameMetadata.pcProcessor }]
      : []),
    ...(isVideoGame && product.gameMetadata?.pcRam
      ? [{ label: "Memoria RAM", value: product.gameMetadata.pcRam }]
      : []),
    ...(isVideoGame && product.gameMetadata?.pcGpu
      ? [{ label: "Tarjeta Gráfica (GPU)", value: product.gameMetadata.pcGpu }]
      : []),
    ...(isVideoGame && product.gameMetadata?.pcStorage
      ? [{ label: "Almacenamiento PC", value: product.gameMetadata.pcStorage }]
      : []),

    // Figuras de Colección (1. Información General)
    ...(isFigure && (product.figureMetadata?.productName || product.name)
      ? [{ label: "Nombre Oficial", value: product.figureMetadata?.productName || product.name }]
      : []),
    ...(isFigure && product.figureMetadata?.franchise
      ? [{ label: "Franquicia / Anime / Manga", value: product.figureMetadata.franchise }]
      : []),
    ...(isFigure && product.figureMetadata?.scale
      ? [{ label: "Escala de la Figura", value: formatFigureScale(product.figureMetadata.scale) }]
      : []),
    ...(isFigure && product.figureMetadata?.manufacturer
      ? [{ label: "Fabricante Oficial", value: formatFigureManufacturer(product.figureMetadata.manufacturer) }]
      : []),
    ...(isFigure && product.figureMetadata?.productLine
      ? [{ label: "Línea de Producto", value: product.figureMetadata.productLine }]
      : []),
    ...(isFigure && product.figureMetadata?.sculptor
      ? [{ label: "Escultor / Diseñador Original", value: product.figureMetadata.sculptor }]
      : []),
    ...(isFigure && product.figureMetadata?.releaseDate
      ? [{ label: "Fecha Lanzamiento Japón", value: product.figureMetadata.releaseDate }]
      : []),
    ...(isFigure && product.figureMetadata?.estimatedArrivalDate
      ? [{ label: "Fecha Estimada de Llegada", value: product.figureMetadata.estimatedArrivalDate }]
      : []),
    ...(isFigure && product.figureMetadata?.licenseStatus
      ? [{ label: "Estado de Licencia", value: product.figureMetadata.licenseStatus }]
      : []),

    // Figuras de Colección (2. Especificaciones Físicas y Dimensiones)
    ...(isFigure && product.figureMetadata?.height
      ? [{ label: "Altura", value: product.figureMetadata.height }]
      : []),
    ...(isFigure && product.figureMetadata?.width
      ? [{ label: "Ancho / Profundidad", value: product.figureMetadata.width }]
      : []),
    ...(isFigure && product.figureMetadata?.weight
      ? [{ label: "Peso Neto de la Figura", value: product.figureMetadata.weight }]
      : []),
    ...(isFigure && product.figureMetadata?.dimensions
      ? [{ label: "Dimensiones Totales", value: product.figureMetadata.dimensions }]
      : []),
    ...(isFigure && product.figureMetadata?.base
      ? [{ label: "Base y Soporte", value: product.figureMetadata.base }]
      : []),

    // Figuras de Colección (3. Materiales y Fabricación)
    ...(isFigure && (product.figureMetadata?.materials || product.figureMetadata?.material)
      ? [{ label: "Materiales Principales", value: product.figureMetadata?.materials || product.figureMetadata?.material }]
      : []),
    ...(isFigure && product.figureMetadata?.paintTechnique
      ? [{ label: "Técnica de Pintura y Acabado", value: product.figureMetadata.paintTechnique }]
      : []),
    ...(isFigure && product.figureMetadata?.articulation
      ? [{ label: "Tipo de Articulación / Estatua", value: product.figureMetadata.articulation }]
      : []),

    // Figuras de Colección (4. Contenido de la Caja y Accesorios)
    ...(isFigure && product.figureMetadata?.interchangeableParts
      ? [{ label: "Piezas Intercambiables", value: product.figureMetadata.interchangeableParts }]
      : []),
    ...(isFigure && product.figureMetadata?.accessories
      ? [{ label: "Accesorios Incluidos", value: product.figureMetadata.accessories }]
      : []),
    ...(isFigure && product.figureMetadata?.certificate
      ? [{ label: "Certificado y Sellos", value: product.figureMetadata.certificate }]
      : []),

    // Figuras de Colección (5. Seguridad, Empaque y Logística)
    ...(isFigure && product.figureMetadata?.ageRecommendation
      ? [{ label: "Edad Recomendada", value: product.figureMetadata.ageRecommendation }]
      : []),
    ...(isFigure && product.figureMetadata?.boxCondition
      ? [{ label: "Estado del Empaque", value: product.figureMetadata.boxCondition }]
      : []),
    ...(isFigure && product.figureMetadata?.boxDimensions
      ? [{ label: "Dimensiones de la Caja", value: product.figureMetadata.boxDimensions }]
      : []),
    ...(isFigure && product.figureMetadata?.shippingWeight
      ? [{ label: "Peso de Envío", value: product.figureMetadata.shippingWeight }]
      : []),
    ...(isFigure && isPreOrder && product.figureMetadata?.minimumDepositPercent
      ? [{ label: "Pie Mínimo Preventa", value: `${Math.round(product.figureMetadata.minimumDepositPercent * 100)}% del total` }]
      : []),

    // TCG / Cartas Coleccionables
    ...(isCollectible && product.collectibleMetadata?.productName
      ? [{ label: "Nombre del Producto", value: product.collectibleMetadata.productName }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.franchise
      ? [{ label: "Franquicia / IP", value: product.collectibleMetadata.franchise }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.gameSystem
      ? [{ label: "Juego / Sistema", value: product.collectibleMetadata.gameSystem }]
      : []),
    ...(isCollectible && (product.collectibleMetadata?.language || product.collectibleMetadata?.cardLanguage)
      ? [{ label: "Idioma", value: product.collectibleMetadata.language || product.collectibleMetadata.cardLanguage || "Japonés" }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.setExpansion
      ? [{ label: "Set / Expansión", value: product.collectibleMetadata.setExpansion }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.releaseYear
      ? [{ label: "Año de Lanzamiento", value: product.collectibleMetadata.releaseYear }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.cardNumber
      ? [{ label: "Código / N° de Carta", value: product.collectibleMetadata.cardNumber }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.rarity
      ? [{ label: "Rareza", value: product.collectibleMetadata.rarity }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.finishVariant
      ? [{ label: "Acabado / Variante", value: product.collectibleMetadata.finishVariant }]
      : []),
    ...(isCollectible && (product.collectibleMetadata?.gradingCondition || product.collectibleMetadata?.condition)
      ? [{ label: "Graduación General", value: (product.collectibleMetadata.gradingCondition || product.collectibleMetadata.condition || "").replace(/_/g, " ") }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.wearDetails
      ? [{ label: "Detalles del Desgaste", value: product.collectibleMetadata.wearDetails }]
      : []),
    ...(isCollectible && (product.collectibleMetadata?.certification || product.collectibleMetadata?.authenticationBody)
      ? [{ label: "Certificación", value: product.collectibleMetadata.certification || product.collectibleMetadata.authenticationBody }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.serialNumber
      ? [{ label: "Número de Serie Certificado", value: product.collectibleMetadata.serialNumber }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.productType
      ? [{ label: "Tipo de Producto", value: product.collectibleMetadata.productType }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.itemQuantity
      ? [{ label: "Cantidad de Elementos", value: product.collectibleMetadata.itemQuantity }]
      : []),
    ...(isCollectible && product.collectibleMetadata?.includesProtection
      ? [{ label: "¿Incluye Protección?", value: product.collectibleMetadata.includesProtection }]
      : []),

    // Consolas
    ...(isConsoleCat && product.customSpecifications?.console?.baseModel
      ? [{ label: "Modelo Base Consola", value: product.customSpecifications.console.baseModel }]
      : []),
    ...(isConsoleCat && product.customSpecifications?.console?.capacity
      ? [{ label: "Capacidad Almacenamiento", value: product.customSpecifications.console.capacity }]
      : []),
    ...(isConsoleCat && product.customSpecifications?.console?.format
      ? [{ label: "Formato de Consola", value: product.customSpecifications.console.format }]
      : []),
    ...(isConsoleCat && product.customSpecifications?.console?.controllersIncluded
      ? [{ label: "Controles Incluidos", value: product.customSpecifications.console.controllersIncluded }]
      : []),
    ...(isConsoleCat && product.customSpecifications?.console?.bundleIncluded
      ? [{ label: "Bundle / Accesorios", value: product.customSpecifications.console.bundleIncluded }]
      : []),
    ...(isConsoleCat && product.customSpecifications?.console?.ports
      ? [{ label: "Puertos & Conexiones", value: product.customSpecifications.console.ports }]
      : []),
    ...(isConsoleCat && product.customSpecifications?.console?.gameCompatibility
      ? [{ label: "Compatibilidad con Juegos", value: product.customSpecifications.console.gameCompatibility }]
      : []),
    ...(isConsoleCat && product.customSpecifications?.console?.featuredHighlights
      ? [{ label: "Características Destacadas", value: product.customSpecifications.console.featuredHighlights }]
      : []),

    // Hardware & Componentes Genéricos (SOLO si no posee subtipo especializado)
    ...(isHardwareCat && !hasSpecializedHw && hw?.componentType
      ? [{ label: "Tipo de Componente", value: hw.componentType }]
      : []),
    ...(isHardwareCat && !hasSpecializedHw && hw?.brand
      ? [{ label: "Marca del Fabricante", value: hw.brand }]
      : []),
    ...(isHardwareCat && !hasSpecializedHw && hw?.model
      ? [{ label: "Modelo Exacto", value: hw.model }]
      : []),
    ...(isHardwareCat && !hasSpecializedHw && hw?.interfaceOrSocket
      ? [{ label: "Interfaz / Socket", value: hw.interfaceOrSocket }]
      : []),
    ...(isHardwareCat && !hasSpecializedHw && hw?.capacityOrSpeed
      ? [{ label: "Capacidad / Velocidad", value: hw.capacityOrSpeed }]
      : []),
    ...(isHardwareCat && !hasSpecializedHw && hw?.formFactor
      ? [{ label: "Factor de Forma", value: hw.formFactor }]
      : []),
    ...(isHardwareCat && !hasSpecializedHw && hw?.powerConsumptionTdp
      ? [{ label: "Consumo / TDP", value: hw.powerConsumptionTdp }]
      : []),
    ...(isHardwareCat && !hasSpecializedHw && hw?.featuredHighlights
      ? [{ label: "Características Destacadas", value: hw.featuredHighlights }]
      : []),
    ...(isHardwareCat && !hasSpecializedHw && hw?.warrantyYears
      ? [{ label: "Garantía Oficial", value: hw.warrantyYears }]
      : []),

    // Tarjeta de Video (GPU) - SOLO SI ES TARJETA DE VIDEO
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.manufacturer
      ? [{ label: "Fabricante GPU", value: hw.gpu.manufacturer }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.gpu
      ? [{ label: "GPU", value: hw.gpu.gpu }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.memory
      ? [{ label: "Memoria VRAM", value: hw.gpu.memory }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.bus
      ? [{ label: "Bus de Memoria", value: hw.gpu.bus }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && (hw?.gpu?.coreClocks || hw?.gpu?.coreFrequencies)
      ? [{ label: "Frecuencias Core", value: hw?.gpu?.coreClocks || hw?.gpu?.coreFrequencies || "" }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && (hw?.gpu?.memoryClock || hw?.gpu?.memoryFrequency)
      ? [{ label: "Frecuencia Memorias", value: hw?.gpu?.memoryClock || hw?.gpu?.memoryFrequency || "" }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && (hw?.gpu?.coreName || hw?.gpu?.core)
      ? [{ label: "Núcleo", value: hw?.gpu?.coreName || hw?.gpu?.core || "" }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.profile
      ? [{ label: "Perfil", value: hw.gpu.profile }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.cooling
      ? [{ label: "Refrigeración", value: hw.gpu.cooling }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.slots
      ? [{ label: "Slots Ocupados", value: hw.gpu.slots }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.length
      ? [{ label: "Largo de Tarjeta", value: hw.gpu.length }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.lighting
      ? [{ label: "Iluminación", value: hw.gpu.lighting }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && (hw?.gpu?.hasBackplate || hw?.gpu?.backplate)
      ? [{ label: "¿Posee Backplate?", value: hw?.gpu?.hasBackplate || hw?.gpu?.backplate }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.powerConnectors
      ? [{ label: "Conectores de Poder", value: hw.gpu.powerConnectors }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "TARJETA_DE_VIDEO") && hw?.gpu?.videoPorts
      ? [{ label: "Puertos de Video", value: hw.gpu.videoPorts }]
      : []),

    // Procesadores (CPU) - SOLO SI ES PROCESADOR
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PROCESADORES") && hw?.cpu?.frequency
      ? [{ label: "Frecuencia Base", value: hw.cpu.frequency }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PROCESADORES") && hw?.cpu?.turboFrequency
      ? [{ label: "Frecuencia Turbo Máx.", value: hw.cpu.turboFrequency }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PROCESADORES") && hw?.cpu?.coresThreads
      ? [{ label: "Núcleos / Hilos", value: hw.cpu.coresThreads }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PROCESADORES") && hw?.cpu?.cache
      ? [{ label: "Memoria Caché", value: hw.cpu.cache }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PROCESADORES") && hw?.cpu?.socket
      ? [{ label: "Socket CPU", value: hw.cpu.socket }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PROCESADORES") && (hw?.cpu?.coreName || hw?.cpu?.core)
      ? [{ label: "Núcleo / Arquitectura", value: hw?.cpu?.coreName || hw?.cpu?.core }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PROCESADORES") && hw?.cpu?.manufacturingProcess
      ? [{ label: "Proceso de Manufactura", value: hw.cpu.manufacturingProcess }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PROCESADORES") && hw?.cpu?.tdp
      ? [{ label: "TDP", value: hw.cpu.tdp }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PROCESADORES") && hw?.cpu?.cooler
      ? [{ label: "Cooler Incluido", value: hw.cpu.cooler }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PROCESADORES") && hw?.cpu?.integratedGraphics
      ? [{ label: "Gráficos Integrados", value: hw.cpu.integratedGraphics }]
      : []),

    // Placa Madre - SOLO SI ES PLACA MADRE
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.manufacturer
      ? [{ label: "Fabricante Placa", value: hw.motherboard.manufacturer }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.socket
      ? [{ label: "Socket Placa Madre", value: hw.motherboard.socket }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.chipset
      ? [{ label: "Chipset", value: hw.motherboard.chipset }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.memorySlots
      ? [{ label: "Slots de Memoria", value: hw.motherboard.memorySlots }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.memoryChannels
      ? [{ label: "Canales de Memoria", value: hw.motherboard.memoryChannels }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.format
      ? [{ label: "Formato Placa Madre", value: hw.motherboard.format }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.rgbSupport
      ? [{ label: "Soporte RGB / Iluminación", value: hw.motherboard.rgbSupport }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.videoPorts
      ? [{ label: "Puertos de Video Placa", value: hw.motherboard.videoPorts }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.powerPorts
      ? [{ label: "Puertos de Energía", value: hw.motherboard.powerPorts }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.sliSupport
      ? [{ label: "Soporte SLI", value: hw.motherboard.sliSupport }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.crossfireSupport
      ? [{ label: "Soporte CrossFire", value: hw.motherboard.crossfireSupport }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.raidSupport
      ? [{ label: "Soporte RAID", value: hw.motherboard.raidSupport }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.connectors
      ? [{ label: "Conectores Internos", value: hw.motherboard.connectors }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.ports
      ? [{ label: "Puertos Traseros", value: hw.motherboard.ports }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "PLACA_MADRE") && hw?.motherboard?.expansions
      ? [{ label: "Ranuras de Expansión", value: hw.motherboard.expansions }]
      : []),

    // Memoria RAM - SOLO SI ES RAM
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "RAM") && hw?.ram?.capacity
      ? [{ label: "Capacidad RAM", value: hw.ram.capacity }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "RAM") && hw?.ram?.type
      ? [{ label: "Tipo de Memoria RAM", value: hw.ram.type }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "RAM") && hw?.ram?.speed
      ? [{ label: "Velocidad RAM", value: hw.ram.speed }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "RAM") && hw?.ram?.format
      ? [{ label: "Formato Memoria", value: hw.ram.format }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "RAM") && hw?.ram?.voltage
      ? [{ label: "Voltaje RAM", value: hw.ram.voltage }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "RAM") && (hw?.ram?.casLatency || hw?.ram?.latencyClCas)
      ? [{ label: "Latencia CAS (CL)", value: hw?.ram?.casLatency || hw?.ram?.latencyClCas }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "RAM") && hw?.ram?.eccSupport
      ? [{ label: "Soporte ECC", value: hw.ram.eccSupport }]
      : []),

    // Disco Duro (HDD) - SOLO SI ES DISCO DURO
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "DISCO_DURO") && hw?.hdd?.type
      ? [{ label: "Tipo Disco Duro", value: hw.hdd.type }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "DISCO_DURO") && hw?.hdd?.line
      ? [{ label: "Línea", value: hw.hdd.line }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "DISCO_DURO") && hw?.hdd?.capacity
      ? [{ label: "Capacidad", value: hw.hdd.capacity }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "DISCO_DURO") && hw?.hdd?.rpm
      ? [{ label: "RPM", value: hw.hdd.rpm }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "DISCO_DURO") && hw?.hdd?.size
      ? [{ label: "Tamaño Disco", value: hw.hdd.size }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "DISCO_DURO") && hw?.hdd?.bus
      ? [{ label: "Bus / Interfaz", value: hw.hdd.bus }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "DISCO_DURO") && hw?.hdd?.buffer
      ? [{ label: "Búfer", value: hw.hdd.buffer }]
      : []),

    // SSD - SOLO SI ES SSD
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "SSD") && hw?.ssd?.line
      ? [{ label: "Línea SSD", value: hw.ssd.line }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "SSD") && hw?.ssd?.capacity
      ? [{ label: "Capacidad SSD", value: hw.ssd.capacity }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "SSD") && hw?.ssd?.format
      ? [{ label: "Formato SSD", value: hw.ssd.format }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "SSD") && hw?.ssd?.bus
      ? [{ label: "Bus / Interfaz", value: hw.ssd.bus }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "SSD") && hw?.ssd?.hasDram
      ? [{ label: "¿Posee DRAM?", value: hw.ssd.hasDram }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "SSD") && hw?.ssd?.nandType
      ? [{ label: "Tipo Memoria NAND", value: hw.ssd.nandType }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "SSD") && hw?.ssd?.controller
      ? [{ label: "Controladora", value: hw.ssd.controller }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "SSD") && hw?.ssd?.sequentialRead
      ? [{ label: "Lectura Secuencial", value: hw.ssd.sequentialRead }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "SSD") && hw?.ssd?.sequentialWrite
      ? [{ label: "Escritura Secuencial", value: hw.ssd.sequentialWrite }]
      : []),

    // Fuente de Poder (PSU) - SOLO SI ES FUENTE DE PODER
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER") && hw?.powerSupply?.power
      ? [{ label: "Potencia Fuente", value: hw.powerSupply.power }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER") && hw?.powerSupply?.certification
      ? [{ label: "Certificación 80 PLUS", value: hw.powerSupply.certification }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER") && hw?.powerSupply?.size
      ? [{ label: "Tamaño / Formato Fuente", value: hw.powerSupply.size }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER") && hw?.powerSupply?.modular
      ? [{ label: "Modularidad", value: hw.powerSupply.modular }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER") && hw?.powerSupply?.powerConnectors
      ? [{ label: "Conectores de Energía", value: hw.powerSupply.powerConnectors }]
      : []),

    // Cooler CPU - SOLO SI ES COOLER
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "COOLER_CPU") && hw?.coolerCpu?.brand
      ? [{ label: "Marca Cooler", value: hw.coolerCpu.brand }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "COOLER_CPU") && hw?.coolerCpu?.type
      ? [{ label: "Tipo de Refrigeración", value: hw.coolerCpu.type }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "COOLER_CPU") && hw?.coolerCpu?.height
      ? [{ label: "Altura del Disipador", value: hw.coolerCpu.height }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "COOLER_CPU") && hw?.coolerCpu?.fanSize
      ? [{ label: "Tamaño Ventilador", value: hw.coolerCpu.fanSize }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "COOLER_CPU") && hw?.coolerCpu?.compatibleSockets
      ? [{ label: "Sockets Compatibles", value: hw.coolerCpu.compatibleSockets }]
      : []),

    // Gabinete - SOLO SI ES GABINETE
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "GABINETE") && hw?.cabinet?.brand
      ? [{ label: "Marca Gabinete", value: hw.cabinet.brand }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "GABINETE") && hw?.cabinet?.model
      ? [{ label: "Modelo Gabinete", value: hw.cabinet.model }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "GABINETE") && hw?.cabinet?.format
      ? [{ label: "Formato Gabinete", value: hw.cabinet.format }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "GABINETE") && hw?.cabinet?.sidePanel
      ? [{ label: "Panel Lateral", value: hw.cabinet.sidePanel }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "GABINETE") && hw?.cabinet?.maxGpuLength
      ? [{ label: "Largo Máx. GPU Soportado", value: hw.cabinet.maxGpuLength }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "GABINETE") && hw?.cabinet?.maxCoolerHeight
      ? [{ label: "Altura Máx. Cooler Soportado", value: hw.cabinet.maxCoolerHeight }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "GABINETE") && hw?.cabinet?.radiatorSupport
      ? [{ label: "Soporte de Radiadores", value: hw.cabinet.radiatorSupport }]
      : []),

    // Ventiladores - SOLO SI ES VENTILADOR
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "VENTILADORES") && hw?.fan?.brand
      ? [{ label: "Marca Ventilador", value: hw.fan.brand }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "VENTILADORES") && hw?.fan?.size
      ? [{ label: "Tamaño Ventilador", value: hw.fan.size }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "VENTILADORES") && hw?.fan?.rpm
      ? [{ label: "RPM Ventilador", value: hw.fan.rpm }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "VENTILADORES") && hw?.fan?.airflow
      ? [{ label: "Flujo de Aire", value: hw.fan.airflow }]
      : []),
    ...(isHardwareCat && (!hwSubtype || hwSubtype === "VENTILADORES") && hw?.fan?.lighting
      ? [{ label: "Iluminación", value: hw.fan.lighting }]
      : []),

    // Mouse Gaming - SOLO SI ES ACCESORIO GAMING DE TIPO MOUSE
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.brand
      ? [{ label: "Marca del Mouse", value: acc.mouse.brand }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.tracking
      ? [{ label: "Sensor & Tracking", value: acc.mouse.tracking }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.buttonCount
      ? [{ label: "Cantidad de Botones", value: String(acc.mouse.buttonCount) }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.maxDpi
      ? [{ label: "DPI Máximo", value: String(acc.mouse.maxDpi) }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.wiring
      ? [{ label: "Cableado / Conexión", value: acc.mouse.wiring }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.weight
      ? [{ label: "Peso", value: acc.mouse.weight }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.dimensions
      ? [{ label: "Dimensiones", value: acc.mouse.dimensions }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.adjustableDpi
      ? [{ label: "DPI Ajustable", value: acc.mouse.adjustableDpi }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.color
      ? [{ label: "Color", value: acc.mouse.color }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.pollingRate
      ? [{ label: "Polling Rate", value: acc.mouse.pollingRate }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.technology
      ? [{ label: "Tecnología de Switches", value: acc.mouse.technology }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.lighting
      ? [{ label: "Iluminación", value: acc.mouse.lighting }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "MOUSE") && acc?.mouse?.powerSource
      ? [{ label: "Alimentación / Batería", value: acc.mouse.powerSource }]
      : []),

    // Teclado Gaming - SOLO SI ES ACCESORIO GAMING DE TIPO TECLADO
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.brand
      ? [{ label: "Marca del Teclado", value: acc.keyboard.brand }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.partNumber
      ? [{ label: "Part Number", value: acc.keyboard.partNumber }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.type
      ? [{ label: "Tipo de Teclado", value: acc.keyboard.type }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.category
      ? [{ label: "Formato / Tamaño", value: acc.keyboard.category }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.backlight
      ? [{ label: "Retroiluminación", value: acc.keyboard.backlight }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.switchType
      ? [{ label: "Tipo de Switch", value: acc.keyboard.switchType }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.wiring
      ? [{ label: "Cableado", value: acc.keyboard.wiring }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.connectionTechnology
      ? [{ label: "Tecnología de Conexión", value: acc.keyboard.connectionTechnology }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.macroKeys
      ? [{ label: "Teclas Macro", value: acc.keyboard.macroKeys }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.hasWristRest
      ? [{ label: "¿Apoya muñecas?", value: acc.keyboard.hasWristRest }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "KEYBOARD") && acc?.keyboard?.hasMediaKeys
      ? [{ label: "¿Teclas Multimedia?", value: acc.keyboard.hasMediaKeys }]
      : []),

    // Audífonos Gaming - SOLO SI ES AUDÍFONO
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.type
      ? [{ label: "Tipo de Audífono", value: acc.headset.type }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.microphone
      ? [{ label: "Micrófono", value: acc.headset.microphone }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.frequencyResponse
      ? [{ label: "Respuesta en Frecuencia", value: acc.headset.frequencyResponse }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.color
      ? [{ label: "Color", value: acc.headset.color }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.lighting
      ? [{ label: "Iluminación", value: acc.headset.lighting }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.connectivity
      ? [{ label: "Conectividad", value: acc.headset.connectivity }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.activeNoiseCancelling
      ? [{ label: "Cancelación de Ruido (ANC)", value: acc.headset.activeNoiseCancelling }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.inLineControls
      ? [{ label: "Controles de Audio", value: acc.headset.inLineControls }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.driverSize
      ? [{ label: "Tamaño Driver", value: acc.headset.driverSize }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.impedance
      ? [{ label: "Impedancia", value: acc.headset.impedance }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "HEADSET") && acc?.headset?.cableLength
      ? [{ label: "Largo del Cable", value: acc.headset.cableLength }]
      : []),

    // Control / Joystick Gaming - SOLO SI ES CONTROL
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.brand
      ? [{ label: "Marca del Control", value: acc.controller.brand }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.platformCompatibility
      ? [{ label: "Compatibilidad Plataforma", value: acc.controller.platformCompatibility }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.connectionType
      ? [{ label: "Conexión / Interfaz", value: acc.controller.connectionType }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.feedbackHaptic
      ? [{ label: "Respuesta Háptica", value: acc.controller.feedbackHaptic }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.weight
      ? [{ label: "Peso", value: acc.controller.weight }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.color
      ? [{ label: "Color / Edición", value: acc.controller.color }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.layout
      ? [{ label: "Distribución de Botones", value: acc.controller.layout }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.batteryLife
      ? [{ label: "Autonomía de Batería", value: acc.controller.batteryLife }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.rechargeableBattery
      ? [{ label: "Tipo de Batería", value: acc.controller.rechargeableBattery }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.programmableBackPaddles
      ? [{ label: "Botones Traseros / Paddles", value: acc.controller.programmableBackPaddles }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.triggerStops
      ? [{ label: "Bloqueo de Gatillos", value: acc.controller.triggerStops }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.audioJack
      ? [{ label: "Conector de Audio", value: acc.controller.audioJack }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.hallEffectSticks
      ? [{ label: "Joysticks Magnéticos (Hall Effect)", value: acc.controller.hallEffectSticks }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.lighting
      ? [{ label: "Iluminación / Barra de Luz", value: acc.controller.lighting }]
      : []),
    ...(isAccessoryCat && (!accSubtype || accSubtype === "CONTROLLER") && acc?.controller?.softwareCustomization
      ? [{ label: "Software y Personalización", value: acc.controller.softwareCustomization }]
      : []),

    // Ropa & Estilo
    ...(isApparelCat && product.customSpecifications?.apparel?.apparelType
      ? [{ label: "Tipo de Prenda", value: product.customSpecifications.apparel.apparelType }]
      : []),
    ...(isApparelCat && product.customSpecifications?.apparel?.size
      ? [{ label: "Tallas Disponibles", value: product.customSpecifications.apparel.size }]
      : []),
    ...(isApparelCat && product.customSpecifications?.apparel?.gender
      ? [{ label: "Género / Corte", value: product.customSpecifications.apparel.gender }]
      : []),
    ...(isApparelCat && product.customSpecifications?.apparel?.material
      ? [{ label: "Material / Composición", value: product.customSpecifications.apparel.material }]
      : []),
    ...(isApparelCat && product.customSpecifications?.apparel?.careInstructions
      ? [{ label: "Cuidados de Lavado", value: product.customSpecifications.apparel.careInstructions }]
      : []),
    ...(isApparelCat && product.customSpecifications?.apparel?.license
      ? [{ label: "Licencia Oficial", value: product.customSpecifications.apparel.license }]
      : []),

    // Manga / Artbook
    ...(isBookCat && product.customSpecifications?.book?.publisher
      ? [{ label: "Editorial", value: product.customSpecifications.book.publisher }]
      : []),
    ...(isBookCat && product.customSpecifications?.book?.language
      ? [{ label: "Idioma", value: product.customSpecifications.book.language }]
      : []),
    ...(isBookCat && product.customSpecifications?.book?.pages
      ? [{ label: "Número de Páginas", value: String(product.customSpecifications.book.pages) }]
      : []),
    ...(isBookCat && product.customSpecifications?.book?.binding
      ? [{ label: "Encuadernación", value: product.customSpecifications.book.binding }]
      : []),
    ...(isBookCat && product.customSpecifications?.book?.dimensions
      ? [{ label: "Dimensiones", value: product.customSpecifications.book.dimensions }]
      : []),
    ...(isBookCat && product.customSpecifications?.book?.hasColorPages
      ? [{ label: "Páginas a Color", value: product.customSpecifications.book.hasColorPages }]
      : []),
    ...(isBookCat && product.customSpecifications?.book?.isbn
      ? [{ label: "ISBN / Código", value: product.customSpecifications.book.isbn }]
      : []),

    // Merchandising
    ...(isMerchCat && product.customSpecifications?.merch?.itemType
      ? [{ label: "Tipo de Artículo", value: product.customSpecifications.merch.itemType }]
      : []),
    ...(isMerchCat && product.customSpecifications?.merch?.material
      ? [{ label: "Materiales", value: product.customSpecifications.merch.material }]
      : []),
    ...(isMerchCat && product.customSpecifications?.merch?.dimensions
      ? [{ label: "Dimensiones", value: product.customSpecifications.merch.dimensions }]
      : []),
    ...(isMerchCat && product.customSpecifications?.merch?.franchise
      ? [{ label: "Franquicia / Saga", value: product.customSpecifications.merch.franchise }]
      : []),

    // Audio / OST
    ...(isAudioCat && product.customSpecifications?.audio?.format
      ? [{ label: "Formato de Audio", value: product.customSpecifications.audio.format }]
      : []),
    ...(isAudioCat && product.customSpecifications?.audio?.discCount
      ? [{ label: "Número de Discos", value: String(product.customSpecifications.audio.discCount) }]
      : []),
    ...(isAudioCat && product.customSpecifications?.audio?.recordLabel
      ? [{ label: "Sello Discográfico", value: product.customSpecifications.audio.recordLabel }]
      : []),
    ...(isAudioCat && product.customSpecifications?.audio?.includesArtbook
      ? [{ label: "¿Incluye Libreto / Arte?", value: product.customSpecifications.audio.includesArtbook }]
      : []),
    ...(isAudioCat && product.customSpecifications?.audio?.featuredTracks
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

            {/* Sub-thumbnails with smooth scrolling */}
            {productImages.length > 1 && (
              <div className="relative pt-2 pb-1">
                <div
                  className="flex items-center gap-2 overflow-x-auto py-1 scroll-smooth"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {productImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition shrink-0 bg-[#F7F7F5] cursor-pointer ${
                        selectedImageIndex === idx
                          ? "border-[#FF6B35] ring-2 ring-[#FF6B35]/30 shadow-md shadow-[#FF6B35]/20 scale-105"
                          : "border-[#E5E5E5] opacity-70 hover:opacity-100 hover:border-[#FF6B35]"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} - Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono px-1 rounded bg-black/60 text-white font-bold">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
                {productImages.length > 4 && (
                  <div className="flex items-center justify-between text-[10px] text-[#666666] pt-1 px-1 font-mono">
                    <span>Foto {selectedImageIndex + 1} de {productImages.length}</span>
                    <span className="text-[#FF6B35]">Desliza para ver más &rarr;</span>
                  </div>
                )}
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
          {product.showTrailerSection !== false && (
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
          )}

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

          {/* Digital Authenticity Passport (Anti-Bootleg Guarantee) */}
          {passport && (
            <DigitalPassportCard
              passport={passport}
              productName={product.name}
              sku={product.sku}
            />
          )}
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

        {/* Real-Time TCG Market Price Tracker & Valuation Guide */}
        {marketPriceGuide && (
          <TcgMarketPriceTracker
            guide={marketPriceGuide}
            productName={product.name}
          />
        )}

        {/* Modern Interactive Content Gallery with Accessible Thumbnails & Lightbox */}
        {contentGallery.length > 0 && (
          <ProductContentGallery
            images={contentGallery}
            productName={product.name}
            sku={product.sku}
          />
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

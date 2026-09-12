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
} from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { formatCLP, formatCLPShort } from "@/lib/utils/currency";
import { BASE_PRODUCTS } from "@/lib/constants/catalog";
import { extractYouTubeEmbedUrl } from "@/lib/utils/media";
import { RelatedProductsSlider } from "@/components/catalog/RelatedProductsSlider";
import { analytics } from "@/lib/services/AnalyticsTracker";

const CATALOG_ITEMS = BASE_PRODUCTS;

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
    // Always fetch live product data from database so edits are reflected immediately
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

  // Genres list
  const genresList: string[] =
    product.genres && product.genres.length > 0
      ? product.genres
      : product.type === "VIDEO_GAME"
      ? ["Acción", "Aventuras"]
      : product.type === "FIGURE"
      ? ["Colección", "Anime"]
      : ["TCG", "Graduada"];

  // Technical Specifications List
  const technicalSpecs = [
    {
      label: "Formato Producto",
      value:
        product.type === "VIDEO_GAME"
          ? product.gameMetadata?.isDigital
            ? "Digital (Código Oficial)"
            : "Físico (Disco / Cartucho Sellado)"
          : product.type === "FIGURE"
          ? `Figura Coleccionable ${product.figureMetadata?.scale?.replace("SCALE_", "Escala ") || "1/7"}`
          : product.type === "COLLECTIBLE"
          ? `Carta Certificada ${product.collectibleMetadata?.authenticationBody || "PSA"}`
          : "Bundle Especial Compuesto",
    },
    {
      label: "Fabricante/Publisher",
      value:
        product.gameMetadata?.publisher ||
        product.figureMetadata?.manufacturer?.replace(/_/g, " ") ||
        (product.type === "COLLECTIBLE" ? product.collectibleMetadata?.authenticationBody : "OmniCollector"),
    },
    ...(product.gameMetadata?.audioLanguages
      ? [{ label: "Idioma Audio", value: product.gameMetadata.audioLanguages }]
      : []),
    ...(product.gameMetadata?.subtitleLanguages
      ? [{ label: "Idioma Subtítulos", value: product.gameMetadata.subtitleLanguages }]
      : []),
    ...(product.gameMetadata?.players
      ? [{ label: "N° Jugadores", value: product.gameMetadata.players }]
      : []),
    ...(product.gameMetadata?.fileSize
      ? [{ label: "Espacio en Disco", value: product.gameMetadata.fileSize }]
      : []),
    ...(product.gameMetadata?.resolution
      ? [{ label: "Resolución / Rendimiento", value: product.gameMetadata.resolution }]
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
        <div className="flex items-center gap-2 text-xs text-[#666666]">
          <Link href="/" className="hover:text-[#1A1A1A] transition">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-[#1A1A1A] transition">
            Catálogo
          </Link>
          <span>/</span>
          <span className="text-[#FF6B35] font-semibold font-mono">{product.sku}</span>
        </div>


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
              [
              {product.type === "VIDEO_GAME"
                ? `Juego ${product.gameMetadata?.platform || "PS5"}`
                : product.type === "FIGURE"
                ? `Figura ${product.figureMetadata?.scale?.replace("SCALE_", "1/") || "1/7"}`
                : product.type === "COLLECTIBLE"
                ? `Carta ${product.collectibleMetadata?.authenticationBody || "PSA"}`
                : "Bundle Especial"}
              ]
            </span>
          )}
        </h1>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Cover Image, Age Badge, Warranty, WhatsApp, Tags */}
        <div className="lg:col-span-4 space-y-4">
          {/* Main Cover Box */}
          <div className="rounded-2xl overflow-hidden bg-white border border-[#E5E5E5] p-3 shadow-sm">
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center group">
              {productImages.length > 0 ? (
                <img
                  src={productImages[selectedImageIndex] || productImages[0]}
                  alt={product.name}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Package className="w-12 h-12 text-[#666666] mx-auto opacity-40" />
                  <span className="text-xs text-[#666666] block">Imagen oficial de portada</span>
                </div>
              )}
            </div>

            {/* Sub-thumbnails */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1">
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
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

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
            href={`https://wa.me/56912345678?text=${whatsappMessage}`}
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

            {/* Large Active Screenshot Viewer */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-black border-2 border-[#E5E5E5] shadow-lg group flex items-center justify-center">
              <img
                src={contentGallery[selectedGalleryIndex] || contentGallery[0]}
                alt={`Captura interactiva ${selectedGalleryIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg border border-[#E5E5E5] text-xs font-mono text-[#1A1A1A] pointer-events-none shadow-sm">
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
        <RelatedProductsSlider currentProduct={product} allProducts={CATALOG_ITEMS as any} />

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

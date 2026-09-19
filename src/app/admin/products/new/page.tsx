"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  Trophy,
  Clock,
  Layers,
  Eye,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  PackageCheck,
  Sliders,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Star,
  Link2,
  Wand2,
  Disc,
  Download,
  Tag,
  X,
  Monitor,
  Tv,
  Cpu,
  Ruler,
  Paintbrush,
  Box,
  ShieldAlert,
  Info,
  HardDrive,
} from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { GoogleDriveImportModal } from "@/components/admin/GoogleDriveImportModal";
import { normalizeImageUrl } from "@/lib/utils/media";
import {
  ProductDomainEntity,
  ProductType,
  FigureScale,
  FigureManufacturer,
  GamePlatform,
  GameEdition,
  CollectibleCategory,
  CollectibleCondition,
  Authenticator,
  CustomCategorySpecifications,
} from "@/lib/types/domain";
import { CustomSpecificationsForm } from "@/components/admin/CustomSpecificationsForm";
import { formatCLP, formatCLPShort } from "@/lib/utils/currency";
import { getAdminHeaders } from "@/lib/auth/security";
import { saveProductToFirestoreClient } from "@/lib/firebase/client-firestore";
import { catalogClient } from "@/lib/services/catalogClient";
import { WORLDWIDE_AGE_RATINGS } from "@/lib/constants/ageRatings";

const CUSTOM_CATEGORY_PRESETS = [
  "Consolas",
  "Hardware & Componentes",
  "Ropa & Estilo",
  "Accesorio Gaming",
  "Manga / Artbook",
  "Merchandising",
  "Audio / OST",
];

export default function NewProductAdminPage() {
  // Available existing products for bundle composition
  const [existingProducts, setExistingProducts] = useState<ProductDomainEntity[]>([]);

  // Form State
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProductType>("FIGURE");
  const [customCategoryLabel, setCustomCategoryLabel] = useState("");
  const [customSpecifications, setCustomSpecifications] = useState<CustomCategorySpecifications>({});

  const isCustomOrSpecializedCategory = useMemo(() => {
    return [
      "HARDWARE",
      "CONSOLE",
      "GAMING_ACCESSORY",
      "ACCESSORY",
      "APPAREL",
      "BOOK",
      "MERCH",
      "AUDIO",
      "OTHER",
    ].includes(type);
  }, [type]);
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stockAvailable, setStockAvailable] = useState<number>(10);
  const [isPreOrder, setIsPreOrder] = useState<boolean>(true);
  const [preOrderState, setPreOrderState] = useState<string>("PREORDER_OPEN");

  // Multimedia & Badges
  const [trailerUrl, setTrailerUrl] = useState("");
  const [ageRating, setAgeRating] = useState("TE");
  const [customAgeRating, setCustomAgeRating] = useState("");
  const [genresInput, setGenresInput] = useState("Acción, Aventuras");

  // Images State (Cover & Carrousel)
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // In-Game / Content Gallery State (Gameplay captures / high-res details)
  const [contentGallery, setContentGallery] = useState<string[]>([]);
  const [contentGalleryInput, setContentGalleryInput] = useState("");

  // Google Drive Import Modal State
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveTarget, setDriveTarget] = useState<"MAIN_IMAGES" | "CONTENT_GALLERY">("CONTENT_GALLERY");

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      const normalized = normalizeImageUrl(imageUrlInput.trim());
      setImages((prev) => [...prev, normalized]);
      setImageUrlInput("");
    }
  };

  const handleAddContentGalleryImage = () => {
    if (contentGalleryInput.trim()) {
      const normalized = normalizeImageUrl(contentGalleryInput.trim());
      setContentGallery((prev) => [...prev, normalized]);
      setContentGalleryInput("");
    }
  };

  const handleRemoveContentGalleryImage = (indexToRemove: number) => {
    setContentGallery((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleContentGalleryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setContentGallery((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImages((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, idx) => idx !== index);
      return [selected, ...rest];
    });
  };

  // Dynamic: Game Technical Specs (Console vs PC)
  const [gameType, setGameType] = useState<"CONSOLE" | "PC">("CONSOLE");
  const [gamePlatform, setGamePlatform] = useState<GamePlatform | string>("PS5");
  const [gameEdition, setGameEdition] = useState<GameEdition | string>("STANDARD");
  const [gameIsDigital, setGameIsDigital] = useState(false);
  // Información General
  const [gameTitle, setGameTitle] = useState("");
  const [gameDeveloper, setGameDeveloper] = useState("");
  const [gamePublisher, setGamePublisher] = useState("");
  const [gameReleaseYear, setGameReleaseYear] = useState("");
  const [gameGenre, setGameGenre] = useState("");
  const [gameModes, setGameModes] = useState("Un jugador");
  // Aspectos de Software y Desarrollo
  const [gameEngine, setGameEngine] = useState("");
  const [gameSupportedPlatforms, setGameSupportedPlatforms] = useState("PlayStation 5, Xbox Series X|S");
  const [gameAudioLanguages, setGameAudioLanguages] = useState("Español Latino, Inglés, Japonés");
  const [gameSubtitleLanguages, setGameSubtitleLanguages] = useState("Español Latino, Inglés");
  const [gameAgeRating, setGameAgeRating] = useState("ESRB Teen (13+)");
  // Consola: Rendimiento
  const [gameFileSize, setGameFileSize] = useState("65 GB");
  const [gameDisplayModes, setGameDisplayModes] = useState("Modo Rendimiento 60fps / Modo Calidad 4K 30fps Ray Tracing");
  const [gameXboxSeriesSOptimization, setGameXboxSeriesSOptimization] = useState("1080p 60fps optimizado con resolución dinámica");
  const [gameHardwareFeatures, setGameHardwareFeatures] = useState("Gatillos adaptativos y retroalimentación háptica DualSense, Audio 3D Tempest, Cargas ultrarrápidas con SSD M.2");
  // PC: Requisitos de Hardware
  const [gamePcOs, setGamePcOs] = useState("Windows 11 / Windows 10 (64-bit)");
  const [gamePcProcessor, setGamePcProcessor] = useState("Intel Core i7-12700K / AMD Ryzen 7 7800X3D");
  const [gamePcRam, setGamePcRam] = useState("16 GB RAM (32 GB recomendado)");
  const [gamePcGpu, setGamePcGpu] = useState("NVIDIA GeForce RTX 4070 12GB / AMD Radeon RX 7800 XT 16GB");
  const [gamePcStorage, setGamePcStorage] = useState("85 GB de espacio disponible en SSD NVMe");

  // Dynamic: Figure Technical Specs - 5 Categorías Especializadas
  // 1. Información General del Producto
  const [figureProductName, setFigureProductName] = useState("");
  const [figureFranchise, setFigureFranchise] = useState("Evangelion / Rebuild of Evangelion");
  const [figureScale, setFigureScale] = useState<FigureScale>("SCALE_1_7");
  const [figureManufacturer, setFigureManufacturer] = useState<FigureManufacturer>("GOOD_SMILE_COMPANY");
  const [figureProductLine, setFigureProductLine] = useState("Scale Figure 1/7");
  const [figureSculptor, setFigureSculptor] = useState("Design COCO / eStream");
  const [figureArrivalDate, setFigureArrivalDate] = useState("Noviembre 2026");
  const [figureReleaseDate, setFigureReleaseDate] = useState("Noviembre 2026");
  const [figureLicenseStatus, setFigureLicenseStatus] = useState("Licencia Oficial Japonesa (Sello Holográfico de Autenticidad)");

  // 2. Especificaciones Físicas y Dimensiones
  const [figureHeight, setFigureHeight] = useState("28 cm");
  const [figureWidth, setFigureWidth] = useState("18 cm");
  const [figureWeight, setFigureWeight] = useState("650 g");
  const [figureDimensions, setFigureDimensions] = useState("28 cm de alto x 18 cm ancho");
  const [figureBase, setFigureBase] = useState("Base temática personalizada con soporte acrílico incluida");

  // 3. Materiales y Fabricación
  const [figureMaterial, setFigureMaterial] = useState("PVC & ABS de alta densidad pintado a mano");
  const [figureMaterials, setFigureMaterials] = useState("PVC, ABS y acrílico de grado coleccionista");
  const [figurePaintTechnique, setFigurePaintTechnique] = useState("Pintado artesanal a mano con gradientes aerográficos");
  const [figureArticulation, setFigureArticulation] = useState("Estatua Fija (Sin articulación, pose dinámica)");

  // 4. Contenido de la Caja y Accesorio
  const [figureInterchangeableParts, setFigureInterchangeableParts] = useState("2 rostros alternativos, 4 manos intercambiables");
  const [figureAccessories, setFigureAccessories] = useState("Arma emblemática, peana soporte, efectos de aura");
  const [figureCertificate, setFigureCertificate] = useState("Sello oficial de autenticidad en caja");

  // 5. Seguridad y Logística
  const [figureAgeRecommendation, setFigureAgeRecommendation] = useState("15+ años (Coleccionismo adulto)");
  const [figureBoxDimensions, setFigureBoxDimensions] = useState("35 x 25 x 20 cm");
  const [figureBoxCondition, setFigureBoxCondition] = useState("Caja sellada impecable de fábrica (Mint in Box)");
  const [figureShippingWeight, setFigureShippingWeight] = useState("1.4 kg (Embalaje protector reforzado)");

  // Preventa / Reserva
  const [figureDepositPercent, setFigureDepositPercent] = useState<number>(0.2);

  // Dynamic: Collectible / TCG (14 Especificaciones de Rareza & Coleccionismo)
  // 1. Información General del Producto
  const [tcgProductName, setTcgProductName] = useState("");
  const [tcgFranchise, setTcgFranchise] = useState("Pokémon");
  const [tcgGameSystem, setTcgGameSystem] = useState("Pokémon TCG");
  const [tcgLanguage, setTcgLanguage] = useState("Japonés");

  // 2. Detalles de Edición y Rareza
  const [tcgSetExpansion, setTcgSetExpansion] = useState("Base Set (1st Edition)");
  const [tcgReleaseYear, setTcgReleaseYear] = useState("1996");
  const [tcgCardNumber, setTcgCardNumber] = useState("4/102");
  const [tcgRarity, setTcgRarity] = useState("Holo Rare (1st Edition)");
  const [tcgFinishVariant, setTcgFinishVariant] = useState("Holográfica (Foil Cosmos)");

  // 3. Estado de Conservación (Condición)
  const [tcgGradingCondition, setTcgGradingCondition] = useState<CollectibleCondition | string>("GEM_MINT_10");
  const [tcgWearDetails, setTcgWearDetails] = useState("Sin blanqueamiento en bordes, esquinas 10/10, centrado 55/45, superficie limpia sin arañazos ni microrayas UV");
  const [tcgCertification, setTcgCertification] = useState<Authenticator | string>("PSA");
  const [tcgSerial, setTcgSerial] = useState("PSA-99201482");

  // 4. Presentación y Empaque
  const [tcgProductType, setTcgProductType] = useState("Carta Individual Graduada (Slab Acrílico)");
  const [tcgItemQuantity, setTcgItemQuantity] = useState("1 Carta en Slab Certificado");
  const [tcgIncludesProtection, setTcgIncludesProtection] = useState("Sí - Slab Acrílico Hermético con Filtro UV 99% & Funda Protectora Sleeve");

  // Legacy compat aliases
  const [collectibleCategory, setCollectibleCategory] = useState<CollectibleCategory>("TCG");
  const collectibleCondition = (tcgGradingCondition as CollectibleCondition) || "GEM_MINT_10";
  const collectibleAuth = (tcgCertification as Authenticator) || "PSA";
  const collectibleLang = tcgLanguage;
  const collectibleSerial = tcgSerial;

  // Dynamic: Bundle components
  const [selectedBundleItems, setSelectedBundleItems] = useState<{ productId: string; quantity: number }[]>([]);

  // Submission & UI feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [createdProduct, setCreatedProduct] = useState<ProductDomainEntity | null>(null);

  // AI Auto-Fill State
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isAutoFillingWithImage, setIsAutoFillingWithImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [autoFillSuccessMsg, setAutoFillSuccessMsg] = useState<string | null>(null);
  const [aiEngineUsed, setAiEngineUsed] = useState<string | null>(null);
  const [aiEngineErrorDetail, setAiEngineErrorDetail] = useState<string | null>(null);

  const mapToCanonicalCollectibleCondition = (val?: string): CollectibleCondition => {
    if (!val) return "GEM_MINT_10";
    const upper = String(val).toUpperCase().replace(/[\s-]+/g, "_");
    if (upper.includes("10") || upper.includes("GEM")) return "GEM_MINT_10";
    if (upper.includes("9") || upper === "MINT") return "MINT_9";
    if (upper.includes("8") || upper.includes("NEAR_MINT") || upper.includes("RAW")) return "NEAR_MINT_8";
    if (upper.includes("7") || upper.includes("EXCELLENT") || upper.includes("PLAYED")) return "EXCELLENT_7";
    return "GEM_MINT_10";
  };

  const mapToCanonicalAuthenticator = (val?: string): Authenticator => {
    if (!val) return "NONE";
    const upper = String(val).toUpperCase().trim();
    if (upper.includes("PSA")) return "PSA";
    if (upper.includes("BGS") || upper.includes("BECKETT")) return "BGS";
    if (upper.includes("CGC")) return "CGC";
    return "NONE";
  };

  const populateFormWithAutoFillData = (
    d: any,
    fromImage: boolean,
    chosenType?: ProductType,
    chosenCustomCategory?: string,
    imageUploadedUrl?: string
  ) => {
    // If identified from image and product name was returned, fill name
    if (fromImage && d.name && (!name.trim() || name === "Producto Coleccionable")) {
      setName(d.name);
    } else if (fromImage && d.name && !name.trim()) {
      setName(d.name);
    }

    // Set cover image if not set yet
    if (fromImage && imageUploadedUrl && !imageUrl) {
      setImageUrl(imageUploadedUrl);
    }

    // Update SKU with the category-accurate SKU
    if (d.sku) {
      setSku(d.sku);
      setSkuValidation({
        isChecking: false,
        isAvailable: true,
        message: `SKU (${d.sku}) asignado para la categoría seleccionada.`,
      });
    }

    // Strictly preserve the admin's chosen category and custom label
    if (chosenType) {
      setType(chosenType);
      if (chosenType === "OTHER") {
        setCustomCategoryLabel(chosenCustomCategory || d.customCategoryLabel || "Accesorio Gaming");
      }
    } else if (d.type) {
      setType(d.type);
      if (d.customCategoryLabel) setCustomCategoryLabel(d.customCategoryLabel);
    }

    if (d.description) setDescription(d.description);
    if (typeof d.price === "number") setPrice(d.price);
    if (typeof d.originalPrice === "number") setOriginalPrice(d.originalPrice);
    if (typeof d.costPrice === "number") setCostPrice(d.costPrice);
    if (typeof d.stockAvailable === "number") setStockAvailable(d.stockAvailable);
    if (typeof d.isPreOrder === "boolean") setIsPreOrder(d.isPreOrder);
    if (d.ageRating) setAgeRating(d.ageRating);
    if (d.genres) setGenresInput(d.genres);

    // Category-specific specs
    const targetCategoryType = chosenType || d.type;
    if (targetCategoryType === "FIGURE" && d.figureSpecs) {
      if (d.figureSpecs.scale) setFigureScale(d.figureSpecs.scale as any);
      if (d.figureSpecs.manufacturer) setFigureManufacturer(d.figureSpecs.manufacturer as any);
      if (d.figureSpecs.material) setFigureMaterial(d.figureSpecs.material);
      if (d.figureSpecs.dimensions) setFigureDimensions(d.figureSpecs.dimensions);
      if (d.figureSpecs.sculptor) setFigureSculptor(d.figureSpecs.sculptor);
      if (d.figureSpecs.boxCondition) setFigureBoxCondition(d.figureSpecs.boxCondition);
      if (d.figureSpecs.arrivalDate) setFigureArrivalDate(d.figureSpecs.arrivalDate);
      if (typeof d.figureSpecs.depositPercent === "number") setFigureDepositPercent(d.figureSpecs.depositPercent);

      // 1. Información General del Producto
      if (d.figureSpecs.productName) setFigureProductName(d.figureSpecs.productName);
      if (d.figureSpecs.franchise) setFigureFranchise(d.figureSpecs.franchise);
      if (d.figureSpecs.productLine) setFigureProductLine(d.figureSpecs.productLine);
      if (d.figureSpecs.releaseDate) setFigureReleaseDate(d.figureSpecs.releaseDate);
      if (d.figureSpecs.licenseStatus) setFigureLicenseStatus(d.figureSpecs.licenseStatus);

      // 2. Especificaciones Físicas y Dimensiones
      if (d.figureSpecs.height) setFigureHeight(d.figureSpecs.height);
      if (d.figureSpecs.width) setFigureWidth(d.figureSpecs.width);
      if (d.figureSpecs.weight) setFigureWeight(d.figureSpecs.weight);
      if (d.figureSpecs.base) setFigureBase(d.figureSpecs.base);

      // 3. Materiales y Fabricación
      if (d.figureSpecs.materials) setFigureMaterials(d.figureSpecs.materials);
      if (d.figureSpecs.paintTechnique) setFigurePaintTechnique(d.figureSpecs.paintTechnique);
      if (d.figureSpecs.articulation) setFigureArticulation(d.figureSpecs.articulation);

      // 4. Contenido de la Caja y Accesorio
      if (d.figureSpecs.interchangeableParts) setFigureInterchangeableParts(d.figureSpecs.interchangeableParts);
      if (d.figureSpecs.accessories) setFigureAccessories(d.figureSpecs.accessories);
      if (d.figureSpecs.certificate) setFigureCertificate(d.figureSpecs.certificate);

      // 5. Seguridad y Logística
      if (d.figureSpecs.ageRecommendation) setFigureAgeRecommendation(d.figureSpecs.ageRecommendation);
      if (d.figureSpecs.boxDimensions) setFigureBoxDimensions(d.figureSpecs.boxDimensions);
      if (d.figureSpecs.shippingWeight) setFigureShippingWeight(d.figureSpecs.shippingWeight);
    } else if (targetCategoryType === "VIDEO_GAME" && d.gameSpecs) {
      if (d.gameSpecs.gameType) setGameType(d.gameSpecs.gameType);
      if (d.gameSpecs.title) setGameTitle(d.gameSpecs.title);
      if (d.gameSpecs.developer) setGameDeveloper(d.gameSpecs.developer);
      if (d.gameSpecs.publisher) setGamePublisher(d.gameSpecs.publisher);
      if (d.gameSpecs.releaseYear) setGameReleaseYear(d.gameSpecs.releaseYear);
      if (d.gameSpecs.genre) setGameGenre(d.gameSpecs.genre);
      if (d.gameSpecs.gameModes) setGameModes(d.gameSpecs.gameModes);
      if (d.gameSpecs.gameEngine) setGameEngine(d.gameSpecs.gameEngine);
      if (d.gameSpecs.supportedPlatforms) setGameSupportedPlatforms(d.gameSpecs.supportedPlatforms);
      if (d.gameSpecs.platform) setGamePlatform(d.gameSpecs.platform as any);
      if (d.gameSpecs.edition) setGameEdition(d.gameSpecs.edition as any);
      if (d.gameSpecs.audioLanguages) setGameAudioLanguages(d.gameSpecs.audioLanguages);
      if (d.gameSpecs.subtitleLanguages) setGameSubtitleLanguages(d.gameSpecs.subtitleLanguages);
      if (d.gameSpecs.ageRating) setGameAgeRating(d.gameSpecs.ageRating);
      if (d.gameSpecs.fileSize) setGameFileSize(d.gameSpecs.fileSize);
      if (d.gameSpecs.displayModes) setGameDisplayModes(d.gameSpecs.displayModes);
      if (d.gameSpecs.xboxSeriesSOptimization) setGameXboxSeriesSOptimization(d.gameSpecs.xboxSeriesSOptimization);
      if (d.gameSpecs.hardwareFeatures) setGameHardwareFeatures(d.gameSpecs.hardwareFeatures);
      if (d.gameSpecs.pcOs) setGamePcOs(d.gameSpecs.pcOs);
      if (d.gameSpecs.pcProcessor) setGamePcProcessor(d.gameSpecs.pcProcessor);
      if (d.gameSpecs.pcRam) setGamePcRam(d.gameSpecs.pcRam);
      if (d.gameSpecs.pcGpu) setGamePcGpu(d.gameSpecs.pcGpu);
      if (d.gameSpecs.pcStorage) setGamePcStorage(d.gameSpecs.pcStorage);
    } else if (targetCategoryType === "COLLECTIBLE" && d.collectibleSpecs) {
      if (d.collectibleSpecs.category) setCollectibleCategory(d.collectibleSpecs.category as any);
      if (d.collectibleSpecs.condition) setTcgGradingCondition(mapToCanonicalCollectibleCondition(d.collectibleSpecs.condition));
      if (d.collectibleSpecs.authBody) setTcgCertification(mapToCanonicalAuthenticator(d.collectibleSpecs.authBody));
      if (d.collectibleSpecs.language) setTcgLanguage(d.collectibleSpecs.language);
      if (d.collectibleSpecs.serial) setTcgSerial(d.collectibleSpecs.serial);

      // 1. Información General del Producto
      if (d.collectibleSpecs.productName) setTcgProductName(d.collectibleSpecs.productName);
      if (d.collectibleSpecs.franchise) setTcgFranchise(d.collectibleSpecs.franchise);
      if (d.collectibleSpecs.gameSystem) setTcgGameSystem(d.collectibleSpecs.gameSystem);

      // 2. Detalles de Edición y Rareza
      if (d.collectibleSpecs.setExpansion) setTcgSetExpansion(d.collectibleSpecs.setExpansion);
      if (d.collectibleSpecs.releaseYear) setTcgReleaseYear(d.collectibleSpecs.releaseYear);
      if (d.collectibleSpecs.cardNumber) setTcgCardNumber(d.collectibleSpecs.cardNumber);
      if (d.collectibleSpecs.rarity) setTcgRarity(d.collectibleSpecs.rarity);
      if (d.collectibleSpecs.finishVariant) setTcgFinishVariant(d.collectibleSpecs.finishVariant);

      // 3. Estado de Conservación (Condición)
      if (d.collectibleSpecs.gradingCondition) setTcgGradingCondition(mapToCanonicalCollectibleCondition(d.collectibleSpecs.gradingCondition));
      if (d.collectibleSpecs.wearDetails) setTcgWearDetails(d.collectibleSpecs.wearDetails);
      if (d.collectibleSpecs.certification) setTcgCertification(mapToCanonicalAuthenticator(d.collectibleSpecs.certification));

      // 4. Presentación y Empaque
      if (d.collectibleSpecs.productType) setTcgProductType(d.collectibleSpecs.productType);
      if (d.collectibleSpecs.itemQuantity) setTcgItemQuantity(d.collectibleSpecs.itemQuantity);
      if (d.collectibleSpecs.includesProtection) setTcgIncludesProtection(d.collectibleSpecs.includesProtection);
    }
    if (d.customSpecifications) {
      // Section 6: Ficha de Especificaciones Técnicas Especializadas
      setCustomSpecifications(d.customSpecifications);
    }

    setAiEngineUsed(d.engine || "SMART_KNOWLEDGE_ENGINE");
    setAiEngineErrorDetail(d.geminiErrorDetail || null);
    const engineLabel = d.engine === "GEMINI_AI" ? "Google Gemini AI" : "Motor Heurístico Especializado";
    const actionLabel = fromImage
      ? `¡Producto identificado por imagen y rellenado exitosamente con ${engineLabel}!`
      : `¡Ficha generada exitosamente con ${engineLabel}!`;
    setAutoFillSuccessMsg(`${actionLabel} Todos los campos fueron completados.`);
    setTimeout(() => setAutoFillSuccessMsg(null), 8000);
  };

  const handleAutoFillWithAI = async () => {
    if (!name.trim()) {
      setErrorMsg("Por favor ingresa primero el Nombre del Producto para autocompletar la ficha.");
      return;
    }

    setIsAutoFilling(true);
    setErrorMsg(null);
    setAutoFillSuccessMsg(null);

    const chosenType = type;
    const chosenCustomCategory = customCategoryLabel;

    try {
      const res = await fetch("/api/admin/auto-fill-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          selectedType: chosenType,
          customCategoryLabel: chosenType === "OTHER" ? chosenCustomCategory : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo auto-completar el producto.");
      }

      populateFormWithAutoFillData(data.data, false, chosenType, chosenCustomCategory);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al autocompletar con IA.";
      setErrorMsg(msg);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleImageSelectedForAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the user can re-select the same file if desired
    e.target.value = "";

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("La imagen seleccionada supera el límite máximo de 10 MB.");
      return;
    }

    setIsAutoFillingWithImage(true);
    setErrorMsg(null);
    setAutoFillSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;

        const chosenType = type;
        const chosenCustomCategory = customCategoryLabel;

        const res = await fetch("/api/admin/auto-fill-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            selectedType: chosenType,
            customCategoryLabel: chosenType === "OTHER" ? chosenCustomCategory : undefined,
            imageBase64: base64Data,
            imageMimeType: file.type || "image/jpeg",
            imageFileName: file.name,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "No se pudo identificar el producto a partir de la imagen.");
        }

        populateFormWithAutoFillData(data.data, true, chosenType, chosenCustomCategory, base64Data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al procesar la imagen con IA.";
        setErrorMsg(msg);
      } finally {
        setIsAutoFillingWithImage(false);
      }
    };

    reader.onerror = () => {
      setIsAutoFillingWithImage(false);
      setErrorMsg("No se pudo leer el archivo de imagen seleccionado.");
    };

    reader.readAsDataURL(file);
  };

  // SKU Generator & Real-time Database Validation State
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  const [skuValidation, setSkuValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string | null;
    hadCollision?: boolean;
    dbCount?: number;
  }>({
    isChecking: false,
    isAvailable: null,
    message: null,
  });

  // Generate unique SKU analyzing database records
  const handleGenerateSku = async () => {
    if (!name.trim()) {
      setSkuValidation({
        isChecking: false,
        isAvailable: null,
        message: "Ingresa primero el nombre del producto para generar el SKU.",
      });
      return;
    }

    setIsGeneratingSku(true);
    setSkuValidation((prev) => ({ ...prev, isChecking: true }));

    try {
      const res = await fetch("/api/admin/generate-sku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          customCategoryLabel: type === "OTHER" ? customCategoryLabel : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.sku) {
        setSku(data.sku);
        setSkuValidation({
          isChecking: false,
          isAvailable: true,
          hadCollision: data.hadCollision,
          dbCount: data.databaseCount,
          message: data.hadCollision
            ? `Colisión resuelta: SKU generado con sufijo único (${data.sku}) verificado contra ${data.databaseCount} productos en BD.`
            : `SKU único generado (${data.sku}) y verificado contra ${data.databaseCount} productos en BD.`,
        });
      } else {
        setSkuValidation({
          isChecking: false,
          isAvailable: null,
          message: data.error || "No se pudo autogenerar el SKU.",
        });
      }
    } catch (_err: unknown) {
      setSkuValidation({
        isChecking: false,
        isAvailable: null,
        message: "Error de red al consultar la base de datos.",
      });
    } finally {
      setIsGeneratingSku(false);
    }
  };

  // Debounced real-time database validation for manual SKU input
  useEffect(() => {
    if (!sku || sku.trim().length < 3) {
      setSkuValidation({ isChecking: false, isAvailable: null, message: null });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSkuValidation((prev) => ({ ...prev, isChecking: true }));
        const res = await fetch("/api/admin/generate-sku", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkSku: sku.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
          setSkuValidation({
            isChecking: false,
            isAvailable: data.isAvailable,
            message: data.message,
          });
        }
      } catch {
        setSkuValidation((prev) => ({ ...prev, isChecking: false }));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [sku]);

  // Fetch catalog on mount for bundle components picker
  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.products)) {
          setExistingProducts(json.data.products);
        }
      })
      .catch(() => {});
  }, []);

  // Live Calculations
  const grossProfitCLP = Math.max(0, price - costPrice);
  const marginPercent = price > 0 ? ((grossProfitCLP / price) * 100).toFixed(1) : "0";
  const depositCLP = isPreOrder ? Math.round(price * figureDepositPercent) : price;
  const remainingCLP = Math.round(price - depositCLP);

  // Determine if genres/tags input makes sense for this category
  const shouldShowGenres = useMemo(() => {
    if (type === "VIDEO_GAME") return true;
    if (type === "OTHER") {
      const l = (customCategoryLabel || "").toLowerCase();
      return l.includes("manga") || l.includes("comic") || l.includes("libro") || l.includes("anime");
    }
    return false;
  }, [type, customCategoryLabel]);

  // Live Preview Object for ProductCard
  const previewProduct: ProductDomainEntity = useMemo(() => {
    const genresList = shouldShowGenres
      ? genresInput
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
      : [];

    const resolvedAgeRating =
      ageRating === "CUSTOM" ? customAgeRating.trim() : ageRating.trim();

    return {
      id: "preview-id",
      sku: (sku || "SKU-PREVIEW").toUpperCase().trim(),
      name: name || "Nombre del Producto",
      description: description || "Descripción detallada del producto en catálogo.",
      type,
      customCategoryLabel:
        type === "OTHER" || customCategoryLabel.trim()
          ? customCategoryLabel.trim()
          : undefined,
      price: price || 0,
      originalPrice: originalPrice && originalPrice > 0 ? originalPrice : undefined,
      costPrice: costPrice || 0,
      stockAvailable: stockAvailable || 0,
      stockReserved: 0,
      isPreOrder,
      preOrderState: isPreOrder ? (preOrderState as any) : undefined,
      images,
      imageUrl: images.length > 0 ? images[0] : undefined,
      trailerUrl: trailerUrl.trim() || undefined,
      ageRating: resolvedAgeRating || undefined,
      genres: genresList.length > 0 ? genresList : undefined,
      contentGallery: contentGallery.length > 0 ? contentGallery : undefined,
      gameMetadata:
        type === "VIDEO_GAME"
          ? {
              id: "meta-game",
              productId: "preview-id",
              gameType,
              platform: gameType === "PC" ? "PC" : gamePlatform,
              edition: gameEdition,
              isDigital: gameIsDigital,
              publisher: gamePublisher,
              audioLanguages: gameAudioLanguages,
              subtitleLanguages: gameSubtitleLanguages,
              players: gameModes,
              fileSize: gameFileSize,
              resolution: gameDisplayModes,
              title: gameTitle || name,
              developer: gameDeveloper,
              releaseYear: gameReleaseYear,
              genre: gameGenre,
              gameModes,
              gameEngine,
              supportedPlatforms: gameSupportedPlatforms,
              ageRating: gameAgeRating,
              displayModes: gameDisplayModes,
              xboxSeriesSOptimization: gameXboxSeriesSOptimization,
              hardwareFeatures: gameHardwareFeatures,
              pcOs: gamePcOs,
              pcProcessor: gamePcProcessor,
              pcRam: gamePcRam,
              pcGpu: gamePcGpu,
              pcStorage: gamePcStorage,
            }
          : undefined,
      figureMetadata:
        type === "FIGURE"
          ? {
              id: "meta-fig",
              productId: "preview-id",
              scale: figureScale,
              manufacturer: figureManufacturer,
              estimatedArrivalDate: figureArrivalDate,
              allowsPartialDeposit: isPreOrder,
              minimumDepositPercent: figureDepositPercent,
              material: figureMaterial,
              dimensions: figureDimensions,
              sculptor: figureSculptor,
              boxCondition: figureBoxCondition,
              productName: figureProductName || name,
              franchise: figureFranchise,
              productLine: figureProductLine,
              releaseDate: figureReleaseDate || figureArrivalDate,
              licenseStatus: figureLicenseStatus,
              height: figureHeight,
              width: figureWidth,
              weight: figureWeight,
              base: figureBase,
              materials: figureMaterials || figureMaterial,
              paintTechnique: figurePaintTechnique,
              articulation: figureArticulation,
              interchangeableParts: figureInterchangeableParts,
              accessories: figureAccessories,
              certificate: figureCertificate,
              ageRecommendation: figureAgeRecommendation,
              boxDimensions: figureBoxDimensions,
              shippingWeight: figureShippingWeight,
            }
          : undefined,
      collectibleMetadata:
        type === "COLLECTIBLE"
          ? {
              id: "meta-col",
              productId: "preview-id",
              category: collectibleCategory,
              condition: tcgGradingCondition as any,
              authenticationBody: tcgCertification as any,
              cardLanguage: tcgLanguage,
              serialNumber: tcgSerial,
              gradeScore: tcgGradingCondition === "GEM_MINT_10" ? "10" : tcgGradingCondition === "MINT_9" ? "9" : "8",
              slabType: tcgProductType,

              // 1. Información General del Producto
              productName: tcgProductName || name,
              franchise: tcgFranchise,
              gameSystem: tcgGameSystem,
              language: tcgLanguage,

              // 2. Detalles de Edición y Rareza
              setExpansion: tcgSetExpansion,
              releaseYear: tcgReleaseYear,
              cardNumber: tcgCardNumber,
              rarity: tcgRarity,
              finishVariant: tcgFinishVariant,

              // 3. Estado de Conservación (Condición)
              gradingCondition: tcgGradingCondition,
              wearDetails: tcgWearDetails,
              certification: tcgCertification,

              // 4. Presentación y Empaque
              productType: tcgProductType,
              itemQuantity: tcgItemQuantity,
              includesProtection: tcgIncludesProtection,
            }
          : undefined,
      customSpecifications: type === "OTHER" ? customSpecifications : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    sku,
    name,
    description,
    type,
    customCategoryLabel,
    price,
    originalPrice,
    costPrice,
    stockAvailable,
    isPreOrder,
    preOrderState,
    images,
    trailerUrl,
    ageRating,
    customAgeRating,
    genresInput,
    contentGallery,
    gameType,
    gamePlatform,
    gameEdition,
    gamePublisher,
    gameIsDigital,
    gameAudioLanguages,
    gameSubtitleLanguages,
    gameTitle,
    gameDeveloper,
    gameReleaseYear,
    gameGenre,
    gameModes,
    gameEngine,
    gameSupportedPlatforms,
    gameAgeRating,
    gameFileSize,
    gameDisplayModes,
    gameXboxSeriesSOptimization,
    gameHardwareFeatures,
    gamePcOs,
    gamePcProcessor,
    gamePcRam,
    gamePcGpu,
    gamePcStorage,
    figureScale,
    figureManufacturer,
    figureArrivalDate,
    figureDepositPercent,
    figureMaterial,
    figureDimensions,
    figureSculptor,
    figureBoxCondition,
    figureProductName,
    figureFranchise,
    figureProductLine,
    figureReleaseDate,
    figureLicenseStatus,
    figureHeight,
    figureWidth,
    figureWeight,
    figureBase,
    figureMaterials,
    figurePaintTechnique,
    figureArticulation,
    figureInterchangeableParts,
    figureAccessories,
    figureCertificate,
    figureAgeRecommendation,
    figureBoxDimensions,
    figureShippingWeight,
    collectibleCategory,
    tcgProductName,
    tcgFranchise,
    tcgGameSystem,
    tcgLanguage,
    tcgSetExpansion,
    tcgReleaseYear,
    tcgCardNumber,
    tcgRarity,
    tcgFinishVariant,
    tcgGradingCondition,
    tcgWearDetails,
    tcgCertification,
    tcgSerial,
    tcgProductType,
    tcgItemQuantity,
    tcgIncludesProtection,
    selectedBundleItems,
    customSpecifications,
  ]);

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});

    const genresList = shouldShowGenres
      ? genresInput
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
      : [];

    const resolvedAgeRating =
      ageRating === "CUSTOM" ? customAgeRating.trim() : ageRating.trim();

    const payload: Record<string, unknown> = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      type,
      customCategoryLabel:
        isCustomOrSpecializedCategory || customCategoryLabel.trim()
          ? (customCategoryLabel.trim() ||
              (type === "HARDWARE"
                ? "Hardware & Componentes"
                : type === "CONSOLE"
                ? "Consolas"
                : type === "GAMING_ACCESSORY"
                ? "Accesorio Gaming"
                : type === "APPAREL"
                ? "Ropa & Estilo"
                : type === "BOOK"
                ? "Manga / Libros"
                : type === "MERCH"
                ? "Merchandising"
                : type === "AUDIO"
                ? "Audio / OST"
                : undefined))
          : undefined,
      price: Number(price),
      originalPrice:
        originalPrice && Number(originalPrice) > 0 ? Number(originalPrice) : undefined,
      costPrice: Number(costPrice),
      stockAvailable: Number(stockAvailable),
      isPreOrder: Boolean(isPreOrder),
      preOrderState: isPreOrder ? preOrderState : undefined,
      images: images.length > 0 ? images : undefined,
      imageUrl: images.length > 0 ? images[0] : undefined,
      trailerUrl: trailerUrl.trim() || undefined,
      ageRating: resolvedAgeRating || undefined,
      genres: genresList.length > 0 ? genresList : undefined,
      contentGallery: contentGallery.length > 0 ? contentGallery : undefined,
    };

    if (type === "VIDEO_GAME") {
      payload.gameMetadata = {
        gameType,
        platform: gameType === "PC" ? "PC" : gamePlatform,
        edition: gameEdition,
        isDigital: Boolean(gameIsDigital),
        publisher: gamePublisher || "Publisher Oficial",
        audioLanguages: gameAudioLanguages || undefined,
        subtitleLanguages: gameSubtitleLanguages || undefined,
        players: gameModes || undefined,
        fileSize: gameType === "CONSOLE" ? (gameFileSize || undefined) : undefined,
        resolution: gameType === "CONSOLE" ? (gameDisplayModes || undefined) : undefined,
        title: gameTitle || name || undefined,
        developer: gameDeveloper || undefined,
        releaseYear: gameReleaseYear || undefined,
        genre: gameGenre || undefined,
        gameModes: gameModes || undefined,
        gameEngine: gameEngine || undefined,
        supportedPlatforms: gameSupportedPlatforms || undefined,
        ageRating: gameAgeRating || undefined,
        displayModes: gameType === "CONSOLE" ? (gameDisplayModes || undefined) : undefined,
        xboxSeriesSOptimization: gameType === "CONSOLE" ? (gameXboxSeriesSOptimization || undefined) : undefined,
        hardwareFeatures: gameType === "CONSOLE" ? (gameHardwareFeatures || undefined) : undefined,
        pcOs: gameType === "PC" ? (gamePcOs || undefined) : undefined,
        pcProcessor: gameType === "PC" ? (gamePcProcessor || undefined) : undefined,
        pcRam: gameType === "PC" ? (gamePcRam || undefined) : undefined,
        pcGpu: gameType === "PC" ? (gamePcGpu || undefined) : undefined,
        pcStorage: gameType === "PC" ? (gamePcStorage || undefined) : undefined,
      };
    } else if (type === "FIGURE") {
      payload.figureMetadata = {
        scale: figureScale,
        manufacturer: figureManufacturer,
        estimatedArrivalDate: figureArrivalDate,
        allowsPartialDeposit: isPreOrder,
        minimumDepositPercent: Number(figureDepositPercent),
        material: figureMaterial || undefined,
        dimensions: figureDimensions || undefined,
        sculptor: figureSculptor || undefined,
        boxCondition: figureBoxCondition || undefined,
        productName: figureProductName || name.trim() || undefined,
        franchise: figureFranchise || undefined,
        productLine: figureProductLine || undefined,
        releaseDate: figureReleaseDate || figureArrivalDate || undefined,
        licenseStatus: figureLicenseStatus || undefined,
        height: figureHeight || undefined,
        width: figureWidth || undefined,
        weight: figureWeight || undefined,
        base: figureBase || undefined,
        materials: figureMaterials || figureMaterial || undefined,
        paintTechnique: figurePaintTechnique || undefined,
        articulation: figureArticulation || undefined,
        interchangeableParts: figureInterchangeableParts || undefined,
        accessories: figureAccessories || undefined,
        certificate: figureCertificate || undefined,
        ageRecommendation: figureAgeRecommendation || undefined,
        boxDimensions: figureBoxDimensions || undefined,
        shippingWeight: figureShippingWeight || undefined,
      };
    } else if (type === "COLLECTIBLE") {
      const canonicalCondition = mapToCanonicalCollectibleCondition(tcgGradingCondition);
      const canonicalAuth = mapToCanonicalAuthenticator(tcgCertification);

      payload.collectibleMetadata = {
        category: collectibleCategory || "TCG",
        condition: canonicalCondition,
        authenticationBody: canonicalAuth,
        cardLanguage: tcgLanguage || undefined,
        serialNumber: tcgSerial || undefined,
        gradeScore: canonicalCondition === "GEM_MINT_10" ? "10" : canonicalCondition === "MINT_9" ? "9" : "8",
        slabType: tcgProductType || undefined,

        // 1. Información General del Producto
        productName: (tcgProductName || name).trim(),
        franchise: tcgFranchise.trim(),
        gameSystem: tcgGameSystem.trim(),
        language: tcgLanguage.trim(),

        // 2. Detalles de Edición y Rareza
        setExpansion: tcgSetExpansion.trim(),
        releaseYear: tcgReleaseYear.trim(),
        cardNumber: tcgCardNumber.trim(),
        rarity: tcgRarity.trim(),
        finishVariant: tcgFinishVariant.trim(),

        // 3. Estado de Conservación (Condición)
        gradingCondition: tcgGradingCondition,
        wearDetails: tcgWearDetails.trim(),
        certification: tcgCertification,

        // 4. Presentación y Empaque
        productType: tcgProductType.trim(),
        itemQuantity: tcgItemQuantity.trim(),
        includesProtection: tcgIncludesProtection.trim(),
      };
    } else if (type === "BUNDLE") {
      payload.bundleComponents = selectedBundleItems;
    } else if (isCustomOrSpecializedCategory) {
      payload.customSpecifications = customSpecifications;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.issues) {
          setFieldErrors(data.issues);
        }
        setErrorMsg(data.error || "Ocurrió un error al registrar el producto");
      } else {
        const prod = data.data.product;
        // Invalidate client catalog cache so new product appears immediately across site
        catalogClient.invalidateCache();

        // Background client sync to Firestore if not confirmed by server
        if (!data.data?.syncedToFirestore) {
          saveProductToFirestoreClient(prod).catch((e) =>
            console.warn("[Client Firestore Sync]", e)
          );
        }
        setCreatedProduct(prod);
        // Do not force scroll to top: floating toast notifies admin right where they are!
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión con el servidor";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#FF6B35] uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            Panel de Administración • E-Commerce Especializado
          </div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
            Crear Nuevo Producto en Catálogo
          </h1>
          <p className="text-sm text-[#555555]">
            Configura preventas con pie porcentual, cartas TCG graduadas con cápsula, videojuegos físicos/digitales o nuevas categorías personalizadas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F7F7F5] text-[#1A1A1A] text-xs font-semibold border border-[#E5E5E5] transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF6B35]" /> Volver a Inventario
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-semibold transition shadow-sm"
          >
            Ver Tienda en Vivo
          </Link>
        </div>
      </div>

      {/* Top Success Banner (if user happens to be near top) */}
      {createdProduct && (
        <div className="p-6 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-[#F9F9F9] space-y-4 animate-in fade-in-50 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-emerald-200">
                  ¡Producto creado y activado en el catálogo!
                </h3>
                <p className="text-xs text-emerald-300/80">
                  El SKU <span className="font-mono font-bold text-white">{createdProduct.sku}</span> está disponible para reserva inmediata, verificación de stock y cálculo de márgenes en CLP.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreatedProduct(null)}
              className="text-xs text-emerald-400 hover:underline"
            >
              Cerrar aviso
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/product/${createdProduct.sku.toLowerCase()}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6E42] hover:bg-[#ff5421] text-[#F9F9F9] text-xs font-bold transition shadow-md"
            >
              Ver Producto en la Tienda <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004E72] hover:bg-[#004E72]/80 text-[#F9F9F9] text-xs font-semibold transition"
            >
              Explorar Catálogo Completo
            </Link>
            <button
              onClick={() => {
                setCreatedProduct(null);
                setSku(`PROD-${Date.now().toString().slice(-4)}`);
                setName("");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#092634] hover:bg-[#004E72]/40 text-[#F9F9F9] text-xs font-semibold border border-[#004E72]/60 transition"
            >
              <Plus className="w-4 h-4" /> Registrar Otro Producto
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: The Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{errorMsg}</p>
                {Object.keys(fieldErrors).length > 0 && (
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-red-300">
                    {Object.entries(fieldErrors).map(([field, errs]) => (
                      <li key={field}>
                        <span className="font-mono font-semibold">{field}</span>: {errs.join(", ")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Section 1: Type Selector */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-md">
            <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
              1. Tipo de Producto Especializado
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { id: "FIGURE", label: "Figura", icon: Clock },
                { id: "VIDEO_GAME", label: "Videojuego", icon: Gamepad2 },
                { id: "COLLECTIBLE", label: "Coleccionable / TCG", icon: Trophy },
                { id: "HARDWARE", label: "Hardware / PC", icon: Cpu },
                { id: "CONSOLE", label: "Consola", icon: Tv },
                { id: "BUNDLE", label: "Bundle Lote", icon: Layers },
                { id: "OTHER", label: "+ Otra Categoría", icon: Tag },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const newType = item.id as ProductType;
                      setType(newType);
                      if (newType === "FIGURE") setIsPreOrder(true);
                      else setIsPreOrder(false);

                      if (newType === "HARDWARE") {
                        if (!customCategoryLabel) setCustomCategoryLabel("Hardware & Componentes");
                      } else if (newType === "CONSOLE") {
                        if (!customCategoryLabel) setCustomCategoryLabel("Consolas");
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                      isSelected
                        ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow-md shadow-[#004E72]/40 ring-1 ring-[#FF6E42]"
                        : "bg-[#092634]/60 border-[#004E72]/30 text-[#9bb5c2] hover:bg-[#004E72]/30 hover:text-[#F9F9F9]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? "text-[#FF6E42]" : "text-[#9bb5c2]"}`} />
                    <span className="text-xs font-bold leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Category Subpanel (when specialized category or OTHER is active) */}
            {isCustomOrSpecializedCategory && (
              <div className="p-4 rounded-xl bg-[#004E72]/20 border border-[#FF6E42]/50 space-y-3 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#F9F9F9] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#FF6E42]" />
                    Nombre de la Categoría Personalizada *
                  </label>
                  <span className="text-[10px] text-[#9bb5c2]">Selecciona una plantilla o escribe una nueva</span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {CUSTOM_CATEGORY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCustomCategoryLabel(preset);
                        if (preset === "Hardware & Componentes") setType("HARDWARE" as ProductType);
                        else if (preset === "Consolas") setType("CONSOLE" as ProductType);
                        else if (preset === "Accesorio Gaming") setType("GAMING_ACCESSORY" as ProductType);
                        else if (preset === "Ropa & Estilo") setType("APPAREL" as ProductType);
                        else if (preset === "Manga / Artbook") setType("BOOK" as ProductType);
                        else if (preset === "Merchandising") setType("MERCH" as ProductType);
                        else if (preset === "Audio / OST") setType("AUDIO" as ProductType);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                        customCategoryLabel === preset
                          ? "bg-[#FF6E42] text-[#092634] border-[#FF6E42]"
                          : "bg-[#092634] text-[#9bb5c2] border-[#004E72]/60 hover:text-[#F9F9F9] hover:border-[#FF6E42]/50"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required={isCustomOrSpecializedCategory}
                  value={customCategoryLabel}
                  onChange={(e) => setCustomCategoryLabel(e.target.value)}
                  placeholder="Ej: Hardware & Componentes, Consolas, Ropa Gamer..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#092634] border border-[#004E72]/80 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                />
              </div>
            )}
          </div>

          {/* Section 2: General Information */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
                2. Información General
              </h2>

              {/* Contenedor de Botones de IA: Identificación por Imagen y por Nombre */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Input oculto para subir la imagen del producto */}
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelectedForAI}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  aria-label="Seleccionar imagen de producto para autocompletar con IA"
                />

                {/* Botón 1: Auto-completar con Imagen (Nuevo) */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isAutoFillingWithImage || isAutoFilling}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#009EE3] to-[#0077B6] hover:from-[#00A8F3] hover:to-[#0088CC] text-white font-black text-xs uppercase tracking-wider shadow hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-[#009EE3]/30"
                  title="Sube una fotografía o imagen del producto: la IA identificará qué producto es y rellenará automáticamente la ficha completa"
                >
                  {isAutoFillingWithImage ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analizando Imagen...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-white" />
                      <span>Auto-completar con Imagen</span>
                    </>
                  )}
                </button>

                {/* Botón 2: Auto-completar con IA por Nombre (Actual) */}
                <button
                  type="button"
                  onClick={handleAutoFillWithAI}
                  disabled={isAutoFilling || isAutoFillingWithImage || !name.trim()}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6E42] to-[#ff5421] text-[#092634] font-black text-xs uppercase tracking-wider shadow hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Genera automáticamente todos los datos del producto (categoría, SKU, precios, ficha técnica y descripción) a partir del Nombre"
                >
                  {isAutoFilling ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#092634] border-t-transparent rounded-full animate-spin" />
                      <span>Generando con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#092634]" />
                      <span>Auto-completar con IA</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {autoFillSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-[#004E72]/30 border border-emerald-500/50 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in-50 shadow-md">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{autoFillSuccessMsg}</span>
                </div>
                {aiEngineUsed === "GEMINI_AI" ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-400/50 text-blue-200 font-mono text-[11px] font-bold shrink-0 shadow-inner">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span>Google Gemini 1.5 Flash Oficial</span>
                  </div>
                ) : (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-medium shrink-0"
                    title={aiEngineErrorDetail || "Motor Heurístico Local"}
                  >
                    <span>
                      {aiEngineErrorDetail
                        ? `Motor Heurístico (${aiEngineErrorDetail})`
                        : "Motor Heurístico Local (Sin Gemini API Key activa)"}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1 space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-xs font-medium text-[#9bb5c2] flex items-center gap-1">
                    SKU Único *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    disabled={isGeneratingSku || !name.trim()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#FF6E42] to-[#ff5421] text-[#092634] font-black text-[10px] uppercase tracking-wider shadow hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Analiza la base de datos en tiempo real y genera un SKU único sin colisiones"
                  >
                    {isGeneratingSku ? (
                      <>
                        <div className="w-2.5 h-2.5 border-2 border-[#092634] border-t-transparent rounded-full animate-spin" />
                        <span>Analizando BD...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        <span>Generar SKU</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="FIG-MAKIMA-17"
                    className={`w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[#004E72]/20 border text-[#F9F9F9] font-mono text-xs focus:outline-none transition ${
                      skuValidation.isAvailable === false
                        ? "border-red-500/80 bg-red-950/20 text-red-200 focus:border-red-400"
                        : skuValidation.isAvailable === true
                        ? "border-emerald-500/80 bg-emerald-950/20 text-emerald-200 focus:border-emerald-400"
                        : "border-[#004E72]/60 focus:border-[#FF6E42]"
                    }`}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {skuValidation.isChecking ? (
                      <div className="w-3.5 h-3.5 border-2 border-[#9bb5c2] border-t-transparent rounded-full animate-spin" />
                    ) : skuValidation.isAvailable === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : skuValidation.isAvailable === false ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : null}
                  </div>
                </div>

                {/* SKU Live Database Feedback Message */}
                {skuValidation.message && (
                  <p
                    className={`text-[10px] font-medium flex items-center gap-1 ${
                      skuValidation.isAvailable === false
                        ? "text-red-400"
                        : skuValidation.isAvailable === true
                        ? "text-emerald-400"
                        : "text-[#9bb5c2]"
                    }`}
                  >
                    {skuValidation.isAvailable === true && <ShieldCheck className="w-3 h-3 shrink-0" />}
                    {skuValidation.isAvailable === false && <AlertCircle className="w-3 h-3 shrink-0" />}
                    <span>{skuValidation.message}</span>
                  </p>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-[#9bb5c2]">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Makima 1/7 Scale PVC Figure"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-medium text-[#9bb5c2]">Descripción Técnica y Comercial *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre materiales, escala, licencias, empaque y condiciones de despacho..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42] leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Multimedia, Trailer Oficial & Clasificación Mundial */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-md">
            <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
              3. Trailer de YouTube, Clasificación & Etiquetas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-[#9bb5c2] flex items-center justify-between">
                  <span>Enlace del Trailer Oficial (YouTube)</span>
                  <span className="text-[10px] text-[#FF6E42]">Soporta watch?v=, youtu.be/ y Shorts</span>
                </label>
                <input
                  type="url"
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=xoxCHe80A-w"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                />
                <p className="text-[10px] text-[#9bb5c2]">
                  Se reproducirá integrado directamente en la ficha del producto en proporción 16:9 como en las tiendas oficiales.
                </p>
              </div>

              {/* Worldwide Age Rating Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9bb5c2]">Clasificación de Edad / Sello</label>
                <select
                  value={ageRating}
                  onChange={(e) => setAgeRating(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42] cursor-pointer"
                >
                  <optgroup label="🇨🇱 Chile (Ley 19.846)">
                    {WORLDWIDE_AGE_RATINGS.filter((r) => r.system === "CHILE").map((r) => (
                      <option key={r.value} value={r.value} className="bg-[#092634] text-white">
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🇺🇸 ESRB (América)">
                    {WORLDWIDE_AGE_RATINGS.filter((r) => r.system === "ESRB").map((r) => (
                      <option key={r.value} value={r.value} className="bg-[#092634] text-white">
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🇪🇺 PEGI (Europa)">
                    {WORLDWIDE_AGE_RATINGS.filter((r) => r.system === "PEGI").map((r) => (
                      <option key={r.value} value={r.value} className="bg-[#092634] text-white">
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🇯🇵 CERO (Japón)">
                    {WORLDWIDE_AGE_RATINGS.filter((r) => r.system === "CERO").map((r) => (
                      <option key={r.value} value={r.value} className="bg-[#092634] text-white">
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🇩🇪 USK (Alemania)">
                    {WORLDWIDE_AGE_RATINGS.filter((r) => r.system === "USK").map((r) => (
                      <option key={r.value} value={r.value} className="bg-[#092634] text-white">
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🌐 General & Exento">
                    {WORLDWIDE_AGE_RATINGS.filter((r) => r.system === "OTHER").map((r) => (
                      <option key={r.value} value={r.value} className="bg-[#092634] text-white">
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {ageRating === "CUSTOM" && (
                  <input
                    type="text"
                    value={customAgeRating}
                    onChange={(e) => setCustomAgeRating(e.target.value)}
                    placeholder="Escribe el sello (ej: 16+, Coleccionismo Adulto)"
                    className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-[#004E72]/30 border border-[#FF6E42]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                )}
                <p className="text-[10px] text-[#9bb5c2]">
                  Muestra la placa regulatoria oficial en la ficha del producto.
                </p>
              </div>

              {shouldShowGenres && (
                <div className="sm:col-span-3 space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-medium text-[#9bb5c2]">Géneros & Categorías (separados por coma)</label>
                  <input
                    type="text"
                    value={genresInput}
                    onChange={(e) => setGenresInput(e.target.value)}
                    placeholder="Acción, RPG, Mundo Abierto, Shonen"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Images & Cover */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
                4. Galería de Fotos & Portada
              </h2>
              <span className="text-xs text-[#9bb5c2] font-mono">
                {images.length} imagen{images.length !== 1 ? "es" : ""} cargada{images.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Input by URL and File Upload */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9bb5c2]" />
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2.5 rounded-xl bg-[#004E72] hover:bg-[#004E72]/80 text-[#F9F9F9] text-xs font-semibold transition shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Agregar URL
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#004E72]/30 hover:bg-[#004E72]/50 border border-[#004E72]/60 text-[#F9F9F9] text-xs font-semibold transition hover:border-[#FF6E42]/50">
                  <UploadCloud className="w-4 h-4 text-[#FF6E42]" />
                  <span>Subir desde mi equipo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setDriveTarget("MAIN_IMAGES");
                    setIsDriveModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F394C]/60 hover:bg-[#0F394C] border border-cyan-500/40 hover:border-cyan-400 text-[#F9F9F9] text-xs font-semibold transition shadow-sm"
                >
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Google Drive</span>
                </button>

                <span className="text-[11px] text-[#9bb5c2]">
                  Formatos JPG, PNG, WebP o enlaces de Drive. La primera foto será la portada principal del catálogo.
                </span>
              </div>
            </div>

            {/* Thumbnails Grid */}
            {images.length > 0 ? (
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative group rounded-xl overflow-hidden border bg-[#004E72]/10 transition ${
                        idx === 0 ? "border-[#FF6E42] ring-2 ring-[#FF6E42]/40" : "border-[#004E72]/40"
                      }`}
                    >
                      <div className="aspect-square w-full">
                        <img
                          src={img}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>

                      {/* Cover Badge */}
                      {idx === 0 ? (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#FF6E42] text-[#F9F9F9] text-[9px] font-black uppercase tracking-wider shadow">
                          Portada
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#092634]/90 hover:bg-[#FF6E42] text-[#F9F9F9] text-[9px] font-bold opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          Hacer Portada
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        title="Eliminar imagen"
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-600/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#004E72]/10 border border-[#004E72]/30 text-center text-xs text-[#9bb5c2]">
                No hay imágenes asignadas. El producto mostrará una ilustración estilizada de acuerdo a su categoría.
              </div>
            )}
          </div>

          {/* Section 5: Financials & Stock (CLP) - Responsive and perfectly aligned */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-md">
            <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
              5. Precios en Moneda Chilena (CLP) & Stock
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              {/* Card 1: Precio Venta */}
              <div className="p-3.5 rounded-xl bg-[#004E72]/15 border border-[#004E72]/50 flex flex-col justify-between space-y-2">
                <div className="h-6 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#F9F9F9]">
                    Precio Venta *
                  </label>
                  <span className="text-[10px] text-[#FF6E42] font-semibold">Oferta CLP</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9bb5c2] font-mono">$</span>
                  <input
                    type="number"
                    required
                    min={100}
                    step={100}
                    value={price}
                    onChange={(e) => setPrice(Math.round(Number(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] font-mono text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>
                <div className="h-5 flex items-center text-[10px] text-[#9bb5c2] font-mono">
                  {formatCLP(price)}
                </div>
              </div>

              {/* Card 2: Precio Normal / Lista */}
              <div className="p-3.5 rounded-xl bg-[#004E72]/15 border border-[#004E72]/50 flex flex-col justify-between space-y-2">
                <div className="h-6 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#F9F9F9]">
                    Precio Normal
                  </label>
                  {originalPrice && originalPrice > price ? (
                    <span className="text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-500/40 px-1.5 py-0.5 rounded">
                      -{Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#9bb5c2]">Tachado</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9bb5c2] font-mono">$</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={originalPrice || ""}
                    onChange={(e) =>
                      setOriginalPrice(e.target.value ? Math.round(Number(e.target.value)) : undefined)
                    }
                    placeholder="Ej. 69900"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] font-mono text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>
                <div className="h-5 flex items-center text-[10px] text-[#9bb5c2] font-mono">
                  {originalPrice ? `Tachado: ${formatCLP(originalPrice)}` : "Opcional"}
                </div>
              </div>

              {/* Card 3: Costo Unitario */}
              <div className="p-3.5 rounded-xl bg-[#004E72]/15 border border-[#004E72]/50 flex flex-col justify-between space-y-2">
                <div className="h-6 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#F9F9F9]">
                    Costo Unitario *
                  </label>
                  <span className="text-[10px] text-[#9bb5c2]">Adquisición</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9bb5c2] font-mono">$</span>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={costPrice}
                    onChange={(e) => setCostPrice(Math.round(Number(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] font-mono text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>
                <div className="h-5 flex items-center text-[10px] text-[#9bb5c2] font-mono">
                  {formatCLP(costPrice)}
                </div>
              </div>

              {/* Card 4: Stock Inicial */}
              <div className="p-3.5 rounded-xl bg-[#004E72]/15 border border-[#004E72]/50 flex flex-col justify-between space-y-2">
                <div className="h-6 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#F9F9F9]">
                    Stock Disponible *
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">Unidades</span>
                </div>
                <input
                  type="number"
                  required
                  min={0}
                  value={stockAvailable}
                  onChange={(e) => setStockAvailable(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] font-mono text-xs focus:outline-none focus:border-[#FF6E42]"
                />
                <div className="h-5 flex items-center text-[10px] text-[#9bb5c2]">
                  {type === "BUNDLE" ? "Sincronizado con componentes" : "Unidades físicas almacén"}
                </div>
              </div>
            </div>

            {/* Financial Metrics Strip */}
            <div className="p-3.5 rounded-xl bg-[#004E72]/30 border border-[#004E72]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-[#9bb5c2]">Margen Bruto Proyectado:</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#F9F9F9] font-bold">
                  {formatCLP(grossProfitCLP)} de ganancia
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#FF6E42]/20 text-[#FF6E42] font-bold font-mono">
                  {marginPercent}% margen
                </span>
              </div>
            </div>
          </div>

          {/* Section 6: Specific Field Sets by Type */}
          {type === "FIGURE" && (
            <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-6 shadow-md animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#004E72]/40 pb-4">
                <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
                  6. Ficha Técnica de Figura Japonesa & Preventa
                </h2>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#FF6E42]/10 text-[#FF6E42] border border-[#FF6E42]/30 font-medium">
                  5 Categorías Oficiales
                </span>
              </div>

              {/* Categoría 1: Información General del Producto */}
              <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F9F9F9]">
                  <Info className="w-4 h-4 text-[#FF6E42]" />
                  <span>1. Información General del Producto</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Nombre Oficial de la Figura</label>
                    <input
                      type="text"
                      value={figureProductName}
                      onChange={(e) => setFigureProductName(e.target.value)}
                      placeholder="Ej: Hatsune Miku - Cantarella Ver. 1/7 Scale Figure"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Franquicia / Anime / Manga</label>
                    <input
                      type="text"
                      value={figureFranchise}
                      onChange={(e) => setFigureFranchise(e.target.value)}
                      placeholder="Ej: Vocaloid / Fate Grand Order / Spy x Family"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Escala de la Figura</label>
                    <select
                      value={figureScale}
                      onChange={(e) => setFigureScale(e.target.value as FigureScale)}
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    >
                      <option value="SCALE_1_7">Escala 1/7 (Estándar Coleccionista)</option>
                      <option value="SCALE_1_4">Escala 1/4 (Gran Formato Premium)</option>
                      <option value="SCALE_1_6">Escala 1/6</option>
                      <option value="SCALE_1_8">Escala 1/8</option>
                      <option value="SCALE_1_12">Escala 1/12</option>
                      <option value="NON_SCALE">Non-Scale (Sin Escala / Myth Cloth / Prize)</option>
                      <option value="NENDOROID">Nendoroid (Chibi Articulado)</option>
                      <option value="POP_UP_PARADE">Pop Up Parade</option>
                      <option value="ACTION_FIGURE">Figura de Acción Articulada</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Fabricante Oficial</label>
                    <select
                      value={figureManufacturer}
                      onChange={(e) => setFigureManufacturer(e.target.value as FigureManufacturer)}
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    >
                      <option value="GOOD_SMILE_COMPANY">Good Smile Company</option>
                      <option value="BANDAI_SPIRITS">Bandai Spirits / Tamashii Nations</option>
                      <option value="BANPRESTO">Banpresto</option>
                      <option value="KOTOBUKIYA">Kotobukiya</option>
                      <option value="ALTER">Alter</option>
                      <option value="MEGAHOUSE">Megahouse</option>
                      <option value="MAX_FACTORY">Max Factory</option>
                      <option value="FREEING">FREEing</option>
                      <option value="ANIPLEX">Aniplex</option>
                      <option value="SEGA">Sega</option>
                      <option value="TAITO">Taito</option>
                      <option value="FURYU">FuRyu</option>
                      <option value="OTHER">Otro Fabricante</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Línea de Producto</label>
                    <input
                      type="text"
                      value={figureProductLine}
                      onChange={(e) => setFigureProductLine(e.target.value)}
                      placeholder="Ej: Pop Up Parade / F:NEX / S.H.Figuarts"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Escultor / Diseñador Original</label>
                    <input
                      type="text"
                      value={figureSculptor}
                      onChange={(e) => setFigureSculptor(e.target.value)}
                      placeholder="Ej: Design COCO / eStream / Good Smile Arts"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Fecha Estimada de Llegada</label>
                    <input
                      type="text"
                      value={figureArrivalDate}
                      onChange={(e) => setFigureArrivalDate(e.target.value)}
                      placeholder="Ej: Diciembre 2026"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Fecha Lanzamiento Japón</label>
                    <input
                      type="text"
                      value={figureReleaseDate}
                      onChange={(e) => setFigureReleaseDate(e.target.value)}
                      placeholder="Ej: Noviembre 2026"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Estado de Licencia</label>
                    <input
                      type="text"
                      value={figureLicenseStatus}
                      onChange={(e) => setFigureLicenseStatus(e.target.value)}
                      placeholder="Ej: 100% Original con Licencia Oficial"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>
                </div>
              </div>

              {/* Categoría 2: Especificaciones Físicas y Dimensiones */}
              <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F9F9F9]">
                  <Ruler className="w-4 h-4 text-[#FF6E42]" />
                  <span>2. Especificaciones Físicas y Dimensiones</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Altura</label>
                    <input
                      type="text"
                      value={figureHeight}
                      onChange={(e) => setFigureHeight(e.target.value)}
                      placeholder="Ej: 24 cm aprox."
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Ancho / Profundidad</label>
                    <input
                      type="text"
                      value={figureWidth}
                      onChange={(e) => setFigureWidth(e.target.value)}
                      placeholder="Ej: 18 cm x 15 cm"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Peso Neto de la Figura</label>
                    <input
                      type="text"
                      value={figureWeight}
                      onChange={(e) => setFigureWeight(e.target.value)}
                      placeholder="Ej: 650 g"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Dimensiones Totales</label>
                    <input
                      type="text"
                      value={figureDimensions}
                      onChange={(e) => setFigureDimensions(e.target.value)}
                      placeholder="Ej: 24 x 18 x 15 cm"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Base y Soporte</label>
                    <input
                      type="text"
                      value={figureBase}
                      onChange={(e) => setFigureBase(e.target.value)}
                      placeholder="Ej: Base temática dedicada incluida"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>
                </div>
              </div>

              {/* Categoría 3: Materiales y Fabricación */}
              <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F9F9F9]">
                  <Paintbrush className="w-4 h-4 text-[#FF6E42]" />
                  <span>3. Materiales y Fabricación</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Materiales Principales</label>
                    <input
                      type="text"
                      value={figureMaterials || figureMaterial}
                      onChange={(e) => {
                        setFigureMaterials(e.target.value);
                        setFigureMaterial(e.target.value);
                      }}
                      placeholder="Ej: PVC, ABS & Polystone"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Técnica de Pintura y Acabado</label>
                    <input
                      type="text"
                      value={figurePaintTechnique}
                      onChange={(e) => setFigurePaintTechnique(e.target.value)}
                      placeholder="Ej: Pintura artesanal de alta precisión con sombreado y barniz mate"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Tipo de Articulación / Estatua</label>
                    <input
                      type="text"
                      value={figureArticulation}
                      onChange={(e) => setFigureArticulation(e.target.value)}
                      placeholder="Ej: Estatua fija estática de alta fidelidad"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>
                </div>
              </div>

              {/* Categoría 4: Contenido de la Caja y Accesorios */}
              <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F9F9F9]">
                  <Box className="w-4 h-4 text-[#FF6E42]" />
                  <span>4. Contenido de la Caja y Accesorios</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Piezas Intercambiables</label>
                    <input
                      type="text"
                      value={figureInterchangeableParts}
                      onChange={(e) => setFigureInterchangeableParts(e.target.value)}
                      placeholder="Ej: 2 rostros con expresiones, manos opcionales"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Accesorios Incluidos</label>
                    <input
                      type="text"
                      value={figureAccessories}
                      onChange={(e) => setFigureAccessories(e.target.value)}
                      placeholder="Ej: Efectos de energía traslúcidos, arma y peana"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Certificado y Sellos</label>
                    <input
                      type="text"
                      value={figureCertificate}
                      onChange={(e) => setFigureCertificate(e.target.value)}
                      placeholder="Ej: Sello holográfico de autenticidad en caja"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>
                </div>
              </div>

              {/* Categoría 5: Seguridad, Empaque y Logística */}
              <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F9F9F9]">
                  <ShieldCheck className="w-4 h-4 text-[#FF6E42]" />
                  <span>5. Seguridad, Empaque y Logística</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Edad Recomendada</label>
                    <input
                      type="text"
                      value={figureAgeRecommendation}
                      onChange={(e) => setFigureAgeRecommendation(e.target.value)}
                      placeholder="Ej: +15 años (Coleccionismo adulto)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Estado del Empaque</label>
                    <input
                      type="text"
                      value={figureBoxCondition}
                      onChange={(e) => setFigureBoxCondition(e.target.value)}
                      placeholder="Ej: Mint in Box (Sellada de fábrica)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Dimensiones de la Caja</label>
                    <input
                      type="text"
                      value={figureBoxDimensions}
                      onChange={(e) => setFigureBoxDimensions(e.target.value)}
                      placeholder="Ej: 30 x 22 x 18 cm"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Peso de Envío</label>
                    <input
                      type="text"
                      value={figureShippingWeight}
                      onChange={(e) => setFigureShippingWeight(e.target.value)}
                      placeholder="Ej: 1.1 kg aprox."
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>
                </div>
              </div>

              {/* Porcentaje de Pie Mínimo */}
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-medium text-[#9bb5c2]">Porcentaje de Pie Mínimo Preventa</label>
                <select
                  value={figureDepositPercent}
                  onChange={(e) => setFigureDepositPercent(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                >
                  <option value={0.2}>20% del valor total (Recomendado)</option>
                  <option value={0.3}>30% del valor total</option>
                  <option value={0.5}>50% del valor total</option>
                  <option value={1.0}>100% (Pago Completo Anticipado)</option>
                </select>
              </div>

              {/* Pre-order Live Math */}
              <div className="p-4 rounded-xl bg-[#004E72]/20 border border-[#FF6E42]/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F9F9F9] font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#FF6E42]" /> Desglose Financiero de Preventa
                  </span>
                  <span className="text-[#FF6E42] font-mono font-bold">
                    Pie {Math.round(figureDepositPercent * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[#9bb5c2] block">El cliente paga hoy:</span>
                    <span className="text-[#F9F9F9] font-bold font-mono text-sm">
                      {formatCLP(depositCLP)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9bb5c2] block">Saldo al llegar a bodega:</span>
                    <span className="text-[#9bb5c2] font-bold font-mono text-sm">
                      {formatCLP(remainingCLP)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === "VIDEO_GAME" && (
            <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-5 shadow-md animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2 border-b border-[#004E72]/40 pb-3">
                <Gamepad2 className="w-4 h-4 text-[#FF6E42]" />
                6. Ficha de Especificaciones Técnicas del Videojuego
              </h2>

              {/* Sub-selector Tipo de Videojuego: Consola vs PC */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#F9F9F9] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#FF6E42]" />
                  Tipo de Videojuego *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setGameType("CONSOLE");
                      if (gamePlatform === "PC") setGamePlatform("PS5");
                    }}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
                      gameType === "CONSOLE"
                        ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow-md ring-1 ring-[#FF6E42]"
                        : "bg-[#004E72]/15 border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/30 hover:text-white"
                    }`}
                  >
                    <Tv className={`w-5 h-5 shrink-0 ${gameType === "CONSOLE" ? "text-[#FF6E42]" : "text-[#9bb5c2]"}`} />
                    <div>
                      <div className="text-xs font-bold">Videojuego de Consola</div>
                      <div className="text-[10px] opacity-80">PlayStation 5, Xbox Series X|S, Nintendo Switch</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameType("PC");
                      setGamePlatform("PC");
                    }}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
                      gameType === "PC"
                        ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow-md ring-1 ring-[#FF6E42]"
                        : "bg-[#004E72]/15 border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/30 hover:text-white"
                    }`}
                  >
                    <Monitor className={`w-5 h-5 shrink-0 ${gameType === "PC" ? "text-[#FF6E42]" : "text-[#9bb5c2]"}`} />
                    <div>
                      <div className="text-xs font-bold">Videojuego de PC</div>
                      <div className="text-[10px] opacity-80">Steam, Epic Games Store, GOG, PC Gaming</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Formato de Entrega: Físico vs Digital */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-[#F9F9F9] block">
                  Formato de Entrega del Videojuego *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGameIsDigital(false)}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
                      !gameIsDigital
                        ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow-md ring-1 ring-[#FF6E42]"
                        : "bg-[#004E72]/15 border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/30 hover:text-white"
                    }`}
                  >
                    <Disc className={`w-5 h-5 shrink-0 ${!gameIsDigital ? "text-[#FF6E42]" : "text-[#9bb5c2]"}`} />
                    <div>
                      <div className="text-xs font-bold">Formato Físico (Caja & Disco/Cartucho)</div>
                      <div className="text-[10px] opacity-80">Incluye caja oficial, disco Blu-ray o cartucho de colección.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameIsDigital(true)}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
                      gameIsDigital
                        ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow-md ring-1 ring-[#FF6E42]"
                        : "bg-[#004E72]/15 border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/30 hover:text-white"
                    }`}
                  >
                    <Download className={`w-5 h-5 shrink-0 ${gameIsDigital ? "text-[#FF6E42]" : "text-[#9bb5c2]"}`} />
                    <div>
                      <div className="text-xs font-bold">Formato Digital (Código Canjeable / Key)</div>
                      <div className="text-[10px] opacity-80">Entrega de licencia descargable para PS Store, eShop, Steam o Xbox Live.</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* SUB-TEMPLATE 1: VIDEOJUEGO DE CONSOLA */}
              {gameType === "CONSOLE" && (
                <div className="space-y-5 pt-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-3 py-2 rounded-xl">
                    <Tv className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Especificaciones Técnicas para Videojuegos de Consola</span>
                  </div>

                  {/* Grupo 1: Información General */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                      1. Información General
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                        <label className="text-xs text-[#9bb5c2]">Título del Videojuego *</label>
                        <input
                          type="text"
                          value={gameTitle}
                          onChange={(e) => setGameTitle(e.target.value)}
                          placeholder="ej: Final Fantasy VII Rebirth / GTA VI"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Desarrolladora *</label>
                        <input
                          type="text"
                          value={gameDeveloper}
                          onChange={(e) => setGameDeveloper(e.target.value)}
                          placeholder="ej: Square Enix / FromSoftware / Capcom"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Distribuidora / Publisher *</label>
                        <input
                          type="text"
                          value={gamePublisher}
                          onChange={(e) => setGamePublisher(e.target.value)}
                          placeholder="ej: Sony Interactive / Square Enix / Nintendo"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Año de Lanzamiento</label>
                        <input
                          type="text"
                          value={gameReleaseYear}
                          onChange={(e) => setGameReleaseYear(e.target.value)}
                          placeholder="ej: 2024 / 2025 / 2026"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Género *</label>
                        <input
                          type="text"
                          value={gameGenre}
                          onChange={(e) => setGameGenre(e.target.value)}
                          placeholder="ej: Acción / RPG / Aventura / Lucha"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Modos de Juego</label>
                        <input
                          type="text"
                          value={gameModes}
                          onChange={(e) => setGameModes(e.target.value)}
                          placeholder="ej: Un jugador, Cooperativo local, Multijugador online"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Grupo 2: Aspectos de Software y Desarrollo */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                      2. Aspectos de Software y Desarrollo
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Motor de Juego</label>
                        <input
                          type="text"
                          value={gameEngine}
                          onChange={(e) => setGameEngine(e.target.value)}
                          placeholder="ej: Unreal Engine 5.4 / Decima Engine / RE Engine"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Plataformas de Consola</label>
                        <input
                          type="text"
                          value={gameSupportedPlatforms}
                          onChange={(e) => setGameSupportedPlatforms(e.target.value)}
                          placeholder="ej: PlayStation 5, Xbox Series X|S, Nintendo Switch"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Plataforma Principal (Filtro)</label>
                        <select
                          value={gamePlatform}
                          onChange={(e) => setGamePlatform(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        >
                          <option value="PS5">PlayStation 5</option>
                          <option value="NINTENDO_SWITCH">Nintendo Switch</option>
                          <option value="XBOX_SERIES">Xbox Series X|S</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Edición</label>
                        <select
                          value={gameEdition}
                          onChange={(e) => setGameEdition(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        >
                          <option value="STANDARD">Edición Estándar</option>
                          <option value="DELUXE">Edición Deluxe</option>
                          <option value="COLLECTORS">Edición Coleccionista / SteelBook</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Idiomas Audio (Voces)</label>
                        <input
                          type="text"
                          value={gameAudioLanguages}
                          onChange={(e) => setGameAudioLanguages(e.target.value)}
                          placeholder="ej: Español Latino, Inglés, Japonés"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Idiomas Subtítulos (Textos)</label>
                        <input
                          type="text"
                          value={gameSubtitleLanguages}
                          onChange={(e) => setGameSubtitleLanguages(e.target.value)}
                          placeholder="ej: Español Latino, Inglés, Portugués, Francés"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                        <label className="text-xs text-[#9bb5c2]">Clasificación por Edad</label>
                        <input
                          type="text"
                          value={gameAgeRating}
                          onChange={(e) => setGameAgeRating(e.target.value)}
                          placeholder="ej: ESRB Teen (13+) / PEGI 16 / ESRB Mature 17+"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Grupo 3: Rendimiento en Consola */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                      3. Especificaciones de Rendimiento en Consola
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Espacio de Almacenamiento *</label>
                        <input
                          type="text"
                          value={gameFileSize}
                          onChange={(e) => setGameFileSize(e.target.value)}
                          placeholder="ej: 145 GB en SSD interno"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Modos de Visualización (PS5 / Xbox Series X)</label>
                        <input
                          type="text"
                          value={gameDisplayModes}
                          onChange={(e) => setGameDisplayModes(e.target.value)}
                          placeholder="ej: Modo Rendimiento (1440p-4K 60fps) / Modo Calidad (4K 30fps Ray Tracing)"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Optimización Xbox Series S</label>
                        <input
                          type="text"
                          value={gameXboxSeriesSOptimization}
                          onChange={(e) => setGameXboxSeriesSOptimization(e.target.value)}
                          placeholder="ej: 1080p 60fps dinámico optimizado"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Funciones Específicas de Hardware</label>
                        <input
                          type="text"
                          value={gameHardwareFeatures}
                          onChange={(e) => setGameHardwareFeatures(e.target.value)}
                          placeholder="ej: Gatillos adaptativos y hápticos DualSense, Audio 3D Tempest, SSD ultrarrápido"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TEMPLATE 2: VIDEOJUEGO DE PC */}
              {gameType === "PC" && (
                <div className="space-y-5 pt-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-3 py-2 rounded-xl">
                    <Monitor className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Especificaciones Técnicas para Videojuegos de PC</span>
                  </div>

                  {/* Grupo 1: Información General */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                      1. Información General
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                        <label className="text-xs text-[#9bb5c2]">Título del Videojuego *</label>
                        <input
                          type="text"
                          value={gameTitle}
                          onChange={(e) => setGameTitle(e.target.value)}
                          placeholder="ej: Cyberpunk 2077 / Black Myth: Wukong"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Desarrolladora *</label>
                        <input
                          type="text"
                          value={gameDeveloper}
                          onChange={(e) => setGameDeveloper(e.target.value)}
                          placeholder="ej: Game Science / CD Projekt RED"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Distribuidora / Publisher *</label>
                        <input
                          type="text"
                          value={gamePublisher}
                          onChange={(e) => setGamePublisher(e.target.value)}
                          placeholder="ej: CD PROJEKT / Game Science / Valve"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Año de Lanzamiento</label>
                        <input
                          type="text"
                          value={gameReleaseYear}
                          onChange={(e) => setGameReleaseYear(e.target.value)}
                          placeholder="ej: 2024 / 2025 / 2026"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Género *</label>
                        <input
                          type="text"
                          value={gameGenre}
                          onChange={(e) => setGameGenre(e.target.value)}
                          placeholder="ej: ARPG / Acción / Mundo Abierto"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Modos de Juego</label>
                        <input
                          type="text"
                          value={gameModes}
                          onChange={(e) => setGameModes(e.target.value)}
                          placeholder="ej: Un jugador, Cooperativo online"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Grupo 2: Aspectos de Software y Desarrollo */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                      2. Aspectos de Software y Desarrollo
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Motor de Juego</label>
                        <input
                          type="text"
                          value={gameEngine}
                          onChange={(e) => setGameEngine(e.target.value)}
                          placeholder="ej: Unreal Engine 5.4 / REDengine 4 / Unity"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Plataformas de PC (Tiendas)</label>
                        <input
                          type="text"
                          value={gameSupportedPlatforms}
                          onChange={(e) => setGameSupportedPlatforms(e.target.value)}
                          placeholder="ej: Steam, Epic Games Store, GOG, EA App"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Edición</label>
                        <select
                          value={gameEdition}
                          onChange={(e) => setGameEdition(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        >
                          <option value="STANDARD">Edición Estándar</option>
                          <option value="DELUXE">Edición Deluxe</option>
                          <option value="COLLECTORS">Edición Coleccionista</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Idiomas Audio (Voces)</label>
                        <input
                          type="text"
                          value={gameAudioLanguages}
                          onChange={(e) => setGameAudioLanguages(e.target.value)}
                          placeholder="ej: Español Latino, Inglés, Chino, Japonés"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Idiomas Subtítulos (Textos)</label>
                        <input
                          type="text"
                          value={gameSubtitleLanguages}
                          onChange={(e) => setGameSubtitleLanguages(e.target.value)}
                          placeholder="ej: Español Latino, Inglés, Francés, Alemán"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Clasificación por Edad</label>
                        <input
                          type="text"
                          value={gameAgeRating}
                          onChange={(e) => setGameAgeRating(e.target.value)}
                          placeholder="ej: ESRB Mature 17+ / PEGI 18"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Grupo 3: Requisitos de Hardware para PC */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                      3. Requisitos de Hardware para PC
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Sistema Operativo *</label>
                        <input
                          type="text"
                          value={gamePcOs}
                          onChange={(e) => setGamePcOs(e.target.value)}
                          placeholder="ej: Windows 11 / Windows 10 64-bit"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Procesador (CPU) *</label>
                        <input
                          type="text"
                          value={gamePcProcessor}
                          onChange={(e) => setGamePcProcessor(e.target.value)}
                          placeholder="ej: Intel Core i7-12700K / AMD Ryzen 7 7800X3D"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Memoria RAM *</label>
                        <input
                          type="text"
                          value={gamePcRam}
                          onChange={(e) => setGamePcRam(e.target.value)}
                          placeholder="ej: 16 GB RAM (32 GB recomendado)"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                        <label className="text-xs text-[#9bb5c2]">Tarjeta Gráfica (GPU) *</label>
                        <input
                          type="text"
                          value={gamePcGpu}
                          onChange={(e) => setGamePcGpu(e.target.value)}
                          placeholder="ej: NVIDIA GeForce RTX 4070 12GB / AMD Radeon RX 7800 XT 16GB"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Almacenamiento *</label>
                        <input
                          type="text"
                          value={gamePcStorage}
                          onChange={(e) => setGamePcStorage(e.target.value)}
                          placeholder="ej: 85 GB de espacio libre en SSD NVMe"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 6.5: In-Game Content Gallery */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-md animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
                7. Galería de Capturas de Contenido & Gameplay
              </h2>
              <span className="text-xs text-[#9bb5c2] font-mono">
                {contentGallery.length} {contentGallery.length === 1 ? "captura" : "capturas"}
              </span>
            </div>

            <p className="text-xs text-[#9bb5c2]">
              Agrega capturas de alta resolución (gameplay en 4K, detalles del acabado de la figura o holograma TCG) para el visor interactivo de la ficha del producto.
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9bb5c2]" />
                  <input
                    type="url"
                    value={contentGalleryInput}
                    onChange={(e) => setContentGalleryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddContentGalleryImage();
                      }
                    }}
                    placeholder="https://images.unsplash.com/photo-... (Captura de pantalla)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddContentGalleryImage}
                  className="px-4 py-2.5 rounded-xl bg-[#004E72] hover:bg-[#004E72]/80 text-[#F9F9F9] text-xs font-semibold transition shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Agregar Captura
                </button>
              </div>

              {/* Botones para Subir desde el Equipo y desde Google Drive */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#004E72]/30 hover:bg-[#004E72]/50 border border-[#004E72]/60 text-[#F9F9F9] text-xs font-semibold transition hover:border-[#FF6E42]/50 shadow-sm">
                  <UploadCloud className="w-4 h-4 text-[#FF6E42]" />
                  <span>Subir desde el equipo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleContentGalleryFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setDriveTarget("CONTENT_GALLERY");
                    setIsDriveModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0F394C]/60 hover:bg-[#0F394C] border border-cyan-500/40 hover:border-cyan-400 text-[#F9F9F9] text-xs font-semibold transition shadow-sm"
                >
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Subir desde Google Drive</span>
                </button>

                <span className="text-[11px] text-[#9bb5c2]">
                  Formatos JPG, PNG, WebP o enlaces de Google Drive (se normalizan a CDN directo automáticamente).
                </span>
              </div>

              {contentGallery.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {contentGallery.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-[#004E72]/40 bg-[#004E72]/10"
                    >
                      <div className="aspect-video w-full">
                        <img
                          src={img}
                          alt={`Captura ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#092634]/90 text-[#F9F9F9] border border-[#004E72]/40">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveContentGalleryImage(idx)}
                        title="Eliminar captura"
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-600/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#004E72]/10 border border-[#004E72]/30 text-center text-xs text-[#9bb5c2]">
                  No hay capturas agregadas aún. Opcional para enriquecer la experiencia visual del comprador.
                </div>
              )}
            </div>
          </div>

          {type === "COLLECTIBLE" && (
            <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-5 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-3">
                <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF6E42]" />
                  6. Especificaciones de Rareza TCG & Coleccionismo
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#004E72]/40 text-[#FF6E42] border border-[#004E72]/60">
                  Ficha Técnica Especializada
                </span>
              </div>

              {/* Categoría 1: Información General del Producto */}
              <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F9F9F9]">
                  <Info className="w-4 h-4 text-[#FF6E42]" />
                  <span>1. Información General del Producto</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Nombre del Producto *</label>
                    <input
                      type="text"
                      value={tcgProductName}
                      onChange={(e) => setTcgProductName(e.target.value)}
                      placeholder={name || "Ej: Charizard Base Set Holo 1st Edition"}
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Franquicia / IP *</label>
                    <input
                      type="text"
                      value={tcgFranchise}
                      onChange={(e) => setTcgFranchise(e.target.value)}
                      placeholder="Ej: Pokémon / Yu-Gi-Oh! / Magic / One Piece"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Juego / Sistema *</label>
                    <input
                      type="text"
                      value={tcgGameSystem}
                      onChange={(e) => setTcgGameSystem(e.target.value)}
                      placeholder="Ej: Pokémon TCG / Yu-Gi-Oh! OCG / MTG"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Idioma *</label>
                    <select
                      value={tcgLanguage}
                      onChange={(e) => setTcgLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    >
                      <option value="Japonés">Japonés (Original)</option>
                      <option value="Inglés">Inglés (Global)</option>
                      <option value="Español">Español</option>
                      <option value="Coreano">Coreano</option>
                      <option value="Chino">Chino Simplificado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Categoría 2: Detalles de Edición y Rareza */}
              <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F9F9F9]">
                  <Layers className="w-4 h-4 text-[#FF6E42]" />
                  <span>2. Detalles de Edición y Rareza</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Set / Expansión *</label>
                    <input
                      type="text"
                      value={tcgSetExpansion}
                      onChange={(e) => setTcgSetExpansion(e.target.value)}
                      placeholder="Ej: Base Set 1st Edition / Scarlet & Violet 151 / Evolving Skies"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Año de Lanzamiento *</label>
                    <input
                      type="text"
                      value={tcgReleaseYear}
                      onChange={(e) => setTcgReleaseYear(e.target.value)}
                      placeholder="Ej: 1996 / 1999 / 2023 / 2024"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Código de Colección / Número de Carta *</label>
                    <input
                      type="text"
                      value={tcgCardNumber}
                      onChange={(e) => setTcgCardNumber(e.target.value)}
                      placeholder="Ej: 4/102, 004/102, OP05-119, LOB-001"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Rareza *</label>
                    <input
                      type="text"
                      value={tcgRarity}
                      onChange={(e) => setTcgRarity(e.target.value)}
                      placeholder="Ej: Holo Rare / Secret Rare (SAR) / Ultra Rare / Ghost Rare"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Acabado / Variante *</label>
                    <input
                      type="text"
                      value={tcgFinishVariant}
                      onChange={(e) => setTcgFinishVariant(e.target.value)}
                      placeholder="Ej: Holográfica (Foil Cosmos) / 1st Edition / Shadowless / Textured"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>
                </div>
              </div>

              {/* Categoría 3: Estado de Conservación (Condición) */}
              <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F9F9F9]">
                  <ShieldCheck className="w-4 h-4 text-[#FF6E42]" />
                  <span>3. Estado de Conservación (Condición)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Graduación General *</label>
                    <select
                      value={tcgGradingCondition}
                      onChange={(e) => setTcgGradingCondition(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    >
                      <option value="GEM_MINT_10">GEM MINT 10 (Grado Perfecto / Impecable)</option>
                      <option value="MINT_9">MINT 9 (Excelente Estado de Colección)</option>
                      <option value="NEAR_MINT_8">NEAR MINT 8 (Casi Nuevo / Desgaste Mínimo)</option>
                      <option value="EXCELLENT_7">EXCELLENT 7 (Excelente)</option>
                      <option value="RAW_NEAR_MINT">RAW (Sin Graduar - Condición Near Mint)</option>
                      <option value="LIGHT_PLAYED">Light Played (Desgaste Ligero)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Certificación (Si aplica)</label>
                    <select
                      value={tcgCertification}
                      onChange={(e) => setTcgCertification(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    >
                      <option value="PSA">PSA (Professional Sports Authenticator)</option>
                      <option value="BGS">BGS (Beckett Grading Services)</option>
                      <option value="CGC">CGC Cards</option>
                      <option value="ARS">ARS (Authentic Rare Service)</option>
                      <option value="NONE">Sin Certificación Externa (Raw / Autenticado OmniCollector)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">N° de Serie / Certificado</label>
                    <input
                      type="text"
                      value={tcgSerial}
                      onChange={(e) => setTcgSerial(e.target.value)}
                      placeholder="PSA-99201482"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] font-mono text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Detalles del Desgaste *</label>
                    <textarea
                      rows={2}
                      value={tcgWearDetails}
                      onChange={(e) => setTcgWearDetails(e.target.value)}
                      placeholder="Ej: Esquinas afiladas 10/10, centrado 55/45 frontal y trasero, superficie libre de rayas o microarañazos, bordes sin blanqueamiento (whitening)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Categoría 4: Presentación y Empaque */}
              <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F9F9F9]">
                  <Box className="w-4 h-4 text-[#FF6E42]" />
                  <span>4. Presentación y Empaque</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Tipo de Producto *</label>
                    <input
                      type="text"
                      value={tcgProductType}
                      onChange={(e) => setTcgProductType(e.target.value)}
                      placeholder="Ej: Carta Individual Graduada (Slab Acrílico) / Booster Box / Pack Sellado"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">Cantidad de Elementos *</label>
                    <input
                      type="text"
                      value={tcgItemQuantity}
                      onChange={(e) => setTcgItemQuantity(e.target.value)}
                      placeholder="Ej: 1 Carta en Slab Certificado / 36 Sobres de 10 Cartas"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9bb5c2]">¿Incluye Protección? *</label>
                    <input
                      type="text"
                      value={tcgIncludesProtection}
                      onChange={(e) => setTcgIncludesProtection(e.target.value)}
                      placeholder="Ej: Sí - Slab Acrílico con Sello Anti-UV 99% & Funda Protectora Sleeve"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === "BUNDLE" && (
            <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-md animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
                6. Selección de Componentes del Bundle Compuesto
              </h2>
              <p className="text-xs text-[#9bb5c2]">
                Selecciona al menos 2 productos del catálogo para formar este lote. El stock del bundle se sincronizará dinámicamente según la disponibilidad de sus partes.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {existingProducts.map((prod) => {
                  const isChecked = selectedBundleItems.some((i) => i.productId === prod.id);
                  const currentQty = selectedBundleItems.find((i) => i.productId === prod.id)?.quantity || 1;

                  return (
                    <div
                      key={prod.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                        isChecked
                          ? "bg-[#004E72]/30 border-[#FF6E42]/60 text-[#F9F9F9]"
                          : "bg-[#004E72]/10 border-[#004E72]/30 text-[#9bb5c2]"
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBundleItems([...selectedBundleItems, { productId: prod.id, quantity: 1 }]);
                            } else {
                              setSelectedBundleItems(selectedBundleItems.filter((i) => i.productId !== prod.id));
                            }
                          }}
                          className="rounded border-[#004E72] text-[#FF6E42] focus:ring-[#FF6E42]"
                        />
                        <div>
                          <span className="font-semibold text-[#F9F9F9] block">{prod.name}</span>
                          <span className="text-[10px] text-[#9bb5c2] font-mono">
                            {prod.sku} • {formatCLP(prod.price)} • Stock: {prod.stockAvailable}
                          </span>
                        </div>
                      </label>

                      {isChecked && (
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-[10px] text-[#9bb5c2]">Cant:</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={currentQty}
                            onChange={(e) => {
                              const q = Math.max(1, Number(e.target.value));
                              setSelectedBundleItems(
                                selectedBundleItems.map((item) =>
                                  item.productId === prod.id ? { ...item, quantity: q } : item
                                )
                              );
                            }}
                            className="w-14 px-2 py-1 rounded bg-[#092634] border border-[#004E72] text-[#F9F9F9] font-mono text-xs text-center"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 6: Custom Category Technical Specifications Form */}
          {isCustomOrSpecializedCategory && (
            <CustomSpecificationsForm
              customCategoryLabel={
                customCategoryLabel ||
                (type === "HARDWARE"
                  ? "Hardware & Componentes"
                  : type === "CONSOLE"
                  ? "Consolas"
                  : type === "GAMING_ACCESSORY"
                  ? "Accesorio Gaming"
                  : type === "APPAREL"
                  ? "Ropa & Estilo"
                  : type === "BOOK"
                  ? "Manga / Libros"
                  : type === "MERCH"
                  ? "Merchandising"
                  : type === "AUDIO"
                  ? "Audio / OST"
                  : "")
              }
              value={customSpecifications}
              onChange={setCustomSpecifications}
            />
          )}

          {/* Submit Action Bar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-[#FF6E42] hover:bg-[#ff5421] text-[#F9F9F9] font-bold text-sm tracking-wide transition shadow-lg shadow-[#FF6E42]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#F9F9F9] border-t-transparent rounded-full animate-spin"></div>
                  Validando y guardando producto...
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  Publicar Producto en Catálogo CLP
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Live Real-Time Card Preview */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF6E42]">
              <Eye className="w-4 h-4" />
              Vista Previa en Vivo (Card del Catálogo)
            </div>
            <span className="text-[11px] text-[#9bb5c2] font-mono">Render en tiempo real</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#092634]/40 border border-[#004E72]/40 shadow-inner">
            <ProductCard product={previewProduct} />
          </div>

          {/* Business & Economics summary */}
          <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-3 shadow-md">
            <h3 className="text-xs font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FF6E42]" />
              Resumen de Reglas de Negocio
            </h3>

            <div className="space-y-2 text-xs divide-y divide-[#004E72]/30">
              <div className="flex justify-between pt-1">
                <span className="text-[#9bb5c2]">SKU Asignado:</span>
                <span className="font-mono text-[#F9F9F9] font-bold">{previewProduct.sku}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-[#9bb5c2]">Régimen de Venta:</span>
                <span className="text-[#F9F9F9] font-semibold">
                  {isPreOrder ? `Preventa (Pie ${Math.round(figureDepositPercent * 100)}%)` : "Despacho Inmediato"}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-[#9bb5c2]">Margen Bruto Unitario:</span>
                <span className="font-mono text-[#FF6E42] font-bold">
                  {formatCLP(grossProfitCLP)} ({marginPercent}%)
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-[#9bb5c2]">Divisa de Cobro:</span>
                <span className="text-[#F9F9F9] font-bold">CLP (Peso Chileno)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notification for Instant Feedback without Scrolling */}
      {createdProduct && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] p-4 rounded-2xl bg-[#092634]/95 border-2 border-emerald-500 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-200">
                  ¡Producto publicado con éxito en el catálogo!
                </h4>
                <p className="text-xs text-[#9bb5c2] mt-0.5 line-clamp-1">
                  SKU: <span className="font-mono font-bold text-white">{createdProduct.sku}</span> • {createdProduct.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreatedProduct(null)}
              className="text-[#9bb5c2] hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#004E72]/50">
            <Link
              href={`/product/${createdProduct.sku.toLowerCase()}`}
              target="_blank"
              className="flex-1 py-2 px-3 rounded-xl bg-[#FF6E42] hover:bg-[#ff5421] text-white text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow"
            >
              Ver en Tienda <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/products"
              className="py-2 px-3 rounded-xl bg-[#004E72] hover:bg-[#004E72]/80 text-white text-xs font-semibold text-center transition"
            >
              Ir al Inventario
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedProduct(null);
                setName("");
                setSku(`PROD-${Date.now().toString().slice(-4)}`);
              }}
              className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition"
              title="Registrar otro producto"
            >
              + Otro
            </button>
          </div>
        </div>
      )}

      {/* Google Drive Import Modal */}
      <GoogleDriveImportModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        title={
          driveTarget === "CONTENT_GALLERY"
            ? "Importar Captura desde Google Drive"
            : "Importar Foto de Producto desde Google Drive"
        }
        description={
          driveTarget === "CONTENT_GALLERY"
            ? "Pega el enlace compartido de Google Drive. Se convertirá automáticamente a URL CDN directa para la galería interactiva."
            : "Pega el enlace compartido de Google Drive. Se convertirá automáticamente a URL CDN directa para el catálogo."
        }
        onImport={(normalizedUrl) => {
          if (driveTarget === "CONTENT_GALLERY") {
            setContentGallery((prev) => [...prev, normalizedUrl]);
          } else {
            setImages((prev) => [...prev, normalizedUrl]);
          }
        }}
      />
    </div>
  );
}

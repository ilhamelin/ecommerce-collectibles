"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
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
  Save,
  Package,
  Wand2,
  Disc,
  Download,
  Tag,
  X,
  Monitor,
  Tv,
  Cpu,
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
import { saveProductToFirestoreClient, deleteProductFromFirestoreClient } from "@/lib/firebase/client-firestore";
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

export default function EditProductAdminPage() {
  const params = useParams();
  const router = useRouter();
  const productId = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  const [stockAvailable, setStockAvailable] = useState<number>(0);
  const [isPreOrder, setIsPreOrder] = useState<boolean>(false);
  const [preOrderState, setPreOrderState] = useState<string>("PREORDER_OPEN");

  // Multimedia & Badges
  const [trailerUrl, setTrailerUrl] = useState("");
  const [ageRating, setAgeRating] = useState("TE");
  const [customAgeRating, setCustomAgeRating] = useState("");
  const [genresInput, setGenresInput] = useState("");

  // Images State (Cover & Main Carrousel)
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // In-Game / Content Gallery State (Gameplay captures / high-res details)
  const [contentGallery, setContentGallery] = useState<string[]>([]);
  const [contentGalleryInput, setContentGalleryInput] = useState("");

  // Google Drive Import Modal State
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveTarget, setDriveTarget] = useState<"MAIN_IMAGES" | "CONTENT_GALLERY">("CONTENT_GALLERY");

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

  // Dynamic: Figure Technical Specs
  const [figureScale, setFigureScale] = useState<FigureScale>("SCALE_1_7");
  const [figureManufacturer, setFigureManufacturer] = useState<FigureManufacturer>("GOOD_SMILE_COMPANY");
  const [figureArrivalDate, setFigureArrivalDate] = useState("Noviembre 2026");
  const [figureDepositPercent, setFigureDepositPercent] = useState<number>(0.2);
  const [figureMaterial, setFigureMaterial] = useState("");
  const [figureDimensions, setFigureDimensions] = useState("");
  const [figureSculptor, setFigureSculptor] = useState("");
  const [figureBoxCondition, setFigureBoxCondition] = useState("");

  // Dynamic: Collectible
  const [collectibleCategory, setCollectibleCategory] = useState<CollectibleCategory>("TCG");
  const [collectibleCondition, setCollectibleCondition] = useState<CollectibleCondition>("MINT_9");
  const [collectibleLanguage, setCollectibleLanguage] = useState("English");
  const [collectibleAuth, setCollectibleAuth] = useState<Authenticator>("PSA");
  const [collectibleSerial, setCollectibleSerial] = useState("");

  // Auto-fill state
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillSuccessMsg, setAutoFillSuccessMsg] = useState<string | null>(null);
  const [aiEngineUsed, setAiEngineUsed] = useState<"GEMINI_AI" | "SMART_KNOWLEDGE_ENGINE">("SMART_KNOWLEDGE_ENGINE");
  const [aiEngineErrorDetail, setAiEngineErrorDetail] = useState<string | null>(null);

  const handleAutoFillWithAI = async () => {
    if (!name.trim()) {
      setErrorMsg("Por favor, ingresa al menos el Nombre Comercial del producto para auto-completar.");
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

      const d = data.data;

      // In edit mode: preserve current SKU if already defined to protect URLs & database key
      if (!sku.trim() && d.sku) {
        setSku(d.sku);
      }

      // Preserve admin category selection
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
      
      if (d.ageRating) {
        const match = WORLDWIDE_AGE_RATINGS.find(
          (r) => r.value.toLowerCase() === d.ageRating.toLowerCase()
        );
        if (match) {
          setAgeRating(match.value);
        } else {
          setAgeRating("CUSTOM");
          setCustomAgeRating(d.ageRating);
        }
      }

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
        if (d.collectibleSpecs.condition) setCollectibleCondition(d.collectibleSpecs.condition as any);
        if (d.collectibleSpecs.authBody) setCollectibleAuth(d.collectibleSpecs.authBody as any);
        if (d.collectibleSpecs.language) setCollectibleLanguage(d.collectibleSpecs.language);
        if (d.collectibleSpecs.serial) setCollectibleSerial(d.collectibleSpecs.serial);
      }

      if (d.customSpecifications) {
        setCustomSpecifications(d.customSpecifications);
      }

      // DO NOT alter images (photo gallery stays pristine)

      setAiEngineUsed(d.engine || "SMART_KNOWLEDGE_ENGINE");
      setAiEngineErrorDetail(d.geminiErrorDetail || null);
      const engineLabel = d.engine === "GEMINI_AI" ? "Google Gemini AI" : "Motor Heurístico Especializado";
      setAutoFillSuccessMsg(`¡Ficha generada exitosamente con ${engineLabel}! Todos los campos fueron actualizados respetando la categoría.`);
      setTimeout(() => setAutoFillSuccessMsg(null), 8000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al autocompletar con IA.";
      setErrorMsg(msg);
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(productId)}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        deleteProductFromFirestoreClient(productId).catch((e) =>
          console.warn("[Client Delete Sync]", e)
        );
        alert(`¡Producto ${sku} eliminado con éxito de Cloud Firestore!`);
        router.push("/admin/products");
      } else {
        setErrorMsg(data.error || "No se pudo eliminar el producto.");
      }
    } catch {
      setErrorMsg("Error de red al intentar eliminar el producto.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Load existing product
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/products?sku=${encodeURIComponent(productId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.product) {
          const p: ProductDomainEntity = data.data.product;
          setSku(p.sku);
          setName(p.name);
          setDescription(p.description);

          // Cargar especificaciones personalizadas si existen
          if (p.customSpecifications) {
            setCustomSpecifications(p.customSpecifications);
          }

          // Detección canónica robusta de categoría para evitar fallbacks a FIGURE
          const rawType = (p.type || "").toUpperCase();
          const rawSku = (p.sku || "").toUpperCase();
          const rawCatLabel = (p.customCategoryLabel || "").toLowerCase();
          const specCat = (p.customSpecifications?.categoryType || "").toUpperCase();

          if (
            rawType === "HARDWARE" ||
            specCat === "HARDWARE" ||
            rawSku.startsWith("HW-") ||
            rawCatLabel.includes("hardware") ||
            rawCatLabel.includes("componente") ||
            Boolean(p.customSpecifications?.hardware)
          ) {
            setType("HARDWARE" as ProductType);
            setCustomCategoryLabel(p.customCategoryLabel || "Hardware & Componentes");
          } else if (
            rawType === "CONSOLE" ||
            specCat === "CONSOLE" ||
            rawSku.startsWith("CON-") ||
            rawCatLabel.includes("consola") ||
            Boolean(p.customSpecifications?.console)
          ) {
            setType("CONSOLE" as ProductType);
            setCustomCategoryLabel(p.customCategoryLabel || "Consolas");
          } else if (
            rawType === "GAMING_ACCESSORY" ||
            rawType === "ACCESSORY" ||
            specCat === "GAMING_ACCESSORY" ||
            rawSku.startsWith("ACC-") ||
            rawCatLabel.includes("accesorio") ||
            Boolean(p.customSpecifications?.gamingAccessory)
          ) {
            setType("GAMING_ACCESSORY" as ProductType);
            setCustomCategoryLabel(p.customCategoryLabel || "Accesorio Gaming");
          } else if (
            rawType === "APPAREL" ||
            specCat === "APPAREL" ||
            rawCatLabel.includes("ropa") ||
            Boolean(p.customSpecifications?.apparel)
          ) {
            setType("APPAREL" as ProductType);
            setCustomCategoryLabel(p.customCategoryLabel || "Ropa & Estilo");
          } else if (
            rawType === "BOOK" ||
            specCat === "BOOK" ||
            rawCatLabel.includes("manga") ||
            rawCatLabel.includes("libro") ||
            Boolean(p.customSpecifications?.book)
          ) {
            setType("BOOK" as ProductType);
            setCustomCategoryLabel(p.customCategoryLabel || "Manga / Artbook");
          } else if (
            rawType === "MERCH" ||
            specCat === "MERCH" ||
            rawCatLabel.includes("merch") ||
            Boolean(p.customSpecifications?.merch)
          ) {
            setType("MERCH" as ProductType);
            setCustomCategoryLabel(p.customCategoryLabel || "Merchandising");
          } else if (
            rawType === "AUDIO" ||
            specCat === "AUDIO" ||
            rawCatLabel.includes("audio") ||
            Boolean(p.customSpecifications?.audio)
          ) {
            setType("AUDIO" as ProductType);
            setCustomCategoryLabel(p.customCategoryLabel || "Audio / OST");
          } else if (
            rawType === "COLLECTIBLE" ||
            rawSku.startsWith("TCG-") ||
            rawSku.startsWith("COL-") ||
            rawCatLabel.includes("tcg") ||
            rawCatLabel.includes("carta")
          ) {
            setType("COLLECTIBLE");
            setCustomCategoryLabel(p.customCategoryLabel || "TCG & Cartas");
          } else if (
            rawType === "VIDEO_GAME" ||
            rawSku.startsWith("VG-") ||
            rawCatLabel.includes("videojuego")
          ) {
            setType("VIDEO_GAME");
            setCustomCategoryLabel(p.customCategoryLabel || "Videojuegos");
          } else if (
            rawType === "BUNDLE" ||
            rawSku.startsWith("BUN-") ||
            rawCatLabel.includes("bundle")
          ) {
            setType("BUNDLE");
            setCustomCategoryLabel(p.customCategoryLabel || "Bundles");
          } else if (
            rawType === "FIGURE" ||
            rawSku.startsWith("FIG-") ||
            rawCatLabel.includes("figura")
          ) {
            setType("FIGURE");
            setCustomCategoryLabel(p.customCategoryLabel || "Figuras");
          } else {
            setType(p.type || "OTHER");
            setCustomCategoryLabel(p.customCategoryLabel || "");
          }
          setPrice(p.price);
          setOriginalPrice(p.originalPrice);
          setCostPrice(p.costPrice);
          setStockAvailable(p.stockAvailable);
          setIsPreOrder(Boolean(p.isPreOrder));
          setPreOrderState(p.preOrderState || "PREORDER_OPEN");
          setTrailerUrl(p.trailerUrl || "");

          // Check if age rating is in WORLDWIDE_AGE_RATINGS or custom
          const existingRating = p.ageRating || "TE";
          const matchRating = WORLDWIDE_AGE_RATINGS.find(
            (r) => r.value.toLowerCase() === existingRating.toLowerCase()
          );
          if (matchRating) {
            setAgeRating(matchRating.value);
          } else {
            setAgeRating("CUSTOM");
            setCustomAgeRating(existingRating);
          }

          setGenresInput(p.genres && p.genres.length > 0 ? p.genres.join(", ") : "");
          setContentGallery(p.contentGallery || []);

          const prodImages = p.images && p.images.length > 0 ? p.images : p.imageUrl ? [p.imageUrl] : [];
          setImages(prodImages);

          if (p.gameMetadata) {
            setGameType(p.gameMetadata.gameType || (p.gameMetadata.platform === "PC" ? "PC" : "CONSOLE"));
            setGamePlatform(p.gameMetadata.platform || "PS5");
            setGameEdition(p.gameMetadata.edition || "STANDARD");
            setGamePublisher(p.gameMetadata.publisher || "");
            setGameIsDigital(Boolean(p.gameMetadata.isDigital));
            setGameAudioLanguages(p.gameMetadata.audioLanguages || "Español Latino, Inglés");
            setGameSubtitleLanguages(p.gameMetadata.subtitleLanguages || "Español Latino, Inglés");
            setGameFileSize(p.gameMetadata.fileSize || "");
            setGameTitle(p.gameMetadata.title || p.name || "");
            setGameDeveloper(p.gameMetadata.developer || "");
            setGameReleaseYear(p.gameMetadata.releaseYear || "");
            setGameGenre(p.gameMetadata.genre || "");
            setGameModes(p.gameMetadata.gameModes || p.gameMetadata.players || "Un jugador");
            setGameEngine(p.gameMetadata.gameEngine || "");
            setGameSupportedPlatforms(p.gameMetadata.supportedPlatforms || "");
            setGameAgeRating(p.gameMetadata.ageRating || "");
            setGameDisplayModes(p.gameMetadata.displayModes || p.gameMetadata.resolution || "");
            setGameXboxSeriesSOptimization(p.gameMetadata.xboxSeriesSOptimization || "");
            setGameHardwareFeatures(p.gameMetadata.hardwareFeatures || "");
            setGamePcOs(p.gameMetadata.pcOs || "");
            setGamePcProcessor(p.gameMetadata.pcProcessor || "");
            setGamePcRam(p.gameMetadata.pcRam || "");
            setGamePcGpu(p.gameMetadata.pcGpu || "");
            setGamePcStorage(p.gameMetadata.pcStorage || "");
          }
          if (p.figureMetadata) {
            setFigureScale(p.figureMetadata.scale as any);
            setFigureManufacturer(p.figureMetadata.manufacturer as any);
            setFigureArrivalDate(p.figureMetadata.estimatedArrivalDate || "Noviembre 2026");
            setFigureDepositPercent(p.figureMetadata.minimumDepositPercent ?? 0.2);
            setFigureMaterial(p.figureMetadata.material || "");
            setFigureDimensions(p.figureMetadata.dimensions || "");
            setFigureSculptor(p.figureMetadata.sculptor || "");
            setFigureBoxCondition(p.figureMetadata.boxCondition || "");
          }
          if (p.collectibleMetadata) {
            setCollectibleCategory(p.collectibleMetadata.category as any);
            setCollectibleCondition(p.collectibleMetadata.condition as any);
            setCollectibleLanguage(p.collectibleMetadata.cardLanguage || "English");
            setCollectibleAuth(p.collectibleMetadata.authenticationBody as any);
            setCollectibleSerial(p.collectibleMetadata.serialNumber || "");
          }
          if (p.customSpecifications) {
            setCustomSpecifications(p.customSpecifications);
          }
        } else {
          setLoadError(data.error || "No se pudo encontrar el producto.");
        }
      })
      .catch((err) => {
        console.error("Error al cargar producto para editar:", err);
        setLoadError("Error de red al consultar el producto.");
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      const normalized = normalizeImageUrl(imageUrlInput.trim());
      setImages((prev) => [...prev, normalized]);
      setImageUrlInput("");
    }
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

  // SKU Generator & Real-time Database Validation State
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  const [skuValidation, setSkuValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string | null;
  }>({
    isChecking: false,
    isAvailable: null,
    message: null,
  });

  const handleGenerateSku = async () => {
    if (!name.trim()) {
      setSkuValidation({
        isChecking: false,
        isAvailable: null,
        message: "Ingresa primero el nombre del producto.",
      });
      return;
    }

    setIsGeneratingSku(true);
    setSkuValidation((prev) => ({ ...prev, isChecking: true }));

    try {
      const res = await fetch("/api/admin/generate-sku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });
      const data = await res.json();
      if (res.ok && data.sku) {
        setSku(data.sku);
        setSkuValidation({
          isChecking: false,
          isAvailable: true,
          message: data.hadCollision
            ? `Colisión resuelta: SKU generado (${data.sku}) verificado contra ${data.databaseCount} productos en BD.`
            : `SKU único generado y verificado contra ${data.databaseCount} productos en Cloud Firestore.`,
        });
      } else {
        setSkuValidation({
          isChecking: false,
          isAvailable: null,
          message: data.error || "No se pudo autogenerar el SKU.",
        });
      }
    } catch {
      setSkuValidation({
        isChecking: false,
        isAvailable: null,
        message: "Error de red al consultar la base de datos.",
      });
    } finally {
      setIsGeneratingSku(false);
    }
  };

  // Determine if genres/tags input makes sense for this category
  const shouldShowGenres = useMemo(() => {
    if (type === "VIDEO_GAME") return true;
    if (type === "OTHER") {
      const l = (customCategoryLabel || "").toLowerCase();
      return l.includes("manga") || l.includes("comic") || l.includes("libro") || l.includes("anime");
    }
    return false;
  }, [type, customCategoryLabel]);

  // Preview Domain Entity
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
      id: productId,
      sku: (sku || "SKU-PREVIEW").toUpperCase().trim(),
      name: name || "Nombre del Producto",
      description: description || "Descripción detallada del producto.",
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
              id: `meta-game-${productId}`,
              productId,
              gameType,
              platform: gameType === "PC" ? "PC" : gamePlatform,
              edition: gameEdition,
              isDigital: Boolean(gameIsDigital),
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
              id: `meta-fig-${productId}`,
              productId,
              scale: figureScale,
              manufacturer: figureManufacturer,
              estimatedArrivalDate: figureArrivalDate,
              allowsPartialDeposit: isPreOrder,
              minimumDepositPercent: figureDepositPercent,
              material: figureMaterial,
              dimensions: figureDimensions,
              sculptor: figureSculptor,
              boxCondition: figureBoxCondition,
            }
          : undefined,
      collectibleMetadata:
        type === "COLLECTIBLE"
          ? {
              id: `meta-col-${productId}`,
              productId,
              category: collectibleCategory,
              condition: collectibleCondition,
              cardLanguage: collectibleLanguage,
              authenticationBody: collectibleAuth,
              serialNumber: collectibleSerial,
            }
          : undefined,
      customSpecifications: type === "OTHER" ? customSpecifications : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    productId,
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
    collectibleCategory,
    collectibleCondition,
    collectibleLanguage,
    collectibleAuth,
    collectibleSerial,
    customSpecifications,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const genresList = shouldShowGenres
      ? genresInput
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
      : [];

    const resolvedAgeRating =
      ageRating === "CUSTOM" ? customAgeRating.trim() : ageRating.trim();

    try {
      const payload: Record<string, unknown> = {
        id: productId,
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
        price: Math.round(price),
        originalPrice: originalPrice && Number(originalPrice) > 0 ? Number(originalPrice) : undefined,
        costPrice: Math.round(costPrice),
        stockAvailable: Math.max(0, stockAvailable),
        isPreOrder,
        preOrderState: isPreOrder ? preOrderState : undefined,
        images,
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
          allowsPartialDeposit: true,
          minimumDepositPercent: figureDepositPercent,
          material: figureMaterial || undefined,
          dimensions: figureDimensions || undefined,
          sculptor: figureSculptor || undefined,
          boxCondition: figureBoxCondition || undefined,
        };
      } else if (type === "COLLECTIBLE") {
        payload.collectibleMetadata = {
          category: collectibleCategory,
          condition: collectibleCondition,
          cardLanguage: collectibleLanguage,
          authenticationBody: collectibleAuth,
          serialNumber: collectibleSerial || undefined,
        };
      } else if (isCustomOrSpecializedCategory) {
        payload.customSpecifications = customSpecifications;
      }

      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo actualizar el producto.");
      }

      if (data.data?.product && !data.data?.syncedToFirestore) {
        saveProductToFirestoreClient(data.data.product).catch((e) =>
          console.warn("[Client Edit Firestore Sync]", e)
        );
      }

      catalogClient.invalidateCache();
      setSuccessMsg(`¡Producto ${sku} actualizado con éxito! Los cambios ya están disponibles en el catálogo.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al actualizar el producto.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#004E72] border-t-[#FF6E42] rounded-full animate-spin mx-auto" />
        <p className="text-[#9bb5c2] text-sm">Cargando datos del producto...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-2xl font-bold text-[#F9F9F9]">Error al abrir producto</h2>
        <p className="text-[#9bb5c2] text-sm">{loadError}</p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#004E72] hover:bg-[#FF6E42] text-[#F9F9F9] font-medium text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Inventario
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#9bb5c2]">
          <Link href="/admin/products" className="hover:text-[#F9F9F9] flex items-center gap-1 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inventario
          </Link>
          <span>/</span>
          <span className="text-[#FF6E42] font-semibold font-mono">Editar {sku}</span>
        </div>

        <Link
          href={`/product/${sku.toLowerCase()}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004E72]/50 hover:bg-[#004E72] text-[#F9F9F9] text-xs font-semibold border border-[#004E72] transition group"
        >
          Ver en Tienda
          <ArrowUpRight className="w-3.5 h-3.5 text-[#FF6E42] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
        </Link>
      </div>

      {/* Header Banner */}
      <div className="border-b border-[#E5E5E5] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#FF6B35] uppercase tracking-wider">
          <Save className="w-4 h-4" />
          Modificación de Catálogo
        </div>
        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
          Editar Producto: <span className="text-[#FF6B35]">{sku}</span>
        </h1>
        <p className="text-sm text-[#555555]">
          Actualiza precios en CLP, stock, formato físico/digital, clasificación por edad y metadatos de coleccionista.
        </p>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-start gap-3 text-emerald-300 text-xs shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block text-emerald-200">¡Actualización Guardada!</span>
            <p>{successMsg}</p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href={`/product/${sku.toLowerCase()}`}
                target="_blank"
                className="underline font-bold text-emerald-300 hover:text-white"
              >
                Abrir ficha en tienda &rarr;
              </Link>
              <Link
                href="/admin/products"
                className="underline font-medium text-emerald-400 hover:text-white"
              >
                Ir a lista de inventario
              </Link>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/50 flex items-start gap-3 text-red-300 text-xs shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block text-red-200">Error al guardar</span>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Form (Col 8) + Live Preview (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          {/* Section 1: Basic Info */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#004E72]/40 pb-3">
              <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#FF6E42]" />
                Información Básica del Producto
              </h2>

              {/* Botón Auto-completar con IA en la vista de edición */}
              <button
                type="button"
                onClick={handleAutoFillWithAI}
                disabled={isAutoFilling || !name.trim()}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6E42] to-[#ff5421] text-[#092634] font-black text-xs uppercase tracking-wider shadow hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Genera automáticamente o actualiza los datos del producto (categoría, precios, ficha técnica y descripción) a partir del Nombre con IA"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label className="block text-xs font-semibold text-[#9bb5c2]">
                    SKU Identificador *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    disabled={isGeneratingSku || !name.trim()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-[#FF6E42] to-[#ff5421] text-[#092634] font-black text-[10px] uppercase tracking-wider shadow hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Analiza la BD y genera un SKU único sin colisiones"
                  >
                    {isGeneratingSku ? (
                      <>
                        <div className="w-2.5 h-2.5 border-2 border-[#092634] border-t-transparent rounded-full animate-spin" />
                        <span>Analizando...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-2.5 h-2.5" />
                        <span>Autogenerar</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] font-mono focus:border-[#FF6E42] focus:outline-none uppercase"
                />
                {skuValidation.message && (
                  <p className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{skuValidation.message}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">
                  Categoría de Producto *
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value as ProductType;
                    setType(newType);
                    if (newType === "HARDWARE" && !customCategoryLabel) {
                      setCustomCategoryLabel("Hardware & Componentes");
                    } else if (newType === "CONSOLE" && !customCategoryLabel) {
                      setCustomCategoryLabel("Consolas");
                    } else if (newType === "GAMING_ACCESSORY" && !customCategoryLabel) {
                      setCustomCategoryLabel("Accesorio Gaming");
                    } else if (newType === "APPAREL" && !customCategoryLabel) {
                      setCustomCategoryLabel("Ropa & Estilo");
                    } else if (newType === "BOOK" && !customCategoryLabel) {
                      setCustomCategoryLabel("Manga / Artbook");
                    } else if (newType === "MERCH" && !customCategoryLabel) {
                      setCustomCategoryLabel("Merchandising");
                    } else if (newType === "AUDIO" && !customCategoryLabel) {
                      setCustomCategoryLabel("Audio / OST");
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none cursor-pointer font-medium"
                >
                  <option value="FIGURE">Figuras de Escala</option>
                  <option value="VIDEO_GAME">Videojuegos</option>
                  <option value="COLLECTIBLE">TCG & Rarezas PSA</option>
                  <option value="HARDWARE">Hardware & Componentes</option>
                  <option value="CONSOLE">Consolas de Videojuegos</option>
                  <option value="GAMING_ACCESSORY">Accesorios Gaming</option>
                  <option value="APPAREL">Ropa & Estilo</option>
                  <option value="BOOK">Manga / Libros</option>
                  <option value="MERCH">Merchandising</option>
                  <option value="AUDIO">Audio / OST</option>
                  <option value="BUNDLE">Bundle Compuesto</option>
                  <option value="OTHER">+ Otra Categoría / Personalizada</option>
                </select>
              </div>

              {/* Custom Category Details when type is specialized or OTHER */}
              {isCustomOrSpecializedCategory && (
                <div className="sm:col-span-2 p-4 rounded-xl bg-[#004E72]/20 border border-[#FF6E42]/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#F9F9F9] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#FF6E42]" />
                      Nombre de la Categoría Personalizada *
                    </label>
                    <span className="text-[10px] text-[#9bb5c2]">Elige un preset o escribe un nombre libre</span>
                  </div>

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
                            : "bg-[#092634] text-[#9bb5c2] border-[#004E72]/60 hover:text-white"
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
                    placeholder="Ej: Consola Retro, Hardware & Componentes, Ropa Gamer..."
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/70 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">
                Nombre Comercial *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">
                Descripción Completa
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 1.5: Trailer Oficial, Clasificación & Etiquetas */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2 border-b border-[#004E72]/40 pb-3">
              <Sparkles className="w-4 h-4 text-[#FF6E42]" />
              Trailer de YouTube, Clasificación & Etiquetas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-[#9bb5c2]">
                  Enlace del Trailer Oficial (YouTube)
                </label>
                <input
                  type="url"
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                />
                <p className="text-[10px] text-[#9bb5c2]">
                  Reproductor de video 16:9 integrado en la vista del producto.
                </p>
              </div>

              {/* Worldwide Age Rating Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#9bb5c2]">
                  Clasificación de Edad / Sello
                </label>
                <select
                  value={ageRating}
                  onChange={(e) => setAgeRating(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none cursor-pointer"
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
                    placeholder="Escribe el sello personalizado..."
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[#004E72]/30 border border-[#FF6E42]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42]"
                  />
                )}
                <p className="text-[10px] text-[#9bb5c2]">
                  Placa regulatoria oficial visible en la tienda.
                </p>
              </div>

              {shouldShowGenres && (
                <div className="sm:col-span-3 space-y-1 animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-[#9bb5c2]">
                    Géneros & Etiquetas (separados por coma)
                  </label>
                  <input
                    type="text"
                    value={genresInput}
                    onChange={(e) => setGenresInput(e.target.value)}
                    placeholder="Acción, Aventuras, Ciencia Ficción"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Pricing & Stock (CLP) - Responsive and perfectly aligned */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2 border-b border-[#004E72]/40 pb-3">
              <Sparkles className="w-4 h-4 text-[#FF6E42]" />
              Precios en Moneda Chilena (CLP) & Stock
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
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] font-mono font-bold focus:border-[#FF6E42] focus:outline-none"
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
                    min="0"
                    value={originalPrice || ""}
                    onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ej. 69900"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] font-mono focus:border-[#FF6E42] focus:outline-none"
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
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] font-mono focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <div className="h-5 flex items-center text-[10px] text-[#9bb5c2] font-mono">
                  Margen: {price > 0 ? (((price - costPrice) / price) * 100).toFixed(1) : 0}%
                </div>
              </div>

              {/* Card 4: Stock Físico Disponible */}
              <div className="p-3.5 rounded-xl bg-[#004E72]/15 border border-[#004E72]/50 flex flex-col justify-between space-y-2">
                <div className="h-6 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#F9F9F9]">
                    Stock Disponible *
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">Unidades</span>
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockAvailable}
                  onChange={(e) => setStockAvailable(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] font-mono focus:border-[#FF6E42] focus:outline-none"
                />
                <div className="h-5 flex items-center text-[10px] text-[#9bb5c2]">
                  Unidades físicas en almacén
                </div>
              </div>
            </div>

            {/* Pre-order Configuration */}
            <div className="pt-3 border-t border-[#004E72]/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#F9F9F9] block">
                    ¿Habilitar como Preventa Especializada?
                  </span>
                  <span className="text-[11px] text-[#9bb5c2] block">
                    Permite cobro de pie parcial (20%-30%) y reserva contra llegadas futuras.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPreOrder}
                  onChange={(e) => setIsPreOrder(e.target.checked)}
                  className="w-5 h-5 accent-[#FF6E42] rounded cursor-pointer"
                />
              </div>

              {isPreOrder && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">
                      Estado de la Preventa
                    </label>
                    <select
                      value={preOrderState}
                      onChange={(e) => setPreOrderState(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none cursor-pointer"
                    >
                      <option value="PREORDER_OPEN">Reservas Abiertas (Pre-Order Open)</option>
                      <option value="MANUFACTURING">En Fabricación (Japón)</option>
                      <option value="IN_TRANSIT_CUSTOMS">En Tránsito Marítimo / Aduanas</option>
                      <option value="WAREHOUSE_RECEIVED">Arribado a Bodega Santiago</option>
                      <option value="FULFILLED">Completado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">
                      Porcentaje de Pie Mínimo
                    </label>
                    <select
                      value={figureDepositPercent}
                      onChange={(e) => setFigureDepositPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none cursor-pointer"
                    >
                      <option value={0.2}>20% Inicial (Estándar)</option>
                      <option value={0.3}>30% Inicial</option>
                      <option value={0.5}>50% Inicial</option>
                      <option value={1.0}>100% Pago Completo</option>
                    </select>
                    <span className="text-[10px] text-[#FF6E42] mt-1 block font-mono">
                      Pie cobrado hoy: {formatCLP(Math.round(price * figureDepositPercent))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Product Images Management */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-3">
              <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF6E42]" />
                Galería de Fotos & Portada
              </h2>
              <span className="text-xs text-[#9bb5c2] font-mono">
                {images.length} imagen{images.length !== 1 ? "es" : ""} cargada{images.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Add Image Inputs */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9bb5c2]" />
                  <input
                    type="url"
                    placeholder="Pega aquí la URL de la imagen (ej: https://...)"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] placeholder-[#9bb5c2]/50 focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2 rounded-xl bg-[#004E72] hover:bg-[#FF6E42] text-[#F9F9F9] text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar URL
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#9bb5c2]">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#05161f] border border-[#004E72]/60 hover:bg-[#004E72]/30 text-[#F9F9F9] transition">
                  <UploadCloud className="w-4 h-4 text-[#FF6E42]" />
                  <span>Subir desde dispositivo</span>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F394C]/60 hover:bg-[#0F394C] border border-cyan-500/40 hover:border-cyan-400 text-[#F9F9F9] transition shadow-sm"
                >
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Google Drive</span>
                </button>

                <span className="text-[11px]">La primera foto se utilizará como portada en el catálogo.</span>
              </div>
            </div>

            {/* Images Grid */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-xl overflow-hidden border bg-[#05161f] group ${
                      idx === 0 ? "border-[#FF6E42] ring-1 ring-[#FF6E42]" : "border-[#004E72]/50"
                    }`}
                  >
                    <div className="w-full h-28 overflow-hidden flex items-center justify-center">
                      <img src={img} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>

                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FF6E42] text-[#F9F9F9] flex items-center gap-1 shadow">
                        <Star className="w-2.5 h-2.5 fill-current" /> Portada
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          title="Hacer foto de portada"
                          className="p-1.5 rounded-lg bg-[#004E72] hover:bg-[#FF6E42] text-white transition"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        title="Eliminar foto"
                        className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-[#004E72]/40 rounded-xl space-y-1">
                <ImageIcon className="w-8 h-8 text-[#9bb5c2] mx-auto opacity-50" />
                <p className="text-xs text-[#9bb5c2]">Aún no hay imágenes añadidas.</p>
              </div>
            )}
          </div>

          {/* Section 4: Category Specific Metadata */}
          {type === "FIGURE" && (
            <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
              <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2 border-b border-[#004E72]/40 pb-3">
                <Sparkles className="w-4 h-4 text-[#FF6E42]" />
                Detalles Técnicos & Escala (Figuras)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Escala</label>
                  <select
                    value={figureScale}
                    onChange={(e) => setFigureScale(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  >
                    <option value="SCALE_1_7">Escala 1/7</option>
                    <option value="SCALE_1_4">Escala 1/4</option>
                    <option value="SCALE_1_6">Escala 1/6</option>
                    <option value="SCALE_1_8">Escala 1/8</option>
                    <option value="SCALE_1_12">Escala 1/12</option>
                    <option value="NON_SCALE">Non-Scale (Sin Escala / Myth Cloth / Prize)</option>
                    <option value="NENDOROID">Nendoroid</option>
                    <option value="POP_UP_PARADE">Pop Up Parade</option>
                    <option value="ACTION_FIGURE">Figura Articulada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Fabricante</label>
                  <select
                    value={figureManufacturer}
                    onChange={(e) => setFigureManufacturer(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Llegada Estimada</label>
                  <input
                    type="text"
                    value={figureArrivalDate}
                    onChange={(e) => setFigureArrivalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Materiales</label>
                  <input
                    type="text"
                    value={figureMaterial}
                    onChange={(e) => setFigureMaterial(e.target.value)}
                    placeholder="PVC & ABS pintado a mano"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Dimensiones</label>
                  <input
                    type="text"
                    value={figureDimensions}
                    onChange={(e) => setFigureDimensions(e.target.value)}
                    placeholder="28 cm de alto x 20 cm ancho"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Escultor</label>
                  <input
                    type="text"
                    value={figureSculptor}
                    onChange={(e) => setFigureSculptor(e.target.value)}
                    placeholder="Design COCO / eStream"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Condición del Empaque</label>
                  <input
                    type="text"
                    value={figureBoxCondition}
                    onChange={(e) => setFigureBoxCondition(e.target.value)}
                    placeholder="Caja sellada impecable de fábrica (Mint in Box)"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {type === "VIDEO_GAME" && (
            <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-5 shadow-xl">
              <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2 border-b border-[#004E72]/40 pb-3">
                <Gamepad2 className="w-4 h-4 text-[#FF6E42]" />
                Ficha de Especificaciones Técnicas del Videojuego
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
                        : "bg-[#05161f] border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/20 hover:text-white"
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
                        : "bg-[#05161f] border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/20 hover:text-white"
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
                    className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
                      !gameIsDigital
                        ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow-md ring-1 ring-[#FF6E42]"
                        : "bg-[#05161f] border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/20 hover:text-white"
                    }`}
                  >
                    <Disc className={`w-5 h-5 shrink-0 ${!gameIsDigital ? "text-[#FF6E42]" : "text-[#9bb5c2]"}`} />
                    <div>
                      <div className="text-xs font-bold">Formato Físico (Caja & Disco/Cartucho)</div>
                      <div className="text-[10px] opacity-80">Incluye caja sellada, disco Blu-ray o cartucho.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameIsDigital(true)}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
                      gameIsDigital
                        ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow-md ring-1 ring-[#FF6E42]"
                        : "bg-[#05161f] border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/20 hover:text-white"
                    }`}
                  >
                    <Download className={`w-5 h-5 shrink-0 ${gameIsDigital ? "text-[#FF6E42]" : "text-[#9bb5c2]"}`} />
                    <div>
                      <div className="text-xs font-bold">Formato Digital (Código Canjeable / Key)</div>
                      <div className="text-[10px] opacity-80">Licencia descargable para PS Store, eShop, Steam, Xbox.</div>
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
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Desarrolladora *</label>
                        <input
                          type="text"
                          value={gameDeveloper}
                          onChange={(e) => setGameDeveloper(e.target.value)}
                          placeholder="ej: Square Enix / FromSoftware / Capcom"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Distribuidora / Publisher *</label>
                        <input
                          type="text"
                          value={gamePublisher}
                          onChange={(e) => setGamePublisher(e.target.value)}
                          placeholder="ej: Sony Interactive / Square Enix / Nintendo"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Año de Lanzamiento</label>
                        <input
                          type="text"
                          value={gameReleaseYear}
                          onChange={(e) => setGameReleaseYear(e.target.value)}
                          placeholder="ej: 2024 / 2025 / 2026"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Género *</label>
                        <input
                          type="text"
                          value={gameGenre}
                          onChange={(e) => setGameGenre(e.target.value)}
                          placeholder="ej: Acción / RPG / Aventura / Lucha"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Modos de Juego</label>
                        <input
                          type="text"
                          value={gameModes}
                          onChange={(e) => setGameModes(e.target.value)}
                          placeholder="ej: Un jugador, Cooperativo local, Multijugador online"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Plataformas de Consola</label>
                        <input
                          type="text"
                          value={gameSupportedPlatforms}
                          onChange={(e) => setGameSupportedPlatforms(e.target.value)}
                          placeholder="ej: PlayStation 5, Xbox Series X|S, Nintendo Switch"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Plataforma Principal (Filtro)</label>
                        <select
                          value={gamePlatform}
                          onChange={(e) => setGamePlatform(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Idiomas Subtítulos (Textos)</label>
                        <input
                          type="text"
                          value={gameSubtitleLanguages}
                          onChange={(e) => setGameSubtitleLanguages(e.target.value)}
                          placeholder="ej: Español Latino, Inglés, Portugués, Francés"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                        <label className="text-xs text-[#9bb5c2]">Clasificación por Edad</label>
                        <input
                          type="text"
                          value={gameAgeRating}
                          onChange={(e) => setGameAgeRating(e.target.value)}
                          placeholder="ej: ESRB Teen (13+) / PEGI 16 / ESRB Mature 17+"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Modos de Visualización (PS5 / Xbox Series X)</label>
                        <input
                          type="text"
                          value={gameDisplayModes}
                          onChange={(e) => setGameDisplayModes(e.target.value)}
                          placeholder="ej: Modo Rendimiento (1440p-4K 60fps) / Modo Calidad (4K 30fps Ray Tracing)"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Optimización Xbox Series S</label>
                        <input
                          type="text"
                          value={gameXboxSeriesSOptimization}
                          onChange={(e) => setGameXboxSeriesSOptimization(e.target.value)}
                          placeholder="ej: 1080p 60fps dinámico optimizado"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Funciones Específicas de Hardware</label>
                        <input
                          type="text"
                          value={gameHardwareFeatures}
                          onChange={(e) => setGameHardwareFeatures(e.target.value)}
                          placeholder="ej: Gatillos adaptativos y hápticos DualSense, Audio 3D Tempest, SSD ultrarrápido"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Desarrolladora *</label>
                        <input
                          type="text"
                          value={gameDeveloper}
                          onChange={(e) => setGameDeveloper(e.target.value)}
                          placeholder="ej: Game Science / CD Projekt RED"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Distribuidora / Publisher *</label>
                        <input
                          type="text"
                          value={gamePublisher}
                          onChange={(e) => setGamePublisher(e.target.value)}
                          placeholder="ej: CD PROJEKT / Game Science / Valve"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Año de Lanzamiento</label>
                        <input
                          type="text"
                          value={gameReleaseYear}
                          onChange={(e) => setGameReleaseYear(e.target.value)}
                          placeholder="ej: 2024 / 2025 / 2026"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Género *</label>
                        <input
                          type="text"
                          value={gameGenre}
                          onChange={(e) => setGameGenre(e.target.value)}
                          placeholder="ej: ARPG / Acción / Mundo Abierto"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Modos de Juego</label>
                        <input
                          type="text"
                          value={gameModes}
                          onChange={(e) => setGameModes(e.target.value)}
                          placeholder="ej: Un jugador, Cooperativo online"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Plataformas de PC (Tiendas)</label>
                        <input
                          type="text"
                          value={gameSupportedPlatforms}
                          onChange={(e) => setGameSupportedPlatforms(e.target.value)}
                          placeholder="ej: Steam, Epic Games Store, GOG, EA App"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Edición</label>
                        <select
                          value={gameEdition}
                          onChange={(e) => setGameEdition(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Idiomas Subtítulos (Textos)</label>
                        <input
                          type="text"
                          value={gameSubtitleLanguages}
                          onChange={(e) => setGameSubtitleLanguages(e.target.value)}
                          placeholder="ej: Español Latino, Inglés, Francés, Alemán"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Clasificación por Edad</label>
                        <input
                          type="text"
                          value={gameAgeRating}
                          onChange={(e) => setGameAgeRating(e.target.value)}
                          placeholder="ej: ESRB Mature 17+ / PEGI 18"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Procesador (CPU) *</label>
                        <input
                          type="text"
                          value={gamePcProcessor}
                          onChange={(e) => setGamePcProcessor(e.target.value)}
                          placeholder="ej: Intel Core i7-12700K / AMD Ryzen 7 7800X3D"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Memoria RAM *</label>
                        <input
                          type="text"
                          value={gamePcRam}
                          onChange={(e) => setGamePcRam(e.target.value)}
                          placeholder="ej: 16 GB RAM (32 GB recomendado)"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                        <label className="text-xs text-[#9bb5c2]">Tarjeta Gráfica (GPU) *</label>
                        <input
                          type="text"
                          value={gamePcGpu}
                          onChange={(e) => setGamePcGpu(e.target.value)}
                          placeholder="ej: NVIDIA GeForce RTX 4070 12GB / AMD Radeon RX 7800 XT 16GB"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[#9bb5c2]">Almacenamiento *</label>
                        <input
                          type="text"
                          value={gamePcStorage}
                          onChange={(e) => setGamePcStorage(e.target.value)}
                          placeholder="ej: 85 GB de espacio libre en SSD NVMe"
                          className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 5: In-Game / Content Gallery */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-3">
              <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF6E42]" />
                Galería de Capturas de Gameplay / Contenido
              </h2>
              <span className="text-xs text-[#9bb5c2] font-mono">
                {contentGallery.length} {contentGallery.length === 1 ? "captura" : "capturas"}
              </span>
            </div>

            <p className="text-xs text-[#9bb5c2]">
              Imágenes de gameplay o detalles de la figura para el visor interactivo inferior con miniaturas activables.
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9bb5c2]" />
                  <input
                    type="url"
                    placeholder="URL de la captura de gameplay (ej: https://...)"
                    value={contentGalleryInput}
                    onChange={(e) => setContentGalleryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddContentGalleryImage();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] placeholder-[#9bb5c2]/50 focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddContentGalleryImage}
                  className="px-4 py-2 rounded-xl bg-[#004E72] hover:bg-[#FF6E42] text-[#F9F9F9] text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Captura
                </button>
              </div>

              {/* Botones para Subir desde el Equipo y desde Google Drive */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#9bb5c2]">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#05161f] border border-[#004E72]/60 hover:bg-[#004E72]/30 text-[#F9F9F9] transition shadow-sm">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F394C]/60 hover:bg-[#0F394C] border border-cyan-500/40 hover:border-cyan-400 text-[#F9F9F9] transition shadow-sm"
                >
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Subir desde Google Drive</span>
                </button>

                <span className="text-[11px]">
                  Formatos JPG, PNG, WebP o enlaces de Google Drive (convertidos a CDN directo automáticamente).
                </span>
              </div>

              {contentGallery.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {contentGallery.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-[#004E72]/50 bg-[#05161f] group"
                    >
                      <div className="w-full h-24 overflow-hidden flex items-center justify-center">
                        <img src={img} alt={`Captura ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <span className="absolute bottom-1 left-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-white">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveContentGalleryImage(idx)}
                        title="Eliminar captura"
                        className="absolute top-1 right-1 p-1 rounded bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#004E72]/10 border border-[#004E72]/30 text-center text-xs text-[#9bb5c2]">
                  No hay capturas de contenido agregadas aún.
                </div>
              )}
            </div>
          </div>

          {type === "COLLECTIBLE" && (
            <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
              <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2 border-b border-[#004E72]/40 pb-3">
                <Trophy className="w-4 h-4 text-[#FF6E42]" />
                Autenticación & Graduación TCG
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Entidad Certificadora</label>
                  <select
                    value={collectibleAuth}
                    onChange={(e) => setCollectibleAuth(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none cursor-pointer"
                  >
                    <option value="PSA">PSA (Professional Sports Authenticator)</option>
                    <option value="BGS">Beckett (BGS)</option>
                    <option value="CGC">CGC Cards</option>
                    <option value="NONE">Sin Certificar / Memorabilia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Condición / Nota</label>
                  <select
                    value={collectibleCondition}
                    onChange={(e) => setCollectibleCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none cursor-pointer"
                  >
                    <option value="GEM_MINT_10">Gem Mint 10</option>
                    <option value="MINT_9">Mint 9</option>
                    <option value="NEAR_MINT_8">Near Mint 8</option>
                    <option value="EXCELLENT_7">Excellent 7</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Número de Serie / Cert</label>
                  <input
                    type="text"
                    value={collectibleSerial}
                    onChange={(e) => setCollectibleSerial(e.target.value)}
                    placeholder="ej: PSA-88492019"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] font-mono focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
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

          {/* Submit, Delete and Cancel Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-6 rounded-xl bg-[#FF6E42] hover:bg-[#ff5421] disabled:opacity-50 text-[#F9F9F9] font-bold text-sm transition shadow-lg shadow-[#FF6E42]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {submitting ? "Guardando Cambios..." : "Guardar Cambios del Producto"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="py-3 px-4 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/50 text-red-300 hover:text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
            <Link
              href="/admin/products"
              className="py-3 px-4 rounded-xl bg-[#004E72]/30 hover:bg-[#004E72]/50 border border-[#004E72]/60 text-[#9bb5c2] hover:text-[#F9F9F9] text-xs font-semibold transition"
            >
              Cancelar
            </Link>
          </div>
        </form>

        {/* Live Preview Column */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#FF6E42] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Vista Previa en Vivo
            </span>
            <span className="text-[10px] text-[#9bb5c2] font-mono">Actualización en directo</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#092634]/40 border border-[#004E72]/40 shadow-inner">
            <ProductCard product={previewProduct} />
          </div>

          <div className="p-4 rounded-2xl bg-[#092634] border border-[#004E72]/40 space-y-2 text-xs">
            <h4 className="font-bold text-[#F9F9F9] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FF6E42]" /> Información de Publicación
            </h4>
            <p className="text-[#9bb5c2] leading-relaxed">
              Los cambios que guardes se sincronizarán directamente en la base de datos de productos y en Cloud Firestore.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Notification for Instant Feedback without Scrolling */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] p-4 rounded-2xl bg-[#092634]/95 border-2 border-emerald-500 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-200">
                  ¡Cambios guardados con éxito!
                </h4>
                <p className="text-xs text-[#9bb5c2] mt-0.5 line-clamp-1">
                  SKU: <span className="font-mono font-bold text-white">{sku}</span> • {name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-[#9bb5c2] hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#004E72]/50">
            <Link
              href={`/product/${sku.toLowerCase()}`}
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#092634] border border-red-500/50 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-[#F9F9F9]">¿Eliminar este producto?</h3>
            </div>
            <p className="text-xs text-[#9bb5c2] leading-relaxed">
              Estás a punto de eliminar definitivamente <strong className="text-white font-mono">{sku}</strong> del catálogo de la tienda y de Cloud Firestore. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-[#004E72]/30 hover:bg-[#004E72]/50 text-[#9bb5c2] hover:text-[#F9F9F9] text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/30 flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirmar Eliminación
                  </>
                )}
              </button>
            </div>
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

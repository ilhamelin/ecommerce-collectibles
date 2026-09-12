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
} from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
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
} from "@/lib/types/domain";
import { formatCLP, formatCLPShort } from "@/lib/utils/currency";
import { getAdminHeaders } from "@/lib/auth/security";
import { saveProductToFirestoreClient, deleteProductFromFirestoreClient } from "@/lib/firebase/client-firestore";

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
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stockAvailable, setStockAvailable] = useState<number>(0);
  const [isPreOrder, setIsPreOrder] = useState<boolean>(false);
  const [preOrderState, setPreOrderState] = useState<string>("PREORDER_OPEN");

  // Multimedia & Badges
  const [trailerUrl, setTrailerUrl] = useState("");
  const [ageRating, setAgeRating] = useState("14+ 14 AÑOS O MÁS");
  const [genresInput, setGenresInput] = useState("");

  // Images State (Cover & Main Carrousel)
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // In-Game / Content Gallery State (Gameplay captures / high-res details)
  const [contentGallery, setContentGallery] = useState<string[]>([]);
  const [contentGalleryInput, setContentGalleryInput] = useState("");

  const handleAddContentGalleryImage = () => {
    if (contentGalleryInput.trim()) {
      setContentGallery((prev) => [...prev, contentGalleryInput.trim()]);
      setContentGalleryInput("");
    }
  };

  const handleRemoveContentGalleryImage = (indexToRemove: number) => {
    setContentGallery((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Dynamic: Game Technical Specs
  const [gamePlatform, setGamePlatform] = useState<GamePlatform>("PS5");
  const [gameEdition, setGameEdition] = useState<GameEdition>("STANDARD");
  const [gamePublisher, setGamePublisher] = useState("Bandai Namco");
  const [gameIsDigital, setGameIsDigital] = useState(false);
  const [gameAudioLanguages, setGameAudioLanguages] = useState("Español - Inglés");
  const [gameSubtitleLanguages, setGameSubtitleLanguages] = useState("Español - Inglés");
  const [gamePlayers, setGamePlayers] = useState("1 Jugador");
  const [gameFileSize, setGameFileSize] = useState("");
  const [gameResolution, setGameResolution] = useState("");

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
          setType(p.type);
          setPrice(p.price);
          setOriginalPrice(p.originalPrice);
          setCostPrice(p.costPrice);
          setStockAvailable(p.stockAvailable);
          setIsPreOrder(Boolean(p.isPreOrder));
          setPreOrderState(p.preOrderState || "PREORDER_OPEN");
          setTrailerUrl(p.trailerUrl || "");
          setAgeRating(p.ageRating || "14+ 14 AÑOS O MÁS");
          setGenresInput(p.genres && p.genres.length > 0 ? p.genres.join(", ") : "");
          setContentGallery(p.contentGallery || []);

          const prodImages = p.images && p.images.length > 0 ? p.images : p.imageUrl ? [p.imageUrl] : [];
          setImages(prodImages);

          if (p.gameMetadata) {
            setGamePlatform(p.gameMetadata.platform);
            setGameEdition(p.gameMetadata.edition);
            setGamePublisher(p.gameMetadata.publisher);
            setGameIsDigital(Boolean(p.gameMetadata.isDigital));
            setGameAudioLanguages(p.gameMetadata.audioLanguages || "Español - Inglés");
            setGameSubtitleLanguages(p.gameMetadata.subtitleLanguages || "Español - Inglés");
            setGamePlayers(p.gameMetadata.players || "1 Jugador");
            setGameFileSize(p.gameMetadata.fileSize || "");
            setGameResolution(p.gameMetadata.resolution || "");
          }
          if (p.figureMetadata) {
            setFigureScale(p.figureMetadata.scale);
            setFigureManufacturer(p.figureMetadata.manufacturer);
            setFigureArrivalDate(p.figureMetadata.estimatedArrivalDate || "Noviembre 2026");
            setFigureDepositPercent(p.figureMetadata.minimumDepositPercent ?? 0.2);
            setFigureMaterial(p.figureMetadata.material || "");
            setFigureDimensions(p.figureMetadata.dimensions || "");
            setFigureSculptor(p.figureMetadata.sculptor || "");
            setFigureBoxCondition(p.figureMetadata.boxCondition || "");
          }
          if (p.collectibleMetadata) {
            setCollectibleCategory(p.collectibleMetadata.category);
            setCollectibleCondition(p.collectibleMetadata.condition);
            setCollectibleLanguage(p.collectibleMetadata.cardLanguage || "English");
            setCollectibleAuth(p.collectibleMetadata.authenticationBody);
            setCollectibleSerial(p.collectibleMetadata.serialNumber || "");
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
      setImages((prev) => [...prev, imageUrlInput.trim()]);
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

  // Preview Domain Entity
  const previewProduct: ProductDomainEntity = useMemo(() => {
    const genresList = genresInput
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    return {
      id: productId,
      sku: sku || "PROD-SAMPLE",
      name: name || "Nombre del Producto",
      description: description || "Descripción detallada del producto.",
      type,
      price: price || 0,
      originalPrice: originalPrice && originalPrice > 0 ? originalPrice : undefined,
      costPrice: costPrice || 0,
      stockAvailable: stockAvailable || 0,
      stockReserved: 0,
      isPreOrder,
      preOrderState: isPreOrder ? (preOrderState as any) : undefined,
      imageUrl: images.length > 0 ? images[0] : undefined,
      images,
      trailerUrl: trailerUrl.trim() || undefined,
      ageRating: ageRating.trim() || undefined,
      genres: genresList.length > 0 ? genresList : undefined,
      contentGallery: contentGallery.length > 0 ? contentGallery : undefined,
      gameMetadata:
        type === "VIDEO_GAME"
          ? {
              id: "preview-gm",
              productId,
              platform: gamePlatform,
              edition: gameEdition,
              isDigital: gameIsDigital,
              publisher: gamePublisher,
              audioLanguages: gameAudioLanguages,
              subtitleLanguages: gameSubtitleLanguages,
              players: gamePlayers,
              fileSize: gameFileSize,
              resolution: gameResolution,
            }
          : undefined,
      figureMetadata:
        type === "FIGURE"
          ? {
              id: "preview-fig",
              productId,
              scale: figureScale,
              manufacturer: figureManufacturer,
              estimatedArrivalDate: figureArrivalDate,
              allowsPartialDeposit: true,
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
              id: "preview-col",
              productId,
              category: collectibleCategory,
              condition: collectibleCondition,
              cardLanguage: collectibleLanguage,
              authenticationBody: collectibleAuth,
              serialNumber: collectibleSerial,
            }
          : undefined,
    };
  }, [
    productId,
    sku,
    name,
    description,
    type,
    price,
    originalPrice,
    costPrice,
    stockAvailable,
    isPreOrder,
    preOrderState,
    images,
    trailerUrl,
    ageRating,
    genresInput,
    contentGallery,
    gamePlatform,
    gameEdition,
    gameIsDigital,
    gamePublisher,
    gameAudioLanguages,
    gameSubtitleLanguages,
    gamePlayers,
    gameFileSize,
    gameResolution,
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
  ]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!sku.trim()) {
      setErrorMsg("El SKU es obligatorio.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("El nombre del producto es obligatorio.");
      return;
    }
    if (price <= 0) {
      setErrorMsg("El precio de venta debe ser mayor a 0 CLP.");
      return;
    }

    setSubmitting(true);

    const genresList = genresInput
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    try {
      const payload: any = {
        id: productId,
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        type,
        price: Math.round(price),
        originalPrice: originalPrice && Number(originalPrice) > 0 ? Number(originalPrice) : undefined,
        costPrice: Math.round(costPrice),
        stockAvailable: Math.max(0, stockAvailable),
        isPreOrder,
        preOrderState: isPreOrder ? preOrderState : undefined,
        images,
        imageUrl: images.length > 0 ? images[0] : undefined,
        trailerUrl: trailerUrl.trim() || undefined,
        ageRating: ageRating.trim() || undefined,
        genres: genresList.length > 0 ? genresList : undefined,
        contentGallery: contentGallery.length > 0 ? contentGallery : undefined,
      };

      if (type === "VIDEO_GAME") {
        payload.gameMetadata = {
          platform: gamePlatform,
          edition: gameEdition,
          isDigital: gameIsDigital,
          publisher: gamePublisher,
          audioLanguages: gameAudioLanguages || undefined,
          subtitleLanguages: gameSubtitleLanguages || undefined,
          players: gamePlayers || undefined,
          fileSize: gameFileSize || undefined,
          resolution: gameResolution || undefined,
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

      setSuccessMsg(`¡Producto ${sku} actualizado con éxito! Los cambios ya están disponibles en el catálogo.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Error inesperado al actualizar el producto.");
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
      <div className="border-b border-[#004E72]/40 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#FF6E42] uppercase tracking-wider">
          <Save className="w-4 h-4" />
          Modificación de Catálogo
        </div>
        <h1 className="text-3xl font-black text-[#F9F9F9] tracking-tight">
          Editar Producto: <span className="text-[#FF6E42]">{sku}</span>
        </h1>
        <p className="text-sm text-[#9bb5c2]">
          Actualiza precios en CLP, stock, modalidad de preventa, fotos e imágenes y metadatos de coleccionista.
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
            <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2 border-b border-[#004E72]/40 pb-3">
              <Package className="w-4 h-4 text-[#FF6E42]" />
              Información Básica del Producto
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  onChange={(e) => setType(e.target.value as ProductType)}
                  className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none cursor-pointer"
                >
                  <option value="VIDEO_GAME">Videojuegos</option>
                  <option value="FIGURE">Figuras de Escala</option>
                  <option value="COLLECTIBLE">TCG & Rarezas PSA</option>
                  <option value="BUNDLE">Bundle Compuesto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">
                  Stock Físico Disponible *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockAvailable}
                  onChange={(e) => setStockAvailable(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] font-mono focus:border-[#FF6E42] focus:outline-none"
                />
              </div>
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

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#9bb5c2]">
                  Clasificación de Edad / Sello
                </label>
                <input
                  type="text"
                  value={ageRating}
                  onChange={(e) => setAgeRating(e.target.value)}
                  placeholder="14+ 14 AÑOS O MÁS"
                  className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                />
                <p className="text-[10px] text-[#9bb5c2]">
                  Badge oficial regulatorio (14+, 18+, TE).
                </p>
              </div>

              <div className="sm:col-span-3 space-y-1">
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
            </div>
          </div>

          {/* Section 2: Pricing & Pre-Order in CLP */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2 border-b border-[#004E72]/40 pb-3">
              <Sparkles className="w-4 h-4 text-[#FF6E42]" />
              Precios en Moneda Chilena (CLP) & Modalidad
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">
                  Precio Oferta / Venta (CLP) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9bb5c2] font-mono">$</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] font-mono font-bold focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-[#9bb5c2] mt-1 block">
                  {formatCLP(price)}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#9bb5c2]">
                    Precio Normal / Lista
                  </label>
                  {originalPrice && originalPrice > price && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-500/40 px-1.5 py-0.2 rounded">
                      -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
                    </span>
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
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] font-mono focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-[#9bb5c2] mt-1 block">
                  {originalPrice ? `Tachado: ${formatCLP(originalPrice)}` : "Opcional (para mostrar % OFF)"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">
                  Costo Unitario (CLP) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9bb5c2] font-mono">$</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] font-mono focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-[#9bb5c2] mt-1 block">
                  Margen: {price > 0 ? (((price - costPrice) / price) * 100).toFixed(1) : 0}%
                </span>
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

              <div className="flex items-center gap-3 text-xs text-[#9bb5c2]">
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
                    <option value="SCALE_1_8">Escala 1/8</option>
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
                    <option value="BANPRESTO">Banpresto</option>
                    <option value="KOTOBUKIYA">Kotobukiya</option>
                    <option value="ALTER">Alter</option>
                    <option value="MEGAHOUSE">Megahouse</option>
                    <option value="MAX_FACTORY">Max Factory</option>
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
            <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
              <h2 className="text-base font-bold text-[#F9F9F9] flex items-center gap-2 border-b border-[#004E72]/40 pb-3">
                <Gamepad2 className="w-4 h-4 text-[#FF6E42]" />
                Ficha de Especificaciones Técnicas del Videojuego
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Plataforma</label>
                  <select
                    value={gamePlatform}
                    onChange={(e) => setGamePlatform(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  >
                    <option value="PS5">PlayStation 5</option>
                    <option value="NINTENDO_SWITCH">Nintendo Switch</option>
                    <option value="PC">PC</option>
                    <option value="XBOX_SERIES">Xbox Series X|S</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Edición</label>
                  <select
                    value={gameEdition}
                    onChange={(e) => setGameEdition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  >
                    <option value="STANDARD">Estándar</option>
                    <option value="DELUXE">Deluxe</option>
                    <option value="COLLECTORS">Coleccionista</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Fabricante / Publisher</label>
                  <input
                    type="text"
                    value={gamePublisher}
                    onChange={(e) => setGamePublisher(e.target.value)}
                    placeholder="Nintendo / Capcom / Sony"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Idioma Audio (Voces)</label>
                  <input
                    type="text"
                    value={gameAudioLanguages}
                    onChange={(e) => setGameAudioLanguages(e.target.value)}
                    placeholder="Español - Inglés"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Idioma Subtítulos</label>
                  <input
                    type="text"
                    value={gameSubtitleLanguages}
                    onChange={(e) => setGameSubtitleLanguages(e.target.value)}
                    placeholder="Español - Inglés"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">N° de Jugadores</label>
                  <input
                    type="text"
                    value={gamePlayers}
                    onChange={(e) => setGamePlayers(e.target.value)}
                    placeholder="1 Jugador"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Espacio en Disco</label>
                  <input
                    type="text"
                    value={gameFileSize}
                    onChange={(e) => setGameFileSize(e.target.value)}
                    placeholder="55 GB"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#9bb5c2] mb-1">Resolución / Rendimiento</label>
                  <input
                    type="text"
                    value={gameResolution}
                    onChange={(e) => setGameResolution(e.target.value)}
                    placeholder="4K 60fps / Ray Tracing"
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
              </div>
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
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#05161f] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:border-[#FF6E42] focus:outline-none"
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

          {/* Submit, Delete and Cancel Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-6 rounded-xl bg-[#FF6E42] hover:bg-[#ff5421] disabled:opacity-50 text-[#F9F9F9] font-bold text-sm transition shadow-lg shadow-[#FF6E42]/25 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {submitting ? "Guardando Cambios..." : "Guardar Cambios del Producto"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-3 rounded-xl bg-red-950/40 hover:bg-red-600 text-red-300 hover:text-white font-bold text-xs border border-red-500/50 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
            <Link
              href="/admin/products"
              className="px-5 py-3 rounded-xl bg-[#05161f] hover:bg-[#004E72]/40 text-[#9bb5c2] hover:text-[#F9F9F9] font-medium text-xs border border-[#004E72]/60 transition text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>

        {/* Live Preview Column */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FF6E42] uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            Vista Previa en Tienda (En Vivo)
          </div>
          <p className="text-[11px] text-[#9bb5c2]">
            Así es exactamente como los clientes verán esta tarjeta en el catálogo público con los datos actuales.
          </p>

          <div className="p-3 rounded-2xl bg-[#05161f] border border-[#004E72]/60 shadow-2xl">
            <ProductCard product={previewProduct} />
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#092634] border-2 border-red-500/60 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/20">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¿Eliminar Producto de Firestore?</h3>
                <p className="text-xs text-[#9bb5c2] font-mono">{sku}</p>
              </div>
            </div>
            <p className="text-xs text-[#d1e1e9] leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente <strong>{name || sku}</strong>? Se borrará el documento en Cloud Firestore y dejará de mostrarse en la tienda.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-[#05161f] border border-[#004E72] text-xs font-bold text-[#9bb5c2] hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-2"
              >
                {deleting ? (
                  <span>Borrando de Firestore...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Eliminar Producto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

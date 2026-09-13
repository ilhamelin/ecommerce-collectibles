"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Gamepad2,
  Trophy,
  Layers,
  Clock,
  Boxes,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Cloud,
  Database,
  CheckCircle,
  Trash2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  X,
} from "lucide-react";
import { ProductDomainEntity, ProductType } from "@/lib/types/domain";
import { formatCLP } from "@/lib/utils/currency";
import { getAdminHeaders } from "@/lib/auth/security";
import { useAuthStore } from "@/lib/store/authStore";

export default function AdminProductsListPage() {
  const { currentUser, login } = useAuthStore();
  const [products, setProducts] = useState<ProductDomainEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [firebaseStatus, setFirebaseStatus] = useState<{
    mode: "FIREBASE_CLOUD" | "LOCAL_FALLBACK";
    message: string;
    firebaseClientConfigured: boolean;
    firebaseAdminConfigured: boolean;
  } | null>(null);
  const [syncingFirebase, setSyncingFirebase] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Delete State
  const [productToDelete, setProductToDelete] = useState<ProductDomainEntity | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  const handleDeleteProduct = async (product: ProductDomainEntity) => {
    setDeletingId(product.id);
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(product.id)}`, {
        method: "DELETE",
        headers: { ...getAdminHeaders() },
      });
      const data = await res.json();
      if (data.success) {
        setDeleteMsg(`¡Producto ${product.sku} eliminado con éxito de Cloud Firestore!`);
        setTimeout(() => setDeleteMsg(null), 4000);
        loadProducts();
      } else {
        alert(data.error || "No se pudo eliminar el producto.");
      }
    } catch (err) {
      alert("Error de conexión al eliminar el producto de Firestore.");
    } finally {
      setDeletingId(null);
      setProductToDelete(null);
    }
  };

  const loadProducts = () => {
    setLoading(true);
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.products)) {
          setProducts(data.data.products);
        }
      })
      .catch((err) => console.error("Error cargando productos:", err))
      .finally(() => setLoading(false));
  };

  const checkFirebaseStatus = () => {
    fetch("/api/admin/seed-firebase")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.status) {
          setFirebaseStatus(data.status);
        }
      })
      .catch(() => {});
  };

  const handleSyncFirebase = async () => {
    setSyncingFirebase(true);
    setSyncFeedback(null);
    try {
      const res = await fetch("/api/admin/seed-firebase", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback(`✅ ¡Éxito! ${data.productsSynced} productos sincronizados en Cloud Firestore.`);
        checkFirebaseStatus();
      } else {
        setSyncFeedback(`ℹ️ ${data.error || "Firebase no tiene credenciales en .env.local aún."}`);
      }
    } catch (err: any) {
      setSyncFeedback("❌ Error al comunicarse con el endpoint de Firebase.");
    } finally {
      setSyncingFirebase(false);
    }
  };

  useEffect(() => {
    loadProducts();
    checkFirebaseStatus();
  }, []);

  type SortKey = "sku_name" | "type" | "price" | "costPrice" | "margin" | "stock";
  type SortOrder = "asc" | "desc";

  const [sortKey, setSortKey] = useState<SortKey>("sku_name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder(key === "price" || key === "costPrice" || key === "margin" || key === "stock" ? "desc" : "asc");
    }
  };

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      // Category filter matching standard types and custom categories
      if (selectedType !== "ALL") {
        if (p.type === selectedType) {
          // direct standard match
        } else if (p.type === "OTHER") {
          const l = (p.customCategoryLabel || "").toLowerCase();
          const specCat = (p.customSpecifications?.categoryType || "").toUpperCase();
          if (selectedType === "OTHER") {
            // matches any other
          } else if (selectedType === "CONSOLE" && (specCat === "CONSOLE" || l.includes("consola") || l.includes("hardware"))) {
            // matches console
          } else if (selectedType === "GAMING_ACCESSORY" && (specCat === "GAMING_ACCESSORY" || l.includes("accesorio") || l.includes("gaming") || l.includes("mouse") || l.includes("teclado") || l.includes("audifono"))) {
            // matches gaming accessory
          } else if (selectedType === "APPAREL" && (specCat === "APPAREL" || l.includes("ropa") || l.includes("estilo") || l.includes("poleron") || l.includes("polera"))) {
            // matches apparel
          } else if (selectedType === "BOOK" && (specCat === "BOOK" || l.includes("manga") || l.includes("artbook") || l.includes("libro"))) {
            // matches book / manga
          } else if (selectedType === "MERCH" && (specCat === "MERCH" || l.includes("merch") || l.includes("decoraci") || l.includes("peluche"))) {
            // matches merch
          } else if (selectedType === "AUDIO" && (specCat === "AUDIO" || l.includes("audio") || l.includes("ost") || l.includes("vinilo"))) {
            // matches audio
          } else {
            return false;
          }
        } else {
          return false;
        }
      }

      // Comprehensive search query matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const searchParts = [
          p.name || "",
          p.sku || "",
          p.description || "",
          p.customCategoryLabel || "",
          p.customSpecifications?.console?.baseModel || "",
          p.customSpecifications?.console?.format || "",
          p.customSpecifications?.gamingAccessory?.mouse?.brand || "",
          p.customSpecifications?.gamingAccessory?.mouse?.tracking || "",
          p.customSpecifications?.gamingAccessory?.keyboard?.brand || "",
          p.customSpecifications?.gamingAccessory?.headset?.type || "",
          p.customSpecifications?.apparel?.material || "",
          p.customSpecifications?.book?.publisher || "",
          p.customSpecifications?.merch?.franchise || "",
          p.customSpecifications?.audio?.recordLabel || "",
        ].join(" ").toLowerCase();

        return searchParts.includes(q);
      }
      return true;
    });

    list.sort((a, b) => {
      let comparison = 0;
      if (sortKey === "sku_name") {
        comparison = a.sku.localeCompare(b.sku) || a.name.localeCompare(b.name);
      } else if (sortKey === "type") {
        const labelA = a.type === "OTHER" ? (a.customCategoryLabel || "OTRA") : a.type;
        const labelB = b.type === "OTHER" ? (b.customCategoryLabel || "OTRA") : b.type;
        comparison = labelA.localeCompare(labelB);
      } else if (sortKey === "price") {
        comparison = a.price - b.price;
      } else if (sortKey === "costPrice") {
        comparison = a.costPrice - b.costPrice;
      } else if (sortKey === "margin") {
        const marginA = a.price - a.costPrice;
        const marginB = b.price - b.costPrice;
        comparison = marginA - marginB;
      } else if (sortKey === "stock") {
        const stockA = a.type === "BUNDLE" ? (a.calculatedAvailableStock ?? 0) : Math.max(0, a.stockAvailable - a.stockReserved);
        const stockB = b.type === "BUNDLE" ? (b.calculatedAvailableStock ?? 0) : Math.max(0, b.stockAvailable - b.stockReserved);
        comparison = stockA - stockB;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return list;
  }, [products, selectedType, searchQuery, sortKey, sortOrder]);

  // Real-time counts for categories
  const adminCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: products.length,
      VIDEO_GAME: 0,
      FIGURE: 0,
      COLLECTIBLE: 0,
      BUNDLE: 0,
      CONSOLE: 0,
      GAMING_ACCESSORY: 0,
      APPAREL: 0,
      BOOK: 0,
      MERCH: 0,
      AUDIO: 0,
      OTHER: 0,
    };
    for (const p of products) {
      if (p.type === "VIDEO_GAME") counts.VIDEO_GAME++;
      else if (p.type === "FIGURE") counts.FIGURE++;
      else if (p.type === "COLLECTIBLE") counts.COLLECTIBLE++;
      else if (p.type === "BUNDLE") counts.BUNDLE++;
      else if (p.type === "OTHER") {
        const specCat = (p.customSpecifications?.categoryType || "").toUpperCase();
        const l = (p.customCategoryLabel || "").toLowerCase();
        if (specCat === "CONSOLE" || l.includes("consola") || l.includes("hardware")) counts.CONSOLE++;
        else if (specCat === "GAMING_ACCESSORY" || l.includes("accesorio") || l.includes("gaming") || l.includes("mouse") || l.includes("teclado") || l.includes("audifono")) counts.GAMING_ACCESSORY++;
        else if (specCat === "APPAREL" || l.includes("ropa") || l.includes("estilo")) counts.APPAREL++;
        else if (specCat === "BOOK" || l.includes("manga") || l.includes("artbook") || l.includes("libro")) counts.BOOK++;
        else if (specCat === "MERCH" || l.includes("merch") || l.includes("decoraci")) counts.MERCH++;
        else if (specCat === "AUDIO" || l.includes("audio") || l.includes("ost") || l.includes("soundtrack")) counts.AUDIO++;
        else counts.OTHER++;
      }
    }
    return counts;
  }, [products]);

  const getCategoryLabel = (id: string) => {
    switch (id) {
      case "VIDEO_GAME": return "Videojuegos";
      case "FIGURE": return "Figuras";
      case "COLLECTIBLE": return "TCG / Rarezas";
      case "BUNDLE": return "Bundles";
      case "CONSOLE": return "Consolas / Hardware";
      case "GAMING_ACCESSORY": return "Accesorios Gaming";
      case "APPAREL": return "Ropa & Estilo";
      case "BOOK": return "Manga / Libros";
      case "MERCH": return "Merchandising";
      case "AUDIO": return "Audio / OST";
      case "OTHER": return "Otras";
      default: return "Todas las Categorías";
    }
  };

  // KPIs
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stockAvailable || 0), 0);
  const totalInventoryValueCLP = products.reduce(
    (acc, p) => acc + (p.price || 0) * (p.stockAvailable || 0),
    0
  );
  const preOrderCount = products.filter((p) => p.isPreOrder).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with direct Action to Create */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#FF6B35] uppercase tracking-wider">
            <Package className="w-4 h-4" />
            Control de Catálogo • E-Commerce Especializado
          </div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
            Inventario & Gestión de Productos
          </h1>
          <p className="text-sm text-[#555555]">
            Administra precios en CLP, stock disponible, preventas con pie y sincronización con la tienda pública.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            title="Refrescar catálogo"
            className="p-2.5 rounded-xl bg-white border border-[#E5E5E5] text-[#555555] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#FF6B35]" : ""}`} />
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e05622] text-white text-xs font-bold transition shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            Agregar Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Role State Banner */}
      {currentUser?.role === "ADMIN" ? (
        <div className="p-4 rounded-2xl bg-[#092634] border border-emerald-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400 tracking-wider uppercase">Sesión de Administrador Autorizada</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">ROL: ADMIN</span>
              </div>
              <p className="text-xs text-[#9bb5c2]">
                Conectado como <strong className="text-[#F9F9F9]">{currentUser.fullName}</strong> ({currentUser.email}). Control total de catálogo, edición de precios CLP e inventario.
              </p>
            </div>
          </div>
          <Link
            href="/account"
            className="text-xs font-bold text-[#FF6E42] hover:underline"
          >
            Ver Mi Cuenta &rarr;
          </Link>
        </div>
      ) : currentUser?.role === "CUSTOMER" ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 tracking-wider uppercase">Modo Cliente Registrado (Solo Lectura)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">ROL: CUSTOMER</span>
              </div>
              <p className="text-xs text-[#9bb5c2]">
                Has iniciado sesión como usuario cliente (<strong className="text-[#F9F9F9]">{currentUser.fullName}</strong>). Puedes explorar las herramientas o cambiar a la cuenta admin de prueba.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => login("admin@omnicollector.cl", "admin123")}
              className="px-3 py-1.5 rounded-lg bg-[#FF6E42] hover:bg-[#ff5421] text-[#092634] text-xs font-black transition"
            >
              Cambiar a Admin Demo
            </button>
            <Link
              href="/account"
              className="px-3 py-1.5 rounded-lg bg-[#092634] border border-[#004E72] text-xs font-bold text-[#F9F9F9] hover:bg-[#004E72]/40 transition"
            >
              Mi Cuenta
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#092634] border border-[#004E72]/40 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#004E72]/30 flex items-center justify-center text-[#9bb5c2]">
              <UserCheck className="w-5 h-5" />
            </div>
            <p className="text-xs text-[#9bb5c2]">
              Modo Demo: Para probar la experiencia de cliente vs admin, inicia sesión en <strong className="text-[#F9F9F9]">Mi Cuenta</strong> con las credenciales demo.
            </p>
          </div>
          <button
            onClick={() => login("admin@omnicollector.cl", "admin123")}
            className="px-3 py-1.5 rounded-lg bg-[#004E72] hover:bg-[#004E72]/80 text-[#F9F9F9] text-xs font-bold transition"
          >
            Acceso Rápido Admin Demo
          </button>
        </div>
      )}

      {/* Firebase Cloud Database Status Strip */}
      <div className="p-4 rounded-2xl bg-[#092634] border border-[#004E72]/50 flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            firebaseStatus?.mode === "FIREBASE_CLOUD"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
          }`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#F9F9F9] tracking-wider uppercase flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-[#FF6E42]" />
                Base de Datos Firebase (Cloud Firestore)
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                firebaseStatus?.mode === "FIREBASE_CLOUD"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}>
                {firebaseStatus?.mode === "FIREBASE_CLOUD" ? "🟢 CLOUD FIRESTORE ACTIVO" : "🟡 MODO LOCAL FALLBACK (Preparado)"}
              </span>
            </div>
            <p className="text-xs text-[#9bb5c2] mt-0.5">
              {firebaseStatus?.mode === "FIREBASE_CLOUD"
                ? "Conexión a Firebase activa. Todas las lecturas y escrituras de productos y órdenes se sincronizan en la nube."
                : "Sistema preparado para Firebase. Ingresa tus claves en el archivo .env.local cuando crees tu proyecto en console.firebase.google.com."}
            </p>
            <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {syncFeedback ? syncFeedback : (
                firebaseStatus?.mode === "FIREBASE_CLOUD"
                  ? `¡Éxito! ${products.length} productos sincronizados en Cloud Firestore.`
                  : `Catálogo activo con ${products.length} productos disponibles en la base de datos.`
              )}
            </p>
            {deleteMsg && (
              <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                {deleteMsg}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleSyncFirebase}
          disabled={syncingFirebase}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#004E72] hover:bg-[#004E72]/80 text-[#F9F9F9] text-xs font-bold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncingFirebase ? "animate-spin text-[#FF6E42]" : ""}`} />
          {syncingFirebase ? "Sincronizando..." : "Sincronizar Catálogo a Firebase"}
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-1 shadow-md">
          <span className="text-[11px] font-medium text-[#9bb5c2] block">Productos Registrados</span>
          <span className="text-2xl sm:text-3xl font-black text-[#F9F9F9] font-mono">
            {products.length}
          </span>
          <span className="text-[10px] text-[#9bb5c2] block">Catálogo activo</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-1 shadow-md">
          <span className="text-[11px] font-medium text-[#9bb5c2] block">Unidades en Inventario</span>
          <span className="text-2xl sm:text-3xl font-black text-[#FF6E42] font-mono">
            {totalStockUnits}
          </span>
          <span className="text-[10px] text-[#9bb5c2] block">Disponibles para venta física</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-1 shadow-md">
          <span className="text-[11px] font-medium text-[#9bb5c2] block">Valorización Inventario (CLP)</span>
          <span className="text-xl sm:text-2xl font-black text-[#F9F9F9] font-mono">
            {formatCLP(totalInventoryValueCLP)}
          </span>
          <span className="text-[10px] text-[#9bb5c2] block">PVP estimado en Chile</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-1 shadow-md">
          <span className="text-[11px] font-medium text-[#9bb5c2] block">Líneas de Preventa</span>
          <span className="text-2xl sm:text-3xl font-black text-[#F9F9F9] font-mono">
            {preOrderCount}
          </span>
          <span className="text-[10px] text-[#9bb5c2] block">Con reserva de pie parcial</span>
        </div>
      </div>

      {/* Filter & Search Strip */}
      <div className="p-4 rounded-2xl bg-[#092634] border border-[#004E72]/50 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search input with clean icon & clear button */}
          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="w-4 h-4 text-[#9bb5c2] absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por SKU, nombre, marca o especificaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#004E72]/25 border border-[#004E72]/60 text-xs text-[#F9F9F9] placeholder-[#9bb5c2] focus:outline-none focus:border-[#FF6E42] transition shadow-inner"
            />
            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 p-1 rounded-lg text-[#9bb5c2] hover:text-[#F9F9F9] hover:bg-[#004E72]/50 transition"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right side: Category Dropdown & Quick Actions */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Filter className="w-3.5 h-3.5 text-[#FF6E42] absolute left-3.5 top-3.5 pointer-events-none" />
              <select
                id="admin-category-select"
                aria-label="Filtrar por categoría"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#004E72]/30 hover:bg-[#004E72]/45 border border-[#004E72]/70 text-xs font-semibold text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42] cursor-pointer shadow-sm appearance-none transition"
              >
                <option value="ALL" className="bg-[#092634] text-[#F9F9F9]">
                  Todas las Categorías ({adminCategoryCounts.ALL})
                </option>
                <optgroup label="── Categorías Principales ──" className="bg-[#092634] text-[#FF6E42] font-bold">
                  <option value="VIDEO_GAME" className="bg-[#092634] text-[#F9F9F9]">
                    🎮 Videojuegos ({adminCategoryCounts.VIDEO_GAME})
                  </option>
                  <option value="FIGURE" className="bg-[#092634] text-[#F9F9F9]">
                    🎎 Figuras de Escala ({adminCategoryCounts.FIGURE})
                  </option>
                  <option value="COLLECTIBLE" className="bg-[#092634] text-[#F9F9F9]">
                    🏆 TCG & Rarezas PSA ({adminCategoryCounts.COLLECTIBLE})
                  </option>
                  <option value="BUNDLE" className="bg-[#092634] text-[#F9F9F9]">
                    📦 Bundles Compuestos ({adminCategoryCounts.BUNDLE})
                  </option>
                </optgroup>
                <optgroup label="── Categorías Especializadas ──" className="bg-[#092634] text-[#FF6E42] font-bold">
                  <option value="CONSOLE" className="bg-[#092634] text-[#F9F9F9]">
                    🖥️ Consolas / Hardware ({adminCategoryCounts.CONSOLE})
                  </option>
                  <option value="GAMING_ACCESSORY" className="bg-[#092634] text-[#F9F9F9]">
                    🎧 Accesorios Gaming ({adminCategoryCounts.GAMING_ACCESSORY})
                  </option>
                  <option value="APPAREL" className="bg-[#092634] text-[#F9F9F9]">
                    👕 Ropa & Estilo ({adminCategoryCounts.APPAREL})
                  </option>
                  <option value="BOOK" className="bg-[#092634] text-[#F9F9F9]">
                    📖 Manga / Artbooks ({adminCategoryCounts.BOOK})
                  </option>
                  <option value="MERCH" className="bg-[#092634] text-[#F9F9F9]">
                    🎁 Merchandising ({adminCategoryCounts.MERCH})
                  </option>
                  <option value="AUDIO" className="bg-[#092634] text-[#F9F9F9]">
                    💿 Audio / OST ({adminCategoryCounts.AUDIO})
                  </option>
                  <option value="OTHER" className="bg-[#092634] text-[#F9F9F9]">
                    🧩 Otras Categorías ({adminCategoryCounts.OTHER})
                  </option>
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-[#9bb5c2] absolute right-3 top-3.5 pointer-events-none" />
            </div>

            {(selectedType !== "ALL" || searchQuery.trim() !== "") && (
              <button
                onClick={() => {
                  setSelectedType("ALL");
                  setSearchQuery("");
                }}
                className="px-3 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-semibold transition shrink-0 flex items-center gap-1.5 shadow-sm"
                title="Restablecer todos los filtros"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips Strip */}
        {(selectedType !== "ALL" || searchQuery.trim() !== "") && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#004E72]/40 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#9bb5c2] text-[11px] font-medium">Filtro aplicado:</span>
              {selectedType !== "ALL" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#004E72] text-[#F9F9F9] border border-[#FF6E42]/60 font-semibold text-[11px]">
                  Categoría: <strong className="text-[#FF6E42]">{getCategoryLabel(selectedType)}</strong>
                  <button
                    onClick={() => setSelectedType("ALL")}
                    className="hover:text-red-300 ml-0.5 p-0.5 rounded transition"
                    title="Quitar filtro de categoría"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery.trim() !== "" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#004E72] text-[#F9F9F9] border border-[#FF6E42]/60 font-semibold text-[11px]">
                  Búsqueda: <strong className="text-[#FF6E42]">"{searchQuery}"</strong>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-red-300 ml-0.5 p-0.5 rounded transition"
                    title="Quitar filtro de búsqueda"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <span className="text-[11px] text-[#9bb5c2]/80 ml-1">
                ({filtered.length} {filtered.length === 1 ? "producto encontrado" : "productos encontrados"})
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedType("ALL");
                setSearchQuery("");
              }}
              className="text-[11px] text-[#FF6E42] hover:text-[#ff8a65] font-bold shrink-0 transition"
            >
              Quitar todos
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-[#092634] border border-[#004E72]/50 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#004E72] border-t-[#FF6E42] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-[#9bb5c2]">Cargando catálogo en tiempo real...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <Boxes className="w-12 h-12 text-[#9bb5c2]/50 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-[#F9F9F9]">No se encontraron productos</h3>
              <p className="text-xs text-[#9bb5c2] max-w-sm mx-auto mt-1">
                No hay coincidencias con los filtros aplicados. Puedes registrar un producto nuevo ahora mismo.
              </p>
            </div>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6E42] hover:bg-[#ff5421] text-[#F9F9F9] text-xs font-bold transition shadow"
            >
              <PlusCircle className="w-4 h-4" /> Agregar Producto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#9bb5c2]">
              <thead className="bg-[#05161f] text-[#F9F9F9] border-b border-[#004E72]/50 font-mono uppercase text-[11px]">
                <tr>
                  <th 
                    onClick={() => handleSort("sku_name")}
                    className="px-5 py-3.5 cursor-pointer hover:text-[#FF6E42] transition select-none"
                    title="Ordenar por SKU o Nombre"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>SKU / Producto</span>
                      {sortKey === "sku_name" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-[#FF6E42]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#FF6E42]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9bb5c2]/40" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("type")}
                    className="px-5 py-3.5 cursor-pointer hover:text-[#FF6E42] transition select-none"
                    title="Ordenar por Categoría"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Categoría</span>
                      {sortKey === "type" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-[#FF6E42]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#FF6E42]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9bb5c2]/40" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("price")}
                    className="px-5 py-3.5 cursor-pointer hover:text-[#FF6E42] transition select-none"
                    title="Ordenar por Precio CLP"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Precio CLP</span>
                      {sortKey === "price" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-[#FF6E42]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#FF6E42]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9bb5c2]/40" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("costPrice")}
                    className="px-5 py-3.5 cursor-pointer hover:text-[#FF6E42] transition select-none"
                    title="Ordenar por Costo Unitario"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Costo Unitario</span>
                      {sortKey === "costPrice" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-[#FF6E42]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#FF6E42]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9bb5c2]/40" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("margin")}
                    className="px-5 py-3.5 cursor-pointer hover:text-[#FF6E42] transition select-none"
                    title="Ordenar por Margen Bruto"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Margen Bruto</span>
                      {sortKey === "margin" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-[#FF6E42]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#FF6E42]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9bb5c2]/40" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("stock")}
                    className="px-5 py-3.5 cursor-pointer hover:text-[#FF6E42] transition select-none"
                    title="Ordenar por Stock Disponible"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Stock</span>
                      {sortKey === "stock" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-[#FF6E42]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#FF6E42]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9bb5c2]/40" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#004E72]/30">
                {filtered.map((prod) => {
                  const grossProfit = Math.max(0, prod.price - prod.costPrice);
                  const marginPct = prod.price > 0 ? ((grossProfit / prod.price) * 100).toFixed(1) : "0";
                  const availableUnits = prod.type === "BUNDLE"
                    ? prod.calculatedAvailableStock ?? 0
                    : Math.max(0, prod.stockAvailable - prod.stockReserved);

                  const imgUrl = prod.imageUrl || (prod.images && prod.images.length > 0 ? prod.images[0] : null);

                  return (
                    <tr key={prod.id} className="hover:bg-[#004E72]/15 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {imgUrl ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#05161f] border border-[#004E72]/60 shrink-0">
                              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#004E72]/30 border border-[#004E72]/50 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-[#9bb5c2]" />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <span className="font-mono text-[#FF6E42] text-[11px] font-bold block">
                              {prod.sku}
                            </span>
                            <span className="font-semibold text-[#F9F9F9] text-sm block line-clamp-1">
                              {prod.name}
                            </span>
                            {prod.isPreOrder && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-medium">
                                <Clock className="w-3 h-3" /> Preventa (Pie {Math.round((prod.figureMetadata?.minimumDepositPercent ?? 0.2) * 100)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            prod.type === "FIGURE"
                              ? "bg-[#004E72]/50 text-[#F9F9F9] border-[#004E72]"
                              : prod.type === "COLLECTIBLE"
                              ? "bg-[#FF6E42]/15 text-[#FF6E42] border-[#FF6E42]/30"
                              : prod.type === "VIDEO_GAME"
                              ? "bg-purple-950/50 text-purple-300 border-purple-500/40"
                              : prod.type === "BUNDLE"
                              ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40"
                              : "bg-amber-950/50 text-amber-300 border-amber-500/40"
                          }`}
                        >
                          {prod.type === "OTHER"
                            ? prod.customCategoryLabel?.toUpperCase() || "OTRA CATEGORÍA"
                            : prod.type}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-[#F9F9F9] whitespace-nowrap">
                        {formatCLP(prod.price)}
                      </td>

                      <td className="px-5 py-4 font-mono text-[#9bb5c2] whitespace-nowrap">
                        {formatCLP(prod.costPrice)}
                      </td>

                      <td className="px-5 py-4 font-mono whitespace-nowrap">
                        <span className="text-emerald-400 font-bold block">{formatCLP(grossProfit)}</span>
                        <span className="text-[10px] text-[#9bb5c2]">{marginPct}%</span>
                      </td>

                      <td className="px-5 py-4 font-mono whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            availableUnits > 0 ? "text-[#F9F9F9]" : "text-red-400"
                          }`}
                        >
                          {availableUnits} uds
                        </span>
                        {prod.stockReserved > 0 && (
                          <span className="block text-[10px] text-amber-400">
                            ({prod.stockReserved} reservadas)
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                        <Link
                          href={`/admin/products/${prod.id}/edit`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#05161f] hover:bg-[#FF6E42] text-[#F9F9F9] text-xs font-semibold border border-[#004E72]/60 hover:border-[#FF6E42] transition shadow-sm"
                          title="Editar producto"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(prod)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-600 text-red-300 hover:text-white text-xs font-semibold border border-red-500/40 hover:border-red-500 transition shadow-sm"
                          title="Eliminar producto de Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                        <Link
                          href={`/product/${prod.sku.toLowerCase()}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#004E72]/50 hover:bg-[#004E72] text-[#F9F9F9] text-xs font-semibold border border-[#004E72] transition group"
                        >
                          Ver en Tienda
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#FF6E42] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación de producto */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#092634] border-2 border-red-500/60 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/20">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¿Eliminar Producto de Firestore?</h3>
                <p className="text-xs text-[#9bb5c2] font-mono">{productToDelete.sku}</p>
              </div>
            </div>
            <p className="text-xs text-[#d1e1e9] leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente <strong>{productToDelete.name}</strong>? Se borrará el documento en Cloud Firestore y dejará de mostrarse en el catálogo de la tienda.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingId === productToDelete.id}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#05161f] border border-[#004E72] text-xs font-bold text-[#9bb5c2] hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingId === productToDelete.id}
                onClick={() => handleDeleteProduct(productToDelete)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-2"
              >
                {deletingId === productToDelete.id ? (
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

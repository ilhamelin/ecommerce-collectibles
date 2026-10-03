"use client";
import { identityHeaders } from "@/lib/auth/clientIdentity";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  UploadCloud,
  X,
  Sparkles,
  Search,
  ArrowRight,
  Loader2,
  Tag,
  AlertCircle,
  PackagePlus,
  Check,
  Send,
  HelpCircle,
} from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";
import { useAuthStore } from "@/lib/store/authStore";
import { DialogSurface } from "@/components/common/DialogSurface";
import { VisualSearchConsole, type VisualSearchRun } from "./VisualSearchConsole";
import { readVisualSearchResponse, type VisualSearchResult } from "@/lib/services/visualSearch";

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySearch?: (query: string, category?: string) => void;
}

export function VisualSearchModal({
  isOpen,
  onClose,
  onApplySearch,
}: VisualSearchModalProps) {
  const { currentUser, isAuthenticated } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<VisualSearchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [run, setRun] = useState<VisualSearchRun | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const readerRef = useRef<FileReader | null>(null);
  const operationRef = useRef(0);

  const cancelPending = () => {
    operationRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    if (readerRef.current?.readyState === FileReader.LOADING) readerRef.current.abort();
    readerRef.current = null;
  };
  useEffect(() => {
    if (!isOpen) {
      cancelPending();
      setIsScanning(false);
      setRun(current => current && !["ready", "success", "error", "cancelled"].includes(current.stage)
        ? { ...current, stage: "cancelled", finishedAt: Date.now() } : current);
    }
    return () => cancelPending();
  }, [isOpen]);

  // Purchase intent / product request state
  const [requestEmail, setRequestEmail] = useState("");
  const [requestName, setRequestName] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && currentUser?.email) {
      setRequestEmail(currentUser.email);
      setRequestName(currentUser.fullName || currentUser.email.split("@")[0]);
    }
  }, [isAuthenticated, currentUser]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const processFile = (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Por favor selecciona un archivo de imagen válido (JPG, PNG o WEBP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage("La imagen no debe superar los 8MB.");
      return;
    }

    cancelPending();
    const operation = operationRef.current;
    setIsScanning(false);
    setSelectedImage(null);
    setRun({ source: `${file.name} · ${(file.size / 1024).toFixed(0)} KB`, startedAt: Date.now(), stage: "reading", events: ["Leyendo imagen local; todavía no se ha enviado al servidor."] });
    setErrorMessage(null);
    setResult(null);
    setRequestSuccess(false);
    setRequestError(null);
    setMimeType(file.type);

    const reader = new FileReader();
    readerRef.current = reader;
    reader.onload = () => {
      if (operation !== operationRef.current) return;
      if (typeof reader.result !== "string") return;
      setSelectedImage(reader.result);
      setRun(current => current ? { ...current, stage: "ready", events: [...current.events, "Archivo leído correctamente. Vista previa disponible."] } : current);
    };
    reader.onerror = () => {
      if (operation !== operationRef.current) return;
      const message = "No se pudo leer la imagen. Prueba con otro archivo.";
      setErrorMessage(message);
      setRun(current => current ? { ...current, stage: "error", error: message, finishedAt: Date.now() } : current);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  /** Streams verified search events and ignores requests cancelled by closing or changing the image. */
  const handleScanWithAI = async () => {
    if (!selectedImage || requestRef.current) return;
    cancelPending();
    const operation = operationRef.current;
    const abort = new AbortController();
    requestRef.current = abort;
    setIsScanning(true);
    setErrorMessage(null);
    setResult(null);
    setRequestSuccess(false);
    setRequestError(null);
    setRun(current => ({ source: current?.source || "Imagen seleccionada", startedAt: Date.now(), stage: "requesting", events: ["Enviando imagen al servidor para identificarla y consultar el catálogo."] }));
    try {
      const response = await fetch("/api/catalog/visual-search", {
        method: "POST",
        headers: { ...await identityHeaders(true), "Content-Type": "application/json", "Accept": "application/x-ndjson" },
        body: JSON.stringify({ imageBase64: selectedImage, mimeType }),
        signal: abort.signal,
      });
      const data = await readVisualSearchResponse(response, event => {
        if (operation !== operationRef.current || event.kind !== "progress") return;
        setRun(current => current ? { ...current, stage: event.stage, events: [...current.events, event.message] } : current);
      });
      if (operation !== operationRef.current) return;
      setResult(data);
      setRun(current => current ? { ...current, stage: "success", result: data, finishedAt: Date.now() } : current);
    } catch (error: unknown) {
      if (operation !== operationRef.current || abort.signal.aborted) return;
      const message = error instanceof Error && error.name !== "ZodError" && !(error instanceof SyntaxError) && !(error instanceof TypeError)
        ? error.message : "No se pudo completar la búsqueda. Revisa la conexión o prueba otra imagen.";
      setErrorMessage(message);
      setRun(current => current ? { ...current, stage: "error", error: message, finishedAt: Date.now() } : current);
    } finally {
      if (operation === operationRef.current) {
        requestRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleCancelScan = () => {
    cancelPending();
    setIsScanning(false);
    setRun(current => current && !["ready", "success", "error", "cancelled"].includes(current.stage) ? { ...current, stage: "cancelled", finishedAt: Date.now() } : current);
  };
  const handleClose = () => { handleCancelScan(); onClose(); };

  const handleSubmitPurchaseWish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!result?.analysis) return;

    const emailToSend = isAuthenticated && currentUser?.email ? currentUser.email : requestEmail.trim();
    if (!emailToSend || !emailToSend.includes("@")) {
      setRequestError("Por favor ingresa un correo electrónico válido para avisarte.");
      return;
    }

    setIsSubmittingRequest(true);
    setRequestError(null);

    try {
      const res = await fetch("/api/catalog/product-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.analysis.itemOrCharacter || "Coleccionable Solicitado",
          franchise: result.analysis.franchise,
          category: result.analysis.suggestedCategory,
          userEmail: emailToSend,
          userName: requestName.trim() || (isAuthenticated ? currentUser?.fullName : "Cliente Interesado"),
          userId: currentUser?.id || null,
          imageUrl: selectedImage,
          aiSummary: result.analysis.summary,
          confidenceScore: result.analysis.confidenceScore,
          userNotes: requestNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRequestSuccess(true);
      } else {
        setRequestError(data.error || "No se pudo registrar la solicitud.");
      }
    } catch (err) {
      setRequestError("Error de conexión al enviar tu deseo de compra.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleReset = () => {
    cancelPending();
    setIsScanning(false);
    setRun(null);
    setSelectedImage(null);
    setResult(null);
    setErrorMessage(null);
    setRequestSuccess(false);
    setRequestError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <DialogSurface label="Buscar por foto IA" onClose={handleClose} className="w-[min(64rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-transparent">
      <div className="relative w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1F3A5F] to-[#152842] text-white border-b border-[#1F3A5F]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF6B35]/20 text-[#FF6B35]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide flex items-center gap-2">
                <span>Encuentra este Coleccionable</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  ✦ Gemini Vision IA
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Sube una foto o captura y la IA identificará el anime, personaje y productos
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Cerrar búsqueda por foto"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {errorMessage && (
            <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="min-w-0">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Seleccionar imagen para buscar" className="sr-only" onChange={handleFileChange} />
          {!selectedImage ? (
            /* Upload Box */
            <div
              role="button"
              tabIndex={0}
              aria-label="Subir imagen para buscar por foto"
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInputRef.current?.click(); } }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#FF6B35] rounded-2xl p-8 text-center cursor-pointer transition bg-[#F7F7F5] hover:bg-amber-500/5 group space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mx-auto text-[#1F3A5F] group-hover:scale-110 group-hover:text-[#FF6B35] transition">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#1F3A5F]">
                  Arrastra aquí tu imagen o haz clic para seleccionarla
                </p>
                <p className="text-[11px] text-[#666666]">
                  Admite capturas de TikTok, Instagram, fotos de figuras, mangas, hardware (JPG, PNG, WEBP máx. 8MB)
                </p>
              </div>
            </div>
          ) : (
            /* Preview & Action */
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center max-h-72 group">
                <img
                  src={selectedImage}
                  alt="Previsualización para búsqueda"
                  className="max-h-72 w-auto object-contain"
                />

                {/* Laser scan animation when processing */}
                {isScanning && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B35]/20 via-transparent to-[#FF6B35]/20 flex flex-col justify-center items-center backdrop-blur-[1px]">
                    <div className="w-full h-1 bg-[#FF6B35] shadow-[0_0_15px_#FF6B35] motion-safe:animate-bounce" />
                    <div className="mt-4 px-4 py-2 rounded-xl bg-black/80 text-white text-xs font-bold flex items-center gap-2">
                      <Loader2 className="w-4 h-4 motion-safe:animate-spin text-[#FF6B35]" />
                      <span>Analizando con Google Gemini Vision...</span>
                    </div>
                  </div>
                )}

                {!isScanning && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-black text-white text-xs transition"
                    title="Cambiar imagen"
                    aria-label="Cambiar imagen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isScanning && <button type="button" onClick={handleCancelScan} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">Cancelar búsqueda</button>}
              {!result && !isScanning && (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Cambiar Imagen
                  </button>
                  <button
                    type="button"
                    onClick={handleScanWithAI}
                    className="px-5 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-[#FF6B35]/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Identificar con Gemini Vision</span>
                  </button>
                </div>
              )}
            </div>
          )}

          </div>
          <VisualSearchConsole run={run} />
          </div>

          {/* Results View */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in duration-300">
              {/* AI Badge Identification Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-blue-500/10 border border-emerald-500/25 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Identificación Exitosa
                  </span>
                  <div className="flex items-center gap-2">
                    {result.inStoreInventory ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        En Catálogo OmniCollector
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Fuera de Catálogo
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-700 font-mono font-bold">
                      {result.analysis.confidenceScore === null ? "Confianza no informada" : `${Math.round(result.analysis.confidenceScore * 100)}% confianza IA`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-[#666666] text-[11px] block">Franquicia / Marca:</span>
                    <strong className="text-[#1F3A5F] text-sm">
                      {result.analysis.franchise || "No especificada"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#666666] text-[11px] block">Personaje o Modelo:</span>
                    <strong className="text-[#1F3A5F] text-sm">
                      {result.analysis.itemOrCharacter || "Detectado"}
                    </strong>
                  </div>
                </div>

                <p className="text-xs text-slate-700 italic bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                  «{result.analysis.summary}»
                </p>

                {onApplySearch && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplySearch(
                        result.analysis.searchKeywords || result.analysis.itemOrCharacter,
                        result.analysis.suggestedCategory
                      );
                      handleClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition shadow-sm"
                  >
                    <Search className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span>Filtrar todo el catálogo con esta búsqueda</span>
                  </button>
                )}
              </div>

              {/* COINCIDENCIA EXACTA EN CATÁLOGO (Si el producto está en el inventario real de la tienda) */}
              {result.inStoreInventory && result.exactProduct && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-blue-500/10 border-2 border-emerald-500/40 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      ¡Juego / Producto Disponible en Catálogo!
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold">
                      {(result.exactProduct.stockAvailable ?? 0) > 0
                        ? `Stock: ${result.exactProduct.stockAvailable ?? 0} un.`
                        : "Sin Stock"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl bg-white border border-emerald-200">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img
                        src={
                          result.exactProduct.imageUrl ||
                          (result.exactProduct.images && result.exactProduct.images[0]) ||
                          "/placeholder.jpg"
                        }
                        alt={result.exactProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5 text-center sm:text-left">
                      <span className="text-[10px] font-mono text-[#666666] font-bold block">
                        SKU: {result.exactProduct.sku}
                      </span>
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#1A1A1A] truncate">
                        {result.exactProduct.name}
                      </h4>
                      <div className="text-sm font-black text-[#FF6B35] font-mono">
                        {formatCLP(result.exactProduct.price)}
                      </div>
                    </div>
                    <Link
                      href={`/product/${result.exactProduct.sku || result.exactProduct.id}`}
                      onClick={handleClose}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-[#FF6B35]/20 shrink-0"
                    >
                      <span>Ver Ficha y Comprar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Solicitud de Producto / Deseo de Compra SOLO si el producto NO está en inventario */}
              {!result.inStoreInventory && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1F3A5F]/5 via-amber-500/5 to-[#FF6B35]/10 border-2 border-dashed border-[#FF6B35]/40 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] shrink-0 mt-0.5">
                      <PackagePlus className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-[#1F3A5F] tracking-tight">
                          ¿No encuentras este juego o no está en el catálogo?
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                          Petición de Catálogo
                        </span>
                      </div>
                      <p className="text-[11px] text-[#555555]">
                        Notifica a OmniCollector tu deseo de comprar <strong>{result.analysis.itemOrCharacter || "este coleccionable"}</strong> para tomarlo como un futuro producto a agregar al inventario o importarlo bajo pedido.
                      </p>
                    </div>
                  </div>

                  {requestSuccess ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <span className="p-1 rounded-full bg-emerald-600 text-white shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                        <span>¡Deseo de compra registrado con éxito!</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-relaxed">
                        Tu solicitud ha sido enviada directamente al equipo de compras en el <strong>Centro de Control</strong>. Te avisaremos formalmente por correo electrónico cuando este producto sea añadido o tengamos novedades de importación.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitPurchaseWish} className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-[#666666] block mb-1">
                            Tu Correo de Contacto {isAuthenticated ? "(Cuenta Activa)" : ""}
                          </label>
                          <input
                            type="email"
                            required
                            value={requestEmail}
                            onChange={(e) => setRequestEmail(e.target.value)}
                            placeholder="ej. coleccionista@gmail.com"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:border-[#FF6B35] shadow-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#666666] block mb-1">
                            Tu Nombre o Alias
                          </label>
                          <input
                            type="text"
                            value={requestName}
                            onChange={(e) => setRequestName(e.target.value)}
                            placeholder="ej. Benjamín"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:border-[#FF6B35] shadow-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#666666] block mb-1">
                          Comentarios o Preferencia (Opcional)
                        </label>
                        <input
                          type="text"
                          value={requestNotes}
                          onChange={(e) => setRequestNotes(e.target.value)}
                          placeholder="ej. Busco edición física estándar para PS5 sellada, o edición especial..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:border-[#FF6B35] shadow-xs"
                        />
                      </div>

                      {requestError && (
                        <p className="text-[11px] text-red-600 font-medium">{requestError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmittingRequest}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                      >
                        {isSubmittingRequest ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin" />
                            <span>Enviando notificación al Centro de Control...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Notificar deseo de compra a OmniCollector (Futuro Producto)</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Matched Products Grid */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center justify-between">
                  <span>Productos Coincidentes en OmniCollector</span>
                  <span className="font-mono text-[#666666] font-normal">
                    ({result.matchedProducts.length} encontrados)
                  </span>
                </h4>

                {result.matchedProducts.length === 0 ? (
                  <p className="text-xs text-[#666666] py-3 text-center bg-slate-50 rounded-xl border border-slate-200">
                    No encontramos unidades exactas en stock en este momento, pero puedes activar una alerta para que te avisemos cuando llegue.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.matchedProducts.map((p) => (
                      <Link
                        key={p.sku || p.id}
                        href={`/product/${p.sku || p.id}`}
                        onClick={handleClose}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-[#FF6B35] hover:shadow-md transition bg-white group"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                          <img
                            src={p.imageUrl || (p.images && p.images[0]) || "/placeholder.jpg"}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="text-[10px] font-mono text-[#666666] block truncate">
                            {p.sku}
                          </span>
                          <h5 className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#FF6B35] transition truncate">
                            {p.name}
                          </h5>
                          <div className="text-xs font-black text-[#FF6B35] font-mono">
                            {formatCLP(p.price)}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#FF6B35] group-hover:translate-x-0.5 transition shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogSurface>
  );
}

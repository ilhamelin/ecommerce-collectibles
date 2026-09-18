"use client";

import React, { useState, useEffect } from "react";
import { HardDrive, X, Check, AlertTriangle, ExternalLink, Image as ImageIcon } from "lucide-react";
import { normalizeImageUrl, extractGoogleDriveFileId } from "@/lib/utils/media";

export interface GoogleDriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (normalizedUrl: string) => void;
  title?: string;
  description?: string;
}

/**
 * Modal asistente para importar imágenes desde Google Drive u otros enlaces.
 * Convierte automáticamente enlaces de visualización a URLs directas de Google CDN (lh3.googleusercontent.com).
 */
export function GoogleDriveImportModal({
  isOpen,
  onClose,
  onImport,
  title = "Importar Imagen desde Google Drive",
  description = "Pega el enlace compartido de Google Drive. El sistema lo convertirá automáticamente al formato directo compatible con alta velocidad.",
}: GoogleDriveImportModalProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [hasPreviewError, setHasPreviewError] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputUrl("");
      setHasPreviewError(false);
      setCopiedExample(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = inputUrl.trim();
  const driveId = extractGoogleDriveFileId(trimmed);
  const isDrive = Boolean(driveId);
  const normalizedUrl = normalizeImageUrl(trimmed);
  const canSubmit = Boolean(normalizedUrl && (!hasPreviewError || isDrive));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedUrl) return;
    onImport(normalizedUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#092634] border border-[#004E72] shadow-2xl p-6 space-y-5 text-[#F9F9F9]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
              <p className="text-xs text-[#9bb5c2] mt-0.5">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9bb5c2] hover:text-white hover:bg-[#004E72]/40 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guía Rápida de Configuración en Google Drive */}
        <div className="p-3.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/50 text-xs text-[#9bb5c2] space-y-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Permisos de Google Drive requeridos</span>
          </div>
          <p className="leading-relaxed">
            En Google Drive: haz clic derecho en el archivo &rarr; <strong>Compartir</strong> &rarr; Cambia el Acceso General a <strong>&quot;Cualquier persona con el enlace&quot;</strong>.
          </p>
        </div>

        {/* Formulario de Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#F9F9F9] flex items-center justify-between">
              <span>Enlace de Google Drive</span>
              {isDrive && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> ID detectado ({driveId?.substring(0, 10)}...)
                </span>
              )}
            </label>
            <input
              type="text"
              autoFocus
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setHasPreviewError(false);
              }}
              placeholder="https://drive.google.com/file/d/... o https://lh3.googleusercontent.com/d/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-xs text-[#F9F9F9] placeholder-[#9bb5c2]/50 focus:outline-none focus:border-[#FF6E42]"
            />
          </div>

          {/* URL Convertida Directa */}
          {trimmed && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#9bb5c2] uppercase tracking-wider">
                URL Optimizada Resultante:
              </span>
              <div className="p-2 rounded-lg bg-[#04141d] border border-[#004E72]/40 font-mono text-[11px] text-cyan-300 break-all select-all">
                {normalizedUrl}
              </div>
            </div>
          )}

          {/* Vista Previa de la Imagen */}
          {normalizedUrl && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#9bb5c2]">Previsualización:</span>
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#004E72]/60 bg-[#04141d] flex items-center justify-center">
                <img
                  src={normalizedUrl}
                  alt="Vista previa de imagen"
                  className="w-full h-full object-contain"
                  onError={() => setHasPreviewError(true)}
                  onLoad={() => setHasPreviewError(false)}
                />
                {hasPreviewError && (
                  <div className="absolute inset-0 bg-[#092634]/90 p-3 flex flex-col items-center justify-center text-center gap-1 text-xs text-amber-300">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <p className="font-semibold">No se pudo cargar la vista previa</p>
                    <p className="text-[10px] text-[#9bb5c2]">
                      Verifica que el archivo en Drive esté en modo público (&quot;Cualquier persona con el enlace&quot;).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-transparent hover:bg-white/5 border border-[#004E72]/60 text-xs font-semibold text-[#9bb5c2] hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-5 py-2 rounded-xl bg-[#FF6E42] hover:bg-[#FF6E42]/90 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" /> Agregar Imagen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

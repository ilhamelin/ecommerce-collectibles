"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Requires an explicit confirmation before calling the existing reset action. */
export function TelemetryResetDialog({ disabled, onConfirm }: {
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" disabled={disabled} aria-label="Limpiar historial de telemetría"
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50">
          <Trash2 className="h-4 w-4" /> Limpiar historial
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Trash2 className="h-6 w-6" /></div>
          <AlertDialogTitle>¿Limpiar el historial de consumo?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará todo el historial de llamadas y tokens registrado por esta aplicación,
            incluyendo los períodos anteriores. Esta acción no se puede deshacer.
            Los productos, pedidos y la facturación de los proveedores no se modifican.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Conservar historial</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 text-white hover:bg-red-700">Sí, eliminar historial</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

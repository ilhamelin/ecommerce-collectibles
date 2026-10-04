"use client";
import React, { useState } from "react";
import { MediaLibrary } from "./MediaLibrary";
import { DialogSurface } from "@/components/common/DialogSurface";
export function MediaPicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-white text-[#1F3A5F] border px-4 py-2 text-xs font-bold"
      >
        Elegir de la biblioteca
      </button>
      {open && (
        <DialogSurface
          label="Biblioteca de imágenes"
          onClose={() => setOpen(false)}
        >
          <div className="max-h-[75vh] overflow-y-auto p-5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mb-4 underline text-sm"
            >
              Cerrar biblioteca
            </button>
            <MediaLibrary
              onSelect={(url) => {
                onSelect(url);
                setOpen(false);
              }}
            />
          </div>
        </DialogSurface>
      )}
    </>
  );
}

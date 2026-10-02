"use client";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Native modal supplies focus trapping, Escape handling and focus restoration. */
export function DialogSurface({ children, label, onClose, className = "" }: { children: React.ReactNode; label: string; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(<dialog ref={ref} aria-label={label} onCancel={event => { event.preventDefault(); onClose(); }} className={`store-dialog ${className}`} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>{children}</dialog>, document.body);
}

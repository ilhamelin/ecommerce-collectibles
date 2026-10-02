"use client";
import { motion, useReducedMotion } from "motion/react";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Native modal supplies focus trapping, Escape handling and focus restoration. */
export function DialogSurface({ children, label, onClose, className = "" }: { children: React.ReactNode; label: string; onClose: () => void; className?: string }) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      // React may detach the dialog before native focus restoration runs.
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(<motion.dialog initial={{ opacity: reducedMotion ? 1 : 0, scale: reducedMotion || className.includes("cart-dialog") ? 1 : 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reducedMotion ? 0 : 0.2 }} ref={ref} aria-label={label} onCancel={event => { event.preventDefault(); onClose(); }} className={`store-dialog ${className}`} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>{children}</motion.dialog>, document.body);
}

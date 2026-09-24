"use client";

import React, { useEffect } from "react";
import { useToastStore, ToastItem } from "@/lib/store/toastStore";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles, X } from "lucide-react";

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const config = {
    success: {
      bg: "bg-[#062419] border-[#10B981]/40 text-emerald-100",
      icon: <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />,
      accent: "bg-[#10B981]",
    },
    error: {
      bg: "bg-[#250d12] border-[#EF4444]/40 text-rose-100",
      icon: <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />,
      accent: "bg-[#EF4444]",
    },
    warning: {
      bg: "bg-[#241a06] border-[#F59E0B]/40 text-amber-100",
      icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />,
      accent: "bg-[#F59E0B]",
    },
    info: {
      bg: "bg-[#0c1a2e] border-[#3B82F6]/40 text-sky-100",
      icon: <Info className="w-5 h-5 text-[#3B82F6] shrink-0" />,
      accent: "bg-[#3B82F6]",
    },
    collector: {
      bg: "bg-gradient-to-r from-[#121118] via-[#1F1828] to-[#121118] border-[#FFD700]/50 text-amber-100 shadow-[0_0_20px_rgba(255,215,0,0.15)]",
      icon: <Sparkles className="w-5 h-5 text-[#FFD700] animate-pulse shrink-0" />,
      accent: "bg-gradient-to-r from-[#FFD700] to-[#FF6B35]",
    },
  }[toast.type];

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 max-w-sm sm:max-w-md w-full pointer-events-auto ${config.bg}`}
    >
      <div className="pt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-sm font-bold tracking-tight text-white">{toast.title}</h4>
        {toast.message && (
          <p className="mt-1 text-xs opacity-90 leading-relaxed break-words">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
      <div
        className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full opacity-40 ${config.accent}`}
      />
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-full pointer-events-none"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} onDismiss={removeToast} />
      ))}
    </div>
  );
};

import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info" | "collector";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 3500
  createdAt: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id" | "createdAt">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: ToastItem = {
      ...toast,
      id,
      duration: toast.duration ?? 3500,
      createdAt: Date.now(),
    };

    set((state) => ({
      // Maximum 4 simultaneous toasts to avoid viewport clutter
      toasts: [...state.toasts.slice(-3), newItem],
    }));

    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearToasts: () => set({ toasts: [] }),
}));

/**
 * Universal helper to trigger toasts from anywhere in the application.
 */
export const toast = {
  success: (title: string, message?: string, duration?: number): string =>
    useToastStore.getState().addToast({ type: "success", title, message, duration }),
  error: (title: string, message?: string, duration?: number): string =>
    useToastStore.getState().addToast({ type: "error", title, message, duration }),
  warning: (title: string, message?: string, duration?: number): string =>
    useToastStore.getState().addToast({ type: "warning", title, message, duration }),
  info: (title: string, message?: string, duration?: number): string =>
    useToastStore.getState().addToast({ type: "info", title, message, duration }),
  collector: (title: string, message?: string, duration?: number): string =>
    useToastStore.getState().addToast({ type: "collector", title, message, duration }),
  dismiss: (id: string): void => useToastStore.getState().removeToast(id),
};

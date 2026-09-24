import { describe, it, expect, beforeEach, vi } from "vitest";
import { useToastStore, toast } from "@/lib/store/toastStore";

describe("Global Toast Notification Engine & UX Enhancements Suite", () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
    vi.clearAllTimers();
  });

  it("should initialize with an empty queue", () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("should add a success toast with correct payload and auto-generated ID", () => {
    const id = toast.success("¡Agregado al Carro!", "Producto listo para checkout", 3000);
    const toasts = useToastStore.getState().toasts;

    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].type).toBe("success");
    expect(toasts[0].title).toBe("¡Agregado al Carro!");
    expect(toasts[0].message).toBe("Producto listo para checkout");
    expect(toasts[0].duration).toBe(3000);
  });

  it("should add a collector special toast with luxury styling identifier", () => {
    const id = toast.collector("¡Guardado en Favoritos!", "Zelda Tears of the Kingdom Collector's Edition");
    const toasts = useToastStore.getState().toasts;

    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].type).toBe("collector");
    expect(toasts[0].duration).toBe(3500); // default duration
  });

  it("should handle error, warning, and info toast types", () => {
    toast.error("Error al procesar", "Fallo de conexión");
    toast.warning("Stock bajo", "Quedan solo 2 unidades");
    toast.info("Enlace copiado", "Listo para compartir");

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(3);
    expect(toasts.map((t) => t.type)).toEqual(["error", "warning", "info"]);
  });

  it("should cap active toasts to a maximum of 4 to prevent viewport overcrowding", () => {
    toast.info("Toast 1");
    toast.info("Toast 2");
    toast.info("Toast 3");
    toast.info("Toast 4");
    toast.info("Toast 5"); // Should displace Toast 1

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(4);
    expect(toasts[0].title).toBe("Toast 2");
    expect(toasts[3].title).toBe("Toast 5");
  });

  it("should dismiss a specific toast by ID", () => {
    const id1 = toast.success("Toast A");
    const id2 = toast.success("Toast B");

    expect(useToastStore.getState().toasts.length).toBe(2);

    toast.dismiss(id1);

    const remaining = useToastStore.getState().toasts;
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(id2);
  });

  it("should clear all toasts at once", () => {
    toast.success("Toast A");
    toast.error("Toast B");
    toast.warning("Toast C");

    expect(useToastStore.getState().toasts.length).toBe(3);

    useToastStore.getState().clearToasts();
    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});

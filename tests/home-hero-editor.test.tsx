// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminHomeHeroPage from "@/app/admin/home-hero/page";
import AdminLayout from "@/app/admin/layout";
import { DEFAULT_HOME_HERO, type HomeHeroSettings } from "@/lib/constants/homeHeroDefaults";
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/home-hero" }));

const products = [
  { id: "first", sku: "VG-FIRST", name: "Primero", price: 54990, stockAvailable: 2, stockReserved: 0, isPreOrder: false, imageUrl: "https://example.com/first.jpg" },
  { id: "second", sku: "FIG-SECOND", name: "Segundo", price: 72000, stockAvailable: 3, stockReserved: 0, isPreOrder: false, imageUrl: "https://example.com/second.jpg" },
];
let root: Root;
let container: HTMLDivElement;
let stored: HomeHeroSettings;
let canPersist: boolean;
let postError: string | null;

beforeEach(async () => {
  stored = { ...DEFAULT_HOME_HERO }; canPersist = true; postError = null;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn(async (_url: string, options?: RequestInit) => {
    if (options?.method === "POST") {
      if (postError) return new Response(JSON.stringify({ success: false, error: postError }), { status: 503 });
      stored = (JSON.parse(String(options.body)) as { settings: HomeHeroSettings }).settings;
      return new Response(JSON.stringify({ success: true, data: { settings: stored } }));
    }
    return new Response(JSON.stringify({ success: true, data: { settings: stored, products, canPersist } }));
  }));
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  await act(async () => root.render(<AdminHomeHeroPage />));
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

async function change(id: string, value: string) {
  const input = container.querySelector<HTMLInputElement | HTMLSelectElement>(`#hero-${id}`)!;
  const prototype = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}
async function submit() { await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); }
const preview = () => container.querySelector('[aria-label="Vista previa de la sección principal"]')!;
const saveButton = () => container.querySelector<HTMLButtonElement>('button[form="home-hero-form"]')!;
const posts = () => vi.mocked(fetch).mock.calls.filter(call => call[1]?.method === "POST");

describe("Home hero editor and live preview", () => {
  it("connects the new editor through Personalización Visual and marks the menu active", async () => {
    await act(async () => root.render(<AdminLayout><div>Contenido del editor</div></AdminLayout>));
    const menu = container.querySelector<HTMLButtonElement>('button[aria-label="Personalización Visual"]')!;
    expect(menu.className).toContain("bg-[#FF6B35]");
    await act(async () => menu.click());
    expect(menu.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector('a[href="/admin/home-hero"]')?.textContent).toContain("Sección principal de inicio");
  });
  it("loads the saved design and previews edits without publishing or navigating", async () => {
    expect(saveButton().disabled).toBe(true); expect(preview().textContent).toContain("Tu próxima pieza.");
    await change("heading", "Tu vitrina empieza aquí"); await change("featuredProductId", "second");
    expect(preview().textContent).toContain("Tu vitrina empieza aquí"); expect(preview().textContent).toContain("Segundo"); expect(preview().textContent).toContain("72.000");
    expect(preview().querySelector("a")).toBeNull(); expect(posts()).toHaveLength(0); expect(saveButton().disabled).toBe(false);
    expect(container.querySelector('a[href="#home-hero-preview"]')).not.toBeNull();
    expect(container.textContent).toContain("Cambios sin guardar");
  });
  it("posts validated edits and reloads them when the page is opened again", async () => {
    await change("heading", "Portada guardada"); await change("featuredProductId", "second"); await submit();
    expect(posts()).toHaveLength(1); expect(stored.heading).toBe("Portada guardada"); expect(stored.featuredProductId).toBe("second");
    expect(container.textContent).toContain("Portada guardada en la base de datos"); expect(saveButton().disabled).toBe(true);
    const requestOptions = posts()[0][1]; expect(requestOptions?.credentials).toBe("same-origin"); expect(requestOptions?.headers).toEqual({ "Content-Type": "application/json" });
    await act(async () => root.unmount()); root = createRoot(container); await act(async () => root.render(<AdminHomeHeroPage />));
    expect(container.querySelector<HTMLInputElement>("#hero-heading")?.value).toBe("Portada guardada"); expect(preview().textContent).toContain("Segundo");
  });
  it("keeps the draft and offers retry when saving fails", async () => {
    postError = "No se guardaron los cambios. Conexión no disponible.";
    await change("heading", "No perder este borrador"); await submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Conexión no disponible");
    expect(container.querySelector<HTMLInputElement>("#hero-heading")?.value).toBe("No perder este borrador");
    expect(stored.heading).toBe(DEFAULT_HOME_HERO.heading); expect(saveButton().disabled).toBe(false); expect(container.textContent).toContain("Cambios sin guardar");
    postError = null; await submit(); expect(stored.heading).toBe("No perder este borrador");
  });
  it("rejects unsafe button destinations in the editor before any POST", async () => {
    await change("primaryHref", "javascript:alert(1)"); await submit();
    expect(posts()).toHaveLength(0); expect(container.querySelector('[role="alert"]')?.textContent).toContain("enlace interno");
    expect(document.activeElement?.id).toBe("hero-primaryHref");
  });
  it("allows local preview but does not pretend to save without Firebase Admin", async () => {
    canPersist = false; await act(async () => root.unmount()); root = createRoot(container); await act(async () => root.render(<AdminHomeHeroPage />));
    await change("heading", "Vista previa local");
    expect(preview().textContent).toContain("Vista previa local"); expect(saveButton().disabled).toBe(true); await submit(); expect(posts()).toHaveLength(0);
    expect(container.textContent).toContain("Para guardar, Firebase Admin debe estar conectado");
  });
  it("does not erase persisted settings after a read error; retry reloads them", async () => {
    await act(async () => root.unmount()); root = createRoot(container);
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: false, error: "No se pudo cargar la portada guardada." }), { status: 503 }));
    await act(async () => root.render(<AdminHomeHeroPage />));
    expect(container.querySelector("form")).toBeNull(); expect(container.querySelector('[role="alert"]')).not.toBeNull();
    await act(async () => container.querySelector<HTMLButtonElement>("button")!.click()); expect(container.querySelector("form")).not.toBeNull();
  });
});

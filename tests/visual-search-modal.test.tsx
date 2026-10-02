// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VisualSearchModal } from "../src/components/catalog/VisualSearchModal";
import type { VisualSearchResult } from "../src/lib/services/visualSearch";

vi.mock("@/lib/store/authStore", () => ({ useAuthStore: () => ({ currentUser: null, isAuthenticated: false }) }));
vi.mock("@/components/common/DialogSurface", () => ({ DialogSurface: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
const result: VisualSearchResult = { analysis: { franchise: "Pokémon", itemOrCharacter: "Pikachu", suggestedCategory: "FIGURE", searchKeywords: "Pikachu", confidenceScore: 0, inStoreInventory: false, exactMatchSku: null, matchedProductName: null, summary: "Figura identificada." }, inStoreInventory: false, exactProduct: null, matchedProducts: [], totalMatches: 0 };

describe("Visual search modal connection", () => {
  let container: HTMLDivElement;
  let root: Root;
  const applySearch = vi.fn();
  beforeEach(async () => {
    applySearch.mockClear();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("fetch", vi.fn());
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
    await act(async () => root.render(<VisualSearchModal isOpen onClose={vi.fn()} onApplySearch={applySearch} />));
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
  const button = (text: string) => [...container.querySelectorAll("button")].find(button => button.textContent?.includes(text))!;
  async function select(file = new File(["image"], "figura.png", { type: "image/png" })) {
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    const originalRead = FileReader.prototype.readAsDataURL;
    let finished!: () => void;
    const readDone = new Promise<void>(resolve => { finished = resolve; });
    const spy = vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (this: FileReader, file: Blob) {
      this.addEventListener("loadend", finished, { once: true });
      originalRead.call(this, file);
    });
    await act(async () => { input.dispatchEvent(new Event("change", { bubbles: true })); await readDone; });
    spy.mockRestore();
    expect(container.textContent).toContain("Archivo leído correctamente");
  }
  it("reads locally without sending the image until identification is requested", async () => {
    await select();
    expect(container.textContent).toContain("Imagen preparada");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("updates the console before results and preserves zero confidence", async () => {
    await select();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    vi.mocked(fetch).mockResolvedValue(new Response(new ReadableStream({ start(value) { controller = value; } }), { headers: { "Content-Type": "application/x-ndjson" } }));
    await act(async () => button("Identificar con Gemini Vision").click());
    expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toEqual(expect.objectContaining({ Accept: "application/x-ndjson" }));
    await act(async () => controller.enqueue(new TextEncoder().encode('{"kind":"progress","stage":"catalog","message":"Catálogo real consultado"}\n')));
    expect(container.textContent).toContain("Catálogo real consultado");
    expect(container.textContent).not.toContain("Identificación Exitosa");
    await act(async () => { controller.enqueue(new TextEncoder().encode(JSON.stringify({ kind: "result", data: result }) + "\n")); controller.close(); });
    expect(container.textContent).toContain("Búsqueda completada");
    expect(container.textContent).toContain("0% confianza IA");
    await act(async () => button("Filtrar todo el catálogo").click());
    expect(applySearch).toHaveBeenCalledWith("Pikachu", "FIGURE");
  });
  it("aborts cancelled searches and ignores late results", async () => {
    await select();
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise(value => { resolve = value; }));
    await act(async () => button("Identificar con Gemini Vision").click());
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    await act(async () => button("Cancelar búsqueda").click());
    expect(signal?.aborted).toBe(true);
    await act(async () => resolve(Response.json({ success: true, data: result })));
    expect(container.textContent).toContain("Búsqueda cancelada");
    expect(container.textContent).not.toContain("Identificación Exitosa");
  });
  it("keeps retry available after a server error", async () => {
    await select();
    vi.mocked(fetch).mockResolvedValue(Response.json({ success: false, error: "Gemini no disponible" }, { status: 503 }));
    await act(async () => button("Identificar con Gemini Vision").click());
    expect(container.textContent).toContain("Gemini no disponible");
    expect(button("Identificar con Gemini Vision")).toBeTruthy();
  });
  it("aborts a pending identification when the parent closes the modal", async () => {
    await select();
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));
    await act(async () => button("Identificar con Gemini Vision").click());
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    await act(async () => root.render(<VisualSearchModal isOpen={false} onClose={vi.fn()} />));
    expect(signal?.aborted).toBe(true);
    expect(container.textContent).toBe("");
  });
  it("rejects unsupported images without calling the server", async () => {
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", { value: [new File(["gif"], "image.gif", { type: "image/gif" })] });
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(container.textContent).toContain("archivo de imagen válido");
    expect(fetch).not.toHaveBeenCalled();
  });
});

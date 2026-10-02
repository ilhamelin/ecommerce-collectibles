import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDomainEntity } from "../src/lib/types/domain";
import { readVisualSearchResponse } from "../src/lib/services/visualSearch";

const mocks = vi.hoisted(() => ({ products: vi.fn(), usage: vi.fn(), key: vi.fn(), models: vi.fn() }));
vi.mock("@/lib/firebase/firestore", () => ({ getProductsFromFirestore: mocks.products }));
vi.mock("@/lib/services/apiTelemetryService", () => ({ recordApiUsage: mocks.usage }));
vi.mock("@/lib/services/geminiClient", () => ({ getGeminiApiKey: mocks.key, getSupportedGeminiModels: mocks.models }));
import { POST } from "../src/app/api/catalog/visual-search/route";

const product: ProductDomainEntity = { id: "1", sku: "FIG-PIKACHU", name: "Pikachu", description: "Figura Pokémon", type: "FIGURE", price: 29900, costPrice: 15000, stockAvailable: 0, stockReserved: 0, isPreOrder: false };
const analysis = { franchise: "Pokémon", itemOrCharacter: "Pikachu", suggestedCategory: "FIGURE", searchKeywords: "Pikachu", confidenceScore: .9, inStoreInventory: true, exactMatchSku: product.sku, matchedProductName: product.name, summary: "Pikachu identificado." };
function request(stream = true, body: unknown = { imageBase64: "data:image/png;base64,aGVsbG8=", mimeType: "image/png" }) {
  return new NextRequest("http://localhost/api/catalog/visual-search", { method: "POST", headers: { "Content-Type": "application/json", ...(stream ? { Accept: "application/x-ndjson" } : {}) }, body: JSON.stringify(body) });
}
function gemini(text = JSON.stringify(analysis)) {
  return Response.json({ candidates: [{ content: { parts: [{ text }] } }], usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 10, totalTokenCount: 30 } });
}

describe("Visual search API with actual stage streaming", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.products.mockResolvedValue([product]); mocks.usage.mockResolvedValue(undefined);
    mocks.key.mockReturnValue("test-key-not-a-real-credential"); mocks.models.mockResolvedValue(["gemini-test"]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(gemini()));
  });
  afterEach(() => vi.unstubAllGlobals());
  it("emits the catalog event before the model responds, then returns verified matches and records tokens", async () => {
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const response = await POST(request());
    const events: string[] = [];
    const pending = readVisualSearchResponse(response, event => { if (event.kind === "progress") events.push(event.stage); });
    await vi.waitFor(() => expect(events).toContain("model"));
    expect(events).toEqual(["received", "catalog", "model"]);
    finish(gemini());
    const data = await pending;
    expect(events).toEqual(["received", "catalog", "model", "analysis", "matching", "complete"]);
    expect(data.exactProduct?.sku).toBe(product.sku);
    expect(data.exactProduct?.stockAvailable).toBe(0);
    expect(mocks.usage).toHaveBeenCalledWith(expect.objectContaining({ success: true, totalTokens: 30 }));
  });
  it("preserves JSON callers", async () => {
    const response = await POST(request(false));
    expect(response.headers.get("content-type")).toContain("application/json");
    expect((await response.json()).data.inStoreInventory).toBe(true);
  });
  it("rejects fabricated inventory and franchise-only exact matches", async () => {
    mocks.products.mockResolvedValue([{ ...product, name: "Pokémon Pikachu" }]);
    vi.mocked(fetch).mockResolvedValue(gemini(JSON.stringify({ ...analysis, itemOrCharacter: "Charizard", exactMatchSku: "GHOST-SKU" })));
    const data = await readVisualSearchResponse(await POST(request()), () => {});
    expect(data.inStoreInventory).toBe(false);
    expect(data.exactProduct).toBeNull();
    expect(data.analysis.exactMatchSku).toBeNull();
    expect(data.matchedProducts).toHaveLength(1);
  });
  it("reports malformed model output as an error and unsuccessful telemetry", async () => {
    vi.mocked(fetch).mockResolvedValue(gemini("No pude identificar la imagen."));
    await expect(readVisualSearchResponse(await POST(request()), () => {})).rejects.toThrow("identificación válida");
    expect(mocks.usage).toHaveBeenCalledWith(expect.objectContaining({ success: false, statusCode: 502 }));
  });
  it("reports model fallback using real HTTP status events", async () => {
    mocks.models.mockResolvedValue(["first", "second"]);
    vi.mocked(fetch).mockResolvedValueOnce(new Response("unavailable", { status: 503 })).mockResolvedValueOnce(gemini());
    const messages: string[] = [];
    await readVisualSearchResponse(await POST(request()), event => { if (event.kind === "progress") messages.push(event.message); });
    expect(messages.some(message => message.includes("HTTP 503"))).toBe(true);
    expect(messages.some(message => message.includes("Consultando second"))).toBe(true);
  });
  it("fails when the catalog is unavailable without calling Gemini", async () => {
    mocks.products.mockResolvedValue(null);
    await expect(readVisualSearchResponse(await POST(request()), () => {})).rejects.toThrow("consultar el catálogo");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("aborts the model request when the stream consumer cancels", async () => {
    vi.mocked(fetch).mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")), { once: true });
    }));
    const response = await POST(request());
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    await response.body?.cancel();
    expect(signal?.aborted).toBe(true);
    expect(mocks.usage).not.toHaveBeenCalled();
  });
  it("validates MIME, base64 and configuration", async () => {
    expect((await POST(request(false, { imageBase64: "aGVsbG8=", mimeType: "image/gif" }))).status).toBe(400);
    expect((await POST(request(false, { imageBase64: "garbage" }))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    mocks.key.mockReturnValue("");
    expect((await POST(request())).status).toBe(503);
  });
});

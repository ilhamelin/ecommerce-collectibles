import { describe, expect, it, vi } from "vitest";
import { readVisualSearchResponse, type VisualSearchResult } from "../src/lib/services/visualSearch";

export const result: VisualSearchResult = {
  analysis: { franchise: "Pokémon", itemOrCharacter: "Pikachu", suggestedCategory: "FIGURE", searchKeywords: "Pikachu", confidenceScore: 0, inStoreInventory: false, exactMatchSku: null, matchedProductName: null, summary: "Figura de Pikachu." },
  inStoreInventory: false, exactProduct: null, matchedProducts: [], totalMatches: 0,
};

describe("Visual search event reader", () => {
  it("decodes split UTF-8 characters and a final line without newline", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ kind: "progress", stage: "analysis", message: "Pokémon identificado" }) + "\n" + JSON.stringify({ kind: "result", data: result }));
    const stream = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close(); } });
    const event = vi.fn();
    expect(await readVisualSearchResponse(new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } }), event)).toEqual(result);
    expect(event).toHaveBeenCalledWith({ kind: "progress", stage: "analysis", message: "Pokémon identificado" });
  });
  it("supports existing JSON responses", async () => {
    expect(await readVisualSearchResponse(Response.json({ success: true, data: result }), vi.fn())).toEqual(result);
  });
  it("rejects server errors and cancels the stream", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"kind":"error","message":"Sin servicio"}\n')); }, cancel });
    await expect(readVisualSearchResponse(new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } }), vi.fn())).rejects.toThrow("Sin servicio");
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("rejects incomplete transmissions instead of inventing results", async () => {
    await expect(readVisualSearchResponse(new Response('{"kind":"progress","stage":"catalog","message":"Catálogo consultado"}\n', { headers: { "Content-Type": "application/x-ndjson" } }), vi.fn())).rejects.toThrow("sin resultados");
  });
  it("rejects invalid confidence values", async () => {
    await expect(readVisualSearchResponse(Response.json({ success: true, data: { ...result, analysis: { ...result.analysis, confidenceScore: 95 } } }), vi.fn())).rejects.toThrow();
  });
  it("preserves a server HTTP error", async () => {
    await expect(readVisualSearchResponse(Response.json({ success: false, error: "Servicio no configurado" }, { status: 503 }), vi.fn())).rejects.toThrow("Servicio no configurado");
  });
});

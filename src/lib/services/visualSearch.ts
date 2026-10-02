import { z } from "zod";

export const visualSearchAnalysisSchema = z.object({
  franchise: z.string().default(""),
  itemOrCharacter: z.string().trim().min(1),
  suggestedCategory: z.enum(["FIGURE", "VIDEO_GAME", "CONSOLE", "HARDWARE", "GAMING_ACCESSORY", "BOOK", "APPAREL", "COLLECTIBLE", "MERCH", "AUDIO"]),
  searchKeywords: z.string().default(""),
  confidenceScore: z.number().min(0).max(1).nullable().default(null),
  inStoreInventory: z.boolean().default(false),
  exactMatchSku: z.string().nullable().default(null),
  matchedProductName: z.string().nullable().default(null),
  summary: z.string().trim().min(1),
});

const productSchema = z.object({
  id: z.string(), sku: z.string(), name: z.string(), price: z.number(),
  imageUrl: z.string().optional(), images: z.array(z.string()).optional(),
  stockAvailable: z.number().optional(),
});

export const visualSearchResultSchema = z.object({
  analysis: visualSearchAnalysisSchema,
  inStoreInventory: z.boolean(),
  exactProduct: productSchema.nullable(),
  matchedProducts: z.array(productSchema),
  totalMatches: z.number().int().nonnegative(),
});
export type VisualSearchResult = z.infer<typeof visualSearchResultSchema>;
export const visualSearchStageSchema = z.enum(["received", "catalog", "model", "analysis", "matching", "complete"]);
export type VisualSearchStage = z.infer<typeof visualSearchStageSchema>;
const eventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("progress"), stage: visualSearchStageSchema, message: z.string() }),
  z.object({ kind: z.literal("result"), data: visualSearchResultSchema }),
  z.object({ kind: z.literal("error"), message: z.string() }),
]);
export type VisualSearchEvent = z.infer<typeof eventSchema>;

/** Validates real server events, including UTF-8 split across network chunks and legacy JSON responses. */
export async function readVisualSearchResponse(response: Response, onEvent: (event: VisualSearchEvent) => void): Promise<VisualSearchResult> {
  if (!response.headers.get("content-type")?.includes("application/x-ndjson")) {
    const envelope = z.object({ success: z.boolean(), error: z.string().optional(), data: z.unknown().optional() }).parse(await response.json());
    if (!response.ok || !envelope.success) throw new Error(envelope.error || "No se pudo identificar la imagen.");
    return visualSearchResultSchema.parse(envelope.data);
  }
  if (!response.ok || !response.body) throw new Error("No se pudo conectar con la búsqueda por foto.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: VisualSearchResult | undefined;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = eventSchema.parse(JSON.parse(line));
    if (event.kind === "error") throw new Error(event.message);
    if (event.kind === "result") result = event.data;
    onEvent(event);
  };
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      lines.forEach(consume);
      if (chunk.done) break;
    }
    consume(buffer);
    if (!result) throw new Error("La conexión terminó sin resultados. Puedes reintentar.");
    return result;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

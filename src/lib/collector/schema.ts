import { z } from "zod";

export const collectorCategories = {
  FIGURE: "Figura", VIDEO_GAME: "Videojuego", COLLECTIBLE: "Coleccionable / TCG",
  CONSOLE: "Consola", HARDWARE: "Hardware / PC", ACCESSORY: "Accesorio", MANGA: "Manga / Artbook", OTHER: "Otra pieza",
} as const;
export const collectorConditions = { SEALED: "Sellado", EXCELLENT: "Excelente", GOOD: "Bueno", USED: "Con detalles" } as const;
export type CollectorKind = "COLLECTION" | "WANTED";
const photo = z.string().trim().max(1500).refine(value => !value || (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) || (() => {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
})(), "Usa una URL HTTPS para la foto.");
export const collectorInput = z.object({
  title: z.string().trim().min(2).max(180),
  category: z.enum(["FIGURE", "VIDEO_GAME", "COLLECTIBLE", "CONSOLE", "HARDWARE", "ACCESSORY", "MANGA", "OTHER"]),
  universe: z.string().trim().max(100).default(""), edition: z.string().trim().max(100).default(""),
  condition: z.enum(["SEALED", "EXCELLENT", "GOOD", "USED"]).default("GOOD"),
  photoUrl: photo.default(""), notes: z.string().trim().max(1500).default(""),
  productId: z.string().trim().regex(/^[a-zA-Z0-9_-]{1,150}$/).nullable().default(null),
  maxBudget: z.number().int().min(1).max(100000000).nullable().default(null),
}).strict();
export type CollectorInput = z.infer<typeof collectorInput>;
export const collectorEntrySchema = collectorInput.extend({
  id: z.string().uuid(), kind: z.enum(["COLLECTION", "WANTED"]), createdAt: z.string(), updatedAt: z.string(),
});
export type CollectorEntry = z.infer<typeof collectorEntrySchema>;
export type CollectorMatch = { id: string; sku: string; name: string; photoUrl: string; price: number; updatedAt: string };
export type CollectorFeed = { entries: CollectorEntry[]; matches: Record<string, CollectorMatch[]>; catalogAvailable: boolean };

/** Private storage is bounded to stay below Firestore's document size limit. */
export function parseCollectorEntries(value: unknown): CollectorEntry[] {
  if (value === undefined) return [];
  return z.array(collectorEntrySchema).max(120).parse(value);
}

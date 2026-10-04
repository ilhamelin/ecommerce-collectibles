import { z } from "zod";
import type { CollectorEntry, CollectorMatch } from "./schema";

const catalogProduct = z.object({ id: z.string(), sku: z.string(), name: z.string(), type: z.string(), price: z.number().finite().nonnegative(),
  images: z.array(z.string()).optional(), stockAvailable: z.number(), stockReserved: z.number().optional(),
  calculatedAvailableStock: z.number().optional(), isPreOrder: z.boolean().optional(), updatedAt: z.string().optional(),
});
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const ignored = new Set(["de", "del", "la", "el", "los", "las", "the", "a", "an", "and", "con", "para", "figura", "figure", "juego", "videojuego", "edicion", "edition"]);
const tokens = (text: string) => [...new Set(normalize(text).split(" ").filter(token => token.length > 1 && !ignored.has(token)))];

/** Conservative name matching; suggestions are never claimed as verified identification. */
export function matchWantedPieces(entries: CollectorEntry[], products: unknown[]): Record<string, CollectorMatch[]> {
  const catalog = products.flatMap(raw => { const result = catalogProduct.safeParse(raw); return result.success ? [result.data] : []; });
  const result: Record<string, CollectorMatch[]> = {};
  for (const entry of entries.filter(item => item.kind === "WANTED")) {
    const query = tokens([entry.title, entry.edition].filter(Boolean).join(" "));
    result[entry.id] = catalog.filter(product => {
      if (product.isPreOrder || (product.calculatedAvailableStock ?? product.stockAvailable - (product.stockReserved || 0)) <= 0) return false;
      if (entry.maxBudget !== null && product.price > entry.maxBudget) return false;
      if (entry.productId) return product.id === entry.productId;
      if (entry.category !== "OTHER" && product.type !== entry.category) return false;
      const name = new Set(tokens(product.name));
      return query.length > 0 && query.every(token => name.has(token));
    }).sort((a, b) => a.price - b.price || a.id.localeCompare(b.id)).slice(0, 6).map(product => ({
      id: product.id, sku: product.sku, name: product.name, price: product.price,
      photoUrl: product.images?.[0] || "", updatedAt: product.updatedAt || entry.createdAt,
    }));
  }
  return result;
}

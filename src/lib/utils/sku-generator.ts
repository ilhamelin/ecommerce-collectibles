/**
 * Intelligent SKU Generator for OmniCollector Chile
 * Analyzes product name, category, and metadata to generate clean, professional,
 * collision-free SKUs verified against existing database records.
 */

import { ProductType } from "../types/domain";

const STOP_WORDS = new Set([
  "de", "la", "el", "en", "un", "una", "del", "los", "las", "por", "para", "con",
  "the", "of", "and", "in", "to", "a", "an", "scale", "figure", "figura", "pvc",
  "pvc/abs", "edition", "edicion", "edición", "ver", "version", "versión"
]);

/**
 * Clean and normalize a string: removes accents, symbols, keeps alphanumeric and hyphens.
 */
function normalizeString(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9\s-]/g, "") // remove punctuation
    .trim();
}

/**
 * Extracts clean uppercase acronyms or abbreviated slug words from a name.
 */
function extractNameKeywords(name: string, maxWords: number = 3): string[] {
  const clean = normalizeString(name);
  const words = clean.split(/\s+/).filter((w) => w.length > 0);

  const filtered = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
  const chosen = (filtered.length > 0 ? filtered : words).slice(0, maxWords);

  return chosen.map((w) => {
    // Truncate overly long words (e.g., Chainsaw -> CHAIN)
    const upper = w.toUpperCase();
    return upper.length > 8 ? upper.slice(0, 6) : upper;
  });
}

/**
 * Detects specific collector traits from name (scales like 1/7, editions, grades).
 */
function extractCollectorSuffix(name: string, type: ProductType): string | null {
  const upper = name.toUpperCase();

  // 1. Scales for figures
  if (type === "FIGURE") {
    if (upper.includes("1/4") || upper.includes("1:4")) return "14";
    if (upper.includes("1/6") || upper.includes("1:6")) return "16";
    if (upper.includes("1/7") || upper.includes("1:7")) return "17";
    if (upper.includes("1/8") || upper.includes("1:8")) return "18";
    if (upper.includes("1/12") || upper.includes("1:12")) return "112";
    if (upper.includes("NENDOROID") || upper.includes("NENDO")) return "NENDO";
    if (upper.includes("POPMART") || upper.includes("POP UP")) return "PUP";
  }

  // 2. Video game editions
  if (type === "VIDEO_GAME") {
    if (upper.includes("COLLECTOR") || upper.includes("COLECCIONISTA")) return "CE";
    if (upper.includes("DELUXE")) return "DX";
    if (upper.includes("STEELBOOK")) return "SB";
    if (upper.includes("LIMITED") || upper.includes("LIMITADA")) return "LTD";
  }

  // 3. TCG & Collectibles grades
  if (type === "COLLECTIBLE") {
    if (upper.includes("PSA 10") || upper.includes("PSA10")) return "PSA10";
    if (upper.includes("PSA 9") || upper.includes("PSA9")) return "PSA9";
    if (upper.includes("BGS 9.5") || upper.includes("BGS9.5")) return "BGS95";
    if (upper.includes("CGC 10") || upper.includes("CGC10")) return "CGC10";
    if (upper.includes("1ST ED") || upper.includes("1ST EDITION") || upper.includes("PRIMERA EDICION")) return "1ED";
  }

  return null;
}

/**
 * Returns the standard prefix for a product type.
 */
export function getSkuPrefix(type: ProductType, name: string = ""): string {
  switch (type) {
    case "FIGURE":
      return "FIG";
    case "VIDEO_GAME":
      return "VG";
    case "COLLECTIBLE": {
      const upper = name.toUpperCase();
      if (
        upper.includes("TCG") ||
        upper.includes("POKEMON") ||
        upper.includes("POKÉMON") ||
        upper.includes("MAGIC") ||
        upper.includes("YUGIOH") ||
        upper.includes("ONE PIECE CARD") ||
        upper.includes("CHARIZARD") ||
        upper.includes("PIKACHU")
      ) {
        return "TCG";
      }
      return "COL";
    }
    case "BUNDLE":
      return "BUN";
    default:
      return "PROD";
  }
}

/**
 * Generates a candidate SKU from product name, type and optional extras.
 */
export function generateBaseSku(name: string, type: ProductType): string {
  const prefix = getSkuPrefix(type, name);
  const keywords = extractNameKeywords(name);
  const suffix = extractCollectorSuffix(name, type);

  const parts: string[] = [prefix];

  if (keywords.length > 0) {
    parts.push(...keywords);
  } else {
    parts.push("ITEM");
  }

  if (suffix && !parts.includes(suffix)) {
    parts.push(suffix);
  }

  return parts.join("-").toUpperCase();
}

/**
 * Resolves collisions against an existing list/set of SKUs in the database.
 * If baseSku exists, it appends or increments a sequential suffix (-01, -02, etc.).
 */
export function resolveSkuCollision(
  baseSku: string,
  existingSkus: Iterable<string>
): { sku: string; hadCollision: boolean; collisionCount: number } {
  const taken = new Set(Array.from(existingSkus).map((s) => s.toUpperCase().trim()));

  const candidate = baseSku.toUpperCase().trim();

  // If candidate is already completely unique
  if (!taken.has(candidate)) {
    return { sku: candidate, hadCollision: false, collisionCount: 0 };
  }

  // If candidate has collision, try -01, -02, -03 ...
  let counter = 1;
  let uniqueSku = "";

  while (counter < 1000) {
    const padded = counter < 10 ? `0${counter}` : `${counter}`;
    const testSku = `${candidate}-${padded}`;
    if (!taken.has(testSku)) {
      uniqueSku = testSku;
      break;
    }
    counter++;
  }

  return {
    sku: uniqueSku || `${candidate}-${Date.now().toString().slice(-4)}`,
    hadCollision: true,
    collisionCount: counter,
  };
}

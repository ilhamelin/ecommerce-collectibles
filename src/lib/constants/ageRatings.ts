export interface AgeRatingOption {
  value: string;
  label: string;
  system: "CHILE" | "ESRB" | "PEGI" | "CERO" | "USK" | "OTHER";
  badgeColor?: string;
}

export const WORLDWIDE_AGE_RATINGS: AgeRatingOption[] = [
  // Chile - Ley 19.846
  { value: "TE", label: "TE - Todo Espectador (Chile)", system: "CHILE" },
  { value: "8+", label: "8+ - Mayores de 8 años (Chile)", system: "CHILE" },
  { value: "14+", label: "14+ - Mayores de 14 años (Chile)", system: "CHILE" },
  { value: "18+", label: "18+ - Mayores de 18 años (Chile)", system: "CHILE" },

  // ESRB (América)
  { value: "ESRB E", label: "ESRB: E (Everyone - Todas las edades)", system: "ESRB" },
  { value: "ESRB E10+", label: "ESRB: E10+ (Everyone 10+)", system: "ESRB" },
  { value: "ESRB T", label: "ESRB: T (Teen - Adolescentes 13+)", system: "ESRB" },
  { value: "ESRB M", label: "ESRB: M (Mature 17+ - Adultos jóvenes)", system: "ESRB" },
  { value: "ESRB AO", label: "ESRB: AO (Adults Only 18+)", system: "ESRB" },
  { value: "ESRB RP", label: "ESRB: RP (Rating Pending - Pendiente)", system: "ESRB" },

  // PEGI (Europa)
  { value: "PEGI 3", label: "PEGI 3 (Apto para mayores de 3 años)", system: "PEGI" },
  { value: "PEGI 7", label: "PEGI 7 (Mayores de 7 años)", system: "PEGI" },
  { value: "PEGI 12", label: "PEGI 12 (Mayores de 12 años)", system: "PEGI" },
  { value: "PEGI 16", label: "PEGI 16 (Mayores de 16 años)", system: "PEGI" },
  { value: "PEGI 18", label: "PEGI 18 (Solo adultos 18+)", system: "PEGI" },

  // CERO (Japón)
  { value: "CERO A", label: "CERO A (Todas las edades - Japón)", system: "CERO" },
  { value: "CERO B", label: "CERO B (Mayores de 12 años - Japón)", system: "CERO" },
  { value: "CERO C", label: "CERO C (Mayores de 15 años - Japón)", system: "CERO" },
  { value: "CERO D", label: "CERO D (Mayores de 17 años - Japón)", system: "CERO" },
  { value: "CERO Z", label: "CERO Z (Solo adultos 18+ - Japón)", system: "CERO" },

  // USK (Alemania)
  { value: "USK 0", label: "USK 0 (Sin restricciones de edad)", system: "USK" },
  { value: "USK 6", label: "USK 6 (Mayores de 6 años)", system: "USK" },
  { value: "USK 12", label: "USK 12 (Mayores de 12 años)", system: "USK" },
  { value: "USK 16", label: "USK 16 (Mayores de 16 años)", system: "USK" },
  { value: "USK 18", label: "USK 18 (No apto para menores de 18)", system: "USK" },

  // General / Coleccionismo
  { value: "EXEMPT", label: "Sin Sello / Coleccionable Exento", system: "OTHER" },
  { value: "CUSTOM", label: "Otro / Sello Personalizado", system: "OTHER" },
];

/**
 * Checks if a given value is one of the predefined official regulatory ratings
 */
export function isValidAgeRating(val?: string | null): boolean {
  if (!val) return false;
  return WORLDWIDE_AGE_RATINGS.some((r) => r.value.toLowerCase() === val.trim().toLowerCase());
}

/**
 * Normalizes any incoming age rating or classification string (from AI, OCR or heuristics)
 * to an exact canonical regulatory option matching WORLDWIDE_AGE_RATINGS.
 *
 * It enforces that the rating represents the PHYSICAL OR DIGITAL PRODUCT (game, figure, hardware, etc.)
 * and NOT any YouTube trailer video restriction.
 */
export function normalizeProductAgeRating(rawRating?: string | null, productType?: string): string {
  if (!rawRating || typeof rawRating !== "string" || !rawRating.trim()) {
    if (productType === "VIDEO_GAME") return "ESRB T";
    if (productType === "FIGURE") return "14+";
    if (productType === "BOOK") return "14+";
    return "EXEMPT";
  }

  const trimmed = rawRating.trim();
  const upper = trimmed.toUpperCase().replace(/[\s_-]+/g, " ");

  // 1. Direct case-insensitive match
  const directMatch = WORLDWIDE_AGE_RATINGS.find(
    (r) => r.value.toUpperCase() === upper || r.value.toUpperCase() === trimmed.toUpperCase()
  );
  if (directMatch) return directMatch.value;

  // 2. ESRB (América)
  if (upper.includes("ESRB M") || upper === "M" || upper.includes("MATURE") || upper.includes("M 17") || upper.includes("M17")) {
    return "ESRB M";
  }
  if (upper.includes("ESRB T") || upper === "TEEN" || upper.includes("T 13") || upper.includes("T13")) {
    return "ESRB T";
  }
  if (upper.includes("ESRB E10") || upper.includes("E10") || upper.includes("EVERYONE 10")) {
    return "ESRB E10+";
  }
  if (upper.includes("ESRB E") || upper === "EVERYONE") {
    return "ESRB E";
  }
  if (upper.includes("ESRB AO") || upper.includes("ADULTS ONLY")) {
    return "ESRB AO";
  }
  if (upper.includes("ESRB RP") || upper.includes("RATING PENDING")) {
    return "ESRB RP";
  }

  // 3. Chile - Ley 19.846
  if (upper === "TE" || upper.includes("TODO ESPECTADOR")) return "TE";
  if (upper === "8+" || upper.includes("MAYORES DE 8") || upper === "8") return "8+";
  if (upper === "14+" || upper.includes("MAYORES DE 14") || upper === "14") return "14+";
  if (upper === "18+" || upper.includes("MAYORES DE 18") || upper === "18" || upper === "M18") return "18+";

  // 4. PEGI (Europa)
  if (upper.includes("PEGI 18")) return "PEGI 18";
  if (upper.includes("PEGI 16")) return "PEGI 16";
  if (upper.includes("PEGI 12")) return "PEGI 12";
  if (upper.includes("PEGI 7")) return "PEGI 7";
  if (upper.includes("PEGI 3")) return "PEGI 3";

  // 5. CERO (Japón)
  if (upper.includes("CERO Z")) return "CERO Z";
  if (upper.includes("CERO D")) return "CERO D";
  if (upper.includes("CERO C")) return "CERO C";
  if (upper.includes("CERO B")) return "CERO B";
  if (upper.includes("CERO A")) return "CERO A";

  // 6. USK (Alemania)
  if (upper.includes("USK 18")) return "USK 18";
  if (upper.includes("USK 16")) return "USK 16";
  if (upper.includes("USK 12")) return "USK 12";
  if (upper.includes("USK 6")) return "USK 6";
  if (upper.includes("USK 0")) return "USK 0";

  // 7. Exento / Sin Sello
  if (
    upper.includes("EXEMPT") ||
    upper.includes("EXENTO") ||
    upper.includes("SIN SELLO") ||
    upper.includes("NO RATING") ||
    upper === "NONE" ||
    upper === "ALL"
  ) {
    return "EXEMPT";
  }

  // 8. Categories without regulatory content restriction
  if (
    ["HARDWARE", "CONSOLE", "GAMING_ACCESSORY", "APPAREL", "MERCH", "AUDIO", "COLLECTIBLE"].includes(
      productType || ""
    )
  ) {
    return "EXEMPT";
  }

  return trimmed;
}


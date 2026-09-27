import { describe, it, expect } from "vitest";
import { normalizeProductAgeRating, isValidAgeRating, WORLDWIDE_AGE_RATINGS } from "../src/lib/constants/ageRatings";

describe("Product Age Rating Normalizer Test Suite", () => {
  it("should validate all canonical WORLDWIDE_AGE_RATINGS as valid", () => {
    for (const opt of WORLDWIDE_AGE_RATINGS) {
      expect(isValidAgeRating(opt.value)).toBe(true);
      expect(normalizeProductAgeRating(opt.value)).toBe(opt.value);
    }
  });

  it("should normalize ESRB variations correctly to canonical ESRB options", () => {
    expect(normalizeProductAgeRating("ESRB_M", "VIDEO_GAME")).toBe("ESRB M");
    expect(normalizeProductAgeRating("m", "VIDEO_GAME")).toBe("ESRB M");
    expect(normalizeProductAgeRating("Mature 17+", "VIDEO_GAME")).toBe("ESRB M");
    expect(normalizeProductAgeRating("ESRB: M (Mature)", "VIDEO_GAME")).toBe("ESRB M");

    expect(normalizeProductAgeRating("ESRB_T", "VIDEO_GAME")).toBe("ESRB T");
    expect(normalizeProductAgeRating("teen", "VIDEO_GAME")).toBe("ESRB T");
    expect(normalizeProductAgeRating("t 13+", "VIDEO_GAME")).toBe("ESRB T");

    expect(normalizeProductAgeRating("ESRB_E", "VIDEO_GAME")).toBe("ESRB E");
    expect(normalizeProductAgeRating("everyone", "VIDEO_GAME")).toBe("ESRB E");
    expect(normalizeProductAgeRating("e10+", "VIDEO_GAME")).toBe("ESRB E10+");
  });

  it("should normalize Chilean ratings correctly (Ley 19.846)", () => {
    expect(normalizeProductAgeRating("TE", "FIGURE")).toBe("TE");
    expect(normalizeProductAgeRating("Todo Espectador", "FIGURE")).toBe("TE");
    expect(normalizeProductAgeRating("14+", "FIGURE")).toBe("14+");
    expect(normalizeProductAgeRating("Mayores de 14 años", "FIGURE")).toBe("14+");
    expect(normalizeProductAgeRating("18+", "FIGURE")).toBe("18+");
    expect(normalizeProductAgeRating("M18", "VIDEO_GAME")).toBe("18+");
  });

  it("should normalize PEGI, CERO and USK ratings", () => {
    expect(normalizeProductAgeRating("PEGI_18", "VIDEO_GAME")).toBe("PEGI 18");
    expect(normalizeProductAgeRating("pegi 16", "VIDEO_GAME")).toBe("PEGI 16");
    expect(normalizeProductAgeRating("CERO_Z", "VIDEO_GAME")).toBe("CERO Z");
    expect(normalizeProductAgeRating("cero a", "VIDEO_GAME")).toBe("CERO A");
    expect(normalizeProductAgeRating("USK_18", "VIDEO_GAME")).toBe("USK 18");
  });

  it("should assign EXEMPT for hardware, consoles, accessories, apparel, and TCG", () => {
    expect(normalizeProductAgeRating("EXEMPT", "HARDWARE")).toBe("EXEMPT");
    expect(normalizeProductAgeRating("Sin Sello", "HARDWARE")).toBe("EXEMPT");
    expect(normalizeProductAgeRating("Exento", "CONSOLE")).toBe("EXEMPT");
    expect(normalizeProductAgeRating("ALL", "COLLECTIBLE")).toBe("EXEMPT");
    expect(normalizeProductAgeRating("", "HARDWARE")).toBe("EXEMPT");
    expect(normalizeProductAgeRating(null, "GAMING_ACCESSORY")).toBe("EXEMPT");
    expect(normalizeProductAgeRating(undefined, "APPAREL")).toBe("EXEMPT");
  });

  it("should preserve custom unknown seals as trimmed strings", () => {
    expect(normalizeProductAgeRating("Sello Especial de Autor")).toBe("Sello Especial de Autor");
  });
});

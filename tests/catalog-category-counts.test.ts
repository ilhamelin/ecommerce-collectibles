import { describe, expect, it } from "vitest";
import { getCatalogCategoryCounts, matchesProductCategory } from "../src/lib/services/catalogCategories";
import type { ProductDomainEntity } from "../src/lib/types/domain";

const products: Partial<ProductDomainEntity>[] = [
  { id: "ps5", type: "CONSOLE", name: "Consola PlayStation 5", customCategoryLabel: "CONSOLE", customSpecifications: { categoryType: "CONSOLE" } },
  { id: "switch", type: "CONSOLE", name: "Consola Nintendo Switch 2", customCategoryLabel: "Consolas", customSpecifications: { categoryType: "CONSOLE" } },
  { id: "game", type: "VIDEO_GAME", name: "Juego PS5", customSpecifications: { categoryType: "CONSOLE" } },
  { id: "hardware", type: "HARDWARE", customSpecifications: { categoryType: "HARDWARE" } },
];

describe("Storefront category counts", () => {
  it("counts two consoles once each even when type, label and technical metadata repeat the category", () => {
    const counts = getCatalogCategoryCounts(products);
    expect(counts.CONSOLE).toBe(2);
    expect(counts.VIDEO_GAME).toBe(1);
    expect(counts.HARDWARE).toBe(1);
    expect(counts.ALL).toBe(4);
  });

  it("keeps every native count equal to the category-only catalog results", () => {
    const counts = getCatalogCategoryCounts(products);
    for (const key of Object.keys(counts)) {
      expect(counts[key]).toBe(products.filter((p) => matchesProductCategory(p, key)).length);
    }
  });

  it("resolves legacy OTHER consoles once and preserves the OTHER filter", () => {
    const legacy = { type: "OTHER", customSpecifications: { categoryType: "CONSOLE" } };
    expect(getCatalogCategoryCounts([legacy])).toMatchObject({ ALL: 1, CONSOLE: 1, OTHER: 1 });
  });

  it("counts custom categories by their ID or name without adding both aliases", () => {
    const categories = [{ id: "custom-1", name: "Dioramas" }];
    const custom = [
      { type: "OTHER", customCategoryLabel: "Dioramas", customSpecifications: { categoryType: "custom-1" } },
      { type: "OTHER", customCategoryLabel: "dioramas" },
    ];
    const counts = getCatalogCategoryCounts(custom, categories);
    expect(counts["custom-1"]).toBe(2);
    expect(counts.Dioramas).toBe(2);
    expect(matchesProductCategory(custom[1], "custom-1", categories)).toBe(true);
  });

  it("does not count stale custom metadata on a product assigned to a different native category", () => {
    const categories = [{ id: "custom-1", name: "Dioramas" }];
    expect(getCatalogCategoryCounts([{ type: "VIDEO_GAME", customCategoryLabel: "Dioramas" }], categories)["custom-1"]).toBe(0);
  });

  it("starts with empty real counts instead of sample catalog numbers", () => {
    const counts = getCatalogCategoryCounts([]);
    expect(Object.values(counts).every((count) => count === 0)).toBe(true);
  });
});

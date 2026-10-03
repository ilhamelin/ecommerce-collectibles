import { describe, expect, it } from "vitest";
import { filterDefaults, parseCatalogFilters, serializeCatalogFilters, matchesExtraFilters, normalizeCatalogText, productManufacturers } from "@/lib/services/catalogFilters";
import { TEST_MOCK_PRODUCTS } from "@/lib/constants/testProducts";
describe("Catalog discovery filters", () => {
 it("round trips every filter while preserving unrelated URL parameters", () => {
  const filters = { ...filterDefaults, selectedCategory: "FIGURE", searchQuery: "Máscara kitsune", sortBy: "PRICE_ASC", minPrice: "10000", maxPrice: "60000", stockFilter: "PREORDER", platformFilter: "PS5", scaleFilter: "SCALE_1_7", conditionFilter: "MINT_9", consoleTypeFilter: "RETRO", hardwareTypeFilter: "GPU", accessoryTypeFilter: "CONTROLLER", bookLangFilter: "JAPANESE", apparelSizeFilter: "L", merchTypeFilter: "POSTER", audioFormatFilter: "VINYL", manufacturerFilter: "BANDAI", arrivalFrom: "2026-10-01", arrivalTo: "2026-12-31" };
  const params = new URLSearchParams(serializeCatalogFilters(filters, new URLSearchParams("campaign=x")));
  expect(parseCatalogFilters(params)).toEqual(filters); expect(params.get("campaign")).toBe("x");
 });
 it("clears all managed filters and migrates old search aliases", () => {
  expect(serializeCatalogFilters(filterDefaults, new URLSearchParams("q=test&category=FIGURE&search=old&tag=old&min=5&campaign=x"))).toBe("campaign=x");
  expect(parseCatalogFilters(new URLSearchParams("search=Zelda")).searchQuery).toBe("Zelda");
 });
 it("rejects invalid prices, unknown stock/sorts and impossible calendar dates", () => {
  const parsed = parseCatalogFilters(new URLSearchParams("min=-1&max=abc&stock=FAKE&sort=UNKNOWN&arrivalFrom=2026-02-31&arrivalTo=tomorrow"));
  expect(parsed).toEqual(filterDefaults);
 });
 it("matches accented searches and manufacturer metadata", () => {
  expect(normalizeCatalogText("  Máscara  ")).toBe("mascara");
  const p = TEST_MOCK_PRODUCTS[0]; expect(productManufacturers(p)).toContain("Bandai Namco Entertainment");
  expect(matchesExtraFilters(p, { ...filterDefaults, manufacturerFilter: "bándai namco entertainment" })).toBe(true);
  expect(matchesExtraFilters(p, { ...filterDefaults, manufacturerFilter: "Nintendo" })).toBe(false);
 });
 it("only accepts recorded preorder dates within the selected range", () => {
  const p = { ...TEST_MOCK_PRODUCTS[2], isPreOrder: true, figureMetadata: { id: "m", productId: "p", scale: "NON_SCALE", manufacturer: "BANDAI", allowsPartialDeposit: true, minimumDepositPercent: 0.3, estimatedArrivalDate: "2026-11-01" } };
  const range = { ...filterDefaults, arrivalFrom: "2026-10-01", arrivalTo: "2026-12-01" };
  expect(matchesExtraFilters(p, range)).toBe(true);
  expect(matchesExtraFilters({ ...p, isPreOrder: false }, range)).toBe(false);
  expect(matchesExtraFilters({ ...p, figureMetadata: { ...p.figureMetadata, estimatedArrivalDate: "Inmediata" } }, range)).toBe(false);
  expect(matchesExtraFilters(p, { ...range, arrivalTo: "2026-10-30" })).toBe(false);
 });
});

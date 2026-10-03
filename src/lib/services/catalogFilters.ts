import type { ProductDomainEntity } from "@/lib/types/domain";
export const filterDefaults = { selectedCategory: "ALL", searchQuery: "", sortBy: "FEATURED", minPrice: "", maxPrice: "", stockFilter: "ALL", platformFilter: "ALL", scaleFilter: "ALL", conditionFilter: "ALL", consoleTypeFilter: "ALL", hardwareTypeFilter: "ALL", accessoryTypeFilter: "ALL", bookLangFilter: "ALL", apparelSizeFilter: "ALL", merchTypeFilter: "ALL", audioFormatFilter: "ALL", manufacturerFilter: "ALL", arrivalFrom: "", arrivalTo: "" };
export type CatalogFilters = typeof filterDefaults;
export const filterKeys: Record<keyof CatalogFilters, string> = { selectedCategory: "category", searchQuery: "q", sortBy: "sort", minPrice: "min", maxPrice: "max", stockFilter: "stock", platformFilter: "platform", scaleFilter: "scale", conditionFilter: "condition", consoleTypeFilter: "console", hardwareTypeFilter: "hardware", accessoryTypeFilter: "accessory", bookLangFilter: "language", apparelSizeFilter: "size", merchTypeFilter: "merch", audioFormatFilter: "audio", manufacturerFilter: "manufacturer", arrivalFrom: "arrivalFrom", arrivalTo: "arrivalTo" };
export const normalizeCatalogText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export function parseCatalogFilters(params: URLSearchParams): CatalogFilters {
  const result = { ...filterDefaults };
  for (const key of Object.keys(filterKeys) as (keyof CatalogFilters)[]) result[key] = (params.get(filterKeys[key]) || filterDefaults[key]).slice(0, 200);
  result.searchQuery = (params.get("q") || params.get("search") || params.get("tag") || "").slice(0, 200);
  for (const key of ["minPrice", "maxPrice"] as const) if (!/^\d{1,10}$/.test(result[key])) result[key] = "";
  for (const key of ["arrivalFrom", "arrivalTo"] as const) if (!/^\d{4}-\d{2}-\d{2}$/.test(result[key]) || !Number.isFinite(Date.parse(result[key])) || new Date(result[key]).toISOString().slice(0, 10) !== result[key]) result[key] = "";
  if (!["ALL", "IN_STOCK", "PREORDER"].includes(result.stockFilter)) result.stockFilter = "ALL";
  if (!["FEATURED", "PRICE_ASC", "PRICE_DESC", "PREORDER_FIRST"].includes(result.sortBy)) result.sortBy = "FEATURED";
  return result;
}
export function serializeCatalogFilters(filters: CatalogFilters, existing = new URLSearchParams()): string {
  const params = new URLSearchParams(existing); params.delete("search"); params.delete("tag");
  for (const key of Object.keys(filterKeys) as (keyof CatalogFilters)[]) {
    const value = filters[key].trim(); if (value && value !== filterDefaults[key]) params.set(filterKeys[key], value); else params.delete(filterKeys[key]);
  }
  return params.toString();
}
export function productManufacturers(product: ProductDomainEntity): string[] {
  const values = new Set<string>();
  const visit = (value: unknown, depth: number) => {
    if (!value || typeof value !== "object" || depth > 4) return;
    for (const [key, item] of Object.entries(value)) {
      if (["manufacturer", "brand", "publisher"].includes(key) && typeof item === "string" && item.trim()) values.add(item.trim());
      else if (typeof item === "object") visit(item, depth + 1);
    }
  };
  visit(product.figureMetadata, 0); visit(product.gameMetadata, 0); visit(product.customSpecifications, 0);
  return Array.from(values);
}
export function matchesExtraFilters(product: ProductDomainEntity, filters: Pick<CatalogFilters, "manufacturerFilter" | "arrivalFrom" | "arrivalTo">): boolean {
  if (filters.manufacturerFilter !== "ALL" && !productManufacturers(product).some(name => normalizeCatalogText(name) === normalizeCatalogText(filters.manufacturerFilter))) return false;
  if (filters.arrivalFrom || filters.arrivalTo) {
    const arrival = product.figureMetadata?.estimatedArrivalDate || "";
    // Only actual ISO dates are eligible; an inferred month or 'Inmediata' is not a date.
    if (!product.isPreOrder || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(arrival) || !Number.isFinite(Date.parse(arrival))) return false;
    const date = arrival.slice(0, 10); if (filters.arrivalFrom && date < filters.arrivalFrom || filters.arrivalTo && date > filters.arrivalTo) return false;
  }
  return true;
}

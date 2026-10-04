import type { CustomCategoryEntity, ProductDomainEntity } from "@/lib/types/domain";
import { getProductCategoryInfo } from "@/lib/utils/category";

const NATIVE_CATEGORY_KEYS = [
  "VIDEO_GAME", "FIGURE", "COLLECTIBLE", "BUNDLE", "CONSOLE", "HARDWARE",
  "GAMING_ACCESSORY", "APPAREL", "BOOK", "MERCH", "AUDIO", "OTHER",
] as const;

type Category = Pick<CustomCategoryEntity, "id" | "name">;

/** Shared category membership for catalog filtering and storefront counts. */
export function matchesProductCategory(
  product: Partial<ProductDomainEntity>,
  categoryKey: string,
  customCategories: readonly Category[] = [],
): boolean {
  if (categoryKey === "ALL" || categoryKey === product.type) return true;
  if (product.type !== "OTHER") return false;

  const target = categoryKey.toLowerCase();
  const label = (product.customCategoryLabel || "").toLowerCase();
  const specificationType = (product.customSpecifications?.categoryType || "").toLowerCase();
  const category = customCategories.find((item) => item.id === categoryKey || item.name.toLowerCase() === target);
  return categoryKey === getProductCategoryInfo(product).key
    || label === target
    || specificationType === target
    || Boolean(category && (label === category.name.toLowerCase() || specificationType === category.id.toLowerCase()));
}

/** Count each product once per category, regardless of repeated metadata aliases. */
export function getCatalogCategoryCounts(
  products: readonly Partial<ProductDomainEntity>[],
  customCategories: readonly Category[] = [],
): Record<string, number> {
  const keys = new Set<string>(NATIVE_CATEGORY_KEYS);
  for (const category of customCategories) {
    keys.add(category.id);
    keys.add(category.name);
  }
  const counts: Record<string, number> = { ALL: products.length };
  for (const key of keys) {
    counts[key] = products.filter((product) => matchesProductCategory(product, key, customCategories)).length;
  }
  return counts;
}

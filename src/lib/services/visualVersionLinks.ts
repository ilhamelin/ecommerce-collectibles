/** Archived links must not resurrect deleted products. Catalog failures abort restoration. */
export function pruneArchivedLinks(value: unknown, slugs: Set<string>, ids: Set<string>): unknown {
  if (typeof value === "string" && value.startsWith("/product/")) {
    const slug = value.slice(9).split(/[?#]/)[0].toLowerCase();
    return slugs.has(slug) ? value : "/catalog";
  }
  if (Array.isArray(value)) return value.map(item => pruneArchivedLinks(item, slugs, ids));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key, key === "featuredProductId" && typeof item === "string" && !ids.has(item) ? null : key === "linkedProductSku" && typeof item === "string" && !slugs.has(item.toLowerCase()) ? null : pruneArchivedLinks(item, slugs, ids),
  ]));
  return value;
}

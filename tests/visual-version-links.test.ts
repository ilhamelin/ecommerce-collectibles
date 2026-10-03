import { describe, it, expect } from "vitest";
import { pruneArchivedLinks } from "@/lib/services/visualVersionLinks";
describe("Archived visual product references", () => {
  it("removes deleted spotlight ids and linked skus before restoration", () => {
    const result = pruneArchivedLinks({ settings: { featuredProductId: "deleted" }, slides: [{ linkedProductSku: "VG-OLD", ctaHref: "/product/vg-old" }, { linkedProductSku: "VG-CURRENT", ctaHref: "/product/vg-current?from=home" }] }, new Set(["vg-current"]), new Set(["current"]));
    expect(result).toEqual({ settings: { featuredProductId: null }, slides: [{ linkedProductSku: null, ctaHref: "/catalog" }, { linkedProductSku: "VG-CURRENT", ctaHref: "/product/vg-current?from=home" }] });
  });
  it("preserves unrelated texts, safe catalog links, prices and live ids", () => {
    const input = { settings: { heading: "Original", featuredProductId: "current", primaryHref: "/catalog" }, price: 54990, enabled: true };
    expect(pruneArchivedLinks(input, new Set(), new Set(["current"]))).toEqual(input);
    expect(input.settings.featuredProductId).toBe("current");
  });
});

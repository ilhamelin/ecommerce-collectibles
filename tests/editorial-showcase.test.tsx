import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditorialHero, CollectionShelves } from "../src/components/home/EditorialShowcase";
import type { ProductDomainEntity } from "../src/lib/types/domain";
const product: ProductDomainEntity = { id: "visual-test", sku: "VG-TEST", name: "Producto visual", description: "Descripción de prueba", type: "VIDEO_GAME", price: 60000, costPrice: 30000, stockAvailable: 2, stockReserved: 0, isPreOrder: false, images: ["https://example.com/product.jpg"] };
describe("Editorial product discovery", () => {
  it("does not feature fully reserved products", () => {
    const html = renderToStaticMarkup(<EditorialHero products={[{ ...product, stockReserved: 2 }]} />);
    expect(html).not.toContain("/product/vg-test");
    expect(html).toContain("Cada colección empieza");
  });
  it("keeps the full product price explicit for preorders", () => {
    const html = renderToStaticMarkup(<EditorialHero products={[{ ...product, isPreOrder: true }]} />);
    expect(html).toContain("60.000");
    expect(html).toContain("Preventa · ver condiciones");
  });
  it("does not fabricate inventory sections for an empty catalog", () => {
    expect(renderToStaticMarkup(<CollectionShelves products={[]} />)).toBe("");
  });
  it("orders new products by their real creation date", () => {
    const html = renderToStaticMarkup(<CollectionShelves products={[{ ...product, id: "old", name: "Anterior", createdAt: "2025-01-01" }, { ...product, id: "new", name: "Reciente", createdAt: "2026-01-01" }]} />);
    expect(html.indexOf("Reciente")).toBeLessThan(html.indexOf("Anterior"));
  });
});

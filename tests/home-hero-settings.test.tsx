import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { DEFAULT_HOME_HERO, HomeHeroSettingsSchema, isHomeHeroLink, selectHomeFeaturedProduct, type HomeHeroProduct } from "@/lib/constants/homeHeroDefaults";
import { EditorialHero } from "@/components/home/EditorialShowcase";

const first: HomeHeroProduct = { id: "first", sku: "VG-FIRST", name: "Primero", price: 54990, stockAvailable: 3, stockReserved: 0, isPreOrder: false, imageUrl: "https://example.com/first.jpg" };
const second = { ...first, id: "second", sku: "FIG-SECOND", name: "Segundo", price: 72000 };

describe("Home hero settings and current catalog", () => {
  it("validates defaults without changing the original design", () => {
    expect(HomeHeroSettingsSchema.parse(DEFAULT_HOME_HERO)).toEqual(DEFAULT_HOME_HERO);
    const html = renderToStaticMarkup(<EditorialHero products={[first]} />);
    expect(html).toContain("Tu próxima pieza."); expect(html).toContain("54.990");
    expect(html).toContain('href="/catalog"'); expect(html).toContain('href="#colecciones"');
  });
  it.each(["/catalog", "/catalog?category=FIGURE", "#colecciones", "/product/vg-test"])("allows internal destination %s", href => expect(isHomeHeroLink(href)).toBe(true));
  it.each(["javascript:alert(1)", "https://example.com", "//example.com", "/\\example.com", "/%2Fexample.com", "/%5Cexample.com", "/catalog%0A", "%broken", ""])("rejects unsafe destination %s", href => expect(isHomeHeroLink(href)).toBe(false));
  it("rejects blank/oversized text and unknown settings", () => {
    expect(HomeHeroSettingsSchema.safeParse({ ...DEFAULT_HOME_HERO, heading: "  " }).success).toBe(false);
    expect(HomeHeroSettingsSchema.safeParse({ ...DEFAULT_HOME_HERO, description: "x".repeat(361) }).success).toBe(false);
    expect(HomeHeroSettingsSchema.safeParse({ ...DEFAULT_HOME_HERO, price: 1 }).success).toBe(false);
  });
  it("resolves the selected product using its current price and image", () => {
    const html = renderToStaticMarkup(<EditorialHero products={[first, second]} settings={{ ...DEFAULT_HOME_HERO, featuredProductId: second.id, heading: "Nueva portada", spotlightLabel: "Pieza elegida", primaryHref: "/catalog?category=FIGURE" }} />);
    expect(html).toContain("Nueva portada"); expect(html).toContain("Pieza elegida"); expect(html).toContain("72.000");
    expect(html).toContain('href="/product/fig-second"'); expect(html).not.toContain('href="/product/vg-first"');
  });
  it("replaces deleted, reserved or imageless products with a valid current product", () => {
    expect(selectHomeFeaturedProduct([first], "deleted")).toBe(first);
    expect(selectHomeFeaturedProduct([first, { ...second, stockReserved: 3 }], second.id)).toBe(first);
    expect(selectHomeFeaturedProduct([first, { ...second, imageUrl: "" }], second.id)).toBe(first);
    expect(selectHomeFeaturedProduct([], second.id)).toBeUndefined();
  });
  it("uses a configured preorder label while keeping the actual full price", () => {
    const html = renderToStaticMarkup(<EditorialHero products={[{ ...first, isPreOrder: true }]} settings={{ ...DEFAULT_HOME_HERO, preorderLinkLabel: "Ver preventa" }} />);
    expect(html).toContain("Ver preventa"); expect(html).toContain("54.990");
  });
  it("escapes edited content and makes preview links inert", () => {
    const html = renderToStaticMarkup(<EditorialHero products={[first]} preview settings={{ ...DEFAULT_HOME_HERO, heading: "<script>test</script>" }} />);
    expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<script>"); expect(html).not.toContain("href=");
  });
});

// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeEach } from "vitest";

import { useCompareStore } from "@/lib/store/compareStore";
import { comparisonRows, CompareButton } from "@/components/catalog/ProductComparison";
import type { ProductDomainEntity } from "@/lib/types/domain";
const product: ProductDomainEntity = { id: "one", sku: "VG-ONE", name: "Example", description: "", type: "VIDEO_GAME", price: 54990, costPrice: 12345, stockAvailable: 1, stockReserved: 0, isPreOrder: false, gameMetadata: { id: "meta", productId: "one", platform: "PS5", edition: "STANDARD", isDigital: false } };
describe("Current product comparison", () => {
  beforeEach(() => { (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true; useCompareStore.getState().clear(); });
  it("limits selection to three ids and allows removing and replacing one", () => {
    const store = useCompareStore.getState(); for (const id of ["one", "two", "three"]) expect(store.toggle(id)).toBe("added");
    expect(store.toggle("four")).toBe("full"); expect(store.toggle("one")).toBe("removed"); expect(store.toggle("four")).toBe("added");
    expect(useCompareStore.getState().ids).toEqual(["two", "three", "four"]);
  });
  it("prunes deleted selections only on a successful catalog reconciliation", () => {
    useCompareStore.getState().toggle("one"); useCompareStore.getState().toggle("ghost");
    useCompareStore.getState().reconcile(new Set(["one"])); expect(useCompareStore.getState().ids).toEqual(["one"]);
    useCompareStore.getState().reconcile(new Set()); expect(useCompareStore.getState().ids).toEqual([]);
  });
  it("uses actual price and metadata without exposing acquisition cost", () => {
    const rows = comparisonRows([product, { ...product, id: "two", price: 59990, gameMetadata: undefined }]);
    expect(rows.find(row => row.label === "Precio de venta")?.values).toEqual(["$ 54.990 CLP", "$ 59.990 CLP"]);
    expect(rows.find(row => row.label === "Plataforma")?.values).toEqual(["PS5", "No informado"]);
    expect(JSON.stringify(rows)).not.toContain("12345"); expect(JSON.stringify(rows)).not.toContain("costPrice");
  });
  it("compares current specialized hardware and book fields", () => {
    const rows = comparisonRows([{ ...product, type: "HARDWARE", customSpecifications: { hardware: { brand: "Actual", capacityOrSpeed: "1 TB" } } }, { ...product, id: "book", type: "BOOK", customSpecifications: { book: { publisher: "Editorial real", pages: 240, language: "Español" } } }]);
    expect(rows.find(row => row.label === "Marca")?.values).toEqual(["Actual", "No informado"]);
    expect(rows.find(row => row.label === "Páginas")?.values).toEqual(["No informado", "240"]);
    expect(rows.find(row => row.label === "Editorial")?.values).toEqual(["No informado", "Editorial real"]);
  });
  it("exposes selection state and a meaningful button label", async () => {
    useCompareStore.getState().toggle("one");
    const node = document.createElement("div"); document.body.append(node); const root = createRoot(node);
    await act(async () => root.render(<CompareButton product={product}/>));
    expect(node.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
    expect(node.textContent).toContain("En comparación");
    expect(node.querySelector("button")?.getAttribute("aria-label")).toBe("Quitar de comparación: Example");
    await act(async () => root.unmount()); node.remove();
  });
});

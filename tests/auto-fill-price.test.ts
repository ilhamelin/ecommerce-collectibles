import { describe, expect, it } from "vitest";
import { normalizeAutoFillSalePrice } from "../src/lib/utils/autoFillPrice";
describe("AI sale price increments", () => {
  it("aligns suggestions to accepted CLP increments", () => {
    expect(normalizeAutoFillSalePrice(54990)).toBe(55000);
    expect(normalizeAutoFillSalePrice(54900)).toBe(54900);
    expect(normalizeAutoFillSalePrice(54920)).toBe(54900);
  });
  it("does not return invalid or negative prices", () => {
    expect(normalizeAutoFillSalePrice(NaN)).toBe(0);
    expect(normalizeAutoFillSalePrice(-100)).toBe(0);
  });
});

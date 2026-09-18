import { describe, it, expect } from "vitest";
import { generateTcgMarketPriceGuide } from "../src/lib/utils/priceTracker";
import type { ProductDomainEntity } from "../src/lib/types/domain";

describe("Real-Time TCG Market Price Guide & Valuation Tracker", () => {
  it("calculates accurate FMV and USD equivalent in CLP", () => {
    const product: Partial<ProductDomainEntity> = {
      sku: "TCG-CHARIZARD-PSA9",
      name: "Charizard Base Set PSA 9 Mint",
      type: "COLLECTIBLE",
      price: 1850000,
      collectibleMetadata: {
        id: "cert-01",
        productId: "prod-col-01",
        category: "TCG",
        condition: "MINT_9",
        gradeScore: "9",
        authenticationBody: "PSA",
      },
    };

    const guide = generateTcgMarketPriceGuide(product);

    expect(guide.estimatedFmvClp).toBe(1850000);
    expect(guide.estimatedFmvUsd).toBe(Math.round(1850000 / 950));
    expect(guide.liquidityRating).toBe("ALTA");
    expect(guide.change30dPercent).toBeGreaterThan(0);
    expect(guide.change90dPercent).toBeGreaterThan(guide.change30dPercent);
  });

  it("produces a comprehensive 12-month historical price time series", () => {
    const product: Partial<ProductDomainEntity> = {
      sku: "TCG-PIKACHU-PROMO",
      name: "Pikachu Illustrator Promo PSA 10",
      type: "COLLECTIBLE",
      price: 5000000,
    };

    const guide = generateTcgMarketPriceGuide(product);

    expect(guide.priceHistory).toHaveLength(12);
    // Values should trend upward over the 12 months
    const firstMonthPrice = guide.priceHistory[0].priceClp;
    const latestMonthPrice = guide.priceHistory[11].priceClp;
    expect(latestMonthPrice).toBeGreaterThan(firstMonthPrice);
  });

  it("builds grade comparison matrix adhering to hierarchy Raw < PSA 8 < PSA 9 < BGS 9.5 < PSA 10", () => {
    const product: Partial<ProductDomainEntity> = {
      sku: "TCG-LUGIA-PSA9",
      name: "Lugia 1st Edition Neo Genesis PSA 9",
      type: "COLLECTIBLE",
      price: 1200000,
      collectibleMetadata: {
        id: "cert-02",
        productId: "prod-col-02",
        category: "TCG",
        condition: "MINT_9",
        gradeScore: "9",
      },
    };

    const guide = generateTcgMarketPriceGuide(product);

    const raw = guide.gradesComparison.find((g) => g.grade === "RAW")!;
    const psa8 = guide.gradesComparison.find((g) => g.grade === "NEAR_MINT_8")!;
    const psa9 = guide.gradesComparison.find((g) => g.grade === "MINT_9")!;
    const psa10 = guide.gradesComparison.find((g) => g.grade === "GEM_MINT_10")!;

    expect(raw).toBeDefined();
    expect(psa8).toBeDefined();
    expect(psa9).toBeDefined();
    expect(psa10).toBeDefined();

    expect(raw.estimatedPriceClp).toBeLessThan(psa8.estimatedPriceClp);
    expect(psa8.estimatedPriceClp).toBeLessThan(psa9.estimatedPriceClp);
    expect(psa9.estimatedPriceClp).toBeLessThan(psa10.estimatedPriceClp);

    expect(psa9.isCurrentItem).toBe(true);
    expect(psa10.isCurrentItem).toBe(false);
  });

  it("includes verified recent benchmark sales records", () => {
    const product: Partial<ProductDomainEntity> = {
      sku: "TCG-CHARIZARD-PSA9",
      price: 1850000,
    };

    const guide = generateTcgMarketPriceGuide(product);

    expect(guide.recentBenchmarkSales.length).toBeGreaterThanOrEqual(3);
    for (const sale of guide.recentBenchmarkSales) {
      expect(sale.verified).toBe(true);
      expect(sale.platform).toBeDefined();
      expect(sale.priceClp).toBeGreaterThan(0);
    }
  });
});

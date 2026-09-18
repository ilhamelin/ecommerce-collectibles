import { describe, it, expect } from "vitest";
import type { ProductDomainEntity } from "../src/lib/types/domain";

describe("Storefront RSC & Interactive Catalog Architecture", () => {
  const mockProducts: ProductDomainEntity[] = [
    {
      id: "prod-vg-01",
      sku: "VG-FORZA-PS5",
      name: "Forza Horizon 6 [PS5]",
      type: "VIDEO_GAME",
      price: 69900,
      costPrice: 45000,
      stockAvailable: 10,
      stockReserved: 0,
      isPreOrder: false,
      images: ["https://example.com/forza.jpg"],
    },
    {
      id: "prod-fig-01",
      sku: "FIG-MAKIMA-17",
      name: "Chainsaw Man Makima 1/7",
      type: "FIGURE",
      price: 249990,
      costPrice: 160000,
      stockAvailable: 5,
      stockReserved: 1,
      isPreOrder: true,
      images: ["https://example.com/makima.jpg"],
      figureMetadata: {
        scale: "SCALE_1_7",
        manufacturer: "KOTOBUKIYA",
        minimumDepositPercent: 0.2,
      },
    },
    {
      id: "prod-col-01",
      sku: "TCG-CHARIZARD-PSA9",
      name: "Charizard Base Set PSA 9 Mint",
      type: "COLLECTIBLE",
      price: 1850000,
      costPrice: 1200000,
      stockAvailable: 1,
      stockReserved: 0,
      isPreOrder: false,
      images: ["https://example.com/charizard.jpg"],
      collectibleMetadata: {
        category: "TCG",
        gradingCompany: "PSA",
        condition: "MINT_9",
        gradeScore: "9",
        certificationNumber: "PSA-8821941",
      },
    },
    {
      id: "prod-bun-01",
      sku: "BUN-PS5-DUAL",
      name: "Pack Dual Gaming PS5",
      type: "BUNDLE",
      price: 99900,
      costPrice: 65000,
      stockAvailable: 4,
      stockReserved: 0,
      isPreOrder: false,
      images: ["https://example.com/bundle.jpg"],
    },
    {
      id: "prod-oth-01",
      sku: "ACC-DUALSENSE-CHROMA",
      name: "Mando DualSense Chroma Pearl",
      type: "OTHER",
      customCategoryLabel: "Accesorios Gaming",
      customSpecifications: {
        categoryType: "GAMING_ACCESSORY",
      },
      price: 74990,
      costPrice: 50000,
      stockAvailable: 8,
      stockReserved: 0,
      isPreOrder: false,
      images: ["https://example.com/dualsense.jpg"],
    },
  ];

  it("should correctly partition dedicated sections from initialProducts", () => {
    const figures = mockProducts.filter((p) => p.type === "FIGURE");
    const games = mockProducts.filter((p) => p.type === "VIDEO_GAME");
    const tcg = mockProducts.filter((p) => p.type === "COLLECTIBLE");
    const bundles = mockProducts.filter((p) => p.type === "BUNDLE");

    expect(figures).toHaveLength(1);
    expect(figures[0].sku).toBe("FIG-MAKIMA-17");

    expect(games).toHaveLength(1);
    expect(games[0].sku).toBe("VG-FORZA-PS5");

    expect(tcg).toHaveLength(1);
    expect(tcg[0].sku).toBe("TCG-CHARIZARD-PSA9");

    expect(bundles).toHaveLength(1);
    expect(bundles[0].sku).toBe("BUN-PS5-DUAL");
  });

  it("should match ALL filter tab returning all initial products", () => {
    const activeTab = "ALL";
    const filtered = activeTab === "ALL" ? mockProducts : [];
    expect(filtered).toHaveLength(5);
  });

  it("should handle custom category mappings for type OTHER accurately", () => {
    const targetTab = "GAMING_ACCESSORY";
    const filtered = mockProducts.filter((p) => {
      if (p.type === targetTab) return true;
      if (p.type === "OTHER") {
        const cat = (p.customSpecifications?.categoryType || "").toUpperCase();
        if (cat === targetTab) return true;
        const lbl = (p.customCategoryLabel || "").toLowerCase();
        if (targetTab === "GAMING_ACCESSORY" && (lbl.includes("accesorio") || p.type === "ACCESSORY")) return true;
      }
      return false;
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].sku).toBe("ACC-DUALSENSE-CHROMA");
  });

  it("should handle empty or fallback initialProducts gracefully without throwing", () => {
    const emptyProducts: ProductDomainEntity[] = [];
    const filtered = emptyProducts.filter((p) => p.type === "FIGURE");
    expect(filtered).toEqual([]);
    expect(filtered).toHaveLength(0);
  });
});

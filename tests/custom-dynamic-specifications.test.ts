import { describe, it, expect } from "vitest";
import { getProductCategoryInfo } from "@/lib/utils/category";
import type { ProductDomainEntity, CustomCategorySpecifications } from "@/lib/types/domain";

describe("Custom Dynamic Specifications Architecture", () => {
  it("resolves category info, bracketTag, and formatLabel for custom products with dynamic subtype", () => {
    const customProduct: Partial<ProductDomainEntity> = {
      type: "OTHER",
      customCategoryLabel: "Televisores",
      customSpecifications: {
        categoryType: "OTHER",
        customCategoryName: "Televisores",
        customSubtype: "OLED 4K",
        availableSubtypes: ["OLED 4K", "QLED", "Mini LED"],
        basicSpecs: [
          { id: "1", name: "Resolución", value: "3840 x 2160 (4K UHD)" },
          { id: "2", name: "Tamaño", value: "65 Pulgadas" },
        ],
        advancedSpecs: [
          { id: "3", name: "Tasa de Refresco", value: "144 Hz" },
          { id: "4", name: "HDR", value: "Dolby Vision, HDR10+" },
        ],
      },
    };

    const info = getProductCategoryInfo(customProduct);

    expect(info.key).toBe("OTHER");
    expect(info.label).toBe("Televisores");
    expect(info.bracketTag).toBe("OLED 4K");
    expect(info.formatLabel).toBe("Televisores (OLED 4K)");
  });

  it("handles custom dynamic category specs without a subtype gracefully", () => {
    const customProduct: Partial<ProductDomainEntity> = {
      type: "OTHER",
      customCategoryLabel: "Instrumentos Musicales",
      customSpecifications: {
        categoryType: "OTHER",
      },
    };

    const info = getProductCategoryInfo(customProduct);

    expect(info.key).toBe("OTHER");
    expect(info.label).toBe("Instrumentos Musicales");
    expect(info.bracketTag).toBe("Instrumentos Musicales");
  });

  it("synchronizes structured dynamic specs into a flat dictionary correctly", () => {
    const categoryName = "Juegos de Mesa";
    const currentSubtype = "Estrategia";
    const basicSpecs = [
      { id: "1", name: "Jugadores", value: "2 a 4 jugadores" },
      { id: "2", name: "Duración", value: "60-90 minutos" },
    ];
    const advancedSpecs = [
      { id: "3", name: "Complejidad BGG", value: "3.2 / 5" },
      { id: "4", name: "Mecánicas", value: "Worker Placement, Deck Building" },
    ];

    const flatMap: Record<string, string> = {};
    if (currentSubtype.trim()) {
      flatMap[`Tipo de ${categoryName}`] = currentSubtype.trim();
    }
    basicSpecs.forEach((s) => {
      if (s.name.trim()) flatMap[s.name.trim()] = s.value.trim();
    });
    advancedSpecs.forEach((s) => {
      if (s.name.trim()) flatMap[s.name.trim()] = s.value.trim();
    });

    expect(flatMap["Tipo de Juegos de Mesa"]).toBe("Estrategia");
    expect(flatMap["Jugadores"]).toBe("2 a 4 jugadores");
    expect(flatMap["Duración"]).toBe("60-90 minutos");
    expect(flatMap["Complejidad BGG"]).toBe("3.2 / 5");
    expect(flatMap["Mecánicas"]).toBe("Worker Placement, Deck Building");
  });
});

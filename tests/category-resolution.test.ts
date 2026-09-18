import { describe, it, expect } from "vitest";
import { getProductCategoryInfo } from "../src/lib/utils/category";
import type { ProductDomainEntity } from "../src/lib/types/domain";

describe("Category Resolution & Breadcrumbs Integrity", () => {
  describe("Video Games (Should NEVER be misclassified as Consolas)", () => {
    it("correctly classifies PS5 game 'Forza Horizon 6 [Juego PS5]' as Videojuegos", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "VG-FORZAH6-PS5",
        name: "Forza Horizon 6 [Juego PS5]",
        type: "VIDEO_GAME",
        gameMetadata: {
          platform: "PS5",
          gameType: "CONSOLE",
          isDigital: false,
          developer: "Playground Games",
          publisher: "Xbox Game Studios",
        },
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("VIDEO_GAME");
      expect(info.label).toBe("Videojuegos");
      expect(info.href).toBe("/catalog?category=VIDEO_GAME");
      expect(info.defaultTags).toContain("Videojuegos");
      expect(info.bracketTag).toBe("Juego PS5");
    });

    it("correctly classifies Switch game even if name contains 'Switch'", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "VG-ZELDA-TOTK",
        name: "The Legend of Zelda: Tears of the Kingdom [Switch]",
        type: "VIDEO_GAME",
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("VIDEO_GAME");
      expect(info.label).toBe("Videojuegos");
      expect(info.href).toBe("/catalog?category=VIDEO_GAME");
    });

    it("correctly classifies Xbox game even if type was initially OTHER but sku starts with VG-", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "VG-HALO-INF",
        name: "Halo Infinite [Juego Xbox Series X]",
        type: "OTHER",
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("VIDEO_GAME");
      expect(info.label).toBe("Videojuegos");
      expect(info.href).toBe("/catalog?category=VIDEO_GAME");
    });
  });

  describe("Actual Consoles (Hardware Systems)", () => {
    it("correctly classifies PlayStation 5 console as Consolas", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "CON-PS5-SLIM",
        name: "Consola PlayStation 5 Slim 1TB Digital",
        type: "CONSOLE",
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("CONSOLE");
      expect(info.label).toBe("Consolas");
      expect(info.href).toBe("/catalog?category=CONSOLE");
      expect(info.brand).toBe("Sony PlayStation");
    });

    it("correctly classifies Nintendo Switch console as Consolas", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "CON-NSW-OLED",
        name: "Consola Nintendo Switch Modelo OLED Blanco",
        type: "CONSOLE",
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("CONSOLE");
      expect(info.label).toBe("Consolas");
      expect(info.href).toBe("/catalog?category=CONSOLE");
      expect(info.brand).toBe("Nintendo");
    });
  });

  describe("Gaming Accessories (Must NOT be misclassified as Consoles)", () => {
    it("classifies PS5 DualSense Controller as Accesorios, NOT Consolas", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "ACC-DUALSENSE-W",
        name: "Mando Inalámbrico DualSense PS5 White",
        type: "OTHER",
        customCategoryLabel: "Accesorios",
        customSpecifications: {
          categoryType: "GAMING_ACCESSORY",
        },
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("GAMING_ACCESSORY");
      expect(info.label).toBe("Accesorios");
      expect(info.href).toBe("/catalog?category=GAMING_ACCESSORY");
    });

    it("classifies Switch Case as Accesorios, NOT Consolas", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "ACC-SW-CASE",
        name: "Funda Protectora y Mando Grip Nintendo Switch",
        type: "OTHER",
        customCategoryLabel: "Accesorios Gaming",
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("GAMING_ACCESSORY");
      expect(info.label).toBe("Accesorios");
      expect(info.href).toBe("/catalog?category=GAMING_ACCESSORY");
    });
  });

  describe("Figures & Merch (Must NOT be misclassified as Consoles)", () => {
    it("classifies Makima figure as Figuras", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "FIG-MAKIMA-17",
        name: "Chainsaw Man Makima Escala 1/7",
        type: "FIGURE",
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("FIGURE");
      expect(info.label).toBe("Figuras");
      expect(info.href).toBe("/catalog?category=FIGURE");
    });

    it("classifies Zelda Nendoroid as Figuras even if mentioning Zelda", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "FIG-NENDO-ZELDA",
        name: "Nendoroid Link Breath of the Wild DX",
        type: "OTHER",
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("FIGURE");
      expect(info.label).toBe("Figuras");
      expect(info.href).toBe("/catalog?category=FIGURE");
    });
  });

  describe("TCG, Rarezas, Hardware and Audio", () => {
    it("classifies Charizard card as TCG & Rarezas", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "TCG-CHARIZARD-PSA9",
        name: "Charizard Base Set Holo PSA 9",
        type: "COLLECTIBLE",
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("COLLECTIBLE");
      expect(info.label).toBe("TCG & Rarezas");
      expect(info.href).toBe("/catalog?category=COLLECTIBLE");
    });

    it("classifies RTX 4070 as Hardware", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "HW-ASUS-4070",
        name: "Tarjeta de Video ASUS ROG Strix GeForce RTX 4070 Ti",
        type: "HARDWARE",
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("HARDWARE");
      expect(info.label).toBe("Hardware");
      expect(info.href).toBe("/catalog?category=HARDWARE");
    });

    it("classifies Persona 5 Vinyl OST as Audio, NOT Consola", () => {
      const product: Partial<ProductDomainEntity> = {
        sku: "AUD-P5-VINYL",
        name: "Persona 5 Original Soundtrack 4xLP Vinilo",
        type: "OTHER",
        customCategoryLabel: "Audio / OST",
        customSpecifications: {
          categoryType: "AUDIO",
        },
      };

      const info = getProductCategoryInfo(product);

      expect(info.key).toBe("AUDIO");
      expect(info.label).toBe("Audio / OST");
      expect(info.href).toBe("/catalog?category=AUDIO");
    });
  });
});

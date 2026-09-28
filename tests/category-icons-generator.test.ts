import { describe, it, expect } from "vitest";
import {
  generateCategoryIcon,
  getCategoryIconComponent,
  AVAILABLE_SUGGESTED_ICONS,
  ICON_REGISTRY,
} from "../src/lib/constants/categoryIcons";
import { Tv, Dices, Coffee, Smartphone, Footprints, Tag, Laptop, Gamepad2 } from "lucide-react";

describe("Category Icons Registry and Generator Engine", () => {
  it("provides 16 canonical suggested icons with valid components", () => {
    expect(AVAILABLE_SUGGESTED_ICONS).toHaveLength(16);
    AVAILABLE_SUGGESTED_ICONS.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeDefined();
    });
  });

  it("resolves icons by ID and falls back to Tag for unknown or undefined keys", () => {
    expect(getCategoryIconComponent("Tv")).toBe(Tv);
    expect(getCategoryIconComponent("Dices")).toBe(Dices);
    expect(getCategoryIconComponent("Coffee")).toBe(Coffee);
    expect(getCategoryIconComponent("NonExistentIconKey")).toBe(Tag);
    expect(getCategoryIconComponent(undefined)).toBe(Tag);
  });

  it("generates an appropriate icon referencing category name 'Televisores'", () => {
    const result = generateCategoryIcon("Televisores", "Smart TVs 4K y OLED", 0);
    expect(result.id).toBe("Tv");
    expect(result.label).toBe("Televisores");
    expect(result.icon).toBe(Tv);
    expect(result.concept).toContain("Televisores");
  });

  it("generates an appropriate icon for board games ('Juegos de Mesa')", () => {
    const result = generateCategoryIcon("Juegos de Mesa", "Cartas TCG y dados", 0);
    expect(["Dices", "Puzzle", "Trophy", "Box"]).toContain(result.id);
    expect(result.label).toBe("Juegos de Mesa");
  });

  it("generates an appropriate icon for smartphones ('Celulares & Telefonía')", () => {
    const result = generateCategoryIcon("Celulares & Telefonía", "Equipos gama alta");
    expect(["Smartphone", "Tablet", "Watch"]).toContain(result.id);
  });

  it("generates an appropriate icon for footwear ('Zapatillas')", () => {
    const result = generateCategoryIcon("Zapatillas", "Sneakers y calzado deportivo");
    expect(["Footprints", "Shirt"]).toContain(result.id);
  });

  it("generates an appropriate icon for coffee ('Cafeteras & Café')", () => {
    const result = generateCategoryIcon("Cafeteras & Café");
    expect(["Coffee", "Utensils"]).toContain(result.id);
  });

  it("generates an appropriate icon for computing laptops ('Notebooks')", () => {
    const result = generateCategoryIcon("Notebooks Gamer");
    expect(["Laptop", "Cpu", "Monitor", "Gamepad2"]).toContain(result.id);
  });

  it("cycles through alternative design variations when variationIndex increments", () => {
    const firstVariation = generateCategoryIcon("Televisores", "", 0);
    const secondVariation = generateCategoryIcon("Televisores", "", 1);

    expect(firstVariation.id).toBe("Tv");
    expect(secondVariation.id).toBe("Monitor");
  });

  it("handles unknown or empty input gracefully with resilient fallback", () => {
    const emptyResult = generateCategoryIcon("");
    expect(emptyResult.id).toBe("Tag");
    expect(emptyResult.icon).toBe(Tag);

    const unknownResult = generateCategoryIcon("XyzNonExistentDomain12345");
    expect(["Sparkles", "Tag", "Box", "Layers", "Sliders"]).toContain(unknownResult.id);
    expect(unknownResult.label).toBe("XyzNonExistentDomain12345");
  });
});

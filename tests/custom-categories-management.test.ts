import { describe, it, expect } from "vitest";
import type { CustomCategoryEntity } from "@/lib/types/domain";

describe("Custom Product Categories & Technical Form Designer Suite", () => {
  it("creates a well-formed custom category entity with subtypes and dynamic field templates", () => {
    const newCategory: CustomCategoryEntity = {
      id: "cat-tv-4k",
      name: "Televisores",
      slug: "televisores",
      iconName: "Tv",
      description: "Pantallas OLED, QLED y Smart TVs",
      availableSubtypes: ["OLED 4K", "QLED", "Mini LED", "Smart TV"],
      basicSpecFields: [
        {
          id: "f-1",
          name: "Resolución",
          placeholder: "ej: 3840 x 2160 (4K UHD)",
          required: true,
        },
        {
          id: "f-2",
          name: "Tamaño",
          placeholder: "ej: 65 pulgadas",
          required: false,
        },
      ],
      advancedSpecFields: [
        {
          id: "f-3",
          name: "Tecnología de Panel",
          placeholder: "ej: QD-OLED",
          required: false,
        },
        {
          id: "f-4",
          name: "Puertos HDMI",
          placeholder: "ej: 4x HDMI 2.1 eARC",
          required: false,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    expect(newCategory.name).toBe("Televisores");
    expect(newCategory.slug).toBe("televisores");
    expect(newCategory.availableSubtypes).toHaveLength(4);
    expect(newCategory.basicSpecFields).toHaveLength(2);
    expect(newCategory.advancedSpecFields).toHaveLength(2);
    expect(newCategory.basicSpecFields[0].name).toBe("Resolución");
  });

  it("generates URL-safe slugs from raw user category names", () => {
    const rawNames = [
      { input: "Juegos de Mesa", expected: "juegos-de-mesa" },
      { input: "Cómics & Mangas Especiales!", expected: "comics-mangas-especiales" },
      { input: "Lámparas / Iluminación RGB", expected: "lamparas-iluminacion-rgb" },
    ];

    rawNames.forEach(({ input, expected }) => {
      const slug = input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      expect(slug).toBe(expected);
    });
  });

  it("seeds dynamic product specifications from a custom category template correctly", () => {
    const template: CustomCategoryEntity = {
      id: "cat-boardgames",
      name: "Juegos de Mesa",
      slug: "juegos-de-mesa",
      iconName: "Box",
      availableSubtypes: ["Estrategia", "Party Game", "Cooperativo"],
      basicSpecFields: [
        { id: "f-1", name: "Jugadores", defaultValue: "2-4 jugadores" },
        { id: "f-2", name: "Edad Mínima", defaultValue: "10+ años" },
      ],
      advancedSpecFields: [
        { id: "f-3", name: "Mecánicas", defaultValue: "Drafting, Deckbuilding" },
      ],
      createdAt: new Date().toISOString(),
    };

    const seededBasic = template.basicSpecFields.map((f) => ({
      id: f.id,
      name: f.name,
      value: f.defaultValue || "",
    }));

    const seededAdvanced = template.advancedSpecFields.map((f) => ({
      id: f.id,
      name: f.name,
      value: f.defaultValue || "",
    }));

    expect(seededBasic).toEqual([
      { id: "f-1", name: "Jugadores", value: "2-4 jugadores" },
      { id: "f-2", name: "Edad Mínima", value: "10+ años" },
    ]);
    expect(seededAdvanced).toEqual([
      { id: "f-3", name: "Mecánicas", value: "Drafting, Deckbuilding" },
    ]);
  });

  it("persists categories to disk and permanently deletes them without ghost effect", async () => {
    const {
      saveCategoryToDisk,
      readCategoriesFromDisk,
      deleteCategoryFromDisk,
    } = await import("@/lib/services/categoryDiskService");

    const testCat: CustomCategoryEntity = {
      id: "cat-tv-test-1",
      name: "Televisores Test",
      slug: "televisores-test",
      iconName: "Tv",
      availableSubtypes: ["OLED", "Mini LED"],
      basicSpecFields: [{ id: "f-1", name: "Resolución", placeholder: "4K" }],
      advancedSpecFields: [{ id: "f-2", name: "HDR", placeholder: "Dolby Vision" }],
      createdAt: new Date().toISOString(),
    };

    // Save
    saveCategoryToDisk(testCat);
    let diskList = readCategoriesFromDisk();
    expect(diskList.some((c) => c.id === "cat-tv-test-1")).toBe(true);

    // Read again to simulate page refresh
    diskList = readCategoriesFromDisk();
    const retrieved = diskList.find((c) => c.id === "cat-tv-test-1");
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("Televisores Test");

    // Delete
    const deleted = deleteCategoryFromDisk("cat-tv-test-1");
    expect(deleted).toBe(true);

    // Verify it does not reappear (no ghost effect)
    diskList = readCategoriesFromDisk();
    expect(diskList.some((c) => c.id === "cat-tv-test-1")).toBe(false);
  });

  it("handles deleting and restoring pre-existing native categories", async () => {
    const {
      deleteNativeCategoryOnDisk,
      readDeletedNativeCategoriesFromDisk,
      restoreNativeCategoryOnDisk,
    } = await import("@/lib/services/categoryDiskService");

    const nativeId = "FIGURE";

    // Delete native category
    const deleted = deleteNativeCategoryOnDisk(nativeId);
    expect(deleted).toBe(true);

    let deletedList = readDeletedNativeCategoriesFromDisk();
    expect(deletedList).toContain("FIGURE");

    // Re-delete same category should be idempotent
    expect(deleteNativeCategoryOnDisk(nativeId)).toBe(false);

    // Restore native category
    const restored = restoreNativeCategoryOnDisk(nativeId);
    expect(restored).toBe(true);

    deletedList = readDeletedNativeCategoriesFromDisk();
    expect(deletedList).not.toContain("FIGURE");
  });
});

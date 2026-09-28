import { describe, it, expect } from "vitest";
import { suggestCategorySpecifications } from "@/lib/constants/categorySpecificationSuggestions";

describe("Category Specification AI Suggestions and Reordering Engine", () => {
  it("suggests comprehensive basic specs, advanced specs, and subtypes for 'Televisores'", () => {
    const result = suggestCategorySpecifications("Televisores", "Smart TVs y pantallas");

    expect(result.subtypes.length).toBeGreaterThan(0);
    expect(result.subtypes).toContain("OLED 4K");

    const basicNames = result.basicFields.map((f) => f.name);
    expect(basicNames).toContain("Resolución");
    expect(basicNames).toContain("Tamaño de Pantalla");

    const advancedNames = result.advancedFields.map((f) => f.name);
    expect(advancedNames).toContain("Tecnología de Panel");
    expect(advancedNames).toContain("Formatos HDR");
  });

  it("suggests appropriate fields for 'Juegos de Mesa'", () => {
    const result = suggestCategorySpecifications("Juegos de Mesa", "Estrategia y cartas TCG");

    const basicNames = result.basicFields.map((f) => f.name);
    expect(basicNames).toContain("Número de Jugadores");
    expect(basicNames).toContain("Tiempo Estimado de Partida");

    const advancedNames = result.advancedFields.map((f) => f.name);
    expect(advancedNames).toContain("Mecánicas Principales");
  });

  it("suggests appropriate fields for 'Zapatillas'", () => {
    const result = suggestCategorySpecifications("Zapatillas Urbanas");

    const basicNames = result.basicFields.map((f) => f.name);
    expect(basicNames).toContain("Talla / Número");
    expect(basicNames).toContain("Material Principal del Exterior");
  });

  it("provides resilient fallback specifications for unknown or new categories", () => {
    const result = suggestCategorySpecifications("Equipos Astronómicos 9999");

    expect(result.basicFields.length).toBeGreaterThanOrEqual(2);
    expect(result.advancedFields.length).toBeGreaterThanOrEqual(2);
    expect(result.subtypes.length).toBeGreaterThan(0);
    expect(result.basicFields[0].name).toBeTruthy();
  });

  it("reorders attributes accurately via splice move algorithm simulating drag-and-drop", () => {
    const fields = [
      { id: "1", name: "Resolución" },
      { id: "2", name: "Tamaño" },
      { id: "3", name: "Tasa de Refresco" },
    ];

    // Move index 2 ("Tasa de Refresco") to index 0 (drag up)
    const reorderedUp = [...fields];
    const [movedUp] = reorderedUp.splice(2, 1);
    reorderedUp.splice(0, 0, movedUp);

    expect(reorderedUp.map((f) => f.name)).toEqual([
      "Tasa de Refresco",
      "Resolución",
      "Tamaño",
    ]);

    // Move index 0 ("Tasa de Refresco") to index 1 (drag down)
    const reorderedDown = [...reorderedUp];
    const [movedDown] = reorderedDown.splice(0, 1);
    reorderedDown.splice(1, 0, movedDown);

    expect(reorderedDown.map((f) => f.name)).toEqual([
      "Resolución",
      "Tasa de Refresco",
      "Tamaño",
    ]);
  });
});

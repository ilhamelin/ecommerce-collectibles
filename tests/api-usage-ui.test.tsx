import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ApiUsagePage from "../src/app/admin/api-usage/page";
describe("API consumption initial state", () => {
  it("announces loading without presenting unknown metrics as zero", () => {
    const html = renderToStaticMarkup(<ApiUsagePage />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Cargando métricas");
    expect(html).not.toContain("Datos cargados");
    expect(html).not.toContain("Límites de Frecuencia");
  });
});

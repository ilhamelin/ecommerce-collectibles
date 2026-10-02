import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AutoFillConsole } from "../src/components/admin/AutoFillConsole";

describe("Auto-fill request console", () => {
  it("shows an idle console without inventing completed work", () => {
    const html = renderToStaticMarkup(<AutoFillConsole run={null} />);
    expect(html).toContain("Listo para comenzar");
    expect(html).not.toContain("Datos aplicados");
  });
  it("announces waiting without claiming model steps", () => {
    const html = renderToStaticMarkup(<AutoFillConsole run={{ source: "Figura", startedAt: 1000, stage: "requesting" }} />);
    expect(html).toContain('role="log"');
    expect(html).toContain("Esperando respuesta del servidor");
    expect(html).not.toContain("Datos aplicados");
  });
  it("distinguishes fallback from Gemini and shows measured duration", () => {
    const html = renderToStaticMarkup(<AutoFillConsole run={{ source: "Figura", startedAt: 1000, finishedAt: 3500, stage: "success", engine: "SMART_KNOWLEDGE_ENGINE", fields: ["name", "description"] }} />);
    expect(html).toContain("sin generación de Gemini");
    expect(html).toContain("2 grupos de datos");
    expect(html).toContain("2.5 s");
  });
  it("escapes input and keeps failure visible", () => {
    const html = renderToStaticMarkup(<AutoFillConsole run={{ source: "<script>bad</script>", startedAt: 0, finishedAt: 1000, stage: "error", error: "Sin conexión" }} />);
    expect(html).toContain("Sin conexión");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("Datos aplicados");
  });
});

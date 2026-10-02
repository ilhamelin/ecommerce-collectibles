import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VisualSearchConsole } from "../src/components/catalog/VisualSearchConsole";

describe("Photo search terminal", () => {
  it("starts idle without claiming an identification", () => {
    const html = renderToStaticMarkup(<VisualSearchConsole run={null} />);
    expect(html).toContain("OMNI / VISION TERMINAL");
    expect(html).toContain("Esperando imagen");
    expect(html).not.toContain("Búsqueda completada");
  });
  it("announces observed events and the current stage", () => {
    const html = renderToStaticMarkup(<VisualSearchConsole run={{ source: "figura.png", startedAt: 1000, stage: "model", events: ["Catálogo consultado: 8 productos.", "Consultando gemini-test."] }} />);
    expect(html).toContain('role="log"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Consultando gemini-test.");
    expect(html).not.toContain("[identificado]");
  });
  it("escapes image names and keeps failures visible", () => {
    const html = renderToStaticMarkup(<VisualSearchConsole run={{ source: "<script>.png", startedAt: 1000, finishedAt: 3500, stage: "error", events: [], error: "Sin conexión" }} />);
    expect(html).not.toContain("<script>");
    expect(html).toContain("Sin conexión");
    expect(html).toContain("2.5 s");
    expect(html).not.toContain("Búsqueda completada");
  });
  it("distinguishes cancellation from success", () => {
    const html = renderToStaticMarkup(<VisualSearchConsole run={{ source: "imagen.png", startedAt: 0, finishedAt: 500, stage: "cancelled", events: [] }} />);
    expect(html).toContain("Búsqueda cancelada");
    expect(html).not.toContain("[identificado]");
  });
});
